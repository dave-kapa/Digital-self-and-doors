/**
 * text_normalizer.js
 * Módulo centralizado para normalización de integridad textual y cálculo
 * de hashes canónicos frente a variaciones de salto de línea (CRLF vs LF).
 *
 * Contrato de Portabilidad Canónica:
 *  - Mismo texto UTF-8 con LF (\n) y CRLF (\r\n) produce idéntico hash canónico.
 *  - Cualquier modificación de carácter, espacio o línea adicional produce hash diferente.
 *  - Retornos de carro aislados (\r) se preservan intactos, alterando el hash canónico (fail-closed).
 *  - Archivos binarios (PDFs) NO se someten a normalización textual; se computan como raw-byte.
 */
const crypto = require('crypto');
const fs = require('fs');

function normalizeEol(text) {
    if (typeof text !== 'string') {
        throw new TypeError('normalizeEol espera una cadena UTF-8');
    }
    // Normaliza exclusivamente secuencias CRLF (\r\n) a LF (\n).
    // Si existen retornos \r aislados, se conservan deliberadamente
    // para que la integridad textual los distinga como mutaciones.
    return text.replace(/\r\n/g, '\n');
}

function canonicalTextHash(text) {
    const normalized = normalizeEol(text);
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function canonicalFileHash(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error('Archivo no encontrado para hash canónico: ' + filePath);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return canonicalTextHash(content);
}

function rawByteHash(filePathOrBuffer) {
    const buf = Buffer.isBuffer(filePathOrBuffer)
        ? filePathOrBuffer
        : fs.readFileSync(filePathOrBuffer);
    return crypto.createHash('sha256').update(buf).digest('hex');
}

module.exports = {
    normalizeEol,
    canonicalTextHash,
    canonicalFileHash,
    rawByteHash
};
