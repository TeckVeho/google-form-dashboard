"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart3, Upload, FileText, Home, Users, LogOut, User, Settings } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut, loading, isAdmin } = useAuth()

  // 認証ページでは表示しない
  if (pathname.startsWith('/auth') || pathname === '/unauthorized') {
    return null
  }

  // ナビゲーションアイテムを更新
  const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/analysis", label: "分析", icon: BarChart3, key: "analysis" },
    { href: "/history", label: "履歴", icon: FileText },
    ...(isAdmin ? [{ href: "/users", label: "ユーザー管理", icon: Users }] : []),
  ]

  const handleSignOut = async () => {
    localStorage.removeItem("analysisId")
    await signOut()
    window.location.href = '/auth/signin'
  }

  const getUserInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">フォーム結果ダッシュボード</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon

                if (item.key === "analysis") {
                  return (
                      <button
                          key={item.href}
                          onClick={() => {
                            const analysisId = localStorage.getItem("analysisId")
                            const target = analysisId ? `/analysis?id=${analysisId}` : "/analysis"
                            window.location.href = target
                          }}
                          className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                              pathname.startsWith("/analysis") ? "text-primary" : "text-muted-foreground"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user && !loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {profile?.name || 'ユーザー'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {profile?.role && (
                      <p className="text-xs leading-none text-muted-foreground">
                        権限: {profile.role === 'admin' ? '管理者' : '一般ユーザー'}
                      </p>
                    )}
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      プロファイル
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      設定
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!user && !loading && (
              <Button asChild>
                <Link href="/auth/signin">ログイン</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
