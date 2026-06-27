document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navDropdown = document.querySelector('.nav-dropdown');

navToggle.addEventListener('click', () => {
  const open = navDropdown.classList.toggle('open');
  navToggle.classList.toggle('active', open);
});

document.querySelectorAll('.nav-dropdown a').forEach((link) => {
  link.addEventListener('click', () => {
    navDropdown.classList.remove('open');
    navToggle.classList.remove('active');
  });
});

document.querySelectorAll('.glow-card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

if (form) {
  // When arriving from the quiz, switch the plan field to a read-only summary
  // and pre-fill the message textarea with the itemised plan text.
  const savedPlanRaw = sessionStorage.getItem('quizPlan');
  if (savedPlanRaw) {
    let planData = null;
    try { planData = JSON.parse(savedPlanRaw); } catch (_) {}

    if (planData && Array.isArray(planData.items) && planData.items.length) {
      // Hide the normal package dropdown and show the quiz result instead
      const planNormal   = document.getElementById('planNormal');
      const planQuiz     = document.getElementById('planQuiz');
      const budgetSelect = document.getElementById('budget');
      const planSummary  = document.getElementById('quizPlanSummary');
      const planLabel    = document.getElementById('planQuizHidden');

      if (planNormal) planNormal.style.display = 'none';
      if (planQuiz)   planQuiz.style.display   = '';
      if (budgetSelect) budgetSelect.disabled   = true; // exclude from submission

      // Set the hidden budget field to a short plan identifier for the email subject
      if (planLabel) {
        const firstItem = planData.items[0].label.replace(' build', '');
        planLabel.value = 'Quiz result — ' + firstItem;
      }

      // Render the dark itemised breakdown
      if (planSummary) {
        planSummary.innerHTML = planData.items.map(item => {
          let cls = 'quiz-plan-row';
          if (item.isTotal) cls += ' quiz-plan-row--total';
          if (item.isMrr)   cls += ' quiz-plan-row--mrr';
          return '<div class="' + cls + '"><span>' + item.label + '</span><strong>' + item.value + '</strong></div>';
        }).join('');
      }

      // Pre-fill message with the plain-text summary
      const messageField = document.getElementById('message');
      if (messageField && planData.text) {
        messageField.value = planData.text;
      }

      sessionStorage.removeItem('quizPlan');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      note.textContent = "Thanks! We'll be in touch within one business day.";
      form.reset();
    } catch (_) {
      note.textContent = 'Something went wrong. Please email us at contact@martinandharding.co.uk';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Stagger reveal timing for grouped elements (cards in a grid, hero CTAs, etc.)
document.querySelectorAll('.reveal-group').forEach((group) => {
  group.querySelectorAll(':scope > .reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });
});

const revealEls = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));
}

// Scroll-driven 3D tilt frame around the pricing builds grid
const scrollStage = document.querySelector('[data-scroll-stage]');
if (scrollStage && !prefersReducedMotion) {
  const scrollCard = scrollStage.querySelector('[data-scroll-card]');
  const scrollTitle = scrollStage.querySelector('[data-scroll-title]');
  const isMobileTilt = () => window.innerWidth <= 768;

  const updateTilt = () => {
    const vh = window.innerHeight;

    // Tilt only happens on the way in: leaning back while the card is
    // still approaching the viewport's center from below, then settling
    // perfectly flat once it reaches center — and staying flat from then
    // on, with no reverse tilt as it later scrolls out of sight.
    const cardRect = scrollCard.getBoundingClientRect();
    const cardCenter = cardRect.top + cardRect.height / 2;
    const viewportCenter = vh / 2;
    const range = vh / 2 + cardRect.height / 2;
    const normalized = Math.max(0, Math.min(1, (cardCenter - viewportCenter) / range));

    const maxTilt = isMobileTilt() ? 9 : 14;
    const rotate = maxTilt * normalized;

    scrollCard.style.transform = `rotateX(${rotate}deg)`;

    const stageRect = scrollStage.getBoundingClientRect();
    const enterTotal = stageRect.height + vh;
    const enterScrolled = vh - stageRect.top;
    const enterProgress = Math.min(Math.max(enterScrolled / enterTotal, 0), 1);
    scrollTitle.style.transform = `translateY(${-30 * enterProgress}px)`;
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateTilt();
        ticking = false;
      });
    }
  };

  window.addEventListener('scroll', onScroll);
  window.addEventListener('resize', updateTilt);
  updateTilt();
}

// ---------- Cookie consent (categories) + gated scripts ----------
// TODO: replace with your real GA4 Measurement ID from analytics.google.com
const GA_MEASUREMENT_ID = 'G-7LYB56D3D0';
const CONSENT_KEY = 'cookie-consent';

const COOKIE_CATEGORIES = [
  { id: 'necessary', label: 'Necessary', locked: true },
  { id: 'preferences', label: 'Preferences', locked: false },
  { id: 'statistics', label: 'Statistics', locked: false },
  { id: 'marketing', label: 'Marketing', locked: false },
];

function loadAnalytics() {
  if (window.gaLoaded) return;
  window.gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);

  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
}

// Hook real marketing pixels (Meta Pixel, Google Ads, etc.) in here once you have them.
function loadMarketing() {
  if (window.marketingLoaded) return;
  window.marketingLoaded = true;
}

function applyConsent(consent) {
  if (consent.statistics) loadAnalytics();
  if (consent.marketing) loadMarketing();
}

function getCookieConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCookieConsent(consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, updatedAt: new Date().toISOString() }));
}

function showCookieBanner() {
  if (document.getElementById('cookieBanner')) return;

  const saved = getCookieConsent() || {};

  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <div class="cookie-banner-main">
      <h3 class="cookie-banner-title">This website uses cookies</h3>
      <p>We use cookies to personalise content, provide social media features, and analyse our traffic.
      We also share information about your use of this site with our analytics partners. Choose what
      you're happy with below.</p>
      <div class="cookie-toggles">
        ${COOKIE_CATEGORIES.map((cat) => `
          <label class="cookie-toggle">
            <span>${cat.label}</span>
            <span class="switch">
              <input type="checkbox" data-cat="${cat.id}"
                ${cat.locked ? 'checked disabled' : (saved[cat.id] ? 'checked' : '')}>
              <span class="switch-track"></span>
            </span>
          </label>
        `).join('')}
      </div>
    </div>
    <div class="cookie-banner-divider"></div>
    <div class="cookie-banner-actions">
      <button type="button" class="btn btn-ghost btn-block" id="cookieDeny">Deny</button>
      <button type="button" class="btn btn-ghost btn-block" id="cookieAllowSelection">Allow selection</button>
      <button type="button" class="btn btn-dark btn-block" id="cookieAcceptAll">Accept all</button>
    </div>
  `;
  document.body.appendChild(banner);

  const readToggleState = () => {
    const consent = { necessary: true };
    banner.querySelectorAll('input[data-cat]').forEach((input) => {
      consent[input.dataset.cat] = input.checked;
    });
    return consent;
  };

  document.getElementById('cookieAcceptAll').addEventListener('click', () => {
    const consent = { necessary: true, preferences: true, statistics: true, marketing: true };
    setCookieConsent(consent);
    applyConsent(consent);
    banner.remove();
  });
  document.getElementById('cookieDeny').addEventListener('click', () => {
    const consent = { necessary: true, preferences: false, statistics: false, marketing: false };
    setCookieConsent(consent);
    banner.remove();
  });
  document.getElementById('cookieAllowSelection').addEventListener('click', () => {
    const consent = readToggleState();
    setCookieConsent(consent);
    applyConsent(consent);
    banner.remove();
  });
}

const existingCookieConsent = getCookieConsent();
if (existingCookieConsent) {
  applyConsent(existingCookieConsent);
} else {
  showCookieBanner();
}

// Lets a visitor reopen the banner later and change their mind
const footerLinksEl = document.querySelector('.footer-links');
if (footerLinksEl) {
  const cookieSettingsLink = document.createElement('a');
  cookieSettingsLink.href = '#';
  cookieSettingsLink.textContent = 'Cookie settings';
  cookieSettingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    const existing = document.getElementById('cookieBanner');
    if (existing) existing.remove();
    showCookieBanner();
  });
  footerLinksEl.appendChild(cookieSettingsLink);
}
