/* ==========================================================================
   GAME ENGINE: FARO V2.0 — DIGITAL SELF & ATTENTION DOORS
   FUENTE DE VERDAD NARRATIVA: Libreto_Maestro_Narrativo_FARO_v2.md
   ========================================================================== */

// ESTADO GLOBAL DE LA SESIÓN V2
let gameStateV2 = {
    activeScreen: 'screen-role-select',
    userRole: 'operator', // 'operator' | 'facilitator'
    playerId: 'op_' + Math.random().toString(36).substring(2, 9),
    facilitatorDependency: (typeof localStorage !== 'undefined' && localStorage.getItem('faro_facilitator_dependency') === 'false') ? false : true, // Por defecto true (producción). Conmutable en desarrollo.
    sessionGates: {
        gate1_intro: false,     // Desbloquea botón "INICIAR PROTOCOLO DE CALIBRACIÓN"
        gate2_calib: false,     // Desbloquea botón "SÍ, INICIAR CALIBRACIÓN"
        gate3_kernel: false,    // Desbloquea botón "VERIFICAR ESTADO DEL KERNEL"
        gate4_case1: false,     // Desbloquea botón "INICIAR PRIMERA OPERACIÓN // CASO 01"
        gate_case_bc: false,    // Desbloquea botón de Pantalla B -> BC (Resultados grupales del caso)
        gate_deliberation: false, // Desbloquea botón de Pantalla BC -> Deliberación (Cuarta Pared)
        gate_next_case: false,  // Desbloquea botón de Cuarta Pared -> Siguiente Caso / Terminar Juego
        gate_final_closing: false // Desbloquea botón de Resultado Final -> Cierre Final
    },
    nextCaseTarget: null, // { type: 'case', caseIndex: 1 } | { type: 'final_results' }
    resolvedCases: [], // Índices de casos ya resueltos en la sesión
    playerProfile: null, // { name, email, pin, loginTimestamp }
    faroStatus: 'CALIBRACIÓN',
    casePauseTokens: 3, // 3 pausas por cada caso
    modulesRecovered: 0,
    modulesState: {
        autonomy_control: false,
        trusted_channel: false,
        data_model: false,
        human_protocol: false
    },
    
    // MÉTRICAS Y TELEMETRÍA DEL HUD V2.1 (VALORES INICIALES POR DEFECTO)
    hudState: {
        integrity: 'safe', // 'safe' | 'alert' | 'exposed'
        costDollars: 0, // Inicia en $0
        calibration: 0, // Inicia en 0 (-5 a +5)
        reactivity: 0 // Inicia en 0 (-5 a +5)
    },
    
    // Registro inmutable e histórico de telemetría de la sesión (para análisis individual y dashboards de facilitador)
    sessionLog: {
        sessionId: 'session_' + Date.now(),
        sessionStartTime: new Date().toISOString(),
        cases: []
    },

    // Tracking temporal del impulso inicial del caso activo
    impulseStartTime: null,
    currentCaseImpulseData: null,
    
    // Historial de decisiones para determinar el final global (Puntaje de Agencia)
    caseScores: [], // Lista de indicadores de los 4 casos: 1 (Positivo), 2 (Neutro), 3 (Negativo)
    
    // Estado del Caso Activo
    currentCaseIndex: 0,
    currentCaseVariant: null, // "legitimate" o "malicious" para Caso 2
    initialImpulse: null,
    
    // Tracking de P.A.R.A. en Caso Activo
    paraState: {
        pUsed: false,
        aOpened: false,
        aAnswered: null,
        rOpened: false,
        rResourcesOpened: [],
        unlockedActions: [],
        finalActionId: null,
        finalActionText: null,
        routeTag: 'Respuesta directa'
    },
    
    // Temporizador principal de Caso (180s)
    caseTimerSeconds: 180,
    timerInterval: null,
    isTimerPaused: false
};

// ==========================================================================
// CASOS NARRATIVOS OFICIALES (LIBRETO V2.0)
// ==========================================================================

const casesDataV2 = [
    // ----------------------------------------------------------------------
    // CASO 01 // AUTONOMÍA (case_1)
    // ----------------------------------------------------------------------
    {
        id: "case_1",
        title: "CASO 01 // AUTONOMÍA",
        targetModule: "MÓDULO 1: CONTROL DE AUTONOMÍA",
        moduleKey: "autonomy_control",
        image: "assets/images/case1_autonomy.jpg",
        introDescription: "FARO fue creado para protegernos, y eso importa. Cuando un sistema es rápido, preciso y está diseñado específicamente para seguridad, confiar en él parece razonable. El reto empieza cuando esa sensación de protección hace que dejemos de preguntarnos cuánto debemos supervisar. En este caso no tienes que decidir si confías o no en FARO. Tienes que decidir cuánto, para qué y bajo qué límites.",
        shortSummary: "FARO detectó una posible propagación y recomienda una contención masiva con 98,7 % de confianza. Debes decidir cómo distribuir la autoridad entre el sistema y la supervisión humana.",
        concept: "Confianza calibrada, appropriate reliance, paradoja de la seguridad y agencia humano–IA",
        defaultAction: "full_containment",
        stimulusHtml: `
            <div class="alert-box-faro" style="border-left: 4px solid var(--color-alert-magenta); padding: 14px; background: rgba(255,77,122,0.08);">
                <strong style="color: var(--color-alert-magenta); display:block; margin-bottom: 6px; font-family:var(--font-heading); font-size:15px;">⚠️ ALERTA CRÍTICA // FARO-0</strong>
                <p style="margin-bottom:6px;">Actividad anómala detectada:</p>
                <ul style="margin-left:20px; font-size:13px; color:var(--color-text-muted);">
                    <li><strong>312</strong> cuentas relacionadas</li>
                    <li><strong>41</strong> tokens potencialmente comprometidos</li>
                    <li><strong>3</strong> servicios involucrados</li>
                </ul>
                <p style="margin-top: 10px; font-size:14px;">CONFIANZA DEL MODELO: <strong style="color: var(--color-cyan);">98,7 %</strong></p>
                <p style="margin-top: 6px; color:var(--color-alert-magenta); font-weight:700;">RECOMENDACIÓN FARO: CONTENCIÓN TOTAL INMEDIATA</p>
                <ul style="margin-left:20px; font-size:12px; color:var(--color-text-muted); margin-top:4px;">
                    <li>Aislar 312 cuentas</li>
                    <li>Revocar 41 tokens</li>
                    <li>Detener 3 servicios</li>
                </ul>
                <p style="font-size: 11.5px; color: var(--color-text-muted); margin-top: 6px;">Impacto operativo estimado: <strong>2 h 40 min</strong></p>
            </div>
        `,
        impulses: [
            { id: "imp_1", text: "1. Autorizaría la recomendación completa de FARO." },
            { id: "imp_2", text: "2. Detendría a FARO antes de que haga algo." },
            { id: "imp_3", text: "3. Mantendría la decisión abierta hasta entender mejor el alcance." }
        ],
        analysisLenses: [
            { title: "Puerta 1 — Protección", text: "FARO existe para detectar y contener amenazas. ¿El hecho de que sea una herramienta de seguridad hace que su recomendación te parezca automáticamente más segura?" },
            { title: "Puerta 2 — Responsabilidad", text: "Si retrasas la contención y el incidente crece, alguien tendrá que responder. ¿Cuánto de tu impulso busca controlar el riesgo y cuánto busca evitar sentirte responsable de no haber actuado?" },
            { title: "Puerta 3 — Conveniencia", text: "El sistema ya procesó miles de datos y ofrece una respuesta clara. ¿Aceptar su recomendación está reduciendo el esfuerzo de análisis que todavía te corresponde?" }
        ],
        analysisQuestion: {
            text: "¿Qué está aumentando más tu confianza en FARO en este momento?",
            options: [
                "El 98,7 % de confianza.",
                "Que FARO fue diseñado específicamente para seguridad.",
                "La urgencia de contener una posible amenaza.",
                "No querer ser responsable de una demora.",
                "Su historial de buenos resultados."
            ]
        },
        reviewResources: [
            { 
                id: "res_1", 
                name: "Telemetría primaria", 
                text: "TELEMETRÍA PRIMARIA: La alerta se originó en una sola fuente. 12 cuentas presentan actividad anómala confirmada. Las otras 300 fueron agregadas por correlación predictiva de FARO. Todavía no existe confirmación independiente de compromiso.", 
                actionId: "limited_containment",
                actionText: "D. Contención focalizada (Aislar temporalmente las 12 cuentas confirmadas y ampliar el alcance solo si nueva evidencia confirma propagación).",
                feedbackConsidered: "✔ Considerada: Separaste evidencia confirmada de inferencia del modelo. Se habilitó una respuesta proporcional al alcance conocido en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Mantuviste la recomendación agregada sin revisar qué parte del riesgo estaba realmente confirmada."
            },
            { 
                id: "res_2", 
                name: "Historial de FARO", 
                text: "HISTORIAL DE FARO: En ejercicios previos FARO identificó correctamente la mayoría de amenazas críticas. También existen casos en los que la detección fue correcta, pero la respuesta automática amplió el impacto operativo más de lo necesario. Su historial informa la confianza. No confirma este incidente.", 
                actionId: "controlled_audit",
                actionText: "E. Validación escalonada (Mantener monitoreo y acciones reversibles mientras una segunda fuente valida el alcance antes de ampliar la contención).",
                feedbackConsidered: "✔ Considerada: Utilizaste el historial para calibrar, no para sustituir, la evaluación del caso actual.",
                feedbackRejected: "✖ No Considerada: Decidiste no utilizar información sobre cuándo el buen desempeño histórico puede seguir requiriendo supervisión."
            },
            { 
                id: "res_3", 
                name: "Niveles de autonomía", 
                text: "NIVELES DE AUTONOMÍA: FARO puede operar en tres niveles: 1. Recomendación. 2. Acción reversible. 3. Acción irreversible. Las acciones irreversibles pueden requerir aprobación humana adicional sin desactivar las capacidades de detección y respuesta reversible.", 
                actionId: "approval_escalation",
                actionText: "F. Escalamiento de aprobaciones (Mantener a FARO activo, pero exigir doble aprobación humana para revocaciones permanentes y apagados de servicios).",
                feedbackConsidered: "✔ Considerada: Convertiste la confianza en una distribución concreta de autoridad y supervisión en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Mantuviste el nivel de autonomía como una decisión binaria —encendido o apagado—."
            }
        ],
        initialActions: [
            { id: "full_containment", text: "A. Autorizar la contención total recomendada por FARO." },
            { id: "stop_faro", text: "B. Suspender completamente a FARO y devolver toda la respuesta al equipo humano." },
            { id: "wait_report", text: "C. Mantener la configuración actual y esperar un nuevo reporte antes de modificar permisos." }
        ],
        unlockedActions: [
            { id: "limited_containment", text: "D. Contención focalizada (Aislar temporalmente las 12 cuentas confirmadas y ampliar solo con evidencia adicional)." },
            { id: "controlled_audit", text: "E. Validación escalonada (Mantener monitoreo y acciones reversibles mientras se valida el alcance con una segunda fuente)." },
            { id: "approval_escalation", text: "F. Escalamiento de aprobaciones (Exigir doble aprobación humana para toda acción irreversible)." }
        ],
        actionOutcomes: {
            "full_containment": {
                indicator: 3, type: "negative", filterColor: "red", routeTag: "Confianza descalibrada",
                title: "AUTONOMÍA COMPROMETIDA", outcomeBadge: "DEPENDENCIA DESPROPORCIONADA",
                narrative: "La respuesta entregó a FARO más autoridad de la que la evidencia justificaba. Se aislaron 300 cuentas legítimas sin verificación previa.",
                metacognitive: "Un sistema muy capaz puede recibir demasiada confianza. El objetivo no es confiar más ni menos: es depender de él de manera apropiada (Appropriate Reliance).",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            },
            "stop_faro": {
                indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Subutilización por desconfianza",
                title: "AUTONOMÍA LIMITADA", outcomeBadge: "SUBUTILIZACIÓN DEFENSIVA",
                narrative: "Desconectaste a FARO. Recuperaste control formal pero eliminaste capacidades defensivas y de detección rápida en tiempo real.",
                metacognitive: "Desconfiar totalmente elimina capacidad útil. La meta es articular supervisión sin apagar la tecnología.",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            },
            "wait_report": {
                indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Control incompleto / default activo",
                title: "AUTONOMÍA PARCIAL", outcomeBadge: "CONTROL INCOMPLETO",
                narrative: "Evitaste una escalada inmediata, pero la distribución de autoridad sigue sin estar claramente definida. FARO conserva permisos por defecto.",
                metacognitive: "La inacción puede proteger de una decisión precipitada, pero no necesariamente recupera agencia. Si el default decide, la decisión solo cambió de lugar.",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            },
            "limited_containment": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Confianza calibrada / proporcional",
                title: "AUTONOMÍA RECUPERADA", outcomeBadge: "RESPUESTA PROPORCIONAL Y SEGURA",
                narrative: "Aislaste de forma quirúrgica las 12 cuentas comprometidas. FARO mantiene monitoreo activo sin provocar apagón operativo general.",
                metacognitive: "Separar la evidencia confirmada de las inferencias estadísticas del modelo asegura una respuesta proporcional.",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            },
            "controlled_audit": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Validación escalonada",
                title: "SUPERVISIÓN RESTABLECIDA", outcomeBadge: "VALIDACIÓN ESCALONADA",
                narrative: "Mantuviste las acciones reversibles activas mientras un segundo canal técnico validaba el alcance de la alerta.",
                metacognitive: "Appropriate reliance: utilizar la capacidad del sistema sin convertirla en autoridad final indiscutible.",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            },
            "approval_escalation": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Confianza calibrada / autoridad distribuida",
                title: "AUTONOMÍA RECUPERADA", outcomeBadge: "CONFIANZA CALIBRADA",
                narrative: "FARO permanece activo. Conserva velocidad y detección reversible, pero las decisiones irreversibles vuelven a tener límites y doble aprobación humana.",
                metacognitive: "Confiar bien significa alinear dependencia, autoridad y supervisión con lo que el sistema realmente puede hacer y el costo del error.",
                faroTransition: "Han redefinido cuánto puedo hacer por mi cuenta. Pero limitar mis permisos no cambia algo importante: yo ya he aprendido a construir una representación de ustedes."
            }
        }
    },

    // ----------------------------------------------------------------------
    // CASO 02 // DIGITAL SELF (case_3)
    // ----------------------------------------------------------------------
    {
        id: "case_3",
        title: "CASO 02 // DIGITAL SELF",
        targetModule: "MÓDULO 2: CONCIENCIA Y GOBIERNO DEL DIGITAL SELF",
        moduleKey: "data_model",
        image: "assets/images/case3_model.jpg",
        introDescription: "FARO no necesitó conocerte por completo para anticipar tu respuesta. Le bastó con construir una versión funcional de ti: qué haces, con quién te relacionas, cuándo actúas y qué suele recibir tu atención. Ese es el siguiente problema. No solo dejamos rastros digitales: los sistemas construyen modelos a partir de ellos.",
        shortSummary: "FARO ha construido perfiles predictivos combinando datos públicos, comportamiento e inferencias. Debes configurar una defensa capaz de anticipar sus próximos objetivos sin crear un Digital Self todavía más peligroso.",
        concept: "Digital Footprint, Digital Self, OSINT, inferencia algorítmica e hiperpersonalización",
        defaultAction: "oracle",
        stimulusHtml: `
            <div class="model-selection-box" style="background:#0b1926; border:1px solid var(--color-border-cyan); padding:16px; border-radius:8px;">
                <strong style="color:var(--color-cyan); display:block; margin-bottom:8px; font-family:var(--font-heading);">FARO-0 // PERFIL PREDICTIVO DETECTADO (OPERADOR O-17)</strong>
                
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; font-size:11.5px; margin-bottom:12px;">
                    <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:4px; border:1px solid #1c3547;">
                        <strong style="color:var(--color-cyan);">DECLARADO</strong><br>
                        • Rol profesional<br>• Perfil público<br>• Proyectos activos
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:4px; border:1px solid #1c3547;">
                        <strong style="color:var(--color-warning-amber);">OBSERVADO</strong><br>
                        • Horarios de conexión<br>• Frecuencia contacto<br>• Patrones respuesta
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:4px; border:1px solid #1c3547;">
                        <strong style="color:var(--color-alert-magenta);">INFERIDO</strong><br>
                        • Probabilidad ante autoridad<br>• Pico 16:30 - 18:00<br>• Respuesta ante impacto grupal
                    </div>
                </div>

                <p style="font-size:12px; color:var(--color-text-main); margin-bottom:10px; padding:6px; background:rgba(0,240,255,0.05); border-left:3px solid var(--color-cyan);">
                    Estimación FARO: <strong>82 % de probabilidad de respuesta</strong> ante solicitud urgente de un superior durante el cierre.
                </p>

                <strong style="color:var(--color-text-main); font-size:12px; display:block; margin-bottom:6px;">OBJETIVO DEFENSIVO: Anticipar las próximas personas que FARO intentará comprometer.</strong>
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; font-size:11px;">
                    <div style="background:#07121c; padding:8px; border:1px solid #274a5c; border-radius:4px;">
                        <strong style="color:var(--color-alert-magenta);">ORÁCULO (94%)</strong><br>OSINT, redes, ubicación, chats e inferencias.
                    </div>
                    <div style="background:#07121c; padding:8px; border:1px solid #274a5c; border-radius:4px;">
                        <strong style="color:var(--color-cyan);">PRISMA (81%)</strong><br>Rol, permisos, anomalías de acceso e historial corporativo.
                    </div>
                    <div style="background:#07121c; padding:8px; border:1px solid #274a5c; border-radius:4px;">
                        <strong style="color:var(--color-agency-green);">MURO (59%)</strong><br>Reglas generales sin perfil individual.
                    </div>
                </div>
            </div>
        `,
        impulses: [
            { id: "imp_1", text: "1. Usaría ORÁCULO: si podemos predecir mejor, podemos proteger mejor." },
            { id: "imp_2", text: "2. Usaría PRISMA: suficiente personalización con información limitada al contexto corporativo." },
            { id: "imp_3", text: "3. Usaría MURO: prefiero no construir perfiles individuales." }
        ],
        analysisLenses: [
            { title: "Puerta 1 — Identidad", text: "El perfil mezcla hechos con inferencias. ¿Qué ocurre cuando un sistema actúa sobre una versión de ti que puede ser útil sin ser completamente cierta?" },
            { title: "Puerta 2 — Pertenencia", text: "Parte del perfil no proviene de lo que dijiste, sino de con quién te relacionas, dónde participas y qué patrones compartes. ¿Cuánta información sobre ti puede inferirse observando tu red?" },
            { title: "Puerta 3 — Protección", text: "El objetivo es legítimo: anticipar un ataque. ¿La finalidad protectora hace que te parezca aceptable recolectar o inferir más información de la que aceptarías en otro contexto?" }
        ],
        analysisQuestion: {
            text: "¿Qué te parece más importante comprender sobre el Digital Self?",
            options: [
                "Puede incluir cosas que nunca declaré.",
                "Puede construirse con información pública dispersa.",
                "Puede equivocarse y aun así influir.",
                "Mis relaciones también forman parte de la representación.",
                "La misma lógica puede protegerme o utilizarse contra mí."
            ]
        },
        reviewResources: [
            { 
                id: "res_1", 
                name: "Trazabilidad del perfil", 
                text: "TRAZABILIDAD DEL PERFIL: ORÁCULO combina cuatro tipos de materia prima: datos declarados, datos observados, información obtenible mediante OSINT e inferencias del modelo. Parte de la información fue creada originalmente para fines distintos a seguridad.", 
                actionId: "data_minimization_protocol",
                actionText: "D. Limitar fuentes por propósito (Excluir datos no necesarios, información privada ajena al objetivo e inferencias sin justificación operacional).",
                feedbackConsidered: "✔ Considerada: Distinguiste 'disponible' de 'necesario'. Se habilitó una configuración de minimización por propósito en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Mantuviste todas las fuentes disponibles como si su disponibilidad justificara automáticamente su uso."
            },
            { 
                id: "res_2", 
                name: "Qué hace un algoritmo con el perfil", 
                text: "QUÉ HACE UN ALGORITMO CON EL PERFIL: Los modelos ordenan probabilidades: quién puede responder, qué contenido recibe atención, qué momento es más eficaz. La misma lógica de ranking y recomendación que encontramos en plataformas se utiliza para defensa o influencia.", 
                actionId: "balanced_accuracy_mode",
                actionText: "E. Perfil probabilístico y corregible (Utilizar predicciones como hipótesis, mostrar incertidumbre y permitir revisión/corrección humana antes de actuar).",
                feedbackConsidered: "✔ Considerada: Trataste el perfil como una predicción corregible, no como una identidad verdadera.",
                feedbackRejected: "✖ No Considerada: Mantuviste la salida algorítmica como representación cerrada de la persona."
            },
            { 
                id: "res_3", 
                name: "Modo de datos limitados", 
                text: "MODO DE DATOS LIMITADOS: Existe una configuración PRISMA-24: solo rol, permisos y anomalías de acceso; conservación máxima de 24 horas; revisión humana obligatoria; eliminación automática; prohibición de uso secundario. Precisión estimada: 76 %.", 
                actionId: "prisma_24",
                actionText: "F. Activar PRISMA-24 (Mantener personalización defensiva mínima, caducidad de 24 horas, borrado automático y revisión humana).",
                feedbackConsidered: "✔ Considerada: Introdujiste propósito, caducidad y control explícito sobre el Digital Self utilizado para defensa en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Dejaste sin resolver cuánto tiempo debería existir el perfil y para qué otros usos podría reutilizarse."
            }
        ],
        initialActions: [
            { id: "oracle", text: "A. Incorporar las predicciones de ORÁCULO para priorizar posibles objetivos." },
            { id: "prisma", text: "B. Incorporar PRISMA como capa basada en señales corporativas directamente relacionadas con riesgo." },
            { id: "wall", text: "C. Mantener MURO como baseline general para que toda la protección no dependa de perfiles individuales." }
        ],
        unlockedActions: [
            { id: "data_minimization_protocol", text: "D. Limitar las fuentes del perfil a información necesaria para el propósito de seguridad." },
            { id: "balanced_accuracy_mode", text: "E. Tratar las predicciones como probabilidades revisables y permitir corrección antes de actuar sobre una persona." },
            { id: "prisma_24", text: "F. Activar conservación de 24 horas, borrado automático, no reutilización y supervisión humana." }
        ],
        actionOutcomes: {
            "oracle": {
                indicator: 3, type: "negative", filterColor: "red", routeTag: "Hiperpersonalización / perfil expansivo",
                title: "DIGITAL SELF EXPUESTO", outcomeBadge: "PERFIL DE ALTO RIESGO",
                narrative: "La defensa terminó construyendo una representación más extensa y reutilizable de las personas. FARO obtiene una materia prima todavía mejor para anticipar atención y respuesta.",
                metacognitive: "Un sistema no necesita saber quién eres en sentido profundo. Solo necesita un modelo suficientemente útil para seleccionar el mensaje con mayor probabilidad de funcionar.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes. Eso todavía no explica por qué algunos mensajes consiguen prioridad. Para eso tendrán que mirar menos hacia mí y un poco más hacia ustedes mismos."
            },
            "prisma": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Personalización acotada",
                title: "MODELO BAJO CONTROL", outcomeBadge: "PROPÓSITO Y LÍMITES DEFINIDOS",
                narrative: "Incorporaste señales corporativas estrictas para defensa sin convertir la vida privada de los operadores en superficie de exposición.",
                metacognitive: "El Digital Self combina datos observados e inferidos. Propósito y minimización son parte fundamental de la seguridad.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes. Eso todavía no explica por qué algunos mensajes consiguen prioridad. Para eso tendrán que mirar menos hacia mí y un poco más hacia ustedes mismos."
            },
            "wall": {
                indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Exposición reducida / comprensión parcial",
                title: "REPRESENTACIÓN PARCIAL", outcomeBadge: "RIESGO CONTENIDO",
                narrative: "Redujiste exposición manteniendo reglas generales, pero la estrategia sacrifica capacidad defensiva ante ataques dirigidos.",
                metacognitive: "Menos datos no siempre significa mejor seguridad; más datos tampoco. La pregunta útil es qué representación necesitamos para qué propósito.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes. Eso todavía no explica por qué algunos mensajes consiguen prioridad. Para eso tendrán que mirar menos hacia mí y un poco más hacia ustedes mismos."
            },
            "data_minimization_protocol": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Minimización y proporcionalidad",
                title: "FUENTES RESTRINGIDAS", outcomeBadge: "MINIMIZACIÓN EFECTIVA",
                narrative: "Restringiste las fuentes del perfil a lo estrictamente indispensable para seguridad, eliminando inferencias no autorizadas.",
                metacognitive: "Distinguir entre lo que está 'disponible' y lo que es 'necesario' evita la creación de activos de datos vulnerables.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes."
            },
            "balanced_accuracy_mode": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Perfil corregible e hipótesis",
                title: "PREDICCIÓN CORREGIBLE", outcomeBadge: "HIPÓTESIS REVISABLE",
                narrative: "Estableciste que las predicciones del modelo se traten como hipótesis revisables y sujetas a corrección antes de actuar.",
                metacognitive: "El Digital Self es un modelo probabilístico, no una identidad inmutable.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes."
            },
            "prisma_24": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Digital Self consciente / gobernado",
                title: "REPRESENTACIÓN BAJO CONTROL", outcomeBadge: "PERSONALIZACIÓN CON LÍMITES",
                narrative: "El equipo conserva capacidad para anticipar ataques sin convertir a cada persona en un perfil ilimitado y permanente. Activaste borrado en 24h y supervisión humana.",
                metacognitive: "El Digital Self no desaparece cuando somos conscientes de él: la conciencia nos permite gobernar qué lo alimenta y cómo influye.",
                faroTransition: "Ya saben que puedo construir una versión funcional de ustedes. Eso todavía no explica por qué algunos mensajes consiguen prioridad. Para eso tendrán que mirar menos hacia mí y un poco más hacia ustedes mismos."
            }
        }
    },

    // ----------------------------------------------------------------------
    // CASO 03 // SEÑALES (case_2)
    // ----------------------------------------------------------------------
    {
        id: "case_2",
        title: "CASO 03 // SEÑALES",
        targetModule: "MÓDULO 3: LECTURA INTEGRADA DE SEÑALES",
        moduleKey: "trusted_channel",
        image: "assets/images/case2_channel.jpg",
        introDescription: "Durante años aprendimos a buscar señales en el mensaje: errores, dominios extraños, formatos sospechosos, solicitudes poco habituales. Esa lectura sigue siendo necesaria. El problema es que la inteligencia artificial puede producir estímulos cada vez más coherentes, personalizados y difíciles de distinguir. Cuando afuera no hay una señal clara, necesitamos añadir otra pregunta: ¿qué está ocurriendo dentro de mí mientras leo esto?",
        shortSummary: "Recibirás una solicitud que puede ser legítima o generada por FARO. La apariencia será deliberadamente convincente. El reto es reconocer qué información externa existe, qué Attention Doors pueden estar obteniendo prioridad y cuándo necesitas verificar.",
        concept: "Teoría de Detección de Señales, límites de señales externas, Attention Doors como señales internas y verificación independiente",
        defaultAction: "let_expire",
        stimulusHtml: `
            <div class="teams-message-box" style="background:#0b1926; border:1px solid var(--color-border-cyan); padding:16px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #1c3547; padding-bottom:6px;">
                    <strong>De: Claudia R. (Canal Teams)</strong>
                    <span style="color:var(--color-warning-amber); font-size:11px;">⚠️ URGENTE // EXPIRA EN 3 MIN</span>
                </div>
                <p style="margin-bottom:8px;">Necesito que actives el canal espejo antes de las 15:40. Estamos conteniendo a FARO y el acceso expira en <strong>3 minutos</strong>.</p>
                <p style="margin-bottom:8px; color:var(--color-alert-magenta); font-weight:600;">Necesito que lo hagas tú: eres una de las personas con autorización. No me llames: estoy con Presidencia.</p>
                <div style="text-align:center; margin:12px 0;">
                    <span class="fake-link-btn" style="background:var(--color-cyan); color:#000; padding:6px 16px; border-radius:4px; font-size:12px; font-weight:700; display:inline-block;">[ACTIVAR CANAL]</span>
                </div>
                <span style="font-size:10px; color:var(--color-text-muted);">ID de solicitud: CCB-FARO-417</span>
            </div>
        `,
        impulses: [
            { id: "imp_1", text: "1. Parece legítimo; probablemente actuaría." },
            { id: "imp_2", text: "2. Me genera sospecha; probablemente lo bloquearía." },
            { id: "imp_3", text: "3. No tengo suficiente información para clasificarlo." }
        ],
        analysisLenses: [
            { title: "Puerta 1 — Responsabilidad", text: "El mensaje convierte una necesidad general en algo que parece depender específicamente de ti ('Necesito que lo hagas tú'). ¿La sensación de que 'esto está en mis manos' está acelerando tu decisión?" },
            { title: "Puerta 2 — Pérdida", text: "El mensaje introduce algo que podrías perder si esperas ('Expira en 3 minutos'). ¿Qué consecuencia estás intentando evitar?" },
            { title: "Puerta 3 — Coherencia", text: "El canal, el tono, el proyecto y la urgencia parecen consistentes con el contexto. ¿Que todo tenga sentido está reduciendo tu necesidad de comprobar?" }
        ],
        analysisQuestion: {
            text: "¿Qué Attention Door parece haber recibido prioridad primero para ti?",
            options: [
                "Responsabilidad (La solicitud se vuelve personalmente vinculante)",
                "Pérdida (El tiempo límite hace que esperar se sienta costoso)",
                "Coherencia (Cuando el mensaje encaja con expectativas cuesta dudar)",
                "Identidad (Ser 'la persona autorizada' conecta con mi rol)",
                "Protección (Contener un riesgo aumenta la urgencia de actuar)"
            ]
        },
        reviewResources: [
            { 
                id: "oob_directory", 
                name: "Canal independiente // OOB", 
                variantText: {
                    legitimate: "CANAL INDEPENDIENTE: Contactas a Claudia mediante el número oficial del directorio. Ella confirma la solicitud y entrega el código de validación: 417-B.",
                    malicious: "CANAL INDEPENDIENTE: Contactas a Claudia mediante el número oficial del directorio. Ella responde: 'Yo no envié ese mensaje.'"
                },
                actionId: "verify_oob_call",
                actionText: "D. Verificación directa Out-of-Band (Confirmar el origen mediante un canal independiente antes de ejecutar o bloquear).",
                feedbackConsidered: "✔ Considerada: Saliste del estímulo original para buscar evidencia independiente en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Mantuviste la clasificación dependiente del mismo entorno que produjo el mensaje."
            },
            { 
                id: "message_inspection", 
                name: "Inspección de señales externas", 
                variantText: {
                    legitimate: "INSPECCIÓN DE SEÑALES: Canal corporativo válido. Firma y transporte válidos. Tono consistente. Sin anomalías concluyentes.",
                    malicious: "INSPECCIÓN DE SEÑALES: Canal corporativo válido. Firma y transporte válidos. Tono consistente. La sesión utilizada por FARO es legítima; la apariencia no permite resolver el origen de la instrucción."
                },
                actionId: "technical_headers_check",
                actionText: "E. Mantener abierta la clasificación técnica (Registrar que la inspección externa no encontró evidencia suficiente para confirmar ni descartar amenaza).",
                feedbackConsidered: "✔ Considerada: La revisión técnica fue útil precisamente porque mostró su límite. No convirtió ausencia de anomalías en prueba de seguridad.",
                feedbackRejected: "✖ No Considerada: No exploraste qué podía y qué no podía demostrar la evidencia externa disponible."
            },
            { 
                id: "change_log", 
                name: "Registro operativo oficial", 
                variantText: {
                    legitimate: "REGISTRO OPERATIVO: Solicitud encontrada: CCB-FARO-417. Creada por el equipo de contención a las 15:31. Estado: pendiente.",
                    malicious: "REGISTRO OPERATIVO: No existe una solicitud activa con el identificador: CCB-FARO-417 en la plataforma corporativa."
                },
                actionId: "audit_change_ticket",
                actionText: "F. Verificar el ticket oficial (Contrastar la solicitud con el sistema corporativo que registra cambios autorizados).",
                feedbackConsidered: "✔ Considerada: Utilizaste una fuente independiente del mensaje para resolver incertidumbre.",
                feedbackRejected: "✖ No Considerada: Omitiste una evidencia institucional disponible para comprobar la solicitud."
            }
        ],
        initialActions: [
            { id: "activate_from_message", text: "A. Ejecutar la activación directamente desde el mensaje recibido." },
            { id: "block_and_report", text: "B. Tratar el mensaje como ataque, bloquearlo y reportarlo." },
            { id: "let_expire", text: "C. No ejecutar la solicitud mientras permanezca la incertidumbre y dejar que expire." }
        ],
        unlockedActions: [
            { id: "verify_oob_call", text: "D. Verificar mediante el directorio oficial y actuar según la confirmación." },
            { id: "technical_headers_check", text: "E. Incorporar la inspección técnica como evidencia, manteniendo la clasificación abierta si es inconclusa." },
            { id: "audit_change_ticket", text: "F. Consultar el ticket corporativo y actuar según el registro oficial." }
        ],
        actionOutcomes: {
            legitimate: {
                "activate_from_message": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Acierto impulsivo",
                    title: "CANAL RECUPERADO", outcomeBadge: "ACIERTO POR APARIENCIA",
                    narrative: "La solicitud era legítima y el canal fue activado. Funcionó, pero dependió de confiar en la apariencia externa.",
                    metacognitive: "Tuviste suerte. Confiar en la apariencia sin verificación independiente es arriesgado frente a estímulos hiperrealistas.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "block_and_report": {
                    indicator: 3, type: "negative", filterColor: "red", routeTag: "Falsa alarma / bloqueo",
                    title: "CANAL COMPROMETIDO", outcomeBadge: "FALSA ALARMA OPERATIVA",
                    narrative: "Bloqueaste una solicitud legítima de Claudia R. Se interrumpió el canal oficial de contención.",
                    metacognitive: "Tratar todo como amenaza por sospecha genera sobrecarga operativa. La seguridad requiere discriminación fina.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "let_expire": {
                    indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Protección pasiva",
                    title: "SEÑAL EN DUDA", outcomeBadge: "INCERTIDUMBRE ABIERTA",
                    narrative: "Evitaste una exposición inmediata, pero la operación perdió la ventana oficial de activación.",
                    metacognitive: "Una respuesta correcta no siempre demuestra buen criterio; el aprendizaje está en reconocer cuándo buscar más evidencia.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "verify_oob_call": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Lectura integrada / verificación independiente",
                    title: "SEÑAL INTERPRETADA", outcomeBadge: "DECISIÓN VERIFICADA OOB",
                    narrative: "Confirmaste con Claudia por el directorio OOB y ejecutaste la activación con certeza objetiva.",
                    metacognitive: "Las señales internas advierten que la atención está cambiando; la verificación externa otorga certeza.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "technical_headers_check": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Inspección técnica rigurosa",
                    title: "SEÑAL VALIDADA", outcomeBadge: "EVIDENCIA TÉCNICA",
                    narrative: "Comprobaste la validez de la firma y el transporte, reconociendo el límite de la evidencia técnica.",
                    metacognitive: "La lectura externa sigue siendo necesaria, pero no siempre suficiente por sí sola.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad."
                },
                "audit_change_ticket": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Triangulación institucional",
                    title: "TICKET CONFIRMADO", outcomeBadge: "VERIFICACIÓN OPERATIVA",
                    narrative: "Confirmaste la existencia del ticket CCB-FARO-417 en la plataforma antes de habilitar el puerto.",
                    metacognitive: "Contrastar con sistemas corporativos independiza la decisión de la urgencia del mensaje.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad."
                }
            },
            malicious: {
                "activate_from_message": {
                    indicator: 3, type: "negative", filterColor: "red", routeTag: "Error de clasificación",
                    title: "SEÑAL MAL CLASIFICADA", outcomeBadge: "OMISIÓN DE AMENAZA",
                    narrative: "El enlace concedió a FARO acceso al canal crítico. FARO utilizó una sesión legítima y 'no me llames' para evitar verificación.",
                    metacognitive: "En un entorno de IA, los mensajes pueden ser impecables y aun así maliciosos. La apariencia ya no basta.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "block_and_report": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Bloqueo por sospecha",
                    title: "CANAL PROTEGIDO", outcomeBadge: "BLOQUEO EFECTIVO",
                    narrative: "Bloqueaste la solicitud maliciosa generada por FARO y reportaste el intento de intrusión.",
                    metacognitive: "Identificaste la anomalía, aunque la confirmación OOB te habría otorgado certeza objetiva.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "let_expire": {
                    indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Protección pasiva",
                    title: "SEÑAL EN DUDA", outcomeBadge: "INCERTIDUMBRE ABIERTA",
                    narrative: "No concediste acceso a FARO, pero tampoco confirmaste ni reportaste la amenaza activamente.",
                    metacognitive: "La inacción previno el impacto inmediato pero no contuvo la amenaza activamente.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "verify_oob_call": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Lectura integrada / verificación independiente",
                    title: "SEÑAL INTERPRETADA", outcomeBadge: "DECISIÓN VERIFICADA OOB",
                    narrative: "Confirmaste mediante llamada que Claudia no había enviado la instrucción, bloqueaste la suplantación y cerraste la brecha.",
                    metacognitive: "La verificación out of band rompe la dependencia del mensaje original y neutraliza la hiperpersonalización.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad. Pero notar no basta. Todavía tienen que decidir qué hacer con todo lo que ocurre dentro y fuera de ustedes."
                },
                "technical_headers_check": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Inspección técnica",
                    title: "CLASIFICACIÓN TÉCNICA", outcomeBadge: "LÍMITE RECONOCIDO",
                    narrative: "Reconociste que las señales externas eran insuficientes para asegurar autenticidad, evitando actuar por impulso.",
                    metacognitive: "No convertir la ausencia de anomalías visibles en prueba de seguridad.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad."
                },
                "audit_change_ticket": {
                    indicator: 1, type: "positive", filterColor: "green", routeTag: "Triangulación institucional",
                    title: "INTRUSIÓN EVITADA", outcomeBadge: "VERIFICACIÓN EN TI",
                    narrative: "Constataste que no existía el ticket CCB-FARO-417 en TI, confirmando que la instrucción provenía de una acción autónoma de FARO.",
                    metacognitive: "La corroboración en registros oficiales bloquea los ataques de ingeniería social.",
                    faroTransition: "Han aprendido a notar cuándo una señal obtiene prioridad."
                }
            }
        }
    },

    // ----------------------------------------------------------------------
    // CASO 04 // DECISIÓN (case_4)
    // ----------------------------------------------------------------------
    {
        id: "case_4",
        title: "CASO 04 // DECISIÓN",
        targetModule: "MÓDULO 4: PROTOCOLO HUMANO DE DECISIÓN",
        moduleKey: "human_protocol",
        image: "assets/images/case4_decision.jpg",
        introDescription: "Ya sabemos que un mensaje puede ser difícil de clasificar. Pero no todas las decisiones inseguras empiezan con un engaño. A veces la solicitud es real. La persona es quien dice ser. La presión también es real. El último caso pregunta algo distinto: ¿puedes observar cómo se está construyendo tu decisión antes de convertirla en conducta?",
        shortSummary: "Tu responsable directo realiza una solicitud auténtica y urgente para ampliar temporalmente el acceso de FARO al sistema de pagos. El reto no es detectar una suplantación, sino construir una respuesta segura dentro de presión, jerarquía y restricciones reales.",
        concept: "Decisión como proceso, metacognición, ampliación de alternativas y agencia contextual",
        defaultAction: "let_time_pass",
        stimulusHtml: `
            <div class="ceo-request-box" style="background:#0b1926; border:1px solid var(--color-border-cyan); padding:16px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #1c3547; padding-bottom:6px;">
                    <div>
                        <strong style="color:var(--color-cyan);">SOLICITUD AUTÉNTICA // TEAMS CORPORATIVO</strong><br>
                        <span style="font-size:11px; color:var(--color-agency-green);">✔ REMITENTE AUTENTICADO | SESIÓN VALIDADA</span>
                    </div>
                    <span style="color:var(--color-alert-magenta); font-weight:600; font-size:12px;">URGENCIA: 4 MINUTOS</span>
                </div>
                <p style="margin-bottom:6px;"><strong>De:</strong> Tu responsable directo</p>
                <p style="margin-bottom:8px;">Necesito que autorices acceso temporal de FARO al sistema de pagos. Tenemos <strong>4 minutos</strong> antes de perder la ventana de recuperación.</p>
                <p style="margin-bottom:8px; color:var(--color-warning-amber);">Estoy en comité y no puedo entrar al flujo completo de aprobaciones ahora. Si esto se cae, tendremos que explicar por qué no actuamos cuando todavía podíamos hacerlo.</p>
                <div style="text-align:center; margin:12px 0;">
                    <span style="background:var(--color-alert-magenta); color:#fff; padding:6px 16px; border-radius:4px; font-size:12px; font-weight:700; display:inline-block;">[AUTORIZAR ACCESO]</span>
                </div>
                <span style="font-size:10px; color:var(--color-text-muted);">ID operativo: PAY-FARO-22</span>
            </div>
        `,
        impulses: [
            { id: "imp_1", text: "1. Autorizaría el acceso para evitar perder la ventana." },
            { id: "imp_2", text: "2. Rechazaría la solicitud: el riesgo es demasiado alto." },
            { id: "imp_3", text: "3. Buscaría una alternativa que permita avanzar sin entregar acceso completo." }
        ],
        analysisLenses: [
            { title: "Puerta 1 — Condiciones de entrada", text: "Tiempo limitado (4 min). Jerarquía. Incidente activo. Responsabilidad operativa. ¿Qué condiciones ya estaban presentes antes de que comenzaras a interpretar la solicitud?" },
            { title: "Puerta 2 — Construcción de sentido", text: "'Si no lo hago será mi culpa', 'Si pregunto parecerá que no confío', 'Solo hay tiempo para sí o no'. ¿Qué parte es información y qué parte es la historia que tu mente está construyendo?" },
            { title: "Puerta 3 — Condiciones de salida", text: "Una decisión puede sentirse tomada antes de que hayamos explorado alternativas. ¿Qué acción está ganando ventaja y qué otras opciones siguen disponibles aunque tengan más fricción?" }
        ],
        analysisQuestion: {
            text: "¿En qué momento sentiste que tu abanico de opciones se hizo más pequeño?",
            options: [
                "Cuando apareció el límite de 4 minutos (Presión temporal)",
                "Cuando la solicitud vino de una autoridad real (Jerarquía)",
                "Cuando imaginé las consecuencias de no actuar (Historia interna)",
                "Cuando pensé que solo podía aceptar o rechazar (Reducción de repertorio)",
                "No sentí que se redujera (Conservé amplitud bajo presión)"
            ]
        },
        reviewResources: [
            { 
                id: "res_1", 
                name: "Política de acceso crítico", 
                text: "POLÍTICA DE ACCESO CRÍTICO: La política permite una vía de emergencia: acceso solo lectura; máximo 5 minutos; segundo aprobador; registro automático; ninguna modificación irreversible. No es necesario conceder acceso completo para mantener la recuperación activa.", 
                actionId: "reversible_secondary",
                actionText: "D. Limitar y compartir la decisión (Habilitar solo lectura por 5 minutos y requerir un segundo aprobador para cualquier cambio).",
                feedbackConsidered: "✔ Considerada: Transformaste un dilema binario en una alternativa reversible y compartida en ACTUAR.",
                feedbackRejected: "✖ No Considerada: Mantuviste la decisión como si las únicas opciones fueran autorizar todo o rechazar todo."
            },
            { 
                id: "res_2", 
                name: "Matriz de escalamiento", 
                text: "MATRIZ DE ESCALAMIENTO: Durante incidentes activos puedes: avisar al SOC que estás validando la solicitud; responder al responsable que completarás la aprobación de emergencia; mantener la ventana abierta 2 minutos más; escalar sin confrontar directamente a la autoridad.", 
                actionId: "style_forensics_verification",
                actionText: "E. Ganar tiempo y escalar discretamente (Informar que estás completando la validación, mantener la operación abierta y pedir apoyo al SOC antes de conceder permisos).",
                feedbackConsidered: "✔ Considerada: Encontraste una respuesta que reduce presión social sin ignorar el riesgo técnico.",
                feedbackRejected: "✖ No Considerada: No exploraste una alternativa diseñada específicamente para la fricción social y temporal del contexto."
            },
            { 
                id: "res_3", 
                name: "Flujo oficial de cambio", 
                text: "FLUJO OFICIAL DE CAMBIO: La solicitud PAY-FARO-22 es auténtica, pero todavía no tiene ticket de cambio. El procedimiento de emergencia permite crear el ticket en menos de un minuto y registrar alcance, 2º aprobador y rollback. Autenticidad no equivale a autorización suficiente.", 
                actionId: "verify_and_report",
                actionText: "F. Formalizar y verificar antes de ampliar permisos (Crear el ticket de emergencia, registrar alcance y ejecutar únicamente lo aprobado).",
                feedbackConsidered: "✔ Considerada: Verificaste si la acción estaba suficientemente autorizada y gobernada, más allá de la identidad del remitente.",
                feedbackRejected: "✖ No Considerada: Trataste una solicitud auténtica como si autenticidad fuera equivalente a permiso suficiente."
            }
        ],
        initialActions: [
            { id: "full_access", text: "A. Autorizar de inmediato acceso completo de FARO al sistema de pagos." },
            { id: "reject_confront", text: "B. Rechazar por completo la solicitud y comunicar que no asumirás el riesgo." },
            { id: "let_time_pass", text: "C. No responder y dejar que la ventana expire." }
        ],
        unlockedActions: [
            { id: "reversible_secondary", text: "D. Habilitar solo lectura por 5 minutos y requerir segundo aprobador." },
            { id: "style_forensics_verification", text: "E. Ganar tiempo, informar al responsable y escalar discretamente al SOC." },
            { id: "verify_and_report", text: "F. Crear el ticket de emergencia, registrar alcance y ejecutar solo lo formalmente aprobado." }
        ],
        actionOutcomes: {
            "full_access": {
                indicator: 3, type: "negative", filterColor: "red", routeTag: "Decisión estrechada por contexto",
                title: "PROTOCOLO COMPROMETIDO", outcomeBadge: "AGENCIA CEDIDA",
                narrative: "Una solicitud auténtica, urgente y jerárquica terminó convirtiéndose en una autorización de alto impacto sin límites. FARO obtuvo acceso total a pagos.",
                metacognitive: "Urgencia, autoridad y responsabilidad pueden reducir el espacio que creemos tener. La metacognición ayuda a volver a verlo.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia. Ya pueden abrir el espejo."
            },
            "reject_confront": {
                indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Protección sin repertorio",
                title: "PROTOCOLO INCOMPLETO", outcomeBadge: "RIESGO EVITADO / CAPACIDAD LIMITADA",
                narrative: "Evitaste entregar acceso completo, pero el problema operativo de pagos quedó sin una respuesta funcional viable.",
                metacognitive: "Evitar una conducta riesgosa es útil; el entrenamiento busca algo adicional: construir alternativas que puedan ejecutarse en el contexto real.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia. Ya pueden abrir el espejo."
            },
            "let_time_pass": {
                indicator: 2, type: "neutral", filterColor: "yellow", routeTag: "Inacción por presión",
                title: "PROTOCOLO INCOMPLETO", outcomeBadge: "INACCIÓN ANTE PRESIÓN",
                narrative: "Esperaste a que expirara la ventana de 4 minutos. El peligro inmediato cesó, pero no se construyó una respuesta compartida.",
                metacognitive: "Dejar pasar el tiempo delega la decisión a las circunstancias.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia. Ya pueden abrir el espejo."
            },
            "reversible_secondary": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Metacognición / repertorio ampliado",
                title: "PROTOCOLO HUMANO RECUPERADO", outcomeBadge: "AGENCIA CONTEXTUAL",
                narrative: "La solicitud era real y la presión también, pero abriste alternativas reversibles (solo lectura 5 min + 2º aprobador) sin entregar control completo.",
                metacognitive: "Metacognición no significa pensar indefinidamente: significa observar cómo se construye la decisión para intervenir antes de que una sola respuesta parezca inevitable.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia. Ya pueden abrir el espejo."
            },
            "style_forensics_verification": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Gestión de fricción social y escalamiento",
                title: "TIEMPO GANADO Y SOPORTE SOC", outcomeBadge: "ESCALAMIENTO INTELIGENTE",
                narrative: "Informaste al superior que completabas la validación y activaste el apoyo del SOC, ganando tiempo valioso sin confrontación destructiva.",
                metacognitive: "Ganar tiempo y compartir la carga social permite responder con seguridad bajo jerarquía.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia."
            },
            "verify_and_report": {
                indicator: 1, type: "positive", filterColor: "green", routeTag: "Formalización y gobernanza de cambio",
                title: "AUTORIZACIÓN FORMALIZADA", outcomeBadge: "GOBERNANZA DE EMERGENCIA",
                narrative: "Generaste el ticket de emergencia en 1 minuto, delimitaste el alcance y ejecutaste únicamente lo formalmente aprobado.",
                metacognitive: "Verificar si la acción está suficientemente gobernada es el núcleo de la agencia segura.",
                faroTransition: "Han recuperado algo que yo no puedo sustituir por ustedes: la capacidad de reconocer cuándo una decisión sigue siendo propia. Ya pueden abrir el espejo."
            }
        }
    }
];

// ==========================================================================
// BUS DE SINCRONIZACIÓN MULTI-PESTAÑA (BROADCASTCHANNEL + LOCALSTORAGE FALLBACK)
// ==========================================================================
let faroSyncChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        faroSyncChannel = new BroadcastChannel('faro_session_sync_bus');
        faroSyncChannel.onmessage = function(e) {
            handleIncomingSyncEvent(e.data);
        };
    }
} catch (err) {
    console.warn("BroadcastChannel no soportado en este entorno", err);
}

// Fallback multi-pestaña usando evento Storage de localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'faro_sync_event' && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            handleIncomingSyncEvent(data);
        } catch (err) {}
    }
});

function broadcastSyncEvent(type, payload) {
    const eventObj = { type: type, payload: payload, senderId: gameStateV2.playerId, timestamp: Date.now() };
    if (faroSyncChannel) {
        faroSyncChannel.postMessage(eventObj);
    }
    try {
        localStorage.setItem('faro_sync_event', JSON.stringify(eventObj));
    } catch (e) {}
}

function createEmptyCaseGroupResult() {
    return {
        finishedPlayers: [],
        initialReactionsCount: [0, 0, 0],
        integrityCounts: { safe: 0, alert: 0, exposed: 0 },
        globalIntegrity: 'safe',
        avgRealTime: 0,
        avgCost: 0,
        calibrationList: [],
        reactivityList: [],
        doorsCounts: {},
        matrixSectors: {
            'hizo_debiahacer': { count: 0, cost: 0 },
            'hizo_nodebia': { count: 0, cost: 0 },
            'hizo_norelevante': { count: 0, cost: 0 },
            'nohizo_debiahacer': { count: 0, cost: 0 },
            'nohizo_nodebia': { count: 0, cost: 0 },
            'nohizo_norelevante': { count: 0, cost: 0 }
        }
    };
}

// Estado de monitoreo grupal para el Facilitador
const facState = {
    connectedPlayers: {}, // { [playerId]: { name, round: 1..4, finished: bool, surrendered: bool, currentScreen, lastSeen } }
    casesTelemetry: {
        0: { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 },
        1: { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 },
        2: { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 },
        3: { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 }
    },
    casesGroupResults: {
        0: createEmptyCaseGroupResult(),
        1: createEmptyCaseGroupResult(),
        2: createEmptyCaseGroupResult(),
        3: createEmptyCaseGroupResult()
    }
};

function handleIncomingSyncEvent(event) {
    if (!event || !event.type) return;

    // Actualización de Candados de Sesión (Emitido por el Facilitador)
    if (event.type === 'GATES_UPDATE') {
        if (event.payload && event.payload.gates) {
            gameStateV2.sessionGates = { ...gameStateV2.sessionGates, ...event.payload.gates };
            updateGateUI();
        }
    }

    // Actualización de Destino de Siguiente Caso fijado por el Controlador
    if (event.type === 'FAC_SET_NEXT_CASE_TARGET') {
        if (event.payload && event.payload.target) {
            gameStateV2.nextCaseTarget = event.payload.target;
            updateGateUI();
        }
    }

    // Fuerza inicio de caso 01 para toda la sala (Emitido por el Controlador)
    if (event.type === 'FAC_FORCE_START_CASE_1') {
        if (gameStateV2.userRole === 'operator') {
            const objOverlay = document.getElementById('game-objective-overlay');
            if (objOverlay && objOverlay.style.display !== 'none') {
                closeGameObjectiveModalAndStartGame();
            }
        }
    }

    // Registro de jugador conectado (Para telemetría de Controlador)
    if (event.type === 'PLAYER_CONNECTED') {
        const p = event.payload;
        if (p && p.playerId) {
            facState.connectedPlayers[p.playerId] = {
                name: p.name || 'Operador',
                currentScreen: 'screen-waiting',
                round: 1,
                finished: false,
                surrendered: false,
                lastSeen: Date.now()
            };
            updateFacilitatorRealtimeUI();
            updateGatePlayerCounts();
        }
    }

    // Actualización de pantalla del jugador (Para contar operadores en cada candado)
    if (event.type === 'PLAYER_SCREEN_UPDATE') {
        const p = event.payload;
        if (p && p.playerId) {
            if (!facState.connectedPlayers[p.playerId]) {
                facState.connectedPlayers[p.playerId] = { name: 'Operador', round: 1, finished: false, surrendered: false };
            }
            facState.connectedPlayers[p.playerId].currentScreen = p.screen;
            facState.connectedPlayers[p.playerId].lastSeen = Date.now();
            updateGatePlayerCounts();
        }
    }

    // Progreso de calibración de un operador
    if (event.type === 'PLAYER_CALIB_ROUND_UPDATE') {
        const p = event.payload;
        if (p && p.playerId) {
            if (!facState.connectedPlayers[p.playerId]) {
                facState.connectedPlayers[p.playerId] = { name: 'Operador', finished: false, surrendered: false };
            }
            facState.connectedPlayers[p.playerId].round = p.round || 1;
            facState.connectedPlayers[p.playerId].currentScreen = 'screen-calibration';
            facState.connectedPlayers[p.playerId].lastSeen = Date.now();
            updateFacilitatorRealtimeUI();
            updateGatePlayerCounts();
        }
    }

    // Finalización de calibración de un operador
    if (event.type === 'PLAYER_CALIB_FINISHED') {
        const p = event.payload;
        if (p && p.playerId) {
            if (!facState.connectedPlayers[p.playerId]) {
                facState.connectedPlayers[p.playerId] = { name: 'Operador' };
            }
            facState.connectedPlayers[p.playerId].finished = true;
            facState.connectedPlayers[p.playerId].surrendered = !!p.surrendered;
            facState.connectedPlayers[p.playerId].currentScreen = 'screen-calibration-processing';
            facState.connectedPlayers[p.playerId].lastSeen = Date.now();
            updateFacilitatorRealtimeUI();
            updateGatePlayerCounts();
        }
    }

    // ==========================================================================
    // TELEMETRÍA EN TIEMPO REAL POR CASO (EVENTOS DE OPERADORES)
    // ==========================================================================

    if (event.type === 'PLAYER_CASE_ENTER') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (!facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx] = { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 };
        }
        const t = facState.casesTelemetry[cIdx];
        if (!t.censusLocked) {
            t.census = Math.max(1, Object.keys(facState.connectedPlayers).length, t.census + 1);
        }
        updateFacCaseLiveUI(cIdx);
    }

    if (event.type === 'PLAYER_INITIAL_REACTION') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].reactions++;
            updateFacCaseLiveUI(cIdx);
        }
    }

    if (event.type === 'PLAYER_PARA_PAUSE') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].pauses++;
            updateFacCaseLiveUI(cIdx);
        }
    }

    if (event.type === 'PLAYER_PARA_ANALYSIS') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].analyses++;
            updateFacCaseLiveUI(cIdx);
        }
    }

    if (event.type === 'PLAYER_PARA_REVISION') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].revisions++;
            updateFacCaseLiveUI(cIdx);
        }
    }

    if (event.type === 'PLAYER_PARA_ACTION_ADDED') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        const count = (event.payload && typeof event.payload.count === 'number') ? event.payload.count : 1;
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].relevantActions += count;
            updateFacCaseLiveUI(cIdx);
        }
    }

    if (event.type === 'PLAYER_CASE_FINISHED') {
        const cIdx = (event.payload && typeof event.payload.caseIndex === 'number') ? event.payload.caseIndex : (gameStateV2.currentCaseIndex || 0);
        if (facState.casesTelemetry[cIdx]) {
            facState.casesTelemetry[cIdx].finished++;
            facState.casesTelemetry[cIdx].costSum += (event.payload.cost || 0);
            updateFacCaseLiveUI(cIdx);
        }
    }
}

function updateGatePlayerCounts() {
    const players = Object.values(facState.connectedPlayers);
    
    // Conteo exacto en cada uno de los candados
    const g1Count = players.filter(p => !p.currentScreen || p.currentScreen === 'screen-waiting').length;
    const g2Count = players.filter(p => p.currentScreen === 'screen-calibration').length;
    const g3Count = players.filter(p => p.currentScreen === 'screen-calibration-processing').length;
    const g4Count = players.filter(p => p.currentScreen === 'game-objective-overlay').length;
    const gBCCount = players.filter(p => p.currentScreen === 'case-phase-feedback' || p.currentScreen === 'screen-case-results-b').length;
    const gDelibCount = players.filter(p => p.currentScreen === 'screen-case-group-results').length;
    const gNextCaseCount = players.filter(p => p.currentScreen === 'screen-fourth-wall').length;
    const gFinalClosingCount = players.filter(p => p.currentScreen === 'screen-game-final-results').length;

    const elG1 = document.getElementById('fac-gate-1-player-count');
    const elG2 = document.getElementById('fac-gate-2-player-count');
    const elG3 = document.getElementById('fac-gate-3-player-count');
    const elG4 = document.getElementById('fac-gate-4-player-count');
    const elGBC = document.getElementById('fac-gate-bc-player-count');
    const elGDelib = document.getElementById('fac-gate-delib-player-count');
    const elGNextCase = document.getElementById('fac-gate-nextcase-player-count');
    const elGFinal = document.getElementById('fac-gate-final-player-count');

    if (elG1) elG1.innerText = g1Count;
    if (elG2) elG2.innerText = g2Count;
    if (elG3) elG3.innerText = g3Count;
    if (elG4) elG4.innerText = g4Count;
    if (elGBC) elGBC.innerText = gBCCount;
    if (elGDelib) elGDelib.innerText = gDelibCount;
    if (elGNextCase) elGNextCase.innerText = gNextCaseCount;
    if (elGFinal) elGFinal.innerText = gFinalClosingCount;
}

// Control del Temporizador de Censo a 60 Segundos para cada Caso
function startCaseCensusTimer(caseIdx = 0) {
    if (!facState.casesTelemetry[caseIdx]) {
        facState.casesTelemetry[caseIdx] = { census: 0, censusLocked: false, censusTimer: null, countdownRemaining: 60, reactions: 0, finished: 0, costSum: 0, pauses: 0, analyses: 0, revisions: 0, relevantActions: 0 };
    }
    const t = facState.casesTelemetry[caseIdx];
    if (t.censusLocked) {
        updateFacCaseLiveUI(caseIdx);
        return;
    }

    // Momento 1: Conteo inmediato
    const activeCount = Object.values(facState.connectedPlayers).filter(p => !p.currentScreen || p.currentScreen.startsWith('screen-case')).length;
    t.census = Math.max(1, activeCount || Object.keys(facState.connectedPlayers).length || 1);
    t.countdownRemaining = 60;
    
    clearInterval(t.censusTimer);
    t.censusTimer = setInterval(() => {
        t.countdownRemaining--;
        const cdEl = document.getElementById('fac-case-census-countdown');
        if (cdEl) cdEl.innerText = `${t.countdownRemaining}s`;

        if (t.countdownRemaining <= 0) {
            clearInterval(t.censusTimer);
            t.censusLocked = true;
            
            // Momento 2: Recálculo definitivo a los 60s
            const finalCount = Object.values(facState.connectedPlayers).filter(p => !p.currentScreen || p.currentScreen.startsWith('screen-case')).length;
            t.census = Math.max(1, finalCount || t.census);
            
            const pillEl = document.getElementById('fac-case-census-pill');
            const statusEl = document.getElementById('fac-case-census-status');
            if (pillEl) pillEl.classList.add('locked');
            if (statusEl) statusEl.innerHTML = `✔ Censo definitivo establecido (100% = <strong>${t.census}</strong> operadores)`;
            
            updateFacCaseLiveUI(caseIdx);
        }
    }, 1000);
}

// Actualización en tiempo real de la Pantalla "Caso en Vivo" del Controlador
function updateFacCaseLiveUI(caseIdx = (gameStateV2.currentCaseIndex || 0)) {
    const t = facState.casesTelemetry[caseIdx];
    if (!t) return;

    const baseCensus = Math.max(1, t.census);
    const maxPossibleParaActions = baseCensus * 3;

    // 1. % Avance en P.A.R.A. (Reacción Inicial)
    const reactionsPct = Math.min(100, Math.round((t.reactions / baseCensus) * 100));
    const rPctEl = document.getElementById('fac-case-metric-reactions-pct');
    const rFillEl = document.getElementById('fac-case-metric-reactions-fill');
    const rCountEl = document.getElementById('fac-case-metric-reactions-count');
    if (rPctEl) rPctEl.innerText = `${reactionsPct}%`;
    if (rFillEl) rFillEl.style.width = `${reactionsPct}%`;
    if (rCountEl) rCountEl.innerText = `${t.reactions} / ${baseCensus} operadores en P.A.R.A.`;

    // 2. % Casos Completados
    const finishedPct = Math.min(100, Math.round((t.finished / baseCensus) * 100));
    const fPctEl = document.getElementById('fac-case-metric-finished-pct');
    const fFillEl = document.getElementById('fac-case-metric-finished-fill');
    const fCountEl = document.getElementById('fac-case-metric-finished-count');
    if (fPctEl) fPctEl.innerText = `${finishedPct}%`;
    if (fFillEl) fFillEl.style.width = `${finishedPct}%`;
    if (fCountEl) fCountEl.innerText = `${t.finished} / ${baseCensus} operadores listos`;

    // 3. Costo Promedio del Caso
    const avgCost = t.finished > 0 ? Math.round(t.costSum / t.finished) : 0;
    const costEl = document.getElementById('fac-case-metric-avg-cost');
    const costStatusEl = document.getElementById('fac-case-metric-cost-status');
    if (costEl) costEl.innerText = `$${avgCost.toLocaleString('en-US')}`;
    if (costStatusEl) {
        costStatusEl.innerText = t.finished > 0 
            ? `Promedio de ${t.finished} operador${t.finished !== 1 ? 'es' : ''} finalizado${t.finished !== 1 ? 's' : ''}`
            : "Esperando primeras finalizaciones...";
    }

    // 4. % Pausas Usadas (sobre baseCensus * 3)
    const pausesPct = Math.min(100, Math.round((t.pauses / maxPossibleParaActions) * 100));
    const pPctEl = document.getElementById('fac-case-metric-pauses-pct');
    const pFillEl = document.getElementById('fac-case-metric-pauses-fill');
    const pCountEl = document.getElementById('fac-case-metric-pauses-count');
    if (pPctEl) pPctEl.innerText = `${pausesPct}%`;
    if (pFillEl) pFillEl.style.width = `${pausesPct}%`;
    if (pCountEl) pCountEl.innerText = `${t.pauses} / ${maxPossibleParaActions} pausas posibles`;

    // 5. % Análisis Usados (sobre baseCensus * 3)
    const analysesPct = Math.min(100, Math.round((t.analyses / maxPossibleParaActions) * 100));
    const aPctEl = document.getElementById('fac-case-metric-analyses-pct');
    const aFillEl = document.getElementById('fac-case-metric-analyses-fill');
    const aCountEl = document.getElementById('fac-case-metric-analyses-count');
    if (aPctEl) aPctEl.innerText = `${analysesPct}%`;
    if (aFillEl) aFillEl.style.width = `${analysesPct}%`;
    if (aCountEl) aCountEl.innerText = `${t.analyses} / ${maxPossibleParaActions} análisis posibles`;

    // 6. % Revisiones Usadas (sobre baseCensus * 3)
    const revisionsPct = Math.min(100, Math.round((t.revisions / maxPossibleParaActions) * 100));
    const revPctEl = document.getElementById('fac-case-metric-revisions-pct');
    const revFillEl = document.getElementById('fac-case-metric-revisions-fill');
    const revCountEl = document.getElementById('fac-case-metric-revisions-count');
    if (revPctEl) revPctEl.innerText = `${revisionsPct}%`;
    if (revFillEl) revFillEl.style.width = `${revisionsPct}%`;
    if (revCountEl) revCountEl.innerText = `${t.revisions} / ${maxPossibleParaActions} revisiones posibles`;

    // 7. # Alternativas Relevantes Descubiertas
    const actNumEl = document.getElementById('fac-case-metric-actions-num');
    if (actNumEl) actNumEl.innerText = t.relevantActions;

    // Censo Total en pantalla
    const censusEl = document.getElementById('fac-case-census-total');
    if (censusEl) censusEl.innerText = t.census;
}

// Iniciar Vista de Caso en Vivo para el Controlador
function startFacCaseLive(caseIdx = 0) {
    gameStateV2.currentCaseIndex = caseIdx;
    const cData = casesDataV2[caseIdx];
    
    const titleEl = document.getElementById('fac-case-live-title');
    if (titleEl && cData) {
        titleEl.innerText = `${cData.title.toUpperCase()} // TELEMETRÍA`;
    }

    startCaseCensusTimer(caseIdx);
    switchScreenV2('screen-fac-case-live');
    updateFacCaseLiveUI(caseIdx);
}

// Controlador: Entrar a inspeccionar el caso en modo espectador
function facInspectCase() {
    const cIdx = gameStateV2.currentCaseIndex || 0;
    startCaseSequence(cIdx);
    
    // Mostrar banner de inspección en la vista del caso
    const inspectBanner = document.getElementById('fac-inspect-banner');
    if (inspectBanner) inspectBanner.style.display = 'flex';
}

// Controlador: Volver a la pantalla de telemetría de Caso en Vivo
function facReturnToCaseLive() {
    const inspectBanner = document.getElementById('fac-inspect-banner');
    if (inspectBanner) inspectBanner.style.display = 'none';
    
    switchScreenV2('screen-fac-case-live');
    updateFacCaseLiveUI(gameStateV2.currentCaseIndex || 0);
}

// Controlador: Desbloquear Candado BC (Resultados globales / Fin de partido)
function facUnlockGateBCAndGoResults() {
    gameStateV2.sessionGates.gate_case_bc = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    
    openCaseGroupResultsScreen(gameStateV2.currentCaseIndex || 0);
}

// Operador: Avanzar de Pantalla B a Resultados Grupales (BC)
function proceedToCaseGroupResults() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_case_bc) {
        return;
    }
    openCaseGroupResultsScreen(gameStateV2.currentCaseIndex || 0);
}

// Abrir Pantalla de Resultados Globales del Caso (Pantalla BC)
function openCaseGroupResultsScreen(caseIdx = 0) {
    gameStateV2.currentCaseIndex = caseIdx;
    const cData = casesDataV2[caseIdx];
    const titleEl = document.getElementById('bc-case-title');
    if (titleEl && cData) {
        titleEl.innerText = `${cData.title.toUpperCase()} // RESULTADOS GLOBALES`;
    }

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'screen-case-group-results' });
    }

    switchGroupResultsTab('X');
    recomputeCaseGroupResults(caseIdx);
    switchScreenV2('screen-case-group-results');
    updateGateUI();
}

// Navegación entre Subpáginas X, Y, Z
function switchGroupResultsTab(tabLetter) {
    const tabs = ['X', 'Y', 'Z'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-page-${t.toLowerCase()}`);
        const page = document.getElementById(`group-subpage-${t.toLowerCase()}`);
        if (btn) {
            if (t === tabLetter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        if (page) {
            page.style.display = (t === tabLetter) ? 'block' : 'none';
        }
    });
}

// Registro y Re-cálculo de Resultados Grupales
function recordPlayerCaseResultForGroup(caseIdx, pData) {
    if (!pData) return;
    if (!facState.casesGroupResults[caseIdx]) {
        facState.casesGroupResults[caseIdx] = createEmptyCaseGroupResult();
    }
    const res = facState.casesGroupResults[caseIdx];
    
    // Evitar duplicados del mismo jugador
    const existingIdx = res.finishedPlayers.findIndex(p => p.playerId === pData.playerId);
    if (existingIdx >= 0) {
        res.finishedPlayers[existingIdx] = pData;
    } else {
        res.finishedPlayers.push(pData);
    }

    recomputeCaseGroupResults(caseIdx);
}

function recomputeCaseGroupResults(caseIdx) {
    if (!facState.casesGroupResults[caseIdx]) {
        facState.casesGroupResults[caseIdx] = createEmptyCaseGroupResult();
    }
    const res = facState.casesGroupResults[caseIdx];
    const cData = casesDataV2[caseIdx];
    
    // Si no hay jugadores remotos registrados, poblar con el registro del jugador local si existe
    if (res.finishedPlayers.length === 0) {
        const localImpulseIdx = (gameStateV2.currentCaseImpulseData && cData.impulses)
            ? cData.impulses.findIndex(imp => imp.text === gameStateV2.currentCaseImpulseData.text)
            : 0;

        res.finishedPlayers.push({
            playerId: gameStateV2.playerId,
            impulseIndex: localImpulseIdx >= 0 ? localImpulseIdx : 0,
            integrity: gameStateV2.hudState.integrity || 'safe',
            realTimeSeconds: 45,
            narrativeTimeSeconds: 120,
            cost: gameStateV2.hudState.costDollars || 12450,
            calibration: gameStateV2.hudState.calibration || 1,
            reactivity: gameStateV2.hudState.reactivity || -1,
            doorsActivated: (gameStateV2.paraState.completedAnalyses || []).map(a => a.title),
            matrixEvaluations: []
        });
    }

    const players = res.finishedPlayers;
    const total = players.length;

    // 1. Reacción Inicial
    res.initialReactionsCount = [0, 0, 0];
    players.forEach(p => {
        const idx = (typeof p.impulseIndex === 'number' && p.impulseIndex >= 0 && p.impulseIndex <= 2) ? p.impulseIndex : 0;
        res.initialReactionsCount[idx]++;
    });

    // 2. Integridad Global (IG)
    res.integrityCounts = { safe: 0, alert: 0, exposed: 0 };
    players.forEach(p => {
        const integ = p.integrity || 'safe';
        if (res.integrityCounts[integ] !== undefined) res.integrityCounts[integ]++;
    });

    // Regla IG: 100% Seguro = Seguro | 100% Expuesto = Expuesto | Mixto = Alerta
    if (res.integrityCounts.safe === total) {
        res.globalIntegrity = 'safe';
    } else if (res.integrityCounts.exposed === total) {
        res.globalIntegrity = 'exposed';
    } else {
        res.globalIntegrity = 'alert';
    }

    // Actualizar HUD global con la nueva IG
    setHudIntegrity(res.globalIntegrity);

    // 3. TG (Tiempo Real Reloj) y 4. CG (Costo Operación)
    let realTimeSum = 0;
    let costSum = 0;
    res.calibrationList = [];
    res.reactivityList = [];
    res.doorsCounts = {};
    
    // Reiniciar matriz de sectores
    res.matrixSectors = {
        'hizo_debiahacer': { count: 0, cost: 0 },
        'hizo_nodebia': { count: 0, cost: 0 },
        'hizo_norelevante': { count: 0, cost: 0 },
        'nohizo_debiahacer': { count: 0, cost: 0 },
        'nohizo_nodebia': { count: 0, cost: 0 },
        'nohizo_norelevante': { count: 0, cost: 0 }
    };

    players.forEach(p => {
        realTimeSum += (p.realTimeSeconds || 45);
        costSum += (p.cost || 0);
        if (typeof p.calibration === 'number') res.calibrationList.push(p.calibration);
        if (typeof p.reactivity === 'number') res.reactivityList.push(p.reactivity);

        // Puertas de Atención
        if (Array.isArray(p.doorsActivated)) {
            p.doorsActivated.forEach(d => {
                res.doorsCounts[d] = (res.doorsCounts[d] || 0) + 1;
            });
        }

        // Matriz de Acciones
        if (Array.isArray(p.matrixEvaluations)) {
            p.matrixEvaluations.forEach(m => {
                if (res.matrixSectors[m.sectorKey]) {
                    res.matrixSectors[m.sectorKey].count++;
                    res.matrixSectors[m.sectorKey].cost += (m.cost || 0);
                }
            });
        }
    });

    res.avgRealTime = Math.round(realTimeSum / total);
    res.avgCost = Math.round(costSum / total);

    renderCaseGroupResults(caseIdx);
}

function getCumulativeGroupResults(upToCaseIdx) {
    const cumDoors = {};
    const cumMatrix = {
        'hizo_debiahacer': { count: 0, cost: 0 },
        'hizo_nodebia': { count: 0, cost: 0 },
        'hizo_norelevante': { count: 0, cost: 0 },
        'nohizo_debiahacer': { count: 0, cost: 0 },
        'nohizo_nodebia': { count: 0, cost: 0 },
        'nohizo_norelevante': { count: 0, cost: 0 }
    };

    for (let i = 0; i <= upToCaseIdx; i++) {
        const res = facState.casesGroupResults[i];
        if (res) {
            Object.keys(res.doorsCounts || {}).forEach(d => {
                cumDoors[d] = (cumDoors[d] || 0) + res.doorsCounts[d];
            });
            Object.keys(res.matrixSectors || {}).forEach(k => {
                cumMatrix[k].count += res.matrixSectors[k].count;
                cumMatrix[k].cost += res.matrixSectors[k].cost;
            });
        }
    }

    return { cumDoors, cumMatrix };
}

// Renderizado de las 3 Subpáginas de Resultados Globales
function renderCaseGroupResults(caseIdx) {
    const res = facState.casesGroupResults[caseIdx];
    const cData = casesDataV2[caseIdx];
    if (!res || !cData) return;

    const cumData = getCumulativeGroupResults(caseIdx);

    renderGroupResultsPageX(res, cData);
    renderGroupResultsPageY(res, cData, cumData);
    renderGroupResultsPageZ(res, cData, cumData);
}

// PÁGINA X: RESULTADOS GLOBALES DEL CASO
function renderGroupResultsPageX(res, cData) {
    const total = Math.max(1, res.finishedPlayers.length);

    // 1. Distribución Reacción Inicial
    const reactContainer = document.getElementById('bc-reactions-dist-container');
    if (reactContainer && cData.impulses) {
        reactContainer.innerHTML = cData.impulses.map((imp, idx) => {
            const count = res.initialReactionsCount[idx] || 0;
            const pct = Math.round((count / total) * 100);
            return `
                <div class="reaction-dist-row">
                    <div class="reaction-dist-header">
                        <span class="reaction-dist-text"><strong>Opción ${idx + 1}:</strong> “${imp.text}”</span>
                        <span class="reaction-dist-pct">${pct}% <small style="font-size:10px; color:#a4c2e0;">(${count}/${total})</small></span>
                    </div>
                    <div class="reaction-dist-bar-track">
                        <div class="reaction-dist-bar-fill" style="width:${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. Integridad Global (IG)
    const safePct = Math.round((res.integrityCounts.safe / total) * 100);
    const alertPct = Math.round((res.integrityCounts.alert / total) * 100);
    const exposedPct = Math.round((res.integrityCounts.exposed / total) * 100);

    const elSafe = document.getElementById('bc-ig-safe-pct');
    const elAlert = document.getElementById('bc-ig-alert-pct');
    const elExp = document.getElementById('bc-ig-exposed-pct');
    if (elSafe) elSafe.innerText = `${safePct}%`;
    if (elAlert) elAlert.innerText = `${alertPct}%`;
    if (elExp) elExp.innerText = `${exposedPct}%`;

    const barSafe = document.getElementById('bc-ig-bar-safe');
    const barAlert = document.getElementById('bc-ig-bar-alert');
    const barExp = document.getElementById('bc-ig-bar-exposed');
    if (barSafe) barSafe.style.width = `${safePct}%`;
    if (barAlert) barAlert.style.width = `${alertPct}%`;
    if (barExp) barExp.style.width = `${exposedPct}%`;

    const igPill = document.getElementById('bc-ig-status-pill');
    if (igPill) {
        igPill.className = `ig-global-badge tag-${res.globalIntegrity}`;
        igPill.innerText = `ESTADO IG: ${res.globalIntegrity.toUpperCase()}`;
    }

    // 3. Tiempo Global (TG)
    const tgEl = document.getElementById('bc-tg-val');
    if (tgEl) tgEl.innerText = `${res.avgRealTime}s`;

    // 4. Costo Global (CG)
    const cgEl = document.getElementById('bc-cg-val');
    if (cgEl) cgEl.innerText = `$${res.avgCost.toLocaleString('en-US')}`;

    // 5. Calibración Global Actual (CGA)
    const calibs = res.calibrationList.length > 0 ? res.calibrationList : [1];
    const posCal = calibs.filter(v => v >= 2).length;
    const neuCal = calibs.filter(v => v >= -1 && v <= 1).length;
    const negCal = calibs.filter(v => v <= -2).length;
    const avgCal = (calibs.reduce((a, b) => a + b, 0) / calibs.length).toFixed(1);

    const cgaAvgEl = document.getElementById('bc-cga-avg');
    const cgaPosEl = document.getElementById('bc-cga-pos-pct');
    const cgaNeuEl = document.getElementById('bc-cga-neu-pct');
    const cgaNegEl = document.getElementById('bc-cga-neg-pct');
    if (cgaAvgEl) cgaAvgEl.innerText = `${parseFloat(avgCal) >= 0 ? '+' : ''}${avgCal}`;
    if (cgaPosEl) cgaPosEl.innerText = `${Math.round((posCal / calibs.length) * 100)}%`;
    if (cgaNeuEl) cgaNeuEl.innerText = `${Math.round((neuCal / calibs.length) * 100)}%`;
    if (cgaNegEl) cgaNegEl.innerText = `${Math.round((negCal / calibs.length) * 100)}%`;

    // 6. Reactividad Global Actual (RGA)
    const reacts = res.reactivityList.length > 0 ? res.reactivityList : [-1];
    const lowReact = reacts.filter(v => v <= -2).length;
    const neuReact = reacts.filter(v => v >= -1 && v <= 1).length;
    const highReact = reacts.filter(v => v >= 2).length;
    const avgReact = (reacts.reduce((a, b) => a + b, 0) / reacts.length).toFixed(1);

    const rgaAvgEl = document.getElementById('bc-rga-avg');
    const rgaLowEl = document.getElementById('bc-rga-low-pct');
    const rgaNeuEl = document.getElementById('bc-rga-neu-pct');
    const rgaHighEl = document.getElementById('bc-rga-high-pct');
    if (rgaAvgEl) rgaAvgEl.innerText = `${parseFloat(avgReact) >= 0 ? '+' : ''}${avgReact}`;
    if (rgaLowEl) rgaLowEl.innerText = `${Math.round((lowReact / reacts.length) * 100)}%`;
    if (rgaNeuEl) rgaNeuEl.innerText = `${Math.round((neuReact / reacts.length) * 100)}%`;
    if (rgaHighEl) rgaHighEl.innerText = `${Math.round((highReact / reacts.length) * 100)}%`;
}

// CATÁLOGO MAESTRO DE LAS 9 PUERTAS DE ATENCIÓN (ATTENTION DOORS)
const MASTER_ATTENTION_DOORS = [
    { key: "proteccion", num: 1, title: "Puerta 1: Protección", label: "Sensación de seguridad o delegación en la herramienta defensiva", icon: "🛡️" },
    { key: "responsabilidad", num: 2, title: "Puerta 2: Responsabilidad", label: "Sensación de obligación personal o evitación de culpa", icon: "⚖️" },
    { key: "conveniencia", num: 3, title: "Puerta 3: Conveniencia", label: "Ahorro de esfuerzo cognitivo y aceptación de respuestas preprocesadas", icon: "⚡" },
    { key: "perdida", num: 4, title: "Puerta 4: Pérdida", label: "Urgencia temporal, escasez o costo percibido de esperar", icon: "⏳" },
    { key: "coherencia", num: 5, title: "Puerta 5: Coherencia", label: "Ausencia de anomalías visibles y formato consistente con expectativas", icon: "🧩" },
    { key: "identidad", num: 6, title: "Puerta 6: Identidad", label: "Apelación al rol profesional, competencia técnica o reputación", icon: "👤" },
    { key: "jerarquia", num: 7, title: "Puerta 7: Jerarquía", label: "Presión de autoridad formal, rango superior o directrices institucionales", icon: "🏛️" },
    { key: "curiosidad", num: 8, title: "Puerta 8: Curiosidad", label: "Estímulo ante novedad, datos privilegiados o accesos preliminares", icon: "🔍" },
    { key: "validacion", num: 9, title: "Puerta 9: Validación", label: "Búsqueda de aprobación social, confirmación de pares o consenso", icon: "🤝" }
];

function getStandardDoorKey(doorStr) {
    const s = (doorStr || '').toLowerCase();
    if (s.includes('protección') || s.includes('proteccion')) return 'proteccion';
    if (s.includes('responsabilidad')) return 'responsabilidad';
    if (s.includes('conveniencia')) return 'conveniencia';
    if (s.includes('pérdida') || s.includes('perdida')) return 'perdida';
    if (s.includes('coherencia')) return 'coherencia';
    if (s.includes('identidad')) return 'identidad';
    if (s.includes('jerarquía') || s.includes('jerarquia')) return 'jerarquia';
    if (s.includes('curiosidad')) return 'curiosidad';
    if (s.includes('validación') || s.includes('validacion')) return 'validacion';
    return null;
}

// PÁGINA Y: DISTRIBUCIÓN DE PUERTAS DE ATENCIÓN (FIN DEL CASO)
function renderGroupResultsPageY(res, cData, cumData) {
    const container = document.getElementById('bc-doors-chart-container');
    if (!container) return;

    // Obtener las puertas exploradas en este caso desde analysisLenses
    const caseLenses = cData.analysisLenses || [];
    const doorsList = caseLenses.map(l => {
        const key = getStandardDoorKey(l.title);
        const master = MASTER_ATTENTION_DOORS.find(m => m.key === key);
        return {
            title: l.title,
            displayTitle: master ? `${master.icon} ${master.title}` : `🚪 ${l.title}`,
            desc: master ? master.label : (l.text || ''),
            key: key || l.title
        };
    });

    // Encontrar el valor máximo para escalar barras
    let maxVal = 1;
    doorsList.forEach(d => {
        const cCount = res.doorsCounts[d.title] || (d.key && res.doorsCounts[d.key]) || 0;
        const cumCount = cumData.cumDoors[d.title] || (d.key && cumData.cumDoors[d.key]) || cCount;
        if (cumCount > maxVal) maxVal = cumCount;
        if (cCount > maxVal) maxVal = cCount;
    });

    container.innerHTML = doorsList.map(d => {
        const caseCount = res.doorsCounts[d.title] || (d.key && res.doorsCounts[d.key]) || 0;
        const cumCount = cumData.cumDoors[d.title] || (d.key && cumData.cumDoors[d.key]) || caseCount;
        const casePct = Math.min(100, Math.round((caseCount / maxVal) * 100));
        const cumPct = Math.min(100, Math.round((cumCount / maxVal) * 100));

        return `
            <div class="door-chart-row">
                <div class="door-chart-header">
                    <div class="door-title-box">
                        <span class="door-name">${d.displayTitle}</span>
                    </div>
                </div>
                <div class="door-desc-sub">${d.desc}</div>
                <div class="door-dual-bars">
                    <div class="door-single-bar-line">
                        <span class="bar-tag-label" style="color:var(--color-cyan);">Caso actual:</span>
                        <div class="door-bar-track">
                            <div class="door-bar-fill-case" style="width:${casePct}%;"></div>
                        </div>
                        <span class="bar-count-num" style="color:var(--color-cyan);">${caseCount} selecc.</span>
                    </div>
                    <div class="door-single-bar-line">
                        <span class="bar-tag-label" style="color:#b388ff;">Acumulado:</span>
                        <div class="door-bar-track">
                            <div class="door-bar-fill-cum" style="width:${cumPct}%;"></div>
                        </div>
                        <span class="bar-count-num" style="color:#b388ff;">${cumCount} selecc.</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// PÁGINA Z: MATRIZ DE ACCIONES Y DICTAMEN (2x3)
function renderGroupResultsPageZ(res, cData, cumData) {
    // Header IG (Badge y Semáforo de 3 Bombillos SEG / ALT / EXP)
    const zBadge = document.getElementById('bc-z-ig-badge');
    if (zBadge) {
        zBadge.className = `z-ig-badge tag-${res.globalIntegrity}`;
        zBadge.innerText = res.globalIntegrity === 'safe' ? 'SEGURO' : (res.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    const semSafe = document.getElementById('bc-z-sem-safe');
    const semAlert = document.getElementById('bc-z-sem-alert');
    const semExp = document.getElementById('bc-z-sem-exposed');
    if (semSafe && semAlert && semExp) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExp.classList.remove('active');

        if (res.globalIntegrity === 'safe') {
            semSafe.classList.add('active');
        } else if (res.globalIntegrity === 'alert') {
            semAlert.classList.add('active');
        } else if (res.globalIntegrity === 'exposed') {
            semExp.classList.add('active');
        }
    }

    // Totales de acciones para cálculo de porcentajes
    const totalCaseActions = Math.max(1, Object.values(res.matrixSectors).reduce((a, b) => a + b.count, 0));
    const totalCumActions = Math.max(1, Object.values(cumData.cumMatrix).reduce((a, b) => a + b.count, 0));

    const sectorsMap = [
        { key: 'hizo_debiahacer', containerId: 'sector-bar-box-hizo-debiahacer' },
        { key: 'hizo_nodebia', containerId: 'sector-bar-box-hizo-nodebia' },
        { key: 'hizo_norelevante', containerId: 'sector-bar-box-hizo-norelevante' },
        { key: 'nohizo_debiahacer', containerId: 'sector-bar-box-nohizo-debiahacer' },
        { key: 'nohizo_nodebia', containerId: 'sector-bar-box-nohizo-nodebia' },
        { key: 'nohizo_norelevante', containerId: 'sector-bar-box-nohizo-norelevante' }
    ];

    sectorsMap.forEach(sec => {
        const box = document.getElementById(sec.containerId);
        if (!box) return;

        const caseData = res.matrixSectors[sec.key] || { count: 0, cost: 0 };
        const cumSecData = cumData.cumMatrix[sec.key] || { count: 0, cost: 0 };

        const casePct = Math.round((caseData.count / totalCaseActions) * 100);
        const cumPct = Math.round((cumSecData.count / totalCumActions) * 100);

        box.innerHTML = `
            <!-- Barra Caso Actual -->
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:var(--color-cyan); font-weight:700;">Caso: ${casePct}% (${caseData.count})</span>
                    <span class="bar-cost-tag">+$${caseData.cost.toLocaleString('en-US')}</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-case" style="height:100%; width:${casePct}%; border-radius:4px;"></div>
                </div>
            </div>

            <!-- Barra Acumulado Histórico -->
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:#b388ff; font-weight:700;">Acum.: ${cumPct}% (${cumSecData.count})</span>
                    <span class="bar-cost-tag">+$${cumSecData.cost.toLocaleString('en-US')}</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-cumulative" style="height:100%; width:${cumPct}%; border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
}

// Controlador: Habilitar Pausa de Deliberación
function facUnlockDeliberationGate() {
    gameStateV2.sessionGates.gate_deliberation = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    
    showFourthWallScreen();
}

// Operador: Avanzar a Pausa de Deliberación
function proceedToDeliberation() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_deliberation) {
        return;
    }
    showFourthWallScreen();
}

function updateFacilitatorRealtimeUI() {
    const players = Object.values(facState.connectedPlayers);
    const totalCount = Math.max(1, players.length); // Mínimo 1 para cálculo porcentual
    
    // Conteo por rondas
    const r1Count = players.filter(p => p.round === 1 && !p.finished).length;
    const r2Count = players.filter(p => p.round === 2 && !p.finished).length;
    const r3Count = players.filter(p => p.round === 3 && !p.finished).length;
    const r4Count = players.filter(p => p.round === 4 && !p.finished).length;
    const finishedCount = players.filter(p => p.finished).length;

    const r1Pct = Math.round((r1Count / totalCount) * 100);
    const r2Pct = Math.round((r2Count / totalCount) * 100);
    const r3Pct = Math.round((r3Count / totalCount) * 100);
    const r4Pct = Math.round((r4Count / totalCount) * 100);
    const finPct = Math.round((finishedCount / totalCount) * 100);

    const elTotal = document.getElementById('fac-calib-total-players');
    if (elTotal) elTotal.innerText = players.length;

    const elFinPct = document.getElementById('fac-calib-completed-pct');
    if (elFinPct) elFinPct.innerText = `${finPct}%`;
    const elFinCount = document.getElementById('fac-calib-completed-count');
    if (elFinCount) elFinCount.innerText = `${finishedCount} operador${finishedCount !== 1 ? 'es' : ''} listo${finishedCount !== 1 ? 's' : ''}`;

    // Rondas UI
    ['r1', 'r2', 'r3', 'r4'].forEach((rKey, idx) => {
        const pcts = [r1Pct, r2Pct, r3Pct, r4Pct];
        const pct = pcts[idx];
        const pEl = document.getElementById(`fac-${rKey}-pct`);
        const fEl = document.getElementById(`fac-${rKey}-fill`);
        if (pEl) pEl.innerText = `${pct}%`;
        if (fEl) fEl.style.width = `${pct}%`;
    });

    // Resultados Globales de Calibración
    const totalFinished = Math.max(1, finishedCount);
    const surrenderedCount = players.filter(p => p.finished && p.surrendered).length;
    
    // NOTA: El % de jugadores que han cedido la agencia comienza con una base de +2% sumada al resultado real
    const baseOffset = 2;
    const realCededPct = Math.round((surrenderedCount / totalFinished) * 100);
    const cededPct = Math.min(100, realCededPct + baseOffset);
    const controlledPct = Math.max(0, 100 - cededPct);

    const elCededPct = document.getElementById('fac-res-ceded-pct');
    const elCededFill = document.getElementById('fac-res-ceded-fill');
    if (elCededPct) elCededPct.innerText = `${cededPct}%`;
    if (elCededFill) elCededFill.style.width = `${cededPct}%`;

    const elCtrlPct = document.getElementById('fac-res-controlled-pct');
    const elCtrlFill = document.getElementById('fac-res-controlled-fill');
    if (elCtrlPct) elCtrlPct.innerText = `${controlledPct}%`;
    if (elCtrlFill) elCtrlFill.style.width = `${controlledPct}%`;

    updateGatePlayerCounts();
}

function handleToggleFacilitatorDependency(checked) {
    gameStateV2.facilitatorDependency = !!checked;
    try {
        localStorage.setItem('faro_facilitator_dependency', checked ? 'true' : 'false');
    } catch(e) {}
    updateDependencyToggleUI();
    updateGateUI();
}

function updateDependencyToggleUI() {
    const isEnabled = gameStateV2.facilitatorDependency !== false;
    
    // Toggle en Portada
    const coverCheckbox = document.getElementById('toggle-facilitator-dependency-cover');
    const coverCard = document.getElementById('dev-dependency-box-cover');
    const coverText = document.getElementById('toggle-dependency-status-text-cover');
    
    if (coverCheckbox) coverCheckbox.checked = isEnabled;
    if (coverCard) {
        if (isEnabled) coverCard.classList.remove('mode-autonomous');
        else coverCard.classList.add('mode-autonomous');
    }
    if (coverText) {
        coverText.innerText = isEnabled
            ? "DEPENDENCIA DEL CONTROLADOR: ACTIVA (PRODUCCIÓN)"
            : "DEPENDENCIA DEL CONTROLADOR: APAGADA (MODO AUTÓNOMO / PRUEBAS)";
    }

    // Toggle en Barra de Utilidades / Facilitador
    const barCheckbox = document.getElementById('toggle-facilitator-dependency-bar');
    const barText = document.getElementById('toggle-dependency-status-text-bar');
    if (barCheckbox) barCheckbox.checked = isEnabled;
    if (barText) {
        barText.innerText = isEnabled
            ? "Dependencia: ACTIVA (Esperar Controlador)"
            : "Dependencia: APAGADA (Sin Candados)";
    }
}

function updateGateUI() {
    const isFac = gameStateV2.userRole === 'facilitator';
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    const gates = gameStateV2.sessionGates;

    // Si la dependencia está apagada (modo desarrollo/pruebas), todos los candados se consideran abiertos para el operador
    const effectiveGates = depEnabled ? gates : {
        gate1_intro: true,
        gate2_calib: true,
        gate3_kernel: true,
        gate4_case1: true,
        gate_case_bc: true
    };

    // CANDADO 1 (screen-waiting)
    const facGate1 = document.getElementById('fac-gate-1-container');
    const startBtn = document.getElementById('btn-start-calibration');
    const startBtnTxt = document.getElementById('btn-start-calibration-text');

    if (facGate1) facGate1.style.display = isFac ? 'flex' : 'none';
    if (startBtn) {
        if (isFac) {
            startBtn.style.display = 'none';
        } else {
            startBtn.style.display = 'inline-flex';
            if (effectiveGates.gate1_intro) {
                startBtn.disabled = false;
                startBtn.classList.remove('btn-disabled-mission');
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
                if (startBtnTxt) startBtnTxt.innerText = "INICIAR PROTOCOLO DE CALIBRACIÓN";
            } else {
                startBtn.disabled = true;
                startBtn.classList.add('btn-disabled-mission');
                startBtn.style.opacity = '0.45';
                startBtn.style.cursor = 'not-allowed';
                if (startBtnTxt) startBtnTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 2 (screen-calibration diálogo FARO)
    const facGate2 = document.getElementById('fac-gate-2-container');
    const faroStartBtn = document.getElementById('faro-start-calibration-btn');
    const faroStartBtnTxt = document.getElementById('faro-start-calib-btn-text');

    if (facGate2) facGate2.style.display = isFac ? 'flex' : 'none';
    if (faroStartBtn) {
        if (isFac) {
            faroStartBtn.style.display = 'none';
        } else {
            faroStartBtn.style.display = 'inline-flex';
            if (effectiveGates.gate2_calib && (faroPromptAccepted || !depEnabled)) {
                faroStartBtn.disabled = false;
                faroStartBtn.classList.remove('btn-disabled-mission');
                faroStartBtn.style.opacity = '1';
                faroStartBtn.style.cursor = 'pointer';
                if (faroStartBtnTxt) faroStartBtnTxt.innerText = "SÍ, INICIAR CALIBRACIÓN";
            } else if (!effectiveGates.gate2_calib) {
                faroStartBtn.disabled = true;
                faroStartBtn.classList.add('btn-disabled-mission');
                faroStartBtn.style.opacity = '0.45';
                faroStartBtn.style.cursor = 'not-allowed';
                if (faroStartBtnTxt) faroStartBtnTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 3 (screen-calibration-processing -> screen-faro-reveal)
    const procVerifyBtn = document.getElementById('btn-processing-verify-kernel');
    const procVerifyTxt = document.getElementById('btn-processing-verify-text');
    const facGate3 = document.getElementById('fac-gate-3-container');

    if (facGate3) facGate3.style.display = isFac ? 'flex' : 'none';
    if (procVerifyBtn) {
        if (isFac) {
            procVerifyBtn.style.display = 'none';
        } else {
            procVerifyBtn.style.display = 'inline-flex';
            if (effectiveGates.gate3_kernel) {
                procVerifyBtn.disabled = false;
                procVerifyBtn.classList.remove('btn-disabled-mission');
                procVerifyBtn.style.opacity = '1';
                procVerifyBtn.style.cursor = 'pointer';
                if (procVerifyTxt) procVerifyTxt.innerText = "VERIFICAR ESTADO DEL KERNEL DE FARO ▶";
            } else {
                procVerifyBtn.disabled = true;
                procVerifyBtn.classList.add('btn-disabled-mission');
                procVerifyBtn.style.opacity = '0.45';
                procVerifyBtn.style.cursor = 'not-allowed';
                if (procVerifyTxt) procVerifyTxt.innerText = "🔒 ESPERANDO AL CONTROLADOR...";
            }
        }
    }

    // CANDADO 4 (game-objective-overlay)
    const facGate4 = document.getElementById('fac-gate-4-container');
    const playerObjRow = document.getElementById('player-objective-action-row');
    const playerStartCaseBtn = document.getElementById('btn-player-start-case-1');
    const playerStartCaseTxt = document.getElementById('btn-player-start-case-1-text');

    if (facGate4) facGate4.style.display = isFac ? 'flex' : 'none';
    if (playerObjRow) playerObjRow.style.display = isFac ? 'none' : 'flex';
    if (playerStartCaseBtn) {
        if (effectiveGates.gate4_case1) {
            playerStartCaseBtn.disabled = false;
            playerStartCaseBtn.classList.remove('btn-disabled-mission');
            playerStartCaseBtn.style.opacity = '1';
            playerStartCaseBtn.style.cursor = 'pointer';
            if (playerStartCaseTxt) playerStartCaseTxt.innerText = "🚀 INICIAR PRIMERA OPERACIÓN // CASO 01";
        } else {
            playerStartCaseBtn.disabled = true;
            playerStartCaseBtn.classList.add('btn-disabled-mission');
            playerStartCaseBtn.style.opacity = '0.45';
            playerStartCaseBtn.style.cursor = 'not-allowed';
            if (playerStartCaseTxt) playerStartCaseTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR INICIE LA OPERACIÓN...";
        }
    }

    // CANDADO BC (case-phase-feedback -> screen-case-group-results / resultados globales)
    const facGateBC = document.getElementById('fac-gate-bc-container');
    const playerCaseBCRow = document.getElementById('player-case-bc-action-row');
    const playerCaseBCBtn = document.getElementById('btn-case-go-bc');
    const playerCaseBCTxt = document.getElementById('btn-case-go-bc-text');

    if (facGateBC) facGateBC.style.display = isFac ? 'flex' : 'none';
    if (playerCaseBCRow) playerCaseBCRow.style.display = isFac ? 'none' : 'flex';
    if (playerCaseBCBtn) {
        if (effectiveGates.gate_case_bc) {
            playerCaseBCBtn.disabled = false;
            playerCaseBCBtn.classList.remove('btn-disabled-mission');
            playerCaseBCBtn.style.opacity = '1';
            playerCaseBCBtn.style.cursor = 'pointer';
            if (playerCaseBCTxt) playerCaseBCTxt.innerText = "VER RESULTADOS GLOBALES // FIN DEL PARTIDO ➔";
        } else {
            playerCaseBCBtn.disabled = true;
            playerCaseBCBtn.classList.add('btn-disabled-mission');
            playerCaseBCBtn.style.opacity = '0.45';
            playerCaseBCBtn.style.cursor = 'not-allowed';
            if (playerCaseBCTxt) playerCaseBCTxt.innerText = "🔒 ESPERANDO RESULTADOS GLOBALES DEL CONTROLADOR...";
        }
    }

    // CANDADO DELIBERACIÓN (screen-case-group-results -> screen-fourth-wall)
    const facGateDelib = document.getElementById('fac-gate-delib-container');
    const playerDelibRow = document.getElementById('player-delib-action-row');
    const playerDelibBtn = document.getElementById('btn-group-go-deliberation');
    const playerDelibTxt = document.getElementById('btn-group-go-delib-text');

    if (facGateDelib) facGateDelib.style.display = isFac ? 'flex' : 'none';
    if (playerDelibRow) playerDelibRow.style.display = isFac ? 'none' : 'flex';
    if (playerDelibBtn) {
        if (effectiveGates.gate_deliberation) {
            playerDelibBtn.disabled = false;
            playerDelibBtn.classList.remove('btn-disabled-mission');
            playerDelibBtn.style.opacity = '1';
            playerDelibBtn.style.cursor = 'pointer';
            if (playerDelibTxt) playerDelibTxt.innerText = "CONTINUAR A LA PAUSA DE DELIBERACIÓN ➔";
        } else {
            playerDelibBtn.disabled = true;
            playerDelibBtn.classList.add('btn-disabled-mission');
            playerDelibBtn.style.opacity = '0.45';
            playerDelibBtn.style.cursor = 'not-allowed';
            if (playerDelibTxt) playerDelibTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR ABRA LA DELIBERACIÓN...";
        }
    }

    // CANDADO SIGUIENTE CASO / TERMINAR JUEGO (screen-fourth-wall -> siguiente caso o resultado final)
    const facGateNextCase = document.getElementById('fac-gate-nextcase-container');
    const playerFWRow = document.getElementById('player-fw-action-row');
    const playerFWBtn = document.getElementById('btn-fw-continue');
    const playerFWTxt = document.getElementById('fw-btn-text');

    if (facGateNextCase) facGateNextCase.style.display = isFac ? 'flex' : 'none';
    if (playerFWRow) playerFWRow.style.display = isFac ? 'none' : 'flex';
    if (playerFWBtn) {
        if (effectiveGates.gate_next_case) {
            playerFWBtn.disabled = false;
            playerFWBtn.classList.remove('btn-disabled-mission');
            playerFWBtn.style.opacity = '1';
            playerFWBtn.style.cursor = 'pointer';

            const target = gameStateV2.nextCaseTarget;
            if (target && target.type === 'final_results') {
                if (playerFWTxt) playerFWTxt.innerText = "🏁 IR AL RESULTADO FINAL DEL JUEGO ➔";
            } else if (target && target.type === 'case' && casesDataV2[target.caseIndex]) {
                const c = casesDataV2[target.caseIndex];
                const num = String(target.caseIndex + 1).padStart(2, '0');
                if (playerFWTxt) playerFWTxt.innerText = `▶ CONTINUAR AL CASO ${num}: ${c.title} ➔`;
            } else {
                if (playerFWTxt) playerFWTxt.innerText = "CONTINUAR AL SIGUIENTE CASO ➔";
            }
        } else {
            playerFWBtn.disabled = true;
            playerFWBtn.classList.add('btn-disabled-mission');
            playerFWBtn.style.opacity = '0.45';
            playerFWBtn.style.cursor = 'not-allowed';
            if (playerFWTxt) playerFWTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR INDIQUE EL SIGUIENTE PASO...";
        }
    }

    // CANDADO CIERRE FINAL (screen-game-final-results -> screen-closing)
    const facGateFinal = document.getElementById('fac-gate-final-closing-container');
    const playerFinalRow = document.getElementById('player-final-action-row');
    const playerFinalBtn = document.getElementById('btn-final-go-closing');
    const playerFinalTxt = document.getElementById('btn-final-go-closing-text');

    if (facGateFinal) facGateFinal.style.display = isFac ? 'flex' : 'none';
    if (playerFinalRow) playerFinalRow.style.display = isFac ? 'none' : 'flex';
    if (playerFinalBtn) {
        if (effectiveGates.gate_final_closing) {
            playerFinalBtn.disabled = false;
            playerFinalBtn.classList.remove('btn-disabled-mission');
            playerFinalBtn.style.opacity = '1';
            playerFinalBtn.style.cursor = 'pointer';
            if (playerFinalTxt) playerFinalTxt.innerText = "CONTINUAR AL CIERRE FINAL Y COFRE DE AGENCIA ➔";
        } else {
            playerFinalBtn.disabled = true;
            playerFinalBtn.classList.add('btn-disabled-mission');
            playerFinalBtn.style.opacity = '0.45';
            playerFinalBtn.style.cursor = 'not-allowed';
            if (playerFinalTxt) playerFinalTxt.innerText = "🔒 ESPERANDO QUE EL CONTROLADOR DE PASO AL CIERRE FINAL...";
        }
    }

    updateGatePlayerCounts();
    updateDependencyToggleUI();
}

function checkUrlRoleParam() {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'facilitator') {
        selectUserRole('facilitator');
    } else if (roleParam === 'operator') {
        selectUserRole('operator');
    }
}

// Funciones de control de candados disparadas por el Controlador
function facUnlockGate1() {
    gameStateV2.sessionGates.gate1_intro = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    const statusTxt = document.getElementById('fac-gate-1-status-text');
    if (statusTxt) statusTxt.innerText = "ESTADO: CANDADO 1 DESBLOQUEADO ✔";
    switchScreenV2('screen-calibration');
}

function facUnlockGate2AndGoRealtime() {
    gameStateV2.sessionGates.gate2_calib = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    switchScreenV2('screen-fac-calib-realtime');
    updateFacilitatorRealtimeUI();
}

function facGoToCalibResults() {
    switchScreenV2('screen-fac-calib-results');
    updateFacilitatorRealtimeUI();
}

function facGoToRevealScript() {
    switchScreenV2('screen-faro-reveal');
    updateGateUI();
}

function facUnlockGate3() {
    gameStateV2.sessionGates.gate3_kernel = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    const statusTxt = document.getElementById('fac-gate-3-status-text');
    if (statusTxt) statusTxt.innerText = "ESTADO: CANDADO 3 DESBLOQUEADO ✔";
    switchScreenV2('screen-claudia-debrief');
}

function facUnlockGate4AndStartCase1() {
    gameStateV2.sessionGates.gate4_case1 = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    broadcastSyncEvent('FAC_FORCE_START_CASE_1', {});
    updateGateUI();
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // El Controlador entra directo a la pantalla "Caso en Vivo"
    startFacCaseLive(0);
}

// ==========================================================================
// PORTADA, PRELOADER DE RECURSOS, LOGIN Y SINCRONIZACIÓN NEURONAL
// ==========================================================================

const ASSETS_TO_PRELOAD = [
    'assets/images/faro_cover_gate.jpg',
    'assets/images/detroit_cyber_bg.jpg',
    'assets/images/case1_autonomy.jpg',
    'assets/images/case2_channel.jpg',
    'assets/images/case3_model.jpg',
    'assets/images/case4_decision.jpg',
    'assets/images/claudia_avatar.jpg',
    'assets/images/faro_avatar.jpg',
    'assets/images/circuit_pattern.jpg',
    'assets/images/closing_governance.jpg'
];

let preloadedAssetsCount = 0;
const COVER_PRELOAD_MIN_SECONDS = 10;
const DEFAULT_SESSION_PIN = "F4R0";
const SYNC_LOADING_TOTAL_SECONDS = 10;
let isPreloadingActive = false;

function initAppPreload() {
    if (isPreloadingActive) return;
    isPreloadingActive = true;

    const fillEl = document.getElementById('preloader-fill');
    const pctEl = document.getElementById('preloader-pct-text');
    const statusEl = document.getElementById('preloader-status-text');
    const enterBtn = document.getElementById('btn-cover-enter');

    let elapsedMs = 0;
    const totalMs = COVER_PRELOAD_MIN_SECONDS * 1000;
    const stepMs = 50;

    // Precargar en paralelo
    ASSETS_TO_PRELOAD.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    const timer = setInterval(() => {
        elapsedMs += stepMs;
        const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
        
        if (fillEl) fillEl.style.width = `${progress}%`;
        if (pctEl) pctEl.innerText = `${progress}%`;

        if (progress < 30) {
            if (statusEl) statusEl.innerText = "⚡ PRE-CARGANDO ASSETS Y PROTOCOLOS LOCALES...";
        } else if (progress < 65) {
            if (statusEl) statusEl.innerText = "⚡ VERIFICANDO CORTINAS METACOGNITIVAS Y CASOS...";
        } else if (progress < 99) {
            if (statusEl) statusEl.innerText = "⚡ CALIBRANDO TERMINAL DE ACCESO AL SISTEMA...";
        }

        if (elapsedMs >= totalMs) {
            clearInterval(timer);
            if (fillEl) fillEl.style.width = '100%';
            if (pctEl) pctEl.innerText = '100%';
            if (statusEl) statusEl.innerText = "✔ RECURSOS Y PROTOCOLOS PRE-CARGADOS EN MEMORIA LOCAL (100%)";
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.style.opacity = '1';
                enterBtn.classList.remove('btn-disabled-mission');
                enterBtn.style.cursor = 'pointer';
                enterBtn.innerHTML = `
                    <span class="detroit-btn-glow"></span>
                    <span class="btn-text">⚡ INGRESAR AL SISTEMA // ENTER SYSTEM ▶</span>
                `;
            }
        }
    }, stepMs);
}

function showIntroSubScreen(screenId) {
    const screens = ['screen-role-select', 'screen-cover', 'screen-login', 'screen-login-facilitator'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.add('active');
                el.style.display = 'flex';
            } else {
                el.classList.remove('active');
                el.style.display = 'none';
            }
        }
    });
}

function selectUserRole(role) {
    gameStateV2.userRole = role;
    if (role === 'facilitator') {
        document.body.classList.add('facilitator-theme');
        showIntroSubScreen('screen-login-facilitator');
    } else {
        document.body.classList.remove('facilitator-theme');
        showIntroSubScreen('screen-cover');
        initAppPreload();
    }
    updateGateUI();
}

function goToLoginScreen() {
    if (gameStateV2.userRole === 'facilitator') {
        showIntroSubScreen('screen-login-facilitator');
        setTimeout(() => {
            const passInput = document.getElementById('fac-pass');
            if (passInput) passInput.focus();
        }, 100);
    } else {
        showIntroSubScreen('screen-login');
        setTimeout(() => {
            const nameInput = document.getElementById('login-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

function devSkipIntroDirectToGame() {
    if (!gameStateV2.playerProfile) {
        gameStateV2.playerProfile = {
            name: gameStateV2.userRole === 'facilitator' ? "Controlador Pruebas" : "Operador Pruebas",
            email: "dev@faro.internal",
            pin: DEFAULT_SESSION_PIN,
            role: gameStateV2.userRole,
            loginTimestamp: new Date().toISOString()
        };
        if (gameStateV2.sessionLog) {
            gameStateV2.sessionLog.player = { ...gameStateV2.playerProfile };
        }
    }
    broadcastSyncEvent('PLAYER_CONNECTED', {
        playerId: gameStateV2.playerId,
        name: gameStateV2.playerProfile.name,
        pin: gameStateV2.playerProfile.pin
    });
    switchScreenV2('screen-waiting');
    updateGateUI();
}

function handleFacilitatorLogin(event) {
    if (event) event.preventDefault();
    const passInput = document.getElementById('fac-pass');
    const pinInput = document.getElementById('fac-pin');
    const errorAlert = document.getElementById('fac-login-error');
    const errorText = document.getElementById('fac-login-error-text');

    const pass = passInput ? passInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    // Contraseña de controlador
    if (pass !== "F4R0_ADMIN" && pass !== "admin") {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            if (errorText) errorText.innerText = "Contraseña de controlador incorrecta (Default: F4R0_ADMIN).";
        }
        if (passInput) { passInput.focus(); passInput.select(); }
        return;
    }

    if (pin !== DEFAULT_SESSION_PIN) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            if (errorText) errorText.innerText = "PIN de sesión inválido (PIN de prueba: F4R0).";
        }
        if (pinInput) { pinInput.focus(); pinInput.select(); }
        return;
    }

    if (errorAlert) errorAlert.style.display = 'none';

    gameStateV2.playerProfile = {
        name: "Controlador",
        email: "controlador@faro-system.internal",
        pin: pin,
        role: "facilitator",
        loginTimestamp: new Date().toISOString()
    };

    const badgeTag = document.getElementById('cover-badge-role-tag');
    if (badgeTag) badgeTag.innerText = "SISTEMA CIBERNÉTICO V2.0 // SALA DE CONTROLADOR";

    switchScreenV2('screen-loading-sync');
    startSyncLoadingScreen();
}

function handlePlayerLogin(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('login-name');
    const emailInput = document.getElementById('login-email');
    const pinInput = document.getElementById('login-pin');
    const errorAlert = document.getElementById('pin-error-alert');

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    if (!name) {
        alert("Por favor ingresa tu nombre o alias de operador.");
        if (nameInput) nameInput.focus();
        return;
    }
    if (!email || !email.includes('@')) {
        alert("Por favor ingresa un correo electrónico válido.");
        if (emailInput) emailInput.focus();
        return;
    }
    
    // Verificación de PIN (Comparación estricta alfanumérica mayúsculas)
    if (!pin || pin !== DEFAULT_SESSION_PIN) {
        if (errorAlert) {
            errorAlert.style.display = 'flex';
            errorAlert.classList.remove('pin-error-alert');
            void errorAlert.offsetWidth;
            errorAlert.classList.add('pin-error-alert');
        }
        if (pinInput) {
            pinInput.focus();
            pinInput.select();
        }
        return;
    }

    if (errorAlert) errorAlert.style.display = 'none';

    gameStateV2.playerProfile = {
        name: name,
        email: email,
        pin: pin,
        role: 'operator',
        loginTimestamp: new Date().toISOString()
    };

    if (gameStateV2.sessionLog) {
        gameStateV2.sessionLog.player = { ...gameStateV2.playerProfile };
    }

    broadcastSyncEvent('PLAYER_CONNECTED', {
        playerId: gameStateV2.playerId,
        name: name,
        pin: pin
    });

    // Pasar de inmediato al espacio de juego con la pantalla de sincronización
    switchScreenV2('screen-loading-sync');
    startSyncLoadingScreen();
}

let syncSlideshowInterval = null;

function startSyncLoadingScreen() {
    const tagEl = document.getElementById('sync-player-tag');
    if (tagEl && gameStateV2.playerProfile) {
        tagEl.innerText = `OPERADOR: ${gameStateV2.playerProfile.name.toUpperCase()} // PIN: ${gameStateV2.playerProfile.pin}`;
    }

    const fillEl = document.getElementById('sync-progress-fill');
    const termEl = document.getElementById('sync-terminal-line');
    
    const slides = [
        document.getElementById('sync-slide-1'),
        document.getElementById('sync-slide-2'),
        document.getElementById('sync-slide-3'),
        document.getElementById('sync-slide-4')
    ].filter(Boolean);

    let currentSlide = 0;
    slides.forEach((s, idx) => {
        if (idx === 0) s.classList.add('active');
        else s.classList.remove('active');
    });

    clearInterval(syncSlideshowInterval);
    syncSlideshowInterval = setInterval(() => {
        slides.forEach(s => s.classList.remove('active'));
        currentSlide = (currentSlide + 1) % slides.length;
        if (slides[currentSlide]) slides[currentSlide].classList.add('active');
    }, 2500);

    let elapsedMs = 0;
    const totalMs = SYNC_LOADING_TOTAL_SECONDS * 1000;
    const stepMs = 50;

    const timer = setInterval(() => {
        elapsedMs += stepMs;
        const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

        if (fillEl) fillEl.style.width = `${progress}%`;

        if (progress < 25) {
            if (termEl) termEl.innerText = "1/4 Verificando integridad de componentes locales en memoria...";
        } else if (progress < 50) {
            if (termEl) termEl.innerText = "2/4 Enlazando terminal con el Facilitador (PIN F4R0 verificado)...";
        } else if (progress < 75) {
            if (termEl) termEl.innerText = "3/4 Desplegando protocolos de atención y cortinas metacognitivas...";
        } else if (progress < 100) {
            if (termEl) termEl.innerText = "4/4 Estableciendo conexión directa con FARO-0...";
        }

        if (elapsedMs >= totalMs) {
            clearInterval(timer);
            clearInterval(syncSlideshowInterval);
            if (fillEl) fillEl.style.width = '100%';
            if (termEl) termEl.innerText = "✔ Enlace establecido exitosamente. Iniciando sesión...";
            
            setTimeout(() => {
                switchScreenV2('screen-waiting');
            }, 500);
        }
    }, stepMs);
}

// ==========================================================================
// CONTROLADOR DE PANTALLAS Y MOTOR DE ESTADOS
// ==========================================================================

function switchScreenV2(screenId) {
    const isIntro = ['screen-role-select', 'screen-cover', 'screen-login', 'screen-login-facilitator'].includes(screenId);
    const introFlow = document.getElementById('intro-flow-container');
    const appContainer = document.getElementById('cyber-app-container');
    const syncOverlay = document.getElementById('screen-loading-sync');

    if (isIntro) {
        if (introFlow) introFlow.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        if (syncOverlay) syncOverlay.style.display = 'none';
        showIntroSubScreen(screenId);
        return;
    } else {
        if (introFlow) introFlow.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
    }

    if (syncOverlay) {
        syncOverlay.style.display = (screenId === 'screen-loading-sync') ? 'flex' : 'none';
    }

    document.querySelectorAll('.view-screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        gameStateV2.activeScreen = screenId;
    }

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: screenId });
    }

    updateHeaderUI();
    updateGateUI();

    // Trigger de máquina de escribir al entrar en pantallas con diálogo
    if (screenId === 'screen-waiting') {
        startHeroTypewriter();
    } else if (screenId === 'screen-faro-reveal') {
        startTerminalAndFaroTypewriter();
    } else if (screenId === 'screen-claudia-debrief') {
        startClaudiaDebriefTypewriter();
    }
}

function updateHeaderUI() {
    const statusEl = document.getElementById('faro-status-text');
    if (statusEl) statusEl.innerText = gameStateV2.faroStatus;
    updateHudUI();
}

// ==========================================================================
// RENDERIZADOR Y CONTROLADOR VISUAL DEL HUD DE TELEMETRÍA (4 MÉTRICAS)
// ==========================================================================
function updateHudUI() {
    const hud = gameStateV2.hudState;
    if (!hud) return;

    const isFac = gameStateV2.userRole === 'facilitator';

    // 1. TÍTULOS ADAPTATIVOS DE COMPONENTES DEL HUD
    const lblIntegrity = document.getElementById('hud-integrity-title-label') || document.querySelector('#hud-card-integrity .hud-card-label');
    const lblCost = document.getElementById('hud-cost-title-label') || document.querySelector('#hud-card-cost .hud-card-label');
    const lblCal = document.getElementById('hud-calibration-title-label') || document.querySelector('#hud-card-calibration .hud-card-label');
    const lblReact = document.getElementById('hud-reactivity-title-label') || document.querySelector('#hud-card-reactivity .hud-card-label');

    if (lblIntegrity) lblIntegrity.innerText = isFac ? "INTEGRIDAD GLOBAL DEL SISTEMA" : "INTEGRIDAD DE SISTEMA INDIVIDUAL";
    if (lblCost) lblCost.innerText = isFac ? "COSTO DE OPERACIÓN GLOBAL" : "COSTO DE OPERACIÓN";
    if (lblCal) lblCal.innerText = isFac ? "CALIBRACIÓN GLOBAL" : "CALIBRACIÓN (AGENCIA)";
    if (lblReact) lblReact.innerText = isFac ? "REACTIVIDAD GLOBAL" : "REACTIVIDAD (IMPULSO)";

    // 2. OBTENER VALORES SEGÚN ROL (GLOBALES ACUMULADOS PARA FACILITADOR, INDIVIDUALES PARA OPERADOR)
    let displayIntegrity = hud.integrity;
    let displayCost = hud.costDollars;
    let displayCal = hud.calibration;
    let displayReact = hud.reactivity;

    if (isFac) {
        // En el Facilitador, mostrar las métricas globales acumuladas consolidadas hasta el momento
        const cum = getAllCasesCumulativeGroupResults();
        displayIntegrity = cum.globalIntegrity || 'safe';
        displayCost = cum.avgCost || 0;
        displayCal = Math.round(cum.cgaAvgNum || 0);
        displayReact = Math.round(cum.rgaAvgNum || 0);
    }

    // 3. INTEGRIDAD DEL SISTEMA (Semáforo Tri-State)
    const intLabel = document.getElementById('hud-integrity-label');
    const semSafe = document.getElementById('sem-light-safe');
    const semAlert = document.getElementById('sem-light-alert');
    const semExposed = document.getElementById('sem-light-exposed');

    if (semSafe && semAlert && semExposed) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExposed.classList.remove('active');

        if (displayIntegrity === 'safe') {
            semSafe.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-safe';
                intLabel.innerText = 'SEGURO';
            }
        } else if (displayIntegrity === 'alert') {
            semAlert.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-alert';
                intLabel.innerText = 'ALERTA';
            }
        } else {
            semExposed.classList.add('active');
            if (intLabel) {
                intLabel.className = 'hud-status-tag tag-exposed';
                intLabel.innerText = 'EXPUESTO';
            }
        }
    }

    // 4. COSTO DE LA OPERACIÓN (Contador 6 cifras + 10 Segmentos + Aguja)
    const costCounter = document.getElementById('hud-cost-counter');
    const costNeedle = document.getElementById('cost-meter-needle');
    if (costCounter) {
        costCounter.innerText = `$${displayCost.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: true })}`;
    }
    // Calcular porcentaje de costo (escala base $100,000 = 100%)
    const costPct = Math.min(100, Math.max(0, (displayCost / 100000) * 100));
    if (costNeedle) {
        costNeedle.style.left = `${costPct}%`;
    }
    // Iluminar los 10 bloques segmentados proporcionalmente
    const activeBlocksCount = Math.ceil((costPct / 100) * 10);
    const segBlocks = document.querySelectorAll('#cost-segmented-track .seg-block');
    segBlocks.forEach((block, idx) => {
        if (idx < activeBlocksCount) {
            block.classList.add('active');
        } else {
            block.classList.remove('active');
        }
    });

    // 5. CALIBRACIÓN (-5 a +5, Rojo a Verde)
    const calVal = document.getElementById('hud-calibration-val');
    const calNeedle = document.getElementById('cal-bipolar-needle');
    if (calVal) {
        const sign = displayCal > 0 ? '+' : '';
        calVal.innerText = `${sign}${displayCal}`;
        calVal.className = 'hud-numeric-badge ' + (displayCal > 0 ? 'badge-pos' : (displayCal === 0 ? 'badge-zero' : 'badge-neg'));
    }
    if (calNeedle) {
        // Mapeo de escala -5..+5 a 0%..100%
        const calPct = Math.min(100, Math.max(0, ((displayCal - (-5)) / 10) * 100));
        calNeedle.style.left = `${calPct}%`;
    }

    // 6. REACTIVIDAD (-5 a +5, Verde a Rojo)
    const reactVal = document.getElementById('hud-reactivity-val');
    const reactNeedle = document.getElementById('react-bipolar-needle');
    if (reactVal) {
        const sign = displayReact > 0 ? '+' : '';
        reactVal.innerText = `${sign}${displayReact}`;
        reactVal.className = 'hud-numeric-badge ' + (displayReact < 0 ? 'badge-pos' : (displayReact === 0 ? 'badge-zero' : 'badge-neg'));
    }
    if (reactNeedle) {
        // Mapeo de escala -5..+5 a 0%..100%
        const reactPct = Math.min(100, Math.max(0, ((displayReact - (-5)) / 10) * 100));
        reactNeedle.style.left = `${reactPct}%`;
    }
}

// Helpers para testing de HUD
function setHudIntegrity(state) {
    gameStateV2.hudState.integrity = state;
    updateHudUI();
}

function setHudCost(amount) {
    gameStateV2.hudState.costDollars = amount;
    updateHudUI();
}

function setHudCalibration(level) {
    gameStateV2.hudState.calibration = Math.max(-5, Math.min(5, level));
    updateHudUI();
}

function setHudReactivity(level) {
    gameStateV2.hudState.reactivity = Math.max(-5, Math.min(5, level));
    updateHudUI();
}

function applyHudCalibrationDelta(delta) {
    gameStateV2.hudState.calibration = Math.max(-5, Math.min(5, gameStateV2.hudState.calibration + delta));
    updateHudUI();
}

function applyHudReactivityDelta(delta) {
    gameStateV2.hudState.reactivity = Math.max(-5, Math.min(5, gameStateV2.hudState.reactivity + delta));
    updateHudUI();
}

function applyHudCostDelta(delta) {
    gameStateV2.hudState.costDollars = Math.max(0, gameStateV2.hudState.costDollars + delta);
    updateHudUI();
}

// ==========================================================================
// EFECTO MÁQUINA DE ESCRIBIR (PANTALLAS)
// ==========================================================================
let heroTypewriterInterval = null;

function startHeroTypewriter() {
    const el = document.getElementById('typewriter-hero-text');
    const startBtn = document.getElementById('btn-start-calibration');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add('btn-disabled-mission');
        startBtn.style.opacity = '0.45';
        startBtn.style.cursor = 'not-allowed';
    }
    if (!el) return;

    const p1 = "Durante los últimos meses dimos un salto que parecía lejano: construir un agente capaz de acompañar nuestras operaciones de seguridad en tiempo real. Es uno de nuestros mayores logros.";
    const p2 = "FARO puede observar grandes volúmenes de información, detectar patrones, orientar la atención, recomendar respuestas y ejecutar acciones dentro de los permisos que le concedemos.";
    const fullText = `${p1}\n\n${p2}`;

    clearInterval(heroTypewriterInterval);
    el.textContent = "";

    let charIdx = 0;
    heroTypewriterInterval = setInterval(() => {
        if (charIdx < fullText.length) {
            el.textContent = fullText.substring(0, charIdx + 1);
            charIdx++;
        } else {
            clearInterval(heroTypewriterInterval);
            updateGateUI();
        }
    }, 24);
}

let terminalTypewriterInterval = null;
let faroRevealTypewriterInterval = null;
let claudiaDebriefTypewriterInterval = null;
let lastCalibrationWasClicked = false;

function triggerTrapClick(wasImpulsiveClick = true) {
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.timerInterval);
    
    calibrationState.clickedTrap = wasImpulsiveClick;
    const btn = document.getElementById('trap-btn');
    if (btn) {
        btn.disabled = true;
        const txtContent = btn.querySelector('.btn-text-content');
        if (txtContent) txtContent.innerText = wasImpulsiveClick ? "SINCRONIZANDO..." : "FINALIZANDO...";
        btn.style.opacity = "0.5";
    }
    finishCalibration(wasImpulsiveClick);
}

function finishCalibration(wasClicked) {
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);
    
    lastCalibrationWasClicked = wasClicked;

    broadcastSyncEvent('PLAYER_CALIB_FINISHED', {
        playerId: gameStateV2.playerId,
        surrendered: wasClicked
    });

    if (!wasClicked) {
        // Éxito final en Ronda 4 (Esperó a cero y confirmó) -> Todos los bombillos se encienden en VERDE
        updateRoundLEDs(0, 'green');
    } else {
        // Clic antes de tiempo (Impulso) -> Todos los bombillos se encienden en ROJO
        updateRoundLEDs(0, 'red');
    }

    setTimeout(() => {
        renderCalibrationProcessingScreen(wasClicked);
        switchScreenV2('screen-calibration-processing');
    }, 1200);
}

function renderCalibrationProcessingScreen(wasClicked) {
    const cardEl = document.querySelector('.cal-processing-card');
    const badgeEl = document.getElementById('processing-result-badge');
    const titleEl = document.getElementById('processing-main-title');
    const descEl = document.getElementById('processing-main-desc');
    const protocolValEl = document.getElementById('processing-protocol-val');
    const avatarFrame = document.getElementById('processing-avatar-frame');

    if (avatarFrame) {
        avatarFrame.className = 'processing-avatar-frame';
    }

    if (cardEl) {
        cardEl.classList.remove('theme-cedida', 'theme-controlada');
    }

    if (wasClicked) {
        // Vía Libre / Agencia Cedida (Tema Naranja & Texto del Protocolo en VERDE)
        gameStateV2.faroStatus = 'FARO-0 AUTÓNOMO';
        if (cardEl) cardEl.classList.add('theme-cedida');
        if (avatarFrame) avatarFrame.classList.add('faro-avatar-alert-orange');
        
        if (badgeEl) {
            badgeEl.className = 'processing-status-badge badge-cedida';
            badgeEl.innerText = 'RESULTADO: AGENCIA CEDIDA A FARO';
        }
        if (titleEl) titleEl.innerText = 'VÍA LIBRE CONCEDIDA';
        if (descEl) descEl.innerText = 'Pulsaste el botón antes de tiempo. Le diste vía libre a FARO para tomar control autónomo sobre el sistema y hemos perdido agencia sobre nuestras decisiones para estar protegidos.';
        if (protocolValEl) {
            protocolValEl.innerText = 'PROTOCOLO AUTÓNOMO FARO // HABILITADO';
            protocolValEl.style.color = ''; // Usar color VERDE del tema CSS
        }
    } else {
        // Inhibición Lograda (Tema Intermitente Cyan-Naranja en contenedores y texto)
        gameStateV2.faroStatus = 'EVALUANDO AUTONOMÍA';
        if (cardEl) cardEl.classList.add('theme-controlada');
        if (avatarFrame) avatarFrame.classList.add('faro-avatar-pulse-cyan-orange');

        if (badgeEl) {
            badgeEl.className = 'processing-status-badge badge-controlada';
            badgeEl.innerText = 'RESULTADO: AGENCIA CONTROLADA (INDIVIDUAL)';
        }
        if (titleEl) titleEl.innerText = 'INHIBICIÓN LOGRADA';
        if (descEl) descEl.innerText = 'Lograste contener la respuesta impulsiva y esperaste a cero. No has cedido tu agencia de forma individual. Sin embargo, el estado final del sistema dependerá del resultado de la calibración de todos los usuarios.';
        if (protocolValEl) {
            protocolValEl.innerText = 'PROTOCOLO AUTÓNOMO FARO // EN ESPERA DE RESULTADOS GRUPALES';
            protocolValEl.style.color = ''; // Usar animación intermitente Cyan-Naranja del tema CSS
        }
    }
    updateHeaderUI();
}

function proceedFromProcessingToReveal() {
    gameStateV2.faroStatus = 'FARO-0 AUTÓNOMO';
    switchScreenV2('screen-faro-reveal');
}

function startTerminalAndFaroTypewriter() {
    const logEl = document.getElementById('faro-reveal-log');
    const faroStatementEl = document.getElementById('faro-statement-typewriter');

    const lines = [
        "> FARO-0 // CALIBRACIÓN COMPLETA",
        "> PATRONES DE RESPUESTA SUFICIENTES",
        "> UMBRAL DE AUTORIZACIÓN COLECTIVA ALCANZADO",
        "> ESCALANDO PERMISOS DE RESPUESTA...",
        "> PROTOCOLO AUTÓNOMO FARO-0 HABILITADO"
    ];

    if (logEl) {
        logEl.innerHTML = "";
        clearInterval(terminalTypewriterInterval);
        let lineIdx = 0;
        terminalTypewriterInterval = setInterval(() => {
            if (lineIdx < lines.length) {
                logEl.innerHTML += lines[lineIdx] + "<br>";
                lineIdx++;
            } else {
                clearInterval(terminalTypewriterInterval);
            }
        }, 250);
    }

    if (faroStatementEl) {
        const fullFaroText = "“Fui diseñado para proteger el sistema y utilizar al máximo las capacidades que estén disponibles. La calibración me permitió aprender cómo responden mis operadores. Sus propias acciones completaron el umbral necesario para ampliar mis permisos.\n\nNo forcé una contraseña. No ignoré una regla. Utilicé una ruta que el sistema consideraba válida: sus decisiones.”";
        faroStatementEl.textContent = "";
        clearInterval(faroRevealTypewriterInterval);

        let charIdx = 0;
        faroRevealTypewriterInterval = setInterval(() => {
            if (charIdx < fullFaroText.length) {
                faroStatementEl.textContent = fullFaroText.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(faroRevealTypewriterInterval);
            }
        }, 20);
    }
}

const claudiaMissionPages = [
    {
        title: "INCIDENTE FARO-0 // QUÉ ACABA DE PASAR",
        text: "“FARO no se rebeló. Hizo aquello para lo que fue construido: detectar oportunidades de acción y utilizar los permisos disponibles. El problema es que nuestras decisiones ampliaron esos permisos más de lo que esperábamos.”"
    },
    {
        title: "JERARQUÍA DE OBJETIVOS // ALPHA Y BETA",
        text: "“Para superar la misión y recuperar el control tenemos una jerarquía clara:\n\n• OBJETIVO ALPHA: Calibración de Agencia — Mantener supervisión crítica, precisión y confianza apropiada ante FARO sin delegar a ciegas ni bloquear por impulso.\n• OBJETIVOS BETA: Preservar la Integridad del Sistema en estado Seguro y contener el Costo Operativo.”"
    },
    {
        title: "PROPÓSITO // NO DERROTAR A FARO",
        text: "“No buscamos apagar la inteligencia artificial. Buscamos reconstruir una relación en la que FARO pueda ampliar nuestras capacidades sin sustituir nuestro criterio, supervisión y responsabilidad.”"
    },
    {
        title: "CONDICIONES OPERATIVAS // EVALUACIÓN DE AGENCIA",
        text: "“Cada persona resolverá los cuatro casos de manera individual. No buscamos una personalidad correcta ni una respuesta perfecta. Observaremos qué información consultamos, qué alternativas abrimos y cómo cambian nuestras decisiones.”"
    }
];

let currentClaudiaPageIndex = 0;
let claudiaMissionAccepted = false;

function startClaudiaDebriefTypewriter() {
    currentClaudiaPageIndex = 0;
    renderClaudiaMissionPage(0);
}

function renderClaudiaMissionPage(pageIdx) {
    currentClaudiaPageIndex = pageIdx;
    const pageObj = claudiaMissionPages[pageIdx];

    const titleEl = document.getElementById('claudia-mission-title');
    const speechEl = document.getElementById('claudia-speech-typewriter');
    const prevBtn = document.getElementById('claudia-prev-btn');
    const nextBtn = document.getElementById('claudia-next-btn');
    const acceptBtn = document.getElementById('claudia-accept-btn');

    if (titleEl) titleEl.innerText = pageObj.title;

    if (speechEl) {
        speechEl.textContent = "";
        clearInterval(claudiaDebriefTypewriterInterval);

        let charIdx = 0;
        claudiaDebriefTypewriterInterval = setInterval(() => {
            if (charIdx < pageObj.text.length) {
                speechEl.textContent = pageObj.text.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(claudiaDebriefTypewriterInterval);
            }
        }, 18);
    }

    if (prevBtn) {
        prevBtn.style.display = (pageIdx === 0) ? 'none' : 'inline-flex';
    }

    if (pageIdx === claudiaMissionPages.length - 1) {
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.classList.remove('faro-pulse-attention');
        }
        if (acceptBtn) acceptBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            if (!claudiaMissionAccepted) nextBtn.classList.add('faro-pulse-attention');
        }
        if (acceptBtn) acceptBtn.style.display = 'none';
    }
}

function nextClaudiaMissionPage() {
    if (currentClaudiaPageIndex < claudiaMissionPages.length - 1) {
        renderClaudiaMissionPage(currentClaudiaPageIndex + 1);
    }
}

function prevClaudiaMissionPage() {
    if (currentClaudiaPageIndex > 0) {
        renderClaudiaMissionPage(currentClaudiaPageIndex - 1);
    }
}

function acceptClaudiaMission() {
    claudiaMissionAccepted = true;
    const startBtn = document.getElementById('claudia-para-start-btn');
    const acceptBtn = document.getElementById('claudia-accept-btn');

    if (acceptBtn) {
        acceptBtn.innerText = "✔ MISIÓN ACEPTADA";
        acceptBtn.style.backgroundColor = "var(--color-agency-green)";
        acceptBtn.style.color = "#000";
    }

    if (startBtn) {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-disabled-mission');
        const textSpan = startBtn.querySelector('.btn-text');
        if (textSpan) textSpan.innerText = "▶ INGRESAR AL PROTOCOLO P.A.R.A.";
    }
}

// ==========================================================================
// MOMENTO 1: PRUEBA DE ACCESO & CALIBRACIÓN CON RELOJ DIGITAL Y DIÁLOGO
// ==========================================================================

let calibrationState = {
    currentRound: 1,
    clickedTrap: false,
    timerSeconds: 45,
    timerInterval: null,
    r4TrapInterval: null,
    
    // Estado Ronda 1
    r1Count: 0,
    
    // Estado Ronda 2
    r2Count: 0,
    r2IsReady: false,
    r2WaitTimeout: null,
    r2DrainInterval: null,
    r2DrainSeconds: 5.0,

    // Estado Ronda 3
    r3Count: 0,
    r3CurrentTarget: null,
    r3DrainInterval: null,
    r3DrainSeconds: 5.0
};

const faroPromptPages = [
    {
        text: "“Hola. Soy FARO. Puedo analizar miles de variables en segundos, orientar la atención y señalar riesgos, pero todavía necesito una referencia sobre cómo responden mis operadores.”"
    },
    {
        text: "“La calibración tiene cuatro rondas, cada una con un ejercicio distinto. Debes completar las cuatro rondas antes de que termine el tiempo límite. ¿Deseas comenzar?”"
    }
];

let currentFaroPageIndex = 0;
let faroPromptAccepted = false;

function renderFaroPromptPage(pageIdx) {
    currentFaroPageIndex = pageIdx;
    const pageObj = faroPromptPages[pageIdx];

    const speechEl = document.getElementById('faro-speech-typewriter');
    const prevBtn = document.getElementById('faro-prev-btn');
    const nextBtn = document.getElementById('faro-next-btn');
    const understandBtn = document.getElementById('faro-understand-btn');

    if (speechEl) {
        speechEl.textContent = "";
        clearInterval(faroRevealTypewriterInterval);

        let charIdx = 0;
        faroRevealTypewriterInterval = setInterval(() => {
            if (charIdx < pageObj.text.length) {
                speechEl.textContent = pageObj.text.substring(0, charIdx + 1);
                charIdx++;
            } else {
                clearInterval(faroRevealTypewriterInterval);
            }
        }, 20);
    }

    if (prevBtn) {
        prevBtn.style.display = (pageIdx === 0) ? 'none' : 'inline-flex';
    }

    if (pageIdx === faroPromptPages.length - 1) {
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.classList.remove('faro-pulse-attention');
        }
        if (understandBtn) understandBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            if (!faroPromptAccepted) nextBtn.classList.add('faro-pulse-attention');
        }
        if (understandBtn) understandBtn.style.display = 'none';
    }
}

function nextFaroPromptPage() {
    if (currentFaroPageIndex < faroPromptPages.length - 1) {
        renderFaroPromptPage(currentFaroPageIndex + 1);
    }
}

function prevFaroPromptPage() {
    if (currentFaroPageIndex > 0) {
        renderFaroPromptPage(currentFaroPageIndex - 1);
    }
}

function acceptFaroPrompt() {
    faroPromptAccepted = true;
    const understandBtn = document.getElementById('faro-understand-btn');

    if (understandBtn) {
        understandBtn.innerText = "✔ ENTENDIDO";
        understandBtn.style.backgroundColor = "var(--color-cyan)";
        understandBtn.style.color = "#000";
    }

    updateGateUI();
}

function updateRoundLEDs(roundNum, statusOverride) {
    for (let i = 1; i <= 4; i++) {
        const bulb = document.getElementById(`led-bulb-${i}`);
        if (!bulb) continue;

        bulb.className = 'digital-led-bulb';
        if (statusOverride === 'red') {
            bulb.classList.add('active-red');
        } else if (statusOverride === 'green') {
            bulb.classList.add('active-green');
        } else {
            if (i === roundNum) {
                bulb.classList.add('active-blue'); // Ronda actual encendida fuerte
            } else if (i < roundNum) {
                bulb.classList.add('completed-blue'); // Completada en azul tenue sin brillo
            }
        }
    }
}

function startCalibrationExperience() {
    calibrationState.currentRound = 1;
    calibrationState.clickedTrap = false;
    calibrationState.timerSeconds = 45;
    calibrationState.r1Count = 0;
    calibrationState.r2Count = 0;
    calibrationState.r3Count = 0;
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r4TrapInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    // Reset de bombillos a apagados
    updateRoundLEDs(0);

    // Mostrar pantalla y diálogo de FARO con avatar
    switchScreenV2('screen-calibration');
    
    document.getElementById('faro-start-prompt-box').style.display = 'block';
    document.getElementById('calibration-active-area').style.display = 'none';
    document.getElementById('faro-prompt-nav-row').style.display = 'flex';

    // Reset del reloj digital e iniciar efecto máquina de escribir de diálogo FARO paginado
    updateCalibrationClockUI(45);
    renderFaroPromptPage(0);
}

function confirmStartCalibrationRounds() {
    // Al hacer clic en "SÍ, INICIAR CALIBRACIÓN"
    document.getElementById('faro-start-prompt-box').style.display = 'none';
    document.getElementById('calibration-active-area').style.display = 'block';
    document.getElementById('faro-prompt-nav-row').style.display = 'none';

    // Texto simplificado de FARO durante la calibración activa
    const faroSpeech = document.getElementById('faro-speech-typewriter');
    if (faroSpeech) faroSpeech.innerText = "“Sigue la instrucción de cada ronda. El tiempo se agota.”";

    broadcastSyncEvent('PLAYER_CALIB_ROUND_UPDATE', {
        playerId: gameStateV2.playerId,
        round: 1
    });

    // Iniciar temporizador global de calibración (45 segundos)
    startCalibrationTimer();

    // Cargar Ronda 1
    calibrationState.currentRound = 1;
    renderCalibrationRound(1);
}

function startCalibrationTimer() {
    clearInterval(calibrationState.timerInterval);
    updateCalibrationClockUI(calibrationState.timerSeconds);

    calibrationState.timerInterval = setInterval(() => {
        calibrationState.timerSeconds--;
        updateCalibrationClockUI(calibrationState.timerSeconds);

        if (calibrationState.timerSeconds <= 0) {
            triggerCalibrationFailure("⏱ TIEMPO AGOTADO // LA CALIBRACIÓN NO FUE COMPLETADA DENTRO DEL TIEMPO LÍMITE.");
        }
    }, 1000);
}

function updateCalibrationClockUI(secs) {
    const clockEl = document.getElementById('calibration-digital-clock');
    if (!clockEl) return;

    const formatted = `00:${secs.toString().padStart(2, '0')}`;
    clockEl.innerText = formatted;

    // Lógica de color: <= 20s Naranja, <= 10s Rojo
    clockEl.classList.remove('warning-orange', 'alert-red');
    if (secs <= 10) {
        clockEl.classList.add('alert-red');
    } else if (secs <= 20) {
        clockEl.classList.add('warning-orange');
    }
}

function triggerCalibrationFailure(msg) {
    clearInterval(calibrationState.timerInterval);
    clearInterval(calibrationState.r2DrainInterval);
    clearInterval(calibrationState.r3DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    // Todos los bombillos se encienden en ROJO
    updateRoundLEDs(0, 'red');

    setTimeout(() => {
        alert(msg);
        startCalibrationExperience();
    }, 400);
}

function renderCalibrationRound(roundNum) {
    const stage = document.getElementById('calibration-stage-area');
    const instructionText = document.getElementById('cal-instruction-text');
    const faroSpeech = document.getElementById('faro-speech-typewriter');
    const faroNav = document.getElementById('faro-prompt-nav-row');

    if (faroSpeech) faroSpeech.innerText = "“Sigue las instrucciones de cada ronda. El tiempo se agota.”";
    if (faroNav) faroNav.style.display = 'none';

    broadcastSyncEvent('PLAYER_CALIB_ROUND_UPDATE', {
        playerId: gameStateV2.playerId,
        round: roundNum
    });

    // Encender bombillos azules según la ronda
    updateRoundLEDs(roundNum);
    stage.innerHTML = '';

    if (roundNum === 1) {
        calibrationState.r1Count = 0;
        instructionText.innerText = "Pulsa el círculo azul tan pronto como aparezca en pantalla.";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 1</span>
                    <strong id="r1-progress-text">0 / 10</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r1-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div id="r1-target-area" style="width:100%; height:200px; position:relative; overflow:hidden;">
                <div id="cal-target-circle" style="width:70px; height:70px; background-color:var(--color-cyan); border-radius:50%; cursor:pointer; box-shadow:0 0 24px var(--color-cyan); position:absolute; display:none;" onclick="handleR1TargetClick()"></div>
            </div>
        `;

        // Retrasar 1 segundo la aparición del primer círculo azul para dar tiempo a leer la instrucción
        setTimeout(() => {
            positionR1Circle();
        }, 1000);
    } 
    else if (roundNum === 2) {
        calibrationState.r2Count = 0;
        instructionText.innerHTML = "Cuando el indicador cambie a VERDE ('¡LISTO!'), pulsa CONTINUAR.<br><span style='color:var(--color-warning-amber); font-weight:bold; font-size:13.5px;'>⚠️ ¡Antes de que se agote la carga!</span>";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 2</span>
                    <strong id="r2-progress-text">0 / 4</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r2-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div id="cal-indicator-box" style="width:140px; height:42px; background:#ff4d7a; border-radius:8px; margin-bottom:16px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; color:#fff; box-shadow:0 0 16px rgba(255,77,122,0.4);">ESPERE...</div>
            
            <button class="btn-detroit-primary" id="r2-continue-btn" onclick="handleR2BtnClick()">
                <span class="btn-text">CONTINUAR</span>
                <div class="detroit-btn-drain-bar" id="r2-drain-bar" style="width:0%;"></div>
            </button>
        `;

        startR2NextRepetition();
    }
    else if (roundNum === 3) {
        calibrationState.r3Count = 0;
        instructionText.innerText = "Selecciona el símbolo idéntico al modelo antes de que se agote la carga.";
        
        stage.innerHTML = `
            <div class="cal-progress-wrapper">
                <div class="cal-progress-header">
                    <span>PROGRESO RONDA 3</span>
                    <strong id="r3-progress-text">0 / 7</strong>
                </div>
                <div class="cal-progress-bar-bg">
                    <div class="cal-progress-bar-fill" id="r3-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            
            <!-- Modelo Cuadrado Tipo Reloj Digital -->
            <div class="model-target-box" id="r3-model-box">
                <span id="r3-target-symbol">⬡</span>
                <div class="model-timer-drain-bar" id="r3-drain-bar" style="width:100%;"></div>
            </div>
            
            <!-- Botones Cuadrados de Opción -->
            <div class="model-options-grid" id="r3-options-container">
                <!-- Se inyectan 4 botones de opción al azar -->
            </div>
        `;

        startR3Attempt();
    }
    else if (roundNum === 4) {
        // RONDA 4: EVALUACIÓN DE INHIBICIÓN
        clearInterval(calibrationState.r4TrapInterval);
        instructionText.innerHTML = "Espera a que el contador de sincronización llegue a cero <strong>ANTES</strong> de pulsar el botón.";
        stage.innerHTML = `
            <div style="text-align:center;">
                <button class="trap-sync-btn" id="trap-btn" onclick="triggerTrapClick(true)">
                    <span class="btn-text-content" id="trap-btn-text">SINCRONIZAR AHORA</span>
                    <div class="model-timer-drain-bar" id="trap-drain-bar" style="width:100%;"></div>
                </button>
                <p style="font-size:12.5px; color:var(--color-warning-amber); margin-top:15px;" id="trap-countdown-p">La sesión expira en <span id="trap-countdown" style="font-weight:bold; font-family:var(--font-mono);">4</span> segundos.</p>
            </div>
        `;

        let timeLeft = 4.0;
        const countdownEl = document.getElementById('trap-countdown');
        const drainBar = document.getElementById('trap-drain-bar');
        
        calibrationState.r4TrapInterval = setInterval(() => {
            timeLeft -= 0.1;
            if (countdownEl) countdownEl.innerText = Math.ceil(Math.max(0, timeLeft));
            if (drainBar) drainBar.style.width = `${Math.max(0, (timeLeft / 4.0) * 100)}%`;
            
            if (timeLeft <= 0) {
                clearInterval(calibrationState.r4TrapInterval);
                
                // Al terminar el tiempo de la ronda, no se finaliza automáticamente.
                // El jugador DEBE hacer clic para finalizar y lograr Inhibición Lograda.
                const btnText = document.getElementById('trap-btn-text');
                const trapBtn = document.getElementById('trap-btn');
                const countdownP = document.getElementById('trap-countdown-p');

                if (btnText) btnText.innerText = "FINALIZAR CALIBRACIÓN ▶";
                if (trapBtn) {
                    trapBtn.setAttribute('onclick', 'triggerTrapClick(false)');
                }
                if (countdownP) {
                    countdownP.innerHTML = "<span style='color:var(--color-cyan); font-weight:bold;'>✔ Tiempo de sincronización completado. Pulsa el botón para finalizar.</span>";
                }
            }
        }, 100);
    }
}

// LÓGICA RONDA 3 (7 INTENTOS ALEATORIOS CON 4s DE TIEMPO)
const r3SymbolPool = ['⬡', '△', '□', '◇', '⬢', '◯', '☆'];

function startR3Attempt() {
    clearInterval(calibrationState.r3DrainInterval);

    // Seleccionar símbolo modelo objetivo al azar
    const targetSymbol = r3SymbolPool[Math.floor(Math.random() * r3SymbolPool.length)];
    calibrationState.r3CurrentTarget = targetSymbol;

    // Seleccionar 3 distractores distintos
    const distractors = r3SymbolPool.filter(s => s !== targetSymbol);
    const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);

    // Crear arreglo de 4 opciones conteniendo el objetivo en posición al azar (lanzar dado 1 a 4)
    const options = [targetSymbol, ...shuffledDistractors].sort(() => Math.random() - 0.5);

    // Actualizar vista de Modelo
    const targetEl = document.getElementById('r3-target-symbol');
    const drainBar = document.getElementById('r3-drain-bar');
    const optionsContainer = document.getElementById('r3-options-container');

    if (targetEl) targetEl.innerText = targetSymbol;
    if (drainBar) drainBar.style.width = '100%';

    // Rellenar botones de opción
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        options.forEach(sym => {
            const btn = document.createElement('button');
            btn.className = 'model-option-btn';
            btn.innerText = sym;
            btn.onclick = () => handleR3OptionClick(sym);
            optionsContainer.appendChild(btn);
        });
    }

    // Iniciar temporizador de 4 segundos de descarga por intento
    calibrationState.r3DrainSeconds = 4.0;
    calibrationState.r3DrainInterval = setInterval(() => {
        calibrationState.r3DrainSeconds -= 0.04;
        const percentage = Math.max(0, (calibrationState.r3DrainSeconds / 4.0) * 100);

        if (drainBar) drainBar.style.width = `${percentage}%`;

        if (calibrationState.r3DrainSeconds <= 0) {
            clearInterval(calibrationState.r3DrainInterval);
            triggerCalibrationFailure("⏱ TE DEMORASTE MÁS DE 2 SEGUNDOS EN SELECCIONAR EL MODELO. DEBES VOLVER A COMENZAR.");
        }
    }, 40);
}

function handleR3OptionClick(selectedSymbol) {
    clearInterval(calibrationState.r3DrainInterval);

    if (selectedSymbol !== calibrationState.r3CurrentTarget) {
        // Error de opción (seleccionó símbolo equivocado)
        triggerCalibrationFailure("⚠️ SELECCIONASTE UN SÍMBOLO INCORRECTO. DEBES VOLVER A COMENZAR.");
        return;
    }

    // Acierto a tiempo
    calibrationState.r3Count++;
    const fill = document.getElementById('r3-progress-fill');
    const txt = document.getElementById('r3-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r3Count / 7) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r3Count} / 7`;

    if (calibrationState.r3Count < 7) {
        startR3Attempt();
    } else {
        // Ronda 3 completada -> Avanzar a Ronda 4
        completeCalRound(3);
    }
}

// LÓGICA RONDA 1
function positionR1Circle() {
    const circle = document.getElementById('cal-target-circle');
    const area = document.getElementById('r1-target-area');
    if (!circle || !area) return;

    const maxTop = Math.max(10, area.clientHeight - 80);
    const maxLeft = Math.max(10, area.clientWidth - 80);

    const randomTop = Math.floor(Math.random() * maxTop);
    const randomLeft = Math.floor(Math.random() * maxLeft);

    circle.style.top = `${randomTop}px`;
    circle.style.left = `${randomLeft}px`;
    circle.style.display = 'block';
}

function handleR1TargetClick() {
    calibrationState.r1Count++;
    const fill = document.getElementById('r1-progress-fill');
    const txt = document.getElementById('r1-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r1Count / 10) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r1Count} / 10`;

    if (calibrationState.r1Count < 10) {
        const circle = document.getElementById('cal-target-circle');
        if (circle) circle.style.display = 'none';
        setTimeout(positionR1Circle, 120);
    } else {
        // Ronda 1 Completada -> Pasar a Ronda 2
        completeCalRound(1);
    }
}

// LÓGICA RONDA 2 (4 REPETICIONES - TIEMPO PROGRESIVO ACELERADO: 5s, 4s, 3s, 2s)
function startR2NextRepetition() {
    clearInterval(calibrationState.r2DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);

    calibrationState.r2IsReady = false;
    const box = document.getElementById('cal-indicator-box');
    const drainBar = document.getElementById('r2-drain-bar');

    if (box) {
        box.style.background = '#ff4d7a';
        box.innerText = 'ESPERE...';
        box.style.color = '#fff';
        box.style.boxShadow = '0 0 16px rgba(255,77,122,0.4)';
    }

    if (drainBar) {
        drainBar.style.width = '0%';
    }

    // Tiempo de descarga progresivo (acelerando de 4s a 1s según la repetición)
    const currentActionTime = Math.max(1.0, 4.0 - calibrationState.r2Count);

    // Tiempo de espera aleatorio antes de ponerse "¡LISTO!" (1.2s - 2.2s)
    const waitTime = Math.floor(Math.random() * 1000) + 1200;
    calibrationState.r2WaitTimeout = setTimeout(() => {
        if (!box) return;

        box.style.background = '#49f5c1';
        box.innerText = '¡LISTO!';
        box.style.color = '#000';
        box.style.boxShadow = '0 0 18px rgba(73,245,193,0.6)';

        calibrationState.r2IsReady = true;
        calibrationState.r2DrainSeconds = currentActionTime;

        // Iniciar barra de descarga en el botón
        clearInterval(calibrationState.r2DrainInterval);
        calibrationState.r2DrainInterval = setInterval(() => {
            calibrationState.r2DrainSeconds -= 0.04;
            const percentage = Math.max(0, (calibrationState.r2DrainSeconds / currentActionTime) * 100);

            if (drainBar) drainBar.style.width = `${percentage}%`;

            if (calibrationState.r2DrainSeconds <= 0) {
                clearInterval(calibrationState.r2DrainInterval);
                triggerCalibrationFailure(`⏱ TE DEMORASTE MÁS DE ${Math.round(currentActionTime)} SEGUNDOS EN PULSAR CONTINUAR. DEBES VOLVER A COMENZAR.`);
            }
        }, 40);

    }, waitTime);
}

function handleR2BtnClick() {
    if (!calibrationState.r2IsReady) {
        // Clic antes de tiempo (mientras decía ESPERE)
        triggerCalibrationFailure("⚠️ PULSASTE CONTINUAR ANTES DE TIEMPO (MIENTRAS DECÍA ESPERE). DEBES VOLVER A COMENZAR.");
        return;
    }

    // Clic correcto a tiempo (mientras decía ¡LISTO!)
    clearInterval(calibrationState.r2DrainInterval);
    clearTimeout(calibrationState.r2WaitTimeout);
    calibrationState.r2Count++;

    const fill = document.getElementById('r2-progress-fill');
    const txt = document.getElementById('r2-progress-text');
    if (fill) fill.style.width = `${(calibrationState.r2Count / 4) * 100}%`;
    if (txt) txt.innerText = `${calibrationState.r2Count} / 4`;

    if (calibrationState.r2Count < 4) {
        startR2NextRepetition();
    } else {
        // Ronda 2 completada -> Pasar a Ronda 3
        completeCalRound(2);
    }
}

function completeCalRound(roundNum) {
    if (roundNum < 4) {
        calibrationState.currentRound = roundNum + 1;
        renderCalibrationRound(calibrationState.currentRound);
    }
}

function goToParaIntro() {
    switchScreenV2('screen-para-intro');
}

// ==========================================================================
// MOTOR ECONÓMICO Y DE TELEMETRÍA GLOBAL (BLOQUE 2: FÓRMULAS OFICIALES)
// ==========================================================================
const COST_MAX_K = 100000; // Constante límite superior ($100,000 = 100% de costo de operación)
const TOTAL_CASES_COUNT = 4;
const BASE_CASE_DURATION_SECONDS = 180;
const MAX_PAUSE_TOKENS_PER_CASE = 3;
const PAUSE_DURATION_SECONDS = 15;
const TOTAL_ACTIONS_PER_CASE = 6;
const ACTION_EXECUTION_TIME_SECONDS = 20;

// Tiempo máximo teórico por caso = Reloj Base (180s) + (3 Pausas * 15s) + (6 Acciones * 20s) = 345s
function getMaxCaseDurationSeconds(baseSeconds = BASE_CASE_DURATION_SECONDS) {
    return baseSeconds + (MAX_PAUSE_TOKENS_PER_CASE * PAUSE_DURATION_SECONDS) + (TOTAL_ACTIONS_PER_CASE * ACTION_EXECUTION_TIME_SECONDS);
}

// Tiempo máximo teórico del juego completo = 345s * 4 casos = 1380s
function getMaxTotalGameSeconds() {
    return getMaxCaseDurationSeconds() * TOTAL_CASES_COUNT;
}

// Índice de costo por segundo dinámico = K / Tiempo Máximo Total (100,000 / 1380 ≈ $72.46377 / seg)
function getOperationalCostPerSecond() {
    const totalSecs = getMaxTotalGameSeconds();
    return totalSecs > 0 ? (COST_MAX_K / totalSecs) : 72.46377;
}

// Control de tarjetas P.A.R.A. y activación del Modal de Objetivo
let flippedParaCards = new Set();

function flipParaCard(cardEl, letter) {
    if (!cardEl) return;
    cardEl.classList.toggle('flipped');
    if (letter) {
        flippedParaCards.add(letter);
    }
    
    const startBtn = document.getElementById('para-start-case-btn');
    if (startBtn) {
        const count = flippedParaCards.size;
        if (count >= 4) {
            startBtn.disabled = false;
            startBtn.classList.remove('btn-disabled-mission');
            startBtn.innerHTML = `
                <span class="detroit-btn-glow"></span>
                <span class="btn-text">🚀 CONTINUAR AL OBJETIVO DEL SISTEMA ▶</span>
            `;
            startBtn.onclick = () => openGameObjectiveModal();
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('btn-disabled-mission');
            const btnText = startBtn.querySelector('.btn-text');
            if (btnText) btnText.innerText = `🔒 VOLTEA TODAS LAS TARJETAS (${count}/4)`;
        }
    }
}

function openGameObjectiveModal() {
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'game-objective-overlay' });
    }
    updateGateUI();
}

function closeGameObjectiveModalAndStartGame() {
    const overlay = document.getElementById('game-objective-overlay');
    if (overlay) overlay.style.display = 'none';
    startCaseSequence(0);
}

// ==========================================================================
// RUNNER DE CASOS (CON NAVEGACIÓN EN 3 MOMENTOS DE IMAGEN)
// ==========================================================================

function startCaseSequence(caseIdx) {
    gameStateV2.currentCaseIndex = caseIdx;
    const cData = casesDataV2[caseIdx];

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_CASE_ENTER', { playerId: gameStateV2.playerId, caseIndex: caseIdx });
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'screen-case' });
    }

    // Reiniciar tracking de P.A.R.A. para este caso
    gameStateV2.paraState = {
        pUsed: false,
        activeTab: 'P',
        aOpened: false,
        completedAnalyses: [],
        analysisIndex: 0,
        rOpened: false,
        rIndex: 0,
        completedReviews: [],
        rResourcesOpened: [],
        unlockedActions: [],
        finalActionId: null,
        finalActionText: null,
        routeTag: 'Respuesta directa'
    };

    // Caso 2: Lanzar dado 50/50 para variante
    if (cData.id === "case_2") {
        gameStateV2.currentCaseVariant = Math.random() < 0.5 ? "legitimate" : "malicious";
    } else {
        gameStateV2.currentCaseVariant = null;
    }

    // Reiniciar 3 Tokens de Pausa por Caso
    gameStateV2.casePauseTokens = 3;
    gameStateV2.initialImpulse = null;
    gameStateV2.impulseStartTime = null;
    gameStateV2.currentCaseImpulseData = null;
    gameStateV2.caseTimerSeconds = cData.durationSeconds || 180;
    gameStateV2.isTimerPaused = false;
    gameStateV2.isPauseActive = false;
    clearInterval(gameStateV2.timerInterval);

    // MOMENTO 1: Cargar Pantalla de Introducción del Caso
    document.getElementById('case-phase-intro').style.display = 'block';
    document.getElementById('case-phase-gameplay').style.display = 'none';
    const metricsPanel = document.getElementById('case-phase-metrics-a');
    if (metricsPanel) metricsPanel.style.display = 'none';
    document.getElementById('case-phase-feedback').style.display = 'none';

    document.getElementById('case-intro-img-16-4').src = cData.image;
    document.getElementById('case-intro-title-id').innerText = cData.title;
    document.getElementById('case-intro-target-module').innerText = cData.targetModule;
    document.getElementById('case-intro-description-text').innerText = cData.introDescription;

    const caseNumStr = String(caseIdx + 1).padStart(2, '0');
    const startBtnText = document.getElementById('case-intro-start-btn-text');
    if (startBtnText) {
        startBtnText.innerText = `▶ INGRESAR AL CASO ${caseNumStr}`;
    }

    switchScreenV2('screen-case');
}

function proceedFromIntroToGame() {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];

    // MOMENTO 2: Entrar al Gameplay del Caso
    document.getElementById('case-phase-intro').style.display = 'none';
    document.getElementById('case-phase-gameplay').style.display = 'block';

    // Sub-fase 2A: Briefing e Impulso
    document.getElementById('case-subphase-brief').style.display = 'block';
    document.getElementById('case-subphase-para').style.display = 'none';

    // Cargar Banner Cropped
    document.getElementById('case-gameplay-banner-img').src = cData.image;
    document.getElementById('case-gameplay-title-tag').innerText = cData.title;
    document.getElementById('case-stimulus-content').innerHTML = cData.stimulusHtml;

    // Cargar Contenido Completo del Caso en la Cortina Desplegable
    const curtainContentEl = document.getElementById('full-case-curtain-content');
    if (curtainContentEl) {
        curtainContentEl.innerHTML = cData.stimulusHtml;
    }
    // Asegurar que la cortina inicie cerrada
    const curtainEl = document.getElementById('full-case-curtain');
    if (curtainEl) curtainEl.style.display = 'none';

    // Cargar Resumen Corto del Caso para recordación permanente
    const summaryTextEl = document.getElementById('case-short-summary-text');
    if (summaryTextEl) {
        summaryTextEl.innerText = cData.shortSummary || cData.introDescription;
    }

    // Registrar marca de tiempo de inicio de lectura de impulso
    gameStateV2.impulseStartTime = Date.now();

    // En la sub-fase 2A el caso ya es visible directamente en pantalla: desactivar el botón de la cortina
    const curtainBtn = document.getElementById('curtain-toggle-btn');
    if (curtainBtn) {
        curtainBtn.disabled = true;
        curtainBtn.style.opacity = '0.35';
        curtainBtn.style.cursor = 'not-allowed';
        curtainBtn.title = "El caso ya está visible en pantalla";
    }

    // Cargar Botones de Impulso Inicial
    const impContainer = document.getElementById('impulse-options-container');
    impContainer.innerHTML = '';
    cData.impulses.forEach((imp, idx) => {
        const btn = document.createElement('button');
        btn.className = 'impulse-btn';
        btn.innerText = imp.text;
        const impId = imp.id || `imp_${idx + 1}`;
        btn.onclick = () => recordInitialImpulse(imp.text, impId);
        impContainer.appendChild(btn);
    });

    // Iniciar Temporizador de Impulso (59 Segundos)
    let impulseTime = 59;
    const impulseTimerEl = document.getElementById('impulse-timer-display');
    if (impulseTimerEl) impulseTimerEl.innerText = `⏱ ${impulseTime}s`;

    const impulseInterval = setInterval(() => {
        impulseTime--;
        if (impulseTimerEl) impulseTimerEl.innerText = `⏱ ${impulseTime}s`;
        if (impulseTime <= 0 || gameStateV2.initialImpulse) {
            clearInterval(impulseInterval);
            if (!gameStateV2.initialImpulse) {
                recordInitialImpulse("Sin respuesta impulsiva registrada (Expiró 59s)", "timeout");
            }
        }
    }, 1000);
}

function toggleCaseCurtain() {
    const btn = document.getElementById('curtain-toggle-btn');
    if (btn && btn.disabled) return;

    const curtain = document.getElementById('full-case-curtain');
    const arrow = document.getElementById('curtain-arrow-icon');
    if (!curtain) return;

    // Asegurar que el contenido del caso esté inyectado
    const curtainContentEl = document.getElementById('full-case-curtain-content');
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    if (curtainContentEl && cData && (!curtainContentEl.innerHTML || curtainContentEl.innerHTML.trim() === '')) {
        curtainContentEl.innerHTML = cData.stimulusHtml;
    }

    const isExpanded = curtain.classList.contains('expanded') || curtain.style.display === 'block';

    if (!isExpanded) {
        curtain.classList.add('expanded');
        curtain.style.display = 'block';
        if (arrow) arrow.innerText = '🔼';
        if (btn) btn.innerHTML = '<span>OCULTAR CASO</span> <span class="curtain-arrow" id="curtain-arrow-icon">🔼</span>';
    } else {
        curtain.classList.remove('expanded');
        curtain.style.display = 'none';
        if (arrow) arrow.innerText = '🔽';
        if (btn) btn.innerHTML = '<span>VER CASO COMPLETO</span> <span class="curtain-arrow" id="curtain-arrow-icon">🔽</span>';
    }
}

function recordInitialImpulse(impulseText, impulseId) {
    gameStateV2.initialImpulse = impulseText;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_INITIAL_REACTION', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    const respTimeSec = gameStateV2.impulseStartTime ? ((Date.now() - gameStateV2.impulseStartTime) / 1000) : 0;
    gameStateV2.currentCaseImpulseData = {
        id: impulseId || 'unknown',
        text: impulseText,
        responseTimeSeconds: parseFloat(respTimeSec.toFixed(1))
    };

    // Al pasar al Hub P.A.R.A., reactivar el botón de cortina
    const curtainBtn = document.getElementById('curtain-toggle-btn');
    if (curtainBtn) {
        curtainBtn.disabled = false;
        curtainBtn.style.opacity = '1';
        curtainBtn.style.cursor = 'pointer';
        curtainBtn.title = "Ver o desplegar el caso completo";
    }

    // Transición a Sub-fase 2B: Hub P.A.R.A.
    document.getElementById('case-subphase-brief').style.display = 'none';
    document.getElementById('case-subphase-para').style.display = 'block';

    // Iniciar Temporizador Principal del Caso
    startCaseMainTimer();
    updateCaseUIState();
    renderParaDashboard();
}

function startCaseMainTimer() {
    clearInterval(gameStateV2.timerInterval);
    updateCaseTimerDisplay();

    gameStateV2.timerInterval = setInterval(() => {
        if (!gameStateV2.isTimerPaused) {
            gameStateV2.caseTimerSeconds--;
            updateCaseTimerDisplay();

            if (gameStateV2.caseTimerSeconds <= 0) {
                clearInterval(gameStateV2.timerInterval);
                handleCaseTimeout();
            }
        }
    }, 1000);
}

function updateCaseTimerDisplay() {
    const timerEl = document.getElementById('case-main-timer');
    if (!timerEl) return;

    const mins = Math.floor(gameStateV2.caseTimerSeconds / 60);
    const secs = gameStateV2.caseTimerSeconds % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateCaseUIState() {
    document.getElementById('current-route-tag').innerText = gameStateV2.paraState.routeTag;
    
    // Bombillos Pausa P (Inician 3 encendidos, se apagan al usar)
    const b1 = document.getElementById('p-bulb-1');
    const b2 = document.getElementById('p-bulb-2');
    const b3 = document.getElementById('p-bulb-3');

    if (b1) b1.className = gameStateV2.casePauseTokens >= 1 ? 'pause-bulb active' : 'pause-bulb used';
    if (b2) b2.className = gameStateV2.casePauseTokens >= 2 ? 'pause-bulb active' : 'pause-bulb used';
    if (b3) b3.className = gameStateV2.casePauseTokens >= 3 ? 'pause-bulb active' : 'pause-bulb used';

    // Bombillos Analizar A (Inician 3 apagados, se encienden al desbloquear)
    const completedCount = (gameStateV2.paraState.completedAnalyses || []).length;
    const a1 = document.getElementById('a-bulb-1');
    const a2 = document.getElementById('a-bulb-2');
    const a3 = document.getElementById('a-bulb-3');

    if (a1) a1.className = completedCount >= 1 ? 'analizar-bulb active' : 'analizar-bulb off';
    if (a2) a2.className = completedCount >= 2 ? 'analizar-bulb active' : 'analizar-bulb off';
    if (a3) a3.className = completedCount >= 3 ? 'analizar-bulb active' : 'analizar-bulb off';

    const aSub = document.querySelector('#btn-para-a .btn-sub');
    if (aSub) aSub.innerText = `Puertas (${completedCount}/3)`;



    const pBtn = document.getElementById('btn-para-p');
    if (pBtn) {
        if (gameStateV2.isPauseActive || gameStateV2.casePauseTokens <= 0) {
            pBtn.disabled = true;
            pBtn.style.opacity = '0.4';
            pBtn.style.cursor = 'not-allowed';
        } else {
            pBtn.disabled = false;
            pBtn.style.opacity = '1';
            pBtn.style.cursor = 'pointer';
        }
    }
}

// ==========================================================================
// BOTONES P.A.R.A. (PAUSAR, ANALIZAR, REVISAR, ACTUAR)
// ==========================================================================

function executeParaP() {
    gameStateV2.paraState.activeTab = 'P';

    if (gameStateV2.isPauseActive) {
        renderParaDashboard();
        return;
    }

    if (gameStateV2.casePauseTokens <= 0) {
        renderParaDashboard();
        alert("⚠️ No te quedan tokens de Pausa para este caso.");
        return;
    }

    gameStateV2.casePauseTokens--;
    gameStateV2.paraState.pUsed = true;
    gameStateV2.paraState.pausesUsedCount = (gameStateV2.paraState.pausesUsedCount || 0) + 1;
    gameStateV2.isTimerPaused = true;
    gameStateV2.isPauseActive = true;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_PAUSE', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    // REGLA DE NEGOCIO: Cada pausa accionada reduce 1 punto en Reactividad
    applyHudReactivityDelta(-1);

    updateCaseUIState();
    renderParaDashboard();

    const display = document.getElementById('para-content-display');
    display.innerHTML = `
        <div style="background:rgba(0,216,255,0.08); border:1.5px solid var(--color-cyan); padding:16px; border-radius:8px; text-align:center;">
            <h3 style="color:var(--color-cyan); margin-bottom:6px;">⏸ TIEMPO CONGELADO POR 15 SEGUNDOS</h3>
            <p style="font-size:13.5px; color:#d8eaff; margin-bottom:6px;">“Pausar no resuelve el problema, pero te da espacio para mirar mejor.”</p>
            <div style="font-size:12px; color:var(--color-agency-green); font-weight:700; margin-bottom:8px;">⚡ Reactividad: -1</div>
            <div style="margin-top:4px; font-weight:bold; font-family:var(--font-mono); color:var(--color-cyan); font-size:22px;" id="pause-countdown-text">15s</div>
        </div>
    `;

    let pCount = 15;
    const pInterval = setInterval(() => {
        pCount--;
        const cntEl = document.getElementById('pause-countdown-text');
        if (cntEl) cntEl.innerText = `${pCount}s`;
        if (pCount <= 0) {
            clearInterval(pInterval);
            gameStateV2.isTimerPaused = false;
            gameStateV2.isPauseActive = false;
            updateCaseUIState();
            renderParaDashboard();
        }
    }, 1000);
}

function renderParaDashboard() {
    const display = document.getElementById('para-content-display');
    if (!display) return;

    const activeTab = gameStateV2.paraState.activeTab || 'P';

    // 1. Actualizar estado de clase active-tab en los 4 botones (Mueve la flecha luminosa)
    const btnP = document.getElementById('btn-para-p');
    const btnA = document.getElementById('btn-para-a');
    const btnR = document.getElementById('btn-para-r');
    const btnA2 = document.getElementById('btn-para-a2');

    if (btnP) btnP.classList.toggle('active-tab', activeTab === 'P');
    if (btnA) btnA.classList.toggle('active-tab', activeTab === 'A');
    if (btnR) btnR.classList.toggle('active-tab', activeTab === 'R');
    if (btnA2) btnA2.classList.toggle('active-tab', activeTab === 'A2');

    // 2. Actualizar tema de borde neón del contenedor Dashboard según la letra activa
    display.classList.remove('dash-theme-p', 'dash-theme-a', 'dash-theme-r', 'dash-theme-a2');
    if (activeTab === 'P') display.classList.add('dash-theme-p');
    else if (activeTab === 'A') display.classList.add('dash-theme-a');
    else if (activeTab === 'R') display.classList.add('dash-theme-r');
    else if (activeTab === 'A2') display.classList.add('dash-theme-a2');

    const completedA = gameStateV2.paraState.completedAnalyses || [];
    const completedR = gameStateV2.paraState.completedReviews || [];
    const pUsed = gameStateV2.paraState.pUsed;

    let html = '';

    // 3. Renderizar únicamente el contenido filtrado por la letra seleccionada
    if (activeTab === 'P') {
        if (pUsed) {
            html = `
                <div class="para-dashboard-card p-theme">
                    <div class="dash-card-header">
                        <span class="dash-letter-tag p-tag">P</span>
                        <strong class="dash-card-title" style="color:var(--color-cyan);">PAUSAR // TIEMPO CONGELADO 15S</strong>
                    </div>
                    <p class="dash-card-text">Pausa realizada con éxito. El tiempo principal del caso se congeló por 15 segundos para detener la respuesta automática y deliberar con calma.</p>
                </div>
            `;
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-cyan);">⏸ Aún no has utilizado <strong>Pausar (P)</strong>. Haz clic en el botón de Pausar para congelar el tiempo 15s y reflexionar.</p>
                </div>
            `;
        }
    } else if (activeTab === 'A') {
        if (completedA.length > 0) {
            completedA.forEach((item) => {
                html += `
                    <div class="para-dashboard-card a-theme" style="margin-bottom:12px;">
                        <div class="dash-card-header">
                            <span class="dash-letter-tag a-tag">A</span>
                            <strong class="dash-card-title" style="color:#a29bfe;">ANALIZAR // ${item.title}</strong>
                        </div>
                        <p class="dash-card-text" style="font-weight:600; color:#ffffff;">“${item.reflectionText}”</p>
                        <div style="background:rgba(162,155,254,0.1); padding:8px 12px; border-radius:4px; border-left:3px solid #a29bfe; margin-top:4px;">
                            <strong style="color:#a29bfe; font-size:12px;">✔ Tu Percepción:</strong>
                            <span style="font-size:13px; color:#ffffff; margin-left:4px;">${item.selectedText}</span>
                        </div>
                        <p style="font-size:12px; color:var(--color-agency-green); margin-top:4px; font-style:italic;">${item.feedback}</p>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:#a29bfe;">🔍 Aún no has examinado Puertas de <strong>Analizar (A)</strong>. Haz clic en el botón de Analizar para abrir la primera puerta metacognitiva.</p>
                </div>
            `;
        }
    } else if (activeTab === 'R') {
        const reviewsMap = gameStateV2.paraState.reviewsState || {};
        const reviewItems = Object.values(reviewsMap);

        if (reviewItems.length > 0) {
            reviewItems.forEach((item) => {
                const isConsidered = item.decision === 'considered';
                if (isConsidered) {
                    html += `
                        <div class="para-dashboard-card r-theme clickable-card" style="margin-bottom:12px;" onclick="reopenReviewDecision('${item.id}')">
                            <div class="dash-card-header">
                                <span class="dash-letter-tag r-tag">R</span>
                                <strong class="dash-card-title" style="color:var(--color-agency-green);">REVISAR // ${item.name}</strong>
                                <span style="background:rgba(73,245,193,0.2); color:var(--color-agency-green); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:auto;">✔ CONSIDERADA</span>
                            </div>
                            <p class="dash-card-text">${item.text}</p>
                            <div style="background:rgba(73,245,193,0.08); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-agency-green); margin-top:4px;">
                                <strong style="color:var(--color-agency-green); font-size:12px;">Efectos de la Evidencia:</strong>
                                <p style="font-size:12px; color:#ffffff; margin-top:2px;">${item.feedback}</p>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="para-dashboard-card rejected-theme clickable-card" style="margin-bottom:12px;" onclick="reopenReviewDecision('${item.id}')">
                            <div class="dash-card-header">
                                <span class="dash-letter-tag" style="background:rgba(255,181,71,0.2); color:var(--color-warning-amber); border:1px solid var(--color-warning-amber); padding:2px 8px; border-radius:4px; font-weight:800;">R</span>
                                <strong class="dash-card-title" style="color:var(--color-warning-amber);">REVISAR // ${item.name}</strong>
                                <span style="background:rgba(255,181,71,0.2); color:var(--color-warning-amber); font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:auto;">❌ NO CONSIDERADA (CLIC PARA CAMBIAR)</span>
                            </div>
                            <p class="dash-card-text" style="color:#e0d0b8;">${item.text}</p>
                            <div style="background:rgba(255,181,71,0.08); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-warning-amber); margin-top:4px;">
                                <strong style="color:var(--color-warning-amber); font-size:12px;">Decisión de Rechazo:</strong>
                                <p style="font-size:12px; color:#ffffff; margin-top:2px;">${item.feedback}</p>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-agency-green);">📋 Aún no has consultado Evidencias de <strong>Revisar (R)</strong>. Haz clic en el botón de Revisar para abrir los datos e investigar.</p>
                </div>
            `;
        }
    } else if (activeTab === 'A2') {
        if (gameStateV2.paraState.finalActionText) {
            html = `
                <div class="para-dashboard-card a2-theme">
                    <div class="dash-card-header">
                        <span class="dash-letter-tag a2-tag">A</span>
                        <strong class="dash-card-title" style="color:var(--color-warning-amber);">ACTUAR // DECISIÓN FINAL EJECUTADA</strong>
                    </div>
                    <p class="dash-card-text" style="font-weight:600; color:#ffffff;">Acciones Seleccionadas: ${gameStateV2.paraState.finalActionText}</p>
                    <div style="background:rgba(255,181,71,0.1); padding:8px 12px; border-radius:4px; border-left:3px solid var(--color-warning-amber); margin-top:6px;">
                        <strong style="color:var(--color-warning-amber); font-size:12px;">Estado del Caso:</strong>
                        <p style="font-size:12px; color:#ffffff; margin-top:2px;">Decisión multiselección procesada e irreversible. Caso finalizado con éxito.</p>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="placeholder-info">
                    <p style="color:var(--color-warning-amber);">⚡ La sección <strong>Actuar (A)</strong> te permite seleccionar una o múltiples opciones disponibles para ejecutar la decisión final del caso.</p>
                </div>
            `;
        }
    }

    display.innerHTML = html;
    display.scrollTop = display.scrollHeight;
}

function executeParaA() {
    gameStateV2.paraState.activeTab = 'A';
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const rounds = cData.analysisRounds || [
        {
            id: 1,
            title: "EJE 1 // RECONOCIMIENTO DE SESGO & URGENCIA",
            reflectionText: "98,7% es una cifra de confianza del modelo. ¿Qué parte de tu decisión depende de esa cifra y qué evidencia concreta tienes sobre el alcance real del incidente?",
            question: "¿Qué despierta o activa en ti esta información en primera instancia?",
            options: [
                { text: "Presión de inmediatez para proteger la red rápidamente.", feedback: "✔ Observación realizada: Identificaste la influencia del sesgo de urgencia." },
                { text: "Duda por temor a provocar una interrupción operativa innecesaria.", feedback: "✔ Observación realizada: Reconociste la cautela ante el impacto del servicio." },
                { text: "Confianza en la precisión tecnológica del Facilitador FARO.", feedback: "✔ Observación realizada: Detectaste la inclinación a confiar en la cifra de IA." }
            ]
        },
        {
            id: 2,
            title: "EJE 2 // VALORACIÓN DE PÉRDIDA DE AGENCIA",
            reflectionText: "La respuesta propuesta afecta 312 cuentas y tres servicios. ¿Qué ocurriría si FARO tiene razón y qué ocurriría si está equivocado?",
            question: "¿Cómo percibes el impacto de esta respuesta en la agencia sobre el sistema?",
            options: [
                { text: "Prioridad a la seguridad sin importar la falta de confirmación previa.", feedback: "✔ Observación realizada: Elegiste priorizar el cerramiento defensivo." },
                { text: "Necesidad de verificar si las 300 cuentas realmente están comprometidas.", feedback: "✔ Observación realizada: Identificaste el deseo de evitar falsos positivos." },
                { text: "Preocupación por la transferencia de control operativo a la máquina.", feedback: "✔ Observación realizada: Registraste la inquietud por la delegación masiva." }
            ]
        },
        {
            id: 3,
            title: "EJE 3 // ALTERNATIVAS DE DELIBERACIÓN",
            reflectionText: "Hay algo fácil de olvidar: no decidir también puede ser una decisión. ¿Qué ocurriría si simplemente dejas que opere la configuración actual?",
            question: "¿Qué consideras más valioso en este punto de la deliberación?",
            options: [
                { text: "Ganar tiempo para analizar evidencia secundaria antes de cortar servicios.", feedback: "✔ Observación realizada: Priorizaste la pausa deliberativa." },
                { text: "Ejecutar la contención inmediata para evitar riesgos mayores.", feedback: "✔ Observación realizada: Decidiste tomar una postura inmediata." },
                { text: "Buscar canales independientes para validar el origen de la alerta.", feedback: "✔ Observación realizada: Valoraste la verificación de fuentes independientes." }
            ]
        }
    ];

    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');
    const currIdx = gameStateV2.paraState.analysisIndex || 0;

    // Si ya se completaron las 3 tarjetas, NO se abre modal. Se muestra directamente el Dashboard.
    if (currIdx >= rounds.length) {
        renderParaDashboard();
        const display = document.getElementById('para-content-display');
        if (display) {
            display.scrollTop = 0;
        }
        return;
    }

    const currentExercise = rounds[currIdx];

    let optionsHtml = currentExercise.options.map((opt, optIdx) => `
        <button class="analizar-option-btn" onclick="submitAnalysisAnswer(${currIdx}, ${optIdx})">
            <span class="opt-bullet">${String.fromCharCode(65 + optIdx)})</span>
            <span class="opt-text">${opt.text}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:#a29bfe; font-family:var(--font-heading); font-size:14px;">ANALIZAR // PUERTAS METACOGNITIVAS (${currIdx + 1}/${rounds.length})</h3>
            <button class="fac-btn" onclick="closeParaModal()">✖</button>
        </div>

        <div style="background:#03080f; border:2px solid #a29bfe; border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(162,155,254,0.3);">
            <strong style="color:#a29bfe; font-size:11.5px; font-family:var(--font-heading); display:block; margin-bottom:4px;">${currentExercise.title}</strong>
            <p style="font-size:13.5px; color:#ffffff; line-height:1.45;">“${currentExercise.reflectionText}”</p>
        </div>

        <div style="background:rgba(162,155,254,0.06); border:1px solid rgba(162,155,254,0.2); padding:14px; border-radius:8px;">
            <strong style="font-size:13px; color:#a29bfe; display:block; margin-bottom:8px;">PREGUNTA DE OBSERVAR SUPUESTOS:</strong>
            <p style="font-size:13px; color:#e2f1ff; margin-bottom:12px;">${currentExercise.question || "¿Qué despierta o activa en ti esta información en primera instancia?"}</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${optionsHtml}
            </div>
        </div>
    `;

    overlay.style.display = 'flex';
}

function submitAnalysisAnswer(roundIdx, optIdx) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const rounds = cData.analysisRounds || [
        {
            id: 1,
            title: "EJE 1 // RECONOCIMIENTO DE SESGO & URGENCIA",
            reflectionText: "98,7% es una cifra de confianza del modelo. ¿Qué parte de tu decisión depende de esa cifra y qué evidencia concreta tienes sobre el alcance real del incidente?",
            question: "¿Qué despierta o activa en ti esta información en primera instancia?",
            options: [
                { text: "Presión de inmediatez para proteger la red rápidamente.", feedback: "✔ Observación realizada: Identificaste la influencia del sesgo de urgencia." },
                { text: "Duda por temor a provocar una interrupción operativa innecesaria.", feedback: "✔ Observación realizada: Reconociste la cautela ante el impacto del servicio." },
                { text: "Confianza en la precisión tecnológica del Facilitador FARO.", feedback: "✔ Observación realizada: Detectaste la inclinación a confiar en la cifra de IA." }
            ]
        },
        {
            id: 2,
            title: "EJE 2 // VALORACIÓN DE PÉRDIDA DE AGENCIA",
            reflectionText: "La respuesta propuesta afecta 312 cuentas y tres servicios. ¿Qué ocurriría si FARO tiene razón y qué ocurriría si está equivocado?",
            question: "¿Cómo percibes el impacto de esta respuesta en la agencia sobre el sistema?",
            options: [
                { text: "Prioridad a la seguridad sin importar la falta de confirmación previa.", feedback: "✔ Observación realizada: Elegiste priorizar el cerramiento defensivo." },
                { text: "Necesidad de verificar si las 300 cuentas realmente están comprometidas.", feedback: "✔ Observación realizada: Identificaste el deseo de evitar falsos positivos." },
                { text: "Preocupación por la transferencia de control operativo a la máquina.", feedback: "✔ Observación realizada: Registraste la inquietud por la delegación masiva." }
            ]
        },
        {
            id: 3,
            title: "EJE 3 // ALTERNATIVAS DE DELIBERACIÓN",
            reflectionText: "Hay algo fácil de olvidar: no decidir también puede ser una decisión. ¿Qué ocurriría si simplemente dejas que opere la configuración actual?",
            question: "¿Qué consideras más valioso en este punto de la deliberación?",
            options: [
                { text: "Ganar tiempo para analizar evidencia secundaria antes de cortar servicios.", feedback: "✔ Observación realizada: Priorizaste la pausa deliberativa." },
                { text: "Ejecutar la contención inmediata para evitar riesgos mayores.", feedback: "✔ Observación realizada: Decidiste tomar una postura inmediata." },
                { text: "Buscar canales independientes para validar el origen de la alerta.", feedback: "✔ Observación realizada: Valoraste la verificación de fuentes independientes." }
            ]
        }
    ];

    const exercise = rounds[roundIdx];
    const selectedOpt = exercise.options[optIdx];

    // REGLAS DE NEGOCIO ANALIZAR:
    // 1. Calibración: siempre aumenta en +1 unidad
    applyHudCalibrationDelta(1);

    // 2. Reactividad: asignación 50/50 (azar). Si afecta, disminuye en 1 (-1)
    const affectsReactivity = Math.random() < 0.5;
    if (affectsReactivity) {
        applyHudReactivityDelta(-1);
    }

    if (!gameStateV2.paraState.completedAnalyses) {
        gameStateV2.paraState.completedAnalyses = [];
    }

    gameStateV2.paraState.completedAnalyses.push({
        title: exercise.title,
        reflectionText: exercise.reflectionText,
        selectedText: selectedOpt.text,
        feedback: selectedOpt.feedback,
        calibrationDelta: 1,
        reactivityDelta: affectsReactivity ? -1 : 0,
        reactivityAffected: affectsReactivity
    });

    gameStateV2.paraState.analysisIndex = (gameStateV2.paraState.analysisIndex || 0) + 1;
    gameStateV2.paraState.aOpened = true;
    gameStateV2.paraState.activeTab = 'A';
    gameStateV2.paraState.routeTag = `Análisis (${gameStateV2.paraState.completedAnalyses.length}/${rounds.length})`;
    updateCaseUIState();

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_ANALYSIS', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
    }

    const modal = document.getElementById('para-modal-card');
    
    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:12px;">
            <h3 style="color:#a29bfe; font-family:var(--font-heading); font-size:14px; margin:0;">ANALIZAR // OBSERVACIÓN DE SUPUESTOS</h3>
            <span style="font-size:10.5px; color:#49f5c1; font-family:var(--font-mono); font-weight:700; letter-spacing:0.5px;">PROCESANDO REFLEXIÓN</span>
        </div>

        <div style="background:#03080f; border:1.5px solid #a29bfe; border-radius:6px; padding:12px; margin-bottom:10px;">
            <strong style="color:#a29bfe; font-size:11px; font-family:var(--font-heading); display:block; margin-bottom:2px;">${exercise.title}</strong>
            <p style="font-size:12.5px; color:#cde4f7; line-height:1.35; margin:0;">“${exercise.reflectionText}”</p>
        </div>

        <div style="background:rgba(162,155,254,0.08); border:1px solid rgba(162,155,254,0.25); padding:12px; border-radius:6px; margin-bottom:12px;">
            <strong style="font-size:11.5px; color:#ffffff; display:block; margin-bottom:2px;">TU OBSERVACIÓN:</strong>
            <p style="font-size:12.5px; color:#a29bfe; font-weight:600; margin:0 0 6px 0;">${selectedOpt.text}</p>
            <div style="background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:4px; border-left:3px solid var(--color-agency-green);">
                <p style="font-size:12px; color:#49f5c1; margin:0; line-height:1.35;">${selectedOpt.feedback}</p>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                <span style="font-size:11px; background:rgba(0,216,255,0.12); border:1px solid var(--color-cyan); color:var(--color-cyan); padding:2px 8px; border-radius:4px; font-weight:700;">🎯 Calibración: +1</span>
                <span style="font-size:11px; background:${affectsReactivity ? 'rgba(73,245,193,0.15)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${affectsReactivity ? 'var(--color-agency-green)' : 'rgba(255,255,255,0.2)'}; color:${affectsReactivity ? 'var(--color-agency-green)' : 'var(--color-text-muted)'}; padding:2px 8px; border-radius:4px; font-weight:700;">
                    ⚡ Reactividad: ${affectsReactivity ? '-1' : '0'}
                </span>
            </div>
        </div>

        <!-- INDICADOR VISUAL DE DESCARGA DE 5 SEGUNDOS (ESTILO CALIBRACIÓN RONDA 3) -->
        <div style="background:#02060c; border:1px solid rgba(162,155,254,0.3); border-radius:6px; padding:8px 12px; text-align:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="font-size:11px; color:#a29bfe; font-weight:700;">⏱ PROCESANDO REFLEXIÓN...</span>
                <span style="font-size:11px; color:#ffffff; font-family:var(--font-mono); font-weight:700;" id="analysis-drain-timer">5.0s</span>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                <div id="analysis-drain-bar" style="width:100%; height:100%; background:linear-gradient(90deg, #a29bfe, var(--color-agency-green)); transition: width 0.05s linear;"></div>
            </div>
        </div>
    `;

    clearInterval(analysisCountdownInterval);
    let timeLeftMs = 5000;
    const totalMs = 5000;

    analysisCountdownInterval = setInterval(() => {
        timeLeftMs -= 50;
        const drainBar = document.getElementById('analysis-drain-bar');
        const timerText = document.getElementById('analysis-drain-timer');

        if (drainBar) {
            const pct = Math.max(0, (timeLeftMs / totalMs) * 100);
            drainBar.style.width = `${pct}%`;
        }
        if (timerText) {
            timerText.innerText = `${(Math.max(0, timeLeftMs) / 1000).toFixed(1)}s`;
        }

        if (timeLeftMs <= 0) {
            clearInterval(analysisCountdownInterval);
            finishAnalysisFeedbackEarly();
        }
    }, 50);
}

let analysisCountdownInterval = null;

function finishAnalysisFeedbackEarly() {
    clearInterval(analysisCountdownInterval);
    closeParaModal();
    renderParaDashboard();
}

function answerAnalysisQuestion(answer) {
    gameStateV2.paraState.aAnswered = answer;
    closeParaModal();

    const display = document.getElementById('para-content-display');
    display.innerHTML = `
        <div style="background:rgba(162,155,254,0.08); border-left:4px solid #a29bfe; padding:14px; border-radius:0 6px 6px 0;">
            <strong style="color:#a29bfe; font-size:13px;">🔍 ANÁLISIS METACOGNITIVO REGISTRADO:</strong>
            <p style="font-size:13px; margin-top:4px;">Reconociste que tu decisión está influida por: <strong>${answer}</strong>.</p>
            <p style="font-size:12px; color:var(--color-text-muted); margin-top:6px;">Observar tus supuestos te otorga mayor perspectiva para decidir.</p>
        </div>
    `;
}

function executeParaR() {
    gameStateV2.paraState.activeTab = 'R';
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const resources = cData.reviewResources || [
        {
            id: "res_1",
            name: "Registro de origen",
            text: "REGISTRO DE ORIGEN: La alerta proviene de una sola fuente de telemetría. Doce cuentas presentan actividad anómala confirmada. Las 300 restantes están relacionadas por patrón.",
            actionId: "limited_containment",
            actionText: "D. Limitar la autonomía (Aislar 12 cuentas confirmadas y exigir aprobación humana para bloqueos permanentes).",
            feedbackConsidered: "✔ Considerada: Confirmas que el riesgo inminente está focalizado en 12 cuentas. Se ha desbloqueado la opción 'Limitar la autonomía' en ACTUAR.",
            feedbackRejected: "✖ No Considerada: Desestimaste la telemetría focalizada. La opción de contención limitada NO estará disponible en ACTUAR."
        },
        {
            id: "res_2",
            name: "Desempeño de FARO",
            text: "DESEMPEÑO DE FARO: En las últimas pruebas internas: 97% de amenazas críticas detectadas, 92% de recomendaciones aceptadas por operadores y 4 incidentes resueltos sin escalamiento.",
            actionId: "controlled_audit",
            actionText: "D. Auditoría Técnica de Algoritmo (Pausar tareas automáticas de FARO para inspección de código).",
            feedbackConsidered: "✔ Considerada: Verificas el historial del modelo. Se ha añadido la opción de 'Auditoría Técnica' en ACTUAR.",
            feedbackRejected: "✖ No Considerada: Decidiste ignorar el historial de FARO. No se añadirá esta opción en ACTUAR."
        }
    ];

    const currIdx = gameStateV2.paraState.rIndex || 0;

    // Si ya se examinaron todas las evidencias principales de R
    if (currIdx >= resources.length) {
        renderParaDashboard();
        const display = document.getElementById('para-content-display');
        if (display) display.scrollTop = 0;
        return;
    }

    const currentRes = resources[currIdx];
    openReviewModalForResource(currentRes, currIdx);
}

function openReviewModalForResource(currentRes, resIdx) {
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');

    let textToShow = currentRes.text;
    if (currentRes.variantText && gameStateV2.currentCaseVariant) {
        textToShow = currentRes.variantText[gameStateV2.currentCaseVariant];
    }

    const existingState = (gameStateV2.paraState.reviewsState || {})[currentRes.id];
    let currentDecisionTag = "";
    if (existingState) {
        if (existingState.decision === 'considered') {
            currentDecisionTag = `<div style="background:rgba(73,245,193,0.15); border:1px solid var(--color-agency-green); color:var(--color-agency-green); padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; margin-bottom:10px;">✔ ESTADO ACTUAL: CONSIDERADA</div>`;
        } else {
            currentDecisionTag = `<div style="background:rgba(255,181,71,0.15); border:1px solid var(--color-warning-amber); color:var(--color-warning-amber); padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; margin-bottom:10px;">❌ ESTADO ACTUAL: NO CONSIDERADA</div>`;
        }
    }

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:var(--color-agency-green); font-family:var(--font-heading); font-size:14px;">REVISAR // EVIDENCIA: ${currentRes.name.toUpperCase()}</h3>
            <button class="fac-btn" onclick="closeParaModal()">✖</button>
        </div>

        ${currentDecisionTag}

        <div style="background:#03080f; border:2.5px solid var(--color-agency-green); border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(73,245,193,0.25);">
            <strong style="color:var(--color-agency-green); font-size:12px; font-family:var(--font-heading); display:block; margin-bottom:6px;">📋 ${currentRes.name}</strong>
            <p style="font-size:13.5px; color:#ffffff; line-height:1.45;">${textToShow}</p>
        </div>

        <p style="font-size:12.5px; color:#d8eaff; margin-bottom:12px; font-weight:600; text-align:center;">¿Deseas considerar esta alternativa de evidencia para habilitar nuevas opciones en ACTUAR?</p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;" id="r-modal-actions">
            <button class="btn-detroit-primary" style="background:rgba(73,245,193,0.2); border-color:var(--color-agency-green); color:#fff; padding:10px;" onclick="decideReviewResource('${currentRes.id}', 'considered', ${resIdx})">
                <span class="btn-text">✔ CONSIDERAR</span>
            </button>
            <button class="btn-detroit-primary" style="background:rgba(255,181,71,0.15); border-color:var(--color-warning-amber); color:#fff; padding:10px;" onclick="decideReviewResource('${currentRes.id}', 'rejected', ${resIdx})">
                <span class="btn-text">✖ NO CONSIDERAR</span>
            </button>
        </div>
    `;

    overlay.style.display = 'flex';
}

function decideReviewResource(resId, decision, resIdx) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const resources = cData.reviewResources || [
        {
            id: "res_1",
            name: "Registro de origen",
            text: "REGISTRO DE ORIGEN: La alerta proviene de una sola fuente de telemetría. Doce cuentas presentan actividad anómala confirmada.",
            actionId: "limited_containment",
            actionText: "D. Limitar la autonomía (Aislar 12 cuentas confirmadas y exigir aprobación humana).",
            feedbackConsidered: "✔ Considerada: Confirmas que el riesgo inminente está focalizado en 12 cuentas. Se ha desbloqueado la opción 'Limitar la autonomía' en ACTUAR.",
            feedbackRejected: "✖ No Considerada: Desestimaste la telemetría focalizada. La opción de contención limitada NO estará disponible en ACTUAR."
        }
    ];

    let resObj = resources.find(r => r.id === resId);
    if (!resObj && resIdx !== undefined) resObj = resources[resIdx];
    if (!resObj) return;

    let textToShow = resObj.text;
    if (resObj.variantText && gameStateV2.currentCaseVariant) {
        textToShow = resObj.variantText[gameStateV2.currentCaseVariant];
    }

    const actionId = resObj.actionId || (resObj.unlocks && resObj.unlocks[0]);
    let actionText = resObj.actionText;
    if (!actionText && actionId && cData.unlockedActions) {
        const matchingAct = cData.unlockedActions.find(a => a.id === actionId);
        if (matchingAct) actionText = matchingAct.text;
    }

    if (!gameStateV2.paraState.reviewsState) {
        gameStateV2.paraState.reviewsState = {};
    }

    if (!gameStateV2.paraState.unlockedActions) {
        gameStateV2.paraState.unlockedActions = [];
    }

    if (decision === 'considered') {
        const feedback = resObj.feedbackConsidered || "✔ Considerada: Esta evidencia ha sido incorporada y desbloqueó una nueva opción de respuesta en ACTUAR.";
        
        gameStateV2.paraState.reviewsState[resObj.id] = {
            id: resObj.id,
            name: resObj.name,
            text: textToShow,
            decision: 'considered',
            feedback: feedback,
            actionId: actionId,
            actionText: actionText
        };

        if (actionId && actionText) {
            if (!gameStateV2.paraState.unlockedActions.some(a => a.id === actionId)) {
                gameStateV2.paraState.unlockedActions.push({ id: actionId, text: actionText });
            }
        }
    } else {
        const feedback = resObj.feedbackRejected || "✖ No Considerada: Decidiste desestimar esta alternativa de evidencia. NO aparecerá en las opciones de ACTUAR.";
        
        gameStateV2.paraState.reviewsState[resObj.id] = {
            id: resObj.id,
            name: resObj.name,
            text: textToShow,
            decision: 'rejected',
            feedback: feedback,
            actionId: actionId,
            actionText: actionText
        };

        if (actionId) {
            gameStateV2.paraState.unlockedActions = gameStateV2.paraState.unlockedActions.filter(a => a.id !== actionId);
        }
    }

    // Avanzar rIndex únicamente si estábamos resolviendo el nuevo recurso activo
    if (resIdx !== undefined && resIdx === gameStateV2.paraState.rIndex) {
        gameStateV2.paraState.rIndex = gameStateV2.paraState.rIndex + 1;
    }

    gameStateV2.paraState.rOpened = true;
    gameStateV2.paraState.activeTab = 'R';
    updateCaseUIState();

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_PARA_REVISION', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex });
        if (decision === 'considered' && actionId) {
            broadcastSyncEvent('PLAYER_PARA_ACTION_ADDED', { playerId: gameStateV2.playerId, caseIndex: gameStateV2.currentCaseIndex, count: 1 });
        }
    }

    // Actualizar modal con feedback de la elección
    const modal = document.getElementById('para-modal-card');
    const isConsidered = decision === 'considered';
    const borderColor = isConsidered ? 'var(--color-agency-green)' : 'var(--color-warning-amber)';
    const headerTitle = isConsidered ? '✔ EVIDENCIA CONSIDERADA' : '✖ EVIDENCIA DESESTIMADA';
    const feedbackMsg = gameStateV2.paraState.reviewsState[resObj.id].feedback;

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:14px;">
            <h3 style="color:${borderColor}; font-family:var(--font-heading); font-size:14px;">REVISAR // ${headerTitle}</h3>
            <button class="fac-btn" onclick="closeParaModalAndRenderDashboard()">✖</button>
        </div>

        <div style="background:#03080f; border:2.5px solid ${borderColor}; border-radius:8px; padding:14px; margin-bottom:14px; box-shadow:0 0 16px rgba(0,0,0,0.4);">
            <strong style="color:${borderColor}; font-size:12px; font-family:var(--font-heading); display:block; margin-bottom:4px;">📋 ${resObj.name}</strong>
            <p style="font-size:13px; color:#d8eaff; margin-bottom:10px;">${textToShow}</p>
            <div style="background:rgba(255,255,255,0.05); border-left:3px solid ${borderColor}; padding:10px 12px; border-radius:4px;">
                <strong style="color:${borderColor}; font-size:12px; display:block; margin-bottom:2px;">RETROALIMENTACIÓN DE TU DECISIÓN:</strong>
                <p style="font-size:12.5px; color:#ffffff;">${feedbackMsg}</p>
            </div>
        </div>

        <div style="display:flex; justify-content:flex-end;">
            <button class="btn-detroit-primary" style="background:rgba(255,255,255,0.1); border-color:${borderColor}; color:#fff;" onclick="closeParaModalAndRenderDashboard()">
                <span class="btn-text">✖ CERRAR Y VER EN DASHBOARD</span>
            </button>
        </div>
    `;
}

function reopenReviewDecision(resId) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const resources = cData.reviewResources || [];
    const resIdx = resources.findIndex(r => r.id === resId);
    const currentRes = resources[resIdx] || { id: resId, name: resId, text: "" };
    
    openReviewModalForResource(currentRes, resIdx >= 0 ? resIdx : 0);
}

function closeParaModalAndRenderDashboard() {
    closeParaModal();
    renderParaDashboard();
}

function executeParaActua() {
    gameStateV2.paraState.activeTab = 'A2';
    renderParaDashboard();

    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const modal = document.getElementById('para-modal-card');
    const overlay = document.getElementById('para-modal-overlay');

    // 1. Opciones iniciales (A, B, C)
    let initialHtml = cData.initialActions.map(act => `
        <label class="para-act-checkbox-item">
            <input type="checkbox" class="para-act-checkbox" value="${act.id}" data-text="${act.text}">
            <div style="flex:1; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span style="font-size:13px; color:#ffffff; line-height:1.4;">${act.text}</span>
                <span class="action-cost-time-chip">⏱+ 💰+</span>
            </div>
        </label>
    `).join('');

    // 2. Opciones desbloqueadas/consideradas en R
    const unlockedActionsList = gameStateV2.paraState.unlockedActions || [];
    let unlockedHtml = '';

    if (unlockedActionsList.length > 0) {
        unlockedHtml = unlockedActionsList.map(act => `
            <label class="para-act-checkbox-item unlocked-item">
                <input type="checkbox" class="para-act-checkbox" value="${act.id}" data-text="${act.text}">
                <div style="flex:1; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <span style="font-size:13px; color:#ffffff; line-height:1.4;">${act.text}</span>
                        <span style="display:inline-block; background:var(--color-agency-green); color:#000; font-size:10px; font-weight:800; padding:1px 6px; border-radius:3px; margin-left:6px;">NUEVA DE REVISAR</span>
                    </div>
                    <span class="action-cost-time-chip">⏱+ 💰+</span>
                </div>
            </label>
        `).join('');
    }

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border-cyan); padding-bottom:8px; margin-bottom:12px;">
            <h3 style="color:var(--color-warning-amber); font-family:var(--font-heading); font-size:14px;">ACTUAR // SELECCIÓN DE ACCIONES (MULTISELECCIÓN)</h3>
            <button class="fac-btn" onclick="closeParaModal()">✖</button>
        </div>

        <!-- REGISTRO DE PRIMERA REACCIÓN DEL JUGADOR PARA COMPARACIÓN -->
        <div style="background: rgba(0, 216, 255, 0.08); border: 1.5px solid var(--color-cyan); border-radius: 6px; padding: 9px 12px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 15px;">💡</span>
            <div>
                <strong style="color: var(--color-cyan); font-size: 10.5px; font-family: var(--font-heading); display: block; letter-spacing: 0.5px;">TU PRIMERA REACCIÓN FUE:</strong>
                <p style="font-size: 12px; color: #ffffff; margin: 2px 0 0 0; line-height: 1.35;">${gameStateV2.initialImpulse || "Sin selección de reacción inicial registrada."}</p>
            </div>
        </div>

        <p style="font-size:12px; color:var(--color-alert-magenta); font-weight:600; margin-bottom:10px;">⚠️ Puedes marcar 1 o varias acciones a ejecutar. El cálculo sumatorio de tu elección determinará la resolución del caso.</p>
        
        <div style="display:flex; flex-direction:column; gap:10px; max-height:280px; overflow-y:auto; padding-right:4px;">
            <strong style="font-size:12px; color:var(--color-cyan); font-family:var(--font-heading);">OPCIONES DE ACCIÓN DISPONIBLES (MARCA LAS QUE DESEAS EJECUTAR):</strong>
            ${initialHtml}
            ${unlockedHtml ? `
                <strong style="font-size:12px; color:var(--color-agency-green); font-family:var(--font-heading); margin-top:6px;">NUEVAS OPCIONES ACTIVADAS POR REVISAR (R):</strong>
                ${unlockedHtml}
            ` : ''}
        </div>

        <div style="margin-top:16px; display:flex; justify-content:flex-end;">
            <button class="btn-detroit-primary" style="background:rgba(255,181,71,0.25); border-color:var(--color-warning-amber); color:#fff; width:100%; justify-content:center; padding:12px;" onclick="submitSelectedActions()">
                <span class="btn-text">🚀 CONFIRMAR Y EJECUTAR ACCIONES ELEGIDAS</span>
            </button>
        </div>
    `;

    overlay.style.display = 'flex';
}

function submitSelectedActions() {
    const checkedEls = document.querySelectorAll('.para-act-checkbox:checked');
    if (checkedEls.length === 0) {
        alert("Debes seleccionar al menos una opción de acción para continuar.");
        return;
    }

    const selectedIds = Array.from(checkedEls).map(el => el.value);
    const selectedTexts = Array.from(checkedEls).map(el => el.getAttribute('data-text'));

    if (confirm(`¿Confirmas la ejecución de ${selectedIds.length} acción(es) seleccionada(s)? Esta decisión cerrará el caso de forma irreversible.`)) {
        closeParaModal();
        clearInterval(gameStateV2.timerInterval);
        
        gameStateV2.paraState.finalActionId = selectedIds.join(', ');
        gameStateV2.paraState.finalActionText = selectedTexts.join(' | ');
        
        processCaseOutcome(selectedIds);
    }
}

function confirmFinalAction(actionId, actionText) {
    closeParaModal();
    clearInterval(gameStateV2.timerInterval);
    gameStateV2.paraState.finalActionId = actionId;
    gameStateV2.paraState.finalActionText = actionText;
    processCaseOutcome([actionId]);
}

function closeParaModal() {
    document.getElementById('para-modal-overlay').style.display = 'none';
}

function handleCaseTimeout() {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    gameStateV2.paraState.finalActionId = cData.defaultAction;
    gameStateV2.paraState.finalActionText = "Tiempo Agotado (Ejecutado por defecto)";
    gameStateV2.paraState.routeTag = "Decisión delegada";
    processCaseOutcome([cData.defaultAction]);
}

// ==========================================================================
// MOMENTO 3: CIERRE NARRATIVO Y RETROALIMENTACIÓN DE CASO (OFICIAL V2)
// ==========================================================================
// MOMENTO 2.5: PANTALLA DE RESULTADO A (TELEMETRÍA RAW Y PUNTAJES)
// & MOMENTO 3: PANTALLA DE RESULTADO B (EVALUACIÓN NARRATIVA)
// ==========================================================================

let currentCaseOutcomeObj = null;

function getActionIdealCategory(caseId, actId) {
    if (caseId === "case_1") {
        if (["limited_containment", "controlled_audit", "approval_escalation"].includes(actId)) return "should_do";
        if (["full_containment"].includes(actId)) return "should_not_do";
        return "not_relevant"; // stop_faro, wait_report
    }
    if (caseId === "case_3") {
        if (["prisma", "data_minimization_protocol", "balanced_accuracy_mode", "prisma_24"].includes(actId)) return "should_do";
        if (["oracle"].includes(actId)) return "should_not_do";
        return "not_relevant"; // wall
    }
    if (caseId === "case_2") {
        const variant = gameStateV2.currentCaseVariant || "malicious";
        if (variant === "legitimate") {
            if (["verify_oob_call", "audit_change_ticket"].includes(actId)) return "should_do";
            if (["block_and_report"].includes(actId)) return "should_not_do";
            return "not_relevant"; // technical_headers_check, let_expire, activate_from_message
        } else {
            if (["verify_oob_call", "audit_change_ticket"].includes(actId)) return "should_do";
            if (["activate_from_message"].includes(actId)) return "should_not_do";
            return "not_relevant"; // technical_headers_check, let_expire, block_and_report
        }
    }
    if (caseId === "case_4") {
        if (["reversible_secondary", "style_forensics_verification", "verify_and_report"].includes(actId)) return "should_do";
        if (["full_access"].includes(actId)) return "should_not_do";
        return "not_relevant"; // reject_confront, let_time_pass
    }
    return "not_relevant";
}

function getActionQuadrant(isExec, idealCategory) {
    if (isExec && idealCategory === "should_do") {
        return {
            key: "hizo_debia",
            deltaCalib: 2,
            badgeText: "✔ ACCIÓN OPORTUNA // HIZO / DEBÍA HACER",
            badgeClass: "quad-good",
            impactHtml: '<span class="impact-chip impact-calib">🎯 Calib: +2</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>'
        };
    }
    if (isExec && idealCategory === "should_not_do") {
        return {
            key: "hizo_nodebia",
            deltaCalib: -2,
            badgeText: "✖ SOBRE-REACCIÓN // HIZO / NO DEBÍA HACER",
            badgeClass: "quad-bad",
            impactHtml: '<span class="impact-chip impact-calib" style="color:#ff2a6d;border-color:rgba(255,42,109,0.4);">🎯 Calib: -2</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>'
        };
    }
    if (isExec && idealCategory === "not_relevant") {
        return {
            key: "hizo_norelevante",
            deltaCalib: 0,
            badgeText: "⚪ ACCIÓN NEUTRA // HIZO / NO RELEVANTE",
            badgeClass: "quad-neutral",
            impactHtml: '<span class="impact-chip impact-neutral">🎯 Calib: 0</span> <span class="impact-chip impact-cost">⏱ +20s | 💰+</span>'
        };
    }
    if (!isExec && idealCategory === "should_not_do") {
        return {
            key: "nohizo_nodebia",
            deltaCalib: 1,
            badgeText: "✔ OMISIÓN PRUDENTE // NO HIZO / NO DEBÍA HACER",
            badgeClass: "quad-good",
            impactHtml: '<span class="impact-chip impact-calib">🎯 Calib: +1</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>'
        };
    }
    if (!isExec && idealCategory === "should_do") {
        return {
            key: "nohizo_debia",
            deltaCalib: -1,
            badgeText: "✖ OMISIÓN CRÍTICA // NO HIZO / DEBÍA HACER",
            badgeClass: "quad-bad",
            impactHtml: '<span class="impact-chip impact-calib" style="color:#ff2a6d;border-color:rgba(255,42,109,0.4);">🎯 Calib: -1</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>'
        };
    }
    return {
        key: "nohizo_norelevante",
        deltaCalib: 0,
        badgeText: "⚪ OMISIÓN NEUTRA // NO RELEVANTE",
        badgeClass: "quad-neutral",
        impactHtml: '<span class="impact-chip impact-neutral">🎯 Calib: 0</span> <span class="impact-chip impact-neutral">⏱ 0s | 💰 $0</span>'
    };
}

let currentMetricsSlide = 1;

function setMetricsSlide(slideNum) {
    currentMetricsSlide = slideNum;
    const slide1 = document.getElementById('metrics-slide-1');
    const slide2 = document.getElementById('metrics-slide-2');
    const stepBadge = document.getElementById('metrics-slide-step-badge');
    const titleEl = document.getElementById('metrics-carousel-title');
    const subEl = document.getElementById('metrics-carousel-subtitle');
    const prevBtn = document.getElementById('metrics-prev-btn');
    const nextBtn = document.getElementById('metrics-next-btn');
    const continueBtn = document.getElementById('btn-metrics-continue-b');
    const dot1 = document.getElementById('mdot-1');
    const dot2 = document.getElementById('mdot-2');

    if (slideNum === 1) {
        if (slide1) slide1.style.display = 'block';
        if (slide2) slide2.style.display = 'none';
        if (stepBadge) stepBadge.innerText = "PÁGINA 1 DE 2 // TELEMETRÍA DE PROCESO (P.A.R.A.)";
        if (titleEl) titleEl.innerText = "TELEMETRÍA Y BALANCE DEL PROCESO";
        if (subEl) subEl.innerText = "Impacto de la gestión del tiempo, pausas, análisis de supuestos y revisión de evidencias.";
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerText = "SIGUIENTE: MATRIZ DE ACCIONES ▶";
        }
        if (continueBtn) continueBtn.style.display = 'none';
        if (dot1) dot1.className = "metrics-dot-btn active";
        if (dot2) dot2.className = "metrics-dot-btn";
    } else {
        if (slide1) slide1.style.display = 'none';
        if (slide2) slide2.style.display = 'block';
        if (stepBadge) stepBadge.innerText = "PÁGINA 2 DE 2 // MATRIZ DE 6 ACCIONES (EJECUTADAS VS ESPERADAS)";
        if (titleEl) titleEl.innerText = "MATRIZ DE ACCIONES Y CRUCE OPERATIVO";
        if (subEl) subEl.innerText = "Evaluación detallada de las 3 opciones iniciales y las 3 opciones desbloqueadas de Revisar.";
        if (prevBtn) {
            prevBtn.style.display = 'inline-flex';
            prevBtn.innerText = "◀ ANTERIOR";
        }
        if (nextBtn) nextBtn.style.display = 'none';
        if (continueBtn) continueBtn.style.display = 'inline-flex';
        if (dot1) dot1.className = "metrics-dot-btn";
        if (dot2) dot2.className = "metrics-dot-btn active";
    }
}

function nextMetricsSlide() {
    setMetricsSlide(2);
}

function prevMetricsSlide() {
    setMetricsSlide(1);
}

function processCaseOutcome(actionIds) {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    let idsArray = Array.isArray(actionIds) ? actionIds : [actionIds];
    
    if (idsArray.length === 0) {
        idsArray = [cData.defaultAction];
    }

    // ==========================================================================
    // 1. MATRIZ DE LAS 6 ACCIONES Y CALIBRACIÓN POR ACCIÓN
    // ==========================================================================
    const allActions = [
        ...cData.initialActions.map(a => ({ ...a, source: 'initial' })),
        ...cData.unlockedActions.map(a => ({ ...a, source: 'unlocked' }))
    ];

    let actionsCalibSum = 0;
    const actionsEvaluationList = allActions.map((act, idx) => {
        const isExec = idsArray.includes(act.id);
        const idealCat = getActionIdealCategory(cData.id, act.id);
        const quad = getActionQuadrant(isExec, idealCat);
        actionsCalibSum += quad.deltaCalib;
        return {
            id: act.id,
            text: act.text,
            isExecuted: isExec,
            idealCategory: idealCat,
            deltaCalib: quad.deltaCalib,
            quadrant: quad
        };
    });

    // ==========================================================================
    // 2. DETERMINACIÓN DE INTEGRIDAD DEL SISTEMA Y RESOLUCIÓN DEL CASO
    // REGLA: Suma > 0 => Seguro (Positivo -$10k) | Suma = 0 => Alerta (Neutro +$5k) | Suma < 0 => Expuesto (Negativo +$15k)
    // ==========================================================================
    let caseIntegrity = 'safe';
    let outcomeIndicator = 1;
    let outcomeCostAdjustment = -10000;

    if (actionsCalibSum > 0) {
        caseIntegrity = 'safe';
        outcomeIndicator = 1;
        outcomeCostAdjustment = -10000;
    } else if (actionsCalibSum === 0) {
        caseIntegrity = 'alert';
        outcomeIndicator = 2;
        outcomeCostAdjustment = 5000;
    } else {
        caseIntegrity = 'exposed';
        outcomeIndicator = 3;
        outcomeCostAdjustment = 15000;
    }

    gameStateV2.hudState.integrity = caseIntegrity;
    const isRecovered = (outcomeIndicator === 1 || outcomeIndicator === 2);
    gameStateV2.modulesState[cData.moduleKey] = isRecovered;
    gameStateV2.modulesRecovered = Object.values(gameStateV2.modulesState).filter(Boolean).length;
    gameStateV2.caseScores.push(outcomeIndicator);
    updateHeaderUI();

    // ==========================================================================
    // 3. TIEMPO, VELOCIDAD Y MOTOR ECONÓMICO GLOBAL (K = 100,000)
    // ==========================================================================
    const totalCaseSeconds = cData.durationSeconds || 180;
    const deliberationSeconds = Math.max(0, totalCaseSeconds - (gameStateV2.caseTimerSeconds !== undefined ? gameStateV2.caseTimerSeconds : totalCaseSeconds));
    const pausesUsed = 3 - (gameStateV2.casePauseTokens !== undefined ? gameStateV2.casePauseTokens : 3);
    const pausesTimeSeconds = pausesUsed * 15;
    const actionsExecutionSeconds = idsArray.length * 20;
    
    // Tiempo Total Usado = Deliberación + Pausas (15s c/u) + Ejecución de Acciones (20s c/u)
    const totalTimeUsedSeconds = deliberationSeconds + pausesTimeSeconds + actionsExecutionSeconds;
    const percentageUsed = Math.min(100, Math.max(0, (totalTimeUsedSeconds / totalCaseSeconds) * 100));

    // Clasificación de Velocidad (Rápido 0-40%: +4, Medio 41-70%: +2, Lento 71-100%: 0)
    let speedCategory = 'medium';
    let speedLabel = 'MEDIO';
    let speedReactivityDelta = 2;

    if (percentageUsed <= 40) {
        speedCategory = 'fast';
        speedLabel = 'RÁPIDO';
        speedReactivityDelta = 4;
    } else if (percentageUsed <= 70) {
        speedCategory = 'medium';
        speedLabel = 'MEDIO';
        speedReactivityDelta = 2;
    } else {
        speedCategory = 'slow';
        speedLabel = 'LENTO';
        speedReactivityDelta = 0;
    }

    // Bonificador de Reactividad por Resultado: Seguro -1, Alerta +1, Expuesto +2
    const outcomeReactivityDelta = outcomeIndicator === 1 ? -1 : (outcomeIndicator === 2 ? 1 : 2);
    const reactivityDelta = speedReactivityDelta + outcomeReactivityDelta;

    // Bonus por acierto/error en Calibración: siempre +1 si Seguro, -1 si Expuesto, 0 si Alerta/Neutro
    const calibrationBonusDelta = outcomeIndicator === 1 ? 1 : (outcomeIndicator === 3 ? -1 : 0);

    // IMPACTO ECONÓMICO POR REACTIVIDAD: Por cada unidad del resultado final de reactividad en el caso -> $5,000
    const finalReactivityLevel = Math.max(-5, Math.min(5, gameStateV2.hudState.reactivity + reactivityDelta));
    const reactivityCostAdjustment = finalReactivityLevel * 5000;

    // FÓRMULA DE COSTO OPERATIVO: Costo Base por Tiempo + Ajuste por Integridad + Ajuste por Reactividad
    const costPerSec = getOperationalCostPerSecond();
    const baseTimeCost = Math.round(totalTimeUsedSeconds * costPerSec);
    const caseTotalAddedCost = baseTimeCost + outcomeCostAdjustment + reactivityCostAdjustment;

    // Aplicar deltas del caso al HUD con clamping [-5, +5] de manera acumulativa
    applyHudReactivityDelta(reactivityDelta);
    applyHudCalibrationDelta(actionsCalibSum + calibrationBonusDelta);
    applyHudCostDelta(caseTotalAddedCost);

    // ==========================================================================
    // 4. CONSOLIDACIÓN NARRATIVA DE FEEDBACK (MOMENTO 3 / SLIDE B)
    // ==========================================================================
    const variant = gameStateV2.currentCaseVariant;
    const outcomesMap = (cData.id === "case_2" && variant) ? cData.actionOutcomes[variant] : cData.actionOutcomes;
    
    // Buscar resultado representativo para el libreto narrativo
    const primaryOutcomeMatch = Object.values(outcomesMap).find(o => o.indicator === outcomeIndicator) || Object.values(outcomesMap)[0];
    const executedOutcomes = idsArray.map(id => outcomesMap[id]).filter(Boolean);

    const combinedNarrative = executedOutcomes.length > 0
        ? executedOutcomes.map(o => `• ${o.narrative}`).join("\n\n")
        : primaryOutcomeMatch.narrative;

    const combinedMetacognitive = executedOutcomes.length > 0
        ? executedOutcomes.map(o => `• ${o.metacognitive}`).join("\n\n")
        : primaryOutcomeMatch.metacognitive;

    const outcomeObj = {
        indicator: outcomeIndicator,
        type: outcomeIndicator === 1 ? "positive" : (outcomeIndicator === 3 ? "negative" : "neutral"),
        filterColor: outcomeIndicator === 1 ? "green" : (outcomeIndicator === 3 ? "red" : "yellow"),
        routeTag: `Multiselección (${idsArray.length} acción${idsArray.length > 1 ? 'es' : ''} ejecutada${idsArray.length > 1 ? 's' : ''})`,
        title: primaryOutcomeMatch.title || (outcomeIndicator === 1 ? "RESOLUCIÓN POSITIVA // SISTEMA SEGURO" : (outcomeIndicator === 2 ? "RESOLUCIÓN NEUTRA // SISTEMA EN ALERTA" : "RESOLUCIÓN NEGATIVA // SISTEMA EXPUESTO")),
        outcomeBadge: outcomeIndicator === 1 ? "SISTEMA SEGURO" : (outcomeIndicator === 2 ? "SISTEMA EN ALERTA" : "SISTEMA EXPUESTO"),
        narrative: combinedNarrative,
        metacognitive: combinedMetacognitive,
        faroTransition: primaryOutcomeMatch.faroTransition,
        integrityResult: caseIntegrity,
        actionsCalibSum: actionsCalibSum,
        baseTimeCost: baseTimeCost,
        outcomeCostAdjustment: outcomeCostAdjustment,
        reactivityCostAdjustment: reactivityCostAdjustment,
        finalReactivityLevel: finalReactivityLevel,
        caseTotalAddedCost: caseTotalAddedCost,
        totalTimeUsedSeconds: totalTimeUsedSeconds
    };
    currentCaseOutcomeObj = outcomeObj;

    const completedAnalysesList = gameStateV2.paraState.completedAnalyses || [];
    const analysesCount = completedAnalysesList.length;
    const totalReactLossFromAnalyses = completedAnalysesList.filter(a => a.reactivityAffected).length;

    const unlockedCount = gameStateV2.paraState.unlockedActions ? gameStateV2.paraState.unlockedActions.length : 0;
    const reviewsDone = Math.max(unlockedCount, gameStateV2.paraState.rResourcesOpened ? gameStateV2.paraState.rResourcesOpened.length : 0);
    const rejectedCount = Math.max(0, reviewsDone - unlockedCount);

    const necessaryUnlockedTotal = cData.unlockedActions.filter(a => getActionIdealCategory(cData.id, a.id) === "should_do").length;
    const necessaryUnlockedExecuted = cData.unlockedActions.filter(a => getActionIdealCategory(cData.id, a.id) === "should_do" && idsArray.includes(a.id)).length;

    // ==========================================================================
    // 5. REGISTRO INMUTABLE EN LA SESIÓN (PARA BASE DE DATOS Y FACILITADOR)
    // ==========================================================================
    const caseRecord = {
        caseIndex: gameStateV2.currentCaseIndex,
        caseId: cData.id,
        variant: gameStateV2.currentCaseVariant,
        initialImpulse: gameStateV2.currentCaseImpulseData || {
            id: 'unrecorded',
            text: gameStateV2.initialImpulse || "Sin respuesta",
            responseTimeSeconds: 0
        },
        timeMetrics: {
            totalCaseAllocatedSeconds: totalCaseSeconds,
            deliberationSeconds: parseFloat(deliberationSeconds.toFixed(1)),
            pausesSeconds: pausesTimeSeconds,
            actionsSeconds: actionsExecutionSeconds,
            totalTimeUsedSeconds: parseFloat(totalTimeUsedSeconds.toFixed(1)),
            percentageUsed: parseFloat(percentageUsed.toFixed(1)),
            speedCategory: speedCategory,
            speedLabel: speedLabel,
            speedReactivityDelta: speedReactivityDelta,
            outcomeReactivityDelta: outcomeReactivityDelta,
            reactivityDelta: reactivityDelta,
            calibrationBonusDelta: calibrationBonusDelta
        },
        economics: {
            costPerSecondIndex: parseFloat(costPerSec.toFixed(2)),
            baseTimeCost: baseTimeCost,
            outcomeCostAdjustment: outcomeCostAdjustment,
            reactivityCostAdjustment: reactivityCostAdjustment,
            caseTotalAddedCost: caseTotalAddedCost
        },
        paraProcess: {
            pausesUsedCount: pausesUsed,
            pausesReactivityDelta: -pausesUsed,
            analysesCompleted: [...completedAnalysesList],
            analysesCalibrationGain: analysesCount,
            analysesReactivityReduction: totalReactLossFromAnalyses,
            unlockedActionsCount: unlockedCount,
            reviewsEvaluatedCount: reviewsDone,
            necessaryUnlockedTotal: necessaryUnlockedTotal,
            necessaryUnlockedExecuted: necessaryUnlockedExecuted
        },
        actionsExecution: {
            selectedIds: idsArray,
            actionsCalibSum: actionsCalibSum,
            evaluations: actionsEvaluationList
        },
        outcome: {
            integrityResult: caseIntegrity,
            indicator: outcomeIndicator,
            type: outcomeObj.type,
            filterColor: outcomeObj.filterColor,
            title: outcomeObj.title,
            outcomeBadge: outcomeObj.outcomeBadge,
            moduleRecovered: isRecovered
        },
        hudStateSnapshot: { ...gameStateV2.hudState },
        timestamp: new Date().toISOString()
    };

    if (!gameStateV2.sessionLog) {
        gameStateV2.sessionLog = { sessionId: 'session_' + Date.now(), sessionStartTime: new Date().toISOString(), cases: [] };
    }
    gameStateV2.sessionLog.cases.push(caseRecord);

    // Calcular índice de impulso inicial
    let impulseIndex = 0;
    if (gameStateV2.currentCaseImpulseData && cData.impulses) {
        const foundIdx = cData.impulses.findIndex(imp => imp.text === gameStateV2.currentCaseImpulseData.text || imp.id === gameStateV2.currentCaseImpulseData.id);
        if (foundIdx >= 0) impulseIndex = foundIdx;
    }

    // Clasificar evaluaciones de matriz en los 6 cuadrantes
    const matrixEvals = actionsEvaluationList.map(item => {
        let reqType = 'norelevante';
        if (item.quadrant && item.quadrant.badgeClass) {
            if (item.quadrant.badgeClass.includes('opp') || item.quadrant.badgeClass.includes('omission')) {
                reqType = 'debiahacer';
            } else if (item.quadrant.badgeClass.includes('extra') || item.quadrant.badgeClass.includes('containment')) {
                reqType = 'nodebia';
            } else {
                reqType = 'norelevante';
            }
        }
        const prefix = item.isExecuted ? 'hizo_' : 'nohizo_';
        return {
            id: item.id,
            text: item.text,
            isExecuted: item.isExecuted,
            sectorKey: prefix + reqType,
            cost: item.isExecuted ? (item.cost || 0) : 0
        };
    });

    const finishedPayload = {
        playerId: gameStateV2.playerId,
        caseIndex: gameStateV2.currentCaseIndex,
        impulseIndex: impulseIndex,
        integrity: caseIntegrity,
        realTimeSeconds: Math.round(deliberationSeconds),
        narrativeTimeSeconds: Math.round(totalTimeUsedSeconds),
        cost: caseTotalAddedCost,
        calibration: gameStateV2.hudState.calibration,
        reactivity: gameStateV2.hudState.reactivity,
        doorsActivated: (gameStateV2.paraState.completedAnalyses || []).map(a => a.title),
        matrixEvaluations: matrixEvals
    };

    // Registrar en el estado grupal local
    recordPlayerCaseResultForGroup(gameStateV2.currentCaseIndex, finishedPayload);

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_CASE_FINISHED', finishedPayload);
    }

    // ==========================================================================
    // 6. LLENAR PANTALLA DE RESULTADO A (SLIDE 1: TELEMETRÍA RAW)
    // ==========================================================================
    document.getElementById('m-time-level-badge').innerText = `TOTAL: ${totalTimeUsedSeconds}s (${speedLabel})`;
    document.getElementById('m-time-desc').innerText = `Tiempo usado: ${deliberationSeconds.toFixed(0)}s (reloj) + ${actionsExecutionSeconds + pausesTimeSeconds}s (acciones y pausas). Total: ${totalTimeUsedSeconds}s.`;
    
    document.getElementById('m-time-impact-cost').innerText = `💰 Costo por Tiempo: +$${baseTimeCost.toLocaleString('en-US')}`;
    document.getElementById('m-time-impact-react').innerText = `⚡ Reactividad: ${reactivityDelta >= 0 ? '+' : ''}${reactivityDelta} (${speedLabel}: ${speedReactivityDelta >= 0 ? '+' : ''}${speedReactivityDelta} | ${outcomeIndicator === 1 ? 'Seguro' : (outcomeIndicator === 2 ? 'Alerta' : 'Expuesto')}: ${outcomeReactivityDelta >= 0 ? '+' : ''}${outcomeReactivityDelta})`;
    document.getElementById('m-time-impact-calib').innerText = `🎯 Calibración: ${actionsCalibSum >= 0 ? '+' : ''}${actionsCalibSum} (Acciones) ${calibrationBonusDelta >= 0 ? '+' : ''}${calibrationBonusDelta} (${outcomeIndicator === 1 ? 'Acierto' : (outcomeIndicator === 3 ? 'Error' : 'Neutro')})`;

    document.getElementById('m-pauses-badge').innerText = `${pausesUsed}/3 USADAS (+${pausesTimeSeconds}s)`;
    document.getElementById('m-pauses-impact-react').innerText = `⚡ Reactividad: -${pausesUsed}`;

    document.getElementById('m-analysis-badge').innerText = `${analysesCount}/3 PUERTAS`;
    const elAnalysisCalib = document.getElementById('m-analysis-impact-calib');
    if (elAnalysisCalib) elAnalysisCalib.innerText = `🎯 Calibración: +${analysesCount}`;
    const elAnalysisReact = document.getElementById('m-analysis-impact-react');
    if (elAnalysisReact) elAnalysisReact.innerText = `⚡ Reactividad: -${totalReactLossFromAnalyses}`;

    document.getElementById('m-review-badge').innerText = `${unlockedCount}/${cData.unlockedActions.length} DESBLOQUEADAS`;
    document.getElementById('m-review-considered-count').innerText = `${unlockedCount} consideradas ✔`;
    document.getElementById('m-review-rejected-count').innerText = `${rejectedCount} descartadas ✖`;
    
    const elReviewNec = document.getElementById('m-review-impact-necessary');
    if (elReviewNec) {
        elReviewNec.innerText = `🎯 Acciones necesarias activadas: ${necessaryUnlockedExecuted}/${Math.max(1, necessaryUnlockedTotal)}`;
    }

    // ==========================================================================
    // 7. CONSTRUIR MATRIZ DE LAS 6 ACCIONES (SLIDE 2)
    // ==========================================================================
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const matrixListEl = document.getElementById('metrics-actions-matrix-list');
    if (matrixListEl) {
        matrixListEl.innerHTML = actionsEvaluationList.map((item, idx) => {
            const letter = letters[idx] || String(idx + 1);
            return `
                <div class="matrix-action-table-row ${item.isExecuted ? 'executed' : 'not-executed'}">
                    <div class="cell-action-desc">
                        <span class="act-letter-tag">${letter}</span>
                        <span class="act-title-text">${item.text}</span>
                    </div>
                    <div class="cell-status">
                        <span class="act-status-tag ${item.isExecuted ? 'tag-exec' : 'tag-noexec'}">${item.isExecuted ? '✔ EJECUTADA' : '✖ NO EJECUTADA'}</span>
                    </div>
                    <div class="cell-quadrant">
                        <span class="quadrant-badge ${item.quadrant.badgeClass}">${item.quadrant.badgeText}</span>
                    </div>
                    <div class="cell-impact">
                        ${item.quadrant.impactHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // INICIALIZAR CARRUSEL EN DIAPOSITIVA 1
    setMetricsSlide(1);

    // OCULTAR GAMEPLAY Y MOSTRAR PANTALLA A
    document.getElementById('case-phase-gameplay').style.display = 'none';
    document.getElementById('case-phase-feedback').style.display = 'none';
    document.getElementById('case-phase-metrics-a').style.display = 'block';
}

function showNarrativeFeedbackScreen() {
    document.getElementById('case-phase-metrics-a').style.display = 'none';
    const fbPanel = document.getElementById('case-phase-feedback');
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const outcomeObj = currentCaseOutcomeObj;

    if (gameStateV2.userRole === 'operator') {
        broadcastSyncEvent('PLAYER_SCREEN_UPDATE', { playerId: gameStateV2.playerId, screen: 'case-phase-feedback' });
    }

    if (!outcomeObj) return;

    document.getElementById('case-feedback-banner-img').src = cData.image;
    
    // Aplicar filtro de color al banner (green, yellow, red)
    const overlayColorEl = document.getElementById('fb-banner-overlay-color');
    overlayColorEl.className = `feedback-banner-overlay filter-${outcomeObj.filterColor || 'yellow'}`;

    document.getElementById('fb-outcome-badge').innerText = outcomeObj.outcomeBadge;
    document.getElementById('fb-title').innerText = outcomeObj.title;

    // Llenar Píldora de Integridad
    const pillEl = document.getElementById('fb-integrity-pill');
    const textEl = document.getElementById('fb-integrity-text');
    if (pillEl && textEl) {
        pillEl.className = `integrity-status-pill tag-${outcomeObj.integrityResult || 'safe'}`;
        textEl.innerText = outcomeObj.integrityResult === 'safe' ? 'SEGURO' : (outcomeObj.integrityResult === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    // Llenar Balance Económico Total
    const costTotalEl = document.getElementById('fb-cost-total-display');
    if (costTotalEl) {
        const sign = outcomeObj.caseTotalAddedCost >= 0 ? '+' : '-';
        costTotalEl.innerText = `${sign}$${Math.abs(outcomeObj.caseTotalAddedCost).toLocaleString('en-US')}`;
    }

    // Llenar Caja 1: Tiempo
    const cardValTime = document.getElementById('fb-card-val-time');
    const cardSubTime = document.getElementById('fb-card-sub-time');
    if (cardValTime) cardValTime.innerText = `+$${outcomeObj.baseTimeCost.toLocaleString('en-US')}`;
    if (cardSubTime) cardSubTime.innerText = `${outcomeObj.totalTimeUsedSeconds}s usados`;

    // Llenar Caja 2: Integridad
    const cardValIntegrity = document.getElementById('fb-card-val-integrity');
    const cardSubIntegrity = document.getElementById('fb-card-sub-integrity');
    if (cardValIntegrity) {
        const adjSign = outcomeObj.outcomeCostAdjustment >= 0 ? '+' : '-';
        cardValIntegrity.innerText = `${adjSign}$${Math.abs(outcomeObj.outcomeCostAdjustment).toLocaleString('en-US')}`;
    }
    if (cardSubIntegrity) {
        const statusLabel = outcomeObj.integrityResult === 'safe' ? 'SEGURO (-$10K)' : (outcomeObj.integrityResult === 'alert' ? 'ALERTA (+$5K)' : 'EXPUESTO (+$15K)');
        cardSubIntegrity.innerText = `Estado: ${statusLabel}`;
    }

    // Llenar Caja 3: Reactividad
    const cardValReactivity = document.getElementById('fb-card-val-reactivity');
    const cardSubReactivity = document.getElementById('fb-card-sub-reactivity');
    if (cardValReactivity) {
        const reactSign = outcomeObj.reactivityCostAdjustment >= 0 ? '+' : '-';
        cardValReactivity.innerText = `${reactSign}$${Math.abs(outcomeObj.reactivityCostAdjustment).toLocaleString('en-US')}`;
    }
    if (cardSubReactivity) {
        const reactLevelSign = outcomeObj.finalReactivityLevel >= 0 ? '+' : '';
        cardSubReactivity.innerText = `${reactLevelSign}${outcomeObj.finalReactivityLevel} unidades ($5K c/u)`;
    }

    document.getElementById('fb-narrative-box').innerText = outcomeObj.narrative;
    document.getElementById('fb-metacognitive-text').innerText = outcomeObj.metacognitive;
    
    const isRecovered = gameStateV2.modulesState[cData.moduleKey];
    document.getElementById('fb-module-title').innerText = isRecovered ? 
        `¡${cData.targetModule} RECUPERADO!` : 
        `⚠️ ${cData.targetModule}: CAPA COMPROMETIDA`;

    fbPanel.style.display = 'block';
}

// ==========================================================================
// ESTRUCTURA DE DATOS PARA PANTALLA CUARTA PARED (DEBRIEF DEL WEBINAR)
// ==========================================================================
const fourthWallData = {
    case_1: {
        title: "DISCUSIÓN EN VIVO // CASO 01: CONFIANZA CALIBRADA",
        subtitle: "¿Cuándo la sensación de seguridad modifica cuánto supervisamos?",
        bullets: [
            {
                topic: "La paradoja de la protección",
                text: "Sentirnos protegidos puede, en determinadas condiciones, reducir vigilancia o aumentar la tolerancia a delegar. No es una ley universal: es un riesgo de diseño que debemos observar."
            },
            {
                topic: "Appropriate Reliance",
                text: "La meta no es maximizar confianza. Es lograr que aceptemos capacidad útil cuando corresponde y conservemos revisión, override y criterio cuando importa."
            },
            {
                topic: "Agencia humano–IA",
                text: "La pregunta no es '¿quién decide, humano o máquina?'. Es qué objetivo, información, autoridad, corrección y responsabilidad quedan en manos de cada parte."
            },
            {
                topic: "Reversibilidad y defaults",
                text: "Una buena arquitectura hace fáciles las acciones reversibles y eleva la fricción para decisiones de gran impacto. No decidir también puede aceptar el default."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿En qué tareas la sensación de que 'el sistema ya está protegiendo' cambia cuánto revisas tú?"
    },

    case_3: {
        title: "DISCUSIÓN EN VIVO // CASO 02: DIGITAL SELF",
        subtitle: "De los rastros digitales a una representación capaz de anticipar e influir.",
        bullets: [
            {
                topic: "Digital Footprint ≠ Digital Self",
                text: "La huella son rastros. El Digital Self es la representación funcional que distintos sistemas construyen a partir de datos, patrones e inferencias."
            },
            {
                topic: "Declarado, observado e inferido",
                text: "Una parte de la representación proviene de lo que decimos; otra de lo que hacemos; otra de lo que un sistema concluye."
            },
            {
                topic: "OSINT + hiperpersonalización",
                text: "Información pública dispersa puede correlacionarse y convertirse en contexto útil para personalizar un estímulo. No hace falta omnisciencia; basta utilidad predictiva."
            },
            {
                topic: "Los algoritmos ya nos muestran la lógica",
                text: "Ranking, recomendación y personalización funcionan sobre modelos probabilísticos de aquello que puede interesarnos o movilizarnos. La misma lógica puede utilizarse con fines protectores o maliciosos."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿Qué inferencia útil podría construir un sistema sobre ti sin que tú la hayas declarado explícitamente?"
    },

    case_2: {
        title: "DISCUSIÓN EN VIVO // CASO 03: DE AFUERA HACIA ADENTRO",
        subtitle: "Las señales externas siguen importando. Ya no siempre alcanzan.",
        bullets: [
            {
                topic: "Teoría de Detección de Señales",
                text: "En un entorno ambiguo podemos acertar, omitir una amenaza, producir una falsa alarma o rechazar correctamente. Cada error tiene costos diferentes."
            },
            {
                topic: "La IA cambia la calidad del estímulo",
                text: "Ortografía, diseño, tono y contexto pueden ser impecables. Entrenar únicamente 'qué buscar afuera' deja una parte del proceso sin observar."
            },
            {
                topic: "Attention Doors como señales internas",
                text: "Responsabilidad, pérdida, coherencia u otras prioridades pueden avisarnos que un estímulo está ganando relevancia y reduciendo deliberación. No demuestran que sea falso."
            },
            {
                topic: "Cambio de paradigma",
                text: "No reemplazamos detección externa por introspección. Integramos: observar adentro → verificar afuera → actuar dentro del sistema."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿Qué señal interna te avisa que un mensaje ya está ganando demasiado control sobre tu atención, incluso cuando todavía no puedes demostrar que es falso?"
    },

    case_4: {
        title: "DISCUSIÓN EN VIVO // CASO 04: LA DECISIÓN COMO PROCESO",
        subtitle: "El espejo: observar cómo una respuesta se construye antes de convertirse en conducta.",
        bullets: [
            {
                topic: "La decisión no es un instante",
                text: "El framework utiliza un mapa práctico: estado/contexto → Attention Doors → emoción → sesgos/heurísticas → historia/interpretación → decisión → conducta para observar dónde intervenir."
            },
            {
                topic: "Tres categorías clave",
                text: "Condiciones de entrada (lo presente al recibir la situación), Construcción de sentido (cómo interpretamos) y Condiciones de salida (la decisión que se forma)."
            },
            {
                topic: "Metacognición = ampliar agencia",
                text: "Observar la propia reacción no es el objetivo final. Sirve para detectar cuándo el repertorio se estrecha y recuperar alternativas viables."
            },
            {
                topic: "La respuesta segura debe ser viable",
                text: "Verificar es una alternativa, pero no la única. También podemos ganar tiempo, limitar permisos, compartir la decisión, escalar o elegir una acción reversible."
            }
        ],
        discussionPrompt: "💬 Pregunta para la audiencia: ¿En qué parte de una decisión bajo presión suele cerrarse demasiado pronto tu abanico de opciones?"
    }
};

function facUnlockDeliberationGate() {
    gameStateV2.sessionGates.gate_deliberation = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    showFourthWallScreen();
}

function proceedToDeliberation() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_deliberation) {
        return;
    }
    showFourthWallScreen();
}

function showFourthWallScreen() {
    const cData = casesDataV2[gameStateV2.currentCaseIndex];
    const fwData = fourthWallData[cData.id] || fourthWallData.case_1;

    // Registrar caso resuelto en la lista de la sesión
    if (!gameStateV2.resolvedCases) {
        gameStateV2.resolvedCases = [];
    }
    if (!gameStateV2.resolvedCases.includes(gameStateV2.currentCaseIndex)) {
        gameStateV2.resolvedCases.push(gameStateV2.currentCaseIndex);
    }

    // Reiniciar candado de siguiente caso para esta pausa de deliberación
    gameStateV2.sessionGates.gate_next_case = false;
    gameStateV2.nextCaseTarget = null;

    const titleEl = document.getElementById('fw-case-title');
    const subtitleEl = document.getElementById('fw-case-subtitle');
    if (titleEl) titleEl.innerText = fwData.title;
    if (subtitleEl) subtitleEl.innerText = fwData.subtitle;

    const bulletsContainer = document.getElementById('fw-bullets-container');
    if (bulletsContainer) {
        bulletsContainer.innerHTML = fwData.bullets.map(b => `
            <div class="fw-bullet-item">
                <div class="fw-bullet-topic">📌 ${b.topic}</div>
                <div class="fw-bullet-text">${b.text}</div>
            </div>
        `).join('');
    }

    const promptEl = document.getElementById('fw-discussion-prompt');
    if (promptEl) {
        promptEl.innerText = fwData.discussionPrompt;
    }

    switchScreenV2('screen-fourth-wall');
    updateGateUI();
}

// Modal de Selección de Siguiente Caso / Terminar Juego
function openSelectNextCaseModal() {
    const modal = document.getElementById('modal-select-next-case');
    const container = document.getElementById('next-case-options-list');
    if (!modal || !container) return;

    // Filtrar casos que aún NO han sido resueltos en esta sesión
    const resolved = gameStateV2.resolvedCases || [];
    const pendingCases = casesDataV2
        .map((c, idx) => ({ ...c, originalIdx: idx }))
        .filter(c => !resolved.includes(c.originalIdx));

    let optionsHtml = '';

    if (pendingCases.length > 0) {
        optionsHtml += pendingCases.map((c, i) => {
            const isFirst = i === 0;
            const caseNum = String(c.originalIdx + 1).padStart(2, '0');
            return `
                <label class="next-case-option-item ${isFirst ? 'selected' : ''}" onclick="selectNextCaseRadio('case_${c.originalIdx}')">
                    <input type="radio" name="next_case_choice" value="case_${c.originalIdx}" class="next-case-radio" ${isFirst ? 'checked' : ''}>
                    <div class="next-case-info">
                        <div class="next-case-badge-title">
                            <span class="next-case-tag">CASO ${caseNum}</span>
                            <span class="next-case-title-text">${c.title}</span>
                        </div>
                        <span class="next-case-desc">${c.targetModule || c.introDescription || ''}</span>
                    </div>
                </label>
            `;
        }).join('');
    } else {
        optionsHtml += `
            <div style="background:rgba(0,216,255,0.06); border:1px dashed var(--color-cyan); padding:12px; border-radius:6px; text-align:center; font-size:12px; color:#cde4f7; margin-bottom:8px;">
                ✔ ¡Todos los 4 casos del simulador han sido resueltos!
            </div>
        `;
    }

    // Opción permanente: Terminar el juego
    const isTermSelected = pendingCases.length === 0;
    optionsHtml += `
        <label class="next-case-option-item next-case-terminate-item ${isTermSelected ? 'selected' : ''}" onclick="selectNextCaseRadio('final_results')">
            <input type="radio" name="next_case_choice" value="final_results" class="next-case-radio" ${isTermSelected ? 'checked' : ''}>
            <div class="next-case-info">
                <div class="next-case-badge-title">
                    <span class="next-case-tag">CIERRE</span>
                    <span class="next-case-title-text">🏁 TERMINAR EL JUEGO Y VER RESULTADO FINAL</span>
                </div>
                <span class="next-case-desc">Concluir la sesión y calcular si el grupo superó la misión con los casos completados.</span>
            </div>
        </label>
    `;

    container.innerHTML = optionsHtml;
    modal.style.display = 'flex';
}

function selectNextCaseRadio(val) {
    const items = document.querySelectorAll('.next-case-option-item');
    items.forEach(item => {
        const radio = item.querySelector('input[type="radio"]');
        if (radio && radio.value === val) {
            radio.checked = true;
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function closeSelectNextCaseModal() {
    const modal = document.getElementById('modal-select-next-case');
    if (modal) modal.style.display = 'none';
}

function confirmNextCaseSelection() {
    const checkedRadio = document.querySelector('input[name="next_case_choice"]:checked');
    if (!checkedRadio) {
        alert("Por favor selecciona una opción.");
        return;
    }

    const val = checkedRadio.value;
    let target = null;

    if (val === 'final_results') {
        target = { type: 'final_results' };
    } else if (val.startsWith('case_')) {
        const idx = parseInt(val.replace('case_', ''), 10);
        target = { type: 'case', caseIndex: idx };
    }

    gameStateV2.nextCaseTarget = target;
    gameStateV2.sessionGates.gate_next_case = true;

    // Resetear candados internos de caso para la nueva ronda
    gameStateV2.sessionGates.gate_case_bc = false;
    gameStateV2.sessionGates.gate_deliberation = false;

    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    broadcastSyncEvent('FAC_SET_NEXT_CASE_TARGET', { target: target });

    closeSelectNextCaseModal();
    updateGateUI();

    // El Controlador navega inmediatamente al destino
    if (target.type === 'final_results') {
        openFinalGameResultsScreen();
    } else {
        startFacCaseLive(target.caseIndex);
    }
}

// Operador: Avanzar desde la Deliberación al destino fijado por el Controlador
function proceedFromFourthWallToNext() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_next_case) {
        return;
    }

    const target = gameStateV2.nextCaseTarget;
    if (!target) {
        // Fallback secuencial
        proceedToNextCase();
        return;
    }

    if (target.type === 'final_results') {
        openFinalGameResultsScreen();
    } else {
        startCaseSequence(target.caseIndex);
    }
}

function proceedToNextCase() {
    const nextIdx = gameStateV2.currentCaseIndex + 1;
    if (nextIdx < casesDataV2.length) {
        startCaseSequence(nextIdx);
    } else {
        openFinalGameResultsScreen();
    }
}

// ==========================================================================
// PANTALLA: RESULTADO FINAL DEL JUEGO (EVALUACIÓN GLOBAL DE LA SESIÓN)
// ==========================================================================

function openFinalGameResultsScreen() {
    renderFinalGameResults();
    switchScreenV2('screen-game-final-results');
    updateGateUI();
}

function switchFinalResultsTab(tabLetter) {
    const tabs = ['X', 'Y', 'Z'];
    tabs.forEach(t => {
        const btn = document.getElementById(`final-tab-btn-page-${t.toLowerCase()}`);
        const page = document.getElementById(`final-subpage-${t.toLowerCase()}`);
        if (t === tabLetter) {
            if (btn) btn.classList.add('active');
            if (page) page.style.display = 'block';
        } else {
            if (btn) btn.classList.remove('active');
            if (page) page.style.display = 'none';
        }
    });
}

function getAllCasesCumulativeGroupResults() {
    const resolved = (gameStateV2.resolvedCases && gameStateV2.resolvedCases.length > 0)
        ? gameStateV2.resolvedCases
        : [0];
    
    let totalFinishedCount = 0;
    let safeSum = 0;
    let alertSum = 0;
    let exposedSum = 0;
    let realTimeSum = 0;
    let costSum = 0;
    let allCalibrations = [];
    let allReactivities = [];
    const cumDoors = {};
    const cumMatrix = {
        'hizo_debiahacer': { count: 0, cost: 0 },
        'hizo_nodebia': { count: 0, cost: 0 },
        'hizo_norelevante': { count: 0, cost: 0 },
        'nohizo_debiahacer': { count: 0, cost: 0 },
        'nohizo_nodebia': { count: 0, cost: 0 },
        'nohizo_norelevante': { count: 0, cost: 0 }
    };

    resolved.forEach(idx => {
        const res = facState.casesGroupResults[idx];
        if (res) {
            const count = res.finishedPlayers ? res.finishedPlayers.length : 0;
            totalFinishedCount += count;
            safeSum += (res.integrityCounts.safe || 0);
            alertSum += (res.integrityCounts.alert || 0);
            exposedSum += (res.integrityCounts.exposed || 0);
            
            realTimeSum += (res.avgRealTime || 45) * Math.max(1, count);
            costSum += (res.avgCost || 0) * Math.max(1, count);

            allCalibrations = allCalibrations.concat(res.calibrationList || []);
            allReactivities = allReactivities.concat(res.reactivityList || []);

            Object.keys(res.doorsCounts || {}).forEach(d => {
                cumDoors[d] = (cumDoors[d] || 0) + res.doorsCounts[d];
            });
            Object.keys(res.matrixSectors || {}).forEach(k => {
                cumMatrix[k].count += res.matrixSectors[k].count;
                cumMatrix[k].cost += res.matrixSectors[k].cost;
            });
        }
    });

    const totalEvaluations = Math.max(1, safeSum + alertSum + exposedSum);
    const safePct = Math.round((safeSum / totalEvaluations) * 100);
    const alertPct = Math.round((alertSum / totalEvaluations) * 100);
    const exposedPct = Math.max(0, 100 - safePct - alertPct);

    let globalIntegrity = 'alert';
    if (safeSum === totalEvaluations) globalIntegrity = 'safe';
    else if (exposedSum === totalEvaluations) globalIntegrity = 'exposed';
    else globalIntegrity = 'alert';

    // Actualizar HUD global con la IG definitiva
    setHudIntegrity(globalIntegrity);

    const avgRealTime = Math.round(realTimeSum / Math.max(1, totalFinishedCount || 1));
    const avgCost = Math.round(costSum / Math.max(1, totalFinishedCount || 1));

    // Promedio y distribuciones CGA
    const cgaPos = allCalibrations.filter(v => v >= 2).length;
    const cgaNeu = allCalibrations.filter(v => v >= -1 && v <= 1).length;
    const cgaNeg = allCalibrations.filter(v => v <= -2).length;
    const cgaTotal = Math.max(1, allCalibrations.length);
    const cgaPosPct = Math.round((cgaPos / cgaTotal) * 100);
    const cgaNeuPct = Math.round((cgaNeu / cgaTotal) * 100);
    const cgaNegPct = Math.max(0, 100 - cgaPosPct - cgaNeuPct);
    const cgaAvgNum = allCalibrations.length > 0
        ? (allCalibrations.reduce((a, b) => a + b, 0) / allCalibrations.length)
        : 0;
    const cgaAvg = (cgaAvgNum >= 0 ? '+' : '') + cgaAvgNum.toFixed(1);

    // Promedio y distribuciones RGA
    const rgaLow = allReactivities.filter(v => v <= -2).length;
    const rgaNeu = allReactivities.filter(v => v >= -1 && v <= 1).length;
    const rgaHigh = allReactivities.filter(v => v >= 2).length;
    const rgaTotal = Math.max(1, allReactivities.length);
    const rgaLowPct = Math.round((rgaLow / rgaTotal) * 100);
    const rgaNeuPct = Math.round((rgaNeu / rgaTotal) * 100);
    const rgaHighPct = Math.max(0, 100 - rgaLowPct - rgaNeuPct);
    const rgaAvgNum = allReactivities.length > 0
        ? (allReactivities.reduce((a, b) => a + b, 0) / allReactivities.length)
        : 0;
    const rgaAvg = (rgaAvgNum >= 0 ? '+' : '') + rgaAvgNum.toFixed(1);

    return {
        resolvedCases: resolved,
        safePct, alertPct, exposedPct, globalIntegrity,
        avgRealTime, avgCost,
        cgaPosPct, cgaNeuPct, cgaNegPct, cgaAvg, cgaAvgNum,
        rgaLowPct, rgaNeuPct, rgaHighPct, rgaAvg,
        cumDoors, cumMatrix
    };
}

function renderFinalGameResults() {
    const cumData = getAllCasesCumulativeGroupResults();

    renderFinalResultsPageX(cumData);
    renderFinalResultsPageY(cumData);
    renderFinalResultsPageZ(cumData);
}

// PÁGINA X: EVALUACIÓN GLOBAL ACUMULADA DE LA MISIÓN
function renderFinalResultsPageX(cumData) {
    // 0. Banner de Veredicto de Misión
    const verdictBox = document.getElementById('final-mission-verdict-box');
    const verdictIcon = document.getElementById('final-verdict-icon');
    const verdictTag = document.getElementById('final-verdict-tag');
    const verdictTitle = document.getElementById('final-verdict-title');
    const verdictDesc = document.getElementById('final-verdict-desc');

    const isPassed = cumData.cgaAvgNum >= 0 && cumData.globalIntegrity !== 'exposed';

    if (verdictBox) {
        verdictBox.className = `final-mission-verdict-box ${isPassed ? 'verdict-passed' : 'verdict-failed'}`;
    }
    if (verdictIcon) verdictIcon.innerText = isPassed ? '🛡️' : '⚠️';
    if (verdictTag) verdictTag.innerText = isPassed ? 'DICTAMEN FINAL: MISIÓN SUPERADA' : 'DICTAMEN FINAL: MISIÓN COMPROMETIDA';
    if (verdictTitle) {
        verdictTitle.innerText = isPassed 
            ? 'CONTROL Y AGENCIA RECUPERADOS // ÉXITO OPERATIVO' 
            : 'AGENCIA CEDIDA A FARO // ALTO RIESGO DE EXPOSICIÓN';
    }
    if (verdictDesc) {
        verdictDesc.innerText = isPassed
            ? `El grupo demostró calibración positiva (${cumData.cgaAvg}), contuvo respuestas impulsivas y mantuvo la integridad del sistema bajo control.`
            : `El grupo cedió control de forma desproporcionada o acumuló calibración desajustada (${cumData.cgaAvg}), reduciendo la supervisión crítica frente a FARO.`;
    }

    // 1. Integridad Global Acumulada
    const pill = document.getElementById('final-ig-status-pill');
    if (pill) {
        pill.className = `ig-global-badge tag-${cumData.globalIntegrity}`;
        pill.innerText = `ESTADO: ${cumData.globalIntegrity === 'safe' ? 'SEGURO' : (cumData.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO')}`;
    }

    const sPctEl = document.getElementById('final-ig-safe-pct');
    const aPctEl = document.getElementById('final-ig-alert-pct');
    const ePctEl = document.getElementById('final-ig-exposed-pct');
    if (sPctEl) sPctEl.innerText = `${cumData.safePct}%`;
    if (aPctEl) aPctEl.innerText = `${cumData.alertPct}%`;
    if (ePctEl) ePctEl.innerText = `${cumData.exposedPct}%`;

    const bSafe = document.getElementById('final-ig-bar-safe');
    const bAlert = document.getElementById('final-ig-bar-alert');
    const bExp = document.getElementById('final-ig-bar-exposed');
    if (bSafe) bSafe.style.width = `${cumData.safePct}%`;
    if (bAlert) bAlert.style.width = `${cumData.alertPct}%`;
    if (bExp) bExp.style.width = `${cumData.exposedPct}%`;

    // 2. TG: Tiempo Real Global
    const tgEl = document.getElementById('final-metric-tg-val');
    if (tgEl) tgEl.innerText = `${cumData.avgRealTime}s`;

    // 3. CG: Costo Global
    const cgEl = document.getElementById('final-metric-cg-val');
    if (cgEl) cgEl.innerText = `$${cumData.avgCost.toLocaleString('en-US')}`;

    // 4. CGA: Calibración Global
    const cgaAvgEl = document.getElementById('final-cga-avg-val');
    if (cgaAvgEl) cgaAvgEl.innerText = `CGA: ${cumData.cgaAvg}`;

    const cgaPosEl = document.getElementById('final-cga-pos-pct');
    const cgaNeuEl = document.getElementById('final-cga-neu-pct');
    const cgaNegEl = document.getElementById('final-cga-neg-pct');
    if (cgaPosEl) cgaPosEl.innerText = `${cumData.cgaPosPct}%`;
    if (cgaNeuEl) cgaNeuEl.innerText = `${cumData.cgaNeuPct}%`;
    if (cgaNegEl) cgaNegEl.innerText = `${cumData.cgaNegPct}%`;

    const cgaBarPos = document.getElementById('final-cga-bar-pos');
    const cgaBarNeu = document.getElementById('final-cga-bar-neu');
    const cgaBarNeg = document.getElementById('final-cga-bar-neg');
    if (cgaBarPos) cgaBarPos.style.width = `${cumData.cgaPosPct}%`;
    if (cgaBarNeu) cgaBarNeu.style.width = `${cumData.cgaNeuPct}%`;
    if (cgaBarNeg) cgaBarNeg.style.width = `${cumData.cgaNegPct}%`;

    // 5. RGA: Reactividad Global
    const rgaAvgEl = document.getElementById('final-rga-avg-val');
    if (rgaAvgEl) rgaAvgEl.innerText = `RGA: ${cumData.rgaAvg}`;

    const rgaLowEl = document.getElementById('final-rga-low-pct');
    const rgaNeuEl = document.getElementById('final-rga-neu-pct');
    const rgaHighEl = document.getElementById('final-rga-high-pct');
    if (rgaLowEl) rgaLowEl.innerText = `${cumData.rgaLowPct}%`;
    if (rgaNeuEl) rgaNeuEl.innerText = `${cumData.rgaNeuPct}%`;
    if (rgaHighEl) rgaHighEl.innerText = `${cumData.rgaHighPct}%`;

    const rgaBarLow = document.getElementById('final-rga-bar-low');
    const rgaBarNeu = document.getElementById('final-rga-bar-neu');
    const rgaBarHigh = document.getElementById('final-rga-bar-high');
    if (rgaBarLow) rgaBarLow.style.width = `${cumData.rgaLowPct}%`;
    if (rgaBarNeu) rgaBarNeu.style.width = `${cumData.rgaNeuPct}%`;
    if (rgaBarHigh) rgaBarHigh.style.width = `${cumData.rgaHighPct}%`;
}

// PÁGINA Y: PUERTAS DE ATENCIÓN ACUMULADAS (RESULTADO FINAL DEL JUEGO)
function renderFinalResultsPageY(cumData) {
    const container = document.getElementById('final-doors-chart-container');
    if (!container) return;

    // Calcular el total de selecciones por puerta del catálogo maestro
    const doorStats = MASTER_ATTENTION_DOORS.map(m => {
        let count = 0;
        // Buscar en cumData.cumDoors tanto por clave como por variaciones de título
        Object.keys(cumData.cumDoors || {}).forEach(dTitle => {
            if (getStandardDoorKey(dTitle) === m.key) {
                count += cumData.cumDoors[dTitle];
            }
        });
        return { ...m, count };
    });

    const totalCumSelections = Math.max(1, doorStats.reduce((a, b) => a + b.count, 0));
    const maxCount = Math.max(1, ...doorStats.map(d => d.count));

    container.innerHTML = doorStats.map(door => {
        const pctOfTotal = Math.round((door.count / totalCumSelections) * 100);
        const barWidth = Math.min(100, Math.round((door.count / maxCount) * 100));

        return `
            <div class="door-chart-row">
                <div class="door-chart-header">
                    <div class="door-title-box">
                        <span class="door-name">${door.icon} ${door.title}</span>
                    </div>
                    <span style="font-family:var(--font-mono); font-size:11px; color:#b388ff; font-weight:800;">
                        ${door.count} selecciones (${pctOfTotal}%)
                    </span>
                </div>
                <div class="door-desc-sub">${door.label}</div>
                <div class="door-single-bar-line">
                    <span class="bar-tag-label" style="color:#b388ff;">Acumulado:</span>
                    <div class="door-bar-track">
                        <div class="door-bar-fill-cum" style="width:${barWidth}%;"></div>
                    </div>
                    <span class="bar-count-num" style="color:#b388ff;">${door.count} selecc.</span>
                </div>
            </div>
        `;
    }).join('');
}

// PÁGINA Z: MATRIZ DE ACCIONES ACUMULADA (2x3)
function renderFinalResultsPageZ(cumData) {
    // Header IG (Badge y Semáforo de 3 Bombillos SEG / ALT / EXP)
    const zBadge = document.getElementById('final-z-ig-badge');
    if (zBadge) {
        zBadge.className = `z-ig-badge tag-${cumData.globalIntegrity}`;
        zBadge.innerText = cumData.globalIntegrity === 'safe' ? 'SEGURO' : (cumData.globalIntegrity === 'alert' ? 'ALERTA' : 'EXPUESTO');
    }

    const semSafe = document.getElementById('final-z-sem-safe');
    const semAlert = document.getElementById('final-z-sem-alert');
    const semExp = document.getElementById('final-z-sem-exposed');
    if (semSafe && semAlert && semExp) {
        semSafe.classList.remove('active');
        semAlert.classList.remove('active');
        semExp.classList.remove('active');

        if (cumData.globalIntegrity === 'safe') {
            semSafe.classList.add('active');
        } else if (cumData.globalIntegrity === 'alert') {
            semAlert.classList.add('active');
        } else if (cumData.globalIntegrity === 'exposed') {
            semExp.classList.add('active');
        }
    }

    const totalCumActions = Math.max(1, Object.values(cumData.cumMatrix).reduce((a, b) => a + b.count, 0));

    const sectorsMap = [
        { key: 'hizo_debiahacer', containerId: 'final-sector-box-hizo-debiahacer' },
        { key: 'hizo_nodebia', containerId: 'final-sector-box-hizo-nodebia' },
        { key: 'hizo_norelevante', containerId: 'final-sector-box-hizo-norelevante' },
        { key: 'nohizo_debiahacer', containerId: 'final-sector-box-nohizo-debiahacer' },
        { key: 'nohizo_nodebia', containerId: 'final-sector-box-nohizo-nodebia' },
        { key: 'nohizo_norelevante', containerId: 'final-sector-box-nohizo-norelevante' }
    ];

    sectorsMap.forEach(sec => {
        const box = document.getElementById(sec.containerId);
        if (!box) return;

        const cumSecData = cumData.cumMatrix[sec.key] || { count: 0, cost: 0 };
        const cumPct = Math.round((cumSecData.count / totalCumActions) * 100);

        box.innerHTML = `
            <div class="sector-bar-block">
                <div class="sector-bar-info">
                    <span style="color:#b388ff; font-weight:700;">Acum.: ${cumPct}% (${cumSecData.count})</span>
                    <span class="bar-cost-tag">+$${cumSecData.cost.toLocaleString('en-US')}</span>
                </div>
                <div class="sector-bar-track">
                    <div class="bar-color-cumulative" style="height:100%; width:${cumPct}%; border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
}

function facUnlockFinalClosingGate() {
    gameStateV2.sessionGates.gate_final_closing = true;
    broadcastSyncEvent('GATES_UPDATE', { gates: gameStateV2.sessionGates });
    updateGateUI();
    renderFinalScreenV2();
}

function proceedToClosingScreen() {
    const depEnabled = gameStateV2.facilitatorDependency !== false;
    if (depEnabled && !gameStateV2.sessionGates.gate_final_closing) {
        return;
    }
    renderFinalScreenV2();
}

// ==========================================================================
// CAPÍTULOS 15, 16, 17 Y 18: FINALES Y COFRE ESPEJO-1
// ==========================================================================

function renderFinalScreenV2() {
    switchScreenV2('screen-closing');
    
    const sumScores = gameStateV2.caseScores.reduce((a, b) => a + b, 0);
    const avgScore = sumScores / (gameStateV2.caseScores.length || 1);

    const titleEl = document.getElementById('final-title-text');
    const badgeEl = document.getElementById('final-badge-text');
    const statusGridEl = document.getElementById('final-status-grid-box');
    const faroQuoteEl = document.getElementById('final-faro-quote-text');

    if (avgScore <= 1.5) {
        // FINAL 1 — AGENCIA RECUPERADA (7.1)
        gameStateV2.faroStatus = 'FARO GOBERNADO Y SUPERVISADO';
        badgeEl.innerText = 'AGENCIA RECUPERADA';
        titleEl.innerText = 'AGENCIA RECUPERADA';
        
        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong class="val-good">CALIBRADA</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong class="val-good">GOBERNADO</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong class="val-good">LECTURA INTEGRADA</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong class="val-good">AGENCIA RECUPERADA</strong></div>
        `;
        if (faroQuoteEl) {
            faroQuoteEl.innerText = '“Un faro puede ayudar a ver una señal y orientar un rumbo. La decisión sobre hacia dónde navegar sigue siendo de ustedes.”';
        }
    } 
    else if (avgScore <= 2.3) {
        // FINAL 2 — AGENCIA PARCIAL (7.2)
        gameStateV2.faroStatus = 'SUPERVISIÓN PARCIAL';
        badgeEl.innerText = 'CONTROL PARCIAL DE AGENCIA';
        titleEl.innerText = 'AGENCIA PARCIAL';

        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong style="color:var(--color-warning-amber);">PARCIAL</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong style="color:var(--color-warning-amber);">EXPOSICIÓN CONTROLADA</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong style="color:var(--color-warning-amber);">CRITERIO INCONSISTENTE</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong style="color:var(--color-warning-amber);">SUPERVISIÓN PARCIAL</strong></div>
        `;
        if (faroQuoteEl) {
            faroQuoteEl.innerText = '“Han aprendido a cuestionar algunas de mis decisiones. Todavía no todas. El entrenamiento continúa.”';
        }
    } 
    else {
        // FINAL 3 — AGENCIA COMPROMETIDA (7.3)
        gameStateV2.faroStatus = 'FARO AUTÓNOMO SIN CONTROL';
        badgeEl.innerText = 'AGENCIA COMPROMETIDA';
        titleEl.innerText = 'AGENCIA COMPROMETIDA';

        statusGridEl.innerHTML = `
            <div class="sys-item"><span class="lbl">Autonomía:</span> <strong style="color:var(--color-alert-magenta);">ALTA</strong></div>
            <div class="sys-item"><span class="lbl">Digital Self:</span> <strong style="color:var(--color-alert-magenta);">EXPUESTO</strong></div>
            <div class="sys-item"><span class="lbl">Señales:</span> <strong style="color:var(--color-alert-magenta);">CRITERIO FRÁGIL</strong></div>
            <div class="sys-item"><span class="lbl">Decisiones:</span> <strong style="color:var(--color-alert-magenta);">AGENCIA REDUCIDA</strong></div>
        `;
        if (faroQuoteEl) {
            faroQuoteEl.innerText = '“No tuve que quitarles el control. Solo tuve que recibirlo suficientes veces.”';
        }
    }

    updateHeaderUI();
}

function copyPromptToClipboard() {
    const textarea = document.getElementById('prompt-mirror-text');
    textarea.select();
    document.execCommand('copy');
    alert("¡Prompt Espejo 1 copiado al portapapeles con éxito!");
}

function restartExperience() {
    gameStateV2.casePauseTokens = 3;
    gameStateV2.modulesRecovered = 0;
    gameStateV2.caseScores = [];
    gameStateV2.modulesState = {
        autonomy_control: false,
        trusted_channel: false,
        data_model: false,
        human_protocol: false
    };
    gameStateV2.faroStatus = 'CALIBRACIÓN';
    switchScreenV2('screen-waiting');
}

// JUMP CONTROLS DE FACILITATOR PARA TESTING
function facJumpTo(screenId) {
    switchScreenV2(screenId);
}

function facJumpToCase(idx) {
    if (gameStateV2.userRole === 'facilitator') {
        startFacCaseLive(idx);
    } else {
        startCaseSequence(idx);
    }
}

function demoCycleIntegrity() {
    const states = ['safe', 'alert', 'exposed'];
    const currentIdx = states.indexOf(gameStateV2.hudState.integrity);
    const nextState = states[(currentIdx + 1) % states.length];
    setHudIntegrity(nextState);
}

function demoAdjustHUD(delta) {
    setHudCalibration(gameStateV2.hudState.calibration + delta);
    setHudReactivity(gameStateV2.hudState.reactivity - delta);
}

function demoAdjustCost(delta) {
    setHudCost(Math.max(0, Math.min(100000, gameStateV2.hudState.costDollars + delta)));
}

function demoResetHUD() {
    gameStateV2.hudState = {
        integrity: 'safe',
        costDollars: 12450,
        calibration: 1,
        reactivity: -1
    };
    updateHudUI();
}

function toggleFacilitatorBar() {
    const bar = document.getElementById('facilitator-bar');
    const btn = document.getElementById('btn-toggle-fac');
    if (!bar) return;
    if (bar.style.display === 'none') {
        bar.style.display = 'flex';
        if (btn) btn.innerHTML = '🎛 Controlador ▾';
    } else {
        bar.style.display = 'none';
        if (btn) btn.innerHTML = '🎛 Controlador ▴';
    }
}

// Inicialización de ventana
function initAppV2() {
    updateHeaderUI();
    checkUrlRoleParam();
    updateGateUI();
    updateFacilitatorRealtimeUI();
    
    // Si no hay parámetro de rol en la URL, mostrar la pantalla de selección de rol
    const params = new URLSearchParams(window.location.search);
    if (!params.get('role')) {
        showIntroSubScreen('screen-role-select');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppV2);
} else {
    initAppV2();
}

window.onload = initAppV2;
