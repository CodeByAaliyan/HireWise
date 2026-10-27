# HireWise — AI Resume & Job Match Assistant

HireWise is a portfolio-ready domain-specific AI application that helps job seekers:
- Upload a PDF or DOCX resume
- Paste a job description
- Extract skills and compare them with job requirements
- Get a transparent match score and missing-skill analysis
- Generate tailored resume improvement suggestions
- Generate interview questions for the target role
- Optionally use Google Gemini for more contextual feedback
- Create an account, sign in, and securely sign out

## Tech stack
- Frontend: React + Vite
- Backend: FastAPI
- Resume parsing: PyMuPDF + python-docx
- Optional LLM: Google Gemini (`google-genai`)
- Local operation: analysis works without an API key; AI-enhanced feedback uses Gemini when configured

## Project structure
```text
HireWise/
├── backend/
│   ├── hirewise.db  # created automatically at first backend startup
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── analyzer.py
│   │   └── llm.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── styles.css
└── README.md
```

## Requirements
- Python 3.10+
- Node.js 18+
- Optional: Google AI Studio API key

## Run on Windows (PowerShell)

### 1. Start the backend
```powershell
cd HireWise\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

If PowerShell blocks activation, you can run the environment's Python directly:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 2. Start the frontend in a second terminal
```powershell
cd HireWise\frontend
npm install
npm run dev
```
Open the local URL Vite prints, usually `http://localhost:5173`.

## Optional Gemini setup
1. Create an API key in Google AI Studio.
2. Open `backend/.env`.
3. Set:
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```
4. Restart the backend.

Without a Gemini key, core resume parsing, skill matching, match scoring, and rule-based suggestions still work. Gemini is only used for enhanced feedback and tailored interview questions. Never commit `.env` or expose your API key in frontend code.

## Account login system
- New users can register with a name, email address, and password (minimum 8 characters).
- Returning users can sign in and sign out.
- SQLite stores account records and hashed session-token records in `backend/hirewise.db`.
- Passwords are stored as PBKDF2-HMAC-SHA256 hashes with a unique random salt, never as plain text.
- Resume analysis and interview-question endpoints require a valid Bearer session token.
- Sessions expire after 7 days. Signing out revokes the current session.
- The browser keeps the session token in localStorage for convenience. Do not use this starter's auth configuration as-is for a high-risk production deployment; use HTTPS, rate limiting, monitoring, and consider secure HttpOnly cookies.

## API endpoints
- `GET /health` — health check
- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — validate session / current user
- `POST /api/auth/logout` — revoke current session
- `POST /api/analyze` — resume + job description analysis
- `POST /api/interview-questions` — generate interview questions

Interactive API docs: `http://localhost:8000/docs`

## How the match score works
HireWise extracts skill terms from the resume and job description using a curated skill dictionary. The score is based on the proportion of detected job skills found in the resume. It is a guidance signal, not a hiring decision or a prediction of job performance. It does not evaluate protected traits.

## Important limitations
- Resume parsing and skill detection are heuristic and may miss context, synonyms, or skills written in unusual formats.
- A match score should not be used as an automated hiring decision.
- Review all AI-generated suggestions before using them; do not add skills or experience you do not actually have.
- User accounts and hashed session tokens are stored in the local SQLite database (`backend/hirewise.db`). Passwords are hashed with PBKDF2-HMAC-SHA256 and are never stored as plain text. Sessions expire after 7 days and are revocable on sign-out. Uploaded resumes are processed in memory and are not intentionally saved to disk. The browser stores the session token in localStorage; for a public production deployment, use HTTPS, rate limiting, stronger operational controls, and consider secure HttpOnly cookies.
