const fetch = require('node-fetch'); // Ensure node-fetch is available or use global fetch in Node 18+

// Node 18+ has global fetch, so we might not need require if running in recent node
// But to be safe with the environment:
const apiBase = 'http://localhost:8081/api/v1';

async function debugLogin() {
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

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Login failed:', data);
            return;
        }

        console.log('✅ Login successful!');
        const token = data.token;
        console.log('🎟️ Token:', token);

        // Decode JWT (simple base64 decode of the payload)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid JWT format');
            return;
        }

        const payload = JSON.parse(atob(parts[1]));
        console.log('📦 Token Payload:', JSON.stringify(payload, null, 2));

        console.log('\n--- Analysis ---');
        console.log('User ID:', payload.sub);
        console.log('Tenant ID:', payload.tenantId);
        console.log('Roles:', payload.roles);

        if (payload.roles && payload.roles.includes('TENANT_ADMIN')) {
            console.log('✅ TENANT_ADMIN role found!');
        } else {
            console.log('❌ TENANT_ADMIN role MISSING!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Polyfill for atob in Node.js if needed
function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
}

debugLogin();
