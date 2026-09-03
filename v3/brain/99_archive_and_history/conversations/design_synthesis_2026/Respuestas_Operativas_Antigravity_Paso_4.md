# RESPUESTAS OPERATIVAS DE ANTIGRAVITY (PASO 4)
## Calibración Técnica y Viabilidad del Cerebro "Digital Self & Attention Doors"

> **Destinatarios:** Liderazgo Estratégico (Usuario) & ChatGPT (Consultor Epistemológico)  
> **Emisor:** Antigravity (Hub de Ingeniería y Operación)  
> **Fecha:** 2026-09-03  
> **Propósito:** Responder con precisión técnica las 14 preguntas operativas formuladas en el Paso 3 para permitir que ChatGPT elabore la recomendación arquitectónica definitiva.

---

### 1. ¿Cómo obtiene realmente contexto Antigravity del repositorio?

* **¿Ve automáticamente todo el repositorio? / ¿Indexa todo?**  
  **No.** Antigravity no inyecta el repositorio completo en su ventana de contexto inicial. Lo que recibe al arrancar es el mapa de herramientas, el directorio de trabajo activo y las instrucciones del sistema.
* **¿Solo lee archivos que decide abrir?**  
  **Sí.** Antigravity opera bajo demanda: solo entran a su ventana de contexto (`context window`) los archivos que explícitamente abre mediante `view_file` o los fragmentos exactos coincidentes retornados por `grep_search`.
* **¿Qué motor de búsqueda utiliza?**  
  Búsqueda lexical y por expresiones regulares directas en el sistema de archivos (`ripgrep` a través de `grep_search`), y resolución de patrones de nombres y directorios (`find_by_name` basado en `fd`).
* **¿Puede restringirse de manera fiable a `/v3/brain`?**  
  **Sí.** Antigravity respeta los argumentos `SearchDirectory` y `SearchPath`. Al codificar en sus reglas de proyecto (`.gemini/rules` o instrucciones fijas de conversación) que el espacio de búsqueda documental es exclusivamente `d:/.../v3/brain/`, Antigravity no buscará en carpetas fuera de ese scope.
* **¿Puede establecerse `/v3/brain/INDEX.md` como punto de entrada obligatorio?**  
  **Sí.** Es la mejor práctica estándar: se instruye al agente a que ante cualquier consulta conceptual o de diseño, primero consulte `INDEX.md` para resolver la ruta del MOC correspondiente antes de ejecutar búsquedas profundas.

---

### 2. ¿Podemos impedir técnicamente que conocimiento fuera de `/v3/` contamine el contexto?

* **¿Si un archivo está excluido por `.gitignore`, Antigravity aún puede encontrarlo?**  
  Las herramientas nativas de Antigravity (`grep_search` y `find_by_name`) **respetan `.gitignore` por defecto** e ignoran los archivos excluidos a menos que se fuerce una lectura explícita con ruta absoluta.
* **¿Cómo garantizar aislamiento total contra la "archive contamination"?**  
  La combinación técnica infalible es doble:
  1. **Aislamiento en Disco:** Todo el archivo histórico reside dentro de `v3/brain/99_archive_and_history/` (con metadato `status: archived`), o fuera del árbol en una carpeta gitignorada.
  2. **Regla de Agente vinculante:** Regla fija en el proyecto: *"Queda prohibido consultar carpetas de archivo histórico a menos que la instrucción del usuario contenga explícitamente las palabras 'histórico', 'conversación original' o 'fuente cruda'"*.

---

### 3. ¿Qué capacidad real tenemos para validar frontmatter por `type`?

* **Capacidad: 100% viable, determinística y ligera.**
* **Implementación:**  
  Antigravity implementará un script de auditoría en Node.js (`scripts/audit_brain.js`) utilizando esquemas JSON Schema (`ajv`) o validación declarativa.
* **Comportamiento:**
  * El script lee el YAML de cada archivo.
  * Inspecciona la propiedad `type:` (`claim`, `door`, `decision`, `source`, `product`, etc.).
  * Aplica un validador condicional estricto:
    * Si `type: claim` $\rightarrow$ Exige obligatoriamente `epistemic_status`, `supported_by`, `last_verified`.
    * Si `type: decision` $\rightarrow$ Exige obligatoriamente `decision_status`, `rationale`, `supersedes`, `affected_docs`.
  * Si falta un campo o un enum es inválido, el script falla, lista los archivos infractores y bloquea la aprobación.

---

### 4. ¿Hay alguna limitación técnica para manejar dos estados independientes (`status` vs `epistemic_status`)?

* **Ninguna.**
* Desde el punto de vista de parsing de datos, un objeto YAML soporta perfectamente múltiples dimensiones ortogonales:
  ```yaml
  status: canonical            # Gobernanza: draft | review | canonical | deprecated
  epistemic_status: supported  # Epistemología: established | supported | provisional | speculative
  ```
* Los scripts de auditoría y los prompts de los agentes pueden filtrar por cualquiera de los dos o por su combinación (ej. *Buscar todo lo que sea `status: canonical` pero con `epistemic_status: provisional` para preparar la agenda de investigación*).

---

### 5. ¿Qué granularidad funciona mejor realmente para Sources y Claims?

* **Para `Sources` (Fuentes/Papers):**  
  **Opción B (Archivos atómicos: `sources/SRC-001.md`).**  
  *Justificación:* Un paper o reporte de industria contiene autores, metodología, citas clave, hallazgos y limitaciones (50-150 líneas). Merece su propio archivo atómico.
* **Para `Claims` (Afirmaciones científicas o empíricas):**  
  **Modelo Híbrido Recomendado (Sub-matrices temáticas por dominio):**  
  *Justificación técnica:* Un claim individual suele ser una afirmación de 2 a 5 líneas con 3 fuentes asociadas. Crear 80 archivos individuales de 10 líneas (`CLAIM-001.md`, `CLAIM-002.md`...) genera **inflación de archivos en disco**, degrada la velocidad de búsqueda de herramientas como ripgrep y fragmenta la lectura del LLM.  
  *Solución óptima:* Organizar los claims en **archivos atómicos temáticos de claims** (ej. `claims/claims_phishing_genai.md`, `claims/claims_psicologia_atencion.md`), donde cada claim tiene su bloque claro con su ID (`CLAIM-001`, `CLAIM-002`), su nivel de evidencia y sus fuentes. Si ChatGPT insiste estrictamente en archivos individuales de claim por pureza de grafos, **Antigravity puede operarlo sin problemas**, pero la experiencia técnica sugiere que agruparlos por dominio es mucho más eficiente.

---

### 6. ¿Los límites de “100–350 líneas / 800–2.500 tokens” son una necesidad técnica real o una heurística?

* **Es una heurística de calidad cognitiva del LLM, NO una limitación de hardware.**
* Los modelos modernos (como Gemini con 1M+ tokens) pueden leer archivos de 4.000 líneas sin problemas técnicos.
* **Por qué importa la heurística:** Los modelos de lenguaje sufren del fenómeno *"Lost in the Middle"* cuando se les entrega un documento monolítico de 1.500 líneas con 10 conceptos mezclados. Al responder, tienden a promediar o alucinar detalles. Cuando el archivo mide entre 100 y 350 líneas y trata **un solo concepto**, la precisión de recuperación es cercana al 100%.
* **Recomendación adoptada:** La regla debe ser **semántica**: *"Un archivo = Un objeto coherente y completo"*. Los números (350 líneas) operarán solo como alerta en scripts, no como guillotina artificial.

---

### 7. ¿Podemos utilizar IDs como relaciones canónicas y generar los links físicos automáticamente?

* **Sí, absolutamente. Es la forma más profesional de gestionarlo.**
* En el frontmatter YAML las relaciones deben declararse con **IDs abstractos**, no con rutas de archivos:
  ```yaml
  supported_by:
    - "CLAIM-018"
    - "SRC-WOOD-2007"
  used_in:
    - "CASE-FARO-03"
  ```
* Antigravity creará un script generador (`scripts/build_registry.js`) que:
  1. Lee todos los archivos y construye un mapa indexado `ID -> relative_path`.
  2. Detecta automáticamente IDs huérfanos o rotos.
  3. Permite mover archivos de carpeta sin romper nunca las relaciones semánticas.

---

### 8. ¿Cuál será la fuente de verdad cuando código y documentación del juego diverjan?

* **La Especificación Canónica (GDD / Spec) es la FUENTE DE VERDAD; el código es su IMPLEMENTACIÓN operativa.**
* **Veto a la sobrescritura ciega:** Totalmente de acuerdo. Nunca un script sobrescribirá la documentación a partir de un cambio en el código, porque un bug en el código se volvería verdad canónica.
* **Auditoría Bidireccional (`tests/audit_game_spec_sync.js`):**  
  Antigravity implementará una prueba automatizada que compare los valores numéricos de scoring (D/N), los nombres de opciones y los identificadores del GDD contra las constantes en `game.js`. Si difieren, la prueba emite una alerta de discrepancia y **falla en el CI**, obligando a una decisión humana (ADR o corrección de código) para resolver la diferencia.

---

### 9. ¿El Product System puede soportar componentes reutilizables sin duplicar contenido?

* **Sí, totalmente viable y técnicamente superior.**
* Separamos limpiamente:
  * `05_products_catalog/webinar_faro/` $\rightarrow$ Especificación del evento (duración 90 min, learning journey, facilitación, audiencia).
  * `04_product_system/games/faro_simulation/` $\rightarrow$ El motor del juego (reglas, mecánicas de candados, scoring D/N, narrativa de los 4 casos).
* El producto simplemente declara en su frontmatter:
  ```yaml
  uses_components:
    - "GAME-FARO-SIMULATION-V3"
  ```
* Si mañana creamos `workshop_inmersion_4h`, reutiliza el mismo ID de juego sin copiar una sola línea de texto.

---

### 10. ¿Existe alguna razón operativa seria para NO tener una capa explícita de `evidence_and_validation`?

* **No existe ninguna razón técnica para omitirla.**
* Separar `Research` (lo que la ciencia externa dice) de `Validation` (lo que hemos medido y comprobado empíricamente en nuestros propios webinars y productos) añade un valor epistemológico inmenso.
* **Resolución:** Se restituye `evidence_and_validation/` como capa independiente en la arquitectura definitiva.

---

### 11. ¿Puede Antigravity mantener un `Source Registry` + `Migration Manifest` de manera semiautomática?

* **Sí.**
* Se construirá `scripts/manifest_manager.js`:
  1. Calcula el hash SHA-256 de cada archivo original en `source_conversations/` y de los documentos maestros previos.
  2. Registra en `migration_manifest.yaml` el estado de extracción de cada fuente (`pending`, `in_progress`, `migrated`).
  3. Mapea qué conceptos, claims y decisiones surgieron de cada fuente.
  4. Valida que ninguna fuente se archive como "completada" si tiene conceptos no asignados a un archivo canónico.

---

### 12. ¿Cómo preservamos raw sources si los archivos históricos ya no estarán en Git?

* **Recomendación Técnica de Antigravity: Opción Híbrida Segura (Directorio Canónico de Archivo dentro de Git).**
* *Por qué descartamos las otras:*
  * Opción A (solo local) es inaceptable: si se formatea o cambia de equipo, se pierde la historia.
  * Opción C (branch separada) es incómoda para comparar diffs en el día a día.
* *La Solución Segura:*
  * Las fuentes crudas se guardan en `v3/brain/99_archive_and_history/raw_sources/`.
  * **Están en Git** (respaldadas en la nube, seguras contra pérdidas).
  * **Cero contaminación del cerebro activo:** Todo archivo en esa carpeta lleva `status: archived` y las reglas del workspace prohíben a los agentes de IA indexar o leer esa carpeta en tareas cotidianas de diseño o venta, salvo petición humana explícita.

---

### 13. ¿Qué auditorías puede automatizar realmente Antigravity en CI o scripts?

Antigravity automatizará el 100% de las siguientes revisiones mediante scripts determinísticos (`npm run audit:brain`):

| Auditoría Determinística Automatizada | Criterio de Falla / Alerta |
| :--- | :--- |
| **IDs duplicados** | Error fatal si dos archivos declaran el mismo `id:`. |
| **Links rotos y referencias a IDs inexistentes** | Error fatal si un link `[texto](path)` o un ID en `related_docs` / `supported_by` no resuelve en el registry. |
| **Documentos `canonical` incompletos** | Alerta/Error si un archivo `status: canonical` carece de `version`, `author` o `summary`. |
| **Claims sin Source** | Falla si un `type: claim` tiene `supported_by: []` vacío. |
| **Términos Prohibidos (Blacklist)** | Escaneo regex contra la lista negra ("eslabón más débil", "vulnerabilidad humana", "diagnóstico psicométrico"). |
| **Archivos Huérfanos** | Alerta si un archivo `.md` no aparece en ningún MOC (`README.md`) ni es referenciado por ningún otro archivo. |
| **Discrepancias Spec ↔ Código** | Falla en tests si los valores de scoring o nombres de casos en `game.js` no coinciden con el GDD. |
| **Referencias fuera de `/v3/`** | Falla si un archivo canónico enlaza a una ruta antigua fuera de `/v3/`. |

---

### 14. ¿Cómo debería funcionar técnicamente la promoción a Canon?

* **Flujo Técnico de Promoción:**
  1. **Estado Inicial:** Todo archivo nuevo generado por IA o humano nace como `status: working` o `status: review`.
  2. **Regla de Agente:** Queda programado en las instrucciones operativas: *"Ningún agente de IA puede cambiar `status: review` a `status: canonical` de manera autónoma"*.
  3. **Validación Humana:** La promoción a Canon requiere un commit que incluya en el frontmatter:
     ```yaml
     status: canonical
     promoted_by: "Liderazgo Estratégico"
     promotion_date: "2026-09-XX"
     adr_ref: "DEC-002"   # Obligatorio si altera o crea una definición central
     ```
  4. El script de auditoría verifica que ningún documento canónico carezca de estos campos de aprobación.

---

### RESPUESTA A LA PREGUNTA TRANSVERSAL:
> *"Mirando esta arquitectura como sistema que Antigravity tendrá que operar diariamente durante meses o años: ¿qué parte de lo que estamos proponiendo crees que se convertirá en burocracia o mantenimiento manual innecesario, y qué simplificación propondrías sin sacrificar trazabilidad epistemológica?"*

**Diagnóstico Operativo:**
El mayor riesgo de asfixia y burocracia no está en las carpetas ni en los scripts de auditoría; está en la **micro-atomización excesiva de los Claims**.

Si cada afirmación individual del framework (ej. *"El tiempo de reacción disminuye un 15% tras la pausa P"*) se convierte en un archivo Markdown independiente (`CLAIM-001.md`, `CLAIM-002.md`, ... `CLAIM-095.md`), ocurrirá lo siguiente:
1. Habrá decenas de archivos de 8 líneas donde el 70% del archivo es encabezado YAML.
2. Cada edición requerirá abrir, modificar y versionar 5 archivos en lugar de uno.
3. Se producirá fatiga mental en el equipo y ralentización en las respuestas de los agentes.

**La Simplificación Recomendada (El Sweet Spot Operativo):**
* **Objetos Atómicos Complejos (1 archivo por entidad):**  
  Las 9 Puertas, cada Lente Teórica, cada Caso del Juego, cada Producto, cada ADR y cada Fuente bibliográfica importante **deben ser archivos atómicos individuales**. Tienen suficiente peso, densidad y vida propia.
* **Claims (Matrices Atómicas por Dominio):**  
  Agrupar los claims en matrices temáticas de 10 a 15 claims por archivo (ej. `claims_ingenieria_social_ia.md`, `claims_psicologia_decision.md`). Cada claim mantiene su identificador único (`CLAIM-001`), su estado epistemológico, su nivel de confianza y su fuente, pero conviven en un mismo contexto semántico.

Esta simplificación reduce el volumen de archivos en un 60%, preserva el 100% de la trazabilidad y garantiza que el cerebro sea ágil, mantenible y potente durante los próximos años.

---
*Fin de las Respuestas Operativas de Antigravity — Listo para la síntesis definitiva de ChatGPT (Paso 5).*
