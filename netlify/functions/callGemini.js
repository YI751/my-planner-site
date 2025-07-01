// /netlify/functions/callGemini.js

// 外部ライブラリを require で読み込む
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// プロンプトテキストからURLを抜き出すヘルパー関数
const extractUrlFromPrompt = (prompt) => {
    const urlRegex = /## 参考URL\n(https?:\/\/[^\s]+)/;
    const match = prompt.match(urlRegex);
    return match ? match[1] : null;
};

exports.handler = async function(event) {
  // 環境変数から安全にAPIキーを読み込む
  const apiKey = process.env.GEMINI_API_KEY;
  // 最新のモデルを指定
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  
  let requestPayload;
  try {
      requestPayload = JSON.parse(event.body);
  } catch(e) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  // 元のプロンプトを取得
  let originalPrompt = requestPayload.contents[0].parts[0].text;
  let finalPrompt = originalPrompt;

  // プロンプトからURLを抽出
  const adUrl = extractUrlFromPrompt(originalPrompt);

  // URLがあれば、そのページ内容を取得してプロンプトに追加
  if (adUrl) {
    try {
      // 5秒でタイムアウト設定
      const response = await fetch(adUrl, { timeout: 5000 }); 
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        // scriptとstyleタグを除外し、bodyのテキストを取得
        $('script, style, nav, footer, header').remove();
        // 複数の空白を一つにまとめ、最大4000文字に制限
        const pageText = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 4000); 
        
        if (pageText) {
          finalPrompt += `\n\n## 参考URLのページ内容の抜粋\n${pageText}`;
        }
      }
    } catch (fetchError) {
      // フェッチに失敗しても処理は続行し、コンソールにエラーを出力
      console.error(`URL fetch error for ${adUrl}:`, fetchError.message);
    }
  }

  // 最終的なプロンプトでペイロードを更新
  requestPayload.contents[0].parts[0].text = finalPrompt;

  try {
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      return {
        statusCode: geminiResponse.status,
        body: errorData,
      };
    }

    const data = await geminiResponse.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error: ' + error.message }),
    };
  }
};