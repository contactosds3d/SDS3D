-- 1. Tabela de ligação entre peças e categorias
CREATE TABLE IF NOT EXISTS public.work_categories (
    work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,

    PRIMARY KEY (work_id, category_id)
);

-- 2. Permissões
GRANT SELECT ON public.work_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_categories TO authenticated;
GRANT ALL ON public.work_categories TO service_role;

-- 3. RLS
ALTER TABLE public.work_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_work_categories
ON public.work_categories
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY admin_work_categories
ON public.work_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Migrar automaticamente as categorias atuais
INSERT INTO public.work_categories (work_id, category_id)
SELECT id, category_id
FROM public.works
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_work_categories_work
ON public.work_categories(work_id);

CREATE INDEX IF NOT EXISTS idx_work_categories_category
ON public.work_categories(category_id);