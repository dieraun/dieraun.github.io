/**
 * 标签筛选
 * ------------------------------------------------------------
 * 标签页在构建时就输出了全部文章，这里只负责：
 * 1. 读取 URL 里的 ?tag= 参数；
 * 2. 点击标签按钮时过滤卡片；
 * 3. 把当前标签写回地址栏，方便分享与刷新。
 */
(function () {
  "use strict";

  var filterGroup = document.querySelector("[data-tag-filter-group]");
  var cards = Array.prototype.slice.call(
    document.querySelectorAll("[data-post-tags]"),
  );
  var status = document.querySelector("[data-tag-status]");
  var empty = document.querySelector("[data-tag-empty]");

  if (!filterGroup || !cards.length) return;

  var buttons = Array.prototype.slice.call(
    filterGroup.querySelectorAll("[data-tag-filter]"),
  );

  function readCardTags(card) {
    try {
      var parsed = JSON.parse(card.getAttribute("data-post-tags") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  var cardTags = cards.map(readCardTags);

  function isKnownTag(tag) {
    return buttons.some(function (button) {
      return button.getAttribute("data-tag-filter") === tag;
    });
  }

  function applyFilter(tag, options) {
    var settings = options || {};
    var activeTag = isKnownTag(tag) ? tag : "";
    var visibleCount = 0;

    cards.forEach(function (card, index) {
      var matches = !activeTag || cardTags[index].indexOf(activeTag) !== -1;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    buttons.forEach(function (button) {
      var active = button.getAttribute("data-tag-filter") === activeTag;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (status) {
      status.textContent = activeTag
        ? "“" + activeTag + "” 下有 " + visibleCount + " 篇文章"
        : "共 " + visibleCount + " 篇文章";
    }

    if (empty) empty.hidden = visibleCount !== 0;

    if (settings.updateUrl !== false) {
      var nextUrl = new URL(window.location.href);
      if (activeTag) {
        nextUrl.searchParams.set("tag", activeTag);
      } else {
        nextUrl.searchParams.delete("tag");
      }

      var method = settings.push ? "pushState" : "replaceState";
      window.history[method]({ tag: activeTag }, "", nextUrl);
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-tag-filter"), { push: true });
    });
  });

  window.addEventListener("popstate", function () {
    var tag = new URLSearchParams(window.location.search).get("tag") || "";
    applyFilter(tag, { updateUrl: false });
  });

  var initialTag = new URLSearchParams(window.location.search).get("tag") || "";
  applyFilter(initialTag);
})();
