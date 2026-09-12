const https = require('https');
require('dotenv').config();
const key = process.env.GOOGLE_GENAI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const flashModels = json.models.map(m => m.name).filter(n => n.includes('flash'));
      console.log('Available flash models:');
      console.log(flashModels.join('\n'));
    } catch (e) {
      console.log('Error parsing:', e.message);
    }
  });
});
