const defaultEmotions = [
    "smile", "angry", "sad", "surprised", "scared",
    "disgusted", "confused", "embarrassed", "blush", "bored", "laughing"
];
let currentEmotions = [...defaultEmotions]; // 현재 표시될 감정 목록
const fileDataMap = new Map(); // { emotion: File object } 형태로 이미지 데이터 저장

const emotionContainer = document.getElementById('emotion-container');
const nameInput = document.getElementById('name-input');
const userCharSwitch = document.getElementById('user-char-switch');
const extensionSelect = document.getElementById('extension-select');
const emotionFileInput = document.getElementById('emotion-file-input');
const switchText = document.getElementById('switch-text');

// --- 헬퍼 함수 ---

// 1. 파일 이름 생성 함수
function getFileName(emotion, fileExtension) {
    const name = nameInput.value.trim() || "캐릭터"; // 이름이 없으면 '캐릭터' 사용
    const prefix = userCharSwitch.checked ? '' : 'user-'; // checked: 캐릭터 모드
    return `${prefix}${name}_${emotion}.${fileExtension}`;
}

// 2. 감정 영역 생성 함수
function createEmotionZone(emotion) {
    const zone = document.createElement('div');
    zone.className = 'file-upload-zone';
    zone.setAttribute('data-emotion', emotion);

    const emotionName = document.createElement('div');
    emotionName.className = 'emotion-name';
    emotionName.textContent = emotion;

    const preview = document.createElement('img');
    preview.className = 'preview-img';
    preview.setAttribute('alt', emotion + ' preview');
    
    const labelText = document.createElement('span');
    labelText.textContent = "empty";
    labelText.style.fontSize = "12px";
    labelText.style.color = "#777";
    labelText.id = `label-${emotion}`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'file-input';
    fileInput.id = `file-${emotion}`;

    zone.appendChild(labelText);
    zone.appendChild(preview);
    zone.appendChild(emotionName);
    zone.appendChild(fileInput);

    // 클릭 시 파일 선택
    zone.addEventListener('click', () => fileInput.click());
    
    // 파일 입력 변경 이벤트
    fileInput.addEventListener('change', (e) => handleImageUpload(e.target.files, emotion, preview, labelText));

    // 드래그 앤 드롭 이벤트 처리 (1.1, 1.4 참고)
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleImageUpload(e.dataTransfer.files, emotion, preview, labelText);
        }
    });

    return zone;
}

// 3. 이미지 업로드/드롭 처리 함수
function handleImageUpload(files, emotion, previewElement, labelElement) {
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            labelElement.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // 다운로드를 위해 File 객체 저장
        fileDataMap.set(emotion, file);
        console.log(`파일 저장됨: ${emotion} -> ${file.name}`);
    }
}


// --- 렌더링 및 이벤트 바인딩 ---

// 감정 영역 전체 렌더링
function renderEmotionZones() {
    emotionContainer.innerHTML = ''; // 기존 목록 초기화
    currentEmotions.forEach(emotion => {
        emotionContainer.appendChild(createEmotionZone(emotion));
    });
}

// 감정 목록 파일 처리
emotionFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const lines = event.target.result.split('\n');
            currentEmotions = lines
                .map(line => line.trim())
                .filter(line => line.length > 0); // 빈 줄 제거
            
            if (currentEmotions.length === 0) {
                 alert("파일에 유효한 감정 목록이 없습니다. 기본 감정 목록을 사용합니다.");
                 currentEmotions = [...defaultEmotions];
            }

            renderEmotionZones();
            console.log("새 감정 목록 로드됨:", currentEmotions);
        };
        reader.readAsText(file);
    }
});

// 유저/캐릭터 스위치 텍스트 업데이트
userCharSwitch.addEventListener('change', () => {
    switchText.textContent = userCharSwitch.checked ? '캐릭터 (-)' : '유저 (user-)';
});

// 커스텀 감정 추가 버튼
document.getElementById('add-emotion-btn').addEventListener('click', () => {
    const newEmotion = prompt("새 감정 이름을 입력하세요:");
    if (newEmotion && newEmotion.trim()) {
        const cleanEmotion = newEmotion.trim().toLowerCase();
        if (!currentEmotions.includes(cleanEmotion)) {
            currentEmotions.push(cleanEmotion);
            emotionContainer.appendChild(createEmotionZone(cleanEmotion));
        } else {
            alert("이미 존재하는 감정 이름입니다.");
        }
    }
});

// 다운로드 기능 (파일명 생성 및 다운로드 준비)
document.getElementById('zip-download-btn').addEventListener('click', () => {
    if (typeof JSZip === 'undefined') {
        alert("ZIP 다운로드 기능은 JSZip 라이브러리가 필요합니다. HTML에 스크립트 태그를 추가해 주세요.");
        return;
    }
    
    if (fileDataMap.size === 0) {
        alert("업로드된 이미지가 없습니다.");
        return;
    }

    const zip = new JSZip();
    const fileExtension = extensionSelect.value;
    
    fileDataMap.forEach((file, emotion) => {
        const finalName = getFileName(emotion, fileExtension);
        zip.file(finalName, file);
    });

    // ZIP 파일을 생성하고 다운로드
    zip.generateAsync({type:"blob"}).then(function(content) {
        const name = nameInput.value.trim() || "character_emotes";
        // saveAs(content, `${name}.zip`); // FileSaver.js 같은 라이브러리 필요
        alert(`ZIP 파일 준비 완료. (이름: ${name}.zip). \n포함된 파일 개수: ${fileDataMap.size}\n실제 다운로드는 추가 라이브러리가 필요합니다.`);
    });
});

// 페이지 로드 시 초기 감정 영역 렌더링
renderEmotionZones();