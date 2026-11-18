// ==========================================
// 1. إعدادات الاتصال بمحرك Groq فائق السرعة
// ==========================================
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile"; // أحدث وأقوى نموذج مجاني في Groq

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// شخصية وذاكرة التطبيق
const systemPrompt = {
    role: "system",
    content: "أنت مساعد ذكاء اصطناعي متطور اسمك Vota. تتحدث باللغة العربية بطلاقة وذكاء، وتجيب بدقة واحترافية، وتستخدم التنسيق الجيد (نقاط وعناوين وأكواد) عند الحاجة."
};

let conversationHistory = [systemPrompt];

// تكبير مربع النص تلقائياً أثناء الكتابة
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

    // عرض رسالة المستخدم
    const userMsgDiv = createMessageElement(true);
    userMsgDiv.textContent = text;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    conversationHistory.push({ role: "user", content: text });

    // إنشاء فقاعة رد الذكاء الاصطناعي للكتابة التدريجية (Streaming)
    const aiMsgDiv = createMessageElement(false);
    aiMsgDiv.innerHTML = '<span style="color:#38bdf8;">Vota يفكر...</span>';
    let fullReply = "";

    try {
        const response = await fetch("https://groq.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: conversationHistory,
                stream: true // تفعيل البث المباشر للكلمات حرفاً بحرف
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "خطأ في الاتصال بالخادم");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                    try {
                        const json = JSON.parse(line.substring(6));
                        const token = json.choices?.delta?.content || "";
                        fullReply += token;
                        // تحويل النص المنسق (Markdown) إلى HTML حي
                        aiMsgDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullReply) : fullReply;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    } catch (e) {
                        // تجاهل الأجزاء غير المكتملة من البث
                    }
                }
            }
        }

        conversationHistory.push({ role: "assistant", content: fullReply });

    } catch (error) {
        aiMsgDiv.innerHTML = `<span style="color:#f87171;">⚠️ حدث خطأ: ${error.message}</span>`;
        conversationHistory.pop(); // إزالة الرسالة الأخيرة عند الفشل
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
// 2. الخلفية التفاعلية المتحركة (شبكة الذكاء الاصطناعي)
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
        mouse.x = e.touches.clientX;
        mouse.y = e.touches.clientY;
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
