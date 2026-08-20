/* ==========================================================================
   Автосалон 911 — слой данных (Supabase + демо-fallback)
   --------------------------------------------------------------------------
   Если в assets/js/config.js заданы url и anonKey — данные берутся из
   Supabase (общий каталог для всех, авторизация на сервере, фото в Storage).
   Если поля пустые — работает демо-режим на localStorage (данные только
   в этом браузере). API одинаковый и асинхронный (Promise).
   ========================================================================== */
(function (global) {
  'use strict';

  var CARS_KEY = 'a911_cars_v1';
  var SESSION_KEY = 'a911_session';
  var PASS_KEY = 'a911_pass';
  var DEFAULT_PASSWORD = 'avto911';

  var CFG = global.SUPABASE_CONFIG || {};
  var BUCKET = CFG.bucket || 'car-photos';
  var useSB = !!(CFG.url && CFG.anonKey && global.supabase && global.supabase.createClient);
  var sb = useSB ? global.supabase.createClient(CFG.url, CFG.anonKey) : null;

  var _session = null;         // текущая сессия Supabase
  var _authListeners = [];

  /* ---------- Плейсхолдер (SVG) ---------- */
  function placeholder(label, sub) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#17171c"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient></defs>' +
      '<rect width="800" height="560" fill="url(#g)"/>' +
      '<path d="M150 360c0-14 8-24 20-30l40-70c10-18 26-30 52-30h176c26 0 42 12 52 30l40 70c12 6 20 16 20 30v46c0 8-6 14-14 14h-30c-8 0-14-6-14-14v-14H208v14c0 8-6 14-14 14h-30c-8 0-14-6-14-14z" fill="#26262e"/>' +
      '<circle cx="250" cy="392" r="26" fill="#0b0b0d" stroke="#3a3a44" stroke-width="6"/>' +
      '<circle cx="550" cy="392" r="26" fill="#0b0b0d" stroke="#3a3a44" stroke-width="6"/>' +
      '<rect x="150" y="356" width="500" height="6" fill="#e11d2a" opacity="0.7"/>' +
      '<text x="400" y="150" fill="#f5f5f7" font-family="Oswald, Arial, sans-serif" font-size="54" font-weight="600" text-anchor="middle" letter-spacing="2">' + esc(label) + '</text>' +
      (sub ? '<text x="400" y="196" fill="#9a9aa5" font-family="Manrope, Arial, sans-serif" font-size="24" text-anchor="middle">' + esc(sub) + '</text>' : '') +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- Демо-данные ---------- */
  var SEED = [
    { id: 'seed-1', brand: 'Kia', model: 'Rio', year: 2014, price: 749000, mileage: 128000, engine: '1.6 (123 л.с.)', transmission: 'Автомат', drive: 'Передний', body: 'Седан', color: 'Синий', description: 'Один владелец, обслужен, новая резина. Кредит / трейд-ин.', images: [], sold: false, featured: true, created: Date.now() - 6e8 },
    { id: 'seed-2', brand: 'Renault', model: 'Duster', year: 2017, price: 1090000, mileage: 96000, engine: '2.0 (143 л.с.)', transmission: 'Механика', drive: 'Полный', body: 'Внедорожник', color: 'Серебро', description: 'Полный привод, идеален для города и трассы. Возможен обмен.', images: [], sold: false, featured: true, created: Date.now() - 5e8 },
    { id: 'seed-3', brand: 'BMW', model: '3 series (E90)', year: 2008, price: 899000, mileage: 210000, engine: '2.0 (150 л.с.)', transmission: 'Автомат', drive: 'Задний', body: 'Седан', color: 'Чёрный', description: 'Ухоженный экземпляр, вложений не требует. Автокредит от банков-партнёров.', images: [], sold: false, featured: true, created: Date.now() - 4e8 },
    { id: 'seed-4', brand: 'Lada', model: 'Vesta', year: 2019, price: 899000, mileage: 74000, engine: '1.6 (106 л.с.)', transmission: 'Механика', drive: 'Передний', body: 'Седан', color: 'Белый', description: 'Свежий год, экономичный расход. Оформление за 1 день.', images: [], sold: false, featured: false, created: Date.now() - 3e8 },
    { id: 'seed-5', brand: 'Haval', model: 'F7', year: 2020, price: 1990000, mileage: 68000, engine: '2.0T (190 л.с.)', transmission: 'Робот', drive: 'Полный', body: 'Кроссовер', color: 'Чёрный', description: 'Максимальная комплектация, панорама, камеры кругового обзора.', images: [], sold: false, featured: true, created: Date.now() - 2e8 },
    { id: 'seed-6', brand: 'Mercedes-Benz', model: 'C-class (W202)', year: 1997, price: 349000, mileage: 240000, engine: '2.0 (136 л.с.)', transmission: 'Автомат', drive: 'Задний', body: 'Седан', color: 'Бордовый', description: 'Классика в достойном состоянии. Реализация под комиссию.', images: [], sold: false, featured: false, created: Date.now() - 1e8 }
  ];

  function read(key, fb) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  function sortCars(cars) {
    return cars.sort(function (a, b) {
      if (!!a.sold !== !!b.sold) return a.sold ? 1 : -1;
      return (b.created || 0) - (a.created || 0);
    });
  }

  /* маппинг строки БД → объект карточки */
  function fromRow(r) {
    return {
      id: r.id, brand: r.brand, model: r.model, year: r.year, price: r.price,
      mileage: r.mileage, engine: r.engine, transmission: r.transmission, drive: r.drive,
      body: r.body, color: r.color, description: r.description,
      images: Array.isArray(r.images) ? r.images : (r.images || []),
      featured: !!r.featured, sold: !!r.sold,
      created: r.created_at ? new Date(r.created_at).getTime() : Date.now()
    };
  }
  function toRow(c) {
    return {
      brand: c.brand, model: c.model, year: c.year, price: c.price, mileage: c.mileage,
      engine: c.engine, transmission: c.transmission, drive: c.drive, body: c.body,
      color: c.color, description: c.description, images: c.images || [],
      featured: !!c.featured, sold: !!c.sold
    };
  }

  /* dataURL → Blob (для загрузки фото в Storage) */
  function dataURLtoBlob(dataUrl) {
    var parts = dataUrl.split(','), mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1]), n = bin.length, u8 = new Uint8Array(n);
    while (n--) u8[n] = bin.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }

  var Store = {
    mode: useSB ? 'supabase' : 'demo',
    PLACEHOLDER: placeholder,
    ready: null,

    /* ---------- Инициализация (восстановление сессии) ---------- */
    init: function () {
      var self = this;
      if (self.ready) return self.ready;
      if (!useSB) { self.ready = Promise.resolve(); return self.ready; }
      self.ready = sb.auth.getSession().then(function (res) {
        _session = (res && res.data && res.data.session) || null;
        sb.auth.onAuthStateChange(function (_evt, session) {
          _session = session || null;
          _authListeners.forEach(function (fn) { try { fn(!!_session); } catch (e) {} });
        });
      }).catch(function () { _session = null; });
      return self.ready;
    },
    onAuthChange: function (fn) { _authListeners.push(fn); },

    /* ---------- Каталог ---------- */
    listCars: function () {
      if (useSB) {
        return sb.from('cars').select('*').then(function (res) {
          if (res.error) { console.error('Supabase listCars:', res.error.message); return []; }
          return sortCars((res.data || []).map(fromRow));
        });
      }
      var cars = read(CARS_KEY, null);
      if (!cars) { write(CARS_KEY, SEED); cars = SEED.slice(); }
      return Promise.resolve(sortCars(cars));
    },
    getCar: function (id) {
      if (useSB) {
        return sb.from('cars').select('*').eq('id', id).maybeSingle().then(function (res) {
          return res.data ? fromRow(res.data) : null;
        });
      }
      var c = read(CARS_KEY, SEED.slice()).filter(function (x) { return x.id === id; })[0];
      return Promise.resolve(c || null);
    },

    /* ---------- Загрузка фото ---------- */
    uploadImage: function (dataUrl) {
      if (!useSB) return Promise.resolve(dataUrl); // демо: храним base64 как есть
      var blob = dataURLtoBlob(dataUrl);
      var path = 'cars/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
      return sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        .then(function (res) {
          if (res.error) throw res.error;
          return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        });
    },

    /* ---------- Сохранение / удаление ---------- */
    saveCar: function (car) {
      var self = this;
      // сначала выгружаем новые фото (data:) → получаем URL
      var imgs = (car.images || []);
      var jobs = imgs.map(function (src) {
        return (typeof src === 'string' && src.indexOf('data:') === 0) ? self.uploadImage(src) : Promise.resolve(src);
      });
      return Promise.all(jobs).then(function (urls) {
        car.images = urls.filter(Boolean);
        if (useSB) {
          var row = toRow(car);
          var q = (car.id && String(car.id).indexOf('car-') !== 0 && String(car.id).indexOf('seed-') !== 0)
            ? sb.from('cars').update(row).eq('id', car.id)         // существующая запись (uuid)
            : sb.from('cars').insert(row);                          // новая
          return q.then(function (res) { if (res.error) throw res.error; return true; });
        }
        var cars = read(CARS_KEY, SEED.slice());
        var i = -1; for (var k = 0; k < cars.length; k++) if (cars[k].id === car.id) { i = k; break; }
        if (i >= 0) cars[i] = car; else cars.unshift(car);
        if (!write(CARS_KEY, cars)) throw new Error('quota');
        return true;
      });
    },
    deleteCar: function (id) {
      if (useSB) return sb.from('cars').delete().eq('id', id).then(function (res) { if (res.error) throw res.error; return true; });
      var cars = read(CARS_KEY, SEED.slice()).filter(function (c) { return c.id !== id; });
      return Promise.resolve(write(CARS_KEY, cars));
    },
    resetCars: function () { if (!useSB) write(CARS_KEY, SEED.slice()); return Promise.resolve(true); },
    newId: function () { return 'car-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); },

    /* ---------- Авторизация ---------- */
    login: function (email, password) {
      if (useSB) {
        return sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
          if (res.error) return { ok: false, error: res.error.message };
          _session = res.data.session; return { ok: true };
        });
      }
      // демо: сверяем только пароль
      var ok = (password === (read(PASS_KEY, null) || DEFAULT_PASSWORD));
      if (ok) { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {} }
      return Promise.resolve({ ok: ok, error: ok ? null : 'Неверный пароль' });
    },
    logout: function () {
      if (useSB) return sb.auth.signOut().then(function () { _session = null; });
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
      return Promise.resolve();
    },
    isAuthed: function () {
      if (useSB) return !!_session;
      try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; }
    },
    currentUserEmail: function () { return (_session && _session.user && _session.user.email) || ''; },

    // демо: смена локального пароля (в Supabase-режиме недоступно)
    setPassword: function (p) { if (!useSB) write(PASS_KEY, p); return !useSB; },

    formatPrice: function (n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽'; },
    formatKm: function (n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' км'; }
  };

  Store.init();
  global.Store = Store;
})(window);
