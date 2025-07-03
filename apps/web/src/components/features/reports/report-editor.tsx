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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ErrorBoundaryProvider } from '@/providers/error-boundary-provider';
import type { ReportEditorProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, Plus, Save, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { REPORTS_CONSTANTS } from '@smartnippo/lib';

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

// Form validation schema
const reportFormSchema = z.object({
  reportDate: z.date({
    required_error: '日付を選択してください',
  }),
  projectId: z.string().min(1, 'メインプロジェクトを選択してください'),
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(200, 'タイトルは200文字以内で入力してください'),
  content: z
    .string()
    .min(1, '内容を入力してください')
    .max(10000, '内容は10000文字以内で入力してください'),
  workingHours: z
    .object({
      startHour: z.number(),
      startMinute: z.number(),
      endHour: z.number(),
      endMinute: z.number(),
    })
    .optional(),
  workItems: z
    .array(
      z.object({
        _id: z.string().optional(), // 既存作業項目の場合
        projectId: z.string().min(1, 'プロジェクトを選択してください'),
        workCategoryId: z.string().min(1, '作業区分を選択してください'),
        description: z.string().min(1, '作業内容を入力してください'),
        workDuration: z.coerce.number().min(0, '作業時間は0以上で入力してください'),
      })
    )
    .optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

// ReportEditorPropsは@/typesからインポート済み

export function ReportEditor({ reportId, initialData, expectedUpdatedAt }: ReportEditorProps) {
  const reportIdConv = reportId as Id<'reports'>;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTypeRef = useRef<'draft' | 'submitted'>('draft');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReportFormValues | null>(null);
  const [deletedWorkItems, setDeletedWorkItems] = useState<
    (ReportFormValues['workItems'] extends (infer U)[] | undefined ? U : never)[]
  >([]);

  const saveReport = useAction(api.index.saveReportWithWorkItems);

  const projects = useQuery(api.index.listProjects);
  const existingWorkItems = useQuery(
    api.index.listWorkItemsForReport,
    reportId ? { reportId: reportIdConv } : 'skip'
  );

  // 最新のレポートデータを取得（競合解決用）
  const latestReport = useQuery(
    api.index.getReportDetail,
    reportId ? { reportId: reportIdConv } : 'skip'
  );

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportDate: initialData?.reportDate ? new Date(initialData.reportDate) : new Date(),
      projectId: initialData?.projectId ?? '',
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
      workItems: [], // workItemsは別途読み込むため、ここでは空で初期化
      workingHours: initialData?.workingHours ?? {
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
      },
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'workItems',
  });

  // 既存作業項目をフォームにセットする
  useEffect(() => {
    if (existingWorkItems) {
      replace(existingWorkItems);
    }
    if (initialData?.workingHours) {
      form.setValue('workingHours', initialData.workingHours);
    }
  }, [existingWorkItems, initialData, replace, form]);

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

        await saveReport({
          ...(reportId && { reportId: reportIdConv }),
          reportData: {
            reportDate: format(pendingValues.reportDate, 'yyyy-MM-dd'),
            projectId: pendingValues.projectId as Id<'projects'>,
            title: pendingValues.title,
            content: pendingValues.content,
            workingHours: pendingValues.workingHours,
          },
          workItems: [...(pendingValues.workItems ?? []), ...deletedWorkItems] as any,
          expectedUpdatedAt: latestReport.updated_at,
          status: submitTypeRef.current,
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
      const finalWorkItems = [...(values.workItems ?? []), ...deletedWorkItems];

      // 楽観的更新のためのトースト表示
      const toastId = toast.loading(
        reportId
          ? REPORTS_CONSTANTS.UPDATING_REPORT
          : submitType === 'submitted'
            ? REPORTS_CONSTANTS.SUBMITTING_REPORT
            : REPORTS_CONSTANTS.SAVING_REPORT
      );

      await saveReport({
        ...(reportId && { reportId: reportIdConv }),
        reportData: {
          reportDate: format(values.reportDate, 'yyyy-MM-dd'),
          projectId: values.projectId as Id<'projects'>,
          title: values.title,
          content: values.content,
          workingHours: values.workingHours,
        },
        workItems: finalWorkItems as any,
        ...(reportId && { expectedUpdatedAt }),
        status: submitType,
      });

      toast.success(
        submitType === 'submitted'
          ? REPORTS_CONSTANTS.CREATE_SUCCESS_SUBMITTED
          : REPORTS_CONSTANTS.CREATE_SUCCESS_DRAFT,
        {
          id: toastId,
          description:
            submitType === 'submitted'
              ? REPORTS_CONSTANTS.CREATE_SUCCESS_DESC_SUBMITTED
              : REPORTS_CONSTANTS.CREATE_SUCCESS_DESC_DRAFT,
        }
      );

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

  const addWorkItem = () => {
    // append a new workItem with default values
    append({
      projectId: '',
      workCategoryId: '',
      description: '',
      workDuration: 0,
    });
  };

  const removeWorkItem = (index: number) => {
    const workItems = form.getValues('workItems');
    if (!workItems) {
      return;
    }

    const workItemToRemove = workItems[index];
    if (workItemToRemove._id) {
      setDeletedWorkItems((prev) => [...prev, { ...(workItemToRemove as any), _isDeleted: true }]);
    }
    remove(index);
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
              <h1 className='text-2xl font-bold md:text-3xl'>
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
                            disabled={(date: Date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
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

                <WorkingTimePicker form={form} />

                <FormField
                  control={form.control}
                  name='projectId'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>メインプロジェクト</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='日報のメインプロジェクトを選択してください' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        この日報を代表するプロジェクトを選択してください。承認フローに使用されます。
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

            {/* 作業内容 */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>作業内容</CardTitle>
                    <CardDescription>本日の作業内容を記録します（任意）</CardDescription>
                  </div>
                  <Button type='button' variant='outline' size='sm' onClick={addWorkItem}>
                    <Plus className='h-4 w-4 mr-2' />
                    作業を追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.map((field, index) => (
                  <div key={field.id} className='rounded-lg border p-4 space-y-4 mb-4 relative'>
                    <div className='flex justify-between items-center'>
                      <h4 className='font-semibold'>作業 {index + 1}</h4>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => removeWorkItem(index)}
                        className='absolute top-2 right-2'
                      >
                        <X className='h-4 w-4' />
                        <span className='sr-only'>作業内容を削除</span>
                      </Button>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-10 gap-4'>
                      <FormField
                        control={form.control}
                        name={`workItems.${index}.projectId`}
                        render={({ field }) => (
                          <FormItem className='md:col-span-4'>
                            <FormLabel>プロジェクト</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className='w-full'>
                                  <SelectValue placeholder='プロジェクトを選択' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects?.map((p) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <WorkCategorySelector
                        control={form.control}
                        projectId={form.watch(`workItems.${index}.projectId`)}
                        index={index}
                        className='md:col-span-4'
                      />

                      <FormField
                        control={form.control}
                        name={`workItems.${index}.workDuration`}
                        render={({ field }) => (
                          <FormItem className='md:col-span-2'>
                            <FormLabel>作業時間 (分)</FormLabel>
                            <FormControl>
                              <Input type='number' placeholder='例: 60' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`workItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>作業内容</FormLabel>
                          <FormControl>
                            <Textarea placeholder='具体的な作業内容を記述' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className='text-sm text-gray-500 text-center py-4'>作業内容がありません</p>
                )}
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <div className='flex flex-col sm:flex-row gap-3 sm:justify-end'>
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
                variant='outline'
                disabled={isSubmitting}
                onClick={() => (submitTypeRef.current = 'submitted')}
                loading={isSubmitting && submitTypeRef.current === 'submitted'}
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

function WorkingTimePicker({ form }: { form: UseFormReturn<ReportFormValues> }) {
  return (
    <FormField
      control={form.control}
      name='workingHours'
      render={() => (
        <FormItem>
          <FormLabel>勤務時間</FormLabel>
          <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-2 items-center gap-y-2'>
            <div className='grid grid-cols-[1fr_auto_1fr_auto] gap-x-2 items-center'>
              <FormField
                control={form.control}
                name='workingHours.startHour'
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span>時</span>
              <FormField
                control={form.control}
                name='workingHours.startMinute'
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span>分</span>
            </div>
            <div className='text-center'>〜</div>
            <div className='grid grid-cols-[1fr_auto_1fr_auto] gap-x-2 items-center'>
              <FormField
                control={form.control}
                name='workingHours.endHour'
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span>時</span>
              <FormField
                control={form.control}
                name='workingHours.endMinute'
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span>分</span>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function WorkCategorySelector({
  control,
  projectId,
  index,
  className,
}: {
  control: UseFormReturn<ReportFormValues>['control'];
  projectId: string;
  index: number;
  className?: string;
}) {
  const workCategories = useQuery(
    api.index.listWorkCategories,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
  );

  return (
    <FormField
      control={control}
      name={`workItems.${index}.workCategoryId`}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>作業区分</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={!projectId}>
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='作業区分を選択' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {workCategories?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
