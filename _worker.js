export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // API: วิเคราะห์อาหาร
    // =========================
    if (
      url.pathname === "/api/analyze" &&
      request.method === "POST"
    ) {
      try {
        const data = await request.json();

        if (!data.image) {
          return json({
            error: "ไม่พบรูปอาหาร"
          }, 400);
        }

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },

            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type:
                          data.mimeType || "image/jpeg",
                        data: data.image
                      }
                    },
                    {
                      text: `
วิเคราะห์อาหารจากภาพนี้

ให้ประเมิน:
- ชื่ออาหาร
- ปริมาณโดยประมาณ
- calories
- protein
- carbohydrates
- fat

ถ้ามีอาหารหลายอย่างในภาพ ให้ประเมินรวมกัน

ตอบเป็น JSON เท่านั้น:

{
  "foodName": "ชื่ออาหาร",
  "portion": "ปริมาณโดยประมาณ",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0
}

หน่วย:
calories = kcal
protein = g
carbs = g
fat = g
`
                    }
                  ]
                }
              ],

              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return json({
            error: "Gemini API error",
            details: result
          }, response.status);
        }

        const text =
          result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          return json({
            error: "AI ไม่ส่งผลลัพธ์กลับมา"
          }, 500);
        }

        const nutrition = JSON.parse(text);

        return json(nutrition);

      } catch (error) {

        return json({
          error: "เกิดข้อผิดพลาดในการวิเคราะห์",
          details: error.message
        }, 500);
      }
    }


    // =========================
    // WEBSITE
    // =========================

    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {

      return new Response(
        `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport"
            content="width=device-width,initial-scale=1">
          <title>FoodLens AI</title>
        </head>

        <body style="
          margin:0;
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#071c17;
          color:white;
          font-family:Arial,sans-serif;
          text-align:center;
          padding:30px;
        ">

          <div>
            <div style="font-size:60px">⚠️</div>

            <h1>เว็บไซต์โหลดไม่ได้</h1>

            <p style="color:#9bb3ab">
              Cloudflare ไม่สามารถโหลด Static Assets ได้
            </p>

            <pre style="
              color:#ff9999;
              white-space:pre-wrap;
            ">${escapeHtml(error.message)}</pre>
          </div>

        </body>
        </html>
        `,
        {
          status: 500,
          headers: {
            "Content-Type":
              "text/html; charset=UTF-8"
          }
        }
      );
    }
  }
};


// =========================
// JSON helper
// =========================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8"
      }
    }
  );
}


// =========================
// HTML escape
// =========================

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
