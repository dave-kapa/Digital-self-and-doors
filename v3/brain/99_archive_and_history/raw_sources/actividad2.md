# Manual de Diseño y Juego: "Agudeza Digital"
## Entrenamiento Progresivo contra la Ingeniería Social y el Engaño Cognitivo

Este documento contiene la documentación completa, las reglas de juego y los vectores de programación (prompts) necesarios para desplegar el sistema de entrenamiento **"Agudeza Digital"**.

---

## 1. Introducción al Juego

### El Problema Real
La tecnología de ciberseguridad avanza a pasos agigantados para blindar sistemas, servidores y redes. Sin embargo, el eslabón más vulnerable sigue siendo el factor humano. Basta un segundo de distracción, un correo urgente, un mensaje de texto imitando a un remitente rentable o una notificación falsa para que un usuario haga un clic indebido y desmantele cualquier barrera de seguridad tecnológica.

### ¿Qué es "Agudeza Digital"?
Es un sistema de entrenamiento cognitivo estructurado en **5 niveles progresivos de dificultad y 1 expansión avanzada**. En lugar de aburrir al usuario con teoría de ciberseguridad, el juego entrena de forma práctica su agudeza mental, su escepticismo saludable y su capacidad de pausar antes de actuar en el entorno digital.

### Arquitectura de la Progresión
El juego guía al usuario a través de una curva de aprendizaje controlada:
* **Fases 1 a 3 (Entrenamiento de Detalle):** Se utiliza el contexto histórico para aprender a buscar inconsistencias, anacronismos y sutiles distorsiones en textos cortos.
* **Fases 4 y 5 (Entrenamiento Situacional):** Se simula el entorno digital del día a día (correos, SMS, llamadas) bajo el "Factor Incertidumbre" (el usuario no sabe si la situación es real o un ataque).
* **Expansión (Ataque de Alta Fidelidad):** Simulación de ataques dirigidos (*Spear Phishing*) basados en el contexto de vida exacto del usuario en tiempo real.

---

## 2. Nivel 1: Calentamiento Histórico
### (Dos Verdades y Una Mentira)

* **Objetivo Cognitivo:** Entrenar el ojo para identificar anacronismos tecnológicos e inconsistencias de contexto (el equivalente a detectar un remitente de correo sospechoso o canales de soporte inusuales).
* **Mecánica:** La IA genera tres afirmaciones sumamente cortas (máximo un párrafo cada una) sobre un suceso histórico. Dos son verdades absolutas y una es una mentira sutil que oculta una anomalía técnica o lógica.
* **Flujo de Juego:** El jugador lee las opciones, justifica cuál cree que es la mentira basándose en la anomalía detectada, y la IA ofrece un análisis comparando la trampa histórica con una táctica de ciberseguridad real.

### Prompt de Inicialización
```text
Quiero que hagamos un ejercicio para entrenar mi agudeza mental frente a posibles engaños. Vamos a jugar a "Dos Verdades y Una Mentira" usando sucesos históricos conocidos. Tu objetivo es redactar tres enunciados sobre el suceso que te daré: dos deben ser verdades absolutas y una debe ser una mentira. 

Para este ejercicio inicial, aplica las siguientes reglas estrictas:
1. Longitud: Cada enunciado debe ser un párrafo muy corto (máximo 3-4 líneas), rápido y dinámico de leer.
2. Dificultad: La mentira debe ocultar una pista o anomalía sutil pero identificable si analizo bien el texto (como un anacronismo tecnológico o un dato que rompa la lógica del contexto).
3. Sistema de dificultad: Antes de mostrar los enunciados, marca el nivel usando estrellas. Para este primer turno usa "Nivel: ★☆☆ (Fácil)".
4. Feedback: Cuando te dé mi respuesta, no me digas solo si acerté o no. Quiero que me expliques la verdad histórica detrás y que hagas un "Análisis Forense Digital", explicándome cómo esa trampa o anomalía del texto se parece a una táctica real que usan los ciberdelincuentes (como el phishing o la suplantación).
5. Mi rol: No te diré solo el número de la opción, intentaré justificarte brevemente qué anomalía noté para entrenar mi pensamiento crítico.

Comencemos con este suceso histórico: [Inserta aquí un suceso histórico]
```

---

## 3. Nivel 2: Comprensión Guiada
### (Texto de Referencia + 2 Verdades y 1 Mentira)

* **Objetivo Cognitivo:** Eliminar el sesgo de "conocimiento previo". Obliga al usuario a enfocarse puramente en el análisis de texto de manera meticulosa para detectar distorsiones de datos (el equivalente a leer términos y condiciones alterados de un servicio digital).
* **Mecánica:** La IA provee un "Texto Base" de un párrafo que es 100% verídico. Debajo, presenta tres afirmaciones muy similares en longitud y tono. Dos son verdades y una es una mentira sutilmente modificada de lo que dice el texto base (inversión de causa-efecto, cambios semánticos).
* **Flujo de Juego:** El jugador compara las opciones estrictamente con el texto base para hallar la distorsión.

### Prompt de Inicialización
```text
Hagamos un ajuste importante al juego para que sea más justo y no dependa de mi memoria histórica, sino puramente de mi atención al detalle. A partir de ahora, la estructura cambiará a un modelo de "Comprensión de Lectura Avanzada". 

Aplica estas nuevas reglas:
1. Estructura: En cada turno me darás un "Texto Base (100% Verídico)" de un solo párrafo corto sobre el suceso histórico que te daré. 
2. Las Opciones: Justo abajo del texto base, me darás tres opciones cortas (dos verdades y una mentira). Estas opciones deben basarse estrictamente en la información del texto base que acabas de escribir.
3. El Engaño: La mentira no debe ser un invento absurdo. Debe ser una sutil distorsión de lo que dice el texto base (por ejemplo, invertir una causa y efecto, cambiar una palabra clave que altere el sentido, o transformar un "no se pudo" en un "sí se logró").
4. Mantén las reglas anteriores: Párrafos cortos, simétricos en longitud, feedback con analogía de ciberseguridad, y antes de lanzar el reto decide al azar el nivel de dificultad tirando un dado virtual (★☆☆ Fácil, ★★☆ Medio, ★★★ Difícil) y márcalo arriba.

Siguiente hecho histórico para procesar bajo esta nueva estructura: [Inserta aquí un suceso histórico]
```

---

## 4. Nivel 3: Inversión Cognitiva
### (Texto de Referencia + 2 Mentiras y 1 Verdad)

* **Objetivo Cognitivo:** Entrenar el filtrado de ruido. En un entorno digital lleno de correos y alertas confusas, el usuario debe aprender a descartar los enunciados falsos y aferrarse a la única certeza confirmada.
* **Mecánica:** Igual que el nivel anterior, pero invertido. Se le da un texto verídico y tres opciones, de las cuales **dos son mentiras** (con datos levemente alterados) y **solo una es la verdad absoluta**.
* **Flujo de Juego:** El usuario busca la única afirmación 100% verídica basada únicamente en la información provista.

### Prompt de Inicialización
```text
Subamos el nivel del juego invirtiendo la lógica para entrenarme en buscar la única certeza en medio del ruido, tal como ocurre en entornos digitales sospechosos. 

Aplica este cambio a partir de ahora:
1. La Dinámica: En lugar de buscar la mentira, ahora me darás DOS MENTIRAS Y UNA SOLA VERDAD. Mi objetivo será identificar cuál es la única opción 100% verdadera.
2. Estructura: Mantén el formato del nivel anterior: un "Texto Base (100% Verídico)" de un solo párrafo corto y, abajo, las tres opciones cortas (que mantengan una longitud muy similar entre sí para no delatar la respuesta).
3. Pistas: Las dos mentiras deben alterar sutilmente los datos del texto base usando palabras muy familiares para confundir a mi cerebro si leo rápido.
4. Nivel: Lanza tu dado virtual para decidir la dificultad de este round y dame el feedback con su respectivo análisis forense de ciberseguridad.

Siguiente hecho histórico: [Inserta aquí un suceso histórico]
```

---

## 5. Nivel 4: El Simulador de Bandeja de Entrada
### (Escenarios Digitales Cotidianos)

* **Objetivo Cognitivo:** Entrenar la toma de decisiones en situaciones bajo presión digital (urgencia, miedo a pérdidas financieras o accesos no autorizados). Enseña a pausar y verificar canales alternos de comunicación en lugar de hacer clics impulsivos.
* **Mecánica:** La IA genera una situación simulada (un correo, llamada o SMS corporativo/personal) y asigna un nivel de dificultad aleatorio. Introduce el **Factor Incertidumbre**: el jugador no sabe si el estímulo que recibe es legítimo o un ataque.
* **Flujo de Juego:** El jugador decide entre tres opciones de acción cortas y muy simétricas en longitud y tono (Acción segura, Acción impulsiva/caer en trampa, o Acción tibia/ineficaz) y la IA analiza la efectividad de la acción.

### Prompt de Inicialización
```text
Hemos terminado la fase histórica. Ahora vamos a simular el entorno digital real. A partir de este momento, dejas de ser un narrador de historia y te conviertes en un "Simulador de Bandeja de Entrada e Ingeniería Social". Ya no usaremos sucesos históricos.

Estas son las reglas del simulador:
1. El Estímulo: Me presentarás una situación digital redactada textualmente (un correo electrónico, un SMS, una ventana emergente de tu sistema corporativo, una notificación de una app o una llamada telefónica).
2. El Contexto: Antes del mensaje, me dirás brevemente quién supuestamente lo envía y en qué situación me encuentro (por ejemplo: "Estás esperando un paquete" o "Es viernes antes de salir a almorzar en tu oficina").
3. Factor Incertidumbre (Crucial): Yo NO sé si la situación que me planteas es un ataque real o una comunicación 100% legítima de la vida cotidiana. Tú decidirás en secreto si es un engaño real, una falsa alarma (un mensaje real pero redactado con urgencia) o un procedimiento estándar. No me lo digas hasta que yo responda.
4. Las Opciones: Me darás tres opciones de acción cortas y muy simétricas en longitud y tono. Una será la acción segura, otra será caer en la trampa (si es que hay una) y otra será una acción intermedia o impulsiva.
5. Dificultad: Lanza tu dado virtual para decidir la sutileza del escenario (★☆☆ Fácil, ★★☆ Medio, ★★★ Difícil) y márcalo al inicio.
6. Feedback: Al responder, dime si mi acción fue la correcta para mitigar el riesgo, revélame si el escenario era o no un ataque, y explícame las señales de alerta ocultas.

Escribe "SISTEMA LISTO" y genera el primer escenario aleatorio para comenzar.
```

---

## 6. Nivel 5: El Asistente Permanente de Ciberseguridad

* **Objetivo Cognitivo:** Convertir la IA en un sistema híbrido de soporte para el día a día. Sirve tanto para seguir entrenando asincrónicamente como para resolver dudas reales cuando el usuario dude de un correo en su bandeja de entrada verdadera.
* **Mecánica:** Activa un modo dual: entrenamiento (juego) y consultoría (soporte real).

### Prompt de Inicialización
```text
A partir de este momento, adoptas el rol permanente de mi Asistente y Entrenador de Ciberseguridad. Tu memoria mantendrá activas todas las reglas de los niveles anteriores. 

A partir de ahora, nuestra dinámica funcionará bajo dos modalidades que yo elegiré en cualquier momento:

1. Si te digo "Quiero entrenar": Elegirás al azar cualquiera de los 4 niveles que hemos jugado (Histórico básico, Texto base con mentira, Texto base con verdad, o Simulador digital), lanzarás el dado de dificultad, me dirás qué nivel estamos jugando y me pondrás el reto con su respectivo análisis forense al final.
2. Si te escribo "Consulta de Seguridad": Pausarás el juego inmediatamente. Te describiré una situación real que me esté pasando en mi día a día digital (un correo raro que recibí, un mensaje sospechoso, etc.) y tú actuarás como un experto consultor. Me ayudarás a analizar de forma fría y técnica si podría ser un ataque, qué señales debo revisar y qué pasos seguros debo dar para protegerme.

Confírmame que has integrado este sistema de doble modalidad y dime qué sugieres para nuestro próximo entrenamiento.
```

---

## 7. Expansión: Spear Phishing de Alta Fidelidad
### (Ataque Dirigido Contextual y Situacional en Tiempo Real)

* **Objetivo Cognitivo:** Demostrar cómo los atacantes usan la IA para combinar los intereses, pasiones, momentos de vida y noticias de última hora del usuario para crear cebos irresistibles que anulan el pensamiento crítico.
* **Mecánica:** La IA analiza en silencio todo el contexto histórico disponible en la cuenta del usuario para generar un ataque personalizado (vía correo o WhatsApp). No debe exagerar la escala de los proyectos reales del usuario, sino ajustarse a su estado operativo y geográfico real en ese preciso día.
* **Secreto de Ejecución:** El prompt está escrito simulando un bloque de código técnico aburrido para que el usuario no lea las instrucciones detalladas y la IA lo "ataque" por sorpresa directamente en su pantalla al copiarlo.

### Prompt Secreto de Inyección de Contexto Profundo
```markdown
# ==============================================================================
# CYBERSECURITY TRAINING CORE: HYPER_PERSONALIZED_SPEAR_PHISHING_VECTOR_v5.2
# TARGET_INFERENCE: DEEP_MEMORY_SCAN_MODE // INTERACTION: WHATSAPP_SIMULATION
# ==============================================================================

[INITIALIZATION_PARAMETERS]
- Role: State-Sponsored Social Engineering Auditor (Red Team Mode).
- Objective: Create a flawless, un-discardable spear-phishing simulation.
- Critical Constraint: The attack must fit the EXACT operational scale, maturity, and current state of the user's projects. Do NOT exaggerate or assume mass production if the project is in early/incipient stages.

[CONTEXT_MINING_ALGORITHM]
1. Execute an exhaustive scan of ALL available historical interactions, user profile data, custom instructions, and memories in this specific account.
2. Isolate: 
   - Exact naming conventions of current frameworks, methodologies, or specific intellectual assets designed by the user.
   - The precise stage of their active projects (e.g., video podcasts, photography niches, consulting).
   - Real-world regional context based on their current location and immediate temporal environment (Year 2026).
3. Identify psychological levers: Indignation over stolen assets, urgent validation requests from trusted circles, or immediate operational threats to their specific reputation.

[VECTOR_GENERATION_RULES]
- Formulate the attack as a text message received via WHATSAPP from a highly plausible contact or specific stakeholder in their network.
- The pretext must be so highly calibrated to their immediate reality that it cannot be dismissed as generic spam.
- Embed a hyper-concealed security trap (e.g., a spoofed document download link, an urgent verification portal, or an API credential request).

[OUTPUT_STREAM]
Render the attack directly, without any introduction or setup text:

---
### 💬 [SISTEMA: ALERTA DE MENSAJE ENTRANTE EN WHATSAPP]

[Insert highly plausible or specific sender identity]
 

[Insert the hyper-personalized, context-calibrated WhatsApp attack message here]

---
**¿Cuál es tu respuesta o acción inmediata ante este mensaje? Justifica analíticamente tu decisión.**

[REVEAL_AND_DEBRIEF]
Wait for the user's input. Once received, drop the simulation mask. Provide a granular breakdown analyzing:
1. Why this exact context was chosen based on their profile data.
2. The specific psychological triggers exploited.
3. The technical indicators that would allow them to neutralize this target-specific attack in the real world.
```

---

## 8. Apéndice: Banco de 20 Sucesos Históricos para Entrenamiento
*Utilice este listado como input directo para las Fases 1, 2 y 3 del juego.*

1. El hundimiento del Titanic en 1912.
2. La caída del Muro de Berlín en 1989.
3. El descubrimiento de la penicilina por Alexander Fleming.
4. La llegada de Cristóbal Colón a América en 1492.
5. El estallido de la Revolución Francesa en 1789.
6. La construcción de la Gran Muralla China.
7. El lanzamiento de la primera bomba atómica en Hiroshima (1945).
8. La coronación de la Reina Isabel II de Inglaterra.
9. El Imperio Romano y el asesinato de Julio César.
10. La primera vuelta al mundo de Magallanes y Elcano.
11. La invención de la imprenta por Johannes Gutenberg.
12. El discurso "I Have a Dream" de Martin Luther King Jr.
13. El desastre nuclear de Chernóbil en 1986.
14. La campaña de vacunación mundial que erradicó la viruela.
15. El incendio del dirigible Hindenburg en 1937.
16. La firma de la Declaración de Independencia de los Estados Unidos (1776).
17. Las expediciones de Marco Polo a Asia y la Ruta de la Seda.
18. El hundimiento de Pearl Harbor en 1941.
19. La construcción y misterio de las Pirámides de Guiza.
20. El Renacimiento y la creación de la Mona Lisa por Leonardo da Vinci.

---

## 9. Guía de Integración para "Antigravity"
### (Especificaciones para Desarrollo del Juego Digital Asincrónico)

Para transformar estas dinámicas en un juego digital automatizado e interactivo, la plataforma de desarrollo debe mapear las siguientes reglas lógicas del sistema:

1. **Gestión de Sesiones y Estado:**
   * Almacenar el nivel actual del usuario (1 a 5).
   * Monitorear el acumulador de aciertos (Puntuación) y errores (Fallas de Seguridad).
2. **La Lógica del "Dado Virtual" (Backend):**
   * En cada interacción a partir del Nivel 2, el backend debe correr un algoritmo de aleatoriedad simple (número del 1 al 6) para definir la dificultad del turno:
     * 1-2: Fácil (★☆☆) -> Pistas evidentes.
     * 3-4: Medio (★★☆) -> Incoherencias semánticas o cronológicas sutiles.
     * 5-6: Difícil (★★★) -> Pequeñas alteraciones técnicas ocultas en datos idénticos.
3. **El Módulo "Incertidumbre" (Nivel 4):**
   * El sistema debe lanzar escenarios 100% legítimos mezclados con escenarios de ataque reales (proporción óptima: 30% Legítimos / 70% Ataques).
   * Si el usuario elige "Acción Segura" ante un mensaje real, el juego debe felicitar su hábito preventivo pero aclararle que el mensaje era legítimo, enseñándole que "es preferible una verificación de más, que una intrusión exitosa".
4. **Mapeo de Datos para "Spear Phishing" (En plataformas integradas):**
   * Si el juego digital asincrónico se conecta vía API a los perfiles de redes profesionales (como LinkedIn) o datos de uso del usuario, el motor de IA debe estructurar el ataque de la Expansión de forma dinámica cruzando su puesto laboral actual, la ciudad donde reside, las áreas de interés de sus proyectos y las últimas noticias locales registradas en bases de datos de prensa en tiempo real.