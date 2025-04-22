(function () {
    console.log("📥 WhatsApp Message Logger Active");
  
    // Set up a MutationObserver to watch for new messages
    const chatObserver = new MutationObserver(() => {
      const messages = document.querySelectorAll("div.message-in, div.message-out");
  
      messages.forEach((msg) => {
        // Timestamp + sender info
        const timestampDiv = msg.querySelector("div[data-pre-plain-text]");
        const timestamp = timestampDiv ? timestampDiv.getAttribute("data-pre-plain-text") : "No Timestamp";
  
        // Message content
        const msgTextSpan = msg.querySelector("span.selectable-text span");
        const msgText = msgTextSpan ? msgTextSpan.innerText : "Media/Unknown Message";
  
        if (timestamp && msgText) {
          console.log("📩 Message Log");
          console.log("🕒 Time & Sender:", timestamp.trim());
          console.log("💬 Text:", msgText.trim());
          console.log("───────────────");
        }
      });
    });
  
    // Wait for chat container
    const waitForChat = setInterval(() => {
      const chatContainer = document.querySelector('div[aria-label="Chat list"]');
      const mainContainer = document.querySelector("#main");
  
      if (mainContainer) {
        clearInterval(waitForChat);
        console.log("👀 Chat container found. Starting observer...");
  
        chatObserver.observe(mainContainer, { childList: true, subtree: true });
      } else {
        console.log("⏳ Chat container not found yet. Retrying...");
      }
    }, 1000);
  })();
  