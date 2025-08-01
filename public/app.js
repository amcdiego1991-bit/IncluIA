document.addEventListener('DOMContentLoaded', () => {
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
