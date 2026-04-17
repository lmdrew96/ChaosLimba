/**
 * Theme + accessibility initialization script
 * Applies theme, reduce-motion, and font-scale classes before React hydrates
 * (avoids FOUC). Dark/light mode is handled by next-themes (its own script).
 *
 * Server preferences sync into localStorage on settings save (and on first
 * preferences load), so the inline script can read them synchronously here.
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

    // Reduce motion: user-level override on top of OS prefers-reduced-motion
    if (localStorage.getItem('chaoslimba-reduce-motion') === 'true') {
      document.documentElement.classList.add('reduce-motion');
    }

    // Font scale: small | medium (default) | large | xlarge
    var scale = localStorage.getItem('chaoslimba-font-scale');
    if (scale && scale !== 'medium' && ['small', 'large', 'xlarge'].indexOf(scale) >= 0) {
      document.documentElement.classList.add('font-scale-' + scale);
    }
  } catch (e) {}
})();
`
