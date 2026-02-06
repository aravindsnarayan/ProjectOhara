"""
Research Service
================
Business logic for the research pipeline.

Enhanced with Lutum-style prompts and ContextState tracking:
- Uses ContextState for complete research state management
- Enhanced prompt builders with academic mode support
- Key learnings flow for anti-redundancy
- Global source registry for citation management
"""

import asyncio
import re
import time
from typing import Optional, AsyncGenerator, Callable
from dataclasses import dataclass
import logging

from core import set_api_config, get_api_headers, call_chat_completion, scrape_urls_batch

# Import ContextState for state management
from services.context_state import ContextState

# Import enhanced prompt builders and parsers
from prompts.think import build_think_prompt, parse_think_response
from prompts.plan import build_plan_prompt, parse_plan_points
from prompts.clarify import build_clarify_prompt, format_scraped_for_clarify
from prompts.pick_urls import build_pick_urls_prompt, parse_pick_urls_response
from prompts.dossier import build_dossier_prompt, parse_dossier_response
from prompts.final_synthesis import build_final_synthesis_prompt, parse_final_synthesis_response

logger = logging.getLogger(__name__)


@dataclass
class ResearchEvent:
    """Event emitted during research."""
    type: str
    message: str
    data: Optional[dict] = None


# === SEARCH ENGINE ===

def _search_ddg_sync(query: str, max_results: int = 20) -> list[dict]:
    """Execute a DuckDuckGo search."""
    try:
        from ddgs import DDGS
        
        clean_query = query.strip().replace('"', '').replace("'", '')
        
        with DDGS() as ddgs:
            results = list(ddgs.text(
                clean_query,
                region="wt-wt",
                safesearch="moderate",
                max_results=max_results,
            ))
        
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            }
            for r in results
        ]
    except Exception as e:
        logger.error(f"DDG search failed: {e}")
        return []


async def search_ddg_async(query: str, max_results: int = 20) -> list[dict]:
    """Async wrapper for DDG search."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _search_ddg_sync, query, max_results)


async def execute_searches(queries: list[str], results_per_query: int = 20) -> dict[str, list[dict]]:
    """Execute multiple DDG searches."""
    all_results = {}
    
    for i, query in enumerate(queries, 1):
        logger.info(f"[{i}/{len(queries)}] DDG: {query[:40]}...")
        results = await search_ddg_async(query, results_per_query)
        all_results[query] = results
        
        if i < len(queries):
            await asyncio.sleep(1.5)
    
    return all_results


# === LEGACY PROMPTS (kept for backwards compatibility with overview step) ===

OVERVIEW_SYSTEM_PROMPT = """You analyze user research requests and generate search queries.

OUTPUT FORMAT:
=== SESSION TITLE ===
[2-5 word title for this research]

=== QUERIES ===
query 1: [search query]
query 2: [search query]
query 3: [search query]
query 4: [search query]
query 5: [search query]

Generate 5-10 diverse Google search queries to gather initial information.

CRITICAL: Respond in the SAME LANGUAGE as the user's query."""


# === LLM CALLS ===

def call_llm(
    system_prompt: str,
    user_prompt: str,
    model: str,
    timeout: int = 60,
    max_tokens: int = 8000,
) -> Optional[str]:
    """Call LLM with system and user prompts."""
    result = call_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        model=model,
        max_tokens=max_tokens,
        timeout=timeout,
    )
    
    if result.error:
        logger.error(f"LLM error: {result.error}")
        return None
    
    return result.content


def parse_urls(response: str) -> list[str]:
    """Extract URLs from LLM response (legacy fallback)."""
    url_pattern = r'https?://[^\s<>"\')\]]+[^\s<>"\')\].,;:!?]'
    matches = re.findall(url_pattern, response)
    
    seen = set()
    urls = []
    for url in matches:
        url = url.rstrip('.,;:!?')
        if url not in seen and len(urls) < 20:
            urls.append(url)
            seen.add(url)
    
    return urls


def parse_queries(response: str) -> tuple[str, list[str]]:
    """Parse session title and queries from overview response."""
    title = "New Research"
    queries = []
    
    # Extract title
    title_match = re.search(r'=== SESSION TITLE ===\s*\n(.+)', response)
    if title_match:
        title = title_match.group(1).strip()
    
    # Extract queries
    query_pattern = r'query \d+:\s*(.+)'
    for match in re.finditer(query_pattern, response, re.IGNORECASE):
        query = match.group(1).strip()
        if query:
            queries.append(query)
    
    return title, queries


def format_search_results(search_results: dict[str, list[dict]]) -> str:
    """Format search results for LLM consumption."""
    formatted = []
    counter = 1
    for query, results in search_results.items():
        formatted.append(f"=== Query: {query} ===")
        for r in results:
            formatted.append(f"[{counter}] {r['title']}")
            formatted.append(f"    URL: {r['url']}")
            formatted.append(f"    {r['snippet'][:200]}")
            formatted.append("")
            counter += 1
    return "\n".join(formatted)


def format_scraped_content(scraped: dict[str, str], max_chars: int = 10000) -> str:
    """Format scraped content for LLM consumption."""
    content_parts = []
    for url, content in scraped.items():
        if content:
            truncated = content[:max_chars] + "..." if len(content) > max_chars else content
            content_parts.append(f"=== {url} ===\n{truncated}\n")
    return "\n".join(content_parts)


# === RESEARCH PIPELINE ===

class ResearchPipeline:
    """
    Orchestrates the full research pipeline with Lutum-style prompts.
    
    Phases:
    1. Overview - Generate search queries
    2. Search - Find initial URLs
    3. Clarify - Ask follow-up questions (uses build_clarify_prompt)
    4. Plan - Create research plan (uses build_plan_prompt)
    5. Deep Research - Process each point (uses Think, Pick URLs, Dossier prompts)
    6. Synthesis - Create final report (uses build_final_synthesis_prompt)
    
    Features:
    - ContextState tracking throughout pipeline
    - Key learnings flow for anti-redundancy
    - Global source registry for citation management
    - Academic mode support with stricter prompts
    """
    
    def __init__(
        self,
        api_key: str,
        provider: str = "openrouter",
        work_model: str = "google/gemini-2.5-flash-lite-preview-09-2025",
        final_model: str = "anthropic/claude-sonnet-4.5",
        language: str = "en",
        academic_mode: bool = False,
    ):
        self.api_key = api_key
        self.provider = provider
        self.work_model = work_model
        self.final_model = final_model
        self.language = language
        self.academic_mode = academic_mode
        
        # Initialize ContextState for state management
        self.context = ContextState(
            language=language,
            academic_mode=academic_mode,
        )
        
        set_api_config(
            key=api_key,
            provider=provider,
            work_model=work_model,
            final_model=final_model,
        )
    
    def get_context(self) -> ContextState:
        """Get the current context state."""
        return self.context
    
    def set_context(self, context: ContextState) -> None:
        """Set context state (for resuming sessions)."""
        self.context = context
        self.language = context.language
        self.academic_mode = context.academic_mode
    
    async def get_overview(
        self,
        user_query: str,
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 1: Generate overview queries."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Getting overview...")
        
        # Store query in context
        self.context.set_query(user_query)
        self.context.current_step = 1
        
        response = call_llm(
            OVERVIEW_SYSTEM_PROMPT,
            f"Research request: {user_query}",
            self.work_model,
            timeout=60,
        )
        
        if not response:
            return {"error": "Failed to generate overview"}
        
        title, queries = parse_queries(response)
        
        # Update context
        self.context.set_title(title)
        self.context.set_queries(queries)
        
        emit("status", f"Generated {len(queries)} search queries")
        
        return {
            "session_title": title,
            "queries": queries,
            "raw_response": response,
            "session_id": self.context.session_id,
        }
    
    async def search_and_pick(
        self,
        user_query: str,
        queries: list[str],
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 2: Execute searches and pick URLs using enhanced pick_urls prompt."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Searching DuckDuckGo...")
        self.context.current_step = 2
        
        search_results = await execute_searches(queries)
        
        if not search_results:
            return {"error": "No search results"}
        
        # Store search results in context
        self.context.set_search_results(search_results)
        
        # Format search results
        formatted = format_search_results(search_results)
        
        emit("status", "Selecting best sources...")
        
        # Use enhanced pick_urls prompt
        system_prompt, user_prompt = build_pick_urls_prompt(
            user_query=user_query,
            current_point="Initial overview",
            thinking_block="Initial research overview - selecting diverse, high-quality sources.",
            search_results=formatted,
            previous_learnings=None,  # No learnings yet
        )
        
        pick_response = call_llm(
            system_prompt,
            user_prompt,
            self.work_model,
            timeout=60,
        )
        
        # Use enhanced parser
        urls = parse_pick_urls_response(pick_response) if pick_response else []
        
        # Fallback to regex if parser returns nothing
        if not urls and pick_response:
            urls = parse_urls(pick_response)
        
        # Store URLs in context
        self.context.set_urls(urls)
        
        emit("sources", f"Found {len(urls)} sources", {"urls": urls})
        
        return {
            "urls": urls,
            "search_results": search_results,
        }
    
    async def clarify(
        self,
        user_query: str,
        urls: list[str],
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 3: Scrape and generate clarifying questions using enhanced clarify prompt."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Reading sources...")
        self.context.current_step = 3
        
        # Limit URLs for faster processing - we can get more during deep research
        max_urls = min(len(urls), 15)
        urls_to_scrape = urls[:max_urls]
        
        scraped = await scrape_urls_batch(urls_to_scrape, timeout=12, retries_per_url=1)
        
        if not scraped:
            return {"error": "Could not scrape any URLs"}
        
        # Format scraped content using enhanced formatter
        formatted_content = format_scraped_for_clarify(scraped, max_chars_per_page=3000)
        
        emit("status", f"Analyzed {len(scraped)} sources")
        
        # Use enhanced clarify prompt
        system_prompt, user_prompt = build_clarify_prompt(
            user_message=user_query,
            scraped_content=formatted_content,
        )
        
        response = call_llm(
            system_prompt,
            user_prompt,
            self.work_model,
            timeout=60,
        )
        
        return {
            "clarification": response,
            "scraped_count": len(scraped),
        }
    
    async def create_plan(
        self,
        user_query: str,
        clarification_answers: list[str],
        clarification_questions: list[str] = None,
        academic_mode: bool = None,
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 4: Create research plan using enhanced plan prompt."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Creating research plan...")
        self.context.current_step = 4
        
        # Use instance academic_mode if not explicitly provided
        if academic_mode is None:
            academic_mode = self.academic_mode
        
        # Store clarification in context
        if clarification_questions:
            self.context.add_clarification(clarification_questions)
        if clarification_answers:
            self.context.add_answers(clarification_answers)
        
        # Use enhanced plan prompt builder
        system_prompt, user_prompt = build_plan_prompt(
            user_query=user_query,
            clarification_questions=clarification_questions,
            clarification_answers=clarification_answers,
            academic_mode=academic_mode,
            language=self.language,
        )
        
        response = call_llm(
            system_prompt,
            user_prompt,
            self.work_model,
            timeout=60,
        )
        
        # Use enhanced parser
        points = parse_plan_points(response) if response else []
        
        # Store plan in context
        self.context.set_plan(points)
        
        emit("status", f"Created plan with {len(points)} points")
        
        return {
            "plan_points": points,
            "plan_text": response,
        }
    
    async def deep_research(
        self,
        user_query: str,
        plan_points: list[str],
        academic_mode: bool = None,
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> AsyncGenerator[ResearchEvent, None]:
        """
        Step 5: Deep research - process each point with Lutum-style prompts.
        
        Uses:
        - build_think_prompt() with previous_learnings for anti-redundancy
        - build_pick_urls_prompt() with diversification
        - build_dossier_prompt() with key_learnings flow
        
        Yields events for streaming progress.
        """
        
        # Use instance academic_mode if not explicitly provided
        if academic_mode is None:
            academic_mode = self.academic_mode
        
        start_time = time.time()
        self.context.current_step = 5
        
        total_points = len(plan_points)
        
        yield ResearchEvent("status", f"Starting deep research with {total_points} points", {
            "total_points": total_points,
            "academic_mode": academic_mode,
        })
        
        for point_idx, current_point in enumerate(plan_points, 1):
            yield ResearchEvent("status", f"[{point_idx}/{total_points}] Processing: {current_point[:50]}...")
            
            # === THINK PHASE ===
            # Use build_think_prompt with previous learnings for anti-redundancy
            think_system, think_user = build_think_prompt(
                user_query=user_query,
                current_point=current_point,
                previous_learnings=self.context.get_all_learnings(),
                language=self.language,
            )
            
            think_response = call_llm(
                think_system,
                think_user,
                self.work_model,
                timeout=60,
            )
            
            if not think_response:
                yield ResearchEvent("point_complete", f"[{point_idx}] Skipped - no search strategy", {
                    "point_title": current_point,
                    "point_number": point_idx,
                    "total_points": total_points,
                    "skipped": True,
                })
                continue
            
            # Parse thinking and search queries
            thinking_block, search_queries = parse_think_response(think_response)
            
            if not search_queries:
                yield ResearchEvent("point_complete", f"[{point_idx}] Skipped - no queries", {
                    "point_title": current_point,
                    "point_number": point_idx,
                    "total_points": total_points,
                    "skipped": True,
                })
                continue
            
            # === SEARCH PHASE ===
            yield ResearchEvent("status", f"[{point_idx}] Searching ({len(search_queries)} queries)...")
            search_results = await execute_searches(search_queries, results_per_query=15)
            
            if not search_results:
                continue
            
            # Format search results
            formatted_results = format_search_results(search_results)
            
            # === PICK URLS PHASE ===
            yield ResearchEvent("status", f"[{point_idx}] Selecting sources...")
            
            # Use build_pick_urls_prompt with diversification and previous learnings
            pick_system, pick_user = build_pick_urls_prompt(
                user_query=user_query,
                current_point=current_point,
                thinking_block=thinking_block,
                search_results=formatted_results,
                previous_learnings=self.context.get_all_learnings(),
            )
            
            pick_response = call_llm(
                pick_system,
                pick_user,
                self.work_model,
                timeout=60,
            )
            
            # Use enhanced parser
            urls = parse_pick_urls_response(pick_response) if pick_response else []
            
            # Fallback to regex if parser returns nothing
            if not urls and pick_response:
                urls = parse_urls(pick_response)
            
            if not urls:
                continue
            
            yield ResearchEvent("sources", f"[{point_idx}] {len(urls)} sources", {"urls": urls})
            
            # === SCRAPE PHASE ===
            yield ResearchEvent("status", f"[{point_idx}] Reading sources...")
            scraped = await scrape_urls_batch(urls, timeout=30)
            
            if not scraped:
                continue
            
            # === DOSSIER PHASE ===
            yield ResearchEvent("status", f"[{point_idx}] Creating dossier...")
            
            # Format scraped content
            scraped_content = format_scraped_content(scraped, max_chars=10000)
            
            # Use build_dossier_prompt with academic mode support
            dossier_system, dossier_user = build_dossier_prompt(
                user_query=user_query,
                current_point=current_point,
                thinking_block=thinking_block,
                scraped_content=scraped_content,
                academic_mode=academic_mode,
            )
            
            dossier_response = call_llm(
                dossier_system,
                dossier_user,
                self.work_model,
                timeout=120,
                max_tokens=12000,
            )
            
            if not dossier_response:
                continue
            
            # Parse dossier using enhanced parser
            dossier_text, key_learnings, citations = parse_dossier_response(dossier_response)
            
            # Get URLs that were actually scraped
            dossier_urls = list(scraped.keys())
            
            # Renumber citations globally using context source registry
            new_sources = self.context.add_sources(dossier_urls)
            
            # Remap local citations to global numbers
            for local_num, url in enumerate(dossier_urls, 1):
                # Find the global citation number for this URL
                global_num = next(
                    (num for num, u in new_sources.items() if u == url),
                    None
                )
                if global_num and global_num != local_num:
                    # Replace local [local_num] with global [global_num]
                    dossier_text = re.sub(
                        rf'\[{local_num}\](?!\d)',  # Don't match [12] when looking for [1]
                        f'[{global_num}]',
                        dossier_text
                    )
                    if key_learnings:
                        key_learnings = re.sub(
                            rf'\[{local_num}\](?!\d)',
                            f'[{global_num}]',
                            key_learnings
                        )
            
            # Add dossier to context (this also updates key_learnings)
            self.context.add_dossier(
                point=current_point,
                dossier_text=dossier_text,
                sources=dossier_urls,
                learnings=key_learnings,
            )
            
            yield ResearchEvent("point_complete", f"[{point_idx}] Complete", {
                "point_title": current_point,
                "point_number": point_idx,
                "total_points": total_points,
                "key_learnings": key_learnings,
                "dossier_full": dossier_text,
                "sources": dossier_urls,
                "citations": citations,
            })
        
        # === FINAL SYNTHESIS ===
        completed_dossiers = self.context.get_dossiers()
        
        if completed_dossiers:
            yield ResearchEvent("synthesis_start", "Starting final synthesis...", {
                "dossier_count": len(completed_dossiers),
                "total_sources": len(self.context.get_all_sources()),
            })
            
            # Use build_final_synthesis_prompt
            synthesis_system, synthesis_user = build_final_synthesis_prompt(
                user_query=user_query,
                research_plan=plan_points,
                all_dossiers=completed_dossiers,
                academic_mode=academic_mode,
                language=self.language,
            )
            
            final_document = call_llm(
                synthesis_system,
                synthesis_user,
                self.final_model,
                timeout=600,
                max_tokens=32000,
            )
            
            if not final_document:
                # Fallback: Concatenate dossiers
                final_document = "# Research Results\n\n"
                for d in completed_dossiers:
                    final_document += f"## {d['point']}\n\n{d['dossier']}\n\n---\n\n"
                
                # Add source list
                final_document += self.context.format_sources_for_report()
        else:
            final_document = "No dossiers completed."
        
        duration = time.time() - start_time
        
        yield ResearchEvent("done", f"Research complete in {duration:.1f}s", {
            "final_document": final_document,
            "total_points": len(completed_dossiers),
            "total_sources": len(self.context.get_all_sources()),
            "duration_seconds": duration,
            "source_registry": self.context.get_all_sources(),
            "session_id": self.context.session_id,
            "context": self.context.to_dict(),
        })
