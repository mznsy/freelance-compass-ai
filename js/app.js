ument.getElementById("result-hashtags");
const copyAllBtn = document.getElementById("copy-all-btn");
const toast = document.getElementById("toast");

let toastTimer = null;
let lastResult = null;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("toast--visible");
  toastTimer = setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 300);
  }, 2200);
}

function updateGenerateButton() {
  generateBtn.disabled = state.images.length === 0;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addImages(files) {
  const remaining = MAX_IMAGES - state.images.length;
  if (remaining <= 0) {
    showToast(`写真は最大${MAX_IMAGES}枚までです`);
    return;
  }

  const accepted = Array.from(files)
    .filter((f) => f.type.startsWith("image/"))
    .slice(0, remaining);

  for (const file of accepted) {
    if (file.size > MAX_FILE_SIZE) {
      showToast(`${file.name} は10MBを超えているためスキップしました`);
      continue;
    }
    const dataUrl = await readFileAsDataUrl(file);
    state.images.push({ file, dataUrl });
  }

  renderPreviews();
  updateGenerateButton();
}

function removeImage(index) {
  state.images.splice(index, 1);
  renderPreviews();
  updateGenerateButton();
}

function renderPreviews() {
  previewGrid.innerHTML = "";
  if (state.images.length === 0) {
    previewGrid.hidden = true;
    return;
  }

  previewGrid.hidden = false;
  state.images.forEach((img, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";

    const image = document.createElement("img");
    image.src = img.dataUrl;
    image.alt = `アップロード画像 ${index + 1}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "preview-item__remove";
    removeBtn.setAttribute("aria-label", "この写真を削除");
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeImage(index);
    });

    item.appendChild(image);
    item.appendChild(removeBtn);
    previewGrid.appendChild(item);
  });
}

function getFormData() {
  return {
    productName: document.getElementById("product-name").value.trim(),
    category: document.getElementById("category").value,
    platform: document.getElementById("platform").value,
    condition: document.getElementById("condition").value,
    tone: document.getElementById("tone").value,
    features: document.getElementById("features").value.trim(),
  };
}

function setLoading(loading) {
  generateBtn.disabled = loading || state.images.length === 0;
  generateBtn.classList.toggle("btn--loading", loading);
  generateBtn.querySelector(".btn__spinner").hidden = !loading;
}

function renderResult(data, mode) {
  lastResult = data;
  resultTitle.textContent = data.title;
  resultDescription.textContent = data.description;
  resultHashtags.textContent = data.hashtags.join(" ");

  modeBadge.hidden = false;
  modeBadge.className =
    mode === "ai" ? "mode-badge mode-badge--ai" : "mode-badge mode-badge--demo";
  modeBadge.textContent =
    mode === "ai"
      ? "✨ AIモードで作成しました"
      : "📝 デモモード（APIキー未設定時はテンプレートで作成）";

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("コピーしました！");
  } catch {
    showToast("コピーに失敗しました");
  }
}

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    addImages(e.target.files);
    fileInput.value = "";
  }
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dropzone--active");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dropzone--active");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dropzone--active");
  if (e.dataTransfer.files.length) {
    addImages(e.dataTransfer.files);
  }
});

const MAX_IMAGES = 5;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const state = {

  images: [],

};

productForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (state.images.length === 0) {

    alert("写真を選択してください");

    return;

  }
}

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const previewGrid = document.getElementById("preview-grid");
const productForm = document.getElementById("product-form");
const generateBtn = document.getElementById("generate-btn");
const resultSection = document.getElementById("result-section");
const modeBadge = document.getElementById("mode-badge");
const resultTitle = document.getElementById("result-title");
const resultDescription = document.getElementById("result-description");
const resultHashtags =  document.getElementById("result-hashtags")s

  setLoading(true);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: state.images.map((img) => img.dataUrl),
        ...getFormData(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "作成に失敗しました");
    }

    renderResult(data, data.mode);
    showToast("商品説明が完成しました！");
  } catch (err) {
    showToast(err.message || "エラーが発生しました");
  } finally {
    setLoading(false);
  }
});

document.querySelectorAll(".btn--copy").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!lastResult) return;
    const type = btn.dataset.copy;
    const map = {
      title: lastResult.title,
      description: lastResult.description,
      hashtags: lastResult.hashtags.join(" "),
    };
    copyText(map[type]);
  });
});

copyAllBtn.addEventListener("click", () => {
  if (!lastResult) return;
  const all = [
    `【タイトル】\n${lastResult.title}`,
    `\n【商品説明】\n${lastResult.description}`,
    `\n【ハッシュタグ】\n${lastResult.hashtags.join(" ")}`,
  ].join("\n");
  copyText(all);
});ra
