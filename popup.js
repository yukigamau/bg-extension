// popup.js

let currentHostname = "";
let allPhotos = {};
let siteMap = {};

// Get current tab hostname
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url;
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
    document.getElementById("hostnameEl").textContent = t("sys-page");
    document.getElementById("statusEl").textContent = t("sys-cannot-apply");
    document.getElementById("photoGrid").style.display = "none";
    document.getElementById("emptyMsg").style.display = "block";
    document.getElementById("emptyMsg").textContent = t("sys-cannot-apply-msg");
    return;
  }
  try {
    currentHostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    currentHostname = "";
  }
  document.getElementById("hostnameEl").textContent = currentHostname || "Unknown";
  loadData();
});

function loadData() {
  initLanguage(() => {
    chrome.storage.local.get(["photos", "siteMap"], (data) => {
      allPhotos = data.photos || {};
      siteMap = data.siteMap || {};
      renderGrid();
      updateStatus();
    });
  });
}

function updateStatus() {
  const photoKey = siteMap[currentHostname];
  const statusEl = document.getElementById("statusEl");
  if (photoKey && allPhotos[photoKey]) {
    statusEl.textContent = t("bg-label") + " " + allPhotos[photoKey].name;
    statusEl.className = "site-status active";
  } else {
    statusEl.textContent = t("no-bg");
    statusEl.className = "site-status";
  }
}

function renderGrid() {
  const grid = document.getElementById("photoGrid");
  const emptyMsg = document.getElementById("emptyMsg");
  const keys = Object.keys(allPhotos);
  grid.innerHTML = "";

  if (keys.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  // "None" option
  const noneEl = document.createElement("div");
  noneEl.className = "none-thumb" + (!siteMap[currentHostname] ? " selected" : "");
  noneEl.title = t("none-bg");
  noneEl.textContent = "✕";
  noneEl.addEventListener("click", () => {
    delete siteMap[currentHostname];
    chrome.storage.local.set({ siteMap }, () => {
      renderGrid();
      updateStatus();
      reloadCurrentTab();
    });
  });
  grid.appendChild(noneEl);

  keys.forEach((key) => {
    const photo = allPhotos[key];
    const isSelected = siteMap[currentHostname] === key;

    const thumb = document.createElement("div");
    thumb.className = "photo-thumb" + (isSelected ? " selected" : "");
    thumb.title = photo.name;

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    thumb.appendChild(img);

    thumb.addEventListener("click", () => {
      siteMap[currentHostname] = key;
      chrome.storage.local.set({ siteMap }, () => {
        renderGrid();
        updateStatus();
        reloadCurrentTab();
      });
    });

    grid.appendChild(thumb);
  });
}

function reloadCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
  });
}

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("openOptions2").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("openPhotoFolder").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") + "#library" });
});
