// googleAuth.js — Google Identity Services token client (no backend needed).
// The access token lives only in memory; Google silently re-issues it while
// the user's Google session is active, otherwise a consent popup appears.

window.EPT = window.EPT || {};

(function () {
  let tokenClient = null;
  let accessToken = null;
  let tokenExpiry = 0;

  const clientId = () => localStorage.getItem("gs_client_id") || "";

  function ensureClient() {
    if (tokenClient) return tokenClient;
    if (!clientId() || !window.google || !google.accounts) return null;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: () => {} // replaced per-request in getToken
    });
    return tokenClient;
  }

  window.EPT.auth = {
    isConfigured: () => !!clientId(),
    isConnected: () => !!accessToken && Date.now() < tokenExpiry - 60000,
    resetClient() { tokenClient = null; accessToken = null; tokenExpiry = 0; },
    getToken() {
      return new Promise((resolve, reject) => {
        if (this.isConnected()) return resolve(accessToken);
        const tc = ensureClient();
        if (!tc) return reject(new Error("Google sync not configured (missing Client ID) or Google script not loaded"));
        tc.callback = resp => {
          if (resp.error) return reject(new Error(resp.error));
          accessToken = resp.access_token;
          tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
          resolve(accessToken);
        };
        tc.requestAccessToken({ prompt: "" }); // silent if already consented, popup otherwise
      });
    },
    disconnect() { accessToken = null; tokenExpiry = 0; }
  };
})();
