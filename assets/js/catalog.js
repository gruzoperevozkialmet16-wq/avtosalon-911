/* ==========================================================================
   Автосалон 911 — каталог (фильтры, сортировка)
   ========================================================================== */
(function () {
  'use strict';
  var MAX = 'https://max.ru/join/HBsn5LjCstFD8546mRrOXGchu4H7MfQ1rc7fV7HKlq8', PHONE = '+79178997267';

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var burger = document.getElementById('burger'), mm = document.getElementById('mobileMenu');
  if (burger && mm) burger.addEventListener('click', function () { burger.classList.toggle('active'); mm.classList.toggle('open'); });

  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var count = document.getElementById('count');
  var search = document.getElementById('search');
  var fBody = document.getElementById('filterBody');
  var fTrans = document.getElementById('filterTrans');
  var sortSel = document.getElementById('sort');

  var allCars = [];

  function render() {
    var list = allCars.slice();
    var q = (search.value || '').toLowerCase().trim();
    var body = fBody.value, trans = fTrans.value, sort = sortSel.value;

    list = list.filter(function (c) {
      var hay = [c.brand, c.model, c.body, c.color, c.year].join(' ').toLowerCase();
      if (q && hay.indexOf(q) === -1) return false;
      if (body && c.body !== body) return false;
      if (trans && c.transmission !== trans) return false;
      return true;
    });

    list.sort(function (a, b) {
      if (sort === 'cheap') return (a.price || 0) - (b.price || 0);
      if (sort === 'expensive') return (b.price || 0) - (a.price || 0);
      if (sort === 'year') return (b.year || 0) - (a.year || 0);
      return (b.created || 0) - (a.created || 0);
    });
    // проданные — в конец
    list.sort(function (a, b) { return (!!a.sold === !!b.sold) ? 0 : (a.sold ? 1 : -1); });

    count.textContent = list.length + ' ' + plural(list.length, ['авто', 'авто', 'авто']);
    grid.innerHTML = list.map(cardHTML).join('');
    empty.style.display = list.length ? 'none' : 'block';
  }

  function cardHTML(c) {
    var img = (c.images && c.images[0]) || Store.PLACEHOLDER((c.brand || 'АВТО'), '');
    var specs = [
      c.year ? c.year + ' г.' : '', c.mileage ? Store.formatKm(c.mileage) : '',
      c.transmission || '', c.drive || '', c.engine || '', c.body || ''
    ].filter(Boolean).map(function (s) { return '<span class="spec">' + esc(s) + '</span>'; }).join('');
    var tag = c.sold ? '' : (c.featured ? '<span class="car-card__tag car-card__tag--hot">🔥 Хит</span>' : '<span class="car-card__tag">В наличии</span>');
    var sold = c.sold ? '<div class="car-card__sold"><span>Продано</span></div>' : '';
    return '<article class="car-card">' +
      '<div class="car-card__media">' + tag + sold + '<img src="' + img + '" alt="' + escAttr((c.brand || '') + ' ' + (c.model || '')) + '" loading="lazy" /></div>' +
      '<div class="car-card__body">' +
      '<div class="car-card__title">' + esc([c.brand, c.model].filter(Boolean).join(' ')) + '</div>' +
      '<div class="car-card__price">' + Store.formatPrice(c.price) + '</div>' +
      '<div class="car-card__specs">' + specs + '</div>' +
      (c.description ? '<p class="car-card__desc">' + esc(c.description) + '</p>' : '') +
      '<div class="car-card__foot">' +
      (c.sold
        ? '<a href="catalog.html" class="btn btn--ghost" style="flex:1">Смотреть другие</a>'
        : '<a href="tel:' + PHONE + '" class="btn btn--primary" style="flex:1">Позвонить</a>' +
          '<a href="' + MAX + '" target="_blank" rel="noopener" class="btn btn--ghost">Написать</a>') +
      '</div></div></article>';
  }

  [search, fBody, fTrans, sortSel].forEach(function (el) {
    el.addEventListener('input', render); el.addEventListener('change', render);
  });

  function load() {
    grid.innerHTML = '<div class="empty-state">Загрузка каталога…</div>';
    return Store.ready.then(function () { return Store.listCars(); }).then(function (cars) {
      allCars = cars; render();
    }).catch(function () { grid.innerHTML = '<div class="empty-state">Не удалось загрузить каталог. Обновите страницу.</div>'; });
  }
  load();
  // обновление, если авто изменили в другой вкладке (демо-режим)
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('a911_cars') === 0) load(); });

  function plural(n, f) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return f[2]; if (n1 > 1 && n1 < 5) return f[1]; if (n1 === 1) return f[0]; return f[2]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
})();
