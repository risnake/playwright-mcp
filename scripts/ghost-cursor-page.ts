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
 * Ghost Cursor Page Initializer
 * 
 * This init-page script hooks into Playwright's page object to animate
 * the ghost cursor before each browser action (click, type, hover, etc.).
 * 
 * Usage: --init-page=lib/ghost-cursor-page.ts
 */

import type { Page, Locator, ElementHandle } from 'playwright';

interface GhostCursorAPI {
  moveTo: (x: number, y: number, callback?: () => void) => void;
  click: () => void;
  hide: () => void;
  show: () => void;
  getPosition: () => { x: number; y: number };
  updateConfig: (config: Partial<GhostCursorConfig>) => void;
  ensureCursor: () => HTMLElement | null;
  config: GhostCursorConfig;
}

interface GhostCursorConfig {
  enabled: boolean;
  speed: number;
  color: string;
  style: 'arrow' | 'hand' | 'dot';
}

interface PageWithGhostCursor extends Page {
  __ghostCursorEnabled?: boolean;
}

/**
 * Get the center coordinates of an element
 */
async function getElementCenter(locator: Locator): Promise<{ x: number; y: number } | null> {
  try {
    const box = await locator.boundingBox({ timeout: 1000 });
    if (!box) return null;
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
  } catch {
    return null;
  }
}

/**
 * Animate the ghost cursor to a position and wait for animation
 */
async function animateCursorTo(page: Page, x: number, y: number): Promise<void> {
  try {
    await page.evaluate(([targetX, targetY]) => {
      return new Promise<void>((resolve) => {
        const ghostCursor = (window as unknown as { __ghostCursor?: GhostCursorAPI }).__ghostCursor;
        if (!ghostCursor) {
          resolve();
          return;
        }
        ghostCursor.moveTo(targetX, targetY, () => resolve());
      });
    }, [x, y] as const);
  } catch {
    // Ignore errors - cursor animation is non-critical
  }
}

/**
 * Trigger click animation on the ghost cursor
 */
async function animateCursorClick(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const ghostCursor = (window as unknown as { __ghostCursor?: GhostCursorAPI }).__ghostCursor;
      if (ghostCursor) {
        ghostCursor.click();
      }
    });
  } catch {
    // Ignore errors - cursor animation is non-critical
  }
}

/**
 * Ensure ghost cursor is initialized on the page
 */
async function ensureGhostCursor(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const ghostCursor = (window as unknown as { __ghostCursor?: GhostCursorAPI }).__ghostCursor;
      if (ghostCursor) {
        ghostCursor.ensureCursor();
        ghostCursor.show();
      }
    });
  } catch {
    // Ignore errors
  }
}

/**
 * Hook into page to add ghost cursor animations
 */
async function initGhostCursor(page: PageWithGhostCursor): Promise<void> {
  // Prevent double initialization
  if (page.__ghostCursorEnabled) return;
  page.__ghostCursorEnabled = true;

  // Store original methods
  const originalLocator = page.locator.bind(page);
  const originalGetByRole = page.getByRole.bind(page);
  const originalGetByText = page.getByText.bind(page);
  const originalGetByLabel = page.getByLabel.bind(page);
  const originalGetByPlaceholder = page.getByPlaceholder.bind(page);
  const originalGetByTestId = page.getByTestId.bind(page);

  /**
   * Wrap a locator to add ghost cursor animations
   */
  function wrapLocator(locator: Locator): Locator {
    const originalClick = locator.click.bind(locator);
    const originalDblclick = locator.dblclick.bind(locator);
    const originalHover = locator.hover.bind(locator);
    const originalFill = locator.fill.bind(locator);
    const originalSelectOption = locator.selectOption.bind(locator);
    const originalDragTo = locator.dragTo.bind(locator);
    
    // These methods may not exist on all locator versions
    const originalType = typeof locator.type === 'function' ? locator.type.bind(locator) : undefined;
    const originalPress = typeof locator.press === 'function' ? locator.press.bind(locator) : undefined;

    // Override click
    locator.click = async function(options?: Parameters<Locator['click']>[0]) {
      await ensureGhostCursor(page);
      const center = await getElementCenter(locator);
      if (center) {
        await animateCursorTo(page, center.x, center.y);
        await animateCursorClick(page);
      }
      return originalClick(options);
    };

    // Override dblclick
    locator.dblclick = async function(options?: Parameters<Locator['dblclick']>[0]) {
      await ensureGhostCursor(page);
      const center = await getElementCenter(locator);
      if (center) {
        await animateCursorTo(page, center.x, center.y);
        await animateCursorClick(page);
        // Small delay for double-click visual
        await new Promise(resolve => setTimeout(resolve, 100));
        await animateCursorClick(page);
      }
      return originalDblclick(options);
    };

    // Override hover
    locator.hover = async function(options?: Parameters<Locator['hover']>[0]) {
      await ensureGhostCursor(page);
      const center = await getElementCenter(locator);
      if (center) {
        await animateCursorTo(page, center.x, center.y);
      }
      return originalHover(options);
    };

    // Override fill
    locator.fill = async function(value: string, options?: Parameters<Locator['fill']>[1]) {
      await ensureGhostCursor(page);
      const center = await getElementCenter(locator);
      if (center) {
        await animateCursorTo(page, center.x, center.y);
        await animateCursorClick(page);
      }
      return originalFill(value, options);
    };

    // Override type (if exists)
    if (originalType) {
      locator.type = async function(text: string, options?: Parameters<Locator['type']>[1]) {
        await ensureGhostCursor(page);
        const center = await getElementCenter(locator);
        if (center) {
          await animateCursorTo(page, center.x, center.y);
          await animateCursorClick(page);
        }
        return originalType(text, options);
      } as typeof locator.type;
    }

    // Override press (if exists)  
    if (originalPress) {
      locator.press = async function(key: string, options?: Parameters<Locator['press']>[1]) {
        await ensureGhostCursor(page);
        const center = await getElementCenter(locator);
        if (center) {
          await animateCursorTo(page, center.x, center.y);
        }
        return originalPress(key, options);
      } as typeof locator.press;
    }

    // Override selectOption
    locator.selectOption = async function(
      values: string | string[] | { value?: string; label?: string; index?: number } | { value?: string; label?: string; index?: number }[] | ElementHandle | ElementHandle[],
      options?: Parameters<Locator['selectOption']>[1]
    ) {
      await ensureGhostCursor(page);
      const center = await getElementCenter(locator);
      if (center) {
        await animateCursorTo(page, center.x, center.y);
        await animateCursorClick(page);
      }
      return originalSelectOption(values, options);
    };

    // Override dragTo
    locator.dragTo = async function(target: Locator, options?: Parameters<Locator['dragTo']>[1]) {
      await ensureGhostCursor(page);
      const startCenter = await getElementCenter(locator);
      const endCenter = await getElementCenter(target);
      
      if (startCenter) {
        await animateCursorTo(page, startCenter.x, startCenter.y);
        await animateCursorClick(page);
      }
      if (endCenter) {
        await animateCursorTo(page, endCenter.x, endCenter.y);
      }
      return originalDragTo(target, options);
    };

    return locator;
  }

  // Override locator methods to wrap results
  page.locator = function(selector: string, options?: Parameters<Page['locator']>[1]): Locator {
    return wrapLocator(originalLocator(selector, options));
  };

  page.getByRole = function(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return wrapLocator(originalGetByRole(role, options));
  };

  page.getByText = function(text: Parameters<Page['getByText']>[0], options?: Parameters<Page['getByText']>[1]): Locator {
    return wrapLocator(originalGetByText(text, options));
  };

  page.getByLabel = function(text: Parameters<Page['getByLabel']>[0], options?: Parameters<Page['getByLabel']>[1]): Locator {
    return wrapLocator(originalGetByLabel(text, options));
  };

  page.getByPlaceholder = function(text: Parameters<Page['getByPlaceholder']>[0], options?: Parameters<Page['getByPlaceholder']>[1]): Locator {
    return wrapLocator(originalGetByPlaceholder(text, options));
  };

  page.getByTestId = function(testId: Parameters<Page['getByTestId']>[0]): Locator {
    return wrapLocator(originalGetByTestId(testId));
  };

  // Re-inject cursor on navigation
  page.on('load', async () => {
    await ensureGhostCursor(page);
  });

  // Initial cursor setup
  await ensureGhostCursor(page);
}

/**
 * Default export for init-page
 */
export default async function({ page }: { page: Page }): Promise<void> {
  await initGhostCursor(page);
}
