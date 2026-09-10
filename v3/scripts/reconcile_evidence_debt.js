const fs = require('fs');
const path = require('path');
const { parseClaimsFile, parseSalesClaimsFile } = require('./lib/content_parser');

const brainDir = path.join(__dirname, '../brain');
const claimsDir = path.join(brainDir, '01_research_and_lenses/claims');
const salesFile = path.join(brainDir, '07_commercial_and_gotomarket/evidence_for_sales.md');
const sourcesDir = path.join(brainDir, '01_research_and_lenses/sources');
const debtFilePath = path.join(brainDir, '01_research_and_lenses/librarian/EVIDENCE_DEBT.md');
const debtIndexPath = path.join(brainDir, '01_research_and_lenses/librarian/evidence_debt_index.json');

// 1. Extraer todas las referencias SRC-* citadas
const claimFiles = fs.readdirSync(claimsDir).filter(f => f.endsWith('.md')).sort();
const citedSources = new Map();

claimFiles.forEach(f => {
    const { claims } = parseClaimsFile(path.join(claimsDir, f));
    claims.forEach(c => {
        if (c.supported_by && Array.isArray(c.supported_by)) {
            c.supported_by.forEach(ref => {
                const src = ref.source_id;
                if (!citedSources.has(src)) citedSources.set(src, []);
                citedSources.get(src).push(c.claim_id);
            });
        }
    });
});

if (fs.existsSync(salesFile)) {
    const { salesClaims } = parseSalesClaimsFile(salesFile);
    salesClaims.forEach(sc => {
        if (sc.source_refs && Array.isArray(sc.source_refs)) {
            sc.source_refs.forEach(src => {
                if (!citedSources.has(src)) citedSources.set(src, []);
                citedSources.get(src).push(sc.sales_claim_id);
            });
        }
    });
}

// 2. Fuentes físicas existentes en sources/
const physicalSources = new Set();
if (fs.existsSync(sourcesDir)) {
    fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-')).forEach(f => {
        physicalSources.add(f.replace('.md', ''));
    });
}

// 3. Clasificación canónica
const resolvedFound = [];
const externalUnresolvedFound = [];

citedSources.forEach((claims, src) => {
    if (physicalSources.has(src)) {
        resolvedFound.push({ id: src, claims });
    } else {
        externalUnresolvedFound.push({ id: src, claims });
    }
});

resolvedFound.sort((a, b) => a.id.localeCompare(b.id));
externalUnresolvedFound.sort((a, b) => a.id.localeCompare(b.id));

// Registro histórico de identidades internas desacopladas en Fase 2A
const decoupledInternal = [
    {
        source_id: 'SRC-DOOR-RELATIONS-2026',
        target_relation: 'grounded_in',
        targets: ['DOOR-RELATIONS'],
        type: 'Canon del Framework',
        claims: ['CLAIM-AD-006'],
        action: 'Desacoplado exitosamente a grounded_in en Fase 2A'
    },
    {
        source_id: 'SRC-DSAD-MASTER-2026',
        target_relation: 'grounded_in',
        targets: ['CON-ATTENTION-DOORS', 'CON-EPISTEMIC-BOUNDARIES', 'CON-AI-ROLES', 'DEC-011', 'CON-FRAMEWORK-ETHICS', 'MET-TELEMETRY'],
        type: 'Canon del Framework',
        claims: ['CLAIM-AD-005', 'CLAIM-AD-006', 'CLAIM-HAI-006', 'CLAIM-HF-005', 'CLAIM-TL-006'],
        action: 'Desacoplado semánticamente a conceptos canónicos específicos en Fase 2A'
    },
    {
        source_id: 'SRC-FARO-V3PLUS-CANON-2026',
        target_relation: 'grounded_in',
        targets: ['GAME-FARO-SIMULATION-V3PLUS'],
        type: 'Componente / Juego',
        claims: ['CLAIM-GG-006'],
        action: 'Desacoplado exitosamente a grounded_in en Fase 2A'
    },
    {
        source_id: 'SRC-WEBINAR-INTERNAL-2026',
        target_relation: 'evidenced_by',
        targets: ['EVD-WEBINAR-V1'],
        type: 'Evidencia Propia',
        claims: ['CLAIM-GG-006', 'CLAIM-TL-006'],
        action: 'Desacoplado exitosamente a evidenced_by en Fase 2A'
    }
];

const researchBacklog = [
    { id: 'BACKLOG-GREEN-SWETS-1966', author: 'Green & Swets (1966)', topic: 'Signal Detection Theory', slug_provisional: 'SRC-GREEN-SWETS-1966' },
    { id: 'BACKLOG-MADDUX-ROGERS-1983', author: 'Maddux & Rogers (1983)', topic: 'Protection Motivation Theory', slug_provisional: 'SRC-MADDUX-ROGERS-1983' },
    { id: 'BACKLOG-AJZEN-1991', author: 'Ajzen (1991)', topic: 'Theory of Planned Behavior', slug_provisional: 'SRC-AJZEN-1991' },
    { id: 'BACKLOG-ERICSSON-ETAL-1993', author: 'Ericsson et al. (1993)', topic: 'Deliberate Practice (general)', slug_provisional: 'SRC-ERICSSON-ETAL-1993' },
    { id: 'BACKLOG-SWELLER-1988', author: 'Sweller (1988)', topic: 'Cognitive Load Theory (corregido de Swuller)', slug_provisional: 'SRC-SWELLER-1988' },
    { id: 'BACKLOG-TUDOREANU-KRAEMER-2008', author: 'Tudoreanu & Kraemer (2008)', topic: 'Visual attention in training', slug_provisional: 'SRC-TUDOREANU-KRAEMER-2008' },
    { id: 'BACKLOG-CAPUTO-ETAL-2014', author: 'Caputo et al. (2014)', topic: 'Spear phishing experimentation', slug_provisional: 'SRC-CAPUTO-ETAL-2014' },
    { id: 'BACKLOG-KIRKPATRICK-1996', author: 'Kirkpatrick (1996)', topic: 'Training evaluation model', slug_provisional: 'SRC-KIRKPATRICK-1996' },
    { id: 'BACKLOG-WASH-2010', author: 'Wash (2010)', topic: 'Folk models of security', slug_provisional: 'SRC-WASH-2010' },
    { id: 'BACKLOG-DETERDING-ETAL-2011', author: 'Deterding et al. (2011)', topic: 'Game design elements & gamefulness', slug_provisional: 'SRC-DETERDING-ETAL-2011' },
    { id: 'BACKLOG-HAMARI-ETAL-2014', author: 'Hamari et al. (2014)', topic: 'Does gamification work? Literature review', slug_provisional: 'SRC-HAMARI-ETAL-2014' },
    { id: 'BACKLOG-DECI-RYAN-2000', author: 'Deci & Ryan (2000)', topic: 'Self-Determination Theory', slug_provisional: 'SRC-DECI-RYAN-2000' },
    { id: 'BACKLOG-PARASURAMAN-ETAL-2000', author: 'Parasuraman, Sheridan & Wickens (2000)', topic: 'Model for automation & human performance', slug_provisional: 'SRC-PARASURAMAN-ETAL-2000' },
    { id: 'BACKLOG-DZINDOLET-ETAL-2003', author: 'Dzindolet et al. (2003)', topic: 'Misuse and disuse of automated aids', slug_provisional: 'SRC-DZINDOLET-ETAL-2003' },
    { id: 'BACKLOG-GIGERENZER-GAISSMAIER-2011', author: 'Gigerenzer & Gaissmaier (2011)', topic: 'Heuristic decision making', slug_provisional: 'SRC-GIGERENZER-GAISSMAIER-2011' },
    { id: 'BACKLOG-TAVIS-ETAL-2020', author: 'Tavis et al. (2020)', topic: 'Security fatigue', slug_provisional: 'SRC-TAVIS-ETAL-2020' },
    { id: 'BACKLOG-ALSHARNOUBY-ETAL-2015', author: 'Alsharnouby et al. (2015)', topic: 'Visual attention in phishing emails', slug_provisional: 'SRC-ALSHARNOUBY-ETAL-2015' },
    { id: 'BACKLOG-BLANDFORD-ETAL-2014', author: 'Blandford et al. (2014)', topic: 'Qualitative security research methods', slug_provisional: 'SRC-BLANDFORD-ETAL-2014' },
    { id: 'BACKLOG-FURNHAM-2010', author: 'Furnham (2010)', topic: 'Personality and cyber risk (corregido de Furnam)', slug_provisional: 'SRC-FURNHAM-2010' },
    { id: 'BACKLOG-KIRWAN-AINSWORTH-1992', author: 'Kirwan & Ainsworth (1992)', topic: 'Task analysis guide', slug_provisional: 'SRC-KIRWAN-AINSWORTH-1992' },
    { id: 'BACKLOG-REASON-1990', author: 'Reason (1990)', topic: 'Human Error', slug_provisional: 'SRC-REASON-1990' },
    { id: 'BACKLOG-SHEDDEN-ETAL-2011', author: 'Shedden et al. (2011)', topic: 'Information security culture', slug_provisional: 'SRC-SHEDDEN-ETAL-2011' },
    { id: 'BACKLOG-SIEMENS-2005', author: 'Siemens (2005)', topic: 'Connectivism / Digital learning', slug_provisional: 'SRC-SIEMENS-2005' },
    { id: 'BACKLOG-TSVETKOVA-ETAL-2018', author: 'Tsvetkova et al. (2018)', topic: 'Collective dynamics online', slug_provisional: 'SRC-TSVETKOVA-ETAL-2018' },
    { id: 'BACKLOG-VEPREK-ETAL-2022', author: 'Veprek et al. (2022)', topic: 'Simulation debriefing methodology', slug_provisional: 'SRC-VEPREK-ETAL-2022' }
];

console.log('--- RECONCILIACIÓN DETERMINÍSTICA DE DEUDA DE EVIDENCIA (FASE 2A) ---');
console.log('Total de referencias SRC-* citadas únicas:', citedSources.size);
console.log(' - Resueltas en sources/ (1):', resolvedFound.length);
console.log(' - Referencias internas desacopladas (4):', decoupledInternal.length);
console.log(' - Referencias externas no resueltas citadas (32):', externalUnresolvedFound.length);
console.log(' - Backlog propuesto no citado (25):', researchBacklog.length);

if (resolvedFound.length !== 1 || externalUnresolvedFound.length !== 32 || citedSources.size !== 33) {
    console.error('ERROR: Ecuación matemática post-desacople no coincide (esperado 1 resuelta + 32 deuda = 33 citas)');
    process.exit(1);
}

// 4. Escribir EVIDENCE_DEBT.md
let md = `# REGISTRO MAESTRO DE DEUDA DE EVIDENCIA (EVIDENCE DEBT)
## Scientific Library System & Integrity Framework — Digital Self & Attention Doors

> **Versión:** 3.0.0-phase2a (Fase 2A)  
> **Fecha de Publicación:** 2026-09-09  
> **Gobernanza:** Agente Bibliotecario & Antigravity Hub  
> **Estado:** Documento de Contención Oficial — Desacople Interno Culminado  
> **Ecuación Post-Desacople:** 33 citas únicas = 1 resuelta + 32 externas no resueltas citadas (4 internas desacopladas a canon)  

---

## 1. Declaración de Deuda y Principio de Contención

Este catálogo hace 100% transparente y auditable la deuda bibliográfica del sistema de conocimiento.
Ninguna afirmación o claim que dependa de una fuente registrada aquí como no resuelta puede ser utilizada con fines comerciales externos, de capacitación externa o de publicación hasta que la Source Note correspondiente sea creada, verificada y aprobada por humanos.

---

## 2. Ecuación Matemática de Cierre de Citas (Fase 2A)

\`\`\`text
Total citas únicas SRC-* en claims y sales claims = 33
  ├── 1 Fuente existente y resuelta en sources/ (SRC-WOOD-NEAL-2007)
  └── 32 Referencias externas citadas y no resueltas (deuda activa de claims)

Referencias internas desacopladas en Fase 2A: 4 identidades migradas a canon/evidencia
Backlog de investigación propuesto (obras no citadas en claims): 25 obras
\`\`\`

---

## 3. Fuentes Resueltas Activas Citadas por Claims (1)

| ID | Título / Obra | Ubicación | Claims que la Citan |
| :--- | :--- | :--- | :--- |
| \`SRC-WOOD-NEAL-2007\` | A new look at habits and the habit-goal interface | \`01_research_and_lenses/sources/SRC-WOOD-NEAL-2007.md\` | \`${resolvedFound[0].claims.join(', ')}\` |

---

## 4. Referencias Internas Propias Desacopladas (4 en Fase 2A)

Estas 4 referencias fueron citadas históricamente con prefijo \`SRC-*\`, pero correspondían a componentes de software, especificaciones de canon o evidencia preliminar interna. En Fase 2A han sido desacopladas integralmente del namespace bibliográfico hacia sus objetos canónicos legítimos:

| Referencia Retirada | Objeto Canónico Destino | Relación en Claims | Claims Afectados | Estado de Desacople |
| :--- | :--- | :--- | :--- | :--- |
| \`SRC-DOOR-RELATIONS-2026\` | \`DOOR-RELATIONS\` | \`grounded_in\` | \`CLAIM-AD-006\` | **DESACOPLADO** (100% canon) |
| \`SRC-DSAD-MASTER-2026\` | \`CON-ATTENTION-DOORS\`, \`CON-EPISTEMIC-BOUNDARIES\`, \`CON-AI-ROLES\`, \`DEC-011\`, \`CON-FRAMEWORK-ETHICS\`, \`MET-TELEMETRY\` | \`grounded_in\` | \`CLAIM-AD-005, CLAIM-AD-006, CLAIM-HAI-006, CLAIM-HF-005, CLAIM-TL-006\` | **DESACOPLADO** (mapeo semántico específico) |
| \`SRC-FARO-V3PLUS-CANON-2026\` | \`GAME-FARO-SIMULATION-V3PLUS\` | \`grounded_in\` | \`CLAIM-GG-006\` | **DESACOPLADO** (100% canon) |
| \`SRC-WEBINAR-INTERNAL-2026\` | \`EVD-WEBINAR-V1\` | \`evidenced_by\` | \`CLAIM-GG-006, CLAIM-TL-006\` | **DESACOPLADO** (100% evidencia propia) |

---

## 5. Deuda Externa Activa: 32 Referencias No Resueltas Citadas por Claims

Todas se encuentran en estado estricto \`unresolved_identity\` con claims confinados a \`internal_research\` hasta autorizar su ingesta.

| # | ID Nominal | Claims que la Citan | Estado de Identidad |
| :--- | :--- | :--- | :--- |
`;

externalUnresolvedFound.forEach((item, idx) => {
    md += `| ${idx + 1} | \`${item.id}\` | \`${item.claims.join(', ')}\` | \`unresolved_identity\` |\n`;
});

md += `
---

## 6. Backlog de Investigación Propuesto (25 Obras No Citadas en Claims Actuales)

Estas obras forman parte del horizonte de fundamentación teórica y metodológica del proyecto, pero **no son citadas actualmente por ningún claim**. Se mantienen aisladas en backlog sin considerarlas deuda activa de claims existentes.

| # | ID de Backlog | Autor / Año Tentativo | Dominio Temático | Slug Provisional |
| :--- | :--- | :--- | :--- | :--- |
`;

researchBacklog.forEach((item, idx) => {
    md += `| ${idx + 1} | \`${item.id}\` | ${item.author} | ${item.topic} | \`${item.slug_provisional}\` |\n`;
});

md += `
---

## 7. Regla de Confinamiento y Cero Overclaim

1. **Investigación Interna Exclusiva:** Los claims que citan estas 32 fuentes permanecen suspendidos con \`allowed_uses: [internal_research]\`.
2. **Protección Comercial:** Ningún material de ventas, pitch deck, propuesta o workshop puede atribuir validación externa con base en fuentes no resueltas.
3. **Ingesta Gobernada:** La resolución de estas 32 fuentes permanece estrictamente no autorizada hasta la aprobación del checkpoint de Fase 2A.
`;

fs.writeFileSync(debtFilePath, md, 'utf8');
console.log('[PASS] EVIDENCE_DEBT.md actualizado exitosamente.');

// 5. Escribir evidence_debt_index.json
const debtIndexObj = {
    schema_version: '2.0.0',
    description: 'Índice máquina-legible del registro de deuda de evidencia bibliográfica (Fase 2A)',
    counts: {
        resolved_sources: resolvedFound.length,
        internal_references_to_decouple: 0,
        decoupled_internal_references: decoupledInternal.length,
        cited_external_unresolved_debt: externalUnresolvedFound.length,
        research_backlog: researchBacklog.length
    },
    resolved_sources: resolvedFound.map(r => r.id),
    internal_references_to_decouple: [],
    decoupled_internal_references: decoupledInternal,
    cited_external_unresolved_debt: externalUnresolvedFound.map(e => e.id),
    research_backlog: {
        backlog_ids: researchBacklog.map(b => b.id),
        provisional_slugs: researchBacklog.map(b => b.slug_provisional)
    }
};

fs.writeFileSync(debtIndexPath, JSON.stringify(debtIndexObj, null, 2) + '\n', 'utf8');
console.log('[PASS] evidence_debt_index.json actualizado exitosamente.');
