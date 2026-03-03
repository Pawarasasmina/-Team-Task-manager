# Render + Vercel Deployment

## 1) Backend (Render)

Service settings:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Set these environment variables in Render:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=<your_mongodb_atlas_connection_string>
JWT_SECRET=<long_random_secret>
JWT_EXPIRES_IN=24h
CORS_ORIGINS=https://<your-vercel-domain>
CLIENT_URL=https://<your-vercel-domain>

# Optional (used by createAdmin.js)
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_CONTACT_NUMBER=1234567890
ADMIN_PASSWORD=<secure_admin_password>
```

Notes:
- If you have multiple frontend domains, set `CORS_ORIGINS` as comma-separated values.
- Example: `CORS_ORIGINS=https://app.vercel.app,https://www.app.com`

## 2) Frontend (Vercel)

Project settings:
- Root Directory: `frontend`
- Framework: `Create React App` (auto-detected)
- Build Command: `npm run build`
- Output Directory: `build`

Set these environment variables in Vercel:

```env
REACT_APP_API_URL=https://<your-render-service>.onrender.com/api
REACT_APP_SOCKET_URL=https://<your-render-service>.onrender.com
```

## 3) After Deploy

1. Deploy backend on Render and copy the public URL.
2. Set Vercel env vars with that backend URL and redeploy frontend.
3. Update Render `CORS_ORIGINS`/`CLIENT_URL` to your Vercel domain and redeploy backend.
4. (Optional) Create admin user:
   - In Render shell/job: `node createAdmin.js`
