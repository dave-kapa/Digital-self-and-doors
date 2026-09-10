/**
 * build_sales_claims_index.js
 * Compila determinísticamente v3/brain/07_commercial_and_gotomarket/sales_claims_index.json
 * a partir de evidence_for_sales.md usando content_parser.js.
 * Soporta modo --check para verificación en CI/Auditoría sin escribir archivos.
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { parseSalesClaimsFile } = require('./lib/content_parser');

const brainDir = path.join(__dirname, '../brain');
const salesFile = path.join(brainDir, '07_commercial_and_gotomarket/evidence_for_sales.md');
const targetIndex = path.join(brainDir, '07_commercial_and_gotomarket/sales_claims_index.json');
const schemaPath = path.join(brainDir, '00_meta_and_governance/schemas/sales_claim_schema_v1.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let salesValidator = null;
if (fs.existsSync(schemaPath)) {
    try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        salesValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar sales_claim_schema_v1.json:', e.message);
    }
}

const { salesClaims, errors } = parseSalesClaimsFile(salesFile);
let parseErrors = 0;
let schemaValidationErrors = 0;

if (errors.length > 0) {
    errors.forEach(err => console.error('[PARSER ERROR] ' + err.file + ': ' + err.message));
    parseErrors += errors.length;
}

salesClaims.forEach(sc => {
    if (salesValidator) {
        const valid = salesValidator(sc);
        if (!valid) {
            console.error('[SCHEMA ERROR] Sales claim ' + sc.sales_claim_id + ' viola sales_claim_schema_v1: ' + ajv.errorsText(salesValidator.errors));
            schemaValidationErrors++;
        }
    }
});

salesClaims.sort((a, b) => a.sales_claim_id.localeCompare(b.sales_claim_id));

const isCheckMode = process.argv.includes('--check');
const formatted = JSON.stringify(salesClaims, null, 2) + '\n';

if (parseErrors > 0 || schemaValidationErrors > 0) {
    console.error('ERROR: Fallos en parsing o validación de sales claims (' + parseErrors + ' parse, ' + schemaValidationErrors + ' schema).');
    process.exit(1);
}

if (isCheckMode) {
    if (fs.existsSync(targetIndex)) {
        const existing = fs.readFileSync(targetIndex, 'utf8');
        if (existing.replace(/\r\n/g, '\n') !== formatted.replace(/\r\n/g, '\n')) {
            console.error('[DRIFT] sales_claims_index.json está desactualizado respecto a evidence_for_sales.md');
            process.exit(1);
        } else {
            console.log('sales_claims_index.json verificado sin drift (' + salesClaims.length + ' sales claims) (PASS --check).');
        }
    } else {
        console.error('[DRIFT] sales_claims_index.json no existe. Ejecuta npm run build:sales');
        process.exit(1);
    }
} else {
    fs.writeFileSync(targetIndex, formatted, 'utf8');
    console.log('sales_claims_index.json generado exitosamente con ' + salesClaims.length + ' sales claims.');
}
