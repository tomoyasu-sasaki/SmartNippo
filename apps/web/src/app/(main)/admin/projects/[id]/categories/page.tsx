'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CategoriesAdminPage() {
  const params = useParams();
  const projectId = params.id as Id<'projects'>;

  const project = useQuery(api.index.listProjects)?.find((p) => p._id === projectId);
  const categories = useQuery(api.index.listWorkCategories, { projectId });
  const createCategory = useMutation(api.index.createWorkCategory);
  const deleteCategory = useMutation(api.index.deleteWorkCategory);
  const updateCategory = useMutation(api.index.updateWorkCategory);

  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Doc<'workCategories'> | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('作業区分名を入力してください');
      return;
    }
    setIsCreating(true);
    try {
      await createCategory({ projectId, name: name.trim() });
      setName('');
      toast.success('作業区分を追加しました');
    } catch (err: any) {
      toast.error(err?.message ?? '追加に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (categoryId: Id<'workCategories'>) => {
    if (!confirm('本当に削除しますか？')) {
      return;
    }
    try {
      await deleteCategory({ workCategoryId: categoryId });
      toast.success('削除しました');
    } catch (err: any) {
      toast.error(err?.message ?? '削除に失敗しました');
    }
  };

  const openEdit = (cat: Doc<'workCategories'>) => {
    setEditingCategory(cat);
    setName(cat.name);
  };

  const handleUpdate = async () => {
    if (!editingCategory) {
      return;
    }
    if (!name.trim()) {
      toast.error('作業区分名を入力してください');
      return;
    }
    try {
      if (name.trim() !== editingCategory.name) {
        await updateCategory({ workCategoryId: editingCategory._id, name: name.trim() });
      }
      toast.success('更新しました');
      setEditingCategory(null);
      setName('');
    } catch (err: any) {
      toast.error(err?.message ?? '更新に失敗しました');
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <Link href='/admin/projects' className='text-sm underline mb-4 inline-block'>
        ← プロジェクト管理へ戻る
      </Link>
      <h1 className='text-3xl font-bold mb-6'>作業区分管理: {project?.name ?? ''}</h1>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>新規作業区分</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Input placeholder='作業区分名' value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={handleCreate} disabled={isCreating} variant='outline'>
            追加
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>作業区分一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {categories === undefined && <p>読み込み中...</p>}
          {categories && categories.length === 0 && <p>作業区分がありません</p>}
          {categories && categories.length > 0 && (
            <ul className='space-y-2'>
              {categories.map((cat: Doc<'workCategories'>) => (
                <li
                  key={cat._id}
                  className='flex items-start justify-between gap-4 rounded-md border p-3 hover:bg-muted'
                >
                  <p className='grow'>{cat.name}</p>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button variant='ghost' size='icon' onClick={() => openEdit(cat)}>
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>編集</span>
                    </Button>
                    <Button variant='ghost' size='icon' onClick={() => handleDelete(cat._id)}>
                      <Trash2 className='h-4 w-4 text-destructive' />
                      <span className='sr-only'>削除</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingCategory !== null} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className='bg-[var(--background)]'>
          <DialogHeader>
            <DialogTitle>作業区分を編集</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='作業区分名' />
          <DialogFooter className='pt-4'>
            <Button variant='outline' onClick={() => setEditingCategory(null)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate} variant='outline'>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
