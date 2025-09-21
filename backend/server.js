const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

const dataDir = path.join(__dirname, 'data');
const recordsFile = path.join(dataDir, 'records.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

async function ensureData(){
  await fs.ensureDir(dataDir);
  if (!await fs.pathExists(recordsFile)) await fs.writeJson(recordsFile, []);
}
ensureData().catch(console.error);

function getBaseUrl(req){
  // Prefer BASE_URL env (useful for deployment), otherwise build from request (works on Render)
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http');
  return proto + '://' + req.get('host');
}

app.post('/api/saveRecord', async (req, res) => {
  try {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: 'Name required' });
    const id = uuidv4();
    const record = Object.assign({ id, createdAt: new Date().toISOString() }, body);
    const arr = await fs.readJson(recordsFile);
    arr.push(record);
    await fs.writeJson(recordsFile, arr, { spaces: 2 });

    const base = getBaseUrl(req);
    const profileUrl = `${base}/emergency/${id}`;
    const qrDataUrl = await QRCode.toDataURL(profileUrl);

    return res.json({ message: 'saved', id, profileUrl, qr: qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/records', async (req, res) => {
  try {
    const arr = await fs.readJson(recordsFile);
    res.json(arr);
  } catch (e) { res.status(500).json({ error: 'server error' }); }
});

app.get('/emergency/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const arr = await fs.readJson(recordsFile);
    const r = arr.find(x => x.id === id);
    if (!r) return res.status(404).send('<h2>Record not found</h2>');
    const safe = (s) => (s===undefined||s===null) ? '' : String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const allergies = Array.isArray(r.allergies)? r.allergies.join(', ') : r.allergies;
    const meds = Array.isArray(r.medications)? r.medications.join(', ') : r.medications;
    const conds = Array.isArray(r.conditions)? r.conditions.join(', ') : r.conditions;
    const heart = Array.isArray(r.heartDiseases)? r.heartDiseases.join(', ') : r.heartDiseases || '';
    const additional = r.additionalInfo || '';
    res.send(`
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>Sanjeevani — Emergency: ${safe(r.name)}</title>
        <style>
          body{font-family: Arial, Helvetica, sans-serif; background:#f6fbff; color:#111; padding:18px;}
          .card{max-width:760px;margin:12px auto;background:#fff;padding:18px;border-radius:12px;box-shadow:0 6px 18px rgba(2,24,64,0.06);}
          h1{color:#0077b6;margin:0 0 6px;}
          p{margin:6px 0;font-size:15px}
          .label{color:#555;font-weight:700;margin-top:8px}
          .note{margin-top:12px;color:#444;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #eef6fb}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Sanjeevani — Emergency Profile</h1>
          <p class="label">Name</p><p>${safe(r.name)}</p>
          <p class="label">Age</p><p>${safe(r.age)}</p>
          <p class="label">Blood Group</p><p>${safe(r.bloodGroup)}</p>
          <p class="label">Allergies</p><p>${safe(allergies)}</p>
          <p class="label">Medications</p><p>${safe(meds)}</p>
          <p class="label">Conditions</p><p>${safe(conds)}</p>
          <p class="label">Heart Diseases</p><p>${safe(heart)}</p>
          <p class="label">Emergency Contact</p><p>${safe(r.emergency)}</p>
          <div class="note"><strong>Additional Information</strong><div>${safe(additional)}</div></div>
          <p style="margin-top:12px;color:#666;font-size:13px">Issued: ${safe(r.createdAt)}</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) { console.error(err); res.status(500).send('server error'); }
});

app.listen(PORT, ()=> console.log(`✅ Sanjeevani running at ${PORT} (process.env.BASE_URL=${process.env.BASE_URL || 'not set'})`));
