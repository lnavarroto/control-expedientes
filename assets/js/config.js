export const appConfig = {
  appName: "Archivo Módulo Civil - Sullana",
  institucion: "Poder Judicial del Perú",
  storagePrefix: "archivo",
  iconPathRoot: "assets/icons/favicon.ico",
  
  // URL del Cloudflare Worker (Proxy sin CORS) - PRODUCCIÓN ✅
  googleSheetURL: "https://proxy-apps-script.ln142843.workers.dev",
  registroExpedienteURL: "https://proxy-apps-script.ln142843.workers.dev"
  
  // Fallback Google Apps Script solo si necesitas testing sin Worker
  // googleSheetURL: "https://script.google.com/macros/s/AKfycbzYq5yjgJsTM94yhiMv6gH1ND7HN6gaEpUWQn6P7CJnSpjUfMIPD8biSHDPQEJB4btp/exec",
  // registroExpedienteURL: "https://script.google.com/macros/s/AKfycbzYq5yjgJsTM94yhiMv6gH1ND7HN6gaEpUWQn6P7CJnSpjUfMIPD8biSHDPQEJB4btp/exec"
};
