(function () {
  window.__app = window.__app || {};
  var app = window.__app;

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this,
        args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function initAOS() {
    if (app.aosInit) return;
    app.aosInit = true;
    if (!window.AOS) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    document
      .querySelectorAll('[data-aos][data-avoid-layout="true"]')
      .forEach(function (el) {
        el.removeAttribute("data-aos");
      });
    AOS.init({
      once: false,
      duration: 600,
      easing: "ease-out",
      offset: 120,
      mirror: false,
      disable: function () {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      },
    });
    app.refreshAOS = function () {
      try {
        AOS.refresh();
      } catch (e) {}
    };
  }

  function initNav() {
    if (app.navInit) return;
    app.navInit = true;
    var toggle = document.querySelector(".c-nav__toggle");
    var nav = document.querySelector(".c-nav#main-nav");
    if (!toggle || !nav) return;
    var list = nav.querySelector(".c-nav__list");

    function getFocusables() {
      if (!list) return [];
      return Array.prototype.slice.call(
        list.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'),
      );
    }

    function openMenu() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("u-no-scroll");
      var focusables = getFocusables();
      if (focusables.length) focusables[0].focus();
    }

    function closeMenu() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("u-no-scroll");
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
        return;
      }
      if (e.key === "Tab" && nav.classList.contains("is-open")) {
        var focusables = getFocusables();
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    nav.querySelectorAll(".c-nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu();
      });
    });

    window.addEventListener(
      "resize",
      debounce(function () {
        if (window.innerWidth >= 1024) {
          closeMenu();
          document.body.classList.remove("u-no-scroll");
        }
      }, 150),
    );
  }

  function initAnchors() {
    if (app.anchorsInit) return;
    app.anchorsInit = true;

    var path = location.pathname;
    var isHome = path === "/" || path === "/index.html" || path === "";

    function smoothScroll(hash) {
      if (!hash || hash === "#" || hash === "#!") return false;

      var target = document.querySelector(hash);
      if (!target) return false;

      var headerEl = document.querySelector(".l-header");
      var offset = headerEl ? headerEl.getBoundingClientRect().height : 80;
      var top =
        target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: top,
        behavior: "smooth",
      });

      return true;
    }

    if (isHome) {
      document.querySelectorAll('a[href^="/#"]').forEach(function (link) {
        var full = link.getAttribute("href") || "";
        var hash = full.replace(/^\//, "");

        link.setAttribute("href", hash);

        link.addEventListener("click", function (e) {
          var h = link.getAttribute("href");
          if (smoothScroll(h)) e.preventDefault();
        });
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var h = link.getAttribute("href");
        if (smoothScroll(h)) e.preventDefault();
      });
    });

    if (isHome && location.hash) {
      setTimeout(function () {
        smoothScroll(location.hash);
      }, 100);
    }
  }

  function initActiveNav() {
    if (app.activeNavInit) return;
    app.activeNavInit = true;

    var path = location.pathname;
    var isHome = path === "/" || path === "/index.html" || path === "";

    document.querySelectorAll(".c-nav__link").forEach(function (link) {
      link.removeAttribute("aria-current");
      link.classList.remove("is-active");

      var href = link.getAttribute("href");
      if (!href) return;

      var hashIndex = href.indexOf("#");
      var linkPath = hashIndex !== -1 ? href.substring(0, hashIndex) : href;

      if (isHome) {
        if (
          href === "/" ||
          href === "/index.html" ||
          href === "" ||
          linkPath === "/" ||
          linkPath === "/index.html" ||
          linkPath === ""
        ) {
          link.setAttribute("aria-current", "page");
          link.classList.add("is-active");
        }

        return;
      }

      if (
        linkPath &&
        linkPath !== "/" &&
        linkPath !== "/index.html" &&
        linkPath !== ""
      ) {
        var normalPath = path.replace(/\/$/, "");
        var normalLink = linkPath.replace(/\/$/, "");

        if (
          normalPath === normalLink ||
          normalPath.endsWith("/" + normalLink) ||
          normalPath.endsWith(normalLink)
        ) {
          link.setAttribute("aria-current", "page");
          link.classList.add("is-active");
        }
      }
    });
  }

  function initImages() {
    if (app.imagesInit) return;
    app.imagesInit = true;

    document.querySelectorAll("img").forEach(function (img) {
      var isCritical =
        img.classList.contains("c-logo__img") ||
        img.hasAttribute("data-critical");

      if (!isCritical && !img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }

      if (!img.classList.contains("img-fluid")) {
        img.classList.add("img-fluid");
      }

      img.addEventListener("error", function () {
        if (img.dataset.fallbackSet) return;

        img.dataset.fallbackSet = "1";

        var w = img.getAttribute("width") || 100;
        var h = img.getAttribute("height") || 100;

        var svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
          w +
          '" height="' +
          h +
          '" viewBox="0 0 ' +
          w +
          " " +
          h +
          '">' +
          '<rect width="' +
          w +
          '" height="' +
          h +
          '" fill="#f0ebe8"/>' +
          '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#999">Image unavailable</text>' +
          "</svg>";

        img.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
        img.style.objectFit = "contain";

        if (img.classList.contains("c-logo__img")) {
          img.style.maxHeight = "40px";
        }
      });
    });
  }

  function initForms() {
    if (app.formsInit) return;
    app.formsInit = true;

    function getToken() {
      return fetch("form-token.php", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
      }).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.success || !data.token) {
            throw new Error(data.message || "Unable to prepare the form.");
          }

          return data.token;
        });
      });
    }

    function getFormData(form, token, startedAt) {
      var data = {};
      var elements = form.elements;

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];

        if (!el.name || el.type === "submit" || el.disabled) {
          continue;
        }

        if (el.type === "checkbox") {
          data[el.name] = el.checked;
        } else {
          data[el.name] = el.value;
        }
      }

      data.formId = form.id || "";
      data.token = token;
      data.startedAt = startedAt;
      data.website = data.website || "";

      return data;
    }

    function setButtonLoading(button, isLoading, originalText) {
      if (!button) return;

      if (isLoading) {
        button.disabled = true;
        button.dataset.originalText =
          originalText || button.textContent || "Submit";
        button.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        return;
      }

      button.disabled = false;
      button.textContent = button.dataset.originalText || "Submit";
    }

    document.querySelectorAll(".needs-validation").forEach(function (form) {
      if (form.dataset.formHandled) return;
      form.dataset.formHandled = "1";

      var startedAt = Date.now();

      if (!form.querySelector('input[name="website"]')) {
        var honeypot = document.createElement("input");
        honeypot.type = "text";
        honeypot.name = "website";
        honeypot.tabIndex = -1;
        honeypot.autocomplete = "off";
        honeypot.setAttribute("aria-hidden", "true");
        honeypot.style.position = "absolute";
        honeypot.style.left = "-9999px";
        honeypot.style.opacity = "0";
        honeypot.style.pointerEvents = "none";
        form.appendChild(honeypot);
      }

      form.addEventListener(
        "input",
        function () {
          if (!form.dataset.startedAt) {
            form.dataset.startedAt = String(Date.now());
          }
        },
        { once: true },
      );

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!form.checkValidity()) {
          form.classList.add("was-validated");

          var firstInvalid = form.querySelector(":invalid");
          if (firstInvalid) firstInvalid.focus();

          return;
        }

        form.classList.add("was-validated");

        var submitBtn = form.querySelector('[type="submit"]');
        var originalText = submitBtn ? submitBtn.textContent : "Submit";

        setButtonLoading(submitBtn, true, originalText);

        getToken()
          .then(function (token) {
            var payload = getFormData(
              form,
              token,
              Number(form.dataset.startedAt || startedAt || Date.now()),
            );

            return fetch("process.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "same-origin",
              cache: "no-store",
              body: JSON.stringify(payload),
            });
          })
          .then(function (response) {
            return response.json().then(function (data) {
              if (!response.ok || !data.success) {
                throw new Error(
                  data.message || "Something went wrong. Please try again.",
                );
              }

              app.notify(
                data.message ||
                  "Thank you. Your message has been sent successfully.",
                "success",
              );

              form.reset();
              form.classList.remove("was-validated");
              form.dataset.startedAt = String(Date.now());

              var redirect = data.redirect || form.getAttribute("action");

              if (redirect && redirect !== "#" && redirect !== "process.php") {
                setTimeout(function () {
                  window.location.href = redirect;
                }, 1200);
              }
            });
          })
          .catch(function (error) {
            app.notify(
              error.message ||
                "Unable to send your message. Please check your connection and try again.",
              "error",
            );
          })
          .finally(function () {
            setButtonLoading(submitBtn, false, originalText);
          });
      });
    });
  }

  function initNotify() {
    if (app.notifyInit) return;
    app.notifyInit = true;
    app.notify = function (message, type) {
      var container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.setAttribute("role", "alert");
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
      }
      var toast = document.createElement("div");
      toast.className = "c-toast c-toast--" + (type || "info");
      toast.setAttribute("role", "status");
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(function () {
        toast.classList.add("is-hiding");
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
      }, 5000);
    };
  }

  function initAnime() {
    if (app.animeInit) return;
    app.animeInit = true;
    if (!window.anime) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    var selectors = [
      ".card",
      ".c-benefit-card",
      ".feature-card",
      ".animal-card",
      ".c-button--primary",
      ".c-button--success",
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.addEventListener("mouseenter", function () {
          anime({
            targets: el,
            translateY: -4,
            opacity: 1,
            duration: 200,
            easing: "easeOutQuad",
          });
        });
        el.addEventListener("mouseleave", function () {
          anime({
            targets: el,
            translateY: 0,
            opacity: 1,
            duration: 200,
            easing: "easeOutQuad",
          });
        });
      });
    });
  }

  function initMobileGaps() {
    if (app.mobileGapsInit) return;
    app.mobileGapsInit = true;

    function hasGapClass(el) {
      var result = false;
      el.classList.forEach(function (cls) {
        if (/^gap-/.test(cls) || /^g-/.test(cls)) result = true;
      });
      return result;
    }

    function applyGaps() {
      var isMobile = window.innerWidth < 576;
      document.querySelectorAll(".d-flex").forEach(function (el) {
        var children = el.children;
        if (children.length <= 1) return;
        if (isMobile && !hasGapClass(el) && !el.dataset.gapAdded) {
          el.classList.add("gap-3");
          el.dataset.gapAdded = "1";
        } else if (!isMobile && el.dataset.gapAdded === "1") {
          el.classList.remove("gap-3");
          delete el.dataset.gapAdded;
        }
      });
    }

    applyGaps();
    window.addEventListener("resize", debounce(applyGaps, 150), {
      passive: true,
    });
  }

  function initScrollHeader() {
    if (app.scrollHeaderInit) return;
    app.scrollHeaderInit = true;
    var header = document.querySelector(".l-header");
    if (!header) return;
    window.addEventListener(
      "scroll",
      function () {
        if (window.scrollY > 10) {
          header.classList.add("is-scrolled");
        } else {
          header.classList.remove("is-scrolled");
        }
      },
      { passive: true },
    );
  }

  function initFooterYear() {
    if (app.footerYearInit) return;
    app.footerYearInit = true;
    var el = document.getElementById("footer-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  app.init = function () {
    if (app.initialized) return;
    app.initialized = true;
    initAOS();
    initNav();
    initAnchors();
    initActiveNav();
    initImages();
    initForms();
    initNotify();
    initAnime();
    initMobileGaps();
    initScrollHeader();
    initFooterYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", app.init);
  } else {
    app.init();
  }
})();
