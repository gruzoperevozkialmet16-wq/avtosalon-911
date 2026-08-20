/* ==========================================================================
   Автосалон 911 — личный кабинет (управление каталогом)
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var loginScreen = $('loginScreen'), adminScreen = $('adminScreen'), logoutBtn = $('logoutBtn');
  var currentImages = [];

  /* ---------- Тосты ---------- */
  function toast(msg, ok) {
    var wrap = $('toastWrap'), t = document.createElement('div');
    t.className = 'toast' + (ok ? ' toast--ok' : ''); t.textContent = msg; wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(function () { t.remove(); }, 400); }, 4000);
  }

  /* ---------- Авторизация ---------- */
  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';
    renderList();
  }
  function showLogin() {
    loginScreen.style.display = 'block';
    adminScreen.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
  if (Store.isAuthed()) showAdmin(); else showLogin();

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (Store.login($('passInput').value)) { toast('Добро пожаловать!', true); showAdmin(); }
    else { toast('Неверный пароль'); $('passInput').value = ''; }
  });
  logoutBtn.addEventListener('click', function () { Store.logout(); showLogin(); toast('Вы вышли из кабинета'); });

  /* ---------- Список авто + статистика ---------- */
  function renderList() {
    var cars = Store.getCars();
    var total = cars.length, sold = cars.filter(function (c) { return c.sold; }).length;
    var hot = cars.filter(function (c) { return c.featured && !c.sold; }).length;
    var inStock = total - sold;
    $('adminStats').innerHTML =
      stat(total, 'Всего авто') + stat(inStock, 'В наличии') + stat(sold, 'Продано') + stat(hot, 'Хиты продаж');

    $('adminList').innerHTML = cars.map(rowHTML).join('') ||
      '<div class="empty-state">Пока нет авто. Нажмите «+ Добавить авто».</div>';

    $('adminList').querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openModal(b.getAttribute('data-edit')); }); });
    $('adminList').querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { removeCar(b.getAttribute('data-del')); }); });
    $('adminList').querySelectorAll('[data-sold]').forEach(function (b) { b.addEventListener('click', function () { toggleSold(b.getAttribute('data-sold')); }); });
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
  function openModal(id) {
    currentImages = [];
    $('carForm').reset();
    $('carId').value = '';
    if (id) {
      var c = Store.getCar(id);
      if (c) {
        $('modalTitle').textContent = 'Редактировать авто';
        $('carId').value = c.id;
        $('brand').value = c.brand || ''; $('model').value = c.model || '';
        $('year').value = c.year || ''; $('price').value = c.price || '';
        $('mileage').value = c.mileage || ''; $('engine').value = c.engine || '';
        $('transmission').value = c.transmission || ''; $('drive').value = c.drive || '';
        $('body').value = c.body || ''; $('color').value = c.color || '';
        $('description').value = c.description || '';
        $('featured').checked = !!c.featured; $('sold').checked = !!c.sold;
        currentImages = (c.images || []).slice();
      }
    } else {
      $('modalTitle').textContent = 'Добавить авто';
    }
    renderThumbs();
    carModal.classList.add('open');
  }
  function closeModals() { document.querySelectorAll('.modal').forEach(function (m) { m.classList.remove('open'); }); }
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModals); });
  document.querySelectorAll('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) closeModals(); }); });

  $('addBtn').addEventListener('click', function () { openModal(null); });
  $('settingsBtn').addEventListener('click', function () { $('settingsModal').classList.add('open'); });

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
        var max = 1100, w = img.width, h = img.height;
        if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
        var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { cb(canvas.toDataURL('image/jpeg', 0.78)); } catch (err) { cb(null); }
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
    var id = $('carId').value || Store.newId();
    var existing = $('carId').value ? Store.getCar(id) : null;
    var car = {
      id: id,
      brand: $('brand').value.trim(),
      model: $('model').value.trim(),
      year: parseInt($('year').value, 10) || null,
      price: parseInt($('price').value, 10) || 0,
      mileage: parseInt($('mileage').value, 10) || null,
      engine: $('engine').value.trim(),
      transmission: $('transmission').value,
      drive: $('drive').value,
      body: $('body').value,
      color: $('color').value.trim(),
      description: $('description').value.trim(),
      images: currentImages.slice(),
      featured: $('featured').checked,
      sold: $('sold').checked,
      created: existing ? existing.created : Date.now()
    };
    if (!car.images.length) car.images = [Store.PLACEHOLDER(car.brand || 'АВТО', [car.year, car.transmission].filter(Boolean).join(' · '))];
    var ok = Store.upsertCar(car);
    if (!ok) { toast('Не хватает места в браузере. Уменьшите число фото.'); return; }
    closeModals(); renderList();
    toast($('carId').value ? 'Авто обновлено' : 'Авто добавлено в каталог', true);
  });

  function removeCar(id) {
    var c = Store.getCar(id);
    if (!confirm('Удалить «' + [c.brand, c.model].filter(Boolean).join(' ') + '» из каталога?')) return;
    Store.deleteCar(id); renderList(); toast('Авто удалено');
  }
  function toggleSold(id) {
    var c = Store.getCar(id); if (!c) return;
    c.sold = !c.sold; Store.upsertCar(c); renderList();
    toast(c.sold ? 'Отмечено как продано' : 'Возвращено в наличие', true);
  }

  /* ---------- Настройки ---------- */
  $('passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    Store.setPassword($('newPass').value); $('newPass').value = '';
    closeModals(); toast('Пароль изменён', true);
  });
  $('resetBtn').addEventListener('click', function () {
    if (!confirm('Сбросить каталог к примерам? Добавленные авто будут удалены.')) return;
    Store.resetCars(); closeModals(); renderList(); toast('Каталог сброшен к примерам');
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
})();
