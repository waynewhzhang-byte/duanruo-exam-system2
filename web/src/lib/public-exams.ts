export function buildPublicExamPath(
  tenantCode?: string | null,
  examCode?: string | null,
): string {
  if (!tenantCode || !examCode) {
    return '/exams'
  }

  return `/exam/${encodeURIComponent(tenantCode)}/${encodeURIComponent(examCode)}`
}

export function buildPublicExamRegisterPath(
  tenantCode?: string | null,
  examCode?: string | null,
): string {
  return `${buildPublicExamPath(tenantCode, examCode)}/register`
}
