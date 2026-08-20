/* ==========================================================================
   Автосалон 911 — слой данных (демо, localStorage)
   --------------------------------------------------------------------------
   ВНИМАНИЕ (демо-режим): авто хранятся в браузере (localStorage), вход в
   админку проверяется на стороне клиента. Это витрина концепции.
   Для «живого» каталога, общего для всех посетителей, и настоящей защиты
   входа — следующий шаг: подключение Supabase (auth + база + хранилище фото).
   ========================================================================== */
(function (global) {
  'use strict';

  var CARS_KEY = 'a911_cars_v1';
  var SESSION_KEY = 'a911_session';
  var PASS_KEY = 'a911_pass';

  // Демо-пароль администратора (сменить в разделе «Настройки» админки).
  var DEFAULT_PASSWORD = 'avto911';

  // Компактный SVG-плейсхолдер для карточек-примеров (работает офлайн).
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

  // Примеры авто «в наличии» (заменяются реальными через админку).
  var SEED = [
    {
      id: 'seed-1', brand: 'Kia', model: 'Rio', year: 2014, price: 749000, mileage: 128000,
      engine: '1.6 (123 л.с.)', transmission: 'Автомат', drive: 'Передний', body: 'Седан', color: 'Синий',
      description: 'Один владелец, обслужен, новая резина. Кредит / трейд-ин.',
      images: [placeholder('KIA RIO', '2014 · 1.6 АТ')], sold: false, featured: true, created: Date.now() - 6e8
    },
    {
      id: 'seed-2', brand: 'Renault', model: 'Duster', year: 2017, price: 1090000, mileage: 96000,
      engine: '2.0 (143 л.с.)', transmission: 'Механика', drive: 'Полный', body: 'Внедорожник', color: 'Серебро',
      description: 'Полный привод, идеален для города и трассы. Возможен обмен.',
      images: [placeholder('RENAULT DUSTER', '2017 · 2.0 4x4')], sold: false, featured: true, created: Date.now() - 5e8
    },
    {
      id: 'seed-3', brand: 'BMW', model: '3 series (E90)', year: 2008, price: 899000, mileage: 210000,
      engine: '2.0 (150 л.с.)', transmission: 'Автомат', drive: 'Задний', body: 'Седан', color: 'Чёрный',
      description: 'Ухоженный экземпляр, вложений не требует. Автокредит от банков-партнёров.',
      images: [placeholder('BMW 3 E90', '2008 · 2.0 АТ')], sold: false, featured: true, created: Date.now() - 4e8
    },
    {
      id: 'seed-4', brand: 'Lada', model: 'Vesta', year: 2019, price: 899000, mileage: 74000,
      engine: '1.6 (106 л.с.)', transmission: 'Механика', drive: 'Передний', body: 'Седан', color: 'Белый',
      description: 'Свежий год, экономичный расход. Оформление за 1 день.',
      images: [placeholder('LADA VESTA', '2019 · 1.6 МТ')], sold: false, featured: false, created: Date.now() - 3e8
    },
    {
      id: 'seed-5', brand: 'Haval', model: 'F7', year: 2020, price: 1990000, mileage: 68000,
      engine: '2.0T (190 л.с.)', transmission: 'Робот', drive: 'Полный', body: 'Кроссовер', color: 'Чёрный',
      description: 'Максимальная комплектация, панорама, камеры кругового обзора.',
      images: [placeholder('HAVAL F7', '2020 · 2.0T 4x4')], sold: false, featured: true, created: Date.now() - 2e8
    },
    {
      id: 'seed-6', brand: 'Mercedes-Benz', model: 'C-class (W202)', year: 1997, price: 349000, mileage: 240000,
      engine: '2.0 (136 л.с.)', transmission: 'Автомат', drive: 'Задний', body: 'Седан', color: 'Бордовый',
      description: 'Классика в достойном состоянии. Реализация под комиссию.',
      images: [placeholder('MERCEDES W202', '1997 · 2.0 АТ')], sold: false, featured: false, created: Date.now() - 1e8
    }
  ];

  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  var Store = {
    PLACEHOLDER: placeholder,

    getCars: function () {
      var cars = read(CARS_KEY, null);
      if (!cars) { write(CARS_KEY, SEED); cars = SEED.slice(); }
      return cars.sort(function (a, b) {
        if (!!a.sold !== !!b.sold) return a.sold ? 1 : -1;
        return (b.created || 0) - (a.created || 0);
      });
    },
    getCar: function (id) {
      return this.getCars().filter(function (c) { return c.id === id; })[0] || null;
    },
    saveCars: function (cars) { return write(CARS_KEY, cars); },
    upsertCar: function (car) {
      var cars = read(CARS_KEY, SEED.slice());
      var i = -1;
      for (var k = 0; k < cars.length; k++) if (cars[k].id === car.id) { i = k; break; }
      if (i >= 0) cars[i] = car; else cars.unshift(car);
      return write(CARS_KEY, cars);
    },
    deleteCar: function (id) {
      var cars = read(CARS_KEY, SEED.slice()).filter(function (c) { return c.id !== id; });
      return write(CARS_KEY, cars);
    },
    resetCars: function () { write(CARS_KEY, SEED.slice()); },
    newId: function () { return 'car-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); },

    // ---- Демо-авторизация ----
    getPassword: function () { return read(PASS_KEY, null) || DEFAULT_PASSWORD; },
    setPassword: function (p) { return write(PASS_KEY, p); },
    login: function (pass) {
      if (pass === this.getPassword()) {
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
        return true;
      }
      return false;
    },
    logout: function () { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {} },
    isAuthed: function () { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } },

    formatPrice: function (n) {
      n = Number(n) || 0;
      return n.toLocaleString('ru-RU') + ' ₽';
    },
    formatKm: function (n) {
      n = Number(n) || 0;
      return n.toLocaleString('ru-RU') + ' км';
    }
  };

  global.Store = Store;
})(window);
