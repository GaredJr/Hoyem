const wikiRoot = document.querySelector("[data-wiki-root]");

if (wikiRoot) {
  const manifestUrl = new URL("./contentpages.json", window.location.href);
  const pageCache = new Map();
  let manifestData;
  let currentRequestId = 0;

  const grid = document.getElementById("wiki-grid");
  const articleBody = document.getElementById("wiki-article-body");
  const articleStatus = document.getElementById("wiki-status");
  const resetButton = document.getElementById("wiki-reset");

  resetButton.addEventListener("click", () => {
    void showLandingState({ updateHistory: true });
  });

  window.addEventListener("popstate", () => {
    void syncPageFromUrl();
  });

  void initializeWiki();

  async function initializeWiki() {
    try {
      const manifest = await loadManifest();
      renderPageCards(manifest.pages);
      await syncPageFromUrl();
    } catch (error) {
      console.error("Unable to initialize the Omni wiki.", error);
      resetButton.hidden = true;
      articleStatus.textContent = "Wiki unavailable";
      document.title = "Omni Wiki";
      renderStateBlock(
        "Wiki unavailable",
        "The page manifest could not be loaded, so the Omni wiki content is temporarily unavailable."
      );
    }
  }

  async function syncPageFromUrl() {
    const manifest = await loadManifest();
    const slug = getSelectedPageFromUrl();

    if (!slug) {
      currentRequestId += 1;
      renderEmptyState(manifest.description);
      setActiveCard();
      return;
    }

    await openPage(slug, { updateHistory: false });
  }

  async function loadManifest() {
    if (manifestData) {
      return manifestData;
    }

    const response = await fetch(manifestUrl.href);

    if (!response.ok) {
      throw new Error(`Manifest request failed with status ${response.status}.`);
    }

    manifestData = await response.json();
    return manifestData;
  }

  function renderPageCards(pages) {
    const cards = pages.map((page) => {
      const card = document.createElement("a");
      const image = document.createElement("img");
      const text = document.createElement("div");
      const title = document.createElement("strong");
      const summary = document.createElement("span");

      card.className = "wikiCard";
      card.href = createPageUrl(page.slug);
      card.dataset.page = page.slug;
      card.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        event.preventDefault();
        void openPage(page.slug, { updateHistory: true });
      });

      image.src = page.image;
      image.alt = page.title;

      text.className = "wikiCardText";
      title.textContent = page.title;
      summary.textContent = page.summary;

      text.append(title, summary);
      card.append(image, text);
      return card;
    });

    grid.replaceChildren(...cards);
  }

  async function openPage(slug, options) {
    const manifest = await loadManifest();
    const pageMeta = manifest.pages.find((page) => page.slug === slug);

    if (!pageMeta) {
      setActiveCard();
      renderMessageState(
        "Page not found",
        `No wiki page exists for "${slug}". Pick another card to load its JSON article.`
      );
      return;
    }

    const requestId = ++currentRequestId;
    setActiveCard(slug);
    renderLoadingState(pageMeta.title);

    try {
      const pageData = await loadPage(pageMeta);

      if (requestId !== currentRequestId) {
        return;
      }

      renderArticle(pageData);

      if (options.updateHistory) {
        const nextUrl = createPageUrl(slug);
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (nextUrl !== currentUrl) {
          window.history.pushState({ page: slug }, "", nextUrl);
        }
      }
    } catch (error) {
      if (requestId !== currentRequestId) {
        return;
      }

      console.error(`Unable to load the page "${slug}".`, error);
      renderMessageState(
        "Page unavailable",
        `The "${pageMeta.title}" article could not be loaded from JSON.`
      );
    }
  }

  async function loadPage(pageMeta) {
    if (pageCache.has(pageMeta.slug)) {
      return pageCache.get(pageMeta.slug);
    }

    const pageUrl = new URL(pageMeta.file, manifestUrl);
    const response = await fetch(pageUrl.href);

    if (!response.ok) {
      throw new Error(`Page request failed with status ${response.status}.`);
    }

    const pageData = await response.json();
    pageCache.set(pageMeta.slug, pageData);
    return pageData;
  }

  async function showLandingState(options) {
    const manifest = await loadManifest();
    currentRequestId += 1;
    setActiveCard();
    renderEmptyState(manifest.description);

    if (options.updateHistory) {
      const nextUrl = createPageUrl();
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextUrl !== currentUrl) {
        window.history.pushState({}, "", nextUrl);
      }
    }
  }

  function renderEmptyState(description) {
    resetButton.hidden = true;
    articleStatus.textContent = "Select a page to load its JSON content.";
    document.title = "Omni Wiki";
    renderStateBlock(
      "Choose a page",
      description || "Pick any entry from the list to load its JSON file into this panel."
    );
  }

  function renderLoadingState(title) {
    resetButton.hidden = false;
    articleStatus.textContent = `Loading ${title}...`;
    document.title = `${title} | Omni Wiki`;

    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");
    const text = document.createElement("p");
    const bar = document.createElement("div");

    wrapper.className = "wikiLoadingState";
    heading.textContent = title;
    text.textContent = "Fetching this article from its JSON file and preparing the page content.";
    bar.className = "wikiLoadingBar";

    wrapper.append(heading, text, bar);
    articleBody.replaceChildren(wrapper);
  }

  function renderMessageState(title, message) {
    resetButton.hidden = false;
    articleStatus.textContent = title;
    document.title = "Omni Wiki";
    renderStateBlock(title, message);
  }

  function renderStateBlock(title, message) {
    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");
    const text = document.createElement("p");

    wrapper.className = "wikiEmptyState";
    heading.textContent = title;
    text.textContent = message;

    wrapper.append(heading, text);
    articleBody.replaceChildren(wrapper);
  }

  function renderArticle(pageData) {
    resetButton.hidden = false;
    articleStatus.textContent = pageData.summary;
    document.title = `${pageData.title} | Omni Wiki`;

    const article = document.createElement("div");
    const hero = document.createElement("div");
    const heroCopy = document.createElement("div");
    const title = document.createElement("h3");
    const summary = document.createElement("p");

    article.className = "wikiArticleContent";
    hero.className = "wikiArticleHero";

    title.className = "wikiArticleTitle";
    title.textContent = pageData.title;

    summary.className = "wikiArticleSummary";
    summary.textContent = pageData.summary;
    heroCopy.append(title, summary);

    if (pageData.intro) {
      const intro = document.createElement("p");
      intro.className = "wikiIntro";
      intro.textContent = pageData.intro;
      heroCopy.append(intro);
    }

    if (pageData.showImage !== false && pageData.image) {
      const image = document.createElement("img");
      image.className = "wikiArticleHeroImage";
      image.src = pageData.image;
      image.alt = pageData.title;
      hero.append(image);
    } else {
      hero.classList.add("is-text-only");
    }

    hero.append(heroCopy);
    article.append(hero);

    if (Array.isArray(pageData.facts) && pageData.facts.length > 0) {
      const factList = document.createElement("ul");

      factList.className = "wikiFactList";

      pageData.facts.forEach((fact) => {
        const item = document.createElement("li");
        item.textContent = fact;
        factList.append(item);
      });

      article.append(factList);
    }

    if (Array.isArray(pageData.shortcutGroups) && pageData.shortcutGroups.length > 0) {
      article.append(renderShortcutGroups(pageData.shortcutGroups));
    }

    if (Array.isArray(pageData.sections) && pageData.sections.length > 0) {
      const sections = document.createElement("div");
      sections.className = "wikiSections";

      pageData.sections.forEach((section) => {
        const wrapper = document.createElement("section");
        const heading = document.createElement("h4");

        wrapper.className = "wikiSection";
        heading.textContent = section.heading;
        wrapper.append(heading);

        if (Array.isArray(section.paragraphs)) {
          section.paragraphs.forEach((paragraph) => {
            const text = document.createElement("p");
            text.textContent = paragraph;
            wrapper.append(text);
          });
        }

        if (Array.isArray(section.items) && section.items.length > 0) {
          const list = document.createElement("ul");

          section.items.forEach((entry) => {
            const item = document.createElement("li");
            item.textContent = entry;
            list.append(item);
          });

          wrapper.append(list);
        }

        sections.append(wrapper);
      });

      article.append(sections);
    }

    articleBody.replaceChildren(article);
  }

  function renderShortcutGroups(groups) {
    const groupsWrapper = document.createElement("div");
    groupsWrapper.className = "wikiShortcutGroups";

    groups.forEach((group) => {
      const wrapper = document.createElement("section");
      const header = document.createElement("div");
      const headerCopy = document.createElement("div");
      const heading = document.createElement("h4");
      const list = document.createElement("div");

      wrapper.className = "wikiShortcutGroup";
      header.className = "wikiShortcutGroupHeader";
      headerCopy.className = "wikiShortcutGroupHeaderCopy";
      heading.className = "wikiShortcutGroupTitle";
      heading.textContent = group.title;

      headerCopy.append(heading);

      if (group.description) {
        const description = document.createElement("p");
        description.className = "wikiShortcutGroupDescription";
        description.textContent = group.description;
        headerCopy.append(description);
      }

      header.append(headerCopy);

      if (group.tag) {
        const tag = document.createElement("span");
        tag.className = "wikiShortcutGroupTag";
        tag.textContent = group.tag;
        header.append(tag);
      }

      list.className = "wikiShortcutList";

      group.entries.forEach((entry) => {
        const row = document.createElement("div");
        const copy = document.createElement("div");
        const action = document.createElement("strong");
        const description = document.createElement("p");
        const keys = document.createElement("div");

        row.className = "wikiShortcutRow";
        copy.className = "wikiShortcutCopy";
        action.className = "wikiShortcutAction";
        action.textContent = entry.action;
        copy.append(action);

        if (entry.description) {
          description.className = "wikiShortcutDescription";
          description.textContent = entry.description;
          copy.append(description);
        }

        keys.className = "wikiShortcutKeys";

        entry.keys.forEach((key) => {
          const keycap = document.createElement("span");
          keycap.className = "wikiKeycap";
          keycap.textContent = key;
          keys.append(keycap);
        });

        row.append(copy, keys);
        list.append(row);
      });

      wrapper.append(header, list);
      groupsWrapper.append(wrapper);
    });

    return groupsWrapper;
  }

  function setActiveCard(activeSlug) {
    const cards = grid.querySelectorAll("[data-page]");

    cards.forEach((card) => {
      const isActive = card.dataset.page === activeSlug;
      card.classList.toggle("is-active", isActive);

      if (isActive) {
        card.setAttribute("aria-current", "page");
      } else {
        card.removeAttribute("aria-current");
      }
    });
  }

  function getSelectedPageFromUrl() {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("page");
  }

  function createPageUrl(slug) {
    const nextUrl = new URL(window.location.href);

    if (slug) {
      nextUrl.searchParams.set("page", slug);
    } else {
      nextUrl.searchParams.delete("page");
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  }
}
