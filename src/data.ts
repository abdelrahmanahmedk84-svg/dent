/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockItem, ActivityLog, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'د. أحمد صبحي',
    username: 'ahmed_admin',
    password: '123',
    role: 'admin',
    createdAt: '2024-01-10',
  },
  {
    id: 'u2',
    name: 'م. سارة علي',
    username: 'sara_staff',
    password: '123',
    role: 'staff',
    createdAt: '2024-02-15',
  },
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: '1',
    name: 'حشوة ضوئية (Composite) - A2',
    category: 'الحشوات',
    unit: 'حقنة',
    minStockLevel: 5,
    stockByBranch: {
      Tagamoa: 12,
      Mokattam: 3,
      Alexandria: 8,
    },
    lastUpdated: '2024-05-01',
  },
  {
    id: '2',
    name: 'بنج موضعي (Lidocaine)',
    category: 'التخدير',
    unit: 'علبة',
    minStockLevel: 10,
    stockByBranch: {
      Tagamoa: 15,
      Mokattam: 12,
      Alexandria: 4,
    },
    lastUpdated: '2024-05-02',
  },
  {
    id: '3',
    name: 'قفازات طبية (Latex) - Medium',
    category: 'أدوات طبية',
    unit: 'علبة',
    minStockLevel: 20,
    stockByBranch: {
      Tagamoa: 45,
      Mokattam: 18,
      Alexandria: 30,
    },
    lastUpdated: '2024-05-03',
  },
  {
    id: '4',
    name: 'أدوات خلع الأسنان (أساسي)',
    category: 'الأدوات',
    unit: 'طقم',
    minStockLevel: 2,
    stockByBranch: {
      Tagamoa: 5,
      Mokattam: 5,
      Alexandria: 5,
    },
    lastUpdated: '2024-04-20',
  },
  {
    id: '5',
    name: 'سائل تعقيم (Glutaraldehyde)',
    category: 'التعقيم',
    unit: 'لتر',
    minStockLevel: 4,
    stockByBranch: {
      Tagamoa: 2,
      Mokattam: 6,
      Alexandria: 10,
    },
    lastUpdated: '2024-05-05',
  },
];

export const RECENT_ACTIVITY: ActivityLog[] = [
  {
    id: 'a1',
    itemId: '2',
    itemName: 'بنج موضعي (Lidocaine)',
    branch: 'Tagamoa',
    type: 'OUT',
    quantity: 2,
    timestamp: '2024-05-06T10:00:00Z',
    user: 'د. أحمد صبحي',
  },
  {
    id: 'a2',
    itemId: '3',
    itemName: 'قفازات طبية (Latex) - Medium',
    branch: 'Alexandria',
    type: 'IN',
    quantity: 10,
    timestamp: '2024-05-06T09:30:00Z',
    user: 'م. سارة علي',
  },
];
