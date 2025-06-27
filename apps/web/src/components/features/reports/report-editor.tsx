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
import type { ReportEditorProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from 'convex/_generated/api';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, Plus, Save, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { REPORTS_CONSTANTS } from '@/constants/reports';

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

// ReportEditorPropsは@/typesからインポート済み

export function ReportEditor({ reportId, initialData, expectedUpdatedAt }: ReportEditorProps) {
  const router = useRouter();
  const convex = useConvex();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTypeRef = useRef<'draft' | 'submit'>('draft');
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
        const toastId = toast.loading(REPORTS_CONSTANTS.FORCE_SAVING_TOAST);

        await updateReport({
          reportId: reportId!,
          expectedUpdatedAt: latestReport.updated_at, // 最新のタイムスタンプを使用
          title: pendingValues.title,
          content: pendingValues.content,
          tasks: pendingValues.tasks ?? [],
          reportDate: format(pendingValues.reportDate, 'yyyy-MM-dd'),
          status: submitTypeRef.current === 'submit' ? 'submitted' : 'draft',
        });

        toast.success(REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_TOAST, {
          id: toastId,
          description: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_DESC_TOAST,
        });

        router.push('/reports');
        router.refresh();
      } catch (error) {
        console.error('Failed to force update:', error);
        toast.error(REPORTS_CONSTANTS.FORCE_SAVE_ERROR_TOAST);
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
    const submitType = submitTypeRef.current;
    try {
      setIsSubmitting(true);

      // 楽観的更新のためのトースト表示
      const toastId = toast.loading(
        reportId
          ? REPORTS_CONSTANTS.UPDATING_REPORT
          : submitType === 'submit'
            ? REPORTS_CONSTANTS.SUBMITTING_REPORT
            : REPORTS_CONSTANTS.SAVING_REPORT
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

        toast.success(REPORTS_CONSTANTS.UPDATE_SUCCESS, {
          id: toastId,
          description:
            submitType === 'submit'
              ? REPORTS_CONSTANTS.UPDATE_SUCCESS_DESC_SUBMITTED
              : REPORTS_CONSTANTS.UPDATE_SUCCESS_DESC_DRAFT,
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

        toast.success(
          submitType === 'submit'
            ? REPORTS_CONSTANTS.CREATE_SUCCESS_SUBMITTED
            : REPORTS_CONSTANTS.CREATE_SUCCESS_DRAFT,
          {
            id: toastId,
            description:
              submitType === 'submit'
                ? REPORTS_CONSTANTS.CREATE_SUCCESS_DESC_SUBMITTED
                : REPORTS_CONSTANTS.CREATE_SUCCESS_DESC_DRAFT,
          }
        );
      }

      router.push('/reports');
      router.refresh();
    } catch (error) {
      console.error('Failed to save report:', error);

      // エラーメッセージの判定
      let errorMessage = '';
      errorMessage = REPORTS_CONSTANTS.SAVE_ERROR;
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          // データ競合が発生した場合
          setPendingValues(values);
          setConflictDialogOpen(true);
          return; // トーストは表示しない
        } else if (error.message.includes('permission')) {
          errorMessage = REPORTS_CONSTANTS.PERMISSION_ERROR_DESC;
        } else if (error.message.includes('network')) {
          errorMessage = REPORTS_CONSTANTS.NETWORK_ERROR;
        }
      }

      toast.error(errorMessage, {
        description: REPORTS_CONSTANTS.GENERIC_ERROR_DESC,
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
              <h1 className='text-3xl font-bold'>
                {reportId ? REPORTS_CONSTANTS.EDIT_PAGE_TITLE : REPORTS_CONSTANTS.CREATE_PAGE_TITLE}
              </h1>
              <p className='text-gray-600 mt-1'>
                {reportId
                  ? REPORTS_CONSTANTS.EDIT_PAGE_DESCRIPTION
                  : REPORTS_CONSTANTS.CREATE_PAGE_DESCRIPTION}
              </p>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>{REPORTS_CONSTANTS.BASIC_INFO_CARD_TITLE}</CardTitle>
                <CardDescription>{REPORTS_CONSTANTS.BASIC_INFO_CARD_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='reportDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>{REPORTS_CONSTANTS.FORM_FIELD_DATE_LABEL}</FormLabel>
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
                                <span>{REPORTS_CONSTANTS.FORM_FIELD_DATE_PLACEHOLDER}</span>
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
                      <FormDescription>
                        {REPORTS_CONSTANTS.FORM_FIELD_DATE_DESCRIPTION}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{REPORTS_CONSTANTS.FORM_FIELD_TITLE_LABEL}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={REPORTS_CONSTANTS.FORM_FIELD_TITLE_PLACEHOLDER}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {REPORTS_CONSTANTS.FORM_FIELD_TITLE_DESCRIPTION}
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
                      <FormLabel>{REPORTS_CONSTANTS.FORM_FIELD_CONTENT_LABEL}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={REPORTS_CONSTANTS.FORM_FIELD_CONTENT_PLACEHOLDER}
                          className='min-h-[200px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {REPORTS_CONSTANTS.FORM_FIELD_CONTENT_DESCRIPTION}
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
                    <CardTitle>{REPORTS_CONSTANTS.TASKS_EDITOR_CARD_TITLE}</CardTitle>
                    <CardDescription>
                      {REPORTS_CONSTANTS.TASKS_EDITOR_CARD_DESCRIPTION}
                    </CardDescription>
                  </div>
                  <Button type='button' variant='outline' size='sm' onClick={addTask}>
                    <Plus className='h-4 w-4 mr-2' />
                    {REPORTS_CONSTANTS.ADD_TASK_BUTTON}
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
                            <Input
                              placeholder={REPORTS_CONSTANTS.TASK_NAME_PLACEHOLDER}
                              {...field}
                            />
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
                  <p className='text-sm text-gray-500 text-center py-4'>
                    {REPORTS_CONSTANTS.NO_TASKS_MESSAGE}
                  </p>
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
                {REPORTS_CONSTANTS.CANCEL_BUTTON}
              </Button>
              <Button
                type='submit'
                name='draft'
                variant='outline'
                disabled={isSubmitting}
                onClick={() => (submitTypeRef.current = 'draft')}
                loading={isSubmitting && submitTypeRef.current === 'draft'}
              >
                <Save className='h-4 w-4 mr-2' />
                {REPORTS_CONSTANTS.SAVE_DRAFT_BUTTON}
              </Button>
              <Button
                type='submit'
                name='submit'
                disabled={isSubmitting}
                onClick={() => (submitTypeRef.current = 'submit')}
                loading={isSubmitting && submitTypeRef.current === 'submit'}
              >
                <Send className='h-4 w-4 mr-2' />
                {REPORTS_CONSTANTS.SUBMIT_BUTTON}
              </Button>
            </div>
          </form>
        </Form>

        {/* データ競合解決ダイアログ */}
        <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{REPORTS_CONSTANTS.CONFLICT_DIALOG_TITLE}</AlertDialogTitle>
              <AlertDialogDescription>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='py-4'>
              <p className='text-sm text-muted-foreground'>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_FORCE_SAVE_INFO}
              </p>
              <p className='text-sm text-muted-foreground'>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_DISCARD_INFO}
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleConflictResolution(false)}>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_DISCARD_BUTTON}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleConflictResolution(true)}>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_FORCE_SAVE_BUTTON}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundaryProvider>
  );
}
