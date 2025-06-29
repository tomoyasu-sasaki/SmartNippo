import { useAuth } from '@clerk/clerk-expo';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  MessageSquare,
  Send,
  Share2,
  User,
  XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommentItem } from '../../../components/features/reports/comment-item';
import { MetadataSection } from '../../../components/features/reports/metadata-section';
import { StatusBadge } from '../../../components/features/reports/status-badge';
import { WorkItemListItem } from '../../../components/features/reports/work-item-list-item';
import { REPORTS_CONSTANTS } from '../../../constants/reports';

// ステータスを日本語に変換
const statusLabels = REPORTS_CONSTANTS.STATUS_LABELS;

// ステータスに応じた色とアイコンを返す
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'draft':
      return { color: 'bg-gray-100 text-gray-600', icon: null };
    case 'submitted':
      return { color: 'bg-blue-100 text-blue-600', icon: <Clock size={16} color='#2563EB' /> };
    case 'approved':
      return {
        color: 'bg-green-100 text-green-600',
        icon: <CheckCircle size={16} color='#16A34A' />,
      };
    case 'rejected':
      return { color: 'bg-red-100 text-red-600', icon: <XCircle size={16} color='#DC2626' /> };
    default:
      return { color: 'bg-gray-100 text-gray-600', icon: null };
  }
};

// 難易度の表示名
const difficultyLabels = REPORTS_CONSTANTS.DIFFICULTY_LABELS;

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // id を Id<'reports'> 型に変換
  const reportId = id as Id<'reports'>;

  const report = useQuery(api.index.getReportDetail, {
    reportId,
  });

  // 新: 作業項目（workItems）を取得
  const workItems = useQuery(api.index.listWorkItemsForReport, {
    reportId,
  });

  // 現在のユーザー情報を取得（Web版と同様）
  const currentUser = useQuery(api.index.current);

  // Convex mutations
  const addComment = useMutation(api.index.addComment);
  const approveReport = useMutation(api.index.approveReport);
  const rejectReport = useMutation(api.index.rejectReport);
  const updateReport = useMutation(api.index.updateReport);

  const handleAddComment = async () => {
    if (!commentText.trim() || !report) {
      return;
    }

    try {
      await addComment({
        reportId: report._id,
        content: commentText.trim(),
      });
      setCommentText('');
      Alert.alert('成功', 'コメントを追加しました');
    } catch (error) {
      console.error('コメント追加エラー:', error);
      Alert.alert('エラー', REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.COMMENT_ERROR);
    }
  };

  // 編集画面への遷移
  const handleEdit = () => {
    router.push(`/(tabs)/reports/edit?id=${id}`);
  };

  // 承認処理
  const handleApprove = async () => {
    Alert.alert(
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.APPROVE_TITLE,
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.APPROVE_MESSAGE,
      [
        { text: REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.CANCEL, style: 'cancel' },
        {
          text: REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.APPROVE,
          onPress: async () => {
            setIsSubmittingAction(true);
            try {
              await approveReport({
                reportId: id as Id<'reports'>,
                comment: '承認しました',
              });
              Alert.alert('成功', REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.APPROVE_SUCCESS);
            } catch (error) {
              Alert.alert(
                'エラー',
                REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.APPROVE_ERROR((error as Error).message)
              );
            } finally {
              setIsSubmittingAction(false);
            }
          },
        },
      ]
    );
  };

  // 却下処理
  const handleReject = async () => {
    Alert.prompt(
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.REJECT_TITLE,
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.REJECT_MESSAGE,
      [
        { text: REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.CANCEL, style: 'cancel' },
        {
          text: REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.REJECT,
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('エラー', REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.REJECT_REASON_ERROR);
              return;
            }
            setIsSubmittingAction(true);
            try {
              await rejectReport({
                reportId: id as Id<'reports'>,
                reason: reason.trim(),
              });
              Alert.alert('成功', REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.REJECT_SUCCESS);
            } catch (error) {
              Alert.alert(
                'エラー',
                REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.REJECT_ERROR((error as Error).message)
              );
            } finally {
              setIsSubmittingAction(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // 提出処理
  const handleSubmit = async () => {
    Alert.alert(
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.SUBMIT_TITLE,
      REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.SUBMIT_MESSAGE,
      [
        { text: REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.CANCEL, style: 'cancel' },
        {
          text: REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.SUBMIT,
          onPress: async () => {
            setIsSubmittingAction(true);
            try {
              await updateReport({
                reportId: id as Id<'reports'>,
                expectedUpdatedAt: report.updated_at,
                status: 'submitted',
              });
              Alert.alert('成功', REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.SUBMIT_SUCCESS);
            } catch (error) {
              Alert.alert(
                'エラー',
                REPORTS_CONSTANTS.DETAIL_SCREEN.ALERTS.SUBMIT_ERROR((error as Error).message)
              );
            } finally {
              setIsSubmittingAction(false);
            }
          },
        },
      ]
    );
  };

  // シェア機能
  const handleShare = async () => {
    if (!report) {
      return;
    }

    const shareContent = `
【日報】${report.reportDate}
${report.title}

${report.content}

${workItems && workItems.length > 0 ? `\n作業項目数: ${workItems.length}` : ''}
    `.trim();

    try {
      await Share.share({
        message: shareContent,
        title: `日報: ${report.reportDate}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // ローディング表示
  if (!report) {
    return (
      <View className='flex-1 items-center justify-center bg-gray-50'>
        <ActivityIndicator size='large' color='#3B82F6' />
        <Text className='mt-2 text-gray-600'>{REPORTS_CONSTANTS.DETAIL_SCREEN.LOADING_TEXT}</Text>
      </View>
    );
  }

  // 自分のレポートかどうか判定（Web版と同様の方法）
  const isOwner = currentUser?._id === report.author?._id;
  const canEdit = isOwner && report.status === 'draft';
  const canModerate =
    !isOwner && (currentUser?.role === 'manager' || currentUser?.role === 'admin');

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* ヘッダー情報 */}
          <View className='bg-white p-4'>
            <View className='mb-3 flex-row items-center justify-between'>
              <View className='flex-row items-center'>
                <Calendar size={20} color='#6B7280' />
                <Text className='ml-2 text-base font-medium text-gray-900'>
                  {report.reportDate}
                </Text>
              </View>
              <View className='flex-row items-center'>
                <StatusBadge status={report.status} showIcon />
                {canEdit && (
                  <Pressable onPress={handleEdit} className='ml-2 p-1'>
                    <Edit size={20} color='#6B7280' />
                  </Pressable>
                )}
                <Pressable onPress={handleShare} className='ml-2 p-1'>
                  <Share2 size={20} color='#6B7280' />
                </Pressable>
              </View>
            </View>

            <Text className='mb-3 text-xl font-bold text-gray-900'>{report.title}</Text>

            {/* 作成者情報 */}
            <View className='flex-row items-center'>
              <View className='mr-2 h-8 w-8 items-center justify-center rounded-full bg-gray-300'>
                <User size={16} color='white' />
              </View>
              <View>
                <Text className='text-sm font-medium text-gray-900'>{report.author.name}</Text>
                <Text className='text-xs text-gray-500'>{report.author.role}</Text>
              </View>
            </View>

            {/* 勤務時間 */}
            {report.workingHours && (
              <View className='mt-3 flex-row items-center'>
                <Clock size={16} color='#6B7280' />
                <Text className='ml-2 text-sm text-gray-600'>
                  勤務時間: {report.workingHours.startHour.toString().padStart(2, '0')}:
                  {report.workingHours.startMinute.toString().padStart(2, '0')} -
                  {report.workingHours.endHour.toString().padStart(2, '0')}:
                  {report.workingHours.endMinute.toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>

          {/* 本文 */}
          <View className='mt-2 bg-white p-4'>
            <Text className='mb-2 text-lg font-semibold text-gray-900'>
              {REPORTS_CONSTANTS.DETAIL_SCREEN.SECTIONS.CONTENT}
            </Text>
            <Text className='text-gray-700'>{report.content}</Text>
          </View>

          {/* 作業項目 */}
          {workItems && workItems.length > 0 && (
            <View className='mt-2 bg-white p-4'>
              <View className='mb-3 flex-row items-center justify-between'>
                <Text className='text-lg font-semibold text-gray-900'>
                  {REPORTS_CONSTANTS.DETAIL_SCREEN.SECTIONS.WORK_ITEMS}
                </Text>
                <Text className='text-sm text-gray-500'>
                  {REPORTS_CONSTANTS.DETAIL_SCREEN.STATISTICS.COMPLETED_WORK_ITEMS(
                    report?.stats?.completedWorkItems ?? 0,
                    report?.stats?.totalWorkItems ?? workItems.length
                  )}
                </Text>
              </View>
              {workItems.map((item: any) => (
                <WorkItemListItem key={item._id} item={item} />
              ))}
            </View>
          )}

          {/* メタデータ */}
          {report.metadata && (
            <View className='mt-2 bg-white p-4'>
              {report.metadata.difficulty && (
                <View className='mb-4'>
                  <Text className='mb-2 font-medium text-gray-700'>
                    {REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.DIFFICULTY}
                  </Text>
                  <View className='rounded-lg bg-gray-50 px-3 py-2'>
                    <Text className='text-sm text-gray-700'>
                      {difficultyLabels[report.metadata.difficulty]}
                    </Text>
                  </View>
                </View>
              )}
              <MetadataSection
                title={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.ACHIEVEMENTS}
                items={report.metadata.achievements || []}
              />
              <MetadataSection
                title={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.CHALLENGES}
                items={report.metadata.challenges || []}
              />
              <MetadataSection
                title={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.LEARNINGS}
                items={report.metadata.learnings || []}
              />
              <MetadataSection
                title={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.NEXT_ACTIONS}
                items={report.metadata.nextActionItems || []}
              />
            </View>
          )}

          {/* 統計情報 */}
          {report.stats && (
            <View className='mt-2 bg-white p-4'>
              <Text className='mb-3 text-lg font-semibold text-gray-900'>
                {REPORTS_CONSTANTS.DETAIL_SCREEN.SECTIONS.STATISTICS}
              </Text>
              <View className='flex-row flex-wrap'>
                {report.stats.totalEstimatedHours > 0 && (
                  <View className='mr-4 mb-2'>
                    <Text className='text-xs text-gray-500'>
                      {REPORTS_CONSTANTS.DETAIL_SCREEN.STATISTICS.ESTIMATED_HOURS}
                    </Text>
                    <Text className='text-base font-medium text-gray-900'>
                      {report.stats.totalEstimatedHours}h
                    </Text>
                  </View>
                )}
                {report.stats.totalActualHours > 0 && (
                  <View className='mr-4 mb-2'>
                    <Text className='text-xs text-gray-500'>
                      {REPORTS_CONSTANTS.DETAIL_SCREEN.STATISTICS.ACTUAL_HOURS}
                    </Text>
                    <Text className='text-base font-medium text-gray-900'>
                      {report.stats.totalActualHours}h
                    </Text>
                  </View>
                )}
                <View className='mr-4 mb-2'>
                  <Text className='text-xs text-gray-500'>
                    {REPORTS_CONSTANTS.DETAIL_SCREEN.STATISTICS.COMMENT_COUNT}
                  </Text>
                  <Text className='text-base font-medium text-gray-900'>
                    {report.stats.commentCount}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 承認情報 */}
          {report.approvals && report.approvals.length > 0 && (
            <View className='mt-2 bg-white p-4'>
              <Text className='mb-3 text-lg font-semibold text-gray-900'>
                {REPORTS_CONSTANTS.DETAIL_SCREEN.SECTIONS.APPROVAL_HISTORY}
              </Text>
              {report.approvals.map((approval: any) => (
                <View key={approval._id} className='mb-2 flex-row items-center'>
                  <CheckCircle size={16} color='#16A34A' />
                  <Text className='ml-2 text-sm text-gray-700'>
                    {REPORTS_CONSTANTS.DETAIL_SCREEN.APPROVAL_HISTORY.APPROVED_BY(
                      approval.manager.name
                    )}
                    <Text className='text-gray-500'>
                      {' '}
                      (
                      {new Date(approval.approved_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      )
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 却下理由 */}
          {report.status === 'rejected' && report.rejectionReason && (
            <View className='mt-2 bg-red-50 p-4'>
              <View className='flex-row items-start'>
                <AlertCircle size={20} color='#DC2626' />
                <View className='ml-2 flex-1'>
                  <Text className='mb-1 font-medium text-red-900'>
                    {REPORTS_CONSTANTS.DETAIL_SCREEN.REJECTION.TITLE}
                  </Text>
                  <Text className='text-sm text-red-700'>{report.rejectionReason}</Text>
                  {report.rejectedAt && (
                    <Text className='mt-1 text-xs text-red-600'>
                      {new Date(report.rejectedAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* コメントセクション */}
          <View className='mt-2 bg-white p-4'>
            <View className='mb-3 flex-row items-center'>
              <MessageSquare size={20} color='#374151' />
              <Text className='ml-2 text-lg font-semibold text-gray-900'>
                {REPORTS_CONSTANTS.DETAIL_SCREEN.SECTIONS.COMMENTS}
              </Text>
            </View>
            {report.comments.length === 0 ? (
              <Text className='text-center text-gray-500'>
                {REPORTS_CONSTANTS.DETAIL_SCREEN.COMMENTS.EMPTY_STATE}
              </Text>
            ) : (
              report.comments.map((comment: any) => (
                <CommentItem key={comment._id} comment={comment} />
              ))
            )}
          </View>

          {/* アクションボタン */}
          {report.status === 'draft' && (
            <View className='mt-2 bg-white p-4'>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmittingAction}
                className={`rounded-lg py-3 ${
                  isSubmittingAction ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-600'
                }`}
              >
                <Text className='text-center font-semibold text-white'>
                  {isSubmittingAction
                    ? REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.PROCESSING
                    : REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.SUBMIT}
                </Text>
              </Pressable>
            </View>
          )}

          {report.status === 'submitted' && canModerate && (
            <View className='mt-2 bg-white p-4'>
              <View className='flex-row space-x-2'>
                <Pressable
                  onPress={handleApprove}
                  disabled={isSubmittingAction}
                  className={`flex-1 rounded-lg py-3 ${
                    isSubmittingAction ? 'bg-gray-400' : 'bg-green-500 active:bg-green-600'
                  }`}
                >
                  <Text className='text-center font-semibold text-white'>
                    {isSubmittingAction
                      ? REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.PROCESSING
                      : REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.APPROVE}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleReject}
                  disabled={isSubmittingAction}
                  className={`flex-1 rounded-lg py-3 ${
                    isSubmittingAction ? 'bg-gray-400' : 'bg-red-500 active:bg-red-600'
                  }`}
                >
                  <Text className='text-center font-semibold text-white'>
                    {isSubmittingAction
                      ? REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.PROCESSING
                      : REPORTS_CONSTANTS.DETAIL_SCREEN.ACTIONS.REJECT}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* コメント入力エリア */}
        <View className='border-t border-gray-200 bg-white p-4'>
          <View className='flex-row items-end'>
            <TextInput
              className='mr-2 flex-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-900'
              value={commentText}
              onChangeText={setCommentText}
              placeholder={REPORTS_CONSTANTS.DETAIL_SCREEN.COMMENTS.PLACEHOLDER}
              placeholderTextColor='#9CA3AF'
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={!commentText.trim() || isSubmittingComment}
              className={`rounded-lg p-2 ${
                !commentText.trim() || isSubmittingComment
                  ? 'bg-gray-300'
                  : 'bg-blue-500 active:bg-blue-600'
              }`}
            >
              <Send size={20} color='white' />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
