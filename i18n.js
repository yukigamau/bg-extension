// i18n.js — multi-language support for SiteDrop extension
// =========================================================

const LANG = {
  en: {
    // Popup
    "logo-title": "SiteDrop",
    "cur-site": "Current site",
    "no-bg": "No background set",
    "choose-bg": "Choose background",
    "no-photos-settings": "No photos yet — go to Settings to add some.",
    "btn-photo-library": "\uD83D\uDCC1 Photo library",
    "btn-settings": "Settings",
    "all-settings": "All settings",
    "sys-page": "System page",
    "sys-cannot-apply": "Cannot apply backgrounds here",
    "sys-cannot-apply-msg": "Backgrounds can't be applied to browser system pages.",
    "bg-label": "Background:",
    "none-bg": "No background",
    // Photo Library
    "nav-library": "Photo Library",
    "nav-sites": "Sites",
    "nav-covers": "Cover Opacity",
    "nav-cleanup": "Cleanup",
    "lib-title": "Photo Library",
    "lib-sub": "All photos stored by SiteDrop. Add new ones or delete ones you no longer need.",
    "upload-title": "Drop images here, or click to browse",
    "upload-hint": "PNG, JPG, WEBP — stored locally in your browser",
    "stored-photos": "Stored photos",
    "no-photos-yet": "No photos yet. Upload some above.",
    "used-by": "Used by:",
    "not-used": "\u26A0 Not used by any site",
    "btn-delete": "Delete",
    "photo-added": "photo added",
    "photos-added": "photos added",
    "photo-deleted": "Photo deleted",
    // Sites
    "sites-title": "Sites",
    "sites-sub": "Assign a background photo to any website.",
    "col-domain": "Domain",
    "col-bg": "Background",
    "col-actions": "Actions",
    "no-sites": "No sites configured yet.",
    "add-site-placeholder": "e.g. claude.ai",
    "btn-add-site": "Add site",
    "missing-photo": "Missing photo",
    "btn-remove": "Remove",
    "site-removed": "Removed",
    "site-added": "Added",
    "enter-domain": "Enter a domain name",
    "select-photo-first": "Select a photo first",
    "no-photos-opt": "No photos yet",
    // Cover Opacity
    "covers-title": "Cover Opacity",
    "covers-sub": "Control how transparent each covering element is. Lower = more background visible.",
    "covers-info": "\uD83D\uDCA1 Open a site that has a background photo, then come back here and click <strong>Scan active tab</strong> to see its covering elements. Changes apply live.",
    "btn-scan": "Scan active tab",
    "btn-save-all": "Save all",
    "default-opacity": "Default opacity",
    "default-opacity-sub": "Applied to all covers without a custom value",
    "individual-covers": "Individual covers",
    "no-covers": "No covers scanned yet.",
    "no-covers-hint": "Select a site and click <strong>Scan active tab</strong>.",
    "select-site-first": "Select a site first",
    "no-tab-found": "No open tab found for",
    "no-tab-found-suffix": "Open that site first.",
    "no-response": "Reached the tab but got no response. Make sure a background photo is set for this site.",
    "covers-found": "cover element",
    "covers-found-plural": "cover elements",
    "nothing-to-save": "Nothing to save yet",
    "opacity-saved": "Opacity settings saved \u2713",
    "reset": "Reset to default",
    "no-sites-label": "No sites configured",
    // Blur
    "blur-mode": "Blur (Glassmorphism)",
    "blur-mode-sub": "Use backdrop-filter blur instead of transparency",
    "blur-radius": "Blur radius (px)",
    "btn-blur": "Blur",
    "btn-reset-all": "Reset all to defaults",
    // Brightness
    "bg-brightness": "Background brightness",
    "bg-brightness-sub": "Lower = darker overlay, text becomes easier to read on bright images",
    // Cleanup
    "cleanup-title": "Cleanup",
    "cleanup-sub": "Find and remove photos that aren't assigned to any site.",
    "all-in-use": "\u2705 All photos are in use.",
    "unused-found": "Found",
    "unused-photo-singular": "unused photo",
    "unused-photo-plural": "unused photos",
    "not-assigned": "Not assigned to any site",
    "btn-rescan": "Rescan",
    "btn-remove-unused": "Remove all unused photos",
    "unused-removed": "Unused photos removed",
    // Language
    "lang-label": "Language",
    "lang-en": "English",
    "lang-zh": "中文 (Chinese)",
  },

  zh: {
    // Popup
    "logo-title": "SiteDrop",
    "cur-site": "当前网站",
    "no-bg": "未设置背景",
    "choose-bg": "选择背景",
    "no-photos-settings": "还没有图片 — 前往设置页面添加。",
    "btn-photo-library": "\uD83D\uDCC1 图片库",
    "btn-settings": "设置",
    "all-settings": "所有设置",
    "sys-page": "系统页面",
    "sys-cannot-apply": "无法在此页面应用背景",
    "sys-cannot-apply-msg": "背景图片无法应用于浏览器系统页面。",
    "bg-label": "背景：",
    "none-bg": "无背景",
    // Photo Library
    "nav-library": "图片库",
    "nav-sites": "网站",
    "nav-covers": "覆盖层透明度",
    "nav-cleanup": "清理",
    "lib-title": "图片库",
    "lib-sub": "所有由 SiteDrop 存储的图片。上传新图片或删除不再需要的图片。",
    "upload-title": "拖放图片到此处，或点击浏览",
    "upload-hint": "PNG、JPG、WEBP — 在您的浏览器中本地存储",
    "stored-photos": "已存储的图片",
    "no-photos-yet": "还没有图片。请在上面上传一些。",
    "used-by": "使用于：",
    "not-used": "\u26A0 未被任何网站使用",
    "btn-delete": "删除",
    "photo-added": "张图片已添加",
    "photos-added": "张图片已添加",
    "photo-deleted": "图片已删除",
    // Sites
    "sites-title": "网站",
    "sites-sub": "为任何网站指定一张背景图片。",
    "col-domain": "域名",
    "col-bg": "背景",
    "col-actions": "操作",
    "no-sites": "尚未配置任何网站。",
    "add-site-placeholder": "例如 claude.ai",
    "btn-add-site": "添加网站",
    "missing-photo": "图片缺失",
    "btn-remove": "移除",
    "site-removed": "已移除",
    "site-added": "已添加",
    "enter-domain": "请输入域名",
    "select-photo-first": "请先选择一张图片",
    "no-photos-opt": "暂无图片",
    // Cover Opacity
    "covers-title": "覆盖层透明度",
    "covers-sub": "控制每个覆盖元素的透明度。数值越低，背景越可见。",
    "covers-info": "\uD83D\uDCA1 打开已设置背景的网站，然后回到此处点击<strong>扫描当前标签页</strong>查看覆盖元素。更改将实时生效。",
    "btn-scan": "扫描当前标签页",
    "btn-save-all": "保存所有",
    "default-opacity": "默认透明度",
    "default-opacity-sub": "应用于没有自定义值的所有覆盖元素",
    "individual-covers": "单个覆盖元素",
    "no-covers": "尚未扫描任何覆盖元素。",
    "no-covers-hint": "选择一个网站，然后点击<strong>扫描当前标签页</strong>。",
    "select-site-first": "请先选择一个网站",
    "no-tab-found": "未找到与",
    "no-tab-found-suffix": "匹配的标签页。请先打开该网站。",
    "no-response": "已连接到标签页但未收到响应。请确保该网站已设置背景图片。",
    "covers-found": "个覆盖元素",
    "covers-found-plural": "个覆盖元素",
    "nothing-to-save": "暂无内容可保存",
    "opacity-saved": "透明度设置已保存 ✓",
    "reset": "重置为默认值",
    "no-sites-label": "未配置网站",
    // Blur
    "blur-mode": "模糊 (毛玻璃效果)",
    "blur-mode-sub": "使用 backdrop-filter 高斯模糊替代透明度效果",
    "blur-radius": "模糊半径 (px)",
    "btn-blur": "模糊",
    "btn-reset-all": "全部还原为默认值",
    // Brightness
    "bg-brightness": "背景亮度",
    "bg-brightness-sub": "越低=遮罩越深，亮色图片上的文字更易阅读",
    // Cleanup
    "cleanup-title": "清理",
    "cleanup-sub": "查找并删除未分配给任何网站的图片。",
    "all-in-use": "✅ 所有图片均在使用中。",
    "unused-found": "找到",
    "unused-photo-singular": "张未使用的图片",
    "unused-photo-plural": "张未使用的图片",
    "not-assigned": "未分配给任何网站",
    "btn-rescan": "重新扫描",
    "btn-remove-unused": "删除所有未使用的图片",
    "unused-removed": "未使用的图片已删除",
    // Language
    "lang-label": "语言",
    "lang-en": "English",
    "lang-zh": "中文",
  }
};

// ── Current language ──────────────────────────────────────────────────────────
let _currentLang = "en";

// ── t(key, ...replacements) ───────────────────────────────────────────────────
// Returns translated string. Use %s, %d etc for replacements.
function t(key, ...args) {
  const dict = LANG[_currentLang] || LANG.en;
  let str = dict[key];
  if (str === undefined) {
    str = LANG.en[key] || key;
  }
  if (args.length > 0) {
    let ri = 0;
    str = str.replace(/%[sd]/g, () => args[ri++] ?? "");
  }
  return str;
}

// ── get/set language ──────────────────────────────────────────────────────────
function getLanguage() {
  return _currentLang;
}

function setLanguage(lang, callback) {
  if (!LANG[lang]) lang = "en";
  _currentLang = lang;
  chrome.storage.local.set({ language: lang }, () => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    translateDOM();
    if (callback) callback();
  });
}

// ── Init language ─────────────────────────────────────────────────────────────
function initLanguage(callback) {
  chrome.storage.local.get("language", (data) => {
    const preferred = data.language || navigator.language.split("-")[0];
    _currentLang = LANG[preferred] ? preferred : "en";
    document.documentElement.lang = _currentLang === "zh" ? "zh-CN" : "en";
    translateDOM();
    if (callback) callback();
  });
}

// ── Translate DOM ─────────────────────────────────────────────────────────────
function translateDOM() {
  // data-i18n → textContent
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // data-i18n-title → title attribute
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  // data-i18n-placeholder → placeholder attribute
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // data-i18n-html → innerHTML (use with caution)
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}
