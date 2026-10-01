export default {
  async fetch(request, env, ctx) {
    // จัดการ CORS ถ้าจำเป็น
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST" && new URL(request.url).pathname === "/analyze") {
      try {
        const formData = await request.formData();
        const imageFile = formData.get("image");

        if (!imageFile) {
          return Response.json({ success: false, error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
        }

        // แปลงรูปภาพเป็น ArrayBuffer -> Base64
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);
        const mimeType = imageFile.type || "image/jpeg";

        // เรียกใช้งาน Gemini API (ผ่าน Google Generative AI หรือ REST API ตรง)
        const geminiApiKey = env.GEMINI_API_KEY; // ตั้งค่า Secret ใน Cloudflare Dashboard
        const promptText = "วิเคราะห์รูปภาพอาหารนี้ บอกชื่อเมนู, พลังงานรวม (kcal) โดยประมาณ และรายละเอียดสารอาหาร (โปรตีน, คาร์โบไฮเดรต, ไขมัน) เป็นภาษาไทย จัดรูปแบบให้อ่านง่าย";

        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }]
          })
        });

        const aiResult = await apiResponse.json();
        const textOutput = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่สามารถวิเคราะห์ผลลัพธ์ได้";

        return Response.json({
          success: true,
          menuName: "เมนูอาหารจากภาพ",
          calories: "คำนวณจาก AI ด้านล่าง",
          details: textOutput
        }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });

      } catch (err) {
        return Response.json({ success: false, error: err.message }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("FoodLens AI Backend Running", { status: 200 });
  },
};
