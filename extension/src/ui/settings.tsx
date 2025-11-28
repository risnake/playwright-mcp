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

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from './tabItem';
import { AuthTokenSection } from './authToken';
import * as icons from './icons';

import type { FirewallSettings } from '../settingsStorage';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../settingsStorage';

const SettingsApp: React.FC = () => {
  const [settings, setSettings] = useState<FirewallSettings>(DEFAULT_SETTINGS);
  const [newAllowedHost, setNewAllowedHost] = useState('');
  const [newBlockedHost, setNewBlockedHost] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSettings();
    setSettings(loaded);
  };

  const handleSave = useCallback(async (newSettings: FirewallSettings) => {
    setSaveStatus('saving');
    try {
      await saveSettings(newSettings);
      setSettings(newSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  const addAllowedHost = useCallback(() => {
    if (!newAllowedHost.trim()) return;
    const host = newAllowedHost.trim().toLowerCase();
    if (settings.allowedHosts.includes(host)) {
      setNewAllowedHost('');
      return;
    }
    const newSettings = {
      ...settings,
      allowedHosts: [...settings.allowedHosts, host],
    };
    void handleSave(newSettings);
    setNewAllowedHost('');
  }, [newAllowedHost, settings, handleSave]);

  const removeAllowedHost = useCallback((host: string) => {
    const newSettings = {
      ...settings,
      allowedHosts: settings.allowedHosts.filter(h => h !== host),
    };
    void handleSave(newSettings);
  }, [settings, handleSave]);

  const addBlockedHost = useCallback(() => {
    if (!newBlockedHost.trim()) return;
    const host = newBlockedHost.trim().toLowerCase();
    if (settings.blockedHosts.includes(host)) {
      setNewBlockedHost('');
      return;
    }
    const newSettings = {
      ...settings,
      blockedHosts: [...settings.blockedHosts, host],
    };
    void handleSave(newSettings);
    setNewBlockedHost('');
  }, [newBlockedHost, settings, handleSave]);

  const removeBlockedHost = useCallback((host: string) => {
    const newSettings = {
      ...settings,
      blockedHosts: settings.blockedHosts.filter(h => h !== host),
    };
    void handleSave(newSettings);
  }, [settings, handleSave]);

  const toggleFirewall = useCallback(() => {
    const newSettings = {
      ...settings,
      firewallEnabled: !settings.firewallEnabled,
    };
    void handleSave(newSettings);
  }, [settings, handleSave]);

  const toggleRequireUserApproval = useCallback(() => {
    const newSettings = {
      ...settings,
      requireUserApproval: !settings.requireUserApproval,
    };
    void handleSave(newSettings);
  }, [settings, handleSave]);

  const resetToDefaults = useCallback(() => {
    void handleSave(DEFAULT_SETTINGS);
  }, [handleSave]);

  return (
    <div className='app-container'>
      <div className='content-wrapper'>
        <h1 className='settings-title'>🎭 Playwright MCP Bridge Settings</h1>

        {/* Save Status Banner */}
        {saveStatus !== 'idle' && (
          <div className={`save-status ${saveStatus}`}>
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && '✓ Settings saved'}
            {saveStatus === 'error' && '✗ Failed to save settings'}
          </div>
        )}

        {/* Auth Token Section */}
        <AuthTokenSection />

        {/* Firewall Settings Section */}
        <div className='settings-section'>
          <h2 className='settings-section-title'>🔥 Firewall Settings</h2>
          <p className='settings-description'>
            Configure URL restrictions to control which websites the AI can interact with.
            These settings provide an additional layer of security when allowing LLM control of your browser.
          </p>

          {/* Enable/Disable Firewall */}
          <div className='settings-toggle'>
            <label className='toggle-label'>
              <input
                type='checkbox'
                checked={settings.firewallEnabled}
                onChange={toggleFirewall}
                className='toggle-checkbox'
              />
              <span className='toggle-text'>Enable Firewall Restrictions</span>
            </label>
            <p className='toggle-description'>
              When enabled, the AI will only be able to navigate to allowed hosts and will be blocked from accessing blocked hosts.
            </p>
          </div>

          {/* Require User Approval */}
          <div className='settings-toggle'>
            <label className='toggle-label'>
              <input
                type='checkbox'
                checked={settings.requireUserApproval}
                onChange={toggleRequireUserApproval}
                className='toggle-checkbox'
              />
              <span className='toggle-text'>Require User Approval for Navigation</span>
            </label>
            <p className='toggle-description'>
              When enabled, you will be prompted to approve navigation to new domains not in your allowed list.
            </p>
          </div>

          {settings.firewallEnabled && (
            <>
              {/* Allowed Hosts */}
              <div className='host-list-section'>
                <h3 className='host-list-title'>✓ Allowed Hosts</h3>
                <p className='host-list-description'>
                  Domains that the AI is permitted to access. Use '*' to allow all hosts.
                </p>
                <div className='host-input-container'>
                  <input
                    type='text'
                    value={newAllowedHost}
                    onChange={e => setNewAllowedHost(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addAllowedHost()}
                    placeholder='e.g., github.com, *.microsoft.com'
                    className='host-input'
                  />
                  <Button variant='primary' onClick={addAllowedHost}>
                    Add
                  </Button>
                </div>
                <div className='host-list'>
                  {settings.allowedHosts.length === 0 ? (
                    <div className='host-list-empty'>
                      No allowed hosts configured. Add hosts to restrict AI navigation.
                    </div>
                  ) : (
                    settings.allowedHosts.map(host => (
                      <div key={host} className='host-item'>
                        <span className='host-name'>{host}</span>
                        <button
                          className='host-remove-btn'
                          onClick={() => removeAllowedHost(host)}
                          title='Remove host'
                        >
                          {icons.cross()}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Blocked Hosts */}
              <div className='host-list-section'>
                <h3 className='host-list-title'>✗ Blocked Hosts</h3>
                <p className='host-list-description'>
                  Domains that the AI is explicitly forbidden from accessing. Blocked hosts take precedence over allowed hosts.
                </p>
                <div className='host-input-container'>
                  <input
                    type='text'
                    value={newBlockedHost}
                    onChange={e => setNewBlockedHost(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addBlockedHost()}
                    placeholder='e.g., banking.com, sensitive-data.org'
                    className='host-input'
                  />
                  <Button variant='reject' onClick={addBlockedHost}>
                    Block
                  </Button>
                </div>
                <div className='host-list'>
                  {settings.blockedHosts.length === 0 ? (
                    <div className='host-list-empty'>
                      No blocked hosts configured.
                    </div>
                  ) : (
                    settings.blockedHosts.map(host => (
                      <div key={host} className='host-item blocked'>
                        <span className='host-name'>{host}</span>
                        <button
                          className='host-remove-btn'
                          onClick={() => removeBlockedHost(host)}
                          title='Remove host'
                        >
                          {icons.cross()}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Reset Section */}
        <div className='settings-section reset-section'>
          <Button variant='default' onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>

        {/* Documentation Link */}
        <div className='settings-footer'>
          <a
            href='https://github.com/microsoft/playwright-mcp/blob/main/extension/README.md'
            target='_blank'
            rel='noopener noreferrer'
            className='docs-link'
          >
            📖 View Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

// Initialize the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsApp />);
}
