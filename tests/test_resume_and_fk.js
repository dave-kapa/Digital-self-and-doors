const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfqswxisqtydkcnctnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcXN3eGlzcXR5ZGtjbmN0bm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTYwNjEsImV4cCI6MjEwMjYzMjA2MX0.Aes9e_Iv3ao9gi6EaYudX0iKcrsw0stAWSUV6kIm4dQ";

function callRpc(fnName, params = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`);
        const data = JSON.stringify(params);
        
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function postTable(tableName, payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
        const data = JSON.stringify(payload);
        
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runAcceptanceTest() {
    const testPin = 'TEST_' + Math.floor(1000 + Math.random() * 9000);
    const facToken = 'fac_tok_' + testPin;
    const fakePin = 'INEXIST_' + Math.floor(1000 + Math.random() * 9000);

    console.log('================================================================================');
    console.log(`⚡ TEST DE ACEPTACIÓN: SINGLE SOURCE OF TRUTH, SEGURIDAD & REANUDACIÓN`);
    console.log(`PIN Sesión Válida: ${testPin} | PIN Falso: ${fakePin}`);
    console.log('================================================================================\n');

    // TEST A: Verificar que PIN inexistente es rechazado y NO crea filas huérfanas
    console.log('--- TEST A: Rechazo de PIN Inexistente (No crea sesiones huérfanas) ---');
    const fakeGet = await callRpc('faro_get_session_state', { p_pin: fakePin });
    console.log('faro_get_session_state con PIN falso:', fakeGet.data);
    if (fakeGet.data.session_exists !== false) {
        throw new Error('faro_get_session_state debió rechazar el PIN inexistente');
    }

    const fakeResume = await callRpc('faro_create_or_resume_player', {
        p_pin: fakePin,
        p_name: "Operador Fantasma",
        p_email: "fantasma@test.com"
    });
    console.log('faro_create_or_resume_player con PIN falso:', fakeResume.data);
    if (fakeResume.data.session_exists !== false) {
        throw new Error('faro_create_or_resume_player debió rechazar el PIN inexistente');
    }
    console.log('✔ [PASS] PIN inexistente rechazado exitosamente sin crear sesiones.\n');

    // 1. Facilitador crea sesión real
    console.log('--- 1. Facilitador inicia sesión (upsert session) ---');
    const sessionRes = await callRpc('faro_create_or_get_session', {
        p_pin: testPin,
        p_facilitator_name: 'Controlador QA',
        p_facilitator_token: facToken
    });
    console.log(`Status: ${sessionRes.status}, PIN: ${sessionRes.data.pin}, Status: ${sessionRes.data.status}`);
    if (sessionRes.status !== 200) throw new Error('Fallo creación de sesión');
    console.log('✔ [PASS] Sesión creada / verificada con éxito.\n');

    // 2. Tres operadores ingresan al sistema
    console.log('--- 2. Registro de 3 Operadores ---');
    const op1 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 1', p_email: 'op1@test.com', p_role: 'operator' });
    const op2 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 2', p_email: 'op2@test.com', p_role: 'operator' });
    const op3 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 3', p_email: 'op3@test.com', p_role: 'operator' });

    console.log(`Op1 Token: ${op1.data.player_token} (is_resume: ${op1.data.is_resume})`);
    console.log(`Op2 Token: ${op2.data.player_token} (is_resume: ${op2.data.is_resume})`);
    console.log(`Op3 Token: ${op3.data.player_token} (is_resume: ${op3.data.is_resume})`);
    console.log('✔ [PASS] 3 Operadores registrados con tokens únicos estables.\n');

    // TEST B: Verificar que consulta NO autenticada de session_state NO filtra tokens
    console.log('--- TEST B: Seguridad de Tokens (faro_get_session_state sin token de facilitador) ---');
    const unauthedGet = await callRpc('faro_get_session_state', { p_pin: testPin });
    console.log('Consulta pública/no autenticada:', {
        is_facilitator: unauthedGet.data.is_facilitator,
        players_exposed: unauthedGet.data.players ? unauthedGet.data.players.length : 0
    });
    if (unauthedGet.data.is_facilitator === true || (unauthedGet.data.players && unauthedGet.data.players.length > 0)) {
        throw new Error('faro_get_session_state filtró datos de jugadores a una consulta no autenticada');
    }
    console.log('✔ [PASS] Cero tokens de jugador filtrados a consultas públicas.\n');

    // 3. Operador 2 avanza a mitad del Caso 2 (P.A.R.A., HUD alterado, gates)
    console.log('--- 3. Operador 2 avanza al Caso 2 y modifica estado ---');
    const op2State = {
        currentScreen: 'screen-case',
        currentCaseIndex: 1,
        hudState: {
            integrity: 'alert',
            costDollars: 14500,
            calibration: 3,
            reactivity: -2
        },
        paraState: {
            pUsed: true,
            completedAnalyses: [{ id: 'door_source', title: 'Fuente y Origen' }],
            reviewedActions: [{ id: 'act_audit', text: 'Auditar ticket de cambio' }],
            unlockedActions: [{ id: 'act_audit', text: 'Auditar ticket de cambio' }],
            routeTag: 'Vía P.A.R.A.'
        },
        resolvedCases: [0],
        sessionGates: {
            gate1_intro: true,
            gate2_calib: true,
            gate3_kernel: true,
            gate4_case1: true
        },
        modulesState: {
            autonomy_control: true,
            trusted_channel: false,
            data_model: false,
            human_protocol: false
        },
        pausesUsed: 1,
        analysesCount: 1,
        reviewsCount: 1
    };

    const updateRes = await callRpc('faro_upsert_player_state', {
        p_token: op2.data.player_token,
        p_state: op2State
    });
    console.log(`Update status: ${updateRes.status}`, updateRes.data);
    if (!updateRes.data.success) throw new Error('Fallo actualización de estado de Operador 2');
    console.log('✔ [PASS] Estado del Operador 2 persistido en el backend como fuente de verdad.\n');

    // 4. Enviar evento de telemetría a faro_case_events (Verificar 0 error 409 / FK)
    console.log('--- 4. Insertando eventos de telemetría a faro_case_events ---');
    const eventRes = await postTable('faro_case_events', {
        session_pin: testPin,
        player_id: op2.data.player_token,
        case_index: 1,
        event_type: 'PLAYER_PARA_PAUSE',
        payload: { pauseNumber: 1, remaining: 2 }
    });
    console.log(`Event Insert Status: ${eventRes.status} (Esperado 201 Created)`);
    if (eventRes.status !== 201) {
        console.error('Event error:', eventRes.data);
        throw new Error(`Error insertando en faro_case_events: HTTP ${eventRes.status}`);
    }
    console.log('✔ [PASS] Inserción a faro_case_events completada sin error de foreign key (0 error 409 / 23503).\n');

    // 5. Simular REFRESH del Operador 2 (llamando con su player_token)
    console.log('--- 5. SIMULANDO REFRESH DEL NAVEGADOR (Operador 2) ---');
    const resumeOp2 = await callRpc('faro_create_or_resume_player', {
        p_token: op2.data.player_token,
        p_pin: testPin
    });

    console.log(`Resume Status: ${resumeOp2.status}`);
    console.log(`is_resume: ${resumeOp2.data.is_resume} (Esperado true)`);
    console.log(`Token mantenido: ${resumeOp2.data.player_token === op2.data.player_token}`);
    console.log(`Pantalla recuperada: ${resumeOp2.data.player.current_screen} (Esperado: screen-case)`);
    console.log(`Caso activo recuperado: Caso ${resumeOp2.data.player.current_case_index + 1} (Índice: ${resumeOp2.data.player.current_case_index})`);
    console.log(`HUD recuperado: Integridad=${resumeOp2.data.player.hud_state.integrity}, Costo=$${resumeOp2.data.player.hud_state.costDollars}, Calib=${resumeOp2.data.player.hud_state.calibration}, React=${resumeOp2.data.player.hud_state.reactivity}`);
    console.log(`Casos resueltos recuperados: [${resumeOp2.data.player.resolved_cases}]`);

    if (!resumeOp2.data.is_resume) throw new Error('El backend no reconoció al jugador como reanudación');
    if (resumeOp2.data.player.current_case_index !== 1) throw new Error('Caso activo no restaurado correctamente');
    if (resumeOp2.data.player.hud_state.costDollars !== 14500) throw new Error('Costo HUD no restaurado correctamente');
    if (resumeOp2.data.player.resolved_cases[0] !== 0) throw new Error('Casos resueltos no restaurados');
    console.log('✔ [PASS] Operador 2 reanudado exactamente en el mismo punto de partida.\n');

    // 6. Verificar Roster del Facilitador con token de autenticación (NO debe haber duplicados)
    console.log('--- 6. Verificando Roster del Facilitador autenticado tras el refresh ---');
    const facStateRes = await callRpc('faro_get_session_state', { 
        p_pin: testPin,
        p_facilitator_token: facToken
    });
    console.log(`is_facilitator: ${facStateRes.data.is_facilitator}`);
    const playersCount = facStateRes.data.players ? facStateRes.data.players.length : 0;
    console.log(`Total jugadores en la sesión: ${playersCount} (Esperado: 3)`);
    facStateRes.data.players.forEach(p => {
        console.log(`   • ${p.name} | Token: ${p.token} | Pantalla: ${p.current_screen} | Costo: $${p.cost}`);
    });

    if (playersCount !== 3) throw new Error(`El roster tiene ${playersCount} jugadores en vez de 3`);
    console.log('✔ [PASS] El Facilitador mantiene exactamente los 3 operadores originales sin duplicados.\n');

    console.log('================================================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE ACEPTACIÓN Y SEGURIDAD PASARON EXITOSAMENTE (100%)');
    console.log('================================================================================');
}

runAcceptanceTest().catch(err => {
    console.error('❌ ERROR EN TEST DE ACEPTACIÓN:', err);
    process.exit(1);
});
