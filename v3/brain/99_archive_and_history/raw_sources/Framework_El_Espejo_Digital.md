# Framework: El Espejo Digital

## Diseño de experiencia para entrenamiento en ciberseguridad asistida por IA

> Documento de diseño para taller presencial y experiencia interactiva
> (Antigravity)

------------------------------------------------------------------------

# 1. Hipótesis central

La ingeniería social moderna no comienza explotando un sesgo cognitivo.

Propongo el siguiente modelo:

**Puerta de Atención → Emoción → Sesgos Cognitivos → Decisión →
Conducta**

Un atacante exitoso primero consigue que un tema entre al foco principal
de nuestra atención. Después aparecen las emociones; luego los sesgos
aceleran la decisión.

Este cambio de enfoque convierte la formación en una experiencia más
humana y memorable.

------------------------------------------------------------------------

# 2. Las Puertas de Atención

Las puertas representan prioridades humanas que capturan atención antes
de que el pensamiento analítico se active.

## Identidad

Todo aquello relacionado con quién creo ser.

## Curiosidad

El deseo de comprender, descubrir o resolver un misterio.

## Responsabilidad

La sensación de que alguien o algo depende de mí.

## Justicia

Impulso por corregir errores, abusos o representaciones injustas.

## Coherencia

Necesidad de resolver contradicciones y completar modelos mentales.

## Pertenencia

Confianza derivada de grupos, comunidades y personas "como yo".

## Protección

Impulso de cuidar personas, proyectos o activos importantes.

## Pérdida

Evitar perder oportunidades, acceso, dinero, prestigio o tiempo.

## Conveniencia / Rutina

Decisiones automáticas, comodidad y hábitos.

------------------------------------------------------------------------

# 3. Los Tres Espejos

Los espejos no buscan asustar mediante ejemplos extremos.

Buscan permitir que cada persona descubra cómo una IA puede reconstruir
una representación sorprendentemente útil de sí misma.

## Espejo 1 --- Superficie de Exposición

Objetivo:

Mostrar qué información posee la IA, qué puede inferirse y qué podría
encontrarse públicamente.

Debe separar claramente:

-   Hechos conocidos
-   Inferencias
-   Información potencialmente pública
-   Riesgos asociados
-   Recomendaciones para reducir exposición

### Prompt

``` text
Actúa como un auditor de exposición personal en ciberseguridad.

Quiero que analices exclusivamente la información que conoces sobre mí y, cuando sea apropiado, diferencies claramente entre:

1. Hechos que conoces por nuestras conversaciones.
2. Inferencias razonables (marcadas explícitamente como inferencias).
3. Información que probablemente podría encontrarse públicamente sobre mí (sin inventarla ni asumir que existe).

Con base en ello construye un informe con la siguiente estructura:

- Resumen ejecutivo.
- Principales áreas de exposición.
- Información profesional.
- Información personal.
- Proyectos actuales.
- Rutinas y patrones detectados.
- Relaciones y comunidades (sin revelar datos sensibles innecesarios).
- Riesgos potenciales derivados de cada categoría.
- Cinco recomendaciones concretas para reducir mi superficie de ataque.

No inventes hechos. Diferencia siempre entre evidencia e inferencia.
```

------------------------------------------------------------------------

## Espejo 2 --- La Persona que una IA Cree que Soy

Objetivo:

No listar datos.

Construir una narrativa.

La IA debe responder:

**¿Qué historia construiría sobre quién soy únicamente observando todo
lo que sabe de mí?**

Debe escribir en tono reflexivo.

No debe revelar información sensible.

Debe describir:

-   patrones
-   valores aparentes
-   estilo de pensamiento
-   motivaciones
-   formas de aprender
-   manera de tomar decisiones
-   tensiones internas
-   fortalezas aparentes
-   puntos ciegos potenciales

Debe terminar respondiendo:

> ¿Qué impresión general dejaría esta persona a alguien que solo pudiera
> conocerla mediante sus conversaciones conmigo?

### Prompt

``` text
Quiero que construyas "El Segundo Espejo".

No quiero un perfil psicológico.

No quiero un listado de datos.

Quiero una narrativa.

Escribe un ensayo breve titulado:

"La persona que una IA cree que eres".

Utiliza únicamente patrones observados en nuestras conversaciones.

No reveles información sensible.

No cites datos privados.

No hagas diagnósticos clínicos.

Describe únicamente la historia que emerge al observar cómo pienso, escribo, aprendo, tomo decisiones, resuelvo problemas y construyo proyectos.

Habla de:

- patrones intelectuales
- patrones emocionales generales
- motivaciones aparentes
- forma de relacionarme con el conocimiento
- relación entre trabajo, propósito e identidad
- cómo probablemente me perciben otras personas
- posibles puntos ciegos

Termina explicando qué impresión general deja esa narrativa y qué tan precisa crees que podría resultar.
```

------------------------------------------------------------------------

## Espejo 3 --- Perfil de Puertas de Atención

Objetivo:

Estimar cuáles prioridades capturan con mayor facilidad la atención.

No diagnostica vulnerabilidades.

Describe probabilidad de activación.

Escala sugerida:

0--100.

Para cada puerta entregar:

-   Puntaje
-   Explicación
-   Qué situaciones podrían activarla (sin construir ataques)
-   Recomendaciones para mantener pensamiento crítico cuando esa puerta
    se active

### Prompt

``` text
Actúa como un analista de comportamiento especializado en ciberseguridad.

Evalúa mis "Puertas de Atención".

Estas puertas representan prioridades humanas que capturan atención antes de que aparezcan emociones y sesgos.

Evalúa las siguientes:

- Identidad
- Curiosidad
- Responsabilidad
- Justicia
- Coherencia
- Pertenencia
- Protección
- Pérdida
- Conveniencia / Rutina

Para cada una entrega:

- Puntaje de 0 a 100
- Justificación basada únicamente en patrones observados
- Nivel de confianza de la evaluación
- Qué tipos generales de situaciones activarían esa puerta (sin redactar ejemplos de ingeniería social)
- Estrategias para recuperar pensamiento analítico cuando esa puerta se active.

Finaliza con:

- Radar general
- Las tres puertas predominantes
- Fortalezas
- Recomendaciones prácticas de autocuidado digital.
```

------------------------------------------------------------------------

# 4. Diseño del Juego (Antigravity)

## Objetivo

Que cada participante descubra por sí mismo su exposición digital.

No competir contra otros.

Competir contra su propia percepción inicial.

## Flujo

1.  Predicción inicial:
    -   ¿Qué tanto crees que una IA sabe de ti?
2.  Espejo 1.
3.  Reflexión.
4.  Espejo 2.
5.  Reflexión.
6.  Espejo 3.
7.  Síntesis.
8.  Plan personal de reducción de riesgo.

## Feedback

En lugar de "correcto / incorrecto":

-   Descubrimiento
-   Sorpresa
-   Riesgo
-   Recomendación
-   Acción concreta

## Puntajes sugeridos

-   Índice de Exposición
-   Índice de Coherencia Narrativa
-   Índice de Activación de Puertas
-   Índice de Preparación Defensiva

Nunca representar "qué tan fácil eres de engañar", sino "qué tan
consciente eres de tu superficie de atención".

------------------------------------------------------------------------

# 5. Narrativa

## Concepto

"No tienes una sola identidad.

También tienes un Yo Digital."

Así como protegemos:

-   la casa,
-   el cuerpo,
-   la familia,
-   el automóvil,

también debemos proteger nuestro yo digital.

La experiencia consiste en visitar a ese gemelo digital.

La IA actúa como un espejo que revela qué aspecto tiene ese otro yo
desde fuera.

El enemigo no es la tecnología.

El enemigo es olvidar que nuestro yo digital también necesita hábitos de
seguridad.

Posibles estéticas:

-   Cyberpunk sobrio
-   Gemelo Digital
-   Ciudad Digital
-   Metaverso
-   Operador de Centro de Monitoreo
-   Archivo de Inteligencia Personal

La narrativa puede concluir con una idea:

> La verdadera ciberseguridad no consiste únicamente en proteger
> dispositivos.

> Consiste en proteger la atención humana.
