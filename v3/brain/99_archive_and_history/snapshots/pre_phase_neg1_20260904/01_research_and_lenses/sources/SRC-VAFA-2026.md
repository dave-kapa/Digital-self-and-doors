---
id: "SRC-VAFA-2026"
title: "Context-Aware Spear Phishing: Generative AI-Enabled Attacks Against Individuals via Public Social Media Data"
type: "source"
layer: "01_research_and_lenses"
status: "canonical"
epistemic_status: "not_applicable"
reading_status: "complete"
reading_depth: "full_text"
version: "1.0.0"
author: "Elham Pourabbas Vafa, Sayak Saha Roy y Shirin Nilizadeh"
topics:
  - "generative_ai"
  - "social_engineering_phishing"
  - "digital_footprint"
  - "personalization"
  - "human_ai_interaction"
fulltext:
  availability: "public"
  storage_type: "external_url"
  location: "https://arxiv.org/pdf/2605.11268"
  sha256: null
summary: "Preprint de 2026 que demuestra en un entorno controlado cómo cinco modelos generativos pueden combinar señales públicas de Instagram, perfilado de estilo y siete estrategias de ingeniería social para producir 17.916 correos personalizados; sus evaluaciones automatizadas y un estudio con 70 adultos estadounidenses hallan mayor calidad percibida y menor sospecha que en muestras APWG, aunque la plataforma única, los estímulos estáticos, el tamaño humano y el carácter no revisado por pares limitan la generalización a victimización real."
related:
  - "CON-DIGITAL-FOOTPRINT"
  - "CON-DIGITAL-SELF"
  - "DOOR-001"
  - "DOOR-002"
  - "DOOR-005"
  - "DOOR-006"
  - "CLM-MATRIX-GENAI-SE"
---

# 1. Citation (APA)

Vafa, E. P., Saha Roy, S., & Nilizadeh, S. (2026). *Context-aware spear phishing: Generative AI-enabled attacks against individuals via public social media data* [Preprint]. arXiv. https://doi.org/10.48550/arXiv.2605.11268

# 2. Why this source matters

Es una prueba de factibilidad reciente y directamente alineada con la tesis Digital Footprint → Digital Self funcional → personalización de mensajes. Muestra que pocas señales públicas pueden anclar contenido persuasivo a escala y que la calidad superficial puede reducir pistas tradicionales de phishing. También ofrece un correctivo importante: el modelo fabrica gran parte del relato, de modo que una representación operativa del objetivo combina evidencia pública e inferencia generada, no una réplica verdadera de la persona.

# 3. Study design / methodology

El trabajo combina cuatro componentes: revisión de alcance de 21 artículos (2015–2024); muestreo de 10.000 cuentas públicas de Instagram y selección aleatoria de 200 perfiles, de los que se recopilaron 3.268 publicaciones de un año; generación con GPT-4, Claude 3 Haiku, Gemini 1.5 Flash, Gemma 7B y LLaMA 3.3; y evaluación de ataque y defensa. La canalización produjo 17.916 correos en siete estrategias y cinco dimensiones contextuales. Una anotación por mayoría de tres LLM fue contrastada por dos codificadores humanos sobre 200 mensajes (κ = 0,95; 99% de coincidencia con consenso). El estudio humano, aprobado por IRB, asignó aleatoriamente a 70 adultos de Estados Unidos reclutados en Prolific a evaluar capturas estáticas de tres mensajes maliciosos LLM o APWG y dos controles benignos. Se usaron escalas Likert, juicio binario y pruebas no paramétricas. El manuscrito es arXiv v1 y no consta revisión por pares a la fecha de verificación.

# 4. Main findings & quantitative results

- La ganancia de información contextual descendió por debajo de 0,03 después de cinco posts y de 0,01 hacia diez; los autores estiman que 10–15 posts suelen bastar para anclar personalización.
- Los perfiles contenían aproximadamente 8–9 entidades distintas; los correos generados, entre 17 y 50, pero normalmente solo 1–2 pistas específicas del usuario pasaban al mensaje. El resto era andamiaje o contenido fabricado por el modelo.
- Frente a correos APWG clasificados como spear phishing, las evaluaciones automáticas mostraron personalización de 8,6% versus aproximadamente 85–90%, naturalidad lingüística de 51,0% versus cerca de 100% y persuasión de 32,7% versus más de 90%.
- En el estudio humano, la sospecha media de mensajes maliciosos fue 2,75 para LLM y 4,44 para APWG, `H = 27,22`, `p < 10^-6`. Los controles benignos no difirieron significativamente: 3,11 versus 2,83, `H = 0,68`, `p = 0,41`.
- La brecha de discriminación por sospecha fue −0,36 en la condición LLM y 1,61 en APWG (`H = 26,22`, `p < 10^-6`). Es una medida de percepción, no una tasa de clic o compromiso real.
- Un clasificador RoBERTa de prompts obtuvo 98,13% de exactitud, 100% de precisión, 96% de recall y F1 de 97,95% en 375 casos de prueba; además detectó 175/175 prompts generados para explorar cambio de distribución dentro del alcance diseñado.
- El costo estimado de generación fue de USD 0,002–0,004 por correo bajo precios declarados; es una estimación dependiente de modelo, fecha y supuestos.

# 5. Limitations stated by authors

Los autores señalan que los datos proceden solo de un año de Instagram público; otras plataformas y ventanas pueden contener señales distintas. También reconocen que el clasificador defensivo es una fotografía estática que requerirá reentrenamiento continuo ante nuevas tácticas. Adicionalmente, por el propio diseño: el estudio humano es pequeño, estadounidense y en línea; usa capturas sin enlaces ni identificadores y mide percepción/juicio, no apertura, clic, entrega, compromiso o daño real. La comparación APWG y la anotación asistida por LLM pueden reflejar diferencias de corpus. Como preprint v1, los resultados requieren replicación y revisión independiente.

# 6. What this source supports

- La factibilidad técnica de automatizar mensajes contextuales a partir de pocas señales públicas.
- Que los modelos pueden combinar pistas reales con inferencias y fabricaciones plausibles para aumentar personalización percibida.
- Que, en este experimento, los mensajes LLM fueron menos sospechosos y mejor valorados que el corpus APWG seleccionado.
- Que la huella digital es evidencia disponible para construir una representación funcional explotable, no una identidad total.
- Que defensas centradas únicamente en errores de redacción o apariencia genérica pueden ser insuficientes.

# 7. What this source DOES NOT support

- No demuestra una tasa real de clic, entrega, infección, pérdida o brecha causada por los mensajes generados.
- No prueba que todo LLM, canal, idioma, cultura, sector o población produzca el mismo efecto.
- No establece que 10 posts sean siempre suficientes ni que todos los datos inferidos sean verdaderos.
- No valida las nueve Attention Doors ni identifica causalmente qué puerta produjo cada valoración.
- No demuestra que el clasificador mantenga 98,13% en producción o frente a adversarios futuros.
- No prueba la eficacia de Digital Self, PARA, FARO ni un programa formativo.
- No debe presentarse como evidencia revisada por pares mientras conserve estatus de preprint.

# 8. Connections to Attention Doors / Theoretical Lenses

- `DOOR-001` Identidad: nombres, estilo e intereses pueden usarse para construir mensajes que “parecen para mí”.
- `DOOR-002` Curiosidad: baiting e intereses personalizados pueden elevar prioridad; el artículo no mide la puerta como constructo.
- `DOOR-005` Coherencia: contexto y naturalidad pueden reducir discrepancias percibidas.
- `DOOR-006` Pertenencia: relaciones y afiliaciones son una dimensión explícita de personalización.
- `DOOR-007` Protección y `DOOR-008` Pérdida aparecen en scareware y explotación emocional.
- `THEORY-SDT` permite distinguir sensibilidad y criterio, pero el estudio usa una brecha de sospecha, no una estimación completa de señal-detección.
- `THEORY-TRUST-AUTO` y `THEORY-JUDGE-ADVISOR` son pertinentes para defensas asistidas por IA, aunque el estudio no evalúa confianza o toma de consejo del usuario.

# 9. Candidate claims proposed

## CAND-VAFA-001

- **Statement:** En un pipeline experimental con 200 perfiles públicos, cinco LLM generaron 17.916 correos contextuales y transfirieron habitualmente 1–2 pistas específicas del usuario a relatos con numerosas entidades adicionales fabricadas.
- **Proposed epistemic status:** supported
- **Proposed confidence:** medium
- **Scope:** Instagram público, modelos y prompts del estudio; preprint v1.
- **Promotion target:** `claims_genai_social_engineering.md`

## CAND-VAFA-002

- **Statement:** En el estudio con 70 participantes, los correos LLM seleccionados recibieron menor sospecha media que los correos APWG seleccionados (2,75 vs. 4,44).
- **Proposed epistemic status:** supported
- **Proposed confidence:** medium
- **Scope:** percepción en capturas estáticas; no conducta real de clic.
- **Promotion target:** `claims_genai_social_engineering.md`

## CAND-VAFA-003

- **Statement:** La evidencia pública puede bastar para anclar una representación funcional persuasiva aunque gran parte del contenido generado sea inferido o falso.
- **Proposed epistemic status:** supported
- **Proposed confidence:** medium
- **Scope:** mecanismo demostrado en la canalización; requiere replicación externa.
- **Promotion target:** `claims_genai_social_engineering.md`

## CAND-VAFA-004

- **Statement:** Las métricas de calidad y sospecha no deben comunicarse como tasas de victimización o eficacia operacional del ataque.
- **Proposed epistemic status:** established
- **Proposed confidence:** high
- **Scope:** límite inferencial del diseño.
- **Promotion target:** `claims_genai_social_engineering.md`
