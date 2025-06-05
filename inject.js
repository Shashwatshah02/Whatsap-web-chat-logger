(function () {
  console.log(
    "📥 WhatsApp Message Logger Active + 🖼 Image Blob Logger Integrated"
  );

  const collectedLogsByChat = new Map();
  const loggedBlobUrls = new Set(); // 🆕 Track logged blob image URLs
  const loggedVideoBlobUrls = new Set(); // 🆕 Track logged blob video URLs
  let currentChat = null;
  let logTimeout = null;
  let lastLoggedTime = 0;

  function parseTimestamp(raw) {
    try {
      let cleaned = raw.replace(/^\[|\]$/g, "").trim();
      const parts = cleaned.split(", ");
      if (parts.length === 2) {
        const [timePart, datePart] = parts;
        const [day, month, year] = datePart.split("/");
        const [hours, minutes] = timePart.split(":");
        return new Date(year, month - 1, day, hours, minutes);
      } else if (parts.length === 1) {
        const [hours, minutes] = parts[0].split(":");
        const now = new Date();
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes
        );
      }
    } catch {}
    return new Date();
  }

  function downloadLogs() {
    try {
      if (collectedLogsByChat.size === 0) {
        alert("⚠ No logs to download yet!");
        return;
      }
      let combinedLogs = [];
      collectedLogsByChat.forEach((messages, chatName) => {
        // messages.sort((a, b) => a.timestamp - b.timestamp);
        combinedLogs.push(🔷 Chat: ${chatName}\n);
        combinedLogs.push(...messages.map((m) => m.logEntry));
        combinedLogs.push("\n");
      });

      const blob = new Blob([combinedLogs.join("\n")], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whatsapp_chat_logs_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error downloading logs:", err);
      alert("Failed to download logs. Check the console for details.");
    }
  }

  document.addEventListener("keydown", (event) => {
    try {
      const tag = document.activeElement?.tagName;
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "s" &&
        !["INPUT", "TEXTAREA"].includes(tag)
      ) {
        event.preventDefault();
        console.log("💾 Shortcut detected. Downloading logs...");
        downloadLogs();
      }
    } catch (err) {
      console.error("❌ Error handling keyboard shortcut:", err);
    }
  });

  // 🆕 Base64 check to exclude blurry images
  function isBase64(src) {
    return src && src.startsWith("data:");
  }

  function isBase64Blur(src) {
    return src && src.startsWith("data:image") && src.length < 2000;
  }

  // 🆕 Check if image is within a chat bubble
  function isChatImage(img) {
    const rect = img.getBoundingClientRect();
    const isBigEnough = rect.width > 100 && rect.height > 100;
    const isInChatBubble = img.closest(
      'div[role="button"], div[data-testid*="media-viewer"]'
    );
    return isBigEnough && isInChatBubble;
  }

  // 🆕 Extract non-base64, blob or real image URL
  function getRealImageUrl(imgElement) {
    if (!imgElement) return null;
    const src = imgElement.src;

    // If blob and valid, return
    if (
      src.startsWith("blob:") &&
      !isBase64Blur(src) &&
      isChatImage(imgElement)
    ) {
      if (!loggedBlobUrls.has(src)) {
        loggedBlobUrls.add(src);
        console.log(🟢 Chat Image Blob URL: ${src});
      }
      return src;
    }

    // Try alternatives
    if (!isBase64(src)) return src;
    let realUrl = imgElement.getAttribute("data-src");
    if (realUrl && !isBase64(realUrl)) return realUrl;

    const parent = imgElement.parentElement;
    if (parent) {
      const siblingImg = parent.querySelector("img[src]:not([src^='data:'])");
      if (siblingImg) return siblingImg.src;
    }

    return null; // fallback: null if base64 only
  }

  function getRealVideoUrl(videoElement) {
    if (!videoElement) return null;
    const src = videoElement.src || videoElement.querySelector("source")?.src;
    if (src && src.startsWith("blob:") && !loggedVideoBlobUrls.has(src)) {
      loggedVideoBlobUrls.add(src);
      console.log(🔵 Chat Video Blob URL: ${src});
      return src;
    }
    return null;
  }

  function logCurrentChatMessages() {
    try {
      if (!currentChat) return;

      if (!collectedLogsByChat.has(currentChat)) {
        collectedLogsByChat.set(currentChat, []);
      }
      const chatMessages = collectedLogsByChat.get(currentChat);

      if (!chatMessages.uniqueKeys) {
        chatMessages.uniqueKeys = new Set();
      }

      const messages = document.querySelectorAll(
        "div.message-in, div.message-out"
      );
      let newLogsCount = 0;

      messages.forEach((msg) => {
        try {
          let timestampRaw = "Unknown Time";
          const timestampDiv = msg.querySelector("div[data-pre-plain-text]");
          if (timestampDiv?.getAttribute("data-pre-plain-text")) {
            timestampRaw = timestampDiv
              .getAttribute("data-pre-plain-text")
              .trim();
          } else {
            const fallbackSpan = msg.querySelector("span.x1rg5ohu.x16dsc37");
            if (fallbackSpan?.innerText) {
              timestampRaw = fallbackSpan.innerText.trim();
            }
          }
          const timestamp = parseTimestamp(timestampRaw);

          const msgTextSpans = msg.querySelectorAll(
            "span.selectable-text span"
          );
          let msgText = null;
          if (msgTextSpans.length > 0) {
            msgText = Array.from(msgTextSpans)
              .map((span) => span?.innerText || "")
              .join("\n")
              .trim();
          }

          const imageElement =
            msg.querySelector("img[src^='blob:']") ||
            msg.querySelector("img[src^='https://']") ||
            msg.querySelector("img");
          const videoElement = msg.querySelector("video");
          const docSpan = msg.querySelector("span.x13faqbe._ao3e");

          const imageUrl = getRealImageUrl(imageElement); // ✅ Modified: Now supports blob extraction
          const videoUrl = getRealVideoUrl(videoElement); 

          const uniqueKey = `${timestampRaw}-${
            msgText ||
            imageUrl ||
            (videoElement ? "video" : "") ||
            (docSpan ? "document" : "")
          }`;
          if (chatMessages.uniqueKeys.has(uniqueKey)) return;
          chatMessages.uniqueKeys.add(uniqueKey);

          let logEntry = "📩 Message Log\n";
          logEntry += 🕒 Time & Sender: ${timestampRaw}\n;
          if (msgText) logEntry += 💬 Text: ${msgText}\n;
          if (imageUrl) logEntry += 🖼 Image URL: ${imageUrl}\n;
          if (videoUrl) logEntry += 🎥 Video URL: ${videoUrl}\n;
          if (docSpan) logEntry += 📄 Document Detected\n;
          logEntry += "───────────────\n";

          chatMessages.push({ timestamp, logEntry });
          newLogsCount++;
        } catch (msgErr) {
          console.error("❌ Error logging individual message:", msgErr);
        }
      });

      if (newLogsCount > 0) {
        console.log(
          📝 Logged ${newLogsCount} new messages from chat: ${currentChat}
        );
      } else {
        console.log(ℹ No new messages to log for chat: ${currentChat});
      }
    } catch (err) {
      console.error("❌ Error logging chat messages:", err);
    }
  }

  const mainObserver = new MutationObserver(() => {
    try {
      const now = Date.now();
      if (now - lastLoggedTime < 2000) return;

      const chatTitle = document
        .querySelector("header span[title]")
        ?.getAttribute("title");
      if (!chatTitle) return;

      if (chatTitle !== currentChat) {
        lastLoggedTime = now;
        currentChat = chatTitle;
        console.log(
          🕒 Chat changed to: ${chatTitle}, waiting 5 seconds to log...
        );
        clearTimeout(logTimeout);
        logTimeout = setTimeout(() => {
          logCurrentChatMessages();
        }, 5000);
      } else {
        lastLoggedTime = now;
        clearTimeout(logTimeout);
        logTimeout = setTimeout(() => {
          logCurrentChatMessages();
        }, 5000);
      }
    } catch (err) {
      console.error("❌ Error in MutationObserver callback:", err);
    }
  });

  setInterval(() => {
    if (currentChat) {
      console.log(
        ⏲ Periodic re-check for new messages in chat: ${currentChat}
      );
      logCurrentChatMessages();
    }
  }, 7000);

  const waitForMain = setInterval(() => {
    try {
      const mainContainer = document.querySelector("#main");
      if (mainContainer) {
        clearInterval(waitForMain);
        console.log("👀 Main container found. Starting observer...");
        mainObserver.observe(mainContainer, { childList: true, subtree: true });
      } else {
        console.log("⏳ Waiting for chat to load...");
      }
    } catch (err) {
      console.error("❌ Error while waiting for main container:", err);
    }
  }, 1000);
})();