// Function to detect common in-app browser signatures
export async function checkBrowser() {
  const ua = navigator.userAgent || "";

  // Compute conditions
  const inAppSignatures = ["FBAN", "FBAV", "Instagram", "Twitter", "wv", "MicroMessenger"];
  const isiOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
  const isInApp = inAppSignatures.some(signature => ua.includes(signature)) || isiOSWebView;
  const is360 = ua.includes("360");

  // Supported browser conditions
  const isChrome = /Chrome/.test(ua) && !/(Edg|OPR|Edge)/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isOpera = /OPR/.test(ua);
  const isSafari = /Safari/.test(ua) && !/(Chrome|Chromium|OPR|Edg)/.test(ua);
  const isSupported = isChrome || isEdge || isFirefox || isOpera || isSafari;

  // If browser is in-app, modified (e.g. 360), or unsupported, redirect and return false.
  if (isInApp || is360 || !isSupported) {
    window.location.href = '/browser-not-supported';
    return false;
  }

  return true;
}
