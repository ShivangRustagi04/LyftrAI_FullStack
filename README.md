# 🌐 Universal Website Scraper — Full-Stack Assignment (Lyftr AI)

A production-ready static-first universal scraper with Playwright JS fallback. Built with FastAPI backend, a Tailwind-styled frontend, and BeautifulSoup/lxml for robust HTML parsing. Produces structured JSON containing metadata, semantic sections, content, and interaction traces.

---

## 🚀 Features

- Static-first parsing using httpx + BeautifulSoup + lxml
- Automatic Playwright fallback for JS-rendered sites
    - Network-idle rendering, auto-clicks (tabs, "load more"), infinite-scroll simulation, pagination up to configurable depth
- Extracts:
    - Metadata (title, description, language, canonical)
    - Semantic sections (header, main, article, section, footer)
    - Headings, paragraphs, images, links, tables, lists
    - Interaction metadata (pages visited, clicks, scrolls)
    - Truncated raw HTML for each section
- Frontend: Tailwind UI, collapsible section cards, syntax-highlighted HTML preview, copy/download JSON
- Endpoints: /scrape (POST), /healthz (GET)
- Scripts for local development and Playwright browser installation

---

## 🧭 Tested URLs

1. https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/
2. https://en.wikipedia.org/wiki/Narendra_Modi
3. https://lyftr.ai/

---

## 📁 Project Structure 
```bash
.
├── run.sh
├── requirements.txt
├── README.md
├── design.md
├── capabilities.json
├── app/
│   ├── main.py
│   ├── scraper.py
│   ├── parsers.py
│   ├── utils.py
│   └── templates/
│       └── index.html
└── static/
        └── client.js

---
```
## ⚙️ Setup & Running

### 1. Clone repository
```bash
git clone https://github.com/ShivangRustagi04/LyftrAI_FullStack
cd LyftrAI_FullStack
```

### 2. Run on Linux / macOS / Git Bash
Make run.sh executable and run it:
```bash
chmod +x run.sh
./run.sh
```
Typical run.sh tasks:
- Create and activate virtual environment
- Install Python dependencies from requirements.txt
- Install Playwright browsers (`playwright install`)
- Start FastAPI server at http://localhost:8000

Example run.sh (minimal)
```bash
#!/usr/bin/env bash
set -e
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Running on Windows
- Recommended: Git Bash or WSL. From Git Bash:
```bash
./run.sh
```
- Or use PowerShell/CMD with a run.bat or manual steps:
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧠 How the Scraper Works (high-level)

1. Fetch HTML via httpx (static-first).
2. Parse DOM with BeautifulSoup/lxml to extract metadata and semantic sections.
3. If content is insufficient (too little text, few sections, or detected JS-rendering), invoke Playwright:
     - Render page until network idle
     - Simulate clicks for tabs and "load more"
     - Perform infinite scroll and follow pagination (configurable depth)
4. Re-parse final HTML and assemble JSON:
     - url, meta, sections, interactions, errors
5. Frontend presents results with collapsible cards and JSON export options.

---

## 📤 API Endpoints

GET /healthz
- Response:
```json
{"status":"ok"}
```

POST /scrape
- Request body:
```json
{ "url": "https://example.com" }
```
- Response:
```json
{
    "result": {
        "url": "...",
        "meta": { /* title, description, canonical, lang */ },
        "sections": [ /* semantic sections with text, html, assets */ ],
        "interactions": { /* clicks, scrolls, pagesVisited */ },
        "errors": [ /* parsing or network errors */ ]
    }
}
```

---

## 🧩 Config & Tuning

- Playwright fallback thresholds and pagination depth are configurable in config or scraper settings.
- Consider site-specific selectors for highly dynamic sites.
- Add robots.txt respect if required (not enforced by default).

---

## 📸 Screenshots (optional)
Place screenshots in the /screenshots folder:
- /screenshots/homepage.png
- /screenshots/expanded-section.png
- /screenshots/json-output.png

---

## ⚠️ Known Limitations

- Not a full crawler — stops at configured pagination depth.
- No robots.txt enforcement by default.
- Some lazy-loaded content may require viewport-specific interactions.
- Extremely dynamic sites may need custom selectors.

---

## 📜 License

This assignment is built solely for Lyftr AI recruitment and should not be redistributed without permission.
