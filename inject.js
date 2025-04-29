(function () {
  console.log("📥 WhatsApp Message Logger Active");

  const loggedChats = new Set(); // Store chat names already logged
  let collectedLogs = [];
  let currentChat = null;
  let logTimeout = null;

  // Helper: Trigger download
  function downloadLogs() {
    if (collectedLogs.length === 0) {
      alert("⚠️ No logs to download yet!");
      return;
    }

    const blob = new Blob([collectedLogs.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp_chat_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Listen for Ctrl + Shift + S
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
      console.log("💾 Shortcut detected. Downloading logs...");
      downloadLogs();
    }
  });

  // Logging function (after 5 sec delay)
  function logCurrentChatMessages() {
    const messages = document.querySelectorAll("div.message-in, div.message-out");

    const uniqueMsgs = new Set();
    let chatLogs = [];

    messages.forEach((msg) => {
      const timestampDiv = msg.querySelector("div[data-pre-plain-text]");
      const timestamp = timestampDiv ? timestampDiv.getAttribute("data-pre-plain-text") : "No Timestamp";

      // ✅ FIX: Handle multi-line messages correctly
      const msgTextSpans = msg.querySelectorAll("span.selectable-text span");
      let msgText = null;
      if (msgTextSpans.length > 0) {
        msgText = Array.from(msgTextSpans)
          .map(span => span.innerText)
          .join("\n")
          .trim();
      }

      const imageElement = msg.querySelector("img[src]");
      const videoElement = msg.querySelector("video");
      const docElement = msg.querySelector('[data-testid="media-download"]');

      const uniqueKey = `${timestamp}-${msgText || (imageElement?.src) || (videoElement ? "video" : "") || (docElement ? "document" : "")}`;
      if (uniqueMsgs.has(uniqueKey)) return;
      uniqueMsgs.add(uniqueKey);

      let logEntry = "📩 Message Log\n";
      logEntry += `🕒 Time & Sender: ${timestamp.trim()}\n`;
      if (msgText) logEntry += `💬 Text: ${msgText}\n`;
      if (imageElement) logEntry += `🖼️ Image URL: ${imageElement.src}\n`;
      if (videoElement) logEntry += `🎥 Video Found (not logging URL)\n`;
      if (docElement) logEntry += `📄 Document Detected\n`;
      logEntry += "───────────────\n";

      chatLogs.push(logEntry);
    });

    if (chatLogs.length > 0) {
      console.log(`📝 Logged ${chatLogs.length} messages from chat: ${currentChat}`);
      collectedLogs.push(`🔷 Chat: ${currentChat}\n` + chatLogs.join("\n"));
    }
  }

  // Detect chat change
  const mainObserver = new MutationObserver(() => {
    const chatTitle = document.querySelector("header span[title]")?.getAttribute("title");
    if (!chatTitle || loggedChats.has(chatTitle)) return;

    currentChat = chatTitle;
    loggedChats.add(chatTitle);

    console.log(`🕒 New chat opened: ${chatTitle}, waiting 5 seconds to log...`);

    clearTimeout(logTimeout); // In case something is pending
    logTimeout = setTimeout(() => {
      logCurrentChatMessages();
    }, 5000);
  });

  // Wait for main container to appear
  const waitForMain = setInterval(() => {
    const mainContainer = document.querySelector("#main");
    if (mainContainer) {
      clearInterval(waitForMain);
      console.log("👀 Main container found. Starting observer...");
      mainObserver.observe(mainContainer, { childList: true, subtree: true });
    } else {
      console.log("⏳ Waiting for chat to load...");
    }
  }, 1000);
})();
