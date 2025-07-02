'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordForm() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const { updatePassword } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        if (!accessToken || !refreshToken) {
            setError('無効なリセットリンクです。再度パスワードリセットを行ってください。')
        }
    }, [searchParams])

    const validateForm = () => {
        if (password !== confirmPassword) {
            setError('パスワードが一致しません')
            return false
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!validateForm()) return

        setLoading(true)
        try {
            const result = await updatePassword(password)
            if (result.success) {
                setSuccess(result.message || 'パスワードが更新されました')
                setTimeout(() => router.push('/'), 3000)
            } else {
                setError(result.error || 'パスワードの更新に失敗しました')
            }
        } catch (error) {
            setError('パスワード更新処理中にエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <CardTitle className="text-2xl font-bold text-green-700">更新完了</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Alert>
                            <AlertDescription className="text-green-700">{success}</AlertDescription>
                        </Alert>
                        <p className="mt-4 text-sm text-gray-600">3秒後にダッシュボードへ移動します...</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => router.push('/')} className="w-full">
                            ダッシュボードへ
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">新しいパスワード</CardTitle>
                    <CardDescription className="text-center">新しいパスワードを設定してください</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">新しいパスワード</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="6文字以上で入力"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">パスワード確認</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="パスワードを再入力"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading || !!error}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            パスワードを更新
                        </Button>

                        <Button variant="outline" asChild className="w-full">
                            <Link href="/auth/signin">ログインページに戻る</Link>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
