/**
 * content_parser.js
 * Módulo unificado de extracción determinística y validación de gramática Markdown
 * para Claims Científicos, Sales Claims y Candidate Claims (Fase 2B / R2B-04).
 * Flujo unidireccional y fail-closed:
 * Markdown autoritativo -> Parser estricto (sin defaults inventados) -> Objeto verificado.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

function parseNullableString(rawStr) {
    if (!rawStr) return null;
    let clean = rawStr.trim();
    clean = clean.replace(/^`|`$/g, '').trim();
    if (clean === '' || clean.toLowerCase() === 'null' || clean.toLowerCase() === 'none') {
        return null;
    }
    return clean;
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
    'review_by',
    'derived_from_candidates'
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
 * Separa el objeto autoritativo (sin file_source ni title) del enriquecido del índice (R2B-04).
 */
function parseClaimsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/\r\n/g, '\n');
    const sections = cleanContent.split(/(?=^##\s+CLAIM-[A-Z0-9-]+)/m);
    const claims = [];
    const authoritativeClaims = [];
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

        // Parsear supported_by honestamente
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

        // Objeto Enriquecido para claims_index.json con el orden exacto histórico
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
        if (fields['derived_from_candidates']) {
            claimObj.derived_from_candidates = parseArrayField(fields['derived_from_candidates']);
        }

        // Objeto Autoritativo puro (16 propiedades, sin file_source ni title)
        const authoritativeClaim = {
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
            last_verified
        };

        if (topics.length > 0) authoritativeClaim.topics = topics;
        if (evidenced_by.length > 0) authoritativeClaim.evidenced_by = evidenced_by;
        if (grounded_in.length > 0) authoritativeClaim.grounded_in = grounded_in;
        if (fields['next_review'] || fields['review_by']) {
            authoritativeClaim.next_review = (fields['next_review'] || fields['review_by']).trim();
        }
        if (fields['derived_from_candidates']) {
            authoritativeClaim.derived_from_candidates = parseArrayField(fields['derived_from_candidates']);
        }

        claims.push(claimObj);
        authoritativeClaims.push(authoritativeClaim);
    });

    return { claims, authoritativeClaims, errors };
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

// -------------------------------------------------------------
// CANDIDATE CLAIMS PARSER (Fase 2B / R2B-03, R2B-04)
// -------------------------------------------------------------

const CANDIDATE_WHITELIST = new Set([
    'statement',
    'proposed_epistemic_status',
    'proposed_confidence',
    'scope',
    'promotion_target',
    'reading_basis',
    'evidence_locator',
    'triage_status',
    'target_claim_id',
    'decision_reason',
    'decided_by_humans',
    'decision_date'
]);

const CANDIDATE_REQUIRED_FIELDS = [
    'statement',
    'proposed_epistemic_status',
    'proposed_confidence',
    'scope',
    'promotion_target',
    'reading_basis',
    'triage_status',
    'decided_by_humans'
];

const MATRIX_FILE_TO_ID = {
    'claims_attention_decision.md': 'CLM-MATRIX-ATT-DEC',
    'claims_games_gamification.md': 'CLM-MATRIX-GAMES',
    'claims_genai_social_engineering.md': 'CLM-MATRIX-GENAI-SE',
    'claims_human_ai.md': 'CLM-MATRIX-HUMAN-AI',
    'claims_human_factor.md': 'CLM-MATRIX-HF',
    'claims_training_learning.md': 'CLM-MATRIX-TRAINING'
};

/**
 * Parsea la Sección 9 de una Source Note (*.md) y extrae los candidate claims.
 */
function parseCandidateClaimsFromSourceNote(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/\r\n/g, '\n');
    const fileName = path.basename(filePath);
    const errors = [];
    const candidates = [];

    // Extraer frontmatter
    let frontmatter = null;
    const fmM = cleanContent.match(/^---\n([\s\S]*?)\n---/);
    if (fmM) {
        try {
            frontmatter = yaml.load(fmM[1]);
        } catch (e) {
            errors.push({ file: filePath, message: 'Frontmatter YAML inválido: ' + e.message });
        }
    } else {
        errors.push({ file: filePath, message: 'Source Note carece de frontmatter YAML' });
    }

    const sourceId = frontmatter ? frontmatter.id : null;
    const noteReadingStatus = frontmatter ? frontmatter.reading_status : null;

    // Buscar Sección 9
    const sec9Parts = cleanContent.split(/(?=^#\s+9\.\s+Candidate claims proposed)/m);
    if (sec9Parts.length < 2) {
        return { candidates, errors };
    }

    const sec9Content = sec9Parts[1];
    const candidateBlocks = sec9Content.split(/(?=^##\s+CAND-[A-Z0-9-]+-[0-9]{3})/m);
    const seenCandidateIds = new Set();

    candidateBlocks.forEach((block, idx) => {
        if (!block.trim().startsWith('## CAND-')) return;

        const headerMatch = block.match(/^##\s+(CAND-[A-Z0-9-]+-[0-9]{3})/m);
        if (!headerMatch) {
            errors.push({ file: filePath, message: 'Encabezado de candidate claim malformado en bloque ' + (idx + 1) });
            return;
        }

        const candidateId = headerMatch[1];
        if (seenCandidateIds.has(candidateId)) {
            errors.push({ file: filePath, candidateId, message: 'ID de candidato duplicado en nota: ' + candidateId });
        }
        seenCandidateIds.add(candidateId);

        const { fields, duplicateKeys } = parseFieldBlocks(block);

        duplicateKeys.forEach(dk => {
            errors.push({ file: filePath, candidateId, message: 'Campo duplicado en candidato: ' + dk });
        });

        // Whitelist
        Object.keys(fields).forEach(k => {
            if (!CANDIDATE_WHITELIST.has(k)) {
                errors.push({ file: filePath, candidateId, message: 'Campo desconocido no permitido en candidato: ' + k });
            }
        });

        // Campos obligatorios
        CANDIDATE_REQUIRED_FIELDS.forEach(rf => {
            if (fields[rf] === undefined || fields[rf] === null || (typeof fields[rf] === 'string' && fields[rf].trim() === '')) {
                errors.push({ file: filePath, candidateId, message: 'Campo obligatorio ausente en candidato: ' + rf });
            }
        });

        const statement = fields['statement'] ? fields['statement'].trim() : '';
        if (statement.length < 10) {
            errors.push({ file: filePath, candidateId, message: 'Statement de candidato debe tener al menos 10 caracteres' });
        }

        const promotionTargetRaw = fields['promotion_target'] ? fields['promotion_target'].trim() : '';
        const cleanTargetFile = promotionTargetRaw.replace(/^\`|\`$/g, '').trim();
        const matrixId = MATRIX_FILE_TO_ID[cleanTargetFile];
        if (!matrixId) {
            errors.push({ file: filePath, candidateId, message: 'Promotion target apunta a archivo de matriz inexistente o no autorizado: ' + cleanTargetFile });
        }

        const readingBasis = fields['reading_basis'] ? fields['reading_basis'].trim() : '';
        if (readingBasis === 'full_text_reviewed' && noteReadingStatus !== 'full_text_reviewed') {
            errors.push({
                file: filePath,
                candidateId,
                message: 'Candidato declara reading_basis: full_text_reviewed pero la Source Note tiene reading_status: ' + noteReadingStatus
            });
        }

        const triageStatus = fields['triage_status'] ? fields['triage_status'].trim() : 'pending';
        const targetClaimId = parseNullableString(fields['target_claim_id']);
        const decisionReason = parseNullableString(fields['decision_reason']);
        const rawDecided = fields['decided_by_humans'] || '[]';
        const decidedByHumans = parseArrayField(rawDecided);
        const decisionDate = parseNullableString(fields['decision_date']);
        const evidenceLocator = parseNullableString(fields['evidence_locator']);

        const candObj = {
            candidate_id: candidateId,
            source_id: sourceId,
            file_source: fileName,
            statement,
            proposed_epistemic_status: fields['proposed_epistemic_status'] || '',
            proposed_confidence: fields['proposed_confidence'] || '',
            scope: fields['scope'] ? fields['scope'].trim() : '',
            promotion_target: promotionTargetRaw,
            proposed_target_file: cleanTargetFile,
            proposed_target_matrix_id: matrixId || 'UNKNOWN',
            reading_basis: readingBasis,
            evidence_locator: evidenceLocator,
            triage_status: triageStatus,
            target_claim_id: targetClaimId,
            decision_reason: decisionReason,
            decided_by_humans: decidedByHumans,
            decision_date: decisionDate
        };

        candidates.push(candObj);
    });

    return { candidates, errors };
}

module.exports = {
    parseClaimsFile,
    parseSalesClaimsFile,
    parseCandidateClaimsFromSourceNote,
    parseArrayField,
    parseCleanString,
    parseNullableString,
    MATRIX_FILE_TO_ID
};
