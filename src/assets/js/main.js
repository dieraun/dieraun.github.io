/**
 * 全站交互
 * ------------------------------------------------------------
 * 只做几件事：主题切换、移动端导航、目录高亮、复制代码、
 * 回到顶部、滚动状态。没有框架，也没有第三方依赖。
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var THEME_KEY = "su2-theme";
  var THEME_MODES = ["system", "light", "dark"];
  var THEME_LABELS = { system: "自动", light: "浅色", dark: "深色" };

  root.classList.add("js");

  /* ------------------------------------------------------------------ */
  /* 1. 主题：跟随系统 / 浅色 / 深色                                      */
  /* ------------------------------------------------------------------ */
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function readThemeMode() {
    try {
      var stored = window.localStorage.getItem(THEME_KEY);
      return THEME_MODES.indexOf(stored) !== -1 ? stored : "system";
    } catch (error) {
      return "system";
    }
  }

  function resolveTheme(mode) {
    if (mode === "system") return darkQuery.matches ? "dark" : "light";
    return mode;
  }

  function applyTheme(mode, persist) {
    var resolved = resolveTheme(mode);

    root.dataset.themeMode = mode;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;

    var themeColor = document.querySelector("meta[data-theme-color]");
    if (themeColor) {
      themeColor.setAttribute("content", themeColor.dataset[resolved]);
    }

    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, mode);
      } catch (error) {
        // 隐私模式下 localStorage 可能不可用，忽略即可
      }
    }

    var label = THEME_LABELS[mode];
    document.querySelectorAll("[data-theme-label]").forEach(function (node) {
      node.textContent = label;
    });
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", "切换主题：当前" + label);
      button.setAttribute("title", "切换主题：当前" + label);
    });
  }

  var themeMode = readThemeMode();
  applyTheme(themeMode, false);

  darkQuery.addEventListener("change", function () {
    if (themeMode === "system") applyTheme("system", false);
  });

  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var index = THEME_MODES.indexOf(themeMode);
      themeMode = THEME_MODES[(index + 1) % THEME_MODES.length];
      applyTheme(themeMode, true);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 2. 移动端菜单                                                       */
  /* ------------------------------------------------------------------ */
  var header = document.querySelector("[data-header]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-nav]");

  function setMenuOpen(open) {
    if (!header || !menuToggle) return;
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  }

  if (header && menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      setMenuOpen(!header.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!header.classList.contains("is-open")) return;
      if (!header.contains(event.target)) setMenuOpen(false);
    });

    var desktopQuery = window.matchMedia("(min-width: 901px)");
    desktopQuery.addEventListener("change", function (event) {
      if (event.matches) setMenuOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. 滚动状态与回到顶部                                               */
  /* ------------------------------------------------------------------ */
  var toTop = document.querySelector("[data-to-top]");
  var scrollTicking = false;

  function updateScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (header) header.classList.toggle("is-scrolled", y > 6);

    if (toTop) {
      if (y > 480) {
        toTop.hidden = false;
      } else {
        toTop.hidden = true;
      }
    }

    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  updateScrollState();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. 文章目录高亮                                                     */
  /* ------------------------------------------------------------------ */
  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll(".toc__item a"),
  );
  var tocHeadings = tocLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return null;
      return document.getElementById(id.slice(1));
    })
    .filter(Boolean);

  function updateToc() {
    if (!tocHeadings.length) return;

    var current = tocHeadings[0].id;
    for (var i = 0; i < tocHeadings.length; i += 1) {
      if (tocHeadings[i].getBoundingClientRect().top <= 120) {
        current = tocHeadings[i].id;
      } else {
        break;
      }
    }

    tocLinks.forEach(function (link) {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === "#" + current,
      );
    });
  }

  if (tocHeadings.length) {
    var tocTicking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (tocTicking) return;
        tocTicking = true;
        window.requestAnimationFrame(function () {
          updateToc();
          tocTicking = false;
        });
      },
      { passive: true },
    );
    updateToc();
  }

  var tocPanel = document.querySelector(".toc-panel");
  if (tocPanel) {
    var narrowQuery = window.matchMedia("(max-width: 900px)");

    var syncTocPanel = function () {
      if (narrowQuery.matches) {
        tocPanel.removeAttribute("open");
      } else {
        tocPanel.setAttribute("open", "");
      }
    };

    syncTocPanel();
    narrowQuery.addEventListener("change", syncTocPanel);

    tocPanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (narrowQuery.matches) tocPanel.removeAttribute("open");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. 代码复制                                                         */
  /* ------------------------------------------------------------------ */
  function legacyCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  document.querySelectorAll("[data-copy-code]").forEach(function (button) {
    button.addEventListener("click", function () {
      var block = button.closest(".code-block");
      var code = block ? block.querySelector("code") : null;
      if (!code) return;

      var text = code.textContent || "";
      var done = function (success) {
        button.textContent = success ? "已复制" : "复制失败";
        button.classList.toggle("is-copied", success);
        window.setTimeout(function () {
          button.textContent = "复制";
          button.classList.remove("is-copied");
        }, 1600);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(text)
          .then(function () {
            done(true);
          })
          .catch(function () {
            done(legacyCopy(text));
          });
      } else {
        done(legacyCopy(text));
      }
    });
  });
})();
