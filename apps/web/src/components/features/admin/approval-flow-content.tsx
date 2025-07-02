'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

function AddApprovalFlowForm({
  projectId,
  users,
  onSuccess,
}: {
  projectId: Id<'projects'>;
  users: Doc<'userProfiles'>[];
  onSuccess: () => void;
}) {
  const [selectedApprover, setSelectedApprover] = useState<Id<'userProfiles'> | null>(null);
  const setFlow = useMutation(api.approvalFlows.mutations.set);

  const handleSubmit = async () => {
    if (!selectedApprover) {
      return;
    }
    await setFlow({ projectId, approverId: selectedApprover });
    onSuccess();
  };

  return (
    <div className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>承認者</label>
        <Select onValueChange={(value) => setSelectedApprover(value as Id<'userProfiles'>)}>
          <SelectTrigger>
            <SelectValue placeholder='承認者を選択...' />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: Doc<'userProfiles'>) => (
              <SelectItem key={user._id} value={user._id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSubmit} disabled={!selectedApprover} variant='outline'>
        追加
      </Button>
    </div>
  );
}

export function ApprovalFlowContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<Id<'projects'> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projects = useQuery(api.projects.queries.listProjects);
  const approvers = useQuery(api.users.queries.listApproversByOrg);
  const approvalFlows = useQuery(
    api.approvalFlows.queries.listByProject,
    selectedProjectId ? { projectId: selectedProjectId } : 'skip'
  );
  const removeFlow = useMutation(api.approvalFlows.mutations.remove);

  const handleRemove = (flowId: Id<'approvalFlows'>) => {
    removeFlow({ flowId });
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>承認フロールール</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedProjectId} variant='outline'>
              <PlusCircle className='mr-2 h-4 w-4' />
              ルールを追加
            </Button>
          </DialogTrigger>
          <DialogContent className='bg-[var(--background)]'>
            <DialogHeader>
              <DialogTitle>新しい承認ルール</DialogTitle>
            </DialogHeader>
            {selectedProjectId && approvers && (
              <AddApprovalFlowForm
                projectId={selectedProjectId}
                users={approvers}
                onSuccess={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className='mb-4'>
          <Select onValueChange={(value) => setSelectedProjectId(value as Id<'projects'>)}>
            <SelectTrigger>
              <SelectValue placeholder='プロジェクトを選択してください' />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p: Doc<'projects'>) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='rounded-md border'>
          <div className='hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>承認者</TableHead>
                  <TableHead>申請者 (指定時)</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalFlows?.map((flow) => (
                  <TableRow key={flow._id}>
                    <TableCell>{flow.approver?.name ?? 'N/A'}</TableCell>
                    <TableCell>{flow.applicant?.name ?? '全員'}</TableCell>
                    <TableCell>
                      <Button variant='ghost' size='icon' onClick={() => handleRemove(flow._id)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedProjectId && approvalFlows?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center'>
                      承認ルールが設定されていません。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className='md:hidden divide-y'>
            {approvalFlows?.map((flow) => (
              <div key={flow._id} className='p-4 flex justify-between items-center'>
                <div>
                  <p className='font-semibold'>{flow.approver?.name ?? 'N/A'}</p>
                  <p className='text-sm text-muted-foreground'>
                    申請者: {flow.applicant?.name ?? '全員'}
                  </p>
                </div>
                <Button variant='ghost' size='icon' onClick={() => handleRemove(flow._id)}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}
            {selectedProjectId && approvalFlows?.length === 0 && (
              <p className='text-center py-4 text-sm text-muted-foreground'>
                承認ルールが設定されていません。
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
