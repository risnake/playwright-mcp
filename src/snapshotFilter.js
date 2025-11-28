/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Filters unnecessary items from aria snapshots to reduce context size.
 * 
 * Removes:
 * - [cursor=pointer] and other cursor attributes (not needed for AI interaction)
 * - /url: lines for links (href values, often redundant with link text)
 * - /placeholder: lines (placeholder text, usually in accessible name)
 * 
 * Preserves:
 * - [ref=...] (critical for element interaction)
 * - Role names (button, link, textbox, etc.)
 * - Element text content
 * - [level=...] for headings
 * - [active] state (can be useful for understanding focus)
 */

/**
 * Filter a single line of aria snapshot
 * @param {string} line - A line from the aria snapshot
 * @returns {string|null} - Filtered line or null if line should be removed
 */
function filterSnapshotLine(line) {
  // Remove cursor attributes like [cursor=pointer]
  let filtered = line.replace(/\s*\[cursor=[^\]]*\]/g, '');
  
  // Remove lines that only contain /url: (link href values)
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith('- /url:')) {
    return null;
  }
  
  // Remove lines that only contain /placeholder: (input placeholder values)
  if (trimmedLine.startsWith('- /placeholder:')) {
    return null;
  }
  
  return filtered;
}

/**
 * Filter an entire aria snapshot
 * @param {string} snapshot - The full aria snapshot as a string
 * @returns {string} - Filtered snapshot
 */
function filterAriaSnapshot(snapshot) {
  if (!snapshot) return snapshot;
  
  const lines = snapshot.split('\n');
  const filteredLines = [];
  
  for (const line of lines) {
    const filtered = filterSnapshotLine(line);
    if (filtered !== null) {
      filteredLines.push(filtered);
    }
  }
  
  return filteredLines.join('\n');
}

/**
 * Filter the response content from MCP server
 * @param {object} response - MCP response object with content array
 * @returns {object} - Filtered response
 */
function filterMcpResponse(response) {
  if (!response || !response.content) return response;
  
  const filteredContent = response.content.map(item => {
    if (item.type !== 'text') return item;
    
    // Find and filter the Page Snapshot section
    let text = item.text;
    
    // Match the Page Snapshot section within yaml code block
    // Pattern is flexible to handle variations in whitespace
    const snapshotMatch = text.match(/(```yaml\s*\n)([\s\S]*?)(```)/);
    if (snapshotMatch) {
      const yamlContent = snapshotMatch[2];
      const filteredYaml = filterAriaSnapshot(yamlContent);
      text = text.replace(snapshotMatch[0], snapshotMatch[1] + filteredYaml + snapshotMatch[3]);
    }
    
    return { ...item, text };
  });
  
  return { ...response, content: filteredContent };
}

module.exports = {
  filterSnapshotLine,
  filterAriaSnapshot,
  filterMcpResponse
};
