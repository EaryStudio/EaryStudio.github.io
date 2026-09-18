/* Fallback UI only. Native Auth Tab / verified App Links receive real results.
   This page cannot verify app-private state and must never forward a token. */
(() => {
  "use strict";

  function classify(fragment, query) {
    if (!fragment && !query) return "empty";
    // Steam documents a fragment response. Do not accept query-based credentials.
    if (query || !fragment || fragment.length > 16384) return "invalid";
    const encoded = fragment.slice(1);
    try {
      // URLSearchParams tolerates malformed escapes; reject these explicitly.
      decodeURIComponent(encoded.replace(/\+/g, " "));
    } catch {
      return "invalid";
    }
    const fields = new URLSearchParams(encoded);
    const seen = new Set();
    for (const [key] of fields) {
      if (seen.has(key)) return "invalid";
      seen.add(key);
    }
    const state = fields.get("state");
    if (!state || !state.trim()) return "invalid";
    const hasToken = fields.has("access_token");
    const hasError = fields.has("error");
    if (hasError) {
      if (hasToken || fields.has("token_type") || fields.has("code")) return "invalid";
      return fields.get("error") === "access_denied" ? "denied" : "invalid";
    }
    if (fields.has("code")) return "invalid";
    if (hasToken && fields.get("access_token").trim() && fields.get("token_type") === "steam") {
      return "received";
    }
    return "invalid";
  }

  // Only the classification survives this synchronous call. No result, token,
  // state, or original URL is placed in history state, storage, DOM, or logs.
  let result = "empty";
  function consumeResult() {
    result = classify(window.location.hash, window.location.search);
    try {
      window.history.replaceState(null, "", window.location.pathname);
      return true;
    } catch {
      // A clean navigation is safer than leaving a credential-bearing URL visible.
      result = "empty";
      window.location.replace(window.location.pathname);
      return false;
    }
  }
  if (!consumeResult()) return;
  const messages = {
    empty: "Start Steam sign-in from Iris’s Idle Log.",
    received: "Return to Iris’s Idle Log to finish signing in. If sign-in did not complete, try again from the game.",
    denied: "Steam access was not granted. Return to the game to try again.",
    invalid: "This sign-in response could not be used. Start again from the game."
  };
  function renderMessage() {
    const message = document.getElementById("message");
    if (!message) return;
    message.textContent = messages[result];
    result = "empty";
  }
  document.addEventListener("DOMContentLoaded", renderMessage, { once: true });
  // Also discard a result delivered to an already-open fallback document.
  window.addEventListener("hashchange", () => {
    if (consumeResult()) renderMessage();
  });
})();
