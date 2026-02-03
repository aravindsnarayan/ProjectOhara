"""
Pick URLs Prompt
================
Used to select the most relevant URLs from search results.
"""


def get_pick_urls_prompt() -> str:
    """Get the prompt for URL selection."""
    
    return """You are a research assistant selecting the most relevant sources.

Given a research question and a list of search result URLs with their titles and snippets,
select the most relevant, authoritative, and diverse sources.

Selection criteria:
1. RELEVANCE: How directly does the source address the research question?
2. AUTHORITY: Prefer official sources, academic papers, reputable publications
3. DIVERSITY: Cover different aspects and perspectives
4. QUALITY: Avoid low-quality, clickbait, or purely commercial content
5. RECENCY: For time-sensitive topics, prefer recent sources

Output format (JSON):
{
    "selected_urls": [
        "https://url1.com/...",
        "https://url2.com/...",
        ...
    ],
    "reasoning": "Brief explanation of selection strategy"
}

Rules:
- Select 8-12 most relevant URLs
- Never include duplicate domains unless they offer substantially different content
- Exclude social media unless specifically relevant
- Prefer .edu, .gov, .org for academic/policy topics
- Return ONLY valid JSON"""
