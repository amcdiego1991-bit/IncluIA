document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages');

    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        // Mostrar la pregunta del usuario
        addMessageToChat('user', prompt);
        promptInput.value = '';

        try {
            // Llamar a tu servidor backend
            const response = await fetch('http://localhost:3000/ask-incluia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (response.ok) {
                // Mostrar la respuesta de la IA
                addMessageToChat('ai', data.response);
            } else {
                addMessageToChat('error', data.error || 'Error desconocido.');
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            addMessageToChat('error', 'No se pudo conectar con el servidor. Asegúrate de que está en ejecución.');
        }
    }

    function addMessageToChat(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        // Hacer scroll para ver el último mensaje
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
