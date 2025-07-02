import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
      <Suspense fallback={<div>読み込み中...</div>}>
        <ResetPasswordForm />
      </Suspense>
  )
}
