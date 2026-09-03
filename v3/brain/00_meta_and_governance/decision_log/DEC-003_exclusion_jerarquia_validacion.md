---
id: "DEC-003"
title: "Exclusión de Jerarquía y Validación como Attention Doors"
type: "decision"
layer: "00_meta_and_governance"
status: "canonical"
epistemic_status: "established"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Determina que Jerarquía y Validación no son puertas independientes y explica cómo se representan mediante mecanismos ya contenidos en el catálogo canónico."
related:
  - "CON-ATTENTION-DOORS"
  - "CON-DECISION-PROCESS"
  - "CON-EPISTEMIC-BOUNDARIES"
decisions:
  - "DEC-002"
decision_status: "accepted"
rationale: "Ambas categorías describen fuentes o formas contextuales de relevancia que se explican mejor mediante combinaciones de las nueve puertas oficiales."
supersedes: []
affected_docs:
  - "CON-ATTENTION-DOORS"
  - "CON-DECISION-PROCESS"
  - "CON-EPISTEMIC-BOUNDARIES"
---

# Decisión

Jerarquía y Validación no forman parte del catálogo canónico de Attention Doors y no deben modelarse como puertas independientes.

## Jerarquía

La jerarquía describe una relación de autoridad o una propiedad del contexto: quién solicita, desde qué rol y con qué capacidad formal o social. No explica por sí sola por qué esa señal adquiere prioridad para una persona concreta.

Su efecto puede expresarse mediante puertas existentes, por ejemplo:

- Responsabilidad: «debo responder porque depende de mí».
- Identidad: «debo demostrar competencia o estar a la altura de mi rol».
- Pertenencia: «no quiero quedar fuera ni frenar al equipo».
- Pérdida: «puedo perder reputación, oportunidad o posición».
- Protección: «debo proteger al equipo o la operación».
- Conveniencia/Rutina: «normalmente cumplo esta clase de instrucciones sin revisarlas».

Tratar Jerarquía como puerta mezclaría el origen externo de una señal con la prioridad funcional interna que ayuda a explicar su efecto.

## Validación

La validación describe aprobación, confirmación social o una búsqueda de reconocimiento. Tampoco constituye un mecanismo independiente en el modelo vigente. Puede representarse mediante:

- Identidad, cuando confirma valor, competencia o reputación.
- Pertenencia, cuando el consenso o la aceptación del grupo otorgan legitimidad.
- Coherencia, cuando la coincidencia con expectativas reduce fricción.
- Responsabilidad, cuando la aprobación de otros parece autorizar la acción.
- Conveniencia/Rutina, cuando el consenso funciona como atajo para no revisar.

## Consecuencias

- Las menciones de Jerarquía y Validación pueden conservarse como señales, condiciones o lenguaje narrativo, pero no con `type: door`.
- En ejercicios de análisis se debe preguntar qué prioridad personal hizo efectiva la autoridad o la aprobación.
- Los datos históricos que usen esas claves deben migrarse a las puertas oficiales sin borrar el registro de la versión anterior.
- No se reemplazan mecánicamente por una única puerta: la traducción depende del contexto.

## Criterio de reapertura

La decisión solo debe revisarse si nueva elaboración teórica o evidencia muestra un mecanismo funcional diferenciable que no pueda representarse adecuadamente con el catálogo actual.
