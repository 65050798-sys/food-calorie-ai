export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/analyze") {
      try {
        if (!env.GEMINI_API_KEY) {
          return Response.json({ success: false, error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Cloudflare Worker" }, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }

        const formData = await request.formData();
        const imageFile = formData.get("image");

        if (!imageFile) {
          return Response.json({ success: false, error: "ไม่พบไฟล์รูปภาพในคำขอ" }, {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);
        const mimeType = imageFile.type || "image/jpeg";

        const promptText = "วิเคราะห์รูปภาพอาหารนี้ บอกชื่อเมนู, พลังงานรวม (kcal) โดยประมาณ และรายละเอียดสารอาหาร (โปรตีน, คาร์โบไฮเดรต, ไขมัน) เป็นภาษาไทย จัดรูปแบบให้อ่านง่าย";

        // เรียกใช้งาน Gemini API (ใช้รุ่น gemini-1.5-flash หรือ gemini-2.5-flash ตามความเหมาะสม)
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
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
        
        if (aiResult.error) {
          return Response.json({ success: false, error: "Google Gemini Error: " + aiResult.error.message }, {
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }

        const textOutput = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่สามารถวิเคราะห์ผลลัพธ์ได้จาก AI";

        return Response.json({
          success: true,
          menuName: "อาหารจากภาพ",
          details: textOutput
        }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });

      } catch (err) {
        return Response.json({ success: false, error: "Worker Error: " + err.message }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("FoodLens AI Backend is running!", {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  },
};
