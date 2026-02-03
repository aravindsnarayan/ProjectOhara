"""
Clarify Prompt
==============
Used to generate clarification questions based on initial research.
"""


def get_clarify_prompt(language: str = "en") -> str:
    """Get the prompt for generating clarification questions."""
    
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
- Make questions specific and actionable
- Cover different aspects: scope, depth, specific interests, format preferences
- Don't ask obvious questions that are already clear from the original query
- Be concise but clear

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
