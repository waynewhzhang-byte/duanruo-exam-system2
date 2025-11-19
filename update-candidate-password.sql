-- 更新考生密码
UPDATE public.users 
SET password_hash = '$2a$10$.SP6ZyWCd9pF/v3c8HuAaei.I35zKkHaYaHVut6EFiPObspUH.f8G' 
WHERE username = 'bdd_candidate';

