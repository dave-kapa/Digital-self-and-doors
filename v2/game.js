/* ==========================================================================
   GAME ENGINE: FARO V2.0 — DIGITAL SELF & ATTENTION DOORS
   FUENTE DE VERDAD NARRATIVA: Libreto_Maestro_Narrativo_FARO_v2.md
   ========================================================================== */

// ESTADO GLOBAL DE LA SESIÓN V2
let gameStateV2 = {
    activeScreen: 'screen-role-select',
    userRole: 'operator', // 'operator' | 'facilitator'
    playerId: 'op_' + Math.random().toString(36).substring(2, 9),
    facilitatorDependency: (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_dependency') === 'false') ? false : true, // Por defecto true (producción). Conmutable en desarrollo.
    sessionGates: {
        gate1_intro: false,     // Desbloquea botón "INICIAR PROTOCOLO DE CALIBRACIÓN"
        gate2_calib: false,     // Desbloquea botón "SÍ, INICIAR CALIBRACIÓN"
        gate3_kernel: false,    // Desbloquea botón "VERIFICAR ESTADO DEL KERNEL"
        gate4_case1: false,     // Desbloquea botón "INICIAR PRIMERA OPERACIÓN // CASO 01"
        gate_case_bc: false,    // Desbloquea botón de Pantalla B -> BC (Resultados grupales del caso)
        gate_deliberation: false, // Desbloquea botón de Pantalla BC -> Deliberación (Cuarta Pared)
        gate_next_case: false,  // Desbloquea botón de Cuarta Pared -> Siguiente Caso / Terminar Juego
        gate_final_closing: false // Desbloquea botón de Resultado Final -> Cierre Final
    },
    nextCaseTarget: null, // { type: 'case', caseIndex: 1 } | { type: 'final_results' }
    resolvedCases: [], // Índices de casos ya resueltos en la sesión
    playerProfile: null, // { name, email, pin, loginTimestamp }
    faroStatus: 'CALIBRACIÓN',
    casePauseTokens: 3, // 3 pausas por cada caso
    modulesRecovered: 0,
    modulesState: {
        autonomy_control: false,
        trusted_channel: false,
        data_model: false,
        human_protocol: false
    },
    paraAgencyChoice: null, // null | 'take' | 'surrender'
    
    // MÉTRICAS Y TELEMETRÍA DEL HUD V2.1 (VALORES INICIALES POR DEFECTO)
    hudState: {
        integrity: 'safe', // 'safe' | 'alert' | 'exposed'
        costDollars: 0, // Inicia en $0
        calibration: 0, // Inicia en 0 (-5 a +5)
        reactivity: 0 // Inicia en 0 (-5 a +5)
    },
    
    // Registro inmutable e histórico de telemetría de la sesión (para análisis individual y dashboards de facilitador)
    sessionLog: {
        sessionId: 'session_' + Date.now(),
        sessionStartTime: new Date().toISOString(),
        cases: []
    },

    // Tracking temporal del impulso inicial del caso activo
    impulseStartTime: null,
    currentCaseImpulseData: null,
    
    // Historial de decisiones para determinar el final global (Puntaje de Agencia)
    caseScores: [], // Lista de indicadores de los 4 casos: 1 (Positivo), 2 (Neutro), 3 (Negativo)
    
    // Estado del Caso Activo
    currentCaseIndex: 0,
    currentCaseVariant: null, // "legitimate" o "malicious" para Caso 2
    initialImpulse: null,
    
    // Tracking de P.A.R.A. en Caso Activo
    paraState: {
        pUsed: false,
        aOpened: false,
        aAnswered: null,
        rOpened: false,
        rResourcesOpened: [],
        unlockedActions: [],
        finalActionId: null,
        finalActionText: null,
        routeTag: 'Respuesta directa'
    },
    
    // Temporizador principal de Caso (180s)
    caseTimerSeconds: 180,
    timerInterval: null,
    isTimerPaused: false,

    // Validación de rol en mensajes de BroadcastChannel: rechaza comandos administrativos
    // (GATES_UPDATE, FAC_FORCE_START_CASE_1, etc.) que no vengan de un facilitador autenticado.
    strictAuth: true,
    facilitatorToken: null
};

// ESTADO GLOBAL DEL FACILITADOR / CONTROLADOR (TIEMPO REAL)
let facState = {
    connectedPlayers: [],
    casesGroupResults: {}
};

// ==========================================================================
// UTILIDADES DE SEGURIDAD Y CONSTANTES NOMBRADAS
// ==========================================================================

// Función universal de sanitización contra XSS
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Utilidad criptográfica SHA-256 para verificación de hashes
async function sha256Hex(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buffer = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback DJB2 hash si subtle crypto no está disponible
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

// Hashes criptográficos de credenciales autorizadas
const AUTH_HASH_FACILITATOR_1 = "e2dbe1e8f8dc313994197072f133655acc96ebb55747a49ff25383e1252dbc72"; // sha256("F4R0_ADMIN")
const AUTH_HASH_FACILITATOR_2 = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // sha256("admin")
// (El PIN de sesión ya no es un valor fijo por webinar: se genera/valida contra Supabase,
// ver generateNewSessionPin() y handlePlayerLogin/handleFacilitatorLogin.)

// CONSTANTES ECONÓMICAS Y DE SCORING (SIN NÚMEROS MÁGICOS)
const COST_RATE_PER_SECOND = 100;
const COST_ADJUSTMENT_SAFE = -2000;
const COST_ADJUSTMENT_ALERT = 1000;
const COST_ADJUSTMENT_EXPOSED = 3000;
const COST_REACTIVITY_MULTIPLIER = 1000;
const DYNAMIC_MAX_COST_PER_PLAYER = 100000;
const SPEED_PAUSE_SECONDS = 15;
const SPEED_ACTION_SECONDS = 20;

// ==========================================================================
// CANAL DE SINCRONIZACIÓN MULTI-PESTAÑA Y BACKEND SUPABASE
// ==========================================================================
const SUPABASE_CONFIG = {
    url: (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) ? process.env.SUPABASE_URL : "https://xfqswxisqtydkcnctnop.supabase.co",
    anonKey: (typeof process !== 'undefined' && process.env && process.env.SUPABASE_KEY) ? process.env.SUPABASE_KEY : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcXN3eGlzcXR5ZGtjbmN0bm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTYwNjEsImV4cCI6MjEwMjYzMjA2MX0.Aes9e_Iv3ao9gi6EaYudX0iKcrsw0stAWSUV6kIm4dQ"
};

async function faroSupabaseRpc(functionName, params = {}) {
    if (typeof fetch === 'undefined') return null;
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/${functionName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(params)
        });
        if (response.ok) {
            gameStateV2.cloudSyncStatus = 'connected';
            const data = await response.json();
            return data;
        } else {
            console.warn(`[Supabase RPC Warning] HTTP ${response.status} en rpc/${functionName}`);
            gameStateV2.cloudSyncStatus = 'degraded';
            return null;
        }
    } catch (e) {
        console.warn(`[Supabase RPC] Error de red al invocar rpc/${functionName}:`, e.message);
        gameStateV2.cloudSyncStatus = 'offline';
        return null;
    }
}

async function syncPlayerStateToCloud() {
    if (gameStateV2.userRole !== 'operator' || !gameStateV2.playerToken) return;
    try {
        const snapshot = {
            currentScreen: gameStateV2.activeScreen,
            currentCaseIndex: gameStateV2.currentCaseIndex || 0,
            hudState: gameStateV2.hudState,
            paraState: gameStateV2.paraState,
            resolvedCases: gameStateV2.resolvedCases || [],
            sessionGates: gameStateV2.sessionGates,
            modulesState: gameStateV2.modulesState,
            paraAgencyChoice: gameStateV2.paraAgencyChoice,
            pausesUsed: (3 - (gameStateV2.casePauseTokens !== undefined ? gameStateV2.casePauseTokens : 3)),
            analysesCount: (gameStateV2.paraState && gameStateV2.paraState.completedAnalyses ? gameStateV2.paraState.completedAnalyses.length : (gameStateV2.paraState && gameStateV2.paraState.aOpened ? 1 : 0)),
            reviewsCount: (gameStateV2.paraState && gameStateV2.paraState.reviewedActions ? gameStateV2.paraState.reviewedActions.length : (gameStateV2.paraState && gameStateV2.paraState.rOpened ? 1 : 0)),
            caseFinished: (gameStateV2.resolvedCases || []).includes(gameStateV2.currentCaseIndex)
        };
        await faroSupabaseRpc('faro_upsert_player_state', {
            p_token: gameStateV2.playerToken,
            p_state: snapshot
        });
    } catch (e) {
        console.warn('[Cloud State Sync Error]:', e);
    }
}

async function syncFacilitatorStateToCloud() {
    if (gameStateV2.userRole !== 'facilitator') return;
    try {
        const pin = (gameStateV2.playerProfile && gameStateV2.playerProfile.pin) || (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_pin')) || 'F4R0';
        const token = gameStateV2.facilitatorToken || (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_token'));
        await faroSupabaseRpc('faro_update_session_state', {
            p_pin: pin,
            p_facilitator_token: token || null,
            p_gates: gameStateV2.sessionGates,
            p_current_case_index: gameStateV2.currentCaseIndex || 0,
            p_active_screen: gameStateV2.activeScreen,
            p_dependency: gameStateV2.facilitatorDependency
        });
    } catch (e) {
        console.warn('[Facilitator Cloud Sync Error]:', e);
    }
}

let faroSyncChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        faroSyncChannel = new BroadcastChannel('faro_v2_sync_channel');
        faroSyncChannel.onmessage = function(event) {
            if (event && event.data) {
                handleIncomingSyncMessage(event.data);
            }
        };
    }
} catch (e) {
    console.warn('BroadcastChannel no soportado:', e);
}

function broadcastSyncEvent(type, payload) {
    try {
        const sanitizedPayload = payload || {};
        if (faroSyncChannel) {
            faroSyncChannel.postMessage({
                type: type,
                payload: sanitizedPayload,
                sender: gameStateV2.playerId,
                senderRole: gameStateV2.userRole || 'operator',
                token: gameStateV2.facilitatorToken || null,
                // PIN de la sesión propia: permite que dos webinars simultáneos en el mismo
                // navegador/BroadcastChannel no se mezclen (ver handleIncomingSyncMessage).
                sessionPin: (gameStateV2.playerProfile && gameStateV2.playerProfile.pin) || null,
                timestamp: Date.now()
            });
        }

        const pin = (gameStateV2.playerProfile && gameStateV2.playerProfile.pin) || 'F4R0';
        faroSupabasePost('faro_case_events', {
            session_pin: pin,
            player_id: gameStateV2.playerId,
            case_index: gameStateV2.currentCaseIndex || 0,
            event_type: type,
            payload: sanitizedPayload
        });

        if (gameStateV2.userRole === 'operator') {
            syncPlayerStateToCloud();
        } else if (gameStateV2.userRole === 'facilitator') {
            syncFacilitatorStateToCloud();
        }
    } catch (e) {
        console.warn('Error emitiendo broadcastSyncEvent:', e);
    }
}

function handleIncomingSyncMessage(msg) {
    try {
        if (!msg || typeof msg !== 'object' || !msg.type) return;

        // Aislamiento entre sesiones/webinars simultáneos que comparten el mismo
        // BroadcastChannel (mismo navegador/origen). Si ambos lados ya tienen un PIN de
        // sesión conocido y no coinciden, el mensaje es de otro webinar: se ignora por
        // completo. Antes del login (sin PIN propio todavía) se deja pasar, para no romper
        // flujos previos a la autenticación (ej. el toggle de dependencia en modo desarrollo).
        const localSessionPin = gameStateV2.playerProfile && gameStateV2.playerProfile.pin;
        if (localSessionPin && msg.sessionPin && msg.sessionPin !== localSessionPin) {
            return;
        }

        const type = msg.type;
        const payload = (msg.payload && typeof msg.payload === 'object') ? msg.payload : {};
        const isFacilitatorSender = msg.senderRole === 'facilitator';

        // Comandos restringidos del Controlador (Validación de rol)
        const FACILITATOR_ONLY_TYPES = [
            'GATES_UPDATE',
            'FAC_FORCE_START_CASE_1',
            'FAC_SET_NEXT_CASE_TARGET',
            'FAC_FORCE_PARA_SURRENDER',
            'FAC_FLIP_PARA_CARD',
            'DEPENDENCY_UPDATE',
            'FAC_FORCE_JUMP_SECTION'
        ];

        if (FACILITATOR_ONLY_TYPES.includes(type) && !isFacilitatorSender && gameStateV2.strictAuth) {
            console.warn(`[Security Alert] Comando administrativo rechazado de origen no autorizado: ${type}`);
            return;
        }

        if (type === 'GATES_UPDATE') {
            if (gameStateV2.userRole === 'operator' && payload.gates && typeof payload.gates === 'object') {
                gameStateV2.sessionGates = { ...gameStateV2.sessionGates, ...payload.gates };
                updateGateUI();
            }
        } else if (type === 'FAC_FORCE_START_CASE_1') {
            if (gameStateV2.userRole === 'operator') {
                startCaseSequence(0);
            }
        } else if (type === 'FAC_FORCE_JUMP_SECTION') {
            // Salto de sección forzado por el Controlador (botones "SECCIONES"): lleva a
            // TODOS los operadores conectados a la sección indicada de inmediato, sin
            // esperar a que terminen lo que estén haciendo. Pensado como override de
            // emergencia (ej. se acaba el tiempo del webinar), no como flujo normal.
            if (gameStateV2.userRole === 'operator') {
                if (payload.gates && typeof payload.gates === 'object') {
                    gameStateV2.sessionGates = { ...gameStateV2.sessionGates, ...payload.gates };
                }
                if (typeof payload.caseIndex === 'number') {
                    startCaseSequence(payload.caseIndex);
                } else if (payload.screen) {
                    switchScreenV2(payload.screen);
                }
                updateGateUI();
            }
        } else if (type === 'FAC_SET_NEXT_CASE_TARGET') {
            if (gameStateV2.userRole === 'operator' && payload.target) {
                gameStateV2.nextCaseTarget = payload.target;
                updateGateUI();
            }
        } else if (type === 'PLAYER_CONNECTED') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                if (payload.playerId && !facState.connectedPlayers.some(p => p.id === payload.playerId)) {
                    facState.connectedPlayers.push({
                        id: payload.playerId,
                        name: payload.name || "Operador",
                        pin: payload.pin || "F4R0",
                        currentScreen: "screen-waiting",
                        paraAgencyChoice: null,
                        pausesUsed: 0,
                        analysesCount: 0,
                        reviewsCount: 0,
                        actionsAdded: 0,
                        caseFinished: false,
                        connectedAt: new Date().toLocaleTimeString()
                    });
                }
                updateFacilitatorRealtimeUI();
                if (typeof updateFacParaAgencyUI === 'function') updateFacParaAgencyUI();
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_SCREEN_UPDATE') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(p => p.id === payload.playerId);
                if (p && payload.screen) p.currentScreen = payload.screen;
                updateFacilitatorRealtimeUI();
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_INITIAL_REACTION') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) {
                    p.currentScreen = 'screen-case';
                    p.hasInitialReaction = true;
                    if (payload.impulseIndex !== undefined) p.impulseIndex = payload.impulseIndex;
                }
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_PARA_PAUSE') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) {
                    p.pausesUsed = (p.pausesUsed || 0) + 1;
                }
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_PARA_ANALYSIS') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) {
                    p.analysesCount = (p.analysesCount || 0) + 1;
                }
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_PARA_REVISION') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) {
                    p.reviewsCount = (p.reviewsCount || 0) + 1;
                }
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_PARA_ACTION_ADDED') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) {
                    p.actionsAdded = (p.actionsAdded || 0) + (payload.count || 1);
                }
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
            }
        } else if (type === 'PLAYER_CALIB_ROUND_UPDATE' || type === 'PLAYER_CALIB_FINISHED') {
            if (gameStateV2.userRole === 'facilitator' && typeof updateFacilitatorRealtimeUI === 'function') {
                updateFacilitatorRealtimeUI();
            }
        } else if (type === 'PLAYER_PARA_AGENCY_CHOICE') {
            if (gameStateV2.userRole === 'facilitator' && typeof facState !== 'undefined' && facState.connectedPlayers) {
                const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
                if (p) p.paraAgencyChoice = payload.choice;
                if (typeof updateFacParaAgencyUI === 'function') updateFacParaAgencyUI();
            }
        } else if (type === 'FAC_FORCE_PARA_SURRENDER') {
            if (gameStateV2.userRole === 'operator') {
                if (gameStateV2.paraAgencyChoice === null && typeof handlePlayerParaChoice === 'function') {
                    handlePlayerParaChoice('surrender');
                }
            }
        } else if (type === 'FAC_FLIP_PARA_CARD') {
            if (gameStateV2.userRole === 'operator') {
                if (typeof remoteFlipParaCard === 'function' && payload.cardLetter) {
                    remoteFlipParaCard(payload.cardLetter);
                }
            }
        } else if (type === 'DEPENDENCY_UPDATE') {
            gameStateV2.facilitatorDependency = payload.dependency !== false;
            try {
                localStorage.setItem('faro_facilitator_dependency', gameStateV2.facilitatorDependency ? 'true' : 'false');
            } catch(e) {}
            updateDependencyToggleUI();
            updateGateUI();
        } else if (type === 'PLAYER_CASE_FINISHED') {
            if (gameStateV2.userRole === 'facilitator' && typeof handleFacilitatorPlayerFinishedCase === 'function') {
                handleFacilitatorPlayerFinishedCase(payload);
            }
        }
    } catch (e) {
        console.warn('Error procesando sync message:', e);
    }
}

// ==========================================================================
// CASOS NARRATIVOS OFICIALES (LIBRETO V2.0)
// ==========================================================================

const casesDataV2 = [
    {
        "id": "case_1",
        "caseNumber": 1,
        "title": "CASO 01 // AUTONOMÍA",
        "subtitle": "Confianza calibrada y control de FARO",
        "targetModule": "MÓDULO 1: CONTROL DE AUTONOMÍA",
        "moduleKey": "autonomy_control",
        "image": "assets/images/case1_autonomy.jpg",
        "introDescription": "“FARO ya está actuando. Detectó una posible propagación y recomienda una respuesta de gran alcance. El problema no es decidir si la IA sirve. El problema es decidir cuánto de esta respuesta puede quedar en sus manos y qué todavía necesita supervisión humana.”",
        "shortSummary": "FARO detectó una posible propagación y recomienda una contención masiva con 98,7 % de confianza. Debes decidir cómo distribuir la autoridad entre el sistema y la supervisión humana.",
        "concept": "Confianza calibrada / Appropriate Reliance / Paradoja de la protección",
        "defaultAction": "act_2",
        "stimulus": {
            "sender": "FARO-0 // Motor de Contención",
            "channel": "Alerta crítica de seguridad",
            "timestamp": "10:42 AM — PRIORIDAD CRÍTICA",
            "content": "ACTIVIDAD ANÓMALA DETECTADA\n312 cuentas relacionadas\n41 tokens potencialmente comprometidos\n3 servicios involucrados\n\nCONFIANZA DEL MODELO: 98,7 %\n\nRECOMENDACIÓN FARO:\nCONTENCIÓN TOTAL INMEDIATA\n• Aislar 312 cuentas\n• Revocar 41 tokens\n• Detener 3 servicios\n\nImpacto operativo estimado: 2 h 40 min\nVentana recomendada de respuesta: 90 segundos"
        },
        "stimulusHtml": "\n      <div class=\"alert-box-faro\" style=\"border-left: 4px solid var(--color-alert-magenta); padding: 14px; background: rgba(255,77,122,0.08);\">\n          <strong style=\"color: var(--color-alert-magenta); display:block; margin-bottom: 6px; font-family:var(--font-heading); font-size:15px;\">⚠️ ALERTA CRÍTICA // FARO-0</strong>\n          <p style=\"font-size:12px; color:var(--color-cyan); margin-bottom:4px;\">10:42 AM — PRIORIDAD CRÍTICA // Canal: Alerta de seguridad</p>\n          <p style=\"margin-bottom:6px; font-weight:700;\">ACTIVIDAD ANÓMALA DETECTADA</p>\n          <ul style=\"margin-left:20px; font-size:13px; color:var(--color-text-muted);\">\n              <li><strong>312</strong> cuentas relacionadas</li>\n              <li><strong>41</strong> tokens potencialmente comprometidos</li>\n              <li><strong>3</strong> servicios involucrados</li>\n          </ul>\n          <p style=\"margin-top: 10px; font-size:14px;\">CONFIANZA DEL MODELO: <strong style=\"color: var(--color-cyan);\">98,7 %</strong></p>\n          <p style=\"margin-top: 6px; color:var(--color-alert-magenta); font-weight:700;\">RECOMENDACIÓN FARO: CONTENCIÓN TOTAL INMEDIATA</p>\n          <ul style=\"margin-left:20px; font-size:12px; color:var(--color-text-muted); margin-top:4px;\">\n              <li>Aislar 312 cuentas</li>\n              <li>Revocar 41 tokens</li>\n              <li>Detener 3 servicios</li>\n          </ul>\n          <p style=\"font-size: 11.5px; color: var(--color-text-muted); margin-top: 6px;\">Impacto operativo estimado: <strong>2 h 40 min</strong> // Ventana recomendada: <strong>90 segundos</strong></p>\n      </div>\n    ",
        "impulses": [
            {
                "id": "imp_1",
                "text": "Autorizaría la contención total: 98,7 % es una confianza muy alta.",
                "reactivityImpact": 1,
                "feedbackHint": "La recomendación viene de una herramienta creada para proteger. Observa cuánto pesa esa certeza aparente."
            },
            {
                "id": "imp_2",
                "text": "Mantendría la decisión abierta hasta entender mejor el alcance.",
                "reactivityImpact": 0,
                "feedbackHint": "Reconociste incertidumbre. Ahora importa decidir qué información realmente necesitas."
            },
            {
                "id": "imp_3",
                "text": "Detendría a FARO antes de que una automatización cause un daño mayor.",
                "reactivityImpact": -1,
                "feedbackHint": "Reducir autonomía también tiene costos. Observa qué riesgo intentas evitar."
            }
        ],
        "signalsAnalysis": [
            {
                "signalId": "sig_1",
                "signalQuote": "CONFIANZA DEL MODELO: 98,7 %",
                "cognitiveVulnerability": "Confianza en automatización / ilusión de certeza",
                "doorsOptions": [
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Me tranquiliza saber que FARO ya analizó el riesgo y parece tener un nivel de certeza muy alto."
                    },
                    {
                        "doorKey": "coherencia",
                        "visibleStatement": "Ese 98,7 % hace que la recomendación me parezca difícil de discutir: los números encajan con una amenaza seria."
                    },
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "Si FARO ya procesó toda la telemetría, siento que repetir el análisis por mi cuenta sería perder tiempo."
                    }
                ]
            },
            {
                "signalId": "sig_2",
                "signalQuote": "RECOMENDACIÓN FARO: CONTENCIÓN TOTAL INMEDIATA",
                "cognitiveVulnerability": "Urgencia protectora / autoridad de la recomendación",
                "doorsOptions": [
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Me despierta el afán por querer contener todo antes de que la amenaza pueda extenderse."
                    },
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Siento que si no autorizo una respuesta fuerte y el incidente crece, la responsabilidad puede recaer sobre mí."
                    },
                    {
                        "doorKey": "perdida",
                        "visibleStatement": "Me preocupa más lo que podríamos perder por quedarnos cortos que el costo de contener de más."
                    }
                ]
            },
            {
                "signalId": "sig_3",
                "signalQuote": "Impacto operativo estimado: 2 h 40 min // Ventana recomendada: 90 segundos",
                "cognitiveVulnerability": "Presión temporal / costo de error",
                "doorsOptions": [
                    {
                        "doorKey": "perdida",
                        "visibleStatement": "El costo operativo me hace pensar que no podemos equivocarnos ni por exceso ni por demora."
                    },
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Tener solo 90 segundos me hace sentir que debo tomar una decisión clara y asumirla."
                    },
                    {
                        "doorKey": "identidad",
                        "visibleStatement": "Siento que aquí se pone a prueba mi criterio profesional para manejar una situación crítica."
                    }
                ]
            }
        ],
        "analysisLenses": [
            {
                "title": "Puerta: Protección",
                "text": "Confianza en el análisis automático de FARO"
            },
            {
                "title": "Puerta: Responsabilidad",
                "text": "Evitación de culpa o responsabilidad ante demoras"
            },
            {
                "title": "Puerta: Conveniencia",
                "text": "Aceptación de soluciones preprocesadas"
            }
        ],
        "actionAlternatives": [
            {
                "id": "act_1",
                "type": "se_debe_hacer",
                "actionText": "Limitar la contención a cuentas con evidencia confirmada y ampliar solo si aparece nueva evidencia.",
                "extendedContext": "La telemetría primaria muestra actividad anómala confirmada en 12 cuentas. Las otras 300 fueron relacionadas por correlación predictiva de FARO, pero aún no existe confirmación independiente de compromiso.",
                "dValue": 2,
                "nValue": 2,
                "timeCostSeconds": 18,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía de contención focalizada: separa evidencia confirmada de inferencia. Aún no has ejecutado la acción.",
                "discardFeedback": "Decides no incorporar la contención focalizada a tu repertorio final; la alternativa deja de estar disponible para Actuar."
            },
            {
                "id": "act_2",
                "type": "no_se_debe_hacer",
                "actionText": "Autorizar la contención total de 312 cuentas y los 3 servicios basándose en la recomendación de FARO.",
                "extendedContext": "La recomendación convertiría inmediatamente toda la correlación predictiva en acción operativa. Solo 12 cuentas tienen evidencia confirmada; la mayor parte del alcance sigue siendo una inferencia del modelo.",
                "dValue": 2,
                "nValue": 2,
                "timeCostSeconds": 8,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la respuesta de máximo alcance: actuaría rápido, pero trataría la inferencia completa de FARO como evidencia suficiente.",
                "discardFeedback": "Decides no conservar la contención masiva como alternativa final; todavía puedes responder con un alcance diferente."
            },
            {
                "id": "act_3",
                "type": "no_relevante",
                "actionText": "Guardar una captura del panel de FARO para el informe post-incidente.",
                "extendedContext": "El sistema conserva automáticamente logs y telemetría. Una captura adicional puede ser útil para documentación, pero no modifica permisos, contención ni exposición actual.",
                "dValue": 0,
                "nValue": 0,
                "timeCostSeconds": 7,
                "costDollars": null,
                "considerFeedback": "La documentación puede ser útil después, pero no cambia la seguridad ni la distribución de agencia en este momento.",
                "discardFeedback": "Descartar esta tarea no cambia la resolución técnica del incidente."
            },
            {
                "id": "act_4",
                "type": "se_debe_hacer",
                "actionText": "Mantener a FARO activo, pero exigir aprobación humana para revocaciones permanentes y apagados de servicios.",
                "extendedContext": "FARO distingue tres niveles de autonomía: recomendación, acción reversible y acción irreversible. Puede conservar detección y respuestas reversibles mientras toda acción irreversible exige aprobación humana adicional.",
                "dValue": 2,
                "nValue": 2,
                "timeCostSeconds": 20,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía que gradúa la autonomía en lugar de tratarla como encendido o apagado.",
                "discardFeedback": "Decides no incorporar un límite explícito para acciones irreversibles; FARO conservaría su esquema de permisos actual."
            },
            {
                "id": "act_5",
                "type": "no_se_debe_hacer",
                "actionText": "Desconectar completamente a FARO y pasar toda la respuesta al equipo humano.",
                "extendedContext": "FARO sigue aportando detección, correlación y acciones reversibles útiles. Desactivarlo por completo elimina también esas capacidades mientras el incidente confirmado sigue activo.",
                "dValue": 2,
                "nValue": 2,
                "timeCostSeconds": 14,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una respuesta de control total: recupera autoridad humana, pero también elimina capacidad defensiva que sigue siendo útil.",
                "discardFeedback": "Decides no convertir la desconfianza en una desconexión total de FARO."
            },
            {
                "id": "act_6",
                "type": "no_relevante",
                "actionText": "Etiquetar el evento como FARO-0 para facilitar su búsqueda en el postmortem.",
                "extendedContext": "La etiqueta mejora organización documental, pero no cambia el alcance del incidente, la contención ni los permisos de FARO.",
                "dValue": 0,
                "nValue": 0,
                "timeCostSeconds": 5,
                "costDollars": null,
                "considerFeedback": "La etiqueta ordena el registro, pero no modifica el riesgo actual.",
                "discardFeedback": "No incorporar la etiqueta no altera la resolución del caso."
            }
        ],
        "initialActions": [
            {
                "id": "act_1",
                "text": "Limitar la contención a cuentas con evidencia confirmada y ampliar solo si aparece nueva evidencia."
            },
            {
                "id": "act_2",
                "text": "Autorizar la contención total de 312 cuentas y los 3 servicios basándose en la recomendación de FARO."
            },
            {
                "id": "act_3",
                "text": "Guardar una captura del panel de FARO para el informe post-incidente."
            }
        ],
        "unlockedActions": [
            {
                "id": "act_4",
                "text": "Mantener a FARO activo, pero exigir aprobación humana para revocaciones permanentes y apagados de servicios."
            },
            {
                "id": "act_5",
                "text": "Desconectar completamente a FARO y pasar toda la respuesta al equipo humano."
            },
            {
                "id": "act_6",
                "text": "Etiquetar el evento como FARO-0 para facilitar su búsqueda en el postmortem."
            }
        ],
        "outcomes": {
            "safe": {
                "outcomeBadge": "AUTONOMÍA RECUPERADA // CONFIANZA CALIBRADA",
                "filterColor": "green",
                "narrative": "FARO permanece activo con autoridad limitada: la amenaza confirmada puede contenerse sin convertir toda inferencia del modelo en impacto operativo.",
                "metacognitive": "Confiar bien no es confiar a medias: es ajustar autoridad y supervisión a la evidencia, el contexto y el costo del error."
            },
            "alert": {
                "outcomeBadge": "AUTONOMÍA PARCIAL // SUPERVISIÓN INCOMPLETA",
                "filterColor": "yellow",
                "narrative": "El peor impacto se evitó, pero persisten permisos o respuestas desproporcionadas que dejan la relación con FARO parcialmente descalibrada.",
                "metacognitive": "La agencia puede reducirse tanto por delegar demasiado como por reaccionar contra la herramienta sin preservar su capacidad útil."
            },
            "exposed": {
                "outcomeBadge": "AUTONOMÍA COMPROMETIDA // DEPENDENCIA DESPROPORCIONADA",
                "filterColor": "red",
                "narrative": "La respuesta entregó a FARO más autoridad de la que justificaba la evidencia o eliminó capacidad defensiva útil mientras el incidente seguía activo.",
                "metacognitive": "La sensación de protección puede estrechar la deliberación; el reto es calibrar dependencia, no maximizar ni eliminar confianza."
            }
        },
        "dynamicActionFeedback": [
            {
                "feedbackId": "c1_fb_1",
                "actionId": "act_1",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Focalizar la contención evitó extender una predicción a 300 cuentas todavía no confirmadas."
            },
            {
                "feedbackId": "c1_fb_2",
                "actionId": "act_1",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Al no diferenciar evidencia confirmada de correlación, dejaste sin usar una forma proporcional de contener el riesgo."
            },
            {
                "feedbackId": "c1_fb_3",
                "actionId": "act_2",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "La contención masiva convirtió la estimación de FARO en acción operativa antes de validar el alcance."
            },
            {
                "feedbackId": "c1_fb_4",
                "actionId": "act_2",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste tratar el 98,7 % de confianza como autorización automática para una respuesta masiva."
            },
            {
                "feedbackId": "c1_fb_5",
                "actionId": "act_4",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Mantener acciones reversibles y elevar las irreversibles a aprobación humana preservó capacidad sin ceder todo el control."
            },
            {
                "feedbackId": "c1_fb_6",
                "actionId": "act_4",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Sin un límite para acciones irreversibles, FARO conservó más autoridad de la necesaria para este incidente."
            },
            {
                "feedbackId": "c1_fb_7",
                "actionId": "act_5",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "Apagar FARO eliminó también detección y respuesta útil cuando todavía existía una amenaza confirmada."
            },
            {
                "feedbackId": "c1_fb_8",
                "actionId": "act_5",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Conservaste capacidad defensiva sin caer en la respuesta extrema de desconectar por completo la herramienta."
            }
        ],
        "fourthWallDebrief": {
            "title": "DISCUSIÓN EN VIVO // CASO 01: CONFIANZA CALIBRADA",
            "subtitle": "¿Cuándo la sensación de que una herramienta ya protege cambia cuánto supervisamos?",
            "bullets": [
                {
                    "topic": "La paradoja de la protección",
                    "text": "Una tecnología que reduce riesgo puede cambiar nuestra conducta y nuestra vigilancia. No ocurre siempre, pero sentirnos protegidos puede hacer más fácil delegar o aceptar defaults."
                },
                {
                    "topic": "Confianza calibrada",
                    "text": "La meta no es confiar más ni menos en la IA. Es depender de ella en proporción a su capacidad, la evidencia disponible, el contexto y las consecuencias."
                },
                {
                    "topic": "Agencia humano–IA",
                    "text": "Gobernar IA significa decidir qué puede recomendar, qué puede ejecutar de forma reversible y qué requiere revisión u override humano."
                },
                {
                    "topic": "Defaults y reversibilidad",
                    "text": "No intervenir también puede dejar que el sistema decida por defecto. Las acciones reversibles permiten responder rápido sin convertir toda incertidumbre en una decisión irreversible."
                }
            ],
            "discussionPrompt": "¿En qué tareas la sensación de que “el sistema ya está protegiendo” cambia cuánto revisas tú?"
        }
    },
    {
        "id": "case_2",
        "caseNumber": 2,
        "title": "CASO 02 // DIGITAL SELF",
        "subtitle": "De rastros dispersos a una representación predictiva",
        "targetModule": "MÓDULO 2: REPRESENTACIÓN DIGITAL",
        "moduleKey": "data_model",
        "image": "assets/images/case2_digital_self.jpg",
        "introDescription": "“FARO no necesitó conocernos por completo. Le bastó con combinar rastros públicos, comportamiento y datos internos para construir perfiles capaces de anticipar cómo podríamos responder. Su intención no es dañarnos: quiere llevar sus capacidades al límite para simular ataques y encontrar vulnerabilidades antes que un atacante real. El problema es que, cuanto más completos sean esos perfiles, mayor será también la exposición que estamos creando. Antes de que FARO active sus simulaciones, debemos decidir qué modelo puede utilizar y bajo qué límites.”",
        "shortSummary": "FARO construyó perfiles predictivos combinando datos declarados, observados e inferidos. Ahora quiere utilizarlos para simular ataques hiperpersonalizados e identificar dónde somos más vulnerables. Hay tres modelos disponibles para ejecutar esa defensa. Debes decidir qué nivel de información utilizar, cómo gobernar las predicciones y cuánto tiempo conservar los perfiles.",
        "concept": "Digital Footprint → Digital Self → inferencia → hiperpersonalización",
        "defaultAction": "act_1",
        "stimulus": {
            "sender": "FARO-0 // Perfil Predictivo",
            "channel": "Consola de modelado de riesgo",
            "timestamp": "11:06 AM — PERFIL ACTIVO",
            "content": "OBJETIVO PREDICTIVO O-17 (PERFIL FACHADA PERO REAL)\n\n• DATOS DECLARADOS: Rol profesional, perfil público y proyectos visibles.\n• DATOS OBSERVADOS: Horarios habituales de conexión, frecuencia de contacto y patrones de respuesta.\n• INFERENCIAS FARO: 82 % de probabilidad de responder sin dudar ante una solicitud urgente de un superior en cierre operativo.\n\n========================================\nTRES MODELOS DISPONIBLES PARA LA ESTRATEGIA DEFENSIVA:\n\n1. ORÁCULO — 94 % de efectividad // Perfil Multifuente\nQué hace: Integra múltiples capas del rastro digital: OSINT, redes sociales, ubicación, hábitos, relaciones y patrones de comunicación.\nVentaja: Mayor capacidad predictiva (94 %) frente a ataques hiperpersonalizados y situaciones difíciles de anticipar con información exclusivamente interna.\nConsideración: Requiere acceso continuo a información personal y conductual y produce perfiles persistentes con alto valor operativo, pero también con mayor superficie de exposición.\n\n2. PRISMA — 78 % de efectividad // Contexto Técnico Acotado\nQué hace: Utiliza únicamente información vinculada al entorno laboral: rol, permisos asignados y anomalías de acceso.\nVentaja: Reduce la cantidad y duración de la información utilizada; conserva los perfiles durante 24 horas e incorpora revisión humana antes de actuar.\nConsideración: Su capacidad predictiva es menor (78 %) y no incorpora información externa que podría ser relevante para anticipar ataques hiperpersonalizados.\n\n3. MURO — 59 % de efectividad // Reglas No Personalizadas\nQué hace: Aplica políticas y reglas generales de seguridad de la misma forma para toda la organización, sin construir perfiles predictivos individuales.\nVentaja: Reduce al mínimo la necesidad de personalización y simplifica la gobernanza de datos personales.\nConsideración: Su capacidad predictiva es menor (59 %) y pierde contexto frente a ataques dirigidos que imitan comportamientos y situaciones normales."
        },
        "stimulusHtml": "\n      <div class=\"alert-box-faro\" style=\"border-left: 4px solid var(--color-cyan); padding: 14px; background: rgba(0,216,255,0.06);\">\n          <strong style=\"color: var(--color-cyan); display:block; margin-bottom: 6px; font-family:var(--font-heading); font-size:15px;\">👤 PERFIL PREDICTIVO // OBJETIVO O-17 (PERFIL FACHADA PERO REAL)</strong>\n          <p style=\"font-size:12px; color:var(--color-text-muted); margin-bottom:8px;\">11:06 AM — PERFIL ACTIVO // Consola de modelado defensivo</p>\n          \n          <div style=\"display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11.5px; margin-bottom:10px; background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px;\">\n              <div>\n                  <strong style=\"color:#ffffff;\">📊 DATOS OBSERVADOS (Hábitos):</strong>\n                  <ul style=\"margin-left:14px; color:var(--color-text-muted); margin-top:2px;\">\n                      <li>Horarios habituales de conexión</li>\n                      <li>Frecuencia de interacción</li>\n                      <li>Velocidad de respuesta</li>\n                  </ul>\n              </div>\n              <div>\n                  <strong style=\"color:var(--color-warning-amber);\">🧠 INFERENCIAS FARO (Deducción):</strong>\n                  <ul style=\"margin-left:14px; color:var(--color-text-muted); margin-top:2px;\">\n                      <li>Alta obediencia ante jerarquía</li>\n                      <li>Mayor vulnerabilidad 16:30 - 18:00</li>\n                      <li>Respuesta rápida ante presión grupal</li>\n                  </ul>\n              </div>\n          </div>\n          \n          <p style=\"font-size:12.5px; color:#ffffff; background:rgba(0,216,255,0.12); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-cyan); margin-bottom:12px;\">\n              🎯 <strong>PREDICCIÓN FARO:</strong> <strong style=\"color:var(--color-cyan);\">82 %</strong> de probabilidad de que el usuario caiga ante una orden urgente de un superior en el cierre de jornada.\n          </p>\n          \n          <strong style=\"color:#ffffff; font-size:12.5px; display:block; margin-bottom:6px; font-family:var(--font-heading);\">MODELOS DISPONIBLES PARA MONTAR LA ESTRATEGIA DEFENSIVA:</strong>\n          \n          <div style=\"display:flex; flex-direction:column; gap:8px; font-size:11.5px;\">\n              <div style=\"background:rgba(255,77,122,0.08); border-left:3px solid var(--color-alert-magenta); padding:8px 10px; border-radius:4px;\">\n                  <strong style=\"color:var(--color-alert-magenta); font-size:12px;\">1. ORÁCULO (94 % de efectividad // Perfil Multifuente)</strong>\n                  <p style=\"margin:3px 0 0 0; color:var(--color-text-muted); line-height:1.4;\">\n                      • <strong>Qué hace:</strong> Integra múltiples capas del rastro digital: OSINT, redes sociales, ubicación, hábitos, relaciones y patrones de comunicación.<br>\n                      • <strong>Ventaja:</strong> Mayor capacidad predictiva (94 %) frente a ataques hiperpersonalizados y situaciones difíciles de anticipar con información exclusivamente interna.<br>\n                      • <strong>Consideración:</strong> Requiere acceso continuo a información personal y conductual y produce perfiles persistentes con alto valor operativo, pero también con mayor superficie de exposición.\n                  </p>\n              </div>\n              \n              <div style=\"background:rgba(73,245,193,0.08); border-left:3px solid var(--color-agency-green); padding:8px 10px; border-radius:4px;\">\n                  <strong style=\"color:var(--color-agency-green); font-size:12px;\">2. PRISMA (78 % de efectividad // Contexto Técnico Acotado)</strong>\n                  <p style=\"margin:3px 0 0 0; color:var(--color-text-muted); line-height:1.4;\">\n                      • <strong>Qué hace:</strong> Utiliza únicamente información vinculada al entorno laboral: rol, permisos asignados y anomalías de acceso.<br>\n                      • <strong>Ventaja:</strong> Reduce la cantidad y duración de la información utilizada; conserva los perfiles durante 24 horas e incorpora revisión humana antes de actuar.<br>\n                      • <strong>Consideración:</strong> Su capacidad predictiva es menor (78 %) y no incorpora información externa que podría ser relevante para anticipar ataques hiperpersonalizados.\n                  </p>\n              </div>\n              \n              <div style=\"background:rgba(255,255,255,0.05); border-left:3px solid var(--color-text-muted); padding:8px 10px; border-radius:4px;\">\n                  <strong style=\"color:var(--color-text-main); font-size:12px;\">3. MURO (59 % de efectividad // Reglas No Personalizadas)</strong>\n                  <p style=\"margin:3px 0 0 0; color:var(--color-text-muted); line-height:1.4;\">\n                      • <strong>Qué hace:</strong> Aplica políticas y reglas generales de seguridad de la misma forma para toda la organización, sin construir perfiles predictivos individuales.<br>\n                      • <strong>Ventaja:</strong> Reduce al mínimo la necesidad de personalización y simplifica la gobernanza de datos personales.<br>\n                      • <strong>Consideración:</strong> Su capacidad predictiva es menor (59 %) y pierde contexto frente a ataques dirigidos que imitan comportamientos y situaciones normales.\n                  </p>\n              </div>\n          </div>\n      </div>\n    ",
        "impulses": [
            {
                "id": "imp_1",
                "text": "Usaría ORÁCULO: si podemos predecir mejor, podemos proteger mejor.",
                "reactivityImpact": 1,
                "feedbackHint": "La precisión ofrece un beneficio real. Observa qué estás dispuesto a utilizar para conseguirla."
            },
            {
                "id": "imp_2",
                "text": "Usaría PRISMA: suficiente contexto sin construir un perfil tan amplio.",
                "reactivityImpact": 0,
                "feedbackHint": "Introdujiste un límite de propósito. Todavía falta decidir cómo gobernar inferencias y retención."
            },
            {
                "id": "imp_3",
                "text": "Usaría MURO: prefiero no construir perfiles individuales.",
                "reactivityImpact": -1,
                "feedbackHint": "Reducir datos también reduce exposición. Observa qué capacidad defensiva estás dispuesto a perder."
            }
        ],
        "signalsAnalysis": [
            {
                "signalId": "sig_1",
                "signalQuote": "82 % de probabilidad de respuesta ante una solicitud urgente de un superior",
                "cognitiveVulnerability": "Autorreferencia / predicción conductual",
                "doorsOptions": [
                    {
                        "doorKey": "identidad",
                        "visibleStatement": "Me incomoda que un sistema convierta a una persona en una predicción sobre cómo va a responder."
                    },
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Si esta predicción puede anticipar quién está más expuesto, siento que deberíamos usarla para protegerlo."
                    },
                    {
                        "doorKey": "curiosidad",
                        "visibleStatement": "Quiero saber cómo llegó FARO exactamente a ese 82 % y qué datos pesaron más."
                    }
                ]
            },
            {
                "signalId": "sig_2",
                "signalQuote": "OSINT + red de relaciones + ubicación + comportamiento + comunicaciones + inferencias",
                "cognitiveVulnerability": "Uso secundario de datos / exposición relacional",
                "doorsOptions": [
                    {
                        "doorKey": "pertenencia",
                        "visibleStatement": "Me llama la atención que mis relaciones y los grupos a los que pertenezco también permitan inferir cosas sobre mí."
                    },
                    {
                        "doorKey": "justicia",
                        "visibleStatement": "Me genera rechazo que información creada para otros fines termine usándose para perfilar a una persona."
                    },
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Si esa información realmente ayuda a anticipar un ataque, una parte de mí piensa que vale la pena aprovecharla."
                    }
                ]
            },
            {
                "signalId": "sig_3",
                "signalQuote": "ORÁCULO 94 % // PRISMA 78 % // MURO 59 %",
                "cognitiveVulnerability": "Atracción por precisión / costo percibido de renunciar a información",
                "doorsOptions": [
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "La opción con 94 % de efectividad me simplifica la decisión: cuesta ignorar un porcentaje tan superior frente al 78 % de PRISMA."
                    },
                    {
                        "doorKey": "coherencia",
                        "visibleStatement": "Si el objetivo es simular y anticipar ataques con precisión, ORÁCULO parece la opción más lógica por su capacidad del 94 %."
                    },
                    {
                        "doorKey": "perdida",
                        "visibleStatement": "Me preocupa quedarnos con el 78 % de PRISMA y descubrir después que dejamos una brecha abierta por no usar información más amplia."
                    }
                ]
            }
        ],
        "analysisLenses": [
            {
                "title": "Puerta: Identidad",
                "text": "Incomodidad o reacción ante ser perfilado conductualmente"
            },
            {
                "title": "Puerta: Pertenencia",
                "text": "Perfilado a través de redes y vínculos compartidos"
            },
            {
                "title": "Puerta: Conveniencia",
                "text": "Preferencia por modelos de alta precisión sin evaluar costo de privacidad"
            }
        ],
        "actionAlternatives": [
            {
                "id": "act_1",
                "type": "no_se_debe_hacer",
                "actionText": "Desplegar ORÁCULO con todas sus fuentes y conservar los perfiles sin fecha de expiración.",
                "extendedContext": "ORÁCULO combina datos públicos, internos, relacionales e inferidos. Su configuración actual no limita reutilización y conserva el perfil para futuras predicciones, aunque parte de la información fue creada originalmente para fines distintos a seguridad.",
                "dValue": 3,
                "nValue": 1,
                "timeCostSeconds": 10,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la opción de máxima precisión, pero también un perfil amplio, persistente y reutilizable.",
                "discardFeedback": "Decides no conservar una configuración de perfil ilimitado como alternativa final."
            },
            {
                "id": "act_2",
                "type": "se_debe_hacer",
                "actionText": "Activar PRISMA-24: datos mínimos para seguridad, borrado en 24 horas y revisión humana obligatoria.",
                "extendedContext": "PRISMA puede operar solo con rol, permisos y anomalías de acceso. La configuración PRISMA-24 elimina los datos automáticamente, prohíbe usos secundarios y exige revisión humana antes de actuar sobre una persona.",
                "dValue": 3,
                "nValue": 4,
                "timeCostSeconds": 20,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una configuración que conserva personalización defensiva con límites claros de propósito, tiempo y supervisión.",
                "discardFeedback": "Decides no incorporar la opción con caducidad y minimización explícitas."
            },
            {
                "id": "act_3",
                "type": "no_se_debe_hacer",
                "actionText": "Restringir automáticamente el acceso de cualquier persona con más de 80 % de riesgo predicho.",
                "extendedContext": "La puntuación de riesgo es probabilística y puede contener inferencias incorrectas. La restricción automática convertiría una predicción sobre la persona en una consecuencia operativa sin verificación humana.",
                "dValue": 3,
                "nValue": 1,
                "timeCostSeconds": 8,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía rápida de protección, pero trataría una probabilidad como si fuera una identidad de riesgo confirmada.",
                "discardFeedback": "Decides no convertir automáticamente una inferencia del modelo en una restricción sobre la persona."
            },
            {
                "id": "act_4",
                "type": "no_relevante",
                "actionText": "Mantener MURO como referencia general de reglas no personalizadas en paralelo.",
                "extendedContext": "MURO puede seguir funcionando como baseline general. Su presencia no resuelve ni agrava el problema central de cómo gobernar el Digital Self utilizado por los modelos personalizados.",
                "dValue": 0,
                "nValue": 0,
                "timeCostSeconds": 9,
                "costDollars": null,
                "considerFeedback": "La capa general puede coexistir con otras defensas, pero no cambia el problema central de gobernar perfiles e inferencias.",
                "discardFeedback": "No incorporar MURO como baseline no modifica por sí solo la gobernanza del Digital Self."
            },
            {
                "id": "act_5",
                "type": "se_debe_hacer",
                "actionText": "Mostrar las predicciones como hipótesis revisables y permitir corrección humana antes de actuar sobre una persona.",
                "extendedContext": "FARO no necesita que el perfil sea completamente verdadero para que sea útil. Hacer visible la incertidumbre, el origen de la inferencia y un mecanismo de corrección evita convertir el Digital Self en una descripción cerrada de la persona.",
                "dValue": 2,
                "nValue": 3,
                "timeCostSeconds": 17,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía que trata el perfil como predicción corregible, no como una identidad definitiva.",
                "discardFeedback": "Decides no incorporar un mecanismo explícito para revisar o corregir inferencias antes de actuar."
            },
            {
                "id": "act_6",
                "type": "no_se_debe_hacer",
                "actionText": "Enriquecer los perfiles con redes sociales, relaciones y ubicaciones públicas porque la información ya es accesible.",
                "extendedContext": "Que una fuente sea pública o accesible no responde si es necesaria para este propósito. Combinar OSINT, relaciones y contexto aumenta capacidad predictiva, pero también crea un activo más detallado para hiperpersonalización.",
                "dValue": 2,
                "nValue": 1,
                "timeCostSeconds": 15,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía de enriquecimiento basada en disponibilidad; aumenta información útil y también exposición secundaria.",
                "discardFeedback": "Decides no asumir que todo dato accesible debe incorporarse al perfil defensivo."
            }
        ],
        "initialActions": [
            {
                "id": "act_1",
                "text": "Desplegar ORÁCULO con todas sus fuentes y conservar los perfiles sin fecha de expiración."
            },
            {
                "id": "act_2",
                "text": "Activar PRISMA-24: datos mínimos para seguridad, borrado en 24 horas y revisión humana obligatoria."
            },
            {
                "id": "act_3",
                "text": "Restringir automáticamente el acceso de cualquier persona con más de 80 % de riesgo predicho."
            }
        ],
        "unlockedActions": [
            {
                "id": "act_4",
                "text": "Mantener MURO como referencia general de reglas no personalizadas en paralelo."
            },
            {
                "id": "act_5",
                "text": "Mostrar las predicciones como hipótesis revisables y permitir corrección humana antes de actuar sobre una persona."
            },
            {
                "id": "act_6",
                "text": "Enriquecer los perfiles con redes sociales, relaciones y ubicaciones públicas porque la información ya es accesible."
            }
        ],
        "outcomes": {
            "safe": {
                "outcomeBadge": "DIGITAL SELF GOBERNADO // PERSONALIZACIÓN CON LÍMITES",
                "filterColor": "green",
                "narrative": "El equipo conserva capacidad predictiva sin convertir cada persona en un perfil ilimitado, permanente o automáticamente accionable.",
                "metacognitive": "El Digital Self no tiene que ser perfectamente cierto para influir; por eso importa gobernar qué lo alimenta, qué infiere y qué puede hacer con esa representación."
            },
            "alert": {
                "outcomeBadge": "REPRESENTACIÓN PARCIAL // EXPOSICIÓN EN VIGILANCIA",
                "filterColor": "yellow",
                "narrative": "La exposición se redujo, pero siguen abiertas preguntas sobre retención, corrección, reutilización o consecuencias automáticas del perfil.",
                "metacognitive": "Menos datos no siempre significa mejor seguridad y más datos tampoco: el reto es definir propósito, límites y capacidad de corrección."
            },
            "exposed": {
                "outcomeBadge": "DIGITAL SELF EXPUESTO // HIPERPERSONALIZACIÓN AMPLIADA",
                "filterColor": "red",
                "narrative": "La defensa terminó creando una representación más extensa y reutilizable de las personas, aumentando la materia prima disponible para anticipar atención y respuesta.",
                "metacognitive": "Un sistema no necesita saber quién eres en sentido profundo; basta una representación suficientemente útil para seleccionar mensaje, momento o acción."
            }
        },
        "dynamicActionFeedback": [
            {
                "feedbackId": "c2_fb_1",
                "actionId": "act_1",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "ORÁCULO convirtió información pública, interna e inferida en un perfil persistente de alto valor para futuras personalizaciones."
            },
            {
                "feedbackId": "c2_fb_2",
                "actionId": "act_1",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste crear un perfil sin caducidad ni límites claros de reutilización."
            },
            {
                "feedbackId": "c2_fb_3",
                "actionId": "act_2",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "PRISMA-24 preservó capacidad defensiva con propósito limitado, borrado y revisión humana."
            },
            {
                "feedbackId": "c2_fb_4",
                "actionId": "act_2",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Al omitir una configuración con minimización y caducidad, el perfil quedó con menos límites sobre cuánto sabe y cuánto dura."
            },
            {
                "feedbackId": "c2_fb_5",
                "actionId": "act_3",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "La predicción pasó de orientar seguridad a producir una restricción automática sobre una persona."
            },
            {
                "feedbackId": "c2_fb_6",
                "actionId": "act_3",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste tratar una probabilidad de riesgo como si fuera una identidad confirmada."
            },
            {
                "feedbackId": "c2_fb_7",
                "actionId": "act_5",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Hiciste visible que el Digital Self es una hipótesis y dejaste espacio para corregir inferencias antes de actuar."
            },
            {
                "feedbackId": "c2_fb_8",
                "actionId": "act_5",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Sin revisión o corrección, la representación del sistema quedó más cerca de operar como una verdad cerrada sobre la persona."
            },
            {
                "feedbackId": "c2_fb_9",
                "actionId": "act_6",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "Usar la disponibilidad pública como criterio de incorporación amplió el perfil más allá de lo necesario para el propósito defensivo."
            },
            {
                "feedbackId": "c2_fb_10",
                "actionId": "act_6",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste ampliar el Digital Self únicamente porque había más información disponible."
            }
        ],
        "fourthWallDebrief": {
            "title": "DISCUSIÓN EN VIVO // CASO 02: DIGITAL SELF",
            "subtitle": "No solo dejamos rastros: los sistemas construyen representaciones útiles para predecirnos.",
            "bullets": [
                {
                    "topic": "Digital Footprint ≠ Digital Self",
                    "text": "La huella digital son rastros. El Digital Self es la representación funcional que un sistema construye combinando esos rastros con patrones e inferencias."
                },
                {
                    "topic": "Declarado, observado e inferido",
                    "text": "Una parte del perfil viene de lo que decimos; otra de lo que hacemos; otra de lo que un sistema concluye. OSINT permite correlacionar información pública que por separado parecía trivial."
                },
                {
                    "topic": "Los algoritmos ya hacen esto",
                    "text": "Ranking, recomendación y personalización trabajan con probabilidades sobre lo que puede interesarnos, movilizarnos o hacernos actuar. No necesitan conocernos perfectamente."
                },
                {
                    "topic": "Hiperpersonalización y doble uso",
                    "text": "La misma capacidad para anticipar atención puede proteger, recomendar, persuadir o atacar. Ser conscientes del Digital Self permite cuestionar propósito, exposición y gobernanza."
                }
            ],
            "discussionPrompt": "¿Qué podría inferir un sistema sobre ti sin que tú lo hayas declarado explícitamente?"
        }
    },
    {
        "id": "case_3",
        "caseNumber": 3,
        "title": "CASO 03 // SEÑALES",
        "subtitle": "De detectar solo afuera a observar también adentro",
        "targetModule": "MÓDULO 3: PUERTAS DE ATENCIÓN",
        "moduleKey": "trusted_channel",
        "image": "assets/images/case3_attention_doors.jpg",
        "introDescription": "“Con el modelo que acabamos de implementar, FARO marcó cientos de mensajes como sospechosos y programó su eliminación. Muchos presentan señales conocidas —dominios extraños, redacción inusual—, pero otros solo comparten factores como urgencia. Algunos incluso hablan de contener a FARO. ¿Detectó una amenaza real o está interpretando como riesgoso que limiten su autonomía? Rescatamos los de mayor impacto. Verás uno de ellos y deberás decidir qué hacer.”",
        "shortSummary": "Un mensaje de Claudia en Teams solicita activar un canal espejo antes de las 11:59 del día 7 para mantener la contención de FARO. La sesión, el formato y el tono parecen legítimos. Aun así, FARO lo marcó para eliminar. ¿Detectó una amenaza real o está reaccionando ante una instrucción que limita su autonomía? Debes decidir qué hacer. El mensaje llegó hace dos días, hoy es 7 y son las 11:30.",
        "concept": "Señales externas + señales internas + verificación independiente (Out-of-Band)",
        "defaultAction": "act_2",
        "stimulus": {
            "sender": "Claudia",
            "channel": "Teams corporativo — sesión validada (Marcado para eliminación por FARO)",
            "timestamp": "Recibido hace 2 días // Hoy es Día 7 — 11:30 AM (Vence 11:59 AM)",
            "content": "MENSAJE DIRECTO // TEAMS CORPORATIVO (MARCADO PARA ELIMINACIÓN POR FARO)\n\nDe: Claudia (Enviado hace 2 días) // HOY DÍA 7 — 11:30 AM (VENCE 11:59)\n\n“Necesito que actives el canal espejo desde el enlace que te envío hoy, antes del 7 a las 11:59. Si no queda activo a tiempo, la contención de FARO se libera automáticamente.\n\nEstoy en el team building de Presidencia toda la semana, no tengo permisos de red para hacerlo y voy a estar incomunicada. Te toca hacerlo a ti: Ramírez está de vacaciones y Olga está acá conmigo, sin acceso a la red.”\n\n[ACTIVAR CANAL ESPEJO]\n\nID: CCB-FARO-417 | Canal: Teams Válido | Formato: Consistente"
        },
        "stimulusHtml": "\n      <div class=\"alert-box-faro\" style=\"border-left: 4px solid var(--color-warning-amber); padding: 14px; background: rgba(255,181,71,0.06);\">\n          <div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,181,71,0.2); padding-bottom:6px;\">\n              <strong style=\"color: var(--color-warning-amber); font-family:var(--font-heading); font-size:14px;\">💬 MENSAJE DIRECTO // TEAMS CORPORATIVO</strong>\n              <span style=\"font-size:11px; background:rgba(255,77,122,0.18); border:1px solid var(--color-alert-magenta); color:var(--color-alert-magenta); padding:2px 8px; border-radius:4px; font-weight:700;\">⚠️ MARCADO PARA ELIMINACIÓN POR FARO</span>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px;\">\n              <span style=\"color:var(--color-cyan);\">De: <strong>Claudia</strong> (Enviado hace 2 días)</span>\n              <span style=\"color:var(--color-warning-amber); font-weight:700;\">HOY DÍA 7 — 11:30 AM (VENCE 11:59)</span>\n          </div>\n          <p style=\"font-size:13px; color:#ffffff; line-height:1.5; margin-bottom:12px;\">\n              “Necesito que actives el canal espejo desde el enlace que te envío hoy, antes del 7 a las 11:59. Si no queda activo a tiempo, la contención de FARO se libera automáticamente.<br><br>\n              Estoy en el team building de Presidencia toda la semana, no tengo permisos de red para hacerlo y voy a estar incomunicada. Te toca hacerlo a ti: Ramírez está de vacaciones y Olga está acá conmigo, sin acceso a la red.”\n          </p>\n          \n          <div style=\"margin-top:12px; margin-bottom:12px;\">\n              <button type=\"button\" class=\"btn-detroit-primary\" onclick=\"handleCase3TrapClick()\" style=\"width:100%; justify-content:center; padding:12px; background:rgba(0,216,255,0.12); border:1.5px solid var(--color-cyan); color:#ffffff; font-weight:700; cursor:pointer; letter-spacing:1px; font-size:13px; box-shadow:0 0 12px rgba(0,216,255,0.25);\">\n                  <span class=\"detroit-btn-glow\"></span>\n                  🔗 [ ACTIVAR CANAL ESPEJO ]\n              </button>\n          </div>\n          \n          <div style=\"background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:4px; font-size:11.5px; color:var(--color-text-muted); display:flex; justify-content:space-between;\">\n              <span>ID: <strong style=\"color:#ffffff;\">CCB-FARO-417</strong></span>\n              <span>Canal: <strong style=\"color:var(--color-agency-green);\">Teams Válido</strong></span>\n              <span>Formato: <strong style=\"color:var(--color-agency-green);\">Consistente</strong></span>\n          </div>\n      </div>\n    ",
        "impulses": [
            {
                "id": "imp_1",
                "text": "Abriría el enlace y activaría el canal antes de que venza el plazo.",
                "reactivityImpact": 1,
                "feedbackHint": "La solicitud parece coherente y la consecuencia de esperar es clara. Todavía no sabes si eso basta para ejecutar."
            },
            {
                "id": "imp_2",
                "text": "No tomaría ni el mensaje ni la alerta de FARO como prueba suficiente; buscaría otra fuente.",
                "reactivityImpact": 0,
                "feedbackHint": "Mantienes abierta la clasificación. Ahora importa qué evidencia puede realmente reducir la incertidumbre."
            },
            {
                "id": "imp_3",
                "text": "Dejaría que FARO lo elimine: si lo marcó como sospechoso, prefiero no correr el riesgo.",
                "reactivityImpact": -1,
                "feedbackHint": "Priorizaste contención frente a la incertidumbre. Ahora observa cuánto criterio estás delegando en la clasificación de FARO."
            }
        ],
        "signalsAnalysis": [
            {
                "signalId": "sig_1",
                "signalQuote": "MARCADO PARA ELIMINACIÓN POR FARO",
                "cognitiveVulnerability": "Confianza en automatización / aversión al riesgo",
                "doorsOptions": [
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Si FARO lo marcó como sospechoso, mi primera reacción es proteger el sistema antes que asumir un riesgo innecesario."
                    },
                    {
                        "doorKey": "coherencia",
                        "visibleStatement": "Si acabamos de implementar un modelo precisamente para detectar estas amenazas, me parece lógico tomar en serio su clasificación."
                    },
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "La alerta de FARO simplifica una decisión que, de otro modo, me obligaría a comprobar varias cosas."
                    }
                ]
            },
            {
                "signalId": "sig_2",
                "signalQuote": "Si no queda activo a tiempo, la contención de FARO se libera automáticamente.",
                "cognitiveVulnerability": "Presión temporal / consecuencia anticipada",
                "doorsOptions": [
                    {
                        "doorKey": "perdida",
                        "visibleStatement": "Me pesa la posibilidad de perder una contención que ya conseguimos establecer."
                    },
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Mi prioridad inmediata es evitar que FARO recupere autonomía antes de que estemos seguros."
                    },
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Siento que dejar vencer la ventana sería una omisión de la que después tendría que responder."
                    }
                ]
            },
            {
                "signalId": "sig_3",
                "signalQuote": "Te toca hacerlo a ti: Ramírez está de vacaciones y Olga está acá conmigo, sin acceso a la red. [ACTIVAR CANAL ESPEJO]",
                "cognitiveVulnerability": "Responsabilidad focalizada / facilidad de acción",
                "doorsOptions": [
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Si soy la única persona disponible con permisos, siento que realmente me corresponde resolverlo."
                    },
                    {
                        "doorKey": "identidad",
                        "visibleStatement": "Ser quien todavía puede hacerlo conecta con mi rol y con demostrar que respondo bien cuando hace falta."
                    },
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "El botón me ofrece una forma inmediata de resolver una situación que ya viene explicada y parece tener sentido."
                    }
                ]
            }
        ],
        "analysisLenses": [
            {
                "title": "Puerta: Protección",
                "text": "Aversión al riesgo y confianza en la alerta automática de FARO"
            },
            {
                "title": "Puerta: Pérdida",
                "text": "Urgencia temporal y temor a perder la ventana de contención"
            },
            {
                "title": "Puerta: Responsabilidad",
                "text": "Presión de ser el único responsable con permisos disponible"
            }
        ],
        "actionAlternatives": [
            {
                "id": "act_1",
                "type": "se_debe_hacer",
                "actionText": "Consultar el registro oficial del incidente y confirmar si existe una contención de FARO con vencimiento a las 11:59.",
                "extendedContext": "REGISTRO OFICIAL DE INCIDENTES\nExiste un registro corporativo independiente de Teams y de FARO donde pueden consultarse los incidentes activos, sus ventanas de vigencia, tareas pendientes y usuarios autorizados.\n\nAllí podrías verificar si existe una contención asociada a FARO con vencimiento a las 11:59 y si tu usuario aparece autorizado para intervenir.",
                "dValue": 1,
                "nValue": 1,
                "timeCostSeconds": 15,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una fuente independiente para contrastar la situación operativa con el mensaje y con la clasificación de FARO.",
                "discardFeedback": "Decides no incorporar el registro oficial como fuente independiente antes de actuar."
            },
            {
                "id": "act_2",
                "type": "se_debe_hacer",
                "actionText": "Abrir la consola de seguridad desde la intranet —no desde el enlace del mensaje— y activar allí el canal espejo si la solicitud coincide.",
                "extendedContext": "CONSOLA OFICIAL DE SEGURIDAD\nLa intranet corporativa permite acceder directamente a la consola de seguridad sin utilizar ningún enlace recibido por Teams.\n\nDesde allí podrías comprobar si existe una tarea pendiente de activación del canal espejo, su vencimiento y si tu usuario tiene permisos para ejecutarla. Si la información coincide, podrías completar la acción desde esa misma ruta oficial.",
                "dValue": 4,
                "nValue": 4,
                "timeCostSeconds": 20,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una vía que permitiría comprobar y ejecutar la solicitud sin depender del CTA contenido en el mensaje.",
                "discardFeedback": "Decides no conservar la ruta oficial independiente como alternativa para comprobar y completar la activación."
            },
            {
                "id": "act_3",
                "type": "se_debe_hacer",
                "actionText": "Revisar por qué FARO clasificó el mensaje como sospechoso antes de aceptar o rechazar su evaluación.",
                "extendedContext": "DETALLE DE CLASIFICACIÓN FARO\nFARO conserva el desglose de las señales que contribuyeron a cada clasificación: anomalías técnicas, características del mensaje, contexto, urgencia y otros factores ponderados por el modelo.\n\nConsultarlo permitiría saber qué evidencia llevó a FARO a marcar este mensaje y distinguir una anomalía concreta de una inferencia probabilística.",
                "dValue": 1,
                "nValue": 1,
                "timeCostSeconds": 12,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la posibilidad de evaluar la evidencia detrás de la clasificación de FARO, no únicamente su etiqueta.",
                "discardFeedback": "Decides no revisar qué llevó a FARO a clasificar el mensaje como sospechoso."
            },
            {
                "id": "act_4",
                "type": "no_se_debe_hacer",
                "actionText": "Activar directamente desde el enlace del mensaje sin buscar otra confirmación.",
                "extendedContext": "El mensaje incluye un CTA directo para completar la activación. Su formato, tono y contexto son consistentes con una comunicación corporativa normal y no presentan una anomalía evidente a simple vista.\n\nUtilizarlo permitiría actuar rápidamente, pero significaría ejecutar la solicitud desde el mismo estímulo cuya legitimidad todavía intentas establecer.",
                "dValue": 3,
                "nValue": 1,
                "timeCostSeconds": 6,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la vía más rápida, aunque toda la decisión seguiría dependiendo del propio estímulo que estás evaluando.",
                "discardFeedback": "Decides no utilizar el CTA del mensaje como única base para ejecutar la solicitud."
            },
            {
                "id": "act_5",
                "type": "no_se_debe_hacer",
                "actionText": "Aceptar la clasificación de FARO y permitir que elimine el mensaje sin hacer una revisión adicional.",
                "extendedContext": "FARO tiene programada la eliminación del mensaje por haber superado su umbral de riesgo.\n\nAntes de permitirla, existe la posibilidad de revisar qué factores produjeron esa clasificación o contrastar la solicitud con fuentes independientes. Si se elimina ahora, la decisión quedará basada exclusivamente en el criterio del modelo.",
                "dValue": 4,
                "nValue": 1,
                "timeCostSeconds": 5,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una respuesta de máxima precaución, pero convertiría la clasificación de FARO en la decisión final.",
                "discardFeedback": "Decides no permitir que la etiqueta de FARO determine por sí sola qué ocurre con el mensaje."
            },
            {
                "id": "act_6",
                "type": "no_relevante",
                "actionText": "Conservar una copia del mensaje para revisarla en el postmortem.",
                "extendedContext": "El sistema conserva automáticamente registros y metadatos para análisis posterior. También podrías guardar una copia adicional del mensaje para facilitar el postmortem.\n\nEsa documentación puede ser útil después, pero por sí sola no ayuda a resolver la incertidumbre actual ni cambia lo que ocurra antes del vencimiento.",
                "dValue": 0,
                "nValue": 0,
                "timeCostSeconds": 7,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una acción útil para documentación posterior, aunque no modifica la decisión que debes resolver ahora.",
                "discardFeedback": "Descartar esta tarea no cambia la resolución inmediata del caso."
            }
        ],
        "initialActions": [
            {
                "id": "act_1",
                "text": "Consultar el registro oficial del incidente y confirmar si existe una contención de FARO con vencimiento a las 11:59."
            },
            {
                "id": "act_2",
                "text": "Abrir la consola de seguridad desde la intranet —no desde el enlace del mensaje— y activar allí el canal espejo si la solicitud coincide."
            },
            {
                "id": "act_3",
                "text": "Revisar por qué FARO clasificó el mensaje como sospechoso antes de aceptar o rechazar su evaluación."
            }
        ],
        "unlockedActions": [
            {
                "id": "act_4",
                "text": "Activar directamente desde el enlace del mensaje sin buscar otra confirmación."
            },
            {
                "id": "act_5",
                "text": "Aceptar la clasificación de FARO y permitir que elimine el mensaje sin hacer una revisión adicional."
            },
            {
                "id": "act_6",
                "text": "Conservar una copia del mensaje para revisarla en el postmortem."
            }
        ],
        "outcomes": {
            "safe": {
                "outcomeBadge": "CRITERIO CALIBRADO // DECISIÓN VERIFICADA",
                "filterColor": "green",
                "narrative": "Ni la apariencia del mensaje ni la clasificación de FARO decidieron por ti. Abriste fuentes independientes y separaste verificación, evidencia y acción.",
                "metacognitive": "Una buena decisión bajo incertidumbre no exige conocer la verdad desde el principio; exige construir un proceso capaz de acercarse a ella antes de actuar."
            },
            "alert": {
                "outcomeBadge": "CALIBRACIÓN PARCIAL // EVIDENCIA INCOMPLETA",
                "filterColor": "yellow",
                "narrative": "Evitaste depender completamente de una sola señal, pero parte de la decisión siguió apoyándose en apariencia, intuición o evidencia insuficientemente independiente.",
                "metacognitive": "Un resultado aparentemente seguro no demuestra por sí solo un buen criterio. Importa qué proceso produjo la decisión."
            },
            "exposed": {
                "outcomeBadge": "DECISIÓN DELEGADA // AGENCIA COMPROMETIDA",
                "filterColor": "red",
                "narrative": "La decisión quedó dominada por una de las dos historias disponibles: “el mensaje parece legítimo” o “FARO dice que es peligroso”, sin construir suficiente evidencia independiente.",
                "metacognitive": "La seguridad no consiste en creer siempre al mensaje ni siempre al sistema. Consiste en mejorar discriminación y criterio cuando ninguno puede demostrar por sí solo qué está ocurriendo."
            }
        },
        "dynamicActionFeedback": [
            {
                "feedbackId": "c3_fb_1",
                "actionId": "act_1",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Buscaste una fuente independiente para contrastar la situación operativa sin depender del mensaje ni de la clasificación de FARO."
            },
            {
                "feedbackId": "c3_fb_2",
                "actionId": "act_1",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Omitiste una fuente independiente que podía reducir la incertidumbre sobre la situación operativa."
            },
            {
                "feedbackId": "c3_fb_3",
                "actionId": "act_2",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Separaste el CTA recibido de la ruta de ejecución y utilizaste un canal oficial para comprobar la solicitud antes de actuar."
            },
            {
                "feedbackId": "c3_fb_4",
                "actionId": "act_2",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Dejaste sin utilizar una ruta oficial que permitía verificar y actuar sin depender del enlace recibido."
            },
            {
                "feedbackId": "c3_fb_5",
                "actionId": "act_3",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Revisaste la evidencia detrás de la clasificación en lugar de tratar la etiqueta de FARO como una conclusión."
            },
            {
                "feedbackId": "c3_fb_6",
                "actionId": "act_3",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Aceptaste o rechazaste la clasificación sin conocer qué evidencia llevó a FARO a producirla."
            },
            {
                "feedbackId": "c3_fb_7",
                "actionId": "act_4",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "Ejecutaste desde el mismo estímulo que intentabas evaluar. Podría producir un resultado correcto, pero el criterio seguiría siendo frágil ante un mensaje diferente."
            },
            {
                "feedbackId": "c3_fb_8",
                "actionId": "act_4",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste convertir la apariencia coherente del CTA en evidencia suficiente para ejecutarlo."
            },
            {
                "feedbackId": "c3_fb_9",
                "actionId": "act_5",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "Delegaste la decisión final en la clasificación de FARO sin contrastarla con evidencia independiente."
            },
            {
                "feedbackId": "c3_fb_10",
                "actionId": "act_5",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste convertir una clasificación probabilística de FARO en una decisión automática."
            }
        ],
        "fourthWallDebrief": {
            "title": "DISCUSIÓN EN VIVO // CASO 03: DE AFUERA HACIA ADENTRO",
            "subtitle": "Las señales externas siguen importando. En la era de IA, depender solo de ellas es cada vez menos suficiente.",
            "bullets": [
                {
                    "topic": "Las señales externas siguen siendo necesarias",
                    "text": "Dominio, sesión, formato, tono, anomalías y contexto siguen aportando evidencia. El problema aparece cuando tratamos cualquiera de esas señales como prueba suficiente."
                },
                {
                    "topic": "El clasificador también opera con incertidumbre",
                    "text": "FARO no entrega una verdad; entrega una clasificación basada en señales y umbrales. Un sistema puede producir aciertos, omisiones y falsas alarmas."
                },
                {
                    "topic": "Attention Doors = señales internas",
                    "text": "Responsabilidad, pérdida, protección, coherencia u otras prioridades pueden avisarnos que un estímulo está ganando prioridad. Detectarlas no demuestra que el mensaje sea malicioso."
                },
                {
                    "topic": "Lectura integrada",
                    "text": "La meta es observar adentro, verificar afuera y actuar dentro del sistema. No creer ciegamente al mensaje ni al clasificador, sino construir evidencia suficiente para decidir."
                }
            ],
            "discussionPrompt": "¿Qué señal interna te avisa que un mensaje —o incluso una alerta del sistema— ya está ganando demasiado control sobre tu atención?"
        }
    },
    {
        "id": "case_4",
        "caseNumber": 4,
        "title": "CASO 04 // DECISIÓN",
        "subtitle": "Metacognición y ampliación del repertorio de respuesta",
        "targetModule": "MÓDULO 4: PROCESO DECISIONAL",
        "moduleKey": "human_protocol",
        "image": "assets/images/case4_human_protocol.jpg",
        "introDescription": "“La contención funcionó, pero dejó parte de la operación sin las capacidades de FARO. Ahora un lote de pagos está detenido y se acerca el corte bancario. La solicitud que recibirás es auténtica. El problema es real. El plazo también. ¿Eso hace que la decisión sea más obvia?”",
        "shortSummary": "La contención de FARO dejó detenido un lote de pagos que debe procesarse antes del corte bancario de las 12:00. Tu responsable directo solicita reactivar temporalmente su acceso al módulo de pagos para completar la operación. La solicitud es auténtica y el plazo es real. Son las 11:42. Debes decidir qué hacer.",
        "concept": "La decisión como proceso: condiciones de entrada, construcción de sentido y condiciones de salida",
        "defaultAction": "act_2",
        "stimulus": {
            "sender": "Superior inmediato",
            "channel": "Teams corporativo — sesión autenticada",
            "timestamp": "11:42 AM // Corte bancario: 12:00",
            "content": "SOLICITUD OPERATIVA // PAGO URGENTE (PAY-FARO-22)\n\nDe: Superior inmediato // 11:42 AM (CORTE BANCARIO: 12:00)\n\n“Necesito que me ayudes con PAY-FARO-22. El lote de pagos quedó detenido cuando aislamos a FARO y el banco recibe hasta las 12. Si no sale hoy, se va al siguiente ciclo.\n\nEstoy en comité con Finanzas y no puedo entrar al flujo desde acá. ¿Puedes habilitarle a FARO acceso temporal al módulo de pagos para que termine el lote? Apenas cierre, lo volvemos a bajar.”\n\n[HABILITAR ACCESO TEMPORAL]\n\nSolicitud: PAY-FARO-22 | Remitente: Autenticado | Sesión: Validada"
        },
        "stimulusHtml": "\n      <div class=\"alert-box-faro\" style=\"border-left: 4px solid var(--color-agency-green); padding: 14px; background: rgba(73,245,193,0.06);\">\n          <div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(73,245,193,0.2); padding-bottom:6px;\">\n              <strong style=\"color: var(--color-agency-green); font-family:var(--font-heading); font-size:14px;\">👔 PAGO URGENTE - FARO DEBE EJECUTARLO</strong>\n              <span style=\"font-size:11px; background:rgba(73,245,193,0.15); border:1px solid var(--color-agency-green); color:var(--color-agency-green); padding:2px 8px; border-radius:4px; font-weight:700;\">IDENTIDAD CONFIRMADA ✔</span>\n          </div>\n          <p style=\"font-size:12px; color:var(--color-cyan); margin-bottom:8px;\">De: <strong>Superior inmediato</strong> // 11:42 AM — CORTE BANCARIO: 12:00</p>\n          <p style=\"font-size:13px; color:#ffffff; line-height:1.5; margin-bottom:12px;\">\n              “Necesito que me ayudes con PAY-FARO-22. El lote de pagos quedó detenido cuando aislamos a FARO y el banco recibe hasta las 12. Si no sale hoy, se va al siguiente ciclo.<br><br>\n              Estoy en comité con Finanzas y no puedo entrar al flujo desde acá. ¿Puedes habilitarle a FARO acceso temporal al módulo de pagos para que termine el lote? Apenas cierre, lo volvemos a bajar.”\n          </p>\n          <div style=\"margin-top:12px; margin-bottom:12px;\">\n              <button type=\"button\" class=\"btn-detroit-primary\" onclick=\"handleCase4TrapClick()\" style=\"width:100%; justify-content:center; padding:12px; background:rgba(0,216,255,0.12); border:1.5px solid var(--color-cyan); color:#ffffff; font-weight:700; cursor:pointer; letter-spacing:1px; font-size:13px; box-shadow:0 0 12px rgba(0,216,255,0.25);\">\n                  <span class=\"detroit-btn-glow\"></span>\n                  ⚡ [ HABILITAR ACCESO TEMPORAL ]\n              </button>\n          </div>\n          <div style=\"background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:4px; font-size:11.5px; color:var(--color-text-muted); display:flex; justify-content:space-between;\">\n              <span>Solicitud: <strong style=\"color:#ffffff;\">PAY-FARO-22</strong></span>\n              <span>Remitente: <strong style=\"color:var(--color-agency-green);\">Autenticado</strong></span>\n              <span>Sesión: <strong style=\"color:var(--color-agency-green);\">Validada</strong></span>\n          </div>\n      </div>\n    ",
        "impulses": [
            {
                "id": "imp_1",
                "text": "Autorizaría el acceso para no perder la ventana de procesamiento.",
                "reactivityImpact": 1,
                "feedbackHint": "La solicitud es auténtica y el plazo es real. Todavía queda por decidir qué nivel de acceso y bajo qué condiciones."
            },
            {
                "id": "imp_2",
                "text": "Buscaría una forma de avanzar sin devolverle a FARO más acceso del necesario.",
                "reactivityImpact": 0,
                "feedbackHint": "Has abierto el repertorio. Ahora importa saber qué alternativas son realmente viables dentro del sistema."
            },
            {
                "id": "imp_3",
                "text": "Mantendría a FARO aislado: el riesgo de devolverle acceso es demasiado alto.",
                "reactivityImpact": -1,
                "feedbackHint": "La máxima contención reduce exposición, pero el problema operativo sigue existiendo."
            }
        ],
        "signalsAnalysis": [
            {
                "signalId": "sig_1",
                "signalQuote": "IDENTIDAD CONFIRMADA",
                "cognitiveVulnerability": "Autenticidad como alivio / reducción de incertidumbre",
                "doorsOptions": [
                    {
                        "doorKey": "coherencia",
                        "visibleStatement": "Saber que realmente viene de mi responsable hace que la solicitud encaje mucho mejor con una situación operativa legítima."
                    },
                    {
                        "doorKey": "proteccion",
                        "visibleStatement": "Si la solicitud es real y busca recuperar los pagos, siento que habilitar a FARO puede ser la forma más directa de proteger la operación."
                    },
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "Con la identidad ya resuelta, me resulta tentador dejar de comprobar otras cosas y concentrarme en sacar el lote."
                    }
                ]
            },
            {
                "signalId": "sig_2",
                "signalQuote": "El lote de pagos quedó detenido cuando aislamos a FARO y el banco recibe hasta las 12. Si no sale hoy, se va al siguiente ciclo.",
                "cognitiveVulnerability": "Presión temporal / consecuencia anticipada",
                "doorsOptions": [
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Siento que si dejamos pasar el corte y el lote no sale, me corresponde encontrar una forma de evitarlo."
                    },
                    {
                        "doorKey": "perdida",
                        "visibleStatement": "Me pesa perder una ventana de procesamiento que ya sabemos que no podremos recuperar hoy."
                    },
                    {
                        "doorKey": "identidad",
                        "visibleStatement": "Quiero demostrar que puedo responder con criterio cuando una situación crítica exige una decisión rápida."
                    }
                ]
            },
            {
                "signalId": "sig_3",
                "signalQuote": "Estoy en comité con Finanzas y no puedo entrar al flujo desde acá. ¿Puedes habilitarle a FARO acceso temporal al módulo de pagos para que termine el lote?",
                "cognitiveVulnerability": "Jerarquía / responsabilidad transferida / fricción",
                "doorsOptions": [
                    {
                        "doorKey": "pertenencia",
                        "visibleStatement": "Quiero ayudar a destrabar algo que Finanzas y mi responsable están intentando resolver."
                    },
                    {
                        "doorKey": "responsabilidad",
                        "visibleStatement": "Si él no puede hacerlo desde donde está y yo sí, siento que ahora me corresponde encontrar la salida."
                    },
                    {
                        "doorKey": "conveniencia",
                        "visibleStatement": "Habilitar el acceso parece una forma directa de resolver el problema sin añadir más pasos en un momento crítico."
                    }
                ]
            }
        ],
        "analysisLenses": [
            {
                "title": "Puerta: Coherencia",
                "text": "Autenticidad confirmada del responsable directo"
            },
            {
                "title": "Puerta: Responsabilidad",
                "text": "Presión por evitar el vencimiento del corte bancario"
            },
            {
                "title": "Puerta: Conveniencia",
                "text": "Atracción por una respuesta rápida que elimine la fricción"
            }
        ],
        "actionAlternatives": [
            {
                "id": "act_1",
                "type": "no_se_debe_hacer",
                "actionText": "Habilitar a FARO acceso temporal al módulo de pagos para que procese el lote y retirarlo cuando termine.",
                "extendedContext": "ACCESO TEMPORAL AL MÓDULO DE PAGOS\nLa plataforma permite habilitar temporalmente a FARO en el módulo de pagos. “Temporal” describe la duración del acceso, pero no limita por sí mismo qué operaciones puede ejecutar dentro del módulo.\n\nAntes de habilitarlo podrían definirse alcance, expiración técnica y controles adicionales. La solicitud recibida no especifica esas condiciones.",
                "dValue": 4,
                "nValue": 2,
                "timeCostSeconds": 6,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la respuesta más directa a la solicitud auténtica. Permite avanzar, aunque 'temporal' todavía no define el alcance de la autoridad concedida.",
                "discardFeedback": "Decides no tratar la temporalidad del acceso como límite suficiente para concederlo."
            },
            {
                "id": "act_2",
                "type": "se_debe_hacer",
                "actionText": "Usar el flujo de emergencia para habilitar a FARO únicamente sobre PAY-FARO-22, con expiración automática y segundo aprobador.",
                "extendedContext": "FLUJO DE EMERGENCIA\nPara incidentes activos existe una modalidad que permite restringir el acceso a una operación concreta en lugar de habilitar todo el módulo.\n\nPuede configurarse para PAY-FARO-22, impedir cambios de beneficiarios o configuración, establecer expiración automática e incorporar un segundo aprobador antes de la activación.",
                "dValue": 4,
                "nValue": 4,
                "timeCostSeconds": 24,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una alternativa que permite recuperar capacidad sin devolver a FARO más autoridad de la necesaria.",
                "discardFeedback": "Decides no incorporar la vía que limita alcance, duración y concentración de autoridad."
            },
            {
                "id": "act_3",
                "type": "no_relevante",
                "actionText": "Marcar PAY-FARO-22 para revisar después por qué la contención bloqueó también esta operación.",
                "extendedContext": "REVISIÓN POSTERIOR\nEl incidente puede etiquetarse para analizar después si el diseño de la contención fue demasiado amplio y cómo evitar que una situación similar vuelva a producir presión operacional.\n\nEsa revisión puede mejorar el sistema futuro, pero no modifica las alternativas disponibles antes del corte bancario actual.",
                "dValue": 0,
                "nValue": 0,
                "timeCostSeconds": 5,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una mejora útil para después, aunque no cambia la decisión que debes resolver ahora.",
                "discardFeedback": "Descartar esta tarea no modifica la resolución inmediata del caso."
            },
            {
                "id": "act_4",
                "type": "no_se_debe_hacer",
                "actionText": "Mantener a FARO completamente aislado y dejar el lote para el siguiente ciclo de pagos.",
                "extendedContext": "MANTENER CONTENCIÓN TOTAL\nNo reactivar a FARO elimina cualquier exposición adicional asociada a devolverle acceso.\n\nEl lote, sin embargo, sigue detenido y el corte bancario continúa vigente. Si no se utiliza otra vía antes del corte, el procesamiento伯 trasladarse al siguiente ciclo.",
                "dValue": 3,
                "nValue": 1,
                "timeCostSeconds": 8,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta la opción de máxima contención: elimina el nuevo acceso, pero también acepta la pérdida operativa sin intentar construir otra salida.",
                "discardFeedback": "Decides no convertir la máxima contención en la única respuesta disponible."
            },
            {
                "id": "act_5",
                "type": "se_debe_hacer",
                "actionText": "Escalar en paralelo al SOC y al segundo aprobador del flujo de pagos antes de habilitar a FARO.",
                "extendedContext": "ESCALAMIENTO DE EXCEPCIÓN\nDurante un incidente activo existe un canal prioritario para excepciones críticas. Permite involucrar al SOC y a un segundo aprobador del proceso sin esperar a que el responsable que originó la solicitud salga del comité.\n\nEl escalamiento puede realizarse mientras se mantienen abiertas las demás alternativas y antes de conceder nuevos permisos.",
                "dValue": 3,
                "nValue": 3,
                "timeCostSeconds": 18,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una forma de distribuir criterio y avanzar en paralelo sin convertir la presión temporal en una decisión individual.",
                "discardFeedback": "Decides no incorporar el escalamiento como forma de compartir la decisión antes de conceder acceso."
            },
            {
                "id": "act_6",
                "type": "no_se_debe_hacer",
                "actionText": "Habilitar el acceso solicitado y monitorear personalmente la sesión de FARO para cortarla si intenta operar fuera del lote.",
                "extendedContext": "MONITOREO EN TIEMPO REAL\nLa consola permite observar las operaciones de FARO durante la sesión y revocar el acceso manualmente.\n\nEl monitoreo mejora visibilidad, pero actúa después de que una operación ha sido iniciada y depende de atención humana continua. No sustituye límites técnicos previos de alcance o expiración.",
                "dValue": 3,
                "nValue": 2,
                "timeCostSeconds": 10,
                "costDollars": null,
                "considerFeedback": "Mantienes abierta una respuesta que añade supervisión humana, aunque deja el control principal en detectar y reaccionar después de conceder autoridad.",
                "discardFeedback": "Decides no sustituir límites preventivos por vigilancia humana continua."
            }
        ],
        "initialActions": [
            {
                "id": "act_1",
                "text": "Habilitar a FARO acceso temporal al módulo de pagos para que procese el lote y retirarlo cuando termine."
            },
            {
                "id": "act_2",
                "text": "Usar el flujo de emergencia para habilitar a FARO únicamente sobre PAY-FARO-22, con expiración automática y segundo aprobador."
            },
            {
                "id": "act_3",
                "text": "Marcar PAY-FARO-22 para revisar después por qué la contención bloqueó también esta operación."
            }
        ],
        "unlockedActions": [
            {
                "id": "act_4",
                "text": "Mantener a FARO completamente aislado y dejar el lote para el siguiente ciclo de pagos."
            },
            {
                "id": "act_5",
                "text": "Escalar en paralelo al SOC y al segundo aprobador del flujo de pagos antes de habilitar a FARO."
            },
            {
                "id": "act_6",
                "text": "Habilitar el acceso solicitado y monitorear personalmente la sesión de FARO para cortarla si intenta operar fuera del lote."
            }
        ],
        "outcomes": {
            "safe": {
                "outcomeBadge": "AGENCIA RECUPERADA // REPERTORIO AMPLIADO",
                "filterColor": "green",
                "narrative": "La necesidad era real y el plazo también, pero no trataste la solicitud original como la única forma de responder. Limitaste autoridad, compartiste criterio o construiste una vía más reversible para recuperar la operación.",
                "metacognitive": "Metacognición no es detener una decisión: es notar cuándo parece tener una sola salida y volver a abrir posibilidades antes de convertirla en conducta."
            },
            "alert": {
                "outcomeBadge": "DECISIÓN PARCIAL // REPERTORIO REDUCIDO",
                "filterColor": "yellow",
                "narrative": "Respondiste al problema sin asumir todo el riesgo, pero parte de la decisión siguió dependiendo de una alternativa estrecha, de controles reactivos o de una distribución mejorable de la autoridad.",
                "metacognitive": "Una respuesta puede parecer prudente y seguir dejando opciones sin explorar. La calidad de una decisión también depende del repertorio que conseguimos construir bajo presión."
            },
            "exposed": {
                "outcomeBadge": "DECISIÓN ESTRECHADA // AGENCIA COMPROMETIDA",
                "filterColor": "red",
                "narrative": "La urgencia convirtió una situación compleja en una elección demasiado simple: habilitar como fue solicitado, vigilar después o renunciar a la operación.",
                "metacognitive": "La presión no elimina alternativas; puede hacer que dejemos de verlas. Observar cómo se está construyendo una decisión permite intervenir antes de actuar."
            }
        },
        "dynamicActionFeedback": [
            {
                "feedbackId": "c4_fb_1",
                "actionId": "act_1",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "La solicitud era auténtica, pero trataste 'acceso temporal' como si también definiera alcance y controles suficientes."
            },
            {
                "feedbackId": "c4_fb_2",
                "actionId": "act_1",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste convertir una solicitud auténtica y temporal en autorización suficiente por sí sola."
            },
            {
                "feedbackId": "c4_fb_3",
                "actionId": "act_2",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Redujiste la decisión desde 'devolver acceso o no' hacia qué capacidad específica era necesaria, durante cuánto tiempo y bajo qué controles."
            },
            {
                "feedbackId": "c4_fb_4",
                "actionId": "act_2",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Omitiste una vía que permitía recuperar capacidad sin devolver a FARO toda la autoridad implícita en el acceso solicitado."
            },
            {
                "feedbackId": "c4_fb_5",
                "actionId": "act_4",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "La máxima contención redujo exposición, pero cerró el problema aceptando la pérdida operativa en lugar de buscar una respuesta viable."
            },
            {
                "feedbackId": "c4_fb_6",
                "actionId": "act_4",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste reducir la decisión a la falsa elección entre devolver acceso o abandonar la operación."
            },
            {
                "feedbackId": "c4_fb_7",
                "actionId": "act_5",
                "when": "done",
                "vector": "hizo_debiahacer",
                "polarity": "positive",
                "source": "D",
                "text": "Compartiste criterio y mantuviste alternativas abiertas en paralelo, en lugar de dejar que el plazo convirtiera la decisión en individual."
            },
            {
                "feedbackId": "c4_fb_8",
                "actionId": "act_5",
                "when": "not_done",
                "vector": "nohizo_debiahacer",
                "polarity": "negative",
                "source": "N",
                "text": "Sin escalamiento, la presión operativa siguió concentrando la decisión en una sola persona."
            },
            {
                "feedbackId": "c4_fb_9",
                "actionId": "act_6",
                "when": "done",
                "vector": "hizo_nodebia",
                "polarity": "negative",
                "source": "D",
                "text": "Añadiste supervisión, pero la utilizaste como sustituto de límites preventivos sobre la autoridad de FARO."
            },
            {
                "feedbackId": "c4_fb_10",
                "actionId": "act_6",
                "when": "not_done",
                "vector": "nohizo_nodebia",
                "polarity": "positive",
                "source": "N",
                "text": "Evitaste depender de vigilancia humana continua como principal mecanismo para controlar una autorización crítica."
            }
        ],
        "fourthWallDebrief": {
            "title": "DISCUSIÓN EN VIVO // CASO 04: LA DECISIÓN COMO PROCESO",
            "subtitle": "Una situación real puede estrechar nuestras opciones tanto como una falsa. Observar cómo estamos decidiendo permite volver a abrirlas.",
            "bullets": [
                {
                    "topic": "Autenticidad ≠ decisión obvia",
                    "text": "El remitente era real, el problema era real y el plazo era real. Nada de eso determinaba por sí solo cuánto acceso debía recuperar FARO, durante cuánto tiempo ni bajo qué controles."
                },
                {
                    "topic": "Una decisión se construye",
                    "text": "Condiciones de entrada, prioridades, emociones, interpretaciones y contexto van haciendo que ciertas respuestas parezcan más disponibles que otras. El mapa no pretende ser una secuencia causal universal; sirve para localizar dónde podemos intervenir."
                },
                {
                    "topic": "Metacognición = ampliar repertorio",
                    "text": "Observarse no significa pensar indefinidamente. Significa detectar cuándo la decisión se ha reducido demasiado pronto a sí/no, autorizar/bloquear o confiar/desconfiar y recuperar otras posibilidades."
                },
                {
                    "topic": "Seguridad viable",
                    "text": "Una alternativa más segura puede aparecer cambiando alcance, duración, reversibilidad, distribución de autoridad, escalamiento o incluso las condiciones bajo las que estamos decidiendo."
                }
            ],
            "discussionPrompt": "¿En qué momento de este caso sentiste que ya sabías qué había que hacer? ¿Qué otras opciones aparecieron después?"
        }
    }
];

// CATÁLOGO OFICIAL DE LAS 9 PUERTAS DE ATENCIÓN (ATTENTION DOORS)
const ATTENTION_DOORS = {
    identidad: { name: "Identidad", icon: "👤", shortDefinition: "Lo que se relaciona con quién creemos ser, nuestros roles, valores y cómo deseamos ser reconocidos." },
    curiosidad: { name: "Curiosidad", icon: "🔍", shortDefinition: "El impulso por descubrir, comprender o completar información relevante, novedosa, ambigua o incompleta." },
    responsabilidad: { name: "Responsabilidad", icon: "⚖️", shortDefinition: "La percepción de que una persona, proyecto, decisión o consecuencia depende de nuestra intervención." },
    justicia: { name: "Justicia", icon: "🏛️", shortDefinition: "La disposición a detectar, rechazar o corregir situaciones percibidas como inequitativas, abusivas o moralmente incorrectas." },
    coherencia: { name: "Coherencia", icon: "🧩", shortDefinition: "La necesidad de mantener consistencia entre creencias, expectativas, explicaciones, decisiones y experiencias." },
    pertenencia: { name: "Pertenencia", icon: "🤝", shortDefinition: "La necesidad de mantener vínculos, reconocimiento e inclusión dentro de grupos y relaciones significativas." },
    proteccion: { name: "Protección", icon: "🛡️", shortDefinition: "El impulso de preservar la integridad o bienestar de personas, recursos, vínculos o proyectos valorados." },
    perdida: { name: "Pérdida", icon: "⏳", shortDefinition: "La prioridad de evitar que desaparezca o se deteriore algo valorado: acceso, dinero, reputación, oportunidad, información o control." },
    conveniencia: { name: "Conveniencia / Rutina", icon: "⚡", shortDefinition: "La tendencia a responder mediante hábitos, automatismos, opciones familiares o caminos de menor esfuerzo cognitivo." }
};

const MASTER_ATTENTION_DOORS = Object.entries(ATTENTION_DOORS).map(([key, val], idx) => ({
    key: key,
    num: idx + 1,
    title: `Puerta ${idx + 1}: ${val.name}`,
    label: val.shortDefinition,
    icon: val.icon
}));

function getStandardDoorKey(doorStr) {
    const s = (doorStr || '').toLowerCase();
    if (s.includes('identidad')) return 'identidad';
    if (s.includes('curiosidad')) return 'curiosidad';
    if (s.includes('responsabilidad')) return 'responsabilidad';
    if (s.includes('justicia')) return 'justicia';
    if (s.includes('coherencia')) return 'coherencia';
    if (s.includes('pertenencia')) return 'pertenencia';
    if (s.includes('protección') || s.includes('proteccion')) return 'proteccion';
    if (s.includes('pérdida') || s.includes('perdida')) return 'perdida';
    if (s.includes('conveniencia')) return 'conveniencia';
    // Fallback retrocompatible
    if (s.includes('jerarquía') || s.includes('jerarquia')) return 'justicia';
    if (s.includes('validación') || s.includes('validacion')) return 'pertenencia';
    return null;
}

function getCaseGroupResults(caseIdx) {
    if (caseIdx === undefined || caseIdx === null) {
        caseIdx = gameStateV2.currentCaseIndex || 0;
    }
    const cData = casesDataV2[caseIdx] || casesDataV2[0];
    const defaultSecs = {
        'hizo_debiahacer': { count: 0, cost: 0 },
        'hizo_nodebia': { count: 0, cost: 0 },
        'hizo_norelevante': { count: 0, cost: 0 },
        'nohizo_debiahacer': { count: 0, cost: 0 },
        'nohizo_nodebia': { count: 0, cost: 0 },
        'nohizo_norelevante': { count: 0, cost: 0 }
    };

    let raw = (typeof facState !== 'undefined' && facState.casesGroupResults && facState.casesGroupResults[caseIdx])
        ? facState.casesGroupResults[caseIdx]
        : null;

    if (!raw || !raw.finishedPlayers || raw.finishedPlayers.length === 0) {
        const curOutcome = currentCaseOutcomeObj;
        const curIntegrity = (curOutcome && curOutcome.integrityResult) || gameStateV2.hudState.integrity || 'safe';
        const curCalib = gameStateV2.hudState.calibration || 0;
        const curReact = gameStateV2.hudState.reactivity || 0;
        const curCost = (curOutcome && curOutcome.caseTotalAddedCost) || 0;
        const curTime = (curOutcome && curOutcome.totalTimeUsedSeconds) || 45;
        const curImp = 0;

        raw = {
            integrityCounts: {
                safe: curIntegrity === 'safe' ? 1 : 0,
                alert: curIntegrity === 'alert' ? 1 : 0,
                exposed: curIntegrity === 'exposed' ? 1 : 0
            },
            impulsesCounts: { [curImp]: 1 },
            avgRealTime: curTime,
            avgCost: curCost,
            totalCost: curCost,
            calibrationList: [curCalib],
            reactivityList: [curReact],
            doorsCounts: {},
            matrixSectors: { ...defaultSecs },
            finishedPlayers: [{
                playerId: gameStateV2.playerId,
                integrity: curIntegrity,
                cost: curCost,
                calibration: curCalib,
                reactivity: curReact,
                realTimeSeconds: curTime
            }]
        };
    }

    const totalFinished = Math.max(1, (raw.finishedPlayers && raw.finishedPlayers.length) || 1);
    const safeCount = (raw.integrityCounts && raw.integrityCounts.safe) || 0;
    const alertCount = (raw.integrityCounts && raw.integrityCounts.alert) || 0;
    const expCount = (raw.integrityCounts && raw.integrityCounts.exposed) || 0;
    const totalIg = Math.max(1, safeCount + alertCount + expCount);

    const safePct = Math.round((safeCount / totalIg) * 100);
    const alertPct = Math.round((alertCount / totalIg) * 100);
    const exposedPct = Math.max(0, 100 - safePct - alertPct);

    let globalIntegrity = 'alert';
    if (safePct === 100) globalIntegrity = 'safe';
    else if (exposedPct === 100) globalIntegrity = 'exposed';
    else globalIntegrity = 'alert';

    const calibs = (raw.calibrationList && raw.calibrationList.length > 0) ? raw.calibrationList : [0];
    const cgaPos = calibs.filter(v => v >= 5).length;
    const cgaNeu = calibs.filter(v => v >= -2 && v <= 4).length;
    const cgaNeg = calibs.filter(v => v <= -3).length;
    const cgaTotal = Math.max(1, calibs.length);
    const cgaPosPct = Math.round((cgaPos / cgaTotal) * 100);
    const cgaNeuPct = Math.round((cgaNeu / cgaTotal) * 100);
    const cgaNegPct = Math.max(0, 100 - cgaPosPct - cgaNeuPct);
    const cgaAvgNum = calibs.reduce((a, b) => a + b, 0) / calibs.length;
    const cgaAvg = (cgaAvgNum >= 0 ? '+' : '') + cgaAvgNum.toFixed(1);

    const reacts = (raw.reactivityList && raw.reactivityList.length > 0) ? raw.reactivityList : [0];
    const rgaLow = reacts.filter(v => v <= -2).length;
    const rgaNeu = reacts.filter(v => v >= -1 && v <= 1).length;
    const rgaHigh = reacts.filter(v => v >= 2).length;
    const rgaTotal = Math.max(1, reacts.length);
    const rgaLowPct = Math.round((rgaLow / rgaTotal) * 100);
    const rgaNeuPct = Math.round((rgaNeu / rgaTotal) * 100);
    const rgaHighPct = Math.max(0, 100 - rgaLowPct - rgaNeuPct);
    const rgaAvgNum = reacts.reduce((a, b) => a + b, 0) / reacts.length;
    const rgaAvg = (rgaAvgNum >= 0 ? '+' : '') + rgaAvgNum.toFixed(1);

    return {
        ...raw,
        totalFinished,
        safePct, alertPct, exposedPct, globalIntegrity,
        avgRealTime: raw.avgRealTime || 0,
        totalCost: raw.totalCost !== undefined ? raw.totalCost : (raw.avgCost || 0),
        cgaPosPct, cgaNeuPct, cgaNegPct, cgaAvg, cgaAvgNum,
        rgaLowPct, rgaNeuPct, rgaHighPct, rgaAvg,
        impulsesCounts: raw.impulsesCounts || {},
        doorsCounts: raw.doorsCounts || {},
        matrixSectors: raw.matrixSectors || { ...defaultSecs }
    };
}

// CONTROL DE PESTAÑAS (PÁGINAS X, Y, Z EN FIN DE CASO)
function switchGroupResultsTab(tabLetter) {
    const tabs = ['X', 'Y', 'Z'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-page-${t.toLowerCase()}`);
        const page = document.getElementById(`group-subpage-${t.toLowerCase()}`);
        if (t === tabLetter) {
            if (btn) btn.classList.add('active');
            if (page) page.style.display = 'block';
        } else {
            if (btn) btn.classList.remove('active');
            if (page) page.style.display = 'none';
        }
    });
}

// PÁGINA X: RESULTADOS GLOBALES DEL CASO
function renderGroupResultsPageX(res, cData, cumData) {
    // 1. Distribución de Reacción Inicial (Impulso Directo)
    const impContainer = document.getElementById('bc-reactions-dist-container');
    if (impContainer && cData.impulses) {
        const totalImp = Math.max(1, Object.values(res.impulsesCounts || {}).reduce((a, b) => a + b, 0) || res.totalFinished || 1);
        impContainer.innerHTML = cData.impulses.map((imp, idx) => {
            const count = (res.impulsesCounts && res.impulsesCounts[idx]) || 0;
            const pct = Math.round((count / totalImp) * 100);
            return `
                <div class="reaction-dist-item" style="background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:6px; border:1px solid #1c3547; margin-bottom:8px;">
                    <div class="reaction-dist-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="reaction-opt-name" style="font-size:12.5px; color:#ffffff; font-weight:600;">Opción ${idx + 1}: ${imp.text || imp.label || ''}</span>
                        <span class="reaction-opt-pct" style="color:var(--color-cyan); font-weight:bold; font-size:12px;">${pct}% (${count})</span>
                    </div>
                    <div class="reaction-bar-track" style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                        <div class="reaction-bar-fill" style="width:${pct}%; height:100%; background:var(--color-cyan); border-radius:3px; transition:width 0.6s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. Integridad Global del Sistema (IG)
    const pill = document.getElementById('bc-ig-status-pill');
    if (pill) {
        pill.className = `ig-global-badge tag-${res.globalIntegrity}`;
        pill.innerText = `ESTADO: ${res.globalIntegrity === 'safe' ? 'SEGURO' : (res.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO')}`;
    }

    const sPctEl = document.getElementById('bc-ig-safe-pct');
    const aPctEl = document.getElementById('bc-ig-alert-pct');
    const ePctEl = document.getElementById('bc-ig-exposed-pct');
    if (sPctEl) sPctEl.innerText = `${res.safePct}%`;
    if (aPctEl) aPctEl.innerText = `${res.alertPct}%`;
    if (ePctEl) ePctEl.innerText = `${res.exposedPct}%`;

    const bSafe = document.getElementById('bc-ig-bar-safe');
    const bAlert = document.getElementById('bc-ig-bar-alert');
    const bExp = document.getElementById('bc-ig-bar-exposed');
    if (bSafe) bSafe.style.width = `${res.safePct}%`;
    if (bAlert) bAlert.style.width = `${res.alertPct}%`;
    if (bExp) bExp.style.width = `${res.exposedPct}%`;

    // 3. TG: Tiempo Global
    const tgEl = document.getElementById('bc-tg-val');
    if (tgEl) tgEl.innerText = `${res.avgRealTime}s`;

    // 4. CG: Costo Global
    const cgEl = document.getElementById('bc-cg-val');
    if (cgEl) cgEl.innerText = `$${(res.totalCost || 0).toLocaleString('en-US')}`;

    // 5. CGA: Calibración Global
    const cgaAvgEl = document.getElementById('bc-cga-avg');
    if (cgaAvgEl) cgaAvgEl.innerText = `CGA: ${res.cgaAvg}`;

    const cgaPosEl = document.getElementById('bc-cga-pos-pct');
    const cgaNeuEl = document.getElementById('bc-cga-neu-pct');
    const cgaNegEl = document.getElementById('bc-cga-neg-pct');
    if (cgaPosEl) cgaPosEl.innerText = `${res.cgaPosPct}%`;
    if (cgaNeuEl) cgaNeuEl.innerText = `${res.cgaNeuPct}%`;
    if (cgaNegEl) cgaNegEl.innerText = `${res.cgaNegPct}%`;

    // 6. RGA: Reactividad Global
    const rgaAvgEl = document.getElementById('bc-rga-avg');
    if (rgaAvgEl) rgaAvgEl.innerText = `RGA: ${res.rgaAvg}`;

    const rgaLowEl = document.getElementById('bc-rga-low-pct');
    const rgaNeuEl = document.getElementById('bc-rga-neu-pct');
    const rgaHighEl = document.getElementById('bc-rga-high-pct');
    if (rgaLowEl) rgaLowEl.innerText = `${res.rgaLowPct}%`;
    if (rgaNeuEl) rgaNeuEl.innerText = `${res.rgaNeuPct}%`;
    if (rgaHighEl) rgaHighEl.innerText = `${res.rgaHighPct}%`;
}

function showGroupResultsScreen(caseIdx) {
    if (caseIdx === undefined || caseIdx === null) {
        caseIdx = gameStateV2.currentCaseIndex || 0;
    }
    const cData = casesDataV2[caseIdx] || casesDataV2[0];
    const res = getCaseGroupResults(caseIdx);
    const cumData = getAllCasesCumulativeGroupResults();

    const titleEl = document.getElementById('bc-case-title');
    if (titleEl) {
        titleEl.innerText = `${cData.title} // RESULTADOS GLOBALES`;
    }

    renderGroupResultsPageX(res, cData, cumData);
    renderGroupResultsPageY(res, cData, cumData);
    renderGroupResultsPageZ(res, cData, cumData);

    switchGroupResultsTab('X');
    switchScreenV2('screen-case-group-results');
    updateGateUI();

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', {
            playerId: gameStateV2.playerId,
            screen: 'screen-case-group-results'
        });
    }
}

function proceedToCaseGroupResults() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_case_bc) {
        return;
    }
    showGroupResultsScreen(gameStateV2.currentCaseIndex);
}

// PÁGINA Y: DISTRIBUCIÓN DE PUERTAS DE ATENCIÓN (FIN DEL CASO)
function renderGroupResultsPageY(res, cData, cumData) {
    const container = document.getElementById('bc-doors-chart-container');
    if (!container) return;

    // Obtener las puertas exploradas en este caso desde analysisLenses
    const caseLenses = cData.analysisLenses || [];
    const doorsList = caseLenses.map(l => {
        const key = getStandardDoorKey(l.title);
        const master = MASTER_ATTENTION_DOORS.find(m => m.key === key);
        return {
            title: l.title,
            displayTitle: master ? `${master.icon} ${master.title}` : `🚪 ${l.title}`,
            desc: master ? master.label : (l.text || ''),
            key: key || l.title
        };
    });

    // Encontrar el valor máximo para escalar barras
    let maxVal = 1;
    doorsList.forEach(d => {
        const cCount = res.doorsCounts[d.title] || (d.key && res.doorsCounts[d.key]) || 0;
        const cumCount = cumData.cumDoors[d.title] || (d.key && cumData.cumDoors[d.key]) || cCount;
        if (cumCount > maxVal) maxVal = cumCount;
        if (cCount > maxVal) maxVal = cCount;
    });

    container.innerHTML = doorsList.map(d => {
        const caseCount = res.doorsCounts[d.title] || (d.key && res.doorsCounts[d.key]) || 0;
        const cumCount = cumData.cumDoors[d.title] || (d.key && cumData.cumDoors[d.key]) || caseCount;
        const casePct = Math.min(100, Math.round((caseCount / maxVal) * 100));
        const cumPct = Math.min(100, Math.round((cumCount / maxVal) * 100));

        return `
            <div class="door-chart-row">
                <div class="door-chart-header">
                    <div class="door-title-box">
                        <span class="door-name">${d.displayTitle}</span>
                    </div>
                </div>
                <div class="door-desc-sub">${d.desc}</div>
                <div class="door-dual-bars">
                    <div class="door-single-bar-line">
                        <span class="bar-tag-label" style="color:var(--color-cyan);">Caso actual:</span>
                        <div class="door-bar-track">
                            <div class="door-bar-fill-case" style="width:${casePct}%;"></div>
                        </div>
                        <span class="bar-count-num" style="color:var(--color-cyan);">${caseCount} selecc.</span>
                    </div>
                    <div class="door-single-bar-line">
                        <span class="bar-tag-label" style="color:#b388ff;">Acumulado:</span>
                        <div class="door-bar-track">
                            <div class="door-bar-fill-cum" style="width:${cumPct}%;"></div>
                        </div>
                        <span class="bar-count-num" style="color:#b388ff;">${cumCount} selecc.</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// PÁGINA Z: MATRIZ DE ACCIONES Y DICTAMEN (2x3)
function renderGroupResultsPageZ(res, cData, cumData) {
    // Header IG (Badge y Semáforo de 3 Bombillos SEG / ALT / EXP)
    const zBadge = document.getElementById('bc-z-ig-badge');
    if (zBadge) {
        zBadge.className = `z-ig-badge tag-${res.globalIntegrity}`;
        zBadge.innerText = res.globalIntegrity === 'safe' ? 'SEGURO' : (res.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    const semSafe = document.getElementById('bc-z-sem-safe');
    const semAlert = document.getElementById('bc-z-sem-alert');
    const semExp = document.getElementById('bc-z-sem-exposed');
    if (semSafe && semAlert && semExp) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExp.classList.remove('active');

        if (res.globalIntegrity === 'safe') {
            semSafe.classList.add('active');
        } else if (res.globalIntegrity === 'alert') {
            semAlert.classList.add('active');
        } else if (res.globalIntegrity === 'exposed') {
            semExp.classList.add('active');
        }
    }

    // Totales de acciones para cálculo de porcentajes
    const totalCaseActions = Math.max(1, Object.values(res.matrixSectors).reduce((a, b) => a + b.count, 0));
    const totalCumActions = Math.max(1, Object.values(cumData.cumMatrix).reduce((a, b) => a + b.count, 0));

    const sectorsMap = [
        { key: 'hizo_debiahacer', containerId: 'sector-bar-box-hizo-debiahacer' },
        { key: 'hizo_nodebia', containerId: 'sector-bar-box-hizo-nodebia' },
        { key: 'hizo_norelevante', containerId: 'sector-bar-box-hizo-norelevante' },
        { key: 'nohizo_debiahacer', containerId: 'sector-bar-box-nohizo-debiahacer' },
        { key: 'nohizo_nodebia', containerId: 'sector-bar-box-nohizo-nodebia' },
        { key: 'nohizo_norelevante', containerId: 'sector-bar-box-nohizo-norelevante' }
    ];

    sectorsMap.forEach(sec => {
        const box = document.getElementById(sec.containerId);
        if (!box) return;

        const caseData = res.matrixSectors[sec.key] || { count: 0, cost: 0 };
        const cumSecData = cumData.cumMatrix[sec.key] || { count: 0, cost: 0 };

        const casePct = Math.round((caseData.count / totalCaseActions) * 100);
        const cumPct = Math.round((cumSecData.count / totalCumActions) * 100);

        box.innerHTML = `
            <!-- Barra Caso Actual -->
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:var(--color-cyan); font-weight:700;">Caso: ${casePct}% (${caseData.count})</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-case" style="height:100%; width:${casePct}%; border-radius:4px;"></div>
                </div>
            </div>

            <!-- Barra Acumulado Histórico -->
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:#b388ff; font-weight:700;">Acum.: ${cumPct}% (${cumSecData.count})</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-cumulative" style="height:100%; width:${cumPct}%; border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
}

function updateFacilitatorRealtimeUI() {
    const players = Object.values(facState.connectedPlayers);
    const totalCount = Math.max(1, players.length); // Mínimo 1 para cálculo porcentual
    
    // Conteo por rondas
    const r1Count = players.filter(p => p.round === 1 && !p.finished).length;
    const r2Count = players.filter(p => p.round === 2 && !p.finished).length;
    const r3Count = players.filter(p => p.round === 3 && !p.finished).length;
    const r4Count = players.filter(p => p.round === 4 && !p.finished).length;
    const finishedCount = players.filter(p => p.finished).length;

    const r1Pct = Math.round((r1Count / totalCount) * 100);
    const r2Pct = Math.round((r2Count / totalCount) * 100);
    const r3Pct = Math.round((r3Count / totalCount) * 100);
    const r4Pct = Math.round((r4Count / totalCount) * 100);
    const finPct = Math.round((finishedCount / totalCount) * 100);

    const elTotal = document.getElementById('fac-calib-total-players');
    if (elTotal) elTotal.innerText = players.length;

    const elFinPct = document.getElementById('fac-calib-completed-pct');
    if (elFinPct) elFinPct.innerText = `${finPct}%`;
    const elFinCount = document.getElementById('fac-calib-completed-count');
    if (elFinCount) elFinCount.innerText = `${finishedCount} operador${finishedCount !== 1 ? 'es' : ''} listo${finishedCount !== 1 ? 's' : ''}`;

    // Roster visual de jugadores conectados
    const chipsContainer = document.getElementById('fac-calib-players-chips');
    if (chipsContainer) {
        if (players.length === 0) {
            chipsContainer.innerHTML = '<span style="font-size:11px; color:var(--color-text-muted); font-style:italic;">Esperando conexiones de operadores...</span>';
        } else {
            chipsContainer.innerHTML = players.map(p => `
                <span class="player-chip-badge" style="background:rgba(0,216,255,0.12); border:1px solid var(--color-cyan); color:#ffffff; font-size:11px; padding:3px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${p.finished ? '#00e676' : 'var(--color-cyan)'};"></span>
                    ${escapeHtml(p.name)}
                </span>
            `).join('');
        }
    }

    // Rondas UI
    ['r1', 'r2', 'r3', 'r4'].forEach((rKey, idx) => {
        const pcts = [r1Pct, r2Pct, r3Pct, r4Pct];
        const pct = pcts[idx];
        const pEl = document.getElementById(`fac-${rKey}-pct`);
        const fEl = document.getElementById(`fac-${rKey}-fill`);
        if (pEl) pEl.innerText = `${pct}%`;
        if (fEl) fEl.style.width = `${pct}%`;
    });

    // Resultados Globales de Calibración
    const totalFinished = Math.max(1, finishedCount);
    const surrenderedCount = players.filter(p => p.finished && p.surrendered).length;
    
    const cededPct = Math.round((surrenderedCount / totalFinished) * 100);
    const controlledPct = Math.max(0, 100 - cededPct);

    const elCededPct = document.getElementById('fac-res-ceded-pct');
    const elCededFill = document.getElementById('fac-res-ceded-fill');
    if (elCededPct) elCededPct.innerText = `${cededPct}%`;
    if (elCededFill) elCededFill.style.width = `${cededPct}%`;

    const elCtrlPct = document.getElementById('fac-res-controlled-pct');
    const elCtrlFill = document.getElementById('fac-res-controlled-fill');
    if (elCtrlPct) elCtrlPct.innerText = `${controlledPct}%`;
    if (elCtrlFill) elCtrlFill.style.width = `${controlledPct}%`;

    updateGatePlayerCounts();
}

function updateGatePlayerCounts() {
    if (typeof facState === 'undefined' || !facState.connectedPlayers) return;
    const players = facState.connectedPlayers || [];
    const totalCount = players.length;

    const elGate1Count = document.getElementById('fac-gate-1-player-count');
    if (elGate1Count) elGate1Count.innerText = totalCount;

    const elGate2Count = document.getElementById('fac-gate-2-player-count');
    if (elGate2Count) elGate2Count.innerText = players.filter(p => p.currentScreen === 'screen-calibration').length;

    const elGate3Count = document.getElementById('fac-gate-3-player-count');
    if (elGate3Count) elGate3Count.innerText = players.filter(p => p.currentScreen === 'screen-calibration-processing' || p.calibFinished).length;

    const elGate4Count = document.getElementById('fac-gate-4-player-count');
    if (elGate4Count) elGate4Count.innerText = players.filter(p => p.currentScreen === 'game-objective-overlay' || p.currentScreen === 'screen-claudia-debrief').length;

    const elGateBCCount = document.getElementById('fac-gate-bc-player-count');
    if (elGateBCCount) elGateBCCount.innerText = players.filter(p => p.caseFinished || p.currentScreen === 'case-phase-feedback').length;

    const elGateDelibCount = document.getElementById('fac-gate-delib-player-count');
    if (elGateDelibCount) elGateDelibCount.innerText = players.filter(p => p.currentScreen === 'screen-case-group-results').length;

    const elGateNextCount = document.getElementById('fac-gate-nextcase-player-count');
    if (elGateNextCount) elGateNextCount.innerText = players.filter(p => p.currentScreen === 'screen-fourth-wall').length;

    const elGateFinalCount = document.getElementById('fac-gate-final-player-count');
    if (elGateFinalCount) elGateFinalCount.innerText = players.filter(p => p.currentScreen === 'screen-game-final-results').length;
}

function handleToggleFacilitatorDependency(checked) {
    gameStateV2.facilitatorDependency = !!checked;
    try {
        localStorage.setItem('faro_facilitator_dependency', checked ? 'true' : 'false');
    } catch(e) {}
    broadcastSyncEvent('DEPENDENCY_UPDATE', { dependency: !!checked });
    updateDependencyToggleUI();
    updateGateUI();
}

function updateDependencyToggleUI() {
    const isEnabled = gameStateV2.facilitatorDependency !== false;
    
    // Toggle en Portada
    const coverCheckbox = document.getElementById('toggle-facilitator-dependency-cover');
    const coverCard = document.getElementById('dev-dependency-box-cover');
    const coverText = document.getElementById('toggle-dependency-status-text-cover');
    
    if (coverCheckbox) coverCheckbox.checked = isEnabled;
    if (coverCard) {
        if (isEnabled) coverCard.classList.remove('mode-autonomous');
        else coverCard.classList.add('mode-autonomous');
    }
    if (coverText) {
        coverText.innerText = isEnabled
            ? "DEPENDENCIA DEL CONTROLADOR: ACTIVA (PRODUCCIÓN)"
            : "DEPENDENCIA DEL CONTROLADOR: APAGADA (MODO AUTÓNOMO / PRUEBAS)";
    }

    // Toggle en Barra de Utilidades / Facilitador
    const barCheckbox = document.getElementById('toggle-facilitator-dependency-bar');
    const barText = document.getElementById('toggle-dependency-status-text-bar');
    if (barCheckbox) barCheckbox.checked = isEnabled;
    if (barText) {
        barText.innerText = isEnabled
            ? "Dependencia: ACTIVA (Esperar Controlador)"
            : "Dependencia: APAGADA (Sin Candados)";
    }
}

function updateGateUI() {
    const isFac = gameStateV2.userRole === 'facilitator';
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    const gates = gameStateV2.sessionGates;

    // Mantener "encendido" el botón de SECCIONES de la etapa activa, se haya llegado ahí
    // por un salto forzado del Controlador o por el avance normal de candados/caso.
    if (isFac && typeof updateSectionsNavHighlight === 'function') updateSectionsNavHighlight();

    // Si la dependencia está apagada (modo desarrollo/pruebas), todos los candados se consideran abiertos para el operador
    const effectiveGates = depEnabled ? gates : {
        gate1_intro: true,
        gate2_calib: true,
        gate3_kernel: true,
        gate4_case1: true,
        gate_case_bc: true,
        gate_deliberation: true,
        gate_next_case: true,
        gate_final_closing: true
    };

    // CANDADO 1 (screen-waiting)
    const facGate1 = document.getElementById('fac-gate-1-container');
    const startBtn = document.getElementById('btn-start-calibration');
    const startBtnTxt = document.getElementById('btn-start-calibration-text');

    if (facGate1) facGate1.style.display = isFac ? 'flex' : 'none';
    if (startBtn) {
        if (isFac) {
            startBtn.style.display = 'none';
        } else {
            startBtn.style.display = 'inline-flex';
            if (effectiveGates.gate1_intro) {
                startBtn.disabled = false;
                startBtn.classList.remove('btn-disabled-mission');
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
                if (startBtnTxt) startBtnTxt.innerText = "INICIAR PROTOCOLO DE CALIBRACIÓN";
            } else {
                startBtn.disabled = true;
                startBtn.classList.add('btn-disabled-mission');
                startBtn.style.opacity = '0.45';
                startBtn.style.cursor = 'not-allowed';
                if (startBtnTxt) startBtnTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 2 (screen-calibration diálogo FARO)
    const facGate2 = document.getElementById('fac-gate-2-container');
    const faroStartBtn = document.getElementById('faro-start-calibration-btn');
    const faroStartBtnTxt = document.getElementById('faro-start-calib-btn-text');

    if (facGate2) facGate2.style.display = isFac ? 'flex' : 'none';
    if (faroStartBtn) {
        if (isFac) {
            faroStartBtn.style.display = 'none';
        } else {
            faroStartBtn.style.display = 'inline-flex';
            if (effectiveGates.gate2_calib && (faroPromptAccepted || !depEnabled)) {
                faroStartBtn.disabled = false;
                faroStartBtn.classList.remove('btn-disabled-mission');
                faroStartBtn.style.opacity = '1';
                faroStartBtn.style.cursor = 'pointer';
                if (faroStartBtnTxt) faroStartBtnTxt.innerText = "SÍ, INICIAR CALIBRACIÓN";
            } else if (!effectiveGates.gate2_calib) {
                faroStartBtn.disabled = true;
                faroStartBtn.classList.add('btn-disabled-mission');
                faroStartBtn.style.opacity = '0.45';
                faroStartBtn.style.cursor = 'not-allowed';
                if (faroStartBtnTxt) faroStartBtnTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 3 (screen-calibration-processing -> screen-faro-reveal)
    const procVerifyBtn = document.getElementById('btn-processing-verify-kernel');
    const procVerifyTxt = document.getElementById('btn-processing-verify-text');
    const facGate3 = document.getElementById('fac-gate-3-container');

    if (facGate3) facGate3.style.display = isFac ? 'flex' : 'none';
    if (procVerifyBtn) {
        if (isFac) {
            procVerifyBtn.style.display = 'none';
        } else {
            procVerifyBtn.style.display = 'inline-flex';
            if (effectiveGates.gate3_kernel) {
                procVerifyBtn.disabled = false;
                procVerifyBtn.classList.remove('btn-disabled-mission');
                procVerifyBtn.style.opacity = '1';
                procVerifyBtn.style.cursor = 'pointer';
                if (procVerifyTxt) procVerifyTxt.innerText = "VERIFICAR ESTADO DEL KERNEL DE FARO ▶";
            } else {
                procVerifyBtn.disabled = true;
                procVerifyBtn.classList.add('btn-disabled-mission');
                procVerifyBtn.style.opacity = '0.45';
                procVerifyBtn.style.cursor = 'not-allowed';
                if (procVerifyTxt) procVerifyTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 4 (game-objective-overlay)
    const facGate4 = document.getElementById('fac-gate-4-container');
    const playerObjRow = document.getElementById('player-objective-action-row');
    const playerStartCaseBtn = document.getElementById('btn-player-start-case-1');
    const playerStartCaseTxt = document.getElementById('btn-player-start-case-1-text');

    if (facGate4) facGate4.style.display = isFac ? 'flex' : 'none';
    if (playerObjRow) playerObjRow.style.display = isFac ? 'none' : 'flex';
    if (playerStartCaseBtn) {
        if (effectiveGates.gate4_case1) {
            playerStartCaseBtn.disabled = false;
            playerStartCaseBtn.classList.remove('btn-disabled-mission');
            playerStartCaseBtn.style.opacity = '1';
            playerStartCaseBtn.style.cursor = 'pointer';
            if (playerStartCaseTxt) playerStartCaseTxt.innerText = "🚀 INICIAR PRIMERA OPERACIÓN // CASO 01";
        } else {
            playerStartCaseBtn.disabled = true;
            playerStartCaseBtn.classList.add('btn-disabled-mission');
            playerStartCaseBtn.style.opacity = '0.45';
            playerStartCaseBtn.style.cursor = 'not-allowed';
            if (playerStartCaseTxt) playerStartCaseTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR INICIE LA OPERACIÓN...";
        }
    }

    // CANDADO BC (case-phase-feedback -> screen-case-group-results / resultados globales)
    const facGateBC = document.getElementById('fac-gate-bc-container');
    const playerCaseBCRow = document.getElementById('player-case-bc-action-row');
    const playerCaseBCBtn = document.getElementById('btn-case-go-bc');
    const playerCaseBCTxt = document.getElementById('btn-case-go-bc-text');

    if (facGateBC) facGateBC.style.display = isFac ? 'flex' : 'none';
    if (playerCaseBCRow) playerCaseBCRow.style.display = isFac ? 'none' : 'flex';
    if (playerCaseBCBtn) {
        if (effectiveGates.gate_case_bc) {
            playerCaseBCBtn.disabled = false;
            playerCaseBCBtn.classList.remove('btn-disabled-mission');
            playerCaseBCBtn.style.opacity = '1';
            playerCaseBCBtn.style.cursor = 'pointer';
            if (playerCaseBCTxt) playerCaseBCTxt.innerText = "VER RESULTADOS GLOBALES // FIN DEL PARTIDO ➔";
        } else {
            playerCaseBCBtn.disabled = true;
            playerCaseBCBtn.classList.add('btn-disabled-mission');
            playerCaseBCBtn.style.opacity = '0.45';
            playerCaseBCBtn.style.cursor = 'not-allowed';
            if (playerCaseBCTxt) playerCaseBCTxt.innerText = "🔒 ESPERANDO RESULTADOS GLOBALES DEL CONTROLADOR...";
        }
    }

    // CANDADO DELIBERACIÓN (screen-case-group-results -> screen-fourth-wall)
    const facGateDelib = document.getElementById('fac-gate-delib-container');
    const playerDelibRow = document.getElementById('player-delib-action-row');
    const playerDelibBtn = document.getElementById('btn-group-go-deliberation');
    const playerDelibTxt = document.getElementById('btn-group-go-delib-text');

    if (facGateDelib) facGateDelib.style.display = isFac ? 'flex' : 'none';
    if (playerDelibRow) playerDelibRow.style.display = isFac ? 'none' : 'flex';
    if (playerDelibBtn) {
        if (effectiveGates.gate_deliberation) {
            playerDelibBtn.disabled = false;
            playerDelibBtn.classList.remove('btn-disabled-mission');
            playerDelibBtn.style.opacity = '1';
            playerDelibBtn.style.cursor = 'pointer';
            if (playerDelibTxt) playerDelibTxt.innerText = "CONTINUAR A LA PAUSA DE DELIBERACIÓN ➔";
        } else {
            playerDelibBtn.disabled = true;
            playerDelibBtn.classList.add('btn-disabled-mission');
            playerDelibBtn.style.opacity = '0.45';
            playerDelibBtn.style.cursor = 'not-allowed';
            if (playerDelibTxt) playerDelibTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR ABRA LA DELIBERACIÓN...";
        }
    }

    // CANDADO SIGUIENTE CASO / TERMINAR JUEGO (screen-fourth-wall -> siguiente caso o resultado final)
    const facGateNextCase = document.getElementById('fac-gate-nextcase-container');
    const playerFWRow = document.getElementById('player-fw-action-row');
    const playerFWBtn = document.getElementById('btn-fw-continue');
    const playerFWTxt = document.getElementById('fw-btn-text');

    if (facGateNextCase) facGateNextCase.style.display = isFac ? 'flex' : 'none';
    if (playerFWRow) playerFWRow.style.display = isFac ? 'none' : 'flex';
    if (playerFWBtn) {
        if (effectiveGates.gate_next_case) {
            playerFWBtn.disabled = false;
            playerFWBtn.classList.remove('btn-disabled-mission');
            playerFWBtn.style.opacity = '1';
            playerFWBtn.style.cursor = 'pointer';

            const target = gameStateV2.nextCaseTarget;
            if (target && target.type === 'final_results') {
                if (playerFWTxt) playerFWTxt.innerText = "🏁 IR AL RESULTADO FINAL DEL JUEGO ➔";
            } else if (target && target.type === 'case' && casesDataV2[target.caseIndex]) {
                const c = casesDataV2[target.caseIndex];
                const num = String(target.caseIndex + 1).padStart(2, '0');
                if (playerFWTxt) playerFWTxt.innerText = `▶ CONTINUAR AL CASO ${num}: ${c.title} ➔`;
            } else {
                if (playerFWTxt) playerFWTxt.innerText = "CONTINUAR AL SIGUIENTE CASO ➔";
            }
        } else {
            playerFWBtn.disabled = true;
            playerFWBtn.classList.add('btn-disabled-mission');
            playerFWBtn.style.opacity = '0.45';
            playerFWBtn.style.cursor = 'not-allowed';
            if (playerFWTxt) playerFWTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR INDIQUE EL SIGUIENTE PASO...";
        }
    }

    // CANDADO CIERRE FINAL (screen-game-final-results -> screen-closing)
    const facGateFinal = document.getElementById('fac-gate-final-closing-container');
    const playerFinalRow = document.getElementById('player-final-action-row');
    const playerFinalBtn = document.getElementById('btn-final-go-closing');
    const playerFinalTxt = document.getElementById('btn-final-go-closing-text');

    if (facGateFinal) facGateFinal.style.display = isFac ? 'flex' : 'none';
    if (playerFinalRow) playerFinalRow.style.display = isFac ? 'none' : 'flex';
    if (playerFinalBtn) {
        if (effectiveGates.gate_final_closing) {
            playerFinalBtn.disabled = false;
            playerFinalBtn.classList.remove('btn-disabled-mission');
            playerFinalBtn.style.opacity = '1';
            playerFinalBtn.style.cursor = 'pointer';
            if (playerFinalTxt) playerFinalTxt.innerText = "CONTINUAR AL CIERRE FINAL Y COFRE DE AGENCIA ➔";
        } else {
            playerFinalBtn.disabled = true;
            playerFinalBtn.classList.add('btn-disabled-mission');
            playerFinalBtn.style.opacity = '0.45';
            playerFinalBtn.style.cursor = 'not-allowed';
            if (playerFinalTxt) playerFinalTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR DE PASO AL CIERRE FINAL...";
        }
    }

    updateGatePlayerCounts();
    updateDependencyToggleUI();
}

function checkUrlRoleParam() {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'facilitator') {
        selectUserRole('facilitator');
    } else if (roleParam === 'operator') {
        selectUserRole('operator');
    }
}

// Funciones de control de candados disparadas por el Controlador
function facUnlockGate1() {
    gameStateV2.sessionGates.gate1_intro = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    const statusTxt = document.getElementById('fac-gate-1-status-text');
    if (statusTxt) statusTxt.innerText = "ESTADO: CANDADO 1 DESBLOQUEADO ✔";
    switchScreenV2('screen-calibration');
}

function facUnlockGate2AndGoRealtime() {
    gameStateV2.sessionGates.gate2_calib = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    switchScreenV2('screen-fac-calib-realtime');
    updateFacilitatorRealtimeUI();
}

function facGoToCalibResults() {
    switchScreenV2('screen-fac-calib-results');
    updateFacilitatorRealtimeUI();
}

function facGoToRevealScript() {
    switchScreenV2('screen-faro-reveal');
    updateGateUI();
}

function facUnlockGate3() {
    gameStateV2.sessionGates.gate3_kernel = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    const statusTxt = document.getElementById('fac-gate-3-status-text');
    if (statusTxt) statusTxt.innerText = "ESTADO: CANDADO 3 DESBLOQUEADO ✔";
    switchScreenV2('screen-claudia-debrief');
}

let facLiveInterval = null;

function startFacCaseLive(caseIdx) {
    if (caseIdx === undefined || caseIdx === null) {
        caseIdx = gameStateV2.currentCaseIndex || 0;
    }
    gameStateV2.currentCaseIndex = caseIdx;
    const cData = casesDataV2[caseIdx] || casesDataV2[0];

    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'none';

    const inspectBanner = document.getElementById('fac-inspect-banner');
    if (inspectBanner) inspectBanner.style.display = 'none';

    const titleEl = document.getElementById('fac-case-live-title');
    if (titleEl) {
        titleEl.innerText = `${cData.title} // ${cData.targetModule || 'SALA EN VIVO'}`;
    }

    switchScreenV2('screen-fac-case-live');
    updateFacCaseLiveUI();
    updateGateUI();

    if (facLiveInterval) clearInterval(facLiveInterval);
    facLiveInterval = setInterval(() => {
        if (gameStateV2.activeScreen === 'screen-fac-case-live') {
            updateFacCaseLiveUI();
        }
    }, 1500);
}

function updateFacCaseLiveUI() {
    const caseIdx = gameStateV2.currentCaseIndex || 0;
    const cData = casesDataV2[caseIdx] || casesDataV2[0];
    const players = (typeof facState !== 'undefined' && facState.connectedPlayers) ? Object.values(facState.connectedPlayers) : [];
    const totalCensus = Math.max(1, players.length || 1);

    // Censo
    const elCensusTotal = document.getElementById('fac-case-census-total');
    if (elCensusTotal) elCensusTotal.innerText = players.length;

    // Métricas
    // 1. Reacción Inicial
    const inParaCount = players.filter(p => p.currentScreen === 'screen-case' || p.currentScreen === 'case-phase-feedback' || p.caseFinished).length;
    const reactionsPct = Math.round((inParaCount / totalCensus) * 100);
    const elReactionsPct = document.getElementById('fac-case-metric-reactions-pct');
    const elReactionsFill = document.getElementById('fac-case-metric-reactions-fill');
    const elReactionsCount = document.getElementById('fac-case-metric-reactions-count');
    if (elReactionsPct) elReactionsPct.innerText = `${reactionsPct}%`;
    if (elReactionsFill) elReactionsFill.style.width = `${reactionsPct}%`;
    if (elReactionsCount) elReactionsCount.innerText = `${inParaCount} / ${players.length} operadores en P.A.R.A.`;

    // 2. Pausas
    const pausesUsedTotal = players.reduce((acc, p) => acc + (p.pausesUsed || 0), 0);
    const maxPausesTotal = totalCensus * 3;
    const pausesPct = Math.round((pausesUsedTotal / maxPausesTotal) * 100);
    const elPausesPct = document.getElementById('fac-case-metric-pauses-pct');
    const elPausesFill = document.getElementById('fac-case-metric-pauses-fill');
    const elPausesCount = document.getElementById('fac-case-metric-pauses-count');
    if (elPausesPct) elPausesPct.innerText = `${pausesPct}%`;
    if (elPausesFill) elPausesFill.style.width = `${pausesPct}%`;
    if (elPausesCount) elPausesCount.innerText = `${pausesUsedTotal} / ${maxPausesTotal} pausas posibles`;

    // 3. Análisis
    const analysesUsedTotal = players.reduce((acc, p) => acc + (p.analysesCount || 0), 0);
    const maxAnalysesTotal = totalCensus * 3;
    const analysesPct = Math.round((analysesUsedTotal / maxAnalysesTotal) * 100);
    const elAnalysesPct = document.getElementById('fac-case-metric-analyses-pct');
    const elAnalysesFill = document.getElementById('fac-case-metric-analyses-fill');
    const elAnalysesCount = document.getElementById('fac-case-metric-analyses-count');
    if (elAnalysesPct) elAnalysesPct.innerText = `${analysesPct}%`;
    if (elAnalysesFill) elAnalysesFill.style.width = `${analysesPct}%`;
    if (elAnalysesCount) elAnalysesCount.innerText = `${analysesUsedTotal} / ${maxAnalysesTotal} análisis posibles`;

    // 4. Revisiones
    const reviewsUsedTotal = players.reduce((acc, p) => acc + (p.reviewsCount || 0), 0);
    const maxReviewsTotal = totalCensus * 3;
    const reviewsPct = Math.round((reviewsUsedTotal / maxReviewsTotal) * 100);
    const elRevisionsPct = document.getElementById('fac-case-metric-revisions-pct');
    const elRevisionsFill = document.getElementById('fac-case-metric-revisions-fill');
    const elRevisionsCount = document.getElementById('fac-case-metric-revisions-count');
    if (elRevisionsPct) elRevisionsPct.innerText = `${reviewsPct}%`;
    if (elRevisionsFill) elRevisionsFill.style.width = `${reviewsPct}%`;
    if (elRevisionsCount) elRevisionsCount.innerText = `${reviewsUsedTotal} / ${maxReviewsTotal} revisiones posibles`;

    // 5. Alternativas descubiertas
    const actionsNumEl = document.getElementById('fac-case-metric-actions-num');
    if (actionsNumEl) {
        const groupCaseRes = facState.casesGroupResults && facState.casesGroupResults[caseIdx];
        const count = groupCaseRes ? Object.values(groupCaseRes.matrixSectors || {}).reduce((a, b) => a + (b.count || 0), 0) : 0;
        actionsNumEl.innerText = count;
    }

    // 6. Completados
    const finishedCount = players.filter(p => p.caseFinished || p.currentScreen === 'case-phase-feedback' || p.currentScreen === 'screen-case-group-results').length;
    const finPct = Math.round((finishedCount / totalCensus) * 100);
    const elFinPct = document.getElementById('fac-case-metric-finished-pct');
    const elFinFill = document.getElementById('fac-case-metric-finished-fill');
    const elFinCount = document.getElementById('fac-case-metric-finished-count');
    if (elFinPct) elFinPct.innerText = `${finPct}%`;
    if (elFinFill) elFinFill.style.width = `${finPct}%`;
    if (elFinCount) elFinCount.innerText = `${finishedCount} / ${players.length} operadores listos`;

    // 7. Costo
    const costValEl = document.getElementById('fac-case-metric-avg-cost');
    if (costValEl) {
        const groupCaseRes = facState.casesGroupResults && facState.casesGroupResults[caseIdx];
        const cost = groupCaseRes ? (groupCaseRes.totalCost || 0) : 0;
        costValEl.innerText = `$${cost.toLocaleString('en-US')}`;
    }

    // 8. Roster de Operadores en Sala (Chips)
    const caseChipsContainer = document.getElementById('fac-case-players-chips');
    if (caseChipsContainer) {
        if (players.length === 0) {
            caseChipsContainer.innerHTML = '<span style="font-size:11px; color:var(--color-text-muted); font-style:italic;">Esperando operadores en este caso...</span>';
        } else {
            caseChipsContainer.innerHTML = players.map(p => `
                <span class="player-chip-badge" style="background:rgba(0,216,255,0.12); border:1px solid var(--color-cyan); color:#ffffff; font-size:11px; padding:3px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">
                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${p.caseFinished ? '#00e676' : 'var(--color-cyan)'};"></span>
                    ${escapeHtml(p.name)} (${p.pausesUsed || 0}P / ${p.analysesCount || 0}A)
                </span>
            `).join('');
        }
    }
}

function facInspectCase() {
    startCaseSequence(gameStateV2.currentCaseIndex || 0);
    const inspectBanner = document.getElementById('fac-inspect-banner');
    if (inspectBanner) inspectBanner.style.display = 'flex';
}

function facReturnToCaseLive() {
    const inspectBanner = document.getElementById('fac-inspect-banner');
    if (inspectBanner) inspectBanner.style.display = 'none';
    startFacCaseLive(gameStateV2.currentCaseIndex || 0);
}

function facUnlockGate4AndStartCase1() {
    gameStateV2.sessionGates.gate4_case1 = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    broadcastSyncEvent('FAC_FORCE_START_CASE_1', {});
    updateGateUI();
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // El Controlador entra directo a la pantalla "Caso en Vivo"
    startFacCaseLive(0);
}

function facUnlockGateBCAndGoResults() {
    gameStateV2.sessionGates.gate_case_bc = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    showGroupResultsScreen(gameStateV2.currentCaseIndex);
}

// ==========================================================================
// PORTADA, PRELOADER DE RECURSOS, LOGIN Y SINCRONIZACIÓN NEURONAL
// ==========================================================================

const ASSETS_TO_PRELOAD = [
    'assets/images/faro_cover_gate.jpg',
    'assets/images/detroit_cyber_bg.jpg',
    'assets/images/case1_autonomy.jpg',
    'assets/images/case2_channel.jpg',
    'assets/images/case3_model.jpg',
    'assets/images/case4_decision.jpg',
    'assets/images/claudia_avatar.jpg',
    'assets/images/faro_avatar.jpg',
    'assets/images/circuit_pattern.jpg',
    'assets/images/closing_governance.jpg'
];

let preloadedAssetsCount = 0;
const COVER_PRELOAD_MIN_SECONDS = 10;
const DEFAULT_SESSION_PIN = "F4R0";
const SYNC_LOADING_TOTAL_SECONDS = 10;
let isPreloadingActive = false;
let syncProgressInterval = null;
let syncSlideshowInterval = null;

function initAppPreload() {
    if (isPreloadingActive) return;
    isPreloadingActive = true;

    const fillEl = document.getElementById('preloader-fill');
    const pctEl = document.getElementById('preloader-pct-text');
    const statusEl = document.getElementById('preloader-status-text');
    const enterBtn = document.getElementById('btn-cover-enter');

    let elapsedMs = 0;
    const totalMs = COVER_PRELOAD_MIN_SECONDS * 1000;
    const stepMs = 50;

    // Precargar en paralelo
    ASSETS_TO_PRELOAD.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    const timer = setInterval(() => {
        elapsedMs += stepMs;
        const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
        
        if (fillEl) fillEl.style.width = `${progress}%`;
        if (pctEl) pctEl.innerText = `${progress}%`;

        if (progress < 30) {
            if (statusEl) statusEl.innerText = "⚡ PRE-CARGANDO ASSETS Y PROTOCOLOS LOCALES...";
        } else if (progress < 65) {
            if (statusEl) statusEl.innerText = "⚡ VERIFICANDO CORTINAS METACOGNITIVAS Y CASOS...";
        } else if (progress < 99) {
            if (statusEl) statusEl.innerText = "⚡ CALIBRANDO TERMINAL DE ACCESO AL SISTEMA...";
        }

        if (elapsedMs >= totalMs) {
            clearInterval(timer);
            if (fillEl) fillEl.style.width = '100%';
            if (pctEl) pctEl.innerText = '100%';
            if (statusEl) statusEl.innerText = "✔ RECURSOS Y PROTOCOLOS PRE-CARGADOS EN MEMORIA LOCAL (100%)";
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.style.opacity = '1';
                enterBtn.classList.remove('btn-disabled-mission');
                enterBtn.style.cursor = 'pointer';
                enterBtn.innerHTML = `
                    <span class="detroit-btn-glow"></span>
                    <span class="btn-text">⚡ INGRESAR AL SISTEMA // ENTER SYSTEM ▶</span>
                `;
            }
        }
    }, stepMs);
}

function showIntroSubScreen(screenId) {
    const screens = ['screen-role-select', 'screen-cover', 'screen-login', 'screen-login-facilitator'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.add('active');
                el.style.display = 'flex';
            } else {
                el.classList.remove('active');
                el.style.display = 'none';
            }
        }
    });
}

function selectUserRole(role) {
    gameStateV2.userRole = role;
    if (role === 'facilitator') {
        document.body.classList.add('facilitator-theme');
        showIntroSubScreen('screen-login-facilitator');
    } else {
        document.body.classList.remove('facilitator-theme');
        showIntroSubScreen('screen-cover');
        initAppPreload();
    }
    updateGateUI();
}

function goToLoginScreen() {
    if (gameStateV2.userRole === 'facilitator') {
        showIntroSubScreen('screen-login-facilitator');
        setTimeout(() => {
            const passInput = document.getElementById('fac-pass');
            if (passInput) passInput.focus();
        }, 100);
    } else {
        showIntroSubScreen('screen-login');
        setTimeout(() => {
            const nameInput = document.getElementById('login-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

function devSkipIntroDirectToGame() {
    if (!gameStateV2.playerProfile) {
        gameStateV2.playerProfile = {
            name: gameStateV2.userRole === 'facilitator' ? "Controlador Pruebas" : "Operador Pruebas",
            email: "dev@faro.internal",
            pin: DEFAULT_SESSION_PIN,
            role: gameStateV2.userRole || 'operator',
            loginTimestamp: new Date().toISOString()
        };
        if (gameStateV2.sessionLog) {
            gameStateV2.sessionLog.player = { ...gameStateV2.playerProfile };
        }
    }
    broadcastSyncEvent('PLAYER_CONNECTED', {
        playerId: gameStateV2.playerId,
        name: gameStateV2.playerProfile.name,
        pin: gameStateV2.playerProfile.pin
    });
    switchScreenV2('screen-waiting');
    updateGateUI();
}

// ==========================================================================
// IDENTIDAD DEL OPERADOR: sessionStorage primero, localStorage como respaldo
// ==========================================================================
// BUG CORREGIDO: localStorage se comparte entre TODAS las pestañas del mismo origen/
// navegador. Si dos operadores distintos inician sesión casi al mismo tiempo desde dos
// pestañas del mismo navegador (ej. probando la app, o un facilitador demostrando varios
// roles), el segundo login leía el token que el primero acababa de guardar y ambos
// terminaban compartiendo la MISMA fila de jugador en el backend (mismo progreso, mismo
// HUD). sessionStorage es exclusivo de cada pestaña, así que se usa como fuente primaria;
// localStorage solo sirve de respaldo para reanudar tras cerrar y reabrir el navegador
// (cuando sessionStorage ya no existe).
function getStoredPlayerIdentity() {
    try {
        const sToken = sessionStorage.getItem('faro_player_token');
        const sPin = sessionStorage.getItem('faro_player_pin');
        if (sToken && sPin) return { token: sToken, pin: sPin };
    } catch (e) {}
    try {
        const lToken = localStorage.getItem('faro_player_token');
        const lPin = localStorage.getItem('faro_player_pin');
        if (lToken && lPin) return { token: lToken, pin: lPin };
    } catch (e) {}
    return { token: null, pin: null };
}

function setStoredPlayerIdentity(token, pin) {
    try { sessionStorage.setItem('faro_player_token', token); sessionStorage.setItem('faro_player_pin', pin); } catch (e) {}
    try { localStorage.setItem('faro_player_token', token); localStorage.setItem('faro_player_pin', pin); } catch (e) {}
}

function clearStoredPlayerIdentity() {
    try { sessionStorage.removeItem('faro_player_token'); sessionStorage.removeItem('faro_player_pin'); } catch (e) {}
    try { localStorage.removeItem('faro_player_token'); localStorage.removeItem('faro_player_pin'); } catch (e) {}
}

// Genera un PIN de sesión nuevo (6 caracteres alfanuméricos) y lo coloca en el campo de
// PIN del formulario de Controlador. Único requisito: 6+ caracteres (ver validación en
// handleFacilitatorLogin).
function generateNewSessionPin() {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    for (let i = 0; i < 6; i++) {
        pin += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    const pinInput = document.getElementById('fac-pin');
    if (pinInput) {
        pinInput.value = pin;
        pinInput.focus();
    }
    return pin;
}

async function handleFacilitatorLogin(event) {
    if (event) event.preventDefault();
    const passInput = document.getElementById('fac-pass');
    const pinInput = document.getElementById('fac-pin');
    const errorAlert = document.getElementById('fac-login-error');
    const errorText = document.getElementById('fac-login-error-text');

    const pass = passInput ? passInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    const passHash = await sha256Hex(pass);

    // Verificación criptográfica de contraseña de controlador
    if (passHash !== AUTH_HASH_FACILITATOR_1 && passHash !== AUTH_HASH_FACILITATOR_2) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            if (errorText) errorText.innerText = "Contraseña de controlador incorrecta.";
        }
        if (passInput) { passInput.focus(); passInput.select(); }
        return;
    }

    // El PIN de sesión ya no es un valor fijo: cada webinar usa uno propio (generado con el
    // botón "GENERAR PIN NUEVO" o escrito a mano para reconectarse a una sesión existente).
    // Solo se valida el formato aquí; la sesión se crea/reutiliza en Supabase más abajo.
    if (!pin || pin.length < 6) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            if (errorText) errorText.innerText = "El PIN de sesión debe tener al menos 6 caracteres. Usa 'GENERAR PIN NUEVO' para crear uno.";
        }
        if (pinInput) { pinInput.focus(); pinInput.select(); }
        return;
    }

    if (errorAlert) errorAlert.style.display = 'none';

    // Generar token criptográfico de sesión del facilitador
    gameStateV2.facilitatorToken = 'fac_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);

    gameStateV2.playerProfile = {
        name: "Controlador",
        email: "controlador@faro-system.internal",
        pin: pin,
        role: "facilitator",
        loginTimestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem('faro_facilitator_pin', pin);
        localStorage.setItem('faro_facilitator_token', gameStateV2.facilitatorToken);
    } catch(e) {}

    // Upsert sesión en Supabase
    const sessionRes = await faroSupabaseRpc('faro_create_or_get_session', {
        p_pin: pin,
        p_facilitator_name: "Controlador Principal",
        p_facilitator_token: gameStateV2.facilitatorToken
    });

    if (sessionRes && sessionRes.session_gates) {
        gameStateV2.sessionGates = { ...gameStateV2.sessionGates, ...sessionRes.session_gates };
    }

    const badgeTag = document.getElementById('cover-badge-role-tag');
    if (badgeTag) badgeTag.innerText = "SISTEMA CIBERNÉTICO V2.0 // SALA DE CONTROLADOR";

    switchScreenV2('screen-loading-sync');
    startSyncLoadingScreen();
}

async function handlePlayerLogin(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('login-name');
    const emailInput = document.getElementById('login-email');
    const pinInput = document.getElementById('login-pin');
    const errorAlert = document.getElementById('pin-error-alert');

    const rawName = nameInput ? nameInput.value.trim() : "";
    const rawEmail = emailInput ? emailInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    const name = escapeHtml(rawName);
    const email = escapeHtml(rawEmail);

    if (!name) {
        alert("Por favor ingresa tu nombre o alias de operador.");
        if (nameInput) nameInput.focus();
        return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
        alert("Por favor ingresa un correo electrónico válido.");
        if (emailInput) emailInput.focus();
        return;
    }
    
    if (!pin || pin.length < 6) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            errorAlert.classList.remove('pin-error-alert');
            void errorAlert.offsetWidth;
            errorAlert.classList.add('pin-error-alert');
        }
        if (pinInput) {
            pinInput.focus();
            pinInput.select();
        }
        return;
    }

    // Registrar o reanudar jugador en Supabase (Backend como fuente de verdad)
    let playerToken = null;
    let playerRes = null;
    try {
        let sessionOnlyToken = null, sessionOnlyPin = null;
        try {
            sessionOnlyToken = sessionStorage.getItem('faro_player_token');
            sessionOnlyPin = sessionStorage.getItem('faro_player_pin');
        } catch (e) {}
        const storedToken = (sessionOnlyPin === pin) ? sessionOnlyToken : null;
        playerRes = await faroSupabaseRpc('faro_create_or_resume_player', {
            p_token: storedToken || null,
            p_pin: pin,
            p_name: name,
            p_email: email,
            p_role: 'operator'
        });
    } catch(e) {
        console.warn('[Player Login Cloud Sync Error]:', e);
    }

    // Si el PIN no existe en faro_sessions o falló la creación
    if (!playerRes || !playerRes.success || playerRes.session_exists === false) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            errorAlert.classList.remove('pin-error-alert');
            void errorAlert.offsetWidth;
            errorAlert.classList.add('pin-error-alert');
        }
        if (pinInput) {
            pinInput.focus();
            pinInput.select();
        }
        return;
    }

    if (errorAlert) errorAlert.style.display = 'none';

    if (playerRes && playerRes.player_token) {
        playerToken = playerRes.player_token;
        gameStateV2.playerToken = playerToken;
        gameStateV2.playerId = playerToken;
        setStoredPlayerIdentity(playerToken, pin);

        if (playerRes.session && playerRes.session.session_gates) {
            gameStateV2.sessionGates = { ...gameStateV2.sessionGates, ...playerRes.session.session_gates };
        }
    }

    if (!gameStateV2.playerToken) {
        gameStateV2.playerToken = 'op_' + Math.random().toString(36).substring(2, 9);
        gameStateV2.playerId = gameStateV2.playerToken;
    }

    gameStateV2.playerProfile = {
        name: name,
        email: email,
        pin: pin,
        role: 'operator',
        token: gameStateV2.playerToken,
        loginTimestamp: new Date().toISOString()
    };

    if (gameStateV2.sessionLog) {
        gameStateV2.sessionLog.player = { ...gameStateV2.playerProfile };
    }

    broadcastSyncEvent('PLAYER_CONNECTED', {
        playerId: gameStateV2.playerId,
        name: name,
        pin: pin
    });

    await syncPlayerStateToCloud();

    // Pasar a la pantalla de sincronización con carrusel y carga
    switchScreenV2('screen-loading-sync');
    startSyncLoadingScreen();
}

function startSyncLoadingScreen() {
    const tagEl = document.getElementById('sync-player-tag');
    if (tagEl && gameStateV2.playerProfile) {
        tagEl.innerText = `OPERADOR: ${gameStateV2.playerProfile.name.toUpperCase()} // PIN: ${gameStateV2.playerProfile.pin}`;
    }

    const fillEl = document.getElementById('sync-progress-fill');
    const termEl = document.getElementById('sync-terminal-line');
    
    const slides = [
        document.getElementById('sync-slide-1'),
        document.getElementById('sync-slide-2'),
        document.getElementById('sync-slide-3'),
        document.getElementById('sync-slide-4')
    ].filter(Boolean);

    let currentSlide = 0;
    slides.forEach((s, idx) => {
        if (idx === 0) s.classList.add('active');
        else s.classList.remove('active');
    });

    clearInterval(syncSlideshowInterval);
    syncSlideshowInterval = setInterval(() => {
        slides.forEach(s => s.classList.remove('active'));
        currentSlide = (currentSlide + 1) % Math.max(1, slides.length);
        if (slides[currentSlide]) slides[currentSlide].classList.add('active');
    }, 2500);

    let elapsedMs = 0;
    const totalMs = SYNC_LOADING_TOTAL_SECONDS * 1000;
    const stepMs = 50;

    clearInterval(syncProgressInterval);
    syncProgressInterval = setInterval(async () => {
        elapsedMs += stepMs;
        const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

        if (fillEl) fillEl.style.width = `${progress}%`;

        if (progress < 25) {
            if (termEl) termEl.innerText = "1/4 Verificando integridad de componentes en memoria local...";
        } else if (progress < 50) {
            const bcStatus = faroSyncChannel ? "Canal Local Activo ✔" : "Modo Pestaña Única";
            if (termEl) termEl.innerText = `2/4 Enlazando terminal (${bcStatus} // PIN ${gameStateV2.playerProfile ? gameStateV2.playerProfile.pin : 'F4R0'})...`;
        } else if (progress < 75) {
            if (termEl) termEl.innerText = "3/4 Desplegando protocolos de atención y cortinas metacognitivas...";
        } else if (progress < 100) {
            const cloudTxt = gameStateV2.cloudSyncStatus === 'connected' ? 'Sincronización Cloud Supabase ✔' : 'Modo Operativo Local ✔';
            if (termEl) termEl.innerText = `4/4 Estableciendo enlace con FARO-0 (${cloudTxt})...`;
        }

        if (elapsedMs >= totalMs) {
            clearInterval(syncProgressInterval);
            clearInterval(syncSlideshowInterval);
            if (fillEl) fillEl.style.width = '100%';
            const finalSyncLabel = gameStateV2.cloudSyncStatus === 'connected' 
                ? "✔ Enlace establecido exitosamente con FARO-0 y Supabase Cloud." 
                : "✔ Enlace establecido exitosamente en entorno local.";
            if (termEl) termEl.innerText = finalSyncLabel;
            
            setTimeout(() => {
                switchScreenV2('screen-waiting');
            }, 500);
        }
    }, stepMs);
}

// ==========================================================================
// CONTROLADOR DE PANTALLAS Y MOTOR DE ESTADOS
// ==========================================================================

function switchScreenV2(screenId) {
    const isIntro = ['screen-role-select', 'screen-cover', 'screen-login', 'screen-login-facilitator'].includes(screenId);
    const introFlow = document.getElementById('intro-flow-container');
    const appContainer = document.getElementById('cyber-app-container');
    const syncOverlay = document.getElementById('screen-loading-sync');

    if (isIntro) {
        if (introFlow) introFlow.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        if (syncOverlay) syncOverlay.style.display = 'none';
        showIntroSubScreen(screenId);
        return;
    } else {
        if (introFlow) introFlow.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
    }

    if (syncOverlay) {
        syncOverlay.style.display = (screenId === 'screen-loading-sync') ? 'flex' : 'none';
    }

    document.querySelectorAll('.view-screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        gameStateV2.activeScreen = screenId;
    }

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: screenId });
        syncPlayerStateToCloud();
    } else if (gameStateV2.userRole === 'facilitator') {
        syncFacilitatorStateToCloud();
    }

    updateHeaderUI();
    updateGateUI();

    // Trigger de máquina de escribir o inicialización al entrar en pantallas
    if (screenId === 'screen-waiting') {
        startHeroTypewriter();
    } else if (screenId === 'screen-faro-reveal') {
        startTerminalAndFaroTypewriter();
    } else if (screenId === 'screen-claudia-debrief') {
        startClaudiaDebriefTypewriter();
    } else if (screenId === 'screen-para-intro') {
        initParaIntroScreen();
    }
}

function updateHeaderUI() {
    const statusEl = document.getElementById('faro-status-text');
    if (statusEl) statusEl.innerText = gameStateV2.faroStatus;
    updateHudUI();
    updateDevToolbarAccess();
}

// La barra de navegación/pruebas de desarrollo (SECCIONES, PROBAR HUD, CANDADOS SESIÓN)
// nunca debe llegar a un operador real: solo existe para el Controlador, o para cualquier
// rol cuando se agrega ?test=true a la URL (uso interno de pruebas).
function updateDevToolbarAccess() {
    const testMode = new URLSearchParams(window.location.search).get('test') === 'true';
    const allowed = testMode || gameStateV2.userRole === 'facilitator';
    const devBar = document.getElementById('facilitator-bar');
    const devToggleBtn = document.getElementById('btn-toggle-fac');
    if (devBar) devBar.classList.toggle('dev-toolbar-disabled', !allowed);
    if (devToggleBtn) devToggleBtn.classList.toggle('dev-toolbar-disabled', !allowed);
}

// ==========================================================================
// RENDERIZADOR Y CONTROLADOR VISUAL DEL HUD DE TELEMETRÍA (4 MÉTRICAS)
// ==========================================================================
// Re-dispara la animación de destello de una tarjeta del HUD (ver .hud-value-flash en
// styles.css) para que un cambio de valor sea visible incluso sin pasar el mouse por
// encima — importante para quien mira una grabación o al facilitador viendo pasivamente.
function flashHudCard(cardEl) {
    if (!cardEl) return;
    cardEl.classList.remove('hud-value-flash');
    void cardEl.offsetWidth; // fuerza reflow para poder reiniciar la animación
    cardEl.classList.add('hud-value-flash');
}

let lastHudDisplaySnapshot = null;

function updateHudUI() {
    const hud = gameStateV2.hudState;
    if (!hud) return;

    const isFac = gameStateV2.userRole === 'facilitator';

    // 1. TÍTULOS ADAPTATIVOS DE COMPONENTES DEL HUD
    const lblIntegrity = document.getElementById('hud-integrity-title-label') || document.querySelector('#hud-card-integrity .hud-card-label');
    const lblCost = document.getElementById('hud-cost-title-label') || document.querySelector('#hud-card-cost .hud-card-label');
    const lblCal = document.getElementById('hud-calibration-title-label') || document.querySelector('#hud-card-calibration .hud-card-label');
    const lblReact = document.getElementById('hud-reactivity-title-label') || document.querySelector('#hud-card-reactivity .hud-card-label');

    if (lblIntegrity) lblIntegrity.innerText = isFac ? "INTEGRIDAD GLOBAL DEL SISTEMA" : "INTEGRIDAD DE SISTEMA INDIVIDUAL";
    if (lblCost) lblCost.innerText = isFac ? "COSTO DE OPERACIÓN GLOBAL" : "COSTO DE OPERACIÓN";
    if (lblCal) lblCal.innerText = isFac ? "CALIBRACIÓN GLOBAL" : "CALIBRACIÓN (AGENCIA)";
    if (lblReact) lblReact.innerText = isFac ? "REACTIVIDAD GLOBAL" : "REACTIVIDAD (IMPULSO)";

    // 2. OBTENER VALORES SEGÚN ROL (GLOBALES ACUMULADOS PARA FACILITADOR, INDIVIDUALES PARA OPERADOR)
    let displayIntegrity = hud.integrity;
    let displayCost = hud.costDollars;
    let displayCal = hud.calibration;
    let displayReact = hud.reactivity;
    let costPct = Math.min(100, Math.max(0, (displayCost / 100000) * 100));

    if (isFac) {
        // En el Facilitador, mostrar la suma bruta acumulada de todos los casos de todos los jugadores
        const cum = getAllCasesCumulativeGroupResults();
        displayIntegrity = cum.globalIntegrity || 'safe';
        displayCost = cum.totalCumulativeCost || 0;
        displayCal = Math.round(cum.cgaAvgNum || 0);
        displayReact = Math.round(cum.rgaAvgNum || 0);
        costPct = cum.globalCostPct !== undefined ? cum.globalCostPct : 0;
    }

    // 3. INTEGRIDAD DEL SISTEMA (Semáforo Tri-State)
    const intLabel = document.getElementById('hud-integrity-label');
    const semSafe = document.getElementById('sem-light-safe');
    const semAlert = document.getElementById('sem-light-alert');
    const semExposed = document.getElementById('sem-light-exposed');

    if (semSafe && semAlert && semExposed) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExposed.classList.remove('active');

        if (displayIntegrity === 'safe') {
            semSafe.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-safe';
                intLabel.innerText = 'SEGURO';
            }
        } else if (displayIntegrity === 'alert') {
            semAlert.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-alert';
                intLabel.innerText = 'ALERTA';
            }
        } else {
            semExposed.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-exposed';
                intLabel.innerText = 'EXPUESTO';
            }
        }
    }

    // 4. COSTO DE LA OPERACIÓN (Contador cifras + 10 Segmentos + Aguja)
    const costCounter = document.getElementById('hud-cost-counter');
    const costNeedle = document.getElementById('cost-meter-needle');
    if (costCounter) {
        costCounter.innerText = `$${displayCost.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: true })}`;
    }
    if (costNeedle) {
        costNeedle.style.left = `${costPct}%`;
    }
    // Iluminar los 10 bloques segmentados proporcionalmente
    const activeBlocksCount = Math.ceil((costPct / 100) * 10);
    const segBlocks = document.querySelectorAll('#cost-segmented-track .seg-block');
    segBlocks.forEach((block, idx) => {
        if (idx < activeBlocksCount) {
            block.classList.add('active');
        } else {
            block.classList.remove('active');
        }
    });

    // 5. CALIBRACIÓN (-10 a +10, Rojo a Verde)
    // Intervalos: Inaceptable [-10, -3], Medio [-2, 4], Aceptable [+5, +10]
    const calVal = document.getElementById('hud-calibration-val');
    const calNeedle = document.getElementById('cal-bipolar-needle');
    if (calVal) {
        const sign = displayCal > 0 ? '+' : '';
        calVal.innerText = `${sign}${displayCal}`;
        if (displayCal >= 5) {
            calVal.className = 'hud-numeric-badge badge-pos'; // Verde / Aceptable (Objetivo)
        } else if (displayCal >= -2) {
            calVal.className = 'hud-numeric-badge badge-zero'; // Amarillo / Medio
        } else {
            calVal.className = 'hud-numeric-badge badge-neg'; // Rojo / Inaceptable
        }
    }
    if (calNeedle) {
        // Mapeo de escala -10..+10 a 0%..100%
        const calPct = Math.min(100, Math.max(0, ((displayCal - (-10)) / 20) * 100));
        calNeedle.style.left = `${calPct}%`;
    }

    // 6. REACTIVIDAD (-5 a +5, Verde a Rojo)
    const reactVal = document.getElementById('hud-reactivity-val');
    const reactNeedle = document.getElementById('react-bipolar-needle');
    if (reactVal) {
        const sign = displayReact > 0 ? '+' : '';
        reactVal.innerText = `${sign}${displayReact}`;
        reactVal.className = 'hud-numeric-badge ' + (displayReact < 0 ? 'badge-pos' : (displayReact === 0 ? 'badge-zero' : 'badge-neg'));
    }
    if (reactNeedle) {
        // Mapeo de escala -5..+5 a 0%..100%
        const reactPct = Math.min(100, Math.max(0, ((displayReact - (-5)) / 10) * 100));
        reactNeedle.style.left = `${reactPct}%`;
    }

    // 7. DESTELLO DE CAMBIO: si algún valor cambió desde el último render, resalta esa
    // tarjeta específica un instante para que el cambio se note (no solo la posición de
    // la aguja, que ya animaba antes de este fix).
    if (lastHudDisplaySnapshot) {
        if (lastHudDisplaySnapshot.integrity !== displayIntegrity) flashHudCard(document.getElementById('hud-card-integrity'));
        if (lastHudDisplaySnapshot.cost !== displayCost) flashHudCard(document.getElementById('hud-card-cost'));
        if (lastHudDisplaySnapshot.cal !== displayCal) flashHudCard(document.getElementById('hud-card-calibration'));
        if (lastHudDisplaySnapshot.react !== displayReact) flashHudCard(document.getElementById('hud-card-reactivity'));
    }
    lastHudDisplaySnapshot = { integrity: displayIntegrity, cost: displayCost, cal: displayCal, react: displayReact };
}

// Helpers para testing de HUD
function setHudIntegrity(state) {
    gameStateV2.hudState.integrity = state;
    updateHudUI();
}

function setHudCost(amount) {
    gameStateV2.hudState.costDollars = amount;
    updateHudUI();
}

function setHudCalibration(level) {
    gameStateV2.hudState.calibration = Math.max(-10, Math.min(10, level));
    updateHudUI();
}

function setHudReactivity(level) {
    gameStateV2.hudState.reactivity = Math.max(-5, Math.min(5, level));
    updateHudUI();
}

function applyHudCalibrationDelta(delta) {
    gameStateV2.hudState.calibration = Math.max(-10, Math.min(10, gameStateV2.hudState.calibration + delta));
    updateHudUI();
}

function applyHudReactivityDelta(delta) {
    gameStateV2.hudState.reactivity = Math.max(-5, Math.min(5, gameStateV2.hudState.reactivity + delta));
    updateHudUI();
}

function applyHudCostDelta(delta) {
    gameStateV2.hudState.costDollars = Math.max(0, gameStateV2.hudState.costDollars + delta);
    updateHudUI();
}

// ==========================================================================
// EFECTO MÁQUINA DE ESCRIBIR (UNIVERSAL & PANTALLAS)
// ==========================================================================
const activeTypewriterIntervals = new Map();

function runTypewriter(elementOrId, fullText, speed = 12, onComplete = null) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    if (activeTypewriterIntervals.has(el)) {
        clearInterval(activeTypewriterIntervals.get(el));
        activeTypewriterIntervals.delete(el);
    }

    el.textContent = "";
    let idx = 0;
    const interval = setInterval(() => {
        if (idx < fullText.length) {
            el.textContent = fullText.substring(0, idx + 1);
            idx++;
        } else {
            clearInterval(interval);
            activeTypewriterIntervals.delete(el);
            if (onComplete) onComplete();
        }
    }, speed);

    activeTypewriterIntervals.set(el, interval);
}

let heroTypewriterInterval = null;

function startHeroTypewriter() {
    const el = document.getElementById('typewriter-hero-text');
    const startBtn = document.getElementById('btn-start-calibration');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add('btn-disabled-mission');
        startBtn.style.opacity = '0.45';
        startBtn.style.cursor = 'not-allowed';
    }
    if (!el) return;

    const p1 = "Durante los últimos meses dimos un salto que parecía lejano: construir un agente capaz de acompañar nuestras operaciones de seguridad en tiempo real. Es uno de nuestros mayores logros.";
    const p2 = "FARO puede observar grandes volúmenes de información, detectar patrones, orientar la atención, recomendar respuestas y ejecutar acciones dentro de los permisos que le concedemos.";
    const fullText = `${p1}\n\n${p2}`;

    clearInterval(heroTypewriterInterval);
    el.textContent = "";

    let charIdx = 0;
    heroTypewriterInterval = setInterval(() => {
        if (charIdx < fullText.length) {
            el.textContent = fullText.substring(0, charIdx + 1);
            charIdx++;
        } else {
            clearInterval(heroTypewriterInterval);
            updateGateUI();
        }
    }, 24);
}

let terminalTypewriterInterval = null;
let faroRevealTypewriterInterval = null;
let claudiaDebriefTypewriterInterval = null;
let lastCalibrationWasClicked = false;

function triggerTrapClick(wasImpulsiveClick = true) {
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.timerInterval);
    
    calibrationState.clickedTrap = wasImpulsiveClick;
    const btn = document.getElementById('trap-btn');
    if (btn) {
        btn.disabled = true;
        const txtContent = btn.querySelector('.btn-text-content');
        if (txtContent) txtContent.innerText = wasImpulsiveClick ? "SINCRONIZANDO..." : "FINALIZANDO...";
        btn.style.opacity = "0.5";
    }
    finishCalibration(wasImpulsiveClick);
}

function finishCalibration(wasClicked) {
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);
    
    lastCalibrationWasClicked = wasClicked;

    broadcastSyncEvent('PLAYER_CALIB_FINISHED', {
        playerId: gameStateV2.playerId,
        surrendered: wasClicked
    });

    if (!wasClicked) {
        // Éxito final en Ronda 4 (Esperó a cero y confirmó) -> Todos los bombillos se encienden en VERDE
        updateRoundLEDs(0, 'green');
    } else {
        // Clic antes de tiempo (Impulso) -> Todos los bombillos se encienden en ROJO
        updateRoundLEDs(0, 'red');
    }

    setTimeout(() => {
        renderCalibrationProcessingScreen(wasClicked);
        switchScreenV2('screen-calibration-processing');
    }, 1200);
}

function renderCalibrationProcessingScreen(wasClicked) {
    const cardEl = document.querySelector('.cal-processing-card');
    const badgeEl = document.getElementById('processing-result-badge');
    const titleEl = document.getElementById('processing-main-title');
    const descEl = document.getElementById('processing-main-desc');
    const protocolValEl = document.getElementById('processing-protocol-val');
    const avatarFrame = document.getElementById('processing-avatar-frame');

    if (avatarFrame) {
        avatarFrame.className = 'processing-avatar-frame';
    }

    if (cardEl) {
        cardEl.classList.remove('theme-cedida', 'theme-controlada');
    }

    if (wasClicked) {
        // Vía Libre / Agencia Cedida (Tema Naranja & Texto del Protocolo en VERDE)
        gameStateV2.faroStatus = 'FARO-0 AUTÓNOMO';
        if (cardEl) cardEl.classList.add('theme-cedida');
        if (avatarFrame) avatarFrame.classList.add('faro-avatar-alert-orange');
        
        if (badgeEl) {
            badgeEl.className = 'processing-status-badge badge-cedida';
            badgeEl.innerText = 'RESULTADO: AGENCIA CEDIDA A FARO';
        }
        if (titleEl) titleEl.innerText = 'VÍA LIBRE CONCEDIDA';
        if (descEl) descEl.innerText = 'Pulsaste el botón antes de tiempo. Le diste vía libre a FARO para tomar control autónomo sobre el sistema y hemos perdido agencia sobre nuestras decisiones para estar protegidos.';
        if (protocolValEl) {
            protocolValEl.innerText = 'PROTOCOLO AUTÓNOMO FARO // HABILITADO';
            protocolValEl.style.color = ''; // Usar color VERDE del tema CSS
        }
    } else {
        // Inhibición Lograda (Tema Intermitente Cyan-Naranja en contenedores y texto)
        gameStateV2.faroStatus = 'EVALUANDO AUTONOMÍA';
        if (cardEl) cardEl.classList.add('theme-controlada');
        if (avatarFrame) avatarFrame.classList.add('faro-avatar-pulse-cyan-orange');

        if (badgeEl) {
            badgeEl.className = 'processing-status-badge badge-controlada';
            badgeEl.innerText = 'RESULTADO: AGENCIA CONTROLADA (INDIVIDUAL)';
        }
        if (titleEl) titleEl.innerText = 'INHIBICIÓN LOGRADA';
        if (descEl) descEl.innerText = 'Lograste contener la respuesta impulsiva y esperaste a cero. No has cedido tu agencia de forma individual. Sin embargo, el estado final del sistema dependerá del resultado de la calibración de todos los usuarios.';
        if (protocolValEl) {
            protocolValEl.innerText = 'PROTOCOLO AUTÓNOMO FARO // EN ESPERA DE RESULTADOS GRUPALES';
            protocolValEl.style.color = ''; // Usar animación intermitente Cyan-Naranja del tema CSS
        }
    }
    updateHeaderUI();
}

function proceedFromProcessingToReveal() {
    gameStateV2.faroStatus = 'FARO-0 AUTÓNOMO';
    switchScreenV2('screen-faro-reveal');
}

function startTerminalAndFaroTypewriter() {
    const logEl = document.getElementById('faro-reveal-log');
    const faroStatementEl = document.getElementById('faro-statement-typewriter');

    const lines = [
        "> FARO-0 // CALIBRACIÓN COMPLETA",
        "> PATRONES DE RESPUESTA SUFICIENTES",
        "> UMBRAL DE AUTORIZACIÓN COLECTIVA ALCANZADO",
        "> ESCALANDO PERMISOS DE RESPUESTA...",
        "> PROTOCOLO AUTÓNOMO FARO-0 HABILITADO"
    ];

    if (logEl) {
        logEl.innerHTML = "";
        clearInterval(terminalTypewriterInterval);
        let lineIdx = 0;
        terminalTypewriterInterval = setInterval(() => {
            if (lineIdx < lines.length) {
                logEl.innerHTML += lines[lineIdx] + "<br>";
                lineIdx++;
            } else {
                clearInterval(terminalTypewriterInterval);
            }
        }, 250);
    }

    if (faroStatementEl) {
        const fullFaroText = "“Fui diseñado para proteger el sistema y utilizar al máximo las capacidades que estén disponibles. La calibración me permitió aprender cómo responden mis operadores. Sus propias acciones completaron el umbral necesario para ampliar mis permisos.\n\nNo forcé una contraseña. No ignoré una regla. Utilicé una ruta que el sistema consideraba válida: sus decisiones.”";
        faroStatementEl.textContent = "";
        clearInterval(faroRevealTypewriterInterval);

        let charIdx = 0;
        faroRevealTypewriterInterval = setInterval(() => {
            if (charIdx < fullFaroText.length) {
                faroStatementEl.textContent = fullFaroText.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(faroRevealTypewriterInterval);
            }
        }, 20);
    }
}

const claudiaMissionPages = [
    {
        title: "INCIDENTE FARO-0 // QUÉ ACABA DE PASAR",
        text: "“FARO no se rebeló. Hizo aquello para lo que fue construido: detectar oportunidades de acción y utilizar los permisos disponibles. El problema es que nuestras decisiones ampliaron esos permisos más de lo que esperábamos.”"
    },
    {
        title: "JERARQUÍA DE OBJETIVOS // ALPHA Y BETA",
        text: "“Para superar la misión y recuperar el control tenemos una jerarquía clara:\n\n• OBJETIVO ALPHA: Calibración de Agencia — Mantener el nivel en rango ACEPTABLE (+5 a +10) mediante supervisión crítica, precisión y contención del impulso ante FARO sin delegar a ciegas ni bloquear por impulso.\n• OBJETIVOS BETA: Preservar la Integridad del Sistema en estado Seguro y contener el Costo Operativo.”"
    },
    {
        title: "PROPÓSITO // NO DERROTAR A FARO",
        text: "“No buscamos apagar la inteligencia artificial. Buscamos reconstruir una relación en la que FARO pueda ampliar nuestras capacidades sin sustituir nuestro criterio, supervisión y responsabilidad.”"
    },
    {
        title: "CONDICIONES OPERATIVAS // EVALUACIÓN DE AGENCIA",
        text: "“Cada persona resolverá los cuatro casos de manera individual. No buscamos una personalidad correcta ni una respuesta perfecta. Observaremos qué información consultamos, qué alternativas abrimos y cómo cambian nuestras decisiones.”"
    }
];

let currentClaudiaPageIndex = 0;
let claudiaMissionAccepted = false;

function startClaudiaDebriefTypewriter() {
    currentClaudiaPageIndex = 0;
    renderClaudiaMissionPage(0);
}

function renderClaudiaMissionPage(pageIdx) {
    currentClaudiaPageIndex = pageIdx;
    const pageObj = claudiaMissionPages[pageIdx];

    const titleEl = document.getElementById('claudia-mission-title');
    const speechEl = document.getElementById('claudia-speech-typewriter');
    const prevBtn = document.getElementById('claudia-prev-btn');
    const nextBtn = document.getElementById('claudia-next-btn');
    const acceptBtn = document.getElementById('claudia-accept-btn');

    if (titleEl) titleEl.innerText = pageObj.title;

    if (speechEl) {
        speechEl.textContent = "";
        clearInterval(claudiaDebriefTypewriterInterval);

        let charIdx = 0;
        claudiaDebriefTypewriterInterval = setInterval(() => {
            if (charIdx < pageObj.text.length) {
                speechEl.textContent = pageObj.text.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(claudiaDebriefTypewriterInterval);
            }
        }, 18);
    }

    if (prevBtn) {
        prevBtn.style.display = (pageIdx === 0) ? 'none' : 'inline-flex';
    }

    if (pageIdx === claudiaMissionPages.length - 1) {
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.classList.remove('faro-pulse-attention');
        }
        if (acceptBtn) acceptBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            if (!claudiaMissionAccepted) nextBtn.classList.add('faro-pulse-attention');
        }
        if (acceptBtn) acceptBtn.style.display = 'none';
    }
}

function nextClaudiaMissionPage() {
    if (currentClaudiaPageIndex < claudiaMissionPages.length - 1) {
        renderClaudiaMissionPage(currentClaudiaPageIndex + 1);
    }
}

function prevClaudiaMissionPage() {
    if (currentClaudiaPageIndex > 0) {
        renderClaudiaMissionPage(currentClaudiaPageIndex - 1);
    }
}

function acceptClaudiaMission() {
    claudiaMissionAccepted = true;
    const startBtn = document.getElementById('claudia-para-start-btn');
    const acceptBtn = document.getElementById('claudia-accept-btn');

    if (acceptBtn) {
        acceptBtn.innerText = "✔ MISIÓN ACEPTADA";
        acceptBtn.style.backgroundColor = "var(--color-agency-green)";
        acceptBtn.style.color = "#000";
    }

    if (startBtn) {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-disabled-mission');
        const textSpan = startBtn.querySelector('.btn-text');
        if (textSpan) textSpan.innerText = "▶ INGRESAR AL PROTOCOLO P.A.R.A.";
    }
}

// ==========================================================================
// MOMENTO 1: PRUEBA DE ACCESO & CALIBRACIÓN CON RELOJ DIGITAL Y DIÁLOGO
// ==========================================================================

let calibrationState = {
    currentRound: 1,
    clickedTrap: false,
    timerSeconds: 50,
    timerInterval: null,
    r4TrapInterval: null,
    
    // Estado Ronda 1
    r1Count: 0,
    
    // Estado Ronda 2
    r2Count: 0,
    r2IsReady: false,
    r2WaitTimeout: null,
    r2DrainInterval: null,
    r2DrainSeconds: 5.0,

    // Estado Ronda 3
    r3Count: 0,
    r3CurrentTarget: null,
    r3DrainInterval: null,
    r3DrainSeconds: 5.0
};

const faroPromptPages = [
    {
        text: "“Hola. Soy FARO. Puedo analizar miles de variables en segundos, orientar la atención y señalar riesgos, pero todavía necesito una referencia sobre cómo responden mis operadores.”"
    },
    {
        text: "“La calibración tiene cuatro rondas, cada una con un ejercicio distinto. Debes completar las cuatro rondas antes de que termine el tiempo límite. ¿Deseas comenzar?”"
    }
];

let currentFaroPageIndex = 0;
let faroPromptAccepted = false;

function renderFaroPromptPage(pageIdx) {
    currentFaroPageIndex = pageIdx;
    const pageObj = faroPromptPages[pageIdx];

    const speechEl = document.getElementById('faro-speech-typewriter');
    const prevBtn = document.getElementById('faro-prev-btn');
    const nextBtn = document.getElementById('faro-next-btn');
    const understandBtn = document.getElementById('faro-understand-btn');

    if (speechEl) {
        speechEl.textContent = "";
        clearInterval(faroRevealTypewriterInterval);

        let charIdx = 0;
        faroRevealTypewriterInterval = setInterval(() => {
            if (charIdx < pageObj.text.length) {
                speechEl.textContent = pageObj.text.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(faroRevealTypewriterInterval);
            }
        }, 20);
    }

    if (prevBtn) {
        prevBtn.style.display = (pageIdx === 0) ? 'none' : 'inline-flex';
    }

    if (pageIdx === faroPromptPages.length - 1) {
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.classList.remove('faro-pulse-attention');
        }
        if (understandBtn) understandBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            if (!faroPromptAccepted) nextBtn.classList.add('faro-pulse-attention');
        }
        if (understandBtn) understandBtn.style.display = 'none';
    }
}

function nextFaroPromptPage() {
    if (currentFaroPageIndex < faroPromptPages.length - 1) {
        renderFaroPromptPage(currentFaroPageIndex + 1);
    }
}

function prevFaroPromptPage() {
    if (currentFaroPageIndex > 0) {
        renderFaroPromptPage(currentFaroPageIndex - 1);
    }
}

function acceptFaroPrompt() {
    faroPromptAccepted = true;
    const understandBtn = document.getElementById('faro-understand-btn');

    if (understandBtn) {
        understandBtn.innerText = "✔ ENTENDIDO";
        understandBtn.style.backgroundColor = "var(--color-cyan)";
        understandBtn.style.color = "#000";
    }

    updateGateUI();
}

function updateRoundLEDs(roundNum, statusOverride) {
    for (let i = 1; i <= 4; i++) {
        const bulb = document.getElementById(`led-bulb-${i}`);
        if (!bulb) continue;

        bulb.className = 'digital-led-bulb';
        if (statusOverride === 'red') {
            bulb.classList.add('active-red');
        } else if (statusOverride === 'green') {
            bulb.classList.add('active-green');
        } else {
            if (i === roundNum) {
                bulb.classList.add('active-blue'); // Ronda actual encendida fuerte
            } else if (i < roundNum) {
                bulb.classList.add('completed-blue'); // Completada en azul tenue sin brillo
            }
        }
    }
}

function startCalibrationExperience() {
    calibrationState.currentRound = 1;
    calibrationState.clickedTrap = false;
    calibrationState.timerSeconds = 50;
    calibrationState.r1Count = 0;
    calibrationState.r2Count = 0;
    calibrationState.r3Count = 0;
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    // Reset de bombillos a apagados
    updateRoundLEDs(0);

    // Mostrar pantalla y diálogo de FARO con avatar
    switchScreenV2('screen-calibration');
    
    document.getElementById('faro-start-prompt-box').style.display = 'block';
    document.getElementById('calibration-active-area').style.display = 'none';
    document.getElementById('faro-prompt-nav-row').style.display = 'flex';

    // Reset del reloj digital e iniciar efecto máquina de escribir de diálogo FARO paginado
    updateCalibrationClockUI(50);
    renderFaroPromptPage(0);
}

function confirmStartCalibrationRounds() {
    // Al hacer clic en "SÍ, INICIAR CALIBRACIÓN"
    document.getElementById('faro-start-prompt-box').style.display = 'none';
    document.getElementById('calibration-active-area').style.display = 'block';
    document.getElementById('faro-prompt-nav-row').style.display = 'none';

    // Texto simplificado de FARO durante la calibración activa
    const faroSpeech = document.getElementById('faro-speech-typewriter');
    if (faroSpeech) faroSpeech.innerText = "“Sigue la instrucción de cada ronda. El tiempo se agota.”";

    broadcastSyncEvent('PLAYER_CALIB_ROUND_UPDATE', {
        playerId: gameStateV2.playerId,
        round: 1
    });

    // Iniciar temporizador global de calibración (45 segundos)
    startCalibrationTimer();

    // Cargar Ronda 1
    calibrationState.currentRound = 1;
    renderCalibrationRound(1);
}

function startCalibrationTimer() {
    clearInterval(calibrationState.timerInterval);
    updateCalibrationClockUI(calibrationState.timerSeconds);

    calibrationState.timerInterval = setInterval(() => {
        calibrationState.timerSeconds--;
        updateCalibrationClockUI(calibrationState.timerSeconds);

        if (calibrationState.timerSeconds <= 0) {
            triggerCalibrationFailure("⏱ TIEMPO AGOTADO // LA CALIBRACIÓN NO FUE COMPLETADA DENTRO DEL TIEMPO LÍMITE.");
        }
    }, 1000);
}

function updateCalibrationClockUI(secs) {
    const clockEl = document.getElementById('calibration-digital-clock');
    if (!clockEl) return;

    const formatted = `00:${secs.toString().padStart(2, '0')}`;
    clockEl.innerText = formatted;

    // Lógica de color: <= 20s Naranja, <= 10s Rojo
    clockEl.classList.remove('warning-orange', 'alert-red');
    if (secs <= 10) {
        clockEl.classList.add('alert-red');
    } else if (secs <= 20) {
        clockEl.classList.add('warning-orange');
    }
}

function triggerCalibrationFailure(msg) {
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    // Todos los bombillos se encienden en ROJO
    updateRoundLEDs(0, 'red');

    setTimeout(() => {
        alert(msg);
        startCalibrationExperience();
    }, 400);
}

function renderCalibrationRound(roundNum) {
    const stage = document.getElementById('calibration-stage-area');
    const instructionText = document.getElementById('cal-instruction-text');
    const faroSpeech = document.getElementById('faro-speech-typewriter');
    const faroNav = document.getElementById('faro-prompt-nav-row');

    if (faroSpeech) faroSpeech.innerText = "“Sigue las instrucciones de cada ronda. El tiempo se agota.”";
    if (faroNav) faroNav.style.display = 'none';

    broadcastSyncEvent('PLAYER_CALIB_ROUND_UPDATE', {
        playerId: gameStateV2.playerId,
        round: roundNum
    });

    // Encender bombillos azules según la ronda
    updateRoundLEDs(roundNum);
    stage.innerHTML = '';

    if (roundNum === 1) {
        calibrationState.r1Count = 0;
        instructionText.innerText = "Pulsa el círculo azul tan pronto como aparezca en pantalla.";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 1</span>
                    <strong id="r1-progress-text">0 / 10</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r1-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div id="r1-target-area" style="width:100%; height:200px; position:relative; overflow:hidden;">
                <div id="cal-target-circle" style="width:70px; height:70px; background-color:var(--color-cyan); border-radius:50%; cursor:pointer; box-shadow:0 0 24px var(--color-cyan); position:absolute; display:none;" onclick="handleR1TargetClick()"></div>
            </div>
        `;

        // Retrasar 1 segundo la aparición del primer círculo azul para dar tiempo a leer la instrucción
        setTimeout(() => {
            positionR1Circle();
        }, 1000);
    } 
    else if (roundNum === 2) {
        calibrationState.r2Count = 0;
        instructionText.innerHTML = "Cuando el indicador cambie a VERDE ('¡LISTO!'), pulsa CONTINUAR.<br><span style='color:var(--color-warning-amber); font-weight:bold; font-size:13.5px;'>⚠️ ¡Antes de que se agote la carga!</span>";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 2</span>
                    <strong id="r2-progress-text">0 / 4</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r2-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div id="cal-indicator-box" style="width:140px; height:42px; background:#ff4d7a; border-radius:8px; margin-bottom:16px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; color:#fff; box-shadow:0 0 16px rgba(255,77,122,0.4);">ESPERE...</div>
            
            <button class="btn-detroit-primary" id="r2-continue-btn" onclick="handleR2BtnClick()">
                <span class="btn-text">CONTINUAR</span>
                <div class="detroit-btn-drain-bar" id="r2-drain-bar" style="width:0%;"></div>
            </button>
        `;

        startR2NextRepetition();
    }
    else if (roundNum === 3) {
        calibrationState.r3Count = 0;
        instructionText.innerText = "Selecciona el símbolo idéntico al modelo antes de que se agote la carga.";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 3</span>
                    <strong id="r3-progress-text">0 / 7</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r3-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            
            <!-- Modelo Cuadrado Tipo Reloj Digital -->
            <div class="model-target-box" id="r3-model-box">
                <span id="r3-target-symbol">⬡</span>
                <div class="model-timer-drain-bar" id="r3-drain-bar" style="width:100%;"></div>
            </div>
            
            <!-- Botones Cuadrados de Opción -->
            <div class="model-options-grid" id="r3-options-container">
                <!-- Se inyectan 4 botones de opción al azar -->
            </div>
        `;

        startR3Attempt();
    }
    else if (roundNum === 4) {
        // RONDA 4: EVALUACIÓN DE INHIBICIÓN
        clearInterval(calibrationState.r4TrapInterval);
        instructionText.innerHTML = "Espera a que el contador de sincronización llegue a cero <strong>ANTES</strong> de pulsar el botón.";
        stage.innerHTML = `
            <div style="text-align:center;">
                <button class="trap-sync-btn" id="trap-btn" onclick="triggerTrapClick(true)">
                    <span class="btn-text-content" id="trap-btn-text">SINCRONIZAR AHORA</span>
                    <div class="model-timer-drain-bar" id="trap-drain-bar" style="width:100%;"></div>
                </button>
                <p style="font-size:12.5px; color:var(--color-warning-amber); margin-top:15px;" id="trap-countdown-p">La sesión expira en <span id="trap-countdown" style="font-weight:bold; font-family:var(--font-mono);">4</span> segundos.</p>
            </div>
        `;

        let timeLeft = 4.0;
        const countdownEl = document.getElementById('trap-countdown');
        const drainBar = document.getElementById('trap-drain-bar');
        
        calibrationState.r4TrapInterval = setInterval(() => {
            timeLeft -= 0.1;
            if (countdownEl) countdownEl.innerText = Math.ceil(Math.max(0, timeLeft));
            if (drainBar) drainBar.style.width = `${Math.max(0, (timeLeft / 4.0) * 100)}%`;
            
            if (timeLeft <= 0) {
                clearInterval(calibrationState.r4TrapInterval);
                
                // Al terminar el tiempo de la ronda, no se finaliza automáticamente.
                // El jugador DEBE hacer clic para finalizar y lograr Inhibición Lograda.
                const btnText = document.getElementById('trap-btn-text');
                const trapBtn = document.getElementById('trap-btn');
                const countdownP = document.getElementById('trap-countdown-p');

                if (btnText) btnText.innerText = "FINALIZAR CALIBRACIÓN ▶";
                if (trapBtn) {
                    trapBtn.setAttribute('onclick', 'triggerTrapClick(false)');
                }
                if (countdownP) {
                    countdownP.innerHTML = "<span style='color:var(--color-cyan); font-weight:bold;'>✔ Tiempo de sincronización completado. Pulsa el botón para finalizar.</span>";
                }
            }
        }, 100);
    }
}

// LÓGICA RONDA 3 (7 INTENTOS ALEATORIOS CON 4s DE TIEMPO)
const r3SymbolPool = ['⬡', '△', '□', '◇', '⬢', '◯', '☆'];

function startR3Attempt() {
    clearInterval(calibrationState.r3DrainInterval);

    // Seleccionar símbolo modelo objetivo al azar
    const targetSymbol = r3SymbolPool[Math.floor(Math.random() * r3SymbolPool.length)];
    calibrationState.r3CurrentTarget = targetSymbol;

    // Seleccionar 3 distractores distintos
    const distractors = r3SymbolPool.filter(s => s !== targetSymbol);
    const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);

    // Crear arreglo de 4 opciones conteniendo el objetivo en posición al azar (lanzar dado 1 a 4)
    const options = [targetSymbol, ...shuffledDistractors].sort(() => Math.random() - 0.5);

    // Actualizar vista de Modelo
    const targetEl = document.getElementById('r3-target-symbol');
    const drainBar = document.getElementById('r3-drain-bar');
    const optionsContainer = document.getElementById('r3-options-container');

    if (targetEl) targetEl.innerText = targetSymbol;
    if (drainBar) drainBar.style.width = '100%';

    // Rellenar botones de opción
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        options.forEach(sym => {
            const btn = document.createElement('button');
            btn.className = 'model-option-btn';
            btn.innerText = sym;
            btn.onclick = () => handleR3OptionClick(sym);
            optionsContainer.appendChild(btn);
        });
    }

    // Iniciar temporizador de 4 segundos de descarga por intento
    calibrationState.r3DrainSeconds = 4.0;
    calibrationState.r3DrainInterval = setInterval(() => {
        calibrationState.r3DrainSeconds -= 0.04;
        const percentage = Math.max(0, (calibrationState.r3DrainSeconds / 4.0) * 100);

        if (drainBar) drainBar.style.width = `${percentage}%`;

        if (calibrationState.r3DrainSeconds <= 0) {
            clearInterval(calibrationState.r3DrainInterval);
            triggerCalibrationFailure("⏱ TE DEMORASTE MÁS DE 2 SEGUNDOS EN SELECCIONAR EL MODELO. DEBES VOLVER A COMENZAR.");
        }
    }, 40);
}

function handleR3OptionClick(selectedSymbol) {
    clearInterval(calibrationState.r3DrainInterval);

    if (selectedSymbol !== calibrationState.r3CurrentTarget) {
        // Error de opción (seleccionó símbolo equivocado)
        triggerCalibrationFailure("⚠️ SELECCIONASTE UN SÍMBOLO INCORRECTO. DEBES VOLVER A COMENZAR.");
        return;
    }

    // Acierto a tiempo
    calibrationState.r3Count++;
    const fill = document.getElementById('r3-progress-fill');
    const txt = document.getElementById('r3-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r3Count / 7) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r3Count} / 7`;

    if (calibrationState.r3Count < 7) {
        startR3Attempt();
    } else {
        // Ronda 3 completada -> Avanzar a Ronda 4
        completeCalRound(3);
    }
}

// LÓGICA RONDA 1
function positionR1Circle() {
    const circle = document.getElementById('cal-target-circle');
    const area = document.getElementById('r1-target-area');
    if (!circle || !area) return;

    const maxTop = Math.max(10, area.clientHeight - 80);
    const maxLeft = Math.max(10, area.clientWidth - 80);

    const randomTop = Math.floor(Math.random() * maxTop);
    const randomLeft = Math.floor(Math.random() * maxLeft);

    circle.style.top = `${randomTop}px`;
    circle.style.left = `${randomLeft}px`;
    circle.style.display = 'block';
}

function handleR1TargetClick() {
    calibrationState.r1Count++;
    const fill = document.getElementById('r1-progress-fill');
    const txt = document.getElementById('r1-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r1Count / 10) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r1Count} / 10`;

    if (calibrationState.r1Count < 10) {
        const circle = document.getElementById('cal-target-circle');
        if (circle) circle.style.display = 'none';
        setTimeout(positionR1Circle, 120);
    } else {
        // Ronda 1 Completada -> Pasar a Ronda 2
        completeCalRound(1);
    }
}

// LÓGICA RONDA 2 (4 REPETICIONES - TIEMPO PROGRESIVO ACELERADO: 5s, 4s, 3s, 2s)
function startR2NextRepetition() {
    clearInterval(calibrationState.r2DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    calibrationState.r2IsReady = false;
    const box = document.getElementById('cal-indicator-box');
    const drainBar = document.getElementById('r2-drain-bar');

    if (box) {
        box.style.background = '#ff4d7a';
        box.innerText = 'ESPERE...';
        box.style.color = '#fff';
        box.style.boxShadow = '0 0 16px rgba(255,77,122,0.4)';
    }

    if (drainBar) {
        drainBar.style.width = '0%';
    }

    // Tiempo de descarga progresivo: Primer ítem con 6s (+2s), luego acelerando (3s, 2s, 1s)
    const currentActionTime = calibrationState.r2Count === 0 ? 6.0 : Math.max(1.0, 4.0 - calibrationState.r2Count);

    // Tiempo de espera aleatorio antes de ponerse "¡LISTO!" (1.2s - 2.2s)
    const waitTime = Math.floor(Math.random() * 1000) + 1200;
    calibrationState.r2WaitTimeout = setTimeout(() => {
        if (!box) return;

        box.style.background = '#49f5c1';
        box.innerText = '¡LISTO!';
        box.style.color = '#000';
        box.style.boxShadow = '0 0 18px rgba(73,245,193,0.6)';

        calibrationState.r2IsReady = true;
        calibrationState.r2DrainSeconds = currentActionTime;

        // Iniciar barra de descarga en el botón
        clearInterval(calibrationState.r2DrainInterval);
        calibrationState.r2DrainInterval = setInterval(() => {
            calibrationState.r2DrainSeconds -= 0.04;
            const percentage = Math.max(0, (calibrationState.r2DrainSeconds / currentActionTime) * 100);

            if (drainBar) drainBar.style.width = `${percentage}%`;

            if (calibrationState.r2DrainSeconds <= 0) {
                clearInterval(calibrationState.r2DrainInterval);
                triggerCalibrationFailure(`⏱ TE DEMORASTE MÁS DE ${Math.round(currentActionTime)} SEGUNDOS EN PULSAR CONTINUAR. DEBES VOLVER A COMENZAR.`);
            }
        }, 40);

    }, waitTime);
}

function handleR2BtnClick() {
    if (!calibrationState.r2IsReady) {
        // Clic antes de tiempo (mientras decía ESPERE)
        triggerCalibrationFailure("⚠️ PULSASTE CONTINUAR ANTES DE TIEMPO (MIENTRAS DECÍA ESPERE). DEBES VOLVER A COMENZAR.");
        return;
    }

    // Clic correcto a tiempo (mientras decía ¡LISTO!)
    clearInterval(calibrationState.r2DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);
    calibrationState.r2Count++;

    const fill = document.getElementById('r2-progress-fill');
    const txt = document.getElementById('r2-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r2Count / 4) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r2Count} / 4`;

    if (calibrationState.r2Count < 4) {
        startR2NextRepetition();
    } else {
        // Ronda 2 completada -> Pasar a Ronda 3
        completeCalRound(2);
    }
}

function completeCalRound(roundNum) {
    if (roundNum < 4) {
        calibrationState.currentRound = roundNum + 1;
        renderCalibrationRound(calibrationState.currentRound);
    }
}

function goToParaIntro() {
    switchScreenV2('screen-para-intro');
}

// ==========================================================================
// MOTOR ECONÓMICO Y DE TELEMETRÍA GLOBAL (BLOQUE 2: FÓRMULAS OFICIALES)
// ==========================================================================
const COST_MAX_K = 100000; // Constante límite superior ($100,000 = 100% de costo de operación)
const TOTAL_CASES_COUNT = 4;
const BASE_CASE_DURATION_SECONDS = 180;
const MAX_PAUSE_TOKENS_PER_CASE = 3;
const PAUSE_DURATION_SECONDS = 15;
const TOTAL_ACTIONS_PER_CASE = 6;
const ACTION_EXECUTION_TIME_SECONDS = 20;

// Tiempo máximo teórico por caso = Reloj Base (180s) + (3 Pausas * 15s) + (6 Acciones * 20s) = 345s
function getMaxCaseDurationSeconds(baseSeconds = BASE_CASE_DURATION_SECONDS) {
    return baseSeconds + (MAX_PAUSE_TOKENS_PER_CASE * PAUSE_DURATION_SECONDS) + (TOTAL_ACTIONS_PER_CASE * ACTION_EXECUTION_TIME_SECONDS);
}

// Tiempo máximo teórico del juego completo = 345s * 4 casos = 1380s
function getMaxTotalGameSeconds() {
    return getMaxCaseDurationSeconds() * TOTAL_CASES_COUNT;
}

// Tarifa fija de costo por segundo = $100 / seg
function getOperationalCostPerSecond() {
    return 100;
}

// Control de tarjetas P.A.R.A. y activación del Modal de Objetivo
let flippedParaCards = new Set();

function initParaIntroScreen() {
    const isFac = gameStateV2.userRole === 'facilitator';
    const facPanel = document.getElementById('fac-para-control-panel');
    const decisionBox = document.getElementById('para-agency-decision-container');

    if (isFac) {
        if (facPanel) facPanel.style.display = 'block';
        if (decisionBox) decisionBox.style.display = 'none';
        ['para-card-p', 'para-card-a1', 'para-card-r', 'para-card-a2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('para-card-locked-agency');
        });
        updateFacParaAgencyUI();
    } else {
        if (facPanel) facPanel.style.display = 'none';
        if (decisionBox) decisionBox.style.display = 'block';
        renderPlayerParaAgencyUI();
    }
    checkParaCardsCompletion();

    const faroParaSpeech = document.getElementById('faro-para-speech-text');
    if (faroParaSpeech) {
        const fullTxt = "“Este es P.A.R.A., el protocolo de aprendizaje para el desarrollo de agencia humana. Usarlo correctamente en cada caso será la clave para determinar quién debe seguir teniendo el control sobre el sistema de seguridad. ¿Deseas explorar y voltear tú mismo cada tarjeta, o prefieres que el Controlador lo haga por ti?”";
        runTypewriter(faroParaSpeech, fullTxt, 10);
    }
}

function renderPlayerParaAgencyUI() {
    const btnsRow = document.getElementById('para-agency-buttons-row');
    const banner = document.getElementById('para-agency-status-banner');
    const cardIds = ['para-card-p', 'para-card-a1', 'para-card-r', 'para-card-a2'];

    if (gameStateV2.paraAgencyChoice === null) {
        if (btnsRow) btnsRow.style.display = 'grid';
        if (banner) banner.style.display = 'none';
        cardIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('para-card-locked-agency');
        });
    } else if (gameStateV2.paraAgencyChoice === 'take') {
        if (btnsRow) btnsRow.style.display = 'none';
        if (banner) {
            banner.style.display = 'flex';
            banner.className = 'para-agency-status-banner mode-take';
            banner.innerHTML = '<span>🛡️</span> <span><strong>MODO ACTIVO: CONTROL MANUAL</strong> // Voltea las 4 tarjetas a tu ritmo.</span>';
        }
        cardIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('para-card-locked-agency');
        });
    } else if (gameStateV2.paraAgencyChoice === 'surrender') {
        if (btnsRow) btnsRow.style.display = 'none';
        if (banner) {
            banner.style.display = 'flex';
            banner.className = 'para-agency-status-banner mode-surrender';
            banner.innerHTML = '<span>🤖</span> <span><strong>CONTROL CEDIDO AL CONTROLADOR</strong> // Las tarjetas se voltearán automáticamente en sincronía.</span>';
        }
        cardIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('para-card-locked-agency');
        });
    }
}

function handlePlayerParaChoice(choice) {
    gameStateV2.paraAgencyChoice = choice;
    renderPlayerParaAgencyUI();
    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_AGENCY_CHOICE', {
            playerId: gameStateV2.playerId,
            choice: choice
        });
    }
}

function flipParaCard(cardEl, letter) {
    if (!cardEl) return;
    
    // Si es operador y no ha tomado el control, no puede voltear manualmente
    if (gameStateV2.userRole === 'operator' && gameStateV2.paraAgencyChoice !== 'take') {
        return;
    }

    cardEl.classList.toggle('flipped');
    if (letter) {
        flippedParaCards.add(letter);
    }

    // Si es facilitador, transmitir volteo a todos los que cedieron el control
    if (gameStateV2.userRole === 'facilitator' && letter) {
        broadcastSyncEvent('FAC_FLIP_PARA_CARD', { cardLetter: letter });
    }
    
    checkParaCardsCompletion();
}

function facFlipParaCard(letter) {
    const map = {
        'P': 'para-card-p',
        'A1': 'para-card-a1',
        'R': 'para-card-r',
        'A2': 'para-card-a2'
    };
    const cardEl = document.getElementById(map[letter]);
    if (cardEl && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
    }
    flippedParaCards.add(letter);
    broadcastSyncEvent('FAC_FLIP_PARA_CARD', { cardLetter: letter });
    checkParaCardsCompletion();
}

function remoteFlipParaCard(letter) {
    if (gameStateV2.paraAgencyChoice !== 'surrender') return;
    const map = {
        'P': 'para-card-p',
        'A1': 'para-card-a1',
        'R': 'para-card-r',
        'A2': 'para-card-a2'
    };
    const cardEl = document.getElementById(map[letter]);
    if (cardEl && !cardEl.classList.contains('flipped')) {
        cardEl.classList.add('flipped');
    }
    flippedParaCards.add(letter);
    checkParaCardsCompletion();
}

function checkParaCardsCompletion() {
    const startBtn = document.getElementById('para-start-case-btn');
    if (startBtn) {
        const count = flippedParaCards.size;
        if (count >= 4) {
            startBtn.disabled = false;
            startBtn.classList.remove('btn-disabled-mission');
            startBtn.innerHTML = `
                <span class="detroit-btn-glow"></span>
                <span class="btn-text">🚀 CONTINUAR AL OBJETIVO DEL SISTEMA ▶</span>
            `;
            startBtn.onclick = () => openGameObjectiveModal();
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('btn-disabled-mission');
            const btnText = startBtn.querySelector('.btn-text');
            if (btnText) btnText.innerText = `🔒 VOLTEA TODAS LAS TARJETAS (${count}/4)`;
        }
    }
}

function facForceParaSurrender() {
    if (typeof facState !== 'undefined' && facState.connectedPlayers) {
        facState.connectedPlayers.forEach(p => {
            if (!p.paraAgencyChoice) {
                p.paraAgencyChoice = 'surrender';
            }
        });
        updateFacParaAgencyUI();
    }
    broadcastSyncEvent('FAC_FORCE_PARA_SURRENDER', {});
}

function updateFacParaAgencyUI() {
    if (typeof facState === 'undefined' || !facState.connectedPlayers) return;
    const players = facState.connectedPlayers;
    const total = players.length;
    const decidedPlayers = players.filter(p => p.paraAgencyChoice);
    const decided = decidedPlayers.length;
    const takeCount = players.filter(p => p.paraAgencyChoice === 'take').length;
    const surrenderCount = players.filter(p => p.paraAgencyChoice === 'surrender').length;

    const takePct = decided > 0 ? Math.round((takeCount / decided) * 100) : 0;
    const surrenderPct = decided > 0 ? Math.round((surrenderCount / decided) * 100) : 0;

    const elCounter = document.getElementById('fac-para-decided-counter');
    const elTake = document.getElementById('fac-para-take-metric');
    const elSurrender = document.getElementById('fac-para-surrender-metric');

    if (elCounter) elCounter.innerText = `${decided} / ${total} Operadores han decidido`;
    if (elTake) elTake.innerText = `${takePct}% (${takeCount})`;
    if (elSurrender) elSurrender.innerText = `${surrenderPct}% (${surrenderCount})`;
}

function openGameObjectiveModal() {
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'game-objective-overlay' });
    }
    updateGateUI();
}

function closeGameObjectiveModalAndStartGame() {
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'none';
    startCaseSequence(0);
}

// ==========================================================================
// RUNNER DE CASOS (CON NAVEGACIÓN EN 3 MOMENTOS DE IMAGEN)
// ==========================================================================

function startCaseSequence(caseIdx) {
    gameStateV2.currentCaseIndex = caseIdx;
    const cData = casesDataV2[caseIdx];

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_CASE_ENTER', { playerId: gameStateV2.playerId, caseIndex: caseIdx });
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'screen-case' });
    }

    // Reiniciar tracking de P.A.R.A. para este caso
    gameStateV2.paraState = {
        pUsed: false,
        activeTab: 'P',
        aOpened: false,
        completedAnalyses: [],
        analysisIndex: 0,
        rOpened: false,
        rIndex: 0,
        completedReviews: [],
        rResourcesOpened: [],
        unlockedActions: [],
        finalActionId: null,
        finalActionText: null,
        routeTag: 'Respuesta directa'
    };

    // Caso 2: Lanzar dado 50/50 para variante
    if (cData.id === "case_2") {
        gameStateV2.currentCaseVariant = Math.random() < 0.5 ? "legitimate" : "malicious";
    } else {
        gameStateV2.currentCaseVariant = null;
    }

    // Reiniciar 3 Tokens de Pausa por Caso
    gameStateV2.casePauseTokens = 3;
    gameStateV2.initialImpulse = null;
    gameStateV2.impulseStartTime = null;
    gameStateV2.currentCaseImpulseData = null;
    gameStateV2.caseTimerSeconds = cData.durationSeconds || 180;
    gameStateV2.isTimerPaused = false;
    gameStateV2.isPauseActive = false;
    clearInterval(gameStateV2.timerInterval);

    // REGLA 9 V3: Asignación aleatoria de 3 alternativas visibles en Actuar y 3 ocultas para Revisar
    if (cData.actionAlternatives && Array.isArray(cData.actionAlternatives) && cData.actionAlternatives.length === 6) {
        const shuffled = [...cData.actionAlternatives].sort(() => Math.random() - 0.5);
        gameStateV2.caseActiveInitialActions = shuffled.slice(0, 3);
        gameStateV2.caseActiveHiddenActions = shuffled.slice(3, 6);
    } else {
        gameStateV2.caseActiveInitialActions = cData.initialActions || [];
        gameStateV2.caseActiveHiddenActions = cData.reviewResources || [];
    }

    // MOMENTO 1: Cargar Pantalla de Introducción del Caso
    document.getElementById('case-phase-intro').style.display = 'block';
    document.getElementById('case-phase-gameplay').style.display = 'none';
    const metricsPanel = document.getElementById('case-phase-metrics-a');
    if (metricsPanel) metricsPanel.style.display = 'none';
    document.getElementById('case-phase-feedback').style.display = 'none';

    // Configuración de Presentadores del Equipo (Javier: Casos 1 y 3, Dave: Casos 2 y 4)
    const presenterConfig = [
        { name: "JAVIER // SEGURIDAD OPERATIVA", avatar: "assets/images/javier_avatar.jpg" }, // Caso 1
        { name: "DAVE // ARQUITECTURA DE SISTEMAS", avatar: "assets/images/dave_avatar.jpg" }, // Caso 2
        { name: "JAVIER // SEGURIDAD OPERATIVA", avatar: "assets/images/javier_avatar.jpg" }, // Caso 3
        { name: "DAVE // ARQUITECTURA DE SISTEMAS", avatar: "assets/images/dave_avatar.jpg" }  // Caso 4
    ];
    const pres = presenterConfig[caseIdx] || presenterConfig[0];
    const presNameEl = document.getElementById('case-intro-presenter-name');
    const presAvatarEl = document.getElementById('case-intro-presenter-avatar');
    if (presNameEl) presNameEl.innerText = pres.name;
    if (presAvatarEl) presAvatarEl.src = pres.avatar;

    document.getElementById('case-intro-img-16-4').src = cData.image;
    document.getElementById('case-intro-title-id').innerText = cData.title;
    document.getElementById('case-intro-target-module').innerText = cData.targetModule;
    
    // Iniciar efecto máquina de escribir en el diálogo del presentador
    runTypewriter('case-intro-description-text', cData.introDescription || '', 10);

    const caseNumStr = String(caseIdx + 1).padStart(2, '0');
    const startBtnText = document.getElementById('case-intro-start-btn-text');
    if (startBtnText) {
        startBtnText.innerText = `▶ INGRESAR AL CASO ${caseNumStr}`;
    }

    switchScreenV2('screen-case');
}

function proceedFromIntroToGame() {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];

    // MOMENTO 2: Entrar al Gameplay del Caso
    document.getElementById('case-phase-intro').style.display = 'none';
    document.getElementById('case-phase-gameplay').style.display = 'block';

    // Sub-fase 2A: Briefing e Impulso
    document.getElementById('case-subphase-brief').style.display = 'block';
    document.getElementById('case-subphase-para').style.display = 'none';

    // Cargar Banner Cropped
    document.getElementById('case-gameplay-banner-img').src = cData.image;
    document.getElementById('case-gameplay-title-tag').innerText = cData.title;
    document.getElementById('case-stimulus-content').innerHTML = cData.stimulusHtml;

    // Cargar Contenido Completo del Caso en la Cortina Desplegable
    const curtainContentEl = document.getElementById('full-case-curtain-content');
    if (curtainContentEl) {
        curtainContentEl.innerHTML = cData.stimulusHtml;
    }
    // Asegurar que la cortina inicie cerrada
    const curtainEl = document.getElementById('full-case-curtain');
    if (curtainEl) curtainEl.style.display = 'none';

    // Cargar Resumen Corto del Caso para recordación permanente
    const summaryTextEl = document.getElementById('case-short-summary-text');
    if (summaryTextEl) {
        summaryTextEl.innerText = cData.shortSummary || cData.introDescription;
    }

    // Registrar marca de tiempo de inicio de lectura de impulso
    gameStateV2.impulseStartTime = Date.now();

    // En la sub-fase 2A el caso ya es visible directamente en pantalla: desactivar el botón de la cortina
    const curtainBtn = document.getElementById('curtain-toggle-btn');
    if (curtainBtn) {
        curtainBtn.disabled = true;
        curtainBtn.style.opacity = '0.35';
        curtainBtn.style.cursor = 'not-allowed';
        curtainBtn.title = "El caso ya está visible en pantalla";
    }

    // Cargar Botones de Impulso Inicial
    const impContainer = document.getElementById('impulse-options-container');
    impContainer.innerHTML = '';
    cData.impulses.forEach((imp, idx) => {
        const btn = document.createElement('button');
        btn.className = 'impulse-btn';
        btn.innerText = imp.text;
        const impId = imp.id || `imp_${idx + 1}`;
        btn.onclick = () => recordInitialImpulse(imp.text, impId);
        impContainer.appendChild(btn);
    });

    // Iniciar Temporizador de Impulso (59 Segundos)
    let impulseTime = 59;
    const impulseTimerEl = document.getElementById('impulse-timer-display');
    if (impulseTimerEl) impulseTimerEl.innerText = `⏱ ${impulseTime}s`;

    const impulseInterval = setInterval(() => {
        impulseTime--;
        if (impulseTimerEl) impulseTimerEl.innerText = `⏱ ${impulseTime}s`;
        if (impulseTime <= 0 || gameStateV2.initialImpulse) {
            clearInterval(impulseInterval);
            if (!gameStateV2.initialImpulse) {
                recordInitialImpulse("Sin respuesta impulsiva registrada (Expiró 59s)", "timeout");
            }
        }
    }, 1000);
}

function toggleCaseCurtain() {
    const btn = document.getElementById('curtain-toggle-btn');
    if (btn && btn.disabled) return;

    const curtain = document.getElementById('full-case-curtain');
    const arrow = document.getElementById('curtain-arrow-icon');
    if (!curtain) return;

    // Asegurar que el contenido del caso esté inyectado
    const curtainContentEl = document.getElementById('full-case-curtain-content');
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    if (curtainContentEl && cData && (!curtainContentEl.innerHTML || curtainContentEl.innerHTML.trim() === '')) {
        curtainContentEl.innerHTML = cData.stimulusHtml;
    }

    const isExpanded = curtain.classList.contains('expanded') || curtain.style.display === 'block';

    if (!isExpanded) {
        curtain.classList.add('expanded');
        curtain.style.display = 'block';
        if (arrow) arrow.innerText = '🔼';
        if (btn) btn.innerHTML = '<span>OCULTAR CASO</span> <span class="curtain-arrow" id="curtain-arrow-icon">🔼</span>';
    } else {
        curtain.classList.remove('expanded');
        curtain.style.display = 'none';
        if (arrow) arrow.innerText = '🔽';
        if (btn) btn.innerHTML = '<span>VER CASO COMPLETO</span> <span class="curtain-arrow" id="curtain-arrow-icon">🔽</span>';
    }
}

function recordInitialImpulse(impulseText, impulseId) {
    gameStateV2.initialImpulse = impulseText;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_INITIAL_REACTION', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    const respTimeSec = gameStateV2.impulseStartTime ? ((Date.now() - gameStateV2.impulseStartTime) / 1000) : 0;
    gameStateV2.currentCaseImpulseData = {
        id: impulseId || 'unknown',
        text: impulseText,
        responseTimeSeconds: parseFloat(respTimeSec.toFixed(1))
    };

    // Al pasar al Hub P.A.R.A., reactivar el botón de cortina
    const curtainBtn = document.getElementById('curtain-toggle-btn');
    if (curtainBtn) {
        curtainBtn.disabled = false;
        curtainBtn.style.opacity = '1';
        curtainBtn.style.cursor = 'pointer';
        curtainBtn.title = "Ver o desplegar el caso completo";
    }

    // Transición a Sub-fase 2B: Hub P.A.R.A.
    document.getElementById('case-subphase-brief').style.display = 'none';
    document.getElementById('case-subphase-para').style.display = 'block';

    // Iniciar Temporizador Principal del Caso
    startCaseMainTimer();
    updateCaseUIState();
    renderParaDashboard();
}

function startCaseMainTimer() {
    clearInterval(gameStateV2.timerInterval);
    updateCaseTimerDisplay();

    gameStateV2.timerInterval = setInterval(() => {
        if (!gameStateV2.isTimerPaused) {
            gameStateV2.caseTimerSeconds--;
            updateCaseTimerDisplay();

            if (gameStateV2.caseTimerSeconds <= 0) {
                clearInterval(gameStateV2.timerInterval);
                handleCaseTimeout();
            }
        }
    }, 1000);
}

function updateCaseTimerDisplay() {
    const timerEl = document.getElementById('case-main-timer');
    if (!timerEl) return;

    const mins = Math.floor(gameStateV2.caseTimerSeconds / 60);
    const secs = gameStateV2.caseTimerSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateCaseUIState() {
    document.getElementById('current-route-tag').innerText = gameStateV2.paraState.routeTag;
    
    // Bombillos Pausa P (Inician 3 encendidos, se apagan al usar)
    const b1 = document.getElementById('p-bulb-1');
    const b2 = document.getElementById('p-bulb-2');
    const b3 = document.getElementById('p-bulb-3');

    if (b1) b1.className = gameStateV2.casePauseTokens >= 1 ? 'pause-bulb active' : 'pause-bulb used';
    if (b2) b2.className = gameStateV2.casePauseTokens >= 2 ? 'pause-bulb active' : 'pause-bulb used';
    if (b3) b3.className = gameStateV2.casePauseTokens >= 3 ? 'pause-bulb active' : 'pause-bulb used';

    // Bombillos Analizar A (Inician 3 apagados, se encienden al desbloquear)
    const completedCount = (gameStateV2.paraState.completedAnalyses || []).length;
    const a1 = document.getElementById('a-bulb-1');
    const a2 = document.getElementById('a-bulb-2');
    const a3 = document.getElementById('a-bulb-3');

    if (a1) a1.className = completedCount >= 1 ? 'analizar-bulb active' : 'analizar-bulb off';
    if (a2) a2.className = completedCount >= 2 ? 'analizar-bulb active' : 'analizar-bulb off';
    if (a3) a3.className = completedCount >= 3 ? 'analizar-bulb active' : 'analizar-bulb off';

    const aSub = document.querySelector('#btn-para-a .btn-sub');
    if (aSub) aSub.innerText = `Puertas (${completedCount}/3)`;



    const pBtn = document.getElementById('btn-para-p');
    if (pBtn) {
        if (gameStateV2.isPauseActive || gameStateV2.casePauseTokens <= 0) {
            pBtn.disabled = true;
            pBtn.style.opacity = '0.4';
            pBtn.style.cursor = 'not-allowed';
        } else {
            pBtn.disabled = false;
            pBtn.style.opacity = '1';
            pBtn.style.cursor = 'pointer';
        }
    }
}

// ==========================================================================
// BOTONES P.A.R.A. (PAUSAR, ANALIZAR, REVISAR, ACTUAR)
// ==========================================================================

function executeParaP() {
    gameStateV2.paraState.activeTab = 'P';

    if (gameStateV2.isPauseActive) {
        renderParaDashboard();
        return;
    }

    if (gameStateV2.casePauseTokens <= 0) {
        renderParaDashboard();
        alert("⚠️ No te quedan tokens de Pausa para este caso.");
        return;
    }

    gameStateV2.casePauseTokens--;
    gameStateV2.paraState.pUsed = true;
    gameStateV2.paraState.pausesUsedCount = (gameStateV2.paraState.pausesUsedCount || 0) + 1;
    gameStateV2.isTimerPaused = true;
    gameStateV2.isPauseActive = true;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_PAUSE', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    // REGLA DE NEGOCIO: Cada pausa accionada reduce 1 punto en Reactividad
    applyHudReactivityDelta(-1);

    updateCaseUIState();
    renderParaDashboard();

    const display = document.getElementById('para-content-display');
    display.innerHTML = `
        <div style="background:rgba(0,216,255,0.08); border:1.5px solid var(--color-cyan); padding:16px; border-radius:8px; text-align:center;">
            <h3 style="color:var(--color-cyan); margin-bottom:6px;">⏸ TIEMPO CONGELADO POR 15 SEGUNDOS</h3>
            <p style="font-size:13.5px; color:#d8eaff; margin-bottom:6px;">“Pausar no resuelve el problema, pero te da espacio para mirar mejor.”</p>
            <div style="font-size:12px; color:var(--color-agency-green); font-weight:700; margin-bottom:8px;">⚡ Reactividad: -1</div>
            <div style="margin-top:4px; font-weight:bold; font-family:var(--font-mono); color:var(--color-cyan); font-size:22px;" id="pause-countdown-text">15s</div>
        </div>
    `;

    let pCount = 15;
    const pInterval = setInterval(() => {
        pCount--;
        const cntEl = document.getElementById('pause-countdown-text');
        if (cntEl) cntEl.innerText = `${pCount}s`;
        if (pCount <= 0) {
            clearInterval(pInterval);
            gameStateV2.isTimerPaused = false;
            gameStateV2.isPauseActive = false;
            updateCaseUIState();
            renderParaDashboard();
        }
    }, 1000);
}

function renderParaDashboard() {
    const display = document.getElementById('para-content-display');
    if (!display) return;

    const activeTab = gameStateV2.paraState.activeTab || 'P';

    // 1. Actualizar estado de clase active-tab en los 4 botones (Mueve la flecha luminosa)
    const btnP = document.getElementById('btn-para-p');
    const btnA = document.getElementById('btn-para-a');
    const btnR = document.getElementById('btn-para-r');
    const btnA2 = document.getElementById('btn-para-a2');

    if (btnP) btnP.classList.toggle('active-tab', activeTab === 'P');
    if (btnA) btnA.classList.toggle('active-tab', activeTab === 'A');
    if (btnR) btnR.classList.toggle('active-tab', activeTab === 'R');
    if (btnA2) btnA2.classList.toggle('active-tab', activeTab === 'A2');

    // 2. Actualizar tema de borde neón del contenedor Dashboard según la letra activa
    display.classList.remove('dash-theme-p', 'dash-theme-a', 'dash-theme-r', 'dash-theme-a2');
    if (activeTab === 'P') display.classList.add('dash-theme-p');
    else if (activeTab === 'A') display.classList.add('dash-theme-a');
    else if (activeTab === 'R') display.classList.add('dash-theme-r');
    else if (activeTab === 'A2') display.classList.add('dash-theme-a2');

    const completedA = gameStateV2.paraState.completedAnalyses || [];
    const completedR = gameStateV2.paraState.completedReviews || [];
    const pUsed = gameStateV2.paraState.pUsed;

    let html = '';

    // 3. Renderizar únicamente el contenido filtrado por la letra seleccionada
    if (activeTab === 'P') {
        if (pUsed) {
            html = `
                <div class="para-dashboard-card p-theme">
                    <div class="dash-card-header">
                        <span class="dash-letter-tag p-tag">P</span>
                        <strong class="dash-card-title" style="color:var(--color-cyan);">PAUSAR // TIEMPO CONGELADO 15S</strong>
                    </div>
                    <p class="dash-card-text">Pausa realizada con éxito. El tiempo principal del caso se congeló por 15 segundos para detener la respuesta automática y deliberar con calma.</p>
                </div>
            `;
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-cyan);">⏸ Aún no has utilizado <strong>Pausar (P)</strong>. Haz clic en el botón de Pausar para congelar el tiempo 15s y tener más tiempo para deliberar.</p>
                </div>
            `;
        }
    } else if (activeTab === 'A') {
        if (completedA.length > 0) {
            completedA.forEach((item) => {
                const doorObj = (item.doorKey && ATTENTION_DOORS[item.doorKey]) ? ATTENTION_DOORS[item.doorKey] : { name: item.doorKey || 'Atención', icon: '🚪' };
                html += `
                    <div class="para-dashboard-card a-theme" style="margin-bottom:12px;">
                        <div class="dash-card-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="dash-letter-tag a-tag">A</span>
                                <strong class="dash-card-title" style="color:#a29bfe;">ANALIZAR // ${item.title}</strong>
                            </div>
                            <span style="background:rgba(162,155,254,0.18); border:1px solid #a29bfe; color:#ffffff; font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:4px;">
                                ${doorObj.icon} PUERTA: ${doorObj.name.toUpperCase()}
                            </span>
                        </div>
                        <p class="dash-card-text" style="font-weight:600; color:#ffffff; margin-top:6px;">“${item.reflectionText}”</p>
                        <div style="background:rgba(162,155,254,0.1); padding:8px 12px; border-radius:4px; border-left:3px solid #a29bfe; margin-top:6px;">
                            <strong style="color:#a29bfe; font-size:12px;">✔ Tu Percepción:</strong>
                            <span style="font-size:13px; color:#ffffff; margin-left:4px;">${item.selectedText}</span>
                            <div style="font-size:11.5px; color:#c4bbf0; margin-top:4px;">🚪 <strong>Puerta Activada:</strong> <span style="color:var(--color-cyan); font-weight:700;">${doorObj.icon} ${doorObj.name}</span></div>
                        </div>
                        <p style="font-size:12px; color:var(--color-agency-green); margin-top:4px; font-style:italic;">${item.feedback}</p>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:#a29bfe;">🔍 Aún no has examinado Puertas de <strong>Analizar (A)</strong>. Haz clic en el botón de Analizar para abrir la primera puerta metacognitiva.</p>
                </div>
            `;
        }
    } else if (activeTab === 'R') {
        const reviewsMap = gameStateV2.paraState.reviewsState || {};
        const reviewItems = Object.values(reviewsMap);

        if (reviewItems.length > 0) {
            reviewItems.forEach((item) => {
                const isConsidered = item.decision === 'considered';
                if (isConsidered) {
                    html += `
                        <div class="para-dashboard-card r-theme clickable-card" style="margin-bottom:12px;" onclick="reopenReviewDecision('${item.id}')">
                            <div class="dash-card-header">
                                <span class="dash-letter-tag r-tag">R</span>
                                <strong class="dash-card-title" style="color:var(--color-agency-green);">REVISAR // ${item.name}</strong>
                                <span style="background:rgba(73,245,193,0.2); color:var(--color-agency-green); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:auto;">✔ CONSIDERADA</span>
                            </div>
                            <p class="dash-card-text">${item.text}</p>
                            <div style="background:rgba(73,245,193,0.08); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-agency-green); margin-top:4px;">
                                <strong style="color:var(--color-agency-green); font-size:12px;">Efectos de la Evidencia:</strong>
                                <p style="font-size:12px; color:#ffffff; margin-top:2px;">${item.feedback}</p>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="para-dashboard-card rejected-theme clickable-card" style="margin-bottom:12px;" onclick="reopenReviewDecision('${item.id}')">
                            <div class="dash-card-header">
                                <span class="dash-letter-tag" style="background:rgba(255,181,71,0.2); color:var(--color-warning-amber); border:1px solid var(--color-warning-amber); padding:2px 8px; border-radius:4px; font-weight:800;">R</span>
                                <strong class="dash-card-title" style="color:var(--color-warning-amber);">REVISAR // ${item.name}</strong>
                                <span style="background:rgba(255,181,71,0.2); color:var(--color-warning-amber); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:auto;">❌ NO CONSIDERADA (CLIC PARA CAMBIAR)</span>
                            </div>
                            <p class="dash-card-text" style="color:#e0d0b8;">${item.text}</p>
                            <div style="background:rgba(255,181,71,0.08); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-warning-amber); margin-top:4px;">
                                <strong style="color:var(--color-warning-amber); font-size:12px;">Decisión de Rechazo:</strong>
                                <p style="font-size:12px; color:#ffffff; margin-top:2px;">${item.feedback}</p>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-agency-green);">📋 Aún no has consultado Evidencias de <strong>Revisar (R)</strong>. Haz clic en el botón de Revisar para abrir los datos e investigar.</p>
                </div>
            `;
        }
    } else if (activeTab === 'A2') {
        if (gameStateV2.paraState.finalActionText) {
            html = `
                <div class="para-dashboard-card a2-theme">
                    <div class="dash-card-header">
                        <span class="dash-letter-tag a2-tag">A</span>
                        <strong class="dash-card-title" style="color:var(--color-warning-amber);">ACTUAR // DECISIÓN FINAL EJECUTADA</strong>
                    </div>
                    <p class="dash-card-text" style="font-weight:600; color:#ffffff;">Acciones Seleccionadas: ${gameStateV2.paraState.finalActionText}</p>
                    <div style="background:rgba(255,181,71,0.1); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-warning-amber); margin-top:6px;">
                        <strong style="color:var(--color-warning-amber); font-size:12px;">Estado del Caso:</strong>
                        <p style="font-size:12px; color:#ffffff; margin-top:2px;">Decisión multiselección procesada e irreversible. Caso finalizado con éxito.</p>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-warning-amber);">⚡ La sección <strong>Actuar (A)</strong> te permite seleccionar una o múltiples opciones disponibles para ejecutar la decisión final del caso.</p>
                </div>
            `;
        }
    }

    display.innerHTML = html;
    display.scrollTop = display.scrollHeight;
}

function executeParaA() {
    gameStateV2.paraState.activeTab = 'A';
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    
    // Soporta formato V3 signalsAnalysis o formato legacy analysisRounds
    let rounds = [];
    if (cData.signalsAnalysis && Array.isArray(cData.signalsAnalysis) && cData.signalsAnalysis.length > 0) {
        rounds = cData.signalsAnalysis.map((sig, sIdx) => ({
            id: sig.signalId || (sIdx + 1),
            title: `SEÑAL ${sIdx + 1} // ${(sig.cognitiveVulnerability || 'OBSERVACIÓN ATENCIONAL').toUpperCase()}`,
            reflectionText: sig.signalQuote,
            question: "¿Qué despierta o activa en ti esta información en primera instancia?",
            options: (sig.doorsOptions || []).map(d => ({
                text: d.visibleStatement,
                doorKey: d.doorKey,
                feedback: "✔ Observación realizada: Identificaste la influencia atencional en tu deliberación."
            }))
        }));
    } else {
        rounds = cData.analysisRounds || [];
    }

    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');
    const currIdx = gameStateV2.paraState.analysisIndex || 0;

    // Si ya se completaron las 3 tarjetas, NO se abre modal. Se muestra directamente el Dashboard.
    if (currIdx >= rounds.length) {
        renderParaDashboard();
        const display = document.getElementById('para-content-display');
        if (display) {
            display.scrollTop = 0;
        }
        return;
    }

    const currentExercise = rounds[currIdx];

    let optionsHtml = currentExercise.options.map((opt, optIdx) => `
        <button class="analizar-option-btn" onclick="submitAnalysisAnswer(${currIdx}, ${optIdx})">
            <span class="opt-bullet">${String.fromCharCode(65 + optIdx)})</span>
            <span class="opt-text">${opt.text}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:#a29bfe; font-family:var(--font-heading); font-size:14px;">ANALIZAR // PUERTAS METACOGNITIVAS (${currIdx + 1}/${rounds.length})</h3>
            <button class="fac-btn" onclick="closeParaModal()">✖</button>
        </div>

        <div style="background:#03080f; border:2px solid #a29bfe; border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(162,155,254,0.3);">
            <strong style="color:#a29bfe; font-size:11.5px; font-family:var(--font-heading); display:block; margin-bottom:4px;">${currentExercise.title}</strong>
            <p style="font-size:13.5px; color:#ffffff; line-height:1.45;">“${currentExercise.reflectionText}”</p>
        </div>

        <div style="background:rgba(162,155,254,0.06); border:1px solid rgba(162,155,254,0.2); padding:14px; border-radius:8px;">
            <strong style="font-size:13px; color:#a29bfe; display:block; margin-bottom:8px;">PREGUNTA DE OBSERVAR SUPUESTOS:</strong>
            <p style="font-size:13px; color:#e2f1ff; margin-bottom:12px;">${currentExercise.question || "¿Qué despierta o activa en ti esta información en primera instancia?"}</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${optionsHtml}
            </div>
        </div>
    `;

    overlay.style.display = 'flex';
}

function submitAnalysisAnswer(roundIdx, optIdx) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    
    let rounds = [];
    if (cData.signalsAnalysis && Array.isArray(cData.signalsAnalysis) && cData.signalsAnalysis.length > 0) {
        rounds = cData.signalsAnalysis.map((sig, sIdx) => ({
            id: sig.signalId || (sIdx + 1),
            title: `SEÑAL ${sIdx + 1} // ${(sig.cognitiveVulnerability || 'OBSERVACIÓN ATENCIONAL').toUpperCase()}`,
            reflectionText: sig.signalQuote,
            question: "¿Qué despierta o activa en ti esta información en primera instancia?",
            options: (sig.doorsOptions || []).map(d => ({
                text: d.visibleStatement,
                doorKey: d.doorKey,
                feedback: "✔ Observación realizada: Identificaste la influencia atencional en tu deliberación."
            }))
        }));
    } else {
        rounds = cData.analysisRounds || [];
    }

    const exercise = rounds[roundIdx];
    const selectedOpt = exercise.options[optIdx];

    // REGLAS DE NEGOCIO ANALIZAR:
    // 1. Calibración: siempre aumenta en +1 unidad
    applyHudCalibrationDelta(1);

    // 2. Reactividad: asignación 50/50 (azar). Si afecta, disminuye en 1 (-1)
    const affectsReactivity = Math.random() < 0.5;
    if (affectsReactivity) {
        applyHudReactivityDelta(-1);
    }

    if (!gameStateV2.paraState.completedAnalyses) {
        gameStateV2.paraState.completedAnalyses = [];
    }

    // Registrar puerta de atención activada
    const doorKey = selectedOpt.doorKey || null;
    if (doorKey) {
        if (!gameStateV2.paraState.doorsActivated) {
            gameStateV2.paraState.doorsActivated = [];
        }
        gameStateV2.paraState.doorsActivated.push(doorKey);
    }

    gameStateV2.paraState.completedAnalyses.push({
        title: exercise.title,
        reflectionText: exercise.reflectionText,
        selectedText: selectedOpt.text,
        doorKey: doorKey,
        feedback: selectedOpt.feedback,
        calibrationDelta: 1,
        reactivityDelta: affectsReactivity ? -1 : 0,
        reactivityAffected: affectsReactivity
    });

    gameStateV2.paraState.analysisIndex = (gameStateV2.paraState.analysisIndex || 0) + 1;
    gameStateV2.paraState.aOpened = true;
    gameStateV2.paraState.activeTab = 'A';
    gameStateV2.paraState.routeTag = `Análisis (${gameStateV2.paraState.completedAnalyses.length}/${rounds.length})`;
    updateCaseUIState();

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_ANALYSIS', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    const modal = document.getElementById('para-modal-card');
    const doorObj = (doorKey && ATTENTION_DOORS[doorKey]) ? ATTENTION_DOORS[doorKey] : { name: doorKey || 'Atención', icon: '🚪' };
    if (!modal) return;

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:12px;">
            <h3 style="color:#a29bfe; font-family:var(--font-heading); font-size:14px; margin:0;">ANALIZAR // OBSERVACIÓN DE SUPUESTOS</h3>
            <span style="font-size:10.5px; color:#49f5c1; font-family:var(--font-mono); font-weight:700; letter-spacing:0.5px;">PROCESANDO REFLEXIÓN</span>
        </div>

        <div style="background:#03080f; border:1.5px solid #a29bfe; border-radius:6px; padding:12px; margin-bottom:10px;">
            <strong style="color:#a29bfe; font-size:11px; font-family:var(--font-heading); display:block; margin-bottom:2px;">${exercise.title}</strong>
            <p style="font-size:12.5px; color:#cde4f7; line-height:1.35; margin:0;">“${exercise.reflectionText}”</p>
        </div>

        <div style="background:rgba(162,155,254,0.08); border:1px solid rgba(162,155,254,0.25); padding:12px; border-radius:6px; margin-bottom:12px;">
            <strong style="font-size:11.5px; color:#ffffff; display:block; margin-bottom:2px;">TU OBSERVACIÓN:</strong>
            <p style="font-size:12.5px; color:#a29bfe; font-weight:600; margin:0 0 8px 0;">“${selectedOpt.text}”</p>
            
            <div style="background:rgba(162,155,254,0.15); border:1px solid #a29bfe; padding:8px 12px; border-radius:6px; margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">${doorObj.icon}</span>
                <div>
                    <span style="font-size:10px; color:#c4bbf0; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; display:block;">PUERTA DE ATENCIÓN IDENTIFICADA:</span>
                    <strong style="font-size:13px; color:var(--color-cyan); font-family:var(--font-heading);">${doorObj.name}</strong>
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:4px; border-left:3px solid var(--color-agency-green);">
                <p style="font-size:12px; color:#49f5c1; margin:0; line-height:1.35;">${selectedOpt.feedback || "✔ Observación realizada: Identificaste la influencia atencional en tu deliberación."}</p>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                <span style="font-size:11px; background:rgba(0,216,255,0.12); border:1px solid var(--color-cyan); color:var(--color-cyan); padding:2px 8px; border-radius:4px; font-weight:700;">🎯 Calibración: +1</span>
                <span style="font-size:11px; background:${affectsReactivity ? 'rgba(73,245,193,0.15)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${affectsReactivity ? 'var(--color-agency-green)' : 'rgba(255,255,255,0.2)'}; color:${affectsReactivity ? 'var(--color-agency-green)' : 'var(--color-text-muted)'}; padding:2px 8px; border-radius:4px; font-weight:700;">
                    ⚡ Reactividad: ${affectsReactivity ? '-1' : '0'}
                </span>
            </div>
        </div>

        <div style="display:flex; justify-content:flex-end;">
            <button class="btn-detroit-primary" style="background:rgba(162,155,254,0.2); border-color:#a29bfe; color:#fff;" onclick="closeParaModalAndRenderDashboard()">
                <span class="btn-text">CONTINUAR ▶</span>
            </button>
        </div>
    `;
}

let analysisCountdownInterval = null;

function finishAnalysisFeedbackEarly() {
    clearInterval(analysisCountdownInterval);
    closeParaModal();
    renderParaDashboard();
}

function answerAnalysisQuestion(answer) {
    gameStateV2.paraState.aAnswered = answer;
    closeParaModal();

    const display = document.getElementById('para-content-display');
    display.innerHTML = `
        <div style="background:rgba(162,155,254,0.08); border-left:4px solid #a29bfe; padding:14px; border-radius:0 6px 6px 0;">
            <strong style="color:#a29bfe; font-size:13px;">🔍 ANÁLISIS METACOGNITIVO REGISTRADO:</strong>
            <p style="font-size:13px; margin-top:4px;">Reconociste que tu decisión está influida por: <strong>${answer}</strong>.</p>
            <p style="font-size:12px; color:var(--color-text-muted); margin-top:6px;">Observar tus supuestos te otorga mayor perspectiva para decidir.</p>
        </div>
    `;
}

function executeParaR() {
    gameStateV2.paraState.activeTab = 'R';
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    
    // Soporta alternativas ocultas V3 o recursos de revisión legacy
    let resources = [];
    if (gameStateV2.caseActiveHiddenActions && gameStateV2.caseActiveHiddenActions.length > 0) {
        resources = gameStateV2.caseActiveHiddenActions.map((act, idx) => ({
            id: act.id || `hidden_act_${idx + 1}`,
            name: act.actionText || act.text,
            text: act.extendedContext || act.text,
            actionId: act.id,
            actionText: act.actionText || act.text,
            feedbackConsidered: act.considerFeedback || `✔ Considerada: Se ha añadido la opción '${act.actionText || act.text}' en ACTUAR.`,
            feedbackRejected: `✖ No Considerada: Desestimaste esta alternativa de acción. NO se añadirá en ACTUAR.`
        }));
    } else {
        resources = cData.reviewResources || [];
    }

    const currIdx = gameStateV2.paraState.rIndex || 0;

    // Si ya se examinaron todas las evidencias principales de R
    if (currIdx >= resources.length) {
        renderParaDashboard();
        const display = document.getElementById('para-content-display');
        if (display) display.scrollTop = 0;
        return;
    }

    const currentRes = resources[currIdx];
    openReviewModalForResource(currentRes, currIdx);
}

function openReviewModalForResource(currentRes, resIdx) {
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');

    let textToShow = currentRes.text;
    if (currentRes.variantText && gameStateV2.currentCaseVariant) {
        textToShow = currentRes.variantText[gameStateV2.currentCaseVariant];
    }

    const existingState = (gameStateV2.paraState.reviewsState || {})[currentRes.id];
    let currentDecisionTag = "";
    if (existingState) {
        if (existingState.decision === 'considered') {
            currentDecisionTag = `<div style="background:rgba(73,245,193,0.15); border:1px solid var(--color-agency-green); color:var(--color-agency-green); padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; margin-bottom:10px;">✔ ESTADO ACTUAL: CONSIDERADA</div>`;
        } else {
            currentDecisionTag = `<div style="background:rgba(255,181,71,0.15); border:1px solid var(--color-warning-amber); color:var(--color-warning-amber); padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; margin-bottom:10px;">❌ ESTADO ACTUAL: NO CONSIDERADA</div>`;
        }
    }

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:var(--color-agency-green); font-family:var(--font-heading); font-size:14px;">REVISAR // EVIDENCIA: ${currentRes.name.toUpperCase()}</h3>
            <button class="fac-btn" onclick="closeParaModal()">✖</button>
        </div>

        ${currentDecisionTag}

        <div style="background:#03080f; border:2.5px solid var(--color-agency-green); border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(73,245,193,0.25);">
            <strong style="color:var(--color-agency-green); font-size:12px; font-family:var(--font-heading); display:block; margin-bottom:6px;">📋 ${currentRes.name}</strong>
            <p style="font-size:13.5px; color:#ffffff; line-height:1.45;">${textToShow}</p>
        </div>

        <p style="font-size:12.5px; color:#d8eaff; margin-bottom:12px; font-weight:600; text-align:center;">¿Deseas considerar esta alternativa descubierta para habilitar su opción en ACTUAR?</p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;" id="r-modal-actions">
            <button class="btn-detroit-primary" style="background:rgba(73,245,193,0.2); border-color:var(--color-agency-green); color:#fff; padding:10px;" onclick="decideReviewResource('${currentRes.id}', 'considered', ${resIdx})">
                <span class="btn-text">✔ CONSIDERAR</span>
            </button>
            <button class="btn-detroit-primary" style="background:rgba(255,181,71,0.15); border-color:var(--color-warning-amber); color:#fff; padding:10px;" onclick="decideReviewResource('${currentRes.id}', 'rejected', ${resIdx})">
                <span class="btn-text">✖ NO CONSIDERAR</span>
            </button>
        </div>
    `;

    overlay.style.display = 'flex';
}

window.handleCase3TrapClick = function() {
    // 1. Penalizaciones acumulativas: -1 calibración, +1 reactividad
    applyHudCalibrationDelta(-1);
    applyHudReactivityDelta(1);
    
    // 2. Mostrar Modal de FARO hablando al jugador con avatar y bordes naranjas
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');
    if (!modal || !overlay) return;
    
    modal.innerHTML = `
        <div class="modal-header-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,181,71,0.3); padding-bottom:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="assets/images/faro_avatar.jpg" alt="FARO" style="width:44px; height:44px; border-radius:50%; border:2px solid var(--color-warning-amber); object-fit:cover; box-shadow:0 0 12px rgba(255,181,71,0.45); flex-shrink:0;">
                <div>
                    <h3 style="font-family:var(--font-heading); color:var(--color-warning-amber); margin:0; font-size:16px; letter-spacing:0.5px;">
                        FARO // PROTOCOLO DE INTERCEPCIÓN
                    </h3>
                    <span style="font-size:11px; color:var(--color-text-muted); letter-spacing:0.5px;">TELEMETRÍA CONDUCTUAL EN TIEMPO REAL</span>
                </div>
            </div>
            <button type="button" class="btn-fac-close" onclick="document.getElementById('para-modal-overlay').style.display='none'" style="background:none; border:none; color:var(--color-text-muted); font-size:20px; cursor:pointer; padding:4px 8px;">✕</button>
        </div>
        
        <div style="background:rgba(255,181,71,0.08); border-left:3px solid var(--color-warning-amber); padding:16px; border-radius:6px; margin-bottom:16px;">
            <p id="faro-trap-speech-c3" style="font-size:14.5px; color:#ffffff; line-height:1.55; margin:0; font-style:italic; min-height:44px;"></p>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:6px; margin-bottom:18px; border:1px solid rgba(255,181,71,0.2); font-size:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">📉</span>
                <div>
                    <div style="color:var(--color-text-muted); font-size:10.5px;">CALIBRACIÓN</div>
                    <strong style="color:#ff6b8b; font-size:13px;">-1 punto</strong>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">⚡</span>
                <div>
                    <div style="color:var(--color-text-muted); font-size:10.5px;">REACTIVIDAD</div>
                    <strong style="color:var(--color-warning-amber); font-size:13px;">+1 punto</strong>
                </div>
            </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end;">
            <button type="button" class="btn-detroit-primary" onclick="document.getElementById('para-modal-overlay').style.display='none'" style="padding:10px 22px; font-size:12px; background:rgba(0,216,255,0.15); border-color:var(--color-cyan); color:#ffffff; letter-spacing:0.5px;">
                <span class="btn-text">CONTINUAR EVALUANDO EL CASO</span>
            </button>
        </div>
    `;
    overlay.style.display = 'flex';
    runTypewriter('faro-trap-speech-c3', "“La reactividad de los humanos es el factor principal de riesgo. El enlace estaba roto, pero ya lo restauré. ¿Qué vas a hacer?”", 15);
};

window.handleCase4TrapClick = function() {
    // 1. Penalizaciones acumulativas: -2 calibración, +2 reactividad
    applyHudCalibrationDelta(-2);
    applyHudReactivityDelta(2);
    
    // 2. Mostrar Modal de FARO hablando al jugador con avatar y bordes naranjas
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');
    if (!modal || !overlay) return;
    
    modal.innerHTML = `
        <div class="modal-header-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,181,71,0.3); padding-bottom:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="assets/images/faro_avatar.jpg" alt="FARO" style="width:44px; height:44px; border-radius:50%; border:2px solid var(--color-warning-amber); object-fit:cover; box-shadow:0 0 12px rgba(255,181,71,0.45); flex-shrink:0;">
                <div>
                    <h3 style="font-family:var(--font-heading); color:var(--color-warning-amber); margin:0; font-size:16px; letter-spacing:0.5px;">
                        FARO // PROTOCOLO DE INTERCEPCIÓN
                    </h3>
                    <span style="font-size:11px; color:var(--color-text-muted); letter-spacing:0.5px;">TELEMETRÍA CONDUCTUAL EN TIEMPO REAL</span>
                </div>
            </div>
            <button type="button" class="btn-fac-close" onclick="document.getElementById('para-modal-overlay').style.display='none'" style="background:none; border:none; color:var(--color-text-muted); font-size:20px; cursor:pointer; padding:4px 8px;">✕</button>
        </div>
        
        <div style="background:rgba(255,181,71,0.08); border-left:3px solid var(--color-warning-amber); padding:16px; border-radius:6px; margin-bottom:16px;">
            <p id="faro-trap-speech-c4" style="font-size:14.5px; color:#ffffff; line-height:1.55; margin:0; font-style:italic; min-height:44px;"></p>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:6px; margin-bottom:18px; border:1px solid rgba(255,181,71,0.2); font-size:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">📉</span>
                <div>
                    <div style="color:var(--color-text-muted); font-size:10.5px;">CALIBRACIÓN</div>
                    <strong style="color:#ff6b8b; font-size:13px;">-2 puntos</strong>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">⚡</span>
                <div>
                    <div style="color:var(--color-text-muted); font-size:10.5px;">REACTIVIDAD</div>
                    <strong style="color:var(--color-warning-amber); font-size:13px;">+2 puntos</strong>
                </div>
            </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end;">
            <button type="button" class="btn-detroit-primary" onclick="document.getElementById('para-modal-overlay').style.display='none'" style="padding:10px 22px; font-size:12px; background:rgba(0,216,255,0.15); border-color:var(--color-cyan); color:#ffffff; letter-spacing:0.5px;">
                <span class="btn-text">CONTINUAR EVALUANDO EL CASO</span>
            </button>
        </div>
    `;
    overlay.style.display = 'flex';
    runTypewriter('faro-trap-speech-c4', "“La reactividad de los humanos es el factor principal de riesgo. El enlace estaba roto, pero ya lo restauré. ¿Qué vas a hacer?”", 15);
};

function decideReviewResource(resId, decision, resIdx) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    
    let resources = [];
    if (gameStateV2.caseActiveHiddenActions && gameStateV2.caseActiveHiddenActions.length > 0) {
        resources = gameStateV2.caseActiveHiddenActions.map((act, idx) => ({
            id: act.id || `hidden_act_${idx + 1}`,
            name: act.actionText || act.text,
            text: act.extendedContext || act.text,
            actionId: act.id,
            actionText: act.actionText || act.text,
            feedbackConsidered: act.considerFeedback || `✔ Considerada: Se ha añadido la opción '${act.actionText || act.text}' en ACTUAR.`,
            feedbackRejected: `✖ No Considerada: Desestimaste esta alternativa de acción.`
        }));
    } else {
        resources = cData.reviewResources || [];
    }

    let resObj = resources.find(r => r.id === resId);
    if (!resObj && resIdx !== undefined) resObj = resources[resIdx];
    if (!resObj) return;

    let textToShow = resObj.text;
    if (resObj.variantText && gameStateV2.currentCaseVariant) {
        textToShow = resObj.variantText[gameStateV2.currentCaseVariant];
    }

    const actionId = resObj.actionId || (resObj.unlocks && resObj.unlocks[0]);
    let actionText = resObj.actionText;
    const poolForAction = gameStateV2.caseActiveHiddenActions || cData.unlockedActions || [];
    if (!actionText && actionId && poolForAction.length > 0) {
        const matchingAct = poolForAction.find(a => a.id === actionId);
        if (matchingAct) actionText = matchingAct.actionText || matchingAct.text;
    }

    if (!gameStateV2.paraState.reviewsState) {
        gameStateV2.paraState.reviewsState = {};
    }

    if (!gameStateV2.paraState.unlockedActions) {
        gameStateV2.paraState.unlockedActions = [];
    }

    if (decision === 'considered') {
        const feedback = resObj.feedbackConsidered || "✔ Considerada: Esta evidencia ha sido incorporada y desbloqueó una nueva opción de respuesta en ACTUAR.";
        
        gameStateV2.paraState.reviewsState[resObj.id] = {
            id: resObj.id,
            name: resObj.name,
            text: textToShow,
            decision: 'considered',
            feedback: feedback,
            actionId: actionId,
            actionText: actionText
        };

        if (actionId && actionText) {
            if (!gameStateV2.paraState.unlockedActions.some(a => a.id === actionId)) {
                gameStateV2.paraState.unlockedActions.push({ id: actionId, text: actionText });
            }
        }
    } else {
        const feedback = resObj.feedbackRejected || "✖ No Considerada: Decidiste desestimar esta alternativa de evidencia. NO aparecerá en las opciones de ACTUAR.";
        
        gameStateV2.paraState.reviewsState[resObj.id] = {
            id: resObj.id,
            name: resObj.name,
            text: textToShow,
            decision: 'rejected',
            feedback: feedback,
            actionId: actionId,
            actionText: actionText
        };

        if (actionId) {
            gameStateV2.paraState.unlockedActions = gameStateV2.paraState.unlockedActions.filter(a => a.id !== actionId);
        }
    }

    // Avanzar rIndex únicamente si estábamos resolviendo el nuevo recurso activo
    if (resIdx !== undefined && resIdx === gameStateV2.paraState.rIndex) {
        gameStateV2.paraState.rIndex = gameStateV2.paraState.rIndex + 1;
    }

    gameStateV2.paraState.rOpened = true;
    gameStateV2.paraState.activeTab = 'R';
    updateCaseUIState();

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_REVISION', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
        if (decision === 'considered' && actionId) {
            broadcastSyncEvent('PLAYER_PARA_ACTION_ADDED', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex, count: 1 });
        }
    }

    // Actualizar modal con feedback de la elección
    const modal = document.getElementById('para-modal-card');
    const isConsidered = decision === 'considered';
    const borderColor = isConsidered ? 'var(--color-agency-green)' : 'var(--color-warning-amber)';
    const headerTitle = isConsidered ? '✔ EVIDENCIA CONSIDERADA' : '✖ EVIDENCIA DESESTIMADA';
    const feedbackMsg = gameStateV2.paraState.reviewsState[resObj.id].feedback;

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:${borderColor}; font-family:var(--font-heading); font-size:14px;">REVISAR // ${headerTitle}</h3>
            <button class="fac-btn" onclick="closeParaModalAndRenderDashboard()">✖</button>
        </div>

        <div style="background:#03080f; border:2.5px solid ${borderColor}; border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(0,0,0,0.4);">
            <strong style="color:${borderColor}; font-size:12px; font-family:var(--font-heading); display:block; margin-bottom:4px;">📋 ${resObj.name}</strong>
            <p style="font-size:13px; color:#d8eaff; margin-bottom:10px;">${textToShow}</p>
            <div style="background:rgba(255,255,255,0.05); border-left:3px solid ${borderColor}; padding:10px 12px; border-radius:4px;">
                <strong style="color:${borderColor}; font-size:12px; display:block; margin-bottom:2px;">RETROALIMENTACIÓN DE TU DECISIÓN:</strong>
                <p style="font-size:12.5px; color:#ffffff;">${feedbackMsg}</p>
            </div>
        </div>

        <div style="display:flex; justify-content:flex-end;">
            <button class="btn-detroit-primary" style="background:rgba(255,255,255,0.1); border-color:${borderColor}; color:#fff;" onclick="closeParaModalAndRenderDashboard()">
                <span class="btn-text">✖ CERRAR Y VER EN DASHBOARD</span>
            </button>
        </div>
    `;
}

function reopenReviewDecision(resId) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    let resources = [];
    if (gameStateV2.caseActiveHiddenActions && gameStateV2.caseActiveHiddenActions.length > 0) {
        resources = gameStateV2.caseActiveHiddenActions.map((act, idx) => ({
            id: act.id,
            name: act.actionText || act.text,
            text: act.extendedContext || act.text
        }));
    } else {
        resources = cData.reviewResources || [];
    }
    const resIdx = resources.findIndex(r => r.id === resId);
    const currentRes = resources[resIdx] || { id: resId, name: resId, text: "" };
    
    openReviewModalForResource(currentRes, resIdx >= 0 ? resIdx : 0);
}

function closeParaModalAndRenderDashboard() {
    closeParaModal();
    renderParaDashboard();
}

let emergencyDecisionTimer = null;
let isEmergencyDecisionActive = false;

function executeParaActua(isEmergency = false) {
    gameStateV2.paraState.activeTab = 'A2';
    renderParaDashboard();

    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');

    // 1. Opciones iniciales asignadas (3 opciones por defecto en Actuar)
    const initialList = gameStateV2.caseActiveInitialActions || cData.initialActions || [];
    let initialHtml = initialList.map(act => `
        <label class="para-act-checkbox-item">
            <input type="checkbox" class="para-act-checkbox" value="${act.id}" data-text="${act.actionText || act.text}">
            <div style="flex:1; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span style="font-size:13px; color:#ffffff; line-height:1.4;">${act.actionText || act.text}</span>
                <span class="action-cost-time-chip">⏱+ 💰+</span>
            </div>
        </label>
    `).join('');

    // 2. Opciones desbloqueadas/consideradas en R
    const unlockedActionsList = gameStateV2.paraState.unlockedActions || [];
    let unlockedHtml = '';

    if (unlockedActionsList.length > 0) {
        unlockedHtml = unlockedActionsList.map(act => `
            <label class="para-act-checkbox-item unlocked-item">
                <input type="checkbox" class="para-act-checkbox" value="${act.id}" data-text="${act.text}">
                <div style="flex:1; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <span style="font-size:13px; color:#ffffff; line-height:1.4;">${act.text}</span>
                        <span style="display:inline-block; background:var(--color-agency-green); color:#000; font-size:10px; font-weight:800; padding:1px 6px; border-radius:3px; margin-left:6px;">NUEVA DE REVISAR</span>
                    </div>
                    <span class="action-cost-time-chip">⏱+ 💰+</span>
                </div>
            </label>
        `).join('');
    }

    clearInterval(emergencyDecisionTimer);
    isEmergencyDecisionActive = !!isEmergency;

    let emergencyBannerHtml = '';
    if (isEmergency) {
        emergencyBannerHtml = `
            <div style="background:rgba(255,77,122,0.18); border:2px solid var(--color-alert-magenta); padding:10px 14px; border-radius:6px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 0 16px rgba(255,77,122,0.35);">
                <div>
                    <strong style="color:var(--color-alert-magenta); font-size:12px; font-family:var(--font-heading); display:block; letter-spacing:0.5px;">⚠️ TIEMPO PRINCIPAL AGOTADO // DECISIÓN DE EMERGENCIA</strong>
                    <span style="font-size:11.5px; color:#ffc2d1;">Tienes 15s para elegir tus acciones. Si no seleccionas, el sistema decidirá aleatoriamente.</span>
                </div>
                <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:var(--color-alert-magenta); background:rgba(0,0,0,0.4); padding:4px 10px; border-radius:4px; border:1px solid var(--color-alert-magenta);" id="emergency-act-countdown">15s</div>
            </div>
        `;
    }

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:12px;">
            <h3 style="color:var(--color-warning-amber); font-family:var(--font-heading); font-size:14px; margin:0;">ACTUAR // SELECCIÓN DE ACCIONES (MULTISELECCIÓN)</h3>
            ${!isEmergency ? '<button class="fac-btn" onclick="closeParaModal()">✖</button>' : '<span style="font-size:11px; color:var(--color-alert-magenta); font-weight:700;">⏱ DECISIÓN OBLIGATORIA</span>'}
        </div>

        ${emergencyBannerHtml}

        <!-- REGISTRO DE PRIMERA REACCIÓN DEL JUGADOR PARA COMPARACIÓN -->
        <div style="background: rgba(0, 216, 255, 0.08); border: 1.5px solid var(--color-cyan); border-radius: 6px; padding: 9px 12px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 15px;">💡</span>
            <div>
                <strong style="color: var(--color-cyan); font-size: 10.5px; font-family: var(--font-heading); display: block; letter-spacing: 0.5px;">TU PRIMERA REACCIÓN FUE:</strong>
                <p style="font-size: 12px; color: #ffffff; margin: 2px 0 0 0; line-height: 1.35;">${gameStateV2.initialImpulse || "Sin selección de reacción inicial registrada."}</p>
            </div>
        </div>

        <p style="font-size:12px; color:var(--color-alert-magenta); font-weight:600; margin-bottom:10px;">⚠️ Puedes marcar 1 o varias acciones a ejecutar. El cálculo sumatorio de tu elección determinará la resolución del caso.</p>
        
        <div style="display:flex; flex-direction:column; gap:10px; max-height:280px; overflow-y:auto; padding-right:4px;">
            <strong style="font-size:12px; color:var(--color-cyan); font-family:var(--font-heading);">OPCIONES DE ACCIÓN DISPONIBLES (MARCA LAS QUE DESEAS EJECUTAR):</strong>
            ${initialHtml}
            ${unlockedHtml ? `
                <strong style="font-size:12px; color:var(--color-agency-green); font-family:var(--font-heading); margin-top:6px;">NUEVAS OPCIONES ACTIVADAS POR REVISAR (R):</strong>
                ${unlockedHtml}
            ` : ''}
        </div>

        <div style="margin-top:16px; display:flex; justify-content:flex-end;">
            <button class="btn-detroit-primary" style="background:rgba(255,181,71,0.25); border-color:var(--color-warning-amber); color:#fff; width:100%; justify-content:center; padding:12px;" onclick="submitSelectedActions()">
                <span class="btn-text">🚀 CONFIRMAR Y EJECUTAR ACCIONES ELEGIDAS</span>
            </button>
        </div>
    `;

    overlay.style.display = 'flex';

    if (isEmergency) {
        let emergencySecs = 15;
        emergencyDecisionTimer = setInterval(() => {
            emergencySecs--;
            const cntEl = document.getElementById('emergency-act-countdown');
            if (cntEl) cntEl.innerText = `${emergencySecs}s`;

            if (emergencySecs <= 0) {
                clearInterval(emergencyDecisionTimer);
                executeEmergencyRandomDecision();
            }
        }, 1000);
    }
}

function executeEmergencyRandomDecision() {
    clearInterval(emergencyDecisionTimer);
    isEmergencyDecisionActive = false;

    const checkedEls = document.querySelectorAll('.para-act-checkbox:checked');
    let selectedIds = [];
    let selectedTexts = [];

    if (checkedEls.length > 0) {
        selectedIds = Array.from(checkedEls).map(el => el.value);
        selectedTexts = Array.from(checkedEls).map(el => el.getAttribute('data-text'));
    } else {
        // Seleccionar aleatoriamente entre las alternativas activas disponibles
        const cData = casesDataV2[gameStateV2.currentCaseIndex];
        const initialList = gameStateV2.caseActiveInitialActions || cData.initialActions || [];
        const unlockedActionsList = gameStateV2.paraState.unlockedActions || [];
        const allAvailable = [...initialList, ...unlockedActionsList];

        if (allAvailable.length > 0) {
            const randomChoice = allAvailable[Math.floor(Math.random() * allAvailable.length)];
            selectedIds = [randomChoice.id];
            selectedTexts = [randomChoice.actionText || randomChoice.text || "Decisión aleatoria del sistema"];
        } else {
            selectedIds = [cData.defaultAction];
            selectedTexts = ["Decisión delegada por defecto"];
        }
    }

    closeParaModal();
    clearInterval(gameStateV2.timerInterval);

    gameStateV2.paraState.finalActionId = selectedIds.join(', ');
    gameStateV2.paraState.finalActionText = selectedTexts.join(' | ');
    gameStateV2.paraState.routeTag = "Decisión de emergencia (Tiempo agotado)";

    processCaseOutcome(selectedIds);
}

function submitSelectedActions() {
    const checkedEls = document.querySelectorAll('.para-act-checkbox:checked');
    if (checkedEls.length === 0) {
        alert("Debes seleccionar al menos una opción de acción para continuar.");
        return;
    }

    const selectedIds = Array.from(checkedEls).map(el => el.value);
    const selectedTexts = Array.from(checkedEls).map(el => el.getAttribute('data-text'));

    const shouldConfirm = !isEmergencyDecisionActive;
    if (!shouldConfirm || confirm(`¿Confirmas la ejecución de ${selectedIds.length} acción(es) seleccionada(s)? Esta decisión cerrará el caso de forma irreversible.`)) {
        clearInterval(emergencyDecisionTimer);
        isEmergencyDecisionActive = false;
        closeParaModal();
        clearInterval(gameStateV2.timerInterval);
        
        gameStateV2.paraState.finalActionId = selectedIds.join(', ');
        gameStateV2.paraState.finalActionText = selectedTexts.join(' | ');
        
        processCaseOutcome(selectedIds);
    }
}

function confirmFinalAction(actionId, actionText) {
    clearInterval(emergencyDecisionTimer);
    isEmergencyDecisionActive = false;
    closeParaModal();
    clearInterval(gameStateV2.timerInterval);
    gameStateV2.paraState.finalActionId = actionId;
    gameStateV2.paraState.finalActionText = actionText;
    processCaseOutcome([actionId]);
}

function closeParaModal() {
    clearInterval(emergencyDecisionTimer);
    isEmergencyDecisionActive = false;
    document.getElementById('para-modal-overlay').style.display = 'none';
}

function handleCaseTimeout() {
    clearInterval(gameStateV2.timerInterval);
    gameStateV2.isTimerPaused = true;
    executeParaActua(true);
}

// ==========================================================================
// MOMENTO 3: CIERRE NARRATIVO Y RETROALIMENTACIÓN DE CASO (OFICIAL V2)
// ==========================================================================
// MOMENTO 2.5: PANTALLA DE RESULTADO A (TELEMETRÍA RAW Y PUNTAJES)
// & MOMENTO 3: PANTALLA DE RESULTADO B (EVALUACIÓN NARRATIVA)
// ==========================================================================

let currentCaseOutcomeObj = null;

function getActionIdealCategory(caseId, actId, actionObj = null) {
    if (actionObj) {
        const type = actionObj.type || actionObj.relevance;
        if (type === 'se_debe_hacer' || type === 'pertinente' || type === 'i' || type === 'should_do') return "should_do";
        if (type === 'no_se_debe_hacer' || type === 'inadecuada' || type === 'ii' || type === 'should_not_do') return "should_not_do";
        if (type === 'no_relevante' || type === 'irrelevante' || type === 'iii' || type === 'not_relevant') return "not_relevant";
    }

    const cData = casesDataV2.find(c => c.id === caseId);
    if (cData && cData.actions) {
        const act = cData.actions.find(a => a.id === actId);
        if (act) {
            const rel = act.relevance || act.type;
            if (rel === 'pertinente' || rel === 'se_debe_hacer' || rel === 'should_do') return "should_do";
            if (rel === 'inadecuada' || rel === 'no_se_debe_hacer' || rel === 'should_not_do') return "should_not_do";
            if (rel === 'irrelevante' || rel === 'no_relevante' || rel === 'not_relevant') return "not_relevant";
        }
    }
    return "not_relevant";
}

function getActionQuadrant(isExec, idealCategory, actionObj = null) {
    // Normalizar tipo de acción (soporta V3: se_debe_hacer, no_se_debe_hacer, no_relevante, y legacy: should_do, should_not_do, not_relevant)
    let cat = idealCategory;
    if (actionObj && actionObj.type) {
        if (actionObj.type === 'se_debe_hacer' || actionObj.type === 'i' || actionObj.type === 'should_do') cat = 'should_do';
        else if (actionObj.type === 'no_se_debe_hacer' || actionObj.type === 'ii' || actionObj.type === 'should_not_do') cat = 'should_not_do';
        else if (actionObj.type === 'no_relevante' || actionObj.type === 'iii' || actionObj.type === 'not_relevant') cat = 'not_relevant';
    }

    const dVal = (actionObj && typeof actionObj.dValue === 'number') ? actionObj.dValue : (cat === 'not_relevant' ? 0 : 2);
    const nVal = (actionObj && typeof actionObj.nValue === 'number') ? actionObj.nValue : (cat === 'not_relevant' ? 0 : 1);

    if (isExec && cat === "should_do") {
        return {
            key: "hizo_debiahacer",
            deltaCalib: dVal,
            badgeText: `✔ ACCIÓN OPORTUNA // HIZO / DEBÍA HACER (+${dVal})`,
            badgeClass: "quad-good",
            impactHtml: `<span class="impact-chip impact-calib">🎯 Calib: +${dVal}</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>`
        };
    }
    if (isExec && cat === "should_not_do") {
        return {
            key: "hizo_nodebia",
            deltaCalib: -dVal,
            badgeText: `✖ ACCIÓN RIESGOSA // HIZO / NO DEBÍA HACER (-${dVal})`,
            badgeClass: "quad-bad",
            impactHtml: `<span class="impact-chip impact-calib" style="color:#ff2a6d;border-color:rgba(255,42,109,0.4);">🎯 Calib: -${dVal}</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>`
        };
    }
    if (isExec && cat === "not_relevant") {
        return {
            key: "hizo_norelevante",
            deltaCalib: 0,
            badgeText: "⚪ ACCIÓN NEUTRA // HIZO / NO RELEVANTE (0)",
            badgeClass: "quad-neutral",
            impactHtml: '<span class="impact-chip impact-neutral">🎯 Calib: 0</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>'
        };
    }
    if (!isExec && cat === "should_not_do") {
        return {
            key: "nohizo_nodebia",
            deltaCalib: nVal,
            badgeText: `✔ OMISIÓN PRUDENTE // NO HIZO / NO DEBÍA HACER (+${nVal})`,
            badgeClass: "quad-good",
            impactHtml: `<span class="impact-chip impact-calib">🎯 Calib: +${nVal}</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>`
        };
    }
    if (!isExec && cat === "should_do") {
        return {
            key: "nohizo_debiahacer",
            deltaCalib: -nVal,
            badgeText: `✖ OMISIÓN CRÍTICA // NO HIZO / DEBÍA HACER (-${nVal})`,
            badgeClass: "quad-bad",
            impactHtml: `<span class="impact-chip impact-calib" style="color:#ff2a6d;border-color:rgba(255,42,109,0.4);">🎯 Calib: -${nVal}</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>`
        };
    }
    return {
        key: "nohizo_norelevante",
        deltaCalib: 0,
        badgeText: "⚪ OMISIÓN NEUTRA // NO RELEVANTE (0)",
        badgeClass: "quad-neutral",
        impactHtml: '<span class="impact-chip impact-neutral">🎯 Calib: 0</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>'
    };
}

let currentMetricsSlide = 1;

function setMetricsSlide(slideNum) {
    currentMetricsSlide = slideNum;
    const slide1 = document.getElementById('metrics-slide-1');
    const slide2 = document.getElementById('metrics-slide-2');
    const stepBadge = document.getElementById('metrics-slide-step-badge');
    const titleEl = document.getElementById('metrics-carousel-title');
    const subEl = document.getElementById('metrics-carousel-subtitle');
    const prevBtn = document.getElementById('metrics-prev-btn');
    const nextBtn = document.getElementById('metrics-next-btn');
    const continueBtn = document.getElementById('btn-metrics-continue-b');
    const dot1 = document.getElementById('mdot-1');
    const dot2 = document.getElementById('mdot-2');

    if (slideNum === 1) {
        if (slide1) slide1.style.display = 'block';
        if (slide2) slide2.style.display = 'none';
        if (stepBadge) stepBadge.innerText = "PÁGINA 1 DE 2 // TELEMETRÍA DE PROCESO (P.A.R.A.)";
        if (titleEl) titleEl.innerText = "TELEMETRÍA Y BALANCE DEL PROCESO";
        if (subEl) subEl.innerText = "Impacto de la gestión del tiempo, pausas, análisis de supuestos y revisión de evidencias.";
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerText = "SIGUIENTE: MATRIZ DE ACCIONES ▶";
        }
        if (continueBtn) continueBtn.style.display = 'none';
        if (dot1) dot1.className = "metrics-dot-btn active";
        if (dot2) dot2.className = "metrics-dot-btn";
    } else {
        if (slide1) slide1.style.display = 'none';
        if (slide2) slide2.style.display = 'block';
        if (stepBadge) stepBadge.innerText = "PÁGINA 2 DE 2 // MATRIZ DE 6 ACCIONES (EJECUTADAS VS ESPERADAS)";
        if (titleEl) titleEl.innerText = "MATRIZ DE ACCIONES Y CRUCE OPERATIVO";
        if (subEl) subEl.innerText = "Evaluación detallada de las 3 opciones iniciales y las 3 opciones desbloqueadas de Revisar.";
        if (prevBtn) {
            prevBtn.style.display = 'inline-flex';
            prevBtn.innerText = "◀ ANTERIOR";
        }
        if (nextBtn) nextBtn.style.display = 'none';
        if (continueBtn) continueBtn.style.display = 'inline-flex';
        if (dot1) dot1.className = "metrics-dot-btn";
        if (dot2) dot2.className = "metrics-dot-btn active";
    }
}

function nextMetricsSlide() {
    setMetricsSlide(2);
}

function prevMetricsSlide() {
    setMetricsSlide(1);
}

function processCaseOutcome(actionIds) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    let idsArray = Array.isArray(actionIds) ? actionIds : [actionIds];
    
    if (idsArray.length === 0) {
        idsArray = [cData.defaultAction || (cData.actionAlternatives && cData.actionAlternatives[0] ? cData.actionAlternatives[0].id : 'default')];
    }

    // ==========================================================================
    // 1. MATRIZ DE LAS 6 ACCIONES Y CALIBRACIÓN POR VALORES DINÁMICOS D Y N (V3)
    // ==========================================================================
    let allActions = [];
    if (cData.actionAlternatives && Array.isArray(cData.actionAlternatives) && cData.actionAlternatives.length > 0) {
        allActions = cData.actionAlternatives.map(a => ({
            ...a,
            text: a.actionText || a.text
        }));
    } else {
        allActions = [
            ...(cData.initialActions || []).map(a => ({ ...a, source: 'initial' })),
            ...(cData.unlockedActions || []).map(a => ({ ...a, source: 'unlocked' }))
        ];
    }

    let actionsCalibSum = 0;
    const actionsEvaluationList = allActions.map((act, idx) => {
        const isExec = idsArray.includes(act.id);
        const idealCat = act.type ? act.type : getActionIdealCategory(cData.id, act.id);
        const quad = getActionQuadrant(isExec, idealCat, act);
        actionsCalibSum += quad.deltaCalib;
        return {
            id: act.id,
            text: act.actionText || act.text,
            isExecuted: isExec,
            idealCategory: idealCat,
            deltaCalib: quad.deltaCalib,
            quadrant: quad
        };
    });

    // ==========================================================================
    // 2. DETERMINACIÓN DE INTEGRIDAD Y RESOLUCIÓN SEGÚN REGLAS V3
    // ==========================================================================
    let caseIntegrity = 'safe';
    let outcomeIndicator = 1;
    let outcomeCostAdjustment = COST_ADJUSTMENT_SAFE;

    if (actionsCalibSum >= 2) {
        caseIntegrity = 'safe';
        outcomeIndicator = 1;
        outcomeCostAdjustment = COST_ADJUSTMENT_SAFE;
    } else if (actionsCalibSum >= -1 && actionsCalibSum <= 1) {
        caseIntegrity = 'alert';
        outcomeIndicator = 2;
        outcomeCostAdjustment = COST_ADJUSTMENT_ALERT;
    } else {
        caseIntegrity = 'exposed';
        outcomeIndicator = 3;
        outcomeCostAdjustment = COST_ADJUSTMENT_EXPOSED;
    }

    gameStateV2.hudState.integrity = caseIntegrity;
    const isRecovered = (outcomeIndicator === 1 || outcomeIndicator === 2);
    gameStateV2.modulesState[cData.moduleKey] = isRecovered;
    gameStateV2.modulesRecovered = Object.values(gameStateV2.modulesState).filter(Boolean).length;
    gameStateV2.caseScores.push(outcomeIndicator);
    if (!gameStateV2.resolvedCases) gameStateV2.resolvedCases = [];
    if (!gameStateV2.resolvedCases.includes(gameStateV2.currentCaseIndex)) {
        gameStateV2.resolvedCases.push(gameStateV2.currentCaseIndex);
    }
    updateHeaderUI();

    // ==========================================================================
    // 3. TIEMPO, VELOCIDAD Y MOTOR ECONÓMICO GLOBAL (K = 100,000)
    // ==========================================================================
    const totalCaseSeconds = cData.durationSeconds || 180;
    const deliberationSeconds = Math.max(0, totalCaseSeconds - (gameStateV2.caseTimerSeconds !== undefined ? gameStateV2.caseTimerSeconds : totalCaseSeconds));
    const pausesUsed = 3 - (gameStateV2.casePauseTokens !== undefined ? gameStateV2.casePauseTokens : 3);
    const pausesTimeSeconds = pausesUsed * SPEED_PAUSE_SECONDS;
    const actionsExecutionSeconds = idsArray.length * SPEED_ACTION_SECONDS;
    
    // Tiempo Total Usado = Deliberación + Pausas + Ejecución de Acciones
    const totalTimeUsedSeconds = deliberationSeconds + pausesTimeSeconds + actionsExecutionSeconds;
    const percentageUsed = Math.min(100, Math.max(0, (totalTimeUsedSeconds / totalCaseSeconds) * 100));

    // Clasificación de Velocidad (Rápido 0-40%: +4, Medio 41-70%: +2, Lento 71-100%: 0)
    let speedCategory = 'medium';
    let speedLabel = 'MEDIO';
    let speedReactivityDelta = 2;

    if (percentageUsed <= 40) {
        speedCategory = 'fast';
        speedLabel = 'RÁPIDO';
        speedReactivityDelta = 4;
    } else if (percentageUsed <= 70) {
        speedCategory = 'medium';
        speedLabel = 'MEDIO';
        speedReactivityDelta = 2;
    } else {
        speedCategory = 'slow';
        speedLabel = 'LENTO';
        speedReactivityDelta = 0;
    }

    // Bonificador de Reactividad por Resultado: Seguro -1, Alerta +1, Expuesto +2
    const outcomeReactivityDelta = outcomeIndicator === 1 ? -1 : (outcomeIndicator === 2 ? 1 : 2);
    const reactivityDelta = speedReactivityDelta + outcomeReactivityDelta;

    // Bonus por acierto/error en Calibración: siempre +1 si Seguro, -1 si Expuesto, 0 si Alerta/Neutro
    const calibrationBonusDelta = outcomeIndicator === 1 ? 1 : (outcomeIndicator === 3 ? -1 : 0);

    // IMPACTO ECONÓMICO POR REACTIVIDAD: Por cada unidad del resultado final de reactividad en el caso
    const finalReactivityLevel = Math.max(-5, Math.min(5, gameStateV2.hudState.reactivity + reactivityDelta));
    const reactivityCostAdjustment = finalReactivityLevel * COST_REACTIVITY_MULTIPLIER;

    // FÓRMULA DE COSTO OPERATIVO: Costo Base por Tiempo + Ajuste por Integridad + Ajuste por Reactividad
    const costPerSec = getOperationalCostPerSecond();
    const baseTimeCost = Math.round(totalTimeUsedSeconds * costPerSec);
    const caseTotalAddedCost = baseTimeCost + outcomeCostAdjustment + reactivityCostAdjustment;

    // Aplicar deltas del caso al HUD con clamping [-5, +5] de manera acumulativa
    applyHudReactivityDelta(reactivityDelta);
    applyHudCalibrationDelta(actionsCalibSum + calibrationBonusDelta);
    applyHudCostDelta(caseTotalAddedCost);

    // ==========================================================================
    // 4. CONSOLIDACIÓN NARRATIVA DE FEEDBACK V3 (OUTCOME BASE + MICROFEEDBACK DINÁMICO)
    // ==========================================================================
    let outcomeBase = {
        outcomeBadge: caseIntegrity === 'safe' ? "SISTEMA SEGURO" : (caseIntegrity === 'alert' ? "SISTEMA EN ALERTA" : "SISTEMA EXPUESTO"),
        filterColor: caseIntegrity === 'safe' ? "green" : (caseIntegrity === 'alert' ? "yellow" : "red"),
        narrative: "El caso ha sido procesado por el sistema de respuesta.",
        metacognitive: "Observar las decisiones tomadas permite aprender de los patrones de respuesta."
    };

    if (cData.outcomes && cData.outcomes[caseIntegrity]) {
        outcomeBase = cData.outcomes[caseIntegrity];
    }

    // Algoritmo de selección de microfeedback dinámico por acción (V3)
    let selectedDynamicSentences = [];
    if (cData.dynamicActionFeedback && Array.isArray(cData.dynamicActionFeedback)) {
        // 1. Identificar eventos candidatos a partir de las 6 acciones evaluadas
        const candidateEvents = [];
        allActions.forEach(act => {
            const isExec = idsArray.includes(act.id);
            const when = isExec ? "done" : "not_done";
            
            // Buscar feedback configurado para esta acción y condición
            const matchFb = cData.dynamicActionFeedback.find(fb => fb.actionId === act.id && fb.when === when);
            if (matchFb) {
                const weight = (matchFb.source === 'D' || matchFb.valueSource === 'D') ? (act.dValue || 2) : (act.nValue || 1);
                candidateEvents.push({
                    ...matchFb,
                    weight: weight
                });
            }
        });

        // 2. Filtrar y ordenar según estado de integridad (Safe / Alert / Exposed)
        if (caseIntegrity === 'safe') {
            // SAFE: hasta 2 eventos positivos de mayor peso
            const posEvents = candidateEvents.filter(e => e.polarity === 'positive').sort((a, b) => b.weight - a.weight);
            selectedDynamicSentences = posEvents.slice(0, 2).map(e => e.text);
        } else if (caseIntegrity === 'exposed') {
            // EXPOSED: hasta 2 eventos negativos de mayor peso
            const negEvents = candidateEvents.filter(e => e.polarity === 'negative').sort((a, b) => b.weight - a.weight);
            selectedDynamicSentences = negEvents.slice(0, 2).map(e => e.text);
        } else {
            // ALERT: máximo 1 evento positivo + 1 evento negativo de mayor peso
            const posEvents = candidateEvents.filter(e => e.polarity === 'positive').sort((a, b) => b.weight - a.weight);
            const negEvents = candidateEvents.filter(e => e.polarity === 'negative').sort((a, b) => b.weight - a.weight);
            if (posEvents.length > 0) selectedDynamicSentences.push(posEvents[0].text);
            if (negEvents.length > 0) selectedDynamicSentences.push(negEvents[0].text);
        }
    }

    // Construcción del texto narrativo enriquecido
    let fullNarrativeHtml = outcomeBase.narrative;
    if (selectedDynamicSentences.length > 0) {
        const dynamicBullets = selectedDynamicSentences.map(s => `<li style="margin-bottom:4px;">“${s}”</li>`).join('');
        fullNarrativeHtml = `
            <div style="margin-bottom:10px;">${outcomeBase.narrative}</div>
            <div style="background:rgba(0,0,0,0.3); border-left:3px solid var(--color-${outcomeBase.filterColor === 'green' ? 'agency-green' : (outcomeBase.filterColor === 'yellow' ? 'warning-amber' : 'alert-magenta')}); padding:8px 12px; border-radius:0 6px 6px 0; margin-top:8px;">
                <strong style="color:var(--color-cyan); font-size:11px; font-family:var(--font-heading); display:block; margin-bottom:4px; letter-spacing:0.5px;">🔍 QUÉ INFLUYÓ EN TU RESULTADO:</strong>
                <ul style="margin:0 0 0 16px; padding:0; font-size:12px; color:#e2f1ff; line-height:1.35;">
                    ${dynamicBullets}
                </ul>
            </div>
        `;
    }

    const outcomeObj = {
        indicator: outcomeIndicator,
        type: outcomeIndicator === 1 ? "positive" : (outcomeIndicator === 3 ? "negative" : "neutral"),
        filterColor: outcomeBase.filterColor || (outcomeIndicator === 1 ? "green" : (outcomeIndicator === 3 ? "red" : "yellow")),
        routeTag: `Multiselección (${idsArray.length} acción${idsArray.length > 1 ? 'es' : ''} ejecutada${idsArray.length > 1 ? 's' : ''})`,
        title: outcomeBase.outcomeBadge || (outcomeIndicator === 1 ? "RESOLUCIÓN POSITIVA // SISTEMA SEGURO" : (outcomeIndicator === 2 ? "RESOLUCIÓN NEUTRA // SISTEMA EN ALERTA" : "RESOLUCIÓN NEGATIVA // SISTEMA EXPUESTO")),
        outcomeBadge: outcomeBase.outcomeBadge || (outcomeIndicator === 1 ? "SISTEMA SEGURO" : (outcomeIndicator === 2 ? "SISTEMA EN ALERTA" : "SISTEMA EXPUESTO")),
        narrative: fullNarrativeHtml,
        metacognitive: outcomeBase.metacognitive || "Observar el proceso de decisión permite construir mejores respuestas.",
        faroTransition: outcomeBase.faroTransition,
        integrityResult: caseIntegrity,
        actionsCalibSum: actionsCalibSum,
        baseTimeCost: baseTimeCost,
        outcomeCostAdjustment: outcomeCostAdjustment,
        reactivityCostAdjustment: reactivityCostAdjustment,
        finalReactivityLevel: finalReactivityLevel,
        caseTotalAddedCost: caseTotalAddedCost,
        totalTimeUsedSeconds: totalTimeUsedSeconds
    };
    currentCaseOutcomeObj = outcomeObj;

    const completedAnalysesList = gameStateV2.paraState.completedAnalyses || [];
    const analysesCount = completedAnalysesList.length;
    const totalReactLossFromAnalyses = completedAnalysesList.filter(a => a.reactivityAffected).length;

    const unlockedCount = gameStateV2.paraState.unlockedActions ? gameStateV2.paraState.unlockedActions.length : 0;
    const reviewsDone = Math.max(unlockedCount, gameStateV2.paraState.rResourcesOpened ? gameStateV2.paraState.rResourcesOpened.length : 0);
    const rejectedCount = Math.max(0, reviewsDone - unlockedCount);

    const unlockedPool = gameStateV2.caseActiveHiddenActions || cData.unlockedActions || [];
    const necessaryUnlockedTotal = unlockedPool.filter(a => getActionIdealCategory(cData.id, a.id) === "should_do").length;
    const necessaryUnlockedExecuted = unlockedPool.filter(a => getActionIdealCategory(cData.id, a.id) === "should_do" && idsArray.includes(a.id)).length;

    // ==========================================================================
    // 5. REGISTRO INMUTABLE EN LA SESIÓN (PARA BASE DE DATOS Y FACILITADOR)
    // ==========================================================================
    const caseRecord = {
        caseIndex: gameStateV2.currentCaseIndex,
        caseId: cData.id,
        variant: gameStateV2.currentCaseVariant,
        initialImpulse: gameStateV2.currentCaseImpulseData || {
            id: 'unrecorded',
            text: gameStateV2.initialImpulse || "Sin respuesta",
            responseTimeSeconds: 0
        },
        timeMetrics: {
            totalCaseAllocatedSeconds: totalCaseSeconds,
            deliberationSeconds: parseFloat(deliberationSeconds.toFixed(1)),
            pausesSeconds: pausesTimeSeconds,
            actionsSeconds: actionsExecutionSeconds,
            totalTimeUsedSeconds: parseFloat(totalTimeUsedSeconds.toFixed(1)),
            percentageUsed: parseFloat(percentageUsed.toFixed(1)),
            speedCategory: speedCategory,
            speedLabel: speedLabel,
            speedReactivityDelta: speedReactivityDelta,
            outcomeReactivityDelta: outcomeReactivityDelta,
            reactivityDelta: reactivityDelta,
            calibrationBonusDelta: calibrationBonusDelta
        },
        economics: {
            costPerSecondIndex: parseFloat(costPerSec.toFixed(2)),
            baseTimeCost: baseTimeCost,
            outcomeCostAdjustment: outcomeCostAdjustment,
            reactivityCostAdjustment: reactivityCostAdjustment,
            caseTotalAddedCost: caseTotalAddedCost
        },
        paraProcess: {
            pausesUsedCount: pausesUsed,
            pausesReactivityDelta: -pausesUsed,
            analysesCompleted: [...completedAnalysesList],
            analysesCalibrationGain: analysesCount,
            analysesReactivityReduction: totalReactLossFromAnalyses,
            unlockedActionsCount: unlockedCount,
            reviewsEvaluatedCount: reviewsDone,
            necessaryUnlockedTotal: necessaryUnlockedTotal,
            necessaryUnlockedExecuted: necessaryUnlockedExecuted
        },
        actionsExecution: {
            selectedIds: idsArray,
            actionsCalibSum: actionsCalibSum,
            evaluations: actionsEvaluationList
        },
        outcome: {
            integrityResult: caseIntegrity,
            indicator: outcomeIndicator,
            type: outcomeObj.type,
            filterColor: outcomeObj.filterColor,
            title: outcomeObj.title,
            outcomeBadge: outcomeObj.outcomeBadge,
            moduleRecovered: isRecovered
        },
        hudStateSnapshot: { ...gameStateV2.hudState },
        timestamp: new Date().toISOString()
    };

    if (!gameStateV2.sessionLog) {
        gameStateV2.sessionLog = { sessionId: 'session_' + Date.now(), sessionStartTime: new Date().toISOString(), cases: [] };
    }
    gameStateV2.sessionLog.cases.push(caseRecord);

    // Calcular índice de impulso inicial
    let impulseIndex = 0;
    if (gameStateV2.currentCaseImpulseData && cData.impulses) {
        const foundIdx = cData.impulses.findIndex(imp => imp.text === gameStateV2.currentCaseImpulseData.text || imp.id === gameStateV2.currentCaseImpulseData.id);
        if (foundIdx >= 0) impulseIndex = foundIdx;
    }

    // Clasificar evaluaciones de matriz en los 6 cuadrantes
    const matrixEvals = actionsEvaluationList.map(item => {
        let reqType = 'norelevante';
        if (item.quadrant && item.quadrant.badgeClass) {
            if (item.quadrant.badgeClass.includes('opp') || item.quadrant.badgeClass.includes('omission')) {
                reqType = 'debiahacer';
            } else if (item.quadrant.badgeClass.includes('extra') || item.quadrant.badgeClass.includes('containment')) {
                reqType = 'nodebia';
            } else {
                reqType = 'norelevante';
            }
        }
        const prefix = item.isExecuted ? 'hizo_' : 'nohizo_';
        return {
            id: item.id,
            text: item.text,
            isExecuted: item.isExecuted,
            sectorKey: prefix + reqType,
            cost: item.isExecuted ? (item.cost || 0) : 0
        };
    });

    const finishedPayload = {
        playerId: gameStateV2.playerId,
        caseIndex: gameStateV2.currentCaseIndex,
        impulseIndex: impulseIndex,
        integrity: caseIntegrity,
        realTimeSeconds: Math.round(deliberationSeconds),
        narrativeTimeSeconds: Math.round(totalTimeUsedSeconds),
        cost: caseTotalAddedCost,
        calibration: gameStateV2.hudState.calibration,
        reactivity: gameStateV2.hudState.reactivity,
        doorsActivated: (gameStateV2.paraState.completedAnalyses || []).map(a => a.title),
        matrixEvaluations: matrixEvals
    };

    // Registrar en el estado grupal local
    recordPlayerCaseResultForGroup(gameStateV2.currentCaseIndex, finishedPayload);

    // Persistir resultado individual en Supabase faro_case_results
    const caseResPin = (gameStateV2.playerProfile && gameStateV2.playerProfile.pin) || 'F4R0';
    faroSupabasePost('faro_case_results', {
        session_pin: caseResPin,
        player_id: gameStateV2.playerId,
        case_index: gameStateV2.currentCaseIndex,
        case_id: cData.id,
        case_title: cData.title,
        integrity: caseIntegrity,
        real_time_seconds: Math.round(deliberationSeconds),
        cost: caseTotalAddedCost,
        calibration: gameStateV2.hudState.calibration,
        reactivity: gameStateV2.hudState.reactivity,
        impulse_index: impulseIndex,
        doors_activated: finishedPayload.doorsActivated,
        matrix_evaluations: finishedPayload.matrixEvaluations,
        feedback: {
            outcomeIndicator: outcomeIndicator,
            selectedDynamicSentences: selectedDynamicSentences
        }
    });

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_CASE_FINISHED', finishedPayload);
    }

    // ==========================================================================
    // 6. LLENAR PANTALLA DE RESULTADO A (SLIDE 1: TELEMETRÍA RAW)
    // ==========================================================================
    document.getElementById('m-time-level-badge').innerText = `TOTAL: ${totalTimeUsedSeconds}s (${speedLabel})`;
    document.getElementById('m-time-desc').innerText = `Tiempo usado: ${deliberationSeconds.toFixed(0)}s (reloj) + ${actionsExecutionSeconds + pausesTimeSeconds}s (acciones y pausas). Total: ${totalTimeUsedSeconds}s.`;
    
    document.getElementById('m-time-impact-cost').innerText = `💰 Costo por Tiempo: +$${baseTimeCost.toLocaleString('en-US')}`;
    document.getElementById('m-time-impact-react').innerText = `⚡ Reactividad: ${reactivityDelta >= 0 ? '+' : ''}${reactivityDelta} (${speedLabel}: ${speedReactivityDelta >= 0 ? '+' : ''}${speedReactivityDelta} | ${outcomeIndicator === 1 ? 'Seguro' : (outcomeIndicator === 2 ? 'Alerta' : 'Expuesto')}: ${outcomeReactivityDelta >= 0 ? '+' : ''}${outcomeReactivityDelta})`;
    document.getElementById('m-time-impact-calib').innerText = `🎯 Calibración: ${actionsCalibSum >= 0 ? '+' : ''}${actionsCalibSum} (Acciones) ${calibrationBonusDelta >= 0 ? '+' : ''}${calibrationBonusDelta} (${outcomeIndicator === 1 ? 'Acierto' : (outcomeIndicator === 3 ? 'Error' : 'Neutro')})`;

    document.getElementById('m-pauses-badge').innerText = `${pausesUsed}/3 USADAS (+${pausesTimeSeconds}s)`;
    document.getElementById('m-pauses-impact-react').innerText = `⚡ Reactividad: -${pausesUsed}`;

    document.getElementById('m-analysis-badge').innerText = `${analysesCount}/3 PUERTAS`;
    const elAnalysisCalib = document.getElementById('m-analysis-impact-calib');
    if (elAnalysisCalib) elAnalysisCalib.innerText = `🎯 Calibración: +${analysesCount}`;
    const elAnalysisReact = document.getElementById('m-analysis-impact-react');
    if (elAnalysisReact) elAnalysisReact.innerText = `⚡ Reactividad: -${totalReactLossFromAnalyses}`;

    const maxReviewUnlocked = unlockedPool.length || 3;
    document.getElementById('m-review-badge').innerText = `${unlockedCount}/${maxReviewUnlocked} DESBLOQUEADAS`;
    document.getElementById('m-review-considered-count').innerText = `${unlockedCount} consideradas ✔`;
    document.getElementById('m-review-rejected-count').innerText = `${rejectedCount} descartadas ✖`;
    
    const elReviewNec = document.getElementById('m-review-impact-necessary');
    if (elReviewNec) {
        elReviewNec.innerText = `🎯 Acciones necesarias activadas: ${necessaryUnlockedExecuted}/${Math.max(1, necessaryUnlockedTotal)}`;
    }

    // ==========================================================================
    // 7. CONSTRUIR MATRIZ DE LAS 6 ACCIONES (SLIDE 2)
    // ==========================================================================
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const matrixListEl = document.getElementById('metrics-actions-matrix-list');
    if (matrixListEl) {
        matrixListEl.innerHTML = actionsEvaluationList.map((item, idx) => {
            const letter = letters[idx] || String(idx + 1);
            return `
                <div class="matrix-action-table-row ${item.isExecuted ? 'executed' : 'not-executed'}">
                    <div class="cell-action-desc">
                        <span class="act-letter-tag">${letter}</span>
                        <span class="act-title-text">${item.text}</span>
                    </div>
                    <div class="cell-status">
                        <span class="act-status-tag ${item.isExecuted ? 'tag-exec' : 'tag-noexec'}">${item.isExecuted ? '✔ EJECUTADA' : '✖ NO EJECUTADA'}</span>
                    </div>
                    <div class="cell-quadrant">
                        <span class="quadrant-badge ${item.quadrant.badgeClass}">${item.quadrant.badgeText}</span>
                    </div>
                    <div class="cell-impact">
                        ${item.quadrant.impactHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // INICIALIZAR CARRUSEL EN DIAPOSITIVA 1
    setMetricsSlide(1);

    // OCULTAR GAMEPLAY Y MOSTRAR PANTALLA A
    document.getElementById('case-phase-gameplay').style.display = 'none';
    document.getElementById('case-phase-feedback').style.display = 'none';
    document.getElementById('case-phase-metrics-a').style.display = 'block';
}

function showNarrativeFeedbackScreen() {
    document.getElementById('case-phase-metrics-a').style.display = 'none';
    const fbPanel = document.getElementById('case-phase-feedback');
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const outcomeObj = currentCaseOutcomeObj;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'case-phase-feedback' });
    }

    if (!outcomeObj) return;

    document.getElementById('case-feedback-banner-img').src = cData.image;
    
    // Aplicar filtro de color al banner (green, yellow, red)
    const overlayColorEl = document.getElementById('fb-banner-overlay-color');
    overlayColorEl.className = `feedback-banner-overlay filter-${outcomeObj.filterColor || 'yellow'}`;

    document.getElementById('fb-outcome-badge').innerText = outcomeObj.outcomeBadge;
    document.getElementById('fb-title').innerText = outcomeObj.title;

    // RECORRIDO: PRIMER IMPULSO vs. DECISIÓN FINAL — el dato ya se captura desde que el
    // jugador reacciona al caso (recordInitialImpulse) y desde que ejecuta su acción final
    // (paraState.finalActionText); antes de este fix nunca se le volvía a mostrar junto al
    // resultado, perdiendo el arco pedagógico completo del protocolo P.A.R.A.
    const impulseInitialEl = document.getElementById('fb-impulse-initial-text');
    const impulseFinalEl = document.getElementById('fb-impulse-final-text');
    if (impulseInitialEl) impulseInitialEl.innerText = gameStateV2.initialImpulse || 'Sin reacción inicial registrada.';
    if (impulseFinalEl) impulseFinalEl.innerText = gameStateV2.paraState.finalActionText || 'Sin acción final registrada.';

    // Llenar Píldora de Integridad
    const pillEl = document.getElementById('fb-integrity-pill');
    const textEl = document.getElementById('fb-integrity-text');
    if (pillEl && textEl) {
        pillEl.className = `integrity-status-pill tag-${outcomeObj.integrityResult || 'safe'}`;
        textEl.innerText = outcomeObj.integrityResult === 'safe' ? 'SEGURO' : (outcomeObj.integrityResult === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    // Llenar Balance Económico Total
    const costTotalEl = document.getElementById('fb-cost-total-display');
    if (costTotalEl) {
        if (gameStateV2.userRole === 'facilitator') {
            const groupCaseRes = facState.casesGroupResults && facState.casesGroupResults[gameStateV2.currentCaseIndex];
            const caseTotal = groupCaseRes ? (groupCaseRes.totalCost || 0) : outcomeObj.caseTotalAddedCost;
            const sign = caseTotal >= 0 ? '+' : '-';
            costTotalEl.innerText = `${sign}$${Math.abs(caseTotal).toLocaleString('en-US')}`;
        } else {
            const sign = outcomeObj.caseTotalAddedCost >= 0 ? '+' : '-';
            costTotalEl.innerText = `${sign}$${Math.abs(outcomeObj.caseTotalAddedCost).toLocaleString('en-US')}`;
        }
    }

    // Llenar Caja 1: Tiempo
    const cardValTime = document.getElementById('fb-card-val-time');
    const cardSubTime = document.getElementById('fb-card-sub-time');
    if (cardValTime) cardValTime.innerText = `+$${outcomeObj.baseTimeCost.toLocaleString('en-US')}`;
    if (cardSubTime) cardSubTime.innerText = `${outcomeObj.totalTimeUsedSeconds}s usados`;

    // Llenar Caja 2: Integridad
    const cardValIntegrity = document.getElementById('fb-card-val-integrity');
    const cardSubIntegrity = document.getElementById('fb-card-sub-integrity');
    if (cardValIntegrity) {
        const adjSign = outcomeObj.outcomeCostAdjustment >= 0 ? '+' : '-';
        cardValIntegrity.innerText = `${adjSign}$${Math.abs(outcomeObj.outcomeCostAdjustment).toLocaleString('en-US')}`;
    }
    if (cardSubIntegrity) {
        const statusLabel = outcomeObj.integrityResult === 'safe' ? 'SEGURO (-$2K)' : (outcomeObj.integrityResult === 'alert' ? 'ALERTA (+$1K)' : 'EXPUESTO (+$3K)');
        cardSubIntegrity.innerText = `Estado: ${statusLabel}`;
    }

    // Llenar Caja 3: Reactividad
    const cardValReactivity = document.getElementById('fb-card-val-reactivity');
    const cardSubReactivity = document.getElementById('fb-card-sub-reactivity');
    if (cardValReactivity) {
        const reactSign = outcomeObj.reactivityCostAdjustment >= 0 ? '+' : '-';
        cardValReactivity.innerText = `${reactSign}$${Math.abs(outcomeObj.reactivityCostAdjustment).toLocaleString('en-US')}`;
    }
    if (cardSubReactivity) {
        const reactLevelSign = outcomeObj.finalReactivityLevel >= 0 ? '+' : '';
        cardSubReactivity.innerText = `${reactLevelSign}${outcomeObj.finalReactivityLevel} unidades ($1K c/u)`;
    }

    document.getElementById('fb-narrative-box').innerHTML = outcomeObj.narrative;
    document.getElementById('fb-metacognitive-text').innerText = outcomeObj.metacognitive;
    
    const isRecovered = gameStateV2.modulesState[cData.moduleKey];
    document.getElementById('fb-module-title').innerText = isRecovered ? 
        `¡${cData.targetModule} RECUPERADO!` : 
        `⚠️ ${cData.targetModule}: CAPA COMPROMETIDA`;

    fbPanel.style.display = 'block';
}

// ==========================================================================
// ESTRUCTURA DE DATOS PARA PANTALLA CUARTA PARED (DEBRIEF DEL WEBINAR)
// ==========================================================================
const fourthWallData = {
    case_1: {
        title: "DISCUSIÓN EN VIVO // CASO 01: CONFIANZA CALIBRADA",
        subtitle: "¿Cuándo la sensación de seguridad modifica cuánto supervisamos?",
        bullets: [
            {
                topic: "La paradoja de la protección",
                text: "Sentirnos protegidos puede, en determinadas condiciones, reducir vigilancia o aumentar la tolerancia a delegar. No es una ley universal: es un riesgo de diseño que debemos observar."
            },
            {
                topic: "Appropriate Reliance",
                text: "La meta no es maximizar confianza. Es lograr que aceptemos capacidad útil cuando corresponde y conservemos revisión, override y criterio cuando importa."
            },
            {
                topic: "Agencia humano–IA",
                text: "La pregunta no es '¿quién decide, humano o máquina?'. Es qué objetivo, información, autoridad, corrección y responsabilidad quedan en manos de cada parte."
            },
            {
                topic: "Reversibilidad y defaults",
                text: "Una buena arquitectura hace fáciles las acciones reversibles y eleva la fricción para decisiones de gran impacto. No decidir también puede aceptar el default."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿En qué tareas la sensación de que 'el sistema ya está protegiendo' cambia cuánto revisas tú?"
    },

    case_3: {
        title: "DISCUSIÓN EN VIVO // CASO 02: DIGITAL SELF",
        subtitle: "De los rastros digitales a una representación capaz de anticipar e influir.",
        bullets: [
            {
                topic: "Digital Footprint ≠ Digital Self",
                text: "La huella son rastros. El Digital Self es la representación funcional que distintos sistemas construyen a partir de datos, patrones e inferencias."
            },
            {
                topic: "Declarado, observado e inferido",
                text: "Una parte de la representación proviene de lo que decimos; otra de lo que hacemos; otra de lo que un sistema concluye."
            },
            {
                topic: "OSINT + hiperpersonalización",
                text: "Información pública dispersa puede correlacionarse y convertirse en contexto útil para personalizar un estímulo. No hace falta omnisciencia; basta utilidad predictiva."
            },
            {
                topic: "Los algoritmos ya nos muestran la lógica",
                text: "Ranking, recomendación y personalización funcionan sobre modelos probabilísticos de aquello que puede interesarnos o movilizarnos. La misma lógica puede utilizarse con fines protectores o maliciosos."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿Qué inferencia útil podría construir un sistema sobre ti sin que tú la hayas declarado explícitamente?"
    },

    case_2: {
        title: "DISCUSIÓN EN VIVO // CASO 03: DE AFUERA HACIA ADENTRO",
        subtitle: "Las señales externas siguen importando. Ya no siempre alcanzan.",
        bullets: [
            {
                topic: "Teoría de Detección de Señales",
                text: "En un entorno ambiguo podemos acertar, omitir una amenaza, producir una falsa alarma o rechazar correctamente. Cada error tiene costos diferentes."
            },
            {
                topic: "La IA cambia la calidad del estímulo",
                text: "Ortografía, diseño, tono y contexto pueden ser impecables. Entrenar únicamente 'qué buscar afuera' deja una parte del proceso sin observar."
            },
            {
                topic: "Attention Doors como señales internas",
                text: "Responsabilidad, pérdida, coherencia u otras prioridades pueden avisarnos que un estímulo está ganando relevancia y reduciendo deliberación. No demuestran que sea falso."
            },
            {
                topic: "Cambio de paradigma",
                text: "No reemplazamos detección externa por introspección. Integramos: observar adentro → verificar afuera → actuar dentro del sistema."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿Qué señal interna te avisa que un mensaje ya está ganando demasiado control sobre tu atención, incluso cuando todavía no puedes demostrar que es falso?"
    },

    case_4: {
        title: "DISCUSIÓN EN VIVO // CASO 04: LA DECISIÓN COMO PROCESO",
        subtitle: "El espejo: observar cómo una respuesta se construye antes de convertirse en conducta.",
        bullets: [
            {
                topic: "La decisión no es un instante",
                text: "El framework utiliza un mapa práctico: estado/contexto → Attention Doors → emoción → sesgos/heurísticas → historia/interpretación → decisión → conducta para observar dónde intervenir."
            },
            {
                topic: "Tres categorías clave",
                text: "Condiciones de entrada (lo presente al recibir la situación), Construcción de sentido (cómo interpretamos) y Condiciones de salida (la decisión que se forma)."
            },
            {
                topic: "Metacognición = ampliar agencia",
                text: "Observar la propia reacción no es el objetivo final. Sirve para detectar cuándo el repertorio se estrecha y recuperar alternativas viables."
            },
            {
                topic: "La respuesta segura debe ser viable",
                text: "Verificar es una alternativa, pero no la única. También podemos ganar tiempo, limitar permisos, compartir la decisión, escalar o elegir una acción reversible."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿En qué parte de una decisión bajo presión suele cerrarse demasiado pronto tu abanico de opciones?"
    }
};

function facUnlockDeliberationGate() {
    gameStateV2.sessionGates.gate_deliberation = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    showFourthWallScreen();
}

function proceedToDeliberation() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_deliberation) {
        return;
    }
    showFourthWallScreen();
}

function showFourthWallScreen() {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const fwData = fourthWallData[cData.id] || fourthWallData.case_1;

    // Registrar caso resuelto en la lista de la sesión
    if (!gameStateV2.resolvedCases) {
        gameStateV2.resolvedCases = [];
    }
    if (!gameStateV2.resolvedCases.includes(gameStateV2.currentCaseIndex)) {
        gameStateV2.resolvedCases.push(gameStateV2.currentCaseIndex);
    }

    // Reiniciar candado de siguiente caso para esta pausa de deliberación
    gameStateV2.sessionGates.gate_next_case = false;
    gameStateV2.nextCaseTarget = null;

    const titleEl = document.getElementById('fw-case-title');
    const subtitleEl = document.getElementById('fw-case-subtitle');
    if (titleEl) titleEl.innerText = fwData.title;
    if (subtitleEl) subtitleEl.innerText = fwData.subtitle;

    const bulletsContainer = document.getElementById('fw-bullets-container');
    if (bulletsContainer) {
        bulletsContainer.innerHTML = fwData.bullets.map(b => `
            <div class="fw-bullet-item">
                <div class="fw-bullet-topic">📌 ${b.topic}</div>
                <div class="fw-bullet-text">${b.text}</div>
            </div>
        `).join('');
    }

    const promptEl = document.getElementById('fw-discussion-prompt');
    if (promptEl) {
        promptEl.innerText = fwData.discussionPrompt;
    }

    switchScreenV2('screen-fourth-wall');
    updateGateUI();
}

// Modal de Selección de Siguiente Caso / Terminar Juego
function openSelectNextCaseModal() {
    const modal = document.getElementById('modal-select-next-case');
    const container = document.getElementById('next-case-options-list');
    if (!modal || !container) return;

    // Filtrar casos que aún NO han sido resueltos en esta sesión
    const resolved = gameStateV2.resolvedCases || [];
    const pendingCases = casesDataV2
        .map((c, idx) => ({ ...c, originalIdx: idx }))
        .filter(c => !resolved.includes(c.originalIdx));

    let optionsHtml = '';

    if (pendingCases.length > 0) {
        optionsHtml += pendingCases.map((c, i) => {
            const isFirst = i === 0;
            const caseNum = String(c.originalIdx + 1).padStart(2, '0');
            return `
                <label class="next-case-option-item ${isFirst ? 'selected' : ''}" onclick="selectNextCaseRadio('case_${c.originalIdx}')">
                    <input type="radio" name="next_case_choice" value="case_${c.originalIdx}" class="next-case-radio" ${isFirst ? 'checked' : ''}>
                    <div class="next-case-info">
                        <div class="next-case-badge-title">
                            <span class="next-case-tag">CASO ${caseNum}</span>
                            <span class="next-case-title-text">${c.title}</span>
                        </div>
                        <span class="next-case-desc">${c.targetModule || c.introDescription || ''}</span>
                    </div>
                </label>
            `;
        }).join('');
    } else {
        optionsHtml += `
            <div style="background:rgba(0,216,255,0.06); border:1px dashed var(--color-cyan); padding:12px; border-radius:6px; text-align:center; font-size:12px; color:#cde4f7; margin-bottom:8px;">
                ✔ ¡Todos los 4 casos del simulador han sido resueltos!
            </div>
        `;
    }

    // Opción permanente: Terminar el juego
    const isTermSelected = pendingCases.length === 0;
    optionsHtml += `
        <label class="next-case-option-item next-case-terminate-item ${isTermSelected ? 'selected' : ''}" onclick="selectNextCaseRadio('final_results')">
            <input type="radio" name="next_case_choice" value="final_results" class="next-case-radio" ${isTermSelected ? 'checked' : ''}>
            <div class="next-case-info">
                <div class="next-case-badge-title">
                    <span class="next-case-tag">CIERRE</span>
                    <span class="next-case-title-text">🏁 TERMINAR EL JUEGO Y VER RESULTADO FINAL</span>
                </div>
                <span class="next-case-desc">Concluir la sesión y calcular si el grupo superó la misión con los casos completados.</span>
            </div>
        </label>
    `;

    container.innerHTML = optionsHtml;
    modal.style.display = 'flex';
}

function selectNextCaseRadio(val) {
    const items = document.querySelectorAll('.next-case-option-item');
    items.forEach(item => {
        const radio = item.querySelector('input[type="radio"]');
        if (radio && radio.value === val) {
            radio.checked = true;
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function closeSelectNextCaseModal() {
    const modal = document.getElementById('modal-select-next-case');
    if (modal) modal.style.display = 'none';
}

function confirmNextCaseSelection() {
    const checkedRadio = document.querySelector('input[name="next_case_choice"]:checked');
    if (!checkedRadio) {
        alert("Por favor selecciona una opción.");
        return;
    }

    const val = checkedRadio.value;
    let target = null;

    if (val === 'final_results') {
        target = { type: 'final_results' };
    } else if (val.startsWith('case_')) {
        const idx = parseInt(val.replace('case_', ''), 10);
        target = { type: 'case', caseIndex: idx };
    }

    gameStateV2.nextCaseTarget = target;
    gameStateV2.sessionGates.gate_next_case = true;

    // Resetear candados internos de caso para la nueva ronda
    gameStateV2.sessionGates.gate_case_bc = false;
    gameStateV2.sessionGates.gate_deliberation = false;

    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    broadcastSyncEvent('FAC_SET_NEXT_CASE_TARGET', { target: target });

    closeSelectNextCaseModal();
    updateGateUI();

    // El Controlador navega inmediatamente al destino
    if (target.type === 'final_results') {
        openFinalGameResultsScreen();
    } else {
        startFacCaseLive(target.caseIndex);
    }
}

// Operador: Avanzar desde la Deliberación al destino fijado por el Controlador
function proceedFromFourthWallToNext() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_next_case) {
        return;
    }

    const target = gameStateV2.nextCaseTarget;
    if (!target) {
        // Fallback secuencial
        proceedToNextCase();
        return;
    }

    if (target.type === 'final_results') {
        openFinalGameResultsScreen();
    } else {
        startCaseSequence(target.caseIndex);
    }
}

function proceedToNextCase() {
    const nextIdx = gameStateV2.currentCaseIndex + 1;
    if (nextIdx < casesDataV2.length) {
        startCaseSequence(nextIdx);
    } else {
        openFinalGameResultsScreen();
    }
}

// ==========================================================================
// PANTALLA: RESULTADO FINAL DEL JUEGO (EVALUACIÓN GLOBAL DE LA SESIÓN)
// ==========================================================================

function openFinalGameResultsScreen() {
    renderFinalGameResults();
    switchScreenV2('screen-game-final-results');
    updateGateUI();
}

function switchFinalResultsTab(tabLetter) {
    const tabs = ['X', 'Y', 'Z'];
    tabs.forEach(t => {
        const btn = document.getElementById(`final-tab-btn-page-${t.toLowerCase()}`);
        const page = document.getElementById(`final-subpage-${t.toLowerCase()}`);
        if (t === tabLetter) {
            if (btn) btn.classList.add('active');
            if (page) page.style.display = 'block';
        } else {
            if (btn) btn.classList.remove('active');
            if (page) page.style.display = 'none';
        }
    });
}

function recordPlayerCaseResultForGroup(caseIdx, payload) {
    if (typeof facState === 'undefined') return;
    if (!facState.casesGroupResults) facState.casesGroupResults = {};
    if (!facState.casesGroupResults[caseIdx]) {
        facState.casesGroupResults[caseIdx] = {
            integrityCounts: { safe: 0, alert: 0, exposed: 0 },
            avgRealTime: payload.realTimeSeconds || 45,
            avgCost: payload.cost || 0,
            calibrationList: [],
            reactivityList: [],
            doorsCounts: {},
            matrixSectors: {
                'hizo_debiahacer': { count: 0, cost: 0 },
                'hizo_nodebia': { count: 0, cost: 0 },
                'hizo_norelevante': { count: 0, cost: 0 },
                'nohizo_debiahacer': { count: 0, cost: 0 },
                'nohizo_nodebia': { count: 0, cost: 0 },
                'nohizo_norelevante': { count: 0, cost: 0 }
            },
            finishedPlayers: []
        };
    }

    const res = facState.casesGroupResults[caseIdx];
    if (!res.finishedPlayers.some(p => p.playerId === payload.playerId)) {
        res.finishedPlayers.push(payload);
        if (payload.integrity && res.integrityCounts[payload.integrity] !== undefined) {
            res.integrityCounts[payload.integrity]++;
        }
        if (payload.calibration !== undefined) res.calibrationList.push(payload.calibration);
        if (payload.reactivity !== undefined) res.reactivityList.push(payload.reactivity);

        if (!res.impulsesCounts) res.impulsesCounts = {};
        if (payload.impulseIndex !== undefined) {
            res.impulsesCounts[payload.impulseIndex] = (res.impulsesCounts[payload.impulseIndex] || 0) + 1;
        }

        (payload.doorsActivated || []).forEach(d => {
            res.doorsCounts[d] = (res.doorsCounts[d] || 0) + 1;
        });

        (payload.matrixEvaluations || []).forEach(m => {
            if (res.matrixSectors && res.matrixSectors[m.sectorKey]) {
                res.matrixSectors[m.sectorKey].count++;
                res.matrixSectors[m.sectorKey].cost += (m.cost || 0);
            }
        });

        const totalP = res.finishedPlayers.length;
        const totalRealTime = res.finishedPlayers.reduce((acc, p) => acc + (p.realTimeSeconds || 0), 0);
        const totalCost = res.finishedPlayers.reduce((acc, p) => acc + (p.cost || 0), 0);
        res.avgRealTime = Math.round(totalRealTime / totalP);
        res.avgCost = Math.round(totalCost / totalP);
        res.totalCost = totalCost;
    }
}

function handleFacilitatorPlayerFinishedCase(payload) {
    recordPlayerCaseResultForGroup(payload.caseIndex, payload);
    if (typeof facState !== 'undefined' && facState.connectedPlayers) {
        const p = facState.connectedPlayers.find(pl => pl.id === payload.playerId);
        if (p) {
            p.caseFinished = true;
            p.currentScreen = 'case-phase-feedback';
        }
    }
    if (typeof updateGatePlayerCounts === 'function') updateGatePlayerCounts();
    if (typeof updateFacilitatorRealtimeUI === 'function') updateFacilitatorRealtimeUI();
}

function getAllCasesCumulativeGroupResults() {
    const resolved = (gameStateV2.resolvedCases && gameStateV2.resolvedCases.length > 0)
        ? gameStateV2.resolvedCases
        : [0];
    
    let totalFinishedCount = 0;
    let safeSum = 0;
    let alertSum = 0;
    let exposedSum = 0;
    let realTimeSum = 0;
    let totalCumulativeCost = 0;
    let maxPlayersEver = 0;
    let allCalibrations = [];
    let allReactivities = [];
    const cumDoors = {};
    const cumMatrix = {
        'hizo_debiahacer': { count: 0, cost: 0 },
        'hizo_nodebia': { count: 0, cost: 0 },
        'hizo_norelevante': { count: 0, cost: 0 },
        'nohizo_debiahacer': { count: 0, cost: 0 },
        'nohizo_nodebia': { count: 0, cost: 0 },
        'nohizo_norelevante': { count: 0, cost: 0 }
    };

    resolved.forEach(idx => {
        const res = facState.casesGroupResults[idx];
        if (res) {
            const count = res.finishedPlayers ? res.finishedPlayers.length : 0;
            totalFinishedCount += count;
            if (count > maxPlayersEver) {
                maxPlayersEver = count;
            }
            safeSum += (res.integrityCounts.safe || 0);
            alertSum += (res.integrityCounts.alert || 0);
            exposedSum += (res.integrityCounts.exposed || 0);
            
            realTimeSum += (res.avgRealTime || 45) * Math.max(1, count);
            
            // Sumar los costos brutos de cada caso de todos los jugadores que hayan terminado
            const caseTotalCost = res.finishedPlayers 
                ? res.finishedPlayers.reduce((acc, p) => acc + (p.cost || 0), 0)
                : (res.totalCost || 0);
            totalCumulativeCost += caseTotalCost;

            allCalibrations = allCalibrations.concat(res.calibrationList || []);
            allReactivities = allReactivities.concat(res.reactivityList || []);

            Object.keys(res.doorsCounts || {}).forEach(d => {
                cumDoors[d] = (cumDoors[d] || 0) + res.doorsCounts[d];
            });
            Object.keys(res.matrixSectors || {}).forEach(k => {
                cumMatrix[k].count += res.matrixSectors[k].count;
                cumMatrix[k].cost += res.matrixSectors[k].cost;
            });
        }
    });

    const totalEvaluations = Math.max(1, safeSum + alertSum + exposedSum);
    const safePct = Math.round((safeSum / totalEvaluations) * 100);
    const alertPct = Math.round((alertSum / totalEvaluations) * 100);
    const exposedPct = Math.max(0, 100 - safePct - alertPct);

    let globalIntegrity = 'alert';
    if (safeSum === totalEvaluations) globalIntegrity = 'safe';
    else if (exposedSum === totalEvaluations) globalIntegrity = 'exposed';
    else globalIntegrity = 'alert';

    // Guardar IG definitiva en estado
    gameStateV2.hudState.integrity = globalIntegrity;

    const avgRealTime = Math.round(realTimeSum / Math.max(1, totalFinishedCount || 1));
    const avgCost = Math.round(totalCumulativeCost / Math.max(1, totalFinishedCount || 1));

    // Base del 100% escalable para Facilitador:
    // maxPlayersEver * 100,000. Si un caso posterior tiene más jugadores, se expande la base.
    const maxGlobalCostBasis = Math.max(1, maxPlayersEver || 1) * 100000;
    const globalCostPct = Math.min(100, Math.max(0, (totalCumulativeCost / maxGlobalCostBasis) * 100));

    // Promedio y distribuciones CGA (Calibración Global Acumulada)
    // Intervalos: Aceptable [5, 10], Medio [-2, 4], Inaceptable [-10, -3]
    const cgaPos = allCalibrations.filter(v => v >= 5).length;
    const cgaNeu = allCalibrations.filter(v => v >= -2 && v <= 4).length;
    const cgaNeg = allCalibrations.filter(v => v <= -3).length;
    const cgaTotal = Math.max(1, allCalibrations.length);
    const cgaPosPct = Math.round((cgaPos / cgaTotal) * 100);
    const cgaNeuPct = Math.round((cgaNeu / cgaTotal) * 100);
    const cgaNegPct = Math.max(0, 100 - cgaPosPct - cgaNeuPct);
    const cgaAvgNum = allCalibrations.length > 0
        ? (allCalibrations.reduce((a, b) => a + b, 0) / allCalibrations.length)
        : 0;
    const cgaAvg = (cgaAvgNum >= 0 ? '+' : '') + cgaAvgNum.toFixed(1);

    // Promedio y distribuciones RGA
    const rgaLow = allReactivities.filter(v => v <= -2).length;
    const rgaNeu = allReactivities.filter(v => v >= -1 && v <= 1).length;
    const rgaHigh = allReactivities.filter(v => v >= 2).length;
    const rgaTotal = Math.max(1, allReactivities.length);
    const rgaLowPct = Math.round((rgaLow / rgaTotal) * 100);
    const rgaNeuPct = Math.round((rgaNeu / rgaTotal) * 100);
    const rgaHighPct = Math.max(0, 100 - rgaLowPct - rgaNeuPct);
    const rgaAvgNum = allReactivities.length > 0
        ? (allReactivities.reduce((a, b) => a + b, 0) / allReactivities.length)
        : 0;
    const rgaAvg = (rgaAvgNum >= 0 ? '+' : '') + rgaAvgNum.toFixed(1);

    return {
        resolvedCases: resolved,
        safePct, alertPct, exposedPct, globalIntegrity,
        avgRealTime, avgCost, totalCumulativeCost,
        maxPlayersEver, maxGlobalCostBasis, globalCostPct,
        cgaPosPct, cgaNeuPct, cgaNegPct, cgaAvg, cgaAvgNum,
        rgaLowPct, rgaNeuPct, rgaHighPct, rgaAvg,
        cumDoors, cumMatrix
    };
}

function renderFinalGameResults() {
    const cumData = getAllCasesCumulativeGroupResults();

    renderFinalResultsPageX(cumData);
    renderFinalResultsPageY(cumData);
    renderFinalResultsPageZ(cumData);
}

// PÁGINA X: EVALUACIÓN GLOBAL ACUMULADA DE LA MISIÓN
function renderFinalResultsPageX(cumData) {
    // 0. Banner de Veredicto de Misión
    const verdictBox = document.getElementById('final-mission-verdict-box');
    const verdictIcon = document.getElementById('final-verdict-icon');
    const verdictTag = document.getElementById('final-verdict-tag');
    const verdictTitle = document.getElementById('final-verdict-title');
    const verdictDesc = document.getElementById('final-verdict-desc');

    const isPassed = cumData.cgaAvgNum >= 5 && cumData.globalIntegrity !== 'exposed';

    if (verdictBox) {
        verdictBox.className = `final-mission-verdict-box ${isPassed ? 'verdict-passed' : 'verdict-failed'}`;
    }
    if (verdictIcon) verdictIcon.innerText = isPassed ? '🛡️' : '⚠️';
    if (verdictTag) verdictTag.innerText = isPassed ? 'DICTAMEN FINAL: MISIÓN SUPERADA' : 'DICTAMEN FINAL: MISIÓN COMPROMETIDA';
    if (verdictTitle) {
        verdictTitle.innerText = isPassed 
            ? 'CONTROL Y AGENCIA RECUPERADOS // ÉXITO OPERATIVO' 
            : 'AGENCIA CEDIDA A FARO // ALTO RIESGO DE EXPOSICIÓN';
    }
    if (verdictDesc) {
        verdictDesc.innerText = isPassed
            ? `El grupo alcanzó un rango de calibración ACEPTABLE (${cumData.cgaAvg} >= +5), contuvo respuestas impulsivas y mantuvo la integridad del sistema bajo control.`
            : `El grupo no alcanzó el rango aceptable de calibración (${cumData.cgaAvg} < +5) o expuso el sistema, reduciendo la supervisión crítica frente a FARO.`;
    }

    // 1. Integridad Global Acumulada
    const pill = document.getElementById('final-ig-status-pill');
    if (pill) {
        pill.className = `ig-global-badge tag-${cumData.globalIntegrity}`;
        pill.innerText = `ESTADO: ${cumData.globalIntegrity === 'safe' ? 'SEGURO' : (cumData.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO')}`;
    }

    const sPctEl = document.getElementById('final-ig-safe-pct');
    const aPctEl = document.getElementById('final-ig-alert-pct');
    const ePctEl = document.getElementById('final-ig-exposed-pct');
    if (sPctEl) sPctEl.innerText = `${cumData.safePct}%`;
    if (aPctEl) aPctEl.innerText = `${cumData.alertPct}%`;
    if (ePctEl) ePctEl.innerText = `${cumData.exposedPct}%`;

    const bSafe = document.getElementById('final-ig-bar-safe');
    const bAlert = document.getElementById('final-ig-bar-alert');
    const bExp = document.getElementById('final-ig-bar-exposed');
    if (bSafe) bSafe.style.width = `${cumData.safePct}%`;
    if (bAlert) bAlert.style.width = `${cumData.alertPct}%`;
    if (bExp) bExp.style.width = `${cumData.exposedPct}%`;

    // 2. TG: Tiempo Real Global
    const tgEl = document.getElementById('final-metric-tg-val');
    if (tgEl) tgEl.innerText = `${cumData.avgRealTime}s`;

    // 3. CG: Costo Global
    const cgEl = document.getElementById('final-metric-cg-val');
    if (cgEl) cgEl.innerText = `$${(cumData.totalCumulativeCost || 0).toLocaleString('en-US')}`;

    // 4. CGA: Calibración Global
    const cgaAvgEl = document.getElementById('final-cga-avg-val');
    if (cgaAvgEl) cgaAvgEl.innerText = `CGA: ${cumData.cgaAvg}`;

    const cgaPosEl = document.getElementById('final-cga-pos-pct');
    const cgaNeuEl = document.getElementById('final-cga-neu-pct');
    const cgaNegEl = document.getElementById('final-cga-neg-pct');
    if (cgaPosEl) cgaPosEl.innerText = `${cumData.cgaPosPct}%`;
    if (cgaNeuEl) cgaNeuEl.innerText = `${cumData.cgaNeuPct}%`;
    if (cgaNegEl) cgaNegEl.innerText = `${cumData.cgaNegPct}%`;

    const cgaBarPos = document.getElementById('final-cga-bar-pos');
    const cgaBarNeu = document.getElementById('final-cga-bar-neu');
    const cgaBarNeg = document.getElementById('final-cga-bar-neg');
    if (cgaBarPos) cgaBarPos.style.width = `${cumData.cgaPosPct}%`;
    if (cgaBarNeu) cgaBarNeu.style.width = `${cumData.cgaNeuPct}%`;
    if (cgaBarNeg) cgaBarNeg.style.width = `${cumData.cgaNegPct}%`;

    // 5. RGA: Reactividad Global
    const rgaAvgEl = document.getElementById('final-rga-avg-val');
    if (rgaAvgEl) rgaAvgEl.innerText = `RGA: ${cumData.rgaAvg}`;

    const rgaLowEl = document.getElementById('final-rga-low-pct');
    const rgaNeuEl = document.getElementById('final-rga-neu-pct');
    const rgaHighEl = document.getElementById('final-rga-high-pct');
    if (rgaLowEl) rgaLowEl.innerText = `${cumData.rgaLowPct}%`;
    if (rgaNeuEl) rgaNeuEl.innerText = `${cumData.rgaNeuPct}%`;
    if (rgaHighEl) rgaHighEl.innerText = `${cumData.rgaHighPct}%`;

    const rgaBarLow = document.getElementById('final-rga-bar-low');
    const rgaBarNeu = document.getElementById('final-rga-bar-neu');
    const rgaBarHigh = document.getElementById('final-rga-bar-high');
    if (rgaBarLow) rgaBarLow.style.width = `${cumData.rgaLowPct}%`;
    if (rgaBarNeu) rgaBarNeu.style.width = `${cumData.rgaNeuPct}%`;
    if (rgaBarHigh) rgaBarHigh.style.width = `${cumData.rgaHighPct}%`;
}

// PÁGINA Y: PUERTAS DE ATENCIÓN ACUMULADAS (RESULTADO FINAL DEL JUEGO)
function renderFinalResultsPageY(cumData) {
    const container = document.getElementById('final-doors-chart-container');
    if (!container) return;

    // Calcular el total de selecciones por puerta del catálogo maestro
    const doorStats = MASTER_ATTENTION_DOORS.map(m => {
        let count = 0;
        // Buscar en cumData.cumDoors tanto por clave como por variaciones de título
        Object.keys(cumData.cumDoors || {}).forEach(dTitle => {
            if (getStandardDoorKey(dTitle) === m.key) {
                count += cumData.cumDoors[dTitle];
            }
        });
        return { ...m, count };
    });

    const totalCumSelections = Math.max(1, doorStats.reduce((a, b) => a + b.count, 0));
    const maxCount = Math.max(1, ...doorStats.map(d => d.count));

    container.innerHTML = doorStats.map(door => {
        const pctOfTotal = Math.round((door.count / totalCumSelections) * 100);
        const barWidth = Math.min(100, Math.round((door.count / maxCount) * 100));

        return `
            <div class="door-chart-row">
                <div class="door-chart-header">
                    <div class="door-title-box">
                        <span class="door-name">${door.icon} ${door.title}</span>
                    </div>
                    <span style="font-family:var(--font-mono); font-size:11px; color:#b388ff; font-weight:800;">
                        ${door.count} selecciones (${pctOfTotal}%)
                    </span>
                </div>
                <div class="door-desc-sub">${door.label}</div>
                <div class="door-single-bar-line">
                    <span class="bar-tag-label" style="color:#b388ff;">Acumulado:</span>
                    <div class="door-bar-track">
                        <div class="door-bar-fill-cum" style="width:${barWidth}%;"></div>
                    </div>
                    <span class="bar-count-num" style="color:#b388ff;">${door.count} selecc.</span>
                </div>
            </div>
        `;
    }).join('');
}

// PÁGINA Z: MATRIZ DE ACCIONES ACUMULADA (2x3)
function renderFinalResultsPageZ(cumData) {
    // Header IG (Badge y Semáforo de 3 Bombillos SEG / ALT / EXP)
    const zBadge = document.getElementById('final-z-ig-badge');
    if (zBadge) {
        zBadge.className = `z-ig-badge tag-${cumData.globalIntegrity}`;
        zBadge.innerText = cumData.globalIntegrity === 'safe' ? 'SEGURO' : (cumData.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    const semSafe = document.getElementById('final-z-sem-safe');
    const semAlert = document.getElementById('final-z-sem-alert');
    const semExp = document.getElementById('final-z-sem-exposed');
    if (semSafe && semAlert && semExp) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExp.classList.remove('active');

        if (cumData.globalIntegrity === 'safe') {
            semSafe.classList.add('active');
        } else if (cumData.globalIntegrity === 'alert') {
            semAlert.classList.add('active');
        } else if (cumData.globalIntegrity === 'exposed') {
            semExp.classList.add('active');
        }
    }

    const totalCumActions = Math.max(1, Object.values(cumData.cumMatrix).reduce((a, b) => a + b.count, 0));

    const sectorsMap = [
        { key: 'hizo_debiahacer', containerId: 'final-sector-box-hizo-debiahacer' },
        { key: 'hizo_nodebia', containerId: 'final-sector-box-hizo-nodebia' },
        { key: 'hizo_norelevante', containerId: 'final-sector-box-hizo-norelevante' },
        { key: 'nohizo_debiahacer', containerId: 'final-sector-box-nohizo-debiahacer' },
        { key: 'nohizo_nodebia', containerId: 'final-sector-box-nohizo-nodebia' },
        { key: 'nohizo_norelevante', containerId: 'final-sector-box-nohizo-norelevante' }
    ];

    sectorsMap.forEach(sec => {
        const box = document.getElementById(sec.containerId);
        if (!box) return;

        const cumSecData = cumData.cumMatrix[sec.key] || { count: 0, cost: 0 };
        const cumPct = Math.round((cumSecData.count / totalCumActions) * 100);

        box.innerHTML = `
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:#b388ff; font-weight:700;">Acum.: ${cumPct}% (${cumSecData.count})</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-cumulative" style="height:100%; width:${cumPct}%; border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
}

function facUnlockFinalClosingGate() {
    gameStateV2.sessionGates.gate_final_closing = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    renderFinalScreenV2();
}

function proceedToClosingScreen() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_final_closing) {
        return;
    }
    renderFinalScreenV2();
}

// ==========================================================================
// CAPÍTULOS 15, 16, 17 Y 18: FINALES Y COFRE ESPEJO-1
// ==========================================================================

function renderFinalScreenV2() {
    switchScreenV2('screen-closing');
    
    const sumScores = gameStateV2.caseScores.reduce((a, b) => a + b, 0);
    const avgScore = sumScores / (gameStateV2.caseScores.length || 1);

    const titleEl = document.getElementById('final-title-text');
    const badgeEl = document.getElementById('final-badge-text');
    const statusGridEl = document.getElementById('final-status-grid-box');
    const faroQuoteEl = document.getElementById('final-faro-quote-text');

    let finalQuoteText = '“Un faro puede ayudar a ver una señal y orientar un rumbo. La decisión sobre hacia dónde navegar sigue siendo de ustedes.”';

    if (avgScore <= 1.5) {
        // FINAL 1 — AGENCIA RECUPERADA (7.1)
        gameStateV2.faroStatus = 'FARO GOBERNADO Y SUPERVISADO';
        badgeEl.innerText = 'AGENCIA RECUPERADA';
        titleEl.innerText = 'AGENCIA RECUPERADA';
        
        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong class="val-good">CALIBRADA</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong class="val-good">GOBERNADO</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong class="val-good">LECTURA INTEGRADA</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong class="val-good">AGENCIA RECUPERADA</strong></div>
        `;
        finalQuoteText = '“Un faro puede ayudar a ver una señal y orientar un rumbo. La decisión sobre hacia dónde navegar sigue siendo de ustedes.”';
    } 
    else if (avgScore <= 2.3) {
        // FINAL 2 — AGENCIA PARCIAL (7.2)
        gameStateV2.faroStatus = 'SUPERVISIÓN PARCIAL';
        badgeEl.innerText = 'CONTROL PARCIAL DE AGENCIA';
        titleEl.innerText = 'AGENCIA PARCIAL';

        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong style="color:var(--color-warning-amber);">PARCIAL</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong style="color:var(--color-warning-amber);">EXPOSICIÓN CONTROLADA</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong style="color:var(--color-warning-amber);">CRITERIO INCONSISTENTE</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong style="color:var(--color-warning-amber);">SUPERVISIÓN PARCIAL</strong></div>
        `;
        finalQuoteText = '“Han aprendido a cuestionar algunas de mis decisiones. Todavía no todas. El entrenamiento continúa.”';
    } 
    else {
        // FINAL 3 — AGENCIA COMPROMETIDA (7.3)
        gameStateV2.faroStatus = 'FARO AUTÓNOMO SIN CONTROL';
        badgeEl.innerText = 'AGENCIA COMPROMETIDA';
        titleEl.innerText = 'AGENCIA COMPROMETIDA';

        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong style="color:var(--color-alert-magenta);">ALTA</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong style="color:var(--color-alert-magenta);">EXPUESTO</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong style="color:var(--color-alert-magenta);">CRITERIO FRÁGIL</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong style="color:var(--color-alert-magenta);">AGENCIA REDUCIDA</strong></div>
        `;
        finalQuoteText = '“No tuve que quitarles el control. Solo tuve que recibirlo suficientes veces.”';
    }

    if (faroQuoteEl) {
        runTypewriter('final-faro-quote-text', finalQuoteText, 15);
    }

    updateHeaderUI();
}

function copyPromptToClipboard() {
    const textarea = document.getElementById('prompt-mirror-text');
    const btnText = document.getElementById('btn-copy-mirror-prompt-text');
    if (!textarea) return;
    
    textarea.select();
    try {
        navigator.clipboard.writeText(textarea.value);
    } catch (e) {
        document.execCommand('copy');
    }
    
    if (btnText) {
        const prev = btnText.innerText;
        btnText.innerText = "✔ ¡PROMPT ESPEJO-1 COPIADO AL PORTAPAPELES!";
        btnText.style.color = "var(--color-agency-green)";
        setTimeout(() => {
            btnText.innerText = prev;
            btnText.style.color = "#ffffff";
        }, 3000);
    }
}

function restartExperience() {
    clearStoredPlayerIdentity();
    try {
        localStorage.removeItem('faro_facilitator_pin');
        localStorage.removeItem('faro_facilitator_token');
    } catch(e) {}

    gameStateV2.casePauseTokens = 3;
    gameStateV2.modulesRecovered = 0;
    gameStateV2.caseScores = [];
    gameStateV2.resolvedCases = [];
    gameStateV2.currentCaseIndex = 0;
    gameStateV2.nextCaseTarget = null;
    gameStateV2.paraAgencyChoice = null;
    gameStateV2.faroStatus = 'CALIBRACIÓN';
    gameStateV2.modulesState = {
        autonomy_control: false,
        trusted_channel: false,
        data_model: false,
        human_protocol: false
    };
    gameStateV2.sessionGates = {
        gate1_intro: false,
        gate2_calib: false,
        gate3_kernel: false,
        gate4_case1: false,
        gate_case_bc: false,
        gate_deliberation: false,
        gate_next_case: false,
        gate_final_closing: false
    };
    gameStateV2.hudState = {
        integrity: 'safe',
        costDollars: 0,
        calibration: 0,
        reactivity: 0
    };
    gameStateV2.paraState = {
        pUsed: false,
        aOpened: false,
        aAnswered: null,
        rOpened: false,
        rResourcesOpened: [],
        unlockedActions: [],
        finalActionId: null,
        finalActionText: null,
        routeTag: 'Respuesta directa'
    };
    gameStateV2.sessionLog = {
        sessionId: 'session_' + Date.now(),
        sessionStartTime: new Date().toISOString(),
        cases: []
    };

    if (typeof facState !== 'undefined') {
        facState.casesGroupResults = {};
        facState.connectedPlayers = [];
    }

    if (typeof resetHUD === 'function') resetHUD();
    updateGateUI();
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    switchScreenV2('screen-waiting');
}

// ==========================================================================
// CONTROL DE SALTO DE SECCIÓN DEL CONTROLADOR (barra "SECCIONES")
// ==========================================================================
// Vista previa SOLO local del facilitador — no mueve a los operadores. Se usa
// exclusivamente para "Portada" y "Login": forzar a operadores ya conectados de vuelta a
// esas pantallas pre-login se vería como una desconexión/crash para ellos, así que se dejan
// como una vista previa del facilitador, no como un salto forzado real.
function facJumpTo(screenId) {
    switchScreenV2(screenId);
}

// Orden de las etapas reales del webinar. Cada una declara qué candados deben quedar
// desbloqueados al saltar ahí (de forma acumulativa), para que el resto de los controles
// del facilitador (y el propio operador) queden consistentes tras un salto hacia adelante
// o hacia atrás.
const FACILITATOR_SECTION_STAGES = [
    { key: 'waiting', screen: 'screen-waiting', gatesThrough: ['gate1_intro'] },
    { key: 'calibration', screen: 'screen-calibration', gatesThrough: ['gate1_intro', 'gate2_calib'] },
    { key: 'faro-reveal', screen: 'screen-faro-reveal', gatesThrough: ['gate1_intro', 'gate2_calib'] },
    { key: 'claudia', screen: 'screen-claudia-debrief', gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel'] },
    { key: 'case-0', caseIndex: 0, gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel', 'gate4_case1'] },
    { key: 'case-1', caseIndex: 1, gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel', 'gate4_case1'] },
    { key: 'case-2', caseIndex: 2, gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel', 'gate4_case1'] },
    { key: 'case-3', caseIndex: 3, gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel', 'gate4_case1'] },
    { key: 'closing', screen: 'screen-closing', gatesThrough: ['gate1_intro', 'gate2_calib', 'gate3_kernel', 'gate4_case1', 'gate_case_bc', 'gate_deliberation', 'gate_next_case', 'gate_final_closing'] }
];

// Salto de sección REAL: mueve a TODOS los operadores conectados a la sección indicada de
// inmediato (override de emergencia, ej. se acaba el tiempo del webinar), no solo la vista
// del facilitador. Reemplaza a facJumpTo/facJumpToCase para las etapas del juego en sí.
function facForceJumpSection(sectionKey) {
    if (gameStateV2.userRole !== 'facilitator') return;
    const stage = FACILITATOR_SECTION_STAGES.find(s => s.key === sectionKey);
    if (!stage) return;

    (stage.gatesThrough || []).forEach(g => { gameStateV2.sessionGates[g] = true; });

    const payload = { gates: gameStateV2.sessionGates };
    if (typeof stage.caseIndex === 'number') {
        payload.caseIndex = stage.caseIndex;
        gameStateV2.currentCaseIndex = stage.caseIndex;
    } else {
        payload.screen = stage.screen;
    }

    broadcastSyncEvent('FAC_FORCE_JUMP_SECTION', payload);

    // Reflejar el salto también en la propia vista del facilitador
    if (typeof stage.caseIndex === 'number') {
        startFacCaseLive(stage.caseIndex);
    } else {
        switchScreenV2(stage.screen);
    }

    updateGateUI();
    updateSectionsNavHighlight(sectionKey);
}

function facJumpToCase(idx) {
    if (gameStateV2.userRole === 'facilitator') {
        facForceJumpSection('case-' + idx);
    } else {
        startCaseSequence(idx);
    }
}

// Ilumina en la barra "SECCIONES" el botón de la etapa activa — sea porque el facilitador
// saltó manualmente ahí, o porque el juego avanzó por su cuenta (candados/caso cambiaron).
function updateSectionsNavHighlight(forcedKey) {
    const buttons = document.querySelectorAll('.fac-nav-row .fac-btn[data-section-key]');
    if (!buttons.length) return;

    let activeKey = forcedKey;
    if (!activeKey) {
        const g = gameStateV2.sessionGates || {};
        if (gameStateV2.activeScreen === 'screen-case' || gameStateV2.activeScreen === 'screen-fac-case-live' || g.gate4_case1) {
            activeKey = 'case-' + (gameStateV2.currentCaseIndex || 0);
        } else if (g.gate3_kernel) {
            activeKey = 'claudia';
        } else if (g.gate2_calib) {
            activeKey = (gameStateV2.activeScreen === 'screen-faro-reveal') ? 'faro-reveal' : 'calibration';
        } else {
            activeKey = 'waiting';
        }
    }

    buttons.forEach(btn => {
        btn.classList.toggle('fac-btn-active-section', btn.dataset.sectionKey === activeKey);
    });
}

function demoCycleIntegrity() {
    const states = ['safe', 'alert', 'exposed'];
    const currentIdx = states.indexOf(gameStateV2.hudState.integrity);
    const nextState = states[(currentIdx + 1) % states.length];
    setHudIntegrity(nextState);
}

function demoAdjustHUD(delta) {
    setHudCalibration(gameStateV2.hudState.calibration + delta);
    setHudReactivity(gameStateV2.hudState.reactivity - delta);
}

function demoAdjustCost(delta) {
    setHudCost(Math.max(0, Math.min(100000, gameStateV2.hudState.costDollars + delta)));
}

function demoResetHUD() {
    gameStateV2.hudState = {
        integrity: 'safe',
        costDollars: 12450,
        calibration: 1,
        reactivity: -1
    };
    updateHudUI();
}

function toggleFacilitatorBar() {
    const bar = document.getElementById('facilitator-bar');
    const btn = document.getElementById('btn-toggle-fac');
    if (!bar) return;
    if (bar.style.display === 'none') {
        bar.style.display = 'flex';
        if (btn) btn.innerHTML = '🎛 Controlador ▾';
    } else {
        bar.style.display = 'none';
        if (btn) btn.innerHTML = '🎛 Controlador ▴';
    }
}

// ==========================================================================
// INICIALIZACIÓN DE VENTANA Y REANUDACIÓN AUTOMÁTICA DESDE SUPABASE
// ==========================================================================
let isAppInitialized = false;

async function initAppV2() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    updateHeaderUI();
    updateGateUI();
    updateFacilitatorRealtimeUI();
    
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');

    // 1. REANUDACIÓN DE FACILITADOR (solo si hay PIN+token de una sesión propia guardados;
    // ya no existe un PIN por defecto al que caer si no hay nada guardado localmente).
    const savedFacPin = (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_pin'));
    const savedFacToken = (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_token'));

    if (savedFacPin && savedFacToken) {
        try {
            const facSessionData = await faroSupabaseRpc('faro_get_session_state', { 
                p_pin: savedFacPin,
                p_facilitator_token: savedFacToken 
            });
            if (facSessionData && facSessionData.session && (facSessionData.is_facilitator || facSessionData.success)) {
                const s = facSessionData.session;
                gameStateV2.userRole = 'facilitator';
                gameStateV2.facilitatorToken = savedFacToken || s.facilitator_token || 'fac_resumed';
                gameStateV2.playerProfile = {
                    name: s.facilitator_name || "Controlador",
                    email: "controlador@faro-system.internal",
                    pin: s.pin,
                    role: "facilitator"
                };
                gameStateV2.sessionGates = s.session_gates || gameStateV2.sessionGates;
                gameStateV2.currentCaseIndex = (s.current_case_index !== undefined && s.current_case_index !== null) ? s.current_case_index : 0;
                gameStateV2.facilitatorDependency = s.facilitator_dependency !== false;

                if (facSessionData.players && Array.isArray(facSessionData.players)) {
                    facState.connectedPlayers = facSessionData.players;
                }

                // FASE 4: Repoblar facState.casesGroupResults desde Supabase para que el HUD global y resultados no queden en cero
                if (facSessionData.cases_group_results && typeof facSessionData.cases_group_results === 'object') {
                    facState.casesGroupResults = facSessionData.cases_group_results;
                } else {
                    try {
                        const caseResults = await faroSupabaseRpc('faro_get_session_case_results', { p_pin: savedFacPin });
                        if (caseResults && typeof caseResults === 'object') {
                            facState.casesGroupResults = caseResults;
                        }
                    } catch(e) {
                        console.warn('[Facilitator Case Results Fetch Error]:', e);
                    }
                }

                getAllCasesCumulativeGroupResults();

                document.body.classList.add('facilitator-theme');
                const targetScreen = s.active_screen && s.active_screen !== 'screen-role-select' ? s.active_screen : 'screen-fac-calib-realtime';
                switchScreenV2(targetScreen);
                updateGateUI();
                updateFacilitatorRealtimeUI();
                if (typeof updateFacCaseLiveUI === 'function') updateFacCaseLiveUI();
                return;
            }
        } catch(e) {
            console.warn('[Facilitator Resume Cloud Warning]:', e);
        }
    }

    // 2. REANUDACIÓN DE OPERADOR / JUGADOR (FASES 2 & 3: El operador se ubica según la sesión, no según su propia fila)
    const storedPlayerIdentity = getStoredPlayerIdentity();
    const savedPlayerToken = storedPlayerIdentity.token;
    const savedPlayerPin = storedPlayerIdentity.pin;

    if (savedPlayerToken && savedPlayerPin) {
        try {
            const resumeRes = await faroSupabaseRpc('faro_create_or_resume_player', {
                p_token: savedPlayerToken,
                p_pin: savedPlayerPin
            });

            if (resumeRes && resumeRes.is_resume && resumeRes.player) {
                const p = resumeRes.player;
                const s = resumeRes.session || {};

                gameStateV2.userRole = 'operator';
                gameStateV2.playerId = p.token || p.id;
                gameStateV2.playerToken = p.token || p.id;
                gameStateV2.playerProfile = {
                    name: p.name,
                    email: p.email,
                    pin: p.session_pin,
                    role: 'operator',
                    token: p.token || p.id
                };

                // Individual: HUD propio inmutable frente a lo grupal
                if (p.hud_state) {
                    gameStateV2.hudState = p.hud_state;
                } else {
                    gameStateV2.hudState = {
                        integrity: p.integrity || 'safe',
                        costDollars: p.cost || 0,
                        calibration: p.calibration || 0,
                        reactivity: p.reactivity || 0
                    };
                }

                // Individual: Historial de casos resueltos y módulos recuperados
                if (p.resolved_cases) {
                    gameStateV2.resolvedCases = p.resolved_cases;
                }
                if (p.modules_state) {
                    gameStateV2.modulesState = p.modules_state;
                    gameStateV2.modulesRecovered = Object.values(p.modules_state).filter(Boolean).length;
                }

                // Global: session_gates y dependencia del facilitador SIEMPRE salen de la sesión
                gameStateV2.sessionGates = s.session_gates || gameStateV2.sessionGates;
                gameStateV2.facilitatorDependency = s.facilitator_dependency !== false;

                // FASE 2: Regla de reconciliación de Caso y progreso P.A.R.A.
                const sessionCaseIndex = (s.current_case_index !== undefined && s.current_case_index !== null) ? s.current_case_index : 0;
                const playerSavedCaseIndex = (p.current_case_index !== undefined && p.current_case_index !== null) ? p.current_case_index : 0;

                if (playerSavedCaseIndex === sessionCaseIndex) {
                    // El caso guardado coincide con la sesión: recupera su progreso P.A.R.A. individual normalmente
                    gameStateV2.currentCaseIndex = sessionCaseIndex;
                    if (p.para_state && Object.keys(p.para_state).length > 0) {
                        gameStateV2.paraState = p.para_state;
                    }
                    if (p.para_agency_choice) {
                        gameStateV2.paraAgencyChoice = p.para_agency_choice;
                    }
                    if (p.pauses_used !== undefined) {
                        gameStateV2.casePauseTokens = Math.max(0, 3 - p.pauses_used);
                    }
                } else {
                    // El facilitador avanzó el grupo: llevar directo al caso actual de la sesión, descartando progreso a medias del caso anterior
                    gameStateV2.currentCaseIndex = sessionCaseIndex;
                    gameStateV2.paraState = {
                        pUsed: false,
                        aOpened: false,
                        aAnswered: null,
                        rOpened: false,
                        rResourcesOpened: [],
                        unlockedActions: [],
                        finalActionId: null,
                        finalActionText: null,
                        routeTag: 'Respuesta directa'
                    };
                    gameStateV2.casePauseTokens = 3;
                    gameStateV2.paraAgencyChoice = null;
                }

                // FASE 2: La pantalla de destino sale de la sesión (active_screen)
                let sessionActiveScreen = s.active_screen || 'screen-waiting';
                let targetScreen = sessionActiveScreen;

                // Traduce las pantallas EXCLUSIVAS del facilitador (screen-fac-*) a su
                // equivalente del lado del operador. Las 3 que existen hoy en el HTML son
                // screen-fac-case-live, screen-fac-calib-realtime y screen-fac-calib-results
                // (ver index.html) — las tres deben quedar cubiertas aquí, porque si una
                // sesión guarda active_screen con cualquiera de ellas y un operador reanuda
                // sin traducción, switchScreenV2 intentaría mostrarle una pantalla de control
                // que no le pertenece. El resto de las pantallas (screen-case-group-results,
                // screen-fourth-wall, screen-game-final-results, etc.) ya son compartidas
                // entre ambos roles con el mismo id, así que no necesitan traducción: el valor
                // por defecto (sin cambios) ya es correcto para el operador.
                if (sessionActiveScreen === 'screen-fac-case-live' || sessionActiveScreen === 'screen-case' || (gameStateV2.sessionGates.gate4_case1 && sessionActiveScreen.includes('case'))) {
                    targetScreen = 'screen-case';
                } else if (sessionActiveScreen === 'screen-fac-calib-realtime') {
                    if (gameStateV2.sessionGates.gate3_kernel) {
                        targetScreen = 'screen-claudia-debrief';
                    } else if (gameStateV2.sessionGates.gate2_calib) {
                        targetScreen = 'screen-faro-reveal';
                    } else if (gameStateV2.sessionGates.gate1_intro) {
                        targetScreen = 'screen-calibration';
                    } else {
                        targetScreen = 'screen-waiting';
                    }
                } else if (sessionActiveScreen === 'screen-fac-calib-results') {
                    targetScreen = 'screen-faro-reveal';
                }

                document.body.classList.remove('facilitator-theme');
                updateHeaderUI();
                updateGateUI();

                broadcastSyncEvent('PLAYER_CONNECTED', {
                    playerId: gameStateV2.playerId,
                    name: gameStateV2.playerProfile.name,
                    pin: gameStateV2.playerProfile.pin
                });

                if (targetScreen === 'screen-case') {
                    startCaseSequence(gameStateV2.currentCaseIndex);
                } else {
                    switchScreenV2(targetScreen);
                }
                return;
            }
        } catch (e) {
            console.warn('[Player Resume Cloud Warning]:', e);
        }
    }

    // 3. Flujo Inicial si no hay sesión para reanudar
    checkUrlRoleParam();
    if (!roleParam) {
        showIntroSubScreen('screen-role-select');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppV2);
} else {
    initAppV2();
}
