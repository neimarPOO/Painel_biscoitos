-- Tabela para armazenar configurações numéricas do usuário
create table if not exists user_settings (
  user_id uuid primary key references auth.users (id) not null,
  production_goal numeric default 50,
  units_per_package numeric default 6,
  units_sold numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update using (auth.uid() = user_id);

-- Trigger para updated_at
create trigger update_user_settings_updated_at
before update on user_settings
for each row
execute procedure update_updated_at_column();
