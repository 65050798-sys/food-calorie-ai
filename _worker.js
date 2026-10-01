export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // API สำหรับวิเคราะห์รูปอาหาร
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
คุณเป็น AI วิเคราะห์อาหาร

ดูรูปอาหารนี้และประเมินข้อมูลต่อไปนี้:

1. ชื่ออาหาร
2. ปริมาณโดยประมาณ
3. Calories
4. Protein
5. Carbohydrates
6. Fat

ตอบเป็น JSON เท่านั้น ตามรูปแบบนี้:

{
  "foodName": "ชื่ออาหาร",
  "portion": "ปริมาณโดยประมาณ",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0
}

หน่วย:
- calories = kcal
- protein = g
- carbs = g
- fat = g

ถ้าในภาพมีอาหารหลายอย่าง ให้ประเมินรวมทั้งจาน

ค่าทั้งหมดเป็นค่าประมาณจากภาพ
อย่าอ้างว่าตัวเลขแม่นยำ 100%
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

        if (!response.ok) {
          const errorText = await response.text();

          return new Response(
            JSON.stringify({
              error: "Gemini API error",
              details: errorText
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        const result = await response.json();

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

    // ถ้าไม่ใช่ API ให้แสดงเว็บไซต์
    return env.ASSETS.fetch(request);
  }
};
