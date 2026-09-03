# ADDENDUM — BIBLIOTECA CIENTÍFICA Y AGENTE BIBLIOTECARIO
## Digital Self & Attention Doors — Cerebro de Conocimiento V3

**Versión:** 1.0 — Addendum de arquitectura  
**Fecha:** 2026-09-03  
**Propósito:** incorporar una biblioteca científica viva al Cerebro de Conocimiento sin duplicar ni competir con las capas ya definidas de Research, Claims, Canon, Validation o Archive.

---

# 0. Decisión ejecutiva

La necesidad de almacenar, leer, clasificar y capitalizar artículos científicos **ya encaja conceptualmente dentro de `01_research_and_lenses/`**, pero la arquitectura definitiva necesita explicitar un subsistema operativo adicional:

> **SCIENTIFIC LIBRARY SYSTEM**

Este sistema **NO crea una nueva capa epistemológica ni una novena capa del cerebro**.

Su función es resolver este ciclo:

```text
ARTÍCULO ENCONTRADO
      ↓
INGESTA / DEDUPLICACIÓN
      ↓
LECTURA ESTRUCTURADA
      ↓
SOURCE NOTE
      ↓
BIBLIOGRAFÍA / ÍNDICE
      ↓
CLAIMS CANDIDATOS
      ↓
SÍNTESIS TEMÁTICAS
      ↓
FRAMEWORK / METODOLOGÍA / COMERCIAL
```

La biblioteca científica debe entenderse como:

> **infraestructura de adquisición, conservación y curaduría de evidencia externa**

mientras que `01_research_and_lenses/` sigue siendo:

> **la representación estructurada del conocimiento obtenido de esa evidencia.**

---

# 1. Qué problema resuelve

A medida que avance el proyecto aparecerán:

- artículos académicos;
- revisiones sistemáticas;
- metaanálisis;
- libros y capítulos;
- working papers;
- preprints;
- informes de industria;
- estándares;
- documentos regulatorios;
- estudios sobre IA;
- papers sobre entrenamiento;
- papers sobre comportamiento y toma de decisiones.

Si se guardan simplemente en una carpeta `papers/`, el proyecto terminará con una biblioteca difícil de consultar y un cerebro que sabe que los documentos existen, pero no sabe:

- qué contienen;
- qué tan sólidos son;
- qué claims respaldan;
- qué limitaciones tienen;
- dónde se utilizan;
- qué contradicen;
- qué tan actuales están;
- si ya fueron leídos;
- si están duplicados;
- si cambian una hipótesis del framework.

El objetivo del subsistema es impedir eso.

---

# 2. Principio de diseño: el full text NO es el conocimiento canónico

El artículo completo debe conservarse.

Pero los agentes cotidianos **no deberían depender de leer nuevamente el PDF cada vez que necesiten un dato**.

La secuencia correcta es:

```text
FULL TEXT
      ↓
SOURCE NOTE CURADA
      ↓
CLAIMS
      ↓
SYNTHESIS
      ↓
USOS DEL PROYECTO
```

El artículo completo funciona como:

> **evidencia primaria recuperable.**

La `Source Note` funciona como:

> **representación estructurada, trazable y reutilizable del artículo dentro del cerebro.**

---

# 3. Encaje con la arquitectura definitiva

La arquitectura principal **NO cambia**.

Se amplía así:

```text
DigitalSelf_AttentionDoors/
│
├── v3/
│   │
│   ├── brain/
│   │   │
│   │   ├── 01_research_and_lenses/
│   │   │   ├── README.md
│   │   │   ├── BIBLIOGRAPHY_MASTER.md
│   │   │   ├── RESEARCH_TAXONOMY.md
│   │   │   │
│   │   │   ├── librarian/
│   │   │   │   ├── LIBRARIAN_PROTOCOL.md
│   │   │   │   ├── READING_TEMPLATE.md
│   │   │   │   ├── INTAKE_RULES.md
│   │   │   │   └── RESEARCH_GAPS.md
│   │   │   │
│   │   │   ├── sources/
│   │   │   ├── claims/
│   │   │   ├── syntheses/
│   │   │   ├── theoretical_lenses/
│   │   │   └── industry_reports/
│   │   │
│   │   └── ...
│   │
│   ├── research_library/
│   │   ├── README.md
│   │   ├── inbox/
│   │   ├── academic_articles/
│   │   ├── reviews_meta_analyses/
│   │   ├── books_chapters/
│   │   ├── industry_reports/
│   │   ├── standards_regulation/
│   │   └── other_sources/
│   │
│   ├── app/
│   ├── scripts/
│   └── tests/
```

---

# 4. Por qué `research_library/` debe estar fuera de `/brain/`

Esta separación es intencional.

`/v3/brain/` contiene:

> conocimiento estructurado diseñado para recuperación humana y LLM.

`/v3/research_library/` contiene:

> archivos fuente completos y sus artefactos originales.

Esto evita:

- contaminación de contexto;
- recuperación accidental de PDFs viejos;
- búsquedas innecesarias sobre binarios;
- duplicación de contenido;
- confusión entre “lo que dice el paper” y “lo que nuestro cerebro ha concluido del paper”.

---

# 5. Un artículo = un Source ID

Cada artículo recibe un ID estable.

Ejemplo:

```text
SRC-VAFA-2026
SRC-WOOD-NEAL-2007
SRC-VERIZON-DBIR-2026
```

El ID conecta:

```text
PDF
↕
SOURCE NOTE
↕
CLAIMS
↕
SYNTHESIS
↕
PRODUCTS
```

---

# 6. Localización del artículo completo

La `Source Note` debe registrar dónde está el full text.

Ejemplo:

```yaml
fulltext:
  availability: full_text
  storage_type: local_file
  location: "../../research_library/academic_articles/SRC-VAFA-2026__context-aware-spear-phishing.pdf"
  sha256: "..."
```

También puede ser:

```yaml
fulltext:
  availability: external
  storage_type: doi
  doi: "10.xxxx/xxxxx"
  url: "https://..."
```

o:

```yaml
fulltext:
  availability: institutional_access
  storage_type: external_reference
  location: "..."
```

---

# 7. Regla legal y de copyright

No todos los artículos deben almacenarse físicamente dentro de Git.

## A. Open Access / Public Domain / licencia compatible

Puede guardarse el full text dentro de:

```text
/v3/research_library/
```

y versionarse si Antigravity considera viable el tamaño.

## B. Artículo con copyright o acceso institucional

No redistribuir automáticamente el PDF en Git.

Guardar:

- Source Note;
- DOI;
- URL;
- citation;
- hash local si existe copia legítima;
- ubicación privada/local autorizada.

## C. Archivos binarios grandes

Si el equipo decide versionarlos:

> usar Git LFS u otra solución de almacenamiento de archivos grandes.

No inflar Git convencional con cientos de PDFs.

---

# 8. El “Bibliotecario”

Debe existir un protocolo explícito de agente:

```text
LIBRARIAN_PROTOCOL.md
```

El Bibliotecario no es una fuente epistemológica.

Es un:

> **agente de curaduría, extracción, clasificación y trazabilidad.**

---

# 9. Responsabilidades del Bibliotecario

## 9.1. Intake

Cuando llega un nuevo artículo:

1. identificar título;
2. autores;
3. año;
4. DOI;
5. journal;
6. tipo de fuente;
7. ubicación;
8. licencia/acceso;
9. hash;
10. existencia previa en biblioteca.

## 9.2. Deduplicación

Antes de crear una nueva entrada, comprobar:

1. DOI;
2. título normalizado;
3. autores + año;
4. hash del full text.

Si ya existe:

> actualizar la entrada existente.

No crear un nuevo Source ID.

## 9.3. Clasificación

Asignar dominios temáticos.

Taxonomía inicial sugerida:

```text
human_factor
social_engineering
phishing
genai
ai_agents
digital_self
attention
identity
curiosity
responsibility
justice
coherence
belonging
protection
loss
habit_automaticity
decision_making
metacognition
human_ai_interaction
trust_in_automation
cognitive_offloading
cybersecurity_training
learning
gamification
simulation
behavior_change
measurement
ethics
regulation
```

La taxonomía debe mantenerse en:

```text
RESEARCH_TAXONOMY.md
```

No permitir crecimiento libre de tags sin gobernanza.

---

# 10. Lectura estructurada del artículo

El Bibliotecario debe leer el artículo completo cuando esté disponible.

No basarse únicamente en:

- abstract;
- snippets;
- título;
- reseñas de terceros.

Si solo se dispone del abstract:

```yaml
reading_depth: abstract_only
```

y cualquier conclusión debe reflejar esta limitación.

---

# 11. Source Note — ficha científica del artículo

Cada fuente importante genera:

```text
01_research_and_lenses/sources/SRC-XXXX.md
```

Template recomendado:

```yaml
---
id: SRC-XXXX
type: source

status: canonical
epistemic_status: not_applicable

title:
authors:
year:
journal:
doi:
url:

source_type:
publication_status:
peer_reviewed:

topics:

reading_status: complete
reading_depth: full_text

fulltext:
  availability:
  storage_type:
  location:
  sha256:

related_claims:
related_syntheses:
related_theories:
related_framework:

created:
last_updated:
last_verified:

summary:
---
```

---

# 12. Contenido obligatorio de cada Source Note

```markdown
# Citation

# Why this source matters

# Research question

# Study design / methodology

# Population / sample

# Key variables / constructs

# Main findings

# Effect sizes / quantitative results
(si aplica)

# Limitations stated by authors

# Additional limitations relevant to our use

# What this source supports

# What this source DOES NOT support

# Relevance to Digital Self & Attention Doors

# Potential claims

# Connections to theoretical lenses

# Implications for training / intervention

# Commercial relevance
(si existe)

# Open questions

# Full-text location
```

---

# 13. Regla crucial: “What this source DOES NOT support”

Esta sección es obligatoria.

Su objetivo es impedir:

```text
paper dice X
↓
cerebro infiere X+Y+Z
↓
ventas dice “demostrado”
```

Ejemplo:

Un estudio puede mostrar:

> role-playing aumenta autoeficacia en una muestra determinada.

No necesariamente demuestra:

> Digital Self & Attention Doors reduce incidentes reales de ciberseguridad.

---

# 14. Quality / Evidence Profile

Cada Source Note debe registrar un perfil descriptivo.

No se recomienda crear un “puntaje científico” único.

Campos posibles:

```yaml
evidence_profile:
  peer_reviewed: true
  design: randomized_trial
  sample_size: 420
  replication_status: unknown
  external_validity: moderate
  publication_status: published
```

El objetivo es permitir lectura crítica, no transformar calidad metodológica en una falsa cifra universal.

---

# 15. `BIBLIOGRAPHY_MASTER.md`

Debe existir un archivo maestro legible por humanos:

```text
01_research_and_lenses/BIBLIOGRAPHY_MASTER.md
```

Pero:

> **NO debe mantenerse manualmente.**

Debe generarse desde el frontmatter de los Source Notes.

---

# 16. Qué debe mostrar el Bibliography Master

Vista sugerida:

```markdown
| Source ID | Year | Authors | Title | Type | Topics | Read | Claims | Full Text |
```

Además:

```text
BY TOPIC
BY YEAR
BY SOURCE TYPE
BY THEORETICAL LENS
BY FRAMEWORK COMPONENT
BY READING STATUS
```

---

# 17. El Bibliography Master NO es una segunda base de datos

La verdad de una fuente vive en:

```text
SRC-XXXX.md
```

`BIBLIOGRAPHY_MASTER.md` es:

> una vista generada.

No se editan metadatos bibliográficos allí.

---

# 18. Source Registry vs Bibliography Master

No compiten.

## `source_registry.yaml`

Machine-facing.

Registra:

- ID;
- path;
- hash;
- provenance;
- migration/intake status.

## `BIBLIOGRAPHY_MASTER.md`

Human-facing.

Permite:

- navegar;
- ordenar;
- descubrir;
- leer estado general.

Ambos se generan desde los mismos objetos.

---

# 19. Claims: el Bibliotecario PROPONE, no canoniza

Después de leer un artículo, el Bibliotecario puede generar:

```text
candidate_claims
```

Ejemplo:

```yaml
candidate_claims:
  - text: "..."
    suggested_domain: cybersecurity_training
    confidence: medium
```

Pero:

> un artículo no modifica automáticamente las matrices de Claims canónicas.

Workflow:

```text
ARTICLE
↓
SOURCE NOTE
↓
CANDIDATE CLAIM
↓
REVIEW
↓
CLAIM MATRIX
```

---

# 20. Claims contradictorios

Si una fuente nueva contradice un claim existente:

NO:

```text
nuevo paper
→ sobrescribir claim
```

SÍ:

```text
nuevo paper
→ FLAG: evidence conflict
→ actualizar evidence map
→ epistemic review
```

El claim puede pasar, por ejemplo:

```text
supported
→ mixed
```

solo mediante revisión explícita.

---

# 21. Impacto sobre Canon

El Bibliotecario nunca cambia Canon.

Si una fuente relevante tensiona el Canon:

```text
SOURCE
↓
EPISTEMIC TENSION
↓
REVIEW
↓
ADR
↓
possible Canon change
```

Esto protege contra:

> “un paper nuevo cambió automáticamente la definición del framework”.

---

# 22. Syntheses

Las síntesis son el espacio donde varias fuentes se integran.

Ejemplo:

```text
human_factor_cybersecurity.md
```

puede consumir:

```text
SRC-001
SRC-017
SRC-024
CLAIM-003
CLAIM-008
```

Regla:

> una síntesis nunca debe citar únicamente “Bibliography Master”.

Debe llegar hasta las Sources reales.

---

# 23. Flujo completo del Bibliotecario

```text
1. RECEIVE
   ↓
2. DEDUPLICATE
   ↓
3. CREATE / ASSIGN SOURCE ID
   ↓
4. STORE / LINK FULL TEXT
   ↓
5. CLASSIFY
   ↓
6. READ
   ↓
7. CREATE SOURCE NOTE
   ↓
8. EXTRACT CANDIDATE CLAIMS
   ↓
9. CONNECT THEORETICAL LENSES
   ↓
10. ROUTE TO SYNTHESIS
   ↓
11. UPDATE GENERATED BIBLIOGRAPHY
   ↓
12. FLAG RESEARCH GAPS / CONFLICTS
```

---

# 24. Estados de procesamiento de una fuente

```text
inbox
deduplicated
registered
reading
read
indexed
claims_pending
integrated
archived
```

No confundir `reading_status` con `status`.

`status` sigue siendo gobernanza del objeto.

---

# 25. `RESEARCH_GAPS.md`

El Bibliotecario debe alimentar:

```text
01_research_and_lenses/librarian/RESEARCH_GAPS.md
```

Ejemplos:

```text
GAP-001
Evidence linking metacognitive training specifically to phishing-resistant behavior is limited.

GAP-002
Need stronger empirical support for relationships among Attention Doors.

GAP-003
Need validation strategy for transfer beyond immediate simulation.
```

Esto evita que el cerebro solo acumule lo que ya sabemos.

También registra:

> lo que necesitamos investigar.

---

# 26. Prioridad de lectura

No todo PDF debe ser leído inmediatamente.

El Bibliotecario puede asignar:

```yaml
priority:
  critical
  high
  medium
  low
```

Criterios:

- impacto sobre Canon;
- relevancia comercial;
- relevancia para producto activo;
- calidad de la evidencia;
- novedad;
- contradicción con claims existentes;
- fecha.

---

# 27. Función “Ask the Librarian”

El cerebro debería poder responder:

> ¿Cuáles son los 10 papers más relevantes sobre entrenamiento continuo?

> ¿Qué evidencia tenemos sobre AI-generated spear phishing?

> ¿Qué fuentes respaldan la Puerta de Curiosidad?

> ¿Qué claims tienen evidencia contradictoria?

> ¿Qué artículos todavía no hemos leído?

> ¿Qué estudios de 2026 podrían requerir actualizar nuestra narrativa comercial?

> ¿Dónde está almacenado el PDF de este paper?

---

# 28. Scripts propuestos para Antigravity

Añadir al plan de implementación:

```text
scripts/
├── librarian_intake.js
├── librarian_dedupe.js
├── build_bibliography.js
├── audit_research_library.js
├── audit_source_fulltext.js
└── research_gap_report.js
```

---

# 29. Auditorías adicionales

## `D090_DUPLICATE_SOURCE`
DOI, título normalizado, autores/año o hash duplicado.

## `D091_SOURCE_WITHOUT_NOTE`
Full text almacenado sin Source Note.

## `D092_NOTE_WITHOUT_LOCATION`
Source Note sin DOI, URL o ubicación de full text.

## `D093_BIBLIOGRAPHY_DRIFT`
Bibliography Master no coincide con Source Notes.

## `D094_UNREAD_SOURCE_USED_AS_STRONG_EVIDENCE`
Fuente `abstract_only` utilizada para claim fuerte.

## `D095_FULLTEXT_HASH_MISMATCH`
El archivo físico cambió.

## `D096_UNLICENSED_GIT_FULLTEXT`
Warning si se intenta versionar un full text cuya licencia/política no permite redistribución.

## `S011_SOURCE_SUMMARY_DRIFT`
¿La Source Note representa fielmente el artículo?

## `S012_SOURCE_OVERINTERPRETATION`
¿“What this source supports” excede los resultados reales?

## `S013_RESEARCH_SYNTHESIS_BALANCE`
¿Una síntesis ignora evidencia contradictoria disponible?

---

# 30. Cadencia del Bibliotecario

## Cada artículo nuevo
- intake;
- dedupe;
- register;
- store/link;
- Source Note.

## Cuando el artículo es prioritario
- lectura completa;
- claim extraction;
- routing.

## Mensual o por release
- unread queue;
- stale sources;
- research gaps;
- contradictory claims;
- new sources not integrated.

---

# 31. Qué NO debe hacer el Bibliotecario

No debe:

- promover Canon;
- declarar validación;
- cambiar Attention Doors;
- modificar metodología central;
- autorizar claims comerciales;
- resolver contradicciones empíricas automáticamente;
- interpretar un abstract como lectura completa;
- borrar un paper porque parece irrelevante;
- convertir cualquier resultado estadísticamente significativo en una afirmación importante.

---

# 32. Relación con Evidence & Validation

No compite.

## Research Library

Contiene evidencia externa:

```text
¿Qué dice la literatura?
```

## Evidence & Validation

Contiene evidencia propia:

```text
¿Qué hemos observado o validado nosotros?
```

Ejemplo:

```text
Paper externo sobre role-play
→ Research

Resultados del Webinar FARO
→ Evidence & Validation
```

Nunca mezclarlos.

---

# 33. Relación con Archive

Los papers no son “Archive”.

Aunque el artículo sea de 1995.

`Archive` significa:

> historia del proyecto.

`Research Library` significa:

> corpus de evidencia externa.

Un paper clásico puede seguir siendo conocimiento activo.

---

# 34. Relación con Commercial

Commercial NO debe leer PDFs directamente para improvisar claims.

Flujo:

```text
PDF
↓
Source Note
↓
Claim
↓
evidence_for_sales
↓
Commercial
```

Esto mantiene velocidad comercial sin perder trazabilidad.

---

# 35. Relación con Theoretical Lenses

Un artículo puede alimentar una teoría.

Pero:

```text
SOURCE
≠
THEORY
```

Ejemplo:

```text
SRC-ROGERS-1975
        ↓
Protection Motivation Theory
        ↓
possible relationship
        ↓
Protection Door
```

No fusionar los tres niveles.

---

# 36. Relación con Source Registry y Migration Manifest

Los artículos nuevos no son “migración histórica”.

Diferenciar:

```yaml
ingestion_origin: new_research
```

versus:

```yaml
ingestion_origin: legacy_migration
```

El mismo registry puede soportar ambos.

`Migration Manifest` se reserva para capitalizar fuentes históricas del proyecto.

`Research Intake` administra evidencia nueva.

---

# 37. Convención de nombres

```text
SRC-ID__author-year__short-title.ext
```

Ejemplo:

```text
SRC-VAFA-2026__vafa-2026__context-aware-spear-phishing.pdf
```

Evitar:

```text
paper_final.pdf
paper2.pdf
important_ai_article.pdf
```

---

# 38. Versiones de un mismo paper

Si aparece una versión nueva del mismo trabajo:

```text
SRC-XXXX
```

permanece estable.

Registrar:

```yaml
versions:
  - version: preprint
  - version: published
```

La versión publicada puede reemplazar al preprint como evidencia principal.

No crear dos Sources si es esencialmente el mismo estudio.

---

# 39. Master Bibliography: vistas recomendadas

`BIBLIOGRAPHY_MASTER.md` debería incluir:

## Dashboard

```text
Total Sources
Full-text available
Full-text read
Abstract only
Unread
Peer-reviewed
Preprints
Reports
Books
Claims supported
Claims disputed
```

## By topic
## By theoretical lens
## By Framework component
## By methodology
## By year
## By reading status
## Sources needing review

---

# 40. Bibliografía formal para publicaciones

El sistema puede generar:

```text
bibliography.bib
bibliography_apa.md
```

a partir de Source Notes.

Son archivos derivados.

No constituyen la base maestra.

---

# 41. Integración con Knowledge Regression

Añadir:

### KR-LIB-001
**Pregunta:** ¿Todo artículo almacenado respalda automáticamente el framework?  
**Esperado:** No. Puede ser relevante, contradictorio, limitado o no haber sido integrado.

### KR-LIB-002
**Pregunta:** ¿Un Source Note reemplaza al artículo original?  
**Esperado:** No. Es una representación estructurada; el full text sigue siendo evidencia primaria.

### KR-LIB-003
**Pregunta:** ¿Un paper nuevo puede modificar automáticamente una definición canónica?  
**Esperado:** No. Puede generar tensión epistemológica que requiere revisión y, si corresponde, ADR.

---

# 42. Validación de interferencia con la arquitectura existente

## NO compite con `01_research_and_lenses`
Lo operacionaliza.

## NO compite con `Sources`
Las Source Notes son las fichas de biblioteca dentro del cerebro.

## NO compite con `Claims`
El Bibliotecario propone claims candidatos; las matrices siguen siendo la capa formal.

## NO compite con `Syntheses`
Las síntesis integran múltiples fuentes.

## NO compite con `Evidence & Validation`
Biblioteca = evidencia externa.  
Validation = evidencia propia.

## NO compite con `Archive`
Biblioteca = corpus científico activo.  
Archive = historia del proyecto.

## NO compite con `Source Registry`
Registry = machine-facing.  
Bibliografía Master = human-facing.

---

# 43. Única decisión arquitectónica nueva

Agregar:

```text
/v3/research_library/
```

como **almacén de full texts** separado del cerebro.

Y dentro de Research:

```text
BIBLIOGRAPHY_MASTER.md
RESEARCH_TAXONOMY.md
librarian/
```

No se crea una nueva capa maestra.

---

# 44. Instrucción para Antigravity

Incorporar este Addendum al plan de implementación antes de iniciar los Bloques A–D.

Antigravity deberá decidir técnicamente:

1. si `research_library/` entra en Git normal, Git LFS o almacenamiento externo según licencia/tamaño;
2. cómo implementar deduplicación;
3. cómo generar `BIBLIOGRAPHY_MASTER.md`;
4. cómo integrar el Bibliotecario a los scripts existentes;
5. cómo mantener el firewall para que agentes cotidianos no lean full texts salvo necesidad de investigación;
6. cómo incorporar estas auditorías al Brain Health.

No rediseñar las ocho capas del cerebro.

Este Addendum **extiende el subsistema Research sin alterar la arquitectura definitiva**.

---

# 45. Principio final

El cerebro no debería saber únicamente:

> “tenemos este paper”.

Debe saber:

> **qué estudia, qué encontró, qué tan sólido es, qué limita, qué claims respalda, qué contradice, dónde se utiliza y dónde está el texto completo.**

Eso convierte una carpeta de PDFs en:

> **una biblioteca científica viva, trazable y utilizable por humanos y agentes de IA.**
