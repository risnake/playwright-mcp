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

import { test, expect } from '@playwright/test';

const { filterSnapshotLine, filterAriaSnapshot, filterMcpResponse } = require('../src/snapshotFilter');

test.describe('snapshotFilter', () => {
  test.describe('filterSnapshotLine', () => {
    test('removes cursor=pointer attribute', () => {
      const input = '- link "About" [ref=e4] [cursor=pointer]:';
      const expected = '- link "About" [ref=e4]:';
      expect(filterSnapshotLine(input)).toBe(expected);
    });

    test('removes cursor=text attribute', () => {
      const input = '- textbox "Name" [ref=e5] [cursor=text]:';
      const expected = '- textbox "Name" [ref=e5]:';
      expect(filterSnapshotLine(input)).toBe(expected);
    });

    test('removes /url: lines', () => {
      const input = '        - /url: /about';
      expect(filterSnapshotLine(input)).toBeNull();
    });

    test('removes /placeholder: lines', () => {
      const input = '        - /placeholder: Enter your name';
      expect(filterSnapshotLine(input)).toBeNull();
    });

    test('preserves ref attributes', () => {
      const input = '- button "Submit" [ref=e15]';
      expect(filterSnapshotLine(input)).toBe(input);
    });

    test('preserves level attributes', () => {
      const input = '- heading "Welcome" [level=1] [ref=e8]';
      expect(filterSnapshotLine(input)).toBe(input);
    });

    test('preserves active attribute', () => {
      const input = '- generic [active] [ref=e1]:';
      expect(filterSnapshotLine(input)).toBe(input);
    });

    test('removes multiple cursor attributes', () => {
      const input = '- link "Test" [ref=e1] [cursor=pointer] [cursor=hand]:';
      const expected = '- link "Test" [ref=e1]:';
      expect(filterSnapshotLine(input)).toBe(expected);
    });
  });

  test.describe('filterAriaSnapshot', () => {
    test('filters complete aria snapshot', () => {
      const input = `- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "About" [ref=e4] [cursor=pointer]:
      - /url: /about
    - link "Contact" [ref=e5] [cursor=pointer]:
      - /url: /contact
  - main [ref=e6]:
    - heading "Welcome" [level=1] [ref=e7]
    - textbox "Name" [ref=e8]:
      - /placeholder: Enter your name`;

      const expected = `- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "About" [ref=e4]:
    - link "Contact" [ref=e5]:
  - main [ref=e6]:
    - heading "Welcome" [level=1] [ref=e7]
    - textbox "Name" [ref=e8]:`;

      expect(filterAriaSnapshot(input)).toBe(expected);
    });

    test('handles empty snapshot', () => {
      expect(filterAriaSnapshot('')).toBe('');
    });

    test('handles null snapshot', () => {
      expect(filterAriaSnapshot(null)).toBeNull();
    });
  });

  test.describe('filterMcpResponse', () => {
    test('filters page snapshot in response', () => {
      const input = {
        content: [
          {
            type: 'text',
            text: `### Page state
- Page URL: http://example.com
- Page Title: Test
- Page Snapshot:
\`\`\`yaml
- link "Test" [ref=e1] [cursor=pointer]:
  - /url: /test
\`\`\`
`
          }
        ]
      };

      const result = filterMcpResponse(input);
      expect(result.content[0].text).toContain('- link "Test" [ref=e1]:');
      expect(result.content[0].text).not.toContain('[cursor=pointer]');
      expect(result.content[0].text).not.toContain('- /url: /test');
    });

    test('preserves non-text content', () => {
      const input = {
        content: [
          { type: 'image', data: 'base64data', mimeType: 'image/png' }
        ]
      };

      const result = filterMcpResponse(input);
      expect(result.content[0]).toEqual(input.content[0]);
    });

    test('handles null response', () => {
      expect(filterMcpResponse(null)).toBeNull();
    });

    test('handles response without content', () => {
      const input = { isError: false };
      const result = filterMcpResponse(input);
      expect(result).toEqual(input);
    });
  });
});
