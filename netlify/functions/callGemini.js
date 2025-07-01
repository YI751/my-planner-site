// /netlify/functions/callGemini.js
const { BackgroundFunctions } = require('@netlify/functions');

exports.handler = BackgroundFunctions.handler(async (event) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const requestPayload = JSON.parse(event.body);

  try {
    // この部分はバックグラウンドで実行されるため、10秒の制限を受けません
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });
    // バックグラウンド処理のため、成功レスポンスを返す必要はありません
  } catch (error) {
    console.error('Background function error:', error);
  }
});