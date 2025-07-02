"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, FileSpreadsheet, Calendar, AlertCircle, Loader2, Search, Eye } from "lucide-react"
import { RequireAuth } from "@/components/auth-guard"

function HistoryPage() {
  const router = useRouter()
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchHistory()
  }, [currentPage, searchTerm])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/uploads?${params}`)

      if (!response.ok) {
        throw new Error('履歴データの取得に失敗しました')
      }

      const result = await response.json()
      setHistoryData(result.uploads || [])
      setTotalPages(result.pagination?.totalPages || 1)

    } catch (error) {
      console.error('History fetch error:', error)
      setError(error instanceof Error ? error.message : '履歴データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id)

      const response = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('データの削除に失敗しました')
      }

      // 一覧を再取得
      await fetchHistory()

    } catch (error) {
      console.error('Delete error:', error)
      setError(error instanceof Error ? error.message : 'データの削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const handleViewAnalysis = (id: number) => {
    router.push(`/analysis?id=${id}`)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const filteredData = historyData.filter(item =>
    item.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.year?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>履歴データを読み込み中...</span>
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
          <h1 className="text-3xl font-bold tracking-tight">アップロード履歴</h1>
          <p className="text-muted-foreground">過去にアップロードした従業員満足度調査データの履歴を管理できます</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ファイル名や年度で検索..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* 履歴テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>アップロード履歴</CardTitle>
          <CardDescription>過去にアップロードしたExcelファイルの履歴</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[300px]">ファイル名</TableHead>
                  <TableHead className="w-[180px]">アップロード日時</TableHead>
                  <TableHead className="w-[120px]">年度</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      アップロード履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">#{item.id}</TableCell>
                      <TableCell className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{item.file_name}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.upload_date ? new Date(item.upload_date).toLocaleString('ja-JP') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{item.year}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAnalysis(item.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={deleting === item.id}
                              >
                                {deleting === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>データを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{item.fileName}」を削除します。この操作は取り消せません。
                                  削除すると、このデータに基づく分析結果も利用できなくなります。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  削除する
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <RequireAuth>
      <HistoryPage />
    </RequireAuth>
  )
}
