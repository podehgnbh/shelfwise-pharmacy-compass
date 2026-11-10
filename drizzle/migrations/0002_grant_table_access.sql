GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelves, public.categories, public.medicines TO authenticated;
GRANT SELECT ON public.profiles, public.user_roles TO authenticated;
GRANT UPDATE (pharmacy_name) ON public.profiles TO authenticated;
GRANT ALL ON public.shelves, public.categories, public.medicines, public.profiles, public.user_roles TO service_role;