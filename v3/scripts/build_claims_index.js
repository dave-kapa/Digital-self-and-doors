/**
 * build_claims_index.js
 * Compila determinísticamente v3/brain/01_research_and_lenses/claims_index.json
 * a partir de las matrices Markdown autoritativas (claims_*.md) usando content_parser.js.
 * Soporta modo --check para verificación en CI/Auditoría sin escribir archivos.
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { parseClaimsFile } = require('./lib/content_parser');

const brainDir = path.join(__dirname, '../brain');
const claimsDir = path.join(brainDir, '01_research_and_lenses/claims');
const targetIndex = path.join(brainDir, '01_research_and_lenses/claims_index.json');
const schemaPath = path.join(brainDir, '00_meta_and_governance/schemas/claim_entry_schema_v1.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let claimValidator = null;
if (fs.existsSync(schemaPath)) {
    try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        claimValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar claim_entry_schema_v1.json:', e.message);
    }
}

const files = fs.readdirSync(claimsDir).filter(f => f.endsWith('.md')).sort();
const allClaims = [];
let parseErrors = 0;
let schemaValidationErrors = 0;

files.forEach(f => {
    const fullPath = path.join(claimsDir, f);
    const { claims, errors } = parseClaimsFile(fullPath);
    if (errors.length > 0) {
        errors.forEach(err => console.error('[PARSER ERROR] ' + err.file + ': ' + err.message));
        parseErrors += errors.length;
    }
    claims.forEach(c => {
        if (claimValidator) {
            const valid = claimValidator(c);
            if (!valid) {
                console.error('[SCHEMA ERROR] Claim ' + c.claim_id + ' en ' + c.file_source + ' viola claim_entry_schema_v1: ' + ajv.errorsText(claimValidator.errors));
                schemaValidationErrors++;
            }
        }
        allClaims.push(c);
    });
});

allClaims.sort((a, b) => a.claim_id.localeCompare(b.claim_id));

const isCheckMode = process.argv.includes('--check');
const formatted = JSON.stringify(allClaims, null, 2) + '\n';

if (parseErrors > 0 || schemaValidationErrors > 0) {
    console.error('ERROR: Fallos en parsing o validación de claims (' + parseErrors + ' parse, ' + schemaValidationErrors + ' schema).');
    process.exit(1);
}

if (isCheckMode) {
    if (fs.existsSync(targetIndex)) {
        const existing = fs.readFileSync(targetIndex, 'utf8');
        if (existing.replace(/\r\n/g, '\n') !== formatted.replace(/\r\n/g, '\n')) {
            console.error('[DRIFT] claims_index.json está desactualizado respecto a claims/*.md');
            process.exit(1);
        } else {
            console.log('claims_index.json verificado sin drift (' + allClaims.length + ' claims) (PASS --check).');
        }
    } else {
        console.error('[DRIFT] claims_index.json no existe. Ejecuta npm run build:claims');
        process.exit(1);
    }
} else {
    fs.writeFileSync(targetIndex, formatted, 'utf8');
    console.log('claims_index.json generado exitosamente con ' + allClaims.length + ' claims.');
}
