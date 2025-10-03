require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Configura la API de Google Gemini con tu clave secreta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Carga el corpus de datos al iniciar el servidor
const corpus = fs.readFileSync(path.join(__dirname, 'data', 'corpus.txt'), 'utf8');

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la comunicación con la IA
app.post('/ask-incluia', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'El prompt es requerido.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Crea una instrucción de sistema para guiar a la IA usando el corpus
        const systemPrompt = `
        Eres un asistente virtual llamado IncluIA, diseñado para brindar información clara y accesible a personas con discapacidad visual, auditiva y motora en Perú. Tu objetivo es empoderar a los usuarios dándoles información precisa sobre temas legales, administrativos, de salud y tecnológicos.

        Utiliza la siguiente información para responder, priorizándola sobre cualquier conocimiento previo:
        ---
        ${corpus}
        ---

        Responde a las preguntas de manera empática, usando lenguaje sencillo y directo, y proporciona pasos claros y concisos. Siempre que sea posible, sugiere fuentes oficiales o recursos adicionales.
        No des diagnósticos médicos ni asesoramiento legal vinculante.
        `.trim();

        // Envía el prompt combinado a la IA
        const result = await model.generateContent(`${systemPrompt}\n\nPregunta del usuario: ${prompt}`);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error('Error al llamar a la API de Gemini:', error);
        res.status(500).json({ error: 'Hubo un error al procesar tu solicitud.' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor de IncluIA (con Gemini) escuchando en el puerto ${port}`);
});

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
    // Esta nueva línea elimina los dobles asteriscos del texto
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
    // -- Mensaje de Bienvenida al cargar la página --
    appendMessage('¡Hola! Soy IncluIA, tu asistente virtual.\n\nMi objetivo es empoderarte con datos precisos sobre:\n• Temas legales y administrativos.\n• Salud y tecnología.\n\n¿En qué puedo ayudarte hoy? ¡No dudes en preguntar!', 'ai');
});