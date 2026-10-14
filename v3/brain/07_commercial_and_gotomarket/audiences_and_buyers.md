---
id: "COM-AUDIENCES"
title: "Audiencias y compradores"
type: "commercial_strategy"
layer: "07_commercial_and_gotomarket"
status: "canonical"
epistemic_status: "provisional"
version: "1.1.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Establece la paridad entre las cuatro audiencias ejecutas (CISO, CHRO, GRC, CIO) y la regla de un único journey comercial compartido sin bifurcaciones por rol."
related:
  - "COM-POSITIONING"
  - "COM-VALUE-PROP"
  - "COM-OFFER-ARCHITECTURE"
  - "COM-SALES-DECK"
  - "COM-VOICE-GUARDRAILS"
  - "MET-TRAIN-VS-INTERV"
decisions:
  - "DEC-001"
---

# Regla de paridad comercial y journey unificado

Las cuatro audiencias de compra mantienen **estricta paridad comercial**: ninguna tiene prioridad jerárquica sobre las demás.

**Regla de diseño de la experiencia pública:**
- El brief debe mostrar cómo FARO se relaciona con cada audiencia, pero **NO debe crear rutas de navegación distintas ni experiencias independientes por rol**.
- La relevancia para los cuatro perfiles debe fluir de manera natural dentro de un **mismo journey compartido**.
- La adaptación específica por industria, tamaño o contexto organizacional se realiza en la conversación de descubrimiento y en la propuesta comercial formal, nunca forzando bifurcaciones en el brief público.

---

# Buyer 1 — CISO / Liderazgo de Ciberseguridad

- **Dolores:** Fatiga generalizada de campañas de awareness, repetición de incidentes a pesar de los cursos aprobados, proliferación de ataques asistidos por IA que eluden la detección superficial y baja calidad en los reportes de seguridad.
- **Qué busca:** Relevancia ejecutiva real, entrenamiento de toma de decisiones bajo estrés, métricas que no culpabilicen al personal y reducción de fricciones operativas en los canales de verificación.
- **Objeción típica:** «Ya tenemos awareness anual y plataforma de phishing simulado».
- **Respuesta de valor:** FARO no repite la teoría; entrena la decisión humana en el momento en que el mensaje parece auténtico o una IA aconseja actuar, complementando las defensas técnicas con criterio y proporcionalidad.

---

# Buyer 2 — CHRO / Gestión Humana / L&D / Cultura

- **Dolores:** Percepción de la seguridad como un trámite aburrido o punitivo, desconexión entre los cursos obligatorios y la práctica real del trabajo, miedo al error y falta de cultura de reporte abierto.
- **Qué busca:** Experiencia de aprendizaje formativa y segura, desarrollo de competencias de juicio crítico, cero ranking o señalamiento individual y alta recordación de conceptos.
- **Objeción típica:** «Esto parece una capacitación técnica de ciberseguridad para ingenieros».
- **Respuesta de valor:** El objeto de FARO es el criterio humano bajo presión contextual; los escenarios se centran en decisiones organizacionales cotidianas y se adaptan a cualquier rol sin exigir especialización técnica.

---

# Buyer 3 — Riesgo / Compliance / Control Interno / GRC

- **Dolores:** Decisiones operativas irreversibles tomadas sin autorización clara, excepciones informales no registradas, políticas que existen en el papel pero resultan impracticables en la urgencia y brechas de supervisión en flujos distribuidos.
- **Qué busca:** Hacer visibles los dilemas de control, identificar cuellos de botella en rutas de escalamiento, evidencia formativa de diligencia debida y hallazgos concretos de condiciones del sistema que requieren cambio.
- **Objeción típica:** «¿Esto nos entrega una certificación de cumplimiento regulatorio?».
- **Respuesta de valor:** FARO produce evidencia formativa, mapeo de fricciones y hallazgos cualitativos del sistema; no sustituye una auditoría formal pero revela exactamente dónde fallan los controles prácticos antes de una crisis.

---

# Buyer 4 — CIO / Transformación Digital / Gobernanza de IA

- **Dolores:** Despliegue acelerado de herramientas y agentes de IA sin modelos claros de supervisión humana, riesgo de sobredependencia ciega en automatizaciones (*automation bias*) o, por el contrario, rechazo infundado que frena la productividad.
- **Qué busca:** Adopción responsable de IA, criterio humano calibrado (*calibrated reliance*), protocolos de autorización en flujos asistidos por algoritmos y gobernanza práctica del juicio asistido por máquinas.
- **Objeción típica:** «Nuestros modelos y herramientas de IA ya cuentan con guardrails técnicos de fábrica».
- **Respuesta de valor:** Los guardrails técnicos de un modelo no resuelven la decisión humana de qué nivel de alcance, permiso, contexto y reversibilidad otorgar a una recomendación automatizada en una operación sensible.

---

# Criterios de calificación de oportunidades

### Alta afinidad (Perfil ideal de cliente):
- Organizaciones con adopción activa o planificada de herramientas de IA generativa.
- Flujos donde las decisiones humanas tienen alto impacto económico o reputacional.
- Patrocinio cruzado entre al menos dos de las cuatro áreas clave (e.g. Seguridad + L&D, o Riesgo + IA Governance).
- Apertura a examinar fallas sociotécnicas del sistema y no solo a exigir más atención a los usuarios.

### Baja afinidad (Descarte comercial):
- Búsqueda de cumplimiento formal de casillas sin interés en la experiencia participativa.
- Solicitudes de rankings individuales, scoring secreto de empleados o auditorías punitivas.
- Expectativa de promesas irreales como «garantía de cero incidentes» o «inmunidad al engaño».
- Intención de utilizar la experiencia como un test psicométrico de vulnerabilidad personal.

---

# Preguntas de descubrimiento para la reunión inicial

1. ¿Cuál es la decisión o tipo de incidente que hoy genera mayor preocupación en su operación?
2. Cuando alguien recibe una solicitud urgente y plausible, ¿qué canales independientes tiene para verificarla de forma rápida?
3. ¿Qué ocurre actualmente en su organización cuando una persona comete un error o duda ante una instrucción?
4. ¿Cómo interactúan hoy sus equipos con recomendaciones o automatizaciones asistidas por IA?
5. ¿Qué resultado concreto justificaría para ustedes considerar este espacio como una inversión exitosa?
