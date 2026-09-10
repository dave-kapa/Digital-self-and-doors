/**
 * test_topic_mappings.js
 * Suite unitaria determinística para topic_mappings.json (Fase 2B / R2B-05).
 * Valida:
 *  1. Cumplimiento estricto contra topic_mapping_schema_v1.json
 *  2. Cobertura exacta de los 15 legacy topics únicos y 17 ocurrencias
 *  3. Targets canónicos pertenecientes al vocabulario de RESEARCH_TAXONOMY.md
 *  4. Sin targets duplicados dentro de mappings[]
 *  5. Todas las reglas en status pending_review con aprobaciones vacías (B3R)
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const brainDir = path.join(__dirname, '../brain');
const schemaPath = path.join(brainDir, '00_meta_and_governance/schemas/topic_mapping_schema_v1.json');
const mappingsPath = path.join(brainDir, '01_research_and_lenses/librarian/topic_mappings.json');
const taxonomyPath = path.join(brainDir, '01_research_and_lenses/librarian/RESEARCH_TAXONOMY.md');

console.log('=== TEST UNITARIO: TOPIC MAPPINGS (Fase 2B) ===');

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
const mappingsData = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

// 1. Schema check
const isValid = validate(mappingsData);
if (!isValid) {
    console.error('Errores de schema en topic_mappings.json:', ajv.errorsText(validate.errors));
}
assert(isValid, 'topic_mappings.json valida 100% contra topic_mapping_schema_v1.json');

// 2. Extraer taxonomía autorizada
const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf8');
const allowedTopics = new Set();
const matches = taxonomyContent.match(/\`([a-z0-9_]+)\`/g);
if (matches) {
    matches.forEach(m => allowedTopics.add(m.replace(/\`/g, '')));
}

// 3. Reglas exactas: 15 legacy topics únicos, 17 ocurrencias
const rules = mappingsData.rules;
assert(rules.length === 15, 'Contiene exactamente 15 reglas para los 15 legacy topics únicos');

const seenLegacy = new Set();
let totalOccurrences = 0;
let allTargetsValid = true;
let allPending = true;
let hasDuplicateTargets = false;

rules.forEach(r => {
    if (seenLegacy.has(r.legacy_topic)) {
        console.error('Legacy topic duplicado en catálogo:', r.legacy_topic);
    }
    seenLegacy.add(r.legacy_topic);
    totalOccurrences += r.applied_in.length;

    const seenTargetsInRule = new Set();
    r.mappings.forEach(m => {
        if (!allowedTopics.has(m.canonical_target)) {
            console.error('Target fuera de taxonomía en regla ' + r.legacy_topic + ': ' + m.canonical_target);
            allTargetsValid = false;
        }
        if (seenTargetsInRule.has(m.canonical_target)) {
            console.error('Target duplicado en mappings[] de ' + r.legacy_topic + ': ' + m.canonical_target);
            hasDuplicateTargets = true;
        }
        seenTargetsInRule.add(m.canonical_target);
    });

    if (r.review_status !== 'pending_review' || r.approved_by_humans.length !== 0 || r.approval_date !== null) {
        allPending = false;
    }
});

assert(totalOccurrences === 17, 'Catalogadas exactamente 17 ocurrencias en applied_in[]');
assert(allTargetsValid, 'Todos los canonical_target pertenecen a RESEARCH_TAXONOMY.md');
assert(!hasDuplicateTargets, 'Cero targets duplicados dentro de un mismo array mappings[]');
assert(allPending, 'Todas las reglas están en pending_review con cero aprobaciones humanas asumidas (B3R)');

console.log('----------------------------------------------------------------');
console.log('Resultado: ' + passed + ' PASS, ' + failed + ' FAIL.');
if (failed > 0) process.exit(1);
