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
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';

interface UserWithClerkInfo extends Doc<'userProfiles'> {
  clerkUser?: {
    fullName: string | null;
    emailAddresses: { emailAddress: string }[];
  };
}

function UserRow({
  user,
  onRoleChange,
}: {
  user: UserWithClerkInfo;
  onRoleChange: (role: 'user' | 'manager' | 'admin') => void;
}) {
  const displayName = user.clerkUser?.fullName ?? 'Unknown User';
  const displayEmail = user.clerkUser?.emailAddresses[0]?.emailAddress ?? 'No email';

  return (
    <TableRow>
      <TableCell>{displayName}</TableCell>
      <TableCell>{displayEmail}</TableCell>
      <TableCell>
        <Select defaultValue={user.role} onValueChange={onRoleChange}>
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
  const users = useQuery(api.users.queries.listByOrg) as UserWithClerkInfo[] | undefined;
  const updateUserRole = useMutation(api.users.mutations.updateUserRole);

  const handleRoleChange = async (
    userId: Id<'userProfiles'>,
    displayName: string,
    role: 'user' | 'manager' | 'admin'
  ) => {
    try {
      await updateUserRole({ userId, role });
      toast.success(`${displayName}さんの権限を${role}に変更しました。`);
    } catch (error) {
      console.error(error);
      toast.error('権限の変更に失敗しました。');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー権限管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <div className='hidden md:block'>
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
                  <UserRow
                    key={user._id}
                    user={user}
                    onRoleChange={(role) =>
                      handleRoleChange(user._id, user.clerkUser?.fullName ?? 'Unknown User', role)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='md:hidden divide-y'>
            {users?.map((user) => (
              <div key={user._id} className='p-4 space-y-2'>
                <div className='flex justify-between items-center'>
                  <p className='font-semibold'>{user.clerkUser?.fullName ?? 'Unknown User'}</p>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(role) =>
                      handleRoleChange(
                        user._id,
                        user.clerkUser?.fullName ?? 'Unknown User',
                        role as 'user' | 'manager' | 'admin'
                      )
                    }
                  >
                    <SelectTrigger className='w-[120px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='user'>User</SelectItem>
                      <SelectItem value='manager'>Manager</SelectItem>
                      <SelectItem value='admin'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {user.clerkUser?.emailAddresses[0]?.emailAddress ?? 'No Email'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
