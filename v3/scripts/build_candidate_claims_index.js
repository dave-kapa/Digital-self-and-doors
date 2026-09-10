/**
 * build_candidate_claims_index.js
 * Compila determinísticamente v3/brain/01_research_and_lenses/candidate_claims_index.json
 * a partir de la Sección 9 de las 5 Source Notes usando content_parser.js.
 * Valida cada candidato contra candidate_claim_schema_v1.json (R2B-04).
 * Soporta modo --check para verificación en CI sin escribir archivos.
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { parseCandidateClaimsFromSourceNote } = require('./lib/content_parser');

const brainDir = path.join(__dirname, '../brain');
const sourcesDir = path.join(brainDir, '01_research_and_lenses/sources');
const targetIndex = path.join(brainDir, '01_research_and_lenses/candidate_claims_index.json');
const schemaPath = path.join(brainDir, '00_meta_and_governance/schemas/candidate_claim_schema_v1.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let candidateValidator = null;
if (fs.existsSync(schemaPath)) {
    try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        candidateValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar candidate_claim_schema_v1.json:', e.message);
    }
}

const files = fs.readdirSync(sourcesDir).filter(f => f.startsWith('SRC-') && f.endsWith('.md')).sort();
const allCandidates = [];
let parseErrors = 0;
let schemaValidationErrors = 0;
const seenCandidateIdsGlobal = new Set();

files.forEach(f => {
    const fullPath = path.join(sourcesDir, f);
    const { candidates, errors } = parseCandidateClaimsFromSourceNote(fullPath);
    if (errors.length > 0) {
        errors.forEach(err => console.error('[PARSER ERROR] ' + err.file + ': ' + err.message));
        parseErrors += errors.length;
    }

    candidates.forEach(cand => {
        if (seenCandidateIdsGlobal.has(cand.candidate_id)) {
            console.error('[COLLISION ERROR] Candidate ID colisiona globalmente entre notas: ' + cand.candidate_id);
            parseErrors++;
        }
        seenCandidateIdsGlobal.add(cand.candidate_id);

        if (candidateValidator) {
            const valid = candidateValidator(cand);
            if (!valid) {
                console.error('[SCHEMA ERROR] Candidato ' + cand.candidate_id + ' en ' + cand.file_source + ' viola candidate_claim_schema_v1: ' + ajv.errorsText(candidateValidator.errors));
                schemaValidationErrors++;
            }
        }

        allCandidates.push(cand);
    });
});

allCandidates.sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));

const isCheckMode = process.argv.includes('--check');
const formatted = JSON.stringify(allCandidates, null, 2) + '\n';

if (parseErrors > 0 || schemaValidationErrors > 0) {
    console.error('ERROR: Fallos en parsing o validación de candidate claims (' + parseErrors + ' parse, ' + schemaValidationErrors + ' schema).');
    process.exit(1);
}

if (isCheckMode) {
    if (fs.existsSync(targetIndex)) {
        const existing = fs.readFileSync(targetIndex, 'utf8');
        if (existing.replace(/\r\n/g, '\n') !== formatted.replace(/\r\n/g, '\n')) {
            console.error('[DRIFT] candidate_claims_index.json está desactualizado respecto a sources/SRC-*.md');
            process.exit(1);
        } else {
            console.log('candidate_claims_index.json verificado sin drift (' + allCandidates.length + ' candidatos) (PASS --check).');
        }
    } else {
        console.error('[DRIFT] candidate_claims_index.json no existe. Ejecuta node v3/scripts/build_candidate_claims_index.js');
        process.exit(1);
    }
} else {
    fs.writeFileSync(targetIndex, formatted, 'utf8');
    console.log('candidate_claims_index.json generado exitosamente con ' + allCandidates.length + ' candidatos.');
}
