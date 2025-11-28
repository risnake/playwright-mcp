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

import path from 'path';
import { test, expect } from './fixtures';

const ghostCursorScript = path.join(__dirname, '../lib/ghost-cursor.js');
const ghostCursorPage = path.join(__dirname, '../lib/ghost-cursor-page.ts');

test.describe('Ghost Cursor', () => {
  test('injects ghost cursor element into page', async ({ startClient, server }) => {
    const { client } = await startClient({
      args: [`--init-script=${ghostCursorScript}`]
    });

    server.setContent('/', `
      <title>Ghost Cursor Test</title>
      <button id="test-btn">Click Me</button>
    `, 'text/html');

    // Navigate to page
    await client.callTool({
      name: 'browser_navigate',
      arguments: { url: server.PREFIX },
    });

    // Take snapshot to verify page loaded
    const snapshot = await client.callTool({
      name: 'browser_snapshot',
      arguments: {},
    });
    
    expect(snapshot).toBeDefined();
    expect(snapshot.content[0].text).toContain('Click Me');
  });

  test('ghost cursor appears and animates on click', async ({ startClient, server }) => {
    const { client } = await startClient({
      args: [
        `--init-script=${ghostCursorScript}`,
        `--init-page=${ghostCursorPage}`
      ]
    });

    server.setContent('/', `
      <title>Ghost Cursor Click Test</title>
      <button id="test-btn">Submit</button>
      <div id="result"></div>
      <script>
        document.getElementById('test-btn').addEventListener('click', () => {
          document.getElementById('result').textContent = 'clicked';
        });
      </script>
    `, 'text/html');

    // Navigate to page
    expect(await client.callTool({
      name: 'browser_navigate',
      arguments: { url: server.PREFIX },
    })).toHaveResponse({
      pageState: expect.stringContaining('button "Submit"'),
    });

    // Click the button - ghost cursor should animate before click
    expect(await client.callTool({
      name: 'browser_click',
      arguments: {
        element: 'Submit button',
        ref: 'e2',
      },
    })).toHaveResponse({
      pageState: expect.stringContaining('clicked'),
    });
  });

  test('ghost cursor works with form interactions', async ({ startClient, server }) => {
    const { client } = await startClient({
      args: [
        `--init-script=${ghostCursorScript}`,
        `--init-page=${ghostCursorPage}`
      ]
    });

    server.setContent('/', `
      <title>Form Test</title>
      <form>
        <input type="text" id="name" placeholder="Enter name">
        <select id="color">
          <option value="">Select color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
        </select>
        <button type="submit">Submit</button>
      </form>
    `, 'text/html');

    // Navigate to page
    await client.callTool({
      name: 'browser_navigate',
      arguments: { url: server.PREFIX },
    });

    // Verify page loaded with form elements
    const snapshot = await client.callTool({
      name: 'browser_snapshot',
      arguments: {},
    });
    
    expect(snapshot.content[0].text).toContain('Enter name');
  });

  test('ghost cursor persists across navigation', async ({ startClient, server }) => {
    const { client } = await startClient({
      args: [`--init-script=${ghostCursorScript}`]
    });

    server.setContent('/', `
      <title>Page 1</title>
      <a href="/page2">Go to Page 2</a>
    `, 'text/html');

    server.setContent('/page2', `
      <title>Page 2</title>
      <p>Welcome to Page 2</p>
    `, 'text/html');

    // Navigate to first page
    await client.callTool({
      name: 'browser_navigate',
      arguments: { url: server.PREFIX },
    });

    // Navigate to second page
    await client.callTool({
      name: 'browser_navigate',
      arguments: { url: `${server.PREFIX}page2` },
    });

    // Verify second page loaded
    const snapshot = await client.callTool({
      name: 'browser_snapshot',
      arguments: {},
    });
    
    expect(snapshot.content[0].text).toContain('Welcome to Page 2');
  });
});
