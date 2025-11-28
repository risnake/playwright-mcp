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
 * Firewall settings for controlling which URLs the AI can access.
 * These settings provide security boundaries for LLM-controlled browser automation.
 */
export interface FirewallSettings {
  /**
   * Whether firewall restrictions are enabled.
   * When disabled, the AI can navigate to any URL.
   */
  firewallEnabled: boolean;

  /**
   * List of host patterns that the AI is allowed to access.
   * Supports wildcards: "*.example.com" matches any subdomain.
   * Use "*" to allow all hosts (effectively disabling the allowlist).
   */
  allowedHosts: string[];

  /**
   * List of host patterns that the AI is explicitly blocked from accessing.
   * Blocked hosts take precedence over allowed hosts.
   */
  blockedHosts: string[];

  /**
   * Whether to require user approval for navigation to new domains.
   * When enabled, navigation to domains not in the allowed list will prompt for approval.
   */
  requireUserApproval: boolean;
}

/**
 * Default settings with firewall disabled and empty host lists.
 * When firewall is disabled, requireUserApproval is also disabled for consistency.
 */
export const DEFAULT_SETTINGS: FirewallSettings = {
  firewallEnabled: false,
  allowedHosts: [],
  blockedHosts: [],
  requireUserApproval: false,
};

const SETTINGS_STORAGE_KEY = 'playwright-mcp-firewall-settings';

/**
 * Retrieves firewall settings from Chrome storage.
 * Falls back to default settings if none are stored.
 */
export async function getSettings(): Promise<FirewallSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], (result) => {
      if (result[SETTINGS_STORAGE_KEY]) {
        // Merge with defaults to handle new fields in future versions
        resolve({
          ...DEFAULT_SETTINGS,
          ...result[SETTINGS_STORAGE_KEY],
        });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

/**
 * Saves firewall settings to Chrome storage.
 */
export async function saveSettings(settings: FirewallSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Checks if a URL matches a host pattern.
 * Supports wildcard patterns like "*.example.com".
 */
export function matchesHostPattern(url: string, pattern: string): boolean {
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

/**
 * Checks if a URL is allowed based on firewall settings.
 * Returns { allowed: boolean, reason: string }
 */
export function isUrlAllowed(url: string, settings: FirewallSettings): { allowed: boolean; reason: string } {
  // If firewall is disabled, allow everything
  if (!settings.firewallEnabled) {
    return { allowed: true, reason: 'Firewall is disabled' };
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

/**
 * Extracts the hostname from a URL for display purposes.
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
