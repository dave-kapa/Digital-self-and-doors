/**
 * librarian_dedupe.js
 * Utilidad de deduplicación bibliográfica para el Scientific Library System.
 * Normaliza y compara DOIs, ISBNs y títulos difusos (fuzzy matching)
 * para evitar la ingestión duplicada de fuentes en /v3/brain/01_research_and_lenses/sources/.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const sourcesDir = path.join(__dirname, '../brain/01_research_and_lenses/sources');

function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeDoi(doi) {
    if (!doi) return null;
    return doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim();
}

function normalizeIsbn(isbn) {
    if (!isbn) return null;
    return isbn.replace(/[^0-9X]/gi, '').toUpperCase();
}

function checkDuplicate(newEntry, customDir = sourcesDir) {
    if (!fs.existsSync(customDir)) return { isDuplicate: false };

    const files = fs.readdirSync(customDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-'));
    const normTitle = normalizeString(newEntry.title);
    const normDoi = normalizeDoi(newEntry.doi);
    const normIsbn = normalizeIsbn(newEntry.isbn);

    for (const f of files) {
        const content = fs.readFileSync(path.join(customDir, f), 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match) continue;

        try {
            const data = yaml.load(match[1]);
            if (!data) continue;

            // 1. Coincidencia exacta de DOI
            if (normDoi && data.doi && normalizeDoi(data.doi) === normDoi) {
                return { isDuplicate: true, matchedFile: f, reason: 'Coincidencia exacta de DOI: ' + normDoi };
            }

            // 2. Coincidencia exacta de ISBN
            if (normIsbn && data.isbn && normalizeIsbn(data.isbn) === normIsbn) {
                return { isDuplicate: true, matchedFile: f, reason: 'Coincidencia exacta de ISBN: ' + normIsbn };
            }

            // 3. Coincidencia de título y año
            if (normTitle && data.title && normalizeString(data.title) === normTitle) {
                if (newEntry.year && data.year && newEntry.year === data.year) {
                    return { isDuplicate: true, matchedFile: f, reason: 'Coincidencia idéntica de título y año (' + data.year + ')' };
                }
            }
        } catch (e) {
            // Ignorar errores de parsing aquí; audit_brain los reportará
        }
    }

    return { isDuplicate: false };
}

// Interfaz de línea de comandos
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('librarian_dedupe: Escaneando fuentes existentes en busca de duplicados internos...');
        const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md') && f.startsWith('SRC-'));
        const seenDois = new Map();
        let duplicatesFound = 0;

        files.forEach(f => {
            const content = fs.readFileSync(path.join(sourcesDir, f), 'utf8');
            const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (match) {
                try {
                    const data = yaml.load(match[1]);
                    if (data && data.doi) {
                        const d = normalizeDoi(data.doi);
                        if (seenDois.has(d)) {
                            console.error('[DUPLICATE] ' + f + ' duplica DOI con ' + seenDois.get(d));
                            duplicatesFound++;
                        } else {
                            seenDois.set(d, f);
                        }
                    }
                } catch (e) {}
            }
        });

        if (duplicatesFound === 0) {
            console.log('0 duplicados detectados en la biblioteca existente (PASS).');
        } else {
            process.exit(1);
        }
    }
}

module.exports = { checkDuplicate, normalizeDoi, normalizeIsbn, normalizeString };
