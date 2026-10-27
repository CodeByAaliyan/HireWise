import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, FileText, BriefcaseBusiness, UploadCloud, CheckCircle2,
  AlertCircle, ArrowUpRight, Target, ShieldCheck, WandSparkles,
  MessageSquareText, RotateCcw, ChevronRight, LoaderCircle, Sun, Moon
} from 'lucide-react'

const API = 'http://localhost:8000'

function Chip({ children, kind = 'neutral' }) {
  return <span className={`chip ${kind}`}>{children}</span>
}

function SkillList({ title, items, kind }) {
  return <div className="skill-group">
    <div className="skill-title">{title}<span>{items?.length || 0}</span></div>
    {items?.length ? <div className="chips">{items.map(s => <Chip key={s} kind={kind}>{s}</Chip>)}</div>
      : <p className="muted small">No skills detected in this category.</p>}
  </div>
}

function ThemeButton({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark'
  return <button type="button" className={`theme-toggle ${className}`} onClick={onToggle}
    title={`Switch to ${isDark ? 'light' : 'dark'} mode`} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
    {isDark ? <Sun size={17} /> : <Moon size={17} />}
    <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
  </button>
}

function AuthScreen({ onAuthenticated, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const endpoint = mode === 'login' ? 'login' : 'register'
      const payload = { email, password, ...(mode === 'register' ? { name } : { name: '' }) }
      const res = await fetch(`${API}/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Authentication failed.')
      localStorage.setItem('hirewise_token', data.token)
      onAuthenticated(data.user, data.token)
    } catch (err) { setError(err.message || 'Could not connect to HireWise. Check that the backend is running.') }
    finally { setBusy(false) }
  }

  return <div className="auth-screen"><div className="auth-glow"/><ThemeButton theme={theme} onToggle={onToggleTheme} className="auth-theme-toggle"/><div className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark"><Target size={20}/></div><span>hirewise<span className="brand-dot">.</span></span></div>
    <div className="auth-eyebrow"><Sparkles size={14}/> YOUR CAREER WORKSPACE</div>
    <h1>{mode === 'login' ? 'Welcome back.' : 'Build your next move.'}</h1>
    <p className="auth-subtitle">{mode === 'login' ? 'Sign in to continue your resume and interview preparation.' : 'Create an account to access your personal career workspace.'}</p>
    <div className="auth-tabs"><button className={mode === 'login' ? 'selected' : ''} onClick={() => {setMode('login');setError('')}}>Sign in</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => {setMode('register');setError('')}}>Create account</button></div>
    <form className="auth-form" onSubmit={submit}>
      {mode === 'register' && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required maxLength={80}/></label>}
      <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : 1} maxLength={128} required/></label>
      {error && <div className="auth-error"><AlertCircle size={16}/>{error}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Please wait...</> : <>{mode === 'login' ? 'Sign in to HireWise' : 'Create my account'} <ArrowUpRight size={17}/></>}</button>
    </form>
    <div className="auth-foot"><ShieldCheck size={15}/> Passwords are securely hashed. Your session is private to this browser.</div>
  </div></div>
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hirewise_theme') || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('hirewise_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }

  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('hirewise_token') || '')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      if (!authToken) { setAuthReady(true); return }
      try {
        const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } })
        const data = await res.json()
        if (!res.ok) throw new Error('Session expired')
        if (!cancelled) setAuthUser(data.user)
      } catch {
        localStorage.removeItem('hirewise_token')
        if (!cancelled) { setAuthToken(''); setAuthUser(null) }
      } finally { if (!cancelled) setAuthReady(true) }
    }
    checkSession()
    return () => { cancelled = true }
  }, [authToken])

  function authenticated(user, token) { setAuthUser(user); setAuthToken(token); setAuthReady(true) }
  async function signOut() {
    try { await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } }) } catch {}
    localStorage.removeItem('hirewise_token'); setAuthToken(''); setAuthUser(null)
  }

  const [file, setFile] = useState(null)
  const [job, setJob] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionBusy, setQuestionBusy] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [dragging, setDragging] = useState(false)

  const canAnalyze = Boolean(file && job.trim() && !busy)
  const grouped = useMemo(() => {
    if (!result?.skill_groups) return []
    return Object.entries(result.skill_groups)
  }, [result])

  const onFile = f => {
    if (!f) return
    const valid = /\.(pdf|docx)$/i.test(f.name)
    if (!valid) { setError('Please upload a PDF or DOCX resume.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('File must be 5 MB or smaller.'); return }
    setFile(f); setError(''); setResult(null); setQuestions([])
  }

  async function analyze() {
    setError(''); setBusy(true); setResult(null); setQuestions([])
    try {
      const body = new FormData()
      body.append('resume', file)
      body.append('job_description', job)
      body.append('use_ai', String(useAI))
      const res = await fetch(`${API}/api/analyze`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed.')
      setResult(data); setActiveTab('overview')
    } catch (e) {
      setError(`${e.message}. Make sure the FastAPI backend is running on port 8000.`)
    } finally { setBusy(false) }
  }

  async function makeQuestions() {
    setQuestionBusy(true); setError('')
    try {
      const res = await fetch(`${API}/api/interview-questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ job_description: job, resume_text: '' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not generate questions.')
      setQuestions(data.questions || [])
    } catch (e) { setError(e.message) }
    finally { setQuestionBusy(false) }
  }

  function reset() {
    setFile(null); setJob(''); setResult(null); setQuestions([]); setError(''); setActiveTab('overview')
  }

  if (!authReady) return <div className="auth-loading"><div className="brand-mark"><Target size={20}/></div><span>Preparing your workspace...</span></div>
  if (!authUser) return <AuthScreen onAuthenticated={authenticated} theme={theme} onToggleTheme={toggleTheme}/>

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Target size={20}/></div><span>hirewise<span className="brand-dot">.</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="side-item active"><Sparkles size={17}/> Resume match</button>
      <button className="side-item" onClick={() => document.getElementById('job-description')?.focus()}><BriefcaseBusiness size={17}/> Job analysis</button>
      <button className="side-item" onClick={() => result && setActiveTab('improvements')}><WandSparkles size={17}/> Resume coach</button>
      <div className="sidebar-bottom">
        <div className="privacy-card"><ShieldCheck size={18}/><div><strong>Your data, respected</strong><p>Files are processed in memory and not intentionally saved.</p></div></div>
        <div className="profile"><div className="avatar">{(authUser.name || authUser.email || 'U').slice(0,1).toUpperCase()}</div><div className="profile-copy"><strong>{authUser.name || 'HireWise user'}</strong><span>{authUser.email}</span></div><button className="logout-button" onClick={signOut} title="Sign out">Sign out</button></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>Resume match</strong></div>
        <div className="top-actions"><span className="status-pill"><span/> AI career assistant</span><ThemeButton theme={theme} onToggle={toggleTheme}/><button className="icon-button" title="Reset workspace" onClick={reset}><RotateCcw size={17}/></button></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14}/> CAREER INTELLIGENCE, REIMAGINED</div>
          <h1>Make your next move<br/><span>your best one.</span></h1>
          <p>Understand how your resume aligns with a role, discover skill gaps, and walk into your next interview prepared.</p>
        </div>
        <div className="hero-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-core"><Target size={35}/></div><span className="orb-tag tag-one">MATCH</span><span className="orb-tag tag-two">GROW</span></div>
      </section>

      <div className="content-grid">
        <section className="panel input-panel">
          <div className="panel-heading"><div><span className="step">01</span><h2>Bring your profile</h2></div><span className="required">Required</span></div>
          <p className="panel-subtitle">Upload your resume and add the job description you want to target.</p>

          <label className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => {e.preventDefault(); setDragging(true)}}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {e.preventDefault();setDragging(false);onFile(e.dataTransfer.files?.[0])}}>
            <input type="file" accept=".pdf,.docx" onChange={e => onFile(e.target.files?.[0])}/>
            <div className="upload-icon">{file ? <FileText size={24}/> : <UploadCloud size={24}/>}</div>
            {file ? <><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(0)} KB · Ready to analyze</span><button type="button" className="text-button" onClick={e => {e.preventDefault();e.stopPropagation();setFile(null)}}>Remove file</button></>
              : <><strong>Drop your resume here</strong><span>or <em>browse files</em> to upload</span><small>PDF or DOCX · Max 5 MB</small></>}
          </label>

          <div className="field-label" id="job-label"><span className="step">02</span><label htmlFor="job-description">Target job description</label></div>
          <textarea id="job-description" value={job} onChange={e => setJob(e.target.value)} placeholder={"Paste the job description here...\n\nExample: We are looking for an AI/ML Engineer with Python, machine learning, data analysis, FastAPI, and model deployment experience."}/>
          <div className="textarea-footer"><span>{job.trim().length} characters</span><span>More detail = better matching</span></div>

          <label className="toggle-row"><span className="toggle-copy"><WandSparkles size={17}/><span><strong>AI-enhanced feedback</strong><small>Detailed coaching with Gemini when configured</small></span></span><input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}/><span className="toggle-track"/></label>
          <button className="primary-button" disabled={!canAnalyze} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={18}/> Analyzing profile...</> : <><Sparkles size={18}/> Analyze my match <ArrowUpRight size={17}/></>}</button>
          {error && <div className="error-box"><AlertCircle size={17}/><span>{error}</span></div>}
          <div className="safe-note"><ShieldCheck size={14}/> Your resume is processed in memory. Avoid uploading documents you do not have permission to share.</div>
        </section>

        <section className="results-column">
          {!result ? <div className="empty-state panel">
            <div className="empty-illustration"><div className="doc doc-back"/><div className="doc doc-front"><span/><span/><span/><span/></div><div className="mini-spark"><Sparkles size={18}/></div></div>
            <h2>Your career clarity starts here.</h2>
            <p>Your personalized match report will appear here after you submit your resume and a target job description.</p>
            <div className="empty-features"><div><CheckCircle2 size={16}/><span>Skills comparison</span></div><div><CheckCircle2 size={16}/><span>Actionable feedback</span></div><div><CheckCircle2 size={16}/><span>Interview practice</span></div></div>
          </div> : <>
            <div className="result-header"><div><div className="eyebrow">YOUR PERSONALIZED REPORT</div><h2>Match insights</h2></div><Chip kind="success"><CheckCircle2 size={13}/> Analysis complete</Chip></div>
            <div className="score-card panel">
              <div className="score-main"><div className="score-ring" style={{'--score': `${result.match_score}%`}}><div><strong>{result.match_score}%</strong><span>match score</span></div></div><div className="score-description"><h3>{result.match_score >= 75 ? 'Strong skills alignment' : result.match_score >= 45 ? 'Promising foundation' : 'Room to strengthen your fit'}</h3><p>{result.summary}</p><small>Based on detected skills, not a hiring prediction.</small></div></div>
              <div className="metric-row"><div><span>Detected in role</span><strong>{result.job_skills.length}</strong></div><div><span>Skills matched</span><strong className="green-text">{result.matched_skills.length}</strong></div><div><span>Skill gaps</span><strong className="orange-text">{result.missing_skills.length}</strong></div></div>
            </div>
            <div className="tabs"><button className={activeTab === 'overview' ? 'selected' : ''} onClick={() => setActiveTab('overview')}>Skill breakdown</button><button className={activeTab === 'improvements' ? 'selected' : ''} onClick={() => setActiveTab('improvements')}>Resume coach</button><button className={activeTab === 'interview' ? 'selected' : ''} onClick={() => setActiveTab('interview')}>Interview prep</button></div>

            {activeTab === 'overview' && <div className="panel detail-panel">
              <div className="detail-heading"><div><h3>Skills breakdown</h3><p>What the system detected in your resume and the role.</p></div><span className="subtle-label">SKILL SIGNALS</span></div>
              <SkillList title="Matched skills" items={result.matched_skills} kind="success"/>
              <SkillList title="Skills to review" items={result.missing_skills} kind="warning"/>
              <SkillList title="Other resume skills" items={result.additional_resume_skills} kind="neutral"/>
              {grouped.length > 0 && <div className="group-summary"><h4>By category</h4>{grouped.map(([group, skills]) => <div className="category-row" key={group}><span>{group}</span><div className="category-track"><div style={{width: `${Math.min(100, skills.length / Math.max(1, result.job_skills.length) * 100)}%`}}/></div><b>{skills.length}</b></div>)}</div>}
            </div>}

            {activeTab === 'improvements' && <div className="panel detail-panel"><div className="detail-heading"><div><h3>Your improvement plan</h3><p>Practical changes to make your application clearer.</p></div><WandSparkles size={20}/></div>
              {result.suggestions.map((s,i) => <div className="suggestion" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></div>)}
              {result.ai_feedback ? <div className="ai-feedback"><div className="ai-label"><Sparkles size={15}/> GEMINI CAREER COACH</div><div className="markdown-text">{result.ai_feedback}</div></div> : <div className="notice"><AlertCircle size={17}/><p>{useAI ? 'Gemini feedback was not available. Add a valid GEMINI_API_KEY to backend/.env and restart the server to enable it.' : 'Turn on AI-enhanced feedback and analyze again to request deeper coaching (requires a Gemini API key).'}</p></div>}
            </div>}

            {activeTab === 'interview' && <div className="panel detail-panel"><div className="detail-heading"><div><h3>Interview warm-up</h3><p>Practice questions based on the role you are targeting.</p></div><MessageSquareText size={20}/></div>
              {!questions.length ? <div className="question-cta"><div className="question-icon"><MessageSquareText size={23}/></div><h4>Prepare with purpose</h4><p>Generate a focused set of technical, scenario, behavioral, and project questions.</p><button className="secondary-button" onClick={makeQuestions} disabled={questionBusy}>{questionBusy ? <><LoaderCircle className="spin" size={16}/> Preparing...</> : <><Sparkles size={16}/> Generate questions</>}</button></div>
                : <div className="question-list">{questions.map((q,i) => <div className="question-item" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{q}</p></div>)}<button className="secondary-button" onClick={makeQuestions} disabled={questionBusy}><RotateCcw size={15}/> Generate again</button></div>}
            </div>}
            <p className="disclaimer"><ShieldCheck size={14}/>{result.disclaimer}</p>
          </>}
        </section>
      </div>
      <footer><span>© 2026 HireWise</span><span>Built to help people prepare — not to make hiring decisions.</span><span className="footer-brand"><span/> CAREER INTELLIGENCE</span></footer>
    </main>
  </div>
}

export default App
