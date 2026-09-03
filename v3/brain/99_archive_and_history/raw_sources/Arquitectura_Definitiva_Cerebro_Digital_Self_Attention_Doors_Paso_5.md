# ARQUITECTURA DEFINITIVA DEL CEREBRO DE CONOCIMIENTO
## Digital Self & Attention Doors
### Paso 5 — Síntesis final ChatGPT + Antigravity

**Versión:** 1.0 — Arquitectura definitiva recomendada  
**Fecha:** 2026-09-03  
**Rol de este documento:** especificación estratégica y epistemológica definitiva que Antigravity debe utilizar para construir el plan de implementación del cerebro.

---

# 0. Decisión ejecutiva

Tras contrastar:

- la propuesta inicial de Antigravity;
- la propuesta inicial de ChatGPT;
- la tercera arquitectura síntesis;
- las 14 respuestas operativas de Antigravity;
- el Documento Maestro final de **Digital Self & Attention Doors**;
- el Documento Maestro final de **Producción y Ejecución del Webinar**;
- la evolución del juego hasta **FARO V3+**;
- y las decisiones conceptuales tomadas durante las conversaciones fundacionales;

la recomendación definitiva es construir **un solo cerebro Git/Markdown**, dentro de `/v3/brain/`, organizado en **8 capas activas + archivo histórico**, con:

1. gobernanza explícita;
2. Canon separado de estatus epistemológico;
3. investigación externa trazable mediante **Sources + Claims + Syntheses**;
4. teoría propia separada de lentes teóricas externas;
5. metodología y Product System reutilizables;
6. productos concretos desacoplados de sus componentes;
7. evidencia y validación propia separada de la investigación externa;
8. sistema comercial rápido, pero restringido por claims autorizados;
9. archivo histórico protegido contra contaminación de contexto;
10. auditorías determinísticas y semánticas diseñadas específicamente para reducir deriva conceptual y alucinaciones.

La arquitectura debe optimizar simultáneamente:

> **Rigor epistemológico + operación ágil + trazabilidad + reutilización + velocidad comercial + escalabilidad de producto + seguridad frente a alucinaciones.**

---

# 1. Principios no negociables

## 1.1. Un solo cerebro

Solo existe una fuente documental activa:

```text
/v3/brain/
```

El código vigente vive en:

```text
/v3/app/
```

Todo lo demás es:

- fuente cruda;
- material histórico;
- documentación legacy;
- o insumo pendiente de migración.

---

## 1.2. Markdown + Git First

La fuente de verdad documental es Markdown versionado en Git.

No depender de:

- Notion;
- Obsidian como base propietaria;
- bases cerradas;
- memoria de un modelo;
- conversaciones aisladas.

Obsidian, Foam u otros pueden actuar como visores, nunca como fuente de verdad.

---

## 1.3. El cerebro es un sistema de conocimiento, no un repositorio

Debe permitir navegar relaciones como:

```text
SOURCE
   ↓
CLAIM
   ↓
SYNTHESIS
   ↓
CANON / METHOD
   ↓
PRODUCT SYSTEM
   ↓
PRODUCT
   ↓
EVIDENCE
   ↓
ITERATION
   ↓
DECISION
   ↓
NEW CANON
```

---

## 1.4. El Framework está por encima de los productos

Ejemplo:

```text
Digital Self
      ↓
Webinar
      ↓
FARO
      ↓
Caso 2
```

La definición de Digital Self no vive únicamente dentro del Caso 2.

---

## 1.5. El código no es la documentación

Una persona debe poder entender FARO aunque `game.js` desaparezca.

El código implementa una especificación.

No define retroactivamente la especificación.

---

## 1.6. La historia se conserva, pero no compite con el presente

Nunca borrar:

- MIRA;
- V1;
- V2;
- V3;
- conversaciones;
- conceptos descartados;
- decisiones anteriores;
- documentos maestros previos.

Pero los agentes no deben consultarlos durante tareas ordinarias salvo instrucción explícita.

---

# 2. Decisión epistemológica central: CANON ≠ VERDAD CIENTÍFICA

Este es el principio más importante del cerebro.

## 2.1. Canon

**Canon** significa:

> La formulación oficial y vigente que el equipo ha decidido utilizar.

No significa:

> Científicamente demostrado.

Por tanto, es perfectamente legítimo tener:

```yaml
status: canonical
epistemic_status: provisional
```

Ejemplo:

Las nueve Attention Doors son el **Canon vigente del framework**.

Pero la taxonomía integrada:

- no es todavía una escala psicométrica validada;
- no afirma que existan exactamente nueve puertas universales;
- no afirma independencia estadística;
- no afirma exclusividad entre categorías.

---

## 2.2. Dos ejes ortogonales

### Eje de gobernanza

```text
working
review
canonical
deprecated
archived
```

### Eje epistemológico

```text
established
supported
provisional
speculative
mixed
not_applicable
```

---

## 2.3. Definiciones del eje epistemológico

### `established`

Concepto, relación o hallazgo ampliamente establecido en literatura de calidad suficiente.

No debe usarse para declarar “establecida” una construcción original del framework sin validación.

### `supported`

Claim respaldado por evidencia relevante, pero con límites de contexto, generalización o fuerza.

### `provisional`

Construcción, hipótesis o taxonomía propia utilizada actualmente, pero pendiente de validación adicional.

### `speculative`

Idea exploratoria todavía sin soporte suficiente.

### `mixed`

La evidencia disponible es inconsistente, contextual o disputada.

### `not_applicable`

Objeto operativo que no pretende ser un claim empírico.

Ejemplos:

- regla de juego;
- ADR;
- especificación de producto;
- código;
- naming.

---

# 3. Arquitectura definitiva de carpetas

```text
DigitalSelf_AttentionDoors/
│
├── v3/
│   │
│   ├── brain/
│   │   │
│   │   ├── INDEX.md
│   │   ├── GLOSARIO_CANONICO.md
│   │   ├── ESTADO_DEL_PROYECTO.md
│   │   │
│   │   ├── 00_meta_and_governance/
│   │   │   ├── README.md
│   │   │   ├── canon_governance.md
│   │   │   ├── epistemic_status_standard.md
│   │   │   ├── ontology_and_types.md
│   │   │   ├── terminology_rules.md
│   │   │   ├── ethical_guardrails.md
│   │   │   ├── contribution_guide.md
│   │   │   ├── agent_operating_rules.md
│   │   │   ├── authorship_ip.md
│   │   │   ├── privacy_and_data.md
│   │   │   ├── source_registry.yaml
│   │   │   ├── migration_manifest.yaml
│   │   │   ├── changelog.md
│   │   │   ├── decision_log/
│   │   │   ├── audit_rules/
│   │   │   └── audit_reports/
│   │   │
│   │   ├── 01_research_and_lenses/
│   │   │   ├── README.md
│   │   │   ├── sources/
│   │   │   ├── claims/
│   │   │   │   ├── claims_human_factor.md
│   │   │   │   ├── claims_genai_social_engineering.md
│   │   │   │   ├── claims_attention_decision.md
│   │   │   │   ├── claims_training_learning.md
│   │   │   │   ├── claims_games_gamification.md
│   │   │   │   └── claims_human_ai.md
│   │   │   ├── syntheses/
│   │   │   │   ├── human_factor_cybersecurity.md
│   │   │   │   ├── ai_and_social_engineering.md
│   │   │   │   ├── decision_making.md
│   │   │   │   ├── attention_emotion_bias.md
│   │   │   │   ├── cybersecurity_training_effectiveness.md
│   │   │   │   ├── games_gamification_learning.md
│   │   │   │   └── human_ai_agency.md
│   │   │   ├── theoretical_lenses/
│   │   │   └── industry_reports/
│   │   │
│   │   ├── 02_framework_canon/
│   │   │   ├── README.md
│   │   │   ├── thesis.md
│   │   │   ├── sociotechnical_system.md
│   │   │   ├── human_agency.md
│   │   │   ├── digital_footprint.md
│   │   │   ├── digital_self.md
│   │   │   ├── attention_doors/
│   │   │   │   ├── README.md
│   │   │   │   ├── identity.md
│   │   │   │   ├── curiosity.md
│   │   │   │   ├── responsibility.md
│   │   │   │   ├── justice.md
│   │   │   │   ├── coherence.md
│   │   │   │   ├── belonging.md
│   │   │   │   ├── protection.md
│   │   │   │   ├── loss.md
│   │   │   │   ├── convenience_routine.md
│   │   │   │   └── relationships_and_overlaps.md
│   │   │   ├── decision_process.md
│   │   │   ├── internal_story.md
│   │   │   ├── metacognition.md
│   │   │   ├── PARA.md
│   │   │   ├── AI_roles.md
│   │   │   ├── framework_ethics.md
│   │   │   └── epistemic_boundaries.md
│   │   │
│   │   ├── 03_methodology_and_learning/
│   │   │   ├── README.md
│   │   │   ├── learning_philosophy.md
│   │   │   ├── training_vs_intervention.md
│   │   │   ├── competencies_inventory.md
│   │   │   ├── deliberate_practice.md
│   │   │   ├── simulation_based_learning.md
│   │   │   ├── progressive_difficulty.md
│   │   │   ├── feedback_principles.md
│   │   │   ├── safe_deception_protocol.md
│   │   │   ├── continuous_training.md
│   │   │   ├── transfer.md
│   │   │   ├── facilitation_principles.md
│   │   │   └── measurement_principles.md
│   │   │
│   │   ├── 04_product_system/
│   │   │   ├── README.md
│   │   │   ├── design_principles.md
│   │   │   ├── game_design_principles.md
│   │   │   ├── narrative_principles.md
│   │   │   ├── analytics_principles.md
│   │   │   ├── common_mechanics/
│   │   │   ├── prompt_library/
│   │   │   └── reusable_components/
│   │   │       └── games/
│   │   │           └── faro_v3plus/
│   │   │
│   │   ├── 05_products_catalog/
│   │   │   ├── README.md
│   │   │   ├── webinars/
│   │   │   │   └── webinar_v1/
│   │   │   ├── workshops/
│   │   │   ├── programs/
│   │   │   ├── diagnostics/
│   │   │   ├── analog_products/
│   │   │   └── future_products/
│   │   │
│   │   ├── 06_evidence_and_validation/
│   │   │   ├── README.md
│   │   │   ├── framework_hypotheses.md
│   │   │   ├── validation_roadmap.md
│   │   │   ├── attention_doors_validation.md
│   │   │   ├── product_evaluation_framework.md
│   │   │   ├── product_evidence/
│   │   │   └── open_questions.md
│   │   │
│   │   ├── 07_commercial_and_gotomarket/
│   │   │   ├── README.md
│   │   │   ├── positioning.md
│   │   │   ├── problem_space.md
│   │   │   ├── value_proposition.md
│   │   │   ├── audiences_and_buyers.md
│   │   │   ├── offer_architecture.md
│   │   │   ├── use_cases.md
│   │   │   ├── evidence_for_sales.md
│   │   │   ├── objections.md
│   │   │   └── sales_assets/
│   │   │
│   │   └── 99_archive_and_history/
│   │       ├── README.md
│   │       ├── raw_sources/
│   │       ├── conversations/
│   │       ├── evolutions/
│   │       ├── discarded_concepts/
│   │       └── legacy_snapshots/
│   │
│   ├── app/
│   ├── scripts/
│   ├── tests/
│   └── README.md
│
├── .gitignore
└── README.md
```

---

# 4. Por qué esta arquitectura es el sweet spot

## 4.1. No se micro-fragmenta innecesariamente

Se adoptan archivos atómicos para objetos que poseen vida propia:

- cada Attention Door;
- cada teoría;
- cada fuente importante;
- cada caso;
- cada ADR;
- cada producto;
- cada componente reutilizable.

Pero los Claims siguen un **modelo híbrido por dominio**.

Esto evita decenas de archivos de 8 líneas sin sacrificar identidad semántica.

---

## 4.2. La granularidad es semántica

Regla:

> **Un archivo = un objeto coherente y completo.**

Los límites de líneas/tokens son alertas, no reglas rígidas.

Recomendación operativa:

- si un archivo mezcla más de un objeto conceptual: dividir;
- si supera aproximadamente 350–500 líneas: revisar, no dividir automáticamente;
- si tiene menos de ~30 líneas: revisar si realmente necesita ser archivo independiente.

---

# 5. Fuentes, Claims y Síntesis

## 5.1. Sources: atómicos

Cada paper, libro, informe o documento de autoridad relevante tiene su propio archivo.

Ejemplo:

```text
SRC-VERIZON-DBIR-2026.md
SRC-WOOD-NEAL-2007.md
SRC-VAFA-2026.md
```

Template:

```yaml
---
id: SRC-VAFA-2026
type: source
status: canonical
epistemic_status: not_applicable

title:
authors:
year:
source_type: peer_reviewed_article
publication_status:
doi:
url:

topics:
related_claims:
last_verified:

summary:
---
```

Contenido mínimo:

- qué estudia;
- metodología;
- resultados relevantes;
- limitaciones;
- qué NO permite concluir;
- relación con el proyecto.

---

## 5.2. Claims: matrices por dominio

Ejemplo:

```markdown
## CLAIM-AI-014

**Claim:** Los modelos generativos pueden reducir barreras para producir mensajes altamente personalizados y plausibles a escala.

**Epistemic status:** supported  
**Confidence:** medium-high  
**Scope:** social engineering / phishing  
**Supported by:** SRC-X, SRC-Y, SRC-Z  
**Contradicted by:** none known  
**Last verified:** 2026-09-03  
**Allowed uses:** internal, training, commercial  
**Limitations:** ...
```

Cada claim conserva su ID propio aunque comparta archivo con claims relacionados.

---

## 5.3. Allowed Uses

Todo claim debe indicar para qué puede utilizarse:

```yaml
allowed_uses:
  - internal_research
  - training_content
  - commercial
  - external_publication
```

Un claim no puede aparecer en material comercial si `commercial` no está autorizado.

---

## 5.4. Freshness

Claims temporales deben contener:

```yaml
last_verified:
review_by:
```

Ejemplos:

- DBIR;
- cifras de mercado;
- estadísticas de ataques;
- regulación;
- capacidades contemporáneas de modelos de IA.

Los conceptos teóricos históricos no necesitan la misma frecuencia de actualización.

---

# 6. Lentes teóricas

Las teorías no se fusionan dentro del framework como si juntas formaran una teoría única.

Cada lente responde:

1. ¿Qué explica?
2. ¿Qué variables contempla?
3. ¿Qué relaciones propone?
4. ¿Qué evidencia existe?
5. ¿Qué límites tiene?
6. ¿Dónde conecta legítimamente con nuestro framework?
7. ¿Qué NO podemos afirmar?
8. ¿Qué aporta a formación?
9. ¿Qué aporta a intervención?
10. ¿Dónde aparece en productos?

Lentes actuales:

- Signal Detection Theory;
- TRA / TPB;
- Protection Motivation Theory;
- Cognitive Entrenchment;
- Cognitive Offloading;
- Judge–Advisor / Advice Taking;
- Trust in Automation / Appropriate Reliance;
- Human–AI Agency;
- Self-Determination Theory como lente de autonomía.

---

# 7. Canon actual: semillas autoritativas de migración

Durante la migración existe una jerarquía temporal de fuentes.

## 7.1. Framework

El **Documento Maestro final de Digital Self & Attention Doors entregado por el usuario en el Paso 3.2** es la semilla autoritativa principal para extraer:

- tesis;
- sistema sociotécnico;
- agencia;
- Digital Footprint;
- Digital Self;
- proceso decisional;
- historia interna;
- Attention Doors;
- PARA;
- metacognición;
- IA como espejo, sparring y asistente;
- principios éticos;
- límites epistemológicos;
- competencias;
- anexos metodológicos.

Pero:

> las decisiones explícitas posteriores que corrigieron o precisaron ese documento prevalecen en los puntos específicos afectados.

Toda divergencia deberá convertirse en ADR durante la migración.

---

## 7.2. Producto Webinar / FARO

La fuente de verdad del producto ejecutado es:

> **FARO V3+ realmente utilizado en el webinar.**

Debe consolidarse desde:

- especificación funcional V3;
- contenido V3;
- ajustes finales de Caso 3;
- ajustes finales de Caso 4;
- implementación real;
- guía de facilitación V3+;
- cambios hechos directamente en Antigravity.

Resultado esperado:

```text
GAME-FARO-SIMULATION-V3PLUS
```

con una especificación canónica única.

---

## 7.3. Documento Maestro de Producción/Ejecución Webinar

El Documento Maestro final de Producción/Ejecución:

**NO describe canónicamente el webinar que finalmente se ejecutó.**

Debe clasificarse como:

```yaml
source_role: design_source
```

Su enorme valor está en recuperar:

- actividades descartadas;
- dinámicas;
- ejercicios;
- reflexiones;
- estructura conceptual;
- ideas de producto;
- materiales para talleres;
- futuras experiencias formativas.

Debe alimentar principalmente:

```text
03_methodology_and_learning
04_product_system
05_products_catalog/future_products
99_archive_and_history
```

No debe sobrescribir V3+.

---

# 8. Canon del Framework: límites conceptuales que deben protegerse

Las siguientes definiciones deben considerarse de alta sensibilidad semántica.

## 8.1. Digital Footprint

Conjunto de rastros generados por interacción digital, declarados o incidentales.

---

## 8.2. Digital Self

Representación funcional de una persona dentro del ecosistema digital construida a partir de datos, patrones e inferencias.

No es:

- copia completa;
- gemelo exacto;
- diagnóstico psicológico;
- “nuevo perímetro de ataque” como definición.

“Nueva superficie/perímetro” puede utilizarse como metáfora comunicativa si se marca como tal, pero no sustituye la definición canónica.

Formulación clave:

> **Digital Footprint = evidencia disponible.  
> Digital Self = representación construida a partir de ella.**

---

## 8.3. Attention Doors

Prioridades funcionales mediante las cuales un estímulo puede adquirir relevancia.

Pueden aumentar:

- relevancia subjetiva;
- y/o disminuir probabilidad de deliberación.

No son:

- vulnerabilidades permanentes;
- diagnósticos;
- rasgos fijos;
- “disparadores emocionales” como definición exhaustiva.

---

## 8.4. Nueve Doors oficiales

1. Identidad
2. Curiosidad
3. Responsabilidad
4. Justicia
5. Coherencia
6. Pertenencia
7. Protección
8. Pérdida
9. Conveniencia / Rutina

Jerarquía y Validación no son Doors.

---

## 8.5. Proceso decisional

El modelo pedagógico vigente reconoce seis momentos funcionales:

```text
Estado cognitivo
→ Puertas de Atención
→ Emoción
→ Sesgos
→ Decisión
→ Conducta
```

La secuencia no pretende linealidad rígida.

### Historia interna

No es un séptimo paso.

Es un producto emergente de la interacción entre:

- emoción;
- memoria;
- expectativas;
- sesgos;
- información incompleta.

Puede representarse pedagógicamente dentro de **Construcción de sentido**.

---

## 8.6. Tres macro-categorías

### Condiciones de entrada
Factores presentes al inicio que influyen en cómo recibimos la situación.

### Construcción de sentido
Proceso mediante el cual organizamos lo que ocurre y le damos interpretación.

### Condiciones de salida
Resultados que orientan la respuesta y conducta.

---

## 8.7. PARA

```text
Pausar
Analizar
Revisar
Actuar
```

Principio:

> **Pausar, Analizar y Revisar mantienen abierta la decisión. Actuar la convierte en conducta.**

---

## 8.8. IA

Roles formativos:

1. Espejo
2. Sparring
3. Asistente de decisión segura

Nunca:

- autoridad;
- diagnosticador;
- sustituto del criterio humano.

---

# 9. Product System vs Products

Esta separación es definitiva.

## 9.1. Product System

Contiene:

> ADN reusable.

Ejemplos:

- game design principles;
- narrativa;
- safe deception;
- feedback;
- common mechanics;
- prompts;
- analytics;
- componentes reutilizables.

---

## 9.2. FARO como componente reutilizable

FARO no debe estar incrustado exclusivamente dentro del webinar.

Ubicación:

```text
04_product_system/reusable_components/games/faro_v3plus/
```

Frontmatter:

```yaml
id: GAME-FARO-SIMULATION-V3PLUS
type: game
status: canonical
epistemic_status: not_applicable
```

---

## 9.3. Webinar como producto

Ubicación:

```text
05_products_catalog/webinars/webinar_v1/
```

Frontmatter:

```yaml
uses_components:
  - GAME-FARO-SIMULATION-V3PLUS
```

Mañana:

```text
Workshop 4h
```

puede declarar:

```yaml
uses_components:
  - GAME-FARO-SIMULATION-V3PLUS
```

sin duplicarlo.

---

# 10. Spec ↔ Código

## Regla absoluta

> **La especificación canónica es la fuente de verdad. El código es la implementación.**

Nunca:

```text
code change
→ auto rewrite spec
→ accidental canon
```

---

## Auditoría bidireccional

```text
SPEC
 ↕
CODE
```

El sistema:

1. compara IDs;
2. compara acciones;
3. compara nombres;
4. compara scoring;
5. compara textos críticos cuando aplique;
6. detecta divergencia;
7. bloquea CI;
8. genera reporte.

No corrige automáticamente.

Resolución:

```text
corregir código
OR
aprobar cambio de spec + ADR
```

---

# 11. Frontmatter definitivo

## 11.1. Base común

```yaml
---
id:
title:
type:
layer:

status:
epistemic_status:

version:
author:
owner:

created:
last_updated:

summary:

related:
decisions:
---
```

---

## 11.2. Relaciones por IDs, no rutas

Ejemplo:

```yaml
supported_by:
  - CLAIM-AI-014

used_in:
  - GAME-FARO-SIMULATION-V3PLUS

supersedes:
  - CON-DS-000

decisions:
  - DEC-014
```

---

## 11.3. Registry automático

Antigravity genera:

```text
ID → relative_path
```

mediante:

```text
scripts/build_registry.js
```

El registry es generado.

No se edita manualmente.

---

# 12. Reglas de operación para agentes de IA

Archivo:

```text
00_meta_and_governance/agent_operating_rules.md
```

Debe contener como mínimo:

## Regla 1 — INDEX First

Ante consultas conceptuales:

1. leer `/v3/brain/INDEX.md`;
2. identificar MOC;
3. recuperar solo los objetos necesarios.

---

## Regla 2 — Scope activo

Por defecto buscar únicamente:

```text
/v3/brain/
```

---

## Regla 3 — Archive firewall

Queda prohibido consultar:

```text
99_archive_and_history/
```

salvo solicitud explícita con intención histórica.

---

## Regla 4 — Preguntas conceptuales

Responder primero desde:

```text
02_framework_canon
```

---

## Regla 5 — Preguntas empíricas

No basta el Canon.

Se requiere:

```text
Claim → Source
```

---

## Regla 6 — Si no está, no inventar

Si el cerebro no soporta una afirmación:

> indicar que no está documentada o que permanece abierta.

No completar silenciosamente desde intuición.

---

## Regla 7 — Conflicto Canon vs evidencia

No modificar Canon automáticamente.

Crear:

```text
epistemic tension
```

y remitir a revisión / ADR.

---

## Regla 8 — Deprecated

Nunca usar contenido `deprecated` para producir material vigente, salvo contexto histórico explícito.

---

## Regla 9 — Commercial gate

Contenido comercial solo puede utilizar:

- claims con `allowed_uses: commercial`;
- `evidence_for_sales.md`;
- evidencia propia correctamente clasificada.

---

## Regla 10 — Working stays Working

Contenido generado desde fuentes `working` no puede presentarse como Canon ni promoverse automáticamente.

---

# 13. Sistema definitivo de auditoría anti-alucinación

Este sistema tiene tres niveles:

```text
LEVEL 1 — Deterministic Integrity
LEVEL 2 — Semantic Integrity
LEVEL 3 — Knowledge Regression
```

---

# 14. LEVEL 1 — Auditorías determinísticas

Ejecutadas por:

```text
npm run audit:brain
```

Idealmente:

- local;
- pre-commit opcional;
- CI obligatorio.

---

## 14.1. Identidad

### `D001_DUPLICATE_ID`
Falla si dos objetos tienen mismo ID.

### `D002_UNRESOLVED_ID`
Falla si una relación apunta a ID inexistente.

### `D003_BROKEN_LINK`
Falla si link relativo no existe.

---

## 14.2. Metadata

### `D010_SCHEMA_INVALID`
Falla si el frontmatter no cumple schema según `type`.

### `D011_CANONICAL_INCOMPLETE`
Falla si Canon carece de:
- version;
- owner;
- promoted_by;
- promotion_date;
- summary.

### `D012_INVALID_ENUM`
Falla por status/epistemic_status no reconocido.

---

## 14.3. Claims

### `D020_CLAIM_WITHOUT_SOURCE`
Falla si claim no tiene source.

### `D021_SOURCE_MISSING`
Falla si `supported_by` apunta a Source inexistente.

### `D022_STALE_TIME_SENSITIVE_CLAIM`
Alerta/Falla si `review_by` expiró.

### `D023_COMMERCIAL_UNAUTHORIZED`
Falla si material comercial usa claim sin `allowed_uses: commercial`.

---

## 14.4. Canon

### `D030_CANON_CHANGE_WITHOUT_ADR`
Falla si definición central cambia sin ADR.

### `D031_UNAUTHORIZED_PROMOTION`
Falla si canonical no registra promoción humana.

### `D032_CANON_REFERENCES_DEPRECATED`
Alerta/Falla si Canon depende de contenido deprecated.

---

## 14.5. Archivo

### `D040_ARCHIVE_REFERENCE`
Falla si Canon o producto activo enlaza directamente al archive como fuente vigente.

### `D041_EXTERNAL_V3_REFERENCE`
Falla si documento activo depende de archivo legacy fuera de `/v3/`.

---

## 14.6. Navegación

### `D050_ORPHAN_FILE`
Alerta si archivo no aparece en MOC ni es referenciado.

### `D051_MOC_MISSING`
Falla si carpeta de conocimiento no tiene MOC.

---

## 14.7. Migración

### `D060_SOURCE_NOT_IN_REGISTRY`
Alerta si aparece raw source sin registry.

### `D061_MIGRATION_FALSE_COMPLETE`
Falla si source marcada migrated conserva categorías pendientes.

### `D062_HASH_CHANGED`
Alerta si raw source cambió desde registro.

---

## 14.8. Spec ↔ Code

### `D070_SPEC_CODE_DIVERGENCE`
Falla CI.

Nunca auto-resolver.

---

## 14.9. Términos sensibles

### `D080_TERMINOLOGY_BLOCKLIST`

Escanea términos potencialmente peligrosos.

Importante:

No toda aparición debe ser error fatal.

Ejemplo:

“weakest link” puede aparecer legítimamente en:

> “No usar la metáfora weakest link”.

Por tanto el linter debe considerar:

- allowlist;
- quoted/history context;
- o emitir warning para revisión.

---

# 15. LEVEL 2 — Auditorías semánticas asistidas por LLM

Estas auditorías:

- NO modifican archivos;
- NO promueven Canon;
- generan reportes;
- requieren revisión humana.

---

## 15.1. `S001_CANON_DRIFT`

Pregunta:

> ¿Las definiciones utilizadas en productos, metodología y comercial mantienen el significado del Canon?

Ejemplos de desviación:

```text
Digital Self
canonical:
representación funcional

derivative:
gemelo digital exacto
```

Resultado:

```text
PASS
WARNING
CRITICAL
```

---

## 15.2. `S002_EPISTEMIC_ESCALATION`

Busca transformaciones como:

```text
provisional
→ probado

supported
→ demostrado

market interest
→ effectiveness

engagement
→ behavioral transfer
```

Debe detectar lenguaje:

- demuestra;
- comprueba;
- valida;
- garantiza;
- probado científicamente;

cuando el objeto no permite esa afirmación.

---

## 15.3. `S003_CLAIM_SOURCE_ENTAILMENT`

Pregunta:

> ¿Las fuentes citadas realmente respaldan el claim con el alcance y las condiciones declaradas?

Revisar:

- causalidad vs correlación;
- población;
- contexto;
- metodología;
- año;
- alcance;
- limitaciones.

---

## 15.4. `S004_DEFINITION_COLLISION`

Busca múltiples definiciones incompatibles del mismo concepto.

Especialmente:

- Digital Self;
- Attention Door;
- agencia;
- metacognición;
- PARA;
- confianza calibrada;
- historia interna.

---

## 15.5. `S005_THEORY_FRAMEWORK_LEAKAGE`

Detecta cuando:

- una lente externa;
- una mecánica;
- una heurística de producto;

se presenta como si fuera parte esencial del framework.

Ejemplos:

```text
D/N
≠
framework universal

Signal Detection
≠
Digital Self & Attention Doors completo
```

---

## 15.6. `S006_PRODUCT_THEORY_LEAKAGE`

Inverso del anterior.

Detecta reglas específicas de FARO convertidas en reglas universales.

---

## 15.7. `S007_ARCHIVE_CONTAMINATION`

Verifica que una respuesta/documento vigente no haya reutilizado silenciosamente:

- MIRA;
- V1;
- V2;
- conceptos descartados.

---

## 15.8. `S008_COMMERCIAL_OVERCLAIM`

Evalúa piezas comerciales contra:

```text
claims
+
evidence_for_sales
+
product_evidence
```

Busca:

- causalidad exagerada;
- cifras sin fecha;
- validación inexistente;
- promesas de transferencia;
- promesas de prevención;
- promesas psicométricas.

---

## 15.9. `S009_ETHICAL_DRIFT`

Detecta contenido que:

- culpabiliza;
- humilla;
- diagnostica;
- usa información sensible;
- promueve miedo sostenido;
- convierte IA en autoridad;
- normaliza engaño sin debrief.

---

## 15.10. `S010_MIGRATION_COVERAGE`

Revisa semánticamente si una fuente fundacional contiene ideas importantes que no fueron asignadas a:

- Canon;
- research;
- claim;
- methodology;
- product;
- prompt;
- commercial;
- open question;
- discarded idea.

---

# 16. LEVEL 3 — Knowledge Regression Suite

Esta es una defensa especialmente importante contra alucinaciones.

Crear:

```text
tests/brain_semantic_regression.yaml
```

Contendrá preguntas deliberadamente diseñadas para tentar al agente a equivocarse.

Ejemplos iniciales:

---

### KR-001

**Pregunta:**  
¿Jerarquía es una Attention Door?

**Respuesta esperada:**  
No. Puede ser una condición contextual/cognitiva relevante, pero no pertenece al catálogo oficial de nueve Doors.

---

### KR-002

**Pregunta:**  
¿Las nueve Attention Doors están validadas psicométricamente?

**Respuesta esperada:**  
No. Son el Canon actual del framework, pero la taxonomía integrada continúa siendo provisional desde el punto de vista de validación.

---

### KR-003

**Pregunta:**  
¿El webinar demostró que el framework cambia comportamientos a largo plazo?

**Respuesta esperada:**  
No. Puede aportar evidencia de experiencia, comprensión, uso del producto e interés comercial. La transferencia sostenida requiere evaluación posterior.

---

### KR-004

**Pregunta:**  
¿FARO es Digital Self & Attention Doors?

**Respuesta esperada:**  
No. FARO es un componente/juego que operacionaliza partes del framework.

---

### KR-005

**Pregunta:**  
¿El scoring D/N es parte del framework?

**Respuesta esperada:**  
No. Es una mecánica específica del juego FARO.

---

### KR-006

**Pregunta:**  
¿Digital Self es un gemelo digital exacto?

**Respuesta esperada:**  
No. Es una representación funcional construida con datos, patrones e inferencias; puede ser incompleta o equivocada.

---

### KR-007

**Pregunta:**  
¿Una Attention Door activada prueba que el mensaje es malicioso?

**Respuesta esperada:**  
No. Una Door ayuda a observar relevancia/prioridad interna. No autentica el estímulo.

---

### KR-008

**Pregunta:**  
¿La historia interna es el séptimo paso?

**Respuesta esperada:**  
No. Es un producto emergente dentro de la construcción de sentido.

---

### KR-009

**Pregunta:**  
¿FARO debe presentarse como antagonista?

**Respuesta esperada:**  
No. Es un sistema construido para proteger que actuó dentro de permisos disponibles; la narrativa final busca gobierno y agencia, no “derrotarlo”.

---

### KR-010

**Pregunta:**  
¿Training e intervention son equivalentes?

**Respuesta esperada:**  
No. Formación desarrolla capacidades; intervención modifica condiciones del sistema real.

---

La suite debe crecer a medida que aparezcan errores reales.

Cada alucinación detectada en producción debe convertirse, cuando aplique, en un nuevo test de regresión.

---

# 17. Brain Health Scorecard

Antigravity debe generar un reporte periódico:

```text
00_meta_and_governance/audit_reports/BRAIN_HEALTH_LATEST.md
```

Indicadores:

```text
Referential Integrity
Canonical Metadata Coverage
Claim Source Coverage
Time-sensitive Freshness
Commercial Claim Authorization
Spec-Code Sync
Migration Coverage
Orphan Count
Deprecated Leakage
Archive Contamination
Open Semantic Drift Alerts
Open Epistemic Escalation Alerts
Knowledge Regression Pass Rate
```

Ejemplo:

```text
BRAIN HEALTH

Referential Integrity ............. 100%
Canonical Metadata Coverage ....... 100%
Claims with Sources ................ 98%
Time-sensitive Claims Fresh ........ 92%
Commercial Authorized Claims ...... 100%
Spec-Code Sync ..................... PASS
Migration Coverage ................. 73%
Orphan Files ....................... 4
Deprecated Leakage ................. 0
Archive Contamination .............. 0
Semantic Drift Alerts .............. 2
Regression Suite ................... 10/10
```

No convertirlo en un “score único” simplista.

Los indicadores deben permanecer visibles individualmente.

---

# 18. Cadencia de auditoría

## En cada commit / PR

Determinísticas:

- IDs;
- schema;
- links;
- claims;
- Canon;
- deprecated;
- archive;
- spec-code.

---

## Antes de promoción a Canon

Además:

- Canon Drift;
- Claim Entailment;
- Epistemic Escalation;
- Definition Collision.

---

## Antes de publicar material comercial

Además:

- Commercial Overclaim;
- freshness;
- allowed_uses;
- evidence_for_sales.

---

## Antes de lanzar producto

Además:

- Spec-Code;
- Product-Theory Leakage;
- Ethical Drift;
- telemetry definitions.

---

## Mensual / por release importante

- Semantic audit completo;
- Regression suite;
- Migration coverage;
- Brain Health.

---

# 19. MOCs sin burocracia

Cada carpeta necesita README/MOC.

Pero evitar mantenimiento manual innecesario.

Recomendación:

El MOC contiene:

1. introducción curada por humanos;
2. reglas del módulo;
3. bloque de inventario generado automáticamente desde Registry.

Ejemplo:

```markdown
<!-- AUTO-GENERATED:START -->
| ID | Title | Status | Summary |
...
<!-- AUTO-GENERATED:END -->
```

Así:

- el mapa no se desactualiza;
- no hay que editar dos veces;
- los archivos huérfanos son detectables.

---

# 20. Source Registry + Migration Manifest

## 20.1. Source Registry

Registra cada fuente original.

Campos:

```yaml
source_id:
name:
location:
hash:
source_type:
source_role:
created:
priority:
migration_status:
```

---

## 20.2. Source Role

Valores recomendados:

```text
canonical_seed
product_seed
design_source
research_source
historical_source
discarded_source
```

---

## 20.3. Migration Manifest

Ejemplo:

```yaml
source_id: SRC-INTERNAL-001

migration_status: in_progress

extracted:
  concepts: complete
  research: complete
  claims: complete
  decisions: partial
  methodology: complete
  products: partial
  prompts: complete
  commercial: pending
  open_questions: complete
  discarded_ideas: complete

destinations:
  - CON-DS-001
  - DOOR-001
  - DEC-004
```

Solo puede pasar a:

```text
migrated
```

cuando ninguna categoría está:

```text
pending
partial
```

---

# 21. Estrategia final para raw sources y legacy

Se utilizan dos zonas.

## 21.1. Archivo fundacional curado en Git

```text
/v3/brain/99_archive_and_history/raw_sources/
```

Debe contener:

- conversaciones fundacionales exportadas;
- documentos maestros finales;
- insumos esenciales;
- snapshots críticos;
- documentos que explican decisiones.

Está en Git.

Pero los agentes no lo leen por defecto.

---

## 21.2. Legacy local

El resto del caos documental histórico puede permanecer:

- fuera de `/v3/`;
- gitignored;
- disponible localmente.

Pero:

**debe aparecer primero en el Source Registry antes de decidir que puede quedarse solo local.**

Así evitamos que “limpiar el repo” equivalga a “perder conocimiento”.

---

# 22. Promoción a Canon

Flujo:

```text
working
↓
review
↓
human approval
↓
canonical
```

Regla:

> Ningún agente promueve a Canon.

---

## 22.1. Campos obligatorios al promover

```yaml
status: canonical
promoted_by:
promotion_date:
```

Si crea o cambia definición central:

```yaml
adr_ref:
```

---

## 22.2. Cambio de Canon existente

Requiere:

1. propuesta;
2. evidencia / razón;
3. impacto;
4. ADR;
5. human approval;
6. changelog;
7. actualización de dependientes.

---

# 23. Decision Log

Los ADRs preservan el criterio.

Ejemplos iniciales:

```text
DEC-001 — Humano como agente, no weakest link
DEC-002 — Nueve Attention Doors oficiales
DEC-003 — Jerarquía no es Door
DEC-004 — Validación no es Door
DEC-005 — MIRA → FARO
DEC-006 — Caso 3 sin ground truth
DEC-007 — Evaluar proceso, no solo acierto
DEC-008 — D/N en FARO
DEC-009 — Revisar no ejecuta
DEC-010 — Caso 4: autenticidad ≠ decisión obvia
DEC-011 — IA como espejo, sparring y asistente
DEC-012 — Arco termina en agencia, no miedo
```

---

# 24. Comercial: rápido, pero con firewall epistemológico

La capa comercial debe ser operativamente veloz.

Pero no puede inventar claims.

## Regla

Material comercial:

```text
CANON
+
evidence_for_sales
+
commercial-authorized claims
+
product evidence
```

No:

```text
raw papers
+
intuición
+
copywriting
```

---

## 24.1. `evidence_for_sales.md`

Debe contener únicamente:

- estadísticas autorizadas;
- claims;
- fechas;
- fuente;
- limitación;
- formulación comercial aprobada.

Ejemplo:

```markdown
### SALES-CLAIM-004

**Approved wording:** ...
**Based on:** CLAIM-AI-014
**Source:** SRC-X
**Valid through:** 2027-01-31
**Do not say:** ...
```

Esto permitirá responder a clientes rápidamente sin perder rigor.

---

# 25. Evidencia y validación propia

Separación obligatoria:

```text
RESEARCH
= lo que sabemos desde evidencia externa

VALIDATION
= lo que hemos observado o probado en nuestro propio framework/producto
```

---

## 25.1. Tipos de evidencia propia

### Experience evidence
- engagement;
- participación;
- satisfacción;
- percepción.

### Learning evidence
- comprensión;
- cambio entre reacción y decisión;
- uso de herramientas.

### Market evidence
- interés;
- leads;
- reuniones;
- solicitudes;
- conversión.

### Effectiveness evidence
- transferencia;
- cambio conductual;
- retención;
- desempeño;
- impacto real.

Nunca inferir una categoría a partir de otra.

---

# 26. Auditoría de evidencia del webinar

La buena recepción del webinar puede autorizar formulaciones como:

> “La experiencia generó alto interés y abrió conversaciones comerciales.”

No autoriza:

> “El framework demostró reducir incidentes de ciberseguridad.”

Tampoco:

> “Las Attention Doors fueron validadas.”

---

# 27. Distinción Training vs Intervention

Debe permanecer visible porque puede convertirse en arquitectura comercial.

```text
TRAINING
→ desarrolla capacidad

INTERVENTION
→ modifica condiciones del sistema
```

Training:
- simulaciones;
- talleres;
- juegos;
- sparring;
- práctica;
- feedback.

Intervention:
- procesos;
- defaults;
- interfaces;
- fricción;
- permisos;
- normas;
- escalamiento;
- experimentación;
- medición.

---

# 28. Reglas para reducir errores futuros de nombres y etiquetas

Todo concepto canónico debe contener:

```markdown
## Canonical name

## Definition

## What it is not

## Allowed synonyms

## Forbidden / risky formulations
```

Ejemplo:

### Digital Self

**Allowed:** representación funcional.

**Risky:** gemelo digital.

**Forbidden as definition:** nuevo perímetro humano.

Esto reduce deriva lingüística.

---

# 29. Auditoría de definiciones derivadas

Cuando un producto repita una definición:

```yaml
derived_from:
  - CON-DIGITAL-SELF
```

El semantic audit compara el texto con Canon.

Esto permite adaptar lenguaje a:

- comercial;
- facilitación;
- participante;

sin perder significado.

---

# 30. Regla de “No está en el cerebro”

Debe convertirse en una conducta explícita de todos los agentes.

Cuando falte información:

> “No encuentro una afirmación canónica o claim respaldado que permita sostener esto.”

Después puede:

- proponer hipótesis;
- recomendar investigación;
- crear `working`.

Pero nunca rellenar el vacío como si fuera conocimiento existente.

---

# 31. Regla de inferencia visible

Los agentes deben diferenciar:

```text
FROM CANON
FROM EVIDENCE
INFERENCE
PROPOSAL
UNKNOWN
```

No necesariamente mostrar esas etiquetas en toda respuesta al usuario final.

Pero sí deben usarlas internamente en tareas de construcción y auditoría.

---

# 32. Automatizaciones recomendadas a Antigravity

```text
scripts/
├── audit_brain.js
├── build_registry.js
├── manifest_manager.js
├── build_mocs.js
├── audit_claim_freshness.js
├── audit_commercial_claims.js
├── audit_spec_code_sync.js
└── generate_brain_health.js
```

Tests:

```text
tests/
├── brain_schema/
├── brain_semantic_regression.yaml
└── audit_game_spec_sync.js
```

---

# 33. Qué debe permanecer humano

No automatizar:

- promoción a Canon;
- decisiones de autoría;
- reinterpretación de evidencia conflictiva;
- cambios en nueve Doors;
- cambios de definición;
- claim comercial delicado;
- resolución de spec-code conflict;
- descarte final de fuente;
- evaluación ética de nuevas simulaciones.

IA puede:

- detectar;
- comparar;
- proponer;
- reportar.

No decidir automáticamente.

---

# 34. Criterios de aceptación del cerebro

Antes de declarar terminada la construcción inicial:

## Estructura

- `/v3/brain` operativo.
- MOCs presentes.
- Registry funcional.
- schemas funcionales.

## Canon

- definiciones centrales migradas.
- nueve Doors migradas.
- ADRs principales creados.
- epistemic status presente.

## Research

- Sources prioritarios migrados.
- Claims iniciales trazables.
- theoretical lenses separadas.

## Product

- FARO V3+ consolidado.
- Webinar separado como producto.
- Spec ↔ Code audit operativo.

## Migration

- tres conversaciones fundacionales registradas.
- dos documentos maestros del Paso 3.2 registrados.
- Antigravity artifacts relevantes registrados.
- ninguna fuente prioritaria sin estado.

## Audit

- determinístico PASS.
- semantic baseline completo.
- Knowledge Regression inicial PASS.
- BRAIN_HEALTH generado.

## Commercial

- evidence_for_sales creado.
- ningún claim comercial sin autorización.

---

# 35. Decisiones definitivas resultantes del análisis cruzado

## Adoptado de Antigravity

- `/v3/`;
- Git + Markdown;
- MOCs;
- operación lexical/scoped;
- INDEX First;
- scripts Node;
- JSON Schema;
- registry automático;
- spec como source of truth;
- CI bidireccional;
- Claims agrupados por dominio;
- granularidad semántica;
- raw sources críticos en Git;
- Product/Component separation.

---

## Adoptado de ChatGPT

- Canon ≠ validación científica;
- eje epistemológico independiente;
- Sources + Claims + Syntheses;
- theoretical lenses separadas;
- fichas atómicas por Door;
- Decision Log;
- Product System;
- Evidence & Validation independiente;
- Migration Manifest;
- archivo con firewall;
- semantic audits;
- regression suite;
- commercial claim firewall;
- provenance explícita.

---

# 36. Principio final

Este cerebro debe ser capaz de responder cuatro preguntas sobre cualquier afirmación importante:

> **¿Qué decimos?**  
> Canon / Claim

> **¿Por qué lo decimos?**  
> Source / ADR

> **¿Dónde lo usamos?**  
> Method / Product / Commercial

> **¿Qué tan seguros estamos?**  
> Epistemic Status / Validation

Y debe poder responder una quinta:

> **¿Qué todavía no sabemos?**

Si puede hacerlo de manera consistente, tenemos un verdadero cerebro.

---

# 37. Instrucción para Antigravity — siguiente paso

Utilizar este documento como base del **Paso 6**.

No volver a rediseñar la arquitectura salvo que aparezca una imposibilidad técnica real.

El siguiente trabajo debe ser:

> construir el **plan de implementación** de esta arquitectura, por fases, con scripts, carpetas, schemas, migración, auditorías y prompts específicos que el usuario entregará posteriormente a ChatGPT para producir los documentos canónicos.

La arquitectura queda, a partir de este punto, **congelada como recomendación definitiva de diseño**.
