/**
 * build_mocs.js
 * Genera y actualiza determinísticamente las tablas de inventario
 * en los archivos README.md de cada una de las capas de /v3/brain/
 * a partir de la fuente de verdad estructurada (registry.json).
 */
const fs = require('fs');
const path = require('path');
const { normalizeEol } = require('./lib/text_normalizer');

const brainDir = path.join(__dirname, '../brain');
const registryPath = path.join(brainDir, '00_meta_and_governance/registry.json');

if (!fs.existsSync(registryPath)) {
    console.error('ERROR: registry.json no existe. Ejecuta npm run build:registry primero.');
    process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const layers = [
    '00_meta_and_governance',
    '01_research_and_lenses',
    '02_framework_canon',
    '03_methodology_and_learning',
    '04_product_system',
    '05_products_catalog',
    '06_evidence_and_validation',
    '07_commercial_and_gotomarket'
];

let hasDrift = false;
const isCheckMode = process.argv.includes('--check');

layers.forEach(layer => {
    const readmePath = path.join(brainDir, layer, 'README.md');
    if (!fs.existsSync(readmePath)) return;

    let content = fs.readFileSync(readmePath, 'utf8');
    const layerEntries = Object.values(registry).filter(e => e.path.startsWith(layer));

    let table = '| ID | Título | Tipo | Estatus | Archivo |\n| :--- | :--- | :--- | :--- | :--- |\n';
    if (layerEntries.length === 0) {
        table += '| *En proceso de catalogación* | - | - | - | - |\n';
    } else {
        layerEntries.sort((a, b) => a.id.localeCompare(b.id)).forEach(e => {
            const relToFile = path.relative(path.join(brainDir, layer), path.join(brainDir, e.path)).replace(/\\/g, '/');
            table += '| `' + e.id + '` | ' + e.title + ' | `' + e.type + '` | `' + e.status + '` | [Abrir](' + relToFile + ') |\n';
        });
    }

    const regex = /<!-- AUTO-GENERATED:START -->[\s\S]*?<!-- AUTO-GENERATED:END -->/;
    if (regex.test(content)) {
        const expectedSection = '<!-- AUTO-GENERATED:START -->\n' + table + '<!-- AUTO-GENERATED:END -->';
        const currentMatch = content.match(regex)[0];

        if (normalizeEol(currentMatch) !== normalizeEol(expectedSection)) {
            hasDrift = true;
            if (isCheckMode) {
                console.warn('[DRIFT] ' + layer + '/README.md desactualizado respecto a registry.json');
            } else {
                content = content.replace(regex, expectedSection);
                fs.writeFileSync(readmePath, content, 'utf8');
                console.log('MOC actualizado: ' + layer + ' (' + layerEntries.length + ' entradas)');
            }
        }
    }
});

if (isCheckMode && hasDrift) {
    console.error('ERROR: Se detectó drift en los MOCs. Ejecuta npm run build:mocs');
    process.exit(1);
} else if (!hasDrift) {
    console.log('Todos los MOCs están sincronizados con registry.json (PASS).');
}
