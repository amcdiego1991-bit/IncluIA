require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Configura la API de Google Gemini con tu clave secreta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para la comunicación con la IA
app.post('/ask-incluia', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'El prompt es requerido.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        // Crea una instrucción de sistema para guiar a la IA
        const systemPrompt = `
        Eres un asistente virtual llamado IncluIA, diseñado para brindar información clara y accesible a personas con discapacidad visual, auditiva y motora en Perú. Tu objetivo es empoderar a los usuarios dándoles información precisa sobre temas legales, administrativos, de salud y tecnológicos.
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
