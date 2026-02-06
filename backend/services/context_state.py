"""
Context State Manager
=====================
Manages research context state throughout the pipeline.

This module provides the ContextState dataclass that tracks all research
state including queries, URLs, clarifications, plans, dossiers, learnings,
and source registry for citation management.

Principle: JSON is silver, no JSON is gold.
- Internal: Python dataclass with dict methods
- For LLM: Clearly formatted text with markers
- Parsing: Regex on text patterns
"""

from dataclasses import dataclass, field
from typing import Optional, Any
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)


@dataclass
class ContextState:
    """
    Research context that travels through the pipeline.

    Tracks the complete state of a research session including:
    - Session metadata (id, title, step)
    - User query and search queries
    - URLs selected from search results
    - Clarification Q&A
    - Research plan points
    - Completed dossiers with citations
    - Accumulated key learnings for anti-redundancy
    - Global source registry for citation numbering

    Attributes:
        session_id: Unique identifier for this research session.
        session_title: Human-readable title for the session.
        original_query: The user's initial research question.
        current_step: Current step in the pipeline (1-6).
        queries: Generated search queries from overview.
        urls: Selected URLs from search results.
        search_results: Raw search results by query.
        clarification_questions: Follow-up questions generated.
        clarification_answers: User's answers to follow-up questions.
        plan_points: Research plan points.
        plan_version: Version of the research plan.
        dossiers: Completed dossier documents by point.
        key_learnings: Accumulated key learnings from all dossiers.
        source_registry: Global mapping of citation number to URL.
        source_counter: Next available citation number.
        language: Research language code.
        academic_mode: Whether academic-style research is enabled.
    """

    # Session metadata
    session_id: str = field(default_factory=lambda: str(uuid4()))
    session_title: str = ""
    original_query: str = ""
    current_step: int = 0

    # Step 1: Overview queries
    queries: list[str] = field(default_factory=list)

    # Step 2: Search results and URLs
    urls: list[str] = field(default_factory=list)
    search_results: dict[str, list[dict]] = field(default_factory=dict)

    # Step 3: Clarification
    clarification_questions: list[str] = field(default_factory=list)
    clarification_answers: list[str] = field(default_factory=list)

    # Step 4: Research plan
    plan_points: list[str] = field(default_factory=list)
    plan_version: int = 0

    # Step 5: Deep research dossiers
    dossiers: list[dict[str, Any]] = field(default_factory=list)
    key_learnings: list[str] = field(default_factory=list)

    # Source tracking
    source_registry: dict[int, str] = field(default_factory=dict)
    source_counter: int = 1

    # Settings
    language: str = "en"
    academic_mode: bool = False

    # === SETTERS ===

    def set_query(self, query: str) -> None:
        """Set the original user query."""
        self.original_query = query
        logger.debug(f"Set original query: {query[:50]}...")

    def set_title(self, title: str) -> None:
        """Set session title from overview."""
        self.session_title = title
        logger.debug(f"Set session title: {title}")

    def set_queries(self, queries: list[str]) -> None:
        """Set generated search queries."""
        self.queries = queries
        logger.debug(f"Set {len(queries)} search queries")

    def set_urls(self, urls: list[str]) -> None:
        """Set selected URLs from search."""
        self.urls = urls
        logger.debug(f"Set {len(urls)} selected URLs")

    def set_search_results(self, results: dict[str, list[dict]]) -> None:
        """Set raw search results."""
        self.search_results = results
        total = sum(len(r) for r in results.values())
        logger.debug(f"Set search results: {len(results)} queries, {total} results")

    def add_clarification(self, questions: list[str]) -> None:
        """Add follow-up questions from clarification step."""
        self.clarification_questions = questions
        logger.debug(f"Added {len(questions)} clarification questions")

    def add_answers(self, answers: list[str]) -> None:
        """Add user answers to follow-up questions."""
        self.clarification_answers = answers
        logger.debug(f"Added {len(answers)} user answers")

    def set_plan(self, plan_points: list[str]) -> None:
        """
        Set research plan points (replaces previous plan).

        Args:
            plan_points: List of research plan point strings.
        """
        self.plan_points = plan_points
        self.plan_version += 1
        logger.debug(f"Set research plan v{self.plan_version} with {len(plan_points)} points")

    # === KEY LEARNINGS (Anti-Redundancy) ===

    def update_key_learnings(self, learnings: str | list[str]) -> None:
        """
        Add new key learnings to the accumulated list.

        Used for anti-redundancy: subsequent dossiers can reference
        previous learnings to avoid repeating information.

        Args:
            learnings: String or list of strings containing key learnings.
        """
        if isinstance(learnings, list):
            for learning in learnings:
                if learning and learning.strip():
                    self.key_learnings.append(learning.strip())
        elif learnings and learnings.strip():
            self.key_learnings.append(learnings.strip())
            logger.debug(f"Added key learnings (total: {len(self.key_learnings)})")

    def get_previous_learnings(self, limit: int = 5) -> str:
        """
        Get recent key learnings for anti-redundancy context.

        Args:
            limit: Maximum number of recent learnings to return.

        Returns:
            Formatted string of recent key learnings, or "None yet"
            if no learnings have been accumulated.
        """
        if not self.key_learnings:
            return "None yet"

        recent = self.key_learnings[-limit:]
        return "\n".join(f"- {learning}" for learning in recent)

    def get_all_learnings(self) -> list[str]:
        """
        Get all accumulated key learnings.

        Returns:
            List of all key learning strings.
        """
        return self.key_learnings.copy()

    # === SOURCE REGISTRY ===

    def add_sources(self, urls: list[str]) -> dict[int, str]:
        """
        Add URLs to the global source registry.

        Assigns sequential citation numbers to each URL. These numbers
        are used for [N] citations in dossiers and the final report.

        Args:
            urls: List of URLs to register.

        Returns:
            Dict mapping citation numbers to URLs for the added sources.
        """
        new_sources = {}
        for url in urls:
            # Check if URL already registered
            existing = next(
                (num for num, u in self.source_registry.items() if u == url),
                None
            )
            if existing:
                new_sources[existing] = url
            else:
                self.source_registry[self.source_counter] = url
                new_sources[self.source_counter] = url
                self.source_counter += 1

        logger.debug(f"Registered {len(new_sources)} sources (total: {len(self.source_registry)})")
        return new_sources

    def get_source_url(self, citation_num: int) -> Optional[str]:
        """
        Get URL for a citation number.

        Args:
            citation_num: The [N] citation number.

        Returns:
            The URL if found, None otherwise.
        """
        return self.source_registry.get(citation_num)

    def get_all_sources(self) -> dict[int, str]:
        """
        Get the complete source registry.

        Returns:
            Dict mapping all citation numbers to URLs.
        """
        return self.source_registry.copy()

    # === DOSSIER MANAGEMENT ===

    def add_dossier(
        self,
        point: str,
        dossier_text: str,
        sources: list[str],
        learnings: Optional[str] = None,
    ) -> None:
        """
        Add a completed dossier.

        Args:
            point: The research plan point this dossier covers.
            dossier_text: The full dossier content.
            sources: List of URLs used as sources.
            learnings: Optional key learnings extracted from dossier.
        """
        self.dossiers.append({
            "point": point,
            "dossier": dossier_text,
            "sources": sources,
            "point_number": len(self.dossiers) + 1,
        })

        # Register sources and update learnings
        self.add_sources(sources)
        if learnings:
            self.update_key_learnings(learnings)

        logger.debug(f"Added dossier for point: {point[:50]}...")

    def get_dossiers(self) -> list[dict[str, Any]]:
        """
        Get all completed dossiers.

        Returns:
            List of dossier dicts with point, dossier text, and sources.
        """
        return self.dossiers.copy()

    # === LLM FORMATTING ===

    def format_for_llm(self) -> str:
        """
        Format the complete state as readable text for the LLM.

        Returns:
            Clearly structured text that the LLM can understand.
        """
        lines = []

        # User Query - always present
        lines.append("=== YOUR TASK ===")
        lines.append(self.original_query)
        lines.append("")

        # Search queries if present
        if self.queries:
            lines.append("=== SEARCH QUERIES ===")
            for i, q in enumerate(self.queries, 1):
                lines.append(f"{i}. {q}")
            lines.append("")

        # Selected URLs if present
        if self.urls:
            lines.append("=== SELECTED SOURCES ===")
            for i, url in enumerate(self.urls, 1):
                lines.append(f"{i}. {url}")
            lines.append("")

        # Follow-up questions if present
        if self.clarification_questions:
            lines.append("=== FOLLOW-UP QUESTIONS ===")
            for i, q in enumerate(self.clarification_questions, 1):
                lines.append(f"{i}. {q}")
            lines.append("")

        # User answers if present
        if self.clarification_answers:
            lines.append("=== USER ANSWERS ===")
            for i, a in enumerate(self.clarification_answers, 1):
                lines.append(f"{i}. {a}")
            lines.append("")

        # Research plan if present
        if self.plan_points:
            lines.append(f"=== RESEARCH PLAN (v{self.plan_version}) ===")
            for i, point in enumerate(self.plan_points, 1):
                lines.append(f"({i}) {point}")
            lines.append("")

        # Key learnings if present
        if self.key_learnings:
            lines.append("=== KEY LEARNINGS ===")
            for learning in self.key_learnings[-5:]:  # Last 5 for context
                lines.append(f"- {learning}")
            lines.append("")

        return "\n".join(lines)

    def format_plan_for_user(self) -> str:
        """
        Format only the plan for user display.

        Returns:
            Plan as formatted markdown text.
        """
        if not self.plan_points:
            return "No research plan available."

        lines = ["**Research Plan:**", ""]
        for i, point in enumerate(self.plan_points, 1):
            lines.append(f"({i}) {point}")

        return "\n".join(lines)

    def format_dossiers_for_synthesis(self) -> str:
        """
        Format all dossiers for the synthesis step.

        Returns:
            Formatted string with all dossiers labeled.
        """
        if not self.dossiers:
            return "No dossiers available."

        parts = []
        for i, d in enumerate(self.dossiers, 1):
            parts.append(f"=== DOSSIER {i}: {d['point']} ===")
            parts.append(d['dossier'])
            parts.append("")

        return "\n".join(parts)

    def format_sources_for_report(self) -> str:
        """
        Format source registry as a reference list.

        Returns:
            Formatted source list with citation numbers.
        """
        if not self.source_registry:
            return "No sources registered."

        lines = ["## Sources", ""]
        for num in sorted(self.source_registry.keys()):
            url = self.source_registry[num]
            lines.append(f"[{num}] {url}")

        return "\n".join(lines)

    # === SERIALIZATION ===

    def to_dict(self) -> dict[str, Any]:
        """
        Serialize state to dictionary for storage/transmission.

        Returns:
            Dict representation of the complete state.
        """
        return {
            "session_id": self.session_id,
            "session_title": self.session_title,
            "original_query": self.original_query,
            "current_step": self.current_step,
            "queries": self.queries,
            "urls": self.urls,
            "search_results": self.search_results,
            "clarification_questions": self.clarification_questions,
            "clarification_answers": self.clarification_answers,
            "plan_points": self.plan_points,
            "plan_version": self.plan_version,
            "dossiers": self.dossiers,
            "key_learnings": self.key_learnings,
            "source_registry": {str(k): v for k, v in self.source_registry.items()},
            "source_counter": self.source_counter,
            "language": self.language,
            "academic_mode": self.academic_mode,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ContextState":
        """
        Deserialize state from dictionary.

        Args:
            data: Dict previously created by to_dict().

        Returns:
            Reconstructed ContextState instance.
        """
        state = cls()
        state.session_id = data.get("session_id", state.session_id)
        state.session_title = data.get("session_title", "")
        state.original_query = data.get("original_query", "")
        state.current_step = data.get("current_step", 0)
        state.queries = data.get("queries", [])
        state.urls = data.get("urls", [])
        state.search_results = data.get("search_results", {})
        state.clarification_questions = data.get("clarification_questions", [])
        state.clarification_answers = data.get("clarification_answers", [])
        state.plan_points = data.get("plan_points", [])
        state.plan_version = data.get("plan_version", 0)
        state.dossiers = data.get("dossiers", [])
        state.key_learnings = data.get("key_learnings", [])
        # Convert string keys back to int for source_registry
        raw_registry = data.get("source_registry", {})
        state.source_registry = {int(k): v for k, v in raw_registry.items()}
        state.source_counter = data.get("source_counter", 1)
        state.language = data.get("language", "en")
        state.academic_mode = data.get("academic_mode", False)
        return state

    # === UTILITIES ===

    def reset(self) -> None:
        """Reset state for a new research session (keeps session_id)."""
        self.session_title = ""
        self.original_query = ""
        self.current_step = 0
        self.queries = []
        self.urls = []
        self.search_results = {}
        self.clarification_questions = []
        self.clarification_answers = []
        self.plan_points = []
        self.plan_version = 0
        self.dossiers = []
        self.key_learnings = []
        self.source_registry = {}
        self.source_counter = 1
        logger.debug(f"Reset state for session {self.session_id}")

    def get_progress(self) -> dict[str, Any]:
        """
        Get current research progress summary.

        Returns:
            Dict with progress metrics.
        """
        return {
            "session_id": self.session_id,
            "session_title": self.session_title,
            "current_step": self.current_step,
            "queries_count": len(self.queries),
            "urls_count": len(self.urls),
            "plan_points_count": len(self.plan_points),
            "dossiers_completed": len(self.dossiers),
            "total_sources": len(self.source_registry),
            "total_learnings": len(self.key_learnings),
        }

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"ContextState(session_id={self.session_id!r}, "
            f"query={self.original_query[:30]!r}..., "
            f"step={self.current_step}, "
            f"dossiers={len(self.dossiers)})"
        )
