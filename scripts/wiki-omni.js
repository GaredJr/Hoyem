const wikiRoot = document.querySelector("[data-wiki-root]");

if (wikiRoot) {
  const manifestUrl = new URL("./contentpages.json", window.location.href);
  const pageCache = new Map();
  let manifestData;
  let currentRequestId = 0;

  const pageIntro = document.getElementById("wiki-page-intro");
  const archiveView = document.getElementById("wiki-archive-view");
  const archiveDescription = document.getElementById("wiki-archive-description");
  const entryView = document.getElementById("wiki-entry-view");
  const archiveList = document.getElementById("wiki-grid");
  const sidebarList = document.getElementById("wiki-sidebar-list");
  const articleBody = document.getElementById("wiki-article-body");
  const articleStatus = document.getElementById("wiki-status");
  const resetButton = document.getElementById("wiki-reset");

  resetButton.addEventListener("click", () => {
    void showArchiveState({ updateHistory: true });
  });

  window.addEventListener("popstate", () => {
    void syncPageFromUrl();
  });

  void initializeWiki();

  async function initializeWiki() {
    try {
      const manifest = await loadManifest();
      archiveDescription.textContent = manifest.description || "Browse the current Omni entries.";
      renderArchiveCards(manifest.pages);
      renderSidebarLinks(manifest.pages);
      await syncPageFromUrl();
    } catch (error) {
      console.error("Unable to initialize the Omni wiki.", error);
      showArchiveMode();
      renderArchiveMessage(
        "Archive unavailable",
        "The archive list could not be loaded, so the Omni wiki is temporarily unavailable."
      );
    }
  }

  async function syncPageFromUrl() {
    const manifest = await loadManifest();
    const slug = getSelectedPageFromUrl();

    if (!slug) {
      currentRequestId += 1;
      showArchiveMode();
      archiveDescription.textContent = manifest.description || "Browse the current Omni entries.";
      setActiveLinks();
      document.title = "Omni Wiki";
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

  function renderArchiveCards(pages) {
    const cards = pages.map((page) => createPageLink(page, "archive"));
    archiveList.replaceChildren(...cards);
  }

  function renderSidebarLinks(pages) {
    const links = pages.map((page) => createPageLink(page, "sidebar"));
    sidebarList.replaceChildren(...links);
  }

  function createPageLink(page, variant) {
    const link = document.createElement("a");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const summary = document.createElement("span");

    link.href = createPageUrl(page.slug);
    link.dataset.page = page.slug;
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      void openPage(page.slug, { updateHistory: true });
    });

    title.textContent = page.title;
    summary.textContent = page.summary;

    if (variant === "archive") {
      const image = document.createElement("img");

      link.className = "wikiArchiveCard";
      copy.className = "wikiArchiveCardText";
      title.className = "wikiArchiveCardTitle";
      summary.className = "wikiArchiveCardSummary";

      image.src = page.image;
      image.alt = page.title;

      copy.append(title, summary);
      link.append(image, copy);
      return link;
    }

    link.className = "wikiEntryLink";
    copy.className = "wikiEntryLinkText";
    title.className = "wikiEntryLinkTitle";
    summary.className = "wikiEntryLinkSummary";

    copy.append(title, summary);
    link.append(copy);
    return link;
  }

  async function openPage(slug, options) {
    const manifest = await loadManifest();
    const pageMeta = manifest.pages.find((page) => page.slug === slug);

    showEntryMode();

    if (!pageMeta) {
      setActiveLinks();
      renderMessageState(
        "Entry not found",
        `There is no archive entry called "${slug}". Use the archive links to open another page.`
      );
      return;
    }

    const requestId = ++currentRequestId;

    setActiveLinks(slug);
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
        "Entry unavailable",
        `The "${pageMeta.title}" entry could not be opened just now.`
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

  async function showArchiveState(options) {
    const manifest = await loadManifest();
    currentRequestId += 1;
    showArchiveMode();
    archiveDescription.textContent = manifest.description || "Browse the current Omni entries.";
    setActiveLinks();
    document.title = "Omni Wiki";

    if (options.updateHistory) {
      const nextUrl = createPageUrl();
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextUrl !== currentUrl) {
        window.history.pushState({}, "", nextUrl);
      }
    }
  }

  function showArchiveMode() {
    pageIntro.hidden = false;
    archiveView.hidden = false;
    entryView.hidden = true;
    resetButton.hidden = true;
    articleStatus.textContent = "Archive";
  }

  function showEntryMode() {
    pageIntro.hidden = true;
    archiveView.hidden = true;
    entryView.hidden = false;
    resetButton.hidden = false;
  }

  function renderArchiveMessage(title, message) {
    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");
    const text = document.createElement("p");

    wrapper.className = "wikiEmptyState wikiArchiveMessage";
    heading.textContent = title;
    text.textContent = message;

    wrapper.append(heading, text);
    archiveList.replaceChildren(wrapper);
  }

  function renderLoadingState(title) {
    articleStatus.textContent = `Archive / ${title}`;
    document.title = `${title} | Omni Wiki`;

    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");
    const text = document.createElement("p");
    const bar = document.createElement("div");

    wrapper.className = "wikiLoadingState";
    heading.textContent = title;
    text.textContent = "Loading entry.";
    bar.className = "wikiLoadingBar";

    wrapper.append(heading, text, bar);
    articleBody.replaceChildren(wrapper);
  }

  function renderMessageState(title, message) {
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
    articleStatus.textContent = `Archive / ${pageData.title}`;
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
          const keycap = document.createElement("kbd");
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

  function setActiveLinks(activeSlug) {
    const links = wikiRoot.querySelectorAll("[data-page]");

    links.forEach((link) => {
      const isActive = link.dataset.page === activeSlug;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
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
