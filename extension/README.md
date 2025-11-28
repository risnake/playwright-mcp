# Playwright MCP Chrome Extension

## Introduction

The Playwright MCP Chrome Extension allows you to connect to pages in your existing browser and leverage the state of your default user profile. This means the AI assistant can interact with websites where you're already logged in, using your existing cookies, sessions, and browser state, providing a seamless experience without requiring separate authentication or setup.

## Prerequisites

- Chrome/Edge/Chromium browser

## Installation Steps

### Download the Extension

Download the latest Chrome extension from GitHub:
- **Download link**: https://github.com/microsoft/playwright-mcp/releases

### Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked" and select the extension directory

### Configure Playwright MCP server

Configure Playwright MCP server to connect to the browser using the extension by passing the `--extension` option when running the MCP server:

```json
{
  "mcpServers": {
    "playwright-extension": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--extension"
      ]
    }
  }
}
```

## Usage

### Browser Tab Selection

When the LLM interacts with the browser for the first time, it will load a page where you can select which browser tab the LLM will connect to. This allows you to control which specific page the AI assistant will interact with during the session.

### Bypassing the Connection Approval Dialog

By default, you'll need to approve each connection when the MCP server tries to connect to your browser. To bypass this approval dialog and allow automatic connections, you can use an authentication token.

#### Using Your Unique Authentication Token

1. After installing the extension, click on the extension icon or navigate to the extension's status page
2. Copy the `PLAYWRIGHT_MCP_EXTENSION_TOKEN` value displayed in the extension UI
3. Add it to your MCP server configuration:

```json
{
  "mcpServers": {
    "playwright-extension": {
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

## Firewall Settings

The extension includes a built-in firewall framework that allows you to control which websites the AI can access. This provides an additional layer of security when allowing LLM control of your browser.

### Accessing Firewall Settings

1. Click on the extension icon in your browser toolbar
2. Click "Open Firewall Settings" at the bottom of the status page
3. Or navigate directly to the settings page via the extension

### Configuring Firewall Rules

The firewall settings page allows you to:

#### Enable/Disable Firewall
Toggle the main firewall switch to enable or disable URL restrictions. When disabled, the AI can navigate to any URL.

#### Allowed Hosts
Add domains that the AI is permitted to access:
- Use exact domain names: `github.com`
- Use wildcard patterns: `*.microsoft.com` (matches any subdomain)
- Use `*` to allow all hosts (effectively disabling the allowlist)

#### Blocked Hosts
Add domains that the AI is explicitly forbidden from accessing:
- Blocked hosts take precedence over allowed hosts
- Use this to protect sensitive sites like banking or personal data

#### Require User Approval
When enabled, navigation to domains not in your allowed list will prompt for user approval before proceeding.

### Example Firewall Configuration

For a work-focused setup, you might configure:

**Allowed Hosts:**
- `*.github.com`
- `*.stackoverflow.com`
- `*.microsoft.com`
- `docs.google.com`

**Blocked Hosts:**
- `*.banking.com`
- `mail.google.com`
- `*.social-media.com`

### Security Considerations

While the firewall provides a useful security layer, please note:

1. **Not a Complete Security Boundary**: The firewall operates at the URL level and may not catch all redirect scenarios.
2. **Use with MCP Server Options**: For comprehensive security, combine with the `--allowed-origins` and `--blocked-origins` flags on the MCP server.
3. **Review Access Regularly**: Periodically review and update your allowed/blocked hosts list.
4. **Token Security**: Keep your `PLAYWRIGHT_MCP_EXTENSION_TOKEN` secure and don't share it.

## Architecture

The extension works by:

1. **WebSocket Connection**: Establishing a WebSocket connection between the MCP server and the browser extension
2. **CDP Relay**: Acting as a relay for Chrome DevTools Protocol (CDP) commands between the MCP server and browser tabs
3. **Tab Selection**: Allowing users to choose which tab the AI controls
4. **Firewall Enforcement**: Checking navigation requests against configured firewall rules before forwarding them

This architecture allows LLM agents to control your actual browser instance, leveraging your existing sessions and browser state, while maintaining security through authentication tokens and firewall restrictions.

