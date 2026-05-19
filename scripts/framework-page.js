(() => {
  const codeSamples = {
    html: [
      '<main class="hf-page">',
      '  <section class="hf-shell hf-stack">',
      '    <article class="hf-card">Hero</article>',
      '    <div class="hf-grid-auto">',
      '      <article class="hf-card--soft">Tile</article>',
      '      <article class="hf-card--soft">Tile</article>',
      '      <article class="hf-card--soft">Tile</article>',
      '    </div>',
      '  </section>',
      '</main>',
    ],
    theme: [
      ':root {',
      '  --bg: #110f0e;',
      '  --panel: rgba(23, 21, 19, 0.96);',
      '  --accent: #d4b89a;',
      '}',
      '',
      ':root[data-theme="light"] {',
      '  --bg: #f3ece4;',
      '  --panel: rgba(255, 250, 244, 0.96);',
      '}',
    ],
    motion: [
      '@keyframes frameworkFloat {',
      '  0%, 100% { transform: translateY(0); }',
      '  50% { transform: translateY(-12px); }',
      '}',
      '',
      '.preview-card {',
      '  animation: frameworkFloat 7.5s ease-in-out infinite;',
      '}',
    ],
  };

  initializeRangePreviews();
  initializeButtonPreview();
  initializeWorkbenchTabs();

  function initializeRangePreviews() {
    document.querySelectorAll(".frameworkRange").forEach((input) => {
      const update = () => {
        const min = Number(input.min || 0);
        const max = Number(input.max || 100);
        const value = Number(input.value || 0);
        const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
        const label = input.closest(".frameworkSliderRow")?.querySelector(".frameworkSliderValue");

        input.style.setProperty("--range-value", `${percent}%`);

        if (label) {
          label.textContent = `${Math.round(value)}%`;
        }
      };

      input.addEventListener("input", update);
      update();
    });
  }

  function initializeButtonPreview() {
    document.querySelectorAll(".frameworkPreviewCanvas--buttons .hf-chip--interactive").forEach((button) => {
      button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
      button.addEventListener("click", () => {
        const isActive = !button.classList.contains("is-active");

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });
  }

  function initializeWorkbenchTabs() {
    const tabs = Array.from(document.querySelectorAll("[data-framework-tab]"));
    const codeBlock = document.querySelector("[data-workbench-code]");
    const preview = document.querySelector("[data-workbench-preview]");

    if (tabs.length === 0 || !codeBlock || !preview) {
      return;
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const mode = tab.dataset.frameworkTab || "html";

        tabs.forEach((otherTab) => {
          const isActive = otherTab === tab;
          otherTab.classList.toggle("is-active", isActive);
          otherTab.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        preview.dataset.previewMode = mode;
        codeBlock.innerHTML = renderCodeLines(codeSamples[mode] || codeSamples.html);
      });
    });
  }

  function renderCodeLines(lines) {
    return lines.map((line, index) => `
      <span class="frameworkCodeLine">
        <span class="frameworkCodeNo">${index + 1}</span>
        <span>${highlightCodeLine(line)}</span>
      </span>
    `).join("");
  }

  function highlightCodeLine(line) {
    return escapeHtml(line)
      .replace(/(&lt;\/?)([a-z0-9-]+)/gi, '$1<span class="frameworkCodeKey">$2</span>')
      .replace(/(class=)(&quot;[^&]+&quot;)/g, '$1<span class="frameworkCodeValue">$2</span>')
      .replace(/(--[a-z0-9-]+)(:)/gi, '<span class="frameworkCodeKey">$1</span><span class="frameworkCodeDim">$2</span>')
      .replace(/(#(?:[a-f0-9]{3}){1,2}|rgba?\([^)]+\))/gi, '<span class="frameworkCodeValue">$1</span>');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
