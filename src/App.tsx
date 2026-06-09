/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  MapPin, 
  ArrowLeftRight, 
  AlertTriangle,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  Sparkles,
  Users,
  UserPlus,
  Key,
  Image,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { INITIAL_STOCK, RECENT_ACTIVITY, INITIAL_USERS } from './data';
import { Branch, StockItem, User, ActivityLog } from './types';
import { cn } from './lib/utils';
import { getInventoryInsights } from './services/geminiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'activity' | 'users' | 'gallery'>('overview');
  const [selectedBranch, setSelectedBranch] = useState<Branch | 'all'>('all');
  const [items, setItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('denti_items');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('denti_activities');
    return saved ? JSON.parse(saved) : RECENT_ACTIVITY;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('denti_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('denti_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('denti_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('denti_users', JSON.stringify(users));
  }, [users]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<StockItem | null>(null);
  
  const [transferData, setTransferData] = useState({
    from: 'Tagamoa' as Branch,
    to: 'Mokattam' as Branch,
    quantity: 0
  });

  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    name: '',
    category: 'أدوات طبية',
    unit: 'قطعة',
    minStockLevel: 5,
    stockByBranch: { Tagamoa: 0, Mokattam: 0, Alexandria: 0 }
  });

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username);
    
    if (user && user.password === loginForm.password) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) return;

    const addedUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, addedUser]);
    setIsUserModalOpen(false);
    setNewUser({ name: '', username: '', password: '', role: 'staff' });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    const addedItem: StockItem = {
      ...(newItem as StockItem),
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0],
      stockByBranch: newItem.stockByBranch as any
    };

    setItems([...items, addedItem]);
    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      category: 'أدوات طبية',
      unit: 'قطعة',
      minStockLevel: 5,
      stockByBranch: { Tagamoa: 0, Mokattam: 0, Alexandria: 0 }
    });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTransfer || transferData.quantity <= 0) return;
    if (transferData.from === transferData.to) return;

    const sourceStock = selectedItemForTransfer.stockByBranch[transferData.from];
    if (sourceStock < transferData.quantity) {
      alert('الكمية المتاحة في الفرع المصدر غير كافية!');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === selectedItemForTransfer.id) {
        const newStock = { ...item.stockByBranch };
        newStock[transferData.from] -= transferData.quantity;
        newStock[transferData.to] += transferData.quantity;
        return { ...item, stockByBranch: newStock, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return item;
    });

    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: selectedItemForTransfer.id,
      itemName: selectedItemForTransfer.name,
      branch: transferData.to,
      type: 'IN' as const,
      quantity: transferData.quantity,
      timestamp: new Date().toISOString(),
      user: 'مدير المخازن (تحويل)'
    };

    setItems(updatedItems);
    setActivities([newLog, ...activities]);
    setIsTransferModalOpen(false);
    setSelectedItemForTransfer(null);
    setTransferData({ from: 'Tagamoa', to: 'Mokattam', quantity: 0 });
  };

  // Filtered items for search
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Derived stats
  const lowStockItems = useMemo(() => {
    return items.filter(item => {
      const total = (Object.values(item.stockByBranch) as number[]).reduce((a, b) => a + b, 0);
      return total < item.minStockLevel * 1.5; 
    });
  }, [items]);

  const branchStats = useMemo(() => {
    const stats = {
      Tagamoa: 0,
      Mokattam: 0,
      Alexandria: 0
    };
    items.forEach(item => {
      stats.Tagamoa += item.stockByBranch.Tagamoa;
      stats.Mokattam += item.stockByBranch.Mokattam;
      stats.Alexandria += item.stockByBranch.Alexandria;
    });
    return [
      { name: 'التجمع', value: stats.Tagamoa, id: 'Tagamoa' },
      { name: 'المقطم', value: stats.Mokattam, id: 'Mokattam' },
      { name: 'الإسكندرية', value: stats.Alexandria, id: 'Alexandria' }
    ];
  }, [items]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    items.forEach(item => {
      const total = (Object.values(item.stockByBranch) as number[]).reduce((a, b) => a + b, 0);
      stats[item.category] = (stats[item.category] || 0) + total;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [items]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const res = await getInventoryInsights(items);
    setInsights(res);
    setLoadingInsights(false);
  };

  return (
    <div className="min-h-screen bg-medical-bg arabic-rtl font-sans" dir="rtl">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div 
            key="login-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[40px] w-full max-w-lg p-10 shadow-2xl shadow-cyan-900/10 border border-white/50 relative z-10">
              <div className="flex flex-col items-center mb-10">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 3, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-cyan-600/30 mb-6"
                >
                  <Package size={40} />
                </motion.div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">DentiStock</h1>
                <p className="text-slate-500 font-medium text-lg">سجل الدخول لإدارة مخازن العيادة</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mr-1">اسم المستخدم</label>
                  <div className="relative group">
                    <input 
                      required
                      type="text" 
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      placeholder="Username"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-semibold"
                    />
                    <Users size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mr-1">كلمة المرور</label>
                  <div className="relative group">
                    <input 
                      required
                      type="password" 
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-semibold"
                    />
                    <Key size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 transition-colors" />
                  </div>
                </div>

                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2"
                  >
                    <AlertTriangle size={18} />
                    {loginError}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  دخول للنظام
                </button>
              </form>
              
              <div className="mt-8 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 backdrop-blur-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">بيانات تجريبية</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">اسم المستخدم: <span className="font-mono font-bold text-indigo-600">ahmed_admin</span> | كلمة السر: <span className="font-mono font-bold text-indigo-600">123</span></p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-screen"
          >
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-72 bg-white/90 backdrop-blur-2xl border-l border-white/50 z-50 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform lg:translate-x-0 shadow-2xl shadow-indigo-900/5",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div 
          onClick={() => setActiveTab('overview')}
          className="p-8 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-600/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Package size={28} />
          </div>
          <div>
            <h1 className="font-black text-2xl text-slate-900 leading-tight tracking-tight">DentiStock</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Medical Logistics</p>
          </div>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="لوحة التحكم" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="المخزون" 
            active={activeTab === 'inventory'} 
            onClick={() => { setActiveTab('inventory'); setSidebarOpen(false); }}
          />
          <NavItem 
            icon={<ArrowLeftRight size={20} />} 
            label="حركة المخزون" 
            active={activeTab === 'activity'} 
            onClick={() => { setActiveTab('activity'); setSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="المستخدمين" 
            active={activeTab === 'users'} 
            onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Image size={20} />} 
            label="معرض الصور" 
            active={activeTab === 'gallery'} 
            onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }}
          />
          
          <div className="pt-6 pb-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            الفروع
          </div>
          <NavItem 
            icon={<MapPin size={20} className="text-cyan-600" />} 
            label="فرع التجمع" 
            active={selectedBranch === 'Tagamoa'} 
            onClick={() => setSelectedBranch('Tagamoa')}
          />
          <NavItem 
            icon={<MapPin size={20} className="text-cyan-600" />} 
            label="فرع المقطم" 
            active={selectedBranch === 'Mokattam'} 
            onClick={() => setSelectedBranch('Mokattam')}
          />
          <NavItem 
            icon={<MapPin size={20} className="text-cyan-600" />} 
            label="فرع الإسكندرية" 
            active={selectedBranch === 'Alexandria'} 
            onClick={() => setSelectedBranch('Alexandria')}
          />
          <NavItem 
            icon={<div className="w-5 h-5 border-2 border-dashed border-slate-300 rounded" />} 
            label="جميع الفروع" 
            active={selectedBranch === 'all'} 
            onClick={() => setSelectedBranch('all')}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:pr-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/50 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-cyan-50 rounded-xl transition-all text-cyan-600 active:scale-95"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'overview' && 'لوحة التحكم العامة'}
                {activeTab === 'inventory' && 'قائمة المخزون'}
                {activeTab === 'activity' && 'سجل الحركات الأخير'}
                {activeTab === 'users' && 'إدارة المستخدمين'}
                {activeTab === 'gallery' && 'معرض صور العيادة'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server: Connected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl gap-3 w-80 focus-within:ring-4 focus-within:ring-cyan-600/10 focus-within:border-cyan-600 transition-all group">
              <Search size={20} className="text-slate-300 group-focus-within:text-cyan-600 transition-colors" />
              <input 
                type="text" 
                placeholder="بحث عن صنف أو فئة..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="relative p-3 hover:bg-cyan-50 hover:text-cyan-600 rounded-2xl transition-all text-slate-400 active:scale-95">
              <Bell size={24} />
              {lowStockItems.length > 0 && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm ring-2 ring-rose-100" />
              )}
            </button>
            <div className="h-10 w-px bg-slate-100 mx-2 hidden lg:block" />
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-left">
                 <p className="text-sm font-black text-slate-900 leading-none mb-1">{currentUser?.name || 'Doctor'}</p>
                 <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest leading-none">
                    {currentUser?.role === 'admin' ? 'Administrative Access' : 'Medical Staff'}
                 </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative group cursor-pointer active:scale-95 transition-all" onClick={handleLogout}>
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'doctor'}`} alt="User" />
                 <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white ring-2 ring-inset ring-white/20">
                    <X size={18} className="mb-1" />
                    <span className="text-[8px] font-black uppercase">Logout</span>
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Hero Banner */}
              <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-lg group">
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28705fe473c7?q=80&w=2000&auto=format&fit=crop" 
                  alt="Modern Dental Clinic" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-slate-900/80 via-slate-900/40 to-transparent flex flex-col justify-center px-10 text-white">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl font-black mb-2">مرحباً دكتور،</h1>
                    <p className="text-cyan-100 font-medium opacity-90 max-w-md">أهلاً بك في نظام DentiStock. الحالة العامة للمخازن اليوم مستقرة في جميع الفروع.</p>
                  </motion.div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="إجمالي الأصناف" 
                  value={items.length} 
                  icon={<Package className="text-cyan-600" />} 
                  color="cyan"
                />
                <StatCard 
                  title="أصناف منخفضة" 
                  value={lowStockItems.length} 
                  icon={<AlertTriangle className="text-amber-500" />} 
                  color="amber"
                  isWarning={lowStockItems.length > 0}
                />
                <StatCard 
                  title="إجمالي الوحدات" 
                  value={branchStats.reduce((a, b) => a + b.value, 0)} 
                  icon={<ArrowLeftRight className="text-indigo-500" />} 
                  color="indigo"
                />
                <button 
                  disabled={loadingInsights}
                  onClick={fetchInsights}
                  className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between items-start transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/10 group disabled:opacity-50"
                >
                  <Sparkles size={24} className={cn("text-cyan-400 mb-2", loadingInsights && "animate-pulse")} />
                  <div className="text-right w-full">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">AI INSIGHTS</p>
                    <p className="font-bold text-lg group-hover:text-cyan-300 transition-colors">تحليل ذكي للمخزون</p>
                  </div>
                </button>
              </div>

              {/* Insights Section */}
              <AnimatePresence>
                {insights && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-cyan-50 border border-cyan-100 rounded-3xl p-6 relative shadow-inner overflow-hidden"
                  >
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-100/50 rounded-full blur-3xl" />
                    <button 
                      onClick={() => setInsights(null)}
                      className="absolute top-4 left-4 p-2 hover:bg-cyan-100 rounded-full transition-colors z-10"
                    >
                      <X size={16} className="text-cyan-600" />
                    </button>
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-cyan-600">
                        <Sparkles size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-cyan-900 mb-3 text-lg">توصيات المساعد الذكي</h3>
                        <div className="text-cyan-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {insights}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Branch Images Quick View */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BranchImageCard 
                  name="فرع التجمع" 
                  img="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=800&auto=format&fit=crop"
                />
                <BranchImageCard 
                  name="فرع المقطم" 
                  img="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop"
                />
                <BranchImageCard 
                  name="فرع الإسكندرية" 
                  img="https://images.unsplash.com/photo-126277914800-4b95eb9c0a1a?q=80&w=800&auto=format&fit=crop" 
                  fallbackImg="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=800&auto=format&fit=crop"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-slate-800 mb-8 text-lg">توزيع المخزون حسب الفروع</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchStats} layout="vertical" barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                          {branchStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0891b2', '#4338ca', '#fb7185'][index % 3]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-slate-800 mb-8 text-lg">المخزون حسب الفئة</h3>
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0891b2', '#4338ca', '#fb7185', '#06b6d4', '#4f46e5'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-800">{items.length}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نوع</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pb-10">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-8 text-lg flex items-center gap-3">
                    <AlertTriangle className="text-amber-500" />
                    تنبيهات الأصناف الحرجة
                  </h3>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-amber-500/20",
                            "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                          )}>
                             <AlertTriangle size={24} />
                          </div>
                          <div>
                            <span className="block text-lg font-black text-slate-800 tracking-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{item.category}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-black text-amber-700 bg-amber-100/50 px-4 py-2 rounded-2xl border border-amber-200 backdrop-blur-sm shadow-sm">
                             {(Object.values(item.stockByBranch) as number[]).reduce((a, b) => a + b, 0)} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Package size={48} className="mb-4 opacity-10" />
                        <p className="text-sm font-medium">المخزون متوازن حالياً</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
            >
               <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 hover:bg-cyan-700 transition-all active:scale-95"
                  >
                    <Plus size={18} />
                    إضافة صنف
                  </button>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-xs font-bold text-slate-400 ml-2">تصفية حسب:</div>
                   <select 
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-600/10 transition-all"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as any)}
                  >
                    <option value="all">جميع الفروع</option>
                    <option value="Tagamoa">فرع التجمع</option>
                    <option value="Mokattam">فرع المقطم</option>
                    <option value="Alexandria">فرع الإسكندرية</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">معلومات الصنف</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">الفئة</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">المخزون الحالي</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الحد الأدنى</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(item => {
                      const stockValue = selectedBranch === 'all' 
                        ? (Object.values(item.stockByBranch) as number[]).reduce((a, b) => a + b, 0)
                        : item.stockByBranch[selectedBranch as Branch];
                      
                      const isLow = stockValue < item.minStockLevel;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1">تحديث: {item.lastUpdated}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={cn(
                              "font-bold text-base px-3 py-1 rounded-full",
                              isLow ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50"
                            )}>
                              {stockValue}
                              <span className="text-[10px] mr-1 opacity-70 font-medium">{item.unit}</span>
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-sm font-semibold text-slate-500">
                            {item.minStockLevel} {item.unit}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  setSelectedItemForTransfer(item);
                                  setIsTransferModalOpen(true);
                                }}
                                className="text-cyan-600 hover:bg-cyan-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              >
                                تحويل
                              </button>
                              <button className="text-slate-400 hover:text-cyan-600 p-2 rounded-lg hover:bg-cyan-50 transition-all">
                                تعديل
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
             >
                <div className="space-y-8 max-w-2xl mx-auto">
                  {activities.map((log, idx) => (
                    <div key={log.id} className="flex gap-6 relative">
                      {idx !== RECENT_ACTIVITY.length - 1 && (
                        <div className="absolute top-12 right-[23px] bottom-0 w-1 bg-slate-100 rounded-full" />
                      )}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-md z-10 transition-transform hover:scale-110",
                        log.type === 'IN' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {log.type === 'IN' ? <Plus size={24} /> : <div className="rotate-180"><ArrowLeftRight size={24} className="-rotate-90" /></div>}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{log.itemName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                             قام السيد/ <span className="font-bold text-slate-900 border-b-2 border-cyan-100">{log.user}</span> 
                             بـ <span className={cn("font-bold px-1.5 rounded-md", log.type === 'IN' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                               {log.type === 'IN' ? 'إضافة' : 'صرف'} 
                             </span>
                             كمية قدرها <span className="font-black text-slate-900">{log.quantity}</span> وحدة مخزنية.
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                             <MapPin size={14} className="text-slate-400" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                فرع {log.branch === 'Tagamoa' ? 'التجمع' : log.branch === 'Mokattam' ? 'المقطم' : 'الإسكندرية'}
                             </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
            >
              <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <UserPlus size={18} />
                    إضافة مستخدم جديد
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">الاسم</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">اسم المستخدم</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الصلاحية</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">تاريخ الإنشاء</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="font-bold text-slate-800">{user.name}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-mono text-slate-600">{user.username}</div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold border",
                            user.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                          )}>
                            {user.role === 'admin' ? 'مدير' : 'موظف'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-500">
                          {user.createdAt}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <div className="py-10">
              <Gallery3D />
            </div>
          )}
        </div>
      </main>
      </motion.div>
      )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-xl p-8 relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-cyan-600" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-800">إضافة صنف جديد للمخزن</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">اسم الصنف</label>
                    <input 
                      required
                      type="text" 
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="مثال: حشوة ضوئية"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600/20 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الفئة</label>
                    <select 
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600/20 transition-all font-semibold"
                    >
                      <option>الحشوات</option>
                      <option>التخدير</option>
                      <option>أدوات طبية</option>
                      <option>الأدوات</option>
                      <option>التعقيم</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">كمية التجمع</label>
                    <input 
                      type="number" 
                      value={newItem.stockByBranch?.Tagamoa}
                      onChange={(e) => setNewItem({
                        ...newItem, 
                        stockByBranch: { ...newItem.stockByBranch!, Tagamoa: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600/20 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">كمية المقطم</label>
                    <input 
                      type="number" 
                      value={newItem.stockByBranch?.Mokattam}
                      onChange={(e) => setNewItem({
                        ...newItem, 
                        stockByBranch: { ...newItem.stockByBranch!, Mokattam: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600/20 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">كمية الإسكندرية</label>
                    <input 
                      type="number" 
                      value={newItem.stockByBranch?.Alexandria}
                      onChange={(e) => setNewItem({
                        ...newItem, 
                        stockByBranch: { ...newItem.stockByBranch!, Alexandria: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600/20 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-cyan-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all active:scale-[0.98]"
                  >
                    حفظ الصنف
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferModalOpen && selectedItemForTransfer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-indigo-600" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">تحويل مخزون</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedItemForTransfer.name}</p>
                </div>
                <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleTransfer} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">من فرع</label>
                    <select 
                      value={transferData.from}
                      onChange={(e) => setTransferData({...transferData, from: e.target.value as Branch})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold"
                    >
                      <option value="Tagamoa">فرع التجمع ({selectedItemForTransfer.stockByBranch.Tagamoa})</option>
                      <option value="Mokattam">فرع المقطم ({selectedItemForTransfer.stockByBranch.Mokattam})</option>
                      <option value="Alexandria">فرع الإسكندرية ({selectedItemForTransfer.stockByBranch.Alexandria})</option>
                    </select>
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-white p-2 border border-slate-200 rounded-full shadow-sm text-indigo-600">
                       <ArrowLeftRight size={20} className="rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">إلى فرع</label>
                    <select 
                      value={transferData.to}
                      onChange={(e) => setTransferData({...transferData, to: e.target.value as Branch})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold"
                    >
                      <option value="Tagamoa">فرع التجمع</option>
                      <option value="Mokattam">فرع المقطم</option>
                      <option value="Alexandria">فرع الإسكندرية</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الكمية المراد تحويلها</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required
                        min="1"
                        max={selectedItemForTransfer.stockByBranch[transferData.from]}
                        value={transferData.quantity || ''}
                        onChange={(e) => setTransferData({...transferData, quantity: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-lg pr-4 pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{selectedItemForTransfer.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    إتمام التحويل
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-indigo-600" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-800">إضافة مستخدم جديد</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الاسم بالكامل</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="مثال: د. محمد علي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">اسم المستخدم</label>
                    <div className="relative">
                       <input 
                        required
                        type="text" 
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold pr-4"
                      />
                      <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">كلمة المرور</label>
                    <div className="relative">
                      <input 
                        required
                        type="password" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold pr-4"
                      />
                      <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الصلاحية</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'staff'})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold"
                    >
                      <option value="staff">موظف (إدارة المخزن فقط)</option>
                      <option value="admin">مدير (تحكم كامل)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    حفظ المستخدم
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BranchImageCard({ name, img, fallbackImg }: { name: string, img: string, fallbackImg?: string }) {
  const [src, setSrc] = React.useState(img);
  
  return (
    <div className="group relative h-40 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
      <img 
        src={src} 
        onError={() => fallbackImg && setSrc(fallbackImg)}
        alt={name} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-5">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={16} className="text-cyan-400" />
          <span className="font-bold text-sm">{name}</span>
        </div>
      </div>
    </div>
  );
}

// 3D Gallery Component
const GALLERY_ITEMS = [
  {
    id: 1,
    title: "موقع العيادة",
    subtitle: "إطلالة جوية لمقرنا المتميزة في قلب المدينة",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
    category: "المقر"
  },
  {
    id: 2,
    title: "د. أحمد صبحي",
    subtitle: "كبير أطباء الأسنان بخبرة تتجاوز 15 عاماً",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1200&auto=format&fit=crop",
    category: "الأطباء"
  },
  {
    id: 3,
    title: "غرفة الكشف",
    subtitle: "أحدث التجهيزات الرقمية لضمان أدق النتائج",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1200&auto=format&fit=crop",
    category: "العيادة"
  },
  {
    id: 4,
    title: "فريق العمل الطبي",
    subtitle: "نخبة من الممارسين المتخصصين لخدمتكم",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1536780?q=80&w=1200&auto=format&fit=crop",
    category: "الفريق"
  }
];

function Gallery3D() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % GALLERY_ITEMS.length);
  const prev = () => setIndex((prev) => (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);

  return (
    <div className="relative h-[550px] w-full flex items-center justify-center overflow-hidden [perspective:1200px]">
      <div className="flex items-center justify-center relative w-full max-w-4xl h-full">
        <AnimatePresence initial={false}>
          {GALLERY_ITEMS.map((item, i) => {
            const distance = (i - index + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
            const normalizedDistance = distance > GALLERY_ITEMS.length / 2 ? distance - GALLERY_ITEMS.length : distance;
            
            // Logic for visible cards
            const isVisible = Math.abs(normalizedDistance) <= 2;
            if (!isVisible) return null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.5, x: 200 }}
                animate={{
                  opacity: 1 - Math.abs(normalizedDistance) * 0.3,
                  scale: 1 - Math.abs(normalizedDistance) * 0.15,
                  x: normalizedDistance * 340,
                  z: -Math.abs(normalizedDistance) * 200,
                  rotateY: normalizedDistance * -25,
                  zIndex: 10 - Math.abs(normalizedDistance),
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="absolute w-[320px] md:w-[400px] aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white cursor-pointer group bg-white"
              >
                <img 
                  src={item.image} 
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-2">{item.category}</span>
                  <h3 className="text-3xl font-black mb-1 leading-tight">{item.title}</h3>
                  <p className="text-slate-300 font-medium">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-8 z-50">
        <button 
          onClick={prev}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-indigo-600 transition-all shadow-xl active:scale-95"
        >
          <ChevronRight size={32} />
        </button>
        <div className="flex gap-2">
          {GALLERY_ITEMS.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === index ? "w-8 bg-cyan-500" : "w-2 bg-white/20"
              )}
            />
          ))}
        </div>
        <button 
          onClick={next}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-indigo-600 transition-all shadow-xl active:scale-95"
        >
          <ChevronLeft size={32} />
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-500 relative group overflow-hidden",
        active 
          ? "bg-gradient-to-r from-cyan-50 to-indigo-50/30 text-cyan-900 shadow-md shadow-cyan-600/5 ring-1 ring-cyan-100" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold"
      )}
    >
      <span className={cn(
        "transition-all duration-500 group-hover:scale-125 group-hover:rotate-6",
        active ? "text-cyan-600 animate-pulse" : "text-slate-300 group-hover:text-slate-500"
      )}>
        {icon}
      </span>
      <span className={cn("text-sm tracking-tight", active ? "font-black" : "font-bold opacity-80 group-hover:opacity-100")}>{label}</span>
      
      {active && (
        <>
          <motion.div 
            layoutId="nav-active-accent"
            className="absolute inset-y-4 right-0 w-1.5 bg-gradient-to-b from-cyan-500 to-indigo-600 rounded-l-full"
          />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-50" />
        </>
      )}
    </button>
  );
}

function StatCard({ title, value, icon, color, isWarning }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: 'cyan' | 'amber' | 'indigo',
  isWarning?: boolean
}) {
  const themes = {
    cyan: 'from-cyan-500/10 to-cyan-600/5 text-cyan-600 ring-cyan-50 border-cyan-100',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 ring-amber-50 border-amber-100',
    indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 ring-indigo-50 border-indigo-100',
  };

  const iconColors = {
    cyan: 'bg-cyan-600 text-white shadow-cyan-600/20',
    amber: 'bg-amber-500 text-white shadow-amber-600/20',
    indigo: 'bg-indigo-600 text-white shadow-indigo-600/20',
  };

  return (
    <div className={cn(
      "bg-white p-7 rounded-[32px] border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-900/10 hover:-translate-y-1.5 group relative overflow-hidden",
      isWarning && "border-amber-200"
    )}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", themes[color])} />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={cn("p-3.5 rounded-2xl transition-all duration-500 scale-100 group-hover:scale-110 shadow-lg", iconColors[color])}>
          {icon}
        </div>
        {isWarning && (
          <span className="flex h-4 w-4 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 shadow-md ring-2 ring-white"></span>
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-slate-600 transition-colors">{title}</h4>
        <p className="text-4xl font-black text-slate-900 group-hover:text-slate-950 transition-colors flex items-baseline gap-2 tabular-nums">
          {value}
          {typeof value === 'number' && <span className="text-xs font-bold text-slate-300 group-hover:text-slate-400">وحدة</span>}
        </p>
      </div>

      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-slate-50/50 rounded-full blur-2xl group-hover:bg-white transition-all duration-700" />
    </div>
  );
}
