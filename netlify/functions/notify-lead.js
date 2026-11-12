// Netlify function: fires on aspp-lead form submissions
// Sends an auto-text to the lead via Quo API

exports.handler = async (event) => {
  // Only handle POST from Netlify form submissions
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Netlify sends form data under payload.data
  const data = payload.data || payload;
  const { name, phone } = data;

  if (!phone) {
    console.log('No phone number in submission, skipping');
    return { statusCode: 200, body: 'No phone, skipped' };
  }

  // Normalize phone to E.164 — strip everything except digits, prepend +1
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

  const firstName = name ? name.split(' ')[0] : 'there';

  const message = `Hey ${firstName}! This is Linwood with All-Star Poop Patrol 🐾 Thanks for reaching out! I'll be in touch shortly to put together a free quote for you. Feel free to reply here with any questions in the meantime!`;

  const QUO_API_KEY = process.env.QUO_API_KEY;
  if (!QUO_API_KEY) {
    console.error('QUO_API_KEY not set');
    return { statusCode: 500, body: 'QUO_API_KEY missing' };
  }

  try {
    const res = await fetch('https://api.quo.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QUO_API_KEY}`,
      },
      body: JSON.stringify({
        from: '+19198178066',
        to: [e164],
        content: message,
      }),
    });

    const responseText = await res.text();
    console.log(`Quo response ${res.status}:`, responseText);

    if (!res.ok) {
      return { statusCode: 500, body: `Quo error: ${responseText}` };
    }

    return { statusCode: 200, body: 'Message sent' };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: err.message };
  }
};
