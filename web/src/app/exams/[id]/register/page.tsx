'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * 考试报名页面
 * 考生填写报名表单并提交报名申请
 */
export default function ExamRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [formData, setFormData] = useState({
    education: '',
    major: '',
    graduationSchool: '',
    graduationYear: ''
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    idCard: null,
    diploma: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 加载考试信息
    const loadExam = async () => {
      try {
        // TODO: 调用 API 获取考试信息
        // const response = await fetch(`/api/v1/exams/${examId}`);
        // const data = await response.json();
        
        // 模拟数据
        const mockExam = {
          id: examId,
          name: '2025年春季招聘考试',
          code: 'EXAM-2025-SPRING',
          type: '招聘考试',
          registrationStart: '2025-11-01 09:00:00',
          registrationEnd: '2025-11-30 18:00:00',
          examStart: '2025-12-15 09:00:00',
          examEnd: '2025-12-15 11:00:00',
          fee: 100.00,
          status: '报名中'
        };
        
        const mockPositions = [
          { id: '1', name: 'Java开发工程师', code: 'POS-001', requirements: '本科及以上，计算机相关专业' },
          { id: '2', name: '前端开发工程师', code: 'POS-002', requirements: '本科及以上，计算机相关专业' }
        ];
        
        setExam(mockExam);
        setPositions(mockPositions);
      } catch (error) {
        console.error('加载考试信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0] || null;
    setFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPosition) {
      alert('请选择报考岗位');
      return;
    }

    setSubmitting(true);
    
    try {
      // TODO: 调用 API 提交报名
      // 1. 上传附件
      // 2. 提交报名表单
      
      console.log('提交报名:', {
        examId,
        positionId: selectedPosition,
        formData,
        files
      });
      
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('报名提交成功！');
      router.push('/my-applications');
    } catch (error) {
      console.error('报名提交失败:', error);
      alert('报名提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">考试不存在</p>
          <button
            onClick={() => router.push('/exams')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回考试列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => router.push(`/exams/${examId}`)}
            className="text-blue-600 hover:text-blue-700"
          >
            ← 返回考试详情
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold mb-2">{exam.name}</h1>
            <p className="text-gray-600">请填写以下信息完成报名</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* 选择岗位 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                报考岗位 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择岗位</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name} - {position.requirements}
                  </option>
                ))}
              </select>
            </div>

            {/* 学历信息 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">学历信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    学历 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择学历</option>
                    <option value="高中">高中</option>
                    <option value="大专">大专</option>
                    <option value="本科">本科</option>
                    <option value="硕士">硕士</option>
                    <option value="博士">博士</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    专业 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入专业"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    毕业学校 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="graduationSchool"
                    value={formData.graduationSchool}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入毕业学校"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    毕业时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 附件上传 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">附件材料</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    身份证扫描件 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'idCard')}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">支持 PDF、JPG、PNG 格式，最大 5MB</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    学历证明 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'diploma')}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">支持 PDF、JPG、PNG 格式，最大 5MB</p>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '提交报名'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/exams/${examId}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

