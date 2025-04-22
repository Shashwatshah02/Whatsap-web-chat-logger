(function () {
  console.log("📥 WhatsApp Message Logger Active");

  const chatObserver = new MutationObserver(() => {
    const messages = document.querySelectorAll("div.message-in, div.message-out");

    messages.forEach((msg) => {
      const timestampDiv = msg.querySelector("div[data-pre-plain-text]");
      const timestamp = timestampDiv ? timestampDiv.getAttribute("data-pre-plain-text") : "No Timestamp";

      // Try to get text message
      const msgTextSpan = msg.querySelector("span.selectable-text span");
      const msgText = msgTextSpan ? msgTextSpan.innerText : null;

      // Try to get image or media
      const imageElement = msg.querySelector("img[src]");
      const videoElement = msg.querySelector("video");
      const docElement = msg.querySelector('[data-testid="media-download"]'); // for PDFs or docs

      console.log("📩 Message Log");
      console.log("🕒 Time & Sender:", timestamp.trim());

      if (msgText) {
        console.log("💬 Text:", msgText.trim());
      }

      if (imageElement) {
        console.log("🖼️ Image URL:", imageElement.src);
      }

      if (videoElement) {
        console.log("🎥 Video Found (not logging URL for security)");
      }

      if (docElement) {
        console.log("📄 Document Download Button Found (may be PDF/doc)");
      }

      console.log("───────────────");
    });
  });

  const waitForChat = setInterval(() => {
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
