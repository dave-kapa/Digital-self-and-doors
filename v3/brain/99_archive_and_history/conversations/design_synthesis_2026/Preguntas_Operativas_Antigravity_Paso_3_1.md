# Preguntas operativas para Antigravity

Las he reducido a **14 preguntas**. No necesito otro ensayo de arquitectura: respuestas técnicas concretas son suficientes.

---

## 1. ¿Cómo obtiene realmente contexto Antigravity del repositorio?

Necesito saber el comportamiento real, no el ideal diseñado.

Cuando Antigravity trabaja en el proyecto:

- ¿ve automáticamente todo el repositorio?
- ¿indexa todo?
- ¿solo lee archivos que decide abrir?
- ¿utiliza búsqueda lexical, semántica, embeddings o alguna combinación?
- ¿puede restringirse de manera fiable a `/v3/brain`?
- ¿puede establecerse `/v3/brain/INDEX.md` como punto de entrada obligatorio antes de hacer búsquedas profundas?

Esto determinará cuánto dependen nuestras protecciones anti-alucinación de la estructura documental y cuánto de reglas operativas del agente.

---

## 2. ¿Podemos impedir técnicamente que conocimiento fuera de `/v3/` contamine el contexto?

La síntesis propone dejar los documentos históricos fuera del V3 y excluirlos del Git activo.

Necesito confirmar:

- si un archivo está en el proyecto local pero `.gitignore` lo excluye, ¿Antigravity todavía puede encontrarlo/buscarlo accidentalmente?
- ¿podemos configurar explícitamente su scope cotidiano para que trabaje **solo en `/v3/`**, salvo que se le ordene consultar historia?
- ¿existe alguna diferencia entre “no está en Git” y “no entra en contexto”?

Esta respuesta es crítica para nuestra futura auditoría de **archive contamination**.

---

## 3. ¿Qué capacidad real tenemos para validar frontmatter por `type`?

No quiero un único schema genérico.

Un `source`, un `claim`, un `door`, un `decision` y un `product` necesitan campos diferentes.

Por ejemplo:

```yaml
type: claim
```

podría exigir:

```yaml
epistemic_status:
supported_by:
last_verified:
```

mientras:

```yaml
type: decision
```

exigiría:

```yaml
decision_status:
rationale:
supersedes:
affected_docs:
```

¿Puede Antigravity implementar validación condicionada por `type`, por ejemplo con JSON Schema, scripts Node/Python u otra solución limpia?

---

## 4. ¿Hay alguna limitación técnica para manejar dos estados independientes?

Quiero confirmar que podemos tener simultáneamente:

```yaml
status: canonical
epistemic_status: provisional
```

sin que eso complique filtros, búsquedas o automatizaciones.

Mi intención es usar:

**Gobernanza**  
`draft | review | canonical | deprecated`

y algo semejante a:

**Estado epistemológico**  
`established | supported | provisional | speculative | mixed | not_applicable`

¿Hay alguna razón técnica para no hacerlo?

---

## 5. ¿Qué granularidad funciona mejor realmente para Sources y Claims?

La síntesis conserva:

```text
claims_matrix.md
bibliography.md
```

en lugar del modelo más atómico que propuse.

Esta es una decisión que quiero tomar con información técnica.

Comparativamente, para Antigravity y otros LLM:

**A.**
```text
claims_matrix.md
bibliography.md
```

versus:

**B.**
```text
claims/
  CLAIM-001.md
  CLAIM-002.md

sources/
  SRC-001.md
  SRC-002.md
```

¿Qué modelo ofrece mejor equilibrio entre:

- retrieval;
- economía de tokens;
- edición;
- trazabilidad;
- actualización;
- prevención de contradicciones?

Si el coste operativo de B es bajo, mi preferencia epistemológica sigue siendo **objetos atómicos**.

---

## 6. ¿Los límites de “100–350 líneas / 800–2.500 tokens” son una necesidad técnica real o una heurística?

Antigravity propone esa regla de granularidad.

Quiero saber:

- ¿hay alguna ventana concreta de Antigravity que justifique esos números?
- ¿o son recomendaciones prácticas?
- ¿sería mejor que la regla fuera semántica —“un objeto coherente por archivo”— y utilizar un umbral únicamente como alerta?

No quiero que terminemos partiendo artificialmente una idea porque llegó a la línea 351.

---

## 7. ¿Podemos utilizar IDs como relaciones canónicas y generar los links físicos automáticamente?

Actualmente se propone enlazado mediante rutas Markdown relativas.

Mi preocupación:

```text
../02_research/.../file.md
```

es legible, pero las rutas cambian.

Preferiría que la relación semántica sea:

```yaml
supported_by:
  - CLAIM-018

used_in:
  - CASE-FARO-03
```

y que scripts puedan resolver esos IDs hacia archivos concretos y generar:

- enlaces;
- backlinks;
- grafos;
- validaciones.

¿Es operacionalmente viable?

¿Puede existir un registry de `ID → path` generado automáticamente?

---

## 8. ¿Cuál será la fuente de verdad cuando código y documentación del juego diverjan?

La síntesis propone generar GDD desde `game.js`.

Aquí necesito una decisión técnica muy precisa.

No quiero que suceda:

> cambiamos accidentalmente el código → el script actualiza el GDD → el error se convierte automáticamente en Canon.

Mi preferencia sería:

> **specification ↔ code validation**

no:

> **code → documentation overwrite**

¿Puede Antigravity implementar una auditoría bidireccional que:

1. detecte diferencias;
2. genere un reporte;
3. no sobrescriba automáticamente ninguno de los dos;
4. requiera decisión humana para resolver el conflicto?

¿Y cuál considera Antigravity que debería ser el source of truth operativo del juego?

---

## 9. ¿El Product System puede soportar componentes reutilizables sin duplicar contenido?

La síntesis ahora coloca webinar + FARO juntos en:

```text
01_webinar_faro_game/
```

Pero conceptualmente podríamos necesitar mañana:

```text
Webinar A
    uses FARO

Workshop B
    uses FARO

Programa C
    uses FARO Case 3
```

¿Hay alguna fricción técnica en separar:

```text
products/webinar/
components-or-games/faro/
```

y hacer que un producto simplemente declare:

```yaml
uses:
  - GAME-FARO
```

?

Quiero evitar duplicar FARO si empieza a vivir dentro de varios productos.

---

## 10. ¿Existe alguna razón operativa seria para NO tener una capa explícita de `evidence_and_validation`?

Esta es la mayor pieza de mi propuesta que desapareció como capa independiente en la síntesis.

Quiero conservar la separación entre:

> **Research:** ¿qué sabemos por evidencia externa?

y

> **Validation:** ¿qué sabemos de nuestro propio framework/producto?

Ejemplos:

- hipótesis del framework;
- validación futura de Attention Doors;
- resultados del webinar;
- evidence de engagement;
- learning evidence;
- market evidence;
- effectiveness evidence;
- open questions.

¿Una capa adicional perjudica materialmente navegación, retrieval o tokenomics?

Si la respuesta es no, mi inclinación es recuperarla.

---

## 11. ¿Puede Antigravity mantener un `Source Registry` + `Migration Manifest` de manera semiautomática?

Este punto es esencial para **no perder nada**.

Quiero que cada gran fuente original —por ejemplo:

- conversación principal;
- Ciberseguridad y factor humano;
- Organizar podcast ciberseguridad;
- documentos maestros;
- archivos de Antigravity;
- versiones V1/V2/V3;
- prompts;
- slides;

pueda tener un registro como:

```yaml
source_id:
location:
hash:
migration_status:

extracted:
  concepts:
  research:
  claims:
  decisions:
  methodology:
  products:
  prompts:
  commercial:
  open_questions:
  discarded_ideas:

destinations:
```

¿Puede Antigravity:

- generar hashes;
- mantener este manifest;
- validar que ningún `source_id` quede marcado como completo con categorías pendientes;
- detectar fuentes nuevas todavía no inventariadas?

---

## 12. ¿Cómo preservamos raw sources si los archivos históricos ya no estarán en Git?

Esto se conecta con tu decisión —que apoyo— de limpiar el repositorio.

Quiero saber cuál es la solución operativa más segura:

**Opción A:** raw sources solo local + manifest en Git.

**Opción B:** archivo comprimido/versionado fuera del árbol activo.

**Opción C:** branch Git histórica no incluida normalmente en contexto.

**Opción D:** repositorio privado independiente de archive.

No quiero que “evitar contaminación del cerebro” termine significando:

> perder la única copia de nuestra historia.

¿Qué alternativa recomienda Antigravity considerando backup, recuperación, colaboración y coste?

---

## 13. ¿Qué auditorías puede automatizar realmente Antigravity en CI o scripts?

La síntesis ya propone:

- links;
- frontmatter;
- blacklist terminológica.

Quiero saber cuáles de estas auditorías adicionales son técnicamente realistas sin requerir revisión manual excesiva:

- IDs duplicados;
- links rotos;
- relaciones hacia IDs inexistentes;
- documentos `canonical` sin propietario/versión;
- claims sin source;
- source sin claim;
- `supported_by` vacío;
- references hacia `deprecated`;
- `used_in` hacia producto inexistente;
- stats sin `last_verified`;
- definitions duplicadas o potencialmente divergentes;
- términos prohibidos;
- archivos huérfanos no listados por ningún MOC;
- archivos fuera de `/v3/` referenciados desde Canon;
- diferencias code/spec;
- claims comerciales no presentes en `evidence_for_sales`;
- documentos que exceden umbrales de tamaño;
- cambios en Canon sin ADR relacionado;
- `migration_manifest` incompleto.

Separaría después las auditorías:

> **determinísticas**

de

> **semánticas asistidas por LLM**.

Necesito saber qué infraestructura puede ejecutar Antigravity: scripts locales, GitHub Actions, pre-commit hooks, etc.

---

## 14. ¿Cómo debería funcionar técnicamente la promoción a Canon?

La síntesis dice que Canon requiere validación explícita.

Pero necesito saber cómo aterrizarlo.

¿Podemos establecer algo como:

```text
working
↓
PR / review
↓
human approval
↓
canonical
```

con reglas como:

> ningún agente puede cambiar `status: canonical` sin una instrucción explícita del usuario;

y posiblemente:

> toda modificación conceptual a un Canon existente debe referenciar un ADR?

¿Puede Antigravity hacer cumplir esto operacionalmente, o será una convención humana?

---

# Una última pregunta transversal para Antigravity

Además de las 14 anteriores, le pediría una respuesta corta a esto:

> **Mirando esta arquitectura como sistema que Antigravity tendrá que operar diariamente durante meses o años: ¿qué parte de lo que estamos proponiendo crees que se convertirá en burocracia o mantenimiento manual innecesario, y qué simplificación propondrías sin sacrificar trazabilidad epistemológica?**

Quiero que critique la arquitectura desde su fortaleza: **operarla**, no desde teoría.

---

## Qué NO necesito que Antigravity vuelva a discutir

Para evitar otra espiral, no necesitamos una nueva respuesta sobre:

- si usar Markdown;
- si usar Git;
- si usar MOCs;
- si separar Framework de productos;
- si documentar el juego fuera del código;
- si conservar ADRs;
- si tener nueve fichas de Attention Doors;
- si trabajar en `/v3/`;
- si FARO vigente es V3+;
- si necesitamos una capa comercial.

Esas decisiones están suficientemente maduras.

Las preguntas anteriores apuntan únicamente a los puntos donde **una restricción técnica real podría modificar mi recomendación definitiva**.
