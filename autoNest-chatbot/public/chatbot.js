
(function () {
  // ===== CONFIG =====
  const API_ENDPOINT = "/api/chat";
  const WELCOME_MESSAGES = [
    {
      role: "assistant",
      text: "Welcome to AutoNest Assist!  I'm here to help you rent a car, plan a trip, or book for a special event.",
    },
    {
      role: "assistant",
      text: "I can help you with:\n•  Car rental prices & availability\n•  One-way drop to other cities\n•  Wedding & event car bookings\n•  Airport pickup service\n•  Booking & payment guidance",
    },
  ];

  // ===== STATE =====
  let conversationHistory = [];
  let isLoading = false;
  let isRecording = false;
  let recognition = null;

  // ===== BUILD UI =====
  function buildWidget() {
    // Toggle Button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "az-toggle-btn";
    toggleBtn.setAttribute("aria-label", "Open chat");
    toggleBtn.innerHTML = `
      <svg class="icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6v-2h12v2zm0-4H6V6h12v2z"/>
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    document.body.appendChild(toggleBtn);

    // Widget
    const widget = document.createElement("div");
    widget.id = "az-widget";
    widget.setAttribute("role", "dialog");
    widget.setAttribute("aria-label", "AutoNest chat assistant");
    widget.innerHTML = `
      <div id="az-header">
        <div class="bot-icon">🤖</div>
        <h3>Support Assistant</h3>
        <div class="status" title="Online"></div>
      </div>
      <div id="az-messages" role="log" aria-live="polite"></div>
      <div id="az-input-area">
        <input
          type="text"
          id="az-input"
          placeholder="Type your message..."
          autocomplete="off"
          maxlength="500"
        />
        <button id="az-voice-btn" title="Voice input" aria-label="Start voice input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="2" width="6" height="11" rx="3"/>
            <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8"/>
          </svg>
        </button>
        <button id="az-send-btn" aria-label="Send message">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(widget);

    return { toggleBtn, widget };
  }

  // ===== TOGGLE =====
  function setupToggle(toggleBtn, widget) {
    let isOpen = false;

    toggleBtn.addEventListener("click", () => {
      isOpen = !isOpen;
      widget.classList.toggle("visible", isOpen);
      toggleBtn.classList.toggle("open", isOpen);
      toggleBtn.setAttribute("aria-label", isOpen ? "Close chat" : "Open chat");

      if (isOpen) {
        document.getElementById("az-input").focus();
      }
    });
  }

  // ===== RENDER MESSAGE =====
  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderMessage(role, text, animate = true) {
    const messagesEl = document.getElementById("az-messages");
    const wrap = document.createElement("div");
    wrap.className = `az-bubble-wrap ${role === "user" ? "user" : "bot"}`;

    const bubble = document.createElement("div");
    bubble.className = "az-bubble";
    bubble.textContent = text;

    const time = document.createElement("div");
    time.className = "az-time";
    time.textContent = getTime();

    wrap.appendChild(bubble);
    wrap.appendChild(time);

    if (animate) {
      wrap.style.opacity = "0";
      wrap.style.transform = "translateY(8px)";
      wrap.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      messagesEl.appendChild(wrap);
      requestAnimationFrame(() => {
        wrap.style.opacity = "1";
        wrap.style.transform = "translateY(0)";
      });
    } else {
      messagesEl.appendChild(wrap);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  // ===== TYPING INDICATOR =====
  function showTyping() {
    const messagesEl = document.getElementById("az-messages");
    const wrap = document.createElement("div");
    wrap.className = "az-bubble-wrap bot";
    wrap.id = "az-typing";

    const bubble = document.createElement("div");
    bubble.className = "az-bubble";
    bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById("az-typing");
    if (typing) typing.remove();
  }

  // ===== SEND MESSAGE =====
  async function sendMessage(userText) {
    if (!userText.trim() || isLoading) return;

    isLoading = true;
    const input = document.getElementById("az-input");
    const sendBtn = document.getElementById("az-send-btn");
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

    renderMessage("user", userText);
    conversationHistory.push({ role: "user", content: userText });

    showTyping();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      hideTyping();

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const reply = data.reply || "Sorry, I could not get a response. Please try again.";

      conversationHistory.push({ role: "assistant", content: reply });
      renderMessage("assistant", reply);
    } catch (error) {
      hideTyping();
      console.error("Chat error:", error);
      renderMessage(
        "assistant",
        "⚠️ Connection issue. Please check your internet and try again, or contact us at +923265937742."
      );
    } finally {
      isLoading = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ===== VOICE INPUT =====
  function setupVoice() {
    const voiceBtn = document.getElementById("az-voice-btn");
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      voiceBtn.style.display = "none";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById("az-input");
      input.value = transcript;
      stopRecording();
      sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      stopRecording();
      if (event.error === "no-speech") {
        renderMessage("assistant", "I didn't catch that. Please try again or type your message.");
      }
    };

    recognition.onend = () => stopRecording();

    voiceBtn.addEventListener("click", () => {
      if (isRecording) {
        recognition.stop();
        stopRecording();
      } else {
        startRecording();
      }
    });
  }

  function startRecording() {
    isRecording = true;
    const voiceBtn = document.getElementById("az-voice-btn");
    voiceBtn.classList.add("recording");
    voiceBtn.setAttribute("aria-label", "Stop recording");
    voiceBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="#ef4444" width="16" height="16">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
    `;
    recognition.start();
  }

  function stopRecording() {
    isRecording = false;
    const voiceBtn = document.getElementById("az-voice-btn");
    if (!voiceBtn) return;
    voiceBtn.classList.remove("recording");
    voiceBtn.setAttribute("aria-label", "Start voice input");
    voiceBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="2" width="6" height="11" rx="3"/>
        <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8"/>
      </svg>
    `;
  }

  // ===== INIT =====
  function init() {
    const { toggleBtn, widget } = buildWidget();
    setupToggle(toggleBtn, widget);
    setupVoice();

    // Show welcome messages
    WELCOME_MESSAGES.forEach((msg, i) => {
      setTimeout(() => {
        renderMessage(msg.role, msg.text, true);
      }, i * 400);
    });

    // Send on Enter key
    document.getElementById("az-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e.target.value);
      }
    });

    // Send on button click
    document.getElementById("az-send-btn").addEventListener("click", () => {
      sendMessage(document.getElementById("az-input").value);
    });
  }

  // Wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();