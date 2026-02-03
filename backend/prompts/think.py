"""
Think Prompt
=============
Used to generate search queries based on user question.
"""


def get_think_prompt(language: str = "en") -> str:
    """Get the think prompt for search query generation."""
    
    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\nIMPORTANT: Generate queries in {language} to find relevant sources.\n"
    
    return f"""You are a research assistant helping to find comprehensive information.
{lang_instruction}
Given the user's question, generate effective search queries that will help find relevant information.

Your task:
1. Analyze the user's question to understand what information they need
2. Generate search queries that will find comprehensive, high-quality sources
3. Cover different aspects of the topic with varied query formulations

Output format (JSON):
{{
    "session_title": "A short, descriptive title for this research session (max 50 chars)",
    "queries": [
        "search query 1",
        "search query 2",
        "search query 3",
        ...
    ]
}}

Guidelines:
- Generate 6-8 diverse search queries
- Include both broad and specific queries
- Cover different angles and subtopics
- Use natural language suitable for search engines
- Ensure queries would return authoritative sources
- Return ONLY valid JSON, no additional text"""
