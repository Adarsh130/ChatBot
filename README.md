# AlphaX - ChatGPT-like AI Assistant with Authentication

A modern, responsive chat interface that accurately replicates ChatGPT's UI/UX, powered by OpenRouter API with GPT-4o Mini for enhanced responses. Now includes secure user authentication and personalized chat history.

## Features

✨ **Accurate ChatGPT UI/UX**
- Pixel-perfect dark theme matching ChatGPT
- GitHub-inspired color scheme
- Responsive design (mobile-friendly)
- Collapsible sidebar with chat history
- Smooth typing indicators with animated dots
- Advanced markdown formatting with syntax highlighting
- Auto-resizing input field with proper styling
- Message actions (copy, etc.)
- Streaming text effect for responses

🚀 **Enhanced Functionality**
- GPT-4o Mini for superior AI responses
- **Secure user authentication** with JWT tokens
- **User registration and login** system
- **Personalized chat tracking** and statistics
- **Server-side chat storage** with cross-device synchronization
- **Cloud backup** of all conversations
- **Offline support** with automatic sync when reconnected
- Conversation context awareness
- Real-time chat with streaming responses
- Multiple chat sessions with individual delete options
- Smart conversation titles
- Copy-to-clipboard functionality
- Enhanced error handling with user-friendly messages
- Code block syntax highlighting
- Mobile-optimized touch interactions
- **Protected API endpoints** requiring authentication
- **Automatic token validation** and refresh

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy the example environment file and configure your API keys:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_actual_api_key_here
SECRET_KEY=your_secure_secret_key_here
```

**Get your OpenRouter API key from:** https://openrouter.ai/keys

### 3. Start the Backend (Flask API)
```bash
python app.py
```
The backend will run on `http://localhost:5000`

### 4. Start the Frontend Server
```bash
python serve_frontend.py
```
The frontend will run on `http://localhost:8000` and automatically open in your browser.

### 5. Create Account & Start Chatting!
- Open `http://localhost:8000` in your browser
- **Sign up** for a new account or **sign in** if you already have one
- Click on example prompts or type your own message
- Enjoy the secure, personalized ChatGPT-like experience!

## Project Structure

```
ChatBox/
├── app.py                 # Flask backend with auth + chat storage
├── serve_frontend.py      # Simple HTTP server for frontend
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create from .env.example)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── users.json            # User database (auto-created)
├── chats.json            # Chat storage database (auto-created)
├── frontend/
│   ├── index.html        # Main HTML with auth modal
│   ├── styles.css        # ChatGPT-like styling + auth UI
│   └── script.js         # Frontend with server sync
└── README.md             # This file
```

## Environment Variables

The application uses environment variables for secure configuration. Copy `.env.example` to `.env` and configure:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | - | ✅ Yes |
| `SECRET_KEY` | JWT secret key for authentication | - | ✅ Yes |
| `SITE_URL` | Frontend URL for CORS | `http://localhost:8000` | No |
| `APP_NAME` | Application name | `AlphaX` | No |
| `FLASK_ENV` | Flask environment | `development` | No |
| `FLASK_DEBUG` | Enable Flask debug mode | `True` | No |

### Getting Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the key to your `.env` file

### Security Notes

- **Never commit your `.env` file** to version control
- Generate a **strong, random SECRET_KEY** for production
- Keep your **API keys secure** and rotate them regularly

## API Configuration

The backend uses OpenRouter API with GPT-4o-mini by default. The model can be configured in the chat endpoint.

## Features in Detail

### 🔐 Authentication Features
- **Secure Registration**: Create account with email and password
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure password storage using Werkzeug
- **Auto Token Validation**: Automatic token verification and refresh
- **Protected Endpoints**: All chat APIs require authentication
- **User Statistics**: Track chat count and usage
- **Secure Logout**: Complete session cleanup
- **Persistent Sessions**: Stay logged in across browser sessions

### 🎨 UI/UX Features
- **Dark Theme**: Modern dark interface matching ChatGPT
- **Authentication Modal**: Beautiful login/signup interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Fade-in effects and smooth transitions
- **Typing Indicators**: Shows when AI is thinking
- **Auto-scroll**: Automatically scrolls to new messages
- **User Profile**: Display user name and chat statistics

### 💬 Enhanced Chat Features
- **Server-Side Storage**: All chats stored securely on the server
- **Cross-Device Sync**: Access your chats from any device
- **Offline Support**: Continue chatting offline, auto-sync when online
- **Individual Chat Deletion**: Delete specific conversations with confirmation
- **Multiple Chats**: Create and switch between different conversations
- **Message Formatting**: Supports code blocks, bold, italic text
- **Example Prompts**: Quick-start prompts for common use cases
- **Error Handling**: Graceful error messages for API failures
- **Context Awareness**: AI remembers conversation history
- **Cloud Backup**: Never lose your conversations

### 📱 Mobile Support
- **Collapsible Sidebar**: Slide-out navigation on mobile
- **Touch-friendly**: Optimized for touch interactions
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Auth**: Optimized authentication forms for mobile

## Customization

### Changing the Theme
Edit `frontend/styles.css` to customize colors:
```css
:root {
    --primary-color: #10a37f;    /* Green accent color */
    --bg-color: #212121;         /* Main background */
    --sidebar-bg: #171717;       /* Sidebar background */
    --text-color: #ececec;       /* Text color */
}
```

### Adding New Models
Modify `app.py` to use different AI models:
```python
payload = {
    "model": "anthropic/claude-3-haiku",  # Example: Claude
    "messages": [{"role": "user", "content": prompt}],
}
```

### Custom Example Prompts
Edit the prompts in `frontend/index.html`:
```html
<div class="prompt-card" data-prompt="Your custom prompt here">
    <i class="fas fa-your-icon"></i>
    <span>Your prompt description</span>
</div>
```

## Browser Support

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Troubleshooting

### Backend Issues
- Make sure Flask is running on port 5000
- Check that the OpenRouter API key is set in `.env` file
- Verify CORS is enabled for frontend requests
- Ensure all required environment variables are configured

### Frontend Issues
- Ensure the frontend server is running on port 8000
- Check browser console for JavaScript errors
- Verify the backend URL in `script.js` matches your Flask server

### CORS Issues
If you encounter CORS errors:
1. Make sure Flask-CORS is installed: `pip install flask-cors`
2. Verify CORS is enabled in `app.py`
3. Check that the frontend is making requests to the correct backend URL

## Dependencies

### Backend (Python)
- Flask
- Flask-CORS
- requests

### Frontend
- Modern web browser with JavaScript enabled
- Font Awesome (loaded via CDN)

## License

This project is open source and available under the MIT License.