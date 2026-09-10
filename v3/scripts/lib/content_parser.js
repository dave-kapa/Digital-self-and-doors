/**
 * content_parser.js
 * Módulo unificado de extracción determinística y validación de gramática Markdown
 * para Claims Científicos y Sales Claims (Fase 1R.1 / B1R).
 * Flujo unidireccional y fail-closed:
 * Markdown autoritativo -> Parser estricto (sin defaults inventados) -> Objeto verificado.
 */

const fs = require('fs');
const path = require('path');

function parseArrayField(rawStr) {
    if (!rawStr) return [];
    let clean = rawStr.trim();
    if (clean.startsWith('[') && clean.endsWith(']')) {
        clean = clean.slice(1, -1).trim();
    }
    if (!clean) return [];
    return clean.split(',').map(s => s.replace(/[`'"]/g, '').trim()).filter(Boolean);
}

function parseCleanString(rawStr) {
    if (!rawStr) return '';
    return rawStr.replace(/^[«"']|[»"']$/g, '').trim();
}

/**
 * Parsea bloques Markdown respetando campos de texto multilínea hasta el siguiente campo **Key:** o encabezado ##.
 */
function parseFieldBlocks(text) {
    const lines = text.split(/\r?\n/);
    const fields = {};
    const seenRawKeys = new Set();
    const duplicateKeys = [];
    let currentKey = null;
    let currentBuffer = [];

    function flushCurrent() {
        if (currentKey) {
            const val = currentBuffer.join('\n').trim();
            fields[currentKey] = val;
            currentKey = null;
            currentBuffer = [];
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^\*\*([A-Za-z0-9 _&-]+):\*\*(?:\s*(.*))?$/);
        if (match) {
            flushCurrent();
            const rawKey = match[1].trim();
            const initialVal = match[2] !== undefined ? match[2].trim() : '';
            const normalizedKey = rawKey.toLowerCase().replace(/\s+/g, '_');

            if (seenRawKeys.has(normalizedKey)) {
                duplicateKeys.push(normalizedKey);
            }
            seenRawKeys.add(normalizedKey);
            currentKey = normalizedKey;
            if (initialVal) {
                currentBuffer.push(initialVal);
            }
        } else {
            if (currentKey) {
                if (line.trim().startsWith('##') || line.trim() === '---') {
                    flushCurrent();
                } else {
                    currentBuffer.push(line.trim());
                }
            }
        }
    }
    flushCurrent();

    return { fields, duplicateKeys };
}

// Whitelist y campos obligatorios de Claims
const CLAIM_WHITELIST = new Set([
    'claim_statement',
    'statement',
    'epistemic_status',
    'evidence_status',
    'review_status',
    'confidence',
    'scope',
    'supported_by',
    'sources',
    'evidenced_by',
    'grounded_in',
    'allowed_uses',
    'topics',
    'limitations',
    'limitations_&_what_it_does_not_say',
    'last_verified',
    'next_review',
    'review_by'
]);

const CLAIM_REQUIRED_FIELDS = [
    'epistemic_status',
    'evidence_status',
    'review_status',
    'confidence',
    'scope',
    'supported_by',
    'allowed_uses',
    'last_verified'
];

/**
 * Parsea un archivo de claims (*.md) y extrae cada CLAIM como objeto bajo gramática estricta (fail-closed).
 */
function parseClaimsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/\r\n/g, '\n');
    const sections = cleanContent.split(/(?=^##\s+CLAIM-[A-Z0-9-]+)/m);
    const claims = [];
    const errors = [];
    const seenClaimIds = new Set();

    sections.forEach((sec, idx) => {
        if (!sec.trim().startsWith('## CLAIM-')) return;

        const headerMatch = sec.match(/^##\s+(CLAIM-[A-Z0-9-]+)(?:\s*(?:—|-)\s*(.*))?/m);
        if (!headerMatch) {
            errors.push({ file: filePath, message: 'Encabezado de claim malformado en sección ' + (idx + 1) });
            return;
        }

        const claimId = headerMatch[1];
        const claimTitle = headerMatch[2] ? headerMatch[2].trim() : '';

        // Detección de duplicación de ID de claim
        if (seenClaimIds.has(claimId)) {
            errors.push({ file: filePath, claimId, message: 'ID de claim duplicado en archivo: ' + claimId });
        }
        seenClaimIds.add(claimId);

        const { fields, duplicateKeys } = parseFieldBlocks(sec);

        duplicateKeys.forEach(dk => {
            errors.push({ file: filePath, claimId, message: 'Campo duplicado: ' + dk });
        });

        // Validar campos desconocidos contra whitelist
        Object.keys(fields).forEach(k => {
            if (!CLAIM_WHITELIST.has(k)) {
                errors.push({ file: filePath, claimId, message: 'Campo desconocido no permitido en claim: ' + k });
            }
        });

        // Validar statement obligatorio
        const statement = fields['claim_statement'] || fields['statement'] || '';
        if (!statement || statement.trim() === '') {
            errors.push({ file: filePath, claimId, message: 'Claim carece de statement obligatorio' });
        }

        // Validar limitaciones obligatorias
        const limitations = fields['limitations_&_what_it_does_not_say'] || fields['limitations'] || '';
        if (!limitations || limitations.trim() === '') {
            errors.push({ file: filePath, claimId, message: 'Campo obligatorio ausente o vacío en claim: limitations' });
        }

        // Validar presencia de todos los campos obligatorios
        CLAIM_REQUIRED_FIELDS.forEach(rf => {
            if (!fields[rf] || fields[rf].trim() === '') {
                errors.push({ file: filePath, claimId, message: 'Campo obligatorio ausente o vacío en claim: ' + rf });
            }
        });

        // Parsear supported_by honestamente (sin inventar direct_support si no se declara)
        const rawSupported = fields['supported_by'] || fields['sources'] || '[]';
        const supportedSources = parseArrayField(rawSupported);
        const supported_by = supportedSources.map(src => ({
            source_id: src,
            relation: 'unspecified_legacy'
        }));

        // Parsear evidenced_by si existe
        const rawEvidenced = fields['evidenced_by'] || '[]';
        const evidenced_by = parseArrayField(rawEvidenced).map(ev => ({
            evidence_id: ev,
            relation: 'preliminary_signal'
        }));

        // Parsear grounded_in si existe
        const rawGrounded = fields['grounded_in'] || '[]';
        const grounded_in = parseArrayField(rawGrounded);

        // Allowed uses
        const rawAllowed = fields['allowed_uses'] || '[]';
        const allowed_uses = parseArrayField(rawAllowed);
        if (allowed_uses.length === 0) {
            errors.push({ file: filePath, claimId, message: 'allowed_uses no puede estar vacío' });
        }

        // Preservar scope
        const scope = fields['scope'] ? fields['scope'].trim() : '';

        // Fechas
        const last_verified = fields['last_verified'] ? fields['last_verified'].trim() : '';
        if (last_verified && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(last_verified)) {
            errors.push({ file: filePath, claimId, message: 'last_verified tiene formato de fecha inválido: ' + last_verified });
        }

        // Topics opcionales
        const topics = parseArrayField(fields['topics'] || '[]');

        const claimObj = {
            claim_id: claimId,
            statement: statement.trim(),
            epistemic_status: fields['epistemic_status'] || '',
            evidence_status: fields['evidence_status'] || '',
            review_status: fields['review_status'] || '',
            confidence: fields['confidence'] || '',
            scope,
            limitations: limitations.trim(),
            allowed_uses,
            supported_by,
            last_verified,
            file_source: path.basename(filePath)
        };

        if (claimTitle) claimObj.title = claimTitle;
        if (topics.length > 0) claimObj.topics = topics;
        if (evidenced_by.length > 0) claimObj.evidenced_by = evidenced_by;
        if (grounded_in.length > 0) claimObj.grounded_in = grounded_in;
        if (fields['next_review'] || fields['review_by']) {
            claimObj.next_review = (fields['next_review'] || fields['review_by']).trim();
        }

        claims.push(claimObj);
    });

    return { claims, errors };
}

// Whitelist y campos obligatorios de Sales Claims
const SALES_WHITELIST = new Set([
    'foundation_type',
    'status',
    'approved_wording',
    'sources',
    'valid_from',
    'review_by',
    'permitted_contexts',
    'do_not_say'
]);

const SALES_REQUIRED_FIELDS = [
    'foundation_type',
    'status',
    'approved_wording',
    'sources',
    'valid_from',
    'review_by',
    'permitted_contexts',
    'do_not_say'
];

/**
 * Parsea el banco de sales claims (evidence_for_sales.md) bajo gramática estricta (fail-closed).
 */
function parseSalesClaimsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/\r\n/g, '\n');
    const sections = cleanContent.split(/(?=^##\s+SALES-CLAIM-[0-9]{3})/m);
    const salesClaims = [];
    const errors = [];
    const seenSalesIds = new Set();

    sections.forEach((sec, idx) => {
        if (!sec.trim().startsWith('## SALES-CLAIM-')) return;

        const headerMatch = sec.match(/^##\s+(SALES-CLAIM-[0-9]{3})(?:\s*(?:—|-)\s*(.*))?/m);
        if (!headerMatch) {
            errors.push({ file: filePath, message: 'Encabezado de sales claim malformado en sección ' + (idx + 1) });
            return;
        }

        const scId = headerMatch[1];
        const scTitle = headerMatch[2] ? headerMatch[2].trim() : '';

        // Detección de duplicación de ID de sales claim
        if (seenSalesIds.has(scId)) {
            errors.push({ file: filePath, scId, message: 'ID de sales claim duplicado en archivo: ' + scId });
        }
        seenSalesIds.add(scId);

        const { fields, duplicateKeys } = parseFieldBlocks(sec);

        duplicateKeys.forEach(dk => {
            errors.push({ file: filePath, scId, message: 'Campo duplicado: ' + dk });
        });

        // Validar campos desconocidos contra whitelist
        Object.keys(fields).forEach(k => {
            if (!SALES_WHITELIST.has(k)) {
                errors.push({ file: filePath, scId, message: 'Campo desconocido no permitido en sales claim: ' + k });
            }
        });

        // Validar presencia de todos los campos obligatorios
        SALES_REQUIRED_FIELDS.forEach(rf => {
            if (!fields[rf] || fields[rf].trim() === '') {
                errors.push({ file: filePath, scId, message: 'Campo obligatorio ausente o vacío en sales claim: ' + rf });
            }
        });

        const rawStatus = fields['status'] || '';
        const statusMatch = rawStatus.match(/^(?:\`|')?([a-z_]+)(?:\`|')?/);
        const status = statusMatch ? statusMatch[1] : '';

        const rawFoundation = fields['foundation_type'] || '';
        const foundationMatch = rawFoundation.match(/^(?:\`|')?([a-z_]+)(?:\`|')?/);
        const foundation_type = foundationMatch ? foundationMatch[1] : '';

        const sources = parseArrayField(fields['sources'] || '[]');
        const do_not_say = fields['do_not_say'] ? [parseCleanString(fields['do_not_say'])] : [];
        const commercial_tier_allowed = fields['permitted_contexts'] ? [fields['permitted_contexts']] : [];

        const authorized_statement = parseCleanString(fields['approved_wording'] || '');
        if (!authorized_statement) {
            errors.push({ file: filePath, scId, message: 'Sales claim carece de approved_wording obligatorio' });
        }

        const scObj = {
            sales_claim_id: scId,
            title: scTitle,
            foundation_type,
            claim_refs: sources,
            authorized_statement,
            status,
            commercial_tier_allowed,
            do_not_say,
            valid_from: fields['valid_from'] || '',
            review_by: fields['review_by'] || ''
        };

        salesClaims.push(scObj);
    });

    return { salesClaims, errors };
}

module.exports = {
    parseClaimsFile,
    parseSalesClaimsFile,
    parseArrayField,
    parseCleanString
};
