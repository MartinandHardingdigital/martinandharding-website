// Martin & Harding Digital — AI Plan Finder
// Quiz-specific logic only. Shared utilities (nav, cookies, year) live in script.js.

(function () {
  'use strict';

  const QUIZ_ENDPOINT = '/.netlify/functions/quiz';

  const QUESTIONS = [
    {
      id: 'goal',
      title: "What’s the main goal of your website?",
      options: [
        { value: 'showcase', label: 'Show what I do',       sub: 'A professional presence I can share with confidence' },
        { value: 'enquiries', label: 'Get enquiries',        sub: 'Attract leads and turn visitors into contacts' },
        { value: 'sell',      label: 'Sell products online', sub: 'Take orders and payments through my website' },
      ],
    },
    {
      id: 'pages',
      title: 'Roughly how many pages do you need?',
      options: [
        { value: '1-3',  label: '1–3 pages',        sub: 'Home, about, contact — the essentials' },
        { value: '5-10', label: '5–10 pages',       sub: 'Multiple services, a team page, or a blog' },
        { value: ‘shop’, label: "Lots — it’s a shop", sub: ‘Product pages, categories, a checkout’ },
      ],
    },
    {
      id: 'payments',
      title: 'Do you need to take payments on the site?',
      options: [
        { value: 'no',  label: 'No',  sub: 'Enquiries and bookings only' },
        { value: 'yes', label: 'Yes', sub: 'I need a checkout with card payments' },
      ],
    },
    {
      id: 'ongoing',
      title: 'Do you want us to look after the site after launch?',
      options: [
        { value: 'no',  label: 'No, just build it',  sub: "I'll handle updates myself" },
        { value: 'yes', label: 'Yes, ongoing help',  sub: "I'd like a monthly care plan" },
      ],
    },
    {
      id: 'budget',
      title: "What’s your rough budget?",
      options: [
        { value: 'under500', label: 'Under £500',        sub: 'Tight budget, needs to be lean' },
        { value: '500-750',  label: '£500–£750', sub: 'Room for a solid marketing website' },
        { value: '750plus',  label: '£750+',             sub: 'Ready to invest for the right result' },
      ],
    },
  ];

  const PLAN_DATA = {
    starter: {
      name: 'Starter',
      price: '£399.50',
      was: '£799',
      meta: '1–3 pages · launches in 3–5 days',
      features: [
        'Clean, mobile-friendly design',
        'Contact form',
        'Basic SEO setup',
        'Google Analytics',
        'SSL included',
      ],
      fallback: "Based on your answers, our Starter package is a great fit. It gives you everything you need for a professional online presence — clean design, mobile-friendly, and live in just a few days. Simple, focused, and excellent value.",
    },
    standard: {
      name: 'Standard',
      price: '£599.50',
      was: '£1,199',
      meta: '5–10 pages · launches in 5–7 days',
      features: [
        'Everything in Starter',
        'Multiple service or product pages',
        'Contact forms with lead capture',
        'On-page SEO foundations',
        'Blog-ready',
      ],
      fallback: "Our Standard package is the right fit for where you want to go. You get a full marketing website with multiple pages, proper SEO foundations, and contact forms built to convert visitors into enquiries — a solid platform to grow from.",
    },
    ecommerce: {
      name: 'E-commerce',
      price: 'Custom quote',
      was: null,
      meta: 'Online shop · custom timeline',
      features: [
        'Full online shop setup',
        'Secure checkout & card payments',
        'Product management',
        'Order notifications',
        'Mobile-optimised checkout',
      ],
      fallback: "An e-commerce build is exactly right for where you want to go. We’ll set up a complete online shop with a secure checkout so you can start selling straight away. Every store is a little different, so we’ll put together a custom quote once we’ve talked through the scope.",
    },
  };

  const CARE_PLAN = {
    price: 'from £99.50/mo',
    was: '£199/mo',
    reason: "You mentioned you’d like ongoing help after launch. Our monthly Care Plan covers hosting, security updates, and content changes — so your site stays in great shape without you lifting a finger.",
  };

  // ── State ────────────────────────────────────────────────────
  let currentQuestion = 0;
  let answers = {};
  let autoAdvanceTimer = null;

  // ── DOM refs ─────────────────────────────────────────────────
  const quizCard   = document.getElementById('quizCard');
  const progressBar = document.getElementById('quizProgressBar');
  const quizNav    = document.getElementById('quizNav');
  const backBtn    = document.getElementById('quizBackBtn');
  const nextBtn    = document.getElementById('quizNextBtn');

  // ── Helpers ──────────────────────────────────────────────────
  function setProgress(pct) {
    progressBar.style.width = pct + '%';
  }

  function fadeTransition(callback) {
    quizCard.style.opacity = '0';
    setTimeout(() => {
      callback();
      quizCard.style.opacity = '1';
    }, 250);
  }

  // ── Plan picker (pure logic, no API) ─────────────────────────
  function pickPlan(ans) {
    if (ans.goal === 'sell' || ans.pages === 'shop' || ans.payments === 'yes') return 'ecommerce';
    if (ans.pages === '1-3') return 'starter';
    return 'standard';
  }

  // ── Render question ──────────────────────────────────────────
  function renderQuestion(index) {
    clearTimeout(autoAdvanceTimer);
    const q        = QUESTIONS[index];
    const selected = answers[q.id] || null;

    setProgress(((index + 1) / QUESTIONS.length) * 100);
    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    nextBtn.disabled = !selected;
    quizNav.style.display = '';

    quizCard.innerHTML = `
      <div class="quiz-step">
        <span class="quiz-step-count">Question ${index + 1} of ${QUESTIONS.length}</span>
        <h2 class="quiz-step-title">${q.title}</h2>
        <div class="quiz-options" role="radiogroup" aria-label="${q.title}">
          ${q.options.map(opt => `
            <button
              class="quiz-option${selected === opt.value ? ' selected' : ''}"
              data-value="${opt.value}"
              role="radio"
              aria-checked="${selected === opt.value}"
              type="button"
            >
              <span class="quiz-option-check" aria-hidden="true"></span>
              <span class="quiz-option-text">
                <span class="quiz-option-label">${opt.label}</span>
                <span class="quiz-option-sub">${opt.sub}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>`;

    quizCard.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        clearTimeout(autoAdvanceTimer);
        answers[q.id] = btn.dataset.value;

        quizCard.querySelectorAll('.quiz-option').forEach(b => {
          const isSel = b === btn;
          b.classList.toggle('selected', isSel);
          b.setAttribute('aria-checked', isSel);
        });

        nextBtn.disabled = false;
        autoAdvanceTimer = setTimeout(advance, 600);
      });
    });
  }

  // ── Navigation ───────────────────────────────────────────────
  function advance() {
    clearTimeout(autoAdvanceTimer);
    if (!answers[QUESTIONS[currentQuestion].id]) return;

    if (currentQuestion < QUESTIONS.length - 1) {
      currentQuestion++;
      fadeTransition(() => renderQuestion(currentQuestion));
    } else {
      finish();
    }
  }

  function back() {
    clearTimeout(autoAdvanceTimer);
    if (currentQuestion > 0) {
      currentQuestion--;
      fadeTransition(() => renderQuestion(currentQuestion));
    }
  }

  // ── Finish: pick plan, call AI, show result ──────────────────
  async function finish() {
    const planKey = pickPlan(answers);
    const addCare = answers.ongoing === 'yes';

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
          <p class="quiz-loading-title">Finding your perfect plan&hellip;</p>
          <p class="quiz-loading-sub">Personalising your recommendation</p>
        </div>`;
    });

    let explanation = PLAN_DATA[planKey].fallback;

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(QUIZ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: PLAN_DATA[planKey].name, answers }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.explanation) explanation = data.explanation;
      }
    } catch {
      // API unavailable or timed out — fallback explanation already set above
    }

    fadeTransition(() => showResult(planKey, addCare, explanation));
  }

  // ── Result screen ────────────────────────────────────────────
  function showResult(planKey, addCare, explanation) {
    const plan = PLAN_DATA[planKey];

    const priceHtml = plan.was
      ? `<span class="quiz-result-build-price">${plan.price}</span>&nbsp;<span class="quiz-result-build-was">was ${plan.was}</span>`
      : `<span class="quiz-result-build-price">${plan.price}</span>`;

    const careBoxHtml = addCare ? `
      <div class="quiz-result-care-box">
        <div class="quiz-result-care-name">
          Care Plan
          <span class="quiz-result-care-price">${CARE_PLAN.price}</span>
          <span class="quiz-result-care-was">was ${CARE_PLAN.was}</span>
        </div>
        <p class="quiz-result-care-reason">${CARE_PLAN.reason}</p>
      </div>` : '';

    const careSummaryHtml = addCare ? `
      <div class="quiz-result-sum-row quiz-result-sum-mrr">
        <span>Care Plan</span>
        <strong>${CARE_PLAN.price}</strong>
      </div>` : '';

    quizCard.innerHTML = `
      <div class="quiz-results">
        <div class="quiz-result-header">
          <div class="quiz-result-badge">&#10003; Your recommended plan</div>
          <h2 class="quiz-result-title">${plan.name}</h2>
          <p class="quiz-result-intro">${explanation}</p>
        </div>

        <div class="quiz-result-body">
          <div>
            <div class="quiz-result-section">
              <span class="quiz-result-label">Your build</span>
              <div class="quiz-result-build-name">${plan.name}&nbsp;${priceHtml}</div>
              <div class="quiz-result-meta">${plan.meta}</div>
              <ul class="quiz-result-list">
                ${plan.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="quiz-result-right">
            ${careBoxHtml}
            <div class="quiz-result-summary-box">
              <div class="quiz-result-sum-row">
                <span>Build</span>
                <strong>${plan.price}</strong>
              </div>
              ${careSummaryHtml}
            </div>
            <div class="quiz-result-ctas">
              <a href="index.html#contact" class="btn btn-dark btn-block">Get in touch &rarr;</a>
              <a href="pricing.html" class="btn btn-ghost btn-block btn-sm">View all pricing</a>
              <a href="quiz.html" class="quiz-restart">&larr; Start again</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Boot ─────────────────────────────────────────────────────
  backBtn.addEventListener('click', back);
  nextBtn.addEventListener('click', advance);
  renderQuestion(0);

}());
