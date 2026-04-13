// booth.js - 真實 AI 雙手偵測與流暢錄影流程 (IndexedDB 本地資料庫版)

const videoElement = document.getElementById('webcam-video');
const modalOverlay = document.getElementById('detection-modal');
const scannerBox = document.getElementById('scanner-box');
const progressRect = document.querySelector('.progress-ring-rect');
const statusText = document.getElementById('status-text');

const teachingUI = document.getElementById('teaching-ui');
const tutorialVideo = document.getElementById('tutorial-video');
const roleText = document.getElementById('role-display-text');
const traitText = document.getElementById('trait-text');   
const genderText = document.getElementById('gender-text'); 
const hintPill = document.getElementById('hint-pill');
const targetContainer = document.getElementById('target-trackers-container');
const recIndicator = document.getElementById('rec-indicator');

const PERIMETER = 526; 
let lastHandSeenTime = 0;
let wristXHistory = [[], []]; 
let isWaving = false;
let waveTimer = 0; 
let uiUpdateInterval = null;
let cameraReady = false;
let currentTargetZones = []; 

// ==========================================
// 🚀 IndexedDB 瀏覽器資料庫工具
// ==========================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("PhotoboothDB", 3);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => { console.error("DB Error", e); reject(e); };
    });
}

async function saveClipToDB(blob, keyName) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("videos", "readwrite");
        const store = tx.objectStore("videos");
        store.put(blob, keyName);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve(); 
    });
}

// ==========================================
// 1. 初始化相機 (分離式防卡死：先亮鏡頭，再載 AI)
// ==========================================
async function initAI() {
    try {
        if (window.location.protocol === 'file:') {
            throw new Error("不能直接雙擊 HTML 檔案開啟喔！請使用 VS Code 的 Live Server (Go Live) 來開啟網頁，否則瀏覽器會封鎖相機。");
        }

        console.log("1. 正在請求相機權限...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" } 
        });
        
        videoElement.srcObject = stream;
        
        await new Promise((resolve) => {
            videoElement.onloadeddata = () => { 
                videoElement.play(); 
                resolve(); 
            };
        });
        
        console.log("2. 相機啟動成功！畫面已顯示。");
        loadMediaPipeAI();

    } catch (error) {
        console.error("❌ 嚴重錯誤：", error);
        alert("相機啟動失敗：\n" + error.message + "\n\n💡 檢查清單：\n1. 網址開頭必須是 http://127.0.0.1 (Live Server)\n2. 網址列左邊的「鎖頭」必須允許相機權限");
    }
}

async function loadMediaPipeAI() {
    try {
        console.log("3. 開始在背景下載 AI 模型...");
        const hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});
        
        hands.setOptions({ 
            maxNumHands: 2, 
            modelComplexity: 1, 
            minDetectionConfidence: 0.6, 
            minTrackingConfidence: 0.6 
        });
        
        hands.onResults(onAIResults);
        
        await hands.initialize();
        console.log("4. AI 載入完畢！啟動手部偵測。");
        
        cameraReady = true;
        startGameLoop(); 
        
        async function sendFrameToAI() {
            if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) { 
                await hands.send({image: videoElement}); 
            }
            requestAnimationFrame(sendFrameToAI); 
        }
        sendFrameToAI(); 

    } catch(e) {
        console.error("AI 載入失敗：", e);
        alert("AI 模型下載失敗，請確認網路連線是否正常喔！");
    }
}

// ==========================================
// 2. AI 偵測與暖身迴圈
// ==========================================
function onAIResults(results) {
    const now = Date.now();
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastHandSeenTime = now;
        let maxMovement = 0;
        
        results.multiHandLandmarks.forEach((hand, idx) => {
            if(idx > 1) return; 
            const palmX = hand[9].x;
            wristXHistory[idx].push(palmX);
            if (wristXHistory[idx].length > 15) wristXHistory[idx].shift();
            const minX = Math.min(...wristXHistory[idx]);
            const maxX = Math.max(...wristXHistory[idx]);
            if ((maxX - minX) > maxMovement) maxMovement = maxX - minX;
        });
        
        isWaving = maxMovement > 0.03;
        window.currentHands = results.multiHandLandmarks.map(hand => ({
            x: (1 - hand[9].x) * 100, 
            y: hand[9].y * 100
        }));
    } else if (now - lastHandSeenTime > 300) {
        wristXHistory = [[], []];
        isWaving = false;
        window.currentHands = [];
    }
}

function startGameLoop() {
    uiUpdateInterval = setInterval(() => {
        const now = Date.now();
        const hasHand = (now - lastHandSeenTime < 300);

        if (!hasHand) {
            setUIState('state-no-hand'); statusText.textContent = "請舉起手"; waveTimer = 0; 
        } else if (!isWaving) {
            setUIState('state-hand-detected'); statusText.textContent = "晃動手掌"; waveTimer = 0; 
        } else {
            setUIState('state-waving'); statusText.textContent = "晃動手掌"; waveTimer += 50; 
            if (waveTimer >= 2000) { waveTimer = 2000; clearInterval(uiUpdateInterval); finishWarmup(); }
        }
        const progress = waveTimer / 2000;
        progressRect.style.strokeDashoffset = PERIMETER - (progress * PERIMETER);
    }, 50); 
}

function setUIState(stateClass) { scannerBox.className = `scanner-box ${stateClass}`; }

function finishWarmup() {
    statusText.textContent = "偵測成功！";
    setTimeout(() => {
        modalOverlay.style.opacity = '0';
        setTimeout(() => { modalOverlay.style.display = 'none'; startPhotobooth(); }, 500);
    }, 800);
}
// ==========================================
// 5. 正式錄影流程
// ==========================================
function startPhotobooth() {
    let finalTitle = "淘氣女"; 
    try {
        const data = JSON.parse(localStorage.getItem('photobooth_template'));
        if (data && data.role) finalTitle = data.role;
    } catch(e) {}
    
    teachingUI.style.display = 'block';
    const trait = finalTitle.substring(0, 2); 
    const gender = finalTitle.substring(2, 3); 
    traitText.textContent = trait.split('').join(' '); 
    genderText.textContent = gender;

    startTeachingStep1(finalTitle);
}

// ==========================================
// 💡 性別與個性詞位置設定 (座標已針對右側半身人像優化)
// ==========================================

// 1. 性別設定：一隻手在左胸前 (使用者視角之左，畫面中偏內側)
const GENDER_ZONES = {
    '男': [{x: 65, y: 55}], 
    '女': [{x: 65, y: 55}]  
};

// 2. 個性詞分類映射 (用於讀取性別教學影片)
const ROLE_TO_CATEGORY = {
    '淘氣':'外向活力','活潑':'外向活力','幽默':'外向活力','大方':'外向活力',
    '冷靜':'內向安靜','文靜':'內向安靜','沉穩':'內向安靜','害羞':'內向安靜',
    '溫柔':'關懷溫暖','善良':'關懷溫暖','耐心':'關懷溫暖','樂觀':'關懷溫暖',
    '勇敢':'果斷堅強','自信':'果斷堅強','果斷':'果斷堅強','獨立':'果斷堅強',
    '敏銳':'敏銳理性','細心':'敏銳理性','聰明':'敏銳理性','謹慎':'敏銳理性'
};

// 3. 完整個性詞動作座標表 (已將自信、果斷、謹慎的雙手動作改為長方形框)
const TRAIT_ZONES = {
    '淘氣': [{x: 62, y: 55}, {x: 82, y: 55}], 
    '活潑': [{x: 58, y: 25}, {x: 88, y: 25}], 
    '幽默': [{x: 58, y: 75}, {x: 88, y: 75}], 
    '大方': [{x: 70, y: 55, isWide: true}],
    '冷靜': [{x: 65, y: 55}], 
    '文靜': [{x: 70, y: 55, isWide: true}], 
    '沉穩': [{x: 65, y: 55}], 
    '害羞': [{x: 72, y: 35}, {x: 58, y: 40}], 
    '溫柔': [{x: 70, y: 45}, {x: 70, y: 65}], 
    '善良': [{x: 70, y: 55, isWide: true}], 
    '耐心': [{x: 80, y: 55}], 
    '樂觀': [{x: 70, y: 55, isWide: true}], 
    '勇敢': [{x: 70, y: 75, isWide: true}], 
    '細心': [{x: 70, y: 55, isWide: true}], 
    '聰明': [{x: 58, y: 30}], 
    '謹慎': [{x: 70, y: 55, isWide: true}], // 🎯 已改為長方形框
    
    '自信': { steps: [ 
        { msg: "步驟 1：請將一隻手放在右胸前", zones: [{x: 80, y: 55}] },
        { msg: "步驟 2：請將兩隻手放在胸前", zones: [{x: 70, y: 55, isWide: true}] } // 🎯 已改為長方形框
    ]},
    '果斷': { steps: [ 
        { msg: "步驟 1：請將兩隻手放在胸前", zones: [{x: 70, y: 55, isWide: true}] }, // 🎯 已改為長方形框
        { msg: "步驟 2：請將一隻手放在頭旁邊(左)", zones: [{x: 58, y: 30}] }
    ]},
    '獨立': { steps: [ 
        { msg: "步驟 1：請將一隻手放在右胸前", zones: [{x: 80, y: 55}] },
        { msg: "步驟 2：請將雙手(上下)放在胸前", zones: [{x: 70, y: 45}, {x: 70, y: 65}] }
    ]},
    '敏銳': { steps: [ 
        { msg: "步驟 1：請將一隻手放在頭旁邊(左)", zones: [{x: 58, y: 30}] },
        { msg: "步驟 2：請將一隻手放在右胸前", zones: [{x: 80, y: 55}] }
    ]}
};

// 🎯 這是剛剛不小心漏掉的「畫框框」函式！
function renderTargetBoxes(zones) {
    targetContainer.innerHTML = '';
    currentTargetZones = zones;
    
    zones.forEach((zone) => {
        const box = document.createElement('div');
        box.className = zone.isWide ? 'target-box wide-box' : 'target-box';
        box.style.left = `${zone.x}%`;
        box.style.top = `${zone.y}%`;
        
        if (zone.isWide) {
            // 加大後的 SVG 寬度 550
            box.innerHTML = `
                <svg class="box-svg" width="550" height="250">
                    <path class="target-corner" d="M 60,10 H 30 A 20,20 0 0 0 10,30 V 60 M 10,190 V 220 A 20,20 0 0 0 30,240 H 60 M 490,240 H 520 A 20,20 0 0 0 540,220 V 190 M 540,60 V 30 A 20,20 0 0 0 520,10 H 490" stroke-width="8" stroke-linecap="round" fill="none" />
                    <path class="target-progress wide-progress" d="M 275,10 h 245 a 20,20 0 0 1 20,20 v 190 a 20,20 0 0 1 -20,20 h -490 a 20,20 0 0 1 -20,-20 v -190 a 20,20 0 0 1 20,-20 Z" stroke-width="8" stroke-linecap="round" fill="none" />
                </svg>
                <div class="box-countdown-text"></div>
            `;
        } else {
            box.innerHTML = `
                <svg class="box-svg" width="220" height="220">
                    <path class="target-corner" d="M 60,10 H 30 A 20,20 0 0 0 10,30 V 60 M 10,160 V 190 A 20,20 0 0 0 30,210 H 60 M 160,210 H 190 A 20,20 0 0 0 210,190 V 160 M 210,60 V 30 A 20,20 0 0 0 190,10 H 160" stroke-width="8" stroke-linecap="round" fill="none" />
                    <path class="target-progress" d="M 110,10 h 80 a 20,20 0 0 1 20,20 v 160 a 20,20 0 0 1 -20,20 h -160 a 20,20 0 0 1 -20,-20 v -160 a 20,20 0 0 1 20,-20 Z" stroke-width="8" stroke-linecap="round" fill="none" />
                </svg>
                <div class="box-countdown-text"></div>
            `;
        }
        targetContainer.appendChild(box);
    });
}

// ==========================================
// 5. 正式錄影流程核心
// ==========================================
function startPhotobooth() {
    let finalTitle = "淘氣女"; 
    try {
        const data = JSON.parse(localStorage.getItem('photobooth_template'));
        if (data && data.role) finalTitle = data.role;
    } catch(e) {}
    
    teachingUI.style.display = 'block';
    const trait = finalTitle.substring(0, 2); 
    const gender = finalTitle.substring(2, 3); 
    traitText.textContent = trait.split('').join(' '); 
    genderText.textContent = gender;

    startTeachingStep1(finalTitle);
}

function startTeachingStep1(role) {
    const trait = role.substring(0, 2); 
    tutorialVideo.src = `booth/${trait}_01.webm`;
    traitText.className = 'active-text';
    genderText.className = '';
    
    const traitConfig = TRAIT_ZONES[trait];
    
    // 判斷是否為多步驟動作
    if (traitConfig && traitConfig.steps) {
        handleMultiStepTrigger(traitConfig.steps, () => {
            startRecordingSequence(() => startTeachingStep2(role), 1);
        });
    } else {
        const zones = traitConfig || [{x: 70, y: 55}];
        renderTargetBoxes(zones);
        waitForPositionTrigger("請將手放到框框中，並跟著動畫比出動作", () => {
            startRecordingSequence(() => startTeachingStep2(role), 1);
        });
    }
}

function startTeachingStep2(role) {
    const trait = role.substring(0, 2);
    const gender = role.substring(2, 3); 
    const category = ROLE_TO_CATEGORY[trait] || '外向活力';
    tutorialVideo.src = `booth/${category}_${gender}.webm`;
    
    traitText.className = '';
    genderText.className = 'active-text';
    
    const zones = GENDER_ZONES[gender] || [{x: 65, y: 55}];
    renderTargetBoxes(zones);
    
    waitForPositionTrigger("請將單手放到左胸前的框框中", () => {
        startRecordingSequence(() => {
            hintPill.textContent = "準備生成拍貼...";
            setTimeout(() => { window.location.href = `preview.html?role=${encodeURIComponent(role)}`; }, 500);
        }, 2);
    });
}

// 🎯 新增：處理多步驟偵測
function handleMultiStepTrigger(steps, onAllComplete) {
    let currentStepIndex = 0;
    
    const runNextStep = () => {
        const step = steps[currentStepIndex];
        renderTargetBoxes(step.zones);
        waitForPositionTrigger(step.msg, () => {
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                setTimeout(runNextStep, 500); // 稍微停頓後進入下一步
            } else {
                onAllComplete();
            }
        });
    };
    runNextStep();
}

function waitForPositionTrigger(customHintText, onSuccessCallback) {
    hintPill.textContent = customHintText;
    const boxes = document.querySelectorAll('.target-box');
    let verifyTimer = 0; 

    const checkPositionInterval = setInterval(() => {
        if (!window.currentHands || window.currentHands.length === 0) {
            resetVerification(); return;
        }
        
        let isAllZonesFilled = true;
        let matchedHands = new Set();

        currentTargetZones.forEach(zone => {
            if (zone.isWide) {
                const radiusX = 35; const radiusY = 22; 
                let hasHandInZone = window.currentHands.some(hand => 
                    Math.abs(hand.x - zone.x) < radiusX && Math.abs(hand.y - zone.y) < radiusY
                );
                if (!hasHandInZone) isAllZonesFilled = false;
            } else {
                const detectionRadius = 20; 
                const handIndex = window.currentHands.findIndex((hand, idx) => 
                    !matchedHands.has(idx) && 
                    Math.abs(hand.x - zone.x) < detectionRadius && 
                    Math.abs(hand.y - zone.y) < detectionRadius
                );
                if (handIndex !== -1) { matchedHands.add(handIndex); } else { isAllZonesFilled = false; }
            }
        });
        
        if (isAllZonesFilled) {
            verifyTimer += 50;
            boxes.forEach(box => box.classList.add('active-blue'));
            if (verifyTimer >= 1000) { clearInterval(checkPositionInterval); onSuccessCallback(); }
        } else {
            resetVerification();
        }
    }, 50);

    function resetVerification() {
        verifyTimer = 0;
        hintPill.textContent = customHintText;
        boxes.forEach(box => box.classList.remove('active-blue'));
    }
}
// === 真實錄影與儲存 ===
function startRecordingSequence(onComplete, stepNumber) {
    const boxes = document.querySelectorAll('.target-box');
    teachingUI.classList.add('recording-mode'); 
    
    boxes.forEach(box => {
        box.classList.add('verified'); 
        box.querySelector('.box-countdown-text').style.display = 'block'; 
        setTimeout(() => box.classList.add('counting-down'), 50);
    });

    let count = 3;
    boxes.forEach(box => box.querySelector('.box-countdown-text').textContent = count);
    
    const countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
            boxes.forEach(box => box.querySelector('.box-countdown-text').textContent = count);
        } else {
            clearInterval(countdownTimer);
            targetContainer.style.display = 'none'; 
            recIndicator.style.display = 'flex';    
            
            // 開啟瀏覽器原生錄影器
            let chunks = [];
            const stream = videoElement.srcObject;
            
            // 優先使用 vp9 編碼，若不支援則退回 webm
            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                
                recIndicator.style.display = 'none';
                teachingUI.classList.remove('recording-mode'); 
                hintPill.style.display = 'block';
                hintPill.textContent = "影片儲存中...";
                hintPill.className = "hint-pill";

                // 將影片存入 IndexedDB
                await saveClipToDB(blob, `clip_${stepNumber}`);
                
                targetContainer.innerHTML = ''; 
                targetContainer.style.display = 'block'; 
                onComplete(); 
            };

            mediaRecorder.start(); 

            // 錄影 5 秒後停止
            setTimeout(() => {
                mediaRecorder.stop(); 
            }, 5000);
        }
    }, 1000);
}

window.addEventListener('DOMContentLoaded', () => {
    initAI();
});

// ==========================================
// 🛠️ 開發者快捷指令 (Cheat Codes) - 快速測試與跳過偵測
// 使用方式 1：盲打輸入 g01~g20 (女) 或 b01~b20 (男) 切換結果
// 使用方式 2：盲打輸入 skip 直接跳過「晃動手掌」暖身階段
// ==========================================
const traitsList = [
    '淘氣', '活潑', '幽默', '大方', // 01~04
    '冷靜', '文靜', '沉穩', '害羞', // 05~08
    '溫柔', '善良', '耐心', '樂觀', // 09~12
    '勇敢', '自信', '果斷', '獨立', // 13~16
    '敏銳', '細心', '聰明', '謹慎'  // 17~20
];

let cheatBuffer = "";

document.addEventListener('keydown', (e) => {
    // 只記錄英文字母與數字
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
        cheatBuffer += e.key.toLowerCase();
        // 保持緩衝區不要太長
        if (cheatBuffer.length > 10) cheatBuffer = cheatBuffer.slice(-10);

        // 🎯 密技 1：輸入 "skip" 直接跳過暖身偵測
        if (cheatBuffer.includes('skip')) {
            cheatBuffer = ""; // 清空緩衝區
            console.log("🛠️ 測試模式觸發：跳過手掌暖身偵測！");
            
            // 強制結束暖身的 AI 迴圈，並直接呼叫完成函式
            if (typeof uiUpdateInterval !== 'undefined' && uiUpdateInterval) {
                clearInterval(uiUpdateInterval);
            }
            if (typeof finishWarmup === 'function') {
                finishWarmup();
            }
            return;
        }

        // 🎯 密技 2：偵測是否符合 g01~g20 或 b01~b20 切換結果
        const match = cheatBuffer.match(/([gb])(0[1-9]|1[0-9]|20)$/);
        if (match) {
            cheatBuffer = ""; // 清空緩衝區
            
            const gender = match[1] === 'g' ? '女' : '男';
            const index = parseInt(match[2], 10) - 1;
            const targetTrait = traitsList[index];
            const finalTitle = targetTrait + gender;
            
            console.log(`🛠️ 測試模式觸發：切換至【${finalTitle}】`);
            
            // 覆寫 LocalStorage，讓拍貼機能讀到新的結果
            localStorage.setItem('photobooth_template', JSON.stringify({ role: finalTitle }));
            
            // 彈出提示並重新載入頁面
            alert(`🛠️ 進入測試模式\n已切換至：【${finalTitle}】\n按下確定後將重新載入畫面！`);
            window.location.reload();
        }
    }
});