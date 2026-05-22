'use client';

import { useEffect, useState } from 'react';

/**
 * Detects screenshot attempts and returns a flag to show a blocking overlay.
 *
 * Techniques used:
 * 1. Keyboard shortcut detection (Mac: Cmd+Shift+3/4/5, Win/Linux: PrintScreen, Win+Shift+S)
 * 2. visibilitychange with heuristic (very fast hide+show = screenshot tool)
 * 3. Screen capture API detection via getDisplayMedia interception
 *
 * The overlay should show `isBlocked === true`, cover the content, and auto-hide after 2s.
 */
export function useScreenshotPrevention() {
  const [isBlocked, setIsBlocked] = useState(false);

  function trigger() {
    setIsBlocked(true);
    setTimeout(() => setIsBlocked(false), 2500);
  }

  useEffect(() => {
    // 1. Keyboard shortcuts
    function onKeyDown(e: KeyboardEvent) {
      // Use e.code (physical key) not e.key — when Shift is held, e.key for '4' becomes '$', '3' → '#', '5' → '%'
      const mac = e.metaKey;

      // Mac: Cmd+Shift+3 (full screen), Cmd+Shift+4 (area/crosshair), Cmd+Shift+5 (tools)
      if (mac && e.shiftKey && ['Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        trigger();
        return;
      }
      // Windows / Linux: PrintScreen alone, or Win+Shift+S (Snipping Tool)
      if (e.key === 'PrintScreen') {
        trigger();
        return;
      }
      // Win+Shift+S — metaKey doesn't fire on Windows for the Win key,
      // but some browsers report it; also catch Ctrl+Shift+S as a common alias
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
        trigger();
        return;
      }
    }

    // 2. Screen capture API interception
    //    Wrap navigator.mediaDevices.getDisplayMedia so we know when screen sharing starts
    const originalGetDisplayMedia =
      typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia
        ? navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices)
        : null;

    if (originalGetDisplayMedia && navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = async function (options?: DisplayMediaStreamOptions) {
        trigger();
        return originalGetDisplayMedia(options);
      };
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore original getDisplayMedia
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, []);

  return { isBlocked };
}
