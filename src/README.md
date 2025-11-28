# Where is the source?

The core Playwright MCP source code is located in the Playwright monorepo. Please refer to the contributor's guide in [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.

## Local extensions

This directory contains local extensions to the MCP functionality:

- `snapshotFilter.js` - Filters unnecessary items from aria snapshots to reduce AI context size. Removes `[cursor=pointer]`, `/url:` lines, and `/placeholder:` lines while preserving essential content like `[ref=...]`, role names, and element text.
