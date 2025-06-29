'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProjectsAdminPage() {
  const projects = useQuery(api.index.listProjects);
  const createProject = useMutation(api.index.createProject);
  const deleteProject = useMutation(api.index.deleteProject);
  const updateProject = useMutation(api.index.updateProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Doc<'projects'> | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('プロジェクト名を入力してください');
      return;
    }
    setIsCreating(true);
    try {
      const payload: any = { name: name.trim() };
      if (description.trim()) {
        payload.description = description.trim();
      }
      await createProject(payload);
      setName('');
      setDescription('');
      toast.success('プロジェクトを作成しました');
    } catch (err: any) {
      toast.error(err?.message ?? '作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (projectId: Id<'projects'>) => {
    if (!confirm('本当に削除しますか？')) {
      return;
    }
    try {
      await deleteProject({ projectId });
      toast.success('削除しました');
    } catch (err: any) {
      toast.error(err?.message ?? '削除に失敗しました');
    }
  };

  const openEdit = (project: Doc<'projects'>) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description ?? '');
  };

  const handleUpdate = async () => {
    if (!editingProject) {
      return;
    }
    if (!name.trim()) {
      toast.error('プロジェクト名を入力してください');
      return;
    }
    try {
      const payload: any = { projectId: editingProject._id };
      if (name.trim() !== editingProject.name) {
        payload.name = name.trim();
      }
      if (description.trim() !== (editingProject.description ?? '')) {
        payload.description = description.trim();
      }
      await updateProject(payload);
      toast.success('更新しました');
      setEditingProject(null);
      setName('');
      setDescription('');
    } catch (err: any) {
      toast.error(err?.message ?? '更新に失敗しました');
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-6'>プロジェクト管理</h1>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>新規プロジェクト</CardTitle>
          <CardDescription>組織に新しいプロジェクトを追加します</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Input
            placeholder='プロジェクト名'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='説明 (任意)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={isCreating}>
            作成
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>プロジェクト一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {projects === undefined && <p>読み込み中...</p>}
          {projects && projects.length === 0 && <p>プロジェクトがありません</p>}
          {projects && projects.length > 0 && (
            <ul className='space-y-2'>
              {projects.map((project: Doc<'projects'>) => (
                <li
                  key={project._id}
                  className='flex items-start justify-between gap-4 rounded-md border p-3 hover:bg-muted'
                >
                  <div className='grow'>
                    <p className='font-medium'>{project.name}</p>
                    {project.description && (
                      <p className='text-sm text-muted-foreground'>{project.description}</p>
                    )}
                    <Link
                      href={`/admin/projects/${project._id}/categories`}
                      className='text-xs text-primary underline'
                    >
                      作業区分を管理 »
                    </Link>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button variant='ghost' size='icon' onClick={() => openEdit(project)}>
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>編集</span>
                    </Button>
                    <Button variant='ghost' size='icon' onClick={() => handleDelete(project._id)}>
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
      <Dialog open={editingProject !== null} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクトを編集</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='プロジェクト名'
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='説明 (任意)'
            />
          </div>
          <DialogFooter className='pt-4'>
            <Button variant='outline' onClick={() => setEditingProject(null)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
