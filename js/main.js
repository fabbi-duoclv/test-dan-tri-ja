/* ニュース速報24 — 最小限のインタラクション: モバイルメニュー + サイドバータブ */
(function () {
  "use strict";

  // ---- モバイルメニューの開閉 ----
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".main-nav ul");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // ---- サイドバータブ（よく読まれている / 最新） ----
  const tabGroups = document.querySelectorAll("[data-tabs]");
  tabGroups.forEach(function (group) {
    const buttons = group.querySelectorAll("[role='tab']");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetId = btn.getAttribute("aria-controls");

        buttons.forEach(function (b) {
          const selected = b === btn;
          b.setAttribute("aria-selected", String(selected));
          const panel = document.getElementById(b.getAttribute("aria-controls"));
          if (panel) panel.hidden = !selected;
        });

        const target = document.getElementById(targetId);
        if (target) target.hidden = false;
      });
    });
  });

  // ---- フッターの年を自動表示 ----
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- 現在のURLに応じてメニュー項目をハイライト ----
  const params = new URLSearchParams(window.location.search);
  const currentCat = params.get("cat");
  const navLinks = document.querySelectorAll(".main-nav [data-nav] a, .main-nav ul a");
  navLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    if (currentCat && href.indexOf("cat=" + currentCat) !== -1) {
      link.setAttribute("aria-current", "page");
    }
  });

  // ---- データ駆動のレンダリング（articles.js の window.ARTICLES が必要） ----
  const ALL = Array.isArray(window.ARTICLES) ? window.ARTICLES : [];

  const CATEGORIES = {
    "shakai": "社会",
    "kokusai": "国際",
    "keizai": "経済",
    "supotsu": "スポーツ",
    "entame": "エンタメ",
    "tech": "テクノロジー",
    "kenko": "健康",
    "kyoiku": "教育",
    "kurashi": "暮らし",
  };

  const imgUrl = function (seed, w, h) {
    return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
  };
  const articleHref = function (a) { return "article.html?id=" + a.id; };

  // ---- サイドバーのランキング: 「よく読まれている」「最新」 ----
  function fillRank(selector, sorter) {
    const ul = document.querySelector(selector);
    if (!ul || !ALL.length) return;
    const items = ALL.slice().sort(sorter).slice(0, 6);
    ul.innerHTML = items
      .map(function (a) {
        return '<li><a href="' + articleHref(a) + '">' + a.title + "</a></li>";
      })
      .join("");
  }
  fillRank('[data-rank="read"]', function (a, b) {
    return parseInt(b.views.replace(/\D/g, ""), 10) - parseInt(a.views.replace(/\D/g, ""), 10);
  });
  fillRank('[data-rank="new"]', function (a, b) { return b.order - a.order; });

  // ---- カテゴリーページ ----
  const catList = document.querySelector("[data-cat-list]");
  if (catList) {
    const catName = CATEGORIES[currentCat] || "ニュース";
    document.title = catName + " - ニュース速報24";
    document.querySelectorAll("[data-cat-name]").forEach(function (el) {
      el.textContent = catName;
    });

    const inCat = ALL.filter(function (a) { return a.catSlug === currentCat; });
    const list = inCat.length ? inCat : ALL;

    // 注目記事 = カテゴリーの先頭記事
    const lead = list[0];
    const leadEl = document.querySelector("[data-cat-lead]");
    if (lead && leadEl) {
      leadEl.innerHTML =
        '<a class="thumb" href="' + articleHref(lead) + '">' +
        '<img src="' + imgUrl(lead.img, 800, 450) + '" alt="" width="800" height="450" loading="eager" /></a>' +
        '<h3><a href="' + articleHref(lead) + '">' + lead.title + "</a></h3>" +
        '<p class="sapo">' + lead.sapo + "</p>";
    }

    catList.innerHTML = list
      .slice(lead ? 1 : 0)
      .map(function (a) {
        return (
          "<li>" +
          '<a class="thumb" href="' + articleHref(a) + '"><img src="' + imgUrl(a.img, 180, 135) +
          '" alt="" width="180" height="135" loading="lazy" /></a>' +
          '<div><h4><a href="' + articleHref(a) + '">' + a.title + "</a></h4>" +
          '<p class="sapo">' + a.sapo + "</p>" +
          '<div class="meta">' + a.cat + " ・ " + a.date + "</div></div>" +
          "</li>"
        );
      })
      .join("");
  }

  // ---- 記事詳細ページ ----
  const bodyEl = document.querySelector("[data-article-body]");
  if (bodyEl) {
    const id = params.get("id");
    const article = ALL.filter(function (a) { return a.id === id; })[0] || ALL[0];
    if (article) {
      document.title = article.title + " - ニュース速報24";

      const setText = function (sel, val) {
        const el = document.querySelector(sel);
        if (el) el.textContent = val;
      };
      setText("[data-article-cat]", article.cat);
      setText("[data-article-title]", article.title);
      setText("[data-article-sapo]", article.sapo);
      setText("[data-article-date]", article.date);
      setText("[data-article-author]", "執筆: " + article.author);
      setText("[data-article-views]", "👁 " + article.views);

      const crumbCat = document.querySelector("[data-crumb-cat]");
      if (crumbCat) {
        crumbCat.textContent = article.cat;
        crumbCat.setAttribute("href", "category.html?cat=" + article.catSlug);
      }

      const lead = document.querySelector("[data-article-lead]");
      if (lead) {
        lead.innerHTML =
          '<img src="' + imgUrl(article.img, 800, 450) + '" alt="' + article.title +
          '" width="800" height="450" loading="eager" />' +
          "<figcaption>" + article.title + "（イメージ写真）</figcaption>";
      }

      bodyEl.innerHTML = article.body.join("\n");

      const author = document.querySelector("[data-article-byline]");
      if (author) author.textContent = article.author;

      const tagsEl = document.querySelector("[data-article-tags]");
      if (tagsEl && article.tags) {
        tagsEl.innerHTML = article.tags
          .map(function (t) { return '<a href="#">' + t + "</a>"; })
          .join("");
      }

      // 関連記事: 同一カテゴリーを優先し、その他を続ける
      const related = ALL
        .filter(function (a) { return a.id !== article.id; })
        .sort(function (a, b) {
          return (b.catSlug === article.catSlug) - (a.catSlug === article.catSlug);
        })
        .slice(0, 4);
      const relEl = document.querySelector("[data-related]");
      if (relEl) {
        relEl.innerHTML = related
          .map(function (a) {
            return (
              "<li>" +
              '<a class="thumb" href="' + articleHref(a) + '"><img src="' + imgUrl(a.img, 180, 135) +
              '" alt="" width="180" height="135" loading="lazy" /></a>' +
              '<div><h4><a href="' + articleHref(a) + '">' + a.title + "</a></h4>" +
              '<div class="meta">' + a.cat + " ・ " + a.date + "</div></div>" +
              "</li>"
            );
          })
          .join("");
      }
    }
  }
})();
