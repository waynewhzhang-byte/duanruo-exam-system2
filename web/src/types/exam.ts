export interface Exam {
    id: string
    title: string
    code: string
    status: string
    description?: string
    registrationStart?: string
    registrationEnd?: string
    examDate?: string
    feeRequired: boolean
    feeAmount?: number
}

export interface Position {
    id: string
    examId: string
    code: string
    title: string
    description?: string
    requirements?: string
    quota?: number
    seatRuleId?: string
}

export interface Subject {
    id: string
    positionId: string
    name: string
    durationMinutes: number
    type: 'WRITTEN' | 'INTERVIEW' | 'OTHER'
    maxScore?: number
    passingScore?: number
    weight?: number
    ordering?: number
    schedule?: string
}

export interface SubjectCreateRequest {
    name: string
    durationMinutes: number
    type: string
    maxScore?: number
    passingScore?: number
    weight?: number
    ordering?: number
    schedule?: string
}

export interface SubjectUpdateRequest {
    name?: string
    durationMinutes?: number
    type?: string
    maxScore?: number
    passingScore?: number
    weight?: number
    ordering?: number
    schedule?: string
}
