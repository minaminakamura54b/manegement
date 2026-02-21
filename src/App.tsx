/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Plane, 
  FileText, 
  Users, 
  LogOut, 
  Plus, 
  ChevronRight,
  Search,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type View = 'dashboard' | 'inspections' | 'trip-reports' | 'estimates' | 'minutes';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Inspection {
  id: number;
  project_name: string;
  date: string;
  location: string;
  findings: string;
  status: 'pending' | 'completed' | 'urgent';
}

interface TripReport {
  id: number;
  destination: string;
  date_start: string;
  date_end: string;
  purpose: string;
  results: string;
  expenses: number;
}

interface Estimate {
  id: number;
  client_name: string;
  project_name: string;
  amount: number;
  details: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
}

interface Minute {
  id: number;
  title: string;
  date: string;
  attendees: string;
  content: string;
  action_items: string;
}

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string; key?: React.Key }) => (
  <div className={cn("bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    <input 
      {...props}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
    />
  </div>
);

const TextArea = ({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    <textarea 
      {...props}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all min-h-[100px]"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label: string, options: { value: string, label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    <select 
      {...props}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [tripReports, setTripReports] = useState<TripReport[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [minutes, setMinutes] = useState<Minute[]>([]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, view]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const endpoints = {
        inspections: '/api/inspections',
        'trip-reports': '/api/trip-reports',
        estimates: '/api/estimates',
        minutes: '/api/minutes',
        dashboard: '/api/inspections' // Just for some initial data
      };
      
      const res = await fetch(endpoints[view]);
      if (res.ok) {
        const data = await res.json();
        if (view === 'inspections') setInspections(data);
        if (view === 'trip-reports') setTripReports(data);
        if (view === 'estimates') setEstimates(data);
        if (view === 'minutes') setMinutes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        alert('ログインに失敗しました');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setView('dashboard');
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
  </div>;

  if (!user) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-zinc-200 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">建設管理 Pro</h1>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Enterprise</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="ダッシュボード" 
              active={view === 'dashboard'} 
              onClick={() => setView('dashboard')} 
            />
            <NavItem 
              icon={<ClipboardCheck size={20} />} 
              label="現場点検記録" 
              active={view === 'inspections'} 
              onClick={() => setView('inspections')} 
            />
            <NavItem 
              icon={<Plane size={20} />} 
              label="出張報告" 
              active={view === 'trip-reports'} 
              onClick={() => setView('trip-reports')} 
            />
            <NavItem 
              icon={<FileText size={20} />} 
              label="見積もり" 
              active={view === 'estimates'} 
              onClick={() => setView('estimates')} 
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="打ち合わせ議事録" 
              active={view === 'minutes'} 
              onClick={() => setView('minutes')} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100">
            <div className="flex items-center gap-3 mb-6 px-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-zinc-400">管理者</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
              <LogOut size={18} />
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">{
              view === 'dashboard' ? 'ダッシュボード' :
              view === 'inspections' ? '現場点検記録' :
              view === 'trip-reports' ? '出張報告' :
              view === 'estimates' ? '見積もり' : '打ち合わせ議事録'
            }</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="検索..." 
                className="pl-10 pr-4 py-2 bg-zinc-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-zinc-900/5 transition-all w-64"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              新規作成
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <DashboardView inspections={inspections} />}
              {view === 'inspections' && <InspectionsList data={inspections} />}
              {view === 'trip-reports' && <TripReportsList data={tripReports} />}
              {view === 'estimates' && <EstimatesList data={estimates} />}
              {view === 'minutes' && <MinutesList data={minutes} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">新規{
                    view === 'inspections' ? '現場点検記録' :
                    view === 'trip-reports' ? '出張報告' :
                    view === 'estimates' ? '見積もり' : '打ち合わせ議事録'
                  }</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  
                  const endpoint = `/api/${view}`;
                  const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  
                  if (res.ok) {
                    setIsModalOpen(false);
                    fetchData();
                  }
                }} className="space-y-6">
                  {view === 'inspections' && (
                    <>
                      <Input label="プロジェクト名" name="project_name" required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="点検日" name="date" type="date" required />
                        <Input label="場所" name="location" required />
                      </div>
                      <TextArea label="点検内容・指摘事項" name="findings" required />
                      <Select label="ステータス" name="status" options={[
                        { value: 'pending', label: '対応待ち' },
                        { value: 'completed', label: '完了' },
                        { value: 'urgent', label: '至急' }
                      ]} />
                    </>
                  )}
                  {view === 'trip-reports' && (
                    <>
                      <Input label="目的地" name="destination" required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="開始日" name="date_start" type="date" required />
                        <Input label="終了日" name="date_end" type="date" required />
                      </div>
                      <Input label="目的" name="purpose" required />
                      <TextArea label="結果・成果" name="results" required />
                      <Input label="経費 (円)" name="expenses" type="number" required />
                    </>
                  )}
                  {view === 'estimates' && (
                    <>
                      <Input label="顧客名" name="client_name" required />
                      <Input label="プロジェクト名" name="project_name" required />
                      <Input label="金額 (円)" name="amount" type="number" required />
                      <TextArea label="詳細・内訳" name="details" required />
                      <Select label="ステータス" name="status" options={[
                        { value: 'draft', label: '下書き' },
                        { value: 'sent', label: '送付済み' },
                        { value: 'approved', label: '承認' },
                        { value: 'rejected', label: '却下' }
                      ]} />
                    </>
                  )}
                  {view === 'minutes' && (
                    <>
                      <Input label="会議タイトル" name="title" required />
                      <Input label="開催日" name="date" type="date" required />
                      <Input label="出席者" name="attendees" placeholder="氏名をカンマ区切りで入力" required />
                      <TextArea label="会議内容" name="content" required />
                      <TextArea label="アクションアイテム" name="action_items" required />
                    </>
                  )}
                  {view === 'dashboard' && <p className="text-zinc-500">ダッシュボードからは作成できません。各メニューから作成してください。</p>}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>キャンセル</Button>
                    <Button type="submit">保存する</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Views ---

function LoginView({ onLogin }: { onLogin: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-200">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <ClipboardCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">建設管理 Pro</h1>
            <p className="text-zinc-400 mt-2 font-medium">業務効率を最大化するプラットフォーム</p>
          </div>

          <form onSubmit={onLogin} className="space-y-6">
            <Input label="ユーザー名" name="username" placeholder="admin" required />
            <Input label="パスワード" name="password" type="password" placeholder="••••••••" required />
            <Button type="submit" className="w-full py-4 text-lg rounded-2xl shadow-lg shadow-zinc-900/10">
              ログイン
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
              © 2026 Construction Management Pro Inc.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
        active 
          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      <span className={cn("transition-colors", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function DashboardView({ inspections }: { inspections: Inspection[] }) {
  const stats = [
    { label: '進行中の点検', value: inspections.filter(i => i.status === 'pending').length, icon: <Clock className="text-amber-500" />, color: 'bg-amber-50' },
    { label: '完了した点検', value: inspections.filter(i => i.status === 'completed').length, icon: <CheckCircle2 className="text-emerald-500" />, color: 'bg-emerald-50' },
    { label: '至急対応', value: inspections.filter(i => i.status === 'urgent').length, icon: <AlertCircle className="text-red-500" />, color: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.color)}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 28 })}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">最近の点検記録</h3>
            <Button variant="ghost" className="text-zinc-400">すべて見る</Button>
          </div>
          <div className="space-y-6">
            {inspections.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.status === 'urgent' ? 'bg-red-500' : 
                    item.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                  )} />
                  <div>
                    <p className="font-bold group-hover:text-zinc-600 transition-colors">{item.project_name}</p>
                    <p className="text-xs text-zinc-400 font-medium">{item.date} • {item.location}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
              </div>
            ))}
            {inspections.length === 0 && <p className="text-zinc-400 text-center py-10">データがありません</p>}
          </div>
        </Card>

        <Card className="p-8 bg-zinc-900 text-white border-none">
          <h3 className="text-xl font-bold mb-2">システム通知</h3>
          <p className="text-zinc-400 text-sm mb-8">最新のアップデートと重要なお知らせ</p>
          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Update • 2時間前</p>
              <p className="text-sm font-medium">新しい見積もりテンプレートが追加されました。設定よりご確認ください。</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Alert • 5時間前</p>
              <p className="text-sm font-medium">「渋谷再開発プロジェクト」の点検期限が明日までです。</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InspectionsList({ data }: { data: Inspection[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((item) => (
        <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              item.status === 'urgent' ? 'bg-red-50 text-red-600' : 
              item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            )}>
              {item.status === 'urgent' ? '至急' : item.status === 'completed' ? '完了' : '対応中'}
            </span>
            <p className="text-xs text-zinc-400 font-medium">{item.date}</p>
          </div>
          <h4 className="text-lg font-bold mb-2">{item.project_name}</h4>
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-4">
            <MapPin size={14} />
            {item.location}
          </div>
          <p className="text-sm text-zinc-600 line-clamp-3 mb-6">{item.findings}</p>
          <Button variant="secondary" className="w-full text-xs">詳細を確認</Button>
        </Card>
      ))}
      {data.length === 0 && <div className="col-span-full py-20 text-center text-zinc-400">データがありません</div>}
    </div>
  );
}

function TripReportsList({ data }: { data: TripReport[] }) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-600">
              <Plane size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">{item.destination}</h4>
              <p className="text-sm text-zinc-500">{item.purpose}</p>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">期間</p>
              <p className="text-sm font-semibold">{item.date_start} 〜 {item.date_end}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">経費</p>
              <p className="text-lg font-bold">¥{item.expenses.toLocaleString()}</p>
            </div>
            <Button variant="ghost" className="p-2">
              <ChevronRight size={20} />
            </Button>
          </div>
        </Card>
      ))}
      {data.length === 0 && <div className="py-20 text-center text-zinc-400">データがありません</div>}
    </div>
  );
}

function EstimatesList({ data }: { data: Estimate[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="py-4 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">顧客 / プロジェクト</th>
            <th className="py-4 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">金額</th>
            <th className="py-4 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">ステータス</th>
            <th className="py-4 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((item) => (
            <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
              <td className="py-5 px-4">
                <p className="font-bold">{item.client_name}</p>
                <p className="text-xs text-zinc-400">{item.project_name}</p>
              </td>
              <td className="py-5 px-4 font-bold text-lg">
                ¥{item.amount.toLocaleString()}
              </td>
              <td className="py-5 px-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  item.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  item.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                  item.status === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                )}>
                  {item.status === 'approved' ? '承認' : item.status === 'rejected' ? '却下' : item.status === 'sent' ? '送付済' : '下書き'}
                </span>
              </td>
              <td className="py-5 px-4 text-right">
                <Button variant="ghost" className="ml-auto">詳細</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div className="py-20 text-center text-zinc-400">データがありません</div>}
    </div>
  );
}

function MinutesList({ data }: { data: Minute[] }) {
  return (
    <div className="space-y-6">
      {data.map((item) => (
        <Card key={item.id} className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={16} className="text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-500">{item.date}</p>
              </div>
              <h4 className="text-2xl font-bold">{item.title}</h4>
            </div>
            <div className="flex -space-x-2">
              {item.attendees.split(',').slice(0, 3).map((name, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-600">
                  {name.trim()[0]}
                </div>
              ))}
              {item.attendees.split(',').length > 3 && (
                <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  +{item.attendees.split(',').length - 3}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">会議内容</h5>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">アクションアイテム</h5>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap italic">{item.action_items}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {data.length === 0 && <div className="py-20 text-center text-zinc-400">データがありません</div>}
    </div>
  );
}
