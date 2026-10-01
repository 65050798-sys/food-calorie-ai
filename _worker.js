export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 1. หน้าเว็บ HTML ดีไซน์ใหม่แบบมืออาชีพ (GET /)
    if (request.method === "GET") {
      const html = `<!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FoodLens AI - Nutrition & Calorie Analyzer</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
          body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .container { width: 100%; max-width: 540px; background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 28px; }
          .badge { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(16, 185, 129, 0.2); }
          h1 { font-size: 28px; font-weight: 700; margin-top: 12px; color: #ffffff; }
          p.sub { color: #94a3b8; font-size: 14px; margin-top: 6px; }
          .upload-box { border: 2px dashed #475569; border-radius: 16px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(15, 23, 42, 0.4); margin-bottom: 20px; }
          .upload-box:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
          #imageInput { display: none; }
          #preview { max-width: 100%; max-height: 250px; border-radius: 12px; display: none; margin: 0 auto 16px auto; object-fit: cover; }
          .btn { width: 100%; padding: 16px; background: #10b981; color: #022c22; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
          .btn:hover { background: #34d399; transform: translateY(-1px); }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          #loading { display: none; text-align: center; margin-top: 20px; color: #34d399; font-size: 14px; font-weight: 600; }
          #result { display: none; margin-top: 28px; border-top: 1px solid #334155; padding-top: 24px; }
          .nutrition-grid { display: grid; grid-template-columns: repeat(3, 11fr); gap: 12px; margin-top: 16px; }
          .nut-card { background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
          .nut-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
          .nut-val { font-size: 18px; font-weight: 700; color: #10b981; margin-top: 4px; }
          .nut-main { grid-column: span 3; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
          .nut-main .nut-val { font-size: 28px; }
          .text-details { background: #0f172a; border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-top: 16px; font-size: 14px; color: #cbd5e1; line-height: 1.6; white-space: pre-line; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">AI Powered Nutrition</span>
            <h1>FoodLens AI</h1>
            <p class="sub">วิเคราะห์แคลอรีและสารอาหารจากรูปถ่ายด้วย AI</p>
          </div>

          <div class="upload-box" onclick="document.getElementById('imageInput').click()">
            <img id="preview" alt="Food Preview">
            <div id="uploadText">
              <p style="font-weight: 600; color: #e2e8f0;">📸 คลิกเพื่อเลือกรูปภาพอาหาร</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">รองรับ JPG, PNG</p>
            </div>
            <input type="file" id="imageInput" accept="image/*" onchange="handleImage(event)">
          </div>

          <button id="analyzeBtn" class="btn" onclick="analyzeImage()">⚡ วิเคราะห์โภชนาการ</button>
          <div id="loading">⏳ กำลังประมวลผลข้อมูลโภชนาการด้วย Gemini AI...</div>

          <div id="result">
            <h3 style="color: #ffffff; font-size: 18px;">📊 สรุปโภชนาการโดยประมาณ</h3>
            <div class="nutrition-grid">
              <div class="nut-card nut-main">
                <div class="nut-label">แคลอรีทั้งหมด (Energy)</div>
                <div class="nut-val" id="valCalories">-</div>
              </div>
              <div class="nut-card">
                <div class="nut-label">โปรตีน (Protein)</div>
                <div class="nut-val" id="valProtein">-</div>
              </div>
              <div class="nut-card">
                <div class="nut-label">คาร์บ (Carbs)</div>
                <div class="nut-val" id="valCarbs">-</div>
              </div>
              <div class="nut-card">
                <div class="nut-label">ไขมัน (Fat)</div>
                <div class="nut-val" id="valFat">-</div>
              </div>
            </div>

            <div class="text-details" id="textDetails"></div>
          </div>
        </div>

        <script>
          let base64Image = "";
          let mimeType = "image/jpeg";

          function handleImage(e) {
            const file = e.target.files[0];
            if (file) {
              mimeType = file.type || "image/jpeg";
              const reader = new FileReader();
              reader.onload = function(evt) {
                document.getElementById('preview').src = evt.target.result;
                document.getElementById('preview').style.display = 'block';
                document.getElementById('uploadText').style.display = 'none';
                base64Image = evt.target.result.split(',')[1];
              }
              reader.readAsDataURL(file);
            }
          }

          async function analyzeImage() {
            if (!base64Image) { alert("กรุณาเลือกรูปอาหารก่อนครับ"); return; }
            
            const btn = document.getElementById('analyzeBtn');
            const loading = document.getElementById('loading');
            const resultDiv = document.getElementById('result');

            btn.disabled = true;
            loading.style.display = 'block';
            resultDiv.style.display = 'none';

            try {
              const res = await fetch('/analyze', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64Image, mimeType: mimeType })
              });
              const data = await res.json();

              if (data.error) {
                alert("เกิดข้อผิดพลาด: " + data.error);
              } else {
                // Parse และแสดงผลข้อมูล
                document.getElementById('valCalories').innerText = data.data.calories || "-";
                document.getElementById('valProtein').innerText = data.data.protein || "-";
                document.getElementById('valCarbs').innerText = data.data.carbs || "-";
                document.getElementById('valFat').innerText = data.data.fat || "-";
                document.getElementById('textDetails').innerText = data.data.details || "";
                resultDiv.style.display = 'block';
              }
            } catch (err) {
              alert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + err.message);
            } finally {
              btn.disabled = false;
              loading.style.display = 'none';
            }
          }
        </script>
      </body>
      </html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8", ...corsHeaders }
      });
    }

    // 2. ส่วนหลังบ้านประมวลผล AI ส่งข้อมูลเป็น Structured JSON (POST /analyze)
    if (request.method === "POST" && url.pathname === "/analyze") {
      try {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return Response.json(
            { error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Cloudflare Settings" },
            { status: 500, headers: corsHeaders }
          );
        }

        const promptText = `วิเคราะห์ภาพอาหารนี้แล้วตอบกลับในรูปแบบ JSON เท่านั้น โดยต้องมีโครงสร้างข้อมูลดังนี้:
{
  "calories": "xxx kcal",
  "protein": "xx g",
  "carbs": "xx g",
  "fat": "xx g",
  "details": "บอกชื่อเมนูอาหาร สรุปโภชนาการ โซเดียม น้ำตาล และคำแนะนำด้านสุขภาพสั้นๆ เป็นภาษาไทย"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: body.mimeType || "image/jpeg",
                    data: body.image
                  }
                }
              ]
            }]
          })
        });

        const resData = await response.json();

        if (response.ok && !resData.error) {
          const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // ทำการ Clean ข้อความเอา Markdown JSON ออก
          const jsonString = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          let parsedData = {};
          try {
            parsedData = JSON.parse(jsonString);
          } catch(e) {
            parsedData = { calories: "-", protein: "-", carbs: "-", fat: "-", details: rawText };
          }

          return Response.json({ data: parsedData }, { headers: corsHeaders });
        } else {
          return Response.json(
            { error: resData.error ? resData.error.message : "เรียกใช้งาน Gemini API ไม่สำเร็จ" },
            { status: 400, headers: corsHeaders }
          );
        }

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
