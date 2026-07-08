// Netlify serverless function: builds a short prompt from the quiz result
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
    const { plan, buildPrice, addons, upfrontTotal, careTier, answers } = JSON.parse(event.body);

    const goalMap = {
      showcase:  'show what they do and build credibility',
      enquiries: 'get more enquiries and convert visitors into leads',
      sell:      'sell products online and take payments',
      above_all: 'do all of the above: showcase, enquiries, and selling',
    };
    const pagesMap = {
      '1-3':  '1–3 pages',
      '5-10': '5–10 pages',
      shop:   'an online shop with many pages',
    };
    const paymentsMap = {
      sell_products: 'selling products online',
      bookings:      'taking payment for bookings or appointments',
      other:         'taking deposits or one-off payments',
    };
    const budgetMap = {
      'under500': 'under £500',
      '500-750':  '£500–£750',
      '750plus':  '£750 or more',
    };

    // goal and payments are now arrays (multi-select)
    const goals    = Array.isArray(answers.goal)     ? answers.goal     : [answers.goal].filter(Boolean);
    const payments = Array.isArray(answers.payments) ? answers.payments : [answers.payments].filter(Boolean);

    const goalsStr    = goals.map(g => goalMap[g] || g).join(' and ');
    const paymentsStr = payments.filter(p => p !== 'no').map(p => paymentsMap[p] || p).join(' and ');

    // Build a concise itemised cost summary for the prompt
    let costLines = plan + ' build: ' + buildPrice;
    if (addons && addons.length > 0) {
      costLines += '. Add-ons: ' + addons.map(a => a.name + ' ' + a.price).join(', ');
    }
    costLines += '. Upfront total: ' + upfrontTotal;
    if (careTier) {
      costLines += '. Ongoing: ' + careTier.name + ' ' + careTier.price;
    }

    const prompt =
      'Write 2–3 warm, friendly sentences for a web design client. ' +
      'Recommendation: ' + costLines + '. ' +
      'Their answers: goals are to ' + (goalsStr || 'build a website') + ', ' +
      'needs ' + (pagesMap[answers.pages] || answers.pages) + ', ' +
      (paymentsStr ? paymentsStr + ', ' : '') +
      'budget ' + (budgetMap[answers.budget] || answers.budget) + '. ' +
      'Briefly explain why this suits them. Speak directly. Warm, no bullet points.';

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
      throw new Error(data.error?.message || 'API returned ' + response.status);
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
