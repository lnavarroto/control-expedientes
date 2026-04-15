/**
 * Cloudflare Worker - Proxy para Google Apps Script
 * Resuelve CORS para acceso a Google Apps Script
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYq5yjgJsTM94yhiMv6gH1ND7HN6gaEpUWQn6P7CJnSpjUfMIPD8biSHDPQEJB4btp/exec";

export default {
  async fetch(request, env, ctx) {
    // Manejo de preflight CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "3600"
        }
      });
    }

    try {
      const url = new URL(request.url);
      const method = request.method;

      console.log(`[Proxy] ${method} ${url.pathname}${url.search}`);

      // Construir URL hacia Google Apps Script
      let targetUrl = GOOGLE_SCRIPT_URL;

      if (method === "GET") {
        // Para GET, pasar los query parameters
        const queryString = url.search;
        targetUrl += queryString;
      }

      // Crear request hacia Google Apps Script
      const forwardRequest = new Request(targetUrl, {
        method: method,
        headers: new Headers(request.headers),
        body: method === "POST" ? await request.text() : undefined
      });

      // Remover headers que pueden causar problemas
      forwardRequest.headers.delete("host");

      // Hacer la llamada a Google Apps Script
      const response = await fetch(forwardRequest);

      // Leer la respuesta
      const responseBody = await response.text();

      // Crear respuesta con headers CORS
      const corsResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "3600"
        }
      });

      console.log(`[Proxy] Response: ${response.status}`);
      return corsResponse;

    } catch (error) {
      console.error(`[Proxy Error] ${error.message}`);

      return new Response(JSON.stringify({
        success: false,
        error: `Proxy error: ${error.message}`
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
