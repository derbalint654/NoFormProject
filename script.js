/* =====================================================================
   NoForm Project – interakciók
   Minden mozgás "ráadás": a tartalom JavaScript nélkül is olvasható,
   és ha a látogató kevesebb mozgást kért, az animációk kikapcsolnak.
   ===================================================================== */
(function () {
  'use strict';

  var cfg = window.NOFORM_CONFIG || {};
  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = function () { return mqReduce.matches; };

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ph = function (text) { return '<span class="ph">[IDE JÖN: ' + esc(text) + ']</span>'; };
  var currency = cfg.currency || 'Ft';
  var num = function (n) { return new Intl.NumberFormat('hu-HU').format(n); };
  var money = function (n) { return num(n) + ' ' + currency; };

  // ------------------------------------------------------------------
  // Téma: rendszer szerint, vagy a kapcsolóval felülírva
  // ------------------------------------------------------------------
  function initTheme() {
    var btn = $('.theme-toggle');
    var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    var resolved = function () { return root.getAttribute('data-theme') || (mqDark.matches ? 'dark' : 'light'); };
    var sync = function () {
      var r = resolved();
      root.setAttribute('data-resolved-theme', r);
      if (btn) btn.setAttribute('aria-pressed', r === 'dark' ? 'true' : 'false');
    };
    sync();
    mqDark.addEventListener('change', sync);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = resolved() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('noform-theme', next); } catch (e) {}
      sync();
    });
  }

  // ------------------------------------------------------------------
  // Fejléc: vonal görgetéskor, mobil menü
  // ------------------------------------------------------------------
  function initHeader() {
    var header = $('.site-header');
    var nav = $('#site-nav');
    var toggle = $('.menu-toggle');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  // ------------------------------------------------------------------
  // Elérhetőségek és impresszum a config.js-ből
  // ------------------------------------------------------------------
  function initContacts() {
    var c = cfg.contact || {};
    if (c.email) $$('[data-contact="email"]').forEach(function (a) { a.href = 'mailto:' + c.email; a.textContent = c.email; });
    if (c.phone) $$('[data-contact="phone"]').forEach(function (a) { a.href = 'tel:' + (c.phoneHref || c.phone.replace(/\s/g, '')); a.textContent = c.phone; });

    var co = cfg.company || {};
    var nameEl = $('[data-company="name"]');
    if (co.name && nameEl) nameEl.textContent = co.name;
    var det = $('[data-company="details"]');
    if (det && co.name && co.seat && co.taxNumber && co.registryNumber) {
      det.innerHTML = esc(co.name) + '<br>Székhely: ' + esc(co.seat) + '<br>Adószám: ' + esc(co.taxNumber) + '<br>Cégjegyzékszám: ' + esc(co.registryNumber);
    }
    var y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  // ------------------------------------------------------------------
  // Csomagok és árak
  // ------------------------------------------------------------------
  var packages = cfg.packages || [];
  var extras = cfg.extras || [];

  function priceHTML(p) {
    if (p.price == null) return ph('ár') + (p.from ? '<small>-tól</small>' : '');
    return num(p.price) + '<small>' + esc(currency) + (p.from ? '-tól' : '') + '</small>';
  }
  function priceText(p) {
    if (p.price == null) return '[IDE JÖN: ár]' + (p.from ? '-tól' : '');
    return money(p.price) + (p.from ? '-tól' : '');
  }

  function initPricing() {
    var wrap = $('#plans');
    if (!wrap) return;
    wrap.innerHTML = packages.map(function (p) {
      var cls = 'plan' + (p.featured ? ' plan--featured' : '') + (p.from ? ' plan--custom' : '');
      var btnCls = p.featured ? 'btn btn--primary magnetic' : (p.from ? 'btn btn--outline' : 'btn btn--earth');
      return '<article class="' + cls + '" aria-labelledby="plan-' + esc(p.id) + '">' +
        (p.badge ? '<p class="plan-badge">' + esc(p.badge) + '</p>' : '') +
        '<h3 class="plan-name" id="plan-' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
        '<p class="plan-lead">' + esc(p.lead || '') + '</p>' +
        '<p class="plan-price">' + priceHTML(p) + '</p>' +
        '<ul class="plan-features">' + (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
        '<a class="' + btnCls + '" href="#ajanlat" data-pick="' + esc(p.id) + '">Ezt kérem<span class="sr-only">: ' + esc(p.name) + '</span></a>' +
        '</article>';
    }).join('');

    var m = cfg.monthly;
    var monthly = $('#plans-monthly');
    if (m && monthly) {
      monthly.innerHTML = '<strong>' + esc(m.label) + ':</strong> ' +
        (m.price == null ? ph('ár') + '/hó' : money(m.price) + '/hó') +
        '. Nem kötelező, csak ha kéred.';
    }
  }

  // ------------------------------------------------------------------
  // Árajánlatkérő
  // ------------------------------------------------------------------
  function initQuiz() {
    var quiz = $('[data-quiz]');
    if (!quiz) return;
    var form = $('form', quiz);
    var steps = $$('.quiz-step', form);
    var total = steps.length;
    var count = $('.quiz-count', form);
    var dots = $$('.quiz-dots li', form);
    var back = $('.quiz-back', form);
    var next = $('.quiz-next', form);
    var submit = $('.quiz-submit', form);
    var formError = $('.form-error', form);
    var rangeEl = $('.estimate-range', form);
    var picked = $('.quiz-picked', form);
    var done = $('.quiz-done', quiz);
    var current = 1;
    var busy = false;

    // 2. lépés: csomagok
    var plansWrap = $('#quiz-plans');
    var tileCls = ['tile--a', 'tile--b', 'tile--d', 'tile--c'];
    plansWrap.innerHTML = packages.map(function (p, i) {
      return '<label class="tile ' + tileCls[i % tileCls.length] + '"><input type="radio" name="ui-csomag" value="' + esc(p.id) + '" aria-describedby="err-csomag">' +
        '<span>' + esc(p.name) + '<small>' + esc(priceText(p)) + '</small></span></label>';
    }).join('') +
      '<label class="tile tile--e"><input type="radio" name="ui-csomag" value="nemtudom" aria-describedby="err-csomag"><span>Még nem tudom<small>Megbeszéljük, melyik illik hozzád</small></span></label>';

    // 3. lépés: extrák
    $('#quiz-extras').innerHTML = extras.map(function (x) {
      return '<label class="check"><input type="checkbox" name="ui-extra" value="' + esc(x.id) + '">' +
        '<span class="check-row"><span class="check-box" aria-hidden="true"></span><span>' + esc(x.label) + '</span>' +
        '<span class="check-note" hidden>benne van a csomagban</span></span></label>';
    }).join('');

    $$('input[name="tevekenyseg"]', form).forEach(function (r) { r.setAttribute('aria-describedby', 'err-tevekenyseg'); });

    // --- becsült ár ---
    var selectedPkg = function () { var r = $('input[name="ui-csomag"]:checked', form); return r ? r.value : null; };
    var selectedExtras = function () { return $$('input[name="ui-extra"]:checked', form).map(function (c) { return c.value; }); };
    var pkgById = function (id) { return packages.filter(function (p) { return p.id === id; })[0]; };

    function calcEstimate() {
      var id = selectedPkg();
      if (!id) return { state: 'none' };
      var min, max, open = false;
      if (id === 'nemtudom') {
        if (packages.some(function (p) { return p.price == null; })) return { state: 'missing' };
        min = Math.min.apply(null, packages.map(function (p) { return p.price; }));
        max = Math.max.apply(null, packages.map(function (p) { return p.priceMax != null ? p.priceMax : p.price; }));
      } else {
        var p = pkgById(id);
        if (!p || p.price == null) return { state: 'missing' };
        min = p.price;
        max = p.priceMax != null ? p.priceMax : p.price;
        open = p.from && p.priceMax == null;
      }
      var chosen = selectedExtras();
      for (var i = 0; i < extras.length; i++) {
        var x = extras[i];
        if (chosen.indexOf(x.id) === -1 || (x.includedIn || []).indexOf(id) !== -1) continue;
        if (x.min == null) return { state: 'missing' };
        min += x.min;
        max += x.max != null ? x.max : x.min;
      }
      var step = cfg.estimateRounding || 1;
      return { state: 'ok', min: Math.round(min / step) * step, max: Math.round(max / step) * step, open: open };
    }

    function estimateText(est) {
      if (est.state === 'none') return 'válassz csomagot';
      if (est.state === 'missing') return '[IDE JÖN: árak a config.js-ben]';
      if (est.open) return money(est.min) + '-tól';
      if (est.min === est.max) return money(est.min);
      return num(est.min) + ' – ' + money(est.max);
    }

    function updateEstimate() {
      var est = calcEstimate();
      var txt = estimateText(est);
      rangeEl.innerHTML = est.state === 'missing' ? ph('árak a config.js-ben') : esc(txt);
      form.elements['becsult_ar'].value = est.state === 'ok' ? txt : '';
      // "benne van a csomagban" jelzések
      var id = selectedPkg();
      $$('.check', form).forEach(function (label, i) {
        var inc = id && (extras[i].includedIn || []).indexOf(id) !== -1;
        $('.check-note', label).hidden = !inc;
      });
    }

    function syncHidden() {
      var id = selectedPkg();
      var p = pkgById(id);
      form.elements['csomag'].value = id === 'nemtudom' ? 'Még nem tudom' : (p ? p.name : '');
      form.elements['extrak'].value = selectedExtras().map(function (eid) {
        return extras.filter(function (x) { return x.id === eid; })[0].label;
      }).join(', ');
      updateEstimate();
    }

    // --- hibák ---
    function setError(errId, msg, field) {
      var el = document.getElementById(errId);
      el.textContent = msg;
      el.hidden = false;
      if (field) field.setAttribute('aria-invalid', 'true');
    }
    function clearError(errId, field) {
      var el = document.getElementById(errId);
      if (el) { el.hidden = true; el.textContent = ''; }
      if (field) field.removeAttribute('aria-invalid');
    }

    function validate(n) {
      var firstBad = null;
      if (n === 1 && !$('input[name="tevekenyseg"]:checked', form)) {
        setError('err-tevekenyseg', 'Válassz egyet, hogy tudjuk, kinek készül az oldal.');
        firstBad = $('input[name="tevekenyseg"]', form);
      }
      if (n === 2 && !selectedPkg()) {
        setError('err-csomag', 'Válassz egy csomagot, vagy jelöld, hogy még nem tudod.');
        firstBad = $('input[name="ui-csomag"]', form);
      }
      if (n === 4) {
        var link = $('#f-link');
        var v = link.value.trim();
        if (v && (/\s/.test(v) || !/[^.\s]\.[a-z]{2,}/i.test(v))) {
          setError('err-link', 'Ez nem tűnik linknek. Valami ilyesmire gondolunk: facebook.com/akavezod', link);
          firstBad = link;
        } else clearError('err-link', link);
      }
      if (n === 5) {
        var name = $('#f-name'), email = $('#f-email'), phone = $('#f-phone');
        var bad = [];
        if (!name.value.trim()) { setError('err-name', 'Írd be a neved, hogy tudjuk, kit keressünk.', name); bad.push(name); }
        else clearError('err-name', name);
        var ev = email.value.trim();
        if (!ev) { setError('err-email', 'Írd be az e-mail-címed, erre küldjük a választ.', email); bad.push(email); }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev)) { setError('err-email', 'Ez az e-mail-cím hiányos, nézd meg még egyszer.', email); bad.push(email); }
        else clearError('err-email', email);
        var pv = phone.value.trim();
        if (pv && (pv.replace(/\D/g, '').length < 8 || /[a-z]/i.test(pv))) { setError('err-phone', 'Ez a telefonszám nem tűnik teljesnek, nézd meg még egyszer.', phone); bad.push(phone); }
        else clearError('err-phone', phone);
        firstBad = bad[0] || null;
      }
      if (firstBad) { firstBad.focus(); return false; }
      return true;
    }

    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'tevekenyseg') clearError('err-tevekenyseg');
      if (t.name === 'ui-csomag') { clearError('err-csomag'); picked.hidden = true; }
      if (t.name === 'ui-csomag' || t.name === 'ui-extra') syncHidden();
    });
    form.addEventListener('input', function (e) {
      var map = { 'f-link': 'err-link', 'f-name': 'err-name', 'f-email': 'err-email', 'f-phone': 'err-phone' };
      if (map[e.target.id] && e.target.getAttribute('aria-invalid')) clearError(map[e.target.id], e.target);
    });

    // --- lépések ---
    function render() {
      steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== current; });
      count.textContent = current + '. kérdés az ' + total + '-ből';
      dots.forEach(function (d, i) {
        d.classList.toggle('is-done', i + 1 < current);
        d.classList.toggle('is-current', i + 1 === current);
      });
      back.hidden = current === 1;
      next.hidden = current === total;
      submit.hidden = current !== total;
      formError.hidden = true;
    }

    function go(n, dir) {
      if (busy || n < 1 || n > total || n === current) return;
      root.setAttribute('data-dir', dir);
      var swap = function () { current = n; render(); };
      var after = function () {
        var step = steps[current - 1];
        step.setAttribute('tabindex', '-1');
        step.focus({ preventScroll: true });
        var top = quiz.getBoundingClientRect().top;
        if (top < 0) quiz.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      };
      if (document.startViewTransition && !reduced()) {
        busy = true;
        var vt = document.startViewTransition(swap);
        // gyors kattintásnál a böngésző átugorhatja az áttűnést, ez nem hiba
        vt.ready.catch(function () {});
        vt.finished.catch(function () {});
        vt.updateCallbackDone.then(function () { busy = false; after(); }, function () { busy = false; });
      } else {
        swap();
        if (!reduced()) {
          var s = steps[current - 1];
          s.classList.remove('enter', 'enter-back');
          void s.offsetWidth;
          s.classList.add(dir === 'back' ? 'enter-back' : 'enter');
        }
        after();
      }
    }

    next.addEventListener('click', function () { if (validate(current)) go(current + 1, 'fwd'); });
    back.addEventListener('click', function () { go(current - 1, 'back'); });

    // Egérrel/ujjal választva a csempe után magától továbblép (billentyűzettel nem)
    var lastPointer = 0;
    form.addEventListener('pointerdown', function (e) { if (e.target.closest('.tile')) lastPointer = Date.now(); });
    form.addEventListener('change', function (e) {
      if ((e.target.name === 'tevekenyseg' || e.target.name === 'ui-csomag') && Date.now() - lastPointer < 1200) {
        var from = current;
        setTimeout(function () { if (current === from) go(current + 1, 'fwd'); }, 320);
      }
    });

    // "Ezt kérem" gombok: csomag előválasztása
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-pick]');
      if (!a) return;
      if (!done.hidden) restart();
      var radio = $('input[name="ui-csomag"][value="' + a.getAttribute('data-pick') + '"]', form);
      if (!radio) return;
      radio.checked = true;
      clearError('err-csomag');
      syncHidden();
      var p = pkgById(radio.value);
      picked.textContent = 'Kiválasztva: ' + p.name + ' csomag. A 2. kérdésnél még átírhatod.';
      picked.hidden = current !== 1;
      setTimeout(function () { $('#quote-title').focus({ preventScroll: true }); }, reduced() ? 0 : 700);
    });

    // --- küldés (Netlify Forms) ---
    var isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) || location.protocol === 'file:';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (current < total) { if (validate(current)) go(current + 1, 'fwd'); return; }
      if (!validate(total)) return;
      syncHidden();
      var fd = new FormData(form);
      fd.delete('ui-csomag');
      fd.delete('ui-extra');
      var body = new URLSearchParams(fd).toString();
      submit.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); showDone(); })
        .catch(function (err) {
          if (isLocal) {
            // Helyi teszt: a Netlify Forms csak a Netlify-on működik, itt csak a köszönő képernyőt mutatjuk.
            console.info('[NoForm] Helyi teszt, a küldés nem ment el:', body);
            showDone();
            return;
          }
          var mail = (cfg.contact && cfg.contact.email) || 'design@noformproject.com';
          formError.textContent = 'Valami nem sikerült a küldésnél. Próbáld újra egy perc múlva, vagy írj nekünk: ' + mail;
          formError.hidden = false;
          console.error(err);
        })
        .then(function () { submit.removeAttribute('aria-busy'); submit.disabled = false; });
    });

    function showDone() {
      form.hidden = true;
      done.hidden = false;
      done.classList.remove('is-shown');
      void done.offsetWidth;
      done.classList.add('is-shown');
      done.focus({ preventScroll: true });
      if (done.getBoundingClientRect().top < 0) quiz.scrollIntoView({ block: 'start' });
    }

    function restart() {
      form.reset();
      $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      $$('.field-error', form).forEach(function (f) { f.hidden = true; });
      picked.hidden = true;
      current = 1;
      render();
      syncHidden();
      done.hidden = true;
      form.hidden = false;
    }
    $('.quiz-restart', quiz).addEventListener('click', function () { restart(); steps[0].focus(); });

    render();
    syncHidden();
  }

  // ------------------------------------------------------------------
  // Előtte–utána csúszka (egér, ujj, billentyűzet)
  // ------------------------------------------------------------------
  function initSlider() {
    var frame = $('[data-ba]');
    if (!frame) return;
    var handle = $('.ba-handle', frame);
    var pos = 50, dragging = false, touched = false;

    function set(p) {
      pos = clamp(p, 0, 100);
      var r = Math.round(pos);
      frame.style.setProperty('--pos', pos.toFixed(2));
      handle.setAttribute('aria-valuenow', r);
      handle.setAttribute('aria-valuetext', r === 0 ? 'Csak a NoForm-változat látszik' : r === 100 ? 'Csak a sablon látszik' : r + '% sablon, ' + (100 - r) + '% NoForm');
      frame.classList.toggle('hide-l', pos < 14);
      frame.classList.toggle('hide-r', pos > 86);
    }
    function fromEvent(e) {
      var rect = frame.getBoundingClientRect();
      set(((e.clientX - rect.left) / rect.width) * 100);
    }

    frame.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      touched = true;
      dragging = true;
      frame.classList.add('is-dragging');
      try { frame.setPointerCapture(e.pointerId); } catch (err) {}
      if (e.pointerType === 'mouse') { fromEvent(e); e.preventDefault(); handle.focus({ preventScroll: true }); }
    });
    frame.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    var stop = function () { dragging = false; frame.classList.remove('is-dragging'); };
    frame.addEventListener('pointerup', stop);
    frame.addEventListener('pointercancel', stop);

    handle.addEventListener('keydown', function (e) {
      var map = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
      if (e.key in map) set(pos + map[e.key]);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else return;
      touched = true;
      e.preventDefault();
    });

    set(50);

    // Első megjelenéskor egy kis "kacsintás", hogy látszódjon: húzható
    if (reduced() || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var keys = [[0, 50], [700, 28], [1500, 68], [2200, 50]];
      var t0 = performance.now();
      var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
      (function tick(now) {
        if (touched) return;
        var t = now - t0;
        for (var i = 1; i < keys.length; i++) {
          if (t <= keys[i][0]) {
            var a = keys[i - 1], b = keys[i];
            set(a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0])));
            return requestAnimationFrame(tick);
          }
        }
        set(50);
      })(t0);
    }, { threshold: 0.6 });
    setTimeout(function () { io.observe(frame); }, 400);
  }

  // ------------------------------------------------------------------
  // Munkáink: asztali gépen görgetésre oldalra csúszik
  // ------------------------------------------------------------------
  function initWorks() {
    var sec = $('.works');
    if (!sec) return;
    var track = $('.works-track', sec);
    var mq = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
    var active = false, dist = 0, ticking = false;

    function measure() {
      var want = mq.matches && !reduced();
      if (!want) {
        if (active) {
          active = false;
          sec.classList.remove('is-pinned');
          sec.style.height = '';
          track.style.removeProperty('--tx');
        }
        return;
      }
      active = true;
      sec.classList.add('is-pinned');
      var last = track.lastElementChild;
      var gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      dist = Math.max(0, last.offsetLeft + last.offsetWidth + gutter - window.innerWidth);
      sec.style.height = (window.innerHeight + dist) + 'px';
      update();
    }
    function update() {
      ticking = false;
      if (!active) return;
      var total = sec.offsetHeight - window.innerHeight;
      var p = total > 0 ? clamp(-sec.getBoundingClientRect().top / total, 0, 1) : 0;
      track.style.setProperty('--tx', (-p * dist).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', function () { if (active && !ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', measure);
    mq.addEventListener('change', measure);
    mqReduce.addEventListener('change', measure);

    // Billentyűzettel bejárva odagörget a fókuszált kártyához
    track.addEventListener('focusin', function (e) {
      if (!active) return;
      var card = e.target.closest('.work');
      if (!card || dist <= 0) return;
      var total = sec.offsetHeight - window.innerHeight;
      var p = clamp((card.offsetLeft - 40) / dist, 0, 1);
      window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + p * total, behavior: 'auto' });
    });

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  // ------------------------------------------------------------------
  // Hogyan dolgozunk: a lépéseken átkanyargó vonal
  // ------------------------------------------------------------------
  function initProcess() {
    var body = $('.process-body');
    if (!body) return;
    var svg = $('.process-line', body);
    var path = $('.process-path', body);
    var bg = $('.process-path-bg', body);
    var marks = $$('.step-mark', body);
    var sda = window.CSS && CSS.supports('animation-timeline: view()');

    function build() {
      var br = body.getBoundingClientRect();
      if (!br.width) return;
      var pts = marks.map(function (m) {
        var r = m.getBoundingClientRect();
        return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top };
      });
      var f = function (n) { return n.toFixed(1); };
      var d = 'M' + f(pts[0].x) + ',' + f(pts[0].y);
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, c1, c2;
        if (Math.abs(dx) < 30) {
          // egymás alatt (telefonon): enyhe hullám
          var s = (i % 2 ? 1 : -1) * 18;
          c1 = [a.x + s, a.y + dy * 0.33]; c2 = [b.x - s, b.y - dy * 0.33];
        } else if (dx > 0) {
          // jobbra: előbb le, aztán be a következő lépéshez (nem megy át a szövegen)
          c1 = [a.x, a.y + dy * 0.9]; c2 = [b.x - dx * 0.6, b.y];
        } else {
          // balra: előbb oldalra, aztán le
          c1 = [a.x + dx * 0.6, a.y]; c2 = [b.x, b.y - dy * 0.9];
        }
        d += ' C' + f(c1[0]) + ',' + f(c1[1]) + ' ' + f(c2[0]) + ',' + f(c2[1]) + ' ' + f(b.x) + ',' + f(b.y);
      }
      svg.setAttribute('viewBox', '0 0 ' + br.width.toFixed(0) + ' ' + br.height.toFixed(0));
      path.setAttribute('d', d);
      bg.setAttribute('d', d);
      draw();
    }
    // tartalék rajzolás görgetésre, ha a böngésző nem tud scroll-driven animációt
    function draw() {
      if (sda) return;
      if (reduced()) { path.style.strokeDashoffset = '0'; return; }
      var r = body.getBoundingClientRect();
      var p = clamp((window.innerHeight * 0.8 - r.top) / (r.height + window.innerHeight * 0.1), 0, 1);
      path.style.strokeDashoffset = (1 - p).toFixed(4);
    }
    if (!sda) window.addEventListener('scroll', function () { requestAnimationFrame(draw); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(build).observe(body);
    window.addEventListener('resize', build);
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  }

  // ------------------------------------------------------------------
  // Szövegek soronként úsznak be
  // ------------------------------------------------------------------
  function initReveal() {
    if (reduced()) return;
    var sda = window.CSS && CSS.supports('animation-timeline: view()');
    var els = $$('[data-lines]');

    function split(el) {
      if (!el.dataset.text) el.dataset.text = el.textContent.trim().replace(/\s+/g, ' ');
      var words = el.dataset.text.split(' ');
      el.textContent = '';
      var spans = words.map(function (w, i) {
        var s = document.createElement('span');
        s.textContent = w;
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        return s;
      });
      var lines = [], top = null;
      spans.forEach(function (s) {
        if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
        lines[lines.length - 1].push(s.textContent);
      });
      el.textContent = '';
      lines.forEach(function (ws, i) {
        var line = document.createElement('span');
        line.className = 'line';
        line.style.setProperty('--li', i);
        line.textContent = ws.join(' ');
        el.appendChild(line);
        if (i < lines.length - 1) el.appendChild(document.createTextNode(' '));
      });
    }
    var splitAll = function () { els.forEach(split); };
    splitAll();

    // ami betöltéskor már látszik, az azonnal látszódjon
    var vh = window.innerHeight;
    els.forEach(function (el) { if (el.getBoundingClientRect().top < vh) el.classList.add('is-in'); });
    root.classList.add(sda ? 'reveal-on' : 'io-reveal');

    if (!sda && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
    }

    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(splitAll, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(splitAll);
  }

  // ------------------------------------------------------------------
  // Nyitócím: a betűk vastagsága az egér közelében változik
  // ------------------------------------------------------------------
  function initHeroType() {
    if (reduced() || !mqFine.matches) return;
    var title = $('.hero-title');
    var chars = $$('.ch', title);
    var ready = false, raf = 0, mx = -1e4, my = -1e4;
    var last = chars[chars.length - 1];
    last.addEventListener('animationend', function () { ready = true; });
    setTimeout(function () { ready = true; }, 2600);

    function apply() {
      raf = 0;
      if (!ready) return;
      var tr = title.getBoundingClientRect();
      if (tr.bottom < 0) return;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
        var t = Math.max(0, 1 - d / 240);
        c.style.setProperty('--w', Math.round(700 - 420 * t * t));
      });
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mx = my = -1e4; if (!raf) raf = requestAnimationFrame(apply); });
  }

  // ------------------------------------------------------------------
  // Mágneses gombok
  // ------------------------------------------------------------------
  function initMagnetic() {
    if (reduced() || !mqFine.matches) return;
    $$('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  // ------------------------------------------------------------------
  // A nyitó folt alakváltása (SVG SMIL) megáll, ha kevesebb mozgás kell
  // ------------------------------------------------------------------
  function initBlobMotion() {
    var svg = $('.hero-blob svg');
    if (!svg || !svg.pauseAnimations) return;
    var sync = function () { if (reduced()) svg.pauseAnimations(); else svg.unpauseAnimations(); };
    sync();
    mqReduce.addEventListener('change', sync);
  }

  function start() {
    initTheme();
    initHeader();
    initContacts();
    initPricing();
    initQuiz();
    initSlider();
    initWorks();
    initProcess();
    initReveal();
    initHeroType();
    initMagnetic();
    initBlobMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
