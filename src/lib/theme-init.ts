/**
 * Theme initialization script
 * This runs before React hydrates to prevent FOUC (Flash of Unstyled Content)
 */
export const themeInitScript = `
(function() {
  try {
    const theme = localStorage.getItem('chaoslimba-theme');
    const mode = localStorage.getItem('chaoslimba-mode');
    const html = document.documentElement;

    // Apply theme class
    if (theme === 'forest') {
      html.classList.add('theme-forest');
    } else if (theme === 'nostalgia') {
      html.classList.add('theme-nostalgia');
    }

    // Apply mode class
    if (mode === 'dark') {
      html.classList.add('dark');
    }
  } catch (e) {
    console.error('Failed to initialize theme:', e);
  }
})();
`
