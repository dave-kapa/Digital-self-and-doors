const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supaUrl = 'https://xfqswxisqtydkcnctnop.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcXN3eGlzcXR5ZGtjbmN0bm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTYwNjEsImV4cCI6MjEwMjYzMjA2MX0.Aes9e_Iv3ao9gi6EaYudX0iKcrsw0stAWSUV6kIm4dQ';

async function runFullRealtimeSuite() {
    const testPin = 'QA_' + Math.floor(1000 + Math.random() * 9000);
    const room = 'faro_realtime_' + testPin;

    console.log('================================================================================');
    console.log('⚡ PRUEBA COMPLETA DE PROTOCOLO REALTIME BROADCAST (SUPABASE WEBSOCKETS)');
    console.log('PIN Sesión:', testPin, '| Canal:', room);
    console.log('================================================================================\n');

    const fac = createClient(supaUrl, supaKey, { realtime: { transport: WebSocket } });
    const op1 = createClient(supaUrl, supaKey, { realtime: { transport: WebSocket } });
    const op2 = createClient(supaUrl, supaKey, { realtime: { transport: WebSocket } });

    const facCh = fac.channel(room, { config: { broadcast: { self: false } } });
    const op1Ch = op1.channel(room, { config: { broadcast: { self: false } } });
    const op2Ch = op2.channel(room, { config: { broadcast: { self: false } } });

    const op1Events = [];
    const op2Events = [];
    const facEvents = [];

    op1Ch.on('broadcast', { event: 'faro_sync' }, msg => op1Events.push(msg.payload));
    op2Ch.on('broadcast', { event: 'faro_sync' }, msg => op2Events.push(msg.payload));
    facCh.on('broadcast', { event: 'faro_sync' }, msg => facEvents.push(msg.payload));

    console.log('--- 1. Conectando 3 clientes a WebSockets Supabase ---');
    await Promise.all([
        new Promise(r => facCh.subscribe(s => { if (s === 'SUBSCRIBED') r(); })),
        new Promise(r => op1Ch.subscribe(s => { if (s === 'SUBSCRIBED') r(); })),
        new Promise(r => op2Ch.subscribe(s => { if (s === 'SUBSCRIBED') r(); }))
    ]);
    console.log('✔ [PASS] 3 Clientes conectados a WebSockets en tiempo real.\n');

    await new Promise(r => setTimeout(r, 400));

    // TEST 1: Candados
    console.log('--- 2. Facilitador emite GATES_UPDATE ---');
    await facCh.send({
        type: 'broadcast', event: 'faro_sync',
        payload: { type: 'GATES_UPDATE', payload: { gates: { gate1_intro: true } }, sessionPin: testPin, senderRole: 'facilitator' }
    });
    await new Promise(r => setTimeout(r, 500));
    if (op1Events.length === 0 || op2Events.length === 0) throw new Error('Fallo GATES_UPDATE');
    console.log('✔ [PASS] Candados recibidos por Op1 y Op2.\n');

    // TEST 2: Salto forzado
    console.log('--- 3. Facilitador emite FAC_FORCE_JUMP_SECTION (Caso 2 / índice 1) ---');
    await facCh.send({
        type: 'broadcast', event: 'faro_sync',
        payload: { type: 'FAC_FORCE_JUMP_SECTION', payload: { caseIndex: 1, screen: 'screen-case' }, sessionPin: testPin, senderRole: 'facilitator' }
    });
    await new Promise(r => setTimeout(r, 500));
    const jump1 = op1Events[op1Events.length - 1];
    const jump2 = op2Events[op2Events.length - 1];
    if (jump1.type !== 'FAC_FORCE_JUMP_SECTION' || jump1.payload.caseIndex !== 1) throw new Error('Fallo salto Op1');
    if (jump2.type !== 'FAC_FORCE_JUMP_SECTION' || jump2.payload.caseIndex !== 1) throw new Error('Fallo salto Op2');
    console.log('✔ [PASS] Salto al Caso 2 recibido por todos los operadores.\n');

    // TEST 3: Telemetría de Operadores al Facilitador
    console.log('--- 4. Operadores envían telemetría al Facilitador ---');
    await op1Ch.send({
        type: 'broadcast', event: 'faro_sync',
        payload: { type: 'PLAYER_CONNECTED', payload: { name: 'Operador 1', pin: testPin }, sessionPin: testPin, senderRole: 'operator' }
    });
    await op2Ch.send({
        type: 'broadcast', event: 'faro_sync',
        payload: { type: 'PLAYER_CONNECTED', payload: { name: 'Operador 2', pin: testPin }, sessionPin: testPin, senderRole: 'operator' }
    });
    await new Promise(r => setTimeout(r, 500));
    if (facEvents.length < 2) throw new Error('El facilitador no recibió los eventos de conexión');
    console.log('✔ [PASS] Facilitador recibió telemetría de conexión de ambos operadores.\n');

    await Promise.all([
        fac.removeChannel(facCh),
        op1.removeChannel(op1Ch),
        op2.removeChannel(op2Ch)
    ]);

    console.log('================================================================================');
    console.log('🎉 TODOS LOS TESTS DE BROADCAST REALTIME PASARON AL 100%');
    console.log('================================================================================');
    process.exit(0);
}

runFullRealtimeSuite().catch(err => {
    console.error('❌ ERROR:', err);
    process.exit(1);
});
