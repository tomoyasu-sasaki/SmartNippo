import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
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

// ステータスを日本語に変換
const statusLabels = {
  draft: '下書き',
  submitted: '提出済み',
  approved: '承認済み',
  rejected: '却下',
} as const;

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

// 優先度の表示名
const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
} as const;

// 難易度の表示名
const difficultyLabels = {
  easy: '簡単',
  medium: '普通',
  hard: '難しい',
} as const;

// コメントコンポーネント
function CommentItem({ comment }: { comment: any }) {
  const isSystemComment = comment.type === 'system' || comment.type === 'ai';

  return (
    <View className={`mb-3 ${isSystemComment ? 'pl-4' : ''}`}>
      <View className='flex-row items-start'>
        <View
          className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
            isSystemComment ? 'bg-gray-200' : 'bg-blue-500'
          }`}
        >
          <Text className={`text-xs font-bold ${isSystemComment ? 'text-gray-600' : 'text-white'}`}>
            {isSystemComment ? 'S' : comment.author?.name?.[0] || '?'}
          </Text>
        </View>
        <View className='flex-1'>
          <View className='mb-1 flex-row items-center'>
            <Text className='text-sm font-medium text-gray-900'>
              {isSystemComment ? 'システム' : comment.author?.name || '不明'}
            </Text>
            <Text className='ml-2 text-xs text-gray-500'>
              {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text className='text-sm text-gray-700'>{comment.content}</Text>
        </View>
      </View>
    </View>
  );
}

// タスクアイテムコンポーネント
function TaskListItem({ task }: { task: any }) {
  return (
    <View className='mb-2 flex-row items-center justify-between rounded-lg bg-gray-50 p-3'>
      <View className='flex-1'>
        <View className='flex-row items-center'>
          <View
            className={`mr-2 h-5 w-5 items-center justify-center rounded-full ${
              task.completed ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            {task.completed && <CheckCircle size={12} color='white' />}
          </View>
          <Text
            className={`flex-1 text-sm ${
              task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {task.title}
          </Text>
        </View>
        <View className='ml-7 mt-1 flex-row items-center space-x-3'>
          {task.priority && (
            <Text className='text-xs text-gray-600'>優先度: {priorityLabels[task.priority]}</Text>
          )}
          {task.estimatedHours && (
            <Text className='text-xs text-gray-600'>予定: {task.estimatedHours}h</Text>
          )}
          {task.actualHours && (
            <Text className='text-xs text-gray-600'>実績: {task.actualHours}h</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// メタデータセクション
function MetadataSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View className='mb-4'>
      <Text className='mb-2 font-medium text-gray-700'>{title}</Text>
      {items.map((item, index) => (
        <View key={index} className='mb-1 rounded-lg bg-gray-50 px-3 py-2'>
          <Text className='text-sm text-gray-700'>• {item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Convexクエリでデータ取得
  const report = useQuery(api.index.getReportDetail, {
    reportId: id as Id<'reports'>,
  });

  // Convex mutations
  const addComment = useMutation(api.index.addComment);
  const approveReport = useMutation(api.index.approveReport);
  const rejectReport = useMutation(api.index.rejectReport);
  const updateReport = useMutation(api.index.updateReport);

  // コメント送信
  const handleSendComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      await addComment({
        reportId: id as Id<'reports'>,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (error) {
      Alert.alert('エラー', 'コメントの送信に失敗しました');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 承認処理
  const handleApprove = async () => {
    Alert.alert('確認', 'この日報を承認しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '承認',
        onPress: async () => {
          setIsSubmittingAction(true);
          try {
            await approveReport({
              reportId: id as Id<'reports'>,
              comment: '承認しました',
            });
            Alert.alert('成功', '日報を承認しました');
          } catch (error) {
            Alert.alert('エラー', `承認に失敗しました: ${(error as Error).message}`);
          } finally {
            setIsSubmittingAction(false);
          }
        },
      },
    ]);
  };

  // 却下処理
  const handleReject = async () => {
    Alert.prompt(
      '確認',
      'この日報を却下しますか？理由を入力してください。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '却下',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('エラー', '却下理由を入力してください');
              return;
            }
            setIsSubmittingAction(true);
            try {
              await rejectReport({
                reportId: id as Id<'reports'>,
                reason: reason.trim(),
              });
              Alert.alert('成功', '日報を却下しました');
            } catch (error) {
              Alert.alert('エラー', `却下に失敗しました: ${(error as Error).message}`);
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
    Alert.alert('確認', 'この日報を提出しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '提出',
        onPress: async () => {
          setIsSubmittingAction(true);
          try {
            await updateReport({
              reportId: id as Id<'reports'>,
              expectedUpdatedAt: report.updated_at,
              status: 'submitted',
            });
            Alert.alert('成功', '日報を提出しました');
          } catch (error) {
            Alert.alert('エラー', `提出に失敗しました: ${(error as Error).message}`);
          } finally {
            setIsSubmittingAction(false);
          }
        },
      },
    ]);
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

${report.tasks.length > 0 ? `\nタスク数: ${report.tasks.length}` : ''}
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
        <Text className='mt-2 text-gray-600'>読み込み中...</Text>
      </View>
    );
  }

  const statusStyle = getStatusStyle(report.status);

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
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 ${statusStyle.color}`}
                >
                  {statusStyle.icon}
                  <Text className='ml-1 text-sm font-medium'>
                    {statusLabels[report.status as keyof typeof statusLabels]}
                  </Text>
                </View>
                <Pressable onPress={handleShare} className='ml-3 p-1'>
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
          </View>

          {/* 本文 */}
          <View className='mt-2 bg-white p-4'>
            <Text className='mb-2 text-lg font-semibold text-gray-900'>内容</Text>
            <Text className='text-gray-700'>{report.content}</Text>
          </View>

          {/* タスク */}
          {report.tasks.length > 0 && (
            <View className='mt-2 bg-white p-4'>
              <View className='mb-3 flex-row items-center justify-between'>
                <Text className='text-lg font-semibold text-gray-900'>タスク</Text>
                <Text className='text-sm text-gray-500'>
                  {report.stats.completedTasks}/{report.stats.totalTasks} 完了
                </Text>
              </View>
              {report.tasks.map((task: any, index: number) => (
                <TaskListItem key={task.id || index} task={task} />
              ))}
            </View>
          )}

          {/* メタデータ */}
          {report.metadata && (
            <View className='mt-2 bg-white p-4'>
              {report.metadata.difficulty && (
                <View className='mb-4'>
                  <Text className='mb-2 font-medium text-gray-700'>難易度</Text>
                  <View className='rounded-lg bg-gray-50 px-3 py-2'>
                    <Text className='text-sm text-gray-700'>
                      {difficultyLabels[report.metadata.difficulty]}
                    </Text>
                  </View>
                </View>
              )}
              <MetadataSection title='成果・達成事項' items={report.metadata.achievements || []} />
              <MetadataSection title='課題・困った点' items={report.metadata.challenges || []} />
              <MetadataSection title='学んだこと' items={report.metadata.learnings || []} />
              <MetadataSection
                title='次のアクション'
                items={report.metadata.nextActionItems || []}
              />
            </View>
          )}

          {/* 統計情報 */}
          {report.stats && (
            <View className='mt-2 bg-white p-4'>
              <Text className='mb-3 text-lg font-semibold text-gray-900'>統計</Text>
              <View className='flex-row flex-wrap'>
                {report.stats.totalEstimatedHours > 0 && (
                  <View className='mr-4 mb-2'>
                    <Text className='text-xs text-gray-500'>予定時間</Text>
                    <Text className='text-base font-medium text-gray-900'>
                      {report.stats.totalEstimatedHours}h
                    </Text>
                  </View>
                )}
                {report.stats.totalActualHours > 0 && (
                  <View className='mr-4 mb-2'>
                    <Text className='text-xs text-gray-500'>実績時間</Text>
                    <Text className='text-base font-medium text-gray-900'>
                      {report.stats.totalActualHours}h
                    </Text>
                  </View>
                )}
                <View className='mr-4 mb-2'>
                  <Text className='text-xs text-gray-500'>コメント数</Text>
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
              <Text className='mb-3 text-lg font-semibold text-gray-900'>承認履歴</Text>
              {report.approvals.map((approval: any) => (
                <View key={approval._id} className='mb-2 flex-row items-center'>
                  <CheckCircle size={16} color='#16A34A' />
                  <Text className='ml-2 text-sm text-gray-700'>
                    {approval.manager.name}が承認
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
                  <Text className='mb-1 font-medium text-red-900'>却下理由</Text>
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
              <Text className='ml-2 text-lg font-semibold text-gray-900'>コメント</Text>
            </View>
            {report.comments.length === 0 ? (
              <Text className='text-center text-gray-500'>コメントはありません</Text>
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
                  {isSubmittingAction ? '処理中...' : '提出する'}
                </Text>
              </Pressable>
            </View>
          )}

          {report.status === 'submitted' && (
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
                    {isSubmittingAction ? '処理中...' : '承認'}
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
                    {isSubmittingAction ? '処理中...' : '却下'}
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
              placeholder='コメントを入力...'
              placeholderTextColor='#9CA3AF'
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSendComment}
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
