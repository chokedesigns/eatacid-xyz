// scripts/sync-test-harness.mjs
import fs from "node:fs";
import path from "node:path";

const MARK_START = "<!-- EA_TEST_BUNDLE_START -->";
const MARK_END = "<!-- EA_TEST_BUNDLE_END -->";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function removeMarkedBlock(html) {
  const start = html.indexOf(MARK_START);
  const end = html.indexOf(MARK_END);
  if (start !== -1 && end !== -1 && end > start) {
    return html.slice(0, start) + html.slice(end + MARK_END.length);
  }
  return html;
}

// Remove ONLY your app-loader module scripts (not Webflow/jQuery scripts).
// We intentionally match flexible variants seen in Webflow exports:
//
// - Home: ./shared/beacon-setup.js (sometimes after </html> in the rip)
// - Drops/Exchange: js/main.js (within each folder)
// - Your previous harness injections: dist/(home|drops|exchange).js
// - NEW: staging/prod subfolder injections: dist/(staging|prod)/(home|drops|exchange).js
// - Stable wrapper entrypoints when loader-chain mode is used
function stripAppScripts(html) {
  const patterns = [
    // Webflow-exported module entrypoints for Drops/Exchange
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*(?:\/|\.\/)?js\/main\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:\/|\.\/)?js\/main\.js[^"']*["'][^>]*\btype\s*=\s*["']module["'][^>]*>\s*<\/script>\s*/gi,

    // Home (and sometimes other pages) loading shared beacon setup directly
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*(?:\/|\.\/)?shared\/beacon-setup\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:\/|\.\/)?shared\/beacon-setup\.js[^"']*["'][^>]*\btype\s*=\s*["']module["'][^>]*>\s*<\/script>\s*/gi,

    // If your repo HTML ever points directly at these (older iterations)
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*drops\/js\/main\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*exchange\/js\/main\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,

    // Remove any previous harness injections (various relative forms)
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*(?:\.\.\/)?dist\/(?:home|drops|exchange)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:\.\.\/)?dist\/(?:home|drops|exchange)\.js[^"']*["'][^>]*\btype\s*=\s*["']module["'][^>]*>\s*<\/script>\s*/gi,

    // NEW: remove staging/prod subfolder injections too
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*(?:\.\.\/)?dist\/(?:staging|prod)\/(?:home|drops|exchange)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:\.\.\/)?dist\/(?:staging|prod)\/(?:home|drops|exchange)\.js[^"']*["'][^>]*\btype\s*=\s*["']module["'][^>]*>\s*<\/script>\s*/gi,

    // Optional: if you ever put these stable entrypoints directly in HTML
    /<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']*(?:\/)?(?:home|drops|exchange)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:\/)?(?:home|drops|exchange)\.js[^"']*["'][^>]*\btype\s*=\s*["']module["'][^>]*>\s*<\/script>\s*/gi,

  ];

  let out = html;
  for (const re of patterns) out = out.replace(re, "");
  return out;
}

function injectBundle(html, bundleSrc) {
  const block =
    `${MARK_START}\n` +
    `<script type="module" src="${bundleSrc}"></script>\n` +
    `${MARK_END}\n`;

  const needle = /<\/body\s*>/i;
  if (needle.test(html)) {
    return html.replace(needle, block + "</body>");
  }
  // Fallback if no </body>
  return html + "\n" + block + "\n";
}

function buildOne({ src, dest, bundleSrc }) {
  if (!fs.existsSync(src)) {
    throw new Error(`sync-test-harness: missing source file: ${src}`);
  }

  let html = readUtf8(src);

  // Keep this idempotent
  html = removeMarkedBlock(html);
  html = stripAppScripts(html);

  // Inject our production-ish bundle
  html = injectBundle(html, bundleSrc);

  writeUtf8(dest, html);
  console.log(`synced: ${dest}  <-  ${src}`);
}

const root = process.cwd();
const testDir = path.join(root, "test");
const loaderChain = process.argv.includes("--loader-chain");
ensureDir(testDir);

if (loaderChain) {
  for (const surface of ["home", "drops", "exchange"]) {
    const rootRouterSource = path.join(root, "loaders", "root", `${surface}.js`);
    const environmentLoaderSource = path.join(
      root,
      "loaders",
      "environment",
      `${surface}.js`
    );
    const stableRouter = path.join(root, "dist", `${surface}.js`);
    const stagingLoader = path.join(
      root,
      "dist",
      "staging",
      `${surface}-loader.js`
    );

    ensureDir(path.dirname(stableRouter));
    ensureDir(path.dirname(stagingLoader));
    fs.copyFileSync(rootRouterSource, stableRouter);
    fs.copyFileSync(environmentLoaderSource, stagingLoader);
  }
}

function harnessBundle(surface) {
  return loaderChain
    ? `../dist/${surface}.js`
    : `../dist/staging/${surface}.js`;
}

// Copies your current Webflow HTML shells from the repo,
// strips app module loader scripts, injects dist bundles.
buildOne({
  src: path.join(root, "index.html"),
  dest: path.join(testDir, "home.html"),
  bundleSrc: harnessBundle("home"),
});

buildOne({
  src: path.join(root, "drops", "index.html"),
  dest: path.join(testDir, "drops.html"),
  bundleSrc: harnessBundle("drops"),
});

buildOne({
  src: path.join(root, "exchange", "index.html"),
  dest: path.join(testDir, "exchange.html"),
  bundleSrc: harnessBundle("exchange"),
});

console.log(`done (${loaderChain ? "loader-chain" : "direct-bundle"} mode).`);
