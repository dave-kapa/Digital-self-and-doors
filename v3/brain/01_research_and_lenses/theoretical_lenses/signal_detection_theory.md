---
id: "THEORY-SDT"
title: "Signal Detection Theory"
type: "theory_lens"
layer: "01_research_and_lenses"
status: "canonical"
epistemic_status: "established"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Lente para analizar decisiones bajo incertidumbre cuando señales y ruido se solapan, separando capacidad de discriminación y criterio de respuesta, y haciendo visibles aciertos, omisiones y falsas alarmas."
related:
  - "CON-DECISION-PROCESS"
  - "CON-EPISTEMIC-BOUNDARIES"
  - "CLM-MATRIX-HF"
  - "CLM-MATRIX-ATT-DEC"
decisions:
  - "DEC-006"
---

# Qué explica

Signal Detection Theory (SDT) explica decisiones de clasificación cuando la evidencia procedente de «señal» y «ruido» se solapa y no permite certeza perfecta. Distingue entre la capacidad para discriminar distribuciones y el criterio utilizado para responder.

Permite representar cuatro resultados respecto de un estado de referencia conocido: acierto, omisión, falsa alarma y rechazo correcto. También permite estudiar el costo relativo de cada error y cómo incentivos, prevalencia esperada o consecuencias desplazan el criterio.

# Variables centrales

- Distribuciones de señal y ruido.
- Sensibilidad o discriminabilidad, comúnmente representada por `d′`.
- Criterio o umbral de respuesta.
- Tasas de aciertos y falsas alarmas.
- Prevalencia o probabilidad previa.
- Costos y beneficios asociados a cada decisión.

# Relaciones propuestas

Una mayor discriminabilidad facilita separar señal y ruido, pero no elimina el criterio. Un criterio conservador puede reducir falsas alarmas y aumentar omisiones; uno liberal puede aumentar aciertos y falsas alarmas. No existe un umbral óptimo fuera del contexto de costos, prevalencia y objetivos.

# Límites

SDT necesita una tarea y un ground truth definidos para estimar desempeño. No explica por sí sola por qué un estímulo se volvió personalmente relevante, cómo surgió una emoción, qué historia interna apareció ni cómo se formó una intención. Sus métricas dependen de supuestos y de suficientes observaciones; no deben calcularse como rasgos personales a partir de pocos casos.

# Conexión legítima con el framework

La lente ayuda a mostrar que una alerta humana o automatizada puede producir aciertos y errores, y que alta confianza no equivale a certeza. Justifica evaluar criterios, costos y calidad de evidencia, no solo una etiqueta final. En el Caso 3 permite discutir la estructura de decisiones bajo incertidumbre sin revelar en qué cuadrante cayó el mensaje concreto.

También apoya la idea de calibrar respuesta: verificar o limitar una acción puede ser preferible a aceptar ciegamente una clasificación o ignorarla por completo.

# Qué NO permite afirmar

- Que una Attention Door sea una señal estadística o un parámetro de SDT.
- Que el framework mejore `d′` o mueva el criterio en una dirección deseable sin datos.
- Que ocultar el ground truth sea siempre mejor para aprender.
- Que toda decisión de ciberseguridad pueda reducirse a una clasificación binaria.
- Que un acierto aislado pruebe competencia o una falsa alarma pruebe incapacidad.

# Fuentes base por ID

- `SRC-GREEN-SWETS-1966`
- `SRC-MACMILLAN-CREELMAN-2005`
