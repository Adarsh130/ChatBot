class ChatApp {
    constructor() {
        this.currentChatId = null;
        this.chats = [];
        this.isTyping = false;
        this.authToken = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.isLoginMode = true;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        // Set API base URL based on environment
        this.apiBaseUrl = this.getApiBaseUrl();
        
        this.initializeElements();
        this.bindEvents();
        this.setupTextareaAutoResize();
        this.setupMarked();
        
        // Check authentication status
        this.checkAuthStatus();
    }

    getApiBaseUrl() {
        // In production (on Render), use relative URLs
        // In development, use localhost:5000
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        } else {
            // Production - use relative URLs (same domain)
            return '';
        }
    }

    initializeElements() {
        // Auth elements
        this.authModal = document.getElementById('authModal');
        this.appContainer = document.getElementById('appContainer');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.authTitle = document.getElementById('authTitle');
        this.authSubtitle = document.getElementById('authSubtitle');
        this.authToggleBtn = document.getElementById('authToggleBtn');
        this.authToggleText = document.getElementById('authToggleText');
        this.loginError = document.getElementById('loginError');
        this.registerError = document.getElementById('registerError');
        
        // App elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHistory = document.getElementById('chatHistory');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.userName = document.getElementById('userName');
        this.userStats = document.getElementById('userStats');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.headerLogoutBtn = document.getElementById('headerLogoutBtn');
    }

    setupMarked() {
        // Configure marked for better markdown rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (typeof Prism !== 'undefined' && Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
        }
    }

    bindEvents() {
        // Auth events
        this.authToggleBtn.addEventListener('click', () => this.toggleAuthMode());
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.headerLogoutBtn.addEventListener('click', () => this.handleLogout());
        
        // App events
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.clearBtn.addEventListener('click', () => this.clearCurrentChat());
        
        // Enter key to send
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Input validation
        this.messageInput.addEventListener('input', () => this.validateInput());
        
        // Example prompts
        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.validateInput();
                this.sendMessage();
            });
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                this.sidebar.classList.contains('open') && 
                !this.sidebar.contains(e.target) && 
                !this.sidebarToggle.contains(e.target)) {
                this.closeSidebar();
            }
        });
        
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncChatsWithServer();
            this.showToast('Back online - syncing chats...');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('You are offline - chats will sync when reconnected');
        });
    }

    async checkAuthStatus() {
        if (this.authToken && this.currentUser) {
            try {
                // Verify token with backend
                const response = await fetch(`${this.apiBaseUrl}/api/user`, {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    this.showApp();
                    this.updateUserInfo();
                    await this.loadChatsFromServer();
                } else {
                    this.handleLogout();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                this.handleLogout();
            }
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        this.authModal.style.display = 'flex';
        this.appContainer.style.display = 'none';
        this.createParticleEffect();
    }

    createParticleEffect() {
        // Create subtle floating particles in the background
        const particleContainer = document.createElement('div');
        particleContainer.className = 'auth-particles';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: linear-gradient(45deg, #7c3aed, #3b82f6);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.3 + 0.1};
                animation: float ${Math.random() * 10 + 10}s infinite linear;
            `;
            particleContainer.appendChild(particle);
        }
        
        this.authModal.appendChild(particleContainer);
        
        // Add CSS animation for particles
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes float {
                    0% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.3;
                    }
                    90% {
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showApp() {
        this.authModal.style.display = 'none';
        this.appContainer.style.display = 'flex';
        this.cleanupParticles();
    }

    cleanupParticles() {
        const particles = this.authModal.querySelector('.auth-particles');
        if (particles) {
            particles.remove();
        }
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        
        if (this.isLoginMode) {
            this.authTitle.textContent = 'Welcome back';
            this.authSubtitle.textContent = 'Sign in to continue chatting';
            this.loginForm.style.display = 'block';
            this.registerForm.style.display = 'none';
            this.authToggleText.textContent = "Don't have an account?";
            this.authToggleBtn.textContent = 'Sign up';
        } else {
            this.authTitle.textContent = 'Create your account';
            this.authSubtitle.textContent = 'Join AlphaX to start chatting with AI';
            this.loginForm.style.display = 'none';
            this.registerForm.style.display = 'block';
            this.authToggleText.textContent = 'Already have an account?';
            this.authToggleBtn.textContent = 'Sign in';
        }
        
        // Clear errors
        this.loginError.textContent = '';
        this.registerError.textContent = '';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        
        if (!email || !password) {
            this.showFormError('loginError', 'Please fill in all fields');
            this.highlightEmptyFields([email ? null : 'loginEmail', password ? null : 'loginPassword'].filter(Boolean));
            return;
        }
        
        loginBtn.disabled = true;
        this.loginError.textContent = '';
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showApp();
                this.updateUserInfo();
                await this.loadChatsFromServer();
                this.showToast('Welcome back!');
            } else {
                this.loginError.textContent = data.error || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.loginError.textContent = 'Connection error. Please try again.';
        }
        
        loginBtn.disabled = false;
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const registerBtn = document.getElementById('registerBtn');
        
        if (!name || !email || !password) {
            this.showFormError('registerError', 'Please fill in all fields');
            this.highlightEmptyFields([name ? null : 'registerName', email ? null : 'registerEmail', password ? null : 'registerPassword'].filter(Boolean));
            return;
        }
        
        if (password.length < 6) {
            this.showFormError('registerError', 'Password must be at least 6 characters');
            this.highlightEmptyFields(['registerPassword']);
            return;
        }
        
        registerBtn.disabled = true;
        this.registerError.textContent = '';
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showApp();
                this.updateUserInfo();
                await this.loadChatsFromServer();
                this.showToast('Account created successfully!');
            } else {
                this.registerError.textContent = data.error || 'Registration failed';
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.registerError.textContent = 'Connection error. Please try again.';
        }
        
        registerBtn.disabled = false;
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.authToken = null;
            this.currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            // Don't clear chats - they're on the server
            
            this.chats = [];
            this.currentChatId = null;
            this.clearMessages();
            this.showWelcomeScreen();
            this.updateChatHistory();
            this.showAuth();
            
            // Reset forms
            this.loginForm.reset();
            this.registerForm.reset();
            this.loginError.textContent = '';
            this.registerError.textContent = '';
            
            this.showToast('Logged out successfully');
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            this.userName.textContent = this.currentUser.name;
            const chatCount = this.currentUser.chat_count || 0;
            this.userStats.textContent = `${chatCount} chat${chatCount !== 1 ? 's' : ''}`;
        }
    }

    setupTextareaAutoResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
    }

    validateInput() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasText || this.isTyping;
    }

    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.hideWelcomeScreen();
        this.clearMessages();
        this.updateChatHistory();
        this.closeSidebar();
        this.messageInput.focus();
    }

    generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hideWelcomeScreen() {
        this.welcomeScreen.style.display = 'none';
        this.messagesContainer.style.display = 'block';
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.messagesContainer.style.display = 'none';
    }

    clearMessages() {
        this.messagesContainer.innerHTML = '';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping || !this.authToken) return;

        // If no current chat, start a new one
        if (!this.currentChatId) {
            this.startNewChat();
        }

        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.validateInput();

        // Show typing indicator
        this.showTypingIndicator();
        this.isTyping = true;

        try {
            // Get conversation history for context
            const conversationHistory = this.getConversationHistory();
            
            // Send to backend with auth token
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ 
                    prompt: message,
                    messages: conversationHistory
                })
            });

            if (response.status === 401) {
                // Token expired or invalid
                this.handleLogout();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add assistant response with streaming effect
            await this.addStreamingMessage(data.response, 'assistant');
            
            // Update user stats if provided
            if (data.user_chat_count) {
                this.currentUser.chat_count = data.user_chat_count;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.updateUserInfo();
            }
            
            // Save chat to server
            await this.saveCurrentChatToServer(message, data.response);

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('I apologize, but I encountered an error while processing your request. Please try again.', 'assistant', true);
        }

        this.isTyping = false;
        this.validateInput();
    }

    addMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.textContent = 'AI';
        }
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (isError) {
            messageText.style.color = '#f85149';
        }
        
        // Format message text
        messageText.innerHTML = this.formatMessage(text);
        
        content.appendChild(messageText);
        
        // Add message actions for assistant messages
        if (sender === 'assistant' && !isError) {
            const actions = this.createMessageActions(text);
            content.appendChild(actions);
        }
        
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);
        messageDiv.appendChild(messageWrapper);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageText;
    }

    async addStreamingMessage(text, sender) {
        const messageElement = this.addMessage('', sender);
        const words = text.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            messageElement.innerHTML = this.formatMessage(currentText);
            this.scrollToBottom();
            
            // Add a small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // Final formatting
        messageElement.innerHTML = this.formatMessage(text);
    }

    createMessageActions(text) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.addEventListener('click', () => this.copyToClipboard(text));
        
        actionsDiv.appendChild(copyBtn);
        return actionsDiv;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    showFormError(errorElementId, message) {
        const errorElement = document.getElementById(errorElementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            if (errorElement.textContent === message) {
                errorElement.textContent = '';
            }
        }, 5000);
    }

    highlightEmptyFields(fieldIds) {
        // Remove previous highlights
        document.querySelectorAll('.form-group input').forEach(input => {
            input.style.borderColor = '#21262d';
            input.style.boxShadow = 'none';
        });
        
        // Highlight empty fields
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.borderColor = '#ff6b6b';
                field.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.15)';
                
                // Remove highlight when user starts typing
                field.addEventListener('input', function removeHighlight() {
                    field.style.borderColor = '#21262d';
                    field.style.boxShadow = 'none';
                    field.removeEventListener('input', removeHighlight);
                }, { once: true });
            }
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #21262d, #161b22);
            color: #f0f6fc;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #30363d;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatMessage(text) {
        // Use marked for markdown rendering if available
        if (typeof marked !== 'undefined') {
            let html = marked.parse(text);
            
            // Add copy buttons to code blocks
            html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
                const decodedCode = this.decodeHtml(code);
                return `
                    <div class="code-block-wrapper">
                        <pre><code${attrs}>${code}</code></pre>
                        <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${decodedCode.replace(/`/g, '\\`')}\`)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                `;
            });
            
            return html;
        }
        
        // Fallback formatting
        let formatted = text;
        
        // Code blocks (```code```)
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code (`code`)
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold (**text**)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic (*text*)
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-message';
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        content.appendChild(typingIndicator);
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);
        typingDiv.appendChild(messageWrapper);
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    getConversationHistory() {
        // Get current chat messages for context (last 10 messages)
        if (!this.currentChatId) return [];
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!chat || !chat.messages) return [];
        
        // Return last 10 messages for context
        return chat.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    // Server synchronization methods
    async loadChatsFromServer() {
        if (!this.authToken || !this.isOnline) {
            // Load from localStorage as fallback
            this.chats = JSON.parse(localStorage.getItem('chats')) || [];
            this.updateChatHistory();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chats`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.chats = data.chats || [];
                
                // Also save to localStorage as backup
                localStorage.setItem('chats', JSON.stringify(this.chats));
                
                this.updateChatHistory();
                console.log('✅ Chats loaded from server');
            } else if (response.status === 401) {
                this.handleLogout();
            } else {
                throw new Error('Failed to load chats');
            }
        } catch (error) {
            console.error('Error loading chats from server:', error);
            // Fallback to localStorage
            this.chats = JSON.parse(localStorage.getItem('chats')) || [];
            this.updateChatHistory();
            this.showToast('Using offline chats - will sync when online');
        }
    }

    async saveChatToServer(chatData) {
        if (!this.authToken || !this.isOnline) {
            // Save to localStorage for later sync
            this.saveToLocalStorage();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(chatData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Chat saved to server:', data.message);
                
                // Update local storage as backup
                this.saveToLocalStorage();
                
                return data.chat;
            } else if (response.status === 401) {
                this.handleLogout();
            } else {
                throw new Error('Failed to save chat');
            }
        } catch (error) {
            console.error('Error saving chat to server:', error);
            // Save to localStorage for later sync
            this.saveToLocalStorage();
            this.showToast('Chat saved offline - will sync when online');
        }
    }

    async deleteChatFromServer(chatId) {
        if (!this.authToken || !this.isOnline) {
            return false;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                console.log('✅ Chat deleted from server');
                return true;
            } else if (response.status === 401) {
                this.handleLogout();
            } else {
                throw new Error('Failed to delete chat');
            }
        } catch (error) {
            console.error('Error deleting chat from server:', error);
            this.showToast('Failed to delete chat from server');
        }
        return false;
    }

    async syncChatsWithServer() {
        if (!this.authToken || !this.isOnline || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        
        try {
            // Load latest chats from server
            await this.loadChatsFromServer();
            
            // Sync any local chats that might not be on server
            const localChats = JSON.parse(localStorage.getItem('chats')) || [];
            
            for (const localChat of localChats) {
                const serverChat = this.chats.find(c => c.id === localChat.id);
                
                // If local chat is newer or doesn't exist on server, upload it
                if (!serverChat || localChat.timestamp > serverChat.timestamp) {
                    await this.saveChatToServer(localChat);
                }
            }
            
            // Reload from server to get the final state
            await this.loadChatsFromServer();
            
            console.log('✅ Chats synchronized with server');
        } catch (error) {
            console.error('Error syncing chats:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('chats', JSON.stringify(this.chats));
    }

    async saveCurrentChatToServer(userMessage, assistantResponse) {
        let chat = this.chats.find(c => c.id === this.currentChatId);
        
        if (!chat) {
            chat = {
                id: this.currentChatId,
                title: this.generateChatTitle(userMessage),
                messages: [],
                timestamp: Date.now()
            };
            this.chats.unshift(chat);
        }
        
        chat.messages.push(
            { role: 'user', content: userMessage, timestamp: Date.now() },
            { role: 'assistant', content: assistantResponse, timestamp: Date.now() }
        );
        
        // Update timestamp
        chat.timestamp = Date.now();
        
        // Move to top
        this.chats = this.chats.filter(c => c.id !== this.currentChatId);
        this.chats.unshift(chat);
        
        // Save to server
        await this.saveChatToServer(chat);
        
        // Update UI
        this.updateChatHistory();
    }



    generateChatTitle(message) {
        // Generate a title from the first message (max 40 chars)
        let title = message.trim();
        if (title.length > 40) {
            title = title.substring(0, 37) + '...';
        }
        return title;
    }

    async loadChatHistory() {
        await this.loadChatsFromServer();
    }

    updateChatHistory() {
        this.chatHistory.innerHTML = '';
        
        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            if (chat.id === this.currentChatId) {
                chatItem.classList.add('active');
            }
            
            const chatTitle = document.createElement('span');
            chatTitle.className = 'chat-title';
            chatTitle.textContent = chat.title;
            chatTitle.addEventListener('click', () => this.loadChat(chat.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'chat-delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete conversation';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChatItem(chat.id);
            });
            
            chatItem.appendChild(chatTitle);
            chatItem.appendChild(deleteBtn);
            
            this.chatHistory.appendChild(chatItem);
        });
    }
    
    async deleteChatItem(chatId) {
        if (confirm('Delete this conversation? This action cannot be undone.')) {
            // Delete from server
            const deleted = await this.deleteChatFromServer(chatId);
            
            if (deleted || !this.isOnline) {
                // Remove from local array
                this.chats = this.chats.filter(c => c.id !== chatId);
                
                // Update localStorage
                this.saveToLocalStorage();
                
                // If this was the current chat, clear the view
                if (chatId === this.currentChatId) {
                    this.clearMessages();
                    this.showWelcomeScreen();
                    this.currentChatId = null;
                }
                
                // Update UI
                this.updateChatHistory();
                
                this.showToast('Conversation deleted');
            }
        }
    }

    loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.hideWelcomeScreen();
        this.clearMessages();
        
        // Load messages
        chat.messages.forEach(message => {
            this.addMessage(message.content, message.role);
        });
        
        this.updateChatHistory();
        this.closeSidebar();
    }

    async clearCurrentChat() {
        if (!this.currentChatId) return;
        
        if (confirm('Delete this conversation? This action cannot be undone.')) {
            // Delete from server
            const deleted = await this.deleteChatFromServer(this.currentChatId);
            
            if (deleted || !this.isOnline) {
                // Remove from local array
                this.chats = this.chats.filter(c => c.id !== this.currentChatId);
                
                // Update localStorage
                this.saveToLocalStorage();
                
                // Clear UI
                this.clearMessages();
                this.showWelcomeScreen();
                this.currentChatId = null;
                this.updateChatHistory();
                
                this.showToast('Conversation deleted');
            }
        }
    }

    // Utility method to show loading
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

// Prevent zoom on double tap on mobile
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

let lastTouchEnd = 0;