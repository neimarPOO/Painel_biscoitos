-- Tabela para armazenar os dados do aplicativo por usuário
-- Armazena o JSON inteiro do 'appData' na coluna 'content'

create table if not exists user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  content jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
alter table user_data enable row level security;

-- Política: Usuários só podem ver seus próprios dados
create policy "Users can only see their own data" 
on user_data for select 
using (auth.uid() = user_id);

-- Política: Usuários só podem inserir seus próprios dados
create policy "Users can insert their own data" 
on user_data for insert 
with check (auth.uid() = user_id);

-- Política: Usuários só podem atualizar seus próprios dados
create policy "Users can update their own data" 
on user_data for update 
using (auth.uid() = user_id);

-- Trigger para atualizar o campo updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_user_data_updated_at
before update on user_data
for each row
execute procedure update_updated_at_column();
