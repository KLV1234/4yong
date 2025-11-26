// script.js

// 이미지 정보를 저장할 배열 (파일 객체 또는 Data URL)
let imageFiles = {};

let defaultEmotions = [
  "smille", "angry", "sad", "surprised", "scared",
  "disgusted", "confused", "embarrassed", "blush", "bored", "laughing"
];

let emotions = [...defaultEmotions];

const list = document.getElementById("list");
const nameInput = document.getElementById("nameInput");

// 현재 선택된 모드와 이름을 기반으로 파일 이름을 생성합니다.
function getFileName(emo) {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  // 이름이 없을 경우 기본값으로 "____" 대신 "noname" 사용
  const name = nameInput.value.trim() || "noname"; 
  if (mode === "user") return `user-${name}_${emo}.png`;
  return `${name}-${emo}.png`;
}

// 이미지 렌더링 및 이벤트 바인딩
function render() {
  list.innerHTML = "";
  emotions.forEach((emo, idx) => {
    const item = document.createElement("div");
    item.className = "item";

    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.index = idx;
    dz.dataset.emotion = emo; // 감정 이름을 데이터셋에 저장

    // 이전에 저장된 이미지가 있으면 표시
    const storedImage = imageFiles[emo];
    if (storedImage) {
      if (typeof storedImage === 'string') { // Data URL인 경우
        dz.style.backgroundImage = `url(${storedImage})`;
        dz.textContent = "";
      } else if (storedImage instanceof File) { // File 객체인 경우 (렌더링 시 Data URL로 변환)
        dz.textContent = "Loading...";
        const reader = new FileReader();
        reader.onload = e => {
          dz.style.backgroundImage = `url(${e.target.result})`;
          dz.textContent = "";
          // File 객체를 Data URL로 변환하여 저장 (다음 렌더링 시 Data URL 사용)
          imageFiles[emo] = e.target.result; 
        };
        reader.readAsDataURL(storedImage);
      }
    } else {
      dz.textContent = "empty";
    }

    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", onDrop);
    dz.addEventListener("click", () => selectFile(emo)); // idx 대신 emo 사용

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = getFileName(emo); // 이름/모드 변경 시에도 파일명 갱신

    item.appendChild(dz);
    item.appendChild(label);
    list.appendChild(item);
  });
}

// 드래그 앤 드롭 이벤트 핸들러
function onDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const emo = this.dataset.emotion;
  if (emo) {
    setImage(this, file, emo);
  }
}

// 파일 선택 다이얼로그
function selectFile(emo) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    if (input.files[0]) {
      const dz = document.querySelector(`.dropzone[data-emotion='${emo}']`);
      if (dz) setImage(dz, input.files[0], emo);
    }
  };
  input.click();
}

// 이미지 설정 및 저장
function setImage(el, file, emo) {
  // File 객체를 imageFiles에 저장
  imageFiles[emo] = file; 

  const reader = new FileReader();
  reader.onload = e => {
    // Data URL로 배경 이미지 설정
    el.style.backgroundImage = `url(${e.target.result})`;
    el.textContent = "";
    // imageFiles에 Data URL로도 저장하여 다음 렌더링 시 로딩 없이 바로 표시 가능하게 함
    imageFiles[emo] = e.target.result; 
  };
  // 파일 읽기 시작
  reader.readAsDataURL(file);
}


// 감정 TXT 파일 불러오기
document.getElementById("txtLoader").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e2 => {
    emotions = e2.target.result.split(/\r?\n/).filter(x => x.trim());
    // 새로운 감정 목록이 로드되어도 기존 이미지 파일은 imageFiles에 유지됨
    render();
  };
  reader.readAsText(file);
});

// 커스텀 감정 추가
document.getElementById("customAdd").addEventListener("click", () => {
  const emo = prompt("추가할 감정 이름?");
  if (emo) {
    const trimmedEmo = emo.trim();
    if (!emotions.includes(trimmedEmo)) {
      emotions.push(trimmedEmo);
      render();
    } else {
      alert("이미 존재하는 감정 이름입니다.");
    }
  }
});

// 이름 입력, 모드 변경 시 이미지 초기화 방지 및 파일명 갱신
nameInput.addEventListener("input", render);
document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener("change", render));

// 초기 렌더링
render();

// --- ZIP 다운로드 기능 ---
document.getElementById("makeZip").addEventListener("click", async () => {
  if (typeof JSZip === 'undefined') {
    alert("ZIP 다운로드 라이브러리(JSZip)를 로드해야 합니다.");
    return;
  }
  
  const zip = new JSZip();
  let fileCount = 0;

  for (const emo of emotions) {
    const imageData = imageFiles[emo];
    if (!imageData) continue;

    const fileName = getFileName(emo);

    let blob;
    if (imageData instanceof File) {
      // File 객체인 경우 Blob으로 변환
      blob = imageData; 
    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Data URL인 경우 Fetch를 통해 Blob으로 변환
      try {
        const res = await fetch(imageData);
        blob = await res.blob();
      } catch (e) {
        console.error(`Error fetching image for ${emo}:`, e);
        continue;
      }
    } else {
      continue;
    }
    
    zip.file(fileName, blob);
    fileCount++;
  }
  
  if (fileCount === 0) {
    alert("다운로드할 이미지가 없습니다. 이미지를 추가해주세요.");
    return;
  }

  try {
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "emotions_pack.zip";
    a.click();
    URL.revokeObjectURL(a.href); // 메모리 해제
  } catch (e) {
    console.error("ZIP 파일 생성 오류:", e);
    alert("ZIP 파일 생성 중 오류가 발생했습니다.");
  }
});

// --- 자동 다운로드 (이미지 개별 다운로드) ---
document.getElementById("autoDownload").addEventListener("click", async () => {
  let fileCount = 0;

  for (const emo of emotions) {
    const imageData = imageFiles[emo];
    if (!imageData) continue;

    const fileName = getFileName(emo);

    let blob;
    if (imageData instanceof File) {
      blob = imageData; 
    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      try {
        const res = await fetch(imageData);
        blob = await res.blob();
      } catch (e) {
        console.error(`Error fetching image for ${emo}:`, e);
        continue;
      }
    } else {
      continue;
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href); // 메모리 해제

    fileCount++;
  }
  
  if (fileCount === 0) {
    alert("다운로드할 이미지가 없습니다. 이미지를 추가해주세요.");
  }
});