from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import jwt
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-production')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
YOUR_SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')
YOUR_APP_NAME = os.getenv('APP_NAME', 'AlphaX')
USERS_FILE = "users.json"
CHATS_FILE = "chats.json"

# Validate required environment variables
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required. Please set it in your .env file.")

# User storage functions
def load_users():
    """Load users from JSON file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

# Chat storage functions
def load_chats():
    """Load chats from JSON file"""
    if os.path.exists(CHATS_FILE):
        try:
            with open(CHATS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}

def save_chats(chats):
    """Save chats to JSON file"""
    with open(CHATS_FILE, 'w') as f:
        json.dump(chats, f, indent=2)

def get_user_chats(user_id):
    """Get all chats for a specific user"""
    chats = load_chats()
    return chats.get(user_id, {})

def save_user_chat(user_id, chat_data):
    """Save a chat for a specific user"""
    chats = load_chats()
    if user_id not in chats:
        chats[user_id] = {}
    
    chat_id = chat_data['id']
    chat_data['updated_at'] = datetime.utcnow().isoformat()
    
    # If it's a new chat, add created_at
    if chat_id not in chats[user_id]:
        chat_data['created_at'] = datetime.utcnow().isoformat()
    
    chats[user_id][chat_id] = chat_data
    save_chats(chats)
    return chat_data

def delete_user_chat(user_id, chat_id):
    """Delete a specific chat for a user"""
    chats = load_chats()
    if user_id in chats and chat_id in chats[user_id]:
        del chats[user_id][chat_id]
        save_chats(chats)
        return True
    return False

def create_token(user_id):
    """Create JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to request context
        request.current_user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function

@app.route("/")
def index():
    return jsonify({"message": "AlphaX backend running with authentication!"})

@app.route("/api/register", methods=["POST"])
def register():
    """User registration endpoint"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    # Validation
    if not email or not password or not name:
        return jsonify({"error": "Email, password, and name are required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    
    if '@' not in email or '.' not in email:
        return jsonify({"error": "Please enter a valid email address"}), 400
    
    # Load existing users
    users = load_users()
    
    # Check if user already exists
    if email in users:
        return jsonify({"error": "User with this email already exists"}), 409
    
    # Create new user
    user_data = {
        'email': email,
        'name': name,
        'password_hash': generate_password_hash(password),
        'created_at': datetime.utcnow().isoformat(),
        'chat_count': 0
    }
    
    users[email] = user_data
    save_users(users)
    
    # Create token
    token = create_token(email)
    
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "email": email,
            "name": name,
            "chat_count": 0
        }
    }), 201

@app.route("/api/login", methods=["POST"])
def login():
    """User login endpoint"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    # Load users
    users = load_users()
    
    # Check if user exists
    if email not in users:
        return jsonify({"error": "Invalid email or password"}), 401
    
    user = users[email]
    
    # Verify password
    if not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Create token
    token = create_token(email)
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "email": user['email'],
            "name": user['name'],
            "chat_count": user.get('chat_count', 0)
        }
    })

@app.route("/api/user", methods=["GET"])
@require_auth
def get_user():
    """Get current user info"""
    users = load_users()
    user_id = request.current_user_id
    
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    
    user = users[user_id]
    return jsonify({
        "user": {
            "email": user['email'],
            "name": user['name'],
            "chat_count": user.get('chat_count', 0),
            "created_at": user.get('created_at')
        }
    })

@app.route("/api/chat", methods=["POST"])
@require_auth
def chat():
    """Protected chat endpoint"""
    # Get prompt and conversation history
    data = request.get_json()
    prompt = data.get("prompt", "").strip()
    messages = data.get("messages", [])
    
    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    # Update user chat count
    users = load_users()
    user_id = request.current_user_id
    if user_id in users:
        users[user_id]['chat_count'] = users[user_id].get('chat_count', 0) + 1
        save_users(users)

    # Build conversation context
    conversation = []
    
    # Add system message for better ChatGPT-like responses
    system_message = {
        "role": "system",
        "content": f"""You are AlphaX, a helpful, harmless, and honest AI assistant. You are chatting with {users[user_id]['name']}. You should:

1. Provide clear, well-structured responses
2. Use markdown formatting when appropriate (headers, lists, code blocks, etc.)
3. Be conversational but professional
4. Break down complex topics into digestible parts
5. Provide examples when helpful
6. Ask clarifying questions when needed
7. Admit when you don't know something
8. Format code with proper syntax highlighting using code blocks
9. Use bullet points and numbered lists for better readability
10. Be concise but thorough

Always aim to be as helpful as possible while maintaining accuracy."""
    }
    
    conversation.append(system_message)
    
    # Add conversation history if provided
    if messages:
        conversation.extend(messages)
    
    # Add current user message
    conversation.append({"role": "user", "content": prompt})

    # Send to OpenRouter
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "Referer": YOUR_SITE_URL,
        "X-Title": YOUR_APP_NAME,
    }

    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": conversation,
        "temperature": 0.7,
        "max_tokens": 2048,
        "top_p": 0.9,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions", 
            headers=headers, 
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            
            return jsonify({
                "response": ai_response,
                "model": payload["model"],
                "usage": result.get("usage", {}),
                "user_chat_count": users[user_id].get('chat_count', 0)
            })
        else:
            error_detail = response.text
            print(f"OpenRouter API Error: {response.status_code} - {error_detail}")
            return jsonify({
                "error": f"AI service temporarily unavailable (Error {response.status_code})",
                "details": "Please try again in a moment."
            }), 503

    except requests.exceptions.Timeout:
        return jsonify({
            "error": "Request timeout",
            "details": "The AI service took too long to respond. Please try again."
        }), 504
    
    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        return jsonify({
            "error": "Connection error",
            "details": "Unable to connect to AI service. Please check your connection and try again."
        }), 503
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": "An unexpected error occurred. Please try again."
        }), 500

@app.route("/api/chats", methods=["GET"])
@require_auth
def get_chats():
    """Get all chats for the current user"""
    user_id = request.current_user_id
    user_chats = get_user_chats(user_id)
    
    # Convert to list format expected by frontend
    chats_list = []
    for chat_id, chat_data in user_chats.items():
        chats_list.append(chat_data)
    
    # Sort by timestamp (newest first)
    chats_list.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    
    return jsonify({"chats": chats_list})

@app.route("/api/chats", methods=["POST"])
@require_auth
def save_chat():
    """Save a new chat or update existing chat"""
    user_id = request.current_user_id
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    required_fields = ['id', 'title', 'messages', 'timestamp']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        saved_chat = save_user_chat(user_id, data)
        return jsonify({
            "message": "Chat saved successfully",
            "chat": saved_chat
        })
    except Exception as e:
        print(f"Error saving chat: {str(e)}")
        return jsonify({"error": "Failed to save chat"}), 500

@app.route("/api/chats/<chat_id>", methods=["DELETE"])
@require_auth
def delete_chat(chat_id):
    """Delete a specific chat"""
    user_id = request.current_user_id
    
    if delete_user_chat(user_id, chat_id):
        return jsonify({"message": "Chat deleted successfully"})
    else:
        return jsonify({"error": "Chat not found"}), 404

@app.route("/api/chats/<chat_id>", methods=["PUT"])
@require_auth
def update_chat(chat_id):
    """Update a specific chat"""
    user_id = request.current_user_id
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Ensure the chat ID matches
    data['id'] = chat_id
    
    try:
        updated_chat = save_user_chat(user_id, data)
        return jsonify({
            "message": "Chat updated successfully",
            "chat": updated_chat
        })
    except Exception as e:
        print(f"Error updating chat: {str(e)}")
        return jsonify({"error": "Failed to update chat"}), 500

@app.route("/api/logout", methods=["POST"])
@require_auth
def logout():
    """Logout endpoint (client should delete token)"""
    return jsonify({"message": "Logged out successfully"})

@app.route("/api/models", methods=["GET"])
@require_auth
def get_models():
    """Get available models (protected)"""
    models = [
        {
            "id": "openai/gpt-4o-mini",
            "name": "GPT-4o Mini",
            "description": "Fast and efficient model for most tasks"
        },
        {
            "id": "openai/gpt-4o",
            "name": "GPT-4o",
            "description": "Most capable model for complex tasks"
        },
        {
            "id": "anthropic/claude-3-haiku",
            "name": "Claude 3 Haiku",
            "description": "Fast and efficient Claude model"
        },
        {
            "id": "anthropic/claude-3-sonnet",
            "name": "Claude 3 Sonnet",
            "description": "Balanced Claude model"
        }
    ]
    return jsonify({"models": models})

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    print("🚀 Starting AlphaX backend server with authentication...")
    print("📡 Server will run on http://localhost:5000")
    print("🔗 Make sure frontend is running on http://localhost:8000")
    print("🔐 Authentication enabled - users must register/login to chat")
    print("💾 Server-side chat storage enabled - chats sync across devices")
    app.run(debug=True, port=5000, host='0.0.0.0')