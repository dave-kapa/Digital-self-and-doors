/**
 * build_evidence_graph.js
 * Genera el grafo determinístico de relaciones de evidencia del Cerebro V3 (Fase 2B / E2B-07).
 * Resuelve namespaces y categoriza nodos y aristas:
 *  - resolved: objeto activo en registry o claims index
 *  - registered_debt: fuente externa registrada formalmente en EVIDENCE_DEBT.md
 *  - candidate_claim: 16 nodos no canónicos de propuestas pendientes (Fase 2B)
 *  - candidate_proposal & candidate_target: 32 aristas de propuesta hacia matrices (Fase 2B)
 *  - unresolved_error: ID que no existe en el sistema ni en deuda
 * Excluye estrictamente 99_archive_and_history.
 * Soporta modo --check para verificación en CI sin escribir archivos.
 */
const fs = require('fs');
const path = require('path');
const { parseClaimsFile, parseSalesClaimsFile } = require('./lib/content_parser');

const brainDir = path.join(__dirname, '../brain');
const targetGraphPath = path.join(brainDir, '06_evidence_and_validation/evidence_graph.json');
const claimsDir = path.join(brainDir, '01_research_and_lenses/claims');
const salesFile = path.join(brainDir, '07_commercial_and_gotomarket/evidence_for_sales.md');
const registryFile = path.join(brainDir, '00_meta_and_governance/registry.json');
const debtFile = path.join(brainDir, '01_research_and_lenses/librarian/EVIDENCE_DEBT.md');
const debtIndexFile = path.join(brainDir, '01_research_and_lenses/librarian/evidence_debt_index.json');
const candidateIndexFile = path.join(brainDir, '01_research_and_lenses/candidate_claims_index.json');

const registry = fs.existsSync(registryFile) ? JSON.parse(fs.readFileSync(registryFile, 'utf8')) : {};

// Cargar fuentes registradas en deuda oficial
const debtSources = new Set();
if (fs.existsSync(debtIndexFile)) {
    try {
        const dIdx = JSON.parse(fs.readFileSync(debtIndexFile, 'utf8'));
        (dIdx.cited_external_unresolved_debt || []).forEach(id => debtSources.add(id));
        (dIdx.internal_references_to_decouple || []).forEach(id => debtSources.add(id));
    } catch (e) {}
} else if (fs.existsSync(debtFile)) {
    const debtContent = fs.readFileSync(debtFile, 'utf8');
    const sec5 = debtContent.split('## 5. Deuda Externa Activa')[1];
    if (sec5) {
        const activePart = sec5.split('## 6. Backlog')[0];
        const matches = activePart.match(/SRC-[A-Z0-9-]+/g);
        if (matches) matches.forEach(m => debtSources.add(m));
    }
}

const nodes = [];
const edges = [];
const seenNodeIds = new Set();

function addNode(id, type, layer, status, label, resolutionStatus) {
    if (!seenNodeIds.has(id)) {
        seenNodeIds.add(id);
        nodes.push({
            id,
            type,
            layer,
            status: status || 'active',
            label: label || id,
            resolution_status: resolutionStatus || 'resolved'
        });
    }
}

// 1. Nodos de Canon y Evidencia desde registry (excluyendo archive)
const activeRegistryIds = new Set();
Object.values(registry).forEach(entry => {
    if (!entry.path.startsWith('99_archive_and_history')) {
        activeRegistryIds.add(entry.id);
        addNode(entry.id, entry.type, entry.path.split('/')[0], entry.status, entry.title, 'resolved');
    }
});

// 2. Procesar Claims Científicos
const claimFiles = fs.readdirSync(claimsDir).filter(f => f.endsWith('.md')).sort();
let totalSupportedBy = 0;
let totalEvidencedBy = 0;
let totalGroundedIn = 0;

let resolvedEdges = 0;
let debtEdges = 0;
let errorEdges = 0;

const activeClaimIds = new Set();
const allClaimsList = [];

claimFiles.forEach(f => {
    const filePath = path.join(claimsDir, f);
    const { claims } = parseClaimsFile(filePath);
    claims.forEach(c => {
        activeClaimIds.add(c.claim_id);
        allClaimsList.push(c);
        addNode(c.claim_id, 'claim', '01_research_and_lenses', c.review_status, c.statement, 'resolved');
    });
});

allClaimsList.forEach(c => {
    // supported_by edges
    if (c.supported_by && Array.isArray(c.supported_by)) {
        c.supported_by.forEach(ref => {
            const isResolved = activeRegistryIds.has(ref.source_id);
            const isDebt = debtSources.has(ref.source_id);
            let resStatus = 'unresolved_error';
            if (isResolved) {
                resStatus = 'resolved';
                resolvedEdges++;
            } else if (isDebt) {
                resStatus = 'registered_debt';
                debtEdges++;
            } else {
                errorEdges++;
            }

            addNode(ref.source_id, 'source_reference', '01_research_and_lenses', isResolved ? 'active' : 'unresolved', ref.source_id, resStatus);
            edges.push({
                source: c.claim_id,
                target: ref.source_id,
                namespace: 'supported_by',
                relation: ref.relation,
                resolution_status: resStatus
            });
            totalSupportedBy++;
        });
    }

    // evidenced_by edges
    if (c.evidenced_by && Array.isArray(c.evidenced_by)) {
        c.evidenced_by.forEach(ref => {
            const isResolved = activeRegistryIds.has(ref.evidence_id);
            const resStatus = isResolved ? 'resolved' : 'unresolved_error';
            if (isResolved) resolvedEdges++; else errorEdges++;

            addNode(ref.evidence_id, 'evidence_record', '06_evidence_and_validation', isResolved ? 'active' : 'unresolved', ref.evidence_id, resStatus);
            edges.push({
                source: c.claim_id,
                target: ref.evidence_id,
                namespace: 'evidenced_by',
                relation: ref.relation,
                resolution_status: resStatus
            });
            totalEvidencedBy++;
        });
    }

    // grounded_in edges
    if (c.grounded_in && Array.isArray(c.grounded_in)) {
        c.grounded_in.forEach(gId => {
            const isResolved = activeRegistryIds.has(gId);
            const resStatus = isResolved ? 'resolved' : 'unresolved_error';
            if (isResolved) resolvedEdges++; else errorEdges++;

            addNode(gId, 'framework_canon', '02_framework_canon', isResolved ? 'canonical' : 'unresolved', gId, resStatus);
            edges.push({
                source: c.claim_id,
                target: gId,
                namespace: 'grounded_in',
                relation: 'conceptual_grounding',
                resolution_status: resStatus
            });
            totalGroundedIn++;
        });
    }
});

// 3. Procesar Sales Claims
let totalCommercialRefs = 0;
if (fs.existsSync(salesFile)) {
    const { salesClaims } = parseSalesClaimsFile(salesFile);
    salesClaims.forEach(sc => {
        addNode(sc.sales_claim_id, 'sales_claim', '07_commercial_and_gotomarket', sc.status, sc.authorized_statement, 'resolved');

        if (sc.claim_refs && Array.isArray(sc.claim_refs)) {
            sc.claim_refs.forEach(ref => {
                const isResolved = activeRegistryIds.has(ref) || activeClaimIds.has(ref);
                const isDebt = debtSources.has(ref);
                let resStatus = 'unresolved_error';
                if (isResolved) {
                    resStatus = 'resolved';
                    resolvedEdges++;
                } else if (isDebt) {
                    resStatus = 'registered_debt';
                    debtEdges++;
                } else {
                    errorEdges++;
                }

                if (!seenNodeIds.has(ref)) {
                    addNode(ref, 'reference_target', 'unknown', 'unresolved', ref, resStatus);
                }

                edges.push({
                    source: sc.sales_claim_id,
                    target: ref,
                    namespace: 'commercial_ref',
                    relation: sc.foundation_type,
                    resolution_status: resStatus
                });
                totalCommercialRefs++;
            });
        }
    });
}

// 4. Incorporar Candidate Claims (Fase 2B / E2B-07)
let totalCandidateProposal = 0;
let totalCandidateTarget = 0;

if (fs.existsSync(candidateIndexFile)) {
    const candidateClaims = JSON.parse(fs.readFileSync(candidateIndexFile, 'utf8'));
    candidateClaims.forEach(cand => {
        // Nodo no canónico de candidate claim
        addNode(
            cand.candidate_id,
            'candidate_claim',
            '01_research_and_lenses',
            'pending',
            cand.statement,
            'non_canonical_candidate'
        );

        // Arista 1: Source Note -> Candidate Claim (candidate_proposal)
        edges.push({
            source: cand.source_id,
            target: cand.candidate_id,
            namespace: 'candidate_proposal',
            relation: 'proposed_in',
            resolution_status: 'resolved'
        });
        totalCandidateProposal++;
        resolvedEdges++;

        // Arista 2: Candidate Claim -> Claim Matrix (candidate_target)
        edges.push({
            source: cand.candidate_id,
            target: cand.proposed_target_matrix_id,
            namespace: 'candidate_target',
            relation: 'targets_matrix',
            resolution_status: 'resolved'
        });
        totalCandidateTarget++;
        resolvedEdges++;
    });
}

nodes.sort((a, b) => a.id.localeCompare(b.id));
edges.sort((a, b) => (a.source + a.target + a.namespace).localeCompare(b.source + b.target + b.namespace));

const graphData = {
    meta: {
        title: 'Evidence & Knowledge Graph — Cerebro V3 (Fase 2B)',
        generated_at: '2026-09-10',
        node_count: nodes.length,
        edge_count: edges.length,
        namespaces: {
            supported_by: totalSupportedBy,
            evidenced_by: totalEvidencedBy,
            grounded_in: totalGroundedIn,
            commercial_ref: totalCommercialRefs,
            candidate_proposal: totalCandidateProposal,
            candidate_target: totalCandidateTarget
        },
        resolution_summary: {
            resolved_edges: resolvedEdges,
            registered_debt_edges: debtEdges,
            unresolved_error_edges: errorEdges
        }
    },
    nodes,
    edges
};

if (errorEdges > 0) {
    console.error('[FAIL D002] El grafo de evidencia contiene ' + errorEdges + ' aristas con "unresolved_error".');
    process.exit(1);
}

const isCheckMode = process.argv.includes('--check');
const formatted = JSON.stringify(graphData, null, 2) + '\n';

if (isCheckMode) {
    if (fs.existsSync(targetGraphPath)) {
        const existing = fs.readFileSync(targetGraphPath, 'utf8');
        if (existing.replace(/\r\n/g, '\n') !== formatted.replace(/\r\n/g, '\n')) {
            console.error('[DRIFT] evidence_graph.json está desactualizado.');
            process.exit(1);
        } else {
            console.log('evidence_graph.json verificado sin drift (' + nodes.length + ' nodos, ' + edges.length + ' aristas) (PASS --check).');
        }
    } else {
        console.error('[DRIFT] evidence_graph.json no existe. Ejecuta npm run build:graph');
        process.exit(1);
    }
} else {
    fs.writeFileSync(targetGraphPath, formatted, 'utf8');
    console.log('evidence_graph.json generado exitosamente (' + nodes.length + ' nodos, ' + edges.length + ' aristas).');
}
