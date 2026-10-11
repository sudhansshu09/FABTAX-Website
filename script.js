/* FABTEX — site script (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Placeholder links (href="#") should not jump to the top of the page
  $$('a[href="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  // Footer year
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Header: scrolled state + back-to-top ----------
  var header = $(".header");
  var backTop = $(".back-top");
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (backTop) backTop.classList.toggle("show", y > 500);
  }

  // ---------- Mobile navigation ----------
  var toggle = $(".menu-toggle");
  var nav = $(".nav");
  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 980) setMenu(false); });
  }

  // ---------- Hero slider ----------
  var slider = $(".hero-slider");
  if (slider) {
    var slides = $$(".hero-slide", slider);
    var dots = $$(".dot", slider);
    var current = 0, timer = null, paused = false;

    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === current;
        s.classList.toggle("active", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
      });
      dots.forEach(function (d, n) {
        d.classList.toggle("active", n === current);
        d.setAttribute("aria-selected", n === current ? "true" : "false");
      });
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () {
      stop();
      if (reduceMotion || paused || document.hidden) return;
      timer = setInterval(function () { show(current + 1); }, 5500);
    };
    var go = function (i) { show(i); start(); };

    var next = $(".next", slider), prev = $(".prev", slider);
    if (next) next.addEventListener("click", function () { go(current + 1); });
    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    dots.forEach(function (d, n) { d.addEventListener("click", function () { go(n); }); });

    slider.addEventListener("mouseenter", function () { paused = true; stop(); });
    slider.addEventListener("mouseleave", function () { paused = false; start(); });
    slider.addEventListener("focusin", function () { paused = true; stop(); });
    slider.addEventListener("focusout", function () { paused = false; start(); });
    document.addEventListener("visibilitychange", start);

    // Keyboard arrows while the slider has focus
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    });

    // Touch swipe
    var x0 = null;
    slider.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    show(0);
    start();
  }

  // ---------- Scroll reveal ----------
  var reveals = $$(".reveal");
  reveals.forEach(function (el) {
    var idx = $$(".reveal", el.parentNode).indexOf(el);
    el.style.setProperty("--d", Math.min(idx, 5) * 0.08 + "s");
  });
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var t = en.target;
          t.classList.add("visible");
          revealObs.unobserve(t);
          // once the entrance animation is done, drop the reveal classes so
          // the cards' own hover effects (lift, glow) apply without conflicts
          setTimeout(function () { t.classList.remove("reveal", "visible"); t.style.removeProperty("--d"); }, 1300);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  // ---------- Animated counters ----------
  var counters = $$(".counter");
  function fmt(n) { return n.toLocaleString("en-US"); }
  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    var dur = 1600, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.floor(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    counters.forEach(function (el) { el.textContent = "0" + (el.getAttribute("data-suffix") || ""); });
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cObs.observe(el); });
  }

  // ---------- Back to top ----------
  if (backTop) backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  // ---------- Active menu while scrolling ----------
  var sections = $$("main section[id]");
  var navLinks = nav ? $$("a[href^='#']", nav) : [];
  function spy() {
    if (!navLinks.length || !sections.length) return;
    var pos = (window.pageYOffset || 0) + 140, activeId = null;
    sections.forEach(function (s) {
      if (pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight) activeId = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", activeId !== null && a.getAttribute("href") === "#" + activeId);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); spy(); ticking = false; });
  }, { passive: true });
  onScroll();
  spy();

  // ---------- Project filter ----------
  var filterBtns = $$(".filter-btn");
  var cards = $$(".project-card");
  var empty = $("#no-projects");
  function applyFilter(group) {
    var shown = 0;
    filterBtns.forEach(function (b) {
      var on = b.getAttribute("data-filter") === group;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    cards.forEach(function (c) {
      var match = group === "all" || c.getAttribute("data-group") === group;
      c.hidden = !match;
      if (match) { shown++; c.classList.add("visible"); }
    });
    if (empty) empty.hidden = shown !== 0;
  }
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter")); });
  });
  // "Discover" links in Solutions jump to Projects with the right filter
  $$("[data-filter-link]").forEach(function (a) {
    a.addEventListener("click", function () { applyFilter(a.getAttribute("data-filter-link")); });
  });

  // ---------- Card spotlight (follows the cursor) ----------
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    $$(".solution, .news-card, .stat, .highlight, .contact-form, .specs").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // ---------- Broken image fallback ----------
  $$("img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.style.visibility = "hidden";
      if (img.parentNode) img.parentNode.style.background = "linear-gradient(135deg,#201912,#2e2216)";
    }, { once: true });
  });

  // ---------- Contact form ----------
  var form = $("#contact-form");
  if (form) {
    var status = $(".form-status", form);
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email."; },
      message: function (v) { return v.trim().length >= 10 ? "" : "Please add a few details (10+ characters)."; }
    };
    var check = function (input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var field = input.closest(".field");
      field.classList.toggle("invalid", !!msg);
      var err = $(".error", field);
      if (err) err.textContent = msg;
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    $$("input, textarea", form).forEach(function (i) {
      i.addEventListener("blur", function () { check(i); });
      i.addEventListener("input", function () { if (i.closest(".field").classList.contains("invalid")) check(i); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      $$("input, textarea", form).forEach(function (i) {
        if (!check(i)) { ok = false; if (!firstBad) firstBad = i; }
      });
      if (!ok) { status.textContent = ""; firstBad.focus(); return; }
      var d = new FormData(form);
      var body = "Name: " + d.get("name") + "\nEmail: " + d.get("email") +
        "\nPhone: " + (d.get("phone") || "-") + "\nInterested in: " + d.get("interest") +
        "\n\n" + d.get("message");
      // NOTE: opens the visitor's email app. Replace with a real form backend
      // (e.g. Formspree / your server) to receive submissions directly.
      window.location.href = "mailto:hello@fabtex.example?subject=" +
        encodeURIComponent("Project enquiry from " + d.get("name")) + "&body=" + encodeURIComponent(body);
      status.textContent = "Thanks! Your email app should open with your message.";
      form.reset();
    });
  }
})();
