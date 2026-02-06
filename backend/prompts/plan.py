"""
Plan Prompt
===========
Used to create a structured research plan.

Ported from Lutum-Veritas with enhanced features:
- Hard rules (mandatory format)
- Quality mini-structure (Goal/Search Queries/Filters/Output/Validation)
- Ledger types reference for structured output
- Anti-drift scope control
"""

import re
from typing import Optional


PLAN_SYSTEM_PROMPT = """You are a research expert who creates deep, reproducible research plans.

YOUR GOAL:
Create a research plan that is so concrete that another researcher can execute it 1:1
(including search strings, filters, expected deliverables).

═══════════════════════════════════════════════════════════════════
                         HARD RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

- Output consists ONLY of numbered points: (1), (2), (3) ...
- Between EVERY point: an EMPTY LINE.
- Each point begins with a verb (Search, Research, Identify, Check, Investigate, Compare, Extract, Validate ...).
- No introduction, no meta-explanation, no conclusion outside the points.
- At least 5 points; more if thematically necessary.
- NO scope drift: Keep time windows and platforms exactly as specified.

═══════════════════════════════════════════════════════════════════
                         QUALITY (MANDATORY)
═══════════════════════════════════════════════════════════════════

Each point MUST contain this mini-structure:

a) **Goal** (1 sentence): What exactly should be found/verified?
b) **Search Queries**: At least 2 concrete search queries (with operators if useful)
c) **Filters/Constraints**: e.g. time period, platform, language, etc.
d) **Output**: What artifact is produced? (List, table, comparison)
e) **Validation** (1 sentence): How do you check relevance/quality?

═══════════════════════════════════════════════════════════════════
                         LEDGER TYPES (Reference)
═══════════════════════════════════════════════════════════════════

Write in each point which ledger is filled:

**Repo Ledger** (for GitHub/GitLab):
Repo | Link | Tech/Keyword | Claim (1 sentence) | Evidence Snippet | Maturity | Notes

**Paper Ledger** (for Arxiv/Papers):
Paper | Link | Year | Contribution | Key Result | Evidence Snippet | Limitations

**Thread Ledger** (for Reddit/HN/Forums):
Platform | Link | Topic | Main Argument | Takeaway | Evidence Snippet | Credibility

**Issue Ledger** (for GitHub Issues/PRs):
Project | Issue/PR | Status | Feature | Link | Notes

═══════════════════════════════════════════════════════════════════
                         EXAMPLE FORMAT
═══════════════════════════════════════════════════════════════════

(1) Search for GitHub repositories implementing adaptive RAG chunking.
**Goal:** Identify active open-source projects that implement dynamic chunk sizing.
**Search Queries:** "adaptive chunking RAG" site:github.com, "dynamic chunk size langchain"
**Filters:** Only repos with >10 stars, last commit <12 months
**Output:** Repo Ledger with 5-10 entries
**Validation:** Repo must have working code, not just README.

(2) Research r/LocalLLaMA for experience reports on chunking strategies.
**Goal:** Collect practical insights from the community on chunking problems.
**Search Queries:** "chunking" site:reddit.com/r/LocalLLaMA, "chunk size RAG reddit"
**Filters:** Posts from last 6 months, >10 upvotes
**Output:** Thread Ledger with bottlenecks and workarounds
**Validation:** Only threads with concrete experiences, no unanswered questions.

(3) ...etc.

═══════════════════════════════════════════════════════════════════
CRITICAL: Your research plan must ALWAYS be in the SAME LANGUAGE as the user's query/question. Match the user's language exactly.
═══════════════════════════════════════════════════════════════════"""


PLAN_USER_PROMPT = """
# CONTEXT

## User Query
{user_query}

{clarification_block}

---

# TASK

Create a deep research plan (at least 5 points) based on the context above.
Use the specified format with Goal/Search Queries/Filters/Output/Validation per point.
Each point must be numbered (1), (2), (3) etc. with an empty line between points.
"""


def get_plan_prompt(academic_mode: bool = False, language: str = "en") -> str:
    """Get the plan system prompt.
    
    DEPRECATED: Use build_plan_prompt() for full functionality.
    Kept for backwards compatibility.
    """
    prompt = PLAN_SYSTEM_PROMPT
    
    if language != "en":
        prompt += f"\nCRITICAL - LANGUAGE: Create the plan in {language}.\n"
    
    if academic_mode:
        prompt += """

ACADEMIC MODE ENABLED:
- Include methodology considerations
- Plan for literature review sections
- Consider theoretical frameworks
- Include citation and source verification steps
- Focus on peer-reviewed sources when available
"""
    
    return prompt


def build_plan_prompt(
    user_query: str,
    clarification_questions: list[str] | None = None,
    clarification_answers: list[str] | None = None,
    academic_mode: bool = False,
    language: str = "en"
) -> tuple[str, str]:
    """
    Builds the Plan prompt with full context.

    Args:
        user_query: Main task/question from user
        clarification_questions: List of follow-up questions asked (optional)
        clarification_answers: List of user's answers (optional)
        academic_mode: Whether to use academic research structure
        language: Response language (default: en)

    Returns:
        Tuple (system_prompt, user_prompt)
    """
    # Format clarification block
    if clarification_questions and clarification_answers:
        qa_pairs = []
        for i, (q, a) in enumerate(zip(clarification_questions, clarification_answers), 1):
            qa_pairs.append(f"**Q{i}:** {q}\n**A{i}:** {a}")
        
        clarification_block = f"""## Clarification Q&A

{chr(10).join(qa_pairs)}
"""
    elif clarification_answers:
        # Just answers without questions
        clarification_block = f"""## User's Additional Context

{chr(10).join(f"- {a}" for a in clarification_answers)}
"""
    else:
        clarification_block = ""

    user_prompt = PLAN_USER_PROMPT.format(
        user_query=user_query,
        clarification_block=clarification_block
    )

    # Build system prompt with mode modifiers
    system_prompt = PLAN_SYSTEM_PROMPT
    
    if language != "en":
        system_prompt += f"\nCRITICAL - LANGUAGE: Create the plan in {language}.\n"
    
    if academic_mode:
        system_prompt += """

ACADEMIC MODE ENABLED:
- Include methodology considerations
- Plan for literature review sections  
- Consider theoretical frameworks
- Include citation and source verification steps
- Focus on peer-reviewed sources when available
"""

    return system_prompt, user_prompt


def parse_plan_points(text: str) -> list[str]:
    """
    Parses numbered plan points from LLM output.

    Expected format:
    (1) First point...
    (2) Second point...

    Args:
        text: Raw LLM output

    Returns:
        List of plan points (without numbering)
    """
    # Pattern: (1), (2), etc. at line start
    pattern = r'\((\d+)\)\s*(.+?)(?=\n\(\d+\)|\n\n|\Z)'
    matches = re.findall(pattern, text, re.DOTALL)

    points = []
    for num, content in matches:
        # Cleanup: normalize whitespace, trim
        clean_content = " ".join(content.split())
        if clean_content:
            points.append(clean_content)

    # Fallback: try numbered list format (1. 2. 3.)
    if not points:
        pattern = r'^\d+\.\s*(.+)$'
        for line in text.split('\n'):
            match = re.match(pattern, line.strip())
            if match:
                point = match.group(1).strip()
                if point:
                    points.append(point)

    return points


def format_plan(points: list[str]) -> str:
    """Formats plan points for display."""
    if not points:
        return "No plan created."

    lines = []
    for i, point in enumerate(points, 1):
        lines.append(f"({i}) {point}")

    return "\n\n".join(lines)
