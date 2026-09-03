---
id: "SRC-VERIZON-DBIR-2026"
title: "2026 Data Breach Investigations Report"
type: "source"
layer: "01_research_and_lenses"
status: "canonical"
epistemic_status: "not_applicable"
reading_status: "complete"
reading_depth: "full_text"
version: "1.0.0"
author: "Verizon Business"
topics:
  - "human_factor"
  - "social_engineering_phishing"
  - "cybersecurity_incidents"
  - "vulnerability_exploitation"
  - "generative_ai"
fulltext:
  availability: "public"
  storage_type: "external_url"
  location: "https://www.verizon.com/business/resources/T1e0/reports/2026-dbir-data-breach-investigations-report.pdf"
  sha256: null
summary: "Informe observacional global que normaliza datos aportados por múltiples organizaciones mediante VERIS y describe patrones de brechas ocurridas principalmente entre noviembre de 2024 y octubre de 2025; documenta el ascenso de la explotación de vulnerabilidades, la presencia persistente de phishing e interacción humana, el desplazamiento hacia canales móviles y usos observables de IA, pero no identifica causas psicológicas individuales ni evalúa la eficacia del framework Digital Self & Attention Doors."
related:
  - "CON-THESIS"
  - "CON-SOCIOTECHNICAL"
  - "DOOR-007"
  - "DOOR-009"
  - "CLM-MATRIX-HF"
  - "CLM-MATRIX-GENAI-SE"
---

# 1. Citation (APA)

Verizon Business. (2026). *2026 Data Breach Investigations Report* (19th ed.). Verizon. https://www.verizon.com/business/resources/reports/dbir/

# 2. Why this source matters

Es una fuente de contexto empírico sobre brechas conocidas, útil para evitar que el framework se construya únicamente desde ejemplos hipotéticos. Permite situar la interacción entre personas, terceros, vulnerabilidades técnicas, credenciales y canales de comunicación. Su valor para el Cerebro es epidemiológico y descriptivo: ayuda a priorizar escenarios de entrenamiento e intervención sociotécnica, no a etiquetar a las personas como causa de los incidentes.

# 3. Study design / methodology

Informe observacional retrospectivo basado en datos anonimizados de incidentes y brechas aportados por cerca de un centenar de organizaciones: equipos de respuesta, firmas forenses, organismos públicos, aseguradoras y otros colaboradores. Los registros se convierten y validan contra el esquema VERIS —Actors, Actions, Assets y Attributes— para formar un conjunto agregado. La edición analiza más de 22.000 brechas confirmadas en 145 países; su ventana principal comprende incidentes ocurridos entre el 1 de noviembre de 2024 y el 31 de octubre de 2025. Algunas profundizaciones, como simulaciones de phishing o uso de IA, emplean conjuntos complementarios y denominadores propios que deben leerse en su sección original.

# 4. Main findings & quantitative results

- La explotación de vulnerabilidades representó el 31% de los vectores de acceso inicial en brechas, un aumento relativo del 55% frente al año anterior.
- El ransomware apareció en el 48% de las brechas analizadas.
- La participación de terceros alcanzó el 48% de las brechas, un aumento relativo del 60% interanual.
- En datos de simulaciones de phishing, los puntos de entrada móviles —por ejemplo, voz y texto— presentaron una mediana de clics exitosos 40% mayor que los ataques que entraron por correo electrónico. Es una comparación de medianas dentro de simulaciones, no una tasa universal de victimización.
- En el caso mediano examinado para IA, los actores investigaron o usaron IA generativa en apoyo de 15 técnicas de ataque distintas. Esto expresa amplitud de uso observada en ese subconjunto, no que el 15% de los ataques use IA.

# 5. Limitations stated by authors

El DBIR reconoce que la confidencialidad, las dificultades de respuesta y la heterogeneidad de aportantes dejan registros incompletos. Solo entran casos conocidos y con detalle suficiente, por lo que existen sesgos de selección, notificación y muestreo. Las prácticas regulatorias y de reporte, el escrutinio externo y el tamaño de muestra varían entre industrias y regiones; por eso sus porcentajes no deben compararse como si provinieran de un censo homogéneo. Los análisis especiales pueden utilizar fuentes, periodos y unidades diferentes del conjunto principal.

# 6. What this source supports

- Que las brechas resultan de configuraciones sociotécnicas y no de una única clase de causa.
- Que vulnerabilidades, terceros, ransomware, credenciales y manipulación humana deben considerarse conjuntamente al diseñar resiliencia.
- Que el phishing no se limita al correo y que los canales móviles merecen escenarios específicos de entrenamiento.
- Que la IA ya aparece como acelerador o apoyo de múltiples técnicas, aunque su medición siga siendo emergente.
- Que la priorización de controles debe incorporar contexto sectorial y datos locales, no solo promedios globales.

# 7. What this source DOES NOT support

- No demuestra que “las personas sean el eslabón más débil” ni que sean culpables de la mayoría de las brechas.
- No prueba que una intervención de awareness, PARA, FARO o Attention Doors reduzca incidentes.
- No establece causalidad entre una característica psicológica y una brecha.
- No permite convertir el porcentaje de “elemento humano” en una probabilidad individual de caer en phishing.
- No demuestra que los mensajes generados por IA sean siempre más eficaces que los humanos.
- No autoriza a sumar porcentajes de categorías que pueden solaparse o tener denominadores distintos.

# 8. Connections to Attention Doors / Theoretical Lenses

- `DOOR-007` Protección: conecta legítimamente con escenarios de amenaza y acciones protectoras, sin equiparar amenaza objetiva con percepción.
- `DOOR-009` Conveniencia/Rutina: orienta escenarios sobre credenciales, canales habituales y fricción operativa; el informe no mide hábitos cognitivos.
- `DOOR-003` Responsabilidad y `DOOR-006` Pertenencia pueden aparecer en phishing e impersonación, pero el DBIR no valida esas puertas.
- `THEORY-SDT` ayuda a interpretar decisiones bajo señales incompletas y costos de falsas alarmas; no es un modelo aplicado por el informe.
- `THEORY-PMT` puede orientar respuestas protectoras, pero sus variables no fueron medidas por el DBIR.

# 9. Candidate claims proposed

## CAND-DBIR-001

- **Statement:** En el conjunto 2026 del DBIR, la explotación de vulnerabilidades fue el vector inicial más frecuente y alcanzó el 31% de las brechas.
- **Proposed epistemic status:** supported
- **Proposed confidence:** high
- **Scope:** conjunto global agregado del DBIR 2026 y definiciones VERIS; no prevalencia universal.
- **Promotion target:** `claims_human_factor.md`

## CAND-DBIR-002

- **Statement:** En las simulaciones analizadas por el DBIR 2026, las entradas móviles registraron una mediana de clics exitosos 40% superior a las entradas por correo.
- **Proposed epistemic status:** supported
- **Proposed confidence:** medium
- **Scope:** conjunto de simulaciones y medición reportados; requiere conservar denominador y canal.
- **Promotion target:** `claims_genai_social_engineering.md`

## CAND-DBIR-003

- **Statement:** Los datos del DBIR respaldan tratar las brechas como resultados sociotécnicos con factores técnicos, humanos y organizacionales solapados.
- **Proposed epistemic status:** supported
- **Proposed confidence:** medium
- **Scope:** inferencia de síntesis para diseño; no estimación causal.
- **Promotion target:** `claims_human_factor.md`
