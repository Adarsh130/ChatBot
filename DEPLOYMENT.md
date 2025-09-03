# 🚀 Deployment Guide - Render

This guide will help you deploy AlphaX to Render, a modern cloud platform.

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **OpenRouter API Key** - Get one from [openrouter.ai](https://openrouter.ai/keys)

## 🔧 Deployment Steps

### 1. Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

### 2. Deploy on Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   - **Name:** `alphax-chatbot` (or your preferred name)
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT app:app`

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | ✅ Yes |
| `SECRET_KEY` | Generate a secure random string | ✅ Yes |
| `FLASK_ENV` | `production` | ✅ Yes |
| `FLASK_DEBUG` | `False` | ✅ Yes |
| `SITE_URL` | Your Render app URL | No |
| `APP_NAME` | `AlphaX` | No |

#### 🔑 Generating a Secure SECRET_KEY

Use Python to generate a secure secret key:

```python
import secrets
print(secrets.token_hex(32))
```

Or use this online tool: [Generate Secret Key](https://djecrety.ir/)

### 4. Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Your app will be available at:** `https://your-app-name.onrender.com`

## 🔄 Updating Your App

To update your deployed app:

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Render will automatically redeploy** your app

## 🌐 Custom Domain (Optional)

1. **Go to your service settings**
2. **Click "Custom Domains"**
3. **Add your domain**
4. **Update DNS records** as instructed

## 🔍 Monitoring

### Health Check
Your app includes a health check endpoint: `https://your-app.onrender.com/api/health`

### Logs
View logs in the Render dashboard under "Logs" tab.

### Metrics
Monitor performance in the "Metrics" tab.

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check `requirements.txt` is correct
   - Ensure Python version compatibility

2. **App Won't Start:**
   - Verify environment variables are set
   - Check logs for error messages

3. **API Errors:**
   - Verify `OPENROUTER_API_KEY` is correct
   - Check `SECRET_KEY` is set

4. **CORS Issues:**
   - Ensure `SITE_URL` matches your Render domain
   - Check CORS configuration in `app.py`

### Debug Steps

1. **Check Render logs:**
   ```
   Dashboard → Your Service → Logs
   ```

2. **Test health endpoint:**
   ```
   curl https://your-app.onrender.com/api/health
   ```

3. **Verify environment variables:**
   ```
   Dashboard → Your Service → Environment
   ```

## 📊 Performance Tips

1. **Use Render's free tier** for testing
2. **Upgrade to paid plan** for production use
3. **Monitor resource usage** in dashboard
4. **Enable auto-scaling** if needed

## 🔒 Security Best Practices

1. **Never commit `.env` file** to GitHub
2. **Use strong SECRET_KEY** (32+ characters)
3. **Rotate API keys** regularly
4. **Monitor access logs** for suspicious activity
5. **Keep dependencies updated**

## 💡 Tips

- **Free tier sleeps** after 15 minutes of inactivity
- **Paid plans** have faster cold starts
- **Use environment variables** for all sensitive data
- **Monitor logs** for performance insights

## 🆘 Support

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **OpenRouter Docs:** [openrouter.ai/docs](https://openrouter.ai/docs)
- **GitHub Issues:** Create an issue in your repository

---

🎉 **Congratulations!** Your AlphaX chatbot is now live on the internet!