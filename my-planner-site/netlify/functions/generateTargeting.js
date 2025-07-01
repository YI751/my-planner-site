// /netlify/functions/generateTargeting.js
const { BackgroundFunctions } = require('@netlify/functions');

exports.handler = BackgroundFunctions.handler(async (event) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const requestPayload = JSON.parse(event.body);

  try {
    // This part runs in the background and is not subject to the 10-second timeout.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });
    
    // Log the result from Gemini to the function logs for the user to see.
    const result = await response.json();
    console.log("Generated Targeting Idea:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Background function error:', error);
  }
  
  // No need to return anything to the client for a background function.
  return;
});
