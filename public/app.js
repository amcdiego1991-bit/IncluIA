document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages');
    const speakButton = document.getElementById('speak-button');
    const listenButton = document.getElementById('listen-button');
    const contrastButton = document.getElementById('contrast-button');
    const fontSizeSelect = document.getElementById('font-size-select');
    const body = document.body;

    let recognition;
    let synthesis = window.speechSynthesis;
    let isSpeaking = false;
    let isHighContrast = false;
    let voicesLoaded = false;
    let spanishVoice = null;

    // Base URL para el despliegue en Render
    const baseUrl = window.location.origin;

    // -- Cargar voces de síntesis --
    function loadVoices() {
        if (voicesLoaded) return;
        const voices = synthesis.getVoices();
        spanishVoice = voices.find(voice => voice.lang.startsWith('es') && (voice.name.includes('Google') || voice.name.includes('Luciana')));
        if (spanishVoice) {
            console.log(`Voz en español seleccionada: ${spanishVoice.name}`);
        } else {
            console.log('No se encontró una voz en español más natural, usando la predeterminada.');
        }
        voicesLoaded = true;
    }

    synthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Llama a la función si las voces ya están cargadas

    // -- Event Listeners --
    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Controles de accesibilidad
    speakButton.addEventListener('click', toggleSpeechInput);
    listenButton.addEventListener('click', toggleSpeechOutput);
    contrastButton.addEventListener('click', toggleHighContrast);
    fontSizeSelect.addEventListener('change', changeFontSize);

    // -- Funciones de Chat --
    async function sendMessage() {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        appendMessage(prompt, 'user');
        promptInput.value = '';

        const typingMessage = appendMessage('...', 'ai');

        try {
            const response = await fetch(`${baseUrl}/ask-incluia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error('Error al conectar con el servidor.');
            }

            const data = await response.json();

            typingMessage.textContent = data.response;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            if (listenButton.textContent === 'Detener Escucha') {
                speakText(data.response);
            }

        } catch (error) {
            console.error('Error:', error);
            typingMessage.textContent = 'Lo siento, hubo un error al obtener la respuesta.';
            typingMessage.classList.add('error');
        }
    }

    function appendMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return messageElement;
    }

    // -- Funciones de Voz --
    function toggleSpeechInput() {
        if (recognition && recognition.start) {
            recognition.stop();
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Lo siento, tu navegador no soporta el reconocimiento de voz.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();
        speakButton.textContent = 'Hablando...';
        speakButton.disabled = true;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptInput.value = transcript;
            sendMessage();
        };

        recognition.onend = () => {
            speakButton.textContent = 'Hablar';
            speakButton.disabled = false;
            recognition = null;
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            speakButton.textContent = 'Hablar';
            speakButton.disabled = false;
            recognition = null;
        };
    }

    function toggleSpeechOutput() {
        if (synthesis.speaking) {
            synthesis.cancel();
            listenButton.textContent = 'Escuchar Respuesta';
        } else {
            listenButton.textContent = 'Detener Escucha';
        }
    }

    function speakText(text) {
        if (synthesis.speaking) {
            synthesis.cancel();
        }
        // Esta línea es para limpiar el texto de asteriscos (opcional pero ayuda a la voz)
        const cleanedText = text.replace(/\*\*/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'es-ES';
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        synthesis.speak(utterance);
    }

    // -- Funciones de Accesibilidad Visual --
    function toggleHighContrast() {
        isHighContrast = !isHighContrast;
        if (isHighContrast) {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }
    }

    function changeFontSize() {
        const size = fontSizeSelect.value;
        const messages = messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.style.fontSize = getFontSize(size);
        });
        body.style.fontSize = getFontSize(size);
    }

    function getFontSize(size) {
        switch (size) {
            case 'small':
                return '0.8em';
            case 'medium':
                return '1em';
            case 'large':
                return '1.2em';
            default:
                return '1em';
        }
    }
    // -- Mensaje de Bienvenida Original (Estable) --
    appendMessage('¡Hola! Soy IncluIA, tu asistente virtual. Estoy aquí para brindarte información clara y accesible sobre temas legales, administrativos y de derechos en Perú, especialmente para personas con discapacidad visual, auditiva y motora. Mi objetivo es empoderarte dándote datos precisos para que puedas ejercer tus derechos y tomar decisiones informadas. ¿En qué puedo ayudarte hoy? ¡No dudes en preguntar!', 'ai');

});