'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartsContainerProps {
  statistics: {
    scoreDistribution: { range: string; count: number }[]
    subjectStatistics: { subjectName: string; averageScore: number; maxScore: number; minScore: number }[]
    positionStatistics: { positionTitle: string; candidateCount: number; averageScore: number; passRate: number }[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ChartsContainer({ statistics }: ChartsContainerProps) {
  return (
    <>
      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>成绩分布</CardTitle>
          <CardDescription>各分数段考生人数分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statistics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="人数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>科目统计</CardTitle>
          <CardDescription>各科目成绩统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statistics.subjectStatistics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subjectName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#82ca9d" name="平均分" />
                <Bar dataKey="maxScore" fill="#8884d8" name="最高分" />
                <Bar dataKey="minScore" fill="#ffc658" name="最低分" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Position Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>岗位统计 - 平均分</CardTitle>
            <CardDescription>各岗位平均分对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.positionStatistics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="positionTitle" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" fill="#8884d8" name="平均分" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>岗位统计 - 及格率</CardTitle>
            <CardDescription>各岗位及格率对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.positionStatistics}
                    dataKey="passRate"
                    nameKey="positionTitle"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.positionTitle}: ${(entry.passRate * 100).toFixed(1)}%`}
                  >
                    {statistics.positionStatistics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
