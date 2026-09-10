/**
 * build_registry.js
 * Escanea todos los archivos .md en /v3/brain/, extrae metadatos frontmatter
 * usando js-yaml formal y genera registry.json.
 * Ignora la capa 99_archive_and_history para preservar el firewall histórico.
 * Detecta y reporta colisiones de IDs (D001).
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { normalizeEol } = require('./lib/text_normalizer');

const brainDir = path.join(__dirname, '../brain');
const registryPath = path.join(brainDir, '00_meta_and_governance/registry.json');

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;
    try {
        return yaml.load(match[1]);
    } catch (e) {
        return null;
    }
}

function scanDir(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = path.relative(brainDir, full).replace(/\\/g, '/');
        
        // Firewall: No indexar en el registro activo el archivo histórico
        if (rel.startsWith('99_archive_and_history')) continue;

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

const isCheckMode = process.argv.includes('--check');
const formattedRegistry = JSON.stringify(registry, null, 2) + '\n';

if (isCheckMode) {
    if (fs.existsSync(registryPath)) {
        const existing = fs.readFileSync(registryPath, 'utf8');
        if (normalizeEol(existing) !== normalizeEol(formattedRegistry)) {
            console.error('[DRIFT] registry.json está desactualizado respecto al contenido Markdown del Cerebro.');
            process.exit(1);
        } else {
            console.log('Registry verificado sin drift respecto a Markdown (PASS --check). ' + Object.keys(registry).length + ' entradas activas.');
        }
    } else {
        console.error('[DRIFT] registry.json no existe. Ejecuta npm run build:registry');
        process.exit(1);
    }
} else {
    fs.writeFileSync(registryPath, formattedRegistry, 'utf8');
    console.log('Registry generado exitosamente con ' + Object.keys(registry).length + ' entradas activas.');
}

if (duplicates.length > 0) {
    console.error('ERROR D001: IDs duplicados encontrados:');
    duplicates.forEach(d => console.error(' - ID: ' + d.id + ' en ' + d.file1 + ' y ' + d.file2));
    process.exit(1);
} else {
    console.log('0 colisiones de IDs detectadas (PASS D001).');
}

