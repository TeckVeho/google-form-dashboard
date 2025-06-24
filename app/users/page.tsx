"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Shield, Building, AlertCircle, Loader2, Plus, UserPlus } from "lucide-react"
import { RequireAdmin } from "@/components/auth-guard"

function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // 新規ユーザー作成フォームの状態
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    company: '',
    role: 'user'
  })
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error('ユーザーデータの取得に失敗しました')
      }
      
      const result = await response.json()
      setUsers(result.data || [])
      
    } catch (error) {
      console.error('Users fetch error:', error)
      setError(error instanceof Error ? error.message : 'ユーザーデータの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }
  
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.includes(searchTerm)
    const matchesFilter = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesFilter
  })

  const handleCreateUser = async () => {
    try {
      setCreating(true)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      
      if (!response.ok) {
        throw new Error('ユーザーの作成に失敗しました')
      }
      
      setShowCreateDialog(false)
      setNewUser({ email: '', name: '', company: '', role: 'user' })
      await fetchUsers()
      
    } catch (error) {
      console.error('Create user error:', error)
      setError(error instanceof Error ? error.message : 'ユーザーの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }
  
  const handleEditUser = async () => {
    if (!editingUser) return
    
    try {
      setEditing(editingUser.id)
      
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingUser)
      })
      
      if (!response.ok) {
        throw new Error('ユーザーの更新に失敗しました')
      }
      
      setShowEditDialog(false)
      setEditingUser(null)
      await fetchUsers()
      
    } catch (error) {
      console.error('Edit user error:', error)
      setError(error instanceof Error ? error.message : 'ユーザーの更新に失敗しました')
    } finally {
      setEditing(null)
    }
  }
  
  const handleDeleteUser = async (id: number) => {
    try {
      setDeleting(id)
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('ユーザーの削除に失敗しました')
      }
      
      await fetchUsers()
      
    } catch (error) {
      console.error('Delete user error:', error)
      setError(error instanceof Error ? error.message : 'ユーザーの削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }
  
  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Admin</span>
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <Building className="h-3 w-3" />
        <span>ユーザー</span>
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default">アクティブ</Badge>
    }
    return <Badge variant="outline">非アクティブ</Badge>
  }
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>ユーザーデータを読み込み中...</span>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          <p className="text-muted-foreground">システムユーザーの管理と権限設定</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              ユーザー新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規ユーザー作成</DialogTitle>
              <DialogDescription>
                新しいユーザーをシステムに追加します。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="田中 太郎"
                />
              </div>
              <div>
                <Label htmlFor="company">会社名</Label>
                <Input
                  id="company"
                  value={newUser.company}
                  onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                  placeholder="ダイセーホールディングス"
                />
              </div>
              <div>
                <Label htmlFor="role">権限</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ユーザー</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    作成
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>検索・フィルター</span>
          </CardTitle>
          <CardDescription>ユーザーを検索したり、権限でフィルタリングできます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="氏名、メールアドレス、会社名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="権限で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">ユーザー</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{filteredUsers.length}人のユーザーが見つかりました</div>
        </CardContent>
      </Card>

      {/* ユーザーテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>システムに登録されているユーザーと権限情報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[120px]">氏名</TableHead>
                  <TableHead className="w-[200px]">メールアドレス</TableHead>
                  <TableHead className="w-[120px]">権限</TableHead>
                  <TableHead className="w-[150px]">所属会社</TableHead>
                  <TableHead className="w-[140px]">最終ログイン</TableHead>
                  <TableHead className="w-[100px]">ステータス</TableHead>
                  <TableHead className="w-[100px]">登録日</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">#{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm">{user.company}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ja-JP') : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleting === user.id}
                        >
                          {deleting === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* 編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー情報編集</DialogTitle>
            <DialogDescription>
              ユーザー情報を更新します。
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">氏名</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">会社名</Label>
                <Input
                  id="edit-company"
                  value={editingUser.company || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">権限</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ユーザー</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                />
                <Label htmlFor="edit-active">アクティブ</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditUser} disabled={editing === editingUser?.id}>
              {editing === editingUser?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Page() {
  return (
    <RequireAdmin>
      <UsersPage />
    </RequireAdmin>
  )
}
