'use client';

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
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import { useAuth } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
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

import { REPORTS_CONSTANTS } from '@/constants/reports';
import type { ReportDetailProps } from '@/types';

function ReportDetailInner({ reportId }: ReportDetailProps) {
  const router = useRouter();
  const { userId, has } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch report detail
  const report = useQuery(api.index.getReportDetail, { reportId });

  // Mutations
  const addComment = useMutation(api.index.addComment);
  const approveReport = useMutation(api.index.approveReport);
  const rejectReport = useMutation(api.index.rejectReport);
  const deleteReport = useMutation(api.index.deleteReport);
  const updateReport = useMutation(api.index.updateReport);

  if (!report) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-2 text-gray-600'>{REPORTS_CONSTANTS.LOADING_MESSAGE}</p>
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
      const toastId = toast.loading(REPORTS_CONSTANTS.COMMENT_SUBMITTING);

      await addComment({
        reportId,
        content: newComment.trim(),
      });

      setNewComment('');
      toast.success(REPORTS_CONSTANTS.COMMENT_SUBMIT_SUCCESS, {
        id: toastId,
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(REPORTS_CONSTANTS.COMMENT_SUBMIT_ERROR, {
        description: REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading(REPORTS_CONSTANTS.APPROVE_SUBMITTING);

      await approveReport({ reportId });

      toast.success(REPORTS_CONSTANTS.APPROVE_SUCCESS, {
        id: toastId,
        description: REPORTS_CONSTANTS.APPROVE_SUCCESS_DESC,
      });
    } catch (error) {
      console.error('Failed to approve report:', error);
      toast.error(REPORTS_CONSTANTS.APPROVE_ERROR, {
        description:
          error instanceof Error && error.message.includes('permission')
            ? REPORTS_CONSTANTS.PERMISSION_ERROR_DESC
            : REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading(REPORTS_CONSTANTS.REJECT_SUBMITTING);

      await rejectReport({ reportId, reason });

      toast.success(REPORTS_CONSTANTS.REJECT_SUCCESS, {
        id: toastId,
        description: REPORTS_CONSTANTS.REJECT_SUCCESS_DESC,
      });
    } catch (error) {
      console.error('Failed to reject report:', error);
      toast.error(REPORTS_CONSTANTS.REJECT_ERROR, {
        description:
          error instanceof Error && error.message.includes('permission')
            ? REPORTS_CONSTANTS.PERMISSION_ERROR_DESC
            : REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading(REPORTS_CONSTANTS.DELETE_SUBMITTING);

      await deleteReport({ reportId });

      toast.success(REPORTS_CONSTANTS.DELETE_SUCCESS, {
        id: toastId,
      });

      router.push('/reports');
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error(REPORTS_CONSTANTS.DELETE_ERROR, {
        description:
          error instanceof Error && error.message.includes('permission')
            ? REPORTS_CONSTANTS.PERMISSION_ERROR_DESC
            : REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmittingAction(true);
      const toastId = toast.loading(REPORTS_CONSTANTS.SUBMIT_SUBMITTING);

      await updateReport({
        reportId,
        expectedUpdatedAt: report.updated_at,
        status: 'submitted',
      });

      toast.success(REPORTS_CONSTANTS.SUBMIT_SUCCESS, {
        id: toastId,
        description: REPORTS_CONSTANTS.SUBMIT_SUCCESS_DESC,
      });
    } catch (error) {
      console.error('Failed to submit report:', error);

      let errorMessage = '';
      errorMessage = REPORTS_CONSTANTS.SUBMIT_ERROR;
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          errorMessage = REPORTS_CONSTANTS.SUBMIT_CONFLICT_ERROR;
        }
      }

      toast.error(errorMessage, {
        description: REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      draft: REPORTS_CONSTANTS.STATUS.draft,
      submitted: REPORTS_CONSTANTS.STATUS.submitted,
      approved: REPORTS_CONSTANTS.STATUS.approved,
      rejected: REPORTS_CONSTANTS.STATUS.rejected,
    };
    return statusMap[status] ?? { variant: 'outline', label: status };
  };

  const statusInfo = getStatusBadge(report.status);

  return (
    <div className='space-y-6'>
      {/* ヘッダー */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            {REPORTS_CONSTANTS.BACK_BUTTON}
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>{REPORTS_CONSTANTS.DETAIL_PAGE_TITLE}</h1>
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
                  {REPORTS_CONSTANTS.EDIT_BUTTON}
                </Button>
              </Link>
              <Button size='sm' onClick={handleSubmit} disabled={isSubmittingAction}>
                <Send className='h-4 w-4 mr-2' />
                {REPORTS_CONSTANTS.SUBMIT_BUTTON}
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
              {REPORTS_CONSTANTS.AUTHOR_PREFIX}:{' '}
              {report.author?.name ?? REPORTS_CONSTANTS.UNKNOWN_AUTHOR}
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4' />
              {REPORTS_CONSTANTS.CREATED_AT_PREFIX}:{' '}
              {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm')}
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
            <CardTitle>{REPORTS_CONSTANTS.TASKS_CARD_TITLE}</CardTitle>
            <CardDescription>
              {REPORTS_CONSTANTS.TASKS_COMPLETED_STATUS(
                report.stats.completedTasks,
                report.stats.totalTasks
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {report.tasks.map((task: Doc<'reports'>['tasks'][number]) => (
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
                      {REPORTS_CONSTANTS.TASK_ESTIMATED_HOURS}: {task.estimatedHours}h
                    </span>
                  )}
                  {task.actualHours && (
                    <span className='text-sm text-gray-500'>
                      {REPORTS_CONSTANTS.TASK_ACTUAL_HOURS}: {task.actualHours}h
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI要約 */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-2'>{REPORTS_CONSTANTS.AI_SUMMARY_TITLE}</h3>
        <Card>
          <CardContent className='p-4'>
            <ErrorBoundaryProvider>
              <p className='text-gray-700 whitespace-pre-wrap'>
                {report.summary ?? REPORTS_CONSTANTS.AI_SUMMARY_NOT_AVAILABLE}
              </p>
            </ErrorBoundaryProvider>
          </CardContent>
        </Card>
      </div>

      {/* 承認情報 */}
      {report.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{REPORTS_CONSTANTS.APPROVAL_HISTORY_CARD_TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {report.approvals.map((approval: any) => (
                <div key={approval._id} className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={approval.manager?.avatarUrl} />
                    <AvatarFallback>{approval.manager?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>
                      {REPORTS_CONSTANTS.APPROVAL_ACTION_TEXT(approval.manager?.name)}
                    </p>
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
          <CardTitle>{REPORTS_CONSTANTS.COMMENTS_CARD_TITLE}</CardTitle>
          <CardDescription>
            {REPORTS_CONSTANTS.COMMENTS_COUNT(report.comments.length)}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {report.comments.map((comment: any) => (
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
                  <p className='text-sm font-medium'>
                    {comment.author?.name ?? REPORTS_CONSTANTS.COMMENT_AUTHOR_SYSTEM}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm')}
                  </p>
                  {comment.type === 'system' && (
                    <Badge variant='outline' className='text-xs'>
                      {REPORTS_CONSTANTS.COMMENT_AUTHOR_SYSTEM}
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
              placeholder={REPORTS_CONSTANTS.COMMENT_PLACEHOLDER}
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
                {REPORTS_CONSTANTS.COMMENT_SUBMIT_BUTTON}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクション */}
      <Card>
        <CardHeader>
          <CardTitle>{REPORTS_CONSTANTS.ACTIONS_CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-3'>
            {report.status === 'submitted' && (
              <>
                <Button variant='default' onClick={handleApprove} disabled={isSubmittingAction}>
                  <Check className='h-4 w-4 mr-2' />
                  {REPORTS_CONSTANTS.ACTION_APPROVE_BUTTON}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive' disabled={isSubmittingAction}>
                      <XIcon className='h-4 w-4 mr-2' />
                      {REPORTS_CONSTANTS.ACTION_REJECT_BUTTON}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{REPORTS_CONSTANTS.REJECT_DIALOG.TITLE}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {REPORTS_CONSTANTS.REJECT_DIALOG.DESCRIPTION}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder={REPORTS_CONSTANTS.REJECT_DIALOG.PLACEHOLDER}
                      className='min-h-[100px]'
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {REPORTS_CONSTANTS.REJECT_DIALOG.CANCEL_BUTTON}
                      </AlertDialogCancel>
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
                        {REPORTS_CONSTANTS.REJECT_DIALOG.CONFIRM_BUTTON}
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
                    {REPORTS_CONSTANTS.ACTION_DELETE_BUTTON}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{REPORTS_CONSTANTS.DELETE_DIALOG.TITLE}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {REPORTS_CONSTANTS.DELETE_DIALOG.DESCRIPTION}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {REPORTS_CONSTANTS.DELETE_DIALOG.CANCEL_BUTTON}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {REPORTS_CONSTANTS.DELETE_DIALOG.CONFIRM_BUTTON}
                    </AlertDialogAction>
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
    <ErrorBoundaryProvider>
      <ReportDetailInner reportId={reportId} />
    </ErrorBoundaryProvider>
  );
}
