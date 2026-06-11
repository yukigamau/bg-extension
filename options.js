// options.js

let allPhotos    = {};  // { key: { name, dataUrl } }
let siteMap      = {};  // { hostname: photoKey }
let coverSettings = {}; // { hostname: { global: 0.5, overrides: { uid: opacity } } }

// Covers page state
let scannedCovers  = [];   // [{ uid, tag, id, classes, opacity }]
let scannedHost    = "";
let pendingOverrides = {}; // { uid: opacity } — unsaved changes

// ── Load / Save ──────────────────────────────────────────────────────────────

function load(cb) {
  chrome.storage.local.get(["photos", "siteMap", "coverSettings", "language"], (data) => {
    allPhotos     = data.photos       || {};
    siteMap       = data.siteMap      || {};
    coverSettings = data.coverSettings || {};
    // Sync language preference from storage to i18n
    if (data.language && LANG[data.language]) {
      _currentLang = data.language;
      document.documentElement.lang = _currentLang === "zh" ? "zh-CN" : "en";
    }
    cb && cb();
  });
}

function save(cb) {
  chrome.storage.local.set({ photos: allPhotos, siteMap, coverSettings }, cb);
}

// ── Toast ────────────────────────────────────────────────────────────────────

function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = "toast"; }, 2800);
}

// ── Navigation ───────────────────────────────────────────────────────────────

function initNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      item.classList.add("active");
      document.getElementById("page-" + item.dataset.page).classList.add("active");
      // Refresh data on page enter — ensures Stored Photos shows latest usage status
      if (item.dataset.page === "library") renderLibrary();
      if (item.dataset.page === "cleanup") renderCleanup();
      if (item.dataset.page === "covers")  renderCoverSiteSelect();
    });
  });
  if (location.hash === "#library") document.querySelector('[data-page="library"]').click();
  if (location.hash === "#covers")  document.querySelector('[data-page="covers"]').click();
}

// ── Language Switcher ─────────────────────────────────────────────────────────

function initLangSwitcher() {
  const sel = document.getElementById("langSelect");
  sel.value = _currentLang;
  sel.addEventListener("change", () => {
    setLanguage(sel.value, () => {
      // Re-render all dynamic content with new language
      translateDOM();
      renderLibrary();
      renderSites();
      renderCoverSiteSelect();
      renderCoversPage();
      renderCleanup();
      // Update page content that's translated via data-i18n
      document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.dataset.i18n);
      });
      document.querySelectorAll("[data-i18n-title]").forEach(el => {
        el.title = t(el.dataset.i18nTitle);
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
      });
      document.querySelectorAll("[data-i18n-html]").forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
      });
    });
  });
}

// ── Photo Library ────────────────────────────────────────────────────────────

function renderLibrary() {
  const list  = document.getElementById("photoList");
  const empty = document.getElementById("emptyLibrary");
  const keys  = Object.keys(allPhotos);
  list.innerHTML = "";

  if (keys.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  keys.forEach(key => {
    const photo  = allPhotos[key];
    const usedBy = Object.entries(siteMap).filter(([, v]) => v === key).map(([k]) => k);
    const row = document.createElement("div");
    row.className = "photo-row";
    row.innerHTML = `
      <img src="${photo.dataUrl}" alt="${photo.name}" />
      <div class="photo-info">
        <div class="photo-name">${photo.name}</div>
        <div class="photo-usage ${usedBy.length === 0 ? "unused" : ""}">
          ${usedBy.length === 0 ? t("not-used") : t("used-by") + " " + usedBy.join(", ")}
        </div>
      </div>
      <div class="photo-actions">
        <button class="btn danger" data-key="${key}">${t("btn-delete")}</button>
      </div>`;
    row.querySelector(".btn.danger").addEventListener("click", () => deletePhoto(key));
    list.appendChild(row);
  });
  refreshPhotoSelect();
}

function deletePhoto(key) {
  Object.keys(siteMap).forEach(site => { if (siteMap[site] === key) delete siteMap[site]; });
  delete allPhotos[key];
  save(() => { renderLibrary(); renderSites(); toast(t("photo-deleted")); });
}

function initUpload() {
  const zone  = document.getElementById("uploadZone");
  const input = document.getElementById("fileInput");
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("drag-over"); handleFiles(e.dataTransfer.files); });
  input.addEventListener("change", () => handleFiles(input.files));
}

function handleFiles(files) {
  const arr = Array.from(files);
  let done = 0;
  arr.forEach(file => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const key = "photo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      allPhotos[key] = { name: file.name.replace(/\.[^.]+$/, ""), dataUrl: e.target.result };
      if (++done === arr.length) save(() => { renderLibrary(); toast(done + (done > 1 ? t("photos-added") : t("photo-added"))); });
    };
    reader.readAsDataURL(file);
  });
}

// ── Sites ────────────────────────────────────────────────────────────────────

function refreshPhotoSelect() {
  const sel  = document.getElementById("newSitePhoto");
  sel.innerHTML = "";
  const keys = Object.keys(allPhotos);
  if (keys.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = t("no-photos-opt"); opt.disabled = true;
    sel.appendChild(opt);
  } else {
    keys.forEach(key => {
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = allPhotos[key].name;
      sel.appendChild(opt);
    });
  }
}

function renderSites() {
  const body  = document.getElementById("sitesBody");
  const empty = document.getElementById("emptySites");
  const entries = Object.entries(siteMap);
  body.innerHTML = "";
  if (entries.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  entries.forEach(([site, photoKey]) => {
    const photo = allPhotos[photoKey];
    const thumbHtml = photo
      ? `<img src="${photo.dataUrl}" alt="" width="16" height="16" style="border-radius:3px;object-fit:cover;vertical-align:middle;"> ${photo.name}`
      : `<span style="color:var(--danger)">${t("missing-photo")}</span>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="site-cell"><div class="site-dot"></div><span class="site-domain">${site}</span></div></td>
      <td><span class="photo-badge">${thumbHtml}</span></td>
      <td class="actions-cell"><button class="btn danger" data-site="${site}">${t("btn-remove")}</button></td>`;
    tr.querySelector(".btn.danger").addEventListener("click", () => {
      delete siteMap[site];
      save(() => { renderSites(); renderLibrary(); toast(t("site-removed") + " " + site); });
    });
    body.appendChild(tr);
  });
}

function initAddSite() {
  document.getElementById("addSiteBtn").addEventListener("click", () => {
    let domain   = document.getElementById("newSiteInput").value.trim();
    const photoKey = document.getElementById("newSitePhoto").value;
    if (!domain)   { toast(t("enter-domain"), "error"); return; }
    if (!photoKey || !allPhotos[photoKey]) { toast(t("select-photo-first"), "error"); return; }
    domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    siteMap[domain] = photoKey;
    save(() => { document.getElementById("newSiteInput").value = ""; renderSites(); toast(t("site-added") + " " + domain); });
  });
  document.getElementById("newSiteInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("addSiteBtn").click();
  });
}

// ── Cover Opacity ─────────────────────────────────────────────────────────────

let pendingBlurOverrides = {};     // { uid: true/false }
let pendingBlurRadiusOverrides = {}; // { uid: px }

function renderCoverSiteSelect() {
  const sel = document.getElementById("coverSiteSelect");
  sel.innerHTML = "";
  const sites = Object.keys(siteMap);
  if (sites.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = t("no-sites-label"); opt.disabled = true;
    sel.appendChild(opt);
    return;
  }
  sites.forEach(site => {
    const opt = document.createElement("option");
    opt.value = site; opt.textContent = site;
    sel.appendChild(opt);
  });
  // Pre-select if we already have a scanned host
  if (scannedHost && sites.includes(scannedHost)) sel.value = scannedHost;
}

function renderCoversPage() {
  const list      = document.getElementById("coverList");
  const empty     = document.getElementById("coversEmpty");
  const globalRow = document.getElementById("globalOpacityRow");

  const host = scannedHost || document.getElementById("coverSiteSelect").value;
  const siteConf = coverSettings[host] || {};

  // ── Sync global blur controls ──────────────────────────────────────────
  const globalUseBlur = (pendingBlurOverrides["__global__"] !== undefined)
    ? pendingBlurOverrides["__global__"]
    : (siteConf.useBlur || false);
  document.getElementById("globalBlurToggle").checked = globalUseBlur;
  const blurRadiusRow = document.getElementById("globalBlurRadiusRow");
  blurRadiusRow.classList.toggle("visible", globalUseBlur);

  const savedBlurRadius = siteConf.blurRadius || 10;
  const pendingBlurRadius = (pendingBlurRadiusOverrides["__global__"] !== undefined)
    ? pendingBlurRadiusOverrides["__global__"]
    : savedBlurRadius;
  const globalBlurSlider = document.getElementById("globalBlurSlider");
  const globalBlurValue  = document.getElementById("globalBlurValue");
  globalBlurSlider.value = pendingBlurRadius;
  globalBlurValue.textContent = pendingBlurRadius + "px";

  globalBlurSlider.oninput = () => {
    const v = parseInt(globalBlurSlider.value);
    globalBlurValue.textContent = v + "px";
    pendingBlurRadiusOverrides["__global__"] = v;
    // Preview blur on all covers
    const newBlur = document.getElementById("globalBlurToggle").checked;
    sendPreviewToTab("__global__", null, newBlur, v);
  };

  document.getElementById("globalBlurToggle").onchange = () => {
    const on = document.getElementById("globalBlurToggle").checked;
    blurRadiusRow.classList.toggle("visible", on);
    pendingBlurOverrides["__global__"] = on;
    const r = parseInt(globalBlurSlider.value);
    sendPreviewToTab("__global__", null, on, r);
  };

  // ── Global opacity slider ─────────────────────────────────────────────
  const globalOpacity = (siteConf.global !== undefined) ? siteConf.global : 0.75;
  const globalSlider  = document.getElementById("globalSlider");
  const globalValue   = document.getElementById("globalValue");
  globalSlider.value  = Math.round(globalOpacity * 100);
  globalValue.textContent = Math.round(globalOpacity * 100) + "%";

  globalSlider.oninput = () => {
    const val = parseInt(globalSlider.value) / 100;
    globalValue.textContent = Math.round(val * 100) + "%";
    sendPreviewToTab("__global__", val);
  };

  globalRow.style.display = "flex";

  // ── Background brightness ─────────────────────────────────────────────
  const brightness = (siteConf.brightness !== undefined) ? siteConf.brightness : 1.0;
  const brightSlider = document.getElementById("brightnessSlider");
  const brightValue  = document.getElementById("brightnessValue");
  brightSlider.value = Math.round(brightness * 100);
  brightValue.textContent = Math.round(brightness * 100) + "%";

  brightSlider.oninput = () => {
    const v = parseInt(brightSlider.value) / 100;
    brightValue.textContent = Math.round(v * 100) + "%";
    // Live preview brightness on the tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "PREVIEW_BRIGHTNESS", brightness: v });
    });
  };

  // ── Render individual covers ──────────────────────────────────────────
  list.innerHTML = "";

  const emptyTitle = empty.querySelector("p");
  if (emptyTitle) emptyTitle.innerHTML = t("no-covers");

  if (scannedCovers.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const overrides = Object.assign({}, siteConf.overrides || {}, pendingOverrides);
  const blurOverrides = Object.assign({}, siteConf.blurOverrides || {}, pendingBlurOverrides);

  // Get current desired blur state for the host
  const hostUseBlur = (pendingBlurOverrides["__global__"] !== undefined)
    ? pendingBlurOverrides["__global__"]
    : (siteConf.useBlur || false);
  const hostBlurRadius = (pendingBlurRadiusOverrides["__global__"] !== undefined)
    ? pendingBlurRadiusOverrides["__global__"]
    : (siteConf.blurRadius || 10);

  scannedCovers.forEach(cover => {
    const currentOpacity = (overrides[cover.uid] !== undefined)
      ? overrides[cover.uid]
      : (siteConf.global !== undefined ? siteConf.global : 0.75);

    const pct = Math.round(currentOpacity * 100);
    const hasOverride = pendingOverrides[cover.uid] !== undefined || (siteConf.overrides || {})[cover.uid] !== undefined;

    // Element-level blur state
    const elBlur = (blurOverrides[cover.uid] !== undefined)
      ? blurOverrides[cover.uid]
      : (cover.blur || hostUseBlur);
    const elBlurRadius = (pendingBlurRadiusOverrides[cover.uid] !== undefined)
      ? pendingBlurRadiusOverrides[cover.uid]
      : ((siteConf.overridesBlurRadius && siteConf.overridesBlurRadius[cover.uid] !== undefined)
        ? siteConf.overridesBlurRadius[cover.uid]
        : hostBlurRadius);

    const label = cover.id ? `#${cover.id}` : cover.classes ? `.${cover.classes.split(" ")[0]}` : `<${cover.tag}>`;

    const row = document.createElement("div");
    row.className = "cover-row";
    row.style.flexWrap = "wrap";
    row.innerHTML = `
      <span class="cover-tag">${cover.tag}</span>
      <div class="cover-desc">
        <div class="cover-selector">${label}</div>
        <div class="cover-uid">${cover.uid}</div>
      </div>
      <div class="opacity-control">
        <input type="range" min="0" max="100" value="${pct}" data-uid="${cover.uid}" class="cover-slider" />
        <span class="opacity-value cover-val">${pct}%</span>
      </div>
      <button class="blur-btn ${elBlur ? "active" : ""}" data-uid="${cover.uid}" title="${t("btn-blur")}">🌫 ${t("btn-blur")}</button>
      <button class="reset-btn" data-uid="${cover.uid}" title="${t("reset")}" ${hasOverride ? "" : "style='opacity:0.3;pointer-events:none'"}>↺</button>
    `;

    // ── Element blur radius row ──────────────────────────────────────────
    const blurRadiusRow = document.createElement("div");
    blurRadiusRow.className = "blur-radius-row" + (elBlur ? " visible" : "");
    blurRadiusRow.style.width = "100%";
    blurRadiusRow.style.marginTop = "0";
    blurRadiusRow.style.marginBottom = "0";
    blurRadiusRow.innerHTML = `
      <div class="label" style="font-size:11px">${t("blur-radius")}</div>
      <div class="opacity-control">
        <input type="range" min="2" max="30" value="${elBlurRadius}" class="cover-blur-slider" data-uid="${cover.uid}" />
        <span class="opacity-value cover-blur-value">${elBlurRadius}px</span>
      </div>
    `;

    // ── Wire up events ──────────────────────────────────────────────────
    const slider   = row.querySelector(".cover-slider");
    const valLabel = row.querySelector(".cover-val");
    const resetBtn = row.querySelector(".reset-btn");
    const blurBtn  = row.querySelector(".blur-btn");
    const blurSlider = blurRadiusRow.querySelector(".cover-blur-slider");
    const blurValLabel = blurRadiusRow.querySelector(".cover-blur-value");

    slider.addEventListener("input", () => {
      const v = parseInt(slider.value) / 100;
      valLabel.textContent = Math.round(v * 100) + "%";
      pendingOverrides[cover.uid] = v;
      resetBtn.style.opacity = "1";
      resetBtn.style.pointerEvents = "auto";
      const elBlurActive = blurBtn.classList.contains("active");
      const elBlurR = parseInt(blurSlider.value);
      sendPreviewToTab(cover.uid, v, elBlurActive, elBlurR);
    });

    blurSlider.addEventListener("input", () => {
      const v = parseInt(blurSlider.value);
      blurValLabel.textContent = v + "px";
      pendingBlurRadiusOverrides[cover.uid] = v;
      const elOpacity = parseInt(slider.value) / 100;
      sendPreviewToTab(cover.uid, elOpacity, true, v);
    });

    blurBtn.addEventListener("click", () => {
      const nowOn = !blurBtn.classList.contains("active");
      blurBtn.classList.toggle("active", nowOn);
      blurRadiusRow.classList.toggle("visible", nowOn);
      pendingBlurOverrides[cover.uid] = nowOn;
      const elOpacity = parseInt(slider.value) / 100;
      const elBlurR = nowOn ? parseInt(blurSlider.value) : 0;
      sendPreviewToTab(cover.uid, elOpacity, nowOn, elBlurR);
    });

    resetBtn.addEventListener("click", () => {
      delete pendingOverrides[cover.uid];
      delete pendingBlurOverrides[cover.uid];
      delete pendingBlurRadiusOverrides[cover.uid];
      if (coverSettings[scannedHost]) {
        if (coverSettings[scannedHost].overrides) delete coverSettings[scannedHost].overrides[cover.uid];
        if (coverSettings[scannedHost].blurOverrides) delete coverSettings[scannedHost].blurOverrides[cover.uid];
        if (coverSettings[scannedHost].overridesBlurRadius) delete coverSettings[scannedHost].overridesBlurRadius[cover.uid];
      }
      const fallbackOpacity = (coverSettings[scannedHost] || {}).global || 0.75;
      const fallbackBlur = hostUseBlur;
      const fallbackBlurRadius = hostBlurRadius;
      slider.value = Math.round(fallbackOpacity * 100);
      valLabel.textContent = Math.round(fallbackOpacity * 100) + "%";
      resetBtn.style.opacity = "0.3";
      resetBtn.style.pointerEvents = "none";
      blurBtn.classList.toggle("active", fallbackBlur);
      blurRadiusRow.classList.toggle("visible", fallbackBlur);
      blurSlider.value = fallbackBlurRadius;
      blurValLabel.textContent = fallbackBlurRadius + "px";
      sendPreviewToTab(cover.uid, fallbackOpacity, fallbackBlur, fallbackBlurRadius);
    });

    list.appendChild(row);
    list.appendChild(blurRadiusRow);
  });
}

function sendPreviewToTab(uid, opacity, useBlur, blurRadius) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "PREVIEW_OPACITY",
      uid, opacity,
      useBlur: useBlur || false,
      blurRadius: blurRadius || 10,
    });
  });
}

function initBlurControls() {
  // Global blur toggle + radius already wired in renderCoversPage
}

function initCoversPage() {
  document.getElementById("scanTabBtn").addEventListener("click", () => {
    const sel      = document.getElementById("coverSiteSelect");
    const host     = sel.value;
    if (!host) { toast(t("select-site-first"), "error"); return; }

    chrome.tabs.query({}, (tabs) => {
      const matchingTab = tabs.find(t => {
        if (!t.url) return false;
        try {
          const tabHost = new URL(t.url).hostname.replace(/^www\./, "");
          return tabHost === host;
        } catch { return false; }
      });
      if (!matchingTab) {
        toast(t("no-tab-found") + ' "' + host + '" ' + t("no-tab-found-suffix"), "error");
        return;
      }
      chrome.tabs.sendMessage(matchingTab.id, { type: "GET_COVERS" }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          toast(t("no-response"), "error");
          return;
        }
        scannedCovers    = resp.covers || [];
        scannedHost      = resp.hostname || host;
        pendingOverrides = {};
        pendingBlurOverrides = {};
        pendingBlurRadiusOverrides = {};
        renderCoversPage();
        const count = scannedCovers.length;
        toast(t("unused-found") + " " + count + " " + (count !== 1 ? t("covers-found-plural") : t("covers-found")));
      });
    });
  });

  document.getElementById("saveCoversBtn").addEventListener("click", () => {
    if (!scannedHost) { toast(t("nothing-to-save"), "error"); return; }

    const globalOpacity = parseInt(document.getElementById("globalSlider").value) / 100;

    if (!coverSettings[scannedHost]) coverSettings[scannedHost] = {};
    coverSettings[scannedHost].global = globalOpacity;
    coverSettings[scannedHost].brightness = parseInt(document.getElementById("brightnessSlider").value) / 100;

    // Save global blur settings
    const globalUseBlur = document.getElementById("globalBlurToggle").checked;
    coverSettings[scannedHost].useBlur = globalUseBlur;
    if (globalUseBlur) {
      coverSettings[scannedHost].blurRadius = parseInt(document.getElementById("globalBlurSlider").value);
    }

    // Save per-element opacity overrides
    if (!coverSettings[scannedHost].overrides) coverSettings[scannedHost].overrides = {};
    Object.assign(coverSettings[scannedHost].overrides, pendingOverrides);

    // Save per-element blur overrides
    if (!coverSettings[scannedHost].blurOverrides) coverSettings[scannedHost].blurOverrides = {};
    Object.assign(coverSettings[scannedHost].blurOverrides, pendingBlurOverrides);
    // Remove __global__ sentinel if present
    delete coverSettings[scannedHost].blurOverrides["__global__"];

    // Save per-element blur radius overrides
    if (!coverSettings[scannedHost].overridesBlurRadius) coverSettings[scannedHost].overridesBlurRadius = {};
    Object.assign(coverSettings[scannedHost].overridesBlurRadius, pendingBlurRadiusOverrides);
    delete coverSettings[scannedHost].overridesBlurRadius["__global__"];

    pendingOverrides = {};
    pendingBlurOverrides = {};
    pendingBlurRadiusOverrides = {};

    save(() => toast(t("opacity-saved")));
  });

  document.getElementById("resetAllBtn").addEventListener("click", () => {
    if (!scannedHost) { toast(t("nothing-to-save"), "error"); return; }

    // Clear all pending and persistent overrides for this host
    pendingOverrides = {};
    pendingBlurOverrides = {};
    pendingBlurRadiusOverrides = {};

    if (coverSettings[scannedHost]) {
      delete coverSettings[scannedHost].overrides;
      delete coverSettings[scannedHost].blurOverrides;
      delete coverSettings[scannedHost].overridesBlurRadius;
      // Reset global settings too
      coverSettings[scannedHost].global = 0.75;
      coverSettings[scannedHost].brightness = 1.0;
      coverSettings[scannedHost].useBlur = false;
      coverSettings[scannedHost].blurRadius = 10;
    }

    // Update global controls
    document.getElementById("globalSlider").value = 75;
    document.getElementById("globalValue").textContent = "75%";
    document.getElementById("brightnessSlider").value = 100;
    document.getElementById("brightnessValue").textContent = "100%";
    document.getElementById("globalBlurToggle").checked = false;
    document.getElementById("globalBlurRadiusRow").classList.remove("visible");
    document.getElementById("globalBlurSlider").value = 10;
    document.getElementById("globalBlurValue").textContent = "10px";

    // Save to storage and re-render
    save(() => {
      renderCoversPage();
      // Apply to tab
      sendPreviewToTab("__global__", 0.75, false, 10);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: "PREVIEW_BRIGHTNESS", brightness: 1.0 });
      });
      toast(t("opacity-saved") + " (" + t("btn-reset-all") + ")");
    });
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function renderCleanup() {
  const info = document.getElementById("cleanupInfo");
  const list = document.getElementById("cleanupList");
  const btn  = document.getElementById("removeUnusedBtn");
  list.innerHTML = "";

  const usedKeys = new Set(Object.values(siteMap));
  const unused   = Object.keys(allPhotos).filter(k => !usedKeys.has(k));

  if (unused.length === 0) { info.textContent = t("all-in-use"); btn.style.display = "none"; return; }

  info.textContent = t("unused-found") + " " + unused.length + " " + (unused.length > 1 ? t("unused-photo-plural") : t("unused-photo-singular")) + ".";
  btn.style.display = "inline-flex";
  btn.textContent = t("btn-remove-unused");

  unused.forEach(key => {
    const photo = allPhotos[key];
    const item  = document.createElement("div");
    item.className = "cleanup-item";
    item.innerHTML = `<img src="${photo.dataUrl}" alt="${photo.name}" /><div><div class="cleanup-name">${photo.name}</div><div class="cleanup-reason">${t("not-assigned")}</div></div>`;
    list.appendChild(item);
  });
}

document.getElementById("rescanBtn").addEventListener("click", renderCleanup);
document.getElementById("removeUnusedBtn").addEventListener("click", () => {
  const usedKeys = new Set(Object.values(siteMap));
  Object.keys(allPhotos).forEach(k => { if (!usedKeys.has(k)) delete allPhotos[k]; });
  save(() => { renderCleanup(); renderLibrary(); toast(t("unused-removed")); });
});

// ── Init ──────────────────────────────────────────────────────────────────────

load(() => {
  // Translate all static DOM on first load
  translateDOM();

  initNav();
  initUpload();
  initAddSite();
  initCoversPage();
  initBlurControls();
  initLangSwitcher();
  renderLibrary();
  renderSites();
});
