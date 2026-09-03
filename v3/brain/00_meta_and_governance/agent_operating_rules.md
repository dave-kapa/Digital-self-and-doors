# REGLAS DE OPERACIÓN PARA AGENTES DE IA
## Código de Conducta de Antigravity, ChatGPT y Asistentes

> **Versión:** 1.0.0-CANONICAL  
> **Ámbito de Aplicación:** Todos los agentes que leen, auditan o editan el Cerebro de Conocimiento.

---

### Regla 1 — INDEX First (Navegación Jerárquica)
Ante cualquier consulta conceptual, metodológica o de implementación, el agente debe:
1. Consultar `/v3/brain/INDEX.md` para ubicar la capa correspondiente.
2. Acceder al `README.md` del módulo para localizar el archivo atómico exacto.
3. Cargar en memoria únicamente el documento necesario.

### Regla 2 — Scope Activo Estricto
El espacio de búsqueda por defecto de cualquier agente en tareas cotidianas de diseño, programación o venta es **exclusivamente**:
```text
/v3/brain/
```
Queda terminantemente prohibido buscar en directorios históricos raíz (`insumos/`, `docs/`, `backups/`) salvo orden explícita del usuario.

### Regla 3 — Archive Firewall (Barrera contra Contaminación Histórica)
El directorio:
```text
/v3/brain/99_archive_and_history/
```
alberga fuentes crudas y versiones superadas. Ningún agente puede consultar este directorio a menos que la petición del usuario incluya explícitamente palabras como: *"histórico"*, *"conversación original"*, *"borrador previo"*, *"MIRA"* o *"versión vieja"*.

### Regla 4 — Research Library Firewall (Barrera contra Binarios)
El directorio:
```text
/v3/research_library/
```
alberga PDFs y archivos binarios pesados. Los agentes no deben escanear ni leer estos archivos en operaciones cotidianas; deben consultar las Source Notes estructuradas en:
```text
/v3/brain/01_research_and_lenses/sources/SRC-XXXX.md
```

### Regla 5 — La Regla de "Si no está en el cerebro, no inventar"
Si el cerebro no cuenta con un documento canónico o un claim respaldado para sostener una afirmación, el agente debe declarar explícitamente:
> *"No encuentro una afirmación canónica o claim en el cerebro que permita sostener esto."*
El agente puede proponer una hipótesis o recomendar investigación, pero jamás rellenar el vacío inventando certezas.

### Regla 6 — Ningún Agente Promueve a Canon
Ningún agente de IA puede asignar de manera autónoma `status: canonical` a un documento. Todo documento nuevo nace como `status: working` o `status: review`. La promoción a Canon exige validación y aprobación humana explícita.

### Regla 7 — Commercial Gate
Ningún agente puede redactar material comercial que utilice estadísticas, cifras o promesas de efectividad que no estén formalmente autorizadas en:
```text
/v3/brain/07_commercial_and_gotomarket/evidence_for_sales.md
```
y con `allowed_uses: commercial`.
