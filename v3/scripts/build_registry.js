/**
 * build_registry.js
 * Escanea todos los archivos .md en /v3/brain/, extrae metadatos frontmatter YAML
 * y genera el archivo /v3/brain/00_meta_and_governance/registry.json con el mapa ID -> path.
 * Detecta y reporta colisiones de IDs (D001).
 */
const fs = require('fs');
const path = require('path');

const brainDir = path.join(__dirname, '../brain');
const registryPath = path.join(brainDir, '00_meta_and_governance/registry.json');

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;
    const lines = match[1].split(/\r?\n/);
    const data = {};
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
            if (key && !key.startsWith('#')) {
                data[key] = val;
            }
        }
    });
    return data;
}

function scanDir(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            scanDir(full, results);
        } else if (e.isFile() && e.name.endsWith('.md')) {
            results.push(full);
        }
    }
    return results;
}

const files = scanDir(brainDir);
const registry = {};
const duplicates = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const meta = parseFrontmatter(content);
    if (meta && meta.id) {
        const relPath = path.relative(brainDir, file).replace(/\\/g, '/');
        if (registry[meta.id]) {
            duplicates.push({ id: meta.id, file1: registry[meta.id].path, file2: relPath });
        } else {
            registry[meta.id] = {
                id: meta.id,
                title: meta.title || '',
                type: meta.type || 'unknown',
                status: meta.status || 'draft',
                epistemic_status: meta.epistemic_status || 'not_applicable',
                path: relPath
            };
        }
    }
});

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
console.log('Registry generado exitosamente con ' + Object.keys(registry).length + ' entradas.');

if (duplicates.length > 0) {
    console.error('ERROR D001: IDs duplicados encontrados:');
    duplicates.forEach(d => console.error(' - ID: ' + d.id + ' en ' + d.file1 + ' y ' + d.file2));
    process.exit(1);
} else {
    console.log('0 colisiones de IDs detectadas (PASS D001).');
}
