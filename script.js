// ==========================================
// 1. 網頁跳轉邏輯
// ==========================================
const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', function() {
        window.location.href = 'intro.html';
    });
}

const nextBtn = document.getElementById('nextBtn');
if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // 🎯 點擊「我了解了」後，不再跳轉到 talk.html，而是直接顯示輸入框！
        const infoOverlay = document.getElementById('infoOverlay');
        if (infoOverlay) {
            infoOverlay.style.display = 'flex';
        }
    });
}

// ==========================================
// 2. 多段式打字機效果 (talk.html)
// ==========================================
const textElement = document.getElementById('typewriterText');
const dialogues = [
    "：你好！你手上的氛圍有點特別耶！",
    "：這裡的人，名字可不是用講的，而是用「手」取的",
    "：他們觀察你的習慣或氣場，幫你取一個屬於你的「手語名字」"
];
const typingSpeed = 100; 
let currentDialogIndex = 0; 
let charIndex = 0; 
let isTyping = false; 

function typeWriter() {
    if (textElement && currentDialogIndex < dialogues.length) {
        const currentText = dialogues[currentDialogIndex];
        if (charIndex < currentText.length) {
            isTyping = true; 
            textElement.textContent += currentText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            isTyping = false; 
        }
    }
}

// ==========================================
// 3. 點擊對話框切換邏輯 & 顯示基本資料卡
// ==========================================
const dialogBox = document.querySelector('.dialog-box');
const infoOverlay = document.getElementById('infoOverlay');

if (dialogBox && !document.getElementById('interludeDialogBox')) {
    dialogBox.addEventListener('click', function() {
        if (infoOverlay && infoOverlay.style.display === 'flex') return;
        if (isTyping) return;

        currentDialogIndex++;
        if (currentDialogIndex < dialogues.length) {
            textElement.textContent = "";
            charIndex = 0;
            typeWriter();
        } else {
            if (infoOverlay) infoOverlay.style.display = 'flex';
        }
    });
}

// ==========================================
// 4. 基本資料邏輯與本地資料庫
// ==========================================
const genderBtns = document.querySelectorAll('.gender-btn');
let selectedGender = '';

genderBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        genderBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedGender = this.getAttribute('data-gender');
    });
});

const gogoBtn = document.getElementById('gogoBtn');
if (gogoBtn) {
    gogoBtn.addEventListener('click', function() {
        const userName = document.getElementById('userNameInput').value.trim();
        if (userName === '') { alert('請輸入你的名字喔！'); return; }
        if (selectedGender === '') { alert('請選擇你的生理性別喔！'); return; }

        localStorage.setItem('user_name', userName);
        localStorage.setItem('user_gender', selectedGender);
        window.location.href = 'question.html';
    });
}

window.addEventListener('load', function() {
    if (textElement && !document.getElementById('interludeDialogBox')) {
        typeWriter();
    }
});

// ==========================================
// 5. 心理測驗資料庫 (DB)
// ==========================================
const DB = {
    stage1: [
      { bg: 'JPG/第一輪_Q1.jpg', lead: '你走進熱鬧的廣場，看到一家五花八門的手套店...', q: '「如果我的手有意識，他會穿什麼樣的衣服呢？」', opts: [ {t:'小背包和登山帽，隨時去探險', k:'extravert'}, {t:'軟綿綿的毛衣，像雲朵一樣包覆手指', k:'introvert'}, {t:'俐落的皮衣外套，帥氣登場', k:'decisive'} ] },
      { bg: 'JPG/第一輪_Q2.jpg', lead: '繼續往前走，一個人向前問你。', q: '「你的耳機裡聽著什麼音樂？」', opts: [ {t:'風格獨特的獨立音樂', k:'analytic'}, {t:'2000年代經典不敗老歌', k:'caring'}, {t:'時下最流行的K-POP', k:'extravert'} ] },
      { bg: 'JPG/第一輪_Q3.jpg', lead: '接著，你看到前方一個人慌亂的比著手語。', q: '「他似乎想表達什麼，但沒有人懂他，這時你會？」', opts: [ {t:'自己好像幫不上忙，默默走掉', k:'introvert'}, {t:'在「動字動字」學到的手語能派上用場了！', k:'decisive'}, {t:'拿出手機輸入文字，幫他翻譯訊息', k:'analytic'} ] },
      { bg: 'JPG/第一輪_Q5.jpg', lead: '你感覺有點餓了，來到一家餐廳...', q: '「想點的剛好賣完了，這時候你心想？」', opts: [ {t:'好可惜！那換一個吃吃看吧', k:'caring'}, {t:'真掃興～想去別家店買了', k:'extravert'}, {t:'後面好多人...好尷尬...隨便點一個', k:'introvert'} ] },
      { bg: 'JPG/第一輪_Q4.jpg', lead: '當你吃飽準備離開時，出口突然變成三道奇怪的門了！', q: '「憑感覺選出你想推開的那一道門吧。」', opts: [ {t:'直覺告訴我，冒險的路在A門！', k:'decisive'}, {t:'仔細觀察符號， B門最吸引我', k:'analytic'}, {t:'Ｃ門看起來最安全，應該不會錯', k:'caring'} ] }
    ],
  interludes: {
      extravert: { bg: 'JPG/外向活力_Q0.jpg', btn: '開始派對' },
      introvert: { bg: 'JPG/內向安靜_Q0.jpg', btn: '前往花園' },
      caring:    { bg: 'JPG/關懷溫暖_Q0.jpg', btn: '前往檔案室' },
      decisive:  { bg: 'JPG/果斷堅強_Q0.jpg', btn: '前往冒險遊戲' },
      analytic:  { bg: 'JPG/敏銳理性_Q0.jpg', btn: '前往工作室' }
    },
    stage2: {
      extravert: [
        {bg:'JPG/外向活力_Q1.jpg', q:'突然，一顆迪斯可球從天而降...\n「所有人都慌成一團，你第一反應是？」', opts:[{t:'把迪斯可球踢回天空，別影響我的派對！',k:'playful'}, {t:'開玩笑地說「這是我的見面禮嗎」',k:'humorous'}, {t:'檢查現場有沒有人受傷',k:'lively'}]},
        {bg:'JPG/外向活力_Q2.jpg', q:'派對恢復秩序，一位調酒師看向你，\n「要來一杯嗎？」', opts:[{t:'今天所有人由我來請客！',k:'generous'}, {t:'來一杯最酷的限定特調！',k:'playful'}, {t:'給我十杯，今晚不醉不歸！',k:'humorous'}]},
        {bg:'JPG/外向活力_Q3.jpg', q:'派對來到高潮，每個人要來到台前 solo 。\n「你想做出什麼表演？」', opts:[{t:'模仿短影片舞蹈',k:'lively'}, {t:'選一首名曲邀請大家跟著唱',k:'generous'}, {t:'講一個廢到笑的冷笑話',k:'playful'}]},
        {bg:'JPG/外向活力_Q4.jpg', q:'派對到了尾聲，音樂和燈光逐漸柔和，\n「在不打擾氣氛的情況下，你想怎麼做？」', opts:[{t:'偷偷到點心區吃東西',k:'humorous'}, {t:'發一篇限時動態記錄',k:'lively'}, {t:'隨著音樂搖擺，放鬆心情',k:'generous'}]},
        {bg:'JPG/外向活力_Q5.jpg', q:'派對結束，精彩的一整天\n「今天哪個部分讓你印象最深刻？」', opts:[{t:'迪斯可球掉下的那刻',k:'playful'}, {t:'表演時間大家的演出',k:'humorous'}, {t:'認識了很多的新朋友',k:'lively'}]}
      ],
      introvert: [
        {bg:'JPG/內向安靜_Q1.jpg', q:'剛踏入花園，畫面美不勝收\n「你會怎麼形容當下的心情？」', opts:[{t:'舒服到想要直接躺下來',k:'calm'}, {t:'畫面像幅畫一樣，想帶回家收藏',k:'gentle'}, {t:'屬於我的秘境，不想讓別人發現',k:'steady'}]},
        {bg:'JPG/內向安靜_Q2.jpg', q:'此時，一個熱心的居民想帶你參加導覽，\n「需要為你講解嗎?」', opts:[{t:'「沒關係，我自己看就好，謝謝」',k:'shy'}, {t:'「你是這邊的工作人員嗎？」',k:'calm'}, {t:'「好啊，那就麻煩你了～」',k:'gentle'}]},
        {bg:'JPG/內向安靜_Q3.jpg', q:'走著走著，你發現一株從未見過的奇異植物，\n「你會怎麼做？」', opts:[{t:'可能有毒，還是不要靠近比較好',k:'steady'}, {t:'拍照上傳限時動態',k:'shy'}, {t:'仔細觀察他的外型',k:'calm'}]},
        {bg:'JPG/內向安靜_Q4.jpg', q:'你開始覺得走到有點累了，\n「你想?」', opts:[{t:'戴起耳機享受片刻安靜',k:'gentle'}, {t:'吃塊餅乾充電，繼續上路',k:'steady'}, {t:'再忍耐一下，回家就可以好好休息',k:'shy'}]},
        {bg:'JPG/內向安靜_Q5.jpg', q:'休息完後準備離開，你看向整個花園\n「你想用什麼方式紀錄這天？」', opts:[{t:'默默記在心裡，享受當下',k:'calm'}, {t:'發一篇社群貼文',k:'gentle'}, {t:'回去和朋友口頭分享',k:'steady'}]}
      ],
      caring: [
        {bg:'JPG/關懷溫暖_Q1.jpg', q:'剛踏入這個地方，四周的光點慢慢漂浮起來，\n「你會怎麼反應？」', opts:[{t:'伸手輕輕碰觸，想知道它們的觸感',k:'soft'}, {t:'被光點包圍太美了，心情都好了起來',k:'kind'}, {t:'想辦法收集散亂的光點，恢復秩序',k:'patient'}]},
        {bg:'JPG/關懷溫暖_Q2.jpg', q:'有個光點突然變得灰暗，看起來像是在低落，\n「你會怎麼做？」', opts:[{t:'問它發生什麼事了',k:'upbeat'}, {t:'給他一點時間自己冷靜下來',k:'soft'}, {t:'做鬼臉或一切方式想辦法讓他開心起來',k:'kind'}]},
        {bg:'JPG/關懷溫暖_Q3.jpg', q:'突然一位居民不小心把光點撞得滿天飛，\n「你會？」', opts:[{t:'安慰並請他收拾乾淨',k:'patient'}, {t:'邊笑邊說「這樣其實也很漂亮」',k:'upbeat'}, {t:'默默地幫忙撿回原位',k:'soft'}]},
        {bg:'JPG/關懷溫暖_Q4.jpg', q:'一顆特別亮的光點飄到你手中，\n「你覺得它要說什麼故事？」', opts:[{t:'感人的溫馨故事',k:'kind'}, {t:'尚未完成的夢想',k:'patient'}, {t:'克服困難的方法',k:'upbeat'}]},
        {bg:'JPG/關懷溫暖_Q5.jpg', q:'結束整理後，你看著整理完的罐子\n「你對哪顆光點印象最深刻？」', opts:[{t:'平平無奇，很安靜的那顆',k:'soft'}, {t:'一閃一閃，像在笑的那顆',k:'kind'}, {t:'顏色最溫暖，讓人覺得安心的那顆',k:'patient'}]}
      ],
      decisive: [
        {bg:'JPG/果斷堅強_Q1.jpg', q:'眼前出現三條道路：霧氣、刺眼、安靜。\n「你會怎麼走？」', opts:[{t:'選最危險的那條，我天生喜歡冒險',k:'brave'}, {t:'走覺得順眼的那條，不聽別人意見',k:'confident'}, {t:'分析哪條最有勝算，決定後就不回頭',k:'decisive'}]},
        {bg:'JPG/果斷堅強_Q2.jpg', q:'前方突然出現一個充滿謎題的門。\n「你會？」', opts:[{t:'另找道路，也許有其他出口',k:'independent'}, {t:'有點沒把握，先慢慢觀察',k:'brave'}, {t:'沒什麼難得倒我的，直接解',k:'confident'}]},
        {bg:'JPG/果斷堅強_Q3.jpg', q:'遇到一隻卡關的居民求助，請你幫忙按下開關，\n「你會？」', opts:[{t:'可能是陷阱，無視他',k:'decisive'}, {t:'引導他怎麼開，然後走回自己的路',k:'independent'}, {t:'別人有需要，二話不說直接幫忙',k:'brave'}]},
        {bg:'JPG/果斷堅強_Q4.jpg', q:'終點出現會說話的寶箱：「只有回答正確能打開我。」\n「你覺得它想聽什麼？」', opts:[{t:'「我就是鑰匙。」',k:'confident'}, {t:'「我會靠自己的力量打開你」',k:'decisive'}, {t:'「我不需要寶藏，我只需要勝利。」',k:'independent'}]},
        {bg:'JPG/果斷堅強_Q5.jpg', q:'挑戰結束，獲得一枚徽章，你會選擇？', opts:[{t:'最亮的那顆，無所畏懼',k:'brave'}, {t:'最大的那顆，胸有成竹',k:'confident'}, {t:'最硬的那顆，意志堅強',k:'decisive'}]}
      ],
      analytic: [
        {bg:'JPG/敏銳理性_Q1.jpg', q:'到了工作崗位，一切都很新鮮。\n「你會先觀察什麼？」', opts:[{t:'其他人的工作模式',k:'sharp'}, {t:'桌上散落的零件和工具',k:'careful'}, {t:'工作室的格局和動線',k:'smart'}]},
        {bg:'JPG/敏銳理性_Q2.jpg', q:'小組開始分配任務，\n「你會擔任什麼角色？」', opts:[{t:'安排事項，規劃時程',k:'cautious'}, {t:'提出創新的點子',k:'sharp'}, {t:'負責溝通，激勵團隊',k:'careful'}]},
        {bg:'JPG/敏銳理性_Q3.jpg', q:'一位夥伴拿出一個半完成的裝置希望你協助，\n「你會向對方詢問什麼？」', opts:[{t:'「你希望這個裝置最後能達成什麼效果？」',k:'smart'}, {t:'「確定每個零件都沒有缺漏？」',k:'cautious'}, {t:'「這個裝置的運作原理是什麼？」',k:'sharp'}]},
        {bg:'JPG/敏銳理性_Q4.jpg', q:'一個裝置突然自己啟動，零件開始亂轉，\n「你會？」', opts:[{t:'立刻按下緊急開關，避免更多混亂',k:'careful'}, {t:'找到問題源頭，修正錯誤',k:'smart'}, {t:'馬上找工作室內專業人士幫助',k:'cautious'}]},
        {bg:'JPG/敏銳理性_Q5.jpg', q:'任務完成，獎勵你一個工藝品，\n「你會選擇哪個？」', opts:[{t:'看穿任何人的想法',k:'sharp'}, {t:'解析錯誤的訊息或事件',k:'careful'}, {t:'預知未來的可能',k:'smart'}]}
      ]
    }
};

const KEY_MAP = {
    extravert:{playful:'淘氣',humorous:'幽默',lively:'活潑',generous:'大方'},
    introvert:{calm:'冷靜',gentle:'文靜',steady:'沉穩',shy:'害羞'},
    caring:{soft:'溫柔',kind:'善良',patient:'耐心',upbeat:'樂觀'},
    decisive:{brave:'勇敢',confident:'自信',decisive:'果斷',independent:'獨立'},
    analytic:{sharp:'敏銳',careful:'細心',smart:'聰明',cautious:'謹慎'}
};

let quizState = {
    name: '玩家', gender: 'male',
    scores: { extravert:0, introvert:0, decisive:0, analytic:0, caring:0 },
    currentStage: 1, qIndex: 0, mainType: 'extravert', traitScores: {} ,
    history: []
};

// ==========================================
// 6. 測驗核心邏輯 (question.html)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-quiz')) {
        quizState.name = localStorage.getItem('user_name') || '玩家';
        let storedGender = localStorage.getItem('user_gender');
        quizState.gender = storedGender === '女' ? 'female' : 'male';
        startStage1();
    }
});

function showView(viewId) {
    document.querySelectorAll('.stage').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo(0, 0);
}

function startStage1() {
    quizState.currentStage = 1; 
    quizState.qIndex = 0;
    quizState.scores = { extravert:0, introvert:0, decisive:0, analytic:0, caring:0 };
    quizState.history = [];
    renderQuestion();
    showView('view-quiz');
}

function renderQuestion() {
    let list = (quizState.currentStage === 1) ? DB.stage1 : (DB.stage2[quizState.mainType] || DB.stage2['extravert']);
    
    if (quizState.qIndex >= list.length) {
        (quizState.currentStage === 1) ? finishStage1() : finishStage2();
        return;
    }

    const item = list[quizState.qIndex];
    const bgVideo = document.getElementById('quiz-bg-video');
    const bgImg = document.getElementById('quiz-bg-img'); 

    // 🎯 自動判斷背景是「影片」還是「圖片」
    if (item.bg) {
        if (item.bg.endsWith('.webm') || item.bg.endsWith('.mp4')) {
            if(bgImg) bgImg.style.display = 'none';
            if(bgVideo) {
                bgVideo.style.display = 'block';
                bgVideo.src = item.bg;
                bgVideo.play().catch(e => console.log(e));
            }
        } else if (item.bg.endsWith('.jpg') || item.bg.endsWith('.png')) {
            if(bgVideo) {
                bgVideo.style.display = 'none';
                bgVideo.pause();
            }
            if(bgImg) {
                bgImg.style.display = 'block';
                bgImg.src = item.bg;
            }
        }
    } else {
        if(bgVideo) bgVideo.style.display = 'none';
        if(bgImg) bgImg.style.display = 'none';
    }

    document.getElementById('quiz-lead').textContent = item.lead || ''; 
    document.getElementById('quiz-q').textContent = item.q;
    
    const optsDiv = document.getElementById('quiz-options');
    optsDiv.innerHTML = ''; 

    item.opts.forEach(opt => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.onclick = () => handleVote(opt.k);

        const btnText = document.createElement('div');
        btnText.className = 'opt-pill-btn';
        btnText.textContent = opt.t;

        card.appendChild(btnText);
        optsDiv.appendChild(card);
    });

    const totalQuestions = 10;
    const currentGlobalQ = (quizState.currentStage - 1) * 5 + quizState.qIndex + 1;
    const percent = (currentGlobalQ / totalQuestions) * 100;
    document.getElementById('quiz-progress').style.width = percent + '%';
}
function handleVote(key) {
    if (quizState.currentStage === 1) {
        if (quizState.scores[key] !== undefined) quizState.scores[key]++;
    } else {
        quizState.traitScores[key] = (quizState.traitScores[key] || 0) + 1;
    }
    quizState.history.push(key);
    quizState.qIndex++;
    renderQuestion();
}

// ==========================================
// 7. 過場畫面 (Interlude) 邏輯 - 修正按鈕點擊與進入第二輪
// ==========================================
function finishStage1() {
    let best = 'extravert', max = -1;
    for (let k in quizState.scores) {
        if (quizState.scores[k] > max) { max = quizState.scores[k]; best = k; }
    }
    quizState.mainType = best;
    const info = DB.interludes[best] || DB.interludes['extravert'];

    // 1. 停止並清除第一階段影片
    const bgVideo = document.getElementById('quiz-bg-video');
    if (bgVideo) {
        bgVideo.pause();
        bgVideo.src = "";
    }

    // 2. 設定過場背景圖片與按鈕文字
    const bgImg = document.getElementById('interlude-bg-img');
    const btnText = document.getElementById('interlude-btn-text');
    const btnContainer = document.getElementById('interludeBtnContainer');

    if (bgImg) bgImg.src = info.bg;
    if (btnText) btnText.textContent = info.btn;

    // 3. 顯示過場 View
    showView('view-interlude');

    // 4. 先隱藏按鈕，1.5 秒後才顯示 (讓玩家先看圖)
    if (btnContainer) {
        btnContainer.style.display = 'none';
        setTimeout(() => {
            btnContainer.style.display = 'flex';
        }, 1500);
    }
}

// 🎯 這是剛剛不小心漏掉的啟動第二階段函數！
function startStage2() {
    quizState.currentStage = 2; // 切換到第二階段
    quizState.qIndex = 0;       // 從第二階段的第一題開始
    quizState.traitScores = {}; // 分數重置準備計算細項
    showView('view-quiz');      // 切換回測驗畫面
    renderQuestion();           // 渲染第二階段題目
}

// 確保按鈕點擊能觸發 Stage 2
document.addEventListener('DOMContentLoaded', () => {
    const interludeBtn = document.getElementById('interludeBtnContainer');
    if (interludeBtn) {
        interludeBtn.onclick = function() {
            startStage2();
        };
    }
});

// ==========================================
// 12. 第七區域：滑到時自動播放現況動畫與打字機
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const statusVideo = document.getElementById('status-video');
    const statusTitle = document.getElementById('status-title'); // 🎯 抓取文字區塊
    
    if (statusVideo) {
        const statusObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 進入畫面：播放影片、加上 is-active 啟動打字動畫
                    statusVideo.play().catch(e => console.log("影片播放失敗:", e));
                    if (statusTitle) statusTitle.classList.add('is-active');
                } else {
                    // 離開畫面：暫停影片、移除 is-active (這樣下次滑下來才會重新打字)
                    statusVideo.pause();
                    statusVideo.currentTime = 0;
                    if (statusTitle) statusTitle.classList.remove('is-active');
                }
            });
        }, { threshold: 0.5 });

        statusObserver.observe(statusVideo);
    }
});
// ==========================================
// 8. 最終結果與資料儲存 (圖片疊加版)
// ==========================================
function finishStage2() {
    document.getElementById('quiz-bg-video').src = '';

    const currentTraits = KEY_MAP[quizState.mainType]; 
    let bestTraitKey = null;
    let maxScore = -1;
    
    if(currentTraits) {
        bestTraitKey = Object.keys(currentTraits)[0];
        for (let key in currentTraits) {
            const score = quizState.traitScores[key] || 0;
            if (score > maxScore) { maxScore = score; bestTraitKey = key; }
        }
    }

    const traitName = currentTraits ? currentTraits[bestTraitKey] : '淘氣'; 
    const genderSuffix = quizState.gender === 'male' ? '男' : '女';
    const finalTitle = traitName + genderSuffix; 

    // 將底圖更換為相對應的 1920x1080 圖片
 // 將底圖更換為相對應的 1920x1080 圖片
    const resultImg = document.getElementById('res-bg-img');
    if(resultImg) {
        // 直接對應檔名，例如：大方女.jpg
        resultImg.src = `Quiz results page/${finalTitle}.jpg`;
    }
const resVideo = document.getElementById('res-dynamic-video');
    if(resVideo) {
        // 套用格式：例如 "Quiz results page/淘氣女.webm"
        resVideo.src = `Quiz results page/${finalTitle}.webm`;
        resVideo.load(); // 確保載入新影片
        resVideo.play().catch(e => console.log("影片自動播放失敗:", e));
    }
    // 顯示玩家名字
    document.getElementById('res-name').textContent = quizState.name;

    // 紀錄資料供拍貼機使用
    const listStage1 = DB.stage1;
    const listStage2 = DB.stage2[quizState.mainType] || DB.stage2['extravert'];
    const textChoices = quizState.history.map((key, index) => {
        let question;
        let stageLabel = "";
        if (index < listStage1.length) {
            question = listStage1[index];
            stageLabel = "(1)"; 
        } else {
            question = listStage2[index - listStage1.length];
            stageLabel = "(2)";
        }
        if(!question) return key; 
        const targetOpt = question.opts.find(opt => opt.k === key);
        return targetOpt ? `${stageLabel}${targetOpt.t}` : key;
    });

    const currentRecord = {
        name: quizState.name,
        gender: quizState.gender,
        result: finalTitle,
        choices: textChoices,  
        time: new Date().toLocaleString()
    };

    let allRecords = [];
    try {
        allRecords = JSON.parse(localStorage.getItem('quiz_all_data') || '[]');
    } catch(e) { allRecords = []; }

    allRecords.push(currentRecord);
    localStorage.setItem('quiz_all_data', JSON.stringify(allRecords));

    try {
        localStorage.setItem('photobooth_template', JSON.stringify({
            role: finalTitle, 
            image: '心理測驗模板.jpg'
        }));
    } catch (e) { console.log('LocalStorage Error:', e); }

    showView('view-result');
}
// ==========================================
// 9. 首頁：滾輪連動視差動畫 (包含區塊 1, 7, 8)
// ==========================================
window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;

  
    // --- 處理第七區域 (台灣手語現況卡片展開) ---
    const section7 = document.getElementById('current-status-section');
    if (section7) {
        const rect7 = section7.getBoundingClientRect();
        let scrollDistance7 = -rect7.top;
        let totalScrollable7 = rect7.height - windowHeight;
        let progress7 = scrollDistance7 / totalScrollable7;
        progress7 = Math.max(0, Math.min(1, progress7));
        section7.style.setProperty('--p2', progress7);
    }

    // --- 處理第八區域 (學習手語：滾動切換文字與影片) ---
    const section8 = document.getElementById('learn-sign-section');
    if (section8) {
        const rect8 = section8.getBoundingClientRect();
        let scrollDistance8 = -rect8.top;
        let totalScrollable8 = rect8.height - windowHeight; 
        let progress8 = scrollDistance8 / totalScrollable8;
        progress8 = Math.max(0, Math.min(1, progress8));

        let activeIndex = Math.floor(progress8 * 3.99); 

        const learnItems = document.querySelectorAll('.learn-item');
        const learnVideos = document.querySelectorAll('.learn-video');

        learnItems.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        learnVideos.forEach((video, index) => {
            if (index === activeIndex) {
                if (!video.classList.contains('active')) {
                    video.classList.add('active');
                    video.currentTime = 0; 
                    video.play().catch(e => console.log("影片播放失敗", e));
                }
            } else {
                video.classList.remove('active');
                video.pause();
            }
        });
    }


// 👇 新增：處理第十區域 (圖標總覽橫向滾動) 👇
    const section10 = document.getElementById('icon-overview-section');
    if (section10) {
        const rect10 = section10.getBoundingClientRect();
        let scrollDistance10 = -rect10.top;
        let totalScrollable10 = rect10.height - windowHeight;
        let progress10 = scrollDistance10 / totalScrollable10;
        progress10 = Math.max(0, Math.min(1, progress10));
        
        // 將進度傳給 CSS，啟動橫向移動
        section10.style.setProperty('--p3', progress10);
    }
    // --- 處理第十二區域 (圖標規範細節：滾動切換圖片) ---
    const section12 = document.getElementById('spec-details-section');
    const seqImg = document.getElementById('spec-sequence-img');
    
    if (section12 && seqImg) {
        const rect12 = section12.getBoundingClientRect();
        let scrollDistance12 = -rect12.top;
        let totalScrollable12 = rect12.height - windowHeight;
        
        // 計算這區塊的滾動進度 (0 到 1 之間)
        let progress12 = scrollDistance12 / totalScrollable12;
        progress12 = Math.max(0, Math.min(1, progress12));
        
        // 總共有 4 張圖，我們將進度切成 4 等分 (0, 1, 2, 3)
        let activeIndex = Math.floor(progress12 * 3.99); 
        
        // 轉換成檔名編號 (01, 02, 03, 04)
        let imgNum = String(activeIndex + 1).padStart(2, '0');
        
        // 確保檔名有變才替換，節省效能
        const newSrc = `PNG/圖標規範細節${imgNum}.png`;
        if (!seqImg.src.includes(newSrc)) {
            seqImg.src = newSrc;
        }
    }
}); // 🎯 確保所有的滾動程式碼都在這裡結束
// ==========================================
// 10. 第五區域：滑到時自動播放客群動畫
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const audienceVideo = document.getElementById('audience-video');
    
    if (audienceVideo) {
        // 建立一個感測器
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 當影片進入畫面 (露出一半以上)，開始播放
                    audienceVideo.play().catch(e => console.log("影片播放失敗:", e));
                } else {
                    // 當影片離開畫面，暫停並把時間歸零 (這樣下次滑回來才會重頭播)
                    audienceVideo.pause();
                    audienceVideo.currentTime = 0;
                }
            });
        }, { threshold: 0.5 }); // threshold: 0.5 代表進入畫面 50% 時觸發

        // 告訴感測器去盯著這個影片
        videoObserver.observe(audienceVideo);
    }
});
// ==========================================
// 11. 第六區域：放大鏡跟隨特效
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const whyLearnSection = document.getElementById('why-learn-section');
    const textClear = document.getElementById('textClear');
    const textBlurred = document.getElementById('textBlurred'); // 🎯 新增抓取模糊層
    const magGlass = document.getElementById('magnifyingGlass');

    // 🎯 確保四個元素都有抓到才執行
    if (whyLearnSection && textClear && magGlass && textBlurred) {
        
        const updateMagnifier = (e) => {
            const rect = whyLearnSection.getBoundingClientRect();
            
            let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            let x = clientX - rect.left;
            let y = clientY - rect.top;

            textClear.style.setProperty('--x', `${x}px`);
            textClear.style.setProperty('--y', `${y}px`);
            magGlass.style.setProperty('--x', `${x}px`);
            magGlass.style.setProperty('--y', `${y}px`);
            
            // 🎯 新增這兩行：讓模糊層的「挖空圓圈」也跟著滑鼠走
            textBlurred.style.setProperty('--x', `${x}px`);
            textBlurred.style.setProperty('--y', `${y}px`);
        };

        whyLearnSection.addEventListener('mousemove', updateMagnifier);
        
        whyLearnSection.addEventListener('touchmove', (e) => {
            updateMagnifier(e);
        }, { passive: true });
    }
});
// ==========================================
// 12. 第七區域：滑到時自動播放現況動畫
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const statusVideo = document.getElementById('status-video');
    
    if (statusVideo) {
        const statusObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 當影片進入畫面，開始播放
                    statusVideo.play().catch(e => console.log("影片播放失敗:", e));
                } else {
                    // 當影片離開畫面，暫停並把時間歸零
                    statusVideo.pause();
                    statusVideo.currentTime = 0;
                }
            });
        }, { threshold: 0.5 }); // 滑到一半的時候觸發播放

        statusObserver.observe(statusVideo);
    }
});

// ==========================================
// 13. 第九 -> 第十區：GSAP 攝影機橫向平移與解鎖向下
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const track = document.getElementById('horizontal-track');
        const trigger = document.getElementById('pan-trigger');
        const wrapper = document.getElementById('horizontal-track-wrapper');

        if (track && trigger && wrapper) {
            gsap.to(track, {
                x: "-100vw", // 🎯 退回最穩定、不會變形的 100vw
                ease: "none",
                scrollTrigger: {
                    trigger: trigger,
                    start: "top top",
                    end: "+=100%",    // 恢復原始的滾動長度
                    pin: wrapper,     
                    scrub: true,      // 恢復最跟手的滾動感覺
                    
                    // 🎯 保留這個最棒的吸附功能
                    snap: {
                        snapTo: [0, 1], // 只允許停在起點(0)或終點(1)
                        duration: 0.3,
                        ease: "power1.inOut"
                    }
                }
            });
        }
    }
});
// ==========================================
// 14. 第十區域：圖標點擊替換與滑鼠橫向滾動 (完美防閃爍版)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const iconItems = document.querySelectorAll('.icon-item');
    const mainWebm = document.getElementById('main-webm');
    const descImg = document.getElementById('desc-img'); 

    // 1. 點擊圖標切換影片與說明圖 (加上完美淡入淡出)
    iconItems.forEach(item => {
        item.addEventListener('click', () => {
            const iconName = item.querySelector('.icon-name').innerText.trim();
            
            // 🎯 步驟一：先將透明度設為 0 (觸發 CSS 的淡出動畫)
            if (mainWebm) mainWebm.style.opacity = 0;
            if (descImg) descImg.style.opacity = 0;

            // 🎯 步驟二：等待 200 毫秒(配合剛才設定的淡出時間)後，再換檔案
            setTimeout(() => {
                
                // 替換並淡入影片
                if (mainWebm) {
                    mainWebm.src = `Icon overview/${iconName}.webm`;
                    mainWebm.load(); 
                    mainWebm.play().catch(e => console.log("圖標影片播放失敗:", e));
                    mainWebm.style.opacity = 1; // 換好後淡入顯示
                }

                // 替換並淡入圖片
                if (descImg) {
                    descImg.src = `Icon overview/${iconName}_說明.png`;
                    descImg.alt = `${iconName} 說明`;
                    
                    // 💡 為了做到最極致的防閃爍：確保新圖片載入 100% 完成後，才讓它淡入亮起來
                    descImg.onload = () => {
                        descImg.style.opacity = 1;
                    };
                }

            }, 200); // 200 毫秒的視覺緩衝
        });
    });

   // 🎯 2. 讓滑鼠在下半部可以「點擊並拖曳」橫向滑動 + 遮罩提示邏輯
    const iconSelector = document.getElementById('icon-selector');
    const dragOverlay = document.getElementById('drag-overlay'); // 抓取新遮罩
    let hideOverlayTimeout; // 用來存 3 秒計時器

    if (iconSelector) {
        // --- 新增：當滑到圖標區域時，啟動 3 秒自動消失計時器 ---
        if (dragOverlay) {
            const overlayObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 看到區域後，倒數 3 秒就隱藏
                        hideOverlayTimeout = setTimeout(() => {
                            dragOverlay.style.opacity = '0';
                        }, 3000);
                        overlayObserver.unobserve(entry.target); // 只觸發一次
                    }
                });
            }, { threshold: 0.5 });
            overlayObserver.observe(iconSelector);
        }

        // --- 原本的滑鼠拖曳邏輯 ---
        let isDown = false;
        let startX;
        let scrollLeft;

        // 當滑鼠按下去時
        iconSelector.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - iconSelector.offsetLeft;
            scrollLeft = iconSelector.scrollLeft;

            // 🎯 新增：如果使用者提早滑鼠按下去拖曳，馬上隱藏遮罩並取消 3 秒計時
            if (dragOverlay) {
                clearTimeout(hideOverlayTimeout);
                dragOverlay.style.opacity = '0';
            }
        });

        // 當滑鼠離開該區塊範圍時
        iconSelector.addEventListener('mouseleave', () => { isDown = false; });
        // 當滑鼠放開時
        iconSelector.addEventListener('mouseup', () => { isDown = false; });

        // 當滑鼠移動時 (執行拖曳)
        iconSelector.addEventListener('mousemove', (e) => {
            if (!isDown) return; 
            e.preventDefault(); 
            const x = e.pageX - iconSelector.offsetLeft;
            const walk = (x - startX) * 1.5; 
            iconSelector.scrollLeft = scrollLeft - walk;
        });

        // 防止拖曳到裡面的圖片時，觸發瀏覽器預設的「拖曳圖片」行為
        const icons = iconSelector.querySelectorAll('img');
        icons.forEach(icon => {
            icon.addEventListener('dragstart', (e) => e.preventDefault());
        });
    }
});

// ==========================================
// 預載第十二區的序列圖片，防止滑動時閃爍
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const preloadImages = [];
    for (let i = 1; i <= 4; i++) {
        let img = new Image();
        img.src = `PNG/圖標規範細節0${i}.png`;
        preloadImages.push(img);
    }
});
// ==========================================
// 第十三區域：專屬單頁翻閱閱讀器 (日曆疊加版)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('slider-track');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const slides = document.querySelectorAll('.slide-page');

    if (track && prevBtn && nextBtn && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;

       // 🎯 1. 核心翻頁功能 (3D 版)
        const updateSlider = () => {
            slides.forEach((slide, index) => {
                slide.classList.remove('active', 'flipped', 'waiting');
                
                // 🎯 全新加入的圖層魔法：
                // 總頁數減去索引值，確保第 1 頁在最上層，第 7 頁在最下層
                slide.style.zIndex = totalSlides - index;

                if (index < currentIndex) {
                    // 已經翻過去的頁面
                    slide.classList.add('flipped');
                } else if (index === currentIndex) {
                    // 正在看的頁面
                    slide.classList.add('active');
                } else {
                    // 還沒看的頁面
                    slide.classList.add('waiting');
                }
            });

            // 更新左右箭頭的灰階狀態
            if (currentIndex === 0) prevBtn.classList.add('disabled');
            else prevBtn.classList.remove('disabled');

            if (currentIndex === totalSlides - 1) nextBtn.classList.add('disabled');
            else nextBtn.classList.remove('disabled');
        };

        // 🎯 2. 綁定左右按鈕
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) { currentIndex--; updateSlider(); }
        });
        nextBtn.addEventListener('click', () => {
            if (currentIndex < totalSlides - 1) { currentIndex++; updateSlider(); }
        });

        // 🎯 3. 綁定滑鼠拖曳 (Swipe) 手勢 (更輕量的判斷)
        let startX = 0;
        let isDragging = false;

        track.addEventListener('mousedown', (e) => {
            startX = e.pageX;
            isDragging = true;
        });

        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = e.pageX - startX;
            // 只要往左滑超過 50px，就翻下一頁
            if (diff < -50 && currentIndex < totalSlides - 1) {
                currentIndex++;
                updateSlider();
            } 
            // 只要往右滑超過 50px，就翻上一頁
            else if (diff > 50 && currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        };

        track.addEventListener('mouseup', endDrag);
        track.addEventListener('mouseleave', endDrag);

        // 防止拖曳時不小心反白圖片
        const imgs = track.querySelectorAll('img');
        imgs.forEach(img => img.addEventListener('dragstart', e => e.preventDefault()));

        // 初始化第一次顯示
        updateSlider();
    }
});
// ==========================================
// 17. 全域導覽列與 LOGO 顯示/隱藏控制
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const logo = document.querySelector('.floating-logo'); // 🎯 抓取 LOGO
    const overviewSection = document.getElementById('icon-overview-section');

    // 只要有 navbar 或 logo 其中一個存在，且圖標總覽區塊也存在，就啟動感測器
    if ((navbar || logo) && overviewSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 進入圖標總覽區塊時：同時隱藏 Navbar 跟 LOGO
                    if (navbar) navbar.classList.add('navbar-hidden');
                    if (logo) logo.classList.add('hidden');
                } else {
                    // 離開圖標總覽區塊時：重新顯示
                    if (navbar) navbar.classList.remove('navbar-hidden');
                    if (logo) logo.classList.remove('hidden');
                }
            });
        }, { 
            threshold: 0.2 
        });

        observer.observe(overviewSection);
    }
});
// ==========================================
// 18. 導覽列精準跳轉 (解決留白與橫向滾動衝突)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.navbar a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // 1. 點擊「首頁」：平滑回到最上面
            if (targetId === '#' || targetId === 'index.html#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // 2. 點擊「關於我們」：精準跳到區塊的絕對頂部
            else if (targetId === '#what-is-section') {
                e.preventDefault();
                const targetEl = document.getElementById('what-is-section');
                if (targetEl) {
                    // 取得絕對 Y 座標
                    const absoluteTop = targetEl.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ 
                        top: absoluteTop, 
                        behavior: 'smooth' 
                    });
                }
            }
            
            // 3. 點擊「圖標總覽」：精準跳到橫向動畫結束的瞬間
            else if (targetId === '#icon-overview-section') {
                e.preventDefault();
                const wrapper = document.getElementById('horizontal-track-wrapper');
                if (wrapper) {
                    // 💡 關鍵修正：尋找 GSAP 產生的 .pin-spacer 隱形外框
                    const spacer = wrapper.closest('.pin-spacer') || wrapper;
                    
                    // 取得它在整份網頁中最真實的絕對 Y 座標
                    const absoluteTop = spacer.getBoundingClientRect().top + window.scrollY;
                    
                    // 真正的起點 + 往下滾動 2 個螢幕高 = 圖標總覽出現的完美位置
                    const targetY = absoluteTop + (window.innerHeight * 3);
                    
                    window.scrollTo({ 
                        top: targetY, 
                        behavior: 'smooth' 
                    });
                }
            }
        });
    });
});

// ==========================================
// 19. 左下角「智慧返回按鈕」邏輯
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-to-top-btn');
    const overviewSection = document.getElementById('icon-overview-section');
    const wrapper = document.getElementById('horizontal-track-wrapper');
    
    // 🎯 替換：改為抓取下一個區塊 (圖標規範細節)
    const specDetailsSection = document.getElementById('spec-details-section');

    if (backBtn) {
        let targetLocation = 'home';

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            if (scrollY < windowHeight * 0.5) {
                backBtn.classList.add('hidden');
                return; 
            }

            // 🎯 替換判斷條件
            if (wrapper && overviewSection && specDetailsSection) {
                const spacer = wrapper.closest('.pin-spacer') || wrapper;
                const wrapperTop = spacer.getBoundingClientRect().top + scrollY;
                const overviewTargetY = wrapperTop + (windowHeight * 3);
                
                // 🎯 替換為新區塊的頂部位置
                const specTop = specDetailsSection.getBoundingClientRect().top + scrollY;

                if (scrollY > overviewTargetY - (windowHeight * 0.5) && scrollY < specTop - (windowHeight * 0.5)) {
                    backBtn.classList.add('hidden');
                }
                else if (scrollY >= specTop - (windowHeight * 0.5)) {
                    backBtn.classList.remove('hidden');
                    targetLocation = 'overview';
                }
                else {
                    backBtn.classList.remove('hidden');
                    targetLocation = 'home';
                }
            }
        });

        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (targetLocation === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (targetLocation === 'overview') {
                if (wrapper) {
                    const spacer = wrapper.closest('.pin-spacer') || wrapper;
                    const wrapperTop = spacer.getBoundingClientRect().top + window.scrollY;
                    const targetY = wrapperTop + (window.innerHeight * 3);
                    window.scrollTo({ top: targetY, behavior: 'smooth' });
                }
            }
        });
    }
});

// ==========================================
// 20. 測驗頁面：返回上一題邏輯 (包含分數倒退與跨階段退回)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const quizBackBtn = document.getElementById('quizBackBtn');
    
    if (quizBackBtn) {
        quizBackBtn.addEventListener('click', () => {
            if (quizState.currentStage === 1) {
                if (quizState.qIndex === 0) {
                    // 狀態 A：如果是第一題，直接退回介紹頁
                    window.location.href = 'intro.html';
                } else {
                    // 狀態 B：第一階段退一題
                    const lastKey = quizState.history.pop(); // 抽回上一次的選擇
                    if (lastKey && quizState.scores[lastKey] > 0) {
                        quizState.scores[lastKey]--; // 把加過的分數扣回來
                    }
                    quizState.qIndex--; // 題號倒退
                    renderQuestion(); // 重新繪製上一題畫面
                }
            } else if (quizState.currentStage === 2) {
                if (quizState.qIndex === 0) {
                    // 狀態 C：第二階段第一題，退回第一階段的最後一題 (第5題)
                    quizState.currentStage = 1;
                    quizState.qIndex = 4; // 陣列索引 4 就是第 5 題
                    
                    const lastKey = quizState.history.pop();
                    if (lastKey && quizState.scores[lastKey] > 0) {
                        quizState.scores[lastKey]--; 
                    }
                    
                    showView('view-quiz'); // 確保切換回答題畫面 (避免卡在過場)
                    renderQuestion();
                } else {
                    // 狀態 D：第二階段退一題
                    const lastKey = quizState.history.pop();
                    if (lastKey && quizState.traitScores[lastKey] > 0) {
                        quizState.traitScores[lastKey]--;
                    }
                    quizState.qIndex--;
                    renderQuestion();
                }
            }
        });
    }
});

// ==========================================
// 21. 導覽列滾動連動亮起 (Scroll Spy)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.navbar .nav-item');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        let activeIndex = 0; // 預設 0 是「首頁」

        // 1. 判斷是否抵達「關於我們」
        const whatIsSection = document.getElementById('what-is-section');
        if (whatIsSection) {
            const whatIsTop = whatIsSection.getBoundingClientRect().top + scrollY;
            // 當畫面滑到該區塊的上方 30% 處，就讓它亮起
            if (scrollY >= whatIsTop - (windowHeight * 0.3)) {
                activeIndex = 1; 
            }
        }

        // 2. 判斷是否抵達「圖標總覽」(因為有 GSAP 動畫，抓取點較特殊)
        const wrapper = document.getElementById('horizontal-track-wrapper');
        if (wrapper) {
            const spacer = wrapper.closest('.pin-spacer') || wrapper;
            const wrapperTop = spacer.getBoundingClientRect().top + scrollY;
            // 根據之前的精準跳轉公式，圖標總覽的完美定位點是 wrapperTop + 2個螢幕高
            // 只要滑過 1.5 個螢幕高，我們就提早讓它亮起藍色
            if (scrollY >= wrapperTop + (windowHeight * 2.5)) {
                activeIndex = 2;
            }
        }

        // 3. 更新導覽列樣式
        navItems.forEach((item, index) => {
            // 第 3 個索引是「手語名字」(外連網頁)，我們不讓它在首頁滑動時亮起
            if (index === 3) return; 

            if (index === activeIndex) {
                item.classList.add('active'); // 亮起亮藍色
            } else {
                item.classList.remove('active'); // 變回深灰色
            }
        });
    });
});
// ==========================================
// 🎯 第五區域：客群文字自動淡入與離開隱藏觸發器
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const audienceSection = document.getElementById('target-audience-section');
    const audienceVideo = document.getElementById('audience-video');
    
    if (audienceSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 🚀 進入區塊：加上標籤，觸發 CSS 淡入
                    audienceSection.classList.add('is-active');
                    
                    // 同步播放影片
                    if (audienceVideo) audienceVideo.play().catch(e => console.log(e));
                } else {
                    // 🍂 離開區塊：移除標籤，觸發 CSS 淡出 (隱藏)
                    audienceSection.classList.remove('is-active');
                    
                    // 離開時暫停影片並重置，節省電腦效能
                    if (audienceVideo) {
                        audienceVideo.pause();
                        audienceVideo.currentTime = 0;
                    }
                }
            });
        }, { threshold: 0.3 }); // 螢幕看到 30% 時觸發

        observer.observe(audienceSection);
    }
});

// ==========================================
// 🎯 22. 第九區右下角：「瀏覽所有圖標」按鈕跳轉
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const goToOverviewBtn = document.getElementById('go-to-overview-btn');
    
    if (goToOverviewBtn) {
        goToOverviewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = document.getElementById('horizontal-track-wrapper');
            
            if (wrapper) {
                // 抓取 GSAP 的隱形外框
                const spacer = wrapper.closest('.pin-spacer') || wrapper;
                const absoluteTop = spacer.getBoundingClientRect().top + window.scrollY;
                
                // 🎯 套用我們之前算好的完美距離：3 個螢幕高
                const targetY = absoluteTop + (window.innerHeight * 3); 
                
                // 平滑滾動過去 (會觸發 GSAP 的橫向動畫)
                window.scrollTo({ 
                    top: targetY, 
                    behavior: 'smooth' 
                });
            }
        });
    }
});