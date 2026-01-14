const API_BASE = 'http://localhost:8081/api/v1';

// 前端实际使用的端点
const FRONTEND_ENDPOINTS = [
    // 从 web/src/app/super-admin/users/page.tsx
    { method: 'POST', path: '/admin/users', source: 'super-admin/users/page.tsx', description: '创建用户' },
    { method: 'GET', path: '/super-admin/tenants', source: 'super-admin/users/page.tsx', description: '获取租户列表' },
    { method: 'POST', path: '/tenants/{tenantId}/users/roles', source: 'super-admin/users/page.tsx', description: '分配租户角色' },

    // 从 web/src/app/[tenantSlug]/login/page.tsx
    { method: 'POST', path: '/auth/login', source: '[tenantSlug]/login/page.tsx', description: '用户登录' },
    { method: 'GET', path: '/tenants/slug/{slug}', source: '[tenantSlug]/login/page.tsx', description: '根据slug获取租户' },

    // 从 web/src/app/super-admin/tenants/page.tsx
    { method: 'POST', path: '/super-admin/tenants', source: 'super-admin/tenants/page.tsx', description: '创建租户' },
];

async function checkEndpoint(method, path, description, source) {
    try {
        // 替换路径参数为实际值
        const testPath = path
            .replace('{tenantId}', '421eee4a-1a2a-4f9d-95a4-37073d4b15c5')
            .replace('{slug}', 'test-company-a');

        const response = await fetch(`${API_BASE}${testPath}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
        });

        const exists = response.status !== 404;
        const status = response.status;

        console.log(
            exists ? '✅' : '❌',
            `${method.padEnd(6)} ${path.padEnd(45)} [${status}]`
        );

        if (!exists) {
            console.log(`   ⚠️  来源: ${source}`);
            console.log(`   📝 说明: ${description}`);
        }

        return { path, exists, status, source };
    } catch (error) {
        console.log('❌', `${method.padEnd(6)} ${path.padEnd(45)} [ERROR]`);
        console.log(`   ⚠️  错误: ${error.message}`);
        return { path, exists: false, status: 'ERROR', source, error: error.message };
    }
}

async function main() {
    console.log('\\n🔍 检查前后端 API 一致性\\n');
    console.log('后端地址:', API_BASE);
    console.log('检查时间:', new Date().toLocaleString('zh-CN'));
    console.log('\\n' + '='.repeat(80) + '\\n');

    const results = [];

    for (const endpoint of FRONTEND_ENDPOINTS) {
        const result = await checkEndpoint(
            endpoint.method,
            endpoint.path,
            endpoint.description,
            endpoint.source
        );
        results.push(result);
    }

    console.log('\\n' + '='.repeat(80) + '\\n');

    const passed = results.filter(r => r.exists).length;
    const failed = results.filter(r => !r.exists).length;

    console.log('📊 检查结果:');
    console.log(`   ✅ 通过: ${passed}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log(`   📈 通过率: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\\n⚠️  发现不一致的端点，请检查:');
        results.filter(r => !r.exists).forEach(r => {
            console.log(`   - ${r.path} (来源: ${r.source})`);
        });
    }

    console.log('\\n💡 建议:');
    console.log('   1. 访问 http://localhost:8081/swagger-ui.html 查看完整 API 文档');
    console.log('   2. 对比前端代码中的 API 调用');
    console.log('   3. 考虑使用 OpenAPI 自动生成前端客户端');
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('\\n❌ 检查脚本执行失败:', error.message);
    process.exit(1);
});
