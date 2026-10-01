export default {
  async fetch(request, env, ctx) {
    // จัดการ CORS Preflight Request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json();
      const base64Image = body.image;
      const mimeType = body.mimeType || "image/jpeg";

      const apiKey = env.GEMINI_API_KEY; // ดึงจาก Environment Variable ใน Cloudflare
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key not configured in Worker" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // ส่งต่อไปยัง Gemini API
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "วิเคราะห์รูปภาพอาหารนี้ บอกชื่อเมนู, พลังงานรวม (kcal) โดยประมาณ และรายละเอียดสารอาหาร (โปรตีน, คาร์โบไฮเดรต, ไขมัน) เป็นภาษาไทย จัดรูปแบบให้อ่านง่าย" },
              { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
          }]
        })
      });

      const geminiData = await geminiResponse.json();

      return new Response(JSON.stringify(geminiData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
