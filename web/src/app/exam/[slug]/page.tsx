import { redirect } from 'next/navigation'

export default function LegacyPublicExamPage() {
  redirect('/exams')
}
