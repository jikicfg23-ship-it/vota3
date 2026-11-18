// ==========================================
// 1. نظام الحماية الذكي (حفظ المفتاح في المتصفح فقط)
// ==========================================
const MODEL_NAME = "llama-3.3-70b-versatile";
const API_ENDPOINT = "https://groq.com";

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// دالة جلب المفتاح بأمان من ذاكرة المتصفح
function getApiKey() {
    let key = localStorage.getItem("vota_groq_key");
    if (!key || !key.startsWith("gsk_")) {
        key = prompt("أهلاً بك في Vota! أدخل مفتاح Groq API الخاص بك (سيُحفظ في متصفحك بأمان):");
        if (key && key.trim().startsWith("gsk_")) {
            localStorage.setItem("vota_groq_key", key.trim());
        } else {
            alert("المفتاح غير صحيح! يجب أن يبدأ بـ gsk_");
            return null;
        }
    }
    return key.trim();
}

// دالة لتغيير المفتاح في أي وقت
function resetApiKey() {
    localStorage.removeItem("vota_groq_key");
    alert("تم مسح المفتاح القديم. سيتم طلب المفتاح الجديد عند إرسال رسالتك القادمة.");
}

const systemPrompt = {
    role: "system",
    content: "أنت مساعد ذكاء اصطناعي متطور اسمك Vota. تتحدث باللغة العربية بطلاقة وذكاء، وتجيب بدقة واحترافية، وتستخدم التنسيق الجيد (نقاط وعناوين وأكواد) عند الحاجة."
};

let conversationHistory = [systemPrompt];

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

function createMessageElement(isUser) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', isUser ? 'user-wrapper' : 'ai-wrapper');

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isUser ? 'user-msg' : 'ai-msg');
    wrapper.appendChild(msgDiv);

    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.innerHTML = '📋 نسخ الرد';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(msgDiv.innerText);
            copyBtn.innerHTML = '✅ تم النسخ!';
            setTimeout(() => copyBtn.innerHTML = '📋 نسخ الرد', 2000);
        };
        wrapper.appendChild(copyBtn);
    }

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // التأكد من وجود المفتاح قبل الإرسال
    const apiKey = getApiKey();
    if (!apiKey) return;

    const userMsgDiv = createMessageElement(true);
    userMsgDiv.textContent = text;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    conversationHistory.push({ role: "user", content: text });

    const aiMsgDiv = createMessageElement(false);
    aiMsgDiv.innerHTML = '<span style="color:#38bdf8;">⏳ Vota يفكر الآن...</span>';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: conversationHistory,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // إذا كان المفتاح منتهياً أو غير صالح، نمسحه ليطلب الجديد تلقائياً
            if (response.status === 401) {
                localStorage.removeItem("vota_groq_key");
            }
            throw new Error(data.error?.message || `خطأ رقم ${response.status}`);
        }

        const aiReply = data.choices[0].message.content;
        aiMsgDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(aiReply) : aiReply;
        conversationHistory.push({ role: "assistant", content: aiReply });
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        aiMsgDiv.innerHTML = `<span style="color:#f87171;">⚠️ السبب: ${error.message}</span>`;
        conversationHistory.pop();
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function clearChat() {
    conversationHistory = [systemPrompt];
    chatBox.innerHTML = `
        <div class="message-wrapper ai-wrapper">
            <div class="message ai-msg">تم بدء محادثة جديدة. كيف يمكنني مساعدتك الآن؟</div>
        </div>
    `;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ==========================================
// 2. الخلفية التفاعلية المتحركة
// ==========================================
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
let mouse = { x: null, y: null, radius: 130 };

window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
});

class Particle {
    constructor(x, y, directionX, directionY, size) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
            if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
            if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    let count = (canvas.height * canvas.width) / 10000;
    for (let i = 0; i < count; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * (innerWidth - size * 4) + size * 2;
        let y = Math.random() * (innerHeight - size * 4) + size * 2;
        let directionX = (Math.random() * 0.8) - 0.4;
        let directionY = (Math.random() * 0.8) - 0.4;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
    }
}

function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dist = Math.pow(particlesArray[a].x - particlesArray[b].x, 2) + Math.pow(particlesArray[a].y - particlesArray[b].y, 2);
            if (dist < (canvas.width / 8) * (canvas.height / 8)) {
                let opacity = 1 - (dist / 18000);
                ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.25})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connectParticles();
}

initParticles();
animate();
// ==========================================
// 1. نظام الحماية الذكي (حفظ المفتاح في المتصفح فقط)
// ==========================================
const MODEL_NAME = "llama-3.3-70b-versatile";
const API_ENDPOINT = "https://groq.com";

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// دالة جلب المفتاح بأمان من ذاكرة المتصفح
function getApiKey() {
    let key = localStorage.getItem("vota_groq_key");
    if (!key || !key.startsWith("gsk_")) {
        key = prompt("أهلاً بك في Vota! أدخل مفتاح Groq API الخاص بك (سيُحفظ في متصفحك بأمان):");
        if (key && key.trim().startsWith("gsk_")) {
            localStorage.setItem("vota_groq_key", key.trim());
        } else {
            alert("المفتاح غير صحيح! يجب أن يبدأ بـ gsk_");
            return null;
        }
    }
    return key.trim();
}

// دالة لتغيير المفتاح في أي وقت
function resetApiKey() {
    localStorage.removeItem("vota_groq_key");
    alert("تم مسح المفتاح القديم. سيتم طلب المفتاح الجديد عند إرسال رسالتك القادمة.");
}

const systemPrompt = {
    role: "system",
    content: "أنت مساعد ذكاء اصطناعي متطور اسمك Vota. تتحدث باللغة العربية بطلاقة وذكاء، وتجيب بدقة واحترافية، وتستخدم التنسيق الجيد (نقاط وعناوين وأكواد) عند الحاجة."
};

let conversationHistory = [systemPrompt];

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

function createMessageElement(isUser) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', isUser ? 'user-wrapper' : 'ai-wrapper');

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isUser ? 'user-msg' : 'ai-msg');
    wrapper.appendChild(msgDiv);

    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.innerHTML = '📋 نسخ الرد';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(msgDiv.innerText);
            copyBtn.innerHTML = '✅ تم النسخ!';
            setTimeout(() => copyBtn.innerHTML = '📋 نسخ الرد', 2000);
        };
        wrapper.appendChild(copyBtn);
    }

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // التأكد من وجود المفتاح قبل الإرسال
    const apiKey = getApiKey();
    if (!apiKey) return;

    const userMsgDiv = createMessageElement(true);
    userMsgDiv.textContent = text;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    conversationHistory.push({ role: "user", content: text });

    const aiMsgDiv = createMessageElement(false);
    aiMsgDiv.innerHTML = '<span style="color:#38bdf8;">⏳ Vota يفكر الآن...</span>';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: conversationHistory,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // إذا كان المفتاح منتهياً أو غير صالح، نمسحه ليطلب الجديد تلقائياً
            if (response.status === 401) {
                localStorage.removeItem("vota_groq_key");
            }
            throw new Error(data.error?.message || `خطأ رقم ${response.status}`);
        }

        const aiReply = data.choices[0].message.content;
        aiMsgDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(aiReply) : aiReply;
        conversationHistory.push({ role: "assistant", content: aiReply });
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        aiMsgDiv.innerHTML = `<span style="color:#f87171;">⚠️ السبب: ${error.message}</span>`;
        conversationHistory.pop();
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function clearChat() {
    conversationHistory = [systemPrompt];
    chatBox.innerHTML = `
        <div class="message-wrapper ai-wrapper">
            <div class="message ai-msg">تم بدء محادثة جديدة. كيف يمكنني مساعدتك الآن؟</div>
        </div>
    `;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ==========================================
// 2. الخلفية التفاعلية المتحركة
// ==========================================
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
let mouse = { x: null, y: null, radius: 130 };

window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
});

class Particle {
    constructor(x, y, directionX, directionY, size) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
            if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
            if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    let count = (canvas.height * canvas.width) / 10000;
    for (let i = 0; i < count; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * (innerWidth - size * 4) + size * 2;
        let y = Math.random() * (innerHeight - size * 4) + size * 2;
        let directionX = (Math.random() * 0.8) - 0.4;
        let directionY = (Math.random() * 0.8) - 0.4;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
    }
}

function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dist = Math.pow(particlesArray[a].x - particlesArray[b].x, 2) + Math.pow(particlesArray[a].y - particlesArray[b].y, 2);
            if (dist < (canvas.width / 8) * (canvas.height / 8)) {
                let opacity = 1 - (dist / 18000);
                ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.25})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connectParticles();
}

initParticles();
animate();
