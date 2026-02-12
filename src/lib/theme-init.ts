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
    var themeMap = {
      forest: 'theme-forest',
      nostalgia: 'theme-nostalgia',
      'wild-runes': 'theme-wild-runes',
      bathhouse: 'theme-bathhouse',
      vinyl: 'theme-vinyl',
      'neon-circuit': 'theme-neon-circuit',
      'soft-bloom': 'theme-soft-bloom'
    };
    if (theme && themeMap[theme]) {
      html.classList.add(themeMap[theme]);
    }

    // Apply mode class
    if (mode === 'dark') {
      html.classList.add('dark');
    }
  } catch (e) {
    // Theme init failed — will use defaults
  }
})();
`
