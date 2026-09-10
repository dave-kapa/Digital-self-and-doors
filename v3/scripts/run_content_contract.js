/**
 * run_content_contract.js
 * Runner ejecutable del Contrato Determinístico de Contenido del Cerebro V3.
 * Evalúa las aserciones canónicas definidas en /v3/tests/brain_semantic_regression.yaml
 * contra los documentos físicos en /v3/brain/ y emite un log verificable y reproducible.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const brainDir = path.join(__dirname, '../brain');
const suitePath = path.join(__dirname, '../tests/brain_semantic_regression.yaml');

if (!fs.existsSync(suitePath)) {
    console.error('ERROR: No se encontró brain_semantic_regression.yaml');
    process.exit(1);
}

const suite = yaml.load(fs.readFileSync(suitePath, 'utf8'));
let gitCommit = 'UNKNOWN';
let gitStatus = 'UNKNOWN';

try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const status = execSync('git status -s').toString().trim();
    gitStatus = status ? 'DIRTY (archivos modificados sin commit)' : 'CLEAN';
} catch (e) {
    gitStatus = 'UNKNOWN (entorno sin git)';
}

console.log('=== EJECUTANDO CONTRATO DETERMINÍSTICO DE CONTENIDO (L3) ===');
console.log('Fecha: ' + new Date().toISOString());
console.log('Git Commit: ' + gitCommit + ' [' + gitStatus + ']');
console.log('Aserciones a evaluar: ' + suite.tests.length);
console.log('---------------------------------------------------------');

let passed = 0;
let failed = 0;

const assertions = {
    "KR-001": () => {
        const dec003 = fs.readFileSync(path.join(brainDir, '00_meta_and_governance/decision_log/DEC-003_exclusion_jerarquia_validacion.md'), 'utf8');
        return dec003.includes('Jerarquía y Validación no forman parte del catálogo canónico de Attention Doors');
    },
    "KR-002": () => {
        const thesis = fs.readFileSync(path.join(brainDir, '02_framework_canon/thesis.md'), 'utf8');
        const gaps = fs.readFileSync(path.join(brainDir, '01_research_and_lenses/librarian/RESEARCH_GAPS.md'), 'utf8');
        return thesis.includes('epistemic_status: "provisional"') && gaps.includes('GAP-DOORS-001');
    },
    "KR-003": () => {
        const webEvid = fs.readFileSync(path.join(brainDir, '06_evidence_and_validation/product_evidence/webinar_v1_evidence.md'), 'utf8');
        return webEvid.includes('No probado') && webEvid.includes('No existe evidencia disponible de reducción de incidentes, cambio conductual sostenido');
    },
    "KR-004": () => {
        const gameSpec = fs.readFileSync(path.join(brainDir, '04_product_system/reusable_components/games/faro_v3plus/GAME_SPEC.md'), 'utf8');
        return gameSpec.includes('motor de simulación interactiva') || gameSpec.includes('operacionaliza');
    },
    "KR-005": () => {
        const dec008 = fs.readFileSync(path.join(brainDir, '00_meta_and_governance/decision_log/DEC-008_scoring_dinamico_DN.md'), 'utf8');
        return dec008.includes('FARO utilizará una matriz dinámica') && dec008.includes('Debía/No debía (D/N)');
    },
    "KR-006": () => {
        const ds = fs.readFileSync(path.join(brainDir, '02_framework_canon/digital_self.md'), 'utf8');
        return ds.includes('representación funcional') && ds.includes('Un «gemelo digital» exacto');
    },
    "KR-007": () => {
        const doorsModel = fs.readFileSync(path.join(brainDir, '02_framework_canon/attention_doors_model.md'), 'utf8');
        return doorsModel.includes('Pruebas de intención maliciosa') && doorsModel.includes('Mecanismos que también operan en comunicaciones legítimas');
    },
    "KR-008": () => {
        const internalStory = fs.readFileSync(path.join(brainDir, '02_framework_canon/internal_story.md'), 'utf8');
        return internalStory.includes('producto emergente') || internalStory.includes('construcción de sentido');
    },
    "KR-009": () => {
        const gameSpec = fs.readFileSync(path.join(brainDir, '04_product_system/reusable_components/games/faro_v3plus/GAME_SPEC.md'), 'utf8');
        const dec005 = fs.readFileSync(path.join(brainDir, '00_meta_and_governance/decision_log/DEC-005_transicion_mira_a_faro.md'), 'utf8');
        return dec005.includes('agente protector') && !gameSpec.includes('villano');
    },
    "KR-010": () => {
        const trainVsInterv = fs.readFileSync(path.join(brainDir, '03_methodology_and_learning/training_vs_intervention.md'), 'utf8');
        return trainVsInterv.includes('desarrolla capacidades de las personas') && trainVsInterv.includes('modifica condiciones sociotécnicas');
    },
    "KR-LIB-001": () => {
        const libProto = fs.readFileSync(path.join(brainDir, '01_research_and_lenses/librarian/LIBRARIAN_PROTOCOL.md'), 'utf8');
        return libProto.includes('nunca auto-canonizarlos');
    },
    "KR-LIB-002": () => {
        const intake = fs.readFileSync(path.join(brainDir, '01_research_and_lenses/librarian/INTAKE_RULES.md'), 'utf8');
        return intake.includes('registrar DOI/URL en la Source Note') || intake.includes('research_library');
    },
    "KR-LIB-003": () => {
        const agentRules = fs.readFileSync(path.join(brainDir, '00_meta_and_governance/agent_operating_rules.md'), 'utf8');
        return agentRules.includes('Ningún Agente Promueve a Canon') && agentRules.includes('Ningún agente de IA puede asignar de manera autónoma');
    }
};

suite.tests.forEach(test => {
    const fn = assertions[test.id];
    if (fn) {
        try {
            const ok = fn();
            if (ok) {
                console.log('[PASS] ' + test.id + ': ' + test.critical_concept);
                passed++;
            } else {
                console.error('[FAIL] ' + test.id + ': Aserción fallida para ' + test.critical_concept);
                failed++;
            }
        } catch (e) {
            console.error('[ERROR] ' + test.id + ': ' + e.message);
            failed++;
        }
    } else {
        console.error('[FAIL / SKIP] ' + test.id + ': Sin función asertiva definida. Cero skips permitidos.');
        failed++;
    }
});

console.log('---------------------------------------------------------');
console.log('Resultado del Contrato: ' + passed + ' PASS, ' + failed + ' FAIL de ' + suite.tests.length + ' pruebas.');

if (failed > 0 || passed !== suite.tests.length) {
    console.error('ERROR: El contrato de contenido no alcanzó el 100% de aserciones evaluadas con éxito.');
    process.exit(1);
} else {
    console.log('CONTRATO DE CONTENIDO DETERMINÍSTICO CERTIFICADO (100% PASS).');
}
