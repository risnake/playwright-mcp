# Playwright MCP Chrome Extension

## Introduction

The Playwright MCP Chrome Extension allows you to connect to pages in your existing browser and leverage the state of your default user profile. This means the AI assistant can interact with websites where you're already logged in, using your existing cookies, sessions, and browser state, providing a seamless experience without requiring separate authentication or setup.

## Why Use the Browser Extension?

By default, when you run the Playwright MCP server, it launches a new browser instance. While this works well for many use cases, sometimes you need to use your existing browser because:

- **Your browser has extensions installed** (e.g., ad blockers, password managers, VPNs, accessibility tools) that are required for certain sites to work properly
- **You're already logged into websites** and don't want to re-authenticate
- **You have custom browser settings** (bookmarks, saved passwords, autofill data) that you want to preserve
- **Certain websites require specific extensions** to function (e.g., corporate tools, security extensions)
- **You want to use your browser profile** with all your customizations intact

The browser extension bridges this gap by allowing the Playwright MCP server to connect to and control tabs in your regular browser.

## Prerequisites

- Chrome, Edge, or Chromium-based browser
- Node.js 18 or newer (for running the MCP server)

## Installation Steps

### Step 1: Download the Extension

Download the latest Chrome extension from GitHub:
- **Download link**: https://github.com/microsoft/playwright-mcp/releases

Look for the `playwright-mcp-extension-{version}.zip` file (e.g., `playwright-mcp-extension-0.0.48.zip`) in the release assets. Extract it to a folder on your computer.

### Step 2: Load the Extension in Chrome/Edge

1. Open Chrome and navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable **"Developer mode"** (toggle in the top right corner)
3. Click **"Load unpacked"**
4. Select the extracted extension folder (the one containing `manifest.json`)
5. The extension should now appear in your extensions list with a Playwright icon

### Step 3: Configure Playwright MCP Server

Update your MCP client configuration to use the `--extension` flag:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--extension"
      ]
    }
  }
}
```

The `--extension` flag tells the MCP server to connect to your existing browser via the extension instead of launching a new browser instance.

## Usage

### Browser Tab Selection

When the AI assistant first tries to interact with the browser:

1. A new tab opens in your browser showing the Playwright MCP Bridge connection page
2. You'll see a list of your open tabs
3. Select the tab you want the AI assistant to control
4. Click "Connect" to establish the connection

The AI assistant will then be able to interact with the selected tab while preserving your logged-in state and browser extensions.

### Bypassing the Connection Approval Dialog

By default, you'll need to approve each connection when the MCP server tries to connect to your browser. To bypass this approval dialog and allow automatic connections, you can use an authentication token.

#### Using Your Unique Authentication Token

1. After installing the extension, click on the extension icon in your browser toolbar
2. Copy the `PLAYWRIGHT_MCP_EXTENSION_TOKEN` value displayed in the extension UI
3. Add it to your MCP server configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--extension"
      ],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "your-token-here"
      }
    }
  }
}
```

This token is unique to your browser profile and provides secure authentication between the MCP server and the extension. Once configured, you won't need to manually approve connections each time.

## Troubleshooting

### Extension Not Connecting

If the MCP server can't connect to your browser:

1. Make sure the extension is installed and enabled in `chrome://extensions/`
2. Check that the browser is running before starting the MCP server
3. Verify that Developer mode is enabled
4. Try reloading the extension

### Connection Timeout

If you see "Extension connection timeout" errors:

1. Make sure your browser is open and the extension is active
2. Check that no firewall or security software is blocking local connections
3. The extension uses WebSocket connections on `localhost` - ensure these aren't blocked by your browser security settings or corporate proxy

### Sites Not Working Correctly

Some features may not work the same as in the automated browser:

- **Permissions**: You may need to grant permissions (camera, microphone, geolocation) manually in your browser
- **Pop-up blockers**: Your browser's pop-up blocker may interfere with some actions
- **Extension conflicts**: Other browser extensions might interfere with Playwright's automation

## Security Considerations

- The extension uses the Chrome DevTools Protocol to control browser tabs
- Only tabs you explicitly approve can be controlled
- The authentication token provides an additional layer of security
- The extension only communicates with the local MCP server, not external servers

