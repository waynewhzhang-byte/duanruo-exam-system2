const apiBase = 'http://localhost:8081/api/v1';

async function debugTenantAdminLogin() {
    try {
        console.log('🔐 Logging in as tenant_admin_1762476737466...');
        const response = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'tenant_admin_1762476737466',
                password: 'TenantAdmin@123'
            })
        });

        const loginData = await response.json();

        if (!response.ok) {
            console.error('❌ Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful!');
        const token = loginData.token;
        const user = loginData.user;

        console.log('\n📦 User Info:');
        console.log('  - ID:', user.id);
        console.log('  - Username:', user.username);
        console.log('  - Roles:', user.roles);
        console.log('  - Tenant ID:', user.tenantId || '(none)');

        // Decode JWT
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('\n🎟️ Token Payload:');
            console.log('  - User ID:', payload.sub);
            console.log('  - Tenant ID:', payload.tenantId || '(none)');
            console.log('  - Roles:', payload.roles);
        }

        // Check /tenants/me
        console.log('\n🏢 Fetching /tenants/me...');
        try {
            const tenantsResponse = await fetch(`${apiBase}/tenants/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (tenantsResponse.ok) {
                const tenants = await tenantsResponse.json();
                console.log('✅ Tenants Response:', JSON.stringify(tenants, null, 2));

                if (tenants && tenants.length > 0) {
                    console.log('\n✅ User has', tenants.length, 'tenant(s)');
                } else {
                    console.log('\n⚠️ WARNING: tenant_admin should have tenants!');
                }
            } else {
                const errorText = await tenantsResponse.text();
                console.log('❌ /tenants/me failed:', tenantsResponse.status, errorText);
            }
        } catch (e) {
            console.error('❌ Error fetching tenants:', e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugTenantAdminLogin();
