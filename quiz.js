// Martin & Harding Digital — AI Plan Finder
// Quiz-specific logic only. Shared utilities (nav, cookies, year) live in script.js.

(function () {
  'use strict';

  const QUIZ_ENDPOINT = '/.netlify/functions/quiz';

  // ── Questions ─────────────────────────────────────────────────
  // type:'multi' → multi-select with Continue button.
  // No type (or type:'single') → single-select with auto-advance.
  // noneValue → the option that is mutually exclusive with all others.
  // conditional(ans) → function returning false means this step is skipped.

  const QUESTIONS = [
    {
      id: 'goal',
      type: 'multi',
      noneValue: 'above_all',
      title: "What's the main goal of your website?",
      options: [
        { value: 'showcase',  label: 'Show what I do',      sub: 'A professional presence I can share with confidence' },
        { value: 'enquiries', label: 'Get enquiries',        sub: 'Attract leads and turn visitors into contacts' },
        { value: 'sell',      label: 'Sell products online', sub: 'Take orders and payments through my website' },
        { value: 'above_all', label: 'All of the above',    sub: 'All of the above — I need a full-featured site' },
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
      type: 'multi',
      noneValue: 'no',
      title: 'Do you need to take payments on the site?',
      options: [
        { value: 'sell_products', label: 'Yes — selling products (a shop)',                  sub: 'Full online shop with checkout' },
        { value: 'bookings',      label: 'Yes — taking payment for bookings or appointments', sub: 'Clients pay to book slots or services' },
        { value: 'other',         label: 'Yes — something else',                             sub: 'Deposits, one-off payments, or similar' },
        { value: 'no',            label: 'No — no payments needed',                          sub: 'Payments not required' },
      ],
    },
    {
      id: 'addonTypes',
      type: 'multi',
      noneValue: 'none',
      title: 'Do you need any advanced features or integrations?',
      options: [
        { value: 'simple',   label: 'Simple add-ons',   sub: 'Live chat, newsletter signup, social feeds, cookie consent' },
        { value: 'advanced', label: 'Advanced add-ons', sub: 'Booking systems, memberships, CRM or custom form setup' },
        { value: 'none',     label: 'None of these',    sub: 'Just a great website' },
      ],
    },
    {
      id: 'simpleAddons',
      type: 'multi',
      title: 'Which simple features do you need?',
      conditional: function (ans) {
        var t = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];
        return t.includes('simple') && !t.includes('none');
      },
      options: [
        { value: 'live_chat',      label: 'Live chat',              sub: 'Chat widget so visitors can message you directly · £79' },
        { value: 'newsletter',     label: 'Newsletter signup',       sub: 'Email capture connected to Mailchimp or similar · £69' },
        { value: 'social_feed',    label: 'Social media feed',       sub: 'Display your Instagram or Facebook feed on the site · £69' },
        { value: 'cookie_consent', label: 'Cookie consent banner',  sub: 'GDPR-compliant cookie notice and preference manager · £49' },
      ],
    },
    {
      id: 'advancedAddons',
      type: 'multi',
      title: 'Which advanced features do you need?',
      conditional: function (ans) {
        var t = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];
        return t.includes('advanced') && !t.includes('none');
      },
      options: [
        { value: 'booking_system', label: 'Booking / appointment system', sub: 'Let clients book slots or appointments online · £199' },
        { value: 'membership',     label: 'Membership & gated content',   sub: 'Private pages, login areas, or member-only sections · £199' },
        { value: 'crm_forms',      label: 'CRM or custom form setup',     sub: 'Complex forms, lead routing, or CRM integration · £149' },
      ],
    },
    {
      id: 'care',
      title: 'Do you want us to look after the site after launch?',
      options: [
        { value: 'light',   label: 'Yes — light touch',                     sub: 'Occasional small fixes · £99/month' },
        { value: 'regular', label: 'Yes — regular updates and support',     sub: 'Ongoing updates and help · £149/month' },
        { value: 'full',    label: 'Yes — full ongoing growth, SEO and content', sub: 'Full service, SEO, content · £399/month' },
        { value: 'no',      label: 'No, just build it',                          sub: "I'll handle updates myself" },
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
      features: ['Clean, mobile-friendly design', 'Contact form', 'Basic SEO setup', 'Google Analytics', 'SSL included'],
      fallback: "Based on your answers, our Starter package is a great fit. It gives you everything you need for a professional online presence — clean design, mobile-friendly, and live in just a few days.",
    },
    standard: {
      name: 'Standard',
      price: 599.50,
      priceDisplay: '£599.50',
      was: '£1,199',
      meta: '5–10 pages · launches in 5–7 days',
      features: ['Everything in Starter', 'Multiple service or product pages', 'Contact forms with lead capture', 'On-page SEO foundations', 'Blog-ready'],
      fallback: "Our Standard package is the right fit for where you want to go. You get a full marketing website with multiple pages, proper SEO foundations, and contact forms built to convert visitors into enquiries.",
    },
    ecommerce: {
      name: 'E-commerce',
      price: 899.50,
      priceDisplay: '£899.50',
      was: '£1,799',
      meta: 'Online shop · launches in 7–10 days',
      features: ['Full online shop setup', 'Secure checkout & card payments', 'Product management', 'Order notifications', 'Mobile-optimised checkout'],
      fallback: "An e-commerce build is exactly right for where you want to go. We'll set up a complete online shop with a secure checkout so you can start selling straight away.",
    },
  };

  // ── Payment-triggered add-ons ─────────────────────────────────
  // Added automatically based on the payments Q; E-commerce plan has these built in.
  const ADDON = {
    booking_payment: {
      name: 'Booking system + payments',
      price: 299, priceDisplay: '£299',
      desc: 'Booking/reservation system with integrated payment processing',
    },
    payment_integration: {
      name: 'Payment integration',
      price: 299, priceDisplay: '£299',
      desc: 'Custom payment flow for deposits, one-off charges, or similar',
    },
  };

  // ── Simple add-ons checklist ──────────────────────────────────
  const SIMPLE_ADDONS = {
    live_chat:      { name: 'Live chat',             price: 79,  priceDisplay: '£79',  desc: 'Chat widget so visitors can message you directly from your website' },
    newsletter:     { name: 'Newsletter signup',      price: 69,  priceDisplay: '£69',  desc: 'Email capture form connected to Mailchimp, ConvertKit, or similar' },
    social_feed:    { name: 'Social media feed',      price: 69,  priceDisplay: '£69',  desc: 'Display your Instagram or Facebook feed automatically on your site' },
    cookie_consent: { name: 'Cookie consent banner', price: 49,  priceDisplay: '£49',  desc: 'GDPR-compliant cookie notice and preference manager' },
  };

  // ── Advanced add-ons checklist ────────────────────────────────
  // guardPayment: if this payment type was selected in the payments Q,
  // skip this add-on (it is already covered by ADDON.booking_payment).
  const ADVANCED_ADDONS = {
    booking_system: { name: 'Booking / appointment system', price: 199, priceDisplay: '£199', desc: 'Let clients book appointments or slots online, with email confirmations', guardPayment: 'bookings' },
    membership:     { name: 'Membership & gated content',   price: 199, priceDisplay: '£199', desc: 'Private pages, login areas, or member-only sections of your site' },
    crm_forms:      { name: 'CRM or custom form setup',     price: 149, priceDisplay: '£149', desc: 'Complex multi-step forms, lead routing, or integration with your CRM' },
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
    setTimeout(function () { cb(); quizCard.style.opacity = '1'; }, 250);
  }

  // ── Conditional navigation ────────────────────────────────────
  // Returns the index of the next visible question, skipping conditionals that don't apply.
  function getNextIndex(from) {
    var next = from + 1;
    while (next < QUESTIONS.length) {
      var q = QUESTIONS[next];
      if (!q.conditional || q.conditional(answers)) break;
      next++;
    }
    return next; // === QUESTIONS.length means we've reached the end → call finish()
  }

  // Returns the index of the previous visible question, or -1 if we're at the start.
  function getPrevIndex(from) {
    var prev = from - 1;
    while (prev >= 0) {
      var q = QUESTIONS[prev];
      if (!q.conditional || q.conditional(answers)) break;
      prev--;
    }
    return prev;
  }

  // ── Plan selection ────────────────────────────────────────────
  function pickPlan(ans) {
    var goals    = Array.isArray(ans.goal)     ? ans.goal     : [ans.goal].filter(Boolean);
    var payments = Array.isArray(ans.payments) ? ans.payments : [ans.payments].filter(Boolean);

    if (goals.includes('sell') || ans.pages === 'shop' || payments.includes('sell_products'))
      return 'ecommerce';
    if (goals.includes('above_all') || payments.includes('bookings') || payments.includes('other') || ans.pages === '5-10')
      return 'standard';
    if (ans.pages === '1-3')
      return 'starter';
    return 'standard';
  }

  // ── Add-on selection ──────────────────────────────────────────
  function buildAddons(ans, planKey) {
    var list     = [];
    var payments = Array.isArray(ans.payments)  ? ans.payments  : [];
    var types    = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];

    // Payment-triggered add-ons (E-commerce plan already includes these)
    if (planKey !== 'ecommerce') {
      if (payments.includes('bookings')) list.push(ADDON.booking_payment);
      if (payments.includes('other'))    list.push(ADDON.payment_integration);
    }

    // Checklist add-ons (only when types is not 'none')
    if (!types.includes('none')) {
      if (types.includes('simple')) {
        var simSel = Array.isArray(ans.simpleAddons) ? ans.simpleAddons : [];
        simSel.forEach(function (key) {
          if (SIMPLE_ADDONS[key]) list.push(SIMPLE_ADDONS[key]);
        });
      }

      if (types.includes('advanced')) {
        var advSel = Array.isArray(ans.advancedAddons) ? ans.advancedAddons : [];
        advSel.forEach(function (key) {
          var addon = ADVANCED_ADDONS[key];
          if (!addon) return;
          // Double-count guard: skip if this feature is already covered by a payment add-on
          if (addon.guardPayment && payments.includes(addon.guardPayment)) return;
          list.push(addon);
        });
      }
    }

    return list;
  }

  // ── Budget check ──────────────────────────────────────────────
  // Always returns { ideal, withinBudget, isMismatch }.
  // isMismatch=false → one card; isMismatch=true → two cards.
  // Greedy cascade: drop most-expensive add-ons first, then try a cheaper plan tier.
  function checkBudget(planKey, addons, budgetKey) {
    var budgetMax  = BUDGET_MAX[budgetKey] || Infinity;
    var buildPrice = PLAN[planKey].price;
    var addonTotal = addons.reduce(function (s, a) { return s + a.price; }, 0);
    var idealTotal = buildPrice + addonTotal;
    var ideal      = { planKey: planKey, addons: addons, price: idealTotal };

    if (idealTotal <= budgetMax) {
      return { ideal: ideal, withinBudget: ideal, isMismatch: false };
    }

    var planOrder = ['ecommerce', 'standard', 'starter'];
    var startIdx  = planOrder.indexOf(planKey);
    var sorted    = addons.slice().sort(function (a, b) { return b.price - a.price; });

    for (var pi = startIdx; pi < planOrder.length; pi++) {
      var tryKey   = planOrder[pi];
      var tryPrice = PLAN[tryKey].price;
      var minSkip  = pi === startIdx ? 1 : 0;

      for (var skip = minSkip; skip <= sorted.length; skip++) {
        var kept  = sorted.slice(skip);
        var total = tryPrice + kept.reduce(function (s, a) { return s + a.price; }, 0);
        if (total <= budgetMax) {
          return {
            ideal: ideal,
            withinBudget: {
              planKey:       tryKey,
              addons:        kept,
              price:         total,
              dropped:       sorted.slice(0, skip).map(function (a) { return a.name; }),
              planDowngraded: tryKey !== planKey,
            },
            isMismatch: true,
          };
        }
      }
    }

    return {
      ideal: ideal,
      withinBudget: { planKey: 'starter', addons: [], price: PLAN.starter.price, dropped: addons.map(function (a) { return a.name; }), planDowngraded: planKey !== 'starter' },
      isMismatch: true,
    };
  }

  // ── Render a question ─────────────────────────────────────────
  function renderQuestion(index) {
    clearTimeout(autoAdvanceTimer);

    var q       = QUESTIONS[index];
    var isMulti = q.type === 'multi';
    var selVal  = answers[q.id];
    var selArr  = isMulti ? (Array.isArray(selVal) ? selVal : []) : null;

    // Compute visible step numbers for display
    var visibleStep  = 0;
    var visibleTotal = 0;
    for (var i = 0; i < QUESTIONS.length; i++) {
      var vis = !QUESTIONS[i].conditional || QUESTIONS[i].conditional(answers);
      if (vis) {
        visibleTotal++;
        if (i <= index) visibleStep = visibleTotal;
      }
    }

    setProgress((index + 1) / QUESTIONS.length * 100);
    backBtn.style.visibility = getPrevIndex(index) < 0 ? 'hidden' : 'visible';
    quizNav.style.display    = '';

    nextBtn.style.display = '';
    nextBtn.textContent   = 'Continue →';
    nextBtn.disabled      = isMulti ? selArr.length === 0 : !selVal;

    var isSel = function (val) { return isMulti ? selArr.includes(val) : selVal === val; };

    var optionsHtml = q.options.map(function (opt) {
      var sel = isSel(opt.value);
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
        '<span class="quiz-step-count">Question ' + visibleStep + ' of ' + visibleTotal + '</span>' +
        '<h2 class="quiz-step-title">' + q.title + '</h2>' +
        (isMulti ? '<p class="quiz-step-sub">Select all that apply</p>' : '') +
        '<div class="quiz-options' + (isMulti ? ' quiz-options--checkbox' : '') + '" ' +
          'role="' + (isMulti ? 'group' : 'radiogroup') + '" aria-label="' + q.title + '">' +
          optionsHtml +
        '</div>' +
      '</div>'
    );

    var btns    = quizCard.querySelectorAll('.quiz-option');
    var noneVal = q.noneValue || null;

    if (isMulti) {
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val     = btn.dataset.value;
          var current = Array.isArray(answers[q.id]) ? answers[q.id].slice() : [];

          if (noneVal && val === noneVal) {
            current = current.includes(noneVal) ? [] : [noneVal];
          } else {
            if (noneVal) current = current.filter(function (v) { return v !== noneVal; });
            var pos = current.indexOf(val);
            if (pos !== -1) { current.splice(pos, 1); } else { current.push(val); }
          }

          answers[q.id] = current;
          nextBtn.disabled = current.length === 0;

          btns.forEach(function (b) {
            var s = current.includes(b.dataset.value);
            b.classList.toggle('selected', s);
            b.setAttribute('aria-checked', s);
          });
        });
      });
    } else {
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          answers[q.id] = btn.dataset.value;
          nextBtn.disabled = false;

          btns.forEach(function (b) {
            var s = b === btn;
            b.classList.toggle('selected', s);
            b.setAttribute('aria-checked', s);
          });
        });
      });
    }
  }

  // ── Navigation ────────────────────────────────────────────────
  function advance() {
    clearTimeout(autoAdvanceTimer);

    var q   = QUESTIONS[currentQuestion];
    var ans = answers[q.id];
    var ok  = Array.isArray(ans) ? ans.length > 0 : !!ans;
    if (!ok) return;

    var nextIdx = getNextIndex(currentQuestion);
    if (nextIdx < QUESTIONS.length) {
      currentQuestion = nextIdx;
      fadeTransition(function () { renderQuestion(currentQuestion); });
    } else {
      finish();
    }
  }

  function back() {
    clearTimeout(autoAdvanceTimer);
    var prevIdx = getPrevIndex(currentQuestion);
    if (prevIdx >= 0) {
      currentQuestion = prevIdx;
      fadeTransition(function () { renderQuestion(currentQuestion); });
    }
  }

  // ── Finish: pick plan, call AI, show result ───────────────────
  async function finish() {
    var planKey    = pickPlan(answers);
    var addons     = buildAddons(answers, planKey);
    var careTier   = CARE[answers.care] || null;
    var totalPrice = PLAN[planKey].price + addons.reduce(function (s, a) { return s + a.price; }, 0);
    var budget     = checkBudget(planKey, addons, answers.budget);

    setProgress(100);
    quizNav.style.display = 'none';

    fadeTransition(function () {
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

    var explanation = PLAN[planKey].fallback;

    try {
      var controller = new AbortController();
      var timeout    = setTimeout(function () { controller.abort(); }, 9000);

      var res = await fetch(QUIZ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:         PLAN[planKey].name,
          buildPrice:   PLAN[planKey].priceDisplay,
          addons:       addons.map(function (a) { return { name: a.name, price: a.priceDisplay }; }),
          upfrontTotal: '£' + totalPrice.toFixed(2),
          careTier:     careTier ? { name: careTier.name, price: careTier.priceDisplay } : null,
          answers:      answers,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (res.ok) {
        var data = await res.json();
        if (data.explanation) explanation = data.explanation;
      }
    } catch (_) {
      // Timeout or network error — fallback text already set
    }

    fadeTransition(function () { showResult(planKey, addons, careTier, totalPrice, budget, explanation); });
  }

  // ── Result screen ─────────────────────────────────────────────
  function showResult(planKey, addons, careTier, totalPrice, budget, explanation) {
    var plan    = PLAN[planKey];
    var wb      = budget.withinBudget;
    var wbTotal = PLAN[wb.planKey].price + wb.addons.reduce(function (s, a) { return s + a.price; }, 0);

    function summaryBox(pk, arr, upfront) {
      var p    = PLAN[pk];
      var rows = '<div class="quiz-result-sum-row"><span>' + p.name + ' build</span><strong>' + p.priceDisplay + '</strong></div>';
      arr.forEach(function (a) {
        rows += '<div class="quiz-result-sum-row"><span>' + a.name + '</span><strong>' + a.priceDisplay + '</strong></div>';
      });
      if (arr.length > 0) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-total"><span><strong>Estimated upfront total</strong></span><strong>£' + upfront.toFixed(2) + '</strong></div>';
      }
      if (careTier) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-mrr"><span>' + careTier.name + '</span><strong>' + careTier.priceDisplay + '</strong></div>';
      }
      return '<div class="quiz-result-summary-box">' + rows + '</div>';
    }

    function featuresList(pk) {
      return '<ul class="quiz-result-list">' + PLAN[pk].features.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>';
    }

    function addonsBlock(arr) {
      return arr.map(function (a) {
        return (
          '<div class="quiz-result-addon">' +
            '<div class="quiz-result-addon-row">' +
              '<span class="quiz-result-addon-name">' + a.name + '</span>' +
              '<span class="quiz-result-addon-price">' + a.priceDisplay + '</span>' +
            '</div>' +
            '<p class="quiz-result-addon-desc">' + a.desc + '</p>' +
          '</div>'
        );
      }).join('');
    }

    function droppedNote() {
      var parts = [];
      if (wb.planDowngraded) parts.push(plan.name + ' plan reduced to ' + PLAN[wb.planKey].name);
      if (wb.dropped && wb.dropped.length) parts.push(wb.dropped.join(' and ') + ' removed');
      return parts.length
        ? '<p class="quiz-result-rec-note">' + parts.join('; ') + ' to stay within budget.</p>'
        : '';
    }

    function buildPlanText(pk, arr, upfront) {
      var p     = PLAN[pk];
      var items = [{ label: p.name + ' build', value: p.priceDisplay }];
      arr.forEach(function (a) { items.push({ label: a.name, value: a.priceDisplay }); });
      if (arr.length > 0) items.push({ label: 'Estimated upfront total', value: '£' + upfront.toFixed(2), isTotal: true });
      if (careTier)       items.push({ label: careTier.name, value: careTier.priceDisplay, isMrr: true });

      var lines = ['Estimated plan from website quiz (subject to confirmation):', ''];
      items.forEach(function (item) { lines.push(item.label + ' — ' + item.value); });

      return JSON.stringify({ items: items, text: lines.join('\n') });
    }

    var careHtml = careTier
      ? '<div class="quiz-result-care-box">' +
          '<div class="quiz-result-care-name">' + careTier.name +
            '<span class="quiz-result-care-price">' + careTier.priceDisplay + '</span>' +
          '</div>' +
          '<p class="quiz-result-care-reason">' + careTier.desc + '</p>' +
        '</div>'
      : '';

    var ctasHtml =
      '<div class="quiz-result-ctas">' +
        '<div id="quizEnquireWrap">' +
          '<button type="button" class="btn btn-dark btn-block" id="quizEnquireBtn">Get in touch →</button>' +
        '</div>' +
        '<a href="pricing.html" class="btn btn-ghost btn-block btn-sm">View all pricing</a>' +
        '<a href="quiz.html" class="quiz-restart">← Start again</a>' +
      '</div>';

    var recsHtml;

    if (!budget.isMismatch) {
      var title = plan.name + (addons.length ? ' + add-ons' : '');
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
      var wbTitle    = PLAN[wb.planKey].name + (wb.addons.length ? ' + add-ons' : '');
      var idealTitle = plan.name + (addons.length ? ' + add-ons' : '');

      var wbCard =
        '<div class="quiz-result-rec">' +
          '<span class="quiz-result-rec-label">Within your budget</span>' +
          '<h3 class="quiz-result-rec-title">' + wbTitle + '</h3>' +
          droppedNote() +
          featuresList(wb.planKey) +
          (wb.addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(wb.addons) + '</div>' : '') +
          summaryBox(wb.planKey, wb.addons, wbTotal) +
        '</div>';

      var idealCard =
        '<div class="quiz-result-rec quiz-result-rec--ideal">' +
          '<span class="quiz-result-rec-label">Best for your needs</span>' +
          '<h3 class="quiz-result-rec-title">' + idealTitle + '</h3>' +
          featuresList(planKey) +
          (addons.length ? '<div class="quiz-result-rec-addons">' + addonsBlock(addons) + '</div>' : '') +
          summaryBox(planKey, addons, totalPrice) +
        '</div>';

      recsHtml = '<div class="quiz-result-recs">' + wbCard + idealCard + '</div>';
    }

    var html =
      '<div class="quiz-results">' +
        '<div class="quiz-result-header">' +
          '<div class="quiz-result-badge">✓ Your personalised recommendation</div>' +
          '<p class="quiz-result-intro">' + explanation + '</p>' +
        '</div>' +
        recsHtml +
        careHtml +
        '<p class="quiz-result-disclaimer">This is an estimate to give you a clear starting point, based on what you\'ve told us. The final price may shift slightly once we\'ve had a proper chat about your project and the details — sometimes things turn out simpler than expected, sometimes there\'s a bit more to it. Either way, there are no surprises: we\'ll always confirm everything with you in writing before any work begins.</p>' +
        ctasHtml +
      '</div>';

    quizCard.innerHTML = html;

    document.getElementById('quizEnquireBtn').addEventListener('click', function () {
      if (budget.isMismatch) {
        var wrap       = document.getElementById('quizEnquireWrap');
        var wbLabel    = PLAN[wb.planKey].name + (wb.addons.length ? ' + add-ons' : '') + ' (budget option)';
        var idealLabel = plan.name + (addons.length ? ' + add-ons' : '') + ' (best option)';

        wrap.innerHTML =
          '<p class="quiz-plan-choice-label">Which plan would you like to enquire about?</p>' +
          '<button type="button" class="btn btn-ghost btn-block quiz-plan-choice" data-which="within">Enquire about ' + wbLabel + '</button>' +
          '<button type="button" class="btn btn-dark btn-block quiz-plan-choice" data-which="ideal">Enquire about ' + idealLabel + '</button>';

        wrap.querySelectorAll('.quiz-plan-choice').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var which = btn.dataset.which;
            var pk    = which === 'within' ? wb.planKey : planKey;
            var ao    = which === 'within' ? wb.addons  : addons;
            var tot   = which === 'within' ? wbTotal    : totalPrice;
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
