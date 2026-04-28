const legacyPageMap = {
  "keybinds": "/subdomains/wiki-omni/keybinds/",
  "characters": "/subdomains/wiki-omni/characters/",
  "map-locations": "/subdomains/wiki-omni/map-locations/",
  "storyline": "/subdomains/wiki-omni/storyline/",
  "the-camp": "/subdomains/wiki-omni/the-camp/",
};

const searchInput = document.querySelector("[data-search]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const cards = Array.from(document.querySelectorAll("[data-entry-card]"));
const groups = Array.from(document.querySelectorAll("[data-group]"));
const archiveRoot = document.querySelector("[data-archive-root]");
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty-state]");
const legacyNotice = document.querySelector("[data-legacy-notice]");
const resetButton = document.querySelector("[data-reset-filters]");
const sectionNavLinks = Array.from(document.querySelectorAll(".wikiSectionNav a[href^='#']"));

handleLegacyQueryPage();

if (searchInput && filterButtons.length > 0 && cards.length > 0) {
  const params = new URLSearchParams(window.location.search);
  let activeFilter = getInitialFilter(params.get("category"));
  const initialQuery = params.get("q") || "";

  searchInput.value = initialQuery;
  setActiveFilterButton(activeFilter);

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      searchInput.value = "";
      activeFilter = "all";
      setActiveFilterButton(activeFilter);
      applyFilters();
      searchInput.focus();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      setActiveFilterButton(activeFilter);
      applyFilters();
    });
  });

  searchInput.addEventListener("input", () => {
    applyFilters();
  });

  applyFilters();

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);
    let visibleCount = 0;

    cards.forEach((card) => {
      const category = card.dataset.category || "";
      const title = card.dataset.title || "";
      const keywords = card.dataset.keywords || "";
      const haystack = `${title} ${keywords} ${card.textContent || ""}`.toLowerCase();

      const matchesFilter = activeFilter === "all" || category === activeFilter;
      const matchesSearch = queryTerms.length === 0 || queryTerms.every((term) => haystack.includes(term));
      const isVisible = matchesFilter && matchesSearch;

      card.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    groups.forEach((group) => {
      const visibleCards = group.querySelectorAll("[data-entry-card]:not([hidden])").length;
      group.hidden = visibleCards === 0;
    });

    if (archiveRoot) {
      archiveRoot.hidden = visibleCount === 0;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }

    if (resultCount) {
      const parts = [visibleCount === 1 ? "Showing 1 entry" : `Showing ${visibleCount} entries`];

      if (activeFilter !== "all") {
        parts.push(`in ${getFilterLabel(activeFilter)}`);
      }

      if (query) {
        parts.push(`for "${query}"`);
      }

      resultCount.textContent = `${parts.join(" ")}.`;
    }

    if (resetButton) {
      resetButton.disabled = activeFilter === "all" && query === "";
    }

    updateUrlState(activeFilter, query);
  }

  function setActiveFilterButton(activeValue) {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === activeValue;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function getInitialFilter(value) {
    if (value && filterButtons.some((button) => button.dataset.filter === value)) {
      return value;
    }

    return "all";
  }

  function getFilterLabel(value) {
    const matchingButton = filterButtons.find((button) => button.dataset.filter === value);
    return matchingButton ? matchingButton.textContent.trim().toLowerCase() : value;
  }

  function updateUrlState(filter, query) {
    const nextUrl = new URL(window.location.href);

    nextUrl.searchParams.delete("page");

    if (query) {
      nextUrl.searchParams.set("q", query);
    } else {
      nextUrl.searchParams.delete("q");
    }

    if (filter !== "all") {
      nextUrl.searchParams.set("category", filter);
    } else {
      nextUrl.searchParams.delete("category");
    }

    window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }
}

function handleLegacyQueryPage() {
  const params = new URLSearchParams(window.location.search);
  const legacyPage = params.get("page");

  if (!legacyPage) {
    return;
  }

  if (legacyPageMap[legacyPage]) {
    window.location.replace(legacyPageMap[legacyPage]);
    return;
  }

  if (legacyNotice) {
    legacyNotice.hidden = false;
    legacyNotice.textContent = `There is no archive entry called "${legacyPage}". Use the archive below to open another page.`;
  }
}

if (sectionNavLinks.length > 0) {
  const sectionTargets = sectionNavLinks
    .map((link) => {
      const sectionId = decodeURIComponent(link.getAttribute("href").slice(1));
      const target = document.getElementById(sectionId);

      if (!target) {
        return null;
      }

      return { link, sectionId, target };
    })
    .filter(Boolean);

  if (sectionTargets.length > 0) {
    const updateActiveSection = () => {
      let activeSectionId = sectionTargets[0].sectionId;

      sectionTargets.forEach(({ sectionId, target }) => {
        if (target.getBoundingClientRect().top <= 160) {
          activeSectionId = sectionId;
        }
      });

      sectionTargets.forEach(({ link, sectionId }) => {
        const isActive = sectionId === activeSectionId;
        link.classList.toggle("is-active", isActive);

        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    sectionTargets.forEach(({ link, sectionId }) => {
      link.addEventListener("click", () => {
        sectionTargets.forEach(({ link: otherLink, sectionId: otherId }) => {
          const isActive = otherId === sectionId;
          otherLink.classList.toggle("is-active", isActive);

          if (isActive) {
            otherLink.setAttribute("aria-current", "location");
          } else {
            otherLink.removeAttribute("aria-current");
          }
        });
      });
    });

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);
    updateActiveSection();
  }
}
