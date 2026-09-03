---
id: "CON-SOCIOTECHNICAL"
title: "Sistema sociotécnico de seguridad"
type: "concept"
layer: "02_framework_canon"
status: "canonical"
epistemic_status: "supported"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Define la seguridad como un resultado emergente de la interacción entre personas, organización y tecnología."
related:
  - "CON-THESIS"
  - "CON-HUMAN-AGENCY"
  - "CON-DECISION-PROCESS"
  - "CON-FRAMEWORK-ETHICS"
decisions:
  - "DEC-001"
  - "DEC-005"
---

# Definición canónica

La seguridad es un resultado emergente de un **sistema sociotécnico** en el que interactúan personas, organización y tecnología. Ninguno de estos elementos explica por sí solo la protección o el incidente.

## Componentes

### Persona

Incluye atención, experiencia, estado cognitivo, interpretación, emoción, hábitos, decisiones y conducta. Su capacidad es real pero está condicionada por tiempo, información, interfaces, poder y apoyo disponible.

### Organización

Incluye procesos, roles, incentivos, normas, cultura, cargas de trabajo, canales de verificación, escalamiento, entrenamiento y distribución de responsabilidad. Una organización puede ampliar o reducir la agencia mediante su diseño.

### Tecnología

Incluye controles, interfaces, automatización, telemetría, modelos de IA, permisos y mecanismos de recuperación. La tecnología puede ampliar percepción y capacidad de respuesta, pero también introducir opacidad, defaults o sobredependencia.

## Principio de interacción

Los controles crean condiciones de seguridad; la conducta ayuda a realizar algunas de ellas. A la inversa, pedir a una persona que «decida mejor» sin ofrecer rutas oficiales, tiempo, permisos o respaldo es una intervención incompleta.

El análisis de un incidente debe preguntar simultáneamente:

- ¿Qué hizo o dejó de hacer la persona y desde qué condiciones?
- ¿Qué señales, incentivos y restricciones produjo la organización?
- ¿Qué permitió, sugirió, ocultó o automatizó la tecnología?
- ¿Cómo se combinaron estos elementos?

## Implicaciones de diseño

- Distribuir la responsabilidad y preservar trazabilidad.
- Diseñar verificación independiente y escalamiento accesible.
- Graduar automatización según impacto y reversibilidad.
- Evitar interfaces que conviertan confianza probabilística en certeza aparente.
- Tratar errores y recuperaciones como información del sistema.

## No es

No es una forma de diluir responsabilidad ni de negar que existan errores individuales. Es una regla para ubicar cada conducta dentro de las condiciones que la hicieron más o menos probable y para intervenir en varios puntos del sistema.
