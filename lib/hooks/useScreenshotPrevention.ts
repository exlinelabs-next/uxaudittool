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
      const mac = e.metaKey;
      const win = e.ctrlKey || e.key === 'PrintScreen';

      // Mac: Cmd+Shift+3 (full), Cmd+Shift+4 (area), Cmd+Shift+5 (tools)
      if (mac && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        trigger();
        return;
      }
      // Windows: PrintScreen, Win+Shift+S snip tool
      if (e.key === 'PrintScreen' || (win && e.shiftKey && e.key.toLowerCase() === 's')) {
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
