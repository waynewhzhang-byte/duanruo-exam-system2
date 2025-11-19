'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface SeatAssignment {
  id: string
  applicationId: string
  candidateName: string
  positionTitle: string
  venueName: string
  seatNumber: number
}

interface SeatAssignmentExportProps {
  examId: string
  assignments: SeatAssignment[]
}

export default function SeatAssignmentExport({ examId, assignments }: SeatAssignmentExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    try {
      setIsExporting(true)

      // 准备CSV数据
      const csvData = assignments.map((assignment, index) => ({
        序号: index + 1,
        考生姓名: assignment.candidateName,
        报考岗位: assignment.positionTitle,
        考场: assignment.venueName,
        座位号: assignment.seatNumber,
      }))

      // 使用 papaparse 生成CSV
      const csv = Papa.unparse(csvData, {
        quotes: true,
        delimiter: ',',
        header: true,
      })

      // 添加BOM以支持Excel正确显示中文
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })

      // 下载文件
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `座位分配表_${examId}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('CSV文件导出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    try {
      setIsExporting(true)

      // 准备Excel数据（使用HTML table格式）
      const tableData = assignments.map((assignment, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${assignment.candidateName}</td>
          <td>${assignment.positionTitle}</td>
          <td>${assignment.venueName}</td>
          <td>${assignment.seatNumber}</td>
        </tr>
      `).join('')

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>考生姓名</th>
                <th>报考岗位</th>
                <th>考场</th>
                <th>座位号</th>
              </tr>
            </thead>
            <tbody>
              ${tableData}
            </tbody>
          </table>
        </body>
        </html>
      `

      // 创建Blob并下载
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `座位分配表_${examId}_${new Date().toISOString().split('T')[0]}.xls`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Excel文件导出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const exportByVenue = () => {
    try {
      setIsExporting(true)

      // 按考场分组
      const venueGroups = assignments.reduce((groups, assignment) => {
        const venue = assignment.venueName
        if (!groups[venue]) {
          groups[venue] = []
        }
        groups[venue].push(assignment)
        return groups
      }, {} as Record<string, SeatAssignment[]>)

      // 为每个考场生成CSV
      Object.entries(venueGroups).forEach(([venueName, venueAssignments]) => {
        const csvData = venueAssignments.map((assignment, index) => ({
          序号: index + 1,
          考生姓名: assignment.candidateName,
          报考岗位: assignment.positionTitle,
          座位号: assignment.seatNumber,
        }))

        const csv = Papa.unparse(csvData, {
          quotes: true,
          delimiter: ',',
          header: true,
        })

        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${venueName}_座位分配表_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })

      toast.success(`已导出 ${Object.keys(venueGroups).length} 个考场的座位分配表`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  if (!assignments || assignments.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>导出座位分配表</CardTitle>
        <CardDescription>将座位分配结果导出为文件</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={isExporting}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            导出为 CSV
          </Button>

          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={isExporting}
            className="w-full"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            导出为 Excel
          </Button>

          <Button
            variant="outline"
            onClick={exportByVenue}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            按考场导出
          </Button>
        </div>

        <div className="mt-4 bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">💡 导出说明</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>CSV格式：适合在Excel中打开，支持中文</li>
            <li>Excel格式：直接生成Excel文件，包含表格样式</li>
            <li>按考场导出：为每个考场生成单独的CSV文件</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

