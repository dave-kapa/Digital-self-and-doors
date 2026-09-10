/**
 * build_bibliography.js
 * Compila automáticamente /v3/brain/01_research_and_lenses/BIBLIOGRAPHY_MASTER.md
 * a partir de las Source Notes en /v3/brain/01_research_and_lenses/sources/SRC-*.md
 * usando js-yaml formal.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const sourcesDir = path.join(__dirname, '../brain/01_research_and_lenses/sources');
const bibMasterPath = path.join(__dirname, '../brain/01_research_and_lenses/BIBLIOGRAPHY_MASTER.md');

function getSources() {
    if (!fs.existsSync(sourcesDir)) return [];
    const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-'));
    return files.map(f => {
        const content = fs.readFileSync(path.join(sourcesDir, f), 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const data = { file: f };
        if (match) {
            try {
                const parsed = yaml.load(match[1]);
                if (parsed && typeof parsed === 'object') {
                    Object.assign(data, parsed);
                }
            } catch (e) {}
        }
        return data;
    });
}

const sources = getSources();
sources.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

let md = '# BIBLIOGRAFÍA CIENTÍFICA MAESTRA (BIBLIOGRAPHY MASTER)\n';
md += '## Digital Self & Attention Doors — Vista Compilada Derivada\n\n';
md += '> **Nota:** Este archivo es generado automáticamente por `scripts/build_bibliography.js`. No editar manualmente.\n\n';
md += '### Cuadro Resumen de Fuentes Científicas\n\n';
md += '| ID | Año | Autores | Título | Tipo de Fuente | Estado Lectura | Archivo Fuente |\n';
md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

if (sources.length === 0) {
    md += '| *Sin fuentes registradas aún* | - | - | - | - | - | - |\n';
} else {
    sources.forEach(s => {
        let authorsStr = 'Sin autor declarado';
        if (Array.isArray(s.authors)) {
            authorsStr = s.authors.join('; ');
        } else if (s.author) {
            authorsStr = s.author;
        } else if (s.authors) {
            authorsStr = String(s.authors);
        }

        const yearStr = s.year ? String(s.year) : 'No declarado';
        const titleStr = s.title ? s.title.replace(/\|/g, '\\|') : 'Sin título';
        const typeStr = s.source_type ? s.source_type : 'source';
        const readStr = s.reading_status ? s.reading_status : 'discovered';

        md += '| `' + (s.id || s.file) + '` | ' + yearStr + ' | ' + authorsStr + ' | ' + titleStr + ' | `' + typeStr + '` | `' + readStr + '` | [Ficha](sources/' + s.file + ') |\n';
    });
}

const isCheckMode = process.argv.includes('--check');

if (isCheckMode) {
    if (fs.existsSync(bibMasterPath)) {
        const existing = fs.readFileSync(bibMasterPath, 'utf8');
        // Normalizar saltos de línea para comparación robusta
        if (existing.replace(/\r\n/g, '\n') !== md.replace(/\r\n/g, '\n')) {
            console.error('[DRIFT] BIBLIOGRAPHY_MASTER.md está desactualizado respecto a las Source Notes.');
            process.exit(1);
        } else {
            console.log('BIBLIOGRAPHY_MASTER.md verificado sin drift (PASS --check). ' + sources.length + ' fuentes.');
        }
    } else {
        console.error('[DRIFT] BIBLIOGRAPHY_MASTER.md no existe. Ejecuta npm run build:bib');
        process.exit(1);
    }
} else {
    fs.writeFileSync(bibMasterPath, md, 'utf8');
    console.log('BIBLIOGRAPHY_MASTER.md compilado exitosamente con ' + sources.length + ' fuentes.');
}

