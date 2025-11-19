'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { useBatchRecordScore } from '@/lib/api-hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface ImportPageProps {
  params: Promise<{
    tenantSlug: string
    examId: string
  }>
}

interface Exam {
  id: string
  title: string
  status: string
}

interface ImportRecord {
  row: number
  candidateName: string
  ticketNo: string
  subjectName: string
  score: number | null
  isAbsent: boolean
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
  const resolvedParams = use(params)
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

  // 下载模板
  const handleDownloadTemplate = () => {
    const template = [
      ['准考证号', '考生姓名', '科目名称', '分数', '是否缺考', '备注'],
      ['2025-EXAM-001-0001', '张三', '数学', '85', '否', ''],
      ['2025-EXAM-001-0002', '李四', '数学', '', '是', '考生缺考'],
      ['2025-EXAM-001-0003', '王五', '英语', '90', '否', ''],
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `成绩导入模板_${exam?.title || '考试'}.csv`
    link.click()
    toast.success('模板下载成功')
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // 验证文件类型
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (!validTypes.includes(fileExtension)) {
      toast.error('请上传CSV或Excel文件')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  // 解析文件
  const parseFile = (file: File) => {
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (fileExtension === '.csv') {
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
    } else {
      // Excel文件需要使用xlsx库，这里简化处理
      toast.error('暂不支持Excel文件，请使用CSV格式')
    }
  }

  // 处理数据
  const processData = (data: any[]) => {
    const records: ImportRecord[] = []
    const errors: ValidationError[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // Excel行号从2开始（第1行是表头）

      // 验证必填字段
      if (!row['准考证号']) {
        errors.push({ row: rowNumber, field: '准考证号', message: '准考证号不能为空' })
      }
      if (!row['考生姓名']) {
        errors.push({ row: rowNumber, field: '考生姓名', message: '考生姓名不能为空' })
      }
      if (!row['科目名称']) {
        errors.push({ row: rowNumber, field: '科目名称', message: '科目名称不能为空' })
      }

      const isAbsent = row['是否缺考'] === '是' || row['是否缺考'] === 'true' || row['是否缺考'] === '1'
      const score = row['分数'] ? parseFloat(row['分数']) : null

      // 验证分数
      if (!isAbsent && (score === null || isNaN(score))) {
        errors.push({ row: rowNumber, field: '分数', message: '非缺考考生必须填写分数' })
      }
      if (score !== null && (score < 0 || score > 100)) {
        errors.push({ row: rowNumber, field: '分数', message: '分数必须在0-100之间' })
      }

      records.push({
        row: rowNumber,
        candidateName: row['考生姓名'] || '',
        ticketNo: row['准考证号'] || '',
        subjectName: row['科目名称'] || '',
        score: score,
        isAbsent: isAbsent,
        remarks: row['备注'] || '',
        status: 'pending',
      })
    })

    setImportRecords(records)
    setValidationErrors(errors)

    if (errors.length > 0) {
      toast.error(`发现 ${errors.length} 个验证错误，请修正后重新上传`)
    } else {
      toast.success(`成功解析 ${records.length} 条记录，可以开始导入`)
    }
  }

  // 批量导入
  const batchImportMutation = useBatchRecordScore()

  // 开始导入
  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast.error('请先修正验证错误')
      return
    }

    if (importRecords.length === 0) {
      toast.error('没有可导入的记录')
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    // 准备导入数据
    const importData = importRecords.map((record) => ({
      ticketNo: record.ticketNo,
      subjectName: record.subjectName,
      score: record.score,
      isAbsent: record.isAbsent,
      remarks: record.remarks,
    }))

    // 模拟进度
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    batchImportMutation.mutate(importData, {
      onSuccess: (data) => {
        clearInterval(progressInterval)
        toast.success(`成功导入 ${data.successCount} 条成绩`)
        if (data.failCount > 0) {
          toast.warning(`${data.failCount} 条记录导入失败`)
        }
        queryClient.invalidateQueries({ queryKey: ['scores', resolvedParams.examId] })
        
        // 更新记录状态 - 根据后端返回的错误信息更新
        if (data.errors && data.errors.length > 0) {
          const errorRows = new Set(data.errors.map(e => e.row))
          setImportRecords((prev) =>
            prev.map((record) => ({
              ...record,
              status: errorRows.has(record.row) ? 'error' : 'success',
              error: data.errors?.find(e => e.row === record.row)?.message,
            }))
          )
        } else {
          // 如果没有错误信息，假设前successCount条成功
          setImportRecords((prev) =>
            prev.map((record, index) => ({
              ...record,
              status: index < data.successCount ? 'success' : 'error',
              error: index >= data.successCount ? '导入失败' : undefined,
            }))
          )
        }
        setIsImporting(false)
        setImportProgress(100)
      },
      onError: (error: any) => {
        clearInterval(progressInterval)
        toast.error(`批量导入失败: ${error.message || '未知错误'}`)
        setIsImporting(false)
        setImportProgress(0)
      },
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
        <Spinner size="lg" />
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
            <p className="text-sm text-muted-foreground">{exam?.title}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          下载模板
        </Button>
      </div>

      {/* 导入步骤说明 */}
      <Card>
        <CardHeader>
          <CardTitle>导入步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>点击"下载模板"按钮，下载CSV模板文件</li>
            <li>在模板中填写成绩数据（准考证号、考生姓名、科目名称、分数、是否缺考、备注）</li>
            <li>保存为CSV格式（UTF-8编码）</li>
            <li>点击"选择文件"上传填好的CSV文件</li>
            <li>系统会自动验证数据，检查是否有错误</li>
            <li>确认无误后，点击"开始导入"按钮</li>
          </ol>
        </CardContent>
      </Card>

      {/* 文件上传 */}
      <Card>
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
          <CardDescription>支持CSV格式，文件大小不超过10MB</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Button variant="outline" asChild disabled={isImporting}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  选择文件
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

      {/* 验证错误 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">发现 {validationErrors.length} 个验证错误：</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.slice(0, 10).map((error, index) => (
                <li key={index}>
                  第 {error.row} 行，{error.field}：{error.message}
                </li>
              ))}
              {validationErrors.length > 10 && (
                <li className="text-muted-foreground">还有 {validationErrors.length - 10} 个错误...</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 导入进度 */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>导入进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">{importProgress}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 数据预览 */}
      {importRecords.length > 0 && !isImporting && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>数据预览</CardTitle>
                <CardDescription>共 {importRecords.length} 条记录</CardDescription>
              </div>
              <Button
                onClick={handleImport}
                disabled={validationErrors.length > 0 || isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                开始导入
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>行号</TableHead>
                    <TableHead>准考证号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>科目</TableHead>
                    <TableHead>分数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRecords.map((record) => {
                    const hasError = validationErrors.some(e => e.row === record.row)
                    return (
                      <TableRow 
                        key={record.row}
                        className={hasError ? 'bg-red-50' : record.status === 'error' ? 'bg-red-50' : record.status === 'success' ? 'bg-green-50' : ''}
                      >
                        <TableCell>{record.row}</TableCell>
                        <TableCell className="font-mono">{record.ticketNo}</TableCell>
                        <TableCell>{record.candidateName}</TableCell>
                        <TableCell>{record.subjectName}</TableCell>
                        <TableCell>
                          {record.isAbsent ? (
                            <Badge variant="secondary">缺考</Badge>
                          ) : (
                            <span className="font-mono">{record.score ?? '-'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === 'success' && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              成功
                            </Badge>
                          )}
                          {record.status === 'error' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              失败
                            </Badge>
                          )}
                          {record.status === 'pending' && (
                            hasError ? (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                错误
                              </Badge>
                            ) : (
                              <Badge variant="outline">待导入</Badge>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {hasError && (
                            <div className="text-red-600">
                              {validationErrors.filter(e => e.row === record.row).map((e, idx) => (
                                <div key={idx}>{e.field}: {e.message}</div>
                              ))}
                            </div>
                          )}
                          {record.error && (
                            <div className="text-red-600">{record.error}</div>
                          )}
                          {!hasError && !record.error && record.remarks && (
                            <span className="text-muted-foreground">{record.remarks}</span>
                          )}
                          {!hasError && !record.error && !record.remarks && (
                            <span className="text-muted-foreground">-</span>
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

