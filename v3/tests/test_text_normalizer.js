/**
 * test_text_normalizer.js
 * Suite automatizada para verificar el contrato de normalización de integridad textual
 * y cómputo de hashes canónicos (Fase 3).
 *
 * Casos de prueba:
 *  1. Equivalencia estricta: Mismo texto UTF-8 con LF (\n) y CRLF (\r\n) produce IDÉNTICO hash canónico.
 *  2. Detección de mutación de caracteres: Cualquier cambio no-EOL produce hash DIFERENTE.
 *  3. Detección de espacios: Espacios añadidos o eliminados dentro de una línea producen hash DIFERENTE.
 *  4. Detección de líneas adicionales: Una línea extra al final o intermedia produce hash DIFERENTE.
 *  5. Detección de retorno CR aislado: Un \r aislado sin \n se preserva y produce hash DIFERENTE.
 *  6. Archivos binarios / PDFs: Verificación de que rawByteHash opera sobre bytes crudos sin normalización.
 *  7. Comprobación con archivos temporales en os.tmpdir() (aislamiento total, sin tocar notas reales).
 *  8. Comportamiento fail-closed ante errores de lectura o tipos inválidos.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { normalizeEol, canonicalTextHash, canonicalFileHash, rawByteHash } = require('../scripts/lib/text_normalizer');

console.log('=== SUITE DE PRUEBAS: NORMALIZACIÓN DE INTEGRIDAD TEXTUAL (Fase 3) ===');

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

// 1. Equivalencia LF vs CRLF
const baseTextLf = 'line 1: scientific claim statement\nline 2: evidence reference REF-001\nline 3: status active\n';
const baseTextCrlf = 'line 1: scientific claim statement\r\nline 2: evidence reference REF-001\r\nline 3: status active\r\n';
const hashLf = canonicalTextHash(baseTextLf);
const hashCrlf = canonicalTextHash(baseTextCrlf);
assert(hashLf === hashCrlf, 'Mismo texto UTF-8 con LF y CRLF produce el mismo hash canónico');

// 2. Mutación de caracteres no-EOL
const textMutatedChar = 'line 1: Scientific claim statement\nline 2: evidence reference REF-001\nline 3: status active\n';
assert(canonicalTextHash(textMutatedChar) !== hashLf, 'Cualquier cambio de carácter produce hash canónico diferente');

// 3. Espacios añadidos o eliminados
const textExtraSpace = 'line 1: scientific  claim statement\nline 2: evidence reference REF-001\nline 3: status active\n';
const textLeadingSpace = ' line 1: scientific claim statement\nline 2: evidence reference REF-001\nline 3: status active\n';
const textTrailingSpace = 'line 1: scientific claim statement \nline 2: evidence reference REF-001\nline 3: status active\n';
assert(canonicalTextHash(textExtraSpace) !== hashLf, 'Espacio extra dentro de línea produce hash diferente');
assert(canonicalTextHash(textLeadingSpace) !== hashLf, 'Espacio al inicio de línea produce hash diferente');
assert(canonicalTextHash(textTrailingSpace) !== hashLf, 'Espacio al final de línea produce hash diferente');

// 4. Línea adicional
const textExtraLine = 'line 1: scientific claim statement\nline 2: evidence reference REF-001\nline 3: status active\nline 4: unauthorized extra\n';
assert(canonicalTextHash(textExtraLine) !== hashLf, 'Línea adicional produce hash diferente');

// 5. Retorno CR aislado (\r sin \n)
const textIsolatedCr = 'line 1: scientific claim statement\rline 2: evidence reference REF-001\nline 3: status active\n';
assert(canonicalTextHash(textIsolatedCr) !== hashLf, 'Retorno CR aislado produce hash diferente (no se convierte a LF)');
assert(normalizeEol(textIsolatedCr).includes('\r'), 'normalizeEol preserva el retorno CR aislado para detección fail-closed');

// 6. Prueba con archivos temporales en os.tmpdir()
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test_norm_'));
const fileLf = path.join(tempDir, 'sample_lf.md');
const fileCrlf = path.join(tempDir, 'sample_crlf.md');
const fileMutated = path.join(tempDir, 'sample_mutated.md');

fs.writeFileSync(fileLf, baseTextLf, 'utf8');
fs.writeFileSync(fileCrlf, baseTextCrlf, 'utf8');
fs.writeFileSync(fileMutated, textMutatedChar, 'utf8');

const fileHashLf = canonicalFileHash(fileLf);
const fileHashCrlf = canonicalFileHash(fileCrlf);
const fileHashMutated = canonicalFileHash(fileMutated);

assert(fileHashLf === fileHashCrlf, 'canonicalFileHash de archivos en disco con LF y CRLF es estrictamente idéntico');
assert(fileHashMutated !== fileHashLf, 'canonicalFileHash detecta alteración de archivo en disco');

// 7. Archivos binarios / PDFs usan rawByteHash sin normalización
const binaryBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x0D, 0x0A, 0x31, 0x2E, 0x35]); // %PDF-\r\n1.5
const binaryModified = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x0A, 0x31, 0x2E, 0x35]);   // %PDF-\n1.5 (bytes diferentes)
const rawHash1 = rawByteHash(binaryBuf);
const rawHash2 = rawByteHash(binaryModified);
assert(rawHash1 !== rawHash2, 'rawByteHash distingue diferencias binarias exactas sin normalizar CRLF/LF');

// Limpieza de directorio temporal
fs.rmSync(tempDir, { recursive: true, force: true });

// 8. Fail-closed ante tipos inválidos y archivos inexistentes
let typeErrorThrown = false;
try {
    normalizeEol(12345);
} catch (e) {
    typeErrorThrown = true;
}
assert(typeErrorThrown, 'normalizeEol lanza TypeError ante entrada no-string (fail-closed)');

let fileErrorThrown = false;
try {
    canonicalFileHash(path.join(tempDir, 'non_existent_file.md'));
} catch (e) {
    fileErrorThrown = true;
}
assert(fileErrorThrown, 'canonicalFileHash lanza Error ante archivo inexistente (fail-closed)');

console.log('----------------------------------------------------------------------');
console.log('Resultado de Suite de Normalización: ' + passed + ' PASS, ' + failed + ' FAIL.');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('SUITE DE NORMALIZACIÓN 100% PASS: Todos los contratos de integridad textual verificados.');
}
