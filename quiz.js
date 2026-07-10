// Martin & Harding Digital: AI Plan Finder
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
        { value: 'above_all', label: 'All of the above',    sub: 'All of the above: I need a full-featured site' },
      ],
    },
    {
      id: 'pages',
      title: 'Roughly how many pages do you need?',
      options: [
        { value: '1-3',  label: '1–3 pages',        sub: 'Home, about, contact: the essentials' },
        { value: '5-10', label: '5–10 pages',        sub: 'Multiple services, a team page, or a blog' },
        { value: 'shop', label: "Lots, it's a shop", sub: 'Product pages, categories, a checkout' },
      ],
    },
    {
      id: 'payments',
      type: 'multi',
      noneValue: 'no',
      title: 'Do you need to take payments on the site?',
      options: [
        { value: 'sell_products', label: 'Yes, selling products (a shop)',                  sub: 'Full online shop with checkout' },
        { value: 'bookings',      label: 'Yes, taking payment for bookings or appointments', sub: 'Clients pay to book slots or services' },
        { value: 'other',         label: 'Yes, something else',                             sub: 'Deposits, one-off payments, or similar' },
        { value: 'no',            label: 'No, no payments needed',                          sub: 'Payments not required' },
      ],
    },
    {
      id: 'addonTypes',
      type: 'multi',
      noneValue: 'none',
      title: 'Do you need any advanced features or integrations?',
      options: [
        { value: 'simple',   label: 'Standard integrations', sub: 'Live chat, newsletter, social feeds, gallery, maps/reviews, form upgrades · £149.50 each' },
        { value: 'advanced', label: 'Complex integrations',  sub: 'Bookings, membership, payments, CRM, multi-language · £299.50 each' },
        { value: 'none',     label: 'None of these',         sub: 'Just a great website' },
      ],
    },
    {
      id: 'simpleAddons',
      type: 'multi',
      title: 'Which standard integrations do you need?',
      conditional: function (ans) {
        var t = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];
        return t.includes('simple') && !t.includes('none');
      },
      options: [
        { value: 'live_chat',     label: 'Live chat widget',            sub: 'Chat widget so visitors can message you directly · £149.50' },
        { value: 'newsletter',    label: 'Newsletter signup',            sub: 'Email capture connected to Mailchimp or similar · £149.50' },
        { value: 'social_feed',   label: 'Social media feeds',           sub: 'Display your Instagram or Facebook feed on the site · £149.50' },
        { value: 'image_gallery', label: 'Image gallery',                sub: 'A polished, filterable gallery for your photos or work · £149.50' },
        { value: 'maps_reviews',  label: 'Google Maps / reviews embed', sub: 'Show your location and live Google reviews on the site · £149.50' },
        { value: 'form_upgrades', label: 'Contact-form upgrades',        sub: 'File uploads, multi-step forms, and smarter enquiries · £149.50' },
      ],
    },
    {
      id: 'advancedAddons',
      type: 'multi',
      title: 'Which complex integrations do you need?',
      conditional: function (ans) {
        var t = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];
        return t.includes('advanced') && !t.includes('none');
      },
      options: [
        { value: 'booking_system',      label: 'Booking / reservation system',  sub: 'Let clients book slots or appointments online · £299.50 (included with Pro)' },
        { value: 'membership',          label: 'Membership / login area',       sub: 'Private pages, login areas, or member-only sections · £299.50' },
        { value: 'payment_integration', label: 'Payment integration',           sub: 'Deposits, one-off payments, or similar custom payment flows · £299.50' },
        { value: 'crm_integration',     label: 'CRM / third-party integration', sub: 'Connect your site to HubSpot, Zoho, or other tools · £299.50' },
        { value: 'multi_language',      label: 'Multi-language support',        sub: 'Serve your site in more than one language · £299.50' },
      ],
    },
    {
      id: 'care',
      title: 'Do you want us to look after the site after launch?',
      options: [
        { value: 'light',   label: 'Yes, light touch',                 sub: 'Hosting, security, backups, small tweaks · £45/month' },
        { value: 'regular', label: 'Yes, regular updates and support', sub: 'Ongoing updates and priority help · £95/month' },
        { value: 'full',    label: 'Yes, full priority support',       sub: 'More hours, same-day priority, strategy calls · £185/month' },
        { value: 'no',      label: 'No, just build it',                sub: "I'll handle updates myself" },
      ],
    },
    {
      id: 'seo',
      title: 'Do you want ongoing SEO to help you get found on Google?',
      options: [
        { value: 'local',  label: 'Yes, local basics',      sub: 'On-page optimisation, local citations, rank tracking, Google Business Profile · £149/month' },
        { value: 'growth', label: 'Yes, aggressive growth', sub: 'Everything in Local plus backlinks, technical SEO, competitor tracking · £299/month' },
        { value: 'no',     label: 'No, not right now',      sub: 'You can add an SEO plan any time later' },
      ],
    },
    {
      id: 'content',
      title: 'Do you want us to write regular content for your site?',
      options: [
        { value: 'yes', label: 'Yes, monthly blog posts',   sub: '4 professionally written posts every month · £300/month' },
        { value: 'no',  label: "No, we'll handle content", sub: 'Single posts are available any time at £85 each' },
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
  // All build prices are founding rates (builds only, never care plans).
  // isFrom: price is a starting point, quoted per project.
  const PLAN = {
    starter: {
      name: 'Starter',
      price: 399.50,
      priceDisplay: '£399.50',
      foundingNote: 'Founding rate: £399.50 (full rate £799 once our first 25 founding spots are filled).',
      meta: '1–3 pages · launches in 3–5 days',
      features: ['Clean, mobile-friendly design', 'Contact form', 'Basic SEO setup', 'Google Analytics', 'SSL included'],
      fallback: "Based on your answers, our Starter package is a great fit. It gives you everything you need for a professional online presence: clean design, mobile-friendly, and live in just a few days.",
    },
    growth: {
      name: 'Growth',
      price: 599.50,
      priceDisplay: '£599.50',
      foundingNote: 'Founding rate: £599.50 (full rate £1,199 once our first 25 founding spots are filled).',
      meta: '5 pages · launches in 5–7 days',
      features: ['Everything in Starter', 'Proper on-page SEO', 'Google Maps embed', 'Blog with 3 starter posts', 'Social media links'],
      fallback: "Our Growth package is the right fit for where you want to go. You get proper on-page SEO, a Google Maps embed, a blog with starter posts, and social media links to help local customers find and trust you.",
    },
    pro: {
      name: 'Pro',
      price: 899.50,
      priceDisplay: '£899.50',
      foundingNote: 'Founding rate: £899.50 (full rate £1,799 once our first 25 founding spots are filled).',
      meta: 'Up to 12 pages · launches in 10–14 days',
      features: ['Everything in Growth', 'Booking or reservation system included', 'Social feed integration', 'Core Web Vitals speed tuning', 'Schema markup', 'Custom domain setup'],
      fallback: "Our Pro package is the right fit for where you want to go. You get everything in Growth plus a booking or reservation system built in, social feed integration, speed tuning, schema markup, and custom domain setup for a fully working site.",
    },
    ecommerce: {
      name: 'E-commerce',
      price: 1499,
      priceDisplay: 'from £1,499',
      isFrom: true,
      foundingNote: 'Founding rate: from £1,499 (full rate from £2,999 once our first 25 founding spots are filled). E-commerce builds are quoted per project.',
      meta: 'Online shop · quoted per project',
      features: ['Everything in Pro', 'Full online store & checkout', 'Product & category pages', 'Payment gateway setup (Stripe, PayPal)', 'Order notifications & basic inventory'],
      fallback: "Our E-commerce package is the right fit for selling online. You get everything in Pro plus a full online store with checkout, product and category pages, and payment gateway setup. Every store is quoted per project, so this is a starting estimate.",
    },
  };

  // ── Payment-triggered add-ons ─────────────────────────────────
  // Added automatically based on the payments Q. The Pro build already
  // includes a booking system, and E-commerce includes payments, so
  // those plans are never charged the matching integration.
  const ADDON = {
    booking_payment: {
      name: 'Booking system + payments (complex integration)',
      price: 299.50, priceDisplay: '£299.50',
      desc: 'Booking/reservation system with integrated payment processing',
    },
    payment_integration: {
      name: 'Payment integration (complex integration)',
      price: 299.50, priceDisplay: '£299.50',
      desc: 'Custom payment flow for deposits, one-off charges, or similar',
    },
  };

  // ── Simple add-ons checklist (standard integrations, £149.50 each) ──
  // Matches the "Standard Integrations" list on pricing.html exactly.
  const SIMPLE_ADDONS = {
    live_chat:     { name: 'Live chat widget',            price: 149.50, priceDisplay: '£149.50', desc: 'Chat widget so visitors can message you directly from your website' },
    newsletter:    { name: 'Newsletter signup',            price: 149.50, priceDisplay: '£149.50', desc: 'Email capture form connected to Mailchimp, ConvertKit, or similar' },
    social_feed:   { name: 'Social media feeds',           price: 149.50, priceDisplay: '£149.50', desc: 'Display your Instagram or Facebook feed automatically on your site' },
    image_gallery: { name: 'Image gallery',                price: 149.50, priceDisplay: '£149.50', desc: 'A polished, filterable gallery for your photos, products, or work' },
    maps_reviews:  { name: 'Google Maps / reviews embed', price: 149.50, priceDisplay: '£149.50', desc: 'Show your location and live Google reviews directly on the site' },
    form_upgrades: { name: 'Contact-form upgrades',        price: 149.50, priceDisplay: '£149.50', desc: 'File uploads, multi-step forms, and smarter enquiry handling' },
  };

  // ── Advanced add-ons checklist (complex integrations, £299.50 each) ──
  // Matches the "Complex Integrations" list on pricing.html exactly.
  // guardPayment: if this payment type was selected in the payments Q,
  // skip this add-on (it is already covered by the payment-triggered add-on).
  // includedInPlans: plans that already include this feature, so it is
  // never charged on top (e.g. Pro includes the booking system).
  const ADVANCED_ADDONS = {
    booking_system:      { name: 'Booking / reservation system',  price: 299.50, priceDisplay: '£299.50', desc: 'Let clients book appointments or slots online, with email confirmations', guardPayment: 'bookings', includedInPlans: ['pro', 'ecommerce'] },
    membership:          { name: 'Membership / login area',       price: 299.50, priceDisplay: '£299.50', desc: 'Private pages, login areas, or member-only sections of your site' },
    payment_integration: { name: 'Payment integration',           price: 299.50, priceDisplay: '£299.50', desc: 'Deposits, one-off payments, or similar custom payment flows', guardPayment: 'other', includedInPlans: ['ecommerce'] },
    crm_integration:     { name: 'CRM / third-party integration', price: 299.50, priceDisplay: '£299.50', desc: 'Connect your site and forms to HubSpot, Zoho, or other tools' },
    multi_language:      { name: 'Multi-language support',        price: 299.50, priceDisplay: '£299.50', desc: 'Serve your site in more than one language' },
  };

  // ── Care tiers ────────────────────────────────────────────────
  // Standard prices: founding rates never apply to care plans.
  const CARE = {
    no:      null,
    light:   { name: 'Basic Care',  priceDisplay: '£45/month',  price: 45,  desc: "You'd like occasional help after launch. Basic Care covers hosting management, security monitoring, backup checks, and up to 45 minutes of small tweaks each month." },
    regular: { name: 'Growth Care', priceDisplay: '£95/month',  price: 95,  desc: "You're after regular support after launch. Growth Care includes everything in Basic plus up to 2 hours of updates, Google Business Profile updates, a monthly performance summary, and priority support." },
    full:    { name: 'Pro Care',    priceDisplay: '£185/month', price: 185, desc: "You want full ongoing support, a great call. Pro Care includes everything in Growth plus up to 4 hours of updates each month, same-day priority, and a quarterly strategy call." },
  };

  // ── SEO plans (monthly, stack with care plans and the content pack) ──
  const SEO = {
    no:     null,
    local:  { name: 'SEO Local',  priceDisplay: '£149/month', price: 149, desc: 'On-page optimisation, local citation building, keyword rank tracking, and Google Business Profile optimisation to get you found by customers near you.' },
    growth: { name: 'SEO Growth', priceDisplay: '£299/month', price: 299, desc: 'Everything in SEO Local plus backlink outreach, technical SEO, and competitor tracking for businesses competing beyond their local patch.' },
  };

  // ── Content pack (monthly; single posts also available at £85 each) ──
  const CONTENT = {
    no:  null,
    yes: { name: 'Content pack (4 blog posts)', priceDisplay: '£300/month', price: 300, desc: 'Four professionally written blog posts every month, published and formatted on your site. Single posts are also available at £85 each.' },
  };

  // ── Budget limits ─────────────────────────────────────────────
  const BUDGET_MAX = { 'under500': 500, '500-750': 750, '750plus': Infinity };

  // ── Money formatting ──────────────────────────────────────────
  function fmtMoney(n) {
    var opts = n % 1 === 0 ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return '£' + n.toLocaleString('en-GB', opts);
  }

  // Totals that start from an e-commerce build are estimates ("from £X")
  function fmtTotal(planKey, n) {
    return (PLAN[planKey].isFrom ? 'from ' : '') + fmtMoney(n);
  }

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

  var progressWrap = document.querySelector('.quiz-progress-wrap');

  function setProgress(pct) {
    progressBar.style.width = pct + '%';
    if (progressWrap) progressWrap.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

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
    if (goals.includes('above_all') || payments.includes('bookings'))
      return 'pro';
    if (payments.includes('other') || ans.pages === '5-10')
      return 'growth';
    if (ans.pages === '1-3')
      return 'starter';
    return 'growth';
  }

  // ── Add-on selection ──────────────────────────────────────────
  function buildAddons(ans, planKey) {
    var list     = [];
    var payments = Array.isArray(ans.payments)  ? ans.payments  : [];
    var types    = Array.isArray(ans.addonTypes) ? ans.addonTypes : [];

    // Payment-triggered add-ons. Pro includes the booking system and
    // E-commerce includes payments, so those are never charged on top.
    if (payments.includes('bookings') && planKey !== 'pro' && planKey !== 'ecommerce') {
      list.push(ADDON.booking_payment);
    }
    if (payments.includes('other') && planKey !== 'ecommerce') {
      list.push(ADDON.payment_integration);
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
          // Skip if the plan already includes this feature (e.g. booking on Pro)
          if (addon.includedInPlans && addon.includedInPlans.includes(planKey)) return;
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

    var planOrder = ['ecommerce', 'pro', 'growth', 'starter'];
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
    var planKey     = pickPlan(answers);
    var addons      = buildAddons(answers, planKey);
    var careTier    = CARE[answers.care] || null;
    var seoTier     = SEO[answers.seo] || null;
    var contentTier = CONTENT[answers.content] || null;
    var totalPrice  = PLAN[planKey].price + addons.reduce(function (s, a) { return s + a.price; }, 0);
    var budget      = checkBudget(planKey, addons, answers.budget);

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
          upfrontTotal: fmtTotal(planKey, totalPrice),
          careTier:     careTier ? { name: careTier.name, price: careTier.priceDisplay } : null,
          seoTier:      seoTier ? { name: seoTier.name, price: seoTier.priceDisplay } : null,
          contentTier:  contentTier ? { name: contentTier.name, price: contentTier.priceDisplay } : null,
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
      // Timeout or network error: fallback text already set
    }

    fadeTransition(function () { showResult(planKey, addons, careTier, seoTier, contentTier, totalPrice, budget, explanation); });
  }

  // ── Result screen ─────────────────────────────────────────────
  function showResult(planKey, addons, careTier, seoTier, contentTier, totalPrice, budget, explanation) {
    var plan    = PLAN[planKey];
    var wb      = budget.withinBudget;
    var wbTotal = PLAN[wb.planKey].price + wb.addons.reduce(function (s, a) { return s + a.price; }, 0);

    var monthlyTiers = [careTier, seoTier, contentTier].filter(Boolean);

    function summaryBox(pk, arr, upfront) {
      var p    = PLAN[pk];
      var rows = '<div class="quiz-result-sum-row"><span>' + p.name + ' build (founding rate)</span><strong>' + p.priceDisplay + '</strong></div>';
      arr.forEach(function (a) {
        rows += '<div class="quiz-result-sum-row"><span>' + a.name + '</span><strong>' + a.priceDisplay + '</strong></div>';
      });
      if (arr.length > 0) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-total"><span><strong>Estimated upfront total</strong></span><strong>' + fmtTotal(pk, upfront) + '</strong></div>';
      }
      monthlyTiers.forEach(function (m) {
        rows += '<div class="quiz-result-sum-row quiz-result-sum-mrr"><span>' + m.name + '</span><strong>' + m.priceDisplay + '</strong></div>';
      });
      return '<div class="quiz-result-summary-box">' + rows + '</div>' +
        '<p class="quiz-result-rec-note">' + p.foundingNote + '</p>';
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
      var items = [{ label: p.name + ' build (founding rate)', value: p.priceDisplay }];
      arr.forEach(function (a) { items.push({ label: a.name, value: a.priceDisplay }); });
      if (arr.length > 0) items.push({ label: 'Estimated upfront total', value: fmtTotal(pk, upfront), isTotal: true });
      monthlyTiers.forEach(function (m) { items.push({ label: m.name, value: m.priceDisplay, isMrr: true }); });

      var lines = ['Estimated plan from website quiz (subject to confirmation):', ''];
      items.forEach(function (item) { lines.push(item.label + ': ' + item.value); });
      lines.push('', p.foundingNote);

      return JSON.stringify({ items: items, text: lines.join('\n') });
    }

    // One box per chosen monthly service (care plan, SEO plan, content pack)
    var monthlyHtml = monthlyTiers.map(function (m) {
      return '<div class="quiz-result-care-box">' +
          '<div class="quiz-result-care-name">' + m.name +
            '<span class="quiz-result-care-price">' + m.priceDisplay + '</span>' +
          '</div>' +
          '<p class="quiz-result-care-reason">' + m.desc + '</p>' +
        '</div>';
    }).join('');

    // Offer whatever monthly extras the visitor did not pick, and always
    // mention single blog posts at £85.
    var extraParts = [];
    if (!seoTier)     extraParts.push('SEO Local at £149/mo or SEO Growth at £299/mo');
    if (!contentTier) extraParts.push('blog posts at £85 each (or a 4-post monthly pack for £300/mo)');
    else              extraParts.push('single blog posts at £85 each whenever you need an extra one');
    var extrasHtml = '<p class="quiz-result-extras">Also available, priced separately: ' + extraParts.join(', plus ') + '. Everything stacks with any care plan.</p>';

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
          '<div class="quiz-result-badge">&#10003; Your personalised recommendation</div>' +
          '<h2 class="quiz-result-title">Here\'s what we\'d recommend</h2>' +
          '<p class="quiz-result-intro">' + explanation + '</p>' +
        '</div>' +
        recsHtml +
        monthlyHtml +
        extrasHtml +
        '<p class="quiz-result-disclaimer">This is an estimate to give you a clear starting point, based on what you\'ve told us. The final price may shift slightly once we\'ve had a proper chat about your project and the details. Sometimes things turn out simpler than expected, sometimes there\'s a bit more to it. Either way, there are no surprises: we\'ll always confirm everything with you in writing before any work begins.</p>' +
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
