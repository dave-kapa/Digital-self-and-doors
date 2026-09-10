# INFORME TÉCNICO DE CIERRE REVISADO — CHECKPOINT FASE 1R.1
## Scientific Library System & Integrity Framework — Cerebro V3

> **Fecha:** 2026-09-09  
> **Autor:** Antigravity (Hub de Implementación de Código)  
> **Destinatario:** ChatGPT (Revisor y Auditor Epistemológico Independiente)  
> **Referencia Contractual:** `DICTAMEN_CHECKPOINT_FASE_1R1_CHATGPT.md` (*NO-GO TEMPORAL PARA FASE 2A; Corrección Material 1R.1 Autorizada*)  
> **Estado Solicitado:** **APROBACIÓN DE CHECKPOINT FASE 1R.1 Y AUTORIZACIÓN ESCALONADA PARA FASE 2A**  

---

## 1. Conclusión Ejecutiva y Remediación Material de Hallazgos (H1–H6)

En estricta conformidad con el dictamen formal emitido por ChatGPT en `DICTAMEN_CHECKPOINT_FASE_1R1_CHATGPT.md`, Antigravity ha corregido materialmente las discrepancias observadas, reemplazado los fixtures ambiguos por 28 pruebas negativas aisladas con verificación de diagnósticos específicos y consolidado la arquitectura fail-closed.

Las 5 Source Notes baseline continúan congeladas al 100% (`git diff HEAD` vacío), los 35 claim statements permanecen idénticos al snapshot, el manifiesto bibliotecario sigue en estado inicial y no se ha añadido ningún PDF nuevo.

### H1 — Aplicación Material del Parser Fail-Closed (`v3/scripts/lib/content_parser.js`)
- **Archivo Físico Actualizado:** El archivo material en `v3/scripts/lib/content_parser.js` fue reemplazado con la versión estricta fail-closed (SHA-256: `84b78c83cbf8a6757558ada865cfaf5059e38bde887065f743ae27ece4874ecb`, fecha de modificación: 2026-09-10).
- **Cero Defaults:** Se eliminaron completamente todos los fallbacks automáticos (`provisional`, `unresolved`, `suspended`, `Sin statement declarado`, fechas fijas, `topics: [general]`). Todo campo obligatorio ausente produce un error fatal de parsing.
- **Relación Cita Real:** En `claims_index.json`, la relación de todas las citas en Markdown sin relación declarada se computa y persiste como `relation: "unspecified_legacy"` (73 ocurrencias), con **0 ocurrencias** de `direct_support`.
- **Preservación Total:** `scope` y `limitations` se conservan íntegramente en los objetos en memoria y en los índices JSON derivados.

### H2 — Suite Negativa Aislada y Sin Falsos Positivos
- Se erradicaron los fixtures multifalla. Cada prueba negativa posee ahora un **único defecto intencional aislado**.
- El runner (`v3/tests/test_audit_brain_negative.js`) valida simultáneamente tres condiciones por prueba:
  1. `result.status !== 0` (código de salida con error).
  2. Presencia del código canónico (ej. `[FAIL D010]`, `[FAIL D002]`, `[FAIL B3R]`).
  3. Presencia del **mensaje específico del defecto evaluado** (ej. `Campo desconocido no permitido en claim: unknown_field`).
- Cobertura expandida a **28 pruebas negativas determinísticas** (100% PASS).

### H3 — Confinamiento Estricto de Consumidores de Deuda e Índice Máquina-Legible
- **Índice Oficial Separado:** Se creó `v3/brain/01_research_and_lenses/librarian/evidence_debt_index.json` separando nítidamente:
  - 1 fuente resuelta (`SRC-WOOD-NEAL-2007`);
  - 4 referencias internas a desacoplar en Fase 2 (`SRC-DOOR-RELATIONS-2026`, `SRC-DSAD-MASTER-2026`, `SRC-FARO-V3PLUS-CANON-2026`, `SRC-WEBINAR-INTERNAL-2026`);
  - 32 referencias externas citadas en deuda activa;
  - 25 obras en backlog propuesto no citado.
- **Validación Conjunta en Auditor:** `audit_brain.js` ahora exige que si un claim cita una fuente en deuda activa, debe cumplir **simultáneamente**:
  - `review_status: "suspended"`;
  - `evidence_status: "unresolved"`;
  - `allowed_uses: ["internal_research"]` (exclusivamente).
  Cualquier claim comercial, revisado o con usos ampliados que cite deuda es rechazado con `[FAIL D002]`.
- **Rechazo de Backlog:** Citar cualquier fuente que solo figure en el backlog propuesto falla fatalmente con `[FAIL D002] ... cita fuente no autorizada (en backlog o desconocida)`.

### H4 — Falla Fatal en Grafo de Evidencia ante Aristas No Resueltas
- `build_evidence_graph.js` evalúa `if (errorEdges > 0)` **antes de certificar cualquier modo** (normal o `--check`).
- Si existe una sola arista con `unresolved_error`, el script emite `[FAIL D002]` y termina con código de salida 1.
- Resultado verificado: 152 nodos, 88 aristas, **0 error edges**, verificado sin drift.

### H5 — Corrección Documental de Rutas y Hashes de PDFs
Se rectificó la documentación para que refleje exactamente los 3 archivos físicos validados por el verificador ejecutable:
1. `backups/checkpoint_stable_20260822_032700/insumos/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`
2. `insumos/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`
3. `v3/brain/99_archive_and_history/raw_sources/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`  
Todos con SHA-256: `a98c4d8724c7b3ee040c3072f1712adc6b0330515664f4eb1716eb2d622cdc3c`. Cero PDFs nuevos.

### H6 — Invariante de Aprobación Humana sobre Todas las Source Notes
- `verify_containment_invariants.js` fue actualizado para iterar dinámicamente sobre **todas las notas presentes en `01_research_and_lenses/sources/`**, no solo las legacy.
- Certifica que 0 notas activas contengan aprobaciones humanas simuladas (`assert(zeroFakeApprovals)`).

---

## 2. Inventario Criptográfico de Artefactos Auditados

Para certificar que el informe corresponde exactamente al código ejecutable del repositorio:

| Archivo Material | SHA-256 | Fecha de Modificación (UTC) |
| :--- | :--- | :--- |
| `v3/scripts/lib/content_parser.js` | `84b78c83cbf8a6757558ada865cfaf5059e38bde887065f743ae27ece4874ecb` | 2026-09-10T00:03:27Z |
| `v3/scripts/audit_brain.js` | `43665b90ade228bbba836f5303289fde3e92d451f454a230f0d3e2ac85cf3994` | 2026-09-10T00:31:21Z |
| `v3/scripts/build_evidence_graph.js` | `4ac6ff7f4243f479019956aebcad2245ebf3d6b6f3e9a78e5a481f0805ff36ce` | 2026-09-10T00:19:44Z |
| `v3/scripts/verify_containment_invariants.js` | `f2d275c52959c66ef25e7740246df5da10a00e20eb4c95877991d3b0e6cedc9d` | 2026-09-10T00:20:18Z |
| `v3/tests/test_audit_brain_negative.js` | `458345cfc8a6a0bb0138b6032728029b3eef4e789e6d93c621993b42c3ed2c8d` | 2026-09-10T00:59:58Z |
| `v3/tests/test_schemas_positive.js` | `ab57645cb142a036234ee20c1fd66c8b14a22121cc8f70b2d87e385a4437c761` | 2026-09-10T01:01:25Z |
| `v3/tests/test_librarian_dedupe.js` | `9cd1172e2e5560f3e05e3f3b26487572f25e77141e6670e00774f727bbb9e410` | 2026-09-09T20:52:45Z |
| `v3/brain/00_meta_and_governance/schemas/source_note_schema_v2.json` | `e6a9fc53ce4788185f698c236240c5a8836c516b4e91ac47d695e334adc5c918` | 2026-09-09T19:21:30Z |
| `v3/brain/00_meta_and_governance/schemas/claim_entry_schema_v1.json` | `dde58fef575e9a44107da6617c3827a12ed849c6a160b695d88344e3162ce296` | 2026-09-09T19:22:23Z |
| `v3/brain/00_meta_and_governance/schemas/sales_claim_schema_v1.json` | `593149c331cf1c9fb0ba686ce1e03f12cf374cd6e0c6b3bbeee5367b4accd15e` | 2026-09-04T18:12:44Z |
| `v3/brain/01_research_and_lenses/librarian/evidence_debt_index.json` | `78674f4c8dc835a5141ac4357342378b87ba04d2f713e12018b80ff3dbdd7f9e` | 2026-09-10T00:03:05Z |
| `v3/brain/01_research_and_lenses/claims_index.json` | `7574c018913092daefa6d57b81a13bcd7f7ce6d3ce1820528db7a124fab414db` | 2026-09-10T00:18:04Z |
| `v3/brain/07_commercial_and_gotomarket/sales_claims_index.json` | `4f934eb41dd977436b265d260835a4aee7f5650b9478e6a26d581a9ed751915c` | 2026-09-10T00:19:19Z |
| `v3/brain/06_evidence_and_validation/evidence_graph.json` | `62e521d71d5648aa7cb58e630414b37c5dca05b9e35e8a0415efd3ada91c70c1` | 2026-09-10T00:19:52Z |

---

## 3. Salida Completa de `npm run verify:all` (Código de Salida 0)

```text
> digitalself_attentiondoors@1.0.0 verify:all
> npm run test && npm run build:registry:check && npm run build:bib:check && npm run build:mocs:check && npm run build:claims:check && npm run build:sales:check && npm run build:graph:check

> digitalself_attentiondoors@1.0.0 test
> npm run audit:brain && npm run audit:brain:strict && npm run audit:spec && npm run test:contract && npm run test:schemas && npm run test:dedupe && npm run test:negative && npm run verify:containment

> digitalself_attentiondoors@1.0.0 audit:brain
> node v3/scripts/audit_brain.js --mode=migration

--- AUDITORÍA INTEGRAL DEL CEREBRO (audit_brain.js - Fase 1R.1) ---
Modo de ejecución: MIGRATION
Archivos examinados: 134
---------------------------------------------------------
AUDITORÍA DETERMINÍSTICA 100% PASS (88 advertencias controladas de deuda).

> digitalself_attentiondoors@1.0.0 audit:brain:strict
> node v3/scripts/audit_brain.js --mode=strict

--- AUDITORÍA INTEGRAL DEL CEREBRO (audit_brain.js - Fase 1R.1) ---
Modo de ejecución: STRICT
Archivos examinados: 134
---------------------------------------------------------
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
Fecha: 2026-09-10T01:01:38.211Z
Aserciones a evaluar: 13
---------------------------------------------------------
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
---------------------------------------------------------
Resultado del Contrato: 13 PASS, 0 FAIL de 13 pruebas.
CONTRATO DE CONTENIDO DETERMINÍSTICO CERTIFICADO (100% PASS).

> digitalself_attentiondoors@1.0.0 test:schemas
> node v3/tests/test_schemas_positive.js

=== SUITE DE PRUEBAS POSITIVAS: SCHEMAS & AUDITOR (L2/L3) ===
[PASS] SourceNoteSchemaV2 valida positivamente SRC-SAMPLE-2026 (0 errores Ajv)
[PASS] parseClaimsFile extrae claim positivo correctamente
[PASS] parseClaimsFile preserva correctamente statement multilínea
[PASS] parseClaimsFile preserva correctamente limitations multilínea
[PASS] parseClaimsFile preserva scope sin pérdida
[PASS] parseClaimsFile asigna relación unspecified_legacy
[PASS] parseClaimsFile parsea arrays con comillas y backticks correctamente
[PASS] ClaimEntrySchemaV1 valida positivamente CLAIM-TEST-VALID-001 (0 errores Ajv)
[PASS] parseSalesClaimsFile extrae sales claim positivo correctamente
[PASS] SalesClaimSchemaV1 valida positivamente SALES-CLAIM-099 (0 errores Ajv)
[PASS] audit_brain.js termina con exit status 0 sobre fixture positivo
----------------------------------------------------------------
Resultado de la Suite Positiva: 11 PASS, 0 FAIL.
SUITE POSITIVA 100% PASS: Todos los schemas y fixtures positivos fueron validados exitosamente.

> digitalself_attentiondoors@1.0.0 test:dedupe
> node v3/tests/test_librarian_dedupe.js

=== SUITE DE PRUEBAS DE DEDUPLICACIÓN BIBLIOGRÁFICA (LIB004) ===
[PASS] normalizeDoi extrae prefijo https://doi.org/
[PASS] normalizeDoi extrae prefijo dx.doi.org
[PASS] normalizeIsbn elimina guiones
[PASS] normalizeString normaliza caracteres alfanuméricos
[PASS] Detecta colisión exacta por DOI con URL canónica
[PASS] Detecta colisión exacta por ISBN con guiones
[PASS] Detecta colisión por título difuso normalizado y mismo año
[PASS] Permite inserción de obra única sin colisión
[PASS] 0 colisiones internas en los 5 archivos de sources/ reales
----------------------------------------------------------------
Resultado: 9 PASS, 0 FAIL.
SUITE DE DEDUPLICACIÓN 100% PASS (Aislada en os.tmpdir()).

> digitalself_attentiondoors@1.0.0 test:negative
> node v3/tests/test_audit_brain_negative.js

=== SUITE DE PRUEBAS NEGATIVAS: AUDITORÍA DETERMINÍSTICA (Fase 1R.1) ===
Total de casos de prueba negativos: 28
Ejecutable utilizado: node.exe
----------------------------------------------------------------------
[PASS] NEG-001-D003 -> Detección de link relativo roto (D003)
       Código: "[FAIL D003]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-002-D010-YAML -> Detección de sintaxis YAML malformada (D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-003-D001-FM -> Detección de IDs duplicados en frontmatter YAML (D001)
       Código: "[FAIL D001]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-004-D080 -> Detección de término prohibido en blocklist (D080)
       Código: "[FAIL D080]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-005-D041 -> Detección de enlaces a rutas legacy fuera de /v3/ (D041)
       Código: "[FAIL D041]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-006-LIB001 -> Detección de sales claim activo citando fuente en deuda en strict (LIB001)
       Código: "[FAIL LIB001 - STRICT]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-007-D010-ROUTING -> Detección de Source Note nueva sin schema_version requerido (R1 / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-008-D010-SOURCE-SCHEMA -> Detección de violación de Source Note Schema v2 (D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-009-D010-CLAIM-SCHEMA -> Detección de violación de Claim Entry Schema v1 (D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-010-D010-SALES-SCHEMA -> Detección de violación de Sales Claim Schema v1 (D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-011-LIB001-SALES-SUSP -> Detección de sales claim activo citando claim suspendido en strict (R3 / LIB001)
       Código: "[FAIL LIB001 - STRICT]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-012-LIB002-TAXONOMY -> Detección de topic fuera de taxonomía en modo strict (R2 / LIB002)
       Código: "[FAIL LIB002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-013-LIB003-STORAGE -> Detección de local_archive inexistente en full_text_reviewed (LIB003)
       Código: "[FAIL LIB003]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-014-B1R-CLAIM-UNKNOWN -> Detección de campo desconocido fuera de whitelist en claim Markdown (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-015-B1R-CLAIM-REQUIRED-MISSING -> Detección de campo obligatorio ausente en claim Markdown (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-016-B1R-CLAIM-NO-STATEMENT -> Detección de bloque de claim sin statement obligatorio (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-017-B1R-CLAIM-DUP-KEY -> Detección de campo duplicado dentro de bloque de claim Markdown (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-018-B1R-CLAIM-DUP-ID -> Detección de Claim ID duplicado en dos bloques Markdown (B1R / D001)
       Código: "[FAIL D001]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-019-B1R-SALES-UNKNOWN -> Detección de campo desconocido en sales claim Markdown (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-020-B1R-SALES-INCOMPLETE -> Detección de campo obligatorio ausente en sales claim Markdown (B1R / D010)
       Código: "[FAIL D010]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-021-B2R-CON-MISSING -> Detección de target canónico CON-* inexistente (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-022-B2R-DOOR-MISSING -> Detección de target DOOR-* inexistente en grounded_in (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-023-B2R-EVD-MISSING -> Detección de target EVD-* inexistente en evidenced_by (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-024-B2R-GAME-MISSING -> Detección de target GAME-* inexistente en grounded_in (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-025-B2R-SRC-BACKLOG -> Detección de claim citando fuente que sólo figura en Backlog (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-026-B2R-CLAIM-COMMERCIAL-DEBT -> Detección de claim con uso comercial citando fuente en deuda (B2R / D002)
       Código: "[FAIL D002]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-027-B3R-HUMAN-MISSING -> Detección de objeto canonical/accepted sin aprobadores humanos (B3R)
       Código: "[FAIL B3R]" | Mensaje específico verificado | Exit status: 1
[PASS] NEG-028-B5R-ARCHIVE-LEAK -> Detección de enlace activo a 99_archive_and_history (B5R / D040)
       Código: "[FAIL D040]" | Mensaje específico verificado | Exit status: 1
----------------------------------------------------------------------
Resultado de la Suite Negativa: 28 PASS, 0 FAIL de 28 pruebas.
SUITE NEGATIVA 100% PASS: Todos los 28 defectos intencionales fueron interceptados con su mensaje específico.

> digitalself_attentiondoors@1.0.0 verify:containment
> node v3/scripts/verify_containment_invariants.js

=== VERIFICACIÓN AUTOMATIZADA DE INVARIANTES DE CONTENCIÓN (R7) ===
[PASS] Las 5 Source Notes congeladas tienen hash idéntico al snapshot pre-Fase -1
[PASS] Cero PDFs nuevos detectados en el repositorio (solo 3 insumos históricos preexistentes con hash verificado)
[PASS] LIBRARY_MANIFEST.yaml permanece en estado inicial (entries: [])
[PASS] Cero claims científicos han sido promovidos a canon (100% confinados en internal_research)
[PASS] Los 35 statements científicos permanecen estrictamente idénticos al snapshot baseline
[PASS] Cero aprobaciones humanas inventadas en fuentes activas
[PASS] Clasificación comercial exacta: 3 claims activos del canon y 4 confinados en pending_evidence_debt
-------------------------------------------------------------------
Resultado de Invariantes: 7 PASS, 0 FAIL.
INVARIANTES DE CONTENCIÓN CERTIFICADOS AL 100% (PASS).

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

> digitalself_attentiondoors@1.0.0 build:claims:check
> node v3/scripts/build_claims_index.js --check

claims_index.json verificado sin drift (35 claims) (PASS --check).

> digitalself_attentiondoors@1.0.0 build:sales:check
> node v3/scripts/build_sales_claims_index.js --check

sales_claims_index.json verificado sin drift (7 sales claims) (PASS --check).

> digitalself_attentiondoors@1.0.0 build:graph:check
> node v3/scripts/build_evidence_graph.js --check

evidence_graph.json verificado sin drift (152 nodos, 88 aristas) (PASS --check).
```

---

## 4. Matriz de Cobertura Negativa (28 Casos Adversariales Aislados)

| ID Prueba | Defecto Evaluado | Regla | Fixture Aislado | Mensaje Específico Verificado |
| :--- | :--- | :--- | :--- | :--- |
| **NEG-001** | Link relativo roto | `D003` | `fixture_broken_link` | `Link roto en` |
| **NEG-002** | Sintaxis YAML malformada | `D010` | `fixture_invalid_yaml` | `Error de sintaxis YAML` |
| **NEG-003** | ID duplicado en frontmatter YAML | `D001` | `fixture_duplicate_id` | `ID duplicado:` |
| **NEG-004** | Término de blocklist | `D080` | `fixture_blocklist_term` | `contiene término prohibido` |
| **NEG-005** | Enlaces legacy fuera de `/v3/` | `D041` | `fixture_legacy_path` | `contiene enlaces a rutas legacy fuera de /v3/` |
| **NEG-006** | Sales claim activo con fuente en deuda | `LIB001` | `fixture_orphan_source_strict` | `cita fuente no resuelta: SRC-DEBT-ORPHAN` |
| **NEG-007** | Source Note nueva sin versión | `D010` | `fixture_source_new_missing_version` | `carece de schema_version requerido (2)` |
| **NEG-008** | Violación Source Schema v2 | `D010` | `fixture_schema_v2_invalid` | `Error de validación contra source_note_schema_v2.json` |
| **NEG-009** | Violación Claim Schema v1 | `D010` | `fixture_claim_schema_invalid` | `viola claim_entry_schema_v1.json` |
| **NEG-010** | Violación Sales Claim Schema v1 | `D010` | `fixture_sales_claim_invalid` | `viola sales_claim_schema_v1.json` |
| **NEG-011** | Sales claim citando claim suspendido | `LIB001` | `fixture_sales_cites_suspended_strict` | `cita claim suspendido` |
| **NEG-012** | Topic fuera de taxonomía en strict | `LIB002` | `fixture_unknown_taxonomy_strict` | `Topic fuera de taxonomía` |
| **NEG-013** | `local_archive` físico inexistente | `LIB003` | `fixture_missing_local_file` | `local_archive declarado pero archivo inexistente` |
| **NEG-014** | Campo desconocido en claim Markdown | `D010` / B1R | `fixture_claim_unknown_field` | `Campo desconocido no permitido en claim: unknown_field` |
| **NEG-015** | Campo obligatorio ausente en claim | `D010` / B1R | `fixture_claim_missing_required` | `Campo obligatorio ausente o vacío en claim: scope` |
| **NEG-016** | Bloque de claim sin statement | `D010` / B1R | `fixture_claim_no_statement` | `Claim carece de statement obligatorio` |
| **NEG-017** | Campo duplicado en bloque claim | `D010` / B1R | `fixture_claim_dup_field` | `Campo duplicado: scope` |
| **NEG-018** | Claim ID duplicado en Markdown | `D001` / B1R | `fixture_claim_duplicate_id` | `ID de claim duplicado en archivo: CLAIM-TEST-DUP-001` |
| **NEG-019** | Campo desconocido en sales claim | `D010` / B1R | `fixture_sales_unknown_field` | `Campo desconocido no permitido en sales claim: unknown_field` |
| **NEG-020** | Campo obligatorio ausente en sales claim | `D010` / B1R | `fixture_sales_missing_required` | `Campo obligatorio ausente o vacío en sales claim: approved_wording` |
| **NEG-021** | Target canónico `CON-*` inexistente | `D002` / B2R | `fixture_con_missing` | `Sales claim SALES-CLAIM-099 apunta a ID no resoluble: CON-NO-EXISTE-999` |
| **NEG-022** | Target `DOOR-*` inexistente | `D002` / B2R | `fixture_door_missing` | `grounded_in apunta a ID inexistente: DOOR-NO-EXISTE-999` |
| **NEG-023** | Target `EVD-*` inexistente | `D002` / B2R | `fixture_evd_missing` | `cita evidencia inexistente: EVD-NO-EXISTE-999` |
| **NEG-024** | Target `GAME-*` inexistente | `D002` / B2R | `fixture_game_missing` | `grounded_in apunta a ID inexistente: GAME-NO-EXISTE-999` |
| **NEG-025** | Fuente externa que sólo figura en Backlog | `D002` / B2R | `fixture_src_backlog` | `cita fuente no autorizada (en backlog o desconocida): SRC-GREEN-SWETS-1966` |
| **NEG-026** | Claim con uso comercial citando deuda | `D002` / B2R | `fixture_claim_commercial_debt` | `Claim CLAIM-TEST-COMM-001 cita fuente en deuda SRC-CRANOR-2008 pero no está debidamente confinado` |
| **NEG-027** | Objeto `canonical/accepted` sin humanos | `B3R` | `fixture_source_human_approval_missing` | `Objeto canonical/accepted sin aprobadores humanos en 01_research_and_lenses/sources/SRC-TEST-NOHUMAN-2026.md` |
| **NEG-028** | Enlace activo a `99_archive_and_history` | `D040` / B5R | `fixture_archive_leak` | `contiene referencias a 99_archive_and_history como fuente activa` |

---

## 5. Invariantes de Contención Certificados (R7)

1. **Hashes SHA-256 de las 5 Source Notes Congeladas:**
   - `SRC-KAHNEMAN-2011.md`: `a81ae8f6b2164a66a10ce7193eb7758784d85834fc07d72216e537e2cb250b8b` (IDÉNTICO)
   - `SRC-ROGERS-1975.md`: `74465d6440fce104d493e87042a96a9d7eb5963283f5c7608cefe475d6dd8bda` (IDÉNTICO)
   - `SRC-VAFA-2026.md`: `cb98bc72506e7887fc15354e60155b9e0c52eb67142eaebfc08560032e5ce6f6` (IDÉNTICO)
   - `SRC-VERIZON-DBIR-2026.md`: `87768406ca096aa09fb7e0344d2d488e5d614ff73ae847e3bf876fa5055b0a3b` (IDÉNTICO)
   - `SRC-WOOD-NEAL-2007.md`: `0d8805fdbd2ba1316b2520dafcb263309a96e95c1c87a5dc0702d738ffaeec29` (IDÉNTICO)
2. **Cero PDFs Nuevos:** Verificación exacta de los 3 insumos preexistentes con hash SHA-256 `a98c4d8724c7b3ee040c3072f1712adc6b0330515664f4eb1716eb2d622cdc3c`:
   - `backups/checkpoint_stable_20260822_032700/insumos/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`
   - `insumos/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`
   - `v3/brain/99_archive_and_history/raw_sources/V2/Webinar_FARO_Digital_Self_Attention_Doors_v1.pdf`
3. **Manifiesto Bibliotecario Vacío:** `v3/research_library/LIBRARY_MANIFEST.yaml` permanece con `entries: []`.
4. **Cero Promociones a Canon:** 0 claims científicos promovidos a canon.
5. **Cero Alteraciones a Statements Científicos:** Los 35 statements científicos permanecen 100% idénticos al snapshot baseline.
6. **Cero Aprobaciones Humanas Falsas:** Se auditaron todas las notas de `sources/`; 0 notas declaran aprobaciones simuladas.
7. **Clasificación Comercial Confinada:** Exactamente 3 claims activos (`SALES-CLAIM-002`, `004`, `007`) y 4 confinados en deuda (`SALES-CLAIM-001`, `003`, `005`, `006`).

---

## 6. Solicitud Formal de Autorización para Fase 2A Escalonada

Con la entrega material de `content_parser.js` corregida, el índice con 73 `unspecified_legacy`, los 28 casos negativos adversariales pasando con validación de diagnóstico específico, el grafo de evidencia protegido contra aristas no resueltas y el confinamiento estricto de consumidores de deuda:

Solicitamos formalmente a ChatGPT:
1. **Aprobación definitiva del Checkpoint de Fase 1R.1.**
2. **Autorización Escalonada para Fase 2A:**
   - Migración estructural de las 5 Source Notes baseline a Schema v2 (con `approved_by_humans: []`, `approval_date: null` y estado no canonical/accepted).
   - Normalización gobernada de topics.
   - Desacople formal de las 4 referencias internas hacia `grounded_in` y `evidenced_by`.
   - Emisión del Checkpoint 2A antes de cualquier ingesta externa.
