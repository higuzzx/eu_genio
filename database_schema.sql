-- Schema para o Eu Gênio (Atualizado com Auth e RLS)

-- Tabela de Perfis de Usuário (Vinculada ao Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Tabela de Projetos
CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS em projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING ( auth.uid() = user_id );

-- Tabela de Variáveis
CREATE TABLE public.variables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    variable_index INTEGER NOT NULL
);

-- Habilitar RLS em variables
ALTER TABLE public.variables ENABLE ROW LEVEL SECURITY;

-- Política: Acesso permitido se o usuário for dono do projeto pai
CREATE POLICY "Users can manage variables of own projects"
  ON public.variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.variables.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

-- Tabela de Restrições
CREATE TABLE public.constraints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
    sign VARCHAR(5) NOT NULL CHECK (sign IN ('<=', '>=', '=')),
    rhs NUMERIC NOT NULL,
    constraint_index INTEGER NOT NULL
);

ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage constraints of own projects"
  ON public.constraints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.constraints.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

-- Tabela de Coeficientes das Restrições
CREATE TABLE public.constraint_coefficients (
    id SERIAL PRIMARY KEY,
    constraint_id INTEGER REFERENCES public.constraints(id) ON DELETE CASCADE,
    variable_id INTEGER REFERENCES public.variables(id) ON DELETE CASCADE,
    coefficient NUMERIC NOT NULL
);

ALTER TABLE public.constraint_coefficients ENABLE ROW LEVEL SECURITY;

-- Política um pouco mais complexa: verificar via constraint -> project
CREATE POLICY "Users can manage coefficients of own projects"
  ON public.constraint_coefficients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.constraints
      JOIN public.projects ON public.constraints.project_id = public.projects.id
      WHERE public.constraints.id = public.constraint_coefficients.constraint_id
      AND public.projects.user_id = auth.uid()
    )
  );

-- Tabela de Função Objetivo
CREATE TABLE public.objective_function (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('MAX', 'MIN')),
    variable_id INTEGER REFERENCES public.variables(id) ON DELETE CASCADE,
    coefficient NUMERIC NOT NULL
);

ALTER TABLE public.objective_function ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage objective function of own projects"
  ON public.objective_function FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.objective_function.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

-- Tabela de Resultados
CREATE TABLE public.results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
    z_value NUMERIC,
    status VARCHAR(50),
    solved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage results of own projects"
  ON public.results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.results.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

-- Índices para performance e para remover warnings do Supabase
CREATE INDEX idx_project_user ON public.projects(user_id);
CREATE INDEX idx_project_vars ON public.variables(project_id);
CREATE INDEX idx_project_constraints ON public.constraints(project_id);
CREATE INDEX idx_constraint_coeffs_constraint ON public.constraint_coefficients(constraint_id);
CREATE INDEX idx_constraint_coeffs_variable ON public.constraint_coefficients(variable_id);
CREATE INDEX idx_obj_func_project ON public.objective_function(project_id);
CREATE INDEX idx_obj_func_variable ON public.objective_function(variable_id);
CREATE INDEX idx_results_project ON public.results(project_id);

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();