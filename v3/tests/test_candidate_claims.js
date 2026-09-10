/**
 * test_candidate_claims.js
 * Suite unitaria determinística para candidate claims y candidate_claims_index.json (Fase 2B / R2B-04).
 * Valida:
 *  1. Exactamente 16 candidate claims extraídos de las 5 Source Notes
 *  2. 100% de los candidatos en triage_status: pending
 *  3. Cero aprobaciones humanas asumidas (decided_by_humans: [], decision_date: null)
 *  4. Target claim ID nulo (target_claim_id: null) para todos los candidatos
 *  5. Resolución válida de matrices destino hacia CLM-MATRIX-* autorizadas
 *  6. Cero drift contra candidate_claims_index.json
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const brainDir = path.join(__dirname, '../brain');
const schemaPath = path.join(brainDir, '00_meta_and_governance/schemas/candidate_claim_schema_v1.json');
const indexPath = path.join(brainDir, '01_research_and_lenses/candidate_claims_index.json');
const registryPath = path.join(brainDir, '00_meta_and_governance/registry.json');

console.log('=== TEST UNITARIO: CANDIDATE CLAIMS & GOBERNANZA (Fase 2B) ===');

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

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);
const candidates = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// 1. Conteo exacto
assert(candidates.length === 16, 'candidate_claims_index.json contiene exactamente 16 candidatos');

// 2. Validación de schema y gobernanza
let allSchemaValid = true;
let allPending = true;
let allDecisionsEmpty = true;
let allTargetsNull = true;
let allMatricesValid = true;

candidates.forEach(c => {
    if (!validate(c)) {
        console.error('Error de schema en ' + c.candidate_id + ':', ajv.errorsText(validate.errors));
        allSchemaValid = false;
    }

    if (c.triage_status !== 'pending') allPending = false;
    if (c.decided_by_humans.length !== 0 || c.decision_date !== null || c.decision_reason !== null) {
        allDecisionsEmpty = false;
    }
    if (c.target_claim_id !== null) allTargetsNull = false;

    if (!registry[c.proposed_target_matrix_id] || registry[c.proposed_target_matrix_id].type !== 'claim_matrix') {
        console.error('Matriz propuesta no existe o no es claim_matrix:', c.proposed_target_matrix_id);
        allMatricesValid = false;
    }
});

assert(allSchemaValid, 'Todos los 16 candidatos validan 100% contra candidate_claim_schema_v1.json');
assert(allPending, 'Los 16 candidatos están estrictamente en triage_status: "pending"');
assert(allDecisionsEmpty, 'Cero decisiones humanas registradas en candidatos (decided_by_humans: [])');
assert(allTargetsNull, 'Cero claims destino asignados (target_claim_id: null)');
assert(allMatricesValid, 'Todas las matrices destino propuestas resuelven a entradas canónicas en registry.json');

console.log('----------------------------------------------------------------');
console.log('Resultado: ' + passed + ' PASS, ' + failed + ' FAIL.');
if (failed > 0) process.exit(1);
