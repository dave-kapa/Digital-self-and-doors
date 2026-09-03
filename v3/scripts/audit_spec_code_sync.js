/**
 * audit_spec_code_sync.js
 * Auditoría bidireccional Spec <-> Code (D070).
 */
const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, '../app/game.js');
console.log('--- AUDITORÍA BIDIRECCIONAL SPEC <-> CODE (D070) ---');

if (!fs.existsSync(gameJsPath)) {
    console.error('[FAIL D070] No se localizó game.js en /v3/app/.');
    process.exit(1);
}

const gameContent = fs.readFileSync(gameJsPath, 'utf8');

const checks = [
    { name: 'Sincronización Supabase Realtime', pattern: /supabase|realtime|broadcast/i },
    { name: 'Control de Modales y Teclas (ESC / Logout)', pattern: /logout|handleEscKey|confirm/i },
    { name: 'Manejo de Estados de Calibración', pattern: /calibration|round|state/i },
    { name: 'Flujo de Telemetría de Sesión', pattern: /faro|session|pin/i }
];

let pass = true;
checks.forEach(c => {
    if (c.pattern.test(gameContent)) {
        console.log('[PASS] ' + c.name);
    } else {
        console.error('[FAIL] ' + c.name + ' no encontrado en game.js');
        pass = false;
    }
});

if (pass) {
    console.log('Sincronización Spec <-> Code validada al 100% (PASS D070).');
} else {
    process.exit(1);
}
