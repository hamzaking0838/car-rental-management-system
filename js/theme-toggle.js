/*
 * theme-toggle.js
 *
 * This script manages switching between two colour palettes on the fly: the
 * default (aqua/teal) scheme and a gold/black/white scheme. The selected
 * palette is stored in localStorage so that it persists across page loads.
 *
 * When the script runs it applies the saved palette (adding or removing the
 * 'gold-theme' class on the <body>). A global toggle function is attached
 * to a button with id 'themeToggleBtn' if present; clicking it flips the
 * palette and re‑applies the body class. Because the navbar is loaded
 * asynchronously in some pages, the script listens for a custom
 * 'sectionsLoaded' event to rebind the click handler when the navbar
 * markup becomes available.
 */
(function() {
  /**
   * Apply the stored theme by adding or removing the 'gold-theme' class on
   * the document body. If no theme is stored or it's not 'gold', the
   * default palette is used (no class).
   */
  function applyTheme() {
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'gold') {
        document.body.classList.add('gold-theme');
      } else {
        document.body.classList.remove('gold-theme');
      }
      // After toggling the theme class, synchronise chatbot colours with the
      // active palette.  Without this call the chatbot may retain the
      // previous accent colours when the page is reloaded or the theme
      // toggled.  See updateChatbotColors() below for implementation.
      updateChatbotColors();
    } catch (err) {
      // localStorage might be unavailable (e.g. in private mode); gracefully
      // degrade by not applying the gold theme.
    }
  }

  /**
   * Toggle between the default and gold themes. Saves the new value to
   * localStorage and reapplies the theme.
   */
  function toggleTheme() {
    try {
      const current = localStorage.getItem('theme');
      const next = current === 'gold' ? 'default' : 'gold';
      localStorage.setItem('theme', next);
    } catch (err) {
      // If we can't write to localStorage, still toggle the class on this page.
      const hasGold = document.body.classList.contains('gold-theme');
      if (!hasGold) {
        document.body.classList.add('gold-theme');
      } else {
        document.body.classList.remove('gold-theme');
      }
      // Immediately update the chatbot colours when toggling via fallback.
      updateChatbotColors();
      return;
    }
    applyTheme();
  }

  /**
   * Synchronise the chatbot colour variables with the currently active
   * primary palette.  The chatbot widget defines its own custom
   * properties (--brand, --brand-light and --brand-dark) to style
   * the toggle button, header and user bubbles.  These properties are
   * normally set to default gold values.  To ensure the widget adopts
   * the current theme’s accent colours we read the primary CSS
   * variables from the root and reassign the chatbot variables.  If
   * the primary variables are unavailable this function falls back to
   * leaving the existing values intact.  This helper is safe to call on
   * every theme change and page load.
   */
  function updateChatbotColors() {
    try {
      const computed = getComputedStyle(document.documentElement);
      const primary = computed.getPropertyValue('--primary-color').trim();
      const hoverStart = computed.getPropertyValue('--primary-hover-start').trim();
      const hoverEnd = computed.getPropertyValue('--primary-hover-end').trim();
      if (primary) {
        document.documentElement.style.setProperty('--brand', primary);
      }
      if (hoverStart) {
        document.documentElement.style.setProperty('--brand-light', hoverStart);
      }
      if (hoverEnd) {
        document.documentElement.style.setProperty('--brand-dark', hoverEnd);
      }
    } catch (err) {
      // Silently ignore errors (e.g. computed style not available)
    }
  }

  /**
   * Attach the click handler to the toggle button if it exists. Called on
   * DOMContentLoaded and again when sections are dynamically loaded.
   */
  function attachToggleHandler() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn && !btn.dataset.themeBound) {
      btn.addEventListener('click', toggleTheme);
      // Mark the button so we don't bind multiple handlers.
      btn.dataset.themeBound = 'true';
    }
  }

  // Apply the theme as soon as the DOM is ready.
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    attachToggleHandler();
  });

  // Some pages load their navbar via AJAX and dispatch this event when
  // finished. Re‑attach the handler to capture the button in that markup.
  document.addEventListener('sectionsLoaded', () => {
    attachToggleHandler();
  });
})();