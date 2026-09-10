/**
 * build_claims_index.js
 * Compila determinísticamente v3/brain/01_research_and_lenses/claims_index.json
 * a partir de las matrices Markdown autoritativas (claims_*.md) usando content_parser.js.
 * Implementa doble capa estricta de validación (R2B-04):
 *  1. claim_entry_schema_v1.json sobre el objeto autoritativo puro (additionalProperties: false)
 *  2. claims_index_entry_schema_v1.json sobre el objeto derivado indexado (additionalProperties: false)
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
const authSchemaPath = path.join(brainDir, '00_meta_and_governance/schemas/claim_entry_schema_v1.json');
const indexSchemaPath = path.join(brainDir, '00_meta_and_governance/schemas/claims_index_entry_schema_v1.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let authValidator = null;
if (fs.existsSync(authSchemaPath)) {
    try {
        const schema = JSON.parse(fs.readFileSync(authSchemaPath, 'utf8'));
        authValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar claim_entry_schema_v1.json:', e.message);
    }
}

let indexValidator = null;
if (fs.existsSync(indexSchemaPath)) {
    try {
        const schema = JSON.parse(fs.readFileSync(indexSchemaPath, 'utf8'));
        indexValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar claims_index_entry_schema_v1.json:', e.message);
    }
}

const files = fs.readdirSync(claimsDir).filter(f => f.endsWith('.md')).sort();
const allClaims = [];
let parseErrors = 0;
let schemaValidationErrors = 0;

files.forEach(f => {
    const fullPath = path.join(claimsDir, f);
    const { claims, authoritativeClaims, errors } = parseClaimsFile(fullPath);
    if (errors.length > 0) {
        errors.forEach(err => console.error('[PARSER ERROR] ' + err.file + ': ' + err.message));
        parseErrors += errors.length;
    }

    for (let i = 0; i < claims.length; i++) {
        const c = claims[i];
        const auth = authoritativeClaims[i];

        // 1. Validar objeto autoritativo
        if (authValidator) {
            const validAuth = authValidator(auth);
            if (!validAuth) {
                console.error('[SCHEMA ERROR] Claim ' + auth.claim_id + ' viola claim_entry_schema_v1: ' + ajv.errorsText(authValidator.errors));
                schemaValidationErrors++;
            }
        }

        // 2. Validar objeto indexado
        if (indexValidator) {
            const validIndex = indexValidator(c);
            if (!validIndex) {
                console.error('[SCHEMA ERROR] Claim indexado ' + c.claim_id + ' en ' + c.file_source + ' viola claims_index_entry_schema_v1: ' + ajv.errorsText(indexValidator.errors));
                schemaValidationErrors++;
            }
        }

        allClaims.push(c);
    }
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
