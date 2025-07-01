'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Doc } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';

function UserRow({ user }: { user: Doc<'userProfiles'> }) {
  const updateUserRole = useMutation(api.users.mutations.updateUserRole);

  const handleRoleChange = async (role: 'user' | 'manager' | 'admin') => {
    try {
      await updateUserRole({ userId: user._id, role });
      toast.success(`${user.name}さんの権限を${role}に変更しました。`);
    } catch (error) {
      console.error(error);
      toast.error('権限の変更に失敗しました。');
    }
  };

  return (
    <TableRow>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Select defaultValue={user.role} onValueChange={handleRoleChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='user'>User</SelectItem>
            <SelectItem value='manager'>Manager</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export function UserManagementContent() {
  const users = useQuery(api.users.queries.listByOrg);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー権限管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>権限</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <UserRow key={user._id} user={user} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
