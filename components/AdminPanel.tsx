import React, { useState, useMemo, useEffect } from 'react';
import { Lock, Trash2, CheckCircle, MessageCircle, Calendar as CalendarIcon, Phone, DollarSign, CreditCard, Upload, QrCode, FileText, BarChart3, TrendingUp, TrendingDown, LayoutDashboard, Settings, List, Heart, Clock, BellRing, Sparkles, Image as ImageIcon, Edit2, Save, User, StickyNote, Filter } from 'lucide-react';
import { Appointment, AppointmentStatus, AppSettings, Expense, ClientHistory, CatalogItem, ServiceType } from '../types';
import { ADMIN_PIN } from '../constants';
import { generateWhatsAppLink, formatDate, compressImage, generateId, formatCurrency, generateThankYouLink, getUniqueQuoteIndex, getQuoteByIndex } from '../utils';

interface AdminPanelProps {
  appointments: Appointment[];
  settings: AppSettings;
  expenses: Expense[];
  clientHistory: ClientHistory;
  catalog: Record<ServiceType, CatalogItem>;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateCatalog: (catalog: Record<ServiceType, CatalogItem>) => void;
  onDelete: (id: string) => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onMarkThankYouSent: (id: string, phone: string, quoteIndex: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  appointments, 
  settings, 
  expenses,
  clientHistory,
  catalog,
  onUpdateStatus, 
  onUpdateAmount, 
  onUpdateSettings,
  onUpdateCatalog,
  onDelete,
  onAddExpense,
  onDeleteExpense,
  onMarkThankYouSent,
  onUpdateNotes
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'services' | 'settings'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [pendingThankYous, setPendingThankYous] = useState<Appointment[]>([]);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Insumos' });
  
  // Note Editing State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  // Reminder & Thank You Logic
  useEffect(() => {
    const checkPending = () => {
      const now = new Date();
      const due = appointments.filter(apt => {
        if (apt.status !== AppointmentStatus.COMPLETED || apt.thankYouSent) return false;
        const aptDate = new Date(`${apt.date}T${apt.time}`);
        const thankYouTime = new Date(aptDate.getTime() + (2 * 60 * 60 * 1000) + (30 * 60 * 1000));
        return now >= thankYouTime;
      });
      setPendingThankYous(due);
    };

    if (isAuthenticated) {
        checkPending();
        const interval = setInterval(checkPending, 60000); // Check every minute
        return () => clearInterval(interval);
    }
  }, [appointments, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('PIN Incorrecto');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const compressed = await compressImage(e.target.files[0]);
            callback(compressed);
        } catch (error) {
            console.error("Error processing image", error);
            alert("Error al procesar la imagen.");
        }
    }
  };

  const handleCatalogUpdate = (id: ServiceType, field: keyof CatalogItem, value: any) => {
    const updatedCatalog = {
      ...catalog,
      [id]: {
        ...catalog[id],
        [field]: value
      }
    };
    onUpdateCatalog(updatedCatalog);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    onAddExpense({
        id: generateId(),
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        date: new Date().toISOString(),
        category: expenseForm.category
    });
    setExpenseForm({ description: '', amount: '', category: 'Insumos' });
  };

  const handleSendThankYou = (apt: Appointment) => {
    const usedIndices = clientHistory[apt.phone] || [];
    const uniqueIndex = getUniqueQuoteIndex(usedIndices);
    const quote = getQuoteByIndex(uniqueIndex);
    const link = generateThankYouLink(apt, quote);
    onMarkThankYouSent(apt.id, apt.phone, uniqueIndex);
    window.open(link, '_blank');
  };

  const handleNoteSave = (id: string) => {
    onUpdateNotes(id, tempNote);
    setEditingNoteId(null);
  };

  const handleNoteEditStart = (apt: Appointment) => {
    setEditingNoteId(apt.id);
    setTempNote(apt.notes || '');
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalIncome = appointments
        .filter(a => a.status !== AppointmentStatus.PENDING) 
        .reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalPending = appointments
        .filter(a => a.status === AppointmentStatus.PENDING)
        .reduce((sum, a) => sum + (a.amount || 0), 0);
    const todayPotential = appointments
        .filter(a => a.date === today)
        .reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const countPending = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    const countConfirmed = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    const countCompleted = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;

    return { totalIncome, totalPending, todayPotential, totalExpenses, netProfit, countPending, countConfirmed, countCompleted };
  }, [appointments, expenses]);

  const sortedAppointments = useMemo(() => {
    let filtered = [...appointments];
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    return filtered.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [appointments, filterStatus]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-brand-200 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-50 rounded-full border border-brand-200">
              <Lock className="w-8 h-8 text-brand-900" />
            </div>
          </div>
          <h3 className="text-center font-serif text-2xl text-brand-900 mb-6 tracking-widest">ACCESO DUEÑA</h3>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="••••"
              className="w-full bg-brand-50 border border-brand-200 text-center text-brand-900 text-3xl tracking-[0.5em] py-4 rounded-xl focus:outline-none focus:border-brand-900 transition-all placeholder:text-brand-300 placeholder:text-sm placeholder:tracking-normal"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button type="submit" className="w-full bg-brand-900 hover:bg-black text-white font-sans font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-widest">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-brand-200 pb-4 gap-4">
        <h2 className="font-serif text-3xl text-brand-900">Admin Panel</h2>
        
        {/* Navigation */}
        <div className="flex flex-wrap justify-center bg-white p-1 rounded-xl border border-brand-200 shadow-sm">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen' },
              { id: 'appointments', icon: List, label: 'Agenda', badge: pendingThankYous.length },
              { id: 'services', icon: Sparkles, label: 'Servicios' },
              { id: 'settings', icon: Settings, label: 'Config' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wide
                  ${activeTab === tab.id ? 'bg-brand-900 text-white shadow-md' : 'text-brand-400 hover:text-brand-900 hover:bg-brand-50'}`}
              >
                  <tab.icon className="w-4 h-4" /> 
                  {tab.label}
                  {tab.badge ? <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{tab.badge}</span> : null}
              </button>
            ))}
        </div>
      </div>

      {/* --- DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-brand-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp className="w-16 h-16 text-green-900" /></div>
                    <p className="text-brand-500 text-[10px] uppercase tracking-widest mb-1">Ingresos Totales</p>
                    <h3 className="text-2xl font-mono font-bold text-green-700">{formatCurrency(stats.totalIncome)}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-brand-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingDown className="w-16 h-16 text-red-900" /></div>
                    <p className="text-brand-500 text-[10px] uppercase tracking-widest mb-1">Gastos</p>
                    <h3 className="text-2xl font-mono font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-brand-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><DollarSign className="w-16 h-16 text-brand-900" /></div>
                    <p className="text-brand-500 text-[10px] uppercase tracking-widest mb-1">Ganancia Neta</p>
                    <h3 className="text-2xl font-mono font-bold text-brand-900">{formatCurrency(stats.netProfit)}</h3>
                </div>
                <div className="bg-brand-900 p-5 rounded-xl border border-brand-800 shadow-sm relative overflow-hidden">
                    <p className="text-brand-200 text-[10px] uppercase tracking-widest mb-1">Proyección Hoy</p>
                    <h3 className="text-2xl font-mono font-bold text-white">{formatCurrency(stats.todayPotential)}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-brand-200 shadow-sm">
                    <h3 className="text-lg font-serif text-brand-900 mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gold-500" /> Estadísticas</h3>
                    <div className="space-y-4">
                        {[{l: 'Pendientes', c: stats.countPending, t: 'text-yellow-600', b: 'bg-yellow-400'}, 
                          {l: 'Confirmadas', c: stats.countConfirmed, t: 'text-green-600', b: 'bg-green-500'}, 
                          {l: 'Completadas', c: stats.countCompleted, t: 'text-blue-600', b: 'bg-blue-500'}].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={item.t}>{item.l} ({item.c})</span>
                                </div>
                                <div className="w-full bg-brand-50 rounded-full h-1.5 border border-brand-100">
                                    <div className={`${item.b} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${(item.c / Math.max(appointments.length, 1)) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="bg-white rounded-xl p-6 border border-brand-200 shadow-sm h-fit">
                    <h3 className="text-lg font-serif text-brand-900 mb-4">Nuevo Gasto</h3>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Descripción" 
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm focus:border-brand-900 outline-none text-brand-900"
                            value={expenseForm.description}
                            onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                        />
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                placeholder="Monto" 
                                className="w-1/2 bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm focus:border-brand-900 outline-none text-brand-900"
                                value={expenseForm.amount}
                                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                            />
                            <select 
                                className="w-1/2 bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm focus:border-brand-900 outline-none text-brand-800"
                                value={expenseForm.category}
                                onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                            >
                                <option>Insumos</option>
                                <option>Alquiler</option>
                                <option>Servicios</option>
                                <option>Personal</option>
                                <option>Otros</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-lg text-xs font-bold border border-red-200 transition-all uppercase tracking-wider">
                            Registrar Salida
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* --- SERVICES MANAGEMENT --- */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
           {(Object.values(catalog) as CatalogItem[]).map((item) => (
               <div key={item.id} className="bg-white rounded-xl overflow-hidden border border-brand-200 shadow-sm group hover:shadow-md transition-all">
                   <div className="relative h-40 bg-brand-100">
                       <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                       <div className="absolute bottom-4 left-4">
                           <h3 className="font-serif text-xl text-white">{item.title}</h3>
                       </div>
                       <label className="absolute top-2 right-2 bg-white/80 hover:bg-white text-brand-900 p-2 rounded-full cursor-pointer backdrop-blur-md transition-colors shadow-sm">
                           <Edit2 className="w-4 h-4" />
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (b64) => handleCatalogUpdate(item.id, 'image', b64))} />
                       </label>
                   </div>
                   <div className="p-4 space-y-4">
                       <div>
                           <label className="text-[10px] text-brand-500 uppercase tracking-wider font-bold">Precio (Gs)</label>
                           <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 mt-1 focus-within:border-brand-900">
                               <DollarSign className="w-4 h-4 text-brand-500" />
                               <input 
                                  type="number" 
                                  value={item.price}
                                  onChange={(e) => handleCatalogUpdate(item.id, 'price', Number(e.target.value))}
                                  className="bg-transparent outline-none text-brand-900 w-full font-mono font-bold"
                               />
                           </div>
                       </div>
                   </div>
               </div>
           ))}
        </div>
      )}

      {/* --- APPOINTMENTS LIST --- */}
      {activeTab === 'appointments' && (
        <div className="animate-in fade-in duration-500 space-y-6">
            
            {/* Filter Buttons */}
            <div className="bg-white p-2 rounded-2xl border border-brand-200 shadow-sm flex flex-wrap gap-2 items-center justify-between px-4">
               <div className="flex items-center gap-2 text-brand-500 text-xs font-bold uppercase tracking-widest">
                  <Filter className="w-4 h-4" /> Filtrar por:
               </div>
               <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${filterStatus === 'ALL' ? 'bg-brand-900 text-white border-brand-900 shadow-md' : 'bg-brand-50 text-brand-500 border-brand-100 hover:border-brand-300'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFilterStatus(AppointmentStatus.PENDING)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${filterStatus === AppointmentStatus.PENDING ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:border-yellow-300'}`}
                  >
                    Pendientes
                  </button>
                  <button 
                    onClick={() => setFilterStatus(AppointmentStatus.CONFIRMED)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${filterStatus === AppointmentStatus.CONFIRMED ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-green-50 text-green-700 border-green-100 hover:border-green-300'}`}
                  >
                    Confirmados
                  </button>
                  <button 
                    onClick={() => setFilterStatus(AppointmentStatus.COMPLETED)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${filterStatus === AppointmentStatus.COMPLETED ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300'}`}
                  >
                    Finalizados
                  </button>
               </div>
            </div>

            {pendingThankYous.length > 0 && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 text-pink-700">
                   <BellRing className="w-6 h-6" />
                   <div>
                      <p className="font-bold">Agradecimientos Pendientes</p>
                      <p className="text-xs">{pendingThankYous.length} clientes finalizaron su servicio hace poco.</p>
                   </div>
                </div>
                <div className="text-xs bg-white px-3 py-1 rounded-full text-pink-500 font-bold shadow-sm">
                   Revisar agenda abajo 👇
                </div>
              </div>
            )}

            {sortedAppointments.length === 0 ? (
                <div className="text-center py-20 text-brand-400 italic bg-white rounded-2xl border border-brand-200">
                  <div className="flex flex-col items-center gap-4">
                     <FileText className="w-12 h-12 opacity-20" />
                     <p>No hay citas registradas en esta categoría.</p>
                  </div>
                </div>
            ) : (
                sortedAppointments.map((apt) => {
                    const isToday = apt.date === new Date().toISOString().split('T')[0];
                    const statusColors = {
                        [AppointmentStatus.PENDING]: 'border-yellow-400 bg-white',
                        [AppointmentStatus.CONFIRMED]: 'border-green-500 bg-white',
                        [AppointmentStatus.COMPLETED]: 'border-blue-500 bg-brand-50/50'
                    };

                    return (
                    <div key={apt.id} className={`group relative rounded-xl border-l-4 shadow-sm hover:shadow-lg transition-all p-5 border-t border-r border-b border-gray-100 animate-in fade-in zoom-in duration-300 ${statusColors[apt.status]}`}>
                        
                        <div className="flex flex-col lg:flex-row gap-6">
                            
                            {/* Main Info */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-serif text-xl text-brand-900 flex items-center gap-2">
                                            {apt.clientName}
                                            {isToday && <span className="bg-brand-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Hoy</span>}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm ${
                                                apt.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                                                apt.status === AppointmentStatus.COMPLETED ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{apt.status}</span>
                                            <span className="text-brand-400 text-xs">#{apt.id}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                       <label className="block text-[9px] uppercase text-brand-400 font-bold mb-1">Monto Servicio</label>
                                       <div className="flex items-center justify-end gap-1">
                                            <span className="text-brand-300">$</span>
                                            <input 
                                                type="number" 
                                                value={apt.amount} 
                                                onChange={(e) => onUpdateAmount(apt.id, Number(e.target.value))}
                                                className="w-24 text-right font-mono font-bold text-lg text-brand-900 bg-transparent border-b border-dashed border-brand-300 focus:border-brand-900 focus:outline-none transition-colors"
                                            />
                                       </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-50/50 p-3 rounded-lg border border-brand-100/50">
                                    <div>
                                        <span className="text-[9px] uppercase text-brand-400 font-bold block mb-1">Fecha</span>
                                        <div className="flex items-center gap-1.5 text-brand-800 text-sm font-medium">
                                            <CalendarIcon className="w-3.5 h-3.5 text-brand-400" />
                                            {formatDate(apt.date)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase text-brand-400 font-bold block mb-1">Hora</span>
                                        <div className="flex items-center gap-1.5 text-brand-800 text-sm font-medium">
                                            <Clock className="w-3.5 h-3.5 text-brand-400" />
                                            {apt.time} hs
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase text-brand-400 font-bold block mb-1">Servicio</span>
                                        <div className="flex items-center gap-1.5 text-brand-800 text-sm font-medium">
                                            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                                            {apt.service}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase text-brand-400 font-bold block mb-1">Pago</span>
                                        <div className="flex items-center gap-1.5 text-brand-800 text-sm font-medium">
                                            <CreditCard className="w-3.5 h-3.5 text-brand-400" />
                                            {apt.paymentMethod}
                                            {apt.paymentProof && (
                                                <button onClick={() => setViewProof(apt.paymentProof!)} className="text-blue-500 hover:text-blue-700 ml-1">
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Notes Section for Completed Services */}
                                {apt.status === AppointmentStatus.COMPLETED && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[9px] uppercase text-brand-400 font-bold flex items-center gap-1">
                                                <StickyNote className="w-3 h-3" /> Notas del Servicio / Comentarios
                                            </label>
                                            {editingNoteId !== apt.id && (
                                                <button onClick={() => handleNoteEditStart(apt)} className="text-[10px] text-brand-500 hover:text-brand-900 underline">Editar</button>
                                            )}
                                        </div>
                                        
                                        {editingNoteId === apt.id ? (
                                            <div className="flex gap-2">
                                                <textarea 
                                                    value={tempNote}
                                                    onChange={(e) => setTempNote(e.target.value)}
                                                    className="w-full text-xs bg-white border border-brand-300 rounded p-2 focus:border-brand-900 outline-none"
                                                    rows={2}
                                                    placeholder="Escribe detalles sobre el cliente o servicio..."
                                                />
                                                <button onClick={() => handleNoteSave(apt.id)} className="bg-brand-900 text-white px-3 rounded-lg self-start py-2">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-brand-50/50 border border-brand-100 rounded p-2 text-xs text-brand-700 italic min-h-[40px]">
                                                {apt.notes || "Sin notas registradas."}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex lg:flex-col gap-2 lg:w-48 lg:border-l border-brand-100 lg:pl-6 justify-center">
                                {/* Workflow Actions */}
                                {apt.status === AppointmentStatus.PENDING && (
                                    <button onClick={() => onUpdateStatus(apt.id, AppointmentStatus.CONFIRMED)} className="w-full bg-brand-900 hover:bg-black text-white text-xs py-3 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md">
                                        <CheckCircle className="w-4 h-4" /> CONFIRMAR
                                    </button>
                                )}
                                {apt.status === AppointmentStatus.CONFIRMED && (
                                    <button onClick={() => onUpdateStatus(apt.id, AppointmentStatus.COMPLETED)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-3 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md">
                                        <CheckCircle className="w-4 h-4" /> FINALIZAR
                                    </button>
                                )}
                                
                                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 w-full">
                                    <a href={generateWhatsAppLink(apt, true)} target="_blank" rel="noopener noreferrer" className="w-full bg-white hover:bg-brand-50 text-brand-900 border border-brand-200 text-xs py-2.5 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                                        <MessageCircle className="w-3.5 h-3.5" /> Recordar
                                    </a>

                                    {apt.status === AppointmentStatus.COMPLETED && !apt.thankYouSent && (
                                        <button 
                                            onClick={() => handleSendThankYou(apt)} 
                                            className={`w-full text-xs py-2.5 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border
                                            ${pendingThankYous.some(p => p.id === apt.id) 
                                                ? 'bg-pink-100 text-pink-700 border-pink-300 animate-pulse shadow-sm' 
                                                : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'}`}
                                        >
                                            <Heart className="w-3.5 h-3.5" /> Agradecer
                                        </button>
                                    )}

                                    <button onClick={() => onDelete(apt.id)} className="w-full bg-white hover:bg-red-50 text-brand-400 hover:text-red-500 border border-transparent hover:border-red-100 text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </div>
      )}

      {/* Settings remains same as original but included for full content requirement */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl border border-brand-200 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-brand-900 font-serif text-xl mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Configurar QRs de Pagos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['paymentQr', 'paymentQrSecondary'].map((field, idx) => {
                    const isPrimary = field === 'paymentQr';
                    const currentImg = settings[field as keyof AppSettings];
                    return (
                        <div key={field} className="flex flex-col gap-4">
                            <h4 className="text-brand-800 font-bold text-sm uppercase tracking-wider border-b border-brand-100 pb-2">
                                {isPrimary ? 'Banco Familiar (QR Principal)' : 'Ueno Bank (QR Secundario)'}
                            </h4>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, (b64) => onUpdateSettings({ ...settings, [field]: b64 }))}
                                    className="hidden" 
                                    id={`qr-${field}`}
                                />
                                <label 
                                    htmlFor={`qr-${field}`}
                                    className="flex items-center justify-center gap-2 w-full bg-brand-50 border border-dashed border-brand-300 hover:border-brand-900 text-brand-400 hover:text-brand-900 py-6 rounded-xl cursor-pointer transition-all"
                                >
                                    <Upload className="w-5 h-5" />
                                    {currentImg ? 'Cambiar QR' : 'Subir QR'}
                                </label>
                            </div>
                            {currentImg && (
                                <div className="relative group w-fit mx-auto">
                                    <img src={currentImg} alt="QR" className="w-48 h-48 object-contain rounded-lg border border-brand-200 bg-white p-2" />
                                    <button 
                                        onClick={() => onUpdateSettings({...settings, [field]: undefined})}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsAuthenticated(false)}
        className="mt-12 text-brand-400 hover:text-brand-900 text-xs uppercase tracking-widest w-full text-center border-t border-brand-200 pt-4"
      >
        Cerrar Sesión
      </button>

      {viewProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setViewProof(null)}>
            <div className="relative max-w-lg w-full bg-white rounded-lg p-2 shadow-2xl">
                <button className="absolute -top-12 right-0 text-white hover:text-brand-200 flex gap-2 items-center">Cerrar [X]</button>
                <img src={viewProof} alt="Comprobante" className="w-full h-auto rounded" />
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;