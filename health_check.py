#!/usr/bin/env python3
"""
Health Check Script for AlphaX
Use this to monitor your deployed application
"""

import requests
import sys
import json
from datetime import datetime

def check_health(url):
    """Check if the application is healthy"""
    try:
        # Check main endpoint
        response = requests.get(f"{url}/api/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Application is healthy!")
            print(f"📊 Status: {data.get('status', 'unknown')}")
            print(f"💬 Message: {data.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Health check timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("🔌 Could not connect to the application")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python health_check.py <URL>")
        print("Example: python health_check.py https://your-app.onrender.com")
        sys.exit(1)
    
    url = sys.argv[1].rstrip('/')
    
    print(f"🔍 Checking health of: {url}")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    is_healthy = check_health(url)
    
    if is_healthy:
        print("🎉 All systems operational!")
        sys.exit(0)
    else:
        print("🚨 Application appears to be down!")
        sys.exit(1)

if __name__ == '__main__':
    main()