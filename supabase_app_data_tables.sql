-- SQL para criar as tabelas estruturadas do aplicativo
-- Rodar este SQL no painel Supabase -> SQL Editor

-- 1. Tabela para Membros da Equipe
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table members enable row level security;

create policy "Users can view their own members"
  on members for select using (auth.uid() = user_id);

create policy "Users can insert their own members"
  on members for insert with check (auth.uid() = user_id);

create policy "Users can update their own members"
  on members for update using (auth.uid() = user_id);

create policy "Users can delete their own members"
  on members for delete using (auth.uid() = user_id);


-- 2. Tabela para Tarefas
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) not null,
  phase_id text not null, -- Ex: 'p1', 'p2'
  title text not null,
  description text,
  assignee text, -- Nome do membro
  status text not null default 'todo', -- Ex: 'todo', 'done'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

create policy "Users can view their own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete using (auth.uid() = user_id);


-- 3. Tabela para Ingredientes
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) not null,
  name text not null,
  price numeric not null, -- Preço por kg (ou outra unidade base)
  grams numeric not null, -- Quantidade em gramas
  source text not null, -- 'startup' ou 'proprio'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table ingredients enable row level security;

create policy "Users can view their own ingredients"
  on ingredients for select using (auth.uid() = user_id);

create policy "Users can insert their own ingredients"
  on ingredients for insert with check (auth.uid() = user_id);

create policy "Users can update their own ingredients"
  on ingredients for update using (auth.uid() = user_id);

create policy "Users can delete their own ingredients"
  on ingredients for delete using (auth.uid() = user_id);


-- 4. Tabela para Custos Extras
create table if not exists extra_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) not null,
  name text not null,
  cost numeric not null, -- Custo total
  source text not null, -- 'startup' ou 'proprio'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table extra_costs enable row level security;

create policy "Users can view their own extra_costs"
  on extra_costs for select using (auth.uid() = user_id);

create policy "Users can insert their own extra_costs"
  on extra_costs for insert with check (auth.uid() = user_id);

create policy "Users can update their own extra_costs"
  on extra_costs for update using (auth.uid() = user_id);

create policy "Users can delete their own extra_costs"
  on extra_costs for delete using (auth.uid() = user_id);


-- Trigger para atualizar o campo updated_at automaticamente em todas as tabelas
-- Copie e cole este trigger e a função update_updated_at_column para o seu Supabase
-- Se você já tem a função, só precisa criar os triggers para as novas tabelas.
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Aplica o trigger às novas tabelas
drop trigger if exists update_members_updated_at on members;
create trigger update_members_updated_at
before update on members
for each row
execute procedure update_updated_at_column();

drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
before update on tasks
for each row
execute procedure update_updated_at_column();

drop trigger if exists update_ingredients_updated_at on ingredients;
create trigger update_ingredients_updated_at
before update on ingredients
for each row
execute procedure update_updated_at_column();

drop trigger if exists update_extra_costs_updated_at on extra_costs;
create trigger update_extra_costs_updated_at
before update on extra_costs
for each row
execute procedure update_updated_at_column();

-- FIM do SQL
