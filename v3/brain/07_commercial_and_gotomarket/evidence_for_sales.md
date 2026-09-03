---
id: "COM-EVIDENCE-SALES"
title: "Evidencia y claims aprobados para ventas"
type: "commercial_claim_bank"
layer: "07_commercial_and_gotomarket"
status: "canonical"
epistemic_status: "mixed"
version: "1.0.0"
author: "David Castañeda-Pardo y Javier Velasquez"
summary: "Banco gobernado de claims comerciales con wording aprobado, fuentes, vigencia y prohibiciones explícitas para prevenir overclaim."
related:
  - "CLM-MATRIX-HF"
  - "CLM-MATRIX-GENAI-SE"
  - "CLM-MATRIX-TRAINING"
  - "CLM-MATRIX-GAMES"
  - "EVD-WEBINAR-V1"
decisions:
  - "DEC-001"
  - "DEC-002"
  - "DEC-008"
---

# Regla de uso

Solo se puede publicar el wording aprobado o una paráfrasis que conserve alcance y límites. La vigencia obliga a revisar fuentes, producto y evidencia antes de reutilizar el claim.

# Claims aprobados

## SALES-CLAIM-001 — IA y personalización

**Approved wording:** «Los LLM pueden automatizar partes de la investigación, redacción y personalización de campañas de spear phishing».

**Sources:** [`CLAIM-GENAI-001`, `SRC-HAZELL-2023`, `SRC-HEIDING-ETAL-2024`]

**Valid from:** 2026-09-03

**Review by:** 2027-03-03

**Permitted contexts:** presentación ejecutiva, propuesta, web y conversación comercial con enlace a evidencia.

**Do not say:** «La IA crea ataques perfectos», «todo phishing ya usa IA» o «la IA garantiza hiperpersonalización efectiva».

## SALES-CLAIM-002 — Señales superficiales

**Approved wording:** «Ortografía, tono familiar y coherencia visual no son prueba suficiente de autenticidad».

**Sources:** [`CLAIM-GENAI-004`, `CLAIM-GENAI-005`]

**Valid from:** 2026-09-03

**Review by:** 2027-03-03

**Permitted contexts:** todos los materiales con recomendación de verificación independiente.

**Do not say:** «Ya no existen señales externas» o «es imposible detectar phishing».

## SALES-CLAIM-003 — Factor humano

**Approved wording:** «La conducta de seguridad emerge de la interacción entre personas, tareas, interfaces, procesos y tecnología; culpar al usuario no corrige esas condiciones».

**Sources:** [`CLAIM-HF-001`, `CLAIM-HF-002`, `SRC-SASSE-BROSTOFF-WEIRICH-2001`]

**Valid from:** 2026-09-03

**Review by:** 2027-09-03

**Permitted contexts:** posicionamiento, propuestas y workshops.

**Do not say:** «El usuario no tiene responsabilidad» o «el factor humano deja de importar».

## SALES-CLAIM-004 — Training e intervention

**Approved wording:** «Desarrollar capacidad humana y modificar condiciones sociotécnicas son líneas complementarias».

**Sources:** [`CLAIM-HF-001`, `MET-TRAIN-VS-INTERV`]

**Valid from:** 2026-09-03

**Review by:** 2027-09-03

**Permitted contexts:** diagnóstico, programa continuo y conversación ejecutiva.

**Do not say:** «El awareness no sirve» o «el training por sí solo reduce incidentes».

## SALES-CLAIM-005 — Gamificación

**Approved wording:** «La gamificación educativa muestra efectos promedio positivos, pero heterogéneos; el diseño y la evaluación importan».

**Sources:** [`CLAIM-GG-001`, `CLAIM-GG-002`, `SRC-SAILER-HOMNER-2020`]

**Valid from:** 2026-09-03

**Review by:** 2027-03-03

**Permitted contexts:** propuestas de experiencia y metodología.

**Do not say:** «Jugar garantiza aprendizaje», «FARO está científicamente validado» o «engagement demuestra transferencia».

## SALES-CLAIM-006 — Confianza calibrada

**Approved wording:** «El objetivo no es maximizar confianza en IA, sino favorecer reliance apropiada según desempeño, contexto y costo».

**Sources:** [`CLAIM-HAI-001`, `CLAIM-HAI-002`, `SRC-LEE-SEE-2004`]

**Valid from:** 2026-09-03

**Review by:** 2027-09-03

**Permitted contexts:** human–AI decision training, gobernanza y transformación.

**Do not say:** «La supervisión humana siempre mejora la IA» o «confiar en IA es perder agencia».

## SALES-CLAIM-007 — Evidencia del webinar

**Approved wording:** «El primer webinar produjo una señal cualitativa positiva de interés y abrió conversaciones comerciales».

**Sources:** [`EVD-WEBINAR-V1`, `SRC-WEBINAR-INTERNAL-2026`]

**Valid from:** 2026-09-03

**Review by:** 2026-12-03

**Permitted contexts:** conversación comercial y credenciales de experiencia, identificado como reporte interno cualitativo.

**Do not say:** «El webinar probó efectividad», «mejoró conductas», «redujo incidentes» o cualquier porcentaje no documentado.

# Prohibiciones globales de copywriting

- No llamar a las personas «eslabón más débil».
- No presentar Attention Doors como test validado o perfil de vulnerabilidad.
- No afirmar que existen exactamente nueve puertas universales.
- No decir que Digital Self es un gemelo exacto o perfil psicológico.
- No prometer cero incidentes, inmunidad, ROI o cambio de conducta sin estudio.
- No convertir scores D/N en medición de personalidad.
- No usar miedo, vergüenza o cifras sin fuente.
- No afirmar certificación, cumplimiento o aval académico inexistente.

# Gobernanza

Todo claim nuevo enlaza un claim de Research o un Evidence Record, conserva fecha y propietario, y pasa revisión humana. Si vence, queda suspendido hasta revalidación.
