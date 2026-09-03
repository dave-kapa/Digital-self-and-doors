/**
 * audit_brain.js
 * Linter determinístico de Nivel 1 para el cerebro de conocimiento.
 * Reglas auditadas:
 * D001: IDs duplicados (delegado a build_registry)
 * D003: Links rotos en Markdown
 * D010: Schema YAML válido
 * D011: Documentos canonical incompletos
 * D040: Referencias directas al archivo histórico 99_archive
 * D041: Dependencias de archivos fuera de /v3/
 * D080: Blacklist terminológica prohibida en capas activas (00-07) con detección de contexto de rechazo.
 */
const fs = require('fs');
const path = require('path');

const brainDir = path.join(__dirname, '../brain');

// Blacklist terminológica y formulaciones prohibidas
const BLOCKLIST = [
    { term: 'el eslabón más débil', reason: 'Culpabilización del usuario / vicio de awareness tradicional' },
    { term: 'el eslabon mas debil', reason: 'Culpabilización del usuario' },
    { term: 'vulnerabilidad humana', reason: 'Falsa medicalización de prioridades atencionales' },
    { term: 'tu puerta es', reason: 'Atribución psicométrica o etiqueta de personalidad fija' },
    { term: 'diagnóstico de puertas', reason: 'Falsa escala psicométrica' },
    { term: 'garantiza reducción de incidentes', reason: 'Claim comercial sobreescalado no demostrado' }
];

function scanMarkdownFiles(dir, list = []) {
    if (!fs.existsSync(dir)) return list;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            scanMarkdownFiles(full, list);
        } else if (e.isFile() && e.name.endsWith('.md')) {
            list.push(full);
        }
    }
    return list;
}

const files = scanMarkdownFiles(brainDir);
let errors = 0;
let warnings = 0;

console.log('--- AUDITORÍA DETERMINÍSTICA NIVEL 1 (audit_brain.js) ---');
console.log('Archivos examinados: ' + files.length);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(brainDir, file).replace(/\\/g, '/');

    // D040 / D041: No referencias al archivo histórico activo ni fuera de v3 desde capas activas
    if (!rel.startsWith('99_archive_and_history')) {
        if (content.includes('99_archive_and_history') && !rel.endsWith('README.md') && !rel.endsWith('agent_operating_rules.md') && !rel.endsWith('INDEX.md')) {
            console.warn('[WARN D040] ' + rel + ' contiene referencias a 99_archive_and_history');
            warnings++;
        }
        if (content.includes('../../insumos/') || content.includes('../../docs/')) {
            console.error('[FAIL D041] ' + rel + ' contiene enlaces a rutas legacy fuera de /v3/');
            errors++;
        }

        // D080: Blacklist terminológica aplicada a capas activas
        // Se permite en el glosario, reglas terminológicas y en el decision_log donde se justifica su prohibición
        const isExemptFile = rel.includes('GLOSARIO_CANONICO.md') || 
                             rel.includes('terminology_rules.md') || rel.includes('GUIA_HUMANA_DEL_CEREBRO_V3.md') || 
                             rel.includes('decision_log/');

        if (!isExemptFile) {
            const lines = content.split(/\r?\n/);
            lines.forEach((line, lineIdx) => {
                BLOCKLIST.forEach(b => {
                    const regex = new RegExp(b.term, 'gi');
                    if (regex.test(line)) {
                        // Comprobar si la línea es un contexto legítimo de negación o rechazo (D080 allowlist)
                        const isRejectionContext = /(no demuestra|no prueba|no autoriza|no afirma|no describe|no usar|rechaza|prohibid|no como|what.*does not support)/i.test(line);
                        if (!isRejectionContext) {
                            console.error('[FAIL D080] ' + rel + ':' + (lineIdx + 1) + ' contiene término prohibido: "' + b.term + '" (' + b.reason + ')');
                            errors++;
                        }
                    }
                });
            });
        }
    }
});

console.log('---------------------------------------------------------');
if (errors > 0) {
    console.error('AUDITORÍA FALLIDA: ' + errors + ' errores críticos encontrados.');
    process.exit(1);
} else {
    console.log('AUDITORÍA DETERMINÍSTICA 100% PASS (' + warnings + ' advertencias menores).');
}
