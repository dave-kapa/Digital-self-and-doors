/**
 * test_librarian_dedupe.js
 * Suite de pruebas unitarias y determinísticas para librarian_dedupe.js (R6).
 * Valida:
 *  1. Detección de duplicado por DOI (normalizando URLs/prefijos)
 *  2. Detección de duplicado por ISBN (normalizando guiones/espacios)
 *  3. Detección de duplicado por Título normalizado + Año
 *  4. Caso limpio de no-colisión
 *  5. Integridad de 0 duplicados en la biblioteca existente
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { checkDuplicate, normalizeDoi, normalizeIsbn, normalizeString } = require('../scripts/librarian_dedupe');

console.log('=== SUITE DE PRUEBAS DE DEDUPLICACIÓN BIBLIOGRÁFICA (LIB004) ===');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('[PASS] ' + message);
        passed++;
    } else {
        console.error('[FAIL] ' + message);
        failed++;
    }
}

// 1. Normalizadores
assert(normalizeDoi('https://doi.org/10.1037/0022-3514.92.5.843') === '10.1037/0022-3514.92.5.843', 'normalizeDoi extrae prefijo https://doi.org/');
assert(normalizeDoi('http://dx.doi.org/10.1000/182') === '10.1000/182', 'normalizeDoi extrae prefijo dx.doi.org');
assert(normalizeIsbn('978-0-374-27563-1') === '9780374275631', 'normalizeIsbn elimina guiones');
assert(normalizeString('Thinking, Fast and Slow!') === 'thinkingfastandslow', 'normalizeString normaliza caracteres alfanuméricos');

// Fixture temporal en os.tmpdir() para garantizar aislamiento total en checkouts de solo lectura
const tempFixtureDir = path.join(os.tmpdir(), 'dedupe_test_' + Date.now() + '_' + Math.random().toString(36).slice(2));
if (!fs.existsSync(tempFixtureDir)) fs.mkdirSync(tempFixtureDir, { recursive: true });

const seedSource = `---
id: "SRC-SEED-2011"
title: "Thinking, Fast and Slow"
year: 2011
isbn: "978-0374275631"
doi: "10.1000/kahneman2011"
---
# Seed Note
`;
fs.writeFileSync(path.join(tempFixtureDir, 'SRC-SEED-2011.md'), seedSource, 'utf8');

// 2. Colisión por DOI
const resDoi = checkDuplicate({
    title: "Another Title",
    doi: "https://doi.org/10.1000/kahneman2011"
}, tempFixtureDir);
assert(resDoi.isDuplicate && resDoi.reason.includes('DOI'), 'Detecta colisión exacta por DOI con URL canónica');

// 3. Colisión por ISBN
const resIsbn = checkDuplicate({
    title: "Different Title",
    isbn: "978-0-374-27563-1"
}, tempFixtureDir);
assert(resIsbn.isDuplicate && resIsbn.reason.includes('ISBN'), 'Detecta colisión exacta por ISBN con guiones');

// 4. Colisión por Título y Año
const resTitleYear = checkDuplicate({
    title: "thinking, fast and slow...",
    year: 2011
}, tempFixtureDir);
assert(resTitleYear.isDuplicate && resTitleYear.reason.includes('título y año'), 'Detecta colisión por título difuso normalizado y mismo año');

// 5. Caso de no-colisión
const resClean = checkDuplicate({
    title: "Completely Unique Scientific Work",
    year: 2024,
    doi: "10.1000/unique.2024",
    isbn: "978-1234567890"
}, tempFixtureDir);
assert(!resClean.isDuplicate, 'Permite inserción de obra única sin colisión');

// Limpiar fixture temporal
fs.rmSync(tempFixtureDir, { recursive: true, force: true });

// 6. Verificación en la biblioteca real
const realSourcesDir = path.join(__dirname, '../brain/01_research_and_lenses/sources');
const realFiles = fs.readdirSync(realSourcesDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-'));
const realDois = new Set();
let realCollisions = 0;

realFiles.forEach(f => {
    const c = fs.readFileSync(path.join(realSourcesDir, f), 'utf8');
    const m = c.match(/doi:\s*["']?([^"'\r\n]+)/);
    if (m) {
        const d = normalizeDoi(m[1]);
        if (realDois.has(d)) realCollisions++;
        realDois.add(d);
    }
});
assert(realCollisions === 0, '0 colisiones internas en los ' + realFiles.length + ' archivos de sources/ reales');

console.log('----------------------------------------------------------------');
console.log('Resultado: ' + passed + ' PASS, ' + failed + ' FAIL.');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('SUITE DE DEDUPLICACIÓN 100% PASS.');
}
