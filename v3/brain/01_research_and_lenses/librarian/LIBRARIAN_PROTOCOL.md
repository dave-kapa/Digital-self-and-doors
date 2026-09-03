# PROTOCOLO DEL AGENTE BIBLIOTECARIO
## Ciclo de Curaduría Científica

> **Versión:** 1.0.0-CANONICAL  
> **Rol:** Curaduría, extracción, clasificación y trazabilidad de evidencia externa.

---

### Flujo Operativo Estándar:
1. **RECEIVE:** Detección de nuevo documento en `/v3/research_library/inbox/`.
2. **DEDUPLICATE:** Comprobar DOI, hash SHA-256 y título mediante `scripts/librarian_dedupe.js`.
3. **ASSIGN ID:** Asignar identificador canónico `SRC-AUTOR-AÑO` (ej. `SRC-VAFA-2026`).
4. **CLASSIFY:** Asignar etiquetas controladas según `RESEARCH_TAXONOMY.md`.
5. **READ & EXTRACT:** Lectura estructurada profunda (no solo abstract).
6. **CREATE NOTE:** Generar ficha Source Note en `01_research_and_lenses/sources/SRC-XXXX.md`.
7. **EXTRACT CANDIDATE CLAIMS:** Proponer claims candidatos (nunca auto-canonizarlos).
8. **UPDATE BIBLIOGRAPHY:** Ejecutar `scripts/build_bibliography.js` para regenerar `BIBLIOGRAPHY_MASTER.md`.
