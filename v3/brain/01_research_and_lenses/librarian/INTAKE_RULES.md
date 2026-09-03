# REGLAS DE ADMISIÓN Y LICENCIAMIENTO
## Criterios de Ingesta para la Biblioteca Científica

1. **Formatos Admitidos:** PDF, EPUB, TXT, HTML completo.
2. **Políticas de Almacenamiento:**
   * Papers Open Access (<10MB): Almacenar en `/v3/research_library/academic_articles/` y versionar en Git.
   * Papers protegidos o pesados (>10MB): Almacenar localmente en `/v3/research_library/`, excluir de Git mediante `.gitignore` y registrar DOI/URL en la Source Note.
3. **Nomenclatura Estricta:**
   ```text
   SRC-ID__primerautor-año__titulo-corto.pdf
   ```
   Ejemplo: `SRC-VAFA-2026__vafa-2026__context-aware-spear-phishing.pdf`
