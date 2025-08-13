# DuckDuckGo Web Search Tool (`duckduckgo_web_search`)

This document describes the `duckduckgo_web_search` tool.

## Description

Use `duckduckgo_web_search` to perform a web search using DuckDuckGo. The `duckduckgo_web_search` tool returns a list of search results with sources. DuckDuckGo emphasizes user privacy and does not track users.

### Arguments

`duckduckgo_web_search` takes one argument:

- `query` (string, required): The search query.

## How to use `duckduckgo_web_search` with the Qwen Code CLI

The `duckduckgo_web_search` tool sends a query to DuckDuckGo and returns a list of search results. Each result includes the title, URL, and a snippet of the content.

Usage:

```
duckduckgo_web_search(query="Your query goes here.")
```

## `duckduckgo_web_search` examples

Get information on a topic:

```
duckduckgo_web_search(query="latest advancements in AI-powered code generation")
```

## Important notes

- **Privacy focused:** DuckDuckGo does not track users or personalize search results.
- **Response format:** The `duckduckgo_web_search` tool returns a formatted list of search results with titles, URLs, and snippets.
- **Sources:** The response includes direct links to the sources.
- **No API key required:** Unlike some search services, DuckDuckGo does not require an API key.
