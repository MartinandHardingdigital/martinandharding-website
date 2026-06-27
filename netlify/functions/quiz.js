// Netlify serverless function — builds a short prompt from the quiz answers
// and calls the Anthropic API server-side so the key never touches the browser.
//
// Set ANTHROPIC_API_KEY in: Netlify dashboard → Site settings → Environment variables

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured' }),
    };
  }

  try {
    const { plan, answers } = JSON.parse(event.body);

    // Map raw answer values to readable phrases for the prompt
    const goalMap = {
      showcase: 'show what they do and build credibility',
      enquiries: 'get more enquiries and convert visitors into leads',
      sell: 'sell products online and take payments through their website',
    };
    const pagesMap = {
      '1-3': '1–3 pages',
      '5-10': '5–10 pages',
      shop: 'an online shop with many pages',
    };
    const paymentsMap = {
      no: 'does not need online payments',
      yes: 'needs to take card payments online',
    };
    const ongoingMap = {
      no: 'will handle updates themselves after launch',
      yes: 'wants ongoing monthly maintenance support',
    };
    const budgetMap = {
      'under500': 'under £500',
      '500-750': '£500–£750',
      '750plus': '£750 or more',
    };

    const prompt =
      `Write 2–3 warm, friendly sentences for a web design client who has been recommended the "${plan}" plan. ` +
      `Their answers: their main goal is to ${goalMap[answers.goal] || answers.goal}, ` +
      `they need ${pagesMap[answers.pages] || answers.pages}, ` +
      `${paymentsMap[answers.payments] || ''}, ` +
      `their budget is ${budgetMap[answers.budget] || answers.budget}, and ` +
      `they ${ongoingMap[answers.ongoing] || ''}. ` +
      `Briefly explain why this plan suits them. Speak directly to the client. Be warm and encouraging. No bullet points or headings.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API returned ${response.status}`);
    }

    const explanation = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explanation }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
