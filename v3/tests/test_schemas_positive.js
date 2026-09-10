/**
 * test_schemas_positive.js
 * Suite de pruebas positivas para los 3 JSON Schemas y el auditor (R6).
 * Ejecuta y afirma salida 0 para:
 *  1. Source Note Schema v2 sobre fixture_source_v2_valid
 *  2. Claim Entry Schema v1 sobre fixture_claim_schema_valid
 *  3. Sales Claim Schema v1 sobre fixture_sales_claim_valid
 *  4. Ejecución del auditor audit_brain.js sobre fixtures positivos con exit status 0
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { parseClaimsFile, parseSalesClaimsFile } = require('../scripts/lib/content_parser');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemasDir = path.join(__dirname, '../brain/00_meta_and_governance/schemas');
const fixturesDir = path.join(__dirname, 'fixtures');
const scriptPath = path.join(__dirname, '../scripts/audit_brain.js');

console.log('=== SUITE DE PRUEBAS POSITIVAS: SCHEMAS & AUDITOR (L2/L3) ===');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('[PASS] ' + message);
        passed++;
    } else {
        console.error('[FAIL] ' + message);
        failed++;
    }
}

// 1. Validar source_note_schema_v2
const sourceSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'source_note_schema_v2.json'), 'utf8'));
const validateSource = ajv.compile(sourceSchema);
const sourceFile = path.join(fixturesDir, 'fixture_source_v2_valid/01_research_and_lenses/sources/SRC-SAMPLE-2026.md');
const sourceContent = fs.readFileSync(sourceFile, 'utf8');
const sourceFront = yaml.load(sourceContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
const sourceValid = validateSource(sourceFront);
assert(sourceValid, 'SourceNoteSchemaV2 valida positivamente SRC-SAMPLE-2026 (0 errores Ajv)');

// 2. Validar claim_entry_schema_v1
const claimSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claim_entry_schema_v1.json'), 'utf8'));
const validateClaim = ajv.compile(claimSchema);
const claimFile = path.join(fixturesDir, 'fixture_claim_schema_valid/01_research_and_lenses/claims/claims_test_valid.md');
const { claims } = parseClaimsFile(claimFile);
assert(claims.length > 0, 'parseClaimsFile extrae claim positivo correctamente');
assert(claims[0].statement.includes('\n'), 'parseClaimsFile preserva correctamente statement multilínea');
assert(claims[0].limitations && claims[0].limitations.includes('\n'), 'parseClaimsFile preserva correctamente limitations multilínea');
assert(claims[0].scope && claims[0].scope.length > 10, 'parseClaimsFile preserva scope sin pérdida');
assert(claims[0].supported_by[0].relation === 'unspecified_legacy', 'parseClaimsFile asigna relación unspecified_legacy');
assert(Array.isArray(claims[0].allowed_uses) && claims[0].allowed_uses.length === 2 && claims[0].allowed_uses[0] === 'internal_research', 'parseClaimsFile parsea arrays con comillas y backticks correctamente');

let allClaimsValid = true;
claims.forEach(c => {
    if (!validateClaim(c)) allClaimsValid = false;
});
assert(allClaimsValid, 'ClaimEntrySchemaV1 valida positivamente CLAIM-TEST-VALID-001 (0 errores Ajv)');

// 3. Validar sales_claim_schema_v1
const salesSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'sales_claim_schema_v1.json'), 'utf8'));
const validateSales = ajv.compile(salesSchema);
const salesFile = path.join(fixturesDir, 'fixture_sales_claim_valid/07_commercial_and_gotomarket/evidence_for_sales.md');
const { salesClaims } = parseSalesClaimsFile(salesFile);
assert(salesClaims.length > 0, 'parseSalesClaimsFile extrae sales claim positivo correctamente');
let allSalesValid = true;
salesClaims.forEach(sc => {
    if (!validateSales(sc)) allSalesValid = false;
});
assert(allSalesValid, 'SalesClaimSchemaV1 valida positivamente SALES-CLAIM-099 (0 errores Ajv)');

// 4. Ejecutar auditor sobre fixture positivo y verificar exit 0
const positiveDir = path.join(fixturesDir, 'fixture_source_v2_valid');
const auditRes = spawnSync(process.execPath, [scriptPath, `--brain-dir=${positiveDir}`], { encoding: 'utf8' });
assert(auditRes.status === 0, 'audit_brain.js termina con exit status 0 sobre fixture positivo');

console.log('----------------------------------------------------------------');
console.log('Resultado de la Suite Positiva: ' + passed + ' PASS, ' + failed + ' FAIL.');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('SUITE POSITIVA 100% PASS: Todos los schemas y fixtures positivos fueron validados exitosamente.');
}
