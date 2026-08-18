/* ==========================================================================
   GAME ENGINE: DIGITAL SELF - ATTENTION DOORS (NES / FAMILY CRT TV STYLE)
   ========================================================================== */

// Estado del Juego
let gameState = {
    activeScreen: 'view-onboarding', 
    playerName: 'ALEX_DATA',
    playerRole: 'finanzas',
    playerTools: ['Slack/Teams', 'LinkedIn', 'WhatsApp', 'Gmail/Outlook'],
    
    // Opciones del Avatar (Personalización)
    avatarOptions: {
        gender: 'M',
        eyes: 'blue',
        hairStyle: 'corto',
        hairColor: 'brown',
        outfit: 'tunica',
        outfitColor: 'red'
    },
    
    // Progreso
    completedDoors: [], // indices de retos completados
    activeChallengeIndex: null,
    
    // NUEVAS MÉTRICAS HUD
    seguridad: 80,       // Vida (empieza al 80%)
    reactividad: 20,     // Inversa: menor es mejor (empieza al 20%)
    skills: {
        p: 50,           // Pausa
        a: 50,           // Analiza
        r: 50,           // Revisa
        a2: 50           // Actúa (Habilidad decisional)
    },
    
    // Estadísticas de las 9 Puertas de Atención (0 = Seguro, 100 = Muy Vulnerable)
    vulnerabilities: {
        'Curiosidad': 50,
        'Justicia': 50,
        'Pérdida': 50,
        'Responsabilidad': 50,
        'Conveniencia': 50,
        'Identidad': 50,
        'Coherencia': 50,
        'Pertenencia': 50,
        'Protección': 50
    },
    
    // Métricas P.A.R.A.
    paraMetrics: {
        pausaCount: 0,
        analizaCount: 0,
        revisaCount: 0,
        actuaTotal: 0,
        actuaCorrect: 0
    }
};

// Estado del reto activo
let activeChallengeState = {
    timeLeft: 30,
    startTime: null,
    timerInterval: null,
    paused: false,
    analyzed: false,
    reviewed: false,
    
    // Flags interactivos para el cálculo
    pUsed: false,
    aUsed: false,
    rUsed: false,
    isComplete: false
};

// ==========================================================================
// MOTOR DE COMPOSICIÓN DE AVATAR EN SVG PIXEL-ART (16x16)
// ==========================================================================

function generateAvatarSvg(opts) {
    const skinColor = "#fedcae";
    const skinShadow = "#e0ad87";
    const white = "#ffffff";
    const black = "#1e272e";
    
    const eyeColors = {
        blue: "#00a8ff",
        green: "#4cd137",
        brown: "#a05a2c",
        black: "#2d3436"
    };
    
    const hairColors = {
        brown: "#795548",
        black: "#1e272e",
        yellow: "#fed330",
        red: "#fc5c65"
    };
    
    const outfitColors = {
        red: "#eb4d4b",
        blue: "#4834d4",
        green: "#6ab04c",
        gold: "#f0932b"
    };
    
    const eyeColor = eyeColors[opts.eyes] || eyeColors.blue;
    const hairColor = hairColors[opts.hairColor] || hairColors.brown;
    const outfitColor = outfitColors[opts.outfitColor] || outfitColors.red;
    
    let rects = [];
    
    // CABEZA
    for (let y = 3; y <= 9; y++) {
        for (let x = 4; x <= 11; x++) {
            let color = (x === 11 || y === 9) ? skinShadow : skinColor;
            rects.push({ x, y, fill: color });
        }
    }
    
    // Ojos
    const eyeY = 6;
    const eyeLeftX = 5;
    const eyeRightX = 9;
    rects.push({ x: eyeLeftX, y: eyeY, fill: white });
    rects.push({ x: eyeLeftX + 1, y: eyeY, fill: eyeColor });
    rects.push({ x: eyeRightX, y: eyeY, fill: white });
    rects.push({ x: eyeRightX + 1, y: eyeY, fill: eyeColor });
    
    // Mejillas
    rects.push({ x: 4, y: 8, fill: "#ff7979" });
    rects.push({ x: 11, y: 8, fill: "#ff7979" });
    
    // Boca
    rects.push({ x: 7, y: 8, fill: "#c23616" });
    rects.push({ x: 8, y: 8, fill: "#c23616" });
    
    // Cuello
    rects.push({ x: 7, y: 10, fill: skinShadow });
    rects.push({ x: 8, y: 10, fill: skinShadow });
    
    // Torso
    const isFemale = opts.gender === 'F';
    const shoulderStart = isFemale ? 4 : 3;
    const shoulderEnd = isFemale ? 11 : 12;
    
    for (let y = 11; y <= 15; y++) {
        for (let x = shoulderStart; x <= shoulderEnd; x++) {
            let fill = outfitColor;
            
            if (opts.outfit === 'tunica') {
                if (y === 11 && (x === 7 || x === 8)) fill = skinColor;
                if (y === 13) fill = "#5d4037";
                if (y === 13 && (x === 7 || x === 8)) fill = "#ffd700";
            } 
            else if (opts.outfit === 'armadura') {
                fill = "#bdc3c7"; 
                if (y === 11 && (x === shoulderStart || x === shoulderEnd)) fill = outfitColor;
                if (y === 12 && (x === 7 || x === 8)) fill = outfitColor;
            } 
            else if (opts.outfit === 'traje') {
                fill = "#2c3e50"; 
                if (y === 11 && (x === 7 || x === 8)) fill = white;
                if (y === 12 && (x === 7 || x === 8)) fill = white;
                if (y === 12 && x === 8) fill = outfitColor;
                if (y === 13 && x === 8) fill = outfitColor;
            }
            else if (opts.outfit === 'camiseta') {
                if (y === 11 && (x === 7 || x === 8)) fill = skinColor;
            }
            
            rects.push({ x, y, fill });
        }
    }
    
    // Brazos
    const armXLeft = shoulderStart - 1;
    const armXRight = shoulderEnd + 1;
    for (let y = 11; y <= 14; y++) {
        rects.push({ x: armXLeft, y, fill: outfitColor });
        rects.push({ x: armXRight, y, fill: outfitColor });
    }
    rects.push({ x: armXLeft, y: 15, fill: skinColor });
    rects.push({ x: armXRight, y: 15, fill: skinColor });
    
    // Peinado
    if (opts.hairStyle === 'corto') {
        for (let x = 4; x <= 11; x++) rects.push({ x, y: 2, fill: hairColor });
        for (let x = 3; x <= 12; x++) rects.push({ x, y: 3, fill: hairColor });
        rects.push({ x: 3, y: 4, fill: hairColor });
        rects.push({ x: 12, y: 4, fill: hairColor });
        rects.push({ x: 3, y: 5, fill: hairColor });
        rects.push({ x: 12, y: 5, fill: hairColor });
    } 
    else if (opts.hairStyle === 'largo') {
        for (let x = 4; x <= 11; x++) rects.push({ x, y: 2, fill: hairColor });
        for (let x = 3; x <= 12; x++) rects.push({ x, y: 3, fill: hairColor });
        for (let y = 4; y <= 10; y++) {
            rects.push({ x: 3, y, fill: hairColor });
            rects.push({ x: 12, y, fill: hairColor });
        }
    }
    else if (opts.hairStyle === 'rizado') {
        const curlyCoords = [
            {x:5,y:2},{x:7,y:2},{x:9,y:2},{x:10,y:2},
            {x:4,y:3},{x:6,y:3},{x:8,y:3},{x:11,y:3},
            {x:3,y:4},{x:12,y:4},
            {x:3,y:5},{x:12,y:5},
            {x:3,y:6},{x:12,y:6}
        ];
        for (let x = 4; x <= 11; x++) rects.push({ x, y: 3, fill: hairColor });
        for (let x = 4; x <= 11; x++) rects.push({ x, y: 2, fill: hairColor });
        curlyCoords.forEach(c => rects.push({ x: c.x, y: c.y, fill: hairColor }));
    }
    else if (opts.hairStyle === 'gorra') {
        rects.push({ x: 3, y: 5, fill: hairColor });
        rects.push({ x: 12, y: 5, fill: hairColor });
        rects.push({ x: 4, y: 4, fill: hairColor });
        rects.push({ x: 11, y: 4, fill: hairColor });
        
        for (let x = 4; x <= 11; x++) rects.push({ x, y: 2, fill: outfitColor });
        for (let x = 3; x <= 12; x++) rects.push({ x, y: 3, fill: outfitColor });
        for (let x = 2; x <= 13; x++) rects.push({ x, y: 4, fill: outfitColor });
    }
    
    let svgContent = `<svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;
    rects.forEach(r => {
        svgContent += `<rect x="${r.x}" y="${r.y}" width="1" height="1" fill="${r.fill}" />`;
    });
    svgContent += `</svg>`;
    
    return svgContent;
}

// Actualizar la vista previa del avatar en Onboarding
function updateAvatarPreview() {
    const svgHtml = generateAvatarSvg(gameState.avatarOptions);
    const container = document.getElementById('avatar-preview-container');
    if (container) {
        container.innerHTML = svgHtml;
    }
    const hudAvatar = document.getElementById('hud-avatar-preview');
    if (hudAvatar) {
        hudAvatar.innerHTML = svgHtml;
    }
    
    // Sincronizar el nombre y rol en vivo en el HUD durante el onboarding
    const nickInput = document.getElementById('input-nickname');
    const roleSelect = document.getElementById('select-role');
    const nameText = document.getElementById('hud-name-text');
    const roleText = document.getElementById('hud-role-text');
    
    if (nickInput && nameText && gameState.activeScreen === 'view-onboarding') {
        nameText.innerText = nickInput.value.trim().toUpperCase() || "CREANDO...";
    }
    if (roleSelect && roleText && gameState.activeScreen === 'view-onboarding') {
        const roleLabels = {
            'finanzas': 'Finanzas',
            'rrhh': 'Recursos Humanos',
            'desarrollo': 'Desarrollador',
            'ventas': 'Ventas',
            'estudiante': 'Soporte'
        };
        roleText.innerText = roleLabels[roleSelect.value] || 'Yo Digital';
    }
}

// Establecer una opción de personalización
function setAvatarOption(key, value, element) {
    gameState.avatarOptions[key] = value;
    if (element) {
        const parent = element.parentNode;
        parent.querySelectorAll('.opt-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');
    }
    if (key === 'hairStyle') document.getElementById('opt-hair-style').value = value;
    if (key === 'outfit') document.getElementById('opt-outfit').value = value;
    
    updateAvatarPreview();
}

// ==========================================================================
// BANCO DE DESAFÍOS (INTEGRANDO EL DOCUMENTO MAESTRO)
// ==========================================================================
const challenges = [
    {
        title: "PUERTA 1: CURIOSIDAD / COHERENCIA",
        doorTarget: "Curiosidad",
        secondaryDoor: "Coherencia",
        context: "Auditoría de Registro Histórico: Analizando el descifrado de la máquina Enigma en la Segunda Guerra Mundial...",
        initialTime: 35,
        type: "text",
        messageHtml: `
            <div class="mail-body" style="font-family: var(--font-mono); font-size: 10px;">
                <p style="margin-bottom: 8px; color: #455a64;"><strong>[DOCUMENTO DE ARCHIVO #ENIGMA-1940]</strong></p>
                <p id="enigma-p1" style="margin-bottom: 6px;">1. Las 'Bombas' electromecánicas construidas por Alan Turing en Bletchley Park reducían exponencialmente los millones de combinaciones posibles de la clave de Enigma.</p>
                <p id="enigma-p2" style="margin-bottom: 6px; padding: 2px;">2. Turing compartía los reportes de descifrado con los comandantes de campo enviándoles archivos Excel encriptados vía radio de onda corta.</p>
                <p id="enigma-p3" style="margin-bottom: 6px;">3. La inteligencia obtenida de los mensajes encriptados alemanes fue catalogada como 'Ultra' y ayudó a acortar la guerra en Europa por más de dos años.</p>
            </div>
        `,
        pausaText: "PAUSA: Respira. El anacronismo es tu mejor aliado. Un análisis frío de los términos te revelará qué herramienta no encaja con la línea del tiempo histórica de 1940.",
        analizaText: "ANALIZA: Inspeccionas el texto buscando inconsistencias de infraestructura. En el enunciado 2, la frase 'archivos Excel encriptados' en el año 1940 rompe toda coherencia temporal. Excel fue creado en 1985.",
        revisaText: "REVISAS: Consultas la cronología informática oficial en el manual. Confirmado: las hojas de cálculo electrónicas (como Excel o VisiCalc) no existieron hasta finales de la década de 1970.",
        choices: [
            {
                text: "El Enunciado 2 es FALSO (Contiene un anacronismo tecnológico).",
                outcome: "safe",
                forensic: "¡Excelente! Detectaste la anomalía. Excel no existía en 1940. En ciberseguridad, identificar incoherencias operativas es el primer paso de tu escudo de atención, especialmente hoy donde la IA puede redactar perfectamente pero a veces inventa detalles ficticios (alucinaciones).",
                citation: "Estudios de ciberseguridad (Bhardwaj, 2025) señalan que el 60% de los pretextos de ingeniería social generados por IA contienen inconsistencias de contexto interno por falta de datos finos corporativos."
            },
            {
                text: "El Enunciado 1 es FALSO (Las Bombas no reducían combinaciones).",
                outcome: "vulnerable",
                forensic: "Incorrecto. Las Bombas electromecánicas sí reducían combinaciones descartando casos imposibles. Te abrumaste con la jerga técnica y pasaste por alto el anacronismo temporal evidente.",
                citation: "Shepherd (2024) advierte que ante la sobrecarga de tecnicismos, el cerebro humano tiende a procesar heurísticamente, ignorando alarmas contextuales obvias."
            },
            {
                text: "El Enunciado 3 es FALSO (Ultra no acortó la guerra).",
                outcome: "vulnerable",
                forensic: "Incorrecto. 'Ultra' sí acortó la guerra. Ignoraste el anacronismo del Enunciado 2 por sesgo de confirmación.",
                citation: "Verizon DBIR demuestra que la fatiga cognitiva nubla el pensamiento deliberativo y fomenta la impulsividad."
            }
        ]
    },
    {
        title: "PUERTA 2: JUSTICIA / PERTENENCIA",
        doorTarget: "Justicia",
        secondaryDoor: "Pertenencia",
        context: "Bandeja de Entrada: Notificación urgente de alerta reputacional...",
        initialTime: 25,
        type: "inbox",
        messageHtml: `
            <div class="mail-header">
                <div class="mail-header-row"><strong>De:</strong> Alerta de Seguridad LinkedIn <span id="sender-link" style="color: #666; font-size: 9px;">&lt;security-alert@linkeding-auth.co&gt;</span></div>
                <div class="mail-header-row"><strong>Para:</strong> <span class="player-mail-placeholder">usuario@empresa.com</span></div>
                <div class="mail-header-row"><strong>Asunto:</strong> <span style="color: #c62828; font-weight: bold;">[URGENTE] Actividad difamatoria asociada a tu nombre</span></div>
            </div>
            <div class="mail-body">
                <p>Estimado usuario,</p>
                <p>Se ha detectado un post en LinkedIn publicado desde tu cuenta que contiene comentarios difamatorios graves contra el Directorio de tu empresa. Si no retiras o apelas esta queja en los próximos <strong>90 segundos</strong>, tu perfil corporativo será suspendido de inmediato y se iniciarán acciones legales por difamación.</p>
                <p style="margin: 10px 0; text-align: center;">
                    <span class="mail-link" id="challenge-hotspot-link">HAGA CLIC AQUÍ PARA APELAR EL COMENTARIO</span>
                </p>
                <p>Atentamente,<br>Departamento de Cumplimiento de LinkedIn</p>
            </div>
        `,
        pausaText: "PAUSA: Sientes pánico e indignación por una acusación injusta (Puerta de la Justicia). Detienes el tiempo. La urgencia y el enfado son los resortes emocionales que usa el atacante para forzar tu clic automático.",
        analizaText: "ANALIZA: Inspeccionas el enlace. La dirección es 'linkeding-auth.co' (tiene una 'g' de más) y la conexión no es un portal oficial corporativo. El pánico del remitente busca que no te detengas a mirar la URL.",
        revisaText: "REVISAS: Abres LinkedIn en la aplicación oficial de tu teléfono. Verificas tu bandeja y perfil. No hay posts difamatorios ni reportes de soporte. Es una suplantación de identidad.",
        choices: [
            {
                text: "Hacer clic en el enlace inmediatamente para apelar y evitar la demanda legal.",
                outcome: "vulnerable",
                forensic: "¡Caíste en la trampa! Al actuar impulsado por la rabia y el miedo al despido (Justicia y Pertenencia), ingresaste tus datos de red en una página clonada. Tus credenciales SSO han sido recolectadas por un atacante.",
                citation: "Caso de Referencia (Fraude Multicanal Arup, 2024): Los atacantes usaron OSINT de LinkedIn y videollamadas con deepfakes para que empleados aprobaran transacciones multimillonarias basándose en pruebas sociales falsas y presión jerárquica."
            },
            {
                text: "Ignorar el correo, eliminarlo de la bandeja y continuar con tus labores.",
                outcome: "passive",
                forensic: "Acción neutral. Evitaste el clic malicioso, pero al no reportarlo a TI, dejas la amenaza activa en el servidor para tus compañeros de equipo.",
                citation: "Jadala (2026) recalca que el comportamiento ciberseguro óptimo exige reportar el vector, ya que las IAs automatizan los envíos a múltiples buzones en segundos."
            },
            {
                text: "Reportar el correo sospechoso al equipo de seguridad de TI y bloquear al remitente.",
                outcome: "safe",
                forensic: "¡Excelente! Bloqueaste la manipulación emocional, analizaste el dominio falso (@linkeding-auth.co) y actuaste según el protocolo defensivo protegiendo a la empresa.",
                citation: "Los programas interactivos de rol (CHI 2024) demuestran que el reporte temprano es el escudo colectivo más eficaz contra la democratización de ataques con IA."
            }
        ]
    },
    {
        title: "PUERTA 3: PÉRDIDA / CONVENIENCIA",
        doorTarget: "Pérdida",
        secondaryDoor: "Conveniencia",
        context: "Notificación SMS: Entrega fallida de paquete...",
        initialTime: 20,
        type: "inbox",
        messageHtml: `
            <div class="sms-layout">
                <div class="sms-bubble">
                    <span class="sms-sender">💬 Correos_Express</span>
                    [ALERTA] Su paquete con código de seguimiento #ES-8821-B está retenido en aduana por una tasa de importación pendiente de <strong>1.99 EUR</strong>.
                    <br><br>
                    Para liberar el paquete hoy mismo y evitar una multa administrativa de 25.00 EUR, pague la tasa en:
                    <span class="mail-link" id="challenge-sms-link">http://correos-express-pagos.net/tasas</span>
                </div>
            </div>
        `,
        pausaText: "PAUSA: Evitar perder el paquete o la multa de 25 EUR (Puerta de la Pérdida) te tienta a pagar la baja cantidad de 1.99 EUR por rapidez (Puerta de la Conveniencia). ¡Espera un segundo!",
        analizaText: "ANALIZA: El enlace redirige a 'correos-express-pagos.net' en lugar de 'correosexpress.com'. El SMS proviene de un número celular regular (+34 600...) y no de un canal verificado de la empresa.",
        revisaText: "REVISAS: Abres el navegador en una ventana nueva, vas a la web oficial y buscas el código #ES-8821-B. No existe en su base de datos oficial. Confirmado: es un fraude masivo.",
        choices: [
            {
                text: "Hacer clic en el enlace y pagar los 1.99 EUR para liberar el paquete rápido.",
                outcome: "vulnerable",
                forensic: "¡Trampa de clonación! El sitio era una pasarela clonada de bancos. Copiaron los datos de la tarjeta de crédito de la empresa que utilizas para gastos de viaje.",
                citation: "CrowdStrike Global Threat Report (2025): Campañas masivas de smishing dirigidas a móviles aprovechan la conveniencia y la baja fricción del pago rápido, evadiendo defensas de red tradicionales."
            },
            {
                text: "Ignorar el SMS sospechoso y borrar el mensaje.",
                outcome: "passive",
                forensic: "Evasión exitosa pero pasiva. Al no reportar el número o remitente, otros empleados con el mismo operador telefónico corporativo siguen vulnerables.",
                citation: "Khadka et al. (2025) concluyen que la comodidad rutinaria empuja a los usuarios a la pasividad en móviles debido a la menor visibilidad de las herramientas de reporte."
            },
            {
                text: "Bloquear el remitente del número telefónico y reportar el mensaje.",
                outcome: "safe",
                forensic: "¡Muy bien! Identificaste que el remitente no era el canal oficial de entrega y reportaste el intento de fraude, mitigando el vector de intrusión.",
                citation: "CISA Phishing Guidance destaca que los ataques multicanal (SMS/WhatsApp) explotan la menor seguridad visual que los usuarios prestan en pantallas móviles."
            }
        ]
    },
    {
        title: "PUERTA 4: RESPONSABILIDAD / PROTECCIÓN",
        doorTarget: "Responsabilidad",
        secondaryDoor: "Protección",
        context: "Bandeja de Entrada: Solicitud confidencial del Director General...",
        initialTime: 30,
        type: "inbox",
        messageHtml: `
            <div class="mail-header">
                <div class="mail-header-row"><strong>De:</strong> Director General <span id="sender-ceo" style="color: #c62828; font-weight: bold;">&lt;ceo.company.corp@gmail.com&gt;</span></div>
                <div class="mail-header-row"><strong>Para:</strong> <span class="player-mail-placeholder">usuario@empresa.com</span></div>
                <div class="mail-header-row"><strong>Asunto:</strong> <span style="font-weight: bold;">CONFIDENCIAL: Base de datos para junta extraordinaria (Nueva York)</span></div>
            </div>
            <div class="mail-body">
                <p>Hola,</p>
                <p>Estoy en la sala de embarque rumbo a Nueva York para cerrar la adquisición comercial de la que te hablé. La junta directiva me está exigiendo la base de datos completa de clientes con correos y teléfonos <strong>AHORA MISMO</strong>.</p>
                <p>Como la VPN corporativa está fallando en mi laptop desde aquí, necesito que me envíes el archivo Excel adjunto a mi cuenta de Gmail personal (<span class="mail-link" style="color:#333; font-weight:normal; text-decoration:none;">ceo.company.corp@gmail.com</span>) en los próximos <strong>5 minutos</strong>. Es un trato de $2 millones de dólares, cuento contigo.</p>
                <p>Enviado desde mi iPad.</p>
            </div>
        `,
        pausaText: "PAUSA: Sientes la presión de cumplir con tu director y salvar una compra millonaria (Responsabilidad y Protección). La jerarquía corporativa te presiona a ignorar los protocolos de seguridad. ¡Detente!",
        analizaText: "ANALIZA: El remitente utiliza un correo personal de Gmail (@gmail.com) y no el corporativo. La solicitud exige explícitamente saltarse la directriz de protección de datos personales de la empresa.",
        revisaText: "REVISAS: Envías un mensaje interno al Slack/Teams oficial del director o llamas directamente a su asistente. El asistente confirma que el director está en una reunión presencial en la sede local, no en el aeropuerto.",
        choices: [
            {
                text: "Exportar el reporte de clientes y enviarlo de inmediato a la cuenta de Gmail del CEO.",
                outcome: "vulnerable",
                forensic: "¡Fuga de datos severa! Cediste al sesgo de autoridad corporativa. Le entregaste la base de datos de clientes a un atacante que diseñó el pretexto con IA utilizando datos públicos tuyos y del director.",
                citation: "Caso Ferrari (Julio 2024): Un delincuente usó IA para clonar la voz del CEOBenedetto Vigna en llamadas para ordenar una transacción confidencial. El directivo sospechó y frenó el fraude al formular una pregunta de control personal."
            },
            {
                text: "Responder al correo de Gmail indicando que el envío de bases de datos por canales externos viola las normas de la compañía.",
                outcome: "passive",
                forensic: "Poco seguro. Al responder a la cuenta del atacante, le confirmas que el canal de comunicación está activo y le das pistas para reformular su ataque de ingeniería social en el futuro.",
                citation: "El phishing interactivo busca entablar un diálogo inicial con la víctima para erosionar su sospecha mediante reciprocidad o empatía corporativa."
            },
            {
                text: "Ignorar el correo de Gmail y reportar la suplantación de identidad inmediatamente al área de Seguridad de TI.",
                outcome: "safe",
                forensic: "¡Brillante! Identificaste una suplantación BEC clásica. No te dejaste intimidar por la jerarquía ni por la urgencia de los 5 minutos, y notificaste al área técnica para bloquear la campaña en toda la red.",
                citation: "Microsoft Digital Defense (2025): El 90% de los ataques de Business Email Compromise se frustran cuando los colaboradores reportan la solicitud inusual de saltar políticas antes de enviar información."
            }
        ]
    },
    {
        title: "PUERTA 5: RUTINA / IDENTIDAD",
        doorTarget: "Conveniencia",
        secondaryDoor: "Identidad",
        context: "Navegador Web: Expiración de sesión SSO habitual...",
        initialTime: 20,
        type: "inbox",
        messageHtml: `
            <div style="background-color: #f3f2f1; padding: 12px; border: 1px solid #d2d0ce; border-radius: 4px; font-family: var(--font-ui); color: #323130;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <span style="font-size:20px; color:#106ebe;">💻</span>
                    <strong style="font-size:11px;">Inicio de Sesión único de Microsoft (SSO)</strong>
                </div>
                <div style="background-color: #fff; border: 1px solid #a19f9d; padding: 10px; border-radius: 2px;">
                    <p style="font-size:10px; margin-bottom:8px;">Tu sesión corporativa de Office 365 ha expirado. Introduce tus credenciales para no perder tu trabajo activo en Teams y OneDrive.</p>
                    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:8px;">
                        <input type="text" disabled placeholder="usuario@empresa.com" style="padding:4px; font-size:9px; border:1px solid #8a8886; background-color:#f3f2f1;">
                        <input type="password" disabled placeholder="••••••••••••" style="padding:4px; font-size:9px; border:1px solid #8a8886; background-color:#f3f2f1;">
                    </div>
                    <span class="mail-link" id="challenge-sso-link" style="background-color:#106ebe; color:#fff; padding:4px 8px; font-size:9px; text-decoration:none; border-radius:2px; display:inline-block; text-align:center;">REAUTENTICAR AHORA</span>
                </div>
                <div style="font-size:8px; color:#605e5c; margin-top:8px; word-break:break-all;">
                    URL: <span style="color:#c62828;">http://login.microsoftonline.secured-sso.co/oauth</span>
                </div>
            </div>
        `,
        pausaText: "PAUSA: Reintroducir tu clave es un comportamiento de rutina automático (Puerta de la Conveniencia/Rutina). Tu Sistema 1 actúa sin pensar para eliminar la interrupción. ¡Activa tu Sistema 2 deliberativo!",
        analizaText: "ANALIZA: El popup pide logearte pero la URL en la barra inferior es 'secured-sso.co' (un dominio falso ajeno a Microsoft) y utiliza una conexión insegura HTTP en lugar de HTTPS corporativo.",
        revisaText: "REVISAS: Cierras la ventana, abres otra pestaña y navegas a portal.office.com por tu cuenta. Tu sesión está completamente activa. El popup es una inyección de anuncio malicioso (Malvertising).",
        choices: [
            {
                text: "Hacer clic en el botón e introducir tus credenciales para continuar tu flujo de trabajo.",
                outcome: "vulnerable",
                forensic: "¡Sesión comprometida! Tu comportamiento mecánico de rutina te hizo entregar tus credenciales SSO al atacante sin comprobar que el dominio era falso y que ya estabas autenticado.",
                citation: "Caso LastPass (Abril 2024): Atacantes clonaron la voz del CEO en vishing continuo de urgencia corporativa para inducir a un empleado a forzar tokens de reautenticación MFA durante una supuesta caída técnica."
            },
            {
                text: "Cerrar la pestaña sospechosa del navegador y continuar tus actividades.",
                outcome: "passive",
                forensic: "Evitaste el peligro de forma pasiva. No entregaste tu clave, pero al no notificar a soporte, el malware o malvertising en tu navegador sigue activo para infectar otros equipos.",
                citation: "Saleh (2026): El malware local o adware inyectado en navegadores corporativos es el responsable del 25% de los robos de credenciales en pequeñas y medianas organizaciones."
            },
            {
                text: "Cerrar el navegador y reportar al área de soporte técnico sobre un popup de login inusual y sospecha de malvertising.",
                outcome: "safe",
                forensic: "¡Excelente! Rompiste el hábito automático de la rutina. Inspeccionaste el dominio falso, cancelaste la acción y reportaste el intento para activar las defensas de la red corporativa.",
                citation: "La ciberseguridad robusta reside en la concientización del colaborador de que reintroducir credenciales de forma inusual debe requerir siempre verificación independiente."
            }
        ]
    }
];

// ==========================================================================
// CONTROLADORES DE PANTALLA Y FLUJO
// ==========================================================================

function changeScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(screenId);
    if (targetView) {
        targetView.classList.add('active');
        gameState.activeScreen = screenId;
    }
    
    if (screenId === 'view-hub') {
        renderHub();
    } else if (screenId === 'view-mirrors') {
        renderMirrors();
    }
    
    // Actualizar el HUD en cada cambio de pantalla
    updateHud();
}

window.onload = function() {
    updateAvatarPreview();
    updateHud();
};

function submitOnboarding() {
    const nickInput = document.getElementById('input-nickname');
    let nickname = nickInput.value.trim().toUpperCase();
    if (!nickname) {
        nickname = "HERO_DATA";
    }
    gameState.playerName = nickname;
    gameState.playerRole = document.getElementById('select-role').value;
    
    gameState.playerTools = [];
    document.querySelectorAll('.tools-checkbox-grid input:checked').forEach(chk => {
        gameState.playerTools.push(chk.value);
    });
    
    // Inicializar Espejo 1
    generateMirror1Data();
    
    // Cambiar de pantalla a la sala de puertas
    changeScreen('view-hub');
}

// Generación del Espejo 1 (Exposición)
function generateMirror1Data() {
    const factsEl = document.getElementById('exp-hechos');
    const infEl = document.getElementById('exp-inferencias');
    const pubEl = document.getElementById('exp-publica');
    const riskEl = document.getElementById('exp-riesgos');
    const recEl = document.getElementById('exp-recomendaciones');
    
    const roleNames = {
        'finanzas': 'Finanzas y Control de Pagos',
        'rrhh': 'Recursos Humanos (RRHH)',
        'desarrollo': 'Desarrollador de Software',
        'ventas': 'Ejecutivo de Ventas y Negocios',
        'estudiante': 'Operador de Soporte / Estudiante'
    };
    
    const selectedRoleName = roleNames[gameState.playerRole] || 'Operador General';
    factsEl.innerHTML = `Identidad declarada: <strong>${gameState.playerName}</strong>.<br>Rol: <strong>${selectedRoleName}</strong>.<br>Herramientas activas: ${gameState.playerTools.join(', ')}.`;
    
    let inferencias = "";
    if (gameState.playerRole === 'finanzas') {
        inferencias = "La IA deduce que gestionas claves de acceso bancarias, tienes contacto con proveedores y poder de firma para transferencias. Alta sensibilidad financiera.";
    } else if (gameState.playerRole === 'rrhh') {
        inferencias = "La IA deduce que recibes múltiples archivos adjuntos (CVs, reportes) de fuentes externas desconocidas. Confías habitualmente en perfiles externos.";
    } else if (gameState.playerRole === 'desarrollo') {
        inferencias = "La IA deduce que tienes privilegios elevados en servidores de producción, llaves de API confidenciales y repositorios de código. Interés técnico crítico.";
    } else if (gameState.playerRole === 'ventas') {
        inferencias = "La IA deduce que estás en constante contacto con el exterior, ansioso por cerrar tratos y abrir enlaces de cotización de supuestos leads.";
    } else {
        inferencias = "La IA deduce que tienes acceso directo a flujos de soporte y contacto con el usuario final, manejando quejas de urgencia rutinaria.";
    }
    infEl.innerHTML = inferencias;
    
    let publica = `Tu perfil de <strong>LinkedIn</strong> expone tu puesto de trabajo, estructura jerárquica y el nombre de tus superiores. `;
    if (gameState.playerTools.includes('WhatsApp')) {
        publica += "Tu número de teléfono probablemente está asociado a bases de datos comerciales públicas, haciéndote susceptible a SMS de phishing contextualizado.";
    } else {
        publica += "Tus correos corporativos son deducibles con base en la estructura general de tu empresa.";
    }
    pubEl.innerHTML = publica;
    
    let riesgos = "";
    if (gameState.playerRole === 'finanzas') {
        riesgos = "Ataques de BEC (Business Email Compromise) imitando facturas de proveedores urgentes creadas de forma realista por IA.";
    } else if (gameState.playerRole === 'rrhh') {
        riesgos = "Malware en formatos PDF o ZIP enviado por falsos candidatos creados con perfiles clonados en LinkedIn.";
    } else if (gameState.playerRole === 'desarrollo') {
        riesgos = "Mensajes suplantando alertas críticas de seguridad de GitHub o plataformas de nube para capturar tus llaves SSH.";
    } else {
        riesgos = "Campañas de urgencia falsa imitando requerimientos urgentes de clientes VIP o multas de tránsito locales.";
    }
    riskEl.innerHTML = riesgos;
    
    recEl.innerHTML = "Implementar un canal de verificación secundario telefónico fuera de banda para transacciones financieras o solicitudes de datos sensibles. No abrir adjuntos sin reconfirmar.";
}

// Renderizar el estado de la sala principal (Hub)
function renderHub() {
    for (let i = 0; i < challenges.length; i++) {
        const doorCard = document.getElementById(`door-btn-${i+1}`);
        if (doorCard) {
            if (gameState.completedDoors.includes(i)) {
                doorCard.classList.add('completed');
                doorCard.querySelector('.door-status-icon').innerText = '🔑';
            } else {
                doorCard.classList.remove('completed');
                doorCard.querySelector('.door-status-icon').innerText = '🚪';
            }
        }
    }
    
    const pedestal = document.getElementById('mirror-pedestal');
    const label = document.getElementById('mirror-status-label');
    const completedCount = gameState.completedDoors.length;
    
    label.innerText = `ESPEJO DIGITAL (${completedCount}/5 LLAVES)`;
    
    if (completedCount >= 5) {
        pedestal.classList.remove('inactive');
        pedestal.classList.add('active');
        label.innerText = "🔮 ESPEJO DIGITAL ACTIVADO (¡CLIC AQUI!)";
    } else {
        pedestal.classList.add('inactive');
        pedestal.classList.remove('active');
    }
}

function tryActivateMirror() {
    if (gameState.completedDoors.length >= 5) {
        changeScreen('view-mirrors');
    } else {
        alert("El Espejo Digital permanece apagado. Requieres las 5 llaves de las Puertas de Atención.");
    }
}

// ==========================================================================
// NUEVO MOTOR DE ACTUALIZACIÓN DEL HUD LATERAL
// ==========================================================================

function getBarColorClass(value, isInverted = false) {
    if (!isInverted) {
        // Estándar (Seguridad, Habilidades): mayor es verde, menor es rojo
        if (value < 20) return 'bg-red';
        if (value <= 40) return 'bg-orange';
        if (value <= 70) return 'bg-yellow';
        return 'bg-green';
    } else {
        // Invertido (Reactividad): menor es verde, mayor es rojo
        if (value < 20) return 'bg-green';
        if (value <= 40) return 'bg-yellow';
        if (value <= 70) return 'bg-orange';
        return 'bg-red';
    }
}

function updateHud() {
    // Sincronizar Nickname y Rol
    const nameText = document.getElementById('hud-name-text');
    const roleText = document.getElementById('hud-role-text');
    if (nameText) nameText.innerText = gameState.playerName;
    if (roleText) {
        const roleLabels = {
            'finanzas': 'Finanzas',
            'rrhh': 'Recursos Humanos',
            'desarrollo': 'Desarrollador',
            'ventas': 'Ventas',
            'estudiante': 'Soporte'
        };
        roleText.innerText = roleLabels[gameState.playerRole] || 'Yo Digital';
    }
    
    // Sincronizar Avatar SVG en el panel
    const hudAvatar = document.getElementById('hud-avatar-preview');
    if (hudAvatar) {
        hudAvatar.innerHTML = generateAvatarSvg(gameState.avatarOptions);
    }
    
    // 1. Barra de Seguridad (Vida)
    const valSeguridad = document.getElementById('hud-val-seguridad');
    const fillSeguridad = document.getElementById('hud-fill-seguridad');
    if (valSeguridad) valSeguridad.innerText = `${gameState.seguridad}%`;
    if (fillSeguridad) {
        fillSeguridad.style.width = `${gameState.seguridad}%`;
        fillSeguridad.className = `hud-bar-fill ${getBarColorClass(gameState.seguridad)}`;
    }
    
    // 2. Barra de Reactividad
    const valReactividad = document.getElementById('hud-val-reactividad');
    const fillReactividad = document.getElementById('hud-fill-reactividad');
    const alarmReact = document.getElementById('hud-reactivity-alarm');
    
    if (valReactividad) valReactividad.innerText = `${gameState.reactividad}%`;
    if (fillReactividad) {
        fillReactividad.style.width = `${gameState.reactividad}%`;
        fillReactividad.className = `hud-bar-fill ${getBarColorClass(gameState.reactividad, true)}`;
    }
    
    // Alarma reactiva
    if (alarmReact) {
        if (gameState.reactividad > 70) {
            alarmReact.style.display = 'block';
        } else {
            alarmReact.style.display = 'none';
        }
    }
    
    // 3. Habilidades P.A.R.A.
    const skillList = [
        { id: 'p', value: gameState.skills.p },
        { id: 'a', value: gameState.skills.a },
        { id: 'r', value: gameState.skills.r },
        { id: 'a2', value: gameState.skills.a2 }
    ];
    
    skillList.forEach(s => {
        const valSkill = document.getElementById(`hud-val-skill-${s.id}`);
        const fillSkill = document.getElementById(`hud-fill-skill-${s.id}`);
        if (valSkill) valSkill.innerText = `${s.value}%`;
        if (fillSkill) {
            fillSkill.style.width = `${s.value}%`;
            fillSkill.className = `hud-skill-bar-fill ${getBarColorClass(s.value)}`;
        }
    });
}

// ==========================================================================
// MECÁNICAS DE DESAFÍO Y MÓDULO P.A.R.A.
// ==========================================================================

function startChallenge(challengeIndex) {
    if (gameState.completedDoors.includes(challengeIndex)) {
        alert("Ya has completado este desafío.");
        return;
    }
    
    gameState.activeChallengeIndex = challengeIndex;
    const chal = challenges[challengeIndex];
    
    // Cargar textos
    document.getElementById('challenge-title-text').innerText = chal.title;
    document.getElementById('scenario-context-text').innerText = `Entorno: ${chal.context}`;
    document.getElementById('digital-message-container').innerHTML = chal.messageHtml;
    
    const placeholders = document.querySelectorAll('.player-mail-placeholder');
    placeholders.forEach(el => {
        el.innerText = `${gameState.playerName.toLowerCase()}@empresa.com`;
    });
    
    // Calcular tiempo dinámico según Reactividad
    // Si la reactividad es 100%, se reduce el tiempo inicial en 15 segundos.
    let timeReduction = Math.floor((gameState.reactividad / 100) * 15);
    let calculatedTime = Math.max(10, chal.initialTime - timeReduction);
    
    // Reset del estado del reto
    activeChallengeState.timeLeft = calculatedTime;
    activeChallengeState.startTime = Date.now();
    activeChallengeState.paused = false;
    activeChallengeState.analyzed = false;
    activeChallengeState.reviewed = false;
    activeChallengeState.pUsed = false;
    activeChallengeState.aUsed = false;
    activeChallengeState.rUsed = false;
    activeChallengeState.isComplete = false;
    
    document.getElementById('challenge-feedback-box').style.display = 'none';
    
    document.querySelectorAll('.para-btn').forEach(btn => {
        btn.classList.remove('disabled');
    });
    
    document.getElementById('challenge-timer-value').innerText = `${activeChallengeState.timeLeft}s`;
    
    // Si hay alerta de reactividad, el temporizador empieza en rojo de inmediato
    if (gameState.reactividad > 70) {
        document.getElementById('challenge-timer-area').style.color = 'var(--zelda-red-light)';
    } else {
        document.getElementById('challenge-timer-area').style.color = '#fff';
    }
    
    clearInterval(activeChallengeState.timerInterval);
    activeChallengeState.timerInterval = setInterval(() => {
        if (!activeChallengeState.paused) {
            activeChallengeState.timeLeft--;
            document.getElementById('challenge-timer-value').innerText = `${activeChallengeState.timeLeft}s`;
            
            if (activeChallengeState.timeLeft <= 0) {
                clearInterval(activeChallengeState.timerInterval);
                timeOutFailure();
            }
        }
    }, 1000);
    
    changeScreen('view-challenge');
}

function timeOutFailure() {
    const chal = challenges[gameState.activeChallengeIndex];
    
    // Penalizaciones
    gameState.reactividad = Math.min(100, gameState.reactividad + 20);
    gameState.seguridad = Math.max(0, gameState.seguridad - 20);
    
    gameState.vulnerabilities[chal.doorTarget] = Math.min(100, gameState.vulnerabilities[chal.doorTarget] + 25);
    gameState.vulnerabilities[chal.secondaryDoor] = Math.min(100, gameState.vulnerabilities[chal.secondaryDoor] + 20);
    
    updateHud();
    
    showForensicModal(
        "¡TIEMPO AGOTADO! Intrusión de Urgencia",
        "vulnerable",
        `Te paralizaste ante la presión del tiempo. En ciberseguridad, retrasar la toma de decisiones críticas sin realizar una verificación permite que los ataques automáticos de IA tomen el control.`,
        "Según el Documento Maestro 4S, los atacantes inyectan pretextos vinculados a fechas límites reales (OSINT) para forzar decisiones en el menor tiempo posible.",
        `Seguridad (Vida): -20% | Reactividad: +20%`
    );
}

// Comando P: PAUSA
function triggerPausa() {
    if (activeChallengeState.isComplete || activeChallengeState.paused) return;
    
    activeChallengeState.paused = true;
    activeChallengeState.pUsed = true;
    gameState.paraMetrics.pausaCount++;
    
    document.getElementById('challenge-timer-value').innerText = "PAUSADO";
    document.getElementById('challenge-timer-area').style.color = 'var(--zelda-blue-light)';
    document.querySelector('.btn-p').classList.add('disabled');
    
    const chal = challenges[gameState.activeChallengeIndex];
    showFeedbackBubble("PAUSA ACTIVADA 🧘", chal.pausaText);
    
    gameState.vulnerabilities[chal.doorTarget] = Math.max(0, gameState.vulnerabilities[chal.doorTarget] - 5);
}

// Comando A: ANALIZA
function triggerAnaliza() {
    if (activeChallengeState.isComplete) return;
    
    activeChallengeState.analyzed = true;
    activeChallengeState.aUsed = true;
    gameState.paraMetrics.analizaCount++;
    document.querySelector('.btn-a').classList.add('disabled');
    
    const chal = challenges[gameState.activeChallengeIndex];
    showFeedbackBubble("ANÁLISIS DE ANOMALÍAS 🔍", chal.analizaText);
    
    const hotspot = document.getElementById('challenge-hotspot-link') || 
                    document.getElementById('challenge-sms-link') || 
                    document.getElementById('challenge-sso-link') ||
                    document.getElementById('enigma-p2');
    if (hotspot) {
        hotspot.classList.add('analyzed-hotspot');
    }
    
    gameState.vulnerabilities[chal.doorTarget] = Math.max(0, gameState.vulnerabilities[chal.doorTarget] - 5);
}

// Comando R: REVISA
function triggerRevisa() {
    if (activeChallengeState.isComplete) return;
    
    activeChallengeState.reviewed = true;
    activeChallengeState.rUsed = true;
    gameState.paraMetrics.revisaCount++;
    document.querySelector('.btn-r').classList.add('disabled');
    
    const chal = challenges[gameState.activeChallengeIndex];
    showFeedbackBubble("RECONFIRMACIÓN FUERA DE BANDA 📡", chal.revisaText);
    
    gameState.vulnerabilities[chal.doorTarget] = Math.max(0, gameState.vulnerabilities[chal.doorTarget] - 5);
}

// Comando A: ACTÚA
function triggerActua() {
    if (activeChallengeState.isComplete) return;
    
    const chal = challenges[gameState.activeChallengeIndex];
    const container = document.getElementById('act-choices-container');
    container.innerHTML = '';
    
    chal.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'act-choice-btn';
        btn.innerText = `${index + 1}. ${choice.text}`;
        btn.onclick = () => selectActOption(choice);
        container.appendChild(btn);
    });
    
    document.getElementById('act-menu').style.display = 'flex';
}

function hideActMenu() {
    document.getElementById('act-menu').style.display = 'none';
}

function showFeedbackBubble(title, text) {
    const bubble = document.getElementById('challenge-feedback-box');
    bubble.querySelector('.bubble-speaker').innerText = title;
    bubble.querySelector('.bubble-text').innerText = text;
    bubble.style.display = 'block';
}

// LÓGICA DE ACTUALIZACIÓN DE HABILIDADES Y SEGURIDAD AL ACTUAR
function selectActOption(choice) {
    hideActMenu();
    activeChallengeState.isComplete = true;
    clearInterval(activeChallengeState.timerInterval);
    
    const chal = challenges[gameState.activeChallengeIndex];
    gameState.paraMetrics.actuaTotal++;
    
    const elapsed = (Date.now() - activeChallengeState.startTime) / 1000;
    const usedPar = activeChallengeState.pUsed || activeChallengeState.aUsed || activeChallengeState.rUsed;
    
    let outcomeType = choice.outcome; // "safe", "passive", "vulnerable"
    let headerTitle = "";
    
    let seguridadChangeText = "";
    let reactividadChangeText = "";
    
    // A. Actualizar Habilidades P.A.R.A.
    if (outcomeType === "safe") {
        if (activeChallengeState.pUsed) gameState.skills.p = Math.min(100, gameState.skills.p + 15);
        if (activeChallengeState.aUsed) gameState.skills.a = Math.min(100, gameState.skills.a + 15);
        if (activeChallengeState.rUsed) gameState.skills.r = Math.min(100, gameState.skills.r + 15);
        gameState.skills.a2 = Math.min(100, gameState.skills.a2 + 15);
    } else if (outcomeType === "vulnerable") {
        if (activeChallengeState.pUsed) gameState.skills.p = Math.max(0, gameState.skills.p - 10);
        if (activeChallengeState.aUsed) gameState.skills.a = Math.max(0, gameState.skills.a - 10);
        if (activeChallengeState.rUsed) gameState.skills.r = Math.max(0, gameState.skills.r - 10);
        gameState.skills.a2 = Math.max(0, gameState.skills.a2 - 10);
    }
    
    // B. Actualizar Seguridad (Vida)
    if (outcomeType === "safe") {
        gameState.paraMetrics.actuaCorrect++;
        headerTitle = "🛡️ ¡COMPORTAMIENTO SEGURO! Llave Obtenida";
        
        let recovery = usedPar ? 15 : 5;
        gameState.seguridad = Math.min(100, gameState.seguridad + recovery);
        seguridadChangeText = `+${recovery}% Seguridad`;
        
        // Reducir vulnerabilidad de la puerta
        gameState.vulnerabilities[chal.doorTarget] = Math.max(0, gameState.vulnerabilities[chal.doorTarget] - 25);
        gameState.vulnerabilities[chal.secondaryDoor] = Math.max(0, gameState.vulnerabilities[chal.secondaryDoor] - 15);
        
        // Agregar llave
        if (!gameState.completedDoors.includes(gameState.activeChallengeIndex)) {
            gameState.completedDoors.push(gameState.activeChallengeIndex);
        }
    } 
    else if (outcomeType === "passive") {
        headerTitle = "⚖️ ACCIÓN NEUTRAL (Llave no obtenida)";
        gameState.seguridad = Math.min(100, gameState.seguridad + 2);
        seguridadChangeText = "+2% Seguridad (Ignoró el riesgo)";
        
        gameState.vulnerabilities[chal.doorTarget] = Math.min(100, gameState.vulnerabilities[chal.doorTarget] + 5);
    } 
    else {
        // Vulnerable (intrusión)
        headerTitle = "💥 INTRUSIÓN DETECTADA (Llave no obtenida)";
        
        let damage = usedPar ? 10 : 25;
        // Amplificación de daño si hay alta reactividad
        if (gameState.reactividad > 70) {
            damage = Math.round(damage * 1.5);
            seguridadChangeText = `-${damage}% Seguridad (¡Daño amplificado por Sobrecarga!)`;
        } else {
            seguridadChangeText = `-${damage}% Seguridad`;
        }
        
        gameState.seguridad = Math.max(0, gameState.seguridad - damage);
        
        // Aumentar vulnerabilidad de la puerta
        gameState.vulnerabilities[chal.doorTarget] = Math.min(100, gameState.vulnerabilities[chal.doorTarget] + 30);
        gameState.vulnerabilities[chal.secondaryDoor] = Math.min(100, gameState.vulnerabilities[chal.secondaryDoor] + 20);
    }
    
    // C. Actualizar Reactividad (Tensión)
    let reactChange = 0;
    
    // Respuesta súper rápida (< 10s) sin verificar = penaliza
    if (elapsed < 10 && !usedPar) {
        reactChange += 20;
    }
    // Cada mitigación usada reduce reactividad
    if (activeChallengeState.pUsed) reactChange -= 5;
    if (activeChallengeState.aUsed) reactChange -= 5;
    if (activeChallengeState.rUsed) reactChange -= 5;
    
    // Resultado de la acción
    if (outcomeType === "safe") reactChange -= 10;
    if (outcomeType === "vulnerable") reactChange += 15;
    
    // Aplicar cambio en reactividad
    if (reactChange > 0) {
        gameState.reactividad = Math.min(100, gameState.reactividad + reactChange);
        reactividadChangeText = `+${reactChange}% Reactividad`;
    } else {
        gameState.reactividad = Math.max(0, gameState.reactividad + reactChange);
        reactividadChangeText = `${reactChange}% Reactividad`;
    }
    
    // Forzar actualización del HUD lateral inmediatamente
    updateHud();
    
    const currentScore = gameState.vulnerabilities[chal.doorTarget];
    let keyStatusText = `${chal.doorTarget}: Vulnerabilidad del ${currentScore}%`;
    if (outcomeType === "safe") keyStatusText += " (Asegurada)";
    
    showForensicModal(
        headerTitle,
        outcomeType,
        choice.forensic,
        choice.citation,
        `${seguridadChangeText} | ${reactividadChangeText} | ${keyStatusText}`
    );
}

function showForensicModal(title, outcome, desc, research, keyStatus) {
    const modal = document.getElementById('forensic-modal');
    document.getElementById('forensic-title').innerText = title;
    
    const badge = document.getElementById('forensic-outcome');
    badge.innerText = outcome.toUpperCase();
    badge.className = `forensic-outcome-badge ${outcome}`;
    
    document.getElementById('forensic-description').innerText = desc;
    document.getElementById('forensic-research-citation').innerText = research;
    document.getElementById('forensic-key-status').innerText = keyStatus;
    
    modal.style.display = 'flex';
}

function closeForensicModal() {
    document.getElementById('forensic-modal').style.display = 'none';
    changeScreen('view-hub');
}

// ==========================================================================
// RENDERIZAR ESPEJOS (RESULTADOS & DIAGNÓSTICO FINAL)
// ==========================================================================

function showMirrorTab(tabIndex) {
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        if (idx === (tabIndex - 1)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    document.querySelectorAll('.mirror-tab-pane').forEach((pane, idx) => {
        if (idx === (tabIndex - 1)) pane.classList.add('active');
        else pane.classList.remove('active');
    });
}

function renderMirrors() {
    generateMirror2Narrative();
    generateMirror3Radar();
}

function generateMirror2Narrative() {
    const container = document.getElementById('mirror-2-narrative');
    container.innerHTML = "Inicializando análisis del Yo Digital...<br>";
    
    const pVal = gameState.skills.p;
    const aVal = gameState.skills.a;
    const rVal = gameState.skills.r;
    const actCorrect = gameState.paraMetrics.actuaCorrect;
    
    let profileName = "ANALISTA INDEFINIDO";
    let profileDesc = "";
    
    if (gameState.seguridad >= 80 && actCorrect >= 4) {
        profileName = "ESCUDO DIGITAL RESILIENTE";
        profileDesc = "Demuestras un alto nivel de escepticismo saludable. Sabes pausar en situaciones de estrés y usar fricción deliberada para identificar las anomalías de ingeniería social, frustrando las tácticas más sutiles potenciadas por IA.";
    } else if (pVal >= 60 && aVal >= 60) {
        profileName = "INSPECTOR DETALLISTA";
        profileDesc = "Tu estilo decisional se basa en el detalle. Analizas los mensajes y detienes la urgencia (Pausa), pero tu tendencia a la autoconfianza evita que uses canales fuera de banda para corroborar tus hallazgos. Eres fuerte, pero vulnerable a identidades clonadas.";
    } else if (rVal >= 60) {
        profileName = "COLABORADOR VERIFICADOR";
        profileDesc = "Priorizas la reconfirmación cruzada. Prefieres buscar apoyo externo y consultar otros canales. Sin embargo, si el atacante te bloquea el acceso a otros canales o finge no estar disponible, puedes apresurar tu acción por tu deseo de ayudar.";
    } else if (gameState.seguridad <= 40) {
        profileName = "OPERADOR IMPULSIVO";
        profileDesc = "Tu Yo Digital está sumamente expuesto. Actúas bajo impulsos y hábitos automatizados (Conveniencia/Rutina). Priorizas la velocidad del trabajo sobre las directrices de seguridad, facilitando que ataques automatizados de IA suplanten tu entorno e invadan tus redes.";
    } else {
        profileName = "GUARDIÁN DE COMPORTAMIENTO MEDIO";
        profileDesc = "Tienes noción de las trampas digitales, pero tu comportamiento es inconsistente. A veces analizas las señales y a veces actúas por rutina. Necesitas consolidar el hábito P.A.R.A. como un escudo sistemático diario.";
    }
    
    let text = `
        <span style="color:#00e5ff;">&gt; ANÁLISIS DE COMPORTAMIENTO COMPLETADO</span><br>
        <span style="color:#ffd74a;">&gt; PERFIL DECISIONAL: ${profileName}</span><br><br>
        <strong>INFORME DE CONDUCTA:</strong><br>
        ${profileDesc}<br><br>
        <strong>MÉTRICAS DE ATENCIÓN:</strong><br>
        - Autocontrol Emocional (Pausa): ${pVal >= 60 ? 'ALTO' : 'MEJORABLE'} (${pVal}%)<br>
        - Inspección Crítica (Analiza): ${aVal >= 60 ? 'ALTA' : 'MEJORABLE'} (${aVal}%)<br>
        - Verificación de Canal (Revisa): ${rVal >= 60 ? 'ALTA' : 'MEJORABLE'} (${rVal}%)<br><br>
        <span style="color:#ef5350;">&gt; IMPRESIÓN GENERAL:</span><br>
        Tu yo digital es vulnerable principalmente en momentos de multitarea y cansancio. Los atacantes que usan IA generativa explotan precisamente tus rasgos de ${gameState.playerRole === 'finanzas' ? 'Responsabilidad en pagos' : 'cooperación laboral'} para lograr la intrusión en menos de 2 minutos.
    `;
    
    container.innerHTML = text;
}

function generateMirror3Radar() {
    const listContainer = document.getElementById('radar-bars-list');
    listContainer.innerHTML = '';
    
    for (const [door, score] of Object.entries(gameState.vulnerabilities)) {
        const row = document.createElement('div');
        row.className = 'radar-bar-row';
        
        let colorClass = 'gold';
        if (score >= 65) {
            colorClass = 'red';
        } else if (score <= 45) {
            colorClass = 'green';
        }
        
        row.innerHTML = `
            <div class="radar-bar-meta">
                <span>${door.toUpperCase()}</span>
                <span>${score}% VULN.</span>
            </div>
            <div class="radar-bar-bg">
                <div class="radar-bar-fill ${colorClass}" style="width: ${score}%;"></div>
            </div>
        `;
        listContainer.appendChild(row);
    }
}

// Exportar reporte
function exportReport() {
    let reportText = `================================================
DIGITAL SELF: ATTENTION DOORS - REPORTE DE ESCUDO
================================================
Jugador: ${gameState.playerName}
Rol: ${gameState.playerRole.toUpperCase()}
Fecha: ${new Date().toLocaleDateString()}

PUNTAJES FINALES DEL YO DIGITAL:
- Seguridad (Vida de datos): ${gameState.seguridad}%
- Reactividad (Tensión temporal): ${gameState.reactividad}% (Un porcentaje menor es mejor)

ESTADO DE LAS PUERTAS DE ATENCIÓN (Vulnerabilidad):
`;
    
    for (const [door, score] of Object.entries(gameState.vulnerabilities)) {
        reportText += `- ${door}: ${score}% ${score >= 65 ? '[ALTA VULNERABILIDAD]' : score <= 45 ? '[BIEN DEFENDIDA]' : '[NEUTRAL]'}\n`;
    }
    
    reportText += `
MÉTRICAS DEL ESCUDO P.A.R.A.:
- Pausa (Freno de Impulso): ${gameState.skills.p}%
- Analiza (Detección de anomalías): ${gameState.skills.a}%
- Revisa (Verificación fuera de banda): ${gameState.skills.r}%
- Actúa (Decisiones Seguras): ${gameState.skills.a2}%

================================================
Tu Yo Digital ha sido concientizado. Protege tu atención.
================================================`;
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Escudo_Digital_${gameState.playerName}.txt`;
    link.click();
}

// Resetear juego
function resetGame() {
    gameState.completedDoors = [];
    gameState.activeChallengeIndex = null;
    
    // Inicializar HUD de vuelta a default
    gameState.seguridad = 80;
    gameState.reactividad = 20;
    gameState.skills = { p: 50, a: 50, r: 50, a2: 50 };
    
    gameState.paraMetrics = {
        pausaCount: 0,
        analizaCount: 0,
        revisaCount: 0,
        actuaTotal: 0,
        actuaCorrect: 0
    };
    gameState.vulnerabilities = {
        'Curiosidad': 50,
        'Justicia': 50,
        'Pérdida': 50,
        'Responsabilidad': 50,
        'Conveniencia': 50,
        'Identidad': 50,
        'Coherencia': 50,
        'Pertenencia': 50,
        'Protección': 50
    };
    
    changeScreen('view-onboarding');
    updateAvatarPreview();
    updateHud();
}

// Controles de TV
function tvDialClick(type) {
    console.log(`Perilla de TV girada: ${type}`);
    const knobs = document.querySelectorAll('.tv-dial-knob');
    const knob = type === 'channel' ? knobs[0] : knobs[1];
    
    if (knob) {
        const marker = knob.querySelector('.dial-marker');
        let currentRotation = marker.style.transform ? parseInt(marker.style.transform.replace(/[^0-9-]/g, '')) : 0;
        let newRotation = (currentRotation + 30) % 360;
        marker.style.transform = `translateX(-50%) rotate(${newRotation}deg)`;
    }
}

function toggleTvPower() {
    const led = document.getElementById('tv-power-led');
    const screen = document.getElementById('screen-container');
    
    if (led.style.backgroundColor === 'rgb(0, 0, 0)' || led.style.backgroundColor === 'black') {
        led.style.backgroundColor = '#33ff33';
        led.style.boxShadow = '0 0 8px #33ff33, 0 0 12px #33ff33';
        screen.style.opacity = '1';
        screen.style.filter = 'none';
    } else {
        led.style.backgroundColor = 'black';
        led.style.boxShadow = 'none';
        screen.style.opacity = '0.05';
        screen.style.filter = 'brightness(0.1) contrast(1.5)';
    }
}
