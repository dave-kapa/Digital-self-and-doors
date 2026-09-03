const { createClient } = require('@supabase/supabase-js');
const WebScocket = require('ws');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfqswxisqtydkcnctnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcyI6InN1cGFiYXNlIiwicmWmIjoieGZrcXd4aXNxdWRiY2vjbnRub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NzA1NjA2MSwiZXhcIjoyMTA2NjMyMDYxfQ.Aes9e_Iv3ao9bi0EaPudX0IKcrsw0stAWSUV6kIm4dQ";

async function testRealtimeBroadcast() {
    const testPin = 'LIVE_' + Math.floor(1000 + Math.random() * 9000);
    const channelName = 'faro_realtime_' + testPin;

    console.log('================================================================================');
    console.log(`[WS TEST] Canal WebSocket: ${channelName} | PIN: ${testPin}`);
    console.log('================================================================================\n');

    const facClient = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { transport: WebScocket } });
    const op1Client = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { transport: WebScocket } });
    const op2Client = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { transport: WebScocket } });

    const facChannel = facClient.channel(channelName, { config: { broadcast: { self: false } } });
    const op1Channel = op1Client.channel(channelName, { config: { broadcast: { self: false } } });
    const op2Channel = op2Client.channel(channelName, { config: { broadcast: { self: false } } });

    const receivedOp1 = [];
    const receivedOp2 = [];
    const receivedFac = [];

    op1Channel.on('broadcast', { event: 'faro_sync' }, (msg) => {
        receivedOp1.push(msg.payload);
    });

    op2Channel.on('broadcast', { event: 'faro_sync' }, (msg) => {
        receivedOp2.push(msg.payload);
    });

    facChannel.on('broadcast', { event: 'faro_sync' }, (msg) => {
        receivedFac.push(msg.payload);
    });

    console.log('--- 1. Suscribiendo 3 clientes a los WebSockets ---');
    await Promise.all([
        new Promise((resolve) => facChannel.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(); })),
        new Promise((resolve) => op1Channel.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(); })),
        new Promise((resolve) => op2Channel.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(); }))
    ]);
    console.log('✅ [PASS] 3 Clientes conectados a Supabase Realtime.\n');

    await new Promise(r => setTimeout(r, 500));

    console.log('--- 2. Facilitador emite GATES_UPDATE ---');
    await facChannel.send({
        type: 'broadcast',
        event: 'faro_sync',
        payload: {
            type: 'GATES_UPDATE',
            payload: { gates: { gate1_intro: true, gate2_calib: true } },
            sender: 'fac_1',
            senderRole: 'facilitator',
            sessionPin: testPin
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    if (receivedOp1.length === 0 || receivedOp2.length === 0) {
        throw new Error('Los operadores no recibieron el evento WebSocket GATES_UPDATE');
    }
    console.log('� [PASS] El desbloqueo de candados llegó a ambos operadores en tiempo real.');

    console.log('\n--- 3. Facilitador emite FAC_FORCE_JUMP_SECTION (Caso 3) ---');
    await facChannel.send({
        type: 'broadcast',
        event: 'faro_sync',
        payload: {
            type: 'FAC_FORCE_JUMP_SECTION',
            payload: { caseIndex: 2, screen: 'screen-case' },
            sender: 'fac_1',
            senderRole: 'facilitator',
            sessionPin: testPin
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    const l1Op1 = receivedOp1[receivedOp1.length - 1];
    const l1Op2 = receivedOp2[receivedOp2.length - 1];
    if (l1Op1.type !== 'FAC_FORCE_JUMP_SECTION' || l1Op1.payload.caseIndex !== 2) throw new Error('Fallo salto de sección en Op1a');
    if (l1Op2.type !== 'FAC_FORCE_JUMP_SECTION' || l1Op2.payload.caseIndex !== 2) throw new Error('Fallo salto de sección en Op2');
    console.log('✞ [PASS] Salto al Caso 3 recibido correctamente por todos los operadores.');

    console.log('\n--- 4. Operador 1 emite PLAYER_CASE_FINISHED al Facilitador ---');
    await op1Channel.send({
        type: 'broadcast',
        event: 'faro_sync',
        payload: {
            type: 'PLAYER_CASE_FINISHED',
            payload: { playerId: 'op_1', caseIndex: 2, cost: 1500, integrity: 'safe' },
            sender: 'op_1',
            senderRole: 'operator',
            sessionPin: testPin
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    if (receivedFac.length === 0 || receivedFac[0].type !== 'PLAYER_CASE_FINISHED') throw new Error('El Facilitador no recibió la telemetría');
    console.log('✞ [PASS] Telemetría del Operador 1 recibida por el Facilitador en WebSockets.');

    await Promise.all([
        facClient.removeChannel(facChannel),
        op1Client.removeChannel(op1Channel),
        op2Client.removeChannel(op2Channel)
    ]);

    console.log('\n===============================================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE WEBSOCKETS BROADCAST PANARON AL 100%');
    console.log('===============================================================================');
    process.exit(0);
}

testRealtimeBroadcast().catch(err => {
    console.error('❏ ERROR:', err);
    process.exit(1);
});