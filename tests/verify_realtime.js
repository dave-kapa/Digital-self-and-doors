const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supaUrl = 'https://xfqswxisqtydkcnctnop.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcXN3eGlzcXR5ZGtjbmN0bm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTYwNjEsImV4cCI6MjEwMjYzMjA2MX0.Aes9e_Iv3ao9gi6EaYudX0iKcrsw0stAWSUV6kIm4dQ';

async function test() {
    console.log('Creando clientes Supabase con WebSocket...');
    const c1 = createClient(supaUrl, supaKey, { realtime: { transport: WebSocket } });
    const c2 = createClient(supaUrl, supaKey, { realtime: { transport: WebSocket } });

    const room = 'faro_realtime_DEMO_' + Date.now();
    const ch1 = c1.channel(room, { config: { broadcast: { self: false } } });
    const ch2 = c2.channel(room, { config: { broadcast: { self: false } } });

    let received = false;

    ch2.on('broadcast', { event: 'faro_sync' }, (msg) => {
        console.log('✔ [RECEIVE] Cliente 2 (Operador) recibió broadcast en tiempo real vía WebSockets:', msg.payload);
        received = true;
        process.exit(0);
    });

    console.log('Suscribiendo Cliente 1 (Facilitador) y Cliente 2 (Operador) al canal ' + room + '...');
    await new Promise(res => ch1.subscribe(s => { if (s === 'SUBSCRIBED') res(); }));
    await new Promise(res => ch2.subscribe(s => { if (s === 'SUBSCRIBED') res(); }));
    console.log('✔ Ambos clientes conectados a Supabase Realtime!');

    await new Promise(r => setTimeout(r, 400));

    console.log('Emitiendo evento GATES_UPDATE desde Cliente 1 (Facilitador)...');
    await ch1.send({
        type: 'broadcast',
        event: 'faro_sync',
        payload: {
            type: 'GATES_UPDATE',
            payload: { gates: { gate1_intro: true, gate2_calib: true } },
            sender: 'fac_host',
            senderRole: 'facilitator'
        }
    });

    setTimeout(() => {
        if (!received) {
            console.error('❌ Timeout esperando mensaje broadcast');
            process.exit(1);
        }
    }, 5000);
}

test();
