/**
 * test_schemas_positive.js
 * Suite de pruebas positivas para todos los JSON Schemas y el auditor (Fase 2B / R2B-04).
 * Ejecuta y afirma salida 0 para:
 *  1. Source Note Schema v2 sobre fixture_source_v2_valid
 *  2. Claim Entry Schema v1 (capa autoritativa) sobre fixture_claim_schema_valid
 *  3. Claims Index Entry Schema v1 (capa enriquecida) sobre fixture_claim_schema_valid
 *  4. Sales Claim Schema v1 sobre fixture_sales_claim_valid
 *  5. Candidate Claim Schema v1 sobre candidato válido
 *  6. Topic Mapping Schema v1 sobre catálogo de topic mappings
 *  7. Ejecución del auditor audit_brain.js sobre fixtures positivos con exit status 0
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

console.log('=== SUITE DE PRUEBAS POSITIVAS: SCHEMAS & AUDITOR (Fase 2B) ===');

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

// 2. Validar claim_entry_schema_v1 (capa autoritativa)
const authClaimSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claim_entry_schema_v1.json'), 'utf8'));
const validateAuthClaim = ajv.compile(authClaimSchema);
const claimFile = path.join(fixturesDir, 'fixture_claim_schema_valid/01_research_and_lenses/claims/claims_test_valid.md');
const { claims, authoritativeClaims } = parseClaimsFile(claimFile);
assert(claims.length > 0, 'parseClaimsFile extrae claim positivo correctamente');
assert(claims[0].statement.includes('\n'), 'parseClaimsFile preserva correctamente statement multilínea');
assert(claims[0].limitations && claims[0].limitations.includes('\n'), 'parseClaimsFile preserva correctamente limitations multilínea');
assert(claims[0].scope && claims[0].scope.length > 10, 'parseClaimsFile preserva scope sin pérdida');
assert(claims[0].supported_by[0].relation === 'unspecified_legacy', 'parseClaimsFile asigna relación unspecified_legacy');
assert(Array.isArray(claims[0].allowed_uses) && claims[0].allowed_uses.length === 2 && claims[0].allowed_uses[0] === 'internal_research', 'parseClaimsFile parsea arrays con comillas y backticks correctamente');

let allAuthClaimsValid = true;
authoritativeClaims.forEach(ac => {
    if (!validateAuthClaim(ac)) {
        console.error('Error validando objeto autoritativo:', ajv.errorsText(validateAuthClaim.errors));
        allAuthClaimsValid = false;
    }
});
assert(allAuthClaimsValid, 'ClaimEntrySchemaV1 valida positivamente objeto autoritativo (0 errores Ajv, additionalProperties: false)');

// 3. Validar claims_index_entry_schema_v1 (capa de índice enriquecido)
const indexClaimSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claims_index_entry_schema_v1.json'), 'utf8'));
const validateIndexClaim = ajv.compile(indexClaimSchema);
let allIndexClaimsValid = true;
claims.forEach(c => {
    if (!validateIndexClaim(c)) {
        console.error('Error validando objeto indexado:', ajv.errorsText(validateIndexClaim.errors));
        allIndexClaimsValid = false;
    }
});
assert(allIndexClaimsValid, 'ClaimsIndexEntrySchemaV1 valida positivamente objeto enriquecido con file_source y title (0 errores Ajv)');

// 4. Validar sales_claim_schema_v1
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

// 5. Validar candidate_claim_schema_v1
const candSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'candidate_claim_schema_v1.json'), 'utf8'));
const validateCandidate = ajv.compile(candSchema);
const sampleCandidatePending = {
    candidate_id: 'CAND-SAMPLE-001',
    source_id: 'SRC-SAMPLE-2026',
    file_source: 'SRC-SAMPLE-2026.md',
    statement: 'La atención deliberada es un proceso secuencial limitado en capacidad y susceptible a interferencia.',
    proposed_epistemic_status: 'supported',
    proposed_confidence: 'high',
    scope: 'Uso conceptual y formativo; requiere evaluación empírica.',
    promotion_target: 'claims_attention_decision.md',
    proposed_target_file: 'claims_attention_decision.md',
    proposed_target_matrix_id: 'CLM-MATRIX-ATT-DEC',
    reading_basis: 'abstract_reviewed',
    evidence_locator: null,
    triage_status: 'pending',
    target_claim_id: null,
    decision_reason: null,
    decided_by_humans: [],
    decision_date: null
};
assert(validateCandidate(sampleCandidatePending), 'CandidateClaimSchemaV1 valida positivamente candidato en pending');

const sampleCandidatePromoted = {
    candidate_id: 'CAND-SAMPLE-002',
    source_id: 'SRC-SAMPLE-2026',
    file_source: 'SRC-SAMPLE-2026.md',
    statement: 'La confianza subjetiva no debe tratarse como prueba suficiente de exactitud decisional.',
    proposed_epistemic_status: 'established',
    proposed_confidence: 'high',
    scope: 'Principio general de juicio humano.',
    promotion_target: 'claims_attention_decision.md',
    proposed_target_file: 'claims_attention_decision.md',
    proposed_target_matrix_id: 'CLM-MATRIX-ATT-DEC',
    reading_basis: 'full_text_reviewed',
    evidence_locator: 'p. 42',
    triage_status: 'promoted',
    target_claim_id: 'CLAIM-AD-001',
    decision_reason: 'Candidato cumple todos los criterios de replicabilidad y precisión.',
    decided_by_humans: ['David Castañeda-Pardo'],
    decision_date: '2026-09-10'
};
assert(validateCandidate(sampleCandidatePromoted), 'CandidateClaimSchemaV1 valida positivamente candidato promovido con decisión humana');

// 6. Validar topic_mapping_schema_v1
const topicSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'topic_mapping_schema_v1.json'), 'utf8'));
const validateTopicMapping = ajv.compile(topicSchema);
const sampleTopicMappings = {
    mappings_version: '1.0.0',
    description: 'Catálogo controlado de mappings para vocabulario legacy hacia taxonomía canónica',
    taxonomy_reference: 'v3/brain/01_research_and_lenses/librarian/RESEARCH_TAXONOMY.md',
    rules: [
        {
            legacy_topic: 'heuristics_biases',
            direction: 'legacy_to_canonical',
            applied_in: ['SRC-KAHNEMAN-2011'],
            mappings: [
                { canonical_target: 'decision_making', relation_type: 'broader_term' },
                { canonical_target: 'metacognition', relation_type: 'related_term' }
            ],
            rationale: 'Heurísticas y sesgos mapeados a toma de decisiones y metacognición.',
            review_status: 'pending_review',
            approved_by_humans: [],
            approval_date: null
        },
        {
            legacy_topic: 'habits_automaticity',
            direction: 'legacy_to_canonical',
            applied_in: ['SRC-WOOD-NEAL-2007'],
            mappings: [
                { canonical_target: 'habit_automaticity', relation_type: 'exact_match' }
            ],
            rationale: 'Mapeo directo exacto a la etiqueta canónica habit_automaticity.',
            review_status: 'accepted',
            approved_by_humans: ['David Castañeda-Pardo'],
            approval_date: '2026-09-10'
        }
    ]
};
assert(validateTopicMapping(sampleTopicMappings), 'TopicMappingSchemaV1 valida positivamente catálogo de mappings (pending_review y accepted)');

// 7. Ejecutar auditor sobre fixture positivo y verificar exit 0
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
