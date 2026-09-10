/**
 * test_audit_brain_negative.js
 * Suite de pruebas negativas automatizadas para audit_brain.js (Fase 1R.1 Reconciliada).
 * Ejecuta mediante process.execPath (independiente de PATH).
 * Verifica que cada defecto sintáctico, estructural, de schema, de resolución universal,
 * de aprobación humana o de confinamiento sea interceptado determinísticamente con exit code 1,
 * el código de error canónico Y el mensaje de diagnóstico específico del defecto evaluado.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../scripts/audit_brain.js');
const fixturesBase = path.join(__dirname, 'fixtures');

const tests = [
    {
        id: 'NEG-001-D003',
        name: 'Detección de link relativo roto (D003)',
        dir: 'fixture_broken_link',
        mode: 'migration',
        expectedCode: '[FAIL D003]',
        expectedMessage: 'Link roto en'
    },
    {
        id: 'NEG-002-D010-YAML',
        name: 'Detección de sintaxis YAML malformada (D010)',
        dir: 'fixture_invalid_yaml',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Error de sintaxis YAML'
    },
    {
        id: 'NEG-003-D001-FM',
        name: 'Detección de IDs duplicados en frontmatter YAML (D001)',
        dir: 'fixture_duplicate_id',
        mode: 'migration',
        expectedCode: '[FAIL D001]',
        expectedMessage: 'ID duplicado:'
    },
    {
        id: 'NEG-004-D080',
        name: 'Detección de término prohibido en blocklist (D080)',
        dir: 'fixture_blocklist_term',
        mode: 'migration',
        expectedCode: '[FAIL D080]',
        expectedMessage: 'contiene término prohibido'
    },
    {
        id: 'NEG-005-D041',
        name: 'Detección de enlaces a rutas legacy fuera de /v3/ (D041)',
        dir: 'fixture_legacy_path',
        mode: 'migration',
        expectedCode: '[FAIL D041]',
        expectedMessage: 'contiene enlaces a rutas legacy fuera de /v3/'
    },
    {
        id: 'NEG-006-LIB001',
        name: 'Detección de sales claim activo citando fuente en deuda en strict (LIB001)',
        dir: 'fixture_orphan_source_strict',
        mode: 'strict',
        expectedCode: '[FAIL LIB001 - STRICT]',
        expectedMessage: 'cita fuente no resuelta: SRC-DEBT-ORPHAN'
    },
    {
        id: 'NEG-007-D010-ROUTING',
        name: 'Detección de Source Note nueva sin schema_version requerido (R1 / D010)',
        dir: 'fixture_source_new_missing_version',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'carece de schema_version requerido (2)'
    },
    {
        id: 'NEG-008-D010-SOURCE-SCHEMA',
        name: 'Detección de violación de Source Note Schema v2 (D010)',
        dir: 'fixture_schema_v2_invalid',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Error de validación contra source_note_schema_v2.json'
    },
    {
        id: 'NEG-009-D010-CLAIM-SCHEMA',
        name: 'Detección de violación de Claim Entry Schema v1 (D010)',
        dir: 'fixture_claim_schema_invalid',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'viola claim_entry_schema_v1.json'
    },
    {
        id: 'NEG-010-D010-SALES-SCHEMA',
        name: 'Detección de violación de Sales Claim Schema v1 (D010)',
        dir: 'fixture_sales_claim_invalid',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'viola sales_claim_schema_v1.json'
    },
    {
        id: 'NEG-011-LIB001-SALES-SUSP',
        name: 'Detección de sales claim activo citando claim suspendido en strict (R3 / LIB001)',
        dir: 'fixture_sales_cites_suspended_strict',
        mode: 'strict',
        expectedCode: '[FAIL LIB001 - STRICT]',
        expectedMessage: 'cita claim suspendido'
    },
    {
        id: 'NEG-012-LIB002-TAXONOMY',
        name: 'Detección de topic fuera de taxonomía en modo strict (R2 / LIB002)',
        dir: 'fixture_unknown_taxonomy_strict',
        mode: 'strict',
        expectedCode: '[FAIL LIB002]',
        expectedMessage: 'Topic fuera de taxonomía'
    },
    {
        id: 'NEG-013-LIB003-STORAGE',
        name: 'Detección de local_archive inexistente en full_text_reviewed (LIB003)',
        dir: 'fixture_missing_local_file',
        mode: 'migration',
        expectedCode: '[FAIL LIB003]',
        expectedMessage: 'local_archive declarado pero archivo inexistente'
    },
    {
        id: 'NEG-014-B1R-CLAIM-UNKNOWN',
        name: 'Detección de campo desconocido fuera de whitelist en claim Markdown (B1R / D010)',
        dir: 'fixture_claim_unknown_field',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Campo desconocido no permitido en claim: unknown_field'
    },
    {
        id: 'NEG-015-B1R-CLAIM-REQUIRED-MISSING',
        name: 'Detección de campo obligatorio ausente en claim Markdown (B1R / D010)',
        dir: 'fixture_claim_missing_required',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Campo obligatorio ausente o vacío en claim: scope'
    },
    {
        id: 'NEG-016-B1R-CLAIM-NO-STATEMENT',
        name: 'Detección de bloque de claim sin statement obligatorio (B1R / D010)',
        dir: 'fixture_claim_no_statement',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Claim carece de statement obligatorio'
    },
    {
        id: 'NEG-017-B1R-CLAIM-DUP-KEY',
        name: 'Detección de campo duplicado dentro de bloque de claim Markdown (B1R / D010)',
        dir: 'fixture_claim_dup_field',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Campo duplicado: scope'
    },
    {
        id: 'NEG-018-B1R-CLAIM-DUP-ID',
        name: 'Detección de Claim ID duplicado en dos bloques Markdown (B1R / D001)',
        dir: 'fixture_claim_duplicate_id',
        mode: 'migration',
        expectedCode: '[FAIL D001]',
        expectedMessage: 'ID de claim duplicado en archivo: CLAIM-TEST-DUP-001'
    },
    {
        id: 'NEG-019-B1R-SALES-UNKNOWN',
        name: 'Detección de campo desconocido en sales claim Markdown (B1R / D010)',
        dir: 'fixture_sales_unknown_field',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Campo desconocido no permitido en sales claim: unknown_field'
    },
    {
        id: 'NEG-020-B1R-SALES-INCOMPLETE',
        name: 'Detección de campo obligatorio ausente en sales claim Markdown (B1R / D010)',
        dir: 'fixture_sales_missing_required',
        mode: 'migration',
        expectedCode: '[FAIL D010]',
        expectedMessage: 'Campo obligatorio ausente o vacío en sales claim: approved_wording'
    },
    {
        id: 'NEG-021-B2R-CON-MISSING',
        name: 'Detección de target canónico CON-* inexistente (B2R / D002)',
        dir: 'fixture_con_missing',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'Sales claim SALES-CLAIM-099 apunta a ID no resoluble: CON-NO-EXISTE-999'
    },
    {
        id: 'NEG-022-B2R-DOOR-MISSING',
        name: 'Detección de target DOOR-* inexistente en grounded_in (B2R / D002)',
        dir: 'fixture_door_missing',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'grounded_in apunta a ID inexistente: DOOR-NO-EXISTE-999'
    },
    {
        id: 'NEG-023-B2R-EVD-MISSING',
        name: 'Detección de target EVD-* inexistente en evidenced_by (B2R / D002)',
        dir: 'fixture_evd_missing',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'cita evidencia inexistente: EVD-NO-EXISTE-999'
    },
    {
        id: 'NEG-024-B2R-GAME-MISSING',
        name: 'Detección de target GAME-* inexistente en grounded_in (B2R / D002)',
        dir: 'fixture_game_missing',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'grounded_in apunta a ID inexistente: GAME-NO-EXISTE-999'
    },
    {
        id: 'NEG-025-B2R-SRC-BACKLOG',
        name: 'Detección de claim citando fuente que sólo figura en Backlog (B2R / D002)',
        dir: 'fixture_src_backlog',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'cita fuente no autorizada (en backlog o desconocida): SRC-GREEN-SWETS-1966'
    },
    {
        id: 'NEG-026-B2R-CLAIM-COMMERCIAL-DEBT',
        name: 'Detección de claim con uso comercial citando fuente en deuda (B2R / D002)',
        dir: 'fixture_claim_commercial_debt',
        mode: 'migration',
        expectedCode: '[FAIL D002]',
        expectedMessage: 'Claim CLAIM-TEST-COMM-001 cita fuente en deuda SRC-CRANOR-2008 pero no está debidamente confinado'
    },
    {
        id: 'NEG-027-B3R-HUMAN-MISSING',
        name: 'Detección de objeto canonical/accepted sin aprobadores humanos (B3R)',
        dir: 'fixture_source_human_approval_missing',
        mode: 'migration',
        expectedCode: '[FAIL B3R]',
        expectedMessage: 'Objeto canonical/accepted sin aprobadores humanos en 01_research_and_lenses/sources/SRC-TEST-NOHUMAN-2026.md'
    },
    {
        id: 'NEG-028-B5R-ARCHIVE-LEAK',
        name: 'Detección de enlace activo a 99_archive_and_history (B5R / D040)',
        dir: 'fixture_archive_leak',
        mode: 'migration',
        expectedCode: '[FAIL D040]',
        expectedMessage: 'contiene referencias a 99_archive_and_history como fuente activa'
    }
];

console.log('=== SUITE DE PRUEBAS NEGATIVAS: AUDITORÍA DETERMINÍSTICA (Fase 1R.1) ===');
console.log('Total de casos de prueba negativos: ' + tests.length);
console.log('Ejecutable utilizado: ' + process.execPath);
console.log('----------------------------------------------------------------------');

let passed = 0;
let failed = 0;

tests.forEach(t => {
    const targetDir = path.join(fixturesBase, t.dir);
    const args = [scriptPath, `--brain-dir=${targetDir}`];
    if (t.mode === 'strict') args.push('--mode=strict');

    const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
    const output = (result.stdout || '') + (result.stderr || '');

    const exitedWithError = result.status !== 0;
    const containsExpectedCode = output.includes(t.expectedCode);
    const containsExpectedMessage = output.includes(t.expectedMessage);

    if (exitedWithError && containsExpectedCode && containsExpectedMessage) {
        console.log(`[PASS] ${t.id} -> ${t.name}`);
        console.log(`       Código: "${t.expectedCode}" | Mensaje específico verificado | Exit status: ${result.status}`);
        passed++;
    } else {
        console.error(`[FAIL] ${t.id} -> ${t.name}`);
        console.error(`       Exited with error: ${exitedWithError} (status: ${result.status})`);
        console.error(`       Contains Code "${t.expectedCode}": ${containsExpectedCode}`);
        console.error(`       Contains Specific Message "${t.expectedMessage}": ${containsExpectedMessage}`);
        console.error(`       Output recibido:\n${output}`);
        failed++;
    }
});

console.log('----------------------------------------------------------------------');
console.log(`Resultado de la Suite Negativa: ${passed} PASS, ${failed} FAIL de ${tests.length} pruebas.`);

if (failed > 0) {
    console.error('AL MENOS UNA PRUEBA NEGATIVA NO FALLÓ COMO SE ESPERABA.');
    process.exit(1);
} else {
    console.log('SUITE NEGATIVA 100% PASS: Todos los 28 defectos intencionales fueron interceptados con su mensaje específico.');
}
