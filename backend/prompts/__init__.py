"""Prompts Package - LLM system prompts for the research pipeline."""

from .think import get_think_prompt
from .pick_urls import get_pick_urls_prompt
from .dossier import get_dossier_prompt
from .final_synthesis import get_final_synthesis_prompt
from .clarify import get_clarify_prompt
from .plan import get_plan_prompt

__all__ = [
    "get_think_prompt",
    "get_pick_urls_prompt",
    "get_dossier_prompt",
    "get_final_synthesis_prompt",
    "get_clarify_prompt",
    "get_plan_prompt",
]
