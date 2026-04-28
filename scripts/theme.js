(() => {
  const STORAGE_KEY = "hoyem-theme";
  const LIGHT_THEME = "light";
  const DARK_THEME = "dark";
  const THEME_COLORS = {
    light: "#f3ece4",
    dark: "#110f0e",
  };

  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

  function readStoredTheme() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === LIGHT_THEME || value === DARK_THEME ? value : null;
    } catch {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors and keep the active theme in memory for this session.
    }
  }

  function getSystemTheme() {
    return mediaQuery.matches ? LIGHT_THEME : DARK_THEME;
  }

  function getThemeMeta() {
    return document.querySelector("meta[name='theme-color']");
  }

  function updateToggleButtons(activeTheme) {
    const nextTheme = activeTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    const nextLabel = nextTheme === LIGHT_THEME ? "Light" : "Dark";

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.dataset.themeCurrent = activeTheme;
      button.setAttribute("aria-pressed", activeTheme === LIGHT_THEME ? "true" : "false");
      button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      button.setAttribute("title", `Switch to ${nextTheme} mode`);

      const label = button.querySelector("[data-theme-toggle-label]");
      if (label) {
        label.textContent = nextLabel;
      }
    });
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const themeMeta = getThemeMeta();
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[theme]);
    }

    updateToggleButtons(theme);
  }

  function initializeThemeToggle() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const currentTheme = root.dataset.theme || getSystemTheme();
        const nextTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

        writeStoredTheme(nextTheme);
        applyTheme(nextTheme);
      });
    });

    updateToggleButtons(root.dataset.theme || getSystemTheme());
  }

  applyTheme(readStoredTheme() || getSystemTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeThemeToggle, { once: true });
  } else {
    initializeThemeToggle();
  }

  const syncWithSystemTheme = (event) => {
    if (readStoredTheme()) {
      return;
    }

    applyTheme(event.matches ? LIGHT_THEME : DARK_THEME);
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", syncWithSystemTheme);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(syncWithSystemTheme);
  }
})();
