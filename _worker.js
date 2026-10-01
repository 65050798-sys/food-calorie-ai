export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // API: วิเคราะห์อาหาร
    // =========================
    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const data = await request.json();

        if (!data.image) {
          return new Response(
            JSON.stringify({
              error: "ไม่พบรูปอาหาร"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
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
                        mime_type: data.mimeType || "image/jpeg",
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

ค่าทั้งหมดเป็นเพียงการประมาณจากภาพ
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
          return new Response(
            JSON.stringify({
              error: "Gemini API error",
              details: result
            }),
            {
              status: response.status,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        const text =
          result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          return new Response(
            JSON.stringify({
              error: "AI ไม่ส่งผลลัพธ์กลับมา"
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        const nutrition = JSON.parse(text);

        return new Response(
          JSON.stringify(nutrition),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

      } catch (error) {

        return new Response(
          JSON.stringify({
            error: "เกิดข้อผิดพลาดในการวิเคราะห์",
            details: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    // =========================
    // หน้าเว็บ
    // =========================

    const assetRequest = new Request(
      new URL("/index.html", request.url),
      request
    );

    return env.ASSETS.fetch(assetRequest);
  }
};
