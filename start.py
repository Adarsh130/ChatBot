#!/usr/bin/env python3
"""
AlphaX Startup Script
Handles both development and production environments
"""

import os
import sys
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Check if we're in development or production
    flask_env = os.getenv('FLASK_ENV', 'development')
    
    if flask_env == 'development':
        print("🔧 Starting in DEVELOPMENT mode")
        print("📡 Backend: http://localhost:5000")
        print("🌐 Frontend: http://localhost:8000")
        print()
        print("To start the application:")
        print("1. Terminal 1: python app.py")
        print("2. Terminal 2: python serve_frontend.py")
        print()
        print("Or run both with: python start.py --dev")
        
        if '--dev' in sys.argv:
            import subprocess
            import threading
            
            def run_backend():
                subprocess.run([sys.executable, 'app.py'])
            
            def run_frontend():
                subprocess.run([sys.executable, 'serve_frontend.py'])
            
            # Start both servers
            backend_thread = threading.Thread(target=run_backend)
            frontend_thread = threading.Thread(target=run_frontend)
            
            backend_thread.start()
            frontend_thread.start()
            
            try:
                backend_thread.join()
                frontend_thread.join()
            except KeyboardInterrupt:
                print("\n🛑 Shutting down servers...")
                
    else:
        print("🌐 Starting in PRODUCTION mode")
        print("📡 Server serves both backend and frontend")
        
        # Import and run the Flask app
        from app import app
        port = int(os.getenv('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    main()