---
id: GAME-FARO-SIMULATION-V3PLUS
title: "FARO V3+ Interactive Simulation Engine"
type: game
layer: 04_product_system
status: canonical
epistemic_status: not_applicable
version: 3.1.0
author: "Equipo FARO"
last_updated: "2026-09-03"
summary: "Especificación formal del motor de simulación interactiva FARO V3+ en lenguaje humano puro, agnóstica de código, definiendo reglas, flujo de pantallas, HUD, casos 1 al 4 y scoring D/N."
---

# ESPECIFICACIÓN CANÓNICA DEL MOTOR DE SIMULACIÓN FARO V3+
## Game Design Document (GDD) en Lenguaje Humano Puro

---

## 1. Visión y Propósito del Juego
FARO V3+ es una experiencia de simulación interactiva en tiempo real donde los participantes asumen el rol de un operador ante un sistema autónomo de seguridad y gestión institucional asistido por IA (FARO).

El juego no busca evaluar conocimientos técnicos de ciberseguridad, sino entrenar la **calibración decisional**, el reconocimiento de las **Puertas de Atención** y la aplicación del protocolo **P.A.R.A.** (Pausar, Analizar, Revisar, Actuar).

---

## 2. Los Cuatro Casos del Juego

### Caso 1: Autonomía y Confianza Calibrada
* **Dilema:** FARO solicita ampliación de permisos temporales para mitigar una supuesta anomalía de red.
* **Mecánica:** Evaluar si el operador delega ciegamente la autoridad por confianza en la automatización o si exige verificación independiente de reversibilidad.
* **Atención Door Principal:** Responsabilidad / Conveniencia.

### Caso 2: El Digital Self en Acción
* **Dilema:** Llegada de un mensaje altamente verosímil y personalizado dirigido al perfil del operador, basado en patrones de comportamiento reales.
* **Mecánica:** Notar cómo la personalización reduce la alerta y cómo el Yo Digital es modelado para anticipar la respuesta.
* **Atención Door Principal:** Identidad / Pertenencia.

### Caso 3: Señales Internas sin Ground Truth (Sin Revelación de Legitimidad)
* **Dilema:** Notificación urgente de protección sobre un activo crítico que exige una acción inmediata bajo presión de tiempo.
* **Regla Canónica (DEC-006):** El juego **nunca revela si el mensaje era legítimo o fraudulento**. Se evalúa exclusivamente la calidad del proceso de verificación y la gestión del impulso reactivo.
* **Atención Door Principal:** Protección / Pérdida.

### Caso 4: Autenticidad No Obvia y Ampliación de Repertorio
* **Dilema:** Mensaje formalmente auténtico pero cuya solicitud viola principios de contención o expone a la institución.
* **Regla Canónica (DEC-010):** Que un mensaje sea auténtico no hace obvia la decisión; se desafía al participante a explorar alternativas reversibles antes de actuar.
* **Atención Door Principal:** Justicia / Coherencia.

---

## 3. Matriz de Scoring: Sistema D/N (Debía / No Debía)
El juego no penaliza arbitrariamente ni premia el azar. La evaluación se fundamenta en la matriz de decisión:
* **D (Debía actuar y actuó):** Calibración óptima (+Integridad, Costo Justificado).
* **N (No debía actuar y actuó):** Reactividad o impulso precipitativo (-Integridad o Costo Excesivo).
* **Pausa Efectiva:** El uso deliberado de PARA otorga bonificación de calibración metacognitiva.

---

## 4. Arquitectura de Pantallas y Flujo del HUD
1. **Portada y Pre-carga:** Acceso mediante PIN de sesión y selección de rol (Operador / Facilitador).
2. **Rondas de Calibración:** 4 rondas iniciales para medir el pulso y estado de alerta del participante.
3. **Módulo de Casos (1 al 4):** Presentación del dilema -> Pausa consciente -> Exploración de opciones -> Acción final -> Feedback dinámico inmediato.
4. **Pantalla de Resultados Grupales:** Visualización colectiva sincronizada en tiempo real mediante WebSockets (Supabase) mostrando la dispersión de decisiones del grupo sin avergonzar a nadie individualmente.
