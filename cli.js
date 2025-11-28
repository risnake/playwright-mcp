#!/usr/bin/env node
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

const path = require('path');
const { filterMcpResponse } = require('./src/snapshotFilter');

// Patch the BrowserServerBackend prototype BEFORE loading program.js
// This filters unnecessary items from aria snapshots to reduce AI context size.
// Removes: [cursor=pointer], /url: lines, /placeholder: lines
// Preserves: [ref=...], role names, element text content, [level=...], [active]
//
// Note: This depends on Playwright's internal API structure. If Playwright changes
// the path to browserServerBackend.js, this patching will need to be updated.
const playwrightDir = path.dirname(require.resolve('playwright/package.json'));
const backendPath = path.join(playwrightDir, 'lib', 'mcp', 'browser', 'browserServerBackend.js');

let backendModule;
try {
  backendModule = require(backendPath);
} catch (e) {
  // If the internal module path changes, skip patching and continue without filtering
  // This ensures the CLI still works even if Playwright's internal structure changes
  console.error('[playwright-mcp] Warning: Could not load BrowserServerBackend for snapshot filtering:', e.message);
}

if (backendModule) {
  const BrowserServerBackend = backendModule.BrowserServerBackend;

  if (BrowserServerBackend && 
      BrowserServerBackend.prototype && 
      BrowserServerBackend.prototype.callTool &&
      typeof BrowserServerBackend.prototype.callTool === 'function') {
    const originalCallTool = BrowserServerBackend.prototype.callTool;
    BrowserServerBackend.prototype.callTool = async function(toolName, args, progress) {
      const result = await originalCallTool.call(this, toolName, args, progress);
      return filterMcpResponse(result);
    };
  }
}

// Now load the program
const { program } = require('playwright-core/lib/utilsBundle');
const { decorateCommand } = require('playwright/lib/mcp/program');

const packageJSON = require('./package.json');
const p = program.version('Version ' + packageJSON.version).name('Playwright MCP');
decorateCommand(p, packageJSON.version)
void program.parseAsync(process.argv);
