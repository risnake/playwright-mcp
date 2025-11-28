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
 * Ghost Cursor - Visual AI Agent Presence
 * 
 * This init script injects a visual cursor into every page that shows
 * AI agent actions as if a second person is controlling the browser.
 * 
 * Usage: --init-script=lib/ghost-cursor.js
 * 
 * Configuration via window.__ghostCursorConfig (set before this script loads):
 *   - enabled: boolean (default: true)
 *   - speed: number in ms (default: 500)
 *   - color: string hex color (default: '#ff4444')
 *   - style: 'arrow' | 'hand' | 'dot' (default: 'arrow')
 * 
 * Or configure via URL parameters:
 *   ?__ghostCursorSpeed=500&__ghostCursorColor=%23ff4444&__ghostCursorStyle=arrow
 */

(function() {
  'use strict';

  // Parse URL parameters for configuration (useful for testing)
  function getUrlParam(name, defaultValue) {
    try {
      const url = new URL(window.location.href);
      const value = url.searchParams.get(name);
      return value !== null ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // Default configuration
  const defaultConfig = {
    enabled: true,
    speed: 500,
    color: '#ff4444',
    style: 'arrow'
  };

  // Merge with any user-provided config (window config takes precedence over URL params)
  const urlConfig = {
    speed: parseInt(getUrlParam('__ghostCursorSpeed', defaultConfig.speed), 10),
    color: getUrlParam('__ghostCursorColor', defaultConfig.color),
    style: getUrlParam('__ghostCursorStyle', defaultConfig.style)
  };

  const config = Object.assign({}, defaultConfig, urlConfig, window.__ghostCursorConfig || {});

  if (!config.enabled) {
    return;
  }

  // SVG cursor definitions
  const cursorSVGs = {
    arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="ghost-cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M4 4 L4 26 L10 20 L14 28 L18 26 L14 18 L22 18 Z" 
            fill="${config.color}" 
            stroke="#fff" 
            stroke-width="1.5"
            filter="url(#ghost-cursor-shadow)"/>
    </svg>`,
    hand: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="ghost-cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M14 4 C12.5 4 11.5 5 11.5 6.5 L11.5 15 L10 15 C8.5 15 7.5 16 7.5 17.5 L7.5 22 C7.5 25.5 10 28 14 28 L18 28 C22 28 24.5 25.5 24.5 22 L24.5 12 C24.5 10.5 23.5 9.5 22 9.5 C21 9.5 20 10 19.5 10.5 C19 9.5 18 8.5 16.5 8.5 C16 8.5 15.5 8.7 15 9 L15 6.5 C15 5 14 4 14 4 Z" 
            fill="${config.color}" 
            stroke="#fff" 
            stroke-width="1.5"
            filter="url(#ghost-cursor-shadow)"/>
    </svg>`,
    dot: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <defs>
        <filter id="ghost-cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="8" 
              fill="${config.color}" 
              stroke="#fff" 
              stroke-width="2"
              filter="url(#ghost-cursor-shadow)"/>
      <circle cx="12" cy="12" r="3" fill="#fff"/>
    </svg>`
  };

  // Create and inject the ghost cursor element
  function createGhostCursor() {
    // Check if already exists
    if (document.getElementById('ghost-cursor-container')) {
      return document.getElementById('ghost-cursor-container');
    }

    const container = document.createElement('div');
    container.id = 'ghost-cursor-container';
    container.innerHTML = cursorSVGs[config.style] || cursorSVGs.arrow;
    
    // Apply styles
    Object.assign(container.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '32px',
      height: '32px',
      pointerEvents: 'none',
      zIndex: '2147483647',
      transform: 'translate(-50%, -50%)',
      transition: `top ${config.speed}ms ease-out, left ${config.speed}ms ease-out`,
      opacity: '0',
      willChange: 'top, left'
    });

    // Add click animation style
    const style = document.createElement('style');
    style.id = 'ghost-cursor-styles';
    style.textContent = `
      @keyframes ghost-cursor-click {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(0.85); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes ghost-cursor-appear {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      #ghost-cursor-container.clicking {
        animation: ghost-cursor-click 150ms ease-in-out;
      }
      #ghost-cursor-container.appearing {
        animation: ghost-cursor-appear 200ms ease-out forwards;
      }
    `;
    
    if (!document.getElementById('ghost-cursor-styles')) {
      document.head.appendChild(style);
    }
    document.body.appendChild(container);
    
    return container;
  }

  // Ensure cursor exists when DOM is ready
  function ensureCursor() {
    if (document.body) {
      return createGhostCursor();
    }
    return null;
  }

  // Move cursor to coordinates
  function moveCursorTo(x, y, callback) {
    const cursor = ensureCursor();
    if (!cursor) {
      if (callback) callback();
      return;
    }

    // Show cursor if hidden
    if (cursor.style.opacity === '0') {
      cursor.classList.add('appearing');
      cursor.style.opacity = '1';
      setTimeout(() => cursor.classList.remove('appearing'), 200);
    }

    // Set new position
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';

    // Wait for animation to complete
    if (callback) {
      setTimeout(callback, config.speed);
    }
  }

  // Animate click effect
  function animateClick() {
    const cursor = ensureCursor();
    if (!cursor) return;
    
    cursor.classList.add('clicking');
    setTimeout(() => cursor.classList.remove('clicking'), 150);
  }

  // Hide cursor
  function hideCursor() {
    const cursor = document.getElementById('ghost-cursor-container');
    if (cursor) {
      cursor.style.opacity = '0';
    }
  }

  // Get cursor position
  function getCursorPosition() {
    const cursor = document.getElementById('ghost-cursor-container');
    if (!cursor) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return {
      x: parseFloat(cursor.style.left) || window.innerWidth / 2,
      y: parseFloat(cursor.style.top) || window.innerHeight / 2
    };
  }

  // Update configuration at runtime
  function updateConfig(newConfig) {
    Object.assign(config, newConfig);
    const cursor = document.getElementById('ghost-cursor-container');
    if (cursor) {
      cursor.style.transition = `top ${config.speed}ms ease-out, left ${config.speed}ms ease-out`;
      if (newConfig.color || newConfig.style) {
        cursor.innerHTML = cursorSVGs[config.style] || cursorSVGs.arrow;
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCursor);
  } else {
    ensureCursor();
  }

  // Also try on load event for dynamic pages
  window.addEventListener('load', ensureCursor);

  // Expose API for external control
  window.__ghostCursor = {
    moveTo: moveCursorTo,
    click: animateClick,
    hide: hideCursor,
    show: function() {
      const cursor = ensureCursor();
      if (cursor) cursor.style.opacity = '1';
    },
    getPosition: getCursorPosition,
    updateConfig: updateConfig,
    ensureCursor: ensureCursor,
    config: config
  };
})();
