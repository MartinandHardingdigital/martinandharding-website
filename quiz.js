// Martin & Harding Digital — AI Plan Finder
// Quiz-specific logic only. Shared utilities (nav, cookies, year) live in script.js.

(function () {
  'use strict';

  const QUIZ_ENDPOINT = '/.netlify/functions/quiz';

  const QUESTIONS = [
    {
      id: 'goal',
      title: "What's the main goal of your website?",
      options: [
        { value: 'showcase',  label: 'Show what I do',      sub: 'A professional presence I can share with confidence' },
        { value: 'enquiries', label: 'Get enquiries',        sub: 'Attract leads and turn visitors into contacts' },
        { value: 'sell',      label: 'Sell products online', sub: 'Take orders and payments through my website' },
        { value: 'above_all', label: 'Above all of these',   sub: 'All of the above — I need a full-featured site' },
      ],
    },
    {
      id: 'pages',
      title: 'Roughly how many pages do you need?',
      options: [
        { value: '1-3',  label: '1–3 pages',        sub: 'Home, about, contact — the essentials' },
        { value: '5-10', label: '5–10 pages',        sub: 'Multiple services, a team page, or a blog' },
        { value: 'shop', label: "Lots — it's a shop", sub: 'Product pages, categories, a checkout' },
      ],
    },
    {
      id: 'payments',
      title: 'Do you need to take payments on the site?',
      options: [
        { value: 'no',            label: 'No',                                                    sub: 'No payments needed' },
        { value: 'sell_products', label: 'Yes — selling products (a shop)',                  sub: 'Full online shop with checkout' },
        { value: 'bookings',      label: 'Yes — taking payment for bookings or appointments', sub: 'Clients pay to book slots or services' },
        { value: 'other',         label: 'Yes — something else',                             sub: 'Deposits, one-off payments, or similar' },
      ],
    },
    {
      id: 'features',
      title: 'Do you need any of these advanced features?',
      options: [
        { value: 'simple',   label: 'Simple add-on',  sub: 'Live chat, newsletter signup, social feeds · £149' },
        { value: 'advanced', label: 'Advanced add-on', sub: 'Booking systems, memberships, custom integrations · £299' },
        { value: 'none',     label: 'None of these',  sub: 'Just a great website' },
      ],
    },
    {
      id: 'care',
      title: 'Do you want us to look after the site after launch?',
      options: [
        { value: 'no',      label: 'No, just build it',                          sub: "I'll handle updates myself" },
        { value: 'light',   label: 'Yes — light touch',                     sub: 'Occasional small fixes · £99/month' },
        { value: 'regular', label: 'Yes — regular updates and support',     sub: 'Ongoing updates and help · £149/month' },
        { value: 'full',    label: 'Yes — full ongoing growth, SEO and content', sub: 'Full service, SEO, content · £399/month' },
      ],
    },
    {
      id: 'budget',
      title: "What's your rough budget for the build?",
      options: [
        { value: 'under500', label: 'Under £500',   sub: 'Tight budget, needs to be lean' },
        { value: '500-750',  label: '£500–£750',    sub: 'Room for a solid marketing website' },
        { value: '750plus',  label: '£750+',         sub: 'Ready to invest for the right result' },
      ],
    },
  ];

  // ── Plan catalogue ────────────────────────────────────────────
  const PLAN = {
    starter: {
      name: 'Starter',
      price: 399.50,
      priceDisplay: '£399.50',
      was: '£799',
      meta: '1–3 pages · launches in 3–5 days',
      features: [
        'Clean, mobile-friendly design',
        'Contact form',
        'Basic SEO setup',
        'Google Analytics',
        'SSL included',
      ],
      fallback: "Based on your answers, our Starter package is a great fit. It gives you everything you need for a professional online presence — clean design, mobile-friendly, and live in just a few days.",
    },
    standard: {
      name: 'Standard',
      price: 599.50,
      priceDisplay: '£599.50',
      was: '£1,199',
      meta: '5–10 pages · launches in 5–7 days',
      features: [
        'Everything in Starter',
        'Multiple service or product pages',
        'Contact forms with lead capture',
        'On-page SEO foundations',
        'Blog-ready',
      ],
      fallback: "Our Standard package is the right fit for where you want to go. You get a full marketing website with multiple pages, proper SEO foundations, and contact forms built to convert visitors into enquiries.",
    },
    ecommerce: {
      name: 'E-commerce',
      price: 899.50,
      priceDisplay: '£899.50',
      was: '£1,799',
      meta: 'Online shop · launches in 7–10 days',
      features: [
        'Full online shop setup',
        'Secure checkout & card payments',
        'Product management',
        'Order notifications',
        'Mobile-optimised checkout',
      ],
      fallback: "An e-commerce build is exactly right for where you want to go. We'll set up a complete online shop with a secure checkout so you can start selling straight away.",
    },
  };

  // ── Add-on catalogue ──────────────────────────────────────────
  const ADDON = {
    simple: {
      name: 'Simple add-on',
      price: 149,
      priceDisplay: '£149',
      desc: 'Live chat, newsletter signup, or social feed integration',
    },
    advanced: {
      name: 'Advanced add-on',
      price: 299,
      priceDisplay: '£299',
      desc: 'Booking/reservation system, memberships, or custom integration',
    },
    booking_payment: {
      name: 'Booking system + payments',
      price: 299,
      priceDisplay: '£299',
      desc: 'Booking/reservation system with integrated payment processing',
    },
    payment_integration: {
      name: 'Payment integration',
      price: 299,
      priceDisplay: '£299',
      desc: 'Custom payment flow for deposits, one-off charges, or similar',
    },
  };

  // ── Care tiers ────────────────────────────────────────────────
  const CARE = {
    no:      null,
    light:   { name: 'Basic Care',  priceDisplay: '£99/month',  price: 99,  desc: "You'd like occasional help after launch — Basic Care covers hosting, security updates, and small content changes so your site stays in great shape without you lifting a finger." },
    regular: { name: 'Growth Care', priceDisplay: '£149/month', price: 149, desc: "You're after regular support after launch. Growth Care includes all updates, monthly SEO checks, and ongoing content tweaks to keep your site working hard for you." },
    full:    { name: 'Pro Care',    priceDisplay: '£399/month', price: 399, desc: "You want full ongoing support — a great call. Pro Care covers everything: content, SEO, strategy, and proactive improvements every month." },
  };

  // ── Budget limits ─────────────────────────────────────────────
  const BUDGET_MAX = { 'under500': 500, '500-750': 750, '750plus': Infinity };

  // ── State ─────────────────────────────────────────────────────
  let currentQuestion = 0;
  let answers = {};
  let autoAdvanceTimer = null;

  // ── DOM refs ──────────────────────────────────────────────────
  const quizCard    = document.getElementById('quizCard');
  const progressBar = document.getElementById('quizProgressBar');
  const quizNav     = document.getElementById('quizNav');
  const backBtn     = document.getElementById('quizBackBtn');
  const nextBtn     = document.getElementById('quizNextBtn');

  function setProgress(pct) { progressBar.style.width = pct + '%'; }

  function fadeTransition(cb) {
    quizCard.style.opacity = '0';
    setTimeout(() => { cb(); quizCard.style.opacity = '1'; }, 250);
  }

  // ── Plan selection ────────────────────────────────────────────
  function pickPlan(ans) {
    if (ans.goal === 'sell' || ans.pages === 'shop' || ans.payments === 'sell_products') return 'ecommerce';
    if (ans.goal === 'above_all' || ans.payments === 'bookings' || ans.payments === 'other' || ans.pages === '5-10') return 'standard';
    if (ans.pages === '1-3') return 'starter';
    return 'standard';
  }

  // ── Add-on selection ──────────────────────────────────────────
  function buildAddons(ans, planKey) {
    const list = [];
    let hasAdvancedFromPayments = false;

    if (planKey !== 'ecommerce') {
      if (ans.payments === 'bookings') {
        list.push(ADDON.booking_payment);
        hasAdvancedFromPayments = true;
      } else if (ans.payments === 'other') {
        list.push(ADDON.payment_integration);
        hasAdvancedFromPayments = true;
      }
    }

    const feature = ans.features || 'none';
    if (feature === 'simple') list.push(ADDON.simple);
    if (feature === 'advanced' && !hasAdvancedFromPayments) list.push(ADDON.advanced);

    return list;
  }

  // ── Budget check ──────────────────────────────────────────────
  // Always returns { ideal, withinBudget, isMismatch }.
  // isMismatch=false: ideal plan fits budget — withinBudget === ideal, show one card.
  // isMismatch=true: budget exceeded — withinBudget is a stripped-down option, show two cards.
  //
  // Greedy cascade: try current plan with fewer add-ons, then Standard (if ideal was E-commerce),
  // then Starter. Always produces a real calculated price.
  function checkBudget(planKey, addons, budgetKey) {
    const budgetMax  = BUDGET_MAX[budgetKey] || Infinity;
    const buildPrice = PLAN[planKey].price;
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const idealTotal = buildPrice + addonTotal;
    const ideal      = { planKey, addons, price: idealTotal };

    if (idealTotal <= budgetMax) {
      return { ideal, withinBudget: ideal, isMismatch: false };
    }

    // Order of plans to attempt when dropping budget, from most to least expensive
    const planOrder  = ['ecommerce', 'standard', 'starter'];
    const startIdx   = planOrder.indexOf(planKey);
    // Sort add-ons descending by price so we drop the most expensive first
    const sorted     = [...addons].sort((a, b) => b.price - a.price);

    for (let pi = startIdx; pi < planOrder.length; pi++) {
      const tryKey   = planOrder[pi];
      const tryPrice = PLAN[tryKey].price;
      // For the current plan we already know skip=0 fails, so start from 1
      const minSkip  = pi === startIdx ? 1 : 0;

      for (let skip = minSkip; skip <= sorted.length; skip++) {
        const kept  = sorted.slice(skip);
        const total = tryPrice + kept.reduce((s, a) => s + a.price, 0);
        if (total <= budgetMax) {
          return {
            ideal,
            withinBudget: {
              planKey:       tryKey,
              addons:        kept,
              price:         total,
              dropped:       sorted.slice(0, skip).map(a => a.name),
              planDowngraded: tryKey !== planKey,
            },
            isMismatch: true,
          };
        }
      }
    }

    // Safety fallback — Starter alone always fits every tier in practice
    return {
      ideal,
      withinBudget: { planKey: 'starter', addons: [], price: PLAN.starter.price, dropped: addons.map(a => a.name), planDowngraded: planKey !== 'starter' },
      isMismatch: true,
    };
  }

  // ── Render a question ─────────────────────────────────────────
  function renderQuestion(index) {
    clearTimeout(autoAdvanceTimer);

    const q      = QUESTIONS[index];
    const selVal = answers[q.id] || null;

    setProgress(((index + 1) / QUESTIONS.length) * 100);
    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    nextBtn.style.display    = 'none'; // all questions auto-advance; no Next button shown
    quizNav.style.display    = '';

    const optionsHtml = q.options.map(opt => {
      const sel = selVal === opt.value;
      return (
        '<button class="quiz-option' + (sel ? ' selected' : '') + '" ' +
          'data-value="' + opt.value + '" role="radio" aria-checked="' + sel + '" type="button">' +
          '<span class="quiz-option-check" aria-hidden="true"></span>' +
          '<span class="quiz-option-text">' +
            '<span class="quiz-option-label">' + opt.label + '</span>' +
            '<span class="quiz-option-sub">' + opt.sub + '</span>' +
          '</span>' +
        '</button>'
      );
    }).join('');

    quizCard.innerHTML = (
      '<div class="quiz-step">' +
        '<span class="quiz-step-count">Question ' + (index + 1) + ' of ' + QUESTIONS.length + '</span>' +
        '<h2 class="quiz-step-title">' + q.title + '</h2>' +
        '<div class="quiz-options" role="radiogroup" aria-label="' + q.title + '">' +
          optionsHtml +
        '</div>' +
      '</div>'
    );

    quizCard.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        clearTimeout(autoAdvanceTimer);
        answers[q.id] = btn.dataset.value;

        quizCard.querySelectorAll('.quiz-option').forEach(b => {
          const s = b === btn;
          b.classList.toggle('selected', s);
          b.setAttribute('aria-checked', s);
        });

        autoAdvanceTimer = setTimeout(advance, 600);
      });
    });
  }

  // ── Navigation ────────────────────────────────────────────────
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

  // ── Finish: pick plan, call AI, show result ───────────────────
  async function finish() {
    const planKey    = pickPlan(answers);
    const addons     = buildAddons(answers, planKey);
    const careTier   = CARE[answers.care] || null;
    const totalPrice = PLAN[planKey].price + addons.reduce((s, a) => s + a.price, 0);
    const budget     = checkBudget(planKey, addons, answers.budget);

    setProgress(100);
    quizNav.style.display = 'none';

    fadeTransition(() => {
      quizCard.innerHTML = (
        '<div class="quiz-loading">' +
          '<div class="quiz-loading-dots">' +
            '<div class="quiz-loading-dot"></div>' +
            '<div class="quiz-loading-dot"></div>' +
            '<div class="quiz-loading-dot"></div>' +
          '</div>' +
          '<p class="quiz-loading-title">Finding your perfect plan…</p>' +
          '<p class="quiz-loading-sub">Personalising your recommendation</p>' +
        '</div>'
      );
    });

    let explanation = PLAN[planKey].fallback;

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(QUIZ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:         PLAN[planKey].name,
          buildPrice:   PLAN[planKey].priceDisplay,
          addons:       addons.map(a => ({ name: a.name, price: a.priceDisplay })),
          upfrontTotal: '£' + totalPrice.toFixed(2),
          careTier:     careTier ? { name: careTier.name, price: careTier.priceDisplay } : null,
          answers,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) explanation = data.explanation;
      }
    } catch (_) {
      // Timeout or network error — fallback text already set
    }

    fadeTransition(() => showResult(planKey, addons, careTier, totalPrice, budget, explanation));
  }

  // ── Result screen ─────────────────────────────────────────────
  function showResult(planKey, addons, careTier, totalPrice, budget, explanation) {
    const plan = PLAN[planKey];
    const wb   = budget.withinBudget;
    const wbTotal = PLAN[wb.planKey].price + wb.addons.reduce((s, a) => s + a.price, 0);

    // ── Shared helpers ────────────────────────────────────────

    // Dark itemised summary box.
    // Upfront total row only shown when there are add-ons (otherwise build price is the total).
    // Care MRR row always appended if a care plan was chosen.
    function summaryBox(pk, addonsArr, upfront) {
      const p = PLAN[pk];
      let rows = '<div class="quiz-result-sum-row"><span>' + p.name + ' build</span><strong>' + p.priceDisplay + '</strong></div>';
      addonsArr.forEach(a => {
        rows += '<div class="quiz-result-sum-row"><span>' + a.name + '</span><strong>' + a.priceDisplay + '</strong></div>';
      });
      if (addonsArr.length > 0) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-total"><span><strong>Upfront total</strong></span><strong>£' + upfront.toFixed(2) + '</strong></div>';
      }
      if (careTier) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-mrr"><span>' + careTier.name + '</span><strong>' + careTier.priceDisplay + '</strong></div>';
      }
      return '<div class="quiz-result-summary-box">' + rows + '</div>';
    }

    function featuresList(pk) {
      return '<ul class="quiz-result-list">' + PLAN[pk].features.map(f => '<li>' + f + '</li>').join('') + '</ul>';
    }

    function addonsBlock(arr) {
      return arr.map(a =>
        '<div class="quiz-result-addon">' +
          '<div class="quiz-result-addon-row">' +
            '<span class="quiz-result-addon-name">' + a.name + '</span>' +
            '<span class="quiz-result-addon-price">' + a.priceDisplay + '</span>' +
          '</div>' +
          '<p class="quiz-result-addon-desc">' + a.desc + '</p>' +
        '</div>'
      ).join('');
    }

    // What was changed to reach the within-budget option
    function droppedNote() {
      const parts = [];
      if (wb.planDowngraded) parts.push(plan.name + ' plan reduced to ' + PLAN[wb.planKey].name);
      if (wb.dropped && wb.dropped.length) parts.push(wb.dropped.join(' and ') + ' removed');
      return parts.length
        ? '<p class="quiz-result-rec-note">' + parts.join('; ') + ' to stay within budget.</p>'
        : '';
    }

    // Builds a JSON-serialisable plan text stored in sessionStorage for the contact form.
    // items: array of { label, value, isTotal?, isMrr? }
    // text: plain-text version pre-filled into the message textarea
    function buildPlanText(pk, arr, upfront) {
      const p     = PLAN[pk];
      const items = [];

      items.push({ label: p.name + ' build', value: p.priceDisplay });
      arr.forEach(a => items.push({ label: a.name, value: a.priceDisplay }));
      if (arr.length > 0) {
        items.push({ label: 'Upfront total', value: '£' + upfront.toFixed(2), isTotal: true });
      }
      if (careTier) {
        items.push({ label: careTier.name, value: careTier.priceDisplay, isMrr: true });
      }

      const lines = ["I'd like to enquire about the following plan from your quiz:", ''];
      items.forEach(item => lines.push(item.label + ' — ' + item.value));

      return JSON.stringify({ items, text: lines.join('\n') });
    }

    // ── Care description box ──────────────────────────────────
    const careHtml = careTier
      ? '<div class="quiz-result-care-box">' +
          '<div class="quiz-result-care-name">' + careTier.name +
            '<span class="quiz-result-care-price">' + careTier.priceDisplay + '</span>' +
          '</div>' +
          '<p class="quiz-result-care-reason">' + careTier.desc + '</p>' +
        '</div>'
      : '';

    // ── CTA section with "Get in touch" enquiry flow ──────────
    const ctasHtml =
      '<div class="quiz-result-ctas">' +
        '<div id="quizEnquireWrap">' +
          '<button type="button" class="btn btn-dark btn-block" id="quizEnquireBtn">Get in touch →</button>' +
        '</div>' +
        '<a href="pricing.html" class="btn btn-ghost btn-block btn-sm">View all pricing</a>' +
        '<a href="quiz.html" class="quiz-restart">← Start again</a>' +
      '</div>';

    // ── Build result HTML ────────────────────────────────────
    let recsHtml;

    if (!budget.isMismatch) {
      // Single card: plan fits budget — one recommendation with a "fits your budget" badge
      const title = plan.name + (addons.length ? ' + add-ons' : '');
      recsHtml =
        '<div class="quiz-result-solo">' +
          '<div class="quiz-result-rec quiz-result-rec--ideal">' +
            '<div class="quiz-result-rec-header-row">' +
              '<span class="quiz-result-rec-label">Your recommendation</span>' +
              '<span class="quiz-result-rec-budget-ok">✓ Fits your budget</span>' +
            '</div>' +
            '<h3 class="quiz-result-rec-title">' + title + '</h3>' +
            featuresList(planKey) +
            (addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(addons) + '</div>' : '') +
            summaryBox(planKey, addons, totalPrice) +
          '</div>' +
        '</div>';
    } else {
      // Two cards: ideal plan exceeds budget — show budget-friendly option and best overall
      const wbTitle    = PLAN[wb.planKey].name + (wb.addons.length ? ' + add-ons' : '');
      const idealTitle = plan.name + (addons.length ? ' + add-ons' : '');

      const wbCard =
        '<div class="quiz-result-rec">' +
          '<span class="quiz-result-rec-label">Within your budget</span>' +
          '<h3 class="quiz-result-rec-title">' + wbTitle + '</h3>' +
          droppedNote() +
          featuresList(wb.planKey) +
          (wb.addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(wb.addons) + '</div>' : '') +
          summaryBox(wb.planKey, wb.addons, wbTotal) +
        '</div>';

      const idealCard =
        '<div class="quiz-result-rec quiz-result-rec--ideal">' +
          '<span class="quiz-result-rec-label">Best for your needs</span>' +
          '<h3 class="quiz-result-rec-title">' + idealTitle + '</h3>' +
          featuresList(planKey) +
          (addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(addons) + '</div>' : '') +
          summaryBox(planKey, addons, totalPrice) +
        '</div>';

      recsHtml = '<div class="quiz-result-recs">' + wbCard + idealCard + '</div>';
    }

    const html =
      '<div class="quiz-results">' +
        '<div class="quiz-result-header">' +
          '<div class="quiz-result-badge">✓ Your personalised recommendation</div>' +
          '<p class="quiz-result-intro">' + explanation + '</p>' +
        '</div>' +
        recsHtml +
        careHtml +
        ctasHtml +
      '</div>';

    quizCard.innerHTML = html;

    // ── Wire up enquiry CTA ───────────────────────────────────
    document.getElementById('quizEnquireBtn').addEventListener('click', () => {
      if (budget.isMismatch) {
        // Show a plan-choice prompt before navigating
        const wrap       = document.getElementById('quizEnquireWrap');
        const wbLabel    = PLAN[wb.planKey].name + (wb.addons.length ? ' + add-ons' : '') + ' (budget option)';
        const idealLabel = plan.name + (addons.length ? ' + add-ons' : '') + ' (best option)';

        wrap.innerHTML =
          '<p class="quiz-plan-choice-label">Which plan would you like to enquire about?</p>' +
          '<button type="button" class="btn btn-ghost btn-block quiz-plan-choice" data-which="within">Enquire about ' + wbLabel + '</button>' +
          '<button type="button" class="btn btn-dark btn-block quiz-plan-choice" data-which="ideal">Enquire about ' + idealLabel + '</button>';

        wrap.querySelectorAll('.quiz-plan-choice').forEach(btn => {
          btn.addEventListener('click', () => {
            const which = btn.dataset.which;
            const pk    = which === 'within' ? wb.planKey : planKey;
            const ao    = which === 'within' ? wb.addons  : addons;
            const tot   = which === 'within' ? wbTotal    : totalPrice;
            sessionStorage.setItem('quizPlan', buildPlanText(pk, ao, tot));
            window.location.href = 'index.html#contact';
          });
        });
      } else {
        sessionStorage.setItem('quizPlan', buildPlanText(planKey, addons, totalPrice));
        window.location.href = 'index.html#contact';
      }
    });
  }

  // ── Boot ──────────────────────────────────────────────────────
  backBtn.addEventListener('click', back);
  nextBtn.addEventListener('click', advance);
  renderQuestion(0);

}());
