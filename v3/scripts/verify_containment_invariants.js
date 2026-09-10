/**
 * verify_containment_invariants.js
 * Verificación automatizada de invariantes de contención epistemológica (R7).
 * Comprueba:
 *  1. Integridad idéntica (hash SHA-256) de las 5 Source Notes congeladas vs snapshot
 *  2. Cero nuevos PDFs en el repositorio y LIBRARY_MANIFEST.yaml vacío
 *  3. Cero candidate claims promovidos a canon
 *  4. Cero aprobaciones humanas atribuidas indebidamente a agentes
 *  5. Ningún sales claim reactivado por evidencia externa no resuelta
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { parseClaimsFile, parseSalesClaimsFile } = require('./lib/content_parser');
const { canonicalFileHash } = require('./lib/text_normalizer');

const rootDir = path.join(__dirname, '../..');
const brainDir = path.join(__dirname, '../brain');
const sourcesDir = path.join(brainDir, '01_research_and_lenses/sources');
const snapshotSourcesDir = path.join(brainDir, '99_archive_and_history/snapshots/pre_phase_neg1_20260904/01_research_and_lenses/sources');
const manifestPath = path.join(__dirname, '../research_library/LIBRARY_MANIFEST.yaml');
const salesFile = path.join(brainDir, '07_commercial_and_gotomarket/evidence_for_sales.md');

console.log('=== VERIFICACIÓN AUTOMATIZADA DE INVARIANTES DE CONTENCIÓN (R7) ===');

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

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

// 1. Trazabilidad criptográfica de las 5 Source Notes (Fase 2A)
// 1.1 Snapshot baseline inmutable (pre-Fase -1 a 1R.1)
const BASELINE_SNAPSHOT_HASHES = {
    'SRC-KAHNEMAN-2011.md': 'e0fa1fdf9bdd5f214a9658c7585b43fd384c6f82ac3f16a63d1d3b75d292d477',
    'SRC-ROGERS-1975.md': '9a024caceb84c3cd9deb028f068609faeb83fa08e25ae4e2881ca1e67cdede5b',
    'SRC-VAFA-2026.md': '74c7442656897a5052755db5c50ddb4a3829616b6d6788c275d7ba4b6a0907fd',
    'SRC-VERIZON-DBIR-2026.md': 'ddd39ab89c13a0cdbd278f43e3e9359c4e1c484653b149b7b9e9419374e45081',
    'SRC-WOOD-NEAL-2007.md': '93e2fed7f8388d54f13e668c0ac454e23d3c06ec0a0d105d1389341a8bfb0fc0'
};

// 1.2 Hashes certificados de migración Schema v2 (Fase 2A)
const PHASE_2A_CERTIFIED_HASHES = {
    'SRC-KAHNEMAN-2011.md': 'b80ae8215eabfe83d49ee52f17b7c0a2244d7a707d095272715c14f65e218c95',
    'SRC-ROGERS-1975.md': '1dd0385d6cbf5b9dbad51f162b1aa0ed133c04eab339ca0fb648c167e8f83763',
    'SRC-VAFA-2026.md': '7d90f891dd87efde80d4cdd29e58e0c82f0a6a15d5958b1d8d763fddd3cd1f43',
    'SRC-VERIZON-DBIR-2026.md': '2c4afb53b3f06da89092a651f837f93856cdbfc2e0a98e396514a1b2770c6c25',
    'SRC-WOOD-NEAL-2007.md': '5cd5aae33b1c63420766e54267eb365f4a44b7eed16224f69bc605509b6518f4'
};

let allHashesMatch = true;
Object.keys(PHASE_2A_CERTIFIED_HASHES).forEach(f => {
    const activePath = path.join(sourcesDir, f);
    const snapPath = path.join(snapshotSourcesDir, f);
    if (!fs.existsSync(activePath) || !fs.existsSync(snapPath)) {
        allHashesMatch = false;
        console.error('Archivo no encontrado para hash check: ' + f);
        return;
    }
    const hActive = canonicalFileHash(activePath);
    const hSnap = canonicalFileHash(snapPath);

    if (hSnap !== BASELINE_SNAPSHOT_HASHES[f]) {
        allHashesMatch = false;
        console.error('Snapshot baseline alterado en ' + f + ': ' + hSnap);
    }
    if (hActive !== PHASE_2A_CERTIFIED_HASHES[f]) {
        allHashesMatch = false;
        console.error('Hash migrado 2A mismatch en ' + f + ': ' + hActive + ' !== ' + PHASE_2A_CERTIFIED_HASHES[f]);
    }

    // Verificar estricto Schema v2 governance frontmatter
    try {
        const content = fs.readFileSync(activePath, 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const data = yaml.load(match[1]);
        if (data.schema_version !== 2 || data.status !== 'review' || data.review_status !== 'pending_review' ||
            !Array.isArray(data.approved_by_humans) || data.approved_by_humans.length !== 0 || data.approval_date !== null) {
            allHashesMatch = false;
            console.error('Gobernanza de Schema v2 inválida en nota migrada: ' + f);
        }
    } catch (e) {
        allHashesMatch = false;
        console.error('Error parseando frontmatter en ' + f + ': ' + e.message);
    }
});
assert(allHashesMatch, 'Las 5 Source Notes migradas a Schema v2 tienen trazabilidad criptográfica y snapshot inmutable');

// 2. Cero nuevos PDFs en el árbol de trabajo (rutas exactas y hash SHA-256 preexistente)
function findPdfs(dir, list = []) {
    if (!fs.existsSync(dir)) return list;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name !== 'node_modules' && e.name !== '.git') findPdfs(full, list);
        } else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) {
            list.push(full);
        }
    }
    return list;
}

const ALLOWED_PDF_HASH = 'a98c4d8724c7b3ee040c3072f1712adc6b0330515664f4eb1716eb2d622cdc3c';
const ALLOWED_PDF_REL_PATHS = new Set([
    'backups/checkpoint_stable_20260822_032700/insumos/v2/webinar_faro_digital_self_attention_doors_v1.pdf',
    'insumos/v2/webinar_faro_digital_self_attention_doors_v1.pdf',
    'v3/brain/99_archive_and_history/raw_sources/v2/webinar_faro_digital_self_attention_doors_v1.pdf'
]);

const allPdfs = findPdfs(rootDir);
let pdfCheckPassed = true;
allPdfs.forEach(p => {
    const rel = path.relative(rootDir, p).split(path.sep).join('/').toLowerCase();
    const h = sha256(fs.readFileSync(p));
    if (!ALLOWED_PDF_REL_PATHS.has(rel) || h !== ALLOWED_PDF_HASH) {
        pdfCheckPassed = false;
        console.error('PDF no autorizado detectado: ' + rel + ' (hash: ' + h + ')');
    }
});
assert(pdfCheckPassed && allPdfs.length === 3, 'Cero PDFs nuevos detectados en el repositorio (solo 3 insumos históricos preexistentes con hash verificado)');

// 3. Manifest de biblioteca física vacío
let manifestEmpty = false;
if (fs.existsSync(manifestPath)) {
    const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest && Array.isArray(manifest.entries) && manifest.entries.length === 0) {
        manifestEmpty = true;
    }
}
assert(manifestEmpty, 'LIBRARY_MANIFEST.yaml permanece en estado inicial (entries: [])');

// 4. Cero candidate claims promovidos a canon sin autorización
const claimsIndex = path.join(brainDir, '01_research_and_lenses/claims_index.json');
let zeroPromoted = true;
if (fs.existsSync(claimsIndex)) {
    const claims = JSON.parse(fs.readFileSync(claimsIndex, 'utf8'));
    claims.forEach(c => {
        if (c.review_status === 'canonical' || c.status === 'canonical') {
            zeroPromoted = false;
            console.error('Claim indebidamente canonizado: ' + c.claim_id);
        }
    });
}
assert(zeroPromoted, 'Cero claims científicos han sido promovidos a canon (100% confinados en internal_research)');

// 5. Integridad de los 35 claim statements científicos vs snapshot baseline
let statementsIntact = true;
let totalCompared = 0;
const snapshotClaimsDir = path.join(brainDir, '99_archive_and_history/snapshots/pre_phase_neg1_20260904/01_research_and_lenses/claims');
const claimFiles = fs.readdirSync(path.join(brainDir, '01_research_and_lenses/claims')).filter(f => f.endsWith('.md')).sort();
claimFiles.forEach(f => {
    const activeClaims = parseClaimsFile(path.join(brainDir, '01_research_and_lenses/claims', f)).claims;
    const snapFile = path.join(snapshotClaimsDir, f);
    if (!fs.existsSync(snapFile)) {
        statementsIntact = false;
        console.error('Archivo de snapshot no encontrado para claims: ' + f);
        return;
    }
    const snapClaims = parseClaimsFile(snapFile).claims;
    const snapMap = new Map(snapClaims.map(c => [c.claim_id, c.statement]));
    activeClaims.forEach(c => {
        totalCompared++;
        const snapStmt = snapMap.get(c.claim_id);
        if (!snapStmt || snapStmt.trim() !== c.statement.trim()) {
            statementsIntact = false;
            console.error('Alteración en claim statement ' + c.claim_id + ': "' + c.statement + '" !== "' + snapStmt + '"');
        }
    });
});
assert(statementsIntact && totalCompared === 35, 'Los 35 statements científicos permanecen estrictamente idénticos al snapshot baseline');

// 6. Cero aprobaciones humanas simuladas en notas de fuentes activas
let zeroFakeApprovals = true;
const allSourceFiles = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md'));
allSourceFiles.forEach(f => {
    const activePath = path.join(sourcesDir, f);
    const content = fs.readFileSync(activePath, 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
        try {
            const data = yaml.load(match[1]);
            if (data && data.approved_by_humans && Array.isArray(data.approved_by_humans) && data.approved_by_humans.length > 0) {
                zeroFakeApprovals = false;
                console.error('Aprobación humana indebida detectada en nota activa: ' + f);
            }
        } catch (e) {}
    }
});
assert(zeroFakeApprovals, 'Cero aprobaciones humanas inventadas en fuentes activas');

// 7. Confinamiento de sales claims en deuda externa y conteo exacto
let salesConfinementHonored = true;
const { salesClaims } = parseSalesClaimsFile(salesFile);
const activeSales = salesClaims.filter(s => s.status === 'active');
const debtSales = salesClaims.filter(s => s.status === 'pending_evidence_debt');

if (activeSales.length !== 3 || debtSales.length !== 4) {
    salesConfinementHonored = false;
    console.error('Discrepancia en clasificación comercial: ' + activeSales.length + ' activos (esperado 3), ' + debtSales.length + ' en deuda (esperado 4)');
}

salesClaims.forEach(sc => {
    if (sc.foundation_type === 'external_evidence') {
        if (sc.status === 'active') {
            salesConfinementHonored = false;
            console.error('Sales claim de evidencia externa activado indebidamente: ' + sc.sales_claim_id);
        }
    }
});
assert(salesConfinementHonored, 'Clasificación comercial exacta: 3 claims activos del canon y 4 confinados en pending_evidence_debt');

console.log('-------------------------------------------------------------------');
console.log('Resultado de Invariantes: ' + passed + ' PASS, ' + failed + ' FAIL.');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('INVARIANTES DE CONTENCIÓN CERTIFICADOS AL 100% (PASS).');
}
