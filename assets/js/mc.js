(function () {
  // Highlights: year tabs, rail arrows and list toggle
  document.querySelectorAll('[data-mc-highlights]').forEach(function (root) {
    var tabs = root.querySelectorAll('.mc-segmented .mc-seg');
    var years = root.querySelectorAll('.mc-year');
    var toggle = root.querySelector('.mc-list-toggle');

    function activeRail() {
      return root.querySelector('.mc-year:not([hidden]) .mc-rail');
    }

    function selectYear(year) {
      root.classList.remove('is-list');
      if (toggle) toggle.setAttribute('aria-pressed', 'false');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.year === year)); });
      years.forEach(function (y) { y.hidden = y.dataset.year !== year; });
      var rail = activeRail();
      if (rail) rail.scrollLeft = 0;
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        selectYear(t.dataset.year);
        t.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
    });

    root.querySelectorAll('.mc-arrow').forEach(function (b) {
      b.addEventListener('click', function () {
        var rail = activeRail();
        if (!rail) return;
        var card = rail.querySelector('.mc-card');
        var step = card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
        rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: 'smooth' });
      });
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var list = !root.classList.contains('is-list');
        root.classList.toggle('is-list', list);
        toggle.setAttribute('aria-pressed', String(list));
        var current = (root.querySelector('.mc-seg[aria-selected="true"]') || tabs[0]).dataset.year;
        years.forEach(function (y) { y.hidden = !list && y.dataset.year !== current; });
        toggle.textContent = list ? 'Back to timeline' : toggle.dataset.label;
      });
      toggle.dataset.label = toggle.textContent;
    }
  });

  // Publications: type filter
  document.querySelectorAll('[data-mc-pubs]').forEach(function (root) {
    var tabs = root.querySelectorAll('.mc-seg[data-filter]');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var f = t.dataset.filter;
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        root.querySelectorAll('.mc-pub-list li').forEach(function (li) {
          li.hidden = f !== 'all' && li.dataset.type !== f;
        });
        root.querySelectorAll('.mc-pub-year').forEach(function (g) {
          g.hidden = !g.querySelector('li:not([hidden])');
        });
      });
    });
  });

  // Interests: load visualization scripts only when their card approaches the viewport
  var vizHosts = document.querySelectorAll('[data-mc-viz][data-src]:not([data-src=""])');
  if (vizHosts.length) {
    var loaded = {};
    var loadViz = function (el) {
      var src = el.dataset.src;
      if (loaded[src]) return;
      loaded[src] = true;
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      if (el.dataset.integrity) s.integrity = el.dataset.integrity;
      document.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      var vizObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { vizObserver.unobserve(e.target); loadViz(e.target); }
        });
      }, { rootMargin: '300px 0px' });
      vizHosts.forEach(function (el) { vizObserver.observe(el); });
    } else {
      vizHosts.forEach(loadViz);
    }
  }
})();
