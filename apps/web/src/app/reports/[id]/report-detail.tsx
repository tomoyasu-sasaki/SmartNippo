'use client';

import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
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
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
  Clock,
  Edit,
  MessageSquare,
  Send,
  Trash2,
  User,
  X as XIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReportDetailProps {
  reportId: Id<'reports'>;
}

function ReportDetailInner({ reportId }: ReportDetailProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch report detail
  const report = useQuery(api.reports.getReportDetail, { reportId });

  // Mutations
  const addComment = useMutation(api.reports.addComment);
  const approveReport = useMutation(api.reports.approveReport);
  const rejectReport = useMutation(api.reports.rejectReport);
  const deleteReport = useMutation(api.reports.deleteReport);
  const updateReport = useMutation(api.reports.updateReport);

  if (!report) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      const toastId = toast.loading('コメントを送信しています...');

      await addComment({
        reportId,
        content: newComment.trim(),
      });

      setNewComment('');
      toast.success('コメントを送信しました', {
        id: toastId,
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('コメントの送信に失敗しました', {
        description: '問題が続く場合は、管理者にお問い合わせください。',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading('日報を承認しています...');

      await approveReport({ reportId });

      toast.success('日報を承認しました', {
        id: toastId,
        description: '作成者に通知されました。',
      });
    } catch (error) {
      console.error('Failed to approve report:', error);
      toast.error('日報の承認に失敗しました', {
        description:
          error instanceof Error && error.message.includes('permission')
            ? 'この操作を実行する権限がありません。'
            : '問題が続く場合は、管理者にお問い合わせください。',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading('日報を却下しています...');

      await rejectReport({ reportId, reason });

      toast.success('日報を却下しました', {
        id: toastId,
        description: '作成者に理由が通知されました。',
      });
    } catch (error) {
      console.error('Failed to reject report:', error);
      toast.error('日報の却下に失敗しました', {
        description:
          error instanceof Error && error.message.includes('permission')
            ? 'この操作を実行する権限がありません。'
            : '問題が続く場合は、管理者にお問い合わせください。',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading('日報を削除しています...');

      await deleteReport({ reportId });

      toast.success('日報を削除しました', {
        id: toastId,
      });

      router.push('/reports');
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('日報の削除に失敗しました', {
        description:
          error instanceof Error && error.message.includes('permission')
            ? 'この操作を実行する権限がありません。'
            : '問題が続く場合は、管理者にお問い合わせください。',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading('日報を提出しています...');

      await updateReport({
        reportId,
        expectedUpdatedAt: report.updated_at,
        status: 'submitted',
      });

      toast.success('日報を提出しました', {
        id: toastId,
        description: '承認者に通知されました。',
      });
    } catch (error) {
      console.error('Failed to submit report:', error);

      let errorMessage = '日報の提出に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          errorMessage =
            '他のユーザーが同時に編集したため、提出に失敗しました。ページを更新してください。';
        }
      }

      toast.error(errorMessage, {
        description: '問題が続く場合は、管理者にお問い合わせください。',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'outline' as const, label: '下書き' },
      submitted: { variant: 'secondary' as const, label: '提出済み' },
      approved: { variant: 'default' as const, label: '承認済み' },
      rejected: { variant: 'destructive' as const, label: '却下' },
    };
    return variants[status] ?? { variant: 'outline', label: status };
  };

  const statusInfo = getStatusBadge(report.status);

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            戻る
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>日報詳細</h1>
            <p className='text-gray-600 mt-1'>
              {format(new Date(report.reportDate), 'yyyy年M月d日（E）', {
                locale: ja,
              })}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {report.status === 'draft' && (
            <>
              <Link href={`/reports/${reportId}/edit`}>
                <Button variant='outline' size='sm'>
                  <Edit className='h-4 w-4 mr-2' />
                  編集
                </Button>
              </Link>
              <Button size='sm' onClick={handleSubmit} disabled={isSubmittingAction}>
                <Send className='h-4 w-4 mr-2' />
                提出
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
          <div className='flex items-center gap-4 text-sm text-gray-500'>
            <div className='flex items-center gap-1'>
              <User className='h-4 w-4' />
              作成者: {report.author?.name ?? 'Unknown'}
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4' />
              作成日時: {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm')}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='whitespace-pre-wrap'>{report.content}</div>
        </CardContent>
      </Card>

      {/* タスク */}
      {report.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>タスク</CardTitle>
            <CardDescription>
              {report.stats.completedTasks} / {report.stats.totalTasks} 完了
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {report.tasks.map((task) => (
                <div
                  key={task.id}
                  className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50'
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {task.completed && <Check className='h-3 w-3 text-white' />}
                  </div>
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.title}
                  </span>
                  {task.estimatedHours && (
                    <span className='ml-auto text-sm text-gray-500'>
                      予定: {task.estimatedHours}h
                    </span>
                  )}
                  {task.actualHours && (
                    <span className='text-sm text-gray-500'>実績: {task.actualHours}h</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI要約 */}
      {report.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI要約</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-700'>{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* 承認情報 */}
      {report.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>承認履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {report.approvals.map((approval) => (
                <div key={approval._id} className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={approval.manager?.avatarUrl} />
                    <AvatarFallback>{approval.manager?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>{approval.manager?.name} が承認しました</p>
                    <p className='text-xs text-gray-500'>
                      {format(new Date(approval.approved_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* コメント */}
      <Card>
        <CardHeader>
          <CardTitle>コメント</CardTitle>
          <CardDescription>{report.comments.length} 件のコメント</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {report.comments.map((comment) => (
            <div key={comment._id} className='flex gap-3'>
              <Avatar className='h-8 w-8'>
                {comment.author?.avatarUrl ? (
                  <AvatarImage asChild src={comment.author.avatarUrl}>
                    <Image
                      src={comment.author.avatarUrl}
                      alt={comment.author.name ?? 'Commenter'}
                      fill
                      className='rounded-full object-cover'
                    />
                  </AvatarImage>
                ) : null}
                <AvatarFallback>{comment.author?.name?.charAt(0) ?? 'S'}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium'>{comment.author?.name ?? 'システム'}</p>
                  <p className='text-xs text-gray-500'>
                    {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm')}
                  </p>
                  {comment.type === 'system' && (
                    <Badge variant='outline' className='text-xs'>
                      システム
                    </Badge>
                  )}
                </div>
                <p className='text-sm mt-1'>{comment.content}</p>
              </div>
            </div>
          ))}

          {/* コメント入力 */}
          <Separator />
          <div className='space-y-3'>
            <Textarea
              placeholder='コメントを入力...'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className='min-h-[80px]'
            />
            <div className='flex justify-end'>
              <Button
                size='sm'
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmittingComment}
              >
                <MessageSquare className='h-4 w-4 mr-2' />
                コメントを送信
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクション */}
      <Card>
        <CardHeader>
          <CardTitle>アクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-3'>
            {report.status === 'submitted' && (
              <>
                <Button variant='default' onClick={handleApprove} disabled={isSubmittingAction}>
                  <Check className='h-4 w-4 mr-2' />
                  承認
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive' disabled={isSubmittingAction}>
                      <XIcon className='h-4 w-4 mr-2' />
                      却下
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>日報を却下しますか？</AlertDialogTitle>
                      <AlertDialogDescription>却下理由を入力してください</AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea placeholder='却下理由...' className='min-h-[100px]' />
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const textarea = document.querySelector(
                            'textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea?.value) {
                            handleReject(textarea.value);
                          }
                        }}
                      >
                        却下する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {(report.status === 'draft' || report.status === 'rejected') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive' disabled={isSubmittingAction}>
                    <Trash2 className='h-4 w-4 mr-2' />
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>日報を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。本当に削除しますか？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>削除する</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportDetail({ reportId }: ReportDetailProps) {
  return (
    <ErrorBoundaryWrapper>
      <ReportDetailInner reportId={reportId} />
    </ErrorBoundaryWrapper>
  );
}
