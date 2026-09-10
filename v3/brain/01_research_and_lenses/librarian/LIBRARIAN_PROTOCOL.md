# PROTOCOLO DEL AGENTE BIBLIOTECARIO
## Ciclo de Curaduría Científica e Integridad Epistemológica

> **Versión:** 2.0.0-PHASE-2B  
> **Rol:** Curaduría, extracción, clasificación y trazabilidad de evidencia externa en el Cerebro V3.

---

### Flujo Operativo Estándar (13 Etapas Operacionales):

1. **RECEIVE:** Detección y recepción de nuevo documento o insumo bibliográfico en `/v3/research_library/inbox/`.
2. **DEDUPLICATE:** Comprobar DOI, ISBN, hash SHA-256 raw-byte y título exacto mediante `v3/scripts/librarian_dedupe.js` para prevenir duplicados.
3. **ASSIGN ID:** Asignar identificador canónico formal según convención `SRC-AUTOR-AÑO` (ej. `SRC-VAFA-2026`).
4. **CLASSIFY & MAP TOPICS:** Asignar etiquetas controladas conforme a `RESEARCH_TAXONOMY.md` aplicando `topic_mappings.json` para topics legacy con gobernanza unívoca y formalizada.
5. **INGEST & STORE:** Registro formal en `v3/research_library/LIBRARY_MANIFEST.yaml` definiendo `storage_type` (`external_reference` o archivo local) sin versionar PDFs en Git salvo insumos históricos certificados.
6. **READ & EXTRACT:** Lectura estructurada profunda (`abstract_reviewed` o `full_text_reviewed`) delimitando taxativamente los límites de lo que la fuente respalda y NO respalda.
7. **CREATE SOURCE NOTE:** Generar ficha Source Note atómica en `01_research_and_lenses/sources/SRC-XXXX.md` cumpliendo estrictamente `source_note_schema_v2.json` (32 propiedades top-level, Secciones 1 a 8).
8. **EXTRACT CANDIDATE CLAIMS:** En Sección 9 (`# 9. Candidate claims proposed`), proponer claims candidatos (nunca auto-canonizarlos), utilizando los 12 campos obligatorios, manteniéndolos estrictamente en `triage_status: pending` con `target_claim_id: null` y `decided_by_humans: []`. Prohibida la auto-promoción o canonización autónoma por agentes.
9. **BUILD INDEXES & DERIVATIVES:** Ejecutar `v3/scripts/build_candidate_claims_index.js` y `v3/scripts/build_claims_index.js` para sincronizar los índices derivados determinísticos sin drift.
10. **UPDATE BIBLIOGRAPHY & REGISTRY:** Ejecutar `v3/scripts/build_bibliography.js` para regenerar `BIBLIOGRAPHY_MASTER.md` y comprobar consistencia con `registry.json`.
11. **EXPAND EVIDENCE GRAPH:** Ejecutar `v3/scripts/build_evidence_graph.js` incorporando nodos no canónicos de tipo `candidate_claim` y aristas de propuesta hacia matrices (`CLM-MATRIX-*`) sin contaminar el registro canónico.
12. **AUDIT & GATE INTEGRITY:** Ejecutar `v3/scripts/audit_brain.js` (modos migration y strict) y `v3/scripts/verify_containment_invariants.js` garantizando 100% de reglas de contención y suites negativas.
13. **MONITOR & REVISION:** Supervisión continua del acervo bibliográfico dividida en dos dimensiones:
    - **Validación Local Automatizada (PASSING):** Comprobación continua en pipeline de cadencias de revisión (`review_cadence_months`), fechas de verificación (`last_verified`), consistencia temporal (`next_review`), hashes criptográficos y detección de drift.
    - **Revisión Externa y Retractaciones (SPECIFIED / MANUAL):** Protocolo de auditoría semestral con supervisión humana experta para contrastar bases vivas de retractaciones científicas (Retraction Watch / Crossref) y adjudicar o reclasificar claims.
