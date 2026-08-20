/* ==========================================================================
   Автосалон 911 — личный кабинет (Supabase + демо-fallback)
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var loginScreen = $('loginScreen'), adminScreen = $('adminScreen'), logoutBtn = $('logoutBtn');
  var currentImages = [];
  var isSB = (window.Store && Store.mode === 'supabase');

  /* ---------- Тосты ---------- */
  function toast(msg, ok) {
    var wrap = $('toastWrap'), t = document.createElement('div');
    t.className = 'toast' + (ok ? ' toast--ok' : ''); t.textContent = msg; wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(function () { t.remove(); }, 400); }, 4200);
  }

  /* ---------- Режим входа (демо / Supabase) ---------- */
  if (!isSB) {
    // демо: email не нужен
    var ef = $('emailField'); if (ef) ef.style.display = 'none';
    var em = $('emailInput'); if (em) em.removeAttribute('required');
  } else {
    var em2 = $('emailInput'); if (em2) em2.setAttribute('required', 'required');
    var hint = $('loginHint'); if (hint) hint.textContent = 'Вход защищён Supabase Auth. Доступ только у администратора салона.';
  }

  /* ---------- Экран входа / кабинета ---------- */
  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';
    if (isSB) { var e = Store.currentUserEmail(); if (e) logoutBtn.textContent = 'Выйти (' + e + ')'; }
    renderList();
  }
  function showLogin() {
    loginScreen.style.display = 'block';
    adminScreen.style.display = 'none';
    logoutBtn.style.display = 'none';
  }

  // ждём восстановления сессии, затем решаем что показать
  loginScreen.style.display = 'none';
  Store.ready.then(function () {
    if (Store.isAuthed()) showAdmin(); else showLogin();
  });
  if (window.Store && Store.onAuthChange) {
    Store.onAuthChange(function (authed) { if (authed) showAdmin(); else showLogin(); });
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type=submit]');
    var email = ($('emailInput') && $('emailInput').value || '').trim();
    var pass = $('passInput').value;
    btn.disabled = true; var old = btn.textContent; btn.textContent = 'Вход…';
    Store.login(email, pass).then(function (res) {
      btn.disabled = false; btn.textContent = old;
      if (res.ok) { toast('Добро пожаловать!', true); $('passInput').value = ''; if (!isSB) showAdmin(); }
      else { toast(res.error || 'Не удалось войти'); $('passInput').value = ''; }
    });
  });
  logoutBtn.addEventListener('click', function () {
    Store.logout().then(function () { showLogin(); toast('Вы вышли из кабинета'); });
  });

  /* ---------- Список авто + статистика ---------- */
  function renderList() {
    $('adminList').innerHTML = '<div class="empty-state">Загрузка…</div>';
    Store.listCars().then(function (cars) {
      var total = cars.length, sold = cars.filter(function (c) { return c.sold; }).length;
      var hot = cars.filter(function (c) { return c.featured && !c.sold; }).length;
      $('adminStats').innerHTML = stat(total, 'Всего авто') + stat(total - sold, 'В наличии') + stat(sold, 'Продано') + stat(hot, 'Хиты продаж');
      $('adminList').innerHTML = cars.map(rowHTML).join('') || '<div class="empty-state">Пока нет авто. Нажмите «+ Добавить авто».</div>';
      $('adminList').querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openModal(b.getAttribute('data-edit')); }); });
      $('adminList').querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { removeCar(b.getAttribute('data-del')); }); });
      $('adminList').querySelectorAll('[data-sold]').forEach(function (b) { b.addEventListener('click', function () { toggleSold(b.getAttribute('data-sold')); }); });
    }).catch(function (err) {
      $('adminList').innerHTML = '<div class="empty-state">Ошибка загрузки: ' + esc(err && err.message || '') + '</div>';
    });
  }
  function stat(n, label) { return '<div class="admin-stat"><b>' + n + '</b><span>' + label + '</span></div>'; }

  function rowHTML(c) {
    var img = (c.images && c.images[0]) || Store.PLACEHOLDER(c.brand || 'АВТО', '');
    var badges = (c.featured && !c.sold ? '<span class="admin-badge admin-badge--hot">🔥 Хит</span>' : '') +
      (c.sold ? '<span class="admin-badge admin-badge--sold">Продано</span>' : '');
    return '<div class="admin-row' + (c.sold ? ' is-sold' : '') + '">' +
      '<img class="admin-row__img" src="' + img + '" alt="" />' +
      '<div class="admin-row__info"><h4>' + esc([c.brand, c.model].filter(Boolean).join(' ')) + ' ' + badges + '</h4>' +
      '<div class="admin-row__meta"><span class="price">' + Store.formatPrice(c.price) + '</span>' +
      (c.year ? '<span>' + c.year + ' г.</span>' : '') +
      (c.mileage ? '<span>' + Store.formatKm(c.mileage) + '</span>' : '') +
      (c.transmission ? '<span>' + esc(c.transmission) + '</span>' : '') +
      '<span>' + ((c.images && c.images.length) || 0) + ' фото</span></div></div>' +
      '<div class="admin-row__actions">' +
      '<button class="icon-btn" title="' + (c.sold ? 'Вернуть в наличие' : 'Отметить проданным') + '" data-sold="' + c.id + '">' + (c.sold ? '↩' : '✓') + '</button>' +
      '<button class="icon-btn" title="Редактировать" data-edit="' + c.id + '">✎</button>' +
      '<button class="icon-btn icon-btn--danger" title="Удалить" data-del="' + c.id + '">🗑</button>' +
      '</div></div>';
  }

  /* ---------- Модалка формы ---------- */
  var carModal = $('carModal');
  function fillForm(c) {
    $('modalTitle').textContent = c ? 'Редактировать авто' : 'Добавить авто';
    $('carId').value = c ? c.id : '';
    $('brand').value = c ? (c.brand || '') : ''; $('model').value = c ? (c.model || '') : '';
    $('year').value = c && c.year || ''; $('price').value = c && c.price || '';
    $('mileage').value = c && c.mileage || ''; $('engine').value = c ? (c.engine || '') : '';
    $('transmission').value = c ? (c.transmission || '') : ''; $('drive').value = c ? (c.drive || '') : '';
    $('body').value = c ? (c.body || '') : ''; $('color').value = c ? (c.color || '') : '';
    $('description').value = c ? (c.description || '') : '';
    $('featured').checked = !!(c && c.featured); $('sold').checked = !!(c && c.sold);
    currentImages = c && c.images ? c.images.slice() : [];
    renderThumbs();
  }
  function openModal(id) {
    $('carForm').reset();
    if (id) {
      Store.getCar(id).then(function (c) { fillForm(c); carModal.classList.add('open'); });
    } else {
      fillForm(null); carModal.classList.add('open');
    }
  }
  function closeModals() { document.querySelectorAll('.modal').forEach(function (m) { m.classList.remove('open'); }); }
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModals); });
  document.querySelectorAll('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) closeModals(); }); });

  $('addBtn').addEventListener('click', function () { openModal(null); });
  $('settingsBtn').addEventListener('click', function () {
    // в Supabase-режиме локальная смена пароля не нужна
    var pf = $('passForm'); if (pf) pf.style.display = isSB ? 'none' : 'block';
    $('settingsModal').classList.add('open');
  });

  /* ---------- Фото: выбор, drag&drop, сжатие ---------- */
  var dropZone = $('dropZone'), photosInput = $('photos');
  dropZone.addEventListener('click', function () { photosInput.click(); });
  photosInput.addEventListener('change', function () { handleFiles(photosInput.files); photosInput.value = ''; });
  ['dragover', 'dragenter'].forEach(function (ev) { dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag'); }); });
  dropZone.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files); });

  function handleFiles(files) {
    var arr = Array.prototype.slice.call(files).filter(function (f) { return /^image\//.test(f.type); });
    if (!arr.length) return;
    var remaining = arr.length;
    arr.forEach(function (file) {
      compress(file, function (dataUrl) {
        if (dataUrl) currentImages.push(dataUrl);
        if (--remaining === 0) renderThumbs();
      });
    });
  }
  function compress(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.width, h = img.height;
        if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
        var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { cb(canvas.toDataURL('image/jpeg', 0.82)); } catch (err) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = e.target.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }
  function renderThumbs() {
    $('thumbs').innerHTML = currentImages.map(function (src, i) {
      return '<div class="thumb' + (i === 0 ? ' is-main' : '') + '">' +
        '<img src="' + src + '" alt="" />' +
        '<button type="button" data-rm="' + i + '" title="Удалить">×</button></div>';
    }).join('');
    $('thumbs').querySelectorAll('[data-rm]').forEach(function (b) {
      b.addEventListener('click', function () { currentImages.splice(parseInt(b.getAttribute('data-rm'), 10), 1); renderThumbs(); });
    });
  }

  /* ---------- Сохранение авто ---------- */
  $('carForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var editing = !!$('carId').value;
    var car = {
      id: $('carId').value || Store.newId(),
      brand: $('brand').value.trim(), model: $('model').value.trim(),
      year: parseInt($('year').value, 10) || null, price: parseInt($('price').value, 10) || 0,
      mileage: parseInt($('mileage').value, 10) || null, engine: $('engine').value.trim(),
      transmission: $('transmission').value, drive: $('drive').value,
      body: $('body').value, color: $('color').value.trim(),
      description: $('description').value.trim(), images: currentImages.slice(),
      featured: $('featured').checked, sold: $('sold').checked, created: Date.now()
    };
    var btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; var old = btn.textContent;
    btn.textContent = (isSB && currentImages.some(function (s) { return s.indexOf('data:') === 0; })) ? 'Загрузка фото…' : 'Сохранение…';
    Store.saveCar(car).then(function () {
      btn.disabled = false; btn.textContent = old;
      closeModals(); renderList();
      toast(editing ? 'Авто обновлено' : 'Авто добавлено в каталог', true);
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = old;
      toast('Ошибка сохранения: ' + (err && err.message || 'проверьте настройки Supabase'));
    });
  });

  function removeCar(id) {
    Store.getCar(id).then(function (c) {
      if (!c) return;
      if (!confirm('Удалить «' + [c.brand, c.model].filter(Boolean).join(' ') + '» из каталога?')) return;
      Store.deleteCar(id).then(function () { renderList(); toast('Авто удалено'); })
        .catch(function (err) { toast('Ошибка удаления: ' + (err && err.message || '')); });
    });
  }
  function toggleSold(id) {
    Store.getCar(id).then(function (c) {
      if (!c) return;
      c.sold = !c.sold;
      Store.saveCar(c).then(function () { renderList(); toast(c.sold ? 'Отмечено как продано' : 'Возвращено в наличие', true); })
        .catch(function (err) { toast('Ошибка: ' + (err && err.message || '')); });
    });
  }

  /* ---------- Настройки ---------- */
  var passForm = $('passForm');
  if (passForm) passForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isSB) { toast('В режиме Supabase пароль меняется в панели Supabase'); return; }
    Store.setPassword($('newPass').value); $('newPass').value = '';
    closeModals(); toast('Пароль изменён', true);
  });
  $('resetBtn').addEventListener('click', function () {
    if (isSB) { toast('Сброс доступен только в демо-режиме'); return; }
    if (!confirm('Сбросить каталог к примерам? Добавленные авто будут удалены.')) return;
    Store.resetCars().then(function () { closeModals(); renderList(); toast('Каталог сброшен к примерам'); });
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
})();
