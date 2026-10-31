/**
 * 全站交互
 * ------------------------------------------------------------
 * 只做几件事：主题切换、移动端导航、首屏文案轮播、仓库列表刷新、
 * 目录高亮、复制代码、回到顶部、滚动状态。没有框架，也没有第三方依赖。
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

  /* ------------------------------------------------------------------ */
  /* 6. Hero 文案轮播                                                    */
  /* ------------------------------------------------------------------ */
  var heroRotator = document.querySelector("[data-hero-rotator]");

  if (heroRotator) {
    var heroTitles = Array.prototype.slice.call(
      heroRotator.querySelectorAll("[data-hero-title]"),
    );
    var heroDescriptions = Array.prototype.slice.call(
      heroRotator.querySelectorAll("[data-hero-description]"),
    );
    var heroIndex = 0;
    var heroTimer = null;
    var heroFadeTimer = null;
    var HERO_INTERVAL = 5000;
    var HERO_FADE = 600;

    var activateHeroSlide = function (next) {
      heroTitles.forEach(function (node, index) {
        var active = index === next;
        node.classList.toggle("is-active", active);
        node.setAttribute("aria-hidden", active ? "false" : "true");
      });
      heroDescriptions.forEach(function (node, index) {
        var active = index === next;
        node.classList.toggle("is-active", active);
        node.setAttribute("aria-hidden", active ? "false" : "true");
      });
    };

    var advanceHero = function () {
      if (heroTitles.length < 2) return;

      var previous = heroIndex;
      heroIndex = (heroIndex + 1) % heroTitles.length;

      // 先淡出当前组，600ms 后替换文本并淡入下一组。
      heroTitles[previous].classList.remove("is-active");
      heroTitles[previous].setAttribute("aria-hidden", "true");
      if (heroDescriptions[previous]) {
        heroDescriptions[previous].classList.remove("is-active");
        heroDescriptions[previous].setAttribute("aria-hidden", "true");
      }

      window.clearTimeout(heroFadeTimer);
      heroFadeTimer = window.setTimeout(function () {
        activateHeroSlide(heroIndex);
      }, HERO_FADE);
    };

    var stopHero = function () {
      if (heroTimer) {
        window.clearInterval(heroTimer);
        heroTimer = null;
      }
    };

    var startHero = function () {
      stopHero();
      if (reduceMotion.matches || heroTitles.length < 2) return;
      heroTimer = window.setInterval(advanceHero, HERO_INTERVAL);
    };

    heroRotator.addEventListener("mouseenter", stopHero);
    heroRotator.addEventListener("mouseleave", startHero);
    heroRotator.addEventListener("focusin", stopHero);
    heroRotator.addEventListener("focusout", function (event) {
      if (!heroRotator.contains(event.relatedTarget)) startHero();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopHero();
      else startHero();
    });

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", startHero);
    }

    startHero();
  }

  /* ------------------------------------------------------------------ */
  /* 7. GitHub 全部仓库：静态快照 + API 增量刷新                         */
  /* ------------------------------------------------------------------ */
  var repoSection = document.querySelector("[data-repo-section]");
  var repoList = document.querySelector("[data-repo-list]");

  if (repoSection && repoList) {
    var REPO_CACHE_KEY = "su2-github-repos-v1";
    var REPO_CACHE_TTL = 10 * 60 * 1000;
    var REPO_API_USER = repoSection.getAttribute("data-github-user") || "dieraun";
    var repoRequested = false;

    var languageColors = {
      Rust: "#dea584",
      Python: "#3572a5",
      "C#": "#178600",
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      HTML: "#e34c26",
      Shell: "#89e051",
    };

    var repoCountNode = document.querySelector("[data-repo-count]");

    var makeSpan = function (className, text, parent) {
      var node = document.createElement("span");
      node.className = className;
      node.textContent = text;
      if (parent) parent.appendChild(node);
      return node;
    };

    var makeRepoItem = function (repo) {
      var link = document.createElement("a");
      link.className = "repo-item";
      link.href = repo.html_url || repo.url || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      var top = document.createElement("span");
      top.className = "repo-item__top";
      makeSpan("repo-item__name", repo.name || "unnamed", top);
      makeSpan("repo-item__arrow", "↗", top);
      link.appendChild(top);

      makeSpan(
        "repo-item__desc",
        repo.description || "暂无描述。",
        link,
      );

      var meta = document.createElement("span");
      meta.className = "repo-item__meta";
      var lang = document.createElement("span");
      lang.className = "repo-item__lang";
      var dot = document.createElement("span");
      dot.className = "repo-item__dot";
      dot.style.setProperty(
        "--lang-color",
        languageColors[repo.language] || "#8b9bab",
      );
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(repo.language || "Other"));
      meta.appendChild(lang);

      var status = document.createElement("span");
      status.textContent = repo.archived
        ? "已归档"
        : repo.fork
          ? "Fork"
          : "公开";
      meta.appendChild(status);
      link.appendChild(meta);

      return link;
    };

    var renderRepos = function (repos) {
      if (!Array.isArray(repos) || !repos.length) return;

      var fragment = document.createDocumentFragment();
      repos.forEach(function (repo) {
        if (repo && repo.name && (repo.html_url || repo.url)) {
          fragment.appendChild(makeRepoItem(repo));
        }
      });

      if (!fragment.childNodes.length) return;
      repoList.innerHTML = "";
      repoList.appendChild(fragment);

      if (repoCountNode) {
        repoCountNode.textContent =
          repos.length < 10 ? "0" + repos.length : String(repos.length);
      }
    };

    var readRepoCache = function () {
      try {
        var raw = window.sessionStorage.getItem(REPO_CACHE_KEY);
        if (!raw) return null;
        var cached = JSON.parse(raw);
        if (
          !cached ||
          !Array.isArray(cached.repos) ||
          typeof cached.time !== "number" ||
          Date.now() - cached.time > REPO_CACHE_TTL
        ) {
          return null;
        }
        return cached.repos;
      } catch (error) {
        return null;
      }
    };

    var writeRepoCache = function (repos) {
      try {
        window.sessionStorage.setItem(
          REPO_CACHE_KEY,
          JSON.stringify({ time: Date.now(), repos: repos }),
        );
      } catch (error) {
        // 隐私模式下缓存不可用，忽略即可
      }
    };

    var loadRepos = function () {
      if (repoRequested) return;
      repoRequested = true;
      if (typeof window.fetch !== "function") return;

      var cached = readRepoCache();
      if (cached && cached.length) {
        renderRepos(cached);
        return;
      }

      var controller = typeof AbortController !== "undefined"
        ? new AbortController()
        : null;
      var timeout = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, 8000)
        : null;

      var options = {
        headers: { Accept: "application/vnd.github+json" },
      };
      if (controller) options.signal = controller.signal;

      fetch(
        "https://api.github.com/users/" +
          encodeURIComponent(REPO_API_USER) +
          "/repos?per_page=100&sort=updated",
        options,
      )
        .then(function (response) {
          if (!response.ok) {
            throw new Error("GitHub API HTTP " + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          if (!Array.isArray(data)) return;
          var repos = data.filter(function (repo) {
            return repo && repo.name && (repo.html_url || repo.url);
          });
          if (!repos.length) return;
          renderRepos(repos);
          writeRepoCache(repos);
        })
        .catch(function () {
          // 接口失败、限流或断网时保留服务端渲染的静态快照
        })
        .then(function () {
          if (timeout) window.clearTimeout(timeout);
        });
    };

    // 接近首屏时再请求，避免首页加载被第三方接口拖慢。
    if ("IntersectionObserver" in window) {
      var repoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              repoObserver.disconnect();
              loadRepos();
            }
          });
        },
        { rootMargin: "200px" },
      );
      repoObserver.observe(repoSection);
    } else {
      window.setTimeout(loadRepos, 1200);
    }
  }
})();
