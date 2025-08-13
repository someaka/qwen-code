/**
 * @license
 * Copyright 2025 Alibaba Cloud
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, Icon, ToolResult } from './tools.js';
import { Type } from '@google/genai';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { getErrorMessage } from '../utils/errors.js';
import { Config } from '../config/config.js';

// Import DuckDuckGo search client
import { DDGS } from '@phukon/duckduckgo-search';

// Define the SearchResult interface locally since it's not exported
interface SearchResult {
  title: string;
  href: string;
  body: string;
}

/**
 * Parameters for the DuckDuckGoSearchTool.
 */
export interface DuckDuckGoSearchToolParams {
  /**
   * The search query.
   */
  query: string;
}

/**
 * Extends ToolResult to include search results for DuckDuckGo search.
 */
export interface DuckDuckGoSearchToolResult extends ToolResult {
  sources?: SearchResult[];
}

/**
 * A tool to perform web searches using DuckDuckGo.
 */
export class DuckDuckGoSearchTool extends BaseTool<
  DuckDuckGoSearchToolParams,
  DuckDuckGoSearchToolResult
> {
  static readonly Name: string = 'duckduckgo_web_search';
  private ddgs: DDGS;

  constructor(private readonly config: Config) {
    super(
      DuckDuckGoSearchTool.Name,
      'DuckDuckGo Search',
      'Performs a web search using DuckDuckGo and returns the results. This tool is useful for finding information on the internet based on a query.',
      Icon.Globe,
      {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search query to find information on the web.',
          },
        },
        required: ['query'],
      },
    );
    this.ddgs = new DDGS();
  }

  /**
   * Validates the parameters for the DuckDuckGoSearchTool.
   * @param params The parameters to validate
   * @returns An error message string if validation fails, null if valid
   */
  validateToolParams(params: DuckDuckGoSearchToolParams): string | null {
    const errors = SchemaValidator.validate(this.schema.parameters, params);
    if (errors) {
      return errors;
    }

    if (!params.query || params.query.trim() === '') {
      return "The 'query' parameter cannot be empty.";
    }
    return null;
  }

  getDescription(params: DuckDuckGoSearchToolParams): string {
    return `Searching the web with DuckDuckGo for: "${params.query}"`;
  }

  async execute(
    params: DuckDuckGoSearchToolParams,
    signal: AbortSignal,
  ): Promise<DuckDuckGoSearchToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: `Error: Invalid parameters provided. Reason: ${validationError}`,
        returnDisplay: validationError,
      };
    }

    try {
      // Check if the signal is already aborted
      if (signal.aborted) {
        throw new Error('Search was cancelled');
      }

      // Perform the search with DuckDuckGo
      const results = await this.ddgs.text({
        keywords: params.query,
        safesearch: 'off',
        maxResults: 5,
      });

      if (!results || results.length === 0) {
        return {
          llmContent: `No search results found for query: "${params.query}"`,
          returnDisplay: 'No information found.',
        };
      }

      // Format the results for display
      let formattedResults = `DuckDuckGo search results for "${params.query}":\n\n`;

      const sourceListFormatted: string[] = [];
      results.forEach((result: SearchResult, index: number) => {
        const title = result.title || 'Untitled';
        const url = result.href || 'No URL';
        const snippet = result.body || 'No description';

        formattedResults += `${index + 1}. ${title}\n`;
        formattedResults += `   URL: ${url}\n`;
        formattedResults += `   Snippet: ${snippet}\n\n`;

        sourceListFormatted.push(`[${index + 1}] ${title} (${url})`);
      });

      formattedResults += '\nSources:\n' + sourceListFormatted.join('\n');

      return {
        llmContent: formattedResults,
        returnDisplay: `Search results for "${params.query}" returned.`,
        sources: results,
      };
    } catch (error: unknown) {
      const errorMessage = `Error during DuckDuckGo web search for query "${params.query}": ${getErrorMessage(error)}`;
      console.error(errorMessage, error);
      return {
        llmContent: `Error: ${errorMessage}`,
        returnDisplay: `Error performing DuckDuckGo web search.`,
      };
    }
  }
}
