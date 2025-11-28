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

/**
 * Ghost Browser CLI Wrapper
 * 
 * This script wraps the Playwright MCP server with ghost cursor functionality enabled.
 * It automatically adds the necessary --init-script and --init-page options.
 * 
 * Usage: node ghost-cli.js [options]
 * 
 * Ghost Cursor Options (via environment variables):
 *   GHOST_CURSOR_ENABLED=true|false   - Enable/disable ghost cursor (default: true)
 *   GHOST_CURSOR_SPEED=<ms>           - Animation speed in milliseconds (default: 500)
 *   GHOST_CURSOR_COLOR=<hex>          - Cursor color (default: #ff4444)
 *   GHOST_CURSOR_STYLE=arrow|hand|dot - Cursor style (default: arrow)
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse ghost cursor configuration from environment
const ghostConfig = {
  enabled: process.env.GHOST_CURSOR_ENABLED !== 'false',
  speed: parseInt(process.env.GHOST_CURSOR_SPEED, 10) || 500,
  color: process.env.GHOST_CURSOR_COLOR || '#ff4444',
  style: process.env.GHOST_CURSOR_STYLE || 'arrow'
};

// Build arguments
const args = process.argv.slice(2);
const cliPath = path.join(__dirname, 'cli.js');
const ghostCursorScript = path.join(__dirname, 'scripts', 'ghost-cursor.js');
const ghostCursorPage = path.join(__dirname, 'scripts', 'ghost-cursor-page.ts');

// Add ghost cursor init scripts if enabled
if (ghostConfig.enabled) {
  args.push(`--init-script=${ghostCursorScript}`);
  args.push(`--init-page=${ghostCursorPage}`);
}

// Spawn the main CLI
const child = spawn('node', [cliPath, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Pass ghost cursor config to init script via a special env var
    // that gets read and injected into window.__ghostCursorConfig
    GHOST_CURSOR_CONFIG: JSON.stringify(ghostConfig)
  }
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start ghost browser:', err);
  process.exit(1);
});
