-- 更新所有测试用户的密码hash为admin的hash
-- 密码: admin123@Abc
-- Hash: $2a$06$ONeeQbSbtJWKwjJrKZ5.7OFd6oTTDqWJCPnv2grRrUyTPNzkoiT/Ta

UPDATE public.users 
SET password_hash = '$2a$06$ONeeQbSbtJWKwjJrKZ5.7OFd6oTTDqWJCPnv2grRrUyTPNzkoiT/Ta'
WHERE username IN (
    'tenant_admin1', 
    'tenant_admin2', 
    'reviewer1_primary', 
    'reviewer2_secondary',
    'candidate1', 
    'candidate2', 
    'candidate3'
);

-- 验证更新结果
SELECT username, 
       CASE 
           WHEN password_hash = '$2a$06$ONeeQbSbtJWKwjJrKZ5.7OFd6oTTDqWJCPnv2grRrUyTPNzkoiT/Ta' THEN '✓ 正确'
           ELSE '✗ 错误'
       END AS password_status
FROM public.users 
WHERE username IN ('admin', 'tenant_admin1', 'tenant_admin2', 'reviewer1_primary', 'reviewer2_secondary', 'candidate1', 'candidate2', 'candidate3')
ORDER BY username;

