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
    console.log(`⚡ TEST DE ACEPTACIÓN: PERSISTENCIA, RECONCILIACIÓN Y AUDITORÍA 4 FASES`);
    console.log(`PIN Sesión Válida: ${testPin} | PIN Falso: ${fakePin}`);
    console.log('================================================================================\n');

    // TEST A: Verificar que PIN inexistente es rechazado y NO crea filas huérfanas
    console.log('--- TEST A: Rechazo de PIN Inexistente (No crea sesiones huérfanas) ---');
    const fakeGet = await callRpc('faro_get_session_state', { p_pin: fakePin });
    if (fakeGet.data.session_exists !== false) {
        throw new Error('faro_get_session_state debió rechazar el PIN inexistente');
    }

    const fakeResume = await callRpc('faro_create_or_resume_player', {
        p_pin: fakePin,
        p_name: "Operador Fantasma",
        p_email: "fantasma@test.com"
    });
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
    if (sessionRes.status !== 200) throw new Error('Fallo creación de sesión');
    console.log('✔ [PASS] Sesión creada / verificada con éxito.\n');

    // 2. Tres operadores ingresan al sistema con HUDs distintos
    console.log('--- 2. Registro de 3 Operadores con HUDs independientes ---');
    const op1 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 1', p_email: 'op1@test.com', p_role: 'operator' });
    const op2 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 2', p_email: 'op2@test.com', p_role: 'operator' });
    const op3 = await callRpc('faro_create_or_resume_player', { p_token: null, p_pin: testPin, p_name: 'Operador 3', p_email: 'op3@test.com', p_role: 'operator' });

    // Asignar HUDs distintos a cada uno para auditar aislamiento
    await callRpc('faro_upsert_player_state', {
        p_token: op1.data.player_token,
        p_state: { hudState: { integrity: 'safe', costDollars: 1000, calibration: 2, reactivity: -1 } }
    });
    await callRpc('faro_upsert_player_state', {
        p_token: op2.data.player_token,
        p_state: { hudState: { integrity: 'alert', costDollars: 8500, calibration: -1, reactivity: 3 } }
    });
    await callRpc('faro_upsert_player_state', {
        p_token: op3.data.player_token,
        p_state: { hudState: { integrity: 'exposed', costDollars: 15000, calibration: -4, reactivity: 5 } }
    });
    console.log('✔ [PASS] 3 Operadores registrados y aislados con HUDs independientes.\n');

    // AUDITORÍA 2: Operador 1 guarda progreso P.A.R.A. en Caso 1. Sesión sigue en Caso 1.
    // Reconecta → debe recuperar exactamente su progreso P.A.R.A.
    console.log('--- AUDITORÍA 2: Reconexión en el mismo caso (Conserva progreso P.A.R.A.) ---');
    await callRpc('faro_upsert_player_state', {
        p_token: op1.data.player_token,
        p_state: {
            currentScreen: 'screen-case',
            currentCaseIndex: 0,
            paraState: {
                pUsed: true,
                completedAnalyses: [{ id: 'door_source', title: 'Fuente y Origen' }],
                unlockedActions: [{ id: 'act_1', text: 'Acción 1' }]
            },
            pausesUsed: 1
        }
    });

    const op1ResumeSameCase = await callRpc('faro_create_or_resume_player', {
        p_token: op1.data.player_token,
        p_pin: testPin
    });
    console.log('Op1 Reanuda en Caso 1:', {
        caseIndex: op1ResumeSameCase.data.player.current_case_index,
        pausesUsed: op1ResumeSameCase.data.player.pauses_used,
        pUsed: op1ResumeSameCase.data.player.para_state.pUsed
    });
    if (op1ResumeSameCase.data.player.para_state.pUsed !== true || op1ResumeSameCase.data.player.pauses_used !== 1) {
        throw new Error('AUDITORÍA 2 FALLÓ: Operador 1 debió conservar su progreso P.A.R.A.');
    }
    console.log('✔ [PASS AUDITORÍA 2] Operador 1 conservó su progreso P.A.R.A. en el mismo caso.\n');

    // AUDITORÍA 1: El facilitador salta la sesión al Caso 3 (índice 2)
    // Operador 1 (que estaba en Caso 1) reconecta → la sesión le manda caso_index: 2 y active_screen: screen-fac-case-live
    console.log('--- AUDITORÍA 1: Facilitador avanza al Caso 3 → Operador reconecta y se alinea ---');
    await callRpc('faro_update_session_state', {
        p_pin: testPin,
        p_facilitator_token: facToken,
        p_gates: { gate1_intro: true, gate2_calib: true, gate3_kernel: true, gate4_case1: true },
        p_current_case_index: 2,
        p_active_screen: 'screen-fac-case-live'
    });

    const op1ResumeJump = await callRpc('faro_create_or_resume_player', {
        p_token: op1.data.player_token,
        p_pin: testPin
    });
    console.log('Op1 Reanuda tras salto de sesión:', {
        sessionCaseIndex: op1ResumeJump.data.session.current_case_index,
        sessionActiveScreen: op1ResumeJump.data.session.active_screen,
        playerCostDollars: op1ResumeJump.data.player.hud_state.costDollars
    });
    if (op1ResumeJump.data.session.current_case_index !== 2 || op1ResumeJump.data.session.active_screen !== 'screen-fac-case-live') {
        throw new Error('AUDITORÍA 1 FALLÓ: La sesión no entregó el Caso 3');
    }
    // El costo individual se conserva intacto ($1000)
    if (op1ResumeJump.data.player.hud_state.costDollars !== 1000) {
        throw new Error('AUDITORÍA 1 FALLÓ: El HUD individual del jugador se alteró');
    }
    console.log('✔ [PASS AUDITORÍA 1] Operador 1 se alinea al Caso 3 de la sesión conservando su HUD.\n');

    // AUDITORÍA 3: Jugadores terminan Caso 1 (índice 0) y guardan en faro_case_results
    // Facilitador consulta agregados → debe obtener métricas calculadas reales
    console.log('--- AUDITORÍA 3: Persistencia de Resultados y Reconstrucción Agregada del Facilitador ---');
    await postTable('faro_case_results', {
        session_pin: testPin,
        player_id: op1.data.player_token,
        case_index: 0,
        case_id: 'case_01',
        case_title: 'Caso 01 // Autonomía',
        integrity: 'safe',
        real_time_seconds: 35,
        cost: 2000,
        calibration: 3,
        reactivity: -2,
        doors_activated: ['Puerta de Contexto', 'Puerta de Fuente'],
        matrix_evaluations: [{ sectorKey: 'hizo_debiahacer', cost: 500 }]
    });

    await postTable('faro_case_results', {
        session_pin: testPin,
        player_id: op2.data.player_token,
        case_index: 0,
        case_id: 'case_01',
        case_title: 'Caso 01 // Autonomía',
        integrity: 'alert',
        real_time_seconds: 45,
        cost: 5000,
        calibration: 0,
        reactivity: 1,
        doors_activated: ['Puerta de Contexto'],
        matrix_evaluations: [{ sectorKey: 'hizo_nodebia', cost: 1500 }]
    });

    // Facilitador refresca y consulta estado + resultados agregados
    const facRefreshedState = await callRpc('faro_get_session_state', {
        p_pin: testPin,
        p_facilitator_token: facToken
    });
    console.log('Agregados calculados del Caso 1:', facRefreshedState.data.cases_group_results['0']);
    const c0 = facRefreshedState.data.cases_group_results['0'];
    if (!c0) throw new Error('AUDITORÍA 3 FALLÓ: No se calcularon agregados del Caso 0');
    if (c0.finishedPlayers.length !== 2) throw new Error('AUDITORÍA 3 FALLÓ: Deben haber 2 jugadores terminados');
    if (c0.totalCost !== 7000) throw new Error('AUDITORÍA 3 FALLÓ: Costo total sumado debe ser 7000');
    if (c0.integrityCounts.safe !== 1 || c0.integrityCounts.alert !== 1) throw new Error('AUDITORÍA 3 FALLÓ: Conteo de integridad incorrecto');
    console.log('✔ [PASS AUDITORÍA 3] El Facilitador recuperó los resultados agregados calculados en tiempo real.\n');

    // AUDITORÍA 4: Aislamiento estricto de HUDs individuales
    console.log('--- AUDITORÍA 4: Verificación de Aislamiento de HUDs Individuales ---');
    const p1 = await callRpc('faro_create_or_resume_player', { p_token: op1.data.player_token, p_pin: testPin });
    const p2 = await callRpc('faro_create_or_resume_player', { p_token: op2.data.player_token, p_pin: testPin });
    const p3 = await callRpc('faro_create_or_resume_player', { p_token: op3.data.player_token, p_pin: testPin });

    console.log(`Op1 Costo: $${p1.data.player.hud_state.costDollars} (Esperado 1000)`);
    console.log(`Op2 Costo: $${p2.data.player.hud_state.costDollars} (Esperado 8500)`);
    console.log(`Op3 Costo: $${p3.data.player.hud_state.costDollars} (Esperado 15000)`);

    if (p1.data.player.hud_state.costDollars !== 1000 || p2.data.player.hud_state.costDollars !== 8500 || p3.data.player.hud_state.costDollars !== 15000) {
        throw new Error('AUDITORÍA 4 FALLÓ: Los HUDs individuales sufrieron cruce de datos');
    }
    console.log('✔ [PASS AUDITORÍA 4] Cero colisión o cruce de datos entre jugadores.\n');

    console.log('================================================================================');
    console.log('🎉 TODAS LAS 4 AUDITORÍAS PASARON EXITOSAMENTE AL 100%');
    console.log('================================================================================');
}

runAcceptanceTest().catch(err => {
    console.error('❌ ERROR EN TEST DE ACEPTACIÓN:', err);
    process.exit(1);
});
