---
id: "COM-VOICE-GUARDRAILS"
title: "Voz comercial, guardrails de claims y directrices para Brief V2"
type: "commercial_guardrails"
layer: "07_commercial_and_gotomarket"
status: "canonical"
epistemic_status: "provisional"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Directrices de tono, voz comercial, gobernanza de claims, límites éticos de interacción, contrato de 10 campos para el Blueprint y registro de las 12 decisiones abiertas del Brief V2."
related:
  - "COM-POSITIONING"
  - "COM-PROBLEM-SPACE"
  - "COM-VALUE-PROP"
  - "COM-AUDIENCES"
  - "COM-OFFER-ARCHITECTURE"
  - "COM-EVIDENCE-SALES"
  - "COM-SALES-DECK"
decisions:
  - "DEC-001"
  - "DEC-002"
  - "DEC-005"
  - "DEC-008"
---

# Principios de voz y tono comercial

La comunicación de FARO en el Brief V2 y en todos sus puntos de contacto comercial se rige por un principio de sobriedad, rigor reflexivo y respeto absoluto por la agencia humana.

## 1. Posicionamiento comunicacional: «Antes de un clic»

- **La ventana crítica:** El foco comercial de FARO no es el análisis forense posterior al incidente ni la auditoría pasiva de políticas. Se sitúa con precisión en la microdecisión humana inmediata: los segundos previos a actuar ante un estímulo digital engañoso o una sugerencia automatizada.
- **Tono sobrio y no punitivo:** Se rechaza el dramatismo sensacionalista, el miedo inducido (*FUD — Fear, Uncertainty, and Doubt*) y la condescendencia pedagógica.
- **Transformación del entorno tecnológico:** La IA generativa y los LLMs permiten automatizar la investigación y redacción de mensajes contextualizados, reduciendo u oscureciendo la fiabilidad de las señales superficiales tradicionales (ortografía, tipografía o sintaxis extraña). Sin embargo, esto no debe expresarse como una anulación absoluta de señales externas, sino como un desplazamiento hacia la necesidad de verificar activamente fuentes y procesos antes de actuar.
- **Erradicación del vocabulario de culpa:** Está estrictamente prohibido referirse a los colaboradores como «el eslabón más débil», «usuarios ingenuos» o «vulnerabilidades con patas». La conducta es el resultado de un sistema sociotécnico compuesto por interfaces, cargas laborales, políticas y herramientas; si el sistema no provee rutas de verificación practicables, el error es del diseño organizacional, no de la persona.

## 2. Las cuatro categorías de contenido gobernado

Para asegurar coherencia epistemológica y evitar *overclaim*, todo texto o activo de comunicación debe clasificarse internamente en una de cuatro categorías con niveles diferenciados de autoridad:

1. **Canon (Definiciones fundacionales):** Formulación oficial vigente (Digital Self, Attention Doors, Proceso Decisional, PARA, IA como aliada sociotécnica, 14 competencias canónicas en `MET-COMPETENCIES`). Las necesidades comerciales o visuales no pueden alterar su significado. El estatus canónico se mantiene estrictamente separado de la verdad empírica demostrada (`status` y `epistemic_status` permanecen diferenciados).
2. **Copy comercial (Posicionamiento, valor y oferta):** Lenguaje externo destinado a comunicar relevancia, valor, diferenciación y acción para líderes corporativos. Puede evolucionar mientras preserve el Canon y los límites de claims.
3. **Copy de interacción / experiencia (Microdecisiones y diálogo del guía):** Preguntas, etiquetas, diálogo del guía, retroalimentación formativa, transiciones, mensajes de carga y microcopy de llamada a la acción (CTA). Está sujeto a los mismos límites éticos y de evidencia que el copy comercial.
4. **Claim que requiere evidencia o autorización:** Cualquier aseveración sobre prevalencia, aprendizaje, transferencia, efectividad, resultados, demanda comercial o respuesta de participantes. Debe provenir exclusivamente del banco gobernado en `COM-EVIDENCE-SALES` con sus fuentes, alcance y limitaciones explícitas.

# Guardrails de interacción (Capa 2 del Brief)

El Brief V2 incorporará componentes interactivos para permitir al visitante experimentar de manera directa la propuesta pedagógica. Estas interacciones se diseñarán tras aprobar la arquitectura de contenido y deben cumplir salvaguardas éticas estrictas:

- **Regla crítica para la muestra interactiva de PARA:** La muestra de PARA en el brief **no debe introducir otro caso de phishing independiente**. Su escenario será la situación real del visitante: evaluar FARO como posible respuesta a un problema organizacional o de sistemas humanos. La interacción ayuda al visitante a:
  - **P (Pausar):** Pausar antes de saltar hacia una solución convencional o asumir que más awareness pasivo resolverá el problema.
  - **A (Analizar):** Analizar qué problema intenta resolver realmente su organización (dilemas decisionales, presiones de tiempo, interfaces, supervisión de IA).
  - **R (Revisar):** Revisar qué evidencia, stakeholders (CISO, CHRO/L&D, GRC, CIO) y alternativas importan antes de decidir.
  - **A (Actuar):** Actuar explorando el enfoque, compartiéndolo internamente o solicitando una conversación de descubrimiento.
- **Prohibición de gamificación punitiva o superficial:** No usar puntos acumulativos, medallas decorativas (*badges*), tablas de clasificación pública (*leaderboards*) ni contadores de errores en tiempo real.
- **Prohibición de perfilado psicométrico:** Ninguna interacción clasificará al visitante en tipologías psicológicas, niveles de ingenuidad o perfiles de riesgo personal. Tampoco insinuará que una respuesta diagnostica al visitante o a su organización.
- **Principio de omisión voluntaria (*free omission*):** El visitante es libre de omitir, reiniciar o abandonar cualquier interacción y aun así comprender plenamente la oferta. La ruta crítica no puede depender de entregar datos personales.
- **FARO como guía:** Si FARO guía el recorrido, debe aclarar la experiencia con sobriedad y mesura, no agregar una ficción que compita con la propuesta de valor.
- **Entorno seguro de práctica:** El error durante una interacción reflexiva es una oportunidad de observación y aprendizaje, nunca un fallo evaluativo.

# Posición sobre la evidencia para el Brief V2

El Brief V2 mantiene una postura de honestidad epistémica rigurosa, diferenciando con transparencia lo que la evidencia científica y empírica respalda de lo que aún está en proceso de validación.

## Qué puede sostener actualmente

1. **Investigación que sustenta el espacio del problema:** La literatura en factores humanos y ciberseguridad sociotécnica respalda que las señales superficiales pierden fiabilidad frente a la IA generativa y que la conducta segura emerge de sistemas sociotécnicos (interfaces, tareas, procesos).
2. **Posturas teóricas y hallazgos empíricos que orientaron la construcción de FARO:** Principios consolidados en ciencias del aprendizaje sobre práctica deliberada situacional, simulación y debrief reflexivo.
3. **Fundamentos conceptuales de decisión y confianza:** Modelos de interacción humano–IA que justifican enfocar el entrenamiento en reliance calibrada (evitar sobreconfianza y desconfianza ciega) y responsabilidad sociotécnica.
4. **Evidencia de experiencia documentada del webinar:** Señal cualitativa preliminar y positiva de interés y pertinencia temática recogida en el webinar inicial V1 (`EVD-WEBINAR-V1`), sin extrapolarla a pruebas de efectividad conductual.

## Qué NO puede sostener actualmente

El brief no debe afirmar que FARO ha demostrado:
1. Reducción de incidentes o de tasas de clics.
2. Transferencia conductual duradera al puesto de trabajo.
3. Efectividad longitudinal.
4. Transformación probada de cultura organizacional.
5. Validez psicométrica.
6. Capacidad predictiva para identificar individuos riesgosos.

FARO es una solución de reciente creación. Está sólidamente fundamentada en la literatura, pero todavía no cuenta con evidencia cuantitativa o longitudinal de efectividad de la solución. Esto debe comunicarse con transparencia y prudencia, sin convertir el recorrido comercial en un descargo académico.

## Experiencia de exploración de evidencia

La evidencia será una capa opcional para visitantes interesados en mayor escrutinio:
- Ofrecerá una mirada sintética al panorama de investigación y distintas perspectivas teóricas relevantes.
- Separará explícitamente evidencia del problema, evidencia que informa decisiones de diseño y futura evidencia sobre la solución.
- Proveerá acceso directo y transparente a fuentes sin interrumpir el ritmo narrativo principal.

# Directrices para el Blueprint (Handoff a la Etapa 3)

Conforme a la Sección 14 del *FARO Brief V2 Decision Record*, cada bloque del Blueprint deberá especificar obligatoriamente los siguientes diez campos de control:

1. **Objetivo del bloque:** Qué se busca lograr con la sección.
2. **Pregunta del visitante que resuelve:** Cuál de las cinco preguntas comerciales atiende.
3. **Momento emocional:** Reconocer, Descubrir, Experimentar o Elegir.
4. **Mensaje indispensable:** La idea central que el visitante debe retener sí o sí.
5. **Copy comercial final o casi final:** Texto propuesto para el bloque.
6. **Contenido secundario opcional:** Información que puede expandirse o explorarse de forma voluntaria.
7. **Oportunidad o requisito de interacción:** Qué puede hacer el visitante en este punto.
8. **Riesgo de interpretación:** Qué error conceptual o malentendido se debe evitar activamente.
9. **Etiqueta de gobierno:** Canon, copy comercial, copy de interacción o claim.
10. **Transición o CTA esperado:** Hacia dónde avanza el visitante o qué acción se le sugiere.

*(Metadato técnico opcional: se permite incluir identificadores como `ID de bloque` para seguimiento de implementación, sin reemplazar ninguno de los diez campos obligatorios).*

# Registro de decisiones abiertas (Las 12 decisiones de la Sección 15 del Decision Record)

Permanecen deliberadamente sin resolver para abordarse durante el diseño del Blueprint:

1. **Subtítulo autoexplicativo de FARO:** Definición del subtítulo secundario de marca.
2. **Arquitectura de información exacta y número de bloques visibles:** Estructura detallada del recorrido público.
3. **Promesa principal y copy del hero:** Redacción final del encabezado y mensaje de apertura.
4. **Descripción y naming definitivos del programa extendido:** Nombre y conceptualización de producto del Tier 3.
5. **Empaquetamiento final de duraciones:** Especialmente la permanencia o eliminación del formato inmersivo de dos horas.
6. **Tratamiento visual del CTA persistente, datos de contacto y URL pública final:** Incluyendo la eliminación de anclas accidentales en los enlaces que se compartan.
7. **Pregunta inicial de respuesta múltiple y sus opciones:** Redacción y alternativas del primer prompt interactivo.
8. **Si solicitar el nombre aporta suficiente valor para justificar la fricción y las implicaciones de privacidad:** Decisión sobre la captura ligera del nombre.
9. **Voz, presencia y frecuencia de FARO como guía:** Alcance del diálogo y rol del guía en la interfaz.
10. **Interacción PARA precisa dentro del journey de decisión comercial:** Diseño interactivo de la muestra de PARA en la evaluación del visitante.
11. **Qué evidencia de experiencia de la keynote/webinar está documentada y autorizada para publicación:** Delimitación de testimonios y métricas cualitativas autorizadas.
12. **Qué fuentes del Scientific Library System aparecerán en la primera capa pública de evidencia:** Selección inicial de referencias accesibles desde el brief.
