/**
 * Theme initialization script
 * Applies the custom color theme class before React hydrates to prevent FOUC.
 * Dark/light mode is handled by next-themes (its own inline script).
 */
export const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('chaoslimba-theme');
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
      document.documentElement.classList.add(themeMap[theme]);
    }
  } catch (e) {}
})();
`
