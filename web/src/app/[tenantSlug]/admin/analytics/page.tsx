"use client"

import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api-hooks"
import { TenantStatistics, RecentExam } from "@/types/statistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"
import { Loader2, Users, FileText, CheckCircle, DollarSign } from "lucide-react"

export default function AnalyticsPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["tenant-statistics"],
        queryFn: () => apiGet<TenantStatistics>("/statistics/tenant/me"),
    })

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!stats) {
        return <div>Failed to load statistics</div>
    }

    const applicationData = [
        { name: "Approved", value: stats.approvedApplications },
        { name: "Rejected", value: stats.rejectedApplications },
        { name: "Pending", value: stats.totalApplications - stats.approvedApplications - stats.rejectedApplications },
    ]

    const COLORS = ["#10b981", "#ef4444", "#f59e0b"]

    return (
        <div className="space-y-8 p-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your exam management and performance.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExams}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeExams} active, {stats.completedExams} completed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalApplications}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.paidApplications} paid
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeUsers} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            From {stats.paidApplications} paid applications
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Exams */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.recentExams.map((exam: RecentExam) => (
                                <div key={exam.examId} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{exam.examTitle}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Starts: {exam.startDate}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        {exam.applications} applicants
                                    </div>
                                </div>
                            ))}
                            {stats.recentExams.length === 0 && (
                                <div className="text-center text-muted-foreground">No recent exams</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Application Status Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Application Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={applicationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {applicationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
