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
      type: 'multi',
      options: [
        { value: 'none',     label: 'None of these',  sub: 'Just a great website' },
        { value: 'simple',   label: 'Simple add-on',  sub: 'Live chat, newsletter signup, social feeds · £149' },
        { value: 'advanced', label: 'Advanced add-on', sub: 'Booking systems, memberships, custom integrations · £299' },
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
        { value: '500-750',  label: '£500–£750', sub: 'Room for a solid marketing website' },
        { value: '750plus',  label: '£750+',         sub: 'Ready to invest for the right result' },
      ],
    },
  ];

  // ── Plan data ─────────────────────────────────────────────────
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
      price: null,
      priceDisplay: 'Custom quote',
      was: null,
      meta: 'Online shop · custom timeline',
      features: [
        'Full online shop setup',
        'Secure checkout & card payments',
        'Product management',
        'Order notifications',
        'Mobile-optimised checkout',
      ],
      fallback: "An e-commerce build is exactly right for where you want to go. We'll set up a complete online shop with a secure checkout so you can start selling straight away. Every store is a little different, so we'll put together a custom quote once we've talked through the scope.",
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

  // ── Plan logic (pure JS, no API) ─────────────────────────────
  function pickPlan(ans) {
    if (ans.goal === 'sell' || ans.pages === 'shop' || ans.payments === 'sell_products') return 'ecommerce';
    if (ans.goal === 'above_all' || ans.payments === 'bookings' || ans.payments === 'other' || ans.pages === '5-10') return 'standard';
    if (ans.pages === '1-3') return 'starter';
    return 'standard';
  }

  // ── Add-on logic ──────────────────────────────────────────────
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

    const features = Array.isArray(ans.features) ? ans.features : [];
    if (!features.includes('none')) {
      if (features.includes('simple'))                                list.push(ADDON.simple);
      if (features.includes('advanced') && !hasAdvancedFromPayments) list.push(ADDON.advanced);
    }

    return list;
  }

  // ── Budget mismatch check ─────────────────────────────────────
  // Returns null if upfront total fits the budget (or E-commerce, which has no fixed price).
  // Returns { ideal, withinBudget } when the total exceeds the budget band.
  // withinBudget is the best combination that fits, found by removing the most expensive
  // add-ons first, then downgrading the plan if needed.
  function checkBudget(planKey, addons, budgetKey) {
    const buildPrice = PLAN[planKey].price;
    if (buildPrice === null) return null; // E-commerce: skip budget check

    const budgetMax  = BUDGET_MAX[budgetKey] || Infinity;
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const idealTotal = buildPrice + addonTotal;
    if (idealTotal <= budgetMax) return null; // No mismatch

    const ideal = { planKey, addons, price: idealTotal };

    // Sort add-ons by price descending — drop most expensive first
    const sorted = [...addons].sort((a, b) => b.price - a.price);

    // Try ideal plan with progressively fewer add-ons
    for (let skip = 1; skip <= sorted.length; skip++) {
      const kept  = sorted.slice(skip);
      const total = buildPrice + kept.reduce((s, a) => s + a.price, 0);
      if (total <= budgetMax) {
        return { ideal, withinBudget: { planKey, addons: kept, price: total, dropped: sorted.slice(0, skip).map(a => a.name), planDowngraded: false } };
      }
    }

    // Plan itself exceeds budget — try Starter
    if (planKey !== 'starter') {
      const sp = PLAN.starter.price;
      for (let skip = 0; skip <= sorted.length; skip++) {
        const kept  = sorted.slice(skip);
        const total = sp + kept.reduce((s, a) => s + a.price, 0);
        if (total <= budgetMax) {
          return { ideal, withinBudget: { planKey: 'starter', addons: kept, price: total, dropped: sorted.slice(0, skip).map(a => a.name), planDowngraded: true } };
        }
      }
    }

    // Nothing fits — Starter alone is always the last resort
    return { ideal, withinBudget: { planKey: 'starter', addons: [], price: PLAN.starter.price, dropped: addons.map(a => a.name), planDowngraded: planKey !== 'starter' } };
  }

  // ── Render a question ─────────────────────────────────────────
  function renderQuestion(index) {
    clearTimeout(autoAdvanceTimer);

    const q       = QUESTIONS[index];
    const isMulti = q.type === 'multi';
    const selArr  = isMulti ? (Array.isArray(answers[q.id]) ? answers[q.id] : []) : null;
    const selVal  = isMulti ? null : (answers[q.id] || null);

    setProgress(((index + 1) / QUESTIONS.length) * 100);
    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    quizNav.style.display = '';

    // Next button: hidden for single-select, "Continue" for multi-select only
    if (isMulti) {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Continue →';
      nextBtn.disabled = selArr.length === 0;
    } else {
      nextBtn.style.display = 'none';
    }

    const isSel = val => isMulti ? selArr.includes(val) : selVal === val;

    const optionsHtml = q.options.map(opt => {
      const sel = isSel(opt.value);
      return (
        '<button class="quiz-option' + (sel ? ' selected' : '') + '" ' +
          'data-value="' + opt.value + '" ' +
          'role="' + (isMulti ? 'checkbox' : 'radio') + '" ' +
          'aria-checked="' + sel + '" type="button">' +
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
        (isMulti ? '<p class="quiz-step-sub">Select all that apply</p>' : '') +
        '<div class="quiz-options' + (isMulti ? ' quiz-options--checkbox' : '') + '" ' +
          'role="' + (isMulti ? 'group' : 'radiogroup') + '" aria-label="' + q.title + '">' +
          optionsHtml +
        '</div>' +
      '</div>'
    );

    const btns = quizCard.querySelectorAll('.quiz-option');

    if (isMulti) {
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val   = btn.dataset.value;
          let current = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];

          if (val === 'none') {
            current = current.includes('none') ? [] : ['none'];
          } else {
            current = current.filter(v => v !== 'none');
            const pos = current.indexOf(val);
            if (pos !== -1) { current.splice(pos, 1); } else { current.push(val); }
          }

          answers[q.id] = current;
          nextBtn.disabled = current.length === 0;

          btns.forEach(b => {
            const s = current.includes(b.dataset.value);
            b.classList.toggle('selected', s);
            b.setAttribute('aria-checked', s);
          });
        });
      });
    } else {
      // Single-select: auto-advance 600ms after selection
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          clearTimeout(autoAdvanceTimer);
          answers[q.id] = btn.dataset.value;

          btns.forEach(b => {
            const s = b === btn;
            b.classList.toggle('selected', s);
            b.setAttribute('aria-checked', s);
          });

          autoAdvanceTimer = setTimeout(advance, 600);
        });
      });
    }
  }

  // ── Navigation ────────────────────────────────────────────────
  function advance() {
    clearTimeout(autoAdvanceTimer);
    const ans    = answers[QUESTIONS[currentQuestion].id];
    const hasAns = Array.isArray(ans) ? ans.length > 0 : !!ans;
    if (!hasAns) return;

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
    const buildPrice = PLAN[planKey].price;
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const totalPrice = buildPrice !== null ? buildPrice + addonTotal : null;
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
          plan:       PLAN[planKey].name,
          buildPrice: totalPrice !== null ? PLAN[planKey].priceDisplay : 'Custom quote',
          addons:     addons.map(a => ({ name: a.name, price: a.priceDisplay })),
          upfrontTotal: totalPrice !== null ? '£' + totalPrice.toFixed(2) : 'Custom quote',
          careTier:   careTier ? { name: careTier.name, price: careTier.priceDisplay } : null,
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
      // Timeout or network error — fallback explanation already set above
    }

    fadeTransition(() => showResult(planKey, addons, careTier, totalPrice, budget, explanation));
  }

  // ── Result screen ─────────────────────────────────────────────
  function showResult(planKey, addons, careTier, totalPrice, budget, explanation) {
    const plan = PLAN[planKey];

    // Builds an itemised dark summary box.
    // upfrontTotal: number or null. showCare: whether to append the monthly care row.
    function summaryBox(pk, addonsArr, upfrontTotal, showCare) {
      const p = PLAN[pk];
      let rows = '<div class="quiz-result-sum-row"><span>' + p.name + ' build</span><strong>' + p.priceDisplay + '</strong></div>';
      addonsArr.forEach(a => {
        rows += '<div class="quiz-result-sum-row"><span>' + a.name + '</span><strong>' + a.priceDisplay + '</strong></div>';
      });
      if (upfrontTotal !== null && addonsArr.length > 0) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-total"><span><strong>Upfront total</strong></span><strong>£' + upfrontTotal.toFixed(2) + '</strong></div>';
      }
      if (showCare && careTier) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-mrr"><span>' + careTier.name + '</span><strong>' + careTier.priceDisplay + '</strong></div>';
      }
      return '<div class="quiz-result-summary-box">' + rows + '</div>';
    }

    // Builds a features list for any plan key
    function featuresList(pk) {
      return '<ul class="quiz-result-list">' + PLAN[pk].features.map(f => '<li>' + f + '</li>').join('') + '</ul>';
    }

    // Builds the add-on description cards
    function addonsBlock(addonsArr) {
      if (!addonsArr.length) return '';
      return addonsArr.map(a =>
        '<div class="quiz-result-addon">' +
          '<div class="quiz-result-addon-row">' +
            '<span class="quiz-result-addon-name">' + a.name + '</span>' +
            '<span class="quiz-result-addon-price">' + a.priceDisplay + '</span>' +
          '</div>' +
          '<p class="quiz-result-addon-desc">' + a.desc + '</p>' +
        '</div>'
      ).join('');
    }

    // What was dropped/downgraded to meet budget (italic note)
    function droppedNote(wb, idealPlanKey) {
      const parts = [];
      if (wb.planDowngraded) parts.push(PLAN[idealPlanKey].name + ' switched to Starter');
      if (wb.dropped.length)  parts.push(wb.dropped.join(' and ') + ' not included');
      return parts.length
        ? '<p class="quiz-result-rec-note">' + parts.join('; ') + ' to fit your budget.</p>'
        : '';
    }

    const careHtml = careTier
      ? '<div class="quiz-result-care-box">' +
          '<div class="quiz-result-care-name">' + careTier.name + '<span class="quiz-result-care-price">' + careTier.priceDisplay + '</span></div>' +
          '<p class="quiz-result-care-reason">' + careTier.desc + '</p>' +
        '</div>'
      : '';

    const ctasHtml =
      '<div class="quiz-result-ctas">' +
        '<a href="index.html#contact" class="btn btn-dark btn-block">Get in touch &rarr;</a>' +
        '<a href="pricing.html" class="btn btn-ghost btn-block btn-sm">View all pricing</a>' +
        '<a href="quiz.html" class="quiz-restart">&larr; Start again</a>' +
      '</div>';

    let html;

    if (budget) {
      // ── Two-recommendation layout ─────────────────────────────
      const wb = budget.withinBudget;
      const wbPrice = PLAN[wb.planKey].price;
      const wbTotal = wbPrice !== null
        ? wbPrice + wb.addons.reduce((s, a) => s + a.price, 0)
        : null;

      const wbCard =
        '<div class="quiz-result-rec">' +
          '<span class="quiz-result-rec-label">Within your budget</span>' +
          '<h3 class="quiz-result-rec-title">' + PLAN[wb.planKey].name + '</h3>' +
          droppedNote(wb, planKey) +
          featuresList(wb.planKey) +
          (wb.addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(wb.addons) + '</div>' : '') +
          summaryBox(wb.planKey, wb.addons, wbTotal, false) +
        '</div>';

      const idealCard =
        '<div class="quiz-result-rec quiz-result-rec--ideal">' +
          '<span class="quiz-result-rec-label">Best for your needs</span>' +
          '<h3 class="quiz-result-rec-title">' + plan.name + (addons.length ? ' + add-ons' : '') + '</h3>' +
          featuresList(planKey) +
          (addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(addons) + '</div>' : '') +
          summaryBox(planKey, addons, totalPrice, false) +
        '</div>';

      html =
        '<div class="quiz-results">' +
          '<div class="quiz-result-header">' +
            '<div class="quiz-result-badge">&#10003; Your personalised recommendation</div>' +
            '<p class="quiz-result-intro">' + explanation + '</p>' +
          '</div>' +
          '<div class="quiz-result-recs">' + wbCard + idealCard + '</div>' +
          careHtml +
          ctasHtml +
        '</div>';

    } else {
      // ── Single recommendation layout ──────────────────────────
      const priceHtml = plan.was
        ? '<span class="quiz-result-build-price">' + plan.priceDisplay + '</span>&nbsp;<span class="quiz-result-build-was">was ' + plan.was + '</span>'
        : '<span class="quiz-result-build-price">' + plan.priceDisplay + '</span>';

      const addonsSection = addons.length
        ? '<div class="quiz-result-section"><span class="quiz-result-label">Add-ons</span>' + addonsBlock(addons) + '</div>'
        : '';

      html =
        '<div class="quiz-results">' +
          '<div class="quiz-result-header">' +
            '<div class="quiz-result-badge">&#10003; Your recommended plan</div>' +
            '<h2 class="quiz-result-title">' + plan.name + '</h2>' +
            '<p class="quiz-result-intro">' + explanation + '</p>' +
          '</div>' +
          '<div class="quiz-result-body">' +
            '<div>' +
              '<div class="quiz-result-section">' +
                '<span class="quiz-result-label">Your build</span>' +
                '<div class="quiz-result-build-name">' + plan.name + '&nbsp;' + priceHtml + '</div>' +
                '<div class="quiz-result-meta">' + plan.meta + '</div>' +
                featuresList(planKey) +
              '</div>' +
              addonsSection +
            '</div>' +
            '<div class="quiz-result-right">' +
              careHtml +
              summaryBox(planKey, addons, totalPrice, true) +
              ctasHtml +
            '</div>' +
          '</div>' +
        '</div>';
    }

    quizCard.innerHTML = html;
  }

  // ── Boot ──────────────────────────────────────────────────────
  backBtn.addEventListener('click', back);
  nextBtn.addEventListener('click', advance);
  renderQuestion(0);

}());
