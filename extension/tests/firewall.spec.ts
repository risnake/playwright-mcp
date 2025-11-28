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

// Test the firewall matching logic (unit tests for the settings storage module)
// Note: These tests validate the URL matching logic used in the extension

test.describe('Firewall URL matching', () => {

  // Helper function that mirrors the extension's matchesHostPattern
  function matchesHostPattern(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const normalizedPattern = pattern.toLowerCase().trim();

      // Special case: "*" matches everything
      if (normalizedPattern === '*') {
        return true;
      }

      // Wildcard pattern: *.example.com
      if (normalizedPattern.startsWith('*.')) {
        const domain = normalizedPattern.slice(2);
        return hostname === domain || hostname.endsWith('.' + domain);
      }

      // Exact match
      return hostname === normalizedPattern;
    } catch {
      return false;
    }
  }

  test('exact domain matching', () => {
    expect(matchesHostPattern('https://github.com/test', 'github.com')).toBe(true);
    expect(matchesHostPattern('https://github.com', 'github.com')).toBe(true);
    expect(matchesHostPattern('https://api.github.com', 'github.com')).toBe(false);
    expect(matchesHostPattern('https://notgithub.com', 'github.com')).toBe(false);
  });

  test('wildcard domain matching', () => {
    expect(matchesHostPattern('https://api.github.com', '*.github.com')).toBe(true);
    expect(matchesHostPattern('https://raw.githubusercontent.com', '*.githubusercontent.com')).toBe(true);
    expect(matchesHostPattern('https://github.com', '*.github.com')).toBe(true);
    expect(matchesHostPattern('https://notgithub.com', '*.github.com')).toBe(false);
  });

  test('wildcard all matching', () => {
    expect(matchesHostPattern('https://github.com', '*')).toBe(true);
    expect(matchesHostPattern('https://google.com', '*')).toBe(true);
    expect(matchesHostPattern('https://any-domain.org/path', '*')).toBe(true);
  });

  test('case insensitive matching', () => {
    expect(matchesHostPattern('https://GitHub.COM', 'github.com')).toBe(true);
    expect(matchesHostPattern('https://GITHUB.com', 'GitHub.com')).toBe(true);
  });

  test('invalid URLs return false', () => {
    expect(matchesHostPattern('not-a-url', 'github.com')).toBe(false);
    expect(matchesHostPattern('', 'github.com')).toBe(false);
  });
});

test.describe('Firewall URL allowed check', () => {

  // Helper that mirrors the extension's isUrlAllowed
  function isUrlAllowed(url: string, settings: {
    firewallEnabled: boolean;
    allowedHosts: string[];
    blockedHosts: string[];
  }): { allowed: boolean; reason: string } {
    // If firewall is disabled, allow everything
    if (!settings.firewallEnabled) {
      return { allowed: true, reason: 'Firewall is disabled' };
    }

    // Helper function for matching
    function matchesHostPattern(checkUrl: string, pattern: string): boolean {
      try {
        const urlObj = new URL(checkUrl);
        const hostname = urlObj.hostname.toLowerCase();
        const normalizedPattern = pattern.toLowerCase().trim();
        if (normalizedPattern === '*') return true;
        if (normalizedPattern.startsWith('*.')) {
          const domain = normalizedPattern.slice(2);
          return hostname === domain || hostname.endsWith('.' + domain);
        }
        return hostname === normalizedPattern;
      } catch {
        return false;
      }
    }

    // Check blocked hosts first (they take precedence)
    for (const blockedHost of settings.blockedHosts) {
      if (matchesHostPattern(url, blockedHost)) {
        return { allowed: false, reason: `URL matches blocked host pattern: ${blockedHost}` };
      }
    }

    // If no allowed hosts are configured, allow by default
    if (settings.allowedHosts.length === 0) {
      return { allowed: true, reason: 'No allowed hosts configured' };
    }

    // Check if URL matches any allowed host
    for (const allowedHost of settings.allowedHosts) {
      if (matchesHostPattern(url, allowedHost)) {
        return { allowed: true, reason: `URL matches allowed host pattern: ${allowedHost}` };
      }
    }

    // URL didn't match any allowed host
    return { allowed: false, reason: 'URL does not match any allowed host' };
  }

  test('firewall disabled allows all URLs', () => {
    const settings = {
      firewallEnabled: false,
      allowedHosts: ['github.com'],
      blockedHosts: ['evil.com'],
    };

    expect(isUrlAllowed('https://evil.com', settings).allowed).toBe(true);
    expect(isUrlAllowed('https://anything.com', settings).allowed).toBe(true);
  });

  test('blocked hosts take precedence', () => {
    const settings = {
      firewallEnabled: true,
      allowedHosts: ['*.com'],  // Allow all .com
      blockedHosts: ['evil.com'],  // But block evil.com specifically
    };

    expect(isUrlAllowed('https://evil.com', settings).allowed).toBe(false);
    expect(isUrlAllowed('https://good.com', settings).allowed).toBe(true);
  });

  test('empty allowed list allows all when enabled', () => {
    const settings = {
      firewallEnabled: true,
      allowedHosts: [],
      blockedHosts: [],
    };

    expect(isUrlAllowed('https://anything.com', settings).allowed).toBe(true);
  });

  test('allowed list restricts access', () => {
    const settings = {
      firewallEnabled: true,
      allowedHosts: ['github.com', '*.microsoft.com'],
      blockedHosts: [],
    };

    expect(isUrlAllowed('https://github.com', settings).allowed).toBe(true);
    expect(isUrlAllowed('https://docs.microsoft.com', settings).allowed).toBe(true);
    expect(isUrlAllowed('https://google.com', settings).allowed).toBe(false);
  });
});
