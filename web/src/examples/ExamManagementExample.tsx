/**
 * Example: Exam Management Component
 * 
 * This example demonstrates the complete usage of the unified permission model
 * and type-safe API client in a real-world component.
 * 
 * Features demonstrated:
 * - Permission-aware queries and mutations
 * - Type-safe API calls
 * - Permission guards for UI elements
 * - Error handling
 * - React Query integration
 */

'use client';

import { useState } from 'react';
import {
    usePermissionQuery,
    usePermissionMutation,
    PermissionGuard,
    PermissionCodes,
    getApiErrorMessage,
    isPermissionError,
} from '@/lib/api-client-enhanced';
import { apiClient } from '@/lib/api/client-generated';
import { toast } from 'sonner';

interface Exam {
    id: string;
    title: string;
    registrationStart: string;
    registrationEnd: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
}

interface ExamCreateRequest {
    title: string;
    code: string;
    registrationStart: string;
    registrationEnd: string;
}

export default function ExamManagementExample() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // ============================================================
    // QUERY: Fetch exams with permission check
    // ============================================================
    const {
        data: examsData,
        error: examsError,
        isLoading: examsLoading,
        refetch: refetchExams,
    } = usePermissionQuery(
        ['exams'],
        async () => {
            const response = await apiClient.GET('/exams');

            if (response.error) {
                throw response.error;
            }

            return response.data;
        },
        {
            // Only users with EXAM_VIEW permission can fetch exams
            requiredPermissions: [PermissionCodes.EXAM_VIEW],
            // React Query options
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
        }
    );

    // ============================================================
    // MUTATION: Create exam with permission check
    // ============================================================
    const createExamMutation = usePermissionMutation(
        async (data: ExamCreateRequest) => {
            const response = await apiClient.POST('/exams', {
                params: {
                    query: {
                        userId: '123' // Mock userId for example
                    }
                },
                body: data,
            });

            if (response.error) {
                throw response.error;
            }

            return response.data;
        },
        {
            // Only users with EXAM_CREATE permission can create exams
            requiredPermissions: [PermissionCodes.EXAM_CREATE],
            // React Query mutation options
            onSuccess: () => {
                toast.success('Exam created successfully');
                setIsCreateDialogOpen(false);
                refetchExams(); // Refresh the list
            },
            onError: (error) => {
                if (isPermissionError(error)) {
                    toast.error('You do not have permission to create exams');
                } else {
                    toast.error(getApiErrorMessage(error));
                }
            },
        }
    );

    // ============================================================
    // MUTATION: Delete exam with permission check
    // ============================================================
    const deleteExamMutation = usePermissionMutation(
        async (examId: string) => {
            const response = await apiClient.DELETE('/exams/{id}', {
                params: {
                    path: { id: examId },
                },
            });

            if (response.error) {
                throw response.error;
            }

            return response.data;
        },
        {
            // Only users with EXAM_DELETE permission can delete exams
            requiredPermissions: [PermissionCodes.EXAM_DELETE],
            onSuccess: () => {
                toast.success('Exam deleted successfully');
                refetchExams();
            },
            onError: (error) => {
                if (isPermissionError(error)) {
                    toast.error('You do not have permission to delete exams');
                } else {
                    toast.error(getApiErrorMessage(error));
                }
            },
        }
    );

    // ============================================================
    // MUTATION: Publish exam with permission check
    // ============================================================
    const publishExamMutation = usePermissionMutation(
        async (examId: string) => {
            const response = await apiClient.POST('/exams/{id}/publish' as any, {
                params: {
                    path: { id: examId },
                } as any,
            });

            if (response.error) {
                throw response.error;
            }

            return response.data;
        },
        {
            // Only users with EXAM_PUBLISH permission can publish exams
            requiredPermissions: [PermissionCodes.EXAM_PUBLISH],
            onSuccess: () => {
                toast.success('Exam published successfully');
                refetchExams();
            },
            onError: (error) => {
                toast.error(getApiErrorMessage(error));
            },
        }
    );

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleCreateExam = (data: ExamCreateRequest) => {
        createExamMutation.mutate(data);
    };

    const handleDeleteExam = (examId: string) => {
        if (confirm('Are you sure you want to delete this exam?')) {
            deleteExamMutation.mutate(examId);
        }
    };

    const handlePublishExam = (examId: string) => {
        publishExamMutation.mutate(examId);
    };

    // ============================================================
    // RENDER
    // ============================================================
    if (examsLoading) {
        return <div className="p-4">Loading exams...</div>;
    }

    if (examsError) {
        if (isPermissionError(examsError)) {
            return (
                <div className="p-4 text-red-600">
                    You do not have permission to view exams.
                </div>
            );
        }

        return (
            <div className="p-4 text-red-600">
                Error loading exams: {getApiErrorMessage(examsError)}
            </div>
        );
    }

    const exams = (examsData as any) || [];

    return (
        <div className="p-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Exam Management</h1>

                {/* Only show Create button if user has permission */}
                <PermissionGuard
                    requiredPermissions={[PermissionCodes.EXAM_CREATE]}
                >
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={createExamMutation.isPending}
                    >
                        {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                    </button>
                </PermissionGuard>
            </div>

            {/* Exam List */}
            <div className="space-y-4">
                {exams.length === 0 ? (
                    <div className="text-gray-500">No exams found</div>
                ) : (
                    exams.map((exam: Exam) => (
                        <div
                            key={exam.id}
                            className="border rounded-lg p-4 flex justify-between items-center"
                        >
                            <div>
                                <h3 className="font-semibold">{exam.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {exam.registrationStart} - {exam.registrationEnd}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${exam.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                    exam.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {exam.status}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {/* Edit Button - requires EXAM_EDIT permission */}
                                <PermissionGuard
                                    requiredPermissions={[PermissionCodes.EXAM_EDIT]}
                                >
                                    <button
                                        onClick={() => {/* Navigate to edit page */ }}
                                        className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                                    >
                                        Edit
                                    </button>
                                </PermissionGuard>

                                {/* Publish Button - requires EXAM_PUBLISH permission */}
                                {exam.status === 'DRAFT' && (
                                    <PermissionGuard
                                        requiredPermissions={[PermissionCodes.EXAM_PUBLISH]}
                                    >
                                        <button
                                            onClick={() => handlePublishExam(exam.id)}
                                            disabled={publishExamMutation.isPending}
                                            className="px-3 py-1 text-green-600 border border-green-600 rounded hover:bg-green-50"
                                        >
                                            {publishExamMutation.isPending ? 'Publishing...' : 'Publish'}
                                        </button>
                                    </PermissionGuard>
                                )}

                                {/* Delete Button - requires EXAM_DELETE permission */}
                                <PermissionGuard
                                    requiredPermissions={[PermissionCodes.EXAM_DELETE]}
                                >
                                    <button
                                        onClick={() => handleDeleteExam(exam.id)}
                                        disabled={deleteExamMutation.isPending}
                                        className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                                    >
                                        {deleteExamMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Exam Dialog (simplified) */}
            {isCreateDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Create New Exam</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleCreateExam({
                                    title: formData.get('title') as string,
                                    code: 'EXAM-' + Date.now(), // Generate a mock code
                                    registrationStart: formData.get('registrationStart') as string,
                                    registrationEnd: formData.get('registrationEnd') as string,
                                });
                            }}
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Exam Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Registration Start
                                    </label>
                                    <input
                                        type="date"
                                        name="registrationStart"
                                        required
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Registration End
                                    </label>
                                    <input
                                        type="date"
                                        name="registrationEnd"
                                        required
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="submit"
                                    disabled={createExamMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {createExamMutation.isPending ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
