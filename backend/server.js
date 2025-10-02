import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const {
  GITHUB_TOKEN,      // PAT with repo permissions (or use a GitHub App token)
  GITHUB_OWNER,      // e.g. "chengyu1201"
  GITHUB_REPO,       // e.g. "cicdgame"
  BRANCH_BASE = "main",  // base branch to branch off
  ALLOW_ORIGIN = "*"     // CORS: set to your web host in production
} = process.env;

app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN); res.setHeader('Access-Control-Allow-Headers','Content-Type'); next(); });

const gh = (url, opts={}) => fetch(`https://api.github.com${url}`, {
  ...opts,
  headers: {
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    ...(opts.headers||{})
  }
});

app.post('/submit', async (req, res) => {
  try {
    const sid = String(req.body.studentId||"").trim();
    if(!/^\d{8,10}$/.test(sid)) return res.status(400).json({ error: '學號格式錯誤' });

    // 1) get base sha
    const ref = await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${BRANCH_BASE}`).then(r=>r.json());
    if(!ref.object || !ref.object.sha) throw new Error('找不到 base branch');
    const baseSha = ref.object.sha;

    // 2) create new branch
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    const branch = `submission-${sid}-${ts}`;
    await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
    });

    // 3) add file under submissions/{sid}.txt
    const path = `submissions/${sid}.txt`;
    const content = Buffer.from(`student=${sid}\nts=${new Date().toISOString()}\n`).toString('base64');
    await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ message: `submission: ${sid}`, content, branch })
    });

    // 4) open PR
    const pr = await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title: `submission by ${sid}`, head: branch, base: BRANCH_BASE, body: `Auto PR for **${sid}**` })
    }).then(r=>r.json());

    return res.json({ pr_url: pr.html_url, branch });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '系統錯誤，請稍後再試' });
  }
});

app.get('/', (_,res)=>res.send('OK'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('server listening on', PORT));