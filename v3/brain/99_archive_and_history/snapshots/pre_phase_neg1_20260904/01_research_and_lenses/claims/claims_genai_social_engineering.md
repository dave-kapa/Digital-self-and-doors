---
id: "CLM-MATRIX-GENAI-SE"
title: "Claims matrix: Generative AI and Social Engineering"
type: "claim_matrix"
layer: "01_research_and_lenses"
status: "canonical"
epistemic_status: "mixed"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Matriz de claims sobre capacidad de los LLM para producir y escalar contenido persuasivo o personalizado, con límites explícitos sobre prevalencia, atribución y generalización."
related:
  - "CON-THESIS"
  - "CON-DIGITAL-FOOTPRINT"
  - "CON-DIGITAL-SELF"
  - "CLM-MATRIX-HF"
decisions:
  - "DEC-001"
---

# Claims

## CLAIM-GENAI-001

**Claim statement:** Los LLM pueden automatizar partes de la investigación, redacción y personalización de campañas de spear phishing.

**Epistemic Status:** supported

**Confidence:** high

**Scope:** Demostraciones y estudios experimentales con modelos y flujos concretos; capacidad técnica, no prevalencia delictiva observada.

**Supported by:** [`SRC-HAZELL-2023`, `SRC-HEIDING-ETAL-2024`, `SRC-BETHANY-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `commercial`, `external_publication`]

**Limitations & What it does not say:** No afirma que todos los atacantes usen IA, que el flujo sea completamente autónomo en la práctica ni que toda personalización aumente éxito.

## CLAIM-GENAI-002

**Claim statement:** En estudios específicos, mensajes personalizados generados con LLM han alcanzado niveles de persuasión o respuesta comparables con mensajes elaborados por humanos.

**Epistemic Status:** supported

**Confidence:** medium

**Scope:** Estudios con muestras, canales, modelos y outcomes particulares; incluye medidas de ranking, intención de clic o clic observado según el estudio.

**Supported by:** [`SRC-FRANCIA-ETAL-2024`, `SRC-HEIDING-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `commercial`, `external_publication`]

**Limitations & What it does not say:** No autoriza afirmar superioridad universal de IA, «ataques perfectos» ni tasas de éxito aplicables a cualquier población. No deben combinarse outcomes distintos como si fueran equivalentes.

## CLAIM-GENAI-003

**Claim statement:** Información pública o voluntariamente aportada puede utilizarse para construir mensajes contextuales y perfiles funcionales orientados a personalización.

**Epistemic Status:** supported

**Confidence:** high

**Scope:** Datos accesibles dentro del diseño de cada estudio; la precisión, legalidad y disponibilidad varían por objetivo y jurisdicción.

**Supported by:** [`SRC-HAZELL-2023`, `SRC-FRANCIA-ETAL-2024`, `SRC-HEIDING-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `commercial`, `external_publication`]

**Limitations & What it does not say:** No significa que el perfil sea verdadero, completo o psicológico. Tampoco justifica buscar datos externos de participantes sin consentimiento.

## CLAIM-GENAI-004

**Claim statement:** Calidad lingüística, tono familiar y coherencia visual son evidencia insuficiente para establecer autenticidad, especialmente cuando herramientas generativas pueden reproducir esas características.

**Epistemic Status:** supported

**Confidence:** medium

**Scope:** Evaluación de mensajes digitales; se refiere a insuficiencia de estas señales aisladas, no a su ausencia total de valor.

**Supported by:** [`SRC-FRANCIA-ETAL-2024`, `SRC-HEIDING-ETAL-2024`, `SRC-BETHANY-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `commercial`, `external_publication`]

**Limitations & What it does not say:** No afirma que sea imposible detectar phishing por señales externas ni que todo mensaje impecable haya sido generado por IA.

## CLAIM-GENAI-005

**Claim statement:** No es fiable atribuir autoría humana o generativa de un mensaje únicamente por su redacción percibida.

**Epistemic Status:** supported

**Confidence:** medium

**Scope:** Juicios humanos de autoría en estudios de mensajes personalizados; generalización limitada por modelos, muestras y tareas.

**Supported by:** [`SRC-FRANCIA-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `external_publication`]

**Limitations & What it does not say:** No demuestra que la detección técnica de contenido generado sea siempre imposible ni que conocer la autoría determine legitimidad o seguridad.

## CLAIM-GENAI-006

**Claim statement:** Los estudios de capacidad de LLM para phishing no establecen por sí solos la prevalencia de uso criminal, el impacto agregado ni la efectividad en todos los entornos organizacionales.

**Epistemic Status:** established

**Confidence:** high

**Scope:** Límite de inferencia al interpretar estudios experimentales, pilotos, red teams y demostraciones de capacidad.

**Supported by:** [`SRC-HAZELL-2023`, `SRC-FRANCIA-ETAL-2024`, `SRC-HEIDING-ETAL-2024`]

**Last verified:** 2026-09-03

**Allowed uses:** [`internal_research`, `training_content`, `commercial`, `external_publication`]

**Limitations & What it does not say:** No minimiza el riesgo. Distingue capacidad demostrada de frecuencia real y prohíbe convertir resultados contextuales en una cifra universal de amenaza.
