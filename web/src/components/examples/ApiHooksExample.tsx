/**
 * Example component demonstrating the usage of typed API hooks
 * This component shows how to use the new API client with zod validation
 */

'use client'

import { useState } from 'react'
import {
  useMyApplications,
  useApplication,
  useSubmitApplication,
  useMyFiles,
  useUploadFile,
  useExams,
  useLogin,
  useProfile
} from '@/lib/api-hooks'
import { useErrorHandler, useAsyncOperation } from '@/hooks/useErrorHandler'
import { ApplicationSubmitRequest, FileUploadUrlRequest } from '@/lib/schemas'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading'

export default function ApiHooksExample() {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('')
  const errorHandler = useErrorHandler()
  
  // Example: Fetch applications with pagination
  const {
    data: applications,
    isLoading: applicationsLoading,
    error: applicationsError
  } = useMyApplications({
    page: 0,
    size: 10,
    status: 'SUBMITTED'
  })

  // Example: Fetch single application
  const {
    data: application,
    isLoading: applicationLoading
  } = useApplication(selectedApplicationId)

  // Example: Submit application mutation
  const submitApplicationMutation = useSubmitApplication()

  // Example: File operations
  const {
    data: myFiles,
    isLoading: filesLoading
  } = useMyFiles({ page: 0, size: 20 })

  const uploadFileMutation = useUploadFile()

  // Example: Exam data
  const {
    data: exams,
    isLoading: examsLoading
  } = useExams({ status: 'REGISTRATION_OPEN' })

  // Example: Reviews (for reviewers) - commented out as it requires examId
  // const {
  //   data: pendingReviews,
  //   isLoading: reviewsLoading
  // } = useReviewQueue({ examId: 'some-exam-id', stage: 'PRIMARY' })

  // Example: User profile
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile()

  // Example: Login mutation
  const loginMutation = useLogin()

  // Example: Async operation with error handling
  const asyncOperation = useAsyncOperation()

  // Example handlers
  const handleSubmitApplication = async () => {
    const applicationData: ApplicationSubmitRequest = {
      examId: 'exam-uuid',
      positionId: 'position-uuid',
      formVersion: 1,
      payload: {
        fullName: '张三',
        email: 'zhangsan@example.com',
      },
      attachments: []
    }

    try {
      const result = await submitApplicationMutation.mutateAsync(applicationData)
      console.log('Application submitted:', result)
    } catch (error) {
      errorHandler.handleError(error)
    }
  }

  const handleFileUpload = async (file: File) => {
    const uploadRequest: FileUploadUrlRequest = {
      fileName: file.name,
      contentType: file.type,
      fieldKey: 'resume'
    }

    try {
      const result = await uploadFileMutation.mutateAsync({
        uploadRequest,
        file
      })
      console.log('File uploaded:', result)
    } catch (error) {
      errorHandler.handleError(error)
    }
  }

  const handleLogin = async () => {
    try {
      const result = await loginMutation.mutateAsync({
        username: 'testuser',
        password: 'password123'
      })
      console.log('Login successful:', result)
    } catch (error) {
      errorHandler.handleError(error)
    }
  }

  const handleAsyncOperation = async () => {
    await asyncOperation.execute(async () => {
      // Simulate an async operation
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { message: 'Operation completed successfully' }
    }, {
      retry: true,
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.error('Error:', error)
    })
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">API Hooks Example</h1>

      {/* Error Display */}
      {errorHandler.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">
                  {errorHandler.notification?.title}
                </h3>
                <p className="text-red-600">
                  {errorHandler.notification?.message}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={errorHandler.clearError}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Section */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applicationsLoading ? (
            <Spinner />
          ) : applications ? (
            <div className="space-y-2">
              <p>Total: {applications.totalElements} applications</p>
              {applications.content.map((app) => (
                <div
                  key={app.id}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedApplicationId(app.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedApplicationId(app.id); } }}
                  aria-label={`Application ${app.id}`}
                >
                  <p className="font-medium">Application {app.id}</p>
                  <p className="text-sm text-gray-600">Status: {app.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No applications found</p>
          )}
          
          <div className="mt-4">
            <Button
              onClick={handleSubmitApplication}
              disabled={submitApplicationMutation.isPending}
            >
              {submitApplicationMutation.isPending ? 'Submitting...' : 'Submit Test Application'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Application Details */}
      {selectedApplicationId && (
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationLoading ? (
              <Spinner />
            ) : application ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {application.id}</p>
                <p><strong>Status:</strong> {application.status}</p>
                <p><strong>Form Version:</strong> {application.formVersion}</p>
                <p><strong>Submitted:</strong> {application.submittedAt || 'Not submitted'}</p>
                <div>
                  <strong>Payload:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify(application.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p>Application not found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Files Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Files</CardTitle>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <Spinner />
          ) : myFiles ? (
            <div className="space-y-2">
              <p>Total: {myFiles.totalElements} files</p>
              {myFiles.content.map((file: any) => (
                <div key={file.fileId} className="p-2 border rounded">
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-sm text-gray-600">
                    Status: {file.status} | Size: {file.fileSize} bytes
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No files found</p>
          )}
          
          <div className="mt-4">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="mb-2"
            />
            {uploadFileMutation.isPending && <p>Uploading...</p>}
          </div>
        </CardContent>
      </Card>

      {/* Exams Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {examsLoading ? (
            <Spinner />
          ) : exams ? (
            <div className="space-y-2">
              {exams.content.map((exam: any) => (
                <div key={exam.id} className="p-2 border rounded">
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-gray-600">
                    Code: {exam.code} | Status: {exam.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No exams found</p>
          )}
        </CardContent>
      </Card>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <Spinner />
          ) : profile ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {profile.fullName}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Roles:</strong> {profile.roles.join(', ')}</p>
            </div>
          ) : (
            <div>
              <p>Not logged in</p>
              <Button onClick={handleLogin} disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Logging in...' : 'Test Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Async Operation Example */}
      <Card>
        <CardHeader>
          <CardTitle>Async Operation with Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAsyncOperation}
            disabled={asyncOperation.isLoading}
          >
            {asyncOperation.isLoading ? 'Processing...' : 'Run Async Operation'}
          </Button>
          
          {asyncOperation.data && (
            <div className="mt-2 p-2 bg-green-100 rounded">
              <p>Result: {JSON.stringify(asyncOperation.data)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

