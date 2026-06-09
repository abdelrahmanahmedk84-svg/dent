/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export type Branch = 'Tagamoa' | 'Mokattam' | 'Alexandria';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  stockByBranch: Record<Branch, number>;
  lastUpdated: string;
}

export interface ActivityLog {
  id: string;
  itemId: string;
  itemName: string;
  branch: Branch;
  type: 'IN' | 'OUT';
  quantity: number;
  timestamp: string;
  user: string;
}
