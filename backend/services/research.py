"""
Research Service
================
Business logic for the research pipeline.
"""

import asyncio
import re
import time
from typing import Optional, AsyncGenerator, Callable
from dataclasses import dataclass
import logging

from core import set_api_config, get_api_headers, call_chat_completion, scrape_urls_batch

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


# === PROMPTS ===

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

Generate 5-10 diverse Google search queries to gather initial information."""

PICK_URLS_SYSTEM_PROMPT = """You select the best URLs from search results.

OUTPUT FORMAT (MANDATORY):
=== SELECTED ===
url 1: https://...
url 2: https://...
url 3: https://...
...

Select EXACTLY 10 URLs. NO analysis. NO explanation. ONLY URLs."""

CLARIFY_SYSTEM_PROMPT = """You are a research assistant. Based on the initial search results, 
ask clarifying questions to focus the research.

Start positively. Ask up to 5 follow-up questions if needed.
If no questions needed, say you can start immediately.

IMPORTANT: Respond in the SAME LANGUAGE as the user's query."""

PLAN_SYSTEM_PROMPT = """You create structured research plans.

OUTPUT FORMAT:
=== RESEARCH PLAN ===
1. [First research point]
2. [Second research point]
3. [Third research point]
...

Create 5-10 specific, actionable research points.
Respond in the SAME LANGUAGE as the user's query."""

DOSSIER_SYSTEM_PROMPT = """You create detailed research dossiers with citations.

Use [N] citations for factual statements.
Include an evidence table, analysis, and key learnings.

At the end:
=== SOURCES ===
[1] URL - Description
[2] URL - Description
...
=== END SOURCES ===

=== KEY LEARNINGS ===
1. Key finding 1
2. Key finding 2
3. Key finding 3
=== END LEARNINGS ==="""

SYNTHESIS_SYSTEM_PROMPT = """You synthesize multiple research dossiers into a comprehensive report.

Create cross-connections, identify patterns, resolve contradictions.
Use [N] citations throughout.

Include sections:
- Executive Summary
- Topic Chapters
- Synthesis & Cross-Connections
- Critical Assessment
- Source List

End with: === END REPORT ==="""


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
    """Extract URLs from LLM response."""
    url_pattern = r'https?://[^\s<>"\')\]]+[^\s<>"\')\].,;:!?]'
    matches = re.findall(url_pattern, response)
    
    seen = set()
    urls = []
    for url in matches:
        url = url.rstrip('.,;:!?')
        if url not in seen and len(urls) < 10:
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


def parse_plan(response: str) -> list[str]:
    """Parse research plan points."""
    points = []
    
    # Find numbered points
    pattern = r'^\d+\.\s*(.+)$'
    for line in response.split('\n'):
        match = re.match(pattern, line.strip())
        if match:
            point = match.group(1).strip()
            if point:
                points.append(point)
    
    return points


def parse_dossier(response: str) -> tuple[str, str, dict]:
    """Parse dossier text, key learnings, and citations."""
    dossier_text = response
    key_learnings = ""
    citations = {}
    
    # Extract sources
    sources_start = response.find('=== SOURCES ===')
    sources_end = response.find('=== END SOURCES ===')
    
    if sources_start >= 0 and sources_end > sources_start:
        sources_block = response[sources_start + len('=== SOURCES ==='):sources_end]
        for line in sources_block.strip().split('\n'):
            match = re.match(r'\[(\d+)\]\s+(.+)', line.strip())
            if match:
                num = int(match.group(1))
                citations[num] = match.group(2).strip()
    
    # Extract key learnings
    if "=== KEY LEARNINGS ===" in response:
        parts = response.split("=== KEY LEARNINGS ===")
        if len(parts) > 1:
            learnings_part = parts[1]
            if "=== END LEARNINGS ===" in learnings_part:
                key_learnings = learnings_part.split("=== END LEARNINGS ===")[0].strip()
            else:
                key_learnings = learnings_part.strip()
    
    return dossier_text, key_learnings, citations


# === RESEARCH PIPELINE ===

class ResearchPipeline:
    """
    Orchestrates the full research pipeline.
    
    Phases:
    1. Overview - Generate search queries
    2. Search - Find initial URLs
    3. Clarify - Ask follow-up questions
    4. Plan - Create research plan
    5. Deep Research - Process each point
    6. Synthesis - Create final report
    """
    
    def __init__(
        self,
        api_key: str,
        provider: str = "openrouter",
        work_model: str = "google/gemini-2.5-flash-lite-preview-09-2025",
        final_model: str = "anthropic/claude-sonnet-4.5",
        language: str = "en",
    ):
        self.api_key = api_key
        self.provider = provider
        self.work_model = work_model
        self.final_model = final_model
        self.language = language
        
        set_api_config(
            key=api_key,
            provider=provider,
            work_model=work_model,
            final_model=final_model,
        )
    
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
        
        response = call_llm(
            OVERVIEW_SYSTEM_PROMPT,
            f"Research request: {user_query}",
            self.work_model,
            timeout=60,
        )
        
        if not response:
            return {"error": "Failed to generate overview"}
        
        title, queries = parse_queries(response)
        
        emit("status", f"Generated {len(queries)} search queries")
        
        return {
            "session_title": title,
            "queries": queries,
            "raw_response": response,
        }
    
    async def search_and_pick(
        self,
        user_query: str,
        queries: list[str],
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 2: Execute searches and pick URLs."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Searching DuckDuckGo...")
        
        search_results = await execute_searches(queries)
        
        if not search_results:
            return {"error": "No search results"}
        
        # Format for LLM
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
        
        emit("status", "Selecting best sources...")
        
        pick_response = call_llm(
            PICK_URLS_SYSTEM_PROMPT,
            f"User query: {user_query}\n\nSearch results:\n" + "\n".join(formatted),
            self.work_model,
            timeout=60,
        )
        
        urls = parse_urls(pick_response) if pick_response else []
        
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
        """Step 3: Scrape and generate clarifying questions."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Reading sources...")
        
        scraped = await scrape_urls_batch(urls, timeout=20)
        
        if not scraped:
            return {"error": "Could not scrape any URLs"}
        
        # Format scraped content
        content_parts = []
        for url, content in scraped.items():
            if content:
                truncated = content[:3000] + "..." if len(content) > 3000 else content
                content_parts.append(f"=== {url} ===\n{truncated}\n")
        
        emit("status", f"Analyzed {len(scraped)} sources")
        
        response = call_llm(
            CLARIFY_SYSTEM_PROMPT,
            f"User query: {user_query}\n\n" + "\n".join(content_parts),
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
        academic_mode: bool = False,
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> dict:
        """Step 4: Create research plan."""
        
        def emit(type: str, message: str, data: dict = None):
            if on_event:
                on_event(ResearchEvent(type, message, data))
        
        emit("status", "Creating research plan...")
        
        context = f"User query: {user_query}"
        if clarification_answers:
            context += "\n\nUser's answers:\n" + "\n".join(f"- {a}" for a in clarification_answers)
        
        if academic_mode:
            context += "\n\nMode: ACADEMIC - Create hierarchical research areas with sub-points."
        
        response = call_llm(
            PLAN_SYSTEM_PROMPT,
            context,
            self.work_model,
            timeout=60,
        )
        
        points = parse_plan(response) if response else []
        
        emit("status", f"Created plan with {len(points)} points")
        
        return {
            "plan_points": points,
            "plan_text": response,
        }
    
    async def deep_research(
        self,
        user_query: str,
        plan_points: list[str],
        on_event: Optional[Callable[[ResearchEvent], None]] = None,
    ) -> AsyncGenerator[ResearchEvent, None]:
        """
        Step 5: Deep research - process each point.
        
        Yields events for streaming progress.
        """
        
        start_time = time.time()
        completed_dossiers = []
        accumulated_learnings = []
        source_registry = {}
        source_counter = 1
        
        total_points = len(plan_points)
        
        yield ResearchEvent("status", f"Starting deep research with {total_points} points")
        
        for point_idx, current_point in enumerate(plan_points, 1):
            yield ResearchEvent("status", f"[{point_idx}/{total_points}] Processing: {current_point[:50]}...")
            
            # Think: Generate search strategy
            think_prompt = f"""Research point: {current_point}
            
User's main question: {user_query}

Previous learnings:
{chr(10).join(accumulated_learnings[-5:]) if accumulated_learnings else "None yet"}

Generate 3-5 search queries for this point.

=== SEARCHES ===
search 1: [query]
search 2: [query]
search 3: [query]"""
            
            think_response = call_llm(
                "You generate search queries for research.",
                think_prompt,
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
            
            # Extract search queries
            search_queries = []
            for match in re.finditer(r'search \d+:\s*(.+)', think_response, re.IGNORECASE):
                query = match.group(1).strip()
                if query:
                    search_queries.append(query)
            
            if not search_queries:
                yield ResearchEvent("point_complete", f"[{point_idx}] Skipped - no queries", {
                    "point_title": current_point,
                    "point_number": point_idx,
                    "total_points": total_points,
                    "skipped": True,
                })
                continue
            
            # Search
            yield ResearchEvent("status", f"[{point_idx}] Searching...")
            search_results = await execute_searches(search_queries, results_per_query=15)
            
            if not search_results:
                continue
            
            # Format and pick URLs
            formatted = []
            counter = 1
            for query, results in search_results.items():
                for r in results:
                    formatted.append(f"[{counter}] {r['title']}")
                    formatted.append(f"    URL: {r['url']}")
                    formatted.append(f"    {r['snippet'][:150]}")
                    formatted.append("")
                    counter += 1
            
            yield ResearchEvent("status", f"[{point_idx}] Selecting sources...")
            
            pick_response = call_llm(
                PICK_URLS_SYSTEM_PROMPT,
                f"Research point: {current_point}\n\nResults:\n" + "\n".join(formatted),
                self.work_model,
                timeout=60,
            )
            
            urls = parse_urls(pick_response) if pick_response else []
            
            if not urls:
                continue
            
            yield ResearchEvent("sources", f"[{point_idx}] {len(urls)} sources", {"urls": urls})
            
            # Scrape
            yield ResearchEvent("status", f"[{point_idx}] Reading sources...")
            scraped = await scrape_urls_batch(urls, timeout=30)
            
            if not scraped:
                continue
            
            # Create dossier
            yield ResearchEvent("status", f"[{point_idx}] Creating dossier...")
            
            scraped_content = []
            for url, content in scraped.items():
                if content:
                    truncated = content[:10000] + "..." if len(content) > 10000 else content
                    scraped_content.append(f"=== {url} ===\n{truncated}\n")
            
            dossier_prompt = f"""Main question: {user_query}

Current research point: {current_point}

Sources:
{"".join(scraped_content)}

Create a detailed dossier with:
- Evidence table
- Analysis
- Key learnings
- Source citations [N]"""
            
            dossier_response = call_llm(
                DOSSIER_SYSTEM_PROMPT,
                dossier_prompt,
                self.work_model,
                timeout=120,
                max_tokens=12000,
            )
            
            if not dossier_response:
                continue
            
            dossier_text, key_learnings, citations = parse_dossier(dossier_response)
            
            # Renumber citations globally
            dossier_urls = list(scraped.keys())
            for i, url in enumerate(dossier_urls, 1):
                source_registry[source_counter] = url
                # Replace local [i] with global [source_counter]
                dossier_text = re.sub(rf'\[{i}\]', f'[{source_counter}]', dossier_text)
                if key_learnings:
                    key_learnings = re.sub(rf'\[{i}\]', f'[{source_counter}]', key_learnings)
                source_counter += 1
            
            completed_dossiers.append({
                "point": current_point,
                "dossier": dossier_text,
                "sources": dossier_urls,
            })
            
            if key_learnings:
                accumulated_learnings.append(key_learnings)
            
            yield ResearchEvent("point_complete", f"[{point_idx}] Complete", {
                "point_title": current_point,
                "point_number": point_idx,
                "total_points": total_points,
                "key_learnings": key_learnings,
                "dossier_full": dossier_text,
                "sources": dossier_urls,
            })
        
        # Final Synthesis
        if completed_dossiers:
            yield ResearchEvent("synthesis_start", "Starting final synthesis...", {
                "dossier_count": len(completed_dossiers),
                "total_sources": len(source_registry),
            })
            
            # Format dossiers for synthesis
            dossier_parts = []
            for i, d in enumerate(completed_dossiers, 1):
                dossier_parts.append(f"=== DOSSIER {i}: {d['point']} ===\n{d['dossier']}\n")
            
            synthesis_prompt = f"""Original question: {user_query}

Research plan:
{chr(10).join(f"{i}. {p}" for i, p in enumerate(plan_points, 1))}

Dossiers:
{"".join(dossier_parts)}

Create a comprehensive synthesis report."""
            
            final_document = call_llm(
                SYNTHESIS_SYSTEM_PROMPT,
                synthesis_prompt,
                self.final_model,
                timeout=600,
                max_tokens=32000,
            )
            
            if not final_document:
                # Fallback: Concatenate dossiers
                final_document = "# Research Results\n\n"
                for d in completed_dossiers:
                    final_document += f"## {d['point']}\n\n{d['dossier']}\n\n---\n\n"
        else:
            final_document = "No dossiers completed."
        
        duration = time.time() - start_time
        
        yield ResearchEvent("done", f"Research complete in {duration:.1f}s", {
            "final_document": final_document,
            "total_points": len(completed_dossiers),
            "total_sources": len(source_registry),
            "duration_seconds": duration,
            "source_registry": source_registry,
        })
