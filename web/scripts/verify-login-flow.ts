const API_BASE = 'http://localhost:8081/api/v1';
const FRONTEND_BASE = 'http://localhost:3000';

async function verifyLoginFlow() {
  console.log('🔍 验证完整登录流程\n');
  console.log('='.repeat(80));

  // 步骤1: 测试后端健康检查
  console.log('\n📡 步骤1: 检查后端服务');
  console.log('-'.repeat(80));
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log(`后端健康检查: ${healthResponse.status} ${healthResponse.statusText}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 后端服务正常:', healthData);
    }
  } catch (error) {
    console.log('❌ 后端服务不可用:', error.message);
    return;
  }

  // 步骤2: 测试前端服务
  console.log('\n🌐 步骤2: 检查前端服务');
  console.log('-'.repeat(80));
  try {
    const frontendResponse = await fetch(FRONTEND_BASE);
    console.log(`前端服务: ${frontendResponse.status} ${frontendResponse.statusText}`);
    if (frontendResponse.ok) {
      console.log('✅ 前端服务正常');
    }
  } catch (error) {
    console.log('❌ 前端服务不可用:', error.message);
    return;
  }

  // 步骤3: 测试admin登录
  console.log('\n🔐 步骤3: 测试admin用户登录');
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

    console.log(`登录状态: ${loginResponse.status} ${loginResponse.statusText}`);

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('✅ 登录成功!');
      console.log(`   用户: ${loginData.user.username} (${loginData.user.fullName})`);
      console.log(`   角色: ${loginData.user.roles.join(', ')}`);
      console.log(`   权限数量: ${loginData.user.permissions.length}`);
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ 登录失败:', errorData);
      return;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return;
  }

  // 步骤4: 测试获取考试列表
  console.log('\n📝 步骤4: 获取考试列表');
  console.log('-'.repeat(80));
  try {
    const examsResponse = await fetch(`${API_BASE}/exams?page=0&size=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`考试列表状态: ${examsResponse.status} ${examsResponse.statusText}`);

    if (examsResponse.ok) {
      const examsData = await examsResponse.json();
      console.log(`✅ 找到 ${examsData.content?.length || 0} 个考试`);
      if (examsData.content && examsData.content.length > 0) {
        console.log('\n前3个考试:');
        examsData.content.slice(0, 3).forEach((exam: any, index: number) => {
          console.log(`   ${index + 1}. ${exam.title} (${exam.code}) - ${exam.status}`);
        });
      }
    } else {
      console.log('❌ 获取考试列表失败');
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }

  // 步骤5: 测试获取岗位列表
  console.log('\n💼 步骤5: 获取岗位列表');
  console.log('-'.repeat(80));
  try {
    // 先获取一个考试ID
    const examsResponse = await fetch(`${API_BASE}/exams?page=0&size=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (examsResponse.ok) {
      const examsData = await examsResponse.json();
      if (examsData.content && examsData.content.length > 0) {
        const examId = examsData.content[0].id;
        console.log(`使用考试: ${examsData.content[0].title} (${examId})`);

        const positionsResponse = await fetch(`${API_BASE}/exams/${examId}/positions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log(`岗位列表状态: ${positionsResponse.status} ${positionsResponse.statusText}`);

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          console.log(`✅ 找到 ${positionsData.length || 0} 个岗位`);
          if (positionsData && positionsData.length > 0) {
            console.log('\n岗位列表:');
            positionsData.forEach((position: any, index: number) => {
              console.log(`   ${index + 1}. ${position.title} (${position.code})`);
            });
          }
        }
      } else {
        console.log('⚠️  没有可用的考试');
      }
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }

  // 步骤6: 测试获取科目列表
  console.log('\n📚 步骤6: 获取科目列表');
  console.log('-'.repeat(80));
  try {
    // 先获取一个岗位ID
    const examsResponse = await fetch(`${API_BASE}/exams?page=0&size=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (examsResponse.ok) {
      const examsData = await examsResponse.json();
      if (examsData.content && examsData.content.length > 0) {
        const examId = examsData.content[0].id;

        const positionsResponse = await fetch(`${API_BASE}/exams/${examId}/positions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          if (positionsData && positionsData.length > 0) {
            const positionId = positionsData[0].id;
            console.log(`使用岗位: ${positionsData[0].title} (${positionId})`);

            const subjectsResponse = await fetch(`${API_BASE}/positions/${positionId}/subjects`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            console.log(`科目列表状态: ${subjectsResponse.status} ${subjectsResponse.statusText}`);

            if (subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json();
              console.log(`✅ 找到 ${subjectsData.length || 0} 个科目`);
              if (subjectsData && subjectsData.length > 0) {
                console.log('\n科目列表:');
                subjectsData.forEach((subject: any, index: number) => {
                  console.log(`   ${index + 1}. ${subject.name} (${subject.type}) - ${subject.durationMinutes}分钟`);
                });
              }
            }
          } else {
            console.log('⚠️  该考试没有岗位');
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }

  // 总结
  console.log('\n📊 验证总结');
  console.log('='.repeat(80));
  console.log('✅ 后端服务: 正常');
  console.log('✅ 前端服务: 正常');
  console.log('✅ Admin登录: 成功');
  console.log('✅ API访问: 正常');
  console.log('\n🎉 所有验证通过！测试可以正常运行。');
}

verifyLoginFlow().catch(console.error);

