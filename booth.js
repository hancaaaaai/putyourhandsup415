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

// ==========================================
// 🚀 新增：用於合成「鏡頭+角色」的隱藏錄影畫布
// ==========================================
const recordCanvas = document.createElement('canvas');
recordCanvas.width = 1920;  // 預設解析度寬度
recordCanvas.height = 1080; // 預設解析度高度
const recordCtx = recordCanvas.getContext('2d');
let recordAnimFrame = null; // 用來控制動畫迴圈

const PERIMETER = 526; 
let lastHandSeenTime = 0;
let wristXHistory = [[], []]; 
let isWaving = false;
let waveTimer = 0; 
let uiUpdateInterval = null;
let cameraReady = false;
let currentTargetZones = []; 

// ==========================================
// 💡 全新加入：專屬手語動作教學文字字典
// ==========================================
const SIGN_DESCRIPTIONS = {
    '淘氣': '掌心相對、手指晃動，上下擺動',
    '幽默': '握拳敲擊腰部兩側',
    '活潑': '在頭兩側彈中指，晃動頭',
    '大方': '在心臟處開合手掌',
    '害羞': '一手遮住臉，一手比出食指滑動側臉',
    '冷靜': '在胸前比出沉下來',
    '文靜': '兩手交疊再分開',
    '沉穩': '平平地伸出手掌',
    '溫柔': '一手軟軟的在另一隻手手心打轉',
    '善良': '比出大拇指在胸前畫圓',
    '耐心': '比出一把刀砍在心上',
    '勇敢': '雙手比食指跟大拇指，在腰部從中間往外',
    '細心': '雙手彎曲三指，從中往外拉開',
    '謹慎': '雙手握拳交疊，從外拉回',
    '聰明': '捏著食指跟大拇指，在太陽穴打開',
    '樂觀': '雙手在胸前晃動，再做出心打開',
    '女': '再比出小拇指，晃動手，做出「女」的手語',
    '男': '再比出大拇指，晃動手，做出「男」的手語'
};

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
// 💡 性別與個性詞位置設定
// ==========================================

const GENDER_ZONES = {
    '男': [{x: 65, y: 55}], 
    '女': [{x: 65, y: 55}]  
};

const ROLE_TO_CATEGORY = {
    '淘氣':'外向活力','活潑':'外向活力','幽默':'外向活力','大方':'外向活力',
    '冷靜':'內向安靜','文靜':'內向安靜','沉穩':'內向安靜','害羞':'內向安靜',
    '溫柔':'關懷溫暖','善良':'關懷溫暖','耐心':'關懷溫暖','樂觀':'關懷溫暖',
    '勇敢':'果斷堅強','自信':'果斷堅強','果斷':'果斷堅強','獨立':'果斷堅強',
    '敏銳':'敏銳理性','細心':'敏銳理性','聰明':'敏銳理性','謹慎':'敏銳理性'
};

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
    '謹慎': [{x: 70, y: 55, isWide: true}], 
    
    // 🎯 多步驟動作設定
    '自信': { steps: [ 
        { msg: "步驟 1：食指先比出自己", zones: [{x: 80, y: 55}] },
        { msg: "步驟 2：雙手再比出食指和中指交疊", zones: [{x: 70, y: 55, isWide: true}] } 
    ]},
    '果斷': { steps: [ 
        { msg: "步驟 1：先雙手握住", zones: [{x: 70, y: 55, isWide: true}] }, 
        { msg: "步驟 2：再比出「快」的手語", zones: [{x: 58, y: 30}] }
    ]},
    '獨立': { steps: [ 
        { msg: "步驟 1：先比出自己", zones: [{x: 80, y: 55}] },
        { msg: "步驟 2：再做出一個人站在地板", zones: [{x: 70, y: 45}, {x: 70, y: 65}] }
    ]},
    '敏銳': { steps: [ 
        { msg: "步驟 1：捏著手指", zones: [{x: 58, y: 30}] },
        { msg: "步驟 2：大拇指彈出來", zones: [{x: 80, y: 55}] }
    ]}
};

// ==========================================
// 🎯 統一檢查雙手是否在指定框內的工具
// ==========================================
function checkHandsInZones() {
    if (!window.currentHands || window.currentHands.length === 0) return false;
    
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
    return isAllZonesFilled;
}

function renderTargetBoxes(zones) {
    targetContainer.innerHTML = '';
    currentTargetZones = zones;
    
    zones.forEach((zone) => {
        const box = document.createElement('div');
        box.className = zone.isWide ? 'target-box wide-box' : 'target-box';
        box.style.left = `${zone.x}%`;
        box.style.top = `${zone.y}%`;
        
        if (zone.isWide) {
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
    
    if (traitConfig && traitConfig.steps) {
        handleMultiStepTrigger(traitConfig.steps, () => {
            startRecordingSequence(() => startTeachingStep2(role), 1);
        });
    } else {
        const zones = traitConfig || [{x: 70, y: 55}];
        renderTargetBoxes(zones);
        const hintMsg = SIGN_DESCRIPTIONS[trait] || "請將手放到框框中，並跟著動畫比出動作";
        waitForPositionTrigger(hintMsg, () => {
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
    
    const hintMsg = SIGN_DESCRIPTIONS[gender] || "請將單手放到框框中";
    
    waitForPositionTrigger(hintMsg, () => {
        startRecordingSequence(() => {
            hintPill.textContent = "準備生成拍貼...";
            setTimeout(() => { window.location.href = `preview.html?role=${encodeURIComponent(role)}`; }, 500);
        }, 2);
    });
}

function handleMultiStepTrigger(steps, onAllComplete) {
    let currentStepIndex = 0;
    
    const runNextStep = () => {
        const step = steps[currentStepIndex];
        renderTargetBoxes(step.zones);
        waitForPositionTrigger(step.msg, () => {
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                setTimeout(runNextStep, 500); 
            } else {
                onAllComplete();
            }
        });
    };
    runNextStep();
}

// 🎯 新增：鎖定兩秒鐘防誤觸
function waitForPositionTrigger(customHintText, onSuccessCallback) {
    hintPill.textContent = customHintText;
    const boxes = document.querySelectorAll('.target-box');
    let verifyTimer = 0; 

    const checkPositionInterval = setInterval(() => {
        if (checkHandsInZones()) {
            verifyTimer += 50;
            boxes.forEach(box => box.classList.add('active-blue'));
            
            // 🎯 修改：將鎖定時間從 1 秒增加到 2 秒，增加互動儀式感
            if (verifyTimer >= 2000) { 
                clearInterval(checkPositionInterval); 
                onSuccessCallback(); 
            }
        } else {
            // 🎯 手離開位置：重置計時器與藍框狀態
            verifyTimer = 0;
            hintPill.textContent = customHintText;
            boxes.forEach(box => box.classList.remove('active-blue'));
        }
    }, 50);
}

// === 真實錄影與倒數重置儲存 ===
function startRecordingSequence(onComplete, stepNumber) {
    const boxes = document.querySelectorAll('.target-box');
    teachingUI.classList.add('recording-mode'); 
    
    boxes.forEach(box => {
        box.classList.add('verified'); 
        box.querySelector('.box-countdown-text').style.display = 'block'; 
    });

    let count = 3;
    boxes.forEach(box => box.querySelector('.box-countdown-text').textContent = count);
    
    const countdownTimer = setInterval(() => {
        // 🎯 核心邏輯：檢查手是否還在位置上
        if (!checkHandsInZones()) {
            count = 3; // 重置秒數為 3
            boxes.forEach(box => {
                box.querySelector('.box-countdown-text').textContent = count;
                box.classList.remove('counting-down'); // 暫停動畫
            });
            hintPill.style.display = 'block';
            hintPill.textContent = "手離開了！請回到位置重新倒數";
            return; // 暫停跳過此次計時
        }

        hintPill.style.display = 'none'; 
        boxes.forEach(box => box.classList.add('counting-down'));

        count--;
        if (count > 0) {
            boxes.forEach(box => box.querySelector('.box-countdown-text').textContent = count);
        } else {
            clearInterval(countdownTimer);
            targetContainer.style.display = 'none'; 
            recIndicator.style.display = 'flex';    
            
            // ==========================================
            // 🚀 核心修改：改用 Canvas 合成錄影
            // ==========================================
            let chunks = [];
            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
            
            // 取得隱藏 Canvas 的串流 (30fps)，取代原本的鏡頭串流
            const stream = recordCanvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // 🛑 錄影結束，停止繪製迴圈
                cancelAnimationFrame(recordAnimFrame);

                const blob = new Blob(chunks, { type: mimeType });
                
                recIndicator.style.display = 'none';
                teachingUI.classList.remove('recording-mode'); 
                hintPill.style.display = 'block';
                hintPill.textContent = "影片儲存中...";
                hintPill.className = "hint-pill";

                await saveClipToDB(blob, `clip_${stepNumber}`);
                
                targetContainer.innerHTML = ''; 
                targetContainer.style.display = 'block'; 
                onComplete(); 
            };

            // 🎨 開始在背景將「鏡頭」與「角色動畫」畫在一起
            function drawRecordFrame() {
                recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);

                // 1. 畫上 WebCam (並做鏡像翻轉，確保跟畫面看起來一樣)
                recordCtx.save();
                recordCtx.translate(recordCanvas.width, 0);
                recordCtx.scale(-1, 1);
                recordCtx.drawImage(videoElement, 0, 0, recordCanvas.width, recordCanvas.height);
                recordCtx.restore();

               // 2. 畫上角色動畫 (tutorialVideo)
                // 🚨 拿掉 !tutorialVideo.paused 等嚴格檢查，避免 Loop 瞬間消失
                try {
                    if (tutorialVideo && tutorialVideo.videoWidth > 0) {
                        const canvasH = recordCanvas.height; 
                        const canvasW = recordCanvas.width;  

                        // 算出角色的實際寬高 (維持比例)
                        const tutHeight = canvasH * 1.25; 
                        const tutRatio = tutorialVideo.videoWidth / tutorialVideo.videoHeight;
                        const tutWidth = tutHeight * tutRatio;

                        // 算出角色的放置位置
                        const tutX = canvasW * -0.08; 
                        const tutY = (canvasH * 0.56) - (tutHeight / 2); 

                        recordCtx.drawImage(tutorialVideo, tutX, tutY, tutWidth, tutHeight);
                    }
                } catch(e) {}
                // 呼叫下一幀繼續畫
                recordAnimFrame = requestAnimationFrame(drawRecordFrame);
            }

            drawRecordFrame(); // 啟動繪圖迴圈
            mediaRecorder.start(); // 正式開始錄影

            // 錄影 5 秒後停止
            setTimeout(() => {
                mediaRecorder.stop(); 
            }, 5000);
        }
    }, 1000);
}
// ==========================================
// 🛠️ 開發者快捷指令 (Cheat Codes)
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
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
        cheatBuffer += e.key.toLowerCase();
        if (cheatBuffer.length > 10) cheatBuffer = cheatBuffer.slice(-10);

        if (cheatBuffer.includes('skip')) {
            cheatBuffer = ""; 
            console.log("🛠️ 測試模式觸發：跳過手掌暖身偵測！");
            if (typeof uiUpdateInterval !== 'undefined' && uiUpdateInterval) clearInterval(uiUpdateInterval);
            if (typeof finishWarmup === 'function') finishWarmup();
            return;
        }

        const match = cheatBuffer.match(/([gb])(0[1-9]|1[0-9]|20)$/);
        if (match) {
            cheatBuffer = ""; 
            const gender = match[1] === 'g' ? '女' : '男';
            const index = parseInt(match[2], 10) - 1;
            const targetTrait = traitsList[index];
            const finalTitle = targetTrait + gender;
            
            console.log(`🛠️ 測試模式觸發：切換至【${finalTitle}】`);
            localStorage.setItem('photobooth_template', JSON.stringify({ role: finalTitle }));
            alert(`🛠️ 進入測試模式\n已切換至：【${finalTitle}】\n按下確定後將重新載入畫面！`);
            window.location.reload();
        }
    }
});

// ==========================================
// 🚀 啟動引擎：網頁載入完成後，執行初始化相機
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initAI();
});