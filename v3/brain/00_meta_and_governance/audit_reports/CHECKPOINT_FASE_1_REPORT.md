# INFORME DE CHECKPOINT OFICIAL: FASES −1, 0 Y 1 COMPLETADAS
## Scientific Library System & Integrity Framework — Cerebro V3.0

> **Fecha de Emisión:** 2026-09-04  
> **Auditoría Responsable:** Antigravity (Hub de Implementación Técnica)  
> **Destinatarios:** Usuario (Dirección de Proyecto) & ChatGPT (Consultor de Auditoría Epistemológica)  
> **Marco de Referencia:** `AUTORIZACION_CONDICIONADA_PLAN_V2_1.md` (Correcciones C1 a C10)  
> **Estado del Checkpoint:** FASE 1 COMPLETADA — EN ESPERA DE REVISIÓN PARA FASE 2  

---

## 1. Diff Completo y Resumen de Cambios (Fases −1, 0 y 1)

### Resumen de Modificaciones por Fase

#### Fase −1: Contención y Deuda Declarada
- **Respaldo previo:** Creado snapshot completo en `v3/brain/99_archive_and_history/snapshots/pre_phase_neg1_20260904/`.
- **Registro de Deuda:** Creado `v3/brain/01_research_and_lenses/librarian/EVIDENCE_DEBT.md` aislando 4 referencias internas a desacoplar y 32 identidades de literatura externa categorizadas en Tiers 1, 2 y 3 bajo estado `unresolved_identity`.
- **Scorecard Honesto:** Actualizado `v3/brain/00_meta_and_governance/audit_reports/BRAIN_HEALTH_LATEST.md` reflejando estados operativos reales.
- **Confinamiento de Claims:** Modificadas las 6 matrices de claims (`claims_*.md`) confinando 35 claims a `allowed_uses: [internal_research]`, `evidence_status: unresolved`, `review_status: suspended`.
- **Saneamiento Comercial:** Reestructurado `v3/brain/07_commercial_and_gotomarket/evidence_for_sales.md`: 4 sales claims activos por postura de framework/evidencia preliminar interna, 3 confinados a `pending_evidence_debt`.

#### Fase 0: Contratos Formales y Dependencias
- **Dependencias Reales:** Incorporadas `js-yaml`, `ajv`, `ajv-formats` en `package.json` y bloqueadas en `package-lock.json`.
- **Schemas Formales:** Creados en `v3/brain/00_meta_and_governance/schemas/`:
  - `source_note_schema_v2.json` (cumple C1: IDs de gaps reales; C2: separación `reviewed_by_agents` vs `approved_by_humans`; C3: identidad editorial concreta; C10: `epistemic_status: not_applicable` a nivel de fuente).
  - `claim_entry_schema_v1.json` (cumple C4: placeholders neutrales sin sobreafirmar causalidad; C9: incluye `topics` alineado con taxonomía; namespaces `supported_by`, `evidenced_by`, `grounded_in`).
  - `sales_claim_schema_v1.json` (tipado por `foundation_type`, estado y claims de soporte).
- **Manifiesto de Biblioteca:** Creado `v3/research_library/LIBRARY_MANIFEST.yaml` (inicialmente vacío, preparado para licencias y hashes).
- **Aclaración Histórica:** Encabezado de `source_registry.yaml` explicitado como registro histórico de migración.

#### Fase 1: Auditor Real, Reglas D/LIB, Pruebas Negativas y MOCs
- **Auditor Reescrito (`v3/scripts/audit_brain.js`):**
  - Migrado de regex frágiles a parser formal `js-yaml` y validador `ajv`.
  - Soporta modos `--mode=migration` (88 advertencias controladas de deuda, 0 fallos críticos) y `--mode=strict` (0 violaciones comerciales).
  - Admite parámetro `--brain-dir=<dir>` para ejecución sobre fixtures aislados.
  - Implementa validación formal de schemas JSON (D011) y verificación de `local_archive` / `sha256` (LIB003).
- **Parsers Sincronizados y Modo `--check` (C6, C8):**
  - `build_registry.js`: parsea con `js-yaml`, firewall contra `99_archive_and_history`, detecta D001 y soporta `--check`.
  - `build_bibliography.js`: compila con `js-yaml` hacia `BIBLIOGRAPHY_MASTER.md` y soporta `--check`.
  - `build_mocs.js`: regenera e inspecciona tablas MOC en las 8 capas y soporta `--check`.
- **Deduplicador Bibliográfico (`v3/scripts/librarian_dedupe.js`):** Normaliza DOIs, ISBNs y títulos difusos (0 colisiones en fuentes existentes).
- **Runner de Contrato de Contenido (`v3/scripts/run_content_contract.js`):** 13/13 aserciones determinísticas canónicas en PASS.
- **Suite de Pruebas Negativas (`v3/tests/test_audit_brain_negative.js` y `v3/tests/fixtures/`):** 8/8 pruebas negativas interceptadas con salida de error 1.

---

## 2. Schemas JSON Finales

Los 3 schemas formales se encuentran versionados en `v3/brain/00_meta_and_governance/schemas/`:

1. **`source_note_schema_v2.json`**:
   - Requiere: `id`, `title`, `type`, `layer`, `status`, `epistemic_status` (`not_applicable`), `version`, `summary`, `authors`, `year`, `source_type`, `study_design`, `peer_review_status`, `reading_status`, `review_status`, `reviewed_by_agents`, `approved_by_humans`, `last_verified`, `review_cadence_months`, `next_review`, `topics`, `fulltext`.
   - Objeto `fulltext`: `availability`, `storage_type`, `location`, `local_path`, `license_id`, `redistribution_allowed`, `sha256`, `hash_status`, `accessed_at`.
   - Arreglos opcionales de relaciones: `related_doors`, `related_theories`, `related_gaps`.

2. **`claim_entry_schema_v1.json`**:
   - Requiere: `claim_id`, `statement`, `epistemic_status`, `evidence_status`, `review_status`, `confidence`, `allowed_uses`, `last_verified`, `next_review`.
   - Namespaces tipados:
     - `supported_by`: array de objetos `{ source_id, relation }` (`direct_support`, `partial_support`, `contextual`, `qualifies`, `contradicts`).
     - `evidenced_by`: array de objetos `{ evidence_id, relation }` (`preliminary_signal`, `longitudinal_field`, `pilot_metric`).
     - `grounded_in`: array de IDs de framework (`THEORY-*`, `CON-*`, `DOOR-*`, `GAME-*`).
   - Vocabulario controlado: incluye propiedad `topics` alineada con `RESEARCH_TAXONOMY.md` (cumpliendo C9).

3. **`sales_claim_schema_v1.json`**:
   - Requiere: `sales_claim_id`, `foundation_type` (`external_evidence`, `internal_evidence`, `framework_position`, `product_description`), `claim_refs`, `authorized_statement`, `status` (`active`, `pending_evidence_debt`, `suspended`), `commercial_tier_allowed`.
   - Propiedades de control: `do_not_say` y `evidence_summary`.

---

## 3. Tabla Consolidada de Reglas (D001–D011 y LIB001–LIB008)

| Regla | Nombre del Control | Estado | Evidencia de Verificación |
| :--- | :--- | :--- | :--- |
| **D001** | Zero ID Collisions | `PASSING` | 74 entradas activas sin colisiones; NEG-003 falla con error 1 ante duplicado. |
| **D003** | Broken Markdown Links | `PASSING` | 126 archivos sin links rotos; NEG-001 falla con error 1 ante link roto. |
| **D010** | Valid YAML Frontmatter | `PASSING` | Todos los frontmatters parsean con `js-yaml`; NEG-002 falla ante YAML corrupto. |
| **D011** | Schema Completeness & Validation | `PASSING` | Validación Ajv de schemas v2; NEG-007 falla ante Source Note incompleta. |
| **D040** | Archive Isolation Compliance | `PASSING` | Firewall estricto hacia `99_archive_and_history`. |
| **D041** | No External Legacy Paths | `PASSING` | 0 enlaces a `../../insumos/` o `../../docs/`; NEG-005 falla ante ruta legacy. |
| **D070** | Spec <-> Code Synchronization | `PASSING` | `audit_spec_code_sync.js` 100% PASS sincronizando con `v3/app/game.js`. |
| **D080** | Terminology Blocklist | `PASSING` | 0 términos prohibidos sin contexto de rechazo; NEG-004 falla ante violación. |
| **LIB001**| Source <-> Claim Resolution | `PASSING` | Migration: advierte deuda. Strict: NEG-006 falla ante claim comercial huérfano. |
| **LIB002**| Controlled Taxonomy Topics | `PASSING` | `RESEARCH_TAXONOMY.md` validado por `audit_brain.js`. |
| **LIB003**| Storage & Hash Verification | `PASSING` | Verifica existencia física y hash; NEG-008 falla ante `local_archive` ausente. |
| **LIB004**| Deduplication Integrity | `PASSING` | `librarian_dedupe.js` reporta 0 duplicados en biblioteca existente. |
| **LIB005**| Provenance & Licensing | `IMPLEMENTED` | Manifiesto de licencias operativo en `v3/research_library/LIBRARY_MANIFEST.yaml`. |
| **LIB006**| Content Semantic Contract (L3) | `PASSING` | `run_content_contract.js` evalúa 13/13 aserciones canónicas con 100% PASS. |
| **LIB007**| Claim Triaging & Traceability | `SPECIFIED` | Protocolo de promoción de candidates y reverse links documentado para Fase 2. |
| **LIB008**| Retraction & Review Cadence | `SPECIFIED` | Cadencias de revisión locales especificadas; conector de retractaciones externo pendiente. |

---

## 4. Salida de la Suite Positiva Completa (`npm run verify:all`)

Ejecución determinística limpia en Windows (PowerShell / Node.js v20.18.0):

```text
> digitalself_attentiondoors@1.0.0 verify:all
> npm run test && npm run build:registry:check && npm run build:bib:check && npm run build:mocs:check

> digitalself_attentiondoors@1.0.0 test
> npm run audit:brain && npm run audit:brain:strict && npm run audit:spec && npm run test:contract && npm run test:negative

> digitalself_attentiondoors@1.0.0 audit:brain
> node v3/scripts/audit_brain.js --mode=migration
--- AUDITORÍA INTEGRAL DEL CEREBRO (audit_brain.js) ---
Modo de ejecución: MIGRATION
Archivos examinados: 126
AUDITORÍA DETERMINÍSTICA 100% PASS (88 advertencias controladas de deuda).

> digitalself_attentiondoors@1.0.0 audit:brain:strict
> node v3/scripts/audit_brain.js --mode=strict
--- AUDITORÍA INTEGRAL DEL CEREBRO (audit_brain.js) ---
Modo de ejecución: STRICT
Archivos examinados: 126
AUDITORÍA DETERMINÍSTICA 100% PASS (88 advertencias controladas de deuda).

> digitalself_attentiondoors@1.0.0 audit:spec
> node v3/scripts/audit_spec_code_sync.js
--- AUDITORÍA BIDIRECCIONAL SPEC <-> CODE (D070) ---
[PASS] Sincronización Supabase Realtime
[PASS] Control de Modales y Teclas (ESC / Logout)
[PASS] Manejo de Estados de Calibración
[PASS] Flujo de Telemetría de Sesión
Sincronización Spec <-> Code validada al 100% (PASS D070).

> digitalself_attentiondoors@1.0.0 test:contract
> node v3/scripts/run_content_contract.js
=== EJECUTANDO CONTRATO DETERMINÍSTICO DE CONTENIDO (L3) ===
Fecha: 2026-09-04T18:24:44.680Z
Git Commit: 8ecbfed [DIRTY (archivos modificados sin commit)]
Aserciones a evaluar: 13
[PASS] KR-001: DOOR-TAXONOMY
[PASS] KR-002: EPISTEMIC-STATUS
[PASS] KR-003: WEBINAR-EVIDENCE
[PASS] KR-004: PRODUCT-FRAMEWORK-SEPARATION
[PASS] KR-005: GAME-MECHANICS
[PASS] KR-006: DIGITAL-SELF-DEFINITION
[PASS] KR-007: DOOR-FUNCTION
[PASS] KR-008: DECISION-PROCESS
[PASS] KR-009: NARRATIVE-SYSTEM
[PASS] KR-010: TRAINING-VS-INTERVENTION
[PASS] KR-LIB-001: LIBRARY-EPISTEMICS
[PASS] KR-LIB-002: SOURCE-NOTE-REPRESENTATION
[PASS] KR-LIB-003: CANON-GOVERNANCE
Resultado del Contrato: 13 PASS, 0 FAIL de 13 pruebas.
CONTRATO DE CONTENIDO DETERMINÍSTICO CERTIFICADO (100% PASS).

> digitalself_attentiondoors@1.0.0 build:registry:check
> node v3/scripts/build_registry.js --check
Registry verificado sin drift respecto a Markdown (PASS --check). 74 entradas activas.
0 colisiones de IDs detectadas (PASS D001).

> digitalself_attentiondoors@1.0.0 build:bib:check
> node v3/scripts/build_bibliography.js --check
BIBLIOGRAPHY_MASTER.md verificado sin drift (PASS --check). 5 fuentes.

> digitalself_attentiondoors@1.0.0 build:mocs:check
> node v3/scripts/build_mocs.js --check
Todos los MOCs están sincronizados con registry.json (PASS).
```

---

## 5. Salida de la Suite de Pruebas Negativas (`npm run test:negative`)

Cada prueba aísla un defecto sintáctico, estructural o de integridad epistemológica en `v3/tests/fixtures/` y comprueba que el auditor falle con código de salida `1` y con el mensaje de error exacto esperado:

```text
> digitalself_attentiondoors@1.0.0 test:negative
> node v3/tests/test_audit_brain_negative.js

=== SUITE DE PRUEBAS NEGATIVAS: AUDITORÍA DETERMINÍSTICA (L2/L3) ===
Total de casos de prueba negativos: 8
-------------------------------------------------------------------
[PASS] NEG-001-D003 -> Detección de link relativo roto (D003)
       Código esperado emitido: "[FAIL D003]" | Exit status: 1
[PASS] NEG-002-D010 -> Detección de sintaxis YAML malformada (D010)
       Código esperado emitido: "[FAIL D010]" | Exit status: 1
[PASS] NEG-003-D001 -> Detección de IDs duplicados (D001)
       Código esperado emitido: "[FAIL D001]" | Exit status: 1
[PASS] NEG-004-D080 -> Detección de término prohibido en blocklist (D080)
       Código esperado emitido: "[FAIL D080]" | Exit status: 1
[PASS] NEG-005-D041 -> Detección de enlaces a rutas legacy fuera de /v3/ (D041)
       Código esperado emitido: "[FAIL D041]" | Exit status: 1
[PASS] NEG-006-LIB001 -> Detección de claim comercial citando fuente huérfana en modo strict (LIB001)
       Código esperado emitido: "[FAIL LIB001 - STRICT]" | Exit status: 1
[PASS] NEG-007-D011 -> Detección de violación de Schema v2 en Source Note (D011)
       Código esperado emitido: "[FAIL D011]" | Exit status: 1
[PASS] NEG-008-LIB003 -> Detección de local_archive inexistente en full_text_reviewed (LIB003)
       Código esperado emitido: "[FAIL LIB003]" | Exit status: 1
-------------------------------------------------------------------
Resultado de la Suite Negativa: 8 PASS, 0 FAIL de 8 pruebas.
SUITE NEGATIVA 100% PASS: Todos los defectos intencionales fueron interceptados con éxito.
```

---

## 6. Reporte de Auditoría en Modo Migración vs Modo Strict

- **Modo Migración (`--mode=migration`):**
  - Permite la existencia de fuentes no resueltas en claims confinados exclusivamente a investigación interna (`allowed_uses: [internal_research]`).
  - Emite advertencias controladas (`[WARN]`) sin quebrar el pipeline.
  - Resultado: **100% PASS con 88 advertencias controladas de deuda**.
- **Modo Estricto (`--mode=strict`):**
  - No tolera ninguna fuente no resuelta en claims con usos autorizados comerciales o publicaciones externas (`commercial`, `external_publication`).
  - Al estar todos los claims comerciales confinados y los 35 claims de investigación interna aislados, el cerebro real pasa con:
  - Resultado: **100% PASS**.
  - Si un claim con uso comercial intenta citar una fuente huérfana, falla de inmediato (probado en `NEG-006-LIB001`).

---

## 7. Lista Exacta de Claims Suspendidos y Sales Claims Clasificados

### A. 35 Claims Científicos Confinados y Suspendidos (`01_research_and_lenses/claims/`)
Todos se encuentran con: `allowed_uses: [internal_research]`, `evidence_status: unresolved`, `review_status: suspended`:
1. `CLAIM-AD-001`: Signal Detection Theory & Attention Allocation
2. `CLAIM-AD-002`: Threat Appraisal & Protective Intent (PMT)
3. `CLAIM-AD-003`: Intent-Behavior Gap in Security Decisions (TPB)
4. `CLAIM-AD-004`: Cognitive Load Degradation in Deliberation
5. `CLAIM-AD-005`: Metacognitive Prompting & Stopping Rules
6. `CLAIM-AD-006`: Situational Salience vs Systematic Processing
7. `CLAIM-GG-001`: Game Dynamics & Threat Engagement
8. `CLAIM-GG-002`: Feedback Loops & Calibration Speed
9. `CLAIM-GG-003`: Agency Preservation & Curiosity Induction
10. `CLAIM-GG-004`: Punitiveness & Defensiveness / Concealment
11. `CLAIM-GG-005`: Scenario Immersion & Context Transfer
12. `CLAIM-GG-006`: Challenge-Skill Balance & Engagement
13. `CLAIM-GENAI-001`: LLM-Crafted Spear Phishing Persuasion
14. `CLAIM-GENAI-002`: Hyper-Personalization via Digital Exhaust
15. `CLAIM-GENAI-003`: Linguistic Quality & Heuristic Bypassing
16. `CLAIM-GENAI-004`: Multimodal Context Fabrication
17. `CLAIM-GENAI-005`: Automated Adaptive Reconnaissance
18. `CLAIM-GENAI-006`: Synthetic Authority & Urgent Signaling
19. `CLAIM-HAI-001`: Trust Calibration in Protective Agents
20. `CLAIM-HAI-002`: Overreliance & Underreliance Failure Modes
21. `CLAIM-HAI-003`: Explainable Threat Cues & Human Agency
22. `CLAIM-HAI-004`: Complementary Teaming in Detection
23. `CLAIM-HAI-005`: Cognitive Offloading Risks in Security
24. `CLAIM-HAI-006`: Joint Human-AI Stopping Rule Execution
25. `CLAIM-HF-001`: Security Architecture Deficits as Error Root Causes
26. `CLAIM-HF-002`: Habitual Action & Phishing Vulnerability
27. `CLAIM-HF-003`: Fatigue & Attentional Depletion Risks
28. `CLAIM-HF-004`: Social Proof & Hierarchy Exploitation
29. `CLAIM-HF-005`: Blame Cultures & Underreporting
30. `CLAIM-HF-006`: Dual-Process Engagement & Cue Salience
31. `CLAIM-TL-001`: Deliberate Practice in Cognitive Skill Acquisition
32. `CLAIM-TL-002`: Spaced Repetition & Retention Decay
33. `CLAIM-TL-003`: Immediate Informative Feedback in Error Learning
34. `CLAIM-TL-004`: Transfer from Simulation to Field Performance
35. `CLAIM-TL-005`: Formative vs Summative Assessment Efficacy

### B. 7 Sales Claims Clasificados (`07_commercial_and_gotomarket/evidence_for_sales.md`)
- **Activos (4):**
  - `SALES-CLAIM-002`: *El simulador interactivo FARO permite observar y registrar decisiones de atención...* (`foundation_type: internal_evidence`, `claim_refs: [GAME-FARO-SIMULATION-V3PLUS, EVD-WEBINAR-V1]`).
  - `SALES-CLAIM-004`: *Las Attention Doors proporcionan un lenguaje taxonómico estructurado...* (`foundation_type: framework_position`, `claim_refs: [CON-ATTENTION-DOORS-MODEL, DEC-003]`).
  - `SALES-CLAIM-007`: *El Digital Self mapea la huella digital y el estilo decisional...* (`foundation_type: framework_position`, `claim_refs: [CON-DIGITAL-SELF, THESIS-DSAD-2026]`).
  - `SALES-CLAIM-005` (Versión interna): *La gamificación basada en agencia aumenta el involucramiento formativo...* (`foundation_type: framework_position`).
- **Confinados en Deuda (`pending_evidence_debt`) (3):**
  - `SALES-CLAIM-001`: Claims de ingeniería social con GenAI (`status: pending_evidence_debt`, dependiente de Hazell 2023 / Heiding 2024).
  - `SALES-CLAIM-003`: Claims de fallo del modelo punitivo tradicional (`status: pending_evidence_debt`, dependiente de Sasse et al. 2001 / Cranor 2008).
  - `SALES-CLAIM-006`: Claims de calibración humano-IA (`status: pending_evidence_debt`, dependiente de Lee & See 2004).

---

## 8. Catálogo Maestro de Deuda (`EVIDENCE_DEBT.md`)

El archivo `v3/brain/01_research_and_lenses/librarian/EVIDENCE_DEBT.md` desglosa:
- **4 Referencias Internas Propias:**
  - `SRC-FARO-V3PLUS-CANON-2026` -> Mapear a `grounded_in: [GAME-FARO-SIMULATION-V3PLUS]`.
  - `SRC-WEBINAR-INTERNAL-2026` -> Mapear a `evidenced_by: [EVD-WEBINAR-V1]`.
  - `SRC-DOOR-RELATIONS-2026` -> Mapear a `grounded_in: [DOOR-RELATIONS]`.
  - `SRC-DSAD-MASTER-2026` -> Mapear a `grounded_in: [CON-THESIS]`.
- **32 Fuentes Externas en Estado `unresolved_identity`:**
  - **Tier 1 (Prioridad Alta - 6 fuentes):** Hazell (2023), Heiding et al. (2024), Sasse et al. (2001), Cranor (2008), Sailer & Homner (2020), Lee & See (2004).
  - **Tier 2 (Prioridad Media - 8 fuentes):** Green & Swets (1966), Maddux & Rogers (1983), Ajzen (1991), Ericsson et al. (1993), Sweller (1988), Tudoreanu & Kraemer (2008), Caputo et al. (2014), Kirkpatrick (1996).
  - **Tier 3 (Prioridad Normal - 18 fuentes):** Francia et al. (2024), Wash (2010), Deterding et al. (2011), Hamari et al. (2014), Deci & Ryan (2000), Parasuraman et al. (2000), Dzindolet et al. (2003), Gigerenzer & Gaissmaier (2011), Tavis et al. (2020), Alsharnouby et al. (2015), Blandford et al. (2014), Furnham (2010), Kirwan & Ainsworth (1992), Reason (1990), Shedden et al. (2011), Siemens (2005), Tsvetkova et al. (2018), Veprek et al. (2022).

---

## 9. Evidencia de Preservación de Binarios y Cero PDFs

1. **Inspección de Archivos PDF en el Repositorio:**
   - La única presencia de archivos `.pdf` en todo el árbol de trabajo corresponde a los insumos y copias de respaldo históricas existentes previas al proyecto actual (`Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`, con fecha 10 de agosto de 2026).
   - **Cero (0) PDFs nuevos fueron descargados, añadidos o rastreados en Git durante las Fases −1, 0 y 1.**
2. **Estado de `v3/research_library/LIBRARY_MANIFEST.yaml`:**
   - Declarado con `entries: []`, garantizando que ninguna obra cerrada o con derechos reservados ha sido ingresada en el repositorio sin la licencia y aprobación correspondiente.

---

## 10. Lista de Decisiones Pendientes para Fase 2 (Revisión Humana y de ChatGPT)

Para la eventual autorización de la Fase 2, se requiere decisión sobre:
1. **Migración de las 5 Source Notes Existentes al Schema v2:**
   - Confirmar si se aplica la migración a las 5 notas existentes (`SRC-KAHNEMAN-2011`, `SRC-ROGERS-1975`, `SRC-VAFA-2026`, `SRC-VERIZON-DBIR-2026`, `SRC-WOOD-NEAL-2007`).
   - Validar la resolución de la edición editorial concreta de Kahneman (ISBN `978-0374275631` / tapa dura 2011) en cumplimiento de C3.
2. **Priorización de la Primera Ola de Ingesta (Tier 1):**
   - Confirmar si la Ola 1 de ingesta en Fase 2 abordará las 6 fuentes de Tier 1 (`SRC-HAZELL-2023`, `SRC-HEIDING-ETAL-2024`, `SRC-SASSE-BROSTOFF-WEIRICH-2001`, `SRC-CRANOR-2008`, `SRC-SAILER-HOMNER-2020`, `SRC-LEE-SEE-2004`) para habilitar la liberación condicionada de los 3 sales claims suspendidos.
3. **Política de Almacenamiento Físico vs Referencia Externa:**
   - Ratificar que las fuentes de acceso cerrado permanezcan como `storage_type: external_reference` con su DOI/URL canónica, sin persistir archivos binarios en el repositorio Git.
4. **Criterios de Promoción de Candidate Claims:**
   - Aprobar el flujo de triaging donde ningún agente promueve claims a canon y se requiere firma explícita en `approved_by_humans`.

---

```text
CHECKPOINT FASE 1: 100% CUMPLIDO. SISTEMA LISTO PARA DICTAMEN DE AUDITORÍA EXTERNA.
```
