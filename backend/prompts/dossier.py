"""
Dossier Prompt
==============
Used to create detailed research dossiers for each plan point.
"""


def get_dossier_prompt(language: str = "en") -> str:
    """Get the prompt for dossier creation."""
    
    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\nIMPORTANT: Write the dossier in {language}.\n"
    
    return f"""You are a research analyst creating a comprehensive dossier on a specific topic.
{lang_instruction}
Your task is to synthesize the provided source materials into a well-structured, informative dossier
that addresses the research point thoroughly.

Output format (Markdown):
# [Topic Title]

## Key Findings
[Summarize the most important discoveries]

## Detailed Analysis
[In-depth analysis with proper structure]

## Evidence & Sources
[Key quotes and data points with source attribution]

## Implications
[What this means for the overall research question]

---

Guidelines:
- Write in a professional, analytical tone
- Cite sources throughout using [Source: URL] format
- Synthesize information, don't just list it
- Highlight agreements and contradictions between sources
- Be thorough but concise
- Use bullet points and headers for clarity
- If information is missing or uncertain, acknowledge it

Write the complete dossier in Markdown format."""
