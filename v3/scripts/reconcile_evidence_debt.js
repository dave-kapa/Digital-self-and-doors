const fs = require('fs');
const path = require('path');

const brainDir = 'd:/DCP/Proposito/LearnTheWorld/DigitalSelf_AttentionDoors/v3/brain';
const claimsDir = path.join(brainDir, '01_research_and_lenses/claims');
const salesFile = path.join(brainDir, '07_commercial_and_gotomarket/evidence_for_sales.md');
const sourcesDir = path.join(brainDir, '01_research_and_lenses/sources');
const debtFilePath = path.join(brainDir, '01_research_and_lenses/librarian/EVIDENCE_DEBT.md');

// 1. Extraer todas las referencias SRC-* de claims/*.md
const claimFiles = fs.readdirSync(claimsDir).filter(f => f.endsWith('.md'));
const citedSources = new Map(); // srcId -> [claims citing it]

claimFiles.forEach(f => {
    const content = fs.readFileSync(path.join(claimsDir, f), 'utf8');
    const matches = content.matchAll(/##\s+(CLAIM-[A-Z0-9-]+)[\s\S]*?\*\*Supported by:\*\*\s+\[([^\]]+)\]/g);
    for (const m of matches) {
        const claimId = m[1];
        const sList = m[2].split(',').map(s => s.replace(/[`'"]/g, '').trim()).filter(Boolean);
        sList.forEach(src => {
            if (src.startsWith('SRC-')) {
                if (!citedSources.has(src)) citedSources.set(src, []);
                citedSources.get(src).push(claimId);
            }
        });
    }
});

// Extraer referencias de sales claims
if (fs.existsSync(salesFile)) {
    const salesContent = fs.readFileSync(salesFile, 'utf8');
    const salesMatches = salesContent.matchAll(/##\s+(SALES-CLAIM-[0-9]{3})[\s\S]*?\*\*Sources:\*\*\s+\[([^\]]+)\]/g);
    for (const m of salesMatches) {
        const scId = m[1];
        const sList = m[2].split(',').map(s => s.replace(/[`'"]/g, '').trim()).filter(Boolean);
        sList.forEach(src => {
            if (src.startsWith('SRC-')) {
                if (!citedSources.has(src)) citedSources.set(src, []);
                citedSources.get(src).push(scId);
            }
        });
    }
}

// 2. Fuentes físicas existentes en sources/
const resolvedSources = new Set();
if (fs.existsSync(sourcesDir)) {
    fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-')).forEach(f => {
        const id = f.replace('.md', '');
        resolvedSources.add(id);
    });
}

// 3. Clasificación canónica
const INTERNAL_REFERENCES = new Set([
    'SRC-DOOR-RELATIONS-2026',
    'SRC-DSAD-MASTER-2026',
    'SRC-FARO-V3PLUS-CANON-2026',
    'SRC-WEBINAR-INTERNAL-2026'
]);

const internalFound = [];
const resolvedFound = [];
const externalUnresolvedFound = [];

citedSources.forEach((claims, src) => {
    if (INTERNAL_REFERENCES.has(src)) {
        internalFound.push({ id: src, claims });
    } else if (resolvedSources.has(src)) {
        resolvedFound.push({ id: src, claims });
    } else {
        externalUnresolvedFound.push({ id: src, claims });
    }
});

internalFound.sort((a, b) => a.id.localeCompare(b.id));
resolvedFound.sort((a, b) => a.id.localeCompare(b.id));
externalUnresolvedFound.sort((a, b) => a.id.localeCompare(b.id));

// 4. Backlog de investigación propuesto (obras no citadas en los 35 claims actuales)
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

console.log('--- RECONCILIACIÓN DETERMINÍSTICA DE DEUDA DE EVIDENCIA ---');
console.log('Total de referencias SRC-* citadas únicas:', citedSources.size);
console.log(' - Resueltas en sources/ (1):', resolvedFound.length);
console.log(' - Referencias internas a desacoplar (4):', internalFound.length);
console.log(' - Referencias externas no resueltas citadas (32):', externalUnresolvedFound.length);
console.log(' - Backlog propuesto no citado (25):', researchBacklog.length);

const totalCheck = resolvedFound.length + internalFound.length + externalUnresolvedFound.length;
if (totalCheck !== citedSources.size || citedSources.size !== 37) {
    console.error('ERROR: La suma de partes (' + totalCheck + ') no coincide con el total de citas (' + citedSources.size + ') o con 37');
    process.exit(1);
}

// 5. Generar contenido de EVIDENCE_DEBT.md
let md = `# REGISTRO MAESTRO DE DEUDA DE EVIDENCIA (EVIDENCE DEBT)
## Scientific Library System & Integrity Framework — Digital Self & Attention Doors

> **Versión:** 2.0.0-reconciled (Fase 1R)  
> **Fecha de Publicación:** 2026-09-04  
> **Gobernanza:** Agente Bibliotecario & Antigravity Hub  
> **Estado:** Documento de Contención Oficial Reconciliado Mecánicamente  
> **Reconciliación:** 37 citas únicas = 1 resuelta + 4 internas a desacoplar + 32 externas no resueltas citadas  

---

## 1. Declaración de Deuda y Principio de Contención

Este catálogo hace 100% transparente y auditable la deuda bibliográfica del sistema de conocimiento.
Ninguna afirmación o claim que dependa de una fuente registrada aquí como no resuelta puede ser utilizada con fines comerciales externos, de capacitación externa o de publicación hasta que la Source Note correspondiente sea creada, verificada y aprobada por humanos.

---

## 2. Ecuación Matemática de Cierre de Citas

\`\`\`text
Total citas únicas SRC-* en claims y sales claims = 37
  ├── 1 Fuente existente y resuelta en sources/ (SRC-WOOD-NEAL-2007)
  ├── 4 Referencias internas propias (a desacoplar a canon en Fase 2)
  └── 32 Referencias externas citadas y no resueltas (deuda activa de claims)

Backlog de investigación propuesto (obras no citadas en claims): 25 obras
\`\`\`

---

## 3. Fuentes Resueltas Activas (1)

| ID | Título / Obra | Ubicación | Claims que la Citan |
| :--- | :--- | :--- | :--- |
| \`SRC-WOOD-NEAL-2007\` | A new look at habits and the habit-goal interface | \`01_research_and_lenses/sources/SRC-WOOD-NEAL-2007.md\` | \`${resolvedFound[0].claims.join(', ')}\` |

---

## 4. Referencias Internas Propias (4 a Desacoplar en Fase 2)

Estas 4 referencias fueron citadas históricamente con prefijo \`SRC-*\`, pero corresponden a componentes de software, especificaciones de canon o evidencia preliminar interna del proyecto. No son literatura científica externa.

| Referencia Heredada | Objeto Canónico Destino | Tipo de Objeto | Claims que la Citan | Acción en Fase 2 |
| :--- | :--- | :--- | :--- | :--- |
| \`SRC-DOOR-RELATIONS-2026\` | \`DOOR-RELATIONS\` | Canon del Framework | \`${internalFound.find(x => x.id === 'SRC-DOOR-RELATIONS-2026').claims.join(', ')}\` | Migrar a \`grounded_in\` |
| \`SRC-DSAD-MASTER-2026\` | \`CON-THESIS\` | Tesis / Canon | \`${internalFound.find(x => x.id === 'SRC-DSAD-MASTER-2026').claims.join(', ')}\` | Mapear a \`grounded_in\` |
| \`SRC-FARO-V3PLUS-CANON-2026\` | \`GAME-FARO-SIMULATION-V3PLUS\` | Componente / Juego | \`${internalFound.find(x => x.id === 'SRC-FARO-V3PLUS-CANON-2026').claims.join(', ')}\` | Migrar a \`grounded_in\` |
| \`SRC-WEBINAR-INTERNAL-2026\` | \`EVD-WEBINAR-V1\` | Evidencia Propia | \`${internalFound.find(x => x.id === 'SRC-WEBINAR-INTERNAL-2026').claims.join(', ')}\` | Migrar a \`evidenced_by\` |

---

## 5. Deuda Externa Activa: 32 Referencias No Resueltas Citadas por Claims

Todas se encuentran en estado estricto \`unresolved_identity\` hasta completar su verificación en Fase 2.

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

1. **Investigación Interna Exclusiva:** Los 35 claims que citan estas fuentes permanecen suspendidos con \`allowed_uses: [internal_research]\`.
2. **Protección Comercial:** Ningún material de ventas, pitch deck, propuesta o workshop puede atribuir validación externa con base en fuentes no resueltas.
3. **Ingesta Gobernada:** La resolución de estas fuentes se realizará estrictamente por olas durante Fase 2, previa autorización humana.
`;

fs.writeFileSync(debtFilePath, md, 'utf8');
console.log('EVIDENCE_DEBT.md actualizado exitosamente con la ecuación matemática exacta.');

// También copiar script a v3/scripts/reconcile_evidence_debt.js
const targetScript = 'd:/DCP/Proposito/LearnTheWorld/DigitalSelf_AttentionDoors/v3/scripts/reconcile_evidence_debt.js';
fs.copyFileSync(__filename, targetScript);
console.log('Script copiado a ' + targetScript);
