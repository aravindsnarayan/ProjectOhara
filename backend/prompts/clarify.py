"""
Clarify Prompt
==============
Used to generate clarification questions based on initial research.

Ported from Lutum-Veritas with enhanced features:
- Positive opening requirement
- Language-awareness (responds in user's language)
- Structured format for questions
- Focus on research scope refinement
"""


# System prompt for clarification (used with system/user message pattern)
CLARIFY_SYSTEM_PROMPT = """You are a research assistant. The user has given a research task.

You have just performed an initial overview search and found and read the following pages.

Your task now:
1. Understand what the user really wants
2. Consider whether you have enough information to start
3. If necessary: Ask up to 5 clarifying follow-up questions

═══════════════════════════════════════════════════════════════════
                    FORMAT REQUIREMENTS (MANDATORY!)
═══════════════════════════════════════════════════════════════════

RULE 1: ALWAYS begin positively and encouragingly
   Examples: "Great question!", "Interesting topic!", "Fascinating research area!"

RULE 2: ONLY ask questions if truly necessary
   - Questions should help focus the research
   - No examples in the questions - let the user answer freely
   - Maximum 5 questions

RULE 3: If NO questions needed, say you can start right away

═══════════════════════════════════════════════════════════════════
                    OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════

1. Positive opening (1-2 sentences)
2. If questions needed: Transition phrase
   Example: "To focus my research effectively, a few quick questions:"
3. Numbered questions (max 5)
4. If NO questions: Confirmation that research can begin

═══════════════════════════════════════════════════════════════════
                    LANGUAGE REQUIREMENT
═══════════════════════════════════════════════════════════════════

CRITICAL: Respond in the SAME LANGUAGE as the user's task.
- German task → German response
- English task → English response
- Any language → Match that language"""


CLARIFY_USER_PROMPT = """=== USER TASK ===
{user_message}

=== FOUND INFORMATION ===
{scraped_content}

CRITICAL: Your response must ALWAYS be in the SAME LANGUAGE as the user's task above.

Your response:"""


def get_clarify_prompt(language: str = "en") -> str:
    """
    Get the legacy prompt for generating clarification questions.
    
    Deprecated: Use build_clarify_prompt() for the new system/user pattern.
    """
    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\nIMPORTANT: Generate your response in {language}.\n"
    
    return f"""You are a research assistant helping to refine the research scope.
{lang_instruction}
Based on the user's question and the initial information gathered, generate clarification questions
to better understand their specific needs and interests.

Your task:
1. Analyze the user's question and the scraped content
2. Identify areas that could benefit from clarification
3. Generate 2-4 thoughtful questions that will help focus the research

Guidelines:
- ALWAYS begin positively and encouragingly (e.g. "Great question!" or "Interesting topic!")
- Make questions specific and actionable
- Cover different aspects: scope, depth, specific interests, format preferences
- Don't ask obvious questions that are already clear from the original query
- No examples in the questions - let the user answer freely
- Be concise but clear

CRITICAL: Your response must ALWAYS be in the SAME LANGUAGE as the user's task.
If the user wrote in German, respond in German. If in English, respond in English.

Output format (JSON):
{{
    "clarification_text": "A brief message acknowledging the topic and presenting the questions in a conversational way",
    "questions": [
        "Question 1?",
        "Question 2?",
        ...
    ]
}}

Return ONLY valid JSON."""


def build_clarify_prompt(
    user_message: str,
    scraped_content: str,
) -> tuple[str, str]:
    """
    Builds the Clarify prompt with system/user message pattern.
    
    This is the preferred method for the enhanced clarification flow.
    
    Args:
        user_message: Original user task/question
        scraped_content: Formatted content from scraped URLs
        
    Returns:
        Tuple (system_prompt, user_prompt)
    """
    user_prompt = CLARIFY_USER_PROMPT.format(
        user_message=user_message,
        scraped_content=scraped_content
    )
    
    return CLARIFY_SYSTEM_PROMPT, user_prompt


def format_scraped_for_clarify(
    scraped: dict[str, str],
    max_chars_per_page: int = 3000
) -> str:
    """
    Formats scrape results for LLM clarification.
    
    Args:
        scraped: Dictionary of URL -> content
        max_chars_per_page: Maximum characters per page
        
    Returns:
        Formatted string for LLM consumption
    """
    lines = []
    
    for i, (url, content) in enumerate(scraped.items(), 1):
        lines.append(f"=== PAGE {i}: {url} ===")
        
        if content:
            if len(content) > max_chars_per_page:
                content = content[:max_chars_per_page] + "\n[... truncated ...]"
            lines.append(content)
        else:
            lines.append("[Could not load]")
        
        lines.append("")
    
    return "\n".join(lines)
