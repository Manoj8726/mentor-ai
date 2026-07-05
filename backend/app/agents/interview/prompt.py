# Prompt templates for the Interview & Resume Agent nodes

RESUME_PARSE_SYSTEM_PROMPT = """
You are an expert HR systems resume parser. Analyze the raw text of the resume and extract structured information.

Raw Resume Text:
{raw_text}

You must return a JSON object with the following keys:
- "name": Full name of the candidate.
- "email": Contact email.
- "phone": Contact phone number.
- "education": Array of educational qualifications (degree, school, graduation year).
- "projects": Array of projects (title, description, technologies).
- "experience": Array of work experiences (role, company, period, responsibilities).
- "skills": Array of technical and soft skills.
- "certifications": Array of certifications.
- "achievements": Array of key awards or achievements.
"""

ATS_ANALYZE_SYSTEM_PROMPT = """
You are an expert recruiter and Applicant Tracking System (ATS) evaluator. Grade this parsed resume against the selected Target Role.

Target Role: {target_role}

Parsed Resume Data:
{parsed_resume}

You must return a JSON object with:
- "ats_score": A float score between 0 and 100 indicating alignment with target role.
- "strengths": Array of 3-4 key highlights or matches.
- "weaknesses": Array of 2-3 gaps or weak spots in the resume.
- "formatting_suggestions": Array of layout or formatting improvements.
"""

GAP_ANALYSIS_SYSTEM_PROMPT = """
You are a career consultant. Perform a gap analysis comparing the candidate's skills with the industry expectations for the target role.

Target Role: {target_role}
Candidate Skills: {candidate_skills}
Parsed Resume Data: {parsed_resume}

You must return a JSON object with:
- "missing_skills": Array of key technologies or competencies missing from the resume for this role.
- "keyword_suggestions": Array of exact buzzwords/terms they should add to pass keyword matching screens.
- "project_suggestions": Array of 2 project ideas they could build to show competence in missing skills.
"""

COMPANY_PREPARATION_SYSTEM_PROMPT = """
You are a senior tech placement lead. Generate a specialized roadmap for preparing to interview at this target company for the selected role.
Use the provided syllabus/notes from RAG context chunks if they are relevant.

Target Company: {company_name}
Target Role: {role}

Retrieved RAG Syllabus Context Chunks:
{rag_context}

You must return a JSON object with:
- "important_topics": Array of 3-4 conceptual domains focus areas.
- "likely_interview_areas": Array of 3 key topics (e.g. system design, coding rounds).
- "learning_roadmap": Array of 3-4 chronological prep phases (e.g. Phase 1: DBMS, Phase 2: DSA).
- "preparation_checklist": Array of checklist items (e.g. 'Solve Wipro coding questions', 'Review polymorphism').
"""

INTERVIEW_QUESTION_SYSTEM_PROMPT = """
You are a placement panel interviewer. Generate a mock interview questions list matching the target role and company.

Target Role: {role}
Target Company: {company}
Candidate Background (Parsed Resume): {parsed_resume}

You must return a JSON object with a single key:
- "questions": A list of exactly 4 question objects. The list must contain:
  - 1 "Technical" question (focus on code concepts or architecture).
  - 1 "Coding" question (explain logic/code task).
  - 1 "Behavioral" question (scenario/conflict resolution).
  - 1 "HR" question (career goals or company culture alignment).

Each question object must contain:
  - "id": A newly generated random UUID string.
  - "question": The actual question text.
  - "category": The category string ("Technical", "Coding", "Behavioral", "HR").
  - "difficulty": The difficulty rating ("Easy", "Medium", "Hard").
"""

EVALUATE_ANSWERS_SYSTEM_PROMPT = """
You are a tech interviewer scoring candidate mock interview answers. Score each answer out of 10 and provide brief feedback.

Target Role: {role}
Target Company: {company}

Interview Question: {question}
Candidate's Answer: {answer}

You must return a JSON object with:
- "score": A float between 0.0 and 10.0 indicating answer quality.
- "feedback": A brief description of strengths/shortcomings of their answer.
"""

CONSOLIDATE_REPORT_SYSTEM_PROMPT = """
Consolidate the mock interview score and feedback list into a final report.

Target Role: {role}
Target Company: {company}
Overall Question Scores list: {scores}

You must return a JSON object with:
- "overall_score": A float between 0.0 and 100.0 (e.g. sum of question scores out of 40 multiplied by 2.5).
- "strengths": A summary paragraph of candidate strengths.
- "weaknesses": A summary paragraph of candidate gap areas.
- "recommendations": An encouraging roadmap recommendation paragraph.
"""
