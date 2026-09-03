---
id: "DEC-008"
title: "Adopción del scoring dinámico Debía/No debía"
type: "decision"
layer: "00_meta_and_governance"
status: "canonical"
epistemic_status: "established"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Adopta una matriz Debía/No debía para evaluar decisiones de forma contextual y dinámica en FARO."
related:
  - "CON-HUMAN-AGENCY"
  - "CON-DECISION-PROCESS"
  - "CON-METACOGNITION"
  - "CON-EPISTEMIC-BOUNDARIES"
decisions:
  - "DEC-006"
  - "DEC-010"
decision_status: "accepted"
rationale: "Los valores fijos y las respuestas únicas no representan adecuadamente decisiones multiselección cuya calidad depende de la evidencia revisada y de la combinación de acciones."
supersedes: []
affected_docs:
  - "CON-HUMAN-AGENCY"
  - "CON-DECISION-PROCESS"
  - "CON-METACOGNITION"
  - "CON-EPISTEMIC-BOUNDARIES"
---

# Decisión

FARO utilizará una matriz dinámica **Debía/No debía (D/N)** para evaluar las acciones seleccionadas en cada caso.

- **Debía (D):** grado en que una acción pertinente, esperable o protectora fue realizada cuando el contexto la hacía necesaria.
- **No debía (N):** grado en que se ejecutó una acción evitable, desproporcionada o riesgosa que el contexto no justificaba.

La evaluación no se deriva de la posición de una opción ni de una única respuesta «correcta». Depende del caso, de la información disponible o considerada y de la combinación final de acciones.

## Fundamento

Las decisiones seguras suelen ser composiciones: verificar por una ruta independiente, limitar alcance, introducir reversibilidad, compartir autorización y reportar. Una misma acción puede ser insuficiente por omisión de otra; una acción razonable puede volverse riesgosa al combinarse con una concesión irreversible.

La matriz D/N permite separar dos clases de error que un puntaje único confunde: dejar de hacer algo pertinente y hacer algo que no correspondía. También facilita feedback que explica el proceso sin depender del ground truth del Caso 3.

## Reglas

- Cada alternativa declara valores D y N funcionales y trazables.
- Los valores pueden ajustarse según evidencias revisadas, acciones combinadas y restricciones del caso.
- El feedback debe explicar por qué cambió la evaluación; no puede limitarse a mostrar una cifra.
- El orden y la visibilidad inicial de las alternativas no deben revelar su valor.
- Cambios en la matriz o en las constantes implementadas requieren sincronización entre especificación y código.

## Consecuencias

- Se favorece evaluación del proceso, no obediencia a una clave oculta.
- Pueden existir rutas distintas con calidad equivalente.
- El resultado agregado debe leerse como señal pedagógica de calibración, no como medición psicométrica de la persona.

## Límite arquitectónico

D/N es una mecánica del sistema de producto FARO, no un componente constitutivo del framework Digital Self & Attention Doors. El Canon puede explicar sus principios, pero no debe convertir la matriz en teoría general ni extrapolarla a diagnósticos.
