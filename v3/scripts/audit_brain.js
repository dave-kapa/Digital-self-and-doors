/**
 * audit_brain.js
 * Auditoría Integral del Cerebro V3 (Fase 1R Reconciliada).
 * Integra parser formal js-yaml, validadores Ajv para Source Notes v2, Claims v1 y Sales Claims v1,
 * routing cerrado de versiones con inventario legacy explícito,
 * comprobación de taxonomía, confinamiento comercial estricto y firewall de archivo.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { parseClaimsFile, parseSalesClaimsFile, parseCandidateClaimsFromSourceNote } = require('./lib/content_parser');

const brainDirArg = process.argv.find(a => a.startsWith('--brain-dir='));
const brainDir = brainDirArg ? path.resolve(brainDirArg.split('=')[1]) : path.join(__dirname, '../brain');
const rootDir = path.join(__dirname, '../..');
const mode = process.argv.includes('--mode=strict') ? 'strict' : 'migration';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Inventario de Source Notes legacy (R1) - Cerrado en Fase 2A (todas migradas a Schema v2)
const LEGACY_SOURCE_NOTES = new Set();

// Cargar Schemas JSON
const defaultSchemasDir = path.join(__dirname, '../brain/00_meta_and_governance/schemas');
const schemasDir = fs.existsSync(path.join(brainDir, '00_meta_and_governance/schemas'))
    ? path.join(brainDir, '00_meta_and_governance/schemas')
    : defaultSchemasDir;

let sourceSchemaValidator = null;
let claimSchemaValidator = null;
let claimIndexSchemaValidator = null;
let salesSchemaValidator = null;
let candidateValidator = null;
let topicMappingValidator = null;

if (fs.existsSync(path.join(schemasDir, 'source_note_schema_v2.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'source_note_schema_v2.json'), 'utf8'));
        sourceSchemaValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar source_note_schema_v2.json:', e.message);
    }
}

if (fs.existsSync(path.join(schemasDir, 'claim_entry_schema_v1.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claim_entry_schema_v1.json'), 'utf8'));
        claimSchemaValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar claim_entry_schema_v1.json:', e.message);
    }
}

if (fs.existsSync(path.join(schemasDir, 'claims_index_entry_schema_v1.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claims_index_entry_schema_v1.json'), 'utf8'));
        claimIndexSchemaValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar claims_index_entry_schema_v1.json:', e.message);
    }
}

if (fs.existsSync(path.join(schemasDir, 'sales_claim_schema_v1.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'sales_claim_schema_v1.json'), 'utf8'));
        salesSchemaValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar sales_claim_schema_v1.json:', e.message);
    }
}

if (fs.existsSync(path.join(schemasDir, 'candidate_claim_schema_v1.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'candidate_claim_schema_v1.json'), 'utf8'));
        candidateValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar candidate_claim_schema_v1.json:', e.message);
    }
}

if (fs.existsSync(path.join(schemasDir, 'topic_mapping_schema_v1.json'))) {
    try {
        const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'topic_mapping_schema_v1.json'), 'utf8'));
        topicMappingValidator = ajv.compile(schema);
    } catch (e) {
        console.warn('[WARN] No se pudo compilar topic_mapping_schema_v1.json:', e.message);
    }
}

// B3R Governance: Anti-Placeholder & Anti-Agent
const DISALLOWED_HUMAN_IDENTIFIERS = new Set([
    'antigravity', 'chatgpt', 'copilot', 'assistant', 'agent', 'claude', 'gemini',
    'librarian_agent', 'librarian', 'system', 'auto', 'bot',
    'tbd', 'todo', 'pending', 'human_approver', 'approver', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined',
    'fixture_user', 'fixture_human', 'test_user', 'fake_user'
]);

function isValidHumanName(name) {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    const lower = trimmed.toLowerCase();
    if (DISALLOWED_HUMAN_IDENTIFIERS.has(lower)) return false;
    if (lower.startsWith('fixture_') || lower.startsWith('test_') || lower.startsWith('mock_')) return false;
    return true;
}

// Cargar taxonomía controlada
const defaultTaxonomyPath = path.join(__dirname, '../brain/01_research_and_lenses/librarian/RESEARCH_TAXONOMY.md');
const taxonomyPath = fs.existsSync(path.join(brainDir, '01_research_and_lenses/librarian/RESEARCH_TAXONOMY.md'))
    ? path.join(brainDir, '01_research_and_lenses/librarian/RESEARCH_TAXONOMY.md')
    : defaultTaxonomyPath;

const allowedTopics = new Set();
if (fs.existsSync(taxonomyPath)) {
    const taxContent = fs.readFileSync(taxonomyPath, 'utf8');
    const matches = taxContent.matchAll(/`([a-z0-9_-]+)`/g);
    for (const m of matches) {
        allowedTopics.add(m[1]);
    }
}

const BLOCKLIST = [
    { term: 'el eslabón más débil', reason: 'Culpabilización del usuario / vicio de awareness tradicional' },
    { term: 'el eslabon mas debil', reason: 'Culpabilización del usuario' },
    { term: 'vulnerabilidad humana', reason: 'Falsa medicalización de prioridades atencionales' },
    { term: 'tu puerta es', reason: 'Atribución psicométrica o etiqueta de personalidad fija' },
    { term: 'diagnóstico de puertas', reason: 'Falsa escala psicométrica' },
    { term: 'garantiza reducción de incidentes', reason: 'Claim comercial sobreescalado no demostrado' }
];

function scanFiles(dir, list = []) {
    if (!fs.existsSync(dir)) return list;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            scanFiles(full, list);
        } else if (e.isFile() && e.name.endsWith('.md')) {
            list.push(full);
        }
    }
    return list;
}

const files = scanFiles(brainDir);
let errors = 0;
let warnings = 0;
// Cargar deuda de evidencia oficial (separando deuda activa de backlog)
const debtIndexPath = fs.existsSync(path.join(brainDir, '01_research_and_lenses/librarian/evidence_debt_index.json'))
    ? path.join(brainDir, '01_research_and_lenses/librarian/evidence_debt_index.json')
    : path.join(__dirname, '../brain/01_research_and_lenses/librarian/evidence_debt_index.json');
const debtPath = fs.existsSync(path.join(brainDir, '01_research_and_lenses/librarian/EVIDENCE_DEBT.md'))
    ? path.join(brainDir, '01_research_and_lenses/librarian/EVIDENCE_DEBT.md')
    : path.join(__dirname, '../brain/01_research_and_lenses/librarian/EVIDENCE_DEBT.md');

const activeDebtSources = new Set();
const backlogSources = new Set();

if (fs.existsSync(debtIndexPath)) {
    try {
        const dIdx = JSON.parse(fs.readFileSync(debtIndexPath, 'utf8'));
        (dIdx.cited_external_unresolved_debt || []).forEach(id => activeDebtSources.add(id));
        (dIdx.internal_references_to_decouple || []).forEach(id => activeDebtSources.add(id));
        if (dIdx.research_backlog) {
            (dIdx.research_backlog.backlog_ids || []).forEach(id => backlogSources.add(id));
            (dIdx.research_backlog.provisional_slugs || []).forEach(id => backlogSources.add(id));
        }
    } catch (e) {}
} else if (fs.existsSync(debtPath)) {
    const dContent = fs.readFileSync(debtPath, 'utf8');
    const sec5 = dContent.split('## 5. Deuda Externa Activa')[1];
    if (sec5) {
        const parts = sec5.split('## 6. Backlog');
        const activePart = parts[0];
        const mActive = activePart.match(/SRC-[A-Z0-9-]+/g);
        if (mActive) mActive.forEach(m => activeDebtSources.add(m));

        if (parts[1]) {
            const mBack = parts[1].match(/(?:BACKLOG|SRC)-[A-Z0-9-]+/g);
            if (mBack) mBack.forEach(m => backlogSources.add(m));
        }
    }
}

const idRegistry = new Map();
const knownSources = new Set();
const claimStatusMap = new Map();
const allActiveIds = new Set();

console.log('--- AUDITORÍA INTEGRAL DEL CEREBRO (audit_brain.js - Fase 1R.1) ---');
console.log('Modo de ejecución: ' + mode.toUpperCase());
console.log('Archivos examinados: ' + files.length);

// Pase 1: Identidades y D001 / D010
files.forEach(file => {
    const rel = path.relative(brainDir, file).split(path.sep).join('/');
    if (rel.startsWith('99_archive_and_history')) return;

    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
        try {
            const data = yaml.load(match[1]);
            if (data && data.id) {
                if (idRegistry.has(data.id)) {
                    console.error('[FAIL D001] ID duplicado: ' + data.id + ' en ' + rel + ' y ' + idRegistry.get(data.id));
                    errors++;
                } else {
                    idRegistry.set(data.id, rel);
                    allActiveIds.add(data.id);
                }
                if (data.type === 'source' || data.id.startsWith('SRC-')) {
                    knownSources.add(data.id);
                }
            }
        } catch (e) {
            console.error('[FAIL D010] Error de sintaxis YAML en ' + rel + ': ' + e.message);
            errors++;
        }
    }
});

// Indexar candidate claims en allActiveIds
const allParsedCandidates = new Map();
const allCandidateIdsGlobal = new Set();
files.forEach(file => {
    const rel = path.relative(brainDir, file).split(path.sep).join('/');
    if (rel.startsWith('01_research_and_lenses/sources/') && file.endsWith('.md')) {
        const { candidates } = parseCandidateClaimsFromSourceNote(file);
        candidates.forEach(cand => {
            if (allCandidateIdsGlobal.has(cand.candidate_id)) {
                console.error('[FAIL D001] Candidate ID colisiona globalmente entre notas: ' + cand.candidate_id);
                errors++;
            }
            allCandidateIdsGlobal.add(cand.candidate_id);
            allParsedCandidates.set(cand.candidate_id, cand);
        });
    }
});

// Indexar claims científicos y sales claims en allActiveIds para resolución universal
files.forEach(file => {
    const rel = path.relative(brainDir, file).split(path.sep).join('/');
    if (rel.startsWith('99_archive_and_history')) return;

    if (rel.startsWith('01_research_and_lenses/claims/')) {
        const { claims } = parseClaimsFile(file);
        claims.forEach(c => {
            if (allActiveIds.has(c.claim_id)) {
                console.error('[FAIL D001] ID duplicado de claim: ' + c.claim_id + ' en ' + rel);
                errors++;
            } else {
                allActiveIds.add(c.claim_id);
                claimStatusMap.set(c.claim_id, c.review_status);
            }
        });
    }
    if (rel.includes('evidence_for_sales.md')) {
        const { salesClaims } = parseSalesClaimsFile(file);
        salesClaims.forEach(sc => {
            if (allActiveIds.has(sc.sales_claim_id)) {
                console.error('[FAIL D001] ID duplicado de sales claim: ' + sc.sales_claim_id + ' en ' + rel);
                errors++;
            } else {
                allActiveIds.add(sc.sales_claim_id);
            }
        });
    }
});

// Pase 2: Integridad, Links, Términos, Schemas y Confinamiento
files.forEach(file => {
    const rel = path.relative(brainDir, file).split(path.sep).join('/');
    const content = fs.readFileSync(file, 'utf8');

    if (!rel.startsWith('99_archive_and_history')) {
        // D040: Firewall de archivo histórico (Falla si documento activo enlaza a archive como fuente)
        if (content.includes('99_archive_and_history') && 
            !rel.endsWith('README.md') && 
            !rel.endsWith('agent_operating_rules.md') && 
            !rel.endsWith('INDEX.md') && 
            !rel.endsWith('GUIA_HUMANA_DEL_CEREBRO_V3.md') && 
            !rel.includes('audit_reports/')) {
            console.error('[FAIL D040] ' + rel + ' contiene referencias a 99_archive_and_history como fuente activa');
            errors++;
        }

        // D041: Rutas legacy externas fuera de /v3/
        if (!rel.includes('audit_reports/')) {
            if (content.includes('../../insumos/') || content.includes('../../docs/')) {
                console.error('[FAIL D041] ' + rel + ' contiene enlaces a rutas legacy fuera de /v3/');
                errors++;
            }
        }

        // D080: Blocklist de terminología viciada
        const isExemptFile = rel.includes('GLOSARIO_CANONICO.md') || 
                             rel.includes('terminology_rules.md') || 
                             rel.includes('decision_log/') ||
                             rel.includes('GUIA_HUMANA_DEL_CEREBRO_V3.md') ||
                             rel.includes('audit_reports/');

        if (!isExemptFile) {
            const lines = content.split(/\r?\n/);
            lines.forEach((line, lineIdx) => {
                BLOCKLIST.forEach(b => {
                    const regex = new RegExp(b.term, 'gi');
                    if (regex.test(line)) {
                        const isRejectionContext = /(no demuestra|no prueba|no autoriza|no afirma|no describe|no usar|rechaza|prohibid|no como|what.*does not support|❌|nunca decir|evitar|falsa|no son|no es)/i.test(line);
                        if (!isRejectionContext) {
                            console.error('[FAIL D080] ' + rel + ':' + (lineIdx + 1) + ' contiene término prohibido: "' + b.term + '" (' + b.reason + ')');
                            errors++;
                        }
                    }
                });
            });
        }

        // D003: Links relativos rotos
        const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const lm of linkMatches) {
            let href = lm[2].trim();
            if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                let cleanHref = href.split('#')[0];
                if (cleanHref.startsWith('file:///')) {
                    cleanHref = cleanHref.replace(/^file:\/\/\/?/, '');
                    if (/^[a-zA-Z]:/.test(cleanHref)) {
                        if (!fs.existsSync(cleanHref)) {
                            console.error('[FAIL D003] Link roto en ' + rel + ' -> ' + href);
                            errors++;
                        }
                        continue;
                    }
                }
                if (cleanHref) {
                    const resolvedTarget = path.resolve(path.dirname(file), cleanHref);
                    if (!fs.existsSync(resolvedTarget)) {
                        console.error('[FAIL D003] Link roto en ' + rel + ' -> ' + href);
                        errors++;
                    }
                }
            }
        }
    }

    // Validación de Source Notes (R1, R2, LIB003)
    if (rel.startsWith('01_research_and_lenses/sources/')) {
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (match) {
            try {
                const data = yaml.load(match[1]);
                const isLegacyNote = data && data.id && LEGACY_SOURCE_NOTES.has(data.id);

                // R1: Routing cerrado de versiones de Source Notes
                if (!isLegacyNote && !data.schema_version) {
                    console.error('[FAIL D010] Source Note nueva ' + rel + ' no está en el inventario legacy y carece de schema_version requerido (2)');
                    errors++;
                } else if (data && data.schema_version === 2) {
                    if (sourceSchemaValidator) {
                        const valid = sourceSchemaValidator(data);
                        if (!valid) {
                            console.error('[FAIL D010] Error de validación contra source_note_schema_v2.json en ' + rel + ': ' + ajv.errorsText(sourceSchemaValidator.errors));
                            errors++;
                        }
                    }
                }

                // B3R: Validación de nombres humanos válidos
                if (data && data.approved_by_humans && Array.isArray(data.approved_by_humans)) {
                    data.approved_by_humans.forEach(name => {
                        if (!isValidHumanName(name)) {
                            console.error('[FAIL B3R] Nombre de aprobador humano no válido o agente/placeholder detectado en ' + rel + ': ' + name);
                            errors++;
                        }
                    });
                }

                // B3R: Aprobación humana ejecutable (para notas no-legacy / Schema v2)
                if (!isLegacyNote && data && (data.status === 'canonical' || data.review_status === 'accepted')) {
                    if (!data.approved_by_humans || !Array.isArray(data.approved_by_humans) || data.approved_by_humans.length === 0) {
                        console.error('[FAIL B3R] Objeto canonical/accepted sin aprobadores humanos en ' + rel);
                        errors++;
                    }
                    if (!data.approval_date || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.approval_date)) {
                        console.error('[FAIL B3R] Objeto canonical/accepted sin fecha de aprobación válida en ' + rel);
                        errors++;
                    }
                }

                // R2: Validación de topics (las 5 notas legacy están protegidas en Fase 1R)
                if (data && data.topics && Array.isArray(data.topics)) {
                    data.topics.forEach(t => {
                        if (allowedTopics.size > 0 && !allowedTopics.has(t)) {
                            if (!isLegacyNote && mode === 'strict') {
                                console.error('[FAIL LIB002] Topic fuera de taxonomía en ' + rel + ': "' + t + '"');
                                errors++;
                            } else {
                                // En notas legacy, emitir warning controlado
                                warnings++;
                            }
                        }
                    });
                }

                // LIB003: Almacenamiento, texto completo y hash
                if (data && data.reading_status === 'full_text_reviewed') {
                    if (!data.fulltext) {
                        console.error('[FAIL LIB003] reading_status es full_text_reviewed pero falta bloque fulltext en ' + rel);
                        errors++;
                    } else {
                        const ft = data.fulltext;
                        if (ft.storage_type === 'local_archive') {
                            if (!ft.local_path) {
                                console.error('[FAIL LIB003] storage_type local_archive requiere local_path en ' + rel);
                                errors++;
                            } else {
                                const resolvedArchive = path.resolve(path.dirname(file), ft.local_path);
                                if (!fs.existsSync(resolvedArchive)) {
                                    console.error('[FAIL LIB003] local_archive declarado pero archivo inexistente: ' + ft.local_path + ' en ' + rel);
                                    errors++;
                                }
                            }
                            if (ft.hash_status === 'verified' && !ft.sha256) {
                                console.error('[FAIL LIB003] hash_status es verified pero sha256 es nulo en ' + rel);
                                errors++;
                            }
                        } else if (ft.storage_type === 'external_reference') {
                            if (!ft.accessed_at) {
                                console.error('[FAIL LIB003] external_reference requiere fecha accessed_at en ' + rel);
                                errors++;
                            }
                            if (ft.hash_status === 'verified' && !ft.sha256) {
                                console.error('[FAIL LIB003] hash_status no puede ser verified con sha256 null en external_reference (' + rel + ')');
                                errors++;
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        // Validación de Candidate Claims en Sección 9
        const { candidates, errors: candErrors } = parseCandidateClaimsFromSourceNote(file);
        if (candErrors.length > 0) {
            candErrors.forEach(ce => {
                if (ce.candidateId && ce.message.includes('duplicado en nota')) {
                    console.error('[FAIL D001] ' + ce.message + ' (' + ce.file + ')');
                } else if (ce.message.includes('inexistente o no autorizado')) {
                    console.error('[FAIL D002] ' + ce.message + ' (' + ce.file + ')');
                } else {
                    console.error('[FAIL D010] ' + ce.message + ' (' + ce.file + ')');
                }
                errors++;
            });
        }

        candidates.forEach(cand => {
            if (candidateValidator) {
                const valid = candidateValidator(cand);
                if (!valid) {
                    console.error('[FAIL D010] Candidato ' + cand.candidate_id + ' viola candidate_claim_schema_v1: ' + ajv.errorsText(candidateValidator.errors));
                    errors++;
                }
            }

            // B3R en decisiones de candidatos (E2B-03 / NEG-057)
            if (cand.decided_by_humans && Array.isArray(cand.decided_by_humans) && cand.decided_by_humans.length > 0) {
                cand.decided_by_humans.forEach(name => {
                    if (!isValidHumanName(name)) {
                        console.error('[FAIL B3R] Candidato ' + cand.candidate_id + ' contiene identidad no humana o placeholder en decided_by_humans: ' + name);
                        errors++;
                    }
                });
            }

            // Contrato de procedencia inversa (E2B-02 / NEG-051)
            if (cand.triage_status === 'promoted' || cand.triage_status === 'merged') {
                if (cand.target_claim_id) {
                    let hasInverseLink = false;
                    files.forEach(cf => {
                        const crel = path.relative(brainDir, cf).split(path.sep).join('/');
                        if (crel.startsWith('01_research_and_lenses/claims/')) {
                            const { claims } = parseClaimsFile(cf);
                            claims.forEach(cl => {
                                if (cl.claim_id === cand.target_claim_id) {
                                    if (cl.derived_from_candidates && Array.isArray(cl.derived_from_candidates) && cl.derived_from_candidates.includes(cand.candidate_id)) {
                                        hasInverseLink = true;
                                    }
                                }
                            });
                        }
                    });

                    if (!hasInverseLink) {
                        console.error('[FAIL LIB007] Candidato promoted/merged ' + cand.candidate_id + ' apunta a claim ' + cand.target_claim_id + ' pero el claim no contiene el vínculo inverso');
                        errors++;
                    }
                }
            }
        });
    }

    // Validación de Claims Científicos (R4, B1, LIB001)
    // Validación de Claims Científicos (R4, B1R, B2R / D002)
    if (rel.startsWith('01_research_and_lenses/claims/')) {
        const { claims, authoritativeClaims, errors: parseErrs } = parseClaimsFile(file);
        if (parseErrs.length > 0) {
            parseErrs.forEach(pe => {
                console.error('[FAIL D010] Error de parsing en claim ' + pe.file + ': ' + pe.message);
                errors++;
            });
        }

        claims.forEach((c, idx) => {
            const auth = authoritativeClaims ? authoritativeClaims[idx] : c;

            // Validar objeto autoritativo contra claim_entry_schema_v1.json
            if (claimSchemaValidator) {
                const valid = claimSchemaValidator(auth);
                if (!valid) {
                    console.error('[FAIL D010] Claim autoritativo ' + auth.claim_id + ' viola claim_entry_schema_v1.json: ' + ajv.errorsText(claimSchemaValidator.errors));
                    errors++;
                }
            }

            // Validar objeto indexado contra claims_index_entry_schema_v1.json
            if (claimIndexSchemaValidator) {
                const validIndex = claimIndexSchemaValidator(c);
                if (!validIndex) {
                    console.error('[FAIL D010] Claim indexado ' + c.claim_id + ' viola claims_index_entry_schema_v1.json: ' + ajv.errorsText(claimIndexSchemaValidator.errors));
                    errors++;
                }
            }

            // Validar procedencia inversa: derived_from_candidates
            if (c.derived_from_candidates && Array.isArray(c.derived_from_candidates)) {
                c.derived_from_candidates.forEach(candId => {
                    const candObj = allParsedCandidates.get(candId);
                    if (!candObj) {
                        console.error('[FAIL D002] Claim ' + c.claim_id + ' derived_from_candidates cita candidato inexistente: ' + candId);
                        errors++;
                    } else if (candObj.triage_status === 'rejected') {
                        console.error('[FAIL LIB007] Claim cita candidato con status rejected: ' + candId + ' en ' + c.claim_id);
                        errors++;
                    }
                });
            }

            // Validar topics de claims contra taxonomía
            if (c.topics && Array.isArray(c.topics)) {
                c.topics.forEach(t => {
                    if (allowedTopics.size > 0 && !allowedTopics.has(t) && t !== 'general') {
                        if (mode === 'strict') {
                            console.error('[FAIL LIB002] Topic fuera de taxonomía en claim ' + c.claim_id + ': "' + t + '"');
                            errors++;
                        } else {
                            warnings++;
                        }
                    }
                });
            }

            // D002: Resolución universal de supported_by
            if (c.supported_by && Array.isArray(c.supported_by)) {
                c.supported_by.forEach(ref => {
                    const srcId = ref.source_id;
                    const isResolved = allActiveIds.has(srcId);
                    const inActiveDebt = activeDebtSources.has(srcId);
                    const inBacklog = backlogSources.has(srcId);

                    if (inBacklog) {
                        console.error('[FAIL D002] Claim ' + c.claim_id + ' cita fuente no autorizada (en backlog o desconocida): ' + srcId);
                        errors++;
                    } else if (!isResolved && !inActiveDebt) {
                        console.error('[FAIL D002] Claim ' + c.claim_id + ' cita fuente desconocida que no existe ni está en deuda: ' + srcId);
                        errors++;
                    } else if (!isResolved && inActiveDebt) {
                        // Requisito 9: Permitir SRC-* ausente sólo cuando el claim esté simultáneamente suspendido, unresolved y limitado a internal_research
                        const isSuspended = c.review_status === 'suspended';
                        const isUnresolved = c.evidence_status === 'unresolved';
                        const isOnlyInternal = Array.isArray(c.allowed_uses) && c.allowed_uses.length === 1 && c.allowed_uses[0] === 'internal_research';

                        if (!isSuspended || !isUnresolved || !isOnlyInternal) {
                            console.error('[FAIL D002] Claim ' + c.claim_id + ' cita fuente en deuda ' + srcId + ' pero no está debidamente confinado (requiere review_status: suspended, evidence_status: unresolved y allowed_uses: [internal_research])');
                            errors++;
                        } else {
                            warnings++;
                        }
                    }
                });
            }

            // D002: Resolución universal de evidenced_by
            if (c.evidenced_by && Array.isArray(c.evidenced_by)) {
                c.evidenced_by.forEach(ref => {
                    const evId = ref.evidence_id;
                    if (!allActiveIds.has(evId)) {
                        console.error('[FAIL D002] Claim ' + c.claim_id + ' cita evidencia inexistente: ' + evId);
                        errors++;
                    }
                });
            }

            // D002: Resolución universal de grounded_in
            if (c.grounded_in && Array.isArray(c.grounded_in)) {
                c.grounded_in.forEach(gId => {
                    if (!allActiveIds.has(gId)) {
                        console.error('[FAIL D002] Claim ' + c.claim_id + ' grounded_in apunta a ID inexistente: ' + gId);
                        errors++;
                    }
                });
            }
        });
    }

    // Validación de Sales Claims y Confinamiento Comercial (R3, R4, B2R, LIB001)
    if (!rel.startsWith('99_archive_and_history') && rel.includes('evidence_for_sales.md')) {
        const { salesClaims, errors: scParseErrs } = parseSalesClaimsFile(file);
        if (scParseErrs.length > 0) {
            scParseErrs.forEach(pe => {
                console.error('[FAIL D010] Error de parsing en sales claim ' + pe.file + ': ' + pe.message);
                errors++;
            });
        }

        salesClaims.forEach(sc => {
            if (salesSchemaValidator) {
                const valid = salesSchemaValidator(sc);
                if (!valid) {
                    console.error('[FAIL D010] Sales claim ' + sc.sales_claim_id + ' viola sales_claim_schema_v1.json: ' + ajv.errorsText(salesSchemaValidator.errors));
                    errors++;
                }
            }

            // D002 & LIB001: Validación universal de claim_refs
            if (sc.claim_refs && Array.isArray(sc.claim_refs)) {
                sc.claim_refs.forEach(ref => {
                    const isResolved = allActiveIds.has(ref);
                    const inActiveDebt = activeDebtSources.has(ref);
                    const inBacklog = backlogSources.has(ref);

                    // D002: Todo target debe existir en el cerebro o en la deuda activa
                    if (inBacklog) {
                        console.error('[FAIL D002] Sales claim ' + sc.sales_claim_id + ' apunta a ID no resoluble (en backlog): ' + ref);
                        errors++;
                    } else if (!isResolved && !inActiveDebt) {
                        console.error('[FAIL D002] Sales claim ' + sc.sales_claim_id + ' apunta a ID no resoluble: ' + ref);
                        errors++;
                    }

                    // Confinamiento comercial estricto: un claim activo no puede depender de claims suspendidos ni fuentes no resueltas
                    if (sc.status === 'active') {
                        if (ref.startsWith('CLAIM-')) {
                            const cStatus = claimStatusMap.get(ref);
                            if (!cStatus || cStatus === 'suspended') {
                                if (mode === 'strict') {
                                    console.error('[FAIL LIB001 - STRICT] Sales claim activo ' + sc.sales_claim_id + ' cita claim suspendido: ' + ref);
                                    errors++;
                                }
                            }
                        } else if (ref.startsWith('SRC-')) {
                            if (!knownSources.has(ref)) {
                                if (mode === 'strict') {
                                    console.error('[FAIL LIB001 - STRICT] Sales claim activo ' + sc.sales_claim_id + ' cita fuente no resuelta: ' + ref);
                                    errors++;
                                }
                            }
                        }
                    }
                });
            }
        });
    }
});

// Pase 3: Validación de Topic Mappings & Candidate Claims Index
const topicMappingsFile = path.join(brainDir, '01_research_and_lenses/librarian/topic_mappings.json');
if (fs.existsSync(topicMappingsFile)) {
    try {
        const tmData = JSON.parse(fs.readFileSync(topicMappingsFile, 'utf8'));
        if (topicMappingValidator) {
            const valid = topicMappingValidator(tmData);
            if (!valid) {
                console.error('[FAIL D010] topic_mappings.json viola topic_mapping_schema_v1: ' + ajv.errorsText(topicMappingValidator.errors));
                errors++;
            }
        }

        const seenLegacy = new Set();
        (tmData.rules || []).forEach(r => {
            if (seenLegacy.has(r.legacy_topic)) {
                console.error('[FAIL LIB002] Legacy topic duplicado en topic_mappings.json: ' + r.legacy_topic);
                errors++;
            }
            seenLegacy.add(r.legacy_topic);

            const seenTargets = new Set();
            (r.mappings || []).forEach(m => {
                if (seenTargets.has(m.canonical_target)) {
                    console.error('[FAIL LIB002] Target canónico duplicado dentro de mappings[]: ' + m.canonical_target);
                    errors++;
                }
                seenTargets.add(m.canonical_target);

                if (allowedTopics.size > 0 && !allowedTopics.has(m.canonical_target)) {
                    console.error('[FAIL LIB002] Target de mapping fuera de taxonomía: ' + m.canonical_target);
                    errors++;
                }
            });

            // B3R en mappings
            if (r.review_status === 'accepted') {
                if (!r.approved_by_humans || !Array.isArray(r.approved_by_humans) || r.approved_by_humans.length === 0) {
                    console.error('[FAIL B3R] Regla de mapping accepted sin aprobador humano en ' + r.legacy_topic);
                    errors++;
                } else {
                    r.approved_by_humans.forEach(name => {
                        if (!isValidHumanName(name)) {
                            console.error('[FAIL B3R] Regla de mapping con aprobador no humano: ' + name);
                            errors++;
                        }
                    });
                }
                if (!r.approval_date || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.approval_date)) {
                    console.error('[FAIL B3R] Regla de mapping accepted sin fecha de aprobación en ' + r.legacy_topic);
                    errors++;
                }
            } else if (r.review_status === 'pending_review') {
                if ((r.approved_by_humans && r.approved_by_humans.length > 0) || r.approval_date !== null) {
                    console.error('[FAIL B3R] Regla de mapping pending_review contiene aprobaciones humanas en ' + r.legacy_topic);
                    errors++;
                }
            }
        });
    } catch (e) {
        console.error('[FAIL D010] Error parseando topic_mappings.json: ' + e.message);
        errors++;
    }
}

// Validación de consistencia del candidate_claims_index.json vs notas
const candIndexFile = path.join(brainDir, '01_research_and_lenses/candidate_claims_index.json');
if (fs.existsSync(candIndexFile)) {
    try {
        const indexCands = JSON.parse(fs.readFileSync(candIndexFile, 'utf8'));
        if (indexCands.length !== allParsedCandidates.size) {
            console.error('[FAIL D070] Drift detectado en candidate_claims_index.json: conteo difiere (' + indexCands.length + ' vs ' + allParsedCandidates.size + ')');
            errors++;
        }
    } catch (e) {}
}

console.log('---------------------------------------------------------');
if (errors > 0) {
    console.error('AUDITORÍA FALLIDA: ' + errors + ' errores críticos encontrados.');
    process.exit(1);
} else {
    console.log('AUDITORÍA DETERMINÍSTICA 100% PASS (' + warnings + ' advertencias controladas de deuda).');
}
