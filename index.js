// index.js - 감정 이미지 툴 기능

// --- 상태 ---
let defaultEmotions = [
  "smille", "angry", "sad", "surprised", "scared",
  "disgusted", "confused", "embarrassed", "blush", "bored", "laughing"
];
let emotions = [...defaultEmotions];
let imageData = {}; // 이미지 유지 저장

// --- 요소 ---
const list = document.getElementById("list");
const nameInput = document.getElementById("nameInput");
const txtLoader = document.getElementById("txtLoader");
const makeZipBtn = document.getElementById("makeZip");
const autoDownloadBtn = document.getElementById("autoDownload");
const resetBtn = document.getElementById("resetAll");

// --- 파일명 생성 ---
function getFileName(emo) {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const name = nameInput.value.trim() || "____";
  if (mode === "user") return `user-${name}_${emo}.png`;
  return `${name}-${emo}.png`;
}

// --- 렌더링 ---
function render() {
  const currentMode = document.querySelector('input[name="mode"]:checked').value;
  const currentName = nameInput.value.trim();

  list.innerHTML = "";

  emotions.forEach((emo, idx) => {
    const item = document.createElement("div");
    item.className = "item";

    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.index = idx;

    // 저장된 이미지 유지
    if (imageData[idx]) {
      dz.style.backgroundImage = `url(${imageData[idx]})`;
    } else {
      dz.textContent = "empty";
    }

    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", onDrop);
    dz.addEventListener("click", () => selectFile(idx));

    const label = document.createElement("div");
    label.textContent = getFileName(emo);

    item.appendChild(dz);
    item.appendChild(label);
    list.appendChild(item);
  });
}

// --- 드롭 이미지 처리 ---
function onDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  setImage(this, file);
}

function selectFile(idx) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    if (input.files[0]) setImage(document.querySelector(`.dropzone[data-index='${idx}']`), input.files[0]);
  };
  input.click();
}

// --- 이미지 세팅 + 저장 유지 ---
function setImage(el, file) {
  const idx = el.dataset.index;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    imageData[idx] = dataUrl; // 저장
    el.style.backgroundImage = `url(${dataUrl})`;
    el.textContent = "";
  };
  reader.readAsDataURL(file);
}

// --- TXT 로드 ---
txtLoader.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e2 => {
    emotions = e2.target.result.split(/\r?\n/).filter(x => x.trim());
    imageData = {}; // 리스트 변경 시 이미지 초기화
    render();
  };
  reader.readAsText(file);
});

// --- ZIP 다운로드 ---
makeZipBtn.addEventListener("click", async () => {
  const zip = new JSZip();

  for (let idx in imageData) {
    const dataUrl = imageData[idx];
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const emo = emotions[idx];
    const fileName = getFileName(emo);

    zip.file(fileName, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = "emotions.zip";
  a.click();
});

// --- 자동 개별 다운로드 ---
autoDownloadBtn.addEventListener("click", async () => {
  for (let idx in imageData) {
    const dataUrl = imageData[idx];
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const emo = emotions[idx];
    const fileName = getFileName(emo);

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }
});

// --- 초기화 버튼 ---
resetBtn.addEventListener("click", () => {
  if (!confirm("정말 초기화할까요?")) return;
  emotions = [...defaultEmotions];
  imageData = {};
  nameInput.value = "";
  render();
});

// --- 모드/이름 변화 시 재렌더링(이미지는 유지) ---
nameInput.addEventListener("input", render);
document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener("change", render));

// 초기 렌더
render();