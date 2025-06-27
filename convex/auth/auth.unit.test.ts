import { describe, expect, test } from 'vitest';
import type { Id } from '../_generated/dataModel';
import type { UserRole } from '../auth/auth';
import { filterByOrg, hasRole } from './auth';

// Mock user data type (simplified)
interface MockUser {
  _id: string;
  role: UserRole;
  orgId: string;
}

describe('認証・権限制御 ヘルパー関数', () => {
  describe('hasRole関数', () => {
    test('viewer権限の正しい判定', () => {
      const viewerUser: MockUser = {
        _id: 'user1',
        role: 'viewer',
        orgId: 'org1',
      };

      expect(hasRole(viewerUser as any, 'viewer')).toBe(true);
      expect(hasRole(viewerUser as any, 'user')).toBe(false);
      expect(hasRole(viewerUser as any, 'manager')).toBe(false);
      expect(hasRole(viewerUser as any, 'admin')).toBe(false);
    });

    test('user権限の正しい判定', () => {
      const normalUser: MockUser = {
        _id: 'user2',
        role: 'user',
        orgId: 'org1',
      };

      expect(hasRole(normalUser as any, 'viewer')).toBe(true);
      expect(hasRole(normalUser as any, 'user')).toBe(true);
      expect(hasRole(normalUser as any, 'manager')).toBe(false);
      expect(hasRole(normalUser as any, 'admin')).toBe(false);
    });

    test('manager権限の正しい判定', () => {
      const managerUser: MockUser = {
        _id: 'user3',
        role: 'manager',
        orgId: 'org1',
      };

      expect(hasRole(managerUser as any, 'viewer')).toBe(true);
      expect(hasRole(managerUser as any, 'user')).toBe(true);
      expect(hasRole(managerUser as any, 'manager')).toBe(true);
      expect(hasRole(managerUser as any, 'admin')).toBe(false);
    });

    test('admin権限の正しい判定', () => {
      const adminUser: MockUser = {
        _id: 'user4',
        role: 'admin',
        orgId: 'org1',
      };

      expect(hasRole(adminUser as any, 'viewer')).toBe(true);
      expect(hasRole(adminUser as any, 'user')).toBe(true);
      expect(hasRole(adminUser as any, 'manager')).toBe(true);
      expect(hasRole(adminUser as any, 'admin')).toBe(true);
    });
  });

  describe('filterByOrg関数', () => {
    test('組織別データフィルタリングが正しく動作', () => {
      const testData = [
        { _id: 'item1', orgId: 'org1' as Id<'orgs'>, name: 'Item 1' },
        { _id: 'item2', orgId: 'org2' as Id<'orgs'>, name: 'Item 2' },
        { _id: 'item3', orgId: 'org1' as Id<'orgs'>, name: 'Item 3' },
        { _id: 'item4', orgId: 'org3' as Id<'orgs'>, name: 'Item 4' },
        { _id: 'item5', orgId: 'org1' as Id<'orgs'>, name: 'Item 5' },
      ];

      const org1Data = filterByOrg(testData, 'org1' as Id<'orgs'>);

      expect(org1Data).toHaveLength(3);
      expect(org1Data[0]!.name).toBe('Item 1');
      expect(org1Data[1]!.name).toBe('Item 3');
      expect(org1Data[2]!.name).toBe('Item 5');

      // 全てのアイテムがorg1に属することを確認
      expect(org1Data.every((item) => item.orgId === ('org1' as Id<'orgs'>))).toBe(true);
    });

    test('存在しない組織IDでフィルタリング', () => {
      const testData = [
        { _id: 'item1', orgId: 'org1' as Id<'orgs'>, name: 'Item 1' },
        { _id: 'item2', orgId: 'org2' as Id<'orgs'>, name: 'Item 2' },
      ];

      const emptyResult = filterByOrg(testData, 'nonexistent' as Id<'orgs'>);
      expect(emptyResult).toHaveLength(0);
    });

    test('空の配列でフィルタリング', () => {
      const emptyData: Array<{ _id: string; orgId: Id<'orgs'>; name: string }> = [];
      const result = filterByOrg(emptyData, 'org1' as Id<'orgs'>);
      expect(result).toHaveLength(0);
    });
  });

  describe('ロール階層の一貫性', () => {
    test('ロール階層の数値が正しく設定されている', () => {
      // hasRole関数内部のロール階層を間接的にテスト
      const roles: UserRole[] = ['viewer', 'user', 'manager', 'admin'];

      // 各ロールが自分以下の権限を持つことを確認
      roles.forEach((role, index) => {
        const testUser = { role } as any;

        // 自分と同等以下の権限は持っている
        for (let i = 0; i <= index; i++) {
          expect(hasRole(testUser, roles[i]!)).toBe(true);
        }

        // 自分より上位の権限は持っていない
        for (let i = index + 1; i < roles.length; i++) {
          expect(hasRole(testUser, roles[i]!)).toBe(false);
        }
      });
    });
  });
});
