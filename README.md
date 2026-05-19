# Hoyem

*Min personlige hjemmeside.*

krigros

[hoyem.dev](https://hoyem.dev/)

[https://hd.hoyem.dev](https://hd.hoyem.dev)

## CSS framework

- Reusable framework file: `css/hoyem-framework.css`
- Framework page styling: `css/framework-page.css`
- Site stylesheet entrypoint: `css/style.css`
- Site page: `framework/index.html` at `/framework/`

The framework uses `hf-` prefixed classes and pulls its palette, typography, spacing, and chrome directly from the current site design. The main site stylesheet now imports that framework first, then layers page-specific rules on top.

## Omni wiki editing

Wiki entry text lives in JSON so the visible pages can be customized without editing the HTML.

- Individual page bodies and archive card text: `subdomains/wiki-omni/pages/*.json`
- Archive order, categories, paths, and search keywords: `subdomains/wiki-omni/contentpages.json`
- Shared wiki renderer: `scripts/wiki-omni.js`

For a normal article page, edit these fields in the matching page JSON:

```json
{
  "title": "Characters",
  "summary": "Short text shown near the title.",
  "intro": "Opening paragraph for the page.",
  "facts": ["Quick note one.", "Quick note two."],
  "sections": [
    {
      "heading": "Ali",
      "paragraphs": ["Write your own paragraph here."],
      "items": ["Optional bullet point."]
    }
  ]
}
```

For the keybinds page, use `shortcutGroups` for control rows and `sections` for regular notes below them. Optional fields include `tags`, `image`, `imageAlt`, `showImage`, and explicit section `id` values.

Wiki pages can also define `aliases`. The renderer uses each page title and its aliases to automatically link matching plain-text terms in other wiki pages. For example, adding `"aliases": ["The Camp"]` to `the-camp.json` makes mentions of `The Camp` link to that entry unless the reader is already on that page.
