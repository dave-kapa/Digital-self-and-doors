# RUNBOOK DE REANUDACIÓN OPERATIVA — SCIENTIFIC LIBRARY SYSTEM
## Digital Self & Attention Doors — Cerebro de Conocimiento V3

**Propósito:** Proporcionar la secuencia procedimental exacta y autónoma para que cualquier agente o equipo humano reanude los trabajos de la biblioteca científica sin requerir contexto de sesiones previas.  
**Marco de Gobernanza:** Pausa exclusiva de la línea de implementación del *Scientific Library System*. El *Cerebro de Conocimiento V3* permanece plenamente activo en su dimensión comercial (Brief FARO).  
**Principio Rector:** *Biblioteca científica pausada; cerebro activo en la línea comercial FARO; implementación técnica del brief aislada; coherencia conceptual y trazabilidad compartidas.*  

---

## Secuencia Paso a Paso de Reanudación

### Paso 1: Localización del Checkpoint de Pausa y Baseline Histórico
1. Inspeccionar el archivo canónico de checkpoint:
   `docs/SCIENTIFIC_LIBRARY_PAUSE_CHECKPOINT.md`
2. Inspeccionar el estado máquina-legible:
   `docs/scientific_library_pause_state.json`
3. Identificar el **baseline histórico del subsistema bibliotecario**:
   - Commit baseline: `c4fbaf9eda1ba163359766756a7f93997d89ea82`
   - Tree baseline: `50518e903e5c594768ead4af8ed42a7c5259899f`
   *(Nota fundamental: `c4fbaf9` es el baseline histórico de la biblioteca al momento de la pausa, NO el HEAD obligatorio perpetuo del repositorio).*

### Paso 2: Verificación de Integridad de Git, Refs Actuales y Genealogía
Ejecutar en la terminal del repositorio:
```bash
git status
git rev-parse HEAD
git rev-parse main
git rev-parse origin/main
```
1. Comprobar que el working tree esté 100% limpio (`git status --porcelain` vacío).
2. Verificar la relación genealógica con el baseline histórico de la biblioteca:
   ```bash
   git merge-base --is-ancestor c4fbaf9eda1ba163359766756a7f93997d89ea82 HEAD
   ```
   El commit actual debe ser igual o descendiente directo de `c4fbaf9`.

### Paso 3: Examen de Commits Posteriores y Preservación del Trabajo Comercial
Si `main` avanzó más allá de `c4fbaf9` debido al desarrollo del brief de FARO u otros avances comerciales:
1. Inspeccionar todos los commits posteriores mediante:
   ```bash
   git log c4fbaf9..HEAD --stat --oneline
   ```
2. **Preservar los cambios comerciales legítimos:**
   - Comprobar que los commits posteriores correspondan a la dimensión comercial (`07_commercial_and_gotomarket/`), evidencias (`06_evidence_and_validation/`) o producto.
   - **PROHIBICIÓN ESTRICTA:** **NUNCA ejecutar un `git reset` automático** hacia `c4fbaf9` para "revertir" los avances del repositorio. Una divergencia o avance debe investigarse y entenderse, jamás destruirse.
3. Verificar que los archivos protegidos de la biblioteca científica permanezcan intactos:
   - `v3/brain/01_research_and_lenses/sources/` (5 notas semilla en `status: review`).
   - `v3/brain/01_research_and_lenses/candidate_claims_index.json` (16 candidatos en `pending`).
   - `v3/brain/01_research_and_lenses/librarian/topic_mappings.json` (15 reglas en `pending_review`).
   - `v3/brain/01_research_and_lenses/claims/` (35 statements protegidos).
   - `v3/research_library/LIBRARY_MANIFEST.yaml` (`entries: []`).
4. Ejecutar el pipeline de integridad:
   ```bash
   npm run verify:all
   ```
   Deben pasar los 18 controles (18/18 PASS, 0 FAIL).

### Paso 4: Determinación del Estado de Gate 2C-1
1. Comprobar la existencia de los cinco artefactos de Gate 2C-1 en el directorio externo `outputs/`:
   - `EXPEDIENTES_REVISION_FUENTES_FASE_2C.md`
   - `MATRIZ_RECOMENDACIONES_TRIAJE_16_CANDIDATOS.md`
   - `PROPUESTAS_REVISION_15_TOPIC_MAPPINGS.md`
   - `BORRADOR_ACTA_DECISION_HUMANA_FASE_2C.md`
   - `ENTREGABLE_GATE_2C_1_ANTIGRAVITY.md`
2. Verificar sus hashes SHA-256 contra los valores certificados en `docs/SCIENTIFIC_LIBRARY_PAUSE_CHECKPOINT.md`.
3. Confirmar que **ninguno** de estos cinco archivos fue introducido al repositorio Git (deben residir exclusivamente en `outputs/`).

### Paso 5: Auditoría Previa a Gate 2C-H
Si los cinco artefactos existen:
1. Someterlos (o verificar el dictamen previo emitido) a la revisión de ChatGPT y del usuario.
2. Confirmar que las recomendaciones de los 16 candidatos distingan:
   - 8 `promote` (con borradores de claims de 16 campos estrictos que validan Ajv contra `claim_entry_schema_v1.json`).
   - 6 `merge` (con claims receptoras exactas y vínculos inversos en `derived_from_candidates`).
   - 2 `needs_more_evidence` (con `target_claim_id: null`).
3. Confirmar que las 15 reglas de topic mappings tengan hashes canónicos de objeto completo y validen contra `RESEARCH_TAXONOMY.md`.
4. Confirmar que el borrador de acta permanezca neutral, sin nombres ni opciones prellenadas.

### Paso 6: Reanudación si Gate 2C-1 No Existiera o Requiriera Corrección
Si por alguna razón se determina que Gate 2C-1 debe corregirse:
1. No alterar el repositorio Git.
2. Modificar exclusivamente los documentos en `outputs/`.
3. Regenerar los hashes y actualizar el informe entregable intermedio.

### Paso 7: Protocolo Obligatorio para Abrir Gate 2C-H (Decisión Humana Soberana)
**GATE 2C-H NO PUEDE SER ABIERTO POR UN AGENTE DE FORMA AUTÓNOMA.**
Para abrir Gate 2C-H se requiere:
1. Que un ser humano real revise `BORRADOR_ACTA_DECISION_HUMANA_FASE_2C.md`.
2. Que el humano complete sus decisiones de puño y letra o mediante firma digital, suministrando su nombre y rol.
3. Que el documento completado sea exportado como `ACTA_DECISION_HUMANA_FASE_2C.json` (o Markdown estructurado formal).
4. Que se calcule el SHA-256 canónico del acta firmada.

### Paso 8: Protocolo Obligatorio para Gate 2C-2 (Aplicación Técnica)
Para ejecutar Gate 2C-2 se requiere:
1. Implementar la maquinaria fail-closed:
   - Schema `acta_decision_schema_v1.json`.
   - Parser `parse_acta_decision.js` que compare en tiempo de ejecución los hashes de entrada con los objetos del repo.
   - Parámetro CLI `--acta=<path>` en los scripts de aplicación.
2. Aplicar las transiciones aprobadas:
   - Actualizar `review_status` de notas de fuentes.
   - Promover o fusionar candidatos en las matrices correspondientes.
   - Actualizar `topic_mappings.json` registrando `approved_by_humans` solo en reglas `accepted`.
3. Recompilar todos los índices determinísticos (`build:candidates`, `build:claims`, `build:bib`, `build:registry`, `build:mocs`, `build:graph`).
4. Ejecutar el pipeline de controles ampliado y verificar 100% PASS.
5. Crear commits con los trailers obligatorios:
   `Acta-Decision-SHA256: <hash>`
   `Acta-Decisor: <Nombre y Rol>`

### Paso 9: Condiciones de Detención Inmediata
El agente que reanude **DEBE DETENERSE INMEDIATAMENTE** si:
- Detecta cambios en el working tree no identificados o estado sucio.
- Se detecta una divergencia no documentada entre ramas remotas/locales, o commits no autorizados que hayan modificado archivos protegidos de la biblioteca científica. **Bajo ninguna circunstancia se debe recurrir a un `git reset` automático.** Toda divergencia debe investigarse y reportarse.
- Se intenta prellenar o inferir decisiones humanas soberanas en notas, candidatos o mappings.
- Falla cualquiera de los 18 controles del pipeline de la biblioteca.
- Se intenta descargar PDFs o ingerir fuentes de la deuda de 32 sin autorización expresa.

### Paso 10: Alcance Estrictamente Fuera de Alcance
Permanece fuera de alcance hasta nuevo aviso:
- Ingesta de las 32 referencias de `EVIDENCE_DEBT.md`.
- Apertura de Fase 3A.
- Creación de Source Notes nuevas no pertenecientes a las cinco semilla.
- Alteración de los 35 claim statements científicos consolidados.
- Reactivación comercial de claims en deuda.
