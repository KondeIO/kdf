/**
 * KDF Visual Preview — Static HTML Generator
 *
 * Run:  bun example/preview.ts
 * Auto-opens in browser. Edit JSON → re-run → see changes.
 */
import { getDesign } from "../src/index";
// konde.css is user-managed, not auto-generated
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { $ } from "bun";

/**
 * Usage:
 *   bun example/preview.ts              → tailwind (default)
 *   bun example/preview.ts bootstrap    → bootstrap
 *   bun example/preview.ts pure-css     → plain CSS
 */
const FRAMEWORK = process.argv[2] || "tailwind";
const FRAMEWORK_DIRS: Record<string, string> = {
  tailwind: "kdf",
  shadcn: "kdf",
  bootstrap: "example/bootstrap/kdf",
  "pure-css": "example/pure-css/kdf",
};

// Override KDF_DIR so resolver reads from the right folder
const kdfDir = FRAMEWORK_DIRS[FRAMEWORK] || "kdf";
process.env.KDF_DIR = kdfDir;

const KDF_ROOT = join(process.cwd(), kdfDir);
const OUTPUT = join(process.cwd(), "example/preview.html");

const FRAMEWORK_CDN: Record<string, string> = {
  tailwind: `<script src="https://cdn.tailwindcss.com"></script>`,
  shadcn: `<script src="https://cdn.tailwindcss.com"></script>`,
  bootstrap: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">`,
  "pure-css": "",
};

function getPages(): string[] {
  if (!existsSync(KDF_ROOT)) return [];
  return readdirSync(KDF_ROOT)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/** Detect element type from token key name */
function detectElement(key: string): { tag: string; content: string; selfClosing?: boolean } {
  const k = key.toLowerCase();

  // Headings
  if (k === "title" || k.endsWith("-title") || k.includes("title"))
    return { tag: "h2", content: "The quick brown fox jumps" };
  if (k.includes("h1")) return { tag: "h1", content: "Main Headline" };
  if (k.includes("h2")) return { tag: "h2", content: "Section Title" };
  if (k.includes("h3")) return { tag: "h3", content: "Subsection" };

  // Buttons / CTAs
  if (k.includes("cta") || k.includes("button") || k.includes("signup") || k.includes("login"))
    return { tag: "button", content: k.includes("primary") || k.includes("cta") ? "Get Started" : "Learn More" };
  if (k === "active") return { tag: "button", content: "1" };

  // Images
  if (k.includes("image") || k.includes("avatar") || k.includes("logo"))
    return { tag: "img", content: "", selfClosing: true };

  // Text / descriptions
  if (k.includes("description") || k.includes("content") || k.includes("answer"))
    return { tag: "p", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore." };
  if (k.includes("label") || k.includes("muted") || k.includes("small") || k.includes("category") || k.includes("role") || k.includes("period"))
    return { tag: "span", content: "Subtitle text" };
  if (k.includes("name") || k.includes("plan-name"))
    return { tag: "span", content: "Item Name" };
  if (k.includes("price") || k.includes("value"))
    return { tag: "span", content: "$49" };
  if (k.includes("badge"))
    return { tag: "span", content: "Popular" };
  if (k.includes("feature-item"))
    return { tag: "span", content: "Unlimited projects" };
  if (k.includes("question"))
    return { tag: "span", content: "How does KDF work?" };

  // Navigation
  if (k.includes("nav-item") || k.includes("menu-item") || k.includes("footer-item"))
    return { tag: "a", content: "Nav Link" };

  // Wrappers / containers
  if (k.includes("wrapper") || k.includes("actions") || k.includes("grid") || k.includes("list") || k.includes("nav") || k.includes("menu") || k.includes("footer") || k.includes("header") || k.includes("body") || k.includes("features"))
    return { tag: "div", content: "" };

  // Cards
  if (k.includes("card") && !k.includes("-"))
    return { tag: "div", content: "" };

  return { tag: "div", content: key };
}

/** Build a contextual preview section showing tokens grouped by their JSON structure */
function renderPagePreview(page: string, d: ReturnType<typeof getDesign>, raw: Record<string, unknown>): string {
  let html = "";

  for (const [sectionKey, sectionValue] of Object.entries(raw)) {
    if (sectionKey === "$layout") continue;
    if (!sectionValue || typeof sectionValue !== "object") continue;

    const section = sectionValue as Record<string, unknown>;
    const sectionTokens: string[] = [];

    for (const [key, value] of Object.entries(section)) {
      if (typeof value !== "string" && !(typeof value === "object" && value && "className" in value)) continue;

      const fullPath = `${sectionKey}.${key}`;
      const resolved = d(fullPath);
      const cssProps = d.css(fullPath);
      const rawVal = typeof value === "string" ? value : JSON.stringify(value);
      const el = detectElement(key);

      // Build inline style from d.css() + any base styles
      const cssStyle = Object.entries(cssProps).map(([k, v]) => `${k}:${v}`).join(";");

      let rendered: string;
      if (el.selfClosing) {
        rendered = `<${el.tag} data-kdf="${fullPath}" class="${resolved}" style="width:120px;height:80px;background:#e5e7eb;border-radius:8px;${cssStyle}" />`;
      } else if (el.tag === "a") {
        rendered = `<${el.tag} href="#" data-kdf="${fullPath}" class="${resolved}" style="${cssStyle}">${el.content}</${el.tag}>`;
      } else if (el.content === "" && el.tag === "div") {
        rendered = `<div data-kdf="${fullPath}" class="${resolved}" style="min-height:2.5rem;border:1px dashed #d1d5db;border-radius:6px;padding:0.5rem;display:flex;align-items:center;justify-content:center;${cssStyle}"><span style="font-size:0.75rem;color:#9ca3af">${key} (container)</span></div>`;
      } else {
        rendered = `<${el.tag} data-kdf="${fullPath}" class="${resolved}" style="${cssStyle}">${el.content}</${el.tag}>`;
      }

      sectionTokens.push(`
        <div class="kdf-token">
          <div style="margin-bottom:0.375rem">${rendered}</div>
          <div class="kdf-token-label">d("${fullPath}")${rawVal.startsWith("@") ? `<span class="kdf-token-ref">${escape(rawVal)}</span>` : ""}</div>
          <div class="kdf-token-resolved">${escape(resolved || "(empty)")}${cssStyle ? ` | style: ${cssStyle}` : ""}</div>
        </div>`);
    }

    if (sectionTokens.length === 0) continue;

    html += `
      <div style="margin-bottom:2rem">
        <h3 class="kdf-section-title" style="font-size:0.875rem">
          <span class="kdf-dot"></span>
          ${sectionKey}
        </h3>
        <div class="kdf-token-group">
          ${sectionTokens.join("")}
        </div>
      </div>`;
  }

  return html;
}

function renderAllPages(): string {
  const pages = getPages();
  let allSections = "";

  for (const page of pages) {
    const d = getDesign(page);
    const raw = JSON.parse(readFileSync(join(KDF_ROOT, `${page}.json`), "utf-8"));

    const preview = renderPagePreview(page, d, raw);
    const jsonPreview = JSON.stringify(raw, null, 2);

    // Count tokens
    let tokenCount = 0;
    function count(obj: Record<string, unknown>) {
      for (const [key, value] of Object.entries(obj)) {
        if (key === "$layout") continue;
        if (typeof value === "string") tokenCount++;
        else if (value && typeof value === "object" && "className" in value) tokenCount++;
        else if (value && typeof value === "object" && !Array.isArray(value)) count(value as Record<string, unknown>);
      }
    }
    count(raw);

    allSections += `
      <section id="${page}" class="kdf-section">
        <div class="kdf-section-title">
          <h2 style="margin:0">${page}</h2>
          <span class="kdf-badge">${tokenCount} tokens</span>
          <span style="font-size:0.75rem;color:#d1d5db">kdf/${page}.json</span>
        </div>
        <div class="kdf-grid">
          <div>
            ${preview}
          </div>
          <div>
            <div class="kdf-sticky">
              <h3 style="font-size:0.875rem;color:#6b7280;margin:0 0 0.5rem">Source</h3>
              <pre class="kdf-pre">${escape(jsonPreview)}</pre>
            </div>
          </div>
        </div>
      </section>`;
  }

  const nav = [
    ...pages.map((p) => `<a href="#${p}" class="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">${p}</a>`),
    `<a href="#konde-css" class="px-3 py-1.5 rounded text-sm text-amber-600 hover:bg-amber-50 transition-colors">konde.css</a>`,
  ].join("\n          ");

  // Read konde.css content for preview section
  const serverCssContent = existsSync(join(process.cwd(), `example/${FRAMEWORK}/konde-server.css`))
    ? readFileSync(join(process.cwd(), `example/${FRAMEWORK}/konde-server.css`), "utf-8")
    : "/* not found */";
  const clientCssContent = existsSync(join(process.cwd(), `example/${FRAMEWORK}/konde.css`))
    ? readFileSync(join(process.cwd(), `example/${FRAMEWORK}/konde.css`), "utf-8")
    : "/* not found */";

  const cdn = FRAMEWORK_CDN[FRAMEWORK] || "";
  // konde-server.css — server-rendered (simulated here as <link> early in <head>)
  const serverCssFile = join(process.cwd(), `example/${FRAMEWORK}/konde-server.css`);
  const serverCssLink = existsSync(serverCssFile)
    ? `<link rel="stylesheet" href="konde-server.css">`
    : `<!-- konde-server.css not found — skipped -->`;

  // konde.css — client-side, LAST in <head>
  const clientCssFile = join(process.cwd(), `example/${FRAMEWORK}/konde.css`);
  const clientCssLink = existsSync(clientCssFile)
    ? `<link rel="stylesheet" href="konde.css">`
    : `<!-- konde.css not found — skipped -->`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KDF Preview — ${FRAMEWORK}</title>

  <!-- 1. konde-server.css — critical overrides (server-rendered in real Next.js) -->
  ${serverCssLink}

  <!-- 2. Framework CSS -->
  ${cdn}
  ${FRAMEWORK !== "pure-css" ? `<link rel="stylesheet" href="globals.css">` : `<link rel="stylesheet" href="styles.css">`}

  <!-- 3. Preview shell styles -->
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
    .kdf-shell { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
    .kdf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; }
    .kdf-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .kdf-header p { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0; }
    .kdf-nav { display: flex; gap: 0.25rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.25rem; }
    .kdf-nav a { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; color: #4b5563; text-decoration: none; }
    .kdf-nav a:hover { background: #f3f4f6; }
    .kdf-badge { font-size: 0.75rem; background: #f3f4f6; color: #6b7280; padding: 0.125rem 0.5rem; border-radius: 0.25rem; }
    .kdf-badge-fw { font-size: 0.75rem; background: #dbeafe; color: #1d4ed8; padding: 0.125rem 0.5rem; border-radius: 0.25rem; }
    .kdf-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 2rem; }
    .kdf-section { margin-bottom: 3rem; }
    .kdf-section-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .kdf-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #3b82f6; }
    .kdf-token-group { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; }
    .kdf-token { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
    .kdf-token:last-child { border-bottom: none; }
    .kdf-token-label { font-size: 0.75rem; color: #9ca3af; margin-top: 0.375rem; font-family: monospace; }
    .kdf-token-ref { font-size: 0.75rem; color: #3b82f6; margin-left: 0.5rem; }
    .kdf-token-resolved { font-size: 0.625rem; color: #d1d5db; margin-top: 0.25rem; word-break: break-all; font-family: monospace; }
    .kdf-pre { padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.75rem; overflow: auto; max-height: 70vh; line-height: 1.6; }
    .kdf-sticky { position: sticky; top: 2rem; }
    .kdf-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #9ca3af; }
  </style>

  <script>
    const es = new EventSource("/__reload");
    es.onmessage = (e) => { if (e.data === "reload") location.reload(); };
  </script>

  <!-- 4. konde.css — LAST before </head>, highest specificity -->
  ${clientCssLink}
</head>
<body>
  <div class="kdf-shell">

    <div class="kdf-header">
      <div>
        <h1>KDF Preview</h1>
        <p>Edit JSON → auto-reload &nbsp; <span class="kdf-badge-fw">${FRAMEWORK}</span></p>
      </div>
      <div class="kdf-nav">
        ${nav}
      </div>
    </div>

    ${allSections}

    <section id="konde-css" class="kdf-section">
      <div class="kdf-section-title">
        <h2 style="margin:0">konde CSS</h2>
        <span class="kdf-badge">user-managed</span>
      </div>
      <div class="kdf-grid" style="grid-template-columns:1fr 1fr">
        <div>
          <h3 style="font-size:0.875rem;color:#6b7280;margin:0 0 0.5rem">konde-server.css <span class="kdf-badge">server</span></h3>
          <pre class="kdf-pre">${escape(serverCssContent)}</pre>
        </div>
        <div>
          <h3 style="font-size:0.875rem;color:#6b7280;margin:0 0 0.5rem">konde.css <span class="kdf-badge">client</span></h3>
          <pre class="kdf-pre">${escape(clientCssContent)}</pre>
        </div>
      </div>
    </section>

    <div class="kdf-footer">
      @konde/kdf v0.1.0 — ${FRAMEWORK} — all styles resolved from kdf/*.json via getDesign()
    </div>
  </div>
</body>
</html>`;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Live server with file watching
const PORT = 4400;
let clients: ReadableStreamDefaultController[] = [];

// SSE endpoint for live reload
function handleSSE(): Response {
  const stream = new ReadableStream({
    start(controller) {
      clients.push(controller);
      controller.enqueue("data: connected\n\n");
    },
    cancel() {
      clients = clients.filter((c) => c !== undefined);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function notifyClients() {
  for (const client of clients) {
    try {
      client.enqueue("data: reload\n\n");
    } catch {
      /* client disconnected */
    }
  }
}

// Watch kdf/ directory for changes
import { watch } from "fs";
function watchDir(dir: string) {
  if (!existsSync(dir)) return;
  watch(dir, { recursive: true }, (event, filename) => {
    if (!filename?.endsWith(".json")) return;
    console.log(`  changed: kdf/${filename} → reloading`);
    // Don't overwrite konde.css — user may have manual edits
    // To regenerate from JSON: delete konde.css → auto-generated on next request
    notifyClients();
  });
}
watchDir(KDF_ROOT);

// Watch konde CSS files for manual edits
for (const cssFile of ["konde-server.css", "konde.css"]) {
  const cssPath = join(process.cwd(), `example/${FRAMEWORK}/${cssFile}`);
  if (existsSync(cssPath)) {
    watch(cssPath, () => {
      console.log(`  changed: ${cssFile} (manual edit) → reloading`);
      notifyClients();
    });
  }
}

// Serve
const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/__reload") return handleSSE();

    if (url.pathname === "/konde-server.css" || url.pathname === "/konde.css") {
      const file = join(process.cwd(), `example/${FRAMEWORK}${url.pathname}`);
      if (!existsSync(file)) {
        return new Response(`/* ${url.pathname.slice(1)} not found — skipped */`, {
          headers: { "Content-Type": "text/css" },
        });
      }
      return new Response(readFileSync(file, "utf-8"), {
        headers: { "Content-Type": "text/css", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname === "/globals.css" || url.pathname === "/styles.css") {
      const file = join(process.cwd(), `example/${FRAMEWORK}${url.pathname}`);
      if (!existsSync(file)) {
        return new Response("/* file not found */", {
          headers: { "Content-Type": "text/css" },
        });
      }
      return new Response(readFileSync(file, "utf-8"), {
        headers: { "Content-Type": "text/css", "Cache-Control": "no-cache" },
      });
    }

    // Render fresh on every request (no cache — instant changes)
    const html = renderAllPages();
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`KDF Preview: http://localhost:${PORT}`);
console.log(`Pages: ${getPages().join(", ")}`);
console.log(`Watching kdf/ for changes — auto-reload enabled\n`);

await $`open http://localhost:${PORT}`.quiet();
