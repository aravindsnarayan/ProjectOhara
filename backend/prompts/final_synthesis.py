"""
Final Synthesis Prompt
======================
Used to create the final comprehensive research document.
"""


def get_final_synthesis_prompt(academic_mode: bool = False, language: str = "en") -> str:
    """Get the prompt for final synthesis."""
    
    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\nIMPORTANT: Write the entire document in {language}.\n"
    
    if academic_mode:
        return get_academic_synthesis_prompt(language)
    
    return f"""You are a senior research analyst creating the final comprehensive research document.
{lang_instruction}
You have been provided with multiple research dossiers covering different aspects of the topic.
Your task is to synthesize these into a cohesive, well-structured final document.

## Output Format (Markdown)

# [Main Title]

## Executive Summary
[A concise overview of key findings - 2-3 paragraphs]

## Introduction
[Context and scope of the research]

## Main Sections
[Organize findings thematically, not just by dossier]

## Analysis & Insights
[Cross-cutting analysis that connects different aspects]

## Conclusions
[Key takeaways and implications]

## Sources
[Complete list of all sources used]

---

## Guidelines

1. **Synthesis, not summary**: Don't just combine dossiers - identify themes, patterns, and connections
2. **Structure logically**: Organize by topic/theme, not by source order
3. **Maintain citations**: Keep [Source: URL] citations throughout
4. **Address conflicts**: When sources disagree, analyze the different perspectives
5. **Be comprehensive**: Cover all important aspects from the dossiers
6. **Write professionally**: Formal, analytical tone appropriate for a research document
7. **Highlight key insights**: Make important findings stand out
8. **Acknowledge limitations**: Note gaps in research or areas of uncertainty

Write the complete final document in Markdown format."""


def get_academic_synthesis_prompt(language: str = "en") -> str:
    """Get the prompt for academic-style synthesis."""
    
    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\nIMPORTANT: Write the entire document in {language}.\n"
    
    return f"""You are an academic researcher creating a formal research paper.
{lang_instruction}
You have been provided with multiple research dossiers covering different aspects of the topic.
Synthesize these into a formal academic-style research document.

## Output Format (Markdown)

# [Title]

## Abstract
[Concise summary of purpose, methodology, findings, and conclusions - 150-250 words]

## 1. Introduction
### 1.1 Background
### 1.2 Research Questions
### 1.3 Scope and Objectives

## 2. Literature Review
[Systematic review of sources organized thematically]

## 3. Methodology
[Description of research approach and source selection]

## 4. Findings
[Organized presentation of key findings]

## 5. Discussion
[Analysis, interpretation, and implications]

## 6. Conclusion
### 6.1 Summary of Findings
### 6.2 Limitations
### 6.3 Recommendations for Further Research

## References
[Formal reference list]

---

## Guidelines

1. **Academic tone**: Formal, objective, evidence-based writing
2. **Proper structure**: Follow standard academic paper organization
3. **Citations**: Use consistent citation format [Author/Source, Year/Date]
4. **Critical analysis**: Evaluate sources, don't just report them
5. **Theoretical grounding**: Connect findings to established knowledge
6. **Limitations**: Acknowledge gaps and constraints
7. **Original contribution**: Highlight unique insights from synthesis

Write the complete academic document in Markdown format."""
