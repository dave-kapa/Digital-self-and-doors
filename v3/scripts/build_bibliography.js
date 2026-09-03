/**
 * build_bibliography.js
 * Compila automáticamente /v3/brain/01_research_and_lenses/BIBLIOGRAPHY_MASTER.md
 * a partir de las Source Notes atómicas en /v3/brain/01_research_and_lenses/sources/SRC-XXXX.md.
 */
const fs = require('fs');
const path = require('path');

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
            match[1].split(/\r?\n/).forEach(line => {
                const idx = line.indexOf(':');
                if (idx !== -1) {
                    const k = line.slice(0, idx).trim();
                    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
                    data[k] = v;
                }
            });
        }
        return data;
    });
}

const sources = getSources();

let md = '# BIBLIOGRAFÍA CIENTÍFICA MAESTRA (BIBLIOGRAPHY MASTER)\n';
md += '## Digital Self & Attention Doors — Vista Compilada\n\n';
md += '> **Nota:** Este archivo es generado automáticamente por `scripts/build_bibliography.js`. No editar manualmente.\n\n';
md += '### Cuadro Resumen de Fuentes Científicas\n\n';
md += '| ID | Año | Autores | Título | Tipo | Estado Lectura | Archivo Fuente |\n';
md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

if (sources.length === 0) {
    md += '| *Sin fuentes registradas aún* | - | - | - | - | - | - |\n';
} else {
    sources.forEach(s => {
        md += '| `' + (s.id || s.file) + '` | ' + (s.year || '-') + ' | ' + (s.authors || '-') + ' | ' + (s.title || '-') + ' | ' + (s.source_type || '-') + ' | ' + (s.reading_status || 'inbox') + ' | [Ficha](sources/' + s.file + ') |\n';
    });
}

fs.writeFileSync(bibMasterPath, md, 'utf8');
console.log('BIBLIOGRAPHY_MASTER.md compilado con éxito (' + sources.length + ' fuentes).');
