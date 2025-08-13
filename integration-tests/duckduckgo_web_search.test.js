/**
 * @license
 * Copyright 2025 Alibaba Cloud
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import { strict as assert } from 'assert';
import { TestRig, printDebugInfo, validateModelOutput } from './test-helper.js';

test('should be able to search the web with DuckDuckGo', async () => {
  const rig = new TestRig();
  await rig.setup('should be able to search the web with DuckDuckGo');

  let result;
  try {
    result = await rig.run(`what is the weather in London using DuckDuckGo`);
  } catch (error) {
    // Network errors can occur in CI environments
    if (
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      console.warn('Skipping test due to network error:', error.message);
      return; // Skip the test
    }
    throw error; // Re-throw if not a network error
  }

  const foundToolCall = await rig.waitForToolCall('duckduckgo_web_search');

  // Add debugging information
  if (!foundToolCall) {
    const allTools = printDebugInfo(rig, result);

    // Check if the tool call failed due to network issues
    const failedSearchCalls = allTools.filter(
      (t) =>
        t.toolRequest.name === 'duckduckgo_web_search' &&
        !t.toolRequest.success,
    );
    if (failedSearchCalls.length > 0) {
      console.warn(
        'duckduckgo_web_search tool was called but failed, possibly due to network issues',
      );
      console.warn(
        'Failed calls:',
        failedSearchCalls.map((t) => t.toolRequest.args),
      );
      return; // Skip the test if network issues
    }
  }

  assert.ok(foundToolCall, 'Expected to find a call to duckduckgo_web_search');

  // Validate model output - will throw if no output, warn if missing expected content
  const hasExpectedContent = validateModelOutput(
    result,
    ['weather', 'london'],
    'DuckDuckGo web search test',
  );

  // If content was missing, log the search queries used
  if (!hasExpectedContent) {
    const searchCalls = rig
      .readToolLogs()
      .filter((t) => t.toolRequest.name === 'duckduckgo_web_search');
    if (searchCalls.length > 0) {
      console.warn(
        'Search queries used:',
        searchCalls.map((t) => t.toolRequest.args),
      );
    }
  }
});
