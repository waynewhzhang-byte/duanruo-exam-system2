const API_BASE = 'http://localhost:8081/api/v1';

async function checkTenantExams() {
  console.log('🏢 检查租户和考试数据\n');
  console.log('='.repeat(80));

  // 登录获取token
  console.log('🔐 步骤1: 登录');
  console.log('-'.repeat(80));
  let token = '';
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123@Abc',
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('✅ 登录成功');
    } else {
      console.log('❌ 登录失败');
      return;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return;
  }

  // 获取租户列表
  console.log('\n🏢 步骤2: 获取租户列表');
  console.log('-'.repeat(80));
  let tenants = [];
  try {
    const tenantsResponse = await fetch(`${API_BASE}/tenants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`租户列表状态: ${tenantsResponse.status}`);

    if (tenantsResponse.ok) {
      const tenantsData = await tenantsResponse.json();
      tenants = Array.isArray(tenantsData) ? tenantsData : (tenantsData.content || []);
      console.log(`✅ 找到 ${tenants.length} 个租户:`);
      tenants.forEach((tenant: any, index: number) => {
        console.log(`   ${index + 1}. ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);
      });
    } else {
      console.log('❌ 获取租户列表失败');
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }

  // 为每个租户获取考试
  console.log('\n📝 步骤3: 获取每个租户的考试');
  console.log('-'.repeat(80));
  for (const tenant of tenants) {
    console.log(`\n租户: ${tenant.name} (${tenant.code})`);
    try {
      const examsResponse = await fetch(`${API_BASE}/tenants/${tenant.id}/exams?page=0&size=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        const examsList = examsData.content || examsData;
        console.log(`   找到 ${examsList.length || 0} 个考试`);
        if (examsList.length > 0) {
          examsList.forEach((exam: any, index: number) => {
            console.log(`   ${index + 1}. ${exam.title} (${exam.code}) - ${exam.status}`);
          });
        }
      } else {
        console.log(`   状态: ${examsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
    }
  }

  // 尝试直接获取考试（不指定租户）
  console.log('\n📝 步骤4: 直接获取考试列表（不指定租户）');
  console.log('-'.repeat(80));
  try {
    const examsResponse = await fetch(`${API_BASE}/exams?page=0&size=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`考试列表状态: ${examsResponse.status}`);

    if (examsResponse.ok) {
      const examsData = await examsResponse.json();
      const examsList = examsData.content || examsData;
      console.log(`✅ 找到 ${examsList.length || 0} 个考试`);
      if (examsList.length > 0) {
        examsList.forEach((exam: any, index: number) => {
          console.log(`   ${index + 1}. ${exam.title} (${exam.code}) - ${exam.status}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

checkTenantExams().catch(console.error);

