import fs from 'fs';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

async function generate() {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: 'Write a complete playable Python snake game that runs in the terminal using the curses module.'
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const data = await response.json();
  const code = data.choices?.[0]?.message?.content ?? '';
  fs.writeFileSync(new URL('./snake_game.py', import.meta.url), code);
  console.log('Snake game written to snake_game.py');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
