const WIKI_ROOT = "/subdomains/wiki-omni/";
const WIKI_INDEX_PATH = `${WIKI_ROOT}contentpages.json`;

const legacyPageMap = {
  "keybinds": "/subdomains/wiki-omni/keybinds/",
  "characters": "/subdomains/wiki-omni/characters/",
  "map-locations": "/subdomains/wiki-omni/map-locations/",
  "storyline": "/subdomains/wiki-omni/storyline/",
  "the-camp": "/subdomains/wiki-omni/the-camp/",
};

const categoryDetails = {
  all: { label: "All", icon: "sparkles" },
  reference: { label: "Reference", icon: "keyboard" },
  cast: { label: "Cast", icon: "users" },
  world: { label: "World", icon: "map" },
  story: { label: "Story", icon: "route" },
  hub: { label: "Hub", icon: "tent" },
  meta: { label: "Meta", icon: "info" },
};

const categoryOrder = ["meta", "story", "cast", "world", "hub", "reference"];

let wikiLinkTerms = [];

handleLegacyQueryPage();
initializeWiki();

async function initializeWiki() {
  let wikiIndex = null;

  try {
    wikiIndex = await fetchJson(WIKI_INDEX_PATH);
    wikiIndex.pages = await hydrateWikiPages(wikiIndex.pages);
    wikiLinkTerms = buildWikiLinkTerms(wikiIndex.pages);
    renderArchiveOverview(wikiIndex);
    renderArchive(wikiIndex);
    renderEntryPage(wikiIndex);
    renderIcons();
  } catch (error) {
    console.warn("Could not load editable wiki content. Using the HTML fallback.", error);
  }

  initializeArchiveFilters();
  initializeSectionNav();
}

function buildWikiLinkTerms(pages) {
  return arrayItems(pages)
    .flatMap((page) => {
      const path = page.path || `${WIKI_ROOT}${page.slug}/`;
      const labels = [page.title, ...arrayText(page.aliases)];

      return labels
        .filter((label) => label && page.slug && path)
        .map((label) => ({
          label,
          path,
          slug: page.slug,
        }));
    })
    .sort((first, second) => second.label.length - first.label.length);
}

async function hydrateWikiPages(pages) {
  if (!Array.isArray(pages)) {
    return [];
  }

  return Promise.all(
    pages.map(async (page) => {
      try {
        const pageData = await fetchJson(getPageDataPath(page));

        return {
          ...page,
          ...pageData,
          category: page.category || pageData.category,
          file: page.file || pageData.file,
          keywords: page.keywords || pageData.keywords,
          path: page.path || pageData.path,
        };
      } catch (error) {
        console.warn(`Could not load wiki page data for "${page.slug}".`, error);
        return page;
      }
    }),
  );
}

function handleLegacyQueryPage() {
  const legacyNotice = document.querySelector("[data-legacy-notice]");
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

async function fetchJson(path) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json();
}

function renderArchive(wikiIndex) {
  const archiveRoot = document.querySelector("[data-archive-root]");

  if (!archiveRoot || !Array.isArray(wikiIndex.pages)) {
    return;
  }

  const groupedPages = groupPagesByCategory(wikiIndex.pages);
  const orderedCategories = [
    ...categoryOrder,
    ...Object.keys(groupedPages).filter((category) => !categoryOrder.includes(category)),
  ];

  archiveRoot.classList.add("wikiArchiveGroups");
  archiveRoot.innerHTML = orderedCategories
    .filter((category) => groupedPages[category]?.length)
    .map((category) => renderArchiveGroup(category, groupedPages[category]))
    .join("");
}

function renderArchiveOverview(wikiIndex) {
  const statsRoot = document.querySelector("[data-archive-stats]");

  if (!statsRoot || !Array.isArray(wikiIndex.pages)) {
    return;
  }

  const pages = wikiIndex.pages;
  const castCount = pages.filter((page) => page.category === "cast").length;
  const worldCount = pages.filter((page) => page.category === "world" || page.category === "hub").length;
  const storyCount = pages.filter((page) => page.category === "story" || page.category === "meta").length;
  const linkedCount = pages.filter((page) => arrayText(page.aliases).length > 0).length;
  const stats = [
    { label: "Entries", value: pages.length },
    { label: "Cast files", value: castCount },
    { label: "Locations", value: worldCount },
    { label: "Auto-linked", value: linkedCount || storyCount },
  ];

  statsRoot.innerHTML = stats.map((stat) => `
    <div class="wikiStat">
      <strong>${escapeHtml(stat.value)}</strong>
      <span>${escapeHtml(stat.label)}</span>
    </div>
  `).join("");
}

function groupPagesByCategory(pages) {
  return pages.reduce((groups, page) => {
    const category = page.category || "meta";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(page);
    return groups;
  }, {});
}

function renderArchiveGroup(categoryKey, pages) {
  const category = getCategory(categoryKey);

  return `
    <section class="wikiArchiveGroup" data-group="${escapeAttribute(categoryKey)}">
      <div class="wikiGroupHeading">
        <p class="wikiEyebrow"><i data-lucide="${category.icon}"></i>${escapeHtml(category.label)}</p>
        <h2>${escapeHtml(getArchiveGroupTitle(categoryKey))}</h2>
      </div>
      <div class="wikiArchiveList">
        ${pages.map(renderArchiveCard).join("")}
      </div>
    </section>
  `;
}

function renderArchiveCard(page) {
  const category = getCategory(page.category);
  const keywords = arrayText(page.keywords).join(" ");
  const tags = arrayText(page.tags || page.keywords).slice(0, 2);

  return `
    <a
      class="wikiArchiveCard"
      href="${escapeAttribute(page.path || `${WIKI_ROOT}${page.slug}/`)}"
      data-entry-card
      data-category="${escapeAttribute(page.category || "")}"
      data-title="${escapeAttribute(page.title || "")}"
      data-keywords="${escapeAttribute(keywords)}"
    >
      ${page.image ? `
        <img
          src="${escapeAttribute(page.image)}"
          alt="${escapeAttribute(page.imageAlt || `${page.title || "Wiki"} preview`)}"
          loading="lazy"
          decoding="async"
        >
      ` : ""}
      <div class="wikiArchiveCardText">
        <span class="wikiCategory"><i data-lucide="${category.icon}"></i>${escapeHtml(category.label)}</span>
        <h3 class="wikiArchiveCardTitle">${escapeHtml(page.title)}</h3>
        <p class="wikiArchiveCardSummary">${escapeHtml(page.summary)}</p>
        ${tags.length > 0 ? `<div class="wikiCardMeta">${tags.map((tag) => `<span class="wikiTag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      </div>
    </a>
  `;
}

function getArchiveGroupTitle(categoryKey) {
  const titles = {
    meta: "How the game works",
    story: "Story and reveal path",
    cast: "Characters and almost-humans",
    world: "Places and routes",
    hub: "Camp systems",
    reference: "Player reference",
  };

  return titles[categoryKey] || getCategory(categoryKey).label;
}

function renderEntryPage(wikiIndex) {
  const slug = getCurrentEntrySlug();
  const articleContent = document.querySelector(".wikiArticleContent");

  if (!slug || !articleContent || !Array.isArray(wikiIndex.pages)) {
    return;
  }

  const pageSummary = wikiIndex.pages.find((page) => page.slug === slug);

  if (!pageSummary) {
    return;
  }

  updateEntryMeta(pageSummary);
  articleContent.innerHTML = renderEntryContent(pageSummary, wikiIndex.pages);
  renderEntryAside(pageSummary, wikiIndex.pages);
}

function getCurrentEntrySlug() {
  const path = window.location.pathname.replace(/\/index\.html$/, "/");
  const match = path.match(/^\/subdomains\/wiki-omni\/([^/]+)\/?$/);

  return match ? match[1] : "";
}

function getPageDataPath(page) {
  if (page.file && page.file.startsWith("./")) {
    return `${WIKI_ROOT}${page.file.slice(2)}`;
  }

  return page.file || `${WIKI_ROOT}pages/${page.slug}.json`;
}

function updateEntryMeta(page) {
  const category = getCategory(page.category);
  const status = document.querySelector(".wikiArticleStatus");

  if (status) {
    status.textContent = `Archive / ${category.label}`;
  }

  if (page.title) {
    document.title = `${page.title} | Omni Wiki`;
    setMeta("property", "og:title", `${page.title} | Omni Wiki`);
    setMeta("name", "twitter:title", `${page.title} | Omni Wiki`);
  }

  if (page.summary) {
    setMeta("name", "description", page.summary);
    setMeta("property", "og:description", page.summary);
    setMeta("name", "twitter:description", page.summary);
  }

  if (page.image) {
    setMeta("property", "og:image", page.image);
    setMeta("name", "twitter:image", page.image);
  }
}

function setMeta(attribute, value, content) {
  const meta = document.querySelector(`meta[${attribute}="${value}"]`);

  if (meta) {
    meta.setAttribute("content", content);
  }
}

function renderEntryContent(page, pages) {
  const sections = arrayItems(page.sections);
  const shortcutGroups = arrayItems(page.shortcutGroups);

  return `
    ${renderEntryHero(page)}
    ${renderDetails(page.details, page.slug)}
    ${renderFactList(page.facts, page.slug)}
    ${renderShortcutGroups(shortcutGroups, page.slug)}
    ${renderSections(sections, page.slug)}
    ${renderEntryPager(page, pages)}
  `;
}

function renderEntryHero(page) {
  const category = getCategory(page.category);
  const tags = arrayText(page.tags).length > 0 ? arrayText(page.tags) : [category.label];
  const showImage = page.showImage !== false && page.image;

  return `
    <div class="wikiArticleHero${showImage ? "" : " is-text-only"}">
      ${showImage ? `<img class="wikiArticleHeroImage" src="${escapeAttribute(page.image)}" alt="${escapeAttribute(page.imageAlt || `${page.title} preview`)}">` : ""}
      <div>
        <div class="wikiArticleMeta">
          ${tags.map((tag) => `<span class="wikiTag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <h1 class="wikiArticleTitle">${escapeHtml(page.title)}</h1>
        ${page.summary ? `<p class="wikiArticleSummary">${autoLinkText(page.summary, page.slug)}</p>` : ""}
        ${page.intro ? `<p class="wikiIntro">${autoLinkText(page.intro, page.slug)}</p>` : ""}
      </div>
    </div>
  `;
}

function renderDetails(details, currentSlug) {
  const detailItems = arrayItems(details).filter((item) => item && item.label && item.value);

  if (detailItems.length === 0) {
    return "";
  }

  return `
    <dl class="wikiInfoBox">
      ${detailItems.map((item) => `
        <div class="wikiInfoRow">
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${autoLinkText(item.value, currentSlug)}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function renderFactList(facts, currentSlug) {
  const factItems = arrayText(facts);

  if (factItems.length === 0) {
    return "";
  }

  return `<ul class="wikiFactList">${factItems.map((fact) => `<li>${autoLinkText(fact, currentSlug)}</li>`).join("")}</ul>`;
}

function renderShortcutGroups(groups, currentSlug) {
  if (groups.length === 0) {
    return "";
  }

  return `
    <div class="wikiShortcutGroups">
      ${groups.map((group) => {
        const id = escapeAttribute(group.id || slugify(group.title));
        const entries = arrayItems(group.entries);

        return `
          <section class="wikiShortcutGroup" id="${id}">
            <div class="wikiShortcutGroupHeader">
              <div class="wikiShortcutGroupHeaderCopy">
                <h2 class="wikiShortcutGroupTitle">${escapeHtml(group.title)}</h2>
                ${group.description ? `<p class="wikiShortcutGroupDescription">${autoLinkText(group.description, currentSlug)}</p>` : ""}
              </div>
              ${group.tag ? `<span class="wikiTag">${escapeHtml(group.tag)}</span>` : ""}
            </div>
            <div class="wikiShortcutList">
              ${entries.map((entry) => renderShortcutRow(entry, currentSlug)).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderShortcutRow(entry, currentSlug) {
  return `
    <div class="wikiShortcutRow">
      <div class="wikiShortcutCopy">
        <strong class="wikiShortcutAction">${escapeHtml(entry.action)}</strong>
        ${entry.description ? `<p class="wikiShortcutDescription">${autoLinkText(entry.description, currentSlug)}</p>` : ""}
      </div>
      <div class="wikiShortcutKeys">${arrayText(entry.keys).map((key) => `<kbd class="wikiKeycap">${escapeHtml(key)}</kbd>`).join("")}</div>
    </div>
  `;
}

function renderSections(sections, currentSlug) {
  if (sections.length === 0) {
    return "";
  }

  return `
    <div class="wikiSections">
      ${sections.map((section) => {
        const id = escapeAttribute(section.id || slugify(section.heading));
        const paragraphs = arrayText(section.paragraphs);
        const items = arrayText(section.items);

        return `
          <section class="wikiSection" id="${id}">
            <h2>${escapeHtml(section.heading)}</h2>
            ${paragraphs.map((paragraph) => `<p>${autoLinkText(paragraph, currentSlug)}</p>`).join("")}
            ${items.length > 0 ? `<ul>${items.map((item) => `<li>${autoLinkText(item, currentSlug)}</li>`).join("")}</ul>` : ""}
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderEntryPager(page, pages) {
  const index = pages.findIndex((item) => item.slug === page.slug);

  if (index === -1) {
    return "";
  }

  const previousPage = pages[index - 1];
  const nextPage = pages[index + 1];
  const links = [
    previousPage ? renderPagerLink("Previous entry", previousPage, `Step back into ${previousPage.title}.`) : renderArchivePagerLink("Archive", "Back to all entries"),
    nextPage ? renderPagerLink("Next entry", nextPage, `Continue into ${nextPage.title}.`) : renderArchivePagerLink("Archive", "Return to all entries"),
  ];

  return `<nav class="wikiEntryPager" aria-label="Browse nearby archive entries">${links.join("")}</nav>`;
}

function renderPagerLink(label, page, text) {
  return `
    <a class="wikiEntryPagerLink" href="${escapeAttribute(page.path || `${WIKI_ROOT}${page.slug}/`)}">
      <span class="wikiEntryPagerLabel">${escapeHtml(label)}</span>
      <strong class="wikiEntryPagerTitle">${escapeHtml(page.title)}</strong>
      <span class="wikiEntryPagerText">${escapeHtml(page.pagerText || text)}</span>
    </a>
  `;
}

function renderArchivePagerLink(label, title) {
  return `
    <a class="wikiEntryPagerLink" href="${WIKI_ROOT}">
      <span class="wikiEntryPagerLabel">${escapeHtml(label)}</span>
      <strong class="wikiEntryPagerTitle">${escapeHtml(title)}</strong>
      <span class="wikiEntryPagerText">Open the full archive and choose another topic.</span>
    </a>
  `;
}

function renderEntryAside(page, pages) {
  const aside = document.querySelector(".wikiEntryAside");

  if (!aside) {
    return;
  }

  const groups = arrayItems(page.shortcutGroups).map((group) => ({
    id: group.id || slugify(group.title),
    label: group.title,
  }));
  const sections = arrayItems(page.sections).map((section) => ({
    id: section.id || slugify(section.heading),
    label: section.heading,
  }));
  const links = [...groups, ...sections];
  const relatedPages = getRelatedPages(page, pages);
  const detailItems = arrayItems(page.details).filter((item) => item && item.label && item.value).slice(0, 4);

  aside.innerHTML = `
    ${links.length > 0 ? `
      <div class="wikiEntryAsideBlock">
        <p class="wikiAsideLabel"><i data-lucide="list"></i>On this page</p>
        <nav class="wikiSectionNav" aria-label="${escapeAttribute(page.title)} sections">
          ${links.map((link) => `<a href="#${escapeAttribute(link.id)}">${escapeHtml(link.label)}</a>`).join("")}
        </nav>
      </div>
    ` : ""}
    ${detailItems.length > 0 ? `
      <div class="wikiEntryAsideBlock">
        <p class="wikiAsideLabel"><i data-lucide="badge-info"></i>Entry details</p>
        <dl class="wikiAsideFacts">
          ${detailItems.map((item) => `
            <div>
              <dt>${escapeHtml(item.label)}</dt>
              <dd>${autoLinkText(item.value, page.slug)}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    ` : ""}
    ${relatedPages.length > 0 ? `
      <div class="wikiEntryAsideBlock">
        <p class="wikiAsideLabel"><i data-lucide="network"></i>Related</p>
        <div class="wikiEntryList">
          ${relatedPages.map((relatedPage) => `
            <a class="wikiEntryLink" href="${escapeAttribute(relatedPage.path || `${WIKI_ROOT}${relatedPage.slug}/`)}">
              <span class="wikiEntryLinkText">
                <strong class="wikiEntryLinkTitle">${escapeHtml(relatedPage.title)}</strong>
                <span class="wikiEntryLinkSummary">${escapeHtml(relatedPage.summary || getCategory(relatedPage.category).label)}</span>
              </span>
            </a>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

function getRelatedPages(page, pages) {
  const pageKeywords = new Set(arrayText(page.keywords).map((keyword) => keyword.toLowerCase()));

  return arrayItems(pages)
    .filter((candidate) => candidate.slug !== page.slug)
    .map((candidate) => {
      const categoryScore = candidate.category === page.category ? 2 : 0;
      const keywordScore = arrayText(candidate.keywords).filter((keyword) => pageKeywords.has(keyword.toLowerCase())).length;

      return {
        ...candidate,
        score: categoryScore + keywordScore,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 4);
}

function initializeArchiveFilters() {
  const searchInput = document.querySelector("[data-search]");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-entry-card]"));
  const groups = Array.from(document.querySelectorAll("[data-group]"));
  const archiveRoot = document.querySelector("[data-archive-root]");
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const resetButton = document.querySelector("[data-reset-filters]");

  if (!searchInput || filterButtons.length === 0 || cards.length === 0) {
    return;
  }

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

function initializeSectionNav() {
  const sectionNavLinks = Array.from(document.querySelectorAll(".wikiSectionNav a[href^='#']"));

  if (sectionNavLinks.length === 0) {
    return;
  }

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

  if (sectionTargets.length === 0) {
    return;
  }

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

function getCategory(value) {
  return categoryDetails[value] || { label: titleCase(value || "Wiki"), icon: "book-open" };
}

function arrayItems(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function arrayText(value) {
  return arrayItems(value).filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function autoLinkText(value, currentSlug) {
  const text = String(value ?? "");
  const terms = wikiLinkTerms.filter((term) => term.slug !== currentSlug && term.label);

  if (terms.length === 0 || !text) {
    return escapeHtml(text);
  }

  const matcher = new RegExp(`(^|[^A-Za-z0-9])(${terms.map((term) => escapeRegExp(term.label)).join("|")})(?=$|[^A-Za-z0-9])`, "gi");
  let lastIndex = 0;
  let output = "";
  let match;

  while ((match = matcher.exec(text)) !== null) {
    const prefix = match[1] || "";
    const label = match[2];
    const labelStart = match.index + prefix.length;
    const page = terms.find((term) => term.label.toLowerCase() === label.toLowerCase());

    if (!page) {
      continue;
    }

    output += escapeHtml(text.slice(lastIndex, labelStart));
    output += `<a class="wikiInlineLink" href="${escapeAttribute(page.path)}">${escapeHtml(label)}</a>`;
    lastIndex = labelStart + label.length;
  }

  output += escapeHtml(text.slice(lastIndex));

  return output;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
        focusable: "false",
      },
    });
  }
}
