// scripts/generate-index.js
// Generates /en/index.html and /es/index.html by scanning chapter folders.
// Prefers <title> from each chapter's index.html; falls back to prettified slug.

const fs = require("fs");
const path = require("path");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function listSubfolders(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !name.startsWith("."));
}

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function titleFromHtmlFile(htmlPath, fallbackSlug) {
  if (!exists(htmlPath)) return titleFromSlug(fallbackSlug);
  const html = fs.readFileSync(htmlPath, "utf8");
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return titleFromSlug(fallbackSlug);
  const cleaned = m[1].replace(/\s+/g, " ").trim();
  return cleaned || titleFromSlug(fallbackSlug);
}

function renderIndex({ lang, heading, backText, backHref, baseDirName, listDirName, itemPrefix }) {
  const root = process.cwd();
  const baseDir = path.join(root, baseDirName);
  const listDir = path.join(root, baseDirName, listDirName);
  const outFile = path.join(root, baseDirName, "index.html");

  const folders = listSubfolders(listDir).sort((a, b) => a.localeCompare(b));

  const items = folders.map(slug => {
    const chapterIndex = path.join(listDir, slug, "index.html");
    const title = titleFromHtmlFile(chapterIndex, slug);

    // Link relative to /en/ or /es/
    const href = `./${listDirName}/${slug}/`;
    return `    <li>${itemPrefix}<a href="${href}">${title}</a></li>`;
  });

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>30,000 DAYS — ${heading}</title>
  <style>
    body{font-family:system-ui,Arial;margin:0;padding:32px;max-width:980px}
    a{text-decoration:none}
    a:hover{text-decoration:underline}
    header{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:24px}
    .back{font-size:14px}
    h1{margin:0}
    ul{line-height:1.8}
    .meta{color:#555;font-size:14px}
  </style>
</head>
<body>
  <header>
    <div class="back"><a href="${backHref}">← ${backText}</a></div>
    <div>
      <h1>${heading}</h1>
      <div class="meta">Auto-generated from folders in <code>/${baseDirName}/${listDirName}/</code></div>
    </div>
  </header>

  <ul>
${items.length ? items.join("\n") : "    <li><em>No chapters found.</em></li>"}
  </ul>
</body>
</html>`;

  fs.writeFileSync(outFile, html, "utf8");
  console.log(`Wrote ${outFile} (${folders.length} items)`);
}

// English
renderIndex({
  lang: "en",
  heading: "Chapters (English)",
  backText: "Back to language",
  backHref: "../",
  baseDirName: "en",
  listDirName: "chapters",
  itemPrefix: ""
});

// Spanish
renderIndex({
  lang: "es",
  heading: "Capítulos (Español)",
  backText: "Volver al idioma",
  backHref: "../",
  baseDirName: "es",
  listDirName: "capitulos",
  itemPrefix: ""
});
