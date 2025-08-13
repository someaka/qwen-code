/**
 * @license
 * Copyright 2025 Alibaba Cloud
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import { vi, expect } from 'vitest';
import { DuckDuckGoSearchTool } from './duckduckgo-search.js';
import { Config } from '../config/config.js';

// Mock the DuckDuckGo search client
vi.mock('@phukon/duckduckgo-search', () => {
  const mockDDGS = vi.fn();
  mockDDGS.prototype.text = vi.fn().mockResolvedValue([
    {
      title: 'Test Result 1',
      href: 'https://example.com/1',
      body: 'This is a test result snippet 1',
    },
    {
      title: 'Test Result 2',
      href: 'https://example.com/2',
      body: 'This is a test result snippet 2',
    },
  ]);
  
  return {
    DDGS: mockDDGS,
  };
});

describe('DuckDuckGoSearchTool', () => {
  let tool: DuckDuckGoSearchTool;
  let mockConfig: Config;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create a minimal mock config
    mockConfig = {
      getGeminiClient: vi.fn(),
    } as unknown as Config;

    tool = new DuckDuckGoSearchTool(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('duckduckgo_web_search');
    expect(tool.displayName).toBe('DuckDuckGo Search');
    expect(tool.description).toContain('DuckDuckGo');
  });

  it('should validate parameters correctly', () => {
    expect(tool.validateToolParams({ query: 'test' })).toBeNull();
    expect(tool.validateToolParams({ query: '' })).toBe("The 'query' parameter cannot be empty.");
    expect(tool.validateToolParams({ query: undefined as any })).toContain('query');
  });

  it('should execute search and return results', async () => {
    // Make sure the mock returns the expected results
    const ddgsMock = await import('@phukon/duckduckgo-search');
    ddgsMock.DDGS.prototype.text = vi.fn().mockResolvedValue([
      {
        title: 'Test Result 1',
        href: 'https://example.com/1',
        body: 'This is a test result snippet 1',
      },
      {
        title: 'Test Result 2',
        href: 'https://example.com/2',
        body: 'This is a test result snippet 2',
      },
    ]);

    const result = await tool.execute(
      { query: 'test search' },
      new AbortController().signal,
    );

    expect(result.llmContent).toContain(
      'DuckDuckGo search results for "test search"',
    );
    expect(result.llmContent).toContain('Test Result 1');
    expect(result.llmContent).toContain('https://example.com/1');
    expect(result.llmContent).toContain('This is a test result snippet 1');
    expect(result.returnDisplay).toBe(
      'Search results for "test search" returned.',
    );
    expect(result.sources).toBeDefined();
  });

  it('should handle empty search results', async () => {
    // Mock empty results
    const ddgsMock = await import('@phukon/duckduckgo-search');
    ddgsMock.DDGS.prototype.text = vi.fn().mockResolvedValueOnce([]);

    const newTool = new DuckDuckGoSearchTool(mockConfig);
    const result = await newTool.execute(
      { query: 'empty search' },
      new AbortController().signal,
    );

    expect(result.llmContent).toContain(
      'No search results found for query: "empty search"',
    );
    expect(result.returnDisplay).toBe('No information found.');
  });

  it('should handle search errors', async () => {
    // Mock search error
    const ddgsMock = await import('@phukon/duckduckgo-search');
    ddgsMock.DDGS.prototype.text = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'));

    const newTool = new DuckDuckGoSearchTool(mockConfig);
    const result = await newTool.execute(
      { query: 'error search' },
      new AbortController().signal,
    );

    expect(result.llmContent).toContain(
      'Error during DuckDuckGo web search for query "error search"',
    );
    expect(result.returnDisplay).toBe(
      'Error performing DuckDuckGo web search.',
    );
  });
});
