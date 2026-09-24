// src/apiClient.js
const API_BASE = process.env.REACT_APP_API_BASE || "/backend/army_api.php";
const API_KEY = process.env.REACT_APP_API_KEY;

// 🔍 Debug: Zeige welche API verwendet wird
console.log("===========================================");
console.log("🚀 API CLIENT CONFIGURATION");
console.log("===========================================");
console.log("API_BASE:", API_BASE);
console.log("API_KEY:", API_KEY ? "✅ SET" : "❌ NOT SET");
console.log("ENV REACT_APP_API_BASE:", process.env.REACT_APP_API_BASE || "❌ NOT SET");
console.log("ENV NODE_ENV:", process.env.NODE_ENV);
console.log("===========================================");

export async function apiCall(action, params = {}, method = "GET") {
	
  let url = `${API_BASE}?action=${encodeURIComponent(action)}`;

  const headers = {
    "X-API-Key": API_KEY || "",
  };

  const options = {
    method,
    headers,
  };

  if (method === "GET" || method === "DELETE") {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `&${qs}`;
  } else {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(params);
  }

  const res = await fetch(url, options);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
	console.log("apiCall", res); // 🔍 Debug – sehr empfehlenswert
    throw new Error(`Kein JSON vom Server (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data;
}
