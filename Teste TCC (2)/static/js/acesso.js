let chatHistories = {1: ''};  // Object to store chat histories with topic IDs as keys
let currentChatId = 1;  // Start with the first chat
let chatCounter = 1;  // Initialize chat counter to 1
const socket = io();  // Conexão WebSocket

window.onload = function() {
    addRecentTopic(`Tópico ${chatCounter}`, chatCounter);  // Add the first topic on page load
    loadChat(currentChatId);  // Load the first chat

    // Script to hide the footer message after 5 seconds
    setTimeout(function() {
        document.getElementById('footer-message').style.display = 'none';
    }, 5000);
};

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message === '') return;

    const chatMessages = document.getElementById('chat-messages');

    // Exibe a mensagem do usuário
    const userMessageContainer = document.createElement('div');
    userMessageContainer.classList.add('user-message');
    userMessageContainer.innerText = message;
    chatMessages.appendChild(userMessageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    input.value = '';

    // Envia a mensagem ao backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: message }),
    })
    .then(response => response.json())
    .then(data => {
        // Exibe a resposta do bot com efeito de digitação
        const botMessageContainer = document.createElement('div');
        botMessageContainer.classList.add('bot-message');
        chatMessages.appendChild(botMessageContainer);

        // Função para simular o efeito de digitação
        typeWriterEffect(botMessageContainer, data.resposta);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(error => {
        console.error('Erro:', error);

        // Exibe uma mensagem de erro caso o backend falhe
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('bot-message');
        errorContainer.innerText = 'Ocorreu um erro. Tente novamente mais tarde.';
        chatMessages.appendChild(errorContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Função para simular o efeito de digitação
function typeWriterEffect(element, text, i = 0) {
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(() => typeWriterEffect(element, text, i), 50); // Ajuste a velocidade aqui
    }
}



function createNewChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages.innerHTML.trim() !== '') {
        chatHistories[currentChatId] = chatMessages.innerHTML;
    }
    chatCounter++;
    currentChatId = chatCounter;
    addRecentTopic(`Tópico ${chatCounter}`, chatCounter);
    chatMessages.innerHTML = '';
}

function addRecentTopic(title, id) {
    const recentTopics = document.getElementById('recent-topics');
    const topicItem = document.createElement('li');
    topicItem.innerText = title;
    topicItem.onclick = () => loadChat(id);
    topicItem.dataset.id = id;  // Add data attribute to store the ID
    recentTopics.appendChild(topicItem);
}

function loadChat(id) {
    currentChatId = id;
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = chatHistories[id] || '';
}

// JavaScript para abrir e fechar a sidebar
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("main-content");
    const chatContainer = document.getElementById("chatbot-container");
    const sidebarIcon = document.getElementById("sidebar-icon");

    sidebar.classList.toggle('active');
    mainContent.classList.toggle('sidebar-open');
    chatContainer.classList.toggle('sidebar-open');

    // Toggle sidebar icon
    if (sidebar.classList.contains('active')) {
        sidebarIcon.src = "/static/img/sidebarFechada.png";
        sidebarIcon.alt = "Fechar Menu";
    } else {
        sidebarIcon.src = "/static/img/sidebarAberta.png";
        sidebarIcon.alt = "Abrir Menu";
    }
}
