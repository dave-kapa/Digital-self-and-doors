# Propuesta de arquitectura del “cerebro” de Digital Self & Attention Doors
## Documento para contraste con Antigravity

**Versión:** 0.1 — propuesta de arquitectura  
**Fecha:** 2026-09-03  
**Propósito:** ofrecer una estructura integral para consolidar, preservar, conectar y hacer crecer todo el conocimiento del proyecto **Digital Self & Attention Doors**, incluyendo investigación, framework, metodología, productos, juegos, reglas, decisiones de diseño, validación, materiales comerciales y evolución histórica.

---

# 1. Qué problema debe resolver este cerebro

Hasta ahora el proyecto ha crecido de manera orgánica a través de varias conversaciones, investigaciones, archivos y desarrollos técnicos. Eso permitió velocidad y exploración, pero genera un riesgo natural al pasar a una fase de producto y comercialización:

- parte del conocimiento vive en conversaciones;
- parte está condensado en documentos maestros;
- parte está dentro de Antigravity;
- parte está en especificaciones de juegos;
- parte está en versiones anteriores que ya no son vigentes;
- parte son hipótesis aún no validadas;
- parte es evidencia externa;
- parte son decisiones de diseño cuya lógica podría perderse si solo conservamos el resultado final.

El objetivo del cerebro no debería ser simplemente **guardar archivos**.

Debería permitir responder con rapidez y trazabilidad preguntas como:

- ¿Qué es exactamente el Digital Self según la versión vigente?
- ¿Cuál es la definición canónica de cada Attention Door?
- ¿Qué evidencia respalda Protección o Conveniencia/Rutina?
- ¿Qué teorías se relacionan con una puerta y cuáles no deben presentarse como fundamento directo?
- ¿Qué diferencia formación de intervención?
- ¿Qué competencias busca desarrollar el framework?
- ¿Cómo funciona PARA?
- ¿Qué decisiones de diseño llevaron a que el Caso 3 no revele si el mensaje era legítimo?
- ¿Cómo funciona el scoring D/N del juego?
- ¿Qué parte del juego FARO V3+ pertenece al framework general y cuál es específica del webinar?
- ¿Qué aprendimos del primer webinar?
- ¿Qué elementos del framework son canon, cuáles hipótesis y cuáles están deprecados?
- ¿Qué afirmaciones comerciales tienen respaldo empírico y cuáles necesitan verificación adicional?
- ¿Dónde aparece una determinada teoría, concepto o mecánica a través de distintos productos?
- ¿Qué cambió entre MIRA, FARO, V2, V3 y V3+?

El cerebro debe ser capaz de conectar:

> **EVIDENCIA → CLAIMS → CONCEPTOS → METODOLOGÍA → PRODUCTOS → MECÁNICAS → RESULTADOS → DECISIONES → EVOLUCIÓN**

---

# 2. Principio rector: no construir un documento maestro, construir un sistema de conocimiento

La propuesta central es evitar que todo termine condensado en un único documento gigante.

Un documento maestro puede ser útil como visión general, pero no debería ser la única fuente de verdad.

La arquitectura debería funcionar como un **grafo de conocimiento compuesto por documentos pequeños, especializados, enlazados y versionados**.

Esto permite:

1. **Reutilización** — la definición de Digital Self se escribe una vez y luego es consumida por diferentes productos.
2. **Trazabilidad** — cada claim puede enlazar a las fuentes que lo soportan.
3. **Evolución segura** — cambiar una definición canónica no requiere buscar manualmente todas sus copias.
4. **Separación epistemológica** — una teoría científica, una hipótesis del framework y una decisión de diseño de producto no son lo mismo.
5. **Escalabilidad** — el sistema puede crecer con nuevos juegos, talleres, assessments, productos de intervención o nuevas investigaciones.
6. **Trabajo colaborativo** — todos pueden saber qué documento es vigente, qué está en exploración y qué fue reemplazado.

---

# 3. Principios de arquitectura

## 3.1. Separar evidencia de construcción propia

El cerebro debe distinguir claramente entre:

- **fuentes externas**;
- **claims derivados de esas fuentes**;
- **conceptos creados dentro del framework**;
- **hipótesis en construcción**;
- **métodos de formación/intervención**;
- **decisiones de producto**.

Ejemplo:

> “La aversión a la pérdida está ampliamente documentada”  
> no es lo mismo que  
> “Pérdida es una de las nueve Attention Doors”.

La primera afirmación puede tener respaldo científico establecido.

La segunda es una decisión de integración conceptual del framework y debe conservar su nota epistemológica: la taxonomía de nueve puertas todavía no es una escala psicométrica validada.

## 3.2. Separar canon de historia

No borrar versiones anteriores.

Pero tampoco permitir que una versión vieja compita con el canon vigente.

Estados sugeridos:

- `CANONICAL` — versión actualmente oficial y utilizable.
- `WORKING` — hipótesis, propuesta o desarrollo activo.
- `DEPRECATED` — preservado históricamente, pero no usar para nuevos productos.
- `ARCHIVED` — documento histórico que no requiere mantenimiento conceptual.

## 3.3. El framework existe por encima de los productos

Ejemplo:

```text
Digital Self (concepto canónico)
        ↓
Webinar
        ↓
Juego FARO
        ↓
Caso 2
```

La definición vive en el canon. El webinar la usa. El juego la operacionaliza. El Caso 2 la convierte en una experiencia.

## 3.4. El código no es la documentación del producto

Todo juego o producto digital debe poder ser comprendido aunque el código desaparezca.

Por fuera del código deben existir:

- objetivo;
- audiencia;
- journey;
- narrativa;
- reglas;
- estados;
- scoring;
- mecánicas;
- contenido visible;
- contenido funcional;
- feedback;
- telemetría;
- criterios de éxito;
- límites éticos;
- decisiones de diseño.

## 3.5. Preservar el criterio, no solo el resultado

Decisiones ya relevantes que deben conservarse:

- no tratar al humano como “weakest link”;
- FARO no es un villano;
- una Attention Door no es una vulnerabilidad;
- no revelar si el mensaje del Caso 3 era legítimo;
- evaluar proceso y calibración, no únicamente acierto;
- “temporal” no equivale a “limitado” en el Caso 4;
- Jerarquía no es una Attention Door;
- Validación no es una Attention Door;
- el juego debe ampliar agencia, no generar miedo permanente.

---

# 4. Arquitectura propuesta

```text
DIGITAL-SELF-ATTENTION-DOORS/
│
├── 00_HOME/
│   ├── README.md
│   ├── MAPA_DEL_CEREBRO.md
│   ├── GLOSARIO_CANONICO.md
│   └── ESTADO_DEL_PROYECTO.md
│
├── 01_CANON/
│   ├── tesis-central.md
│   ├── sistema-sociotecnico.md
│   ├── agencia-humana.md
│   ├── digital-footprint.md
│   ├── digital-self.md
│   ├── attention-doors.md
│   ├── proceso-de-decision.md
│   ├── PARA.md
│   ├── IA-como-espejo-sparring-asistente.md
│   ├── principios-eticos.md
│   └── limites-epistemologicos.md
│
├── 02_ATTENTION_DOORS/
│   ├── identidad.md
│   ├── curiosidad.md
│   ├── responsabilidad.md
│   ├── justicia.md
│   ├── coherencia.md
│   ├── pertenencia.md
│   ├── proteccion.md
│   ├── perdida.md
│   ├── conveniencia-rutina.md
│   └── relaciones-entre-puertas.md
│
├── 03_RESEARCH/
│   ├── biblioteca/
│   ├── claims/
│   ├── human-factor/
│   ├── AI-and-cybercrime/
│   ├── social-engineering-phishing/
│   ├── decision-making/
│   ├── attention-emotion-bias/
│   ├── human-AI-interaction/
│   ├── learning-training/
│   ├── games-gamification/
│   ├── cybersecurity-reports/
│   └── research-gaps.md
│
├── 04_THEORETICAL_LENSES/
│   ├── signal-detection-theory.md
│   ├── TRA-TPB.md
│   ├── protection-motivation-theory.md
│   ├── cognitive-entrenchment.md
│   ├── cognitive-offloading.md
│   ├── judge-advisor-advice-taking.md
│   ├── trust-in-automation.md
│   ├── human-AI-agency.md
│   └── self-determination-autonomy.md
│
├── 05_METHODOLOGY/
│   ├── learning-philosophy.md
│   ├── training-vs-intervention.md
│   ├── competencies.md
│   ├── deliberate-practice.md
│   ├── metacognition.md
│   ├── progressive-difficulty.md
│   ├── feedback.md
│   ├── simulation-design.md
│   ├── safe-deception.md
│   ├── continuous-training.md
│   └── measurement-principles.md
│
├── 06_PRODUCT_SYSTEM/
│   ├── product-architecture.md
│   ├── design-principles.md
│   ├── game-design-principles.md
│   ├── common-mechanics/
│   ├── shared-content/
│   ├── prompt-library/
│   ├── narrative-system/
│   └── analytics-framework/
│
├── 07_PRODUCTS/
│   ├── webinar/
│   │   ├── PRODUCT.md
│   │   ├── learning-journey.md
│   │   ├── facilitation.md
│   │   ├── presentation.md
│   │   └── results-lessons.md
│   │
│   ├── game-faro-v3plus/
│   │   ├── GAME.md
│   │   ├── narrative.md
│   │   ├── rules.md
│   │   ├── state-machine.md
│   │   ├── scoring-D-N.md
│   │   ├── cases/
│   │   ├── feedback-system.md
│   │   ├── telemetry.md
│   │   ├── facilitator-mode.md
│   │   └── implementation-map.md
│   │
│   └── future-products/
│
├── 08_EVIDENCE_AND_VALIDATION/
│   ├── framework-hypotheses.md
│   ├── validation-roadmap.md
│   ├── attention-doors-validation.md
│   ├── product-evaluation.md
│   ├── webinar-evidence.md
│   └── open-questions.md
│
├── 09_COMMERCIAL/
│   ├── positioning.md
│   ├── problem-space.md
│   ├── value-proposition.md
│   ├── audiences.md
│   ├── offer-architecture.md
│   ├── use-cases.md
│   ├── evidence-for-sales.md
│   ├── objections.md
│   └── sales-assets/
│
├── 10_GOVERNANCE/
│   ├── authorship-IP.md
│   ├── privacy-data.md
│   ├── ethical-guardrails.md
│   ├── terminology-rules.md
│   ├── decision-log.md
│   ├── changelog.md
│   └── roadmap.md
│
└── 99_ARCHIVE/
    ├── MIRA/
    ├── V1/
    ├── V2/
    ├── V3/
    ├── discarded-concepts/
    └── source-conversations/
```

---

# 5. Descripción detallada de las capas

## 5.1. `00_HOME`

### `README.md`
Debe responder:
- qué es Digital Self & Attention Doors;
- qué problema resuelve;
- estado actual;
- equipo/autores;
- cómo navegar el cerebro;
- dónde están canon, investigación, productos y roadmap.

### `MAPA_DEL_CEREBRO.md`

```text
RIESGO / CONTEXTO
     ↓
INVESTIGACIÓN
     ↓
CLAIMS
     ↓
FRAMEWORK CANÓNICO
     ↓
METODOLOGÍA
     ↓
PRODUCT SYSTEM
     ↓
PRODUCTOS
     ↓
EVIDENCIA DE USO
     ↓
VALIDACIÓN / ITERACIÓN
```

Relación conceptual:

```text
Digital Footprint
      ↓
Digital Self
      ↓
hiperpersonalización / predicción
      ↓
Attention Doors
      ↓
prioridad del estímulo
      ↓
proceso de decisión
      ↓
PARA / metacognición
      ↓
agencia
```

### `GLOSARIO_CANONICO.md`
Solo términos vigentes. Cada término enlaza al documento canónico completo.

### `ESTADO_DEL_PROYECTO.md`
Una página con:
- fase actual;
- productos existentes;
- productos en desarrollo;
- investigación abierta;
- validaciones pendientes;
- decisiones próximas;
- versión vigente del framework y productos.

---

## 5.2. `01_CANON`

Fuente de verdad conceptual. Aquí no viven brainstormings.

Metadata sugerida:

```yaml
---
id: digital-self
type: concept
status: canonical
version: 1.2
last_updated: 2026-09-03
owner:
related:
  - digital-footprint
  - attention-doors
supported_by:
  - claim-001
  - claim-014
used_in:
  - webinar-v1
  - faro-case-02
supersedes:
  - digital-self-v0
---
```

Cada documento:
1. definición;
2. función;
3. qué NO significa;
4. conexiones;
5. notas epistemológicas;
6. aplicaciones;
7. investigación;
8. productos.

### Canon que debe preservarse

**Tesis central:** la tecnología reduce riesgo, pero no sustituye completamente el juicio humano. Frente a estímulos cada vez más plausibles, personalizados y difíciles de distinguir, entrenar solamente detección externa es insuficiente.

**Digital Footprint:** rastros generados por interacción digital, declarados o incidentales.

**Digital Self:** representación funcional construida mediante datos, patrones, relaciones e inferencias. No es copia exacta. Debe ser suficientemente útil para anticipar algo accionable.

> **Digital Footprint = evidencia disponible.  
> Digital Self = representación construida a partir de ella.**

**Attention Doors:** vías mediante las cuales un estímulo adquiere prioridad en un contexto. No son vulnerabilidades, rasgos ni diagnósticos.

Nueve puertas:
1. Identidad
2. Curiosidad
3. Responsabilidad
4. Justicia
5. Coherencia
6. Pertenencia
7. Protección
8. Pérdida
9. Conveniencia/Rutina

**Proceso de decisión:** conservar su evolución histórica. La formulación original y la incorporación posterior de historia/interpretación deben quedar trazadas. La versión operativa puede organizarse en:
- condiciones de entrada;
- construcción de sentido;
- condiciones de salida.

**PARA:** Pausar, Analizar, Revisar, Actuar.

> **Pausar, Analizar y Revisar mantienen abierta la decisión. Actuar la convierte en conducta.**

**IA como aliada:**
1. espejo;
2. sparring;
3. asistente de decisión segura.

---

## 5.3. `02_ATTENTION_DOORS`

Una ficha viva por puerta.

Template:

```markdown
# Protección

## 1. Definición canónica
## 2. Función propuesta
## 3. Qué NO significa
## 4. Sustratos teóricos relacionados
## 5. Evidencia
## 6. Contextos de prioridad
## 7. Señales internas posibles
## 8. Relación con otras puertas
## 9. Ejemplos legítimos
## 10. Ejemplos de influencia / ingeniería social
## 11. Aplicaciones en ciberseguridad
## 12. Formas de entrenamiento
## 13. Productos donde aparece
## 14. Hipótesis abiertas
## 15. Riesgos de interpretación
## 16. Bibliografía
```

`relaciones-entre-puertas.md` debe documentar solapamientos y combinaciones sin asumir independencia estadística.

---

## 5.4. `03_RESEARCH`

Base documental externa. No se mezcla con canon.

### `biblioteca/`

Ficha por fuente:

```yaml
---
id: source-wood-neal-2007
type: source
status: active
authors:
year:
title:
journal:
doi:
url:
source_type: academic
quality: peer-reviewed
topics:
  - habits
  - automaticity
related_framework:
  - convenience-routine
---
```

Contenido:
- resumen;
- hallazgos;
- limitaciones;
- qué NO permite concluir;
- citas clave;
- claims relacionados.

### `claims/`

Un claim es una afirmación reutilizable.

```yaml
---
id: claim-ai-phishing-personalization
type: claim
status: supported
confidence: medium-high
last_verified: 2026-09-03
sources:
  - source-x
  - source-y
used_in:
  - framework
  - commercial
  - webinar
---
```

Separar SOURCE y CLAIM evita que datos temporales se vuelvan “verdades eternas”.

### Dominios

- `human-factor/`
- `AI-and-cybercrime/`
- `social-engineering-phishing/`
- `decision-making/`
- `attention-emotion-bias/`
- `human-AI-interaction/`
- `learning-training/`
- `games-gamification/`
- `cybersecurity-reports/`

La conversación **Organizar podcast ciberseguridad** debe alimentar especialmente `games-gamification/` y metodología; no archivarse solo como “podcast”.

---

## 5.5. `04_THEORETICAL_LENSES`

Las teorías existentes funcionan como lentes explicativas, no como una teoría Frankenstein.

Template:
- qué problema explica;
- variables;
- relaciones;
- evidencia;
- límites;
- conexión legítima;
- qué NO afirmar;
- aplicación en formación;
- aplicación en intervención;
- productos;
- bibliografía.

Lentes ya desarrollados:
1. Signal Detection Theory
2. TRA / TPB
3. Protection Motivation Theory
4. Cognitive Entrenchment
5. Cognitive Offloading
6. Judge–Advisor / Advice Taking
7. Trust in Automation / Appropriate Reliance
8. Human–AI Agency
9. Self-Determination Theory como lente de autonomía

---

## 5.6. `05_METHODOLOGY`

Contiene **cómo desarrollamos capacidad**.

### `learning-philosophy.md`
- aprendizaje activo;
- experiencia antes de explicación cuando sea útil;
- dificultad progresiva;
- práctica situada;
- consecuencias visibles;
- error seguro;
- debrief;
- transferencia.

### `training-vs-intervention.md`

**Formación:** desarrolla lenguaje, conocimiento, habilidades, repertorios y práctica.

**Intervención:** modifica condiciones reales:
- interfaces;
- defaults;
- fricciones;
- procedimientos;
- canales;
- permisos;
- normas;
- roles;
- incentivos;
- cultura.

### `competencies.md`

Inventario vivo:
- reconocimiento de estados internos;
- separación hechos/inferencias;
- tolerancia a incertidumbre;
- identificación de puertas;
- verificación independiente;
- pensamiento probabilístico;
- formulación de hipótesis;
- regulación emocional;
- appropriate reliance;
- reversibilidad;
- ampliación de repertorio;
- criterio humano-IA;
- escalamiento;
- metacognición.

### `safe-deception.md`
El engaño pedagógico solo es legítimo si:
- no produce daño;
- no humilla;
- no recoge credenciales;
- no explota trauma;
- tiene debrief;
- explica el mecanismo;
- devuelve control;
- transforma sorpresa en estrategia.

### `continuous-training.md`
- práctica distribuida;
- repetición espaciada;
- escenarios variables;
- dificultad adaptativa;
- feedback;
- sparring;
- microprácticas;
- transferencia.

---

## 5.7. `06_PRODUCT_SYSTEM`

Define qué convierte un producto cualquiera en un producto Digital Self & Attention Doors.

### `design-principles.md`
1. El humano es agente, no “weakest link”.
2. La tecnología amplía capacidad, no sustituye juicio.
3. Señales externas siguen importando.
4. Señales internas amplían la lectura.
5. Attention Doors no son vulnerabilidades.
6. Objetivo = agencia.
7. No entrenar paranoia.
8. Evaluar proceso, no solo outcome.
9. Incertidumbre segura.
10. Acciones proporcionales y reversibles.
11. Verificación independiente.
12. IA como riesgo y aliada.
13. Práctica contextual.
14. Debrief como parte del aprendizaje.
15. Dificultad progresiva.

### `game-design-principles.md`
Elementos reutilizables:
- estímulo;
- reacción inicial;
- PARA;
- deliberación;
- costos;
- consecuencias;
- feedback;
- reintento;
- telemetría;
- resultados colectivos;
- anonimato.

### `common-mechanics/`
Una ficha por mecánica reusable.

### `prompt-library/`
Versionar:
- Espejo;
- Sparring;
- Asistente;
- auditoría Digital Self;
- prompts Attention Doors;
- protocolos de reflexión.

### `narrative-system/`
Reglas:
- IA no villana;
- conflicto sociotécnico;
- ambigüedad;
- recuperación de agencia;
- evitar moralización;
- sorpresa → conciencia → comprensión → práctica → agencia.

### `analytics-framework/`
Observar:
- reactividad;
- uso de PARA;
- apertura de alternativas;
- calidad de verificación;
- dependencia del sistema;
- reversibilidad;
- puertas seleccionadas;
- impulso vs acción;
- evolución entre rondas.

Analytics no equivale a diagnóstico.

---

## 5.8. `07_PRODUCTS`

### Webinar

`PRODUCT.md`:
- propósito;
- audiencia;
- duración;
- propuesta de valor;
- objetivos;
- Bloom;
- relación con oferta posterior;
- requisitos;
- límites.

El webinar probado debe registrarse como **primer producto aplicado / proof-of-concept**.

`learning-journey.md`:
> **CONFIAR → SER MODELADO → NOTAR → DECIDIR**

- Caso 1: autoridad y confianza calibrada.
- Caso 2: representación/predicción.
- Caso 3: señales internas + externas + verificación.
- Caso 4: autenticidad no hace obvia la decisión; ampliar repertorio.

`results-lessons.md` debe registrar:
- fecha;
- audiencia;
- asistentes;
- reacción;
- preguntas;
- comentarios;
- interés;
- leads;
- oportunidades;
- qué funcionó;
- qué cambiar;
- hipótesis.

La recepción positiva es evidencia de producto/mercado y engagement, no validación científica del framework.

### Juego FARO V3+

Primer objetivo:
> `FARO_WEBINAR_GAME_V3PLUS_CANON.md`

Debe consolidar lo efectivamente usado, hoy distribuido entre especificaciones, V3, ajustes posteriores y código.

`GAME.md` debe explicar el juego sin código.

`rules.md` debe documentar:
- seis acciones;
- tipos;
- D/N;
- signos;
- outcome;
- Review vs Act;
- Considerar/Descartar;
- feedback dinámico;
- máximo de frases;
- reglas de puertas;
- anonimato;
- timing;
- excepciones.

`cases/`:
- case-01-autonomia.md
- case-02-digital-self.md
- case-03-senales.md
- case-04-decision.md

Cada caso:
- propósito;
- narrativa;
- estímulo;
- reacciones;
- Analyze;
- Review;
- Act;
- D/N;
- feedback;
- outcomes;
- debrief;
- relación con canon;
- decisiones de diseño.

---

## 5.9. `08_EVIDENCE_AND_VALIDATION`

Separar:
> “el producto funciona”
de
> “la teoría está validada”.

### `framework-hypotheses.md`
Ejemplos:
- las Doors pueden ser una taxonomía pedagógica útil;
- reconocer saliencia interna puede mejorar deliberación;
- PARA puede ampliar alternativas;
- feedback metacognitivo puede mejorar transferencia;
- simulación contextual puede mejorar formación frente a awareness genérico.

### `attention-doors-validation.md`
Roadmap:
- revisión de expertos;
- entrevistas cognitivas;
- análisis semántico;
- overlap;
- banco de ítems;
- estabilidad;
- convergencia;
- discriminación;
- valor predictivo;
- utilidad pedagógica.

Primero definir qué queremos validar; psicometría no debe asumirse como único objetivo.

### `webinar-evidence.md`
Separar:
- evidencia de experiencia;
- evidencia de aprendizaje;
- evidencia de mercado;
- evidencia de efectividad.

---

## 5.10. `09_COMMERCIAL`

La capa comercial consume el cerebro; no inventa una realidad paralela.

### `positioning.md`
Definir categoría:
- cybersecurity awareness;
- human factor capability;
- behavioral cybersecurity;
- human-AI decision training;
- otra.

### `problem-space.md`
Claims comerciales respaldados:
- señales tradicionales pueden ser insuficientes;
- IA aumenta personalización;
- factor humano sigue siendo relevante;
- training genérico tiene límites;
- decisiones ocurren bajo presión y contexto.

### `offer-architecture.md`

```text
AWARENESS / ENTRY
Webinar

CAPABILITY BUILDING
Workshop
Program
Simulations
Games
AI Sparring
Continuous practice

ASSESSMENT / DIAGNOSTIC
Organizational assessment
Decision patterns
Process risks

INTERVENTION
Behavioral redesign
Process redesign
Defaults
Interfaces
Controls
Experiments
Measurement
```

### `evidence-for-sales.md`
Selección comercial de:
- estadísticas;
- fuentes;
- hallazgos;
- resultados propios;
- casos.

Siempre con fecha y fuente.

---

## 5.11. `10_GOVERNANCE`

### `authorship-IP.md`
Registrar autoría, coautoría, colaboradores, licencias, atribución y uso.

### `privacy-data.md`
Fijar:
- qué datos puede recoger un producto;
- qué datos no;
- retención;
- anonimización;
- IA externa;
- políticas organizacionales;
- consentimiento.

### `terminology-rules.md`
Ejemplos:
- no usar “vulnerabilidad” para una puerta;
- no decir “tu puerta es X”;
- no decir diagnóstico;
- FARO no es enemigo;
- Digital Self no es copia exacta;
- calibración no es verdad psicológica.

### `decision-log.md`

Formato:

```markdown
# DEC-006 — No revelar legitimidad del mensaje del Caso 3

## Estado
Accepted

## Contexto
## Decisión
## Razones
## Alternativas descartadas
## Consecuencias
## Archivos afectados
## Fecha
```

Decisiones a registrar:
- DEC-001 — Humanizar al factor humano; no “weakest link”.
- DEC-002 — Nueve Attention Doors oficiales.
- DEC-003 — Jerarquía no es Attention Door.
- DEC-004 — Validación no es Attention Door.
- DEC-005 — FARO reemplaza MIRA.
- DEC-006 — Caso 3 no revela ground truth.
- DEC-007 — Evaluar calidad del proceso, no solo acierto.
- DEC-008 — D/N reemplaza valores fijos.
- DEC-009 — Revisar no ejecuta.
- DEC-010 — Caso 4: autenticidad ≠ decisión obvia.
- DEC-011 — IA como espejo, sparring y asistente.
- DEC-012 — emoción debe terminar en agencia, no miedo.

---

## 5.12. `99_ARCHIVE`

### `source-conversations/`
Debe incluir al menos:
1. conversación principal Digital Self / Attention Doors;
2. **Ciberseguridad y factor humano**;
3. **Organizar podcast ciberseguridad**.

Conservarlas por su valor histórico y de reasoning, pero no como fuente de verdad.

Pipeline:

```text
CONVERSACIONES
      ↓
EXTRACCIÓN
      ↓
NORMALIZACIÓN
      ↓
DECISIONES
      ↓
CANON
```

---

# 6. Metadata estándar

```yaml
---
id: attention-door-proteccion
type: concept
status: canonical
version: 1.1
owner:
created:
last_updated: 2026-09-03

related:
  - attention-doors
  - responsibility
  - loss
  - protection-motivation-theory
  - PARA

supported_by:
  - claim-017
  - source-rogers-1975

used_in:
  - faro-case-03
  - future-training-module

supersedes:
  - protection-definition-v0

confidence:
  conceptual: high
  empirical_taxonomy: provisional
---
```

---

# 7. Tipos de objeto

- `concept`
- `door`
- `source`
- `claim`
- `theory`
- `method`
- `competency`
- `product`
- `game`
- `case`
- `mechanic`
- `prompt`
- `decision`
- `hypothesis`
- `evidence`
- `commercial_asset`
- `archive`

---

# 8. Relaciones recomendadas

Ejemplo:

```text
Protección
   → related_theory → Protection Motivation Theory
   → supported_by → claims / fuentes
   → trained_by → activity X
   → used_in → FARO Case 3
   → measured_by → indicator Y
   → related_door → Responsabilidad
```

Otro:

```text
Appropriate Reliance
   → theoretical_lens
   → supports → Agencia
   → informs → Caso 1
   → operationalized_by → reversible permissions
   → observed_with → telemetry
```

---

# 9. Reglas de fuente de verdad

Jerarquía sugerida:

1. decisiones explícitas vigentes (`decision-log`);
2. canon;
3. especificación vigente del producto;
4. metodología;
5. investigación / claims;
6. versiones anteriores;
7. conversaciones.

La evidencia externa puede exigir revisar el framework, pero el cambio debe convertirse en una decisión explícita de gobernanza.

---

# 10. Versionamiento

Evitar:
```text
framework-final.md
framework-final2.md
framework-final-final.md
```

Preferir:
```yaml
version: 1.3
status: canonical
supersedes: framework-v1.2
```

Changelog debe registrar cambios como:
- FARO reemplaza MIRA;
- restauración de nueve puertas;
- D/N;
- feedback dinámico;
- V3+;
- Caso 3 sin ground truth;
- Caso 4 reformulado.

---

# 11. Inventario mínimo que NO debemos perder

## Investigación
- factor humano;
- ingeniería social;
- psicología del engaño;
- GenAI;
- hiperpersonalización;
- OSINT;
- spear phishing;
- entrenamiento continuo;
- límites del awareness;
- DBIR 2026;
- exploitation of vulnerabilities;
- phishing;
- social engineering.

## Framework
- sistema sociotécnico;
- agencia;
- Digital Footprint;
- Digital Self;
- nueve Doors;
- proceso;
- historia interna;
- entrada/sentido/salida;
- PARA;
- metacognición;
- señales internas/externas;
- espejo;
- sparring;
- asistente.

## Teoría
- Signal Detection;
- TRA/TPB;
- PMT;
- Cognitive Entrenchment;
- Cognitive Offloading;
- Advice Taking;
- Trust in Automation;
- Appropriate Reliance;
- Human–AI Agency;
- Self-Determination;
- teorías específicas detrás de Doors.

## Formación
- gamificación;
- juego;
- motivación;
- deliberate practice;
- feedback;
- dificultad;
- simulación;
- debrief;
- transferencia;
- role-play;
- continuous training.

## Ética
- no humillar;
- no culpabilizar;
- no diagnosticar;
- no recolectar secretos;
- safe deception;
- debrief;
- privacidad;
- dignidad;
- consentimiento.

## Webinar / FARO
- apertura;
- narrativa;
- PARA;
- cuatro casos;
- D/N;
- feedback dinámico;
- outcomes;
- Door telemetry;
- resultados grupales;
- cofre/prompts;
- facilitación;
- cierre;
- V3+.

## Podcast
Capitalizar la conversación como investigación metodológica sobre juego, psicología, motivación, aprendizaje, cybersecurity, neurociencia cognitiva cuando corresponda y por qué práctica > exposición pasiva.

---

# 12. Migración recomendada

## Fase 1 — Congelar fuentes
Recolectar conversaciones, archivos ChatGPT, Antigravity, código, research, slides, documentos y prompts. No editar todavía.

## Fase 2 — Inventario
Tabla:
| Fuente | Fecha | Tema | Estado | Vigencia | Debe migrarse |

## Fase 3 — Canon mínimo
Crear:
- tesis;
- Digital Self;
- Footprint;
- Doors;
- proceso;
- PARA;
- agencia;
- ética.

## Fase 4 — Consolidar FARO V3+
Antes de nuevos juegos: documentar exactamente el producto existente.

## Fase 5 — Normalizar investigación
Crear fuentes, claims, tags y bibliografía.

## Fase 6 — Methodology + Product System
Extraer principios comunes.

## Fase 7 — Resultados del webinar
Documentarlos antes de perder memoria cualitativa.

## Fase 8 — Oferta comercial
Construirla cuando podamos distinguir:
- qué sabemos;
- qué ofrecemos;
- qué evidencia tenemos;
- qué falta validar.

---

# 13. Cómo comparar esta propuesta con la de Antigravity

No comparar solo árboles de carpetas. Evaluar capacidades.

1. **Epistemología:** ¿distingue fuente, claim, hipótesis, canon y producto?
2. **Fuente de verdad:** ¿es evidente qué versión está vigente?
3. **Trazabilidad:** ¿podemos navegar claim → fuente → concepto → producto → medición?
4. **Reutilización:** ¿los productos consumen conocimiento común o duplican teoría?
5. **Evolución:** ¿podemos cambiar el framework sin perder la historia?
6. **Producto:** ¿un juego está documentado fuera del código?
7. **Comercial:** ¿podemos producir claims respaldados sin revisar conversaciones?
8. **Validación:** ¿distingue engagement, aprendizaje, mercado y validez científica?
9. **Gobernanza:** ¿quién decide cambios canónicos?
10. **Escalabilidad:** ¿soporta nuevos juegos, talleres, assessments, intervenciones, estudios y clientes?

---

# 14. Riesgos a evitar

1. **Wiki gigante:** muchos archivos sin relaciones ni fuente de verdad.
2. **RAG dump:** cargar conversaciones en un vector store y llamarlo cerebro.
3. **Canon duplicado:** varias definiciones del mismo concepto.
4. **Productos como silos:** cada juego reconstruye su teoría.
5. **Investigación ornamental:** papers sin claims ni conexión.
6. **Borrar evolución:** perder el criterio.
7. **Sobrevalidación:** presentar las nueve Doors como ciencia establecida.
8. **Comercial separado de evidencia:** marketing afirma cosas que el cerebro no soporta.

---

# 15. Qué debe poder contestar para llamarlo “cerebro”

- **Conceptual:** ¿qué significa Pérdida?
- **Epistémica:** ¿qué nivel de evidencia tiene?
- **Teórica:** ¿qué teorías se relacionan?
- **Aplicada:** ¿cómo la entrenamos?
- **Producto:** ¿dónde aparece?
- **Histórica:** ¿cuándo cambió?
- **Comercial:** ¿qué podemos afirmar responsablemente?
- **Validación:** ¿qué todavía no sabemos?

Si conecta esas dimensiones, tenemos un cerebro.

Si solo encuentra documentos, tenemos un repositorio.

---

# 16. Recomendación final

La estructura exacta de carpetas puede cambiar.

Lo no negociable es mantener separaciones:

```text
EVIDENCIA
≠
CONSTRUCCIÓN TEÓRICA
≠
CANON
≠
METODOLOGÍA
≠
PRODUCTO
≠
CÓDIGO
≠
RESULTADOS
≠
COMERCIAL
≠
HISTORIA
```

Y relaciones:

```text
FUENTE → CLAIM
CLAIM → CONCEPTO
CONCEPTO → MÉTODO
MÉTODO → PRODUCTO
PRODUCTO → EVIDENCIA
EVIDENCIA → ITERACIÓN
ITERACIÓN → DECISIÓN
DECISIÓN → NUEVO CANON
```

El resultado debe ser un sistema capaz de crecer durante años sin perder trazabilidad, rigor intelectual, identidad metodológica ni memoria de diseño.

---

# 17. Preguntas para el análisis cruzado con Antigravity

1. ¿Qué elementos aparecen en ambas propuestas?
2. ¿Qué resuelve Antigravity mejor?
3. ¿Qué resuelve esta propuesta mejor?
4. ¿Qué capas son redundantes?
5. ¿Qué capas faltan?
6. ¿Qué estructura favorece más el trabajo diario?
7. ¿Qué estructura favorece más agentes de IA?
8. ¿Qué estructura favorece más trabajo colaborativo?
9. ¿Qué arquitectura reduce mejor contradicciones?
10. ¿Qué arquitectura permite más fácilmente nuevos productos?
11. ¿Cómo se manejará el canon?
12. ¿Cómo se manejarán las fuentes?
13. ¿Cómo se registrarán decisiones?
14. ¿Cómo se versionarán juegos?
15. ¿Cómo se integrará código con especificaciones?
16. ¿Qué debe automatizar Antigravity?
17. ¿Qué debe requerir revisión humana?
18. ¿Qué documentos mínimos deben existir antes de la siguiente fase comercial?

El objetivo del contraste no es elegir una propuesta ganadora.

Es construir una tercera arquitectura que combine lo mejor de ambas y se convierta en el **sistema operativo de conocimiento de Digital Self & Attention Doors**.
