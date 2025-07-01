// /netlify/functions/callGemini.js

exports.handler = async function(event) {
  // 環境変数から安全にAPIキーを読み込む
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // ブラウザ（index.html）から送られてきたリクエスト内容
  const requestPayload = JSON.parse(event.body);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      // APIからのエラーレスポンスをそのまま返す
      const errorData = await response.text();
      return {
        statusCode: response.status,
        body: errorData,
      };
    }

    const data = await response.json();

    // 成功したレスポンスをブラウザに返す
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    // ネットワークエラーなど
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error: ' + error.message }),
    };
  }
};