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

    // Base URL para el despliegue en Render
    const baseUrl = window.location.origin;

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

            // Leer la respuesta en voz alta si el modo de escucha está activo
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
        if (recognition) {
            recognition.stop();
        } else {
            startSpeechInput();
        }
    }

    function startSpeechInput() {
        // Asegurarse de que la API de reconocimiento de voz está disponible
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
            // Puedes agregar una lógica para leer la última respuesta aquí si lo deseas
        }
    }

    function speakText(text) {
        if (synthesis.speaking) {
            synthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        synthesis.speak(utterance);
    }

    // -- Funciones de Accesibilidad Visual --
    function toggleHighContrast() {
        body.classList.toggle('high-contrast');
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
});document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages');
    const baseUrl = window.location.origin; // Obtiene la URL base de tu sitio

    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        // Muestra el mensaje del usuario en el chat
        appendMessage(prompt, 'user');
        promptInput.value = '';

        // Muestra un mensaje de "escribiendo" de la IA
        const typingMessage = appendMessage('...', 'ai');

        try {
            // Envía la solicitud al servidor de Render
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

            // Reemplaza el mensaje de "escribiendo" con la respuesta de la IA
            typingMessage.textContent = data.response;

        } catch (error) {
            console.error('Error:', error);
            typingMessage.textContent = 'Lo siento, hubo un error al obtener la respuesta.';
            typingMessage.classList.add('error');
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return messageElement;
    }
});
