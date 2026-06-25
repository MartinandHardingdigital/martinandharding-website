// ============================================================
//  Martin & Harding Digital — AI Plan Finder
//
//  Uses a Netlify Function proxy so the API key never touches
//  the browser. Set ANTHROPIC_API_KEY in the Netlify dashboard:
//  Site settings → Environment variables → Add variable
// ============================================================

// Not used when QUIZ_ENDPOINT is set — the key lives in Netlify.
const ANTHROPIC_API_KEY = '';

// Requests go to the serverless function, which adds the key server-side.
const QUIZ_ENDPOINT = '/.netlify/functions/quiz';

// ─── Questions ──────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'business',
    type: 'textarea',
    count: '1 of 5',
    title: 'What does your business do?',
    sub: 'A sentence or two is enough — this helps us personalise your plan.',
    placeholder: 'e.g. I run a hair salon in Manchester and want to attract more local clients',
  },
  {
    id: 'goal',
    type: 'single',
    count: '2 of 5',
    title: "What's your main goal with this website?",
    sub: 'Pick the one that matters most right now.',
    options: [
      { value: 'google',   icon: '🔍', label: 'Get found on Google',         sub: 'Show up when locals search for what I offer' },
      { value: 'showcase', icon: '🎨', label: 'Showcase my work',             sub: 'A portfolio or gallery that wins me clients' },
      { value: 'sell',     icon: '🛍️', label: 'Sell products online',         sub: 'Take payments and manage orders through my site' },
      { value: 'bookings', icon: '📅', label: 'Take bookings online',         sub: 'Let customers book appointments or reserve spots' },
      { value: 'presence', icon: '✨', label: 'Get a professional presence',  sub: 'A site I can be proud of and share with confidence' },
    ],
  },
  {
    id: 'features',
    type: 'multi',
    count: '3 of 5',
    title: 'Do you need any of these features?',
    sub: 'Select everything that applies — or the last option if you just need a great website.',
    options: [
      { value: 'shop',     icon: '🛒', label: 'Online shop' },
      { value: 'booking',  icon: '📆', label: 'Booking system' },
      { value: 'payments', icon: '💳', label: 'Online payments' },
      { value: 'blog',     icon: '✍️', label: 'Blog or news section' },
      { value: 'chat',     icon: '💬', label: 'Live chat widget' },
      { value: 'social',   icon: '📱', label: 'Social media feed' },
      { value: 'none',     icon: '✅', label: 'None — just a great website' },
    ],
  },
  {
    id: 'size',
    type: 'single',
    count: '4 of 5',
    title: 'How big does your site need to be?',
    sub: "Not sure? Pick the last option and we'll work it out for you.",
    options: [
      { value: 'small',  icon: '🏠', label: '1–3 pages',             sub: 'Home, about, and contact. Simple and clean.' },
      { value: 'medium', icon: '🏢', label: '4–6 pages',             sub: 'Services, gallery, testimonials — the full picture.' },
      { value: 'large',  icon: '🏙️', label: '7 or more pages',      sub: 'Multiple services, team, blog, and more.' },
      { value: 'unsure', icon: '🤔', label: 'Not sure — help me decide', sub: "We'll recommend based on your goals and business." },
    ],
  },
  {
    id: 'support',
    type: 'single',
    count: '5 of 5',
    title: 'Would you like monthly support after launch?',
    sub: 'All plans are month-to-month — no contracts, cancel any time.',
    options: [
      { value: 'yes',    icon: '🙌', label: 'Yes — look after it for me',  sub: 'Updates, SEO, security, and peace of mind every month' },
      { value: 'no',     icon: '🚀', label: 'Just the build for now',      sub: "I'll handle it, or add support whenever I'm ready" },
      { value: 'unsure', icon: '💭', label: 'Tell me what\'s included',    sub: 'Include your best recommendation in my plan' },
    ],
  },
];

// ─── State ───────────────────────────────────────────────────
let currentStep = 0;
const answers = {};

// ─── DOM ─────────────────────────────────────────────────────
const quizWrap       = document.getElementById('quizWrap');
const quizCard       = document.getElementById('quizCard');
const quizNav        = document.getElementById('quizNav');
const quizProgressBar = document.getElementById('quizProgressBar');
const quizBack       = document.getElementById('quizBack');
const quizNext       = document.getElementById('quizNext');

// ─── Helpers ─────────────────────────────────────────────────
function setProgress(pct) {
  quizProgressBar.style.width = `${Math.min(100, pct)}%`;
}

function fadeTransition(fn) {
  quizCard.style.transition = 'opacity .16s ease';
  quizCard.style.opacity = '0';
  setTimeout(() => {
    fn();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      quizCard.style.transition = 'opacity .3s ease';
      quizCard.style.opacity = '1';
    }));
  }, 170);
}

// ─── Rendering ───────────────────────────────────────────────
function renderStep(index) {
  const q = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  quizBack.style.visibility = index === 0 ? 'hidden' : 'visible';
  quizNext.textContent = isLast ? 'Get my plan →' : 'Next →';

  fadeTransition(() => {
    quizCard.innerHTML = buildStepHTML(q);
    attachEvents(q);
    validateStep(q);
    setProgress((index / QUESTIONS.length) * 100);
  });
}

function buildStepHTML(q) {
  let body = '';

  if (q.type === 'textarea') {
    const saved = answers[q.id] || '';
    body = `
      <div class="quiz-textarea-wrap">
        <textarea class="quiz-textarea" id="quizTextarea" placeholder="${q.placeholder}"
          rows="4" maxlength="500">${saved}</textarea>
        <span class="quiz-char-count"><span id="quizCharCount">${saved.length}</span>/500</span>
      </div>`;

  } else if (q.type === 'single') {
    body = `<div class="quiz-options">${q.options.map(o => `
      <button class="quiz-option${answers[q.id] === o.value ? ' selected' : ''}" data-value="${o.value}">
        <span class="quiz-option-icon">${o.icon}</span>
        <span class="quiz-option-text">
          <span class="quiz-option-label">${o.label}</span>
          <span class="quiz-option-sub">${o.sub}</span>
        </span>
        <span class="quiz-option-check"></span>
      </button>`).join('')}</div>`;

  } else if (q.type === 'multi') {
    const sel = answers[q.id] || [];
    body = `<div class="quiz-options quiz-options-multi">${q.options.map(o => `
      <button class="quiz-option${sel.includes(o.value) ? ' selected' : ''}" data-value="${o.value}">
        <span class="quiz-option-icon">${o.icon}</span>
        <span class="quiz-option-label">${o.label}</span>
        <span class="quiz-option-check"></span>
      </button>`).join('')}</div>`;
  }

  return `
    <div class="quiz-step">
      <span class="quiz-step-count">Question ${q.count}</span>
      <h2 class="quiz-step-title">${q.title}</h2>
      <p class="quiz-step-sub">${q.sub}</p>
      ${body}
    </div>`;
}

// ─── Events ──────────────────────────────────────────────────
function attachEvents(q) {
  if (q.type === 'textarea') {
    const ta      = document.getElementById('quizTextarea');
    const counter = document.getElementById('quizCharCount');
    ta.addEventListener('input', () => {
      answers[q.id]     = ta.value;
      counter.textContent = ta.value.length;
      validateStep(q);
    });

  } else if (q.type === 'single') {
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        answers[q.id] = btn.dataset.value;
        validateStep(q);
        if (currentStep < QUESTIONS.length - 1) setTimeout(advance, 380);
      });
    });

  } else if (q.type === 'multi') {
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        if (val === 'none') {
          document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          answers[q.id] = ['none'];
        } else {
          const noneBtn = document.querySelector('.quiz-option[data-value="none"]');
          if (noneBtn) noneBtn.classList.remove('selected');
          btn.classList.toggle('selected');
          answers[q.id] = [...document.querySelectorAll('.quiz-option.selected')].map(b => b.dataset.value);
        }
        validateStep(q);
      });
    });
  }
}

function validateStep(q) {
  let ok = false;
  if (q.type === 'textarea') ok = (answers[q.id] || '').trim().length >= 10;
  else if (q.type === 'single') ok = !!answers[q.id];
  else if (q.type === 'multi')  ok = (answers[q.id] || []).length > 0;
  quizNext.disabled    = !ok;
  quizNext.style.opacity = ok ? '1' : '0.45';
}

// ─── Navigation ──────────────────────────────────────────────
function advance() {
  if (currentStep < QUESTIONS.length - 1) {
    currentStep++;
    renderStep(currentStep);
  } else {
    runAI();
  }
}

quizBack.addEventListener('click', () => {
  if (currentStep > 0) { currentStep--; renderStep(currentStep); }
});
quizNext.addEventListener('click', advance);

// ─── AI ──────────────────────────────────────────────────────
async function runAI() {
  setProgress(100);
  quizNav.style.display = 'none';

  fadeTransition(() => {
    quizCard.innerHTML = `
      <div class="quiz-loading">
        <div class="quiz-loading-dots">
          <div class="quiz-loading-dot"></div>
          <div class="quiz-loading-dot"></div>
          <div class="quiz-loading-dot"></div>
        </div>
        <h3 class="quiz-loading-title">Building your plan...</h3>
        <p class="quiz-loading-sub">Our AI is putting together your personalised recommendation.</p>
      </div>`;
  });

  if (ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY' && !QUIZ_ENDPOINT) {
    setTimeout(() => showError('API key not configured. Add your Anthropic API key to quiz.js to enable AI recommendations.'), 600);
    return;
  }

  try {
    const endpoint = QUIZ_ENDPOINT || 'https://api.anthropic.com/v1/messages';
    const headers  = { 'Content-Type': 'application/json' };
    if (!QUIZ_ENDPOINT) {
      headers['x-api-key']                               = ANTHROPIC_API_KEY;
      headers['anthropic-version']                        = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        messages: [{ role: 'user', content: buildPrompt() }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    let raw = (data.content[0].text || '').trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    showResults(JSON.parse(raw));
  } catch (err) {
    console.error('Quiz error:', err);
    showError();
  }
}

function buildPrompt() {
  const goalLabels = {
    google:   'Get found on Google — show up when locals search for my services',
    showcase: 'Showcase my work — portfolio or gallery for potential clients',
    sell:     'Sell products online — take payments and manage orders',
    bookings: 'Take bookings or appointments — let customers book directly',
    presence: 'Get a professional online presence',
  };
  const sizeLabels = {
    small:  '1–3 pages',
    medium: '4–6 pages',
    large:  '7+ pages',
    unsure: 'Not sure — recommend based on goals',
  };
  const supportLabels = {
    yes:    'Yes — ongoing monthly support',
    no:     'Just the build for now',
    unsure: 'Not sure — include your best recommendation',
  };

  const feats     = answers.features || [];
  const featsText = feats.includes('none') || feats.length === 0
    ? 'None beyond a great website'
    : feats.join(', ');

  return `You are an expert advisor for Martin & Harding Digital, a UK web design agency. Recommend the perfect plan for this client.

AVAILABLE PLANS:
Website Builds (50% off, first 100 customers):
- Starter £399 (was £798): 1–3 pages, 3–5 days. Mobile-friendly site, contact form, basic SEO, Google Analytics, SSL.
- Growth £599 (was £1,198): 5 pages, 5–7 days. Everything in Starter + on-page SEO, Google Maps embed, blog (3 starter posts), social links.
- Pro £899 (was £1,798): up to 12 pages, 10–14 days. Everything in Growth + booking/reservation system (ALREADY INCLUDED — do not add as add-on), social feed, Core Web Vitals tuning, schema markup, custom domain setup.
- Custom (quote required): E-commerce stores, web apps, member portals.

Integration Add-ons (stackable on any package):
- Standard Integration £150: Live chat tools (Tawk.to/Tidio), Google Maps/calendar embeds, social media feed displays.
- Complex Integration £300: Booking/reservation systems, payment gateways (Stripe/PayPal), CRM connections (HubSpot/Zoho), member/portal setups.

Monthly Care Plans (month-to-month, no lock-in, 50% off):
- Basic Care £99/mo (was £198): 2 hrs/month. Hosting & plugin updates, security monitoring, text & image edits, quarterly report.
- Growth Care £199/mo (was £398): 3 hrs/month. Basic + monthly SEO report, Analytics review, 2 blog posts/month, Google Business updates.
- Pro Care £349/mo (was £698): 5 hrs/month. Growth + 4 blog posts/month, quarterly strategy call, same-day priority support.
- SEO Booster £199/mo (was £398, standalone add-on): 4 blog posts/month, local citation building, Google Business optimisation, backlink outreach, weekly rank tracking.

RULES:
- Client wants to sell products (shop/e-commerce goal) → recommend Custom, set build_price to "Custom quote", starting_total to "Custom quote".
- Booking needed + Starter or Growth recommended → add Complex Integration (£300). Pro already includes booking — do NOT add booking add-on for Pro.
- Payment gateway wanted → add Complex Integration (£300) unless Custom is recommended.
- Live chat or social feed wanted → add Standard Integration (£150).
- Goal is "get found on Google" → recommend Growth Care or better; mention SEO Booster if budget allows.
- support = "no" → set care_plan_optional true, still recommend a plan so they know what's available.
- starting_total = build price + all add-on prices as a formatted £ amount. If Custom, use "Custom quote".
- monthly_from = care plan price (e.g. "£199/mo").
- Personalise what_we_build (5 bullet points) to the client's specific business type and goals.

CLIENT ANSWERS:
Business: ${answers.business || 'Not provided'}
Goal: ${goalLabels[answers.goal] || answers.goal || 'Not specified'}
Features needed: ${featsText}
Website size: ${sizeLabels[answers.size] || answers.size || 'Not specified'}
Monthly support: ${supportLabels[answers.support] || answers.support || 'Not specified'}

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation:
{
  "recommended_build": "Growth",
  "build_price": "£599",
  "build_price_was": "£1,198",
  "timeline": "5–7 days",
  "pages": "5 pages",
  "what_we_build": [
    "Homepage that introduces your business and its key services",
    "Services page with clear descriptions and pricing",
    "Gallery showcasing your best work",
    "About page with your story and team",
    "Contact page with form, phone, and Google Maps"
  ],
  "integrations": [
    {"name": "Booking system", "price": "£300", "description": "Let customers book appointments directly from your site"}
  ],
  "care_plan": "Growth Care",
  "care_price": "£199/mo",
  "care_price_was": "£398/mo",
  "care_plan_optional": false,
  "care_reason": "One sentence explaining why this care plan suits their specific goals.",
  "starting_total": "£899",
  "monthly_from": "£199/mo",
  "plan_summary": "Two punchy sentences summarising the full plan, personalised to their business type.",
  "perfect_for": "Short phrase describing who this plan suits"
}`;
}

// ─── Results ─────────────────────────────────────────────────
function showResults(plan) {
  const intHTML = plan.integrations && plan.integrations.length
    ? `<div class="quiz-result-section">
        <span class="quiz-result-label">Add-ons</span>
        ${plan.integrations.map(i => `
          <div class="quiz-result-addon">
            <div class="quiz-result-addon-row">
              <span class="quiz-result-addon-name">${i.name}</span>
              <span class="quiz-result-addon-price">${i.price}</span>
            </div>
            <p class="quiz-result-addon-desc">${i.description}</p>
          </div>`).join('')}
      </div>` : '';

  const optional = plan.care_plan_optional;

  fadeTransition(() => {
    quizCard.innerHTML = `
      <div class="quiz-results">
        <div class="quiz-result-header">
          <span class="quiz-result-badge">✓ Your personalised plan</span>
          <h2 class="quiz-result-title">The <strong>${plan.recommended_build}</strong> package</h2>
          <p class="quiz-result-intro">${plan.plan_summary}</p>
        </div>

        <div class="quiz-result-body">
          <div class="quiz-result-left">
            <div class="quiz-result-section">
              <span class="quiz-result-label">Website build</span>
              <div class="quiz-result-build-name">
                ${plan.recommended_build}
                <span class="quiz-result-build-price">${plan.build_price}</span>
                <span class="quiz-result-build-was">${plan.build_price_was}</span>
              </div>
              <div class="quiz-result-meta">${plan.timeline} &middot; ${plan.pages}</div>
              <ul class="quiz-result-list">
                ${(plan.what_we_build || []).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            ${intHTML}
          </div>

          <div class="quiz-result-right">
            <div class="quiz-result-care-box">
              <span class="quiz-result-label">Monthly care plan${optional ? ' — optional' : ''}</span>
              <div class="quiz-result-care-name">
                ${plan.care_plan}
                <span class="quiz-result-care-price">${plan.care_price}</span>
                <span class="quiz-result-care-was">${plan.care_price_was}</span>
              </div>
              <p class="quiz-result-care-reason">${plan.care_reason}</p>
            </div>

            <div class="quiz-result-summary-box">
              <div class="quiz-result-sum-row">
                <span>Build &amp; add-ons</span>
                <strong>${plan.starting_total}</strong>
              </div>
              ${!optional ? `
              <div class="quiz-result-sum-row quiz-result-sum-mrr">
                <span>Then from</span>
                <strong>${plan.monthly_from}</strong>
              </div>` : ''}
            </div>

            <div class="quiz-result-ctas">
              <a href="index.html#contact" class="btn btn-dark btn-block btn-lg">Start with this plan</a>
              <a href="pricing.html" class="btn btn-ghost btn-block">See full pricing</a>
              <button class="btn btn-ghost btn-block quiz-restart" id="quizRestart">Retake the quiz</button>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('quizRestart').addEventListener('click', restartQuiz);
    quizWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ─── Error ───────────────────────────────────────────────────
function showError(msg) {
  fadeTransition(() => {
    quizCard.innerHTML = `
      <div class="quiz-error">
        <span class="quiz-error-icon">⚠️</span>
        <h3>Something went wrong</h3>
        <p>${msg || "We couldn't generate your plan right now. Please <a href='index.html#contact' style='color:var(--blue);font-weight:600'>contact us directly</a> and we'll put a plan together for you."}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-dark" id="quizRetry">Try again</button>
          <button class="btn btn-ghost" id="quizErrBack">← Back to questions</button>
        </div>
      </div>`;

    quizNav.style.display = 'none';

    document.getElementById('quizRetry').addEventListener('click', runAI);
    document.getElementById('quizErrBack').addEventListener('click', () => {
      quizNav.style.display = 'flex';
      currentStep = QUESTIONS.length - 1;
      renderStep(currentStep);
    });
  });
}

// ─── Restart ─────────────────────────────────────────────────
function restartQuiz() {
  currentStep = 0;
  for (const k in answers) delete answers[k];
  quizNav.style.display  = 'flex';
  quizNext.style.display = '';
  renderStep(0);
}

// Expose for onclick attributes in dynamic HTML
window.restartQuiz = restartQuiz;

// ─── Init ────────────────────────────────────────────────────
renderStep(0);
