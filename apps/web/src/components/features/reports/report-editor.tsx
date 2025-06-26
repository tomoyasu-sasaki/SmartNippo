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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, Plus, Save, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Form validation schema
const reportFormSchema = z.object({
  reportDate: z.date({
    required_error: '日付を選択してください',
  }),
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(200, 'タイトルは200文字以内で入力してください'),
  content: z
    .string()
    .min(1, '内容を入力してください')
    .max(10000, '内容は10000文字以内で入力してください'),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1, 'タスク名を入力してください'),
        completed: z.boolean(),
        estimatedHours: z.number().optional(),
        actualHours: z.number().optional(),
        category: z.string().optional(),
      })
    )
    .optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export interface ReportEditorProps {
  reportId?: Id<'reports'>;
  initialData?: Partial<ReportFormValues>;
  expectedUpdatedAt?: number;
}

export function ReportEditor({ reportId, initialData, expectedUpdatedAt }: ReportEditorProps) {
  const router = useRouter();
  const convex = useConvex();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitType, setSubmitType] = useState<'draft' | 'submit'>('draft');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReportFormValues | null>(null);

  const createReport = useMutation(api.index.createReport);
  const updateReport = useMutation(api.index.updateReport);

  // 最新のレポートデータを取得（競合解決用）
  const latestReport = useQuery(api.index.getReportDetail, reportId ? { reportId } : 'skip');

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: initialData ?? {
      reportDate: new Date(),
      title: '',
      content: '',
      tasks: [],
    },
  });

  const handleConflictResolution = async (forceUpdate: boolean) => {
    if (!pendingValues || !latestReport) {
      return;
    }

    setConflictDialogOpen(false);

    if (forceUpdate) {
      // 強制的に上書き保存
      try {
        setIsSubmitting(true);
        const toastId = toast.loading('日報を上書き保存しています...');

        await updateReport({
          reportId: reportId!,
          expectedUpdatedAt: latestReport.updated_at, // 最新のタイムスタンプを使用
          title: pendingValues.title,
          content: pendingValues.content,
          tasks: pendingValues.tasks ?? [],
          reportDate: format(pendingValues.reportDate, 'yyyy-MM-dd'),
          status: submitType === 'submit' ? 'submitted' : 'draft',
        });

        toast.success('日報を上書き保存しました', {
          id: toastId,
          description: '最新の内容で更新されました。',
        });

        router.push('/reports');
        router.refresh();
      } catch (error) {
        console.error('Failed to force update:', error);
        toast.error('上書き保存に失敗しました');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 編集を破棄してリロード
      router.refresh();
    }

    setPendingValues(null);
  };

  const onSubmit = async (values: ReportFormValues) => {
    try {
      setIsSubmitting(true);

      // 楽観的更新のためのトースト表示
      const toastId = toast.loading(
        reportId
          ? '日報を更新しています...'
          : submitType === 'submit'
            ? '日報を提出しています...'
            : '日報を保存しています...'
      );

      const reportDataForCreate = {
        reportDate: format(values.reportDate, 'yyyy-MM-dd'),
        title: values.title,
        content: values.content,
        tasks: values.tasks ?? [],
      };

      const reportDataForUpdate = {
        title: values.title,
        content: values.content,
        tasks: values.tasks ?? [],
      };

      if (reportId) {
        // Update existing report
        if (!expectedUpdatedAt) {
          throw new Error('Expected updated at timestamp is missing for update.');
        }
        await updateReport({
          reportId,
          expectedUpdatedAt,
          ...reportDataForUpdate,
          reportDate: format(values.reportDate, 'yyyy-MM-dd'),
          status: submitType === 'submit' ? 'submitted' : 'draft',
        });

        toast.success('日報を更新しました', {
          id: toastId,
          description:
            submitType === 'submit' ? '日報が提出されました。' : '下書きとして保存されました。',
        });
      } else {
        // Create new report
        const newReportId = await createReport(reportDataForCreate);

        if (submitType === 'submit' && newReportId) {
          // If submitting, update the status
          // Note: a more robust way would be to get the new `_ts` from the createReport result
          const newReport = await convex.query(api.index.getReportDetail, {
            reportId: newReportId,
          });
          if (newReport) {
            await updateReport({
              reportId: newReportId,
              expectedUpdatedAt: newReport.updated_at,
              status: 'submitted',
            });
          }
        }

        toast.success(submitType === 'submit' ? '日報を提出しました' : '日報を作成しました', {
          id: toastId,
          description:
            submitType === 'submit' ? '承認者に通知されました。' : '下書きとして保存されました。',
        });
      }

      router.push('/reports');
      router.refresh();
    } catch (error) {
      console.error('Failed to save report:', error);

      // エラーメッセージの判定
      let errorMessage = '日報の保存に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          // データ競合が発生した場合
          setPendingValues(values);
          setConflictDialogOpen(true);
          return; // トーストは表示しない
        } else if (error.message.includes('permission')) {
          errorMessage = 'この操作を実行する権限がありません。';
        } else if (error.message.includes('network')) {
          errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        }
      }

      toast.error(errorMessage, {
        description: '問題が続く場合は、管理者にお問い合わせください。',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTask = () => {
    const currentTasks = form.getValues('tasks') ?? [];
    form.setValue('tasks', [
      ...currentTasks,
      {
        id: `task-${Date.now()}`,
        title: '',
        completed: false,
      },
    ]);
  };

  const removeTask = (index: number) => {
    const currentTasks = form.getValues('tasks') ?? [];
    form.setValue(
      'tasks',
      currentTasks.filter((_, i) => i !== index)
    );
  };

  return (
    <ErrorBoundaryProvider>
      <div className='space-y-6'>
        {/* ヘッダー */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              戻る
            </Button>
            <div>
              <h1 className='text-3xl font-bold'>{reportId ? '日報編集' : '日報作成'}</h1>
              <p className='text-gray-600 mt-1'>
                {reportId ? '日報を編集します' : '新しい日報を作成します'}
              </p>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>日報の基本情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='reportDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>日付</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'yyyy年M月d日（E）', { locale: ja })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>日報を作成する日付を選択してください</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル</FormLabel>
                      <FormControl>
                        <Input placeholder='本日の作業内容' {...field} />
                      </FormControl>
                      <FormDescription>
                        日報のタイトルを入力してください（200文字以内）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='content'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='本日の作業内容を詳しく記載してください...'
                          className='min-h-[200px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        作業内容、成果、課題などを記載してください（10000文字以内）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* タスク */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>タスク</CardTitle>
                    <CardDescription>本日のタスクを記録します（任意）</CardDescription>
                  </div>
                  <Button type='button' variant='outline' size='sm' onClick={addTask}>
                    <Plus className='h-4 w-4 mr-2' />
                    タスクを追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {form.watch('tasks')?.map((task, index) => (
                  <div key={task.id} className='flex gap-2 mb-3'>
                    <FormField
                      control={form.control}
                      name={`tasks.${index}.title`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormControl>
                            <Input placeholder='タスク名' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeTask(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {(!form.watch('tasks') || form.watch('tasks')!.length === 0) && (
                  <p className='text-sm text-gray-500 text-center py-4'>タスクがありません</p>
                )}
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <div className='flex gap-3 justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type='button'
                variant='outline'
                disabled={isSubmitting}
                onClick={() => {
                  setSubmitType('draft');
                  form.handleSubmit(onSubmit)();
                }}
                loading={isSubmitting && submitType === 'draft'}
              >
                <Save className='h-4 w-4 mr-2' />
                下書き保存
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                onClick={() => setSubmitType('submit')}
                loading={isSubmitting && submitType === 'submit'}
              >
                <Send className='h-4 w-4 mr-2' />
                提出
              </Button>
            </div>
          </form>
        </Form>

        {/* データ競合解決ダイアログ */}
        <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>データの競合が検出されました</AlertDialogTitle>
              <AlertDialogDescription>
                他のユーザーが同じ日報を編集したため、データの競合が発生しました。
                どのように処理しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='py-4'>
              <p className='text-sm text-muted-foreground'>
                • 「上書き保存」を選択すると、あなたの変更で他のユーザーの変更を上書きします。
              </p>
              <p className='text-sm text-muted-foreground'>
                • 「破棄」を選択すると、あなたの変更を破棄して最新の内容を表示します。
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleConflictResolution(false)}>
                変更を破棄
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleConflictResolution(true)}>
                上書き保存
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundaryProvider>
  );
}
