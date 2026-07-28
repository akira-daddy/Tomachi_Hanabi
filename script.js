/* ==========================================================================
   とおまち夏花火ナイト LP - script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStickyCta();
  initFaqAccordion();
  initSmoothAnchorScroll();
  initHeroResponsiveMedia();
  initHeroVideo();
  initReservationModal();
});

/* --------------------------------------------------------------------------
   1. sticky CTAバーの表示制御
   - ①HEROが画面外に出たら表示開始（フェードイン）
   - ⑬最終CTAに到達したら非表示
   -------------------------------------------------------------------------- */
function initStickyCta() {
  const stickyCta = document.getElementById('stickyCta');
  const hero = document.getElementById('hero');
  const finalCta = document.getElementById('final');

  if (!stickyCta || !hero || !finalCta) return;

  let heroVisible = true;
  let finalCtaVisible = false;

  const updateVisibility = () => {
    const shouldShow = !heroVisible && !finalCtaVisible;
    stickyCta.classList.toggle('is-visible', shouldShow);
    stickyCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  };

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      heroVisible = entry.isIntersecting;
      updateVisibility();
    });
  }, { threshold: 0, rootMargin: '0px' });

  const finalCtaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      finalCtaVisible = entry.isIntersecting;
      updateVisibility();
    });
  }, { threshold: 0.15 });

  heroObserver.observe(hero);
  finalCtaObserver.observe(finalCta);
}

/* --------------------------------------------------------------------------
   2. FAQアコーディオンの開閉
   - 初期表示3問（Q1/Q4/Q3）は常時展開（.faq-item--open、トグル操作不要）
   - 残りは button[aria-expanded] で開閉
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const toggles = document.querySelectorAll('.faq-item__q--toggle');

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
    });
  });
}

/* --------------------------------------------------------------------------
   3. アンカースクロール
   - sticky CTAの高さ分オフセットして、見出しが隠れないようにする
   -------------------------------------------------------------------------- */
function initSmoothAnchorScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  const stickyCta = document.getElementById('stickyCta');

  links.forEach((link) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    link.addEventListener('click', (e) => {
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const stickyHeight = stickyCta && stickyCta.classList.contains('is-visible')
        ? stickyCta.offsetHeight
        : 0;
      const offset = 16 + stickyHeight;

      const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}

/* --------------------------------------------------------------------------
   4-2. Hero背景動画の再生制御
   - HEROが画面外に出たら一時停止（バッテリー・パフォーマンス対策）
   - 画面に戻ったら再生を再開
   -------------------------------------------------------------------------- */
function initHeroVideo() {
  const hero = document.getElementById('hero');
  const video = hero ? hero.querySelector('.hero__bg-video') : null;
  if (!hero || !video) return;

  // モーション低減設定のユーザーには動画を止めてポスター画像を表示
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    video.pause();
    video.removeAttribute('autoplay');
    return;
  }

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0 });

  videoObserver.observe(hero);
}

/* --------------------------------------------------------------------------
   4. Hero背景画像のSP/PC出し分け（matchMedia）
   - <picture>で基本は出し分け済みだが、JS側でも状態を把握できるようにしておく
   -------------------------------------------------------------------------- */
function initHeroResponsiveMedia() {
  const mql = window.matchMedia('(min-width: 768px)');

  const applyHeroMode = (matches) => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    hero.dataset.mode = matches ? 'pc' : 'sp';
  };

  applyHeroMode(mql.matches);

  if (mql.addEventListener) {
    mql.addEventListener('change', (e) => applyHeroMode(e.matches));
  } else if (mql.addListener) {
    // Safari旧バージョン対応
    mql.addListener((e) => applyHeroMode(e.matches));
  }
}

/* --------------------------------------------------------------------------
   5. 観覧席予約モーダル
   - GAS（Google Apps Script）のWebアプリにPOSTし、
     スプレッドシートへの記録＋確認メール送信を行う
   -------------------------------------------------------------------------- */

// ▼▼▼ GASデプロイ後、Web AppのURLをここに設定してください ▼▼▼
const RESERVATION_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxZ8ueuyiluqAXcdnxVpLVXwKETv-eGFnIH186VKGooPX8F2WTmf5pByYoRaf3iZP8b/exec';
// ▲▲▲ ---------------------------------------------------- ▲▲▲

function initReservationModal() {
  const openBtns = document.querySelectorAll('.js-open-reservation');
  const modal = document.getElementById('reservationModal');
  const overlay = document.getElementById('reservationModalOverlay');
  const closeBtn = document.getElementById('reservationModalClose');
  const doneCloseBtn = document.getElementById('reservationDoneCloseBtn');
  const form = document.getElementById('reservationForm');
  const formView = document.getElementById('reservationFormView');
  const doneView = document.getElementById('reservationDoneView');
  const submitBtn = document.getElementById('rfSubmitBtn');
  const submitBtnText = document.getElementById('rfSubmitBtnText');
  const submitError = document.getElementById('rfSubmitError');

  if (!openBtns.length || !modal || !form) return;

  let lastFocusedEl = null;

  const openModal = () => {
    lastFocusedEl = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const firstInput = document.getElementById('rfName');
    if (firstInput) firstInput.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  };

  const resetToFormView = () => {
    formView.hidden = false;
    doneView.hidden = true;
  };

  openBtns.forEach((btn) => btn.addEventListener('click', openModal));
  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  doneCloseBtn.addEventListener('click', () => {
    closeModal();
    // 完了画面から閉じたら、次回オープン時のためにフォームをリセット
    form.reset();
    clearAllErrors();
    resetToFormView();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* ---------------- バリデーション定義 ---------------- */

  const fields = {
    name: {
      input: document.getElementById('rfName'),
      error: document.getElementById('rfNameError'),
      validate: (v) => {
        if (!v.trim()) return 'お名前を入力してください。';
        if (v.trim().length > 40) return 'お名前は40文字以内で入力してください。';
        return '';
      }
    },
    kana: {
      input: document.getElementById('rfKana'),
      error: document.getElementById('rfKanaError'),
      validate: (v) => {
        if (!v.trim()) return 'フリガナを入力してください。';
        if (!/^[ァ-ヶー\s　]+$/.test(v.trim())) return 'フリガナは全角カタカナで入力してください。';
        return '';
      }
    },
    email: {
      input: document.getElementById('rfEmail'),
      error: document.getElementById('rfEmailError'),
      validate: (v) => {
        if (!v.trim()) return 'メールアドレスを入力してください。';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'メールアドレスの形式が正しくありません。';
        return '';
      }
    },
    phone: {
      input: document.getElementById('rfPhone'),
      error: document.getElementById('rfPhoneError'),
      validate: (v) => {
        const digits = v.trim();
        if (!digits) return '電話番号を入力してください。';
        if (!/^0\d{9,10}$/.test(digits.replace(/-/g, ''))) return '電話番号の形式が正しくありません（例：09012345678）。';
        return '';
      }
    },
    count: {
      input: document.getElementById('rfCount'),
      error: document.getElementById('rfCountError'),
      validate: (v) => {
        const n = Number(v);
        if (!v || Number.isNaN(n)) return '人数を入力してください。';
        if (!Number.isInteger(n) || n < 1 || n > 10) return '人数は1〜10名の範囲で入力してください。';
        return '';
      }
    }
  };

  const showFieldError = (key, message) => {
    const { input, error } = fields[key];
    error.textContent = message;
    input.classList.toggle('is-invalid', Boolean(message));
  };

  const clearAllErrors = () => {
    Object.keys(fields).forEach((key) => showFieldError(key, ''));
    document.getElementById('rfAgreeError').textContent = '';
    submitError.textContent = '';
  };

  // リアルタイムバリデーション（入力中はエラー表示をクリア、blurで再検証）
  Object.keys(fields).forEach((key) => {
    const { input } = fields[key];
    input.addEventListener('blur', () => {
      const message = fields[key].validate(input.value);
      showFieldError(key, message);
    });
    input.addEventListener('input', () => {
      if (fields[key].error.textContent) {
        const message = fields[key].validate(input.value);
        showFieldError(key, message);
      }
    });
  });

  const validateAll = () => {
    let isValid = true;
    Object.keys(fields).forEach((key) => {
      const message = fields[key].validate(fields[key].input.value);
      showFieldError(key, message);
      if (message) isValid = false;
    });

    const agreeInput = document.getElementById('rfAgree');
    const agreeError = document.getElementById('rfAgreeError');
    if (!agreeInput.checked) {
      agreeError.textContent = 'キャンセルポリシーへの同意が必要です。';
      isValid = false;
    } else {
      agreeError.textContent = '';
    }

    return isValid;
  };

  /* ---------------- 送信処理 ---------------- */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitError.textContent = '';

    if (!validateAll()) {
      const firstInvalid = form.querySelector('.is-invalid, #rfAgreeError:not(:empty)');
      if (firstInvalid) {
        const target = firstInvalid.id === 'rfAgreeError'
          ? document.getElementById('rfAgree')
          : firstInvalid;
        target.focus({ preventScroll: false });
      }
      return;
    }

    if (!RESERVATION_GAS_ENDPOINT || RESERVATION_GAS_ENDPOINT.indexOf('【ここに') !== -1) {
      submitError.textContent = '送信先が設定されていません。GASのデプロイURLをscript.jsに設定してください。';
      return;
    }

    const payload = {
      name: fields.name.input.value.trim(),
      kana: fields.kana.input.value.trim(),
      email: fields.email.input.value.trim(),
      phone: fields.phone.input.value.trim(),
      count: Number(fields.count.input.value),
      note: document.getElementById('rfNote').value.trim(),
      pagePath: window.location.href,
      userAgent: navigator.userAgent
    };

    submitBtn.disabled = true;
    submitBtnText.textContent = '送信中…';

    // GAS Web Appはtext/plainでのPOSTを推奨（CORSプリフライト回避のため）
    fetch(RESERVATION_GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.result === 'success') {
          formView.hidden = true;
          doneView.hidden = false;
        } else {
          submitError.textContent = (data && data.message)
            ? data.message
            : '送信に失敗しました。時間をおいて再度お試しください。';
        }
      })
      .catch(() => {
        submitError.textContent = '通信エラーが発生しました。通信環境をご確認のうえ、再度お試しください。';
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtnText.textContent = 'この内容で申し込む';
      });
  });
}
