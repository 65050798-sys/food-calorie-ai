export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // TEST PAGE
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
          <title>FoodLens AI Test</title>
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
        ">
          <div>
            <div style="font-size:60px">✅</div>
            <h1>Worker ทำงานแล้ว</h1>
            <p>Cloudflare Worker สามารถตอบหน้าเว็บได้</p>
            <p style="color:#8faaa2">
              ขั้นต่อไปจะเชื่อม FoodLens AI กลับเข้าไป
            </p>
          </div>
        </body>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=UTF-8"
          }
        }
      );
    }

    return new Response("Worker OK");
  }
};
