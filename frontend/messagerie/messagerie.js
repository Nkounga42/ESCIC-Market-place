// Connexion à Socket.IO
const socket = io('http://localhost:3000');

// Fonction pour connecter l'utilisateur
function connectUser(userId) {
    socket.emit('authenticate', userId);
}

// Écouteur pour l'envoi de message
document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const destinataireId = getCurrentChatUser(); // Fonction à implémenter pour obtenir l'ID du destinataire
    
    if (messageInput.value.trim()) {
        socket.emit('send_message', {
            destinataire_id: destinataireId,
            contenu: messageInput.value,
            sujet: 'Message direct'
        });
        messageInput.value = '';
    }
});

// Réception des messages
socket.on('receive_message', (message) => {
    addMessageToChat(message);
    // Notification si nécessaire
    if (document.hidden) {
        notifyNewMessage(message);
    }
});

// Confirmation d'envoi
socket.on('message_sent', (message) => {
    addMessageToChat(message);
});

// Fonction pour ajouter un message au chat
function addMessageToChat(message) {
    const messagesContainer = document.getElementById('messages-container');
    const isSelf = message.expediteur_id === getCurrentUserId(); // Fonction à implémenter
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isSelf ? 'justify-end' : ''} mb-4`;
    
    messageDiv.innerHTML = `
        ${!isSelf ? `
            <div class="flex-shrink-0 mr-3">
                <img class="h-8 w-8 rounded-full" src="https://randomuser.me/api/portraits/${isSelf ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg" alt="">
            </div>
        ` : ''}
        <div class="${isSelf ? 'message-self' : 'message-other'} px-4 py-2 max-w-xs md:max-w-md">
            <p>${escapeHtml(message.contenu)}</p>
            <p class="text-xs ${isSelf ? 'text-gray-300' : 'text-gray-500'} mt-1">
                ${formatDate(message.date_envoi)}
            </p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fonction utilitaire pour échapper le HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Fonction pour formater la date
function formatDate(date) {
    return new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction pour notifier un nouveau message
function notifyNewMessage(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nouveau message', {
            body: message.contenu,
            icon: '/path/to/icon.png'
        });
    }
}

// Demander la permission pour les notifications
if ('Notification' in window) {
    Notification.requestPermission();
}