// Script to assign TENANT_ADMIN role to user in a specific tenant

const API_BASE = 'http://localhost:8081/api/v1';
const TENANT_ID = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5'; // From BDD config
const TARGET_USER = 'tenant_admin_1762476737466';
const ROLE_TO_GRANT = 'TENANT_ADMIN';

async function request(method, endpoint, token, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${method} ${endpoint} failed (${response.status}): ${text}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function main() {
    try {
        // 1. Login as target user to get their ID
        console.log(`1. Logging in as ${TARGET_USER} to get user ID...`);
        const userLogin = await request('POST', '/auth/login', null, {
            username: TARGET_USER,
            password: 'TenantAdmin@123'
        });
        const userId = userLogin.user.id;
        console.log(`   User ID: ${userId}`);

        // 2. Login as Super Admin
        console.log('2. Logging in as Super Admin...');
        const adminLogin = await request('POST', '/auth/login', null, {
            username: 'super_admin',
            password: 'SuperAdmin123!@#'
        });
        const token = adminLogin.token;
        console.log('   Token obtained.');

        // 3. Grant role to user in tenant
        console.log(`3. Granting ${ROLE_TO_GRANT} role to user in tenant ${TENANT_ID}...`);
        await request('POST', `/tenants/${TENANT_ID}/users/roles`, token, {
            userId: userId,
            role: ROLE_TO_GRANT
        });
        console.log('   ✓ Role granted successfully!');
        console.log(`\nUser ${TARGET_USER} now has ${ROLE_TO_GRANT} role in tenant.`);

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        process.exit(1);
    }
}

main();
