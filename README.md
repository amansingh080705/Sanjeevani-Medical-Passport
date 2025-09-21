Sanjeevani — Render-ready (final)

Contents:
- backend/  -> Express backend (runs on Node)
  - package.json
  - server.js
  - data/records.json (stores records locally)
- public/ -> frontend files (index.html, dashboard.html, styles.css, script.js)

## Run locally (VS Code / Windows)
1. Open terminal (PowerShell) and go to project backend folder:
   cd path\to\sanjeevani-render-ready\backend
2. Install dependencies (first time):
   npm install
3. Start server:
   npm start
4. Open browser: http://localhost:5000
   - Click Open Dashboard -> fill form -> Save & Generate QR
   - QR will include a link to /emergency/:id which opens full patient details

## Make QR globally accessible (Deploy to Render) — step-by-step
1. Create a GitHub repository and push the entire project (the root contains 'public' and 'backend' folders).
   Example commands:
     git init
     git add .
     git commit -m "Sanjeevani initial"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<repo-name>.git
     git push -u origin main

2. Sign up at https://render.com and connect your GitHub account.
3. Click **New** -> **Web Service**.
4. Select your GitHub repo and branch (main).
5. In the **Root Directory** field, enter: `backend`
   - This tells Render to run the Node app inside the backend folder.
6. Set **Build Command**: leave empty (Render runs npm install automatically) or put: `npm install`
7. Set **Start Command**: `npm start`
8. Create the service. Render will build and deploy; after a short time you'll get a public URL like `https://<name>.onrender.com`.
9. Open the public URL -> Open Dashboard -> create a record -> the QR generated will contain a publicly accessible link (https://<name>.onrender.com/emergency/<id>).
10. Optionally set environment variable BASE_URL in Render (Service → Environment → Add Environment Variable) to force a specific domain. Not required if you use the Render domain.

## Notes
- This project stores records in a JSON file (backend/data/records.json). For production, swap to a DB and add authentication & encryption.
- The QR contains a link to the public emergency page. Anyone who scans the QR will be able to view that emergency profile. Ensure you have consent from users before making records public.
