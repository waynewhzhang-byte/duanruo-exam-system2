'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { useBatchImportScores, useScoreImportTemplate } from '@/lib/api-hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface ImportPageProps {
  params: {
    tenantSlug: string
    examId: string
  }
}

interface Exam {
  id: string
  title: string
  status: string
}

interface ImportRecord {
  row: number
  applicationId: string
  candidateName: string
  subjectId: string
  subjectName: string
  score: number | null
  remarks?: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export default function ScoreImportPage({ params }: ImportPageProps) {
  const resolvedParams = params
  const router = useRouter()
  const queryClient = useQueryClient()
  const { tenant } = useTenant()

  const [file, setFile] = useState<File | null>(null)
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  // 获取考试信息
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', resolvedParams.examId, tenant?.id],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant(`/exams/${resolvedParams.examId}`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // 模板下载 Hook
  const { refetch: downloadTemplate } = useScoreImportTemplate(resolvedParams.examId)

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const { data: csv } = await downloadTemplate()
      if (!csv) {
        toast.error('生成模板失败')
        return
      }

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `成绩导入模板_${exam?.title || '考试'}.csv`
      link.click()
      toast.success('模板下载成功，请按模板填写成绩')
    } catch (error) {
      toast.error('模板下载失败')
    }
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // 验证文件类型
    const validTypes = ['.csv']
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (!validTypes.includes(fileExtension)) {
      toast.error('请上传CSV文件')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  // 解析文件
  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processData(results.data as any[])
      },
      error: (error) => {
        toast.error(`文件解析失败: ${error.message}`)
      },
    })
  }

  // 处理数据
  const processData = (data: any[]) => {
    const records: ImportRecord[] = []
    const errors: ValidationError[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // Excel行号从2开始

      // 获取字段（支持不同表头名称，以防用户手动修改）
      const applicationId = row['报名ID'] || row['applicationId']
      const subjectId = row['科目ID'] || row['subjectId']
      const candidateName = row['姓名'] || row['candidateName']
      const subjectName = row['科目名称'] || row['subjectName']
      const scoreStr = row['分数'] || row['score']
      const remarks = row['备注'] || row['remarks']

      // 验证必填字段
      if (!applicationId) {
        errors.push({ row: rowNumber, field: '报名ID', message: '报名ID不能为空' })
      }
      if (!subjectId) {
        errors.push({ row: rowNumber, field: '科目ID', message: '科目ID不能为空' })
      }

      const score = scoreStr !== undefined && scoreStr !== '' ? parseFloat(scoreStr) : null

      // 验证分数范围
      if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
        errors.push({ row: rowNumber, field: '分数', message: '分数必须在0-100之间' })
      }

      records.push({
        row: rowNumber,
        applicationId: applicationId || '',
        candidateName: candidateName || '未知',
        subjectId: subjectId || '',
        subjectName: subjectName || '未知',
        score,
        remarks: remarks || '',
        status: 'pending',
      })
    })

    setImportRecords(records)
    setValidationErrors(errors)

    if (errors.length > 0) {
      toast.error(`解析完成，但发现 ${errors.length} 个错误`)
    } else {
      toast.success(`解析完成，共 ${records.length} 条记录待导入`)
    }
  }

  // 批量导入 Hook
  const batchImportMutation = useBatchImportScores()

  // 开始导入
  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast.error('请先修正表格中的错误')
      return
    }

    if (importRecords.length === 0) {
      toast.error('没有可导入的记录')
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    const payload = {
      examId: resolvedParams.examId,
      scores: importRecords.map(r => ({
        applicationId: r.applicationId,
        subjectId: r.subjectId,
        score: r.score,
        remarks: r.remarks
      }))
    }

    batchImportMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success(`成功导入 ${data.success} 条成绩`)
        if (data.failed > 0) {
          toast.warning(`${data.failed} 条记录导入失败`)
        }
        
        setImportRecords(prev => prev.map(r => ({ ...r, status: 'success' })))
        setIsImporting(false)
        setImportProgress(100)
        queryClient.invalidateQueries({ queryKey: ['scores'] })
      },
      onError: (error: any) => {
        toast.error(`导入失败: ${error.message || '网络错误'}`)
        setIsImporting(false)
        setImportProgress(0)
      }
    })
  }

  // 清除数据
  const handleClear = () => {
    setFile(null)
    setImportRecords([])
    setValidationErrors([])
    setImportProgress(0)
    setIsImporting(false)
  }

  if (examLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">批量导入成绩</h1>
            <p className="text-sm text-muted-foreground">{exam?.title} (ID: {resolvedParams.examId})</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="border-primary text-primary hover:bg-primary/5">
          <Download className="h-4 w-4 mr-2" />
          下载精准匹配模板
        </Button>
      </div>

      {/* 导入说明 */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            重要说明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>1. 请务必点击右上角<b>“下载精准匹配模板”</b>，系统会自动导出当前考试所有考生的唯一标识码。</p>
          <p>2. 请勿修改模板中的“报名ID”和“科目ID”列，否则系统将无法正确匹配考生。</p>
          <p>3. 导入时系统会自动验证分数格式。完成后请前往成绩大盘查看分析统计。</p>
        </CardContent>
      </Card>

      {/* 文件上传 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isImporting}
            />
            <label htmlFor="file-upload">
              <Button variant="default" asChild disabled={isImporting}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? '更换文件' : '选择 CSV 文件'}
                </span>
              </Button>
            </label>
            {file && (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={handleClear} disabled={isImporting}>
                  清除
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            表格中发现 {validationErrors.length} 处格式错误，请在下方预览表格中查看红色高亮部分并修正。
          </AlertDescription>
        </Alert>
      )}

      {/* 进度条 */}
      {isImporting && (
        <div className="space-y-2">
          <Progress value={importProgress} />
          <p className="text-center text-sm text-muted-foreground">正在提交数据，请勿刷新页面...</p>
        </div>
      )}

      {/* 数据预览 */}
      {importRecords.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>导入数据预览</CardTitle>
              <CardDescription>
                共解析 {importRecords.length} 行数据，
                其中 <span className="text-red-500">{validationErrors.length}</span> 行存在问题
              </CardDescription>
            </div>
            <Button 
              size="lg"
              disabled={validationErrors.length > 0 || isImporting}
              onClick={handleImport}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              确认并开始导入
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>行号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>科目名称</TableHead>
                    <TableHead>分数</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRecords.map((record) => {
                    const rowErrors = validationErrors.filter(e => e.row === record.row)
                    const isRowError = rowErrors.length > 0
                    
                    return (
                      <TableRow key={record.row} className={isRowError ? 'bg-red-50' : ''}>
                        <TableCell>{record.row}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.candidateName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">ID: {record.applicationId}</div>
                        </TableCell>
                        <TableCell>{record.subjectName}</TableCell>
                        <TableCell className={rowErrors.some(e => e.field === '分数') ? 'text-red-600 font-bold' : ''}>
                          {record.score ?? '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.remarks || '-'}</TableCell>
                        <TableCell>
                          {isRowError ? (
                            <Badge variant="destructive">格式错误</Badge>
                          ) : record.status === 'success' ? (
                            <Badge className="bg-green-600">已导入</Badge>
                          ) : (
                            <Badge variant="outline">等待中</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

