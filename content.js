// content.js — runs on every page, applies background if one is assigned
// v2.0 — adds backdrop-filter blur support and improved cover detection

(function () {
  const hostname = location.hostname.replace(/^www\./, "");

  // ── Helpers ──────────────────────────────────────────────────────────────

  function parseRgb(str) {
    const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] !== undefined ? parseFloat(m[4]) : 1];
  }

  function toRgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Stable UID for a DOM element
  function elementUid(el) {
    const tag = el.tagName.toLowerCase();
    const id  = el.id ? "#" + el.id : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
      : "";
    let idx = 0;
    let sib = el;
    while ((sib = sib.previousElementSibling)) idx++;
    return `${tag}${id}${cls}:nth(${idx})`;
  }

  // Check if a color is "light" (white-ish) — good candidate for blur
  function isLightColor(r, g, b) {
    // Perceived luminance (ITU-R BT.709)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 180;
  }

  // Get contrast text color for a background: returns black (#1a1a2e) or white (#eee)
  function isBgDark(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }

  // ── Core ─────────────────────────────────────────────────────────────────

  function loadAndApply() {
    chrome.storage.local.get(["siteMap", "photos", "coverSettings"], (data) => {
      const siteMap       = data.siteMap       || {};
      const photos        = data.photos        || {};
      const coverSettings = data.coverSettings || {};

      const photoKey = siteMap[hostname];
      if (!photoKey) { removeBackground(); return; }

      const photo = photos[photoKey];
      if (!photo || !photo.dataUrl) { removeBackground(); return; }

      const siteSettings = coverSettings[hostname] || {};
      applyBackground(photo.dataUrl, siteSettings);
    });
  }

  loadAndApply();

  // Live updates when settings change
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.siteMap || changes.photos || changes.coverSettings) {
      loadAndApply();
    }
  });

  // ── Background application ───────────────────────────────────────────────

  let _currentMO = null; // Track current MutationObserver for cleanup

  function applyBackground(dataUrl, siteSettings) {
    // Disconnect previous MutationObserver to avoid duplicates
    if (_currentMO) { _currentMO.disconnect(); _currentMO = null; }
    const globalOpacity = (siteSettings.global !== undefined) ? siteSettings.global : 0.75;
    const overrides     = siteSettings.overrides || {};
    const useBlur       = siteSettings.useBlur || false;
    const blurRadius    = siteSettings.blurRadius || 10;
    const blurOverrides = siteSettings.blurOverrides || {};  // { uid: true/false }
    const brightness    = (siteSettings.brightness !== undefined) ? siteSettings.brightness : 1.0;

    // Set background image on <html>
    let style = document.getElementById("__sitedrop_style__");
    if (!style) {
      style = document.createElement("style");
      style.id = "__sitedrop_style__";
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = `
      html {
        background: url("${dataUrl}") center center / cover no-repeat fixed !important;
      }
      body {
        background: transparent none !important;
      }
    `;

    // ── Brightness dim overlay ──────────────────────────────────────────────
    let dimEl = document.getElementById("__sitedrop_dim__");
    if (!dimEl) {
      dimEl = document.createElement("div");
      dimEl.id = "__sitedrop_dim__";
      document.documentElement.appendChild(dimEl);
    }
    // brightness: 1 = full bright (no overlay), 0 = fully dimmed (black overlay)
    const dimAlpha = Math.min(1, Math.max(0, 1 - brightness));
    dimEl.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background: rgba(0,0,0,${dimAlpha}) !important;
    `;

    function processCovers() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const threshold = 0.85;
      const processed = new Set();

      document.querySelectorAll("*").forEach((el) => {
        if (el.id === "__sitedrop_style__") return;
        const tag = el.tagName.toLowerCase();
        if (["script","style","link","meta","br","hr","svg","canvas","video","iframe"].includes(tag)) return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const cs = getComputedStyle(el);
        const pos = cs.position;

        // Detection #1: Element covers ≥85% of viewport (large sections, backgrounds)
        const isLargeCover = (rect.width >= vw * threshold || rect.height >= vh * threshold);

        // Detection #2: Fixed/sticky positioned elements with opaque background (nav bars, headers)
        const isFixedSticky = (pos === "fixed" || pos === "sticky");

        // Detection #3: Element with visible non-transparent background, at edge of viewport
        // (catches sidebars, floating panels with opaque backgrounds)
        const bg = cs.backgroundColor;
        const rgba = bg ? parseRgb(bg) : null;
        const hasSolidBg = rgba && rgba[3] >= 0.95;

        // Skip if no solid bg and not a large cover
        if (!isLargeCover && !isFixedSticky) {
          // For controls at viewport edges with solid bg, also catch them
          if (!hasSolidBg || rgba[3] < 0.95) return;
          const nearEdge = (rect.top <= 80 || rect.bottom >= vh - 80);
          if (!nearEdge) return;
        }

        // Check alpha transparency
        if (!rgba || rgba[3] < 0.05) return;

        const uid = elementUid(el);
        if (processed.has(uid)) return;
        processed.add(uid);

        // Determine if this element should use blur
        const elementUseBlur = (blurOverrides[uid] !== undefined)
          ? blurOverrides[uid]
          : useBlur;

        if (elementUseBlur) {
          // ── Blur mode: backdrop-filter + translucent bg ────────────────────
          const elementBlurRadius = (siteSettings.overridesBlurRadius && siteSettings.overridesBlurRadius[uid] !== undefined)
            ? siteSettings.overridesBlurRadius[uid]
            : blurRadius;

          const targetOpacity = (overrides[uid] !== undefined) ? overrides[uid] : globalOpacity;

          // Keep the original background but made slightly translucent
          const newBg = toRgba(rgba[0], rgba[1], rgba[2], Math.max(targetOpacity, 0.5));
          el.style.setProperty("background-color", newBg, "important");
          el.style.setProperty("backdrop-filter", `blur(${elementBlurRadius}px)`, "important");
          el.style.setProperty("-webkit-backdrop-filter", `blur(${elementBlurRadius}px)`, "important");
        } else {
          // ── Legacy transparency mode ──────────────────────────────────────
          const targetOpacity = (overrides[uid] !== undefined) ? overrides[uid] : globalOpacity;
          const newBg = toRgba(rgba[0], rgba[1], rgba[2], targetOpacity);
          el.style.setProperty("background-color", newBg, "important");
        }

        // Tag element so options page can identify it
        el.dataset.sitedropUid = uid;
        el.dataset.sitedropBlur = elementUseBlur ? "1" : "0";

        // Clear covering background-image
        const bgImg = cs.backgroundImage;
        if (bgImg && bgImg !== "none") {
          el.style.setProperty("background-image", "none", "important");
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", processCovers);
    } else {
      processCovers();
    }
    setTimeout(processCovers, 800);
    setTimeout(processCovers, 2500);

    // ── MutationObserver: catch dynamically added overlays (e.g. Bing search results) ──
    let moTimer = null;
    _currentMO = new MutationObserver(() => {
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(() => {
        processCovers();
        moTimer = null;
      }, 300);
    });
    if (document.body) {
      _currentMO.observe(document.body, { childList: true, subtree: true });
    } else {
      const onBodyReady = () => {
        _currentMO.observe(document.body, { childList: true, subtree: true });
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onBodyReady);
      } else {
        onBodyReady();
      }
    }
  }

  function removeBackground() {
    if (_currentMO) { _currentMO.disconnect(); _currentMO = null; }
    const style = document.getElementById("__sitedrop_style__");
    if (style) style.remove();
    const dimEl = document.getElementById("__sitedrop_dim__");
    if (dimEl) dimEl.remove();
    document.querySelectorAll("[data-sitedrop-uid]").forEach((el) => {
      el.style.removeProperty("background-color");
      el.style.removeProperty("background-image");
      el.style.removeProperty("backdrop-filter");
      el.style.removeProperty("-webkit-backdrop-filter");
      delete el.dataset.sitedropUid;
      delete el.dataset.sitedropBlur;
    });
  }

  // ── Message bridge ──────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "GET_COVERS") {
      const covers = [];
      document.querySelectorAll("[data-sitedrop-uid]").forEach((el) => {
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        const rgba = parseRgb(bg) || [0,0,0,0.5];
        covers.push({
          uid:     el.dataset.sitedropUid,
          tag:     el.tagName.toLowerCase(),
          id:      el.id || "",
          classes: typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0,4).join(" ") : "",
          opacity: rgba[3],
          blur:    el.dataset.sitedropBlur === "1",
        });
      });
      sendResponse({ covers, hostname });
    }
    if (msg.type === "PREVIEW_OPACITY") {
      document.querySelectorAll("[data-sitedrop-uid]").forEach((el) => {
        if (el.dataset.sitedropUid === msg.uid || msg.uid === "__global__") {
          const cs   = getComputedStyle(el);
          const rgba = parseRgb(cs.backgroundColor) || [255,255,255,0.5];
          if (msg.useBlur) {
            const newBg = toRgba(rgba[0], rgba[1], rgba[2], 0.65);
            el.style.setProperty("background-color", newBg, "important");
            el.style.setProperty("backdrop-filter", `blur(${msg.blurRadius || 10}px)`, "important");
            el.style.setProperty("-webkit-backdrop-filter", `blur(${msg.blurRadius || 10}px)`, "important");
          } else {
            el.style.setProperty("background-color", toRgba(rgba[0], rgba[1], rgba[2], msg.opacity), "important");
            el.style.removeProperty("backdrop-filter");
            el.style.removeProperty("-webkit-backdrop-filter");
          }
        }
      });
      sendResponse({ ok: true });
    }
    if (msg.type === "PREVIEW_BRIGHTNESS") {
      const dimEl = document.getElementById("__sitedrop_dim__");
      if (dimEl) {
        const dimAlpha = Math.min(1, Math.max(0, 1 - msg.brightness));
        dimEl.style.setProperty("background", `rgba(0,0,0,${dimAlpha})`, "important");
      }
      sendResponse({ ok: true });
    }
    return true;
  });

})();
