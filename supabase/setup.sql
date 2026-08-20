-- ============================================================================
-- Автосалон 911 — настройка Supabase
-- Откройте панель Supabase → SQL Editor → New query → вставьте это → Run.
-- Скрипт можно запускать повторно (idempotent).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- Таблица авто -----------------------------------------------------------
create table if not exists public.cars (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  model         text,
  year          int,
  price         bigint not null default 0,
  mileage       int,
  engine        text,
  transmission  text,
  drive         text,
  body          text,
  color         text,
  description   text,
  images        jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  sold          boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.cars enable row level security;

-- Читать каталог могут все (в т.ч. анонимные посетители)
drop policy if exists "cars public read" on public.cars;
create policy "cars public read" on public.cars for select using (true);

-- Добавлять / менять / удалять — только вошедший администратор
drop policy if exists "cars auth insert" on public.cars;
create policy "cars auth insert" on public.cars for insert to authenticated with check (true);

drop policy if exists "cars auth update" on public.cars;
create policy "cars auth update" on public.cars for update to authenticated using (true) with check (true);

drop policy if exists "cars auth delete" on public.cars;
create policy "cars auth delete" on public.cars for delete to authenticated using (true);

-- ---- Хранилище фото ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects for select using (bucket_id = 'car-photos');

drop policy if exists "photos auth insert" on storage.objects;
create policy "photos auth insert" on storage.objects for insert to authenticated with check (bucket_id = 'car-photos');

drop policy if exists "photos auth update" on storage.objects;
create policy "photos auth update" on storage.objects for update to authenticated using (bucket_id = 'car-photos');

drop policy if exists "photos auth delete" on storage.objects;
create policy "photos auth delete" on storage.objects for delete to authenticated using (bucket_id = 'car-photos');

-- ---- Примеры авто (чтобы каталог не был пустым; можно удалить позже) --------
insert into public.cars (brand, model, year, price, mileage, engine, transmission, drive, body, color, description, featured)
select * from (values
  ('Kia','Rio',2014,749000,128000,'1.6 (123 л.с.)','Автомат','Передний','Седан','Синий','Один владелец, обслужен, новая резина. Кредит / трейд-ин.',true),
  ('Renault','Duster',2017,1090000,96000,'2.0 (143 л.с.)','Механика','Полный','Внедорожник','Серебро','Полный привод, идеален для города и трассы. Возможен обмен.',true),
  ('BMW','3 series (E90)',2008,899000,210000,'2.0 (150 л.с.)','Автомат','Задний','Седан','Чёрный','Ухоженный экземпляр, вложений не требует. Автокредит от банков-партнёров.',true),
  ('Lada','Vesta',2019,899000,74000,'1.6 (106 л.с.)','Механика','Передний','Седан','Белый','Свежий год, экономичный расход. Оформление за 1 день.',false),
  ('Haval','F7',2020,1990000,68000,'2.0T (190 л.с.)','Робот','Полный','Кроссовер','Чёрный','Максимальная комплектация, панорама, камеры кругового обзора.',true),
  ('Mercedes-Benz','C-class (W202)',1997,349000,240000,'2.0 (136 л.с.)','Автомат','Задний','Седан','Бордовый','Классика в достойном состоянии. Реализация под комиссию.',false)
) as v(brand, model, year, price, mileage, engine, transmission, drive, body, color, description, featured)
where not exists (select 1 from public.cars);

-- Готово. Дальше: Authentication → Users → Add user (email + пароль) для входа в кабинет.
