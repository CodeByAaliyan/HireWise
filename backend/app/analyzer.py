import re
from collections import Counter

SKILL_GROUPS = {
    "Programming": ["python", "javascript", "typescript", "java", "c++", "c#", "php", "sql"],
    "AI / Machine Learning": [
        "machine learning", "deep learning", "natural language processing", "nlp",
        "computer vision", "scikit-learn", "tensorflow", "pytorch", "classification",
        "regression", "model evaluation", "feature engineering", "generative ai", "llm",
        "large language models", "prompt engineering", "embeddings"
    ],
    "Data": [
        "data analysis", "data analytics", "pandas", "numpy", "data visualization",
        "statistics", "statistical analysis", "excel", "power bi", "tableau", "etl"
    ],
    "Backend / APIs": [
        "fastapi", "flask", "django", "rest api", "api development", "microservices",
        "authentication", "backend development", "node.js", "express"
    ],
    "Frontend": ["react", "html", "css", "bootstrap", "tailwind", "vite", "responsive design"],
    "Cloud / DevOps": [
        "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "github actions",
        "linux", "git", "mlflow", "deployment", "model monitoring"
    ],
    "Databases": ["postgresql", "mysql", "sqlite", "mongodb", "redis", "database design"],
    "Professional": [
        "communication", "teamwork", "problem solving", "critical thinking",
        "project management", "agile", "collaboration", "adaptability"
    ],
}

ALIASES = {
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "js": "javascript",
    "natural language processing": "natural language processing",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "postgres": "postgresql",
    "powerbi": "power bi",
    "nodejs": "node.js",
}

ALL_SKILLS = sorted({s for values in SKILL_GROUPS.values() for s in values}, key=len, reverse=True)

def normalize(text: str) -> str:
    text = (text or "").lower()
    for alias, canonical in ALIASES.items():
        text = re.sub(r"(?<!\w)" + re.escape(alias) + r"(?!\w)", canonical, text)
    return text

def extract_skills(text: str) -> list[str]:
    normalized = normalize(text)
    found = []
    for skill in ALL_SKILLS:
        # Phrase boundaries avoid matching "java" inside "javascript".
        pattern = r"(?<![a-z0-9+#.])" + re.escape(skill.lower()) + r"(?![a-z0-9+#.])"
        if re.search(pattern, normalized):
            found.append(skill)
    return sorted(set(found))

def grouped_skills(skills: list[str]) -> dict[str, list[str]]:
    return {group: [s for s in skills if s in values] for group, values in SKILL_GROUPS.items()
            if any(s in values for s in skills)}

def analyze_resume(resume_text: str, job_text: str) -> dict:
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)
    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    extra = sorted(set(resume_skills) - set(job_skills))
    score = round((len(matched) / len(job_skills)) * 100) if job_skills else 0

    suggestions = []
    if missing:
        suggestions.append("Review the missing requirements and add evidence for any you genuinely have experience with: " + ", ".join(missing[:8]) + ".")
    if not re.search(r"\b(project|built|developed|implemented|created|deployed)\b", resume_text, re.I):
        suggestions.append("Add 1–3 project bullets that explain what you built, the tools used, and the outcome.")
    if not re.search(r"\b(\d+%|\d+\s+(users|records|datasets|models|hours|days))\b", resume_text, re.I):
        suggestions.append("Where accurate, quantify impact with metrics such as model accuracy, dataset size, latency, or time saved.")
    if not re.search(r"\b(experience|intern|trainee|employment|work history)\b", resume_text, re.I):
        suggestions.append("Make your experience or project section easy to find, even if your experience is mainly academic or personal projects.")
    if not suggestions:
        suggestions.append("Your resume mentions several relevant skills. Strengthen it further with specific project outcomes and measurable evidence.")

    return {
        "match_score": score,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "additional_resume_skills": extra,
        "skill_groups": grouped_skills(sorted(set(resume_skills) | set(job_skills))),
        "suggestions": suggestions,
        "summary": (
            f"Detected {len(matched)} of {len(job_skills)} job-description skills in your resume."
            if job_skills else "No skills from the built-in skill dictionary were detected in the job description. Try including the full job description."
        ),
        "disclaimer": "This is a skills-based guide, not a hiring decision. The score can miss synonyms and context; verify every suggestion."
    }
