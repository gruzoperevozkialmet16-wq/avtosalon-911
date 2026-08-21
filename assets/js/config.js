/* ==========================================================================
   Автосалон 911 — конфигурация Supabase
   --------------------------------------------------------------------------
   Впишите сюда данные вашего проекта Supabase (Project Settings → API):
     url     — Project URL         (например https://abcdxyz.supabase.co)
     anonKey — anon public key     (длинный ключ, начинается с eyJ...)

   Эти значения ПУБЛИЧНЫЕ и безопасны для фронтенда — доступ к данным
   ограничивают политики RLS в базе (см. supabase/setup.sql).

   Пока поля пустые — сайт работает в демо-режиме (авто хранятся в браузере).
   Как только впишете url и anonKey — каталог станет общим для всех посетителей.
   ========================================================================== */
window.SUPABASE_CONFIG = {
  url: 'https://bfsrngafhpcytkmzbopa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3JuZ2FmaHBjeXRrbXpib3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDM4MDYsImV4cCI6MjEwMjgxOTgwNn0.nJIgbyKh_jtj_ySt3BAZOza_reVHc2eHpDQKWKJL8SU',
  bucket: 'car-photos'
};
