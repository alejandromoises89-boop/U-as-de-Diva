
import React, { useState, useMemo } from 'react';
import { Lock, Trash2, CheckCircle, MessageCircle, Calendar as CalendarIcon, DollarSign, Upload, QrCode, LayoutDashboard, Settings, List, Sparkles, ImageIcon, Edit2, Plus, Download, ChevronLeft, ChevronRight, X, Search, Star, ExternalLink, CalendarDays, BarChart3, TrendingUp, TrendingDown, Eye, CloudSync, Phone, ArrowRight, AlertCircle, Clock, FileText, Filter } from 'lucide-react';
import { Appointment, AppointmentStatus, AppSettings, Expense, CatalogItem, FavoriteBooking, FinancialStats } from '../types';
import { ADMIN_PIN, BANKING_DETAILS } from '../constants';
import { generateWhatsAppLink, formatDate, compressImage, generateId, formatCurrency, generateGoogleCalendarLink, exportToCSV, syncToGoogleSheets, exportToPDF } from '../utils';

interface AdminPanelProps {
  appointments: Appointment[];
  settings: AppSettings;
  expenses: Expense[];
  catalog: Record<string, CatalogItem>;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateCatalog: (catalog: Record<string, CatalogItem>) => void;
  onDelete: (id: string) => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSaveFavorite: (phone: string, fav: FavoriteBooking) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  appointments, settings, expenses, catalog, 
  onUpdateStatus, onUpdateAmount, onUpdateSettings, onUpdateCatalog, 
  onDelete, onAddExpense, onDeleteExpense, onUpdateNotes, onSaveFavorite
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'services' | 'expenses' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Export states
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Modals / Editors
  const [editingService, setEditingService] = useState<CatalogItem | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
  const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  const stats = useMemo<FinancialStats>(() => {
    const income = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).reduce((sum, a) => sum + (a.amount || 0), 0);
    const expTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { income, expenses: expTotal, net: income - expTotal };
  }, [appointments, expenses]);

  const filteredStats = useMemo(() => {
    const periodIncomes = appointments.filter(a => a.status === AppointmentStatus.COMPLETED && a.date >= startDate && a.date <= endDate);
    const periodExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
    const income = periodIncomes.reduce((sum, a) => sum + (a.amount || 0), 0);
    const expTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { income, expenses: expTotal, net: income - expTotal, items: periodIncomes, expenseItems: periodExpenses };
  }, [appointments, expenses, startDate, endDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) setIsAuthenticated(true);
    else alert('PIN Incorrecto');
  };

  const handleSyncAll = async () => {
    if (!settings.googleSheetWebhookUrl) return alert("Configura primero la URL del Webhook en Ajustes.");
    if (!confirm("¿Deseas sincronizar todas las citas actuales con Google Sheets?")) return;
    
    setIsSyncing(true);
    let successCount = 0;
    
    for (const apt of appointments) {
      const ok = await syncToGoogleSheets(settings.googleSheetWebhookUrl, apt);
      if (ok) successCount++;
    }
    
    setIsSyncing(false);
    alert(`Sincronización completada. ${successCount} citas procesadas.`);
  };

  const handleStatusUpdateAndNotify = (id: string, status: AppointmentStatus) => {
    onUpdateStatus(id, status);
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      if (status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.COMPLETED || status === AppointmentStatus.IN_REVIEW) {
        const link = generateWhatsAppLink(apt, false, status);
        window.open(link, '_blank');
      }
    }
  };

  const saveService = () => {
    if (!editingService) return;
    if (!editingService.image) {
      setServiceError("La imagen del servicio es obligatoria (URL o Archivo).");
      return;
    }
    setServiceError(null);
    onUpdateCatalog({...catalog, [editingService.id]: editingService});
    setEditingService(null);
  };

  const handleAuditCSV = () => {
    const incomeData = filteredStats.items.map(a => ({ Tipo: 'Ingreso', Fecha: a.date, Cliente: a.clientName, Concepto: a.service, Monto: a.amount }));
    const expenseData = filteredStats.expenseItems.map(e => ({ Tipo: 'Egreso', Fecha: e.date, Proveedor: e.provider || '-', Concepto: e.description, Monto: e.amount }));
    exportToCSV([...incomeData, ...expenseData], `Auditoria_Diva_${startDate}_${endDate}`);
  };

  const handleAuditPDF = () => {
    exportToPDF(filteredStats.items, filteredStats.expenseItems, startDate, endDate, filteredStats);
  };

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [calendarDate]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-brand-200 shadow-2xl max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
             <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl mb-2 text-brand-900 leading-tight">Acceso Diva</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" placeholder="••••" className="w-full text-center text-5xl tracking-[0.5em] bg-brand-50 border-b-2 border-brand-200 p-5 outline-none focus:border-brand-900 transition-all font-mono" value={pin} onChange={e => setPin(e.target.value)} autoFocus />
            <button type="submit" className="w-full bg-brand-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all text-[10px] md:text-xs">Desbloquear</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-6 pb-24 space-y-8 md:space-y-12 animate-in fade-in duration-500">
      
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white/90 backdrop-blur-xl p-2 rounded-[1.5rem] md:rounded-[2.5rem] border border-brand-200 shadow-sm sticky top-2 z-[60] mx-2 md:mx-0">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'appointments', icon: List, label: 'Agenda' },
          { id: 'services', icon: Sparkles, label: 'Servicios' },
          { id: 'expenses', icon: DollarSign, label: 'Gastos' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-brand-900 text-white shadow-2xl' : 'text-brand-400 hover:bg-brand-50 hover:text-brand-900'}`}>
            <t.icon className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
            <span className="inline">{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-2 md:px-0">
            <div className="premium-card bg-white p-6 md:p-10 rounded-[2rem] border border-brand-200 shadow-md relative overflow-hidden">
                <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.25em] mb-3">Ingresos Totales</p>
                <h3 className="text-3xl md:text-5xl font-mono font-bold text-green-600">{formatCurrency(stats.income)}</h3>
                <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-green-500 opacity-[0.03] rotate-12" />
            </div>
            <div className="premium-card bg-white p-6 md:p-10 rounded-[2rem] border border-brand-200 shadow-md relative overflow-hidden">
                <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.25em] mb-3">Egresos Totales</p>
                <h3 className="text-3xl md:text-5xl font-mono font-bold text-red-600">{formatCurrency(stats.expenses)}</h3>
                <TrendingDown className="absolute -bottom-4 -right-4 w-32 h-32 text-red-500 opacity-[0.03] rotate-12" />
            </div>
            <div className="premium-card bg-brand-900 p-6 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden sm:col-span-2 lg:col-span-1 text-white">
                <p className="text-[10px] font-black text-gold-400/80 uppercase tracking-[0.25em] mb-3">Utilidad Neta</p>
                <h3 className="text-3xl md:text-5xl font-mono font-bold">{formatCurrency(stats.net)}</h3>
                <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-[0.05] rotate-12" />
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-brand-200 shadow-xl mx-2 md:mx-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                   <h3 className="font-serif text-3xl text-brand-900">Reportes de Auditoria</h3>
                   <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest mt-2">Exportación de Datos Financieros</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                   <div className="flex items-center gap-2 bg-brand-50 p-2 rounded-xl border border-brand-200">
                      <Filter className="w-4 h-4 text-brand-300" />
                      <input type="date" className="bg-transparent border-none text-[10px] font-bold outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      <span className="text-brand-300 text-xs">al</span>
                      <input type="date" className="bg-transparent border-none text-[10px] font-bold outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                   </div>
                   <button onClick={handleAuditCSV} className="p-4 bg-brand-50 text-brand-900 rounded-xl hover:bg-brand-900 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"><Download className="w-4 h-4" /> CSV</button>
                   <button onClick={handleAuditPDF} className="p-4 bg-brand-900 text-white rounded-xl hover:bg-black transition-all shadow-xl flex items-center gap-2 text-[10px] font-black uppercase"><FileText className="w-4 h-4" /> PDF Audit</button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100 text-center">
                   <p className="text-[9px] font-black text-brand-300 uppercase mb-1">Inversión Periodo</p>
                   <p className="text-2xl font-mono font-black text-brand-900">{formatCurrency(filteredStats.income)}</p>
                </div>
                <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100 text-center">
                   <p className="text-[9px] font-black text-brand-300 uppercase mb-1">Gasto Periodo</p>
                   <p className="text-2xl font-mono font-black text-red-600">{formatCurrency(filteredStats.expenses)}</p>
                </div>
                <div className="p-6 bg-brand-900 rounded-2xl shadow-lg text-center text-white">
                   <p className="text-[9px] font-black text-gold-400/80 uppercase mb-1">Balance Periodo</p>
                   <p className="text-2xl font-mono font-black">{formatCurrency(filteredStats.net)}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-[2rem] border border-brand-200 shadow-lg gap-6">
            <div className="flex items-center gap-5">
              <CalendarDays className="w-8 h-8 text-brand-900" />
              <div>
                <h3 className="font-serif text-2xl md:text-4xl text-brand-900">Agenda Diva</h3>
                <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest">Turnos en Tiempo Real</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
             {appointments.slice().reverse().map(a => (
               <div key={a.id} className={`premium-card bg-white p-5 md:p-8 rounded-[2rem] border-l-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
                 a.status === AppointmentStatus.COMPLETED ? 'border-blue-500' : 
                 a.status === AppointmentStatus.CONFIRMED ? 'border-green-500' : 
                 a.status === AppointmentStatus.IN_REVIEW ? 'border-orange-400' : 'border-yellow-400'}`}>
                  <div className="w-full md:flex-1 flex items-center gap-6">
                     <div className="bg-brand-50 p-4 rounded-2xl text-center min-w-[90px] border border-brand-100">
                        <p className="text-[9px] font-black text-brand-300 uppercase">{a.date.split('-').reverse().slice(0,2).join('/')}</p>
                        <p className="text-xl font-mono font-black text-brand-900 mt-1">{a.time}</p>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-2xl text-brand-900 truncate">{a.clientName}</h4>
                        <div className="flex flex-wrap gap-2 items-center mt-3">
                           <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-brand-50 text-brand-800 rounded-full border border-brand-200">{a.service}</span>
                           <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full text-white ${
                             a.status === AppointmentStatus.COMPLETED ? 'bg-blue-600' : 
                             a.status === AppointmentStatus.CONFIRMED ? 'bg-green-600' : 
                             a.status === AppointmentStatus.IN_REVIEW ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                             {a.status}
                           </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex w-full md:w-auto gap-3">
                     {a.status !== AppointmentStatus.COMPLETED && (
                       <button onClick={() => handleStatusUpdateAndNotify(a.id, a.status === AppointmentStatus.PENDING ? AppointmentStatus.IN_REVIEW : a.status === AppointmentStatus.IN_REVIEW ? AppointmentStatus.CONFIRMED : AppointmentStatus.COMPLETED)} className="flex-1 p-4 bg-brand-900 text-white rounded-2xl hover:bg-black transition-all shadow-md"><CheckCircle className="w-6 h-6" /></button>
                     )}
                     <button onClick={() => onDelete(a.id)} className="flex-1 p-4 bg-red-50 text-red-400 rounded-2xl border border-brand-100"><Trash2 className="w-6 h-6" /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 md:p-12 rounded-[2.5rem] border border-brand-200 shadow-2xl gap-8">
              <div>
                <h3 className="font-serif text-3xl md:text-5xl text-brand-900 leading-tight">Control de Auditoria</h3>
                <p className="text-[10px] md:text-xs font-black text-brand-300 uppercase tracking-widest mt-3">Gestión de Egresos e Insumos</p>
              </div>
              <button onClick={() => setEditingExpense({ id: generateId(), date: new Date().toISOString().split('T')[0], category: 'Insumos', provider: '', notes: '', amount: 0 })} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-brand-900 text-white rounded-3xl text-xs font-black uppercase shadow-2xl hover:bg-black transition-all"><Plus className="w-5 h-5" /> Registrar Gasto</button>
           </div>
           <div className="bg-white rounded-[2rem] border border-brand-200 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-brand-50 border-b border-brand-100 text-[10px] font-black uppercase text-brand-400">
                      <tr>
                         <th className="px-8 py-6">Fecha y Proveedor</th>
                         <th className="px-8 py-6">Concepto / Categoría</th>
                         <th className="px-8 py-6">Costo (Gs)</th>
                         <th className="px-8 py-6 text-center">Recibo</th>
                         <th className="px-8 py-6 text-center">Acción</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-brand-50">
                      {expenses.slice().reverse().map(e => (
                        <tr key={e.id} className="hover:bg-brand-50/30 transition-all">
                           <td className="px-8 py-6">
                              <p className="font-bold text-brand-900">{e.provider || 'Sin Proveedor'}</p>
                              <p className="text-[10px] text-brand-300 uppercase mt-1">{e.date}</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="font-medium text-brand-800">{e.description}</p>
                              <span className="text-[9px] font-black uppercase px-3 py-1 bg-brand-50 text-brand-400 rounded-md border border-brand-100 mt-2 inline-block">{e.category}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="font-mono font-black text-red-600 text-lg">{formatCurrency(e.amount)}</span>
                           </td>
                           <td className="px-8 py-6 text-center">
                              {e.image ? (
                                <button onClick={() => setViewReceipt(e.image!)} className="p-3 bg-brand-50 text-brand-900 rounded-xl border border-brand-200 hover:bg-brand-900 hover:text-white transition-all"><Eye className="w-5 h-5" /></button>
                              ) : <span className="text-[9px] text-brand-200 uppercase italic">Sin Recibo</span>}
                           </td>
                           <td className="px-8 py-6 text-center">
                              <button onClick={() => onDeleteExpense(e.id)} className="p-3 text-brand-200 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {editingExpense && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-brand-900/90 backdrop-blur-xl p-0 md:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-20 duration-500">
              <div className="p-8 border-b border-brand-50 flex justify-between items-center">
                 <h3 className="font-serif text-3xl text-brand-900">Registro de Gasto</h3>
                 <button onClick={() => setEditingExpense(null)} className="p-4 bg-brand-50 rounded-full hover:bg-brand-900 hover:text-white transition-all"><X className="w-7 h-7" /></button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Proveedor / Negocio</label>
                       <input type="text" className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-bold" value={editingExpense.provider} onChange={e => setEditingExpense({...editingExpense, provider: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Inversión / Costo (Gs)</label>
                       <input type="number" className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-mono font-black text-2xl" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: Number(e.target.value)})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Categoría</label>
                       <select className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-bold" value={editingExpense.category} onChange={e => setEditingExpense({...editingExpense, category: e.target.value})}>
                          <option value="Insumos">Insumos (Esmaltes, Geles, etc)</option>
                          <option value="Herramientas">Herramientas (Brocas, Cabinas)</option>
                          <option value="Marketing">Publicidad y Diseño</option>
                          <option value="Servicios">Agua, Luz, Alquiler</option>
                          <option value="Otros">Otros Egresos</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Fecha</label>
                       <input type="date" className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-bold" value={editingExpense.date} onChange={e => setEditingExpense({...editingExpense, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Concepto / Descripción del Insumo</label>
                    <textarea className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all h-24 text-sm" value={editingExpense.description} onChange={e => setEditingExpense({...editingExpense, description: e.target.value})} placeholder="Ej: Compra de top coat y base rubber..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Comprobante / Recibo (Imagen)</label>
                    <label className="flex flex-col items-center justify-center gap-3 w-full bg-brand-50 border-2 border-dashed border-brand-200 py-10 rounded-3xl cursor-pointer hover:border-brand-900 transition-all">
                        {editingExpense.image ? <img src={editingExpense.image} className="h-20 w-20 object-cover rounded-xl shadow-md" /> : <Upload className="w-8 h-8 text-brand-300" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Cargar Comprobante</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async e => {if(e.target.files?.[0]){ const b64 = await compressImage(e.target.files[0]); setEditingExpense({...editingExpense, image: b64}); }}} />
                    </label>
                 </div>
              </div>
              <div className="p-8 border-t bg-brand-50 flex justify-center sticky bottom-0 z-10">
                 <button onClick={() => { if(editingExpense.description && editingExpense.amount){ onAddExpense(editingExpense as Expense); setEditingExpense(null); } }} className="w-full md:w-auto px-20 py-6 bg-brand-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black active:scale-95 transition-all">Registrar Auditoria</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 md:p-12 rounded-[2.5rem] border border-brand-200 shadow-2xl gap-8">
              <div>
                <h3 className="font-serif text-3xl md:text-5xl text-brand-900 leading-tight">Catálogo Premium</h3>
                <p className="text-[10px] md:text-xs font-black text-brand-300 uppercase tracking-widest mt-3">Gestión de Servicios</p>
              </div>
              <button onClick={() => { setServiceError(null); setEditingService({ id: generateId(), title: '', price: 0, description: '', image: '' }); }} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-brand-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all"><Plus className="w-5 h-5" /> Nuevo Servicio</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {(Object.values(catalog) as CatalogItem[]).map(s => (
                <div key={s.id} className="premium-card bg-white rounded-[2.5rem] border border-brand-200 shadow-xl overflow-hidden flex flex-col group">
                   <div className="relative h-64 overflow-hidden">
                      <img src={s.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt={s.title} />
                      <div className="absolute top-5 right-5">
                         <button onClick={() => { setServiceError(null); setEditingService(s); }} className="p-3 bg-white/95 backdrop-blur-md rounded-full text-brand-900 shadow-2xl hover:bg-brand-900 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                      </div>
                   </div>
                   <div className="p-8 flex-1 flex flex-col">
                      <h4 className="font-serif text-2xl mb-3 text-brand-900">{s.title}</h4>
                      <p className="text-sm text-brand-800 line-clamp-4 mb-8 opacity-80 leading-relaxed flex-1">{s.description}</p>
                      <p className="font-mono font-black text-xl text-brand-900">{formatCurrency(s.price)}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-in fade-in duration-700 max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[2.5rem] border border-brand-200 shadow-2xl space-y-12">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-gold-500 mx-auto mb-6" />
              <h3 className="font-serif text-3xl md:text-5xl text-brand-900">Ajustes Studio</h3>
              <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest mt-5">Configuración Global</p>
            </div>
            
            <div className="p-8 bg-blue-50/40 border border-blue-100 rounded-[2rem] shadow-inner">
                <div className="flex items-center gap-4 mb-6">
                    <CloudSync className="w-6 h-6 text-blue-600" />
                    <h4 className="font-serif text-2xl text-blue-900">Sincronización Cloud (Google Sheets)</h4>
                </div>
                <input 
                  type="text" 
                  placeholder="URL del Webhook de Google Script"
                  className="w-full bg-white border border-blue-200 p-5 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  value={settings.googleSheetWebhookUrl || ''}
                  onChange={e => onUpdateSettings({...settings, googleSheetWebhookUrl: e.target.value})}
                />
            </div>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-brand-900/90 backdrop-blur-xl p-0 md:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-20 duration-500">
              <div className="p-8 md:p-12 border-b border-brand-50 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="font-serif text-3xl md:text-5xl text-brand-900">Editar Servicio</h3>
                 <button onClick={() => setEditingService(null)} className="p-4 bg-brand-50 rounded-full hover:bg-brand-900 hover:text-white transition-all"><X className="w-7 h-7" /></button>
              </div>
              <div className="p-8 md:p-12 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 {serviceError && (
                   <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in shake duration-300">
                     <AlertCircle className="w-5 h-5 shrink-0" />
                     <span>{serviceError}</span>
                   </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Nombre</label>
                       <input type="text" className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-bold text-lg" value={editingService.title} onChange={e => setEditingService({...editingService, title: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Precio (Gs)</label>
                       <input type="number" className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all font-mono font-black text-2xl" value={editingService.price} onChange={e => setEditingService({...editingService, price: Number(e.target.value)})} />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Descripción</label>
                    <textarea className="w-full bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all h-32 text-sm leading-relaxed" value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-brand-400 tracking-widest ml-1">Imagen (URL o Subir)</label>
                    <div className="flex flex-col md:flex-row gap-5">
                       <input type="text" className="flex-1 bg-brand-50 border border-brand-100 p-5 rounded-2xl outline-none focus:border-brand-900 transition-all text-xs font-mono" value={editingService.image} onChange={e => setEditingService({...editingService, image: e.target.value})} placeholder="https://..." />
                       <label className="cursor-pointer bg-brand-900 text-white px-8 py-5 rounded-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl">
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Subir Imagen</span>
                          <input type="file" className="hidden" accept="image/*" onChange={async e => {if(e.target.files?.[0]){ const b64 = await compressImage(e.target.files[0]); setEditingService({...editingService, image: b64}); }}} />
                       </label>
                    </div>
                 </div>
              </div>
              <div className="p-8 md:p-12 border-t bg-brand-50/50 flex justify-center sticky bottom-0 z-10 backdrop-blur-md">
                 <button onClick={saveService} className="w-full md:w-auto px-20 py-6 bg-brand-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black active:scale-95 transition-all">Guardar Cambios</button>
              </div>
           </div>
        </div>
      )}

      {viewReceipt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-900/98 backdrop-blur-3xl p-4 md:p-20 animate-in fade-in duration-500" onClick={() => setViewReceipt(null)}>
           <div className="relative max-w-3xl w-full flex flex-col items-center gap-10" onClick={e => e.stopPropagation()}>
              <div className="bg-white p-3 md:p-5 rounded-[3rem] md:rounded-[5rem] shadow-[0_0_100px_rgba(212,175,55,0.2)] border border-white/20 relative group scale-100 hover:scale-[1.02] transition-transform duration-700">
                <img src={viewReceipt} className="max-h-[70vh] w-auto rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-brand-50" alt="Recibo" />
                <button onClick={() => setViewReceipt(null)} className="absolute -top-6 -right-6 p-6 bg-white text-brand-900 rounded-full shadow-2xl hover:bg-gold-500 hover:text-white active:scale-90 transition-all duration-300"><X className="w-8 h-8" /></button>
              </div>
              <div className="text-center">
                <p className="text-white font-serif text-2xl md:text-3xl italic mb-2 tracking-wide">Comprobante Digital Diva</p>
                <div className="w-20 h-1 bg-gold-500 mx-auto rounded-full opacity-60"></div>
                <p className="text-gold-400/50 text-[10px] font-black uppercase tracking-[0.6em] mt-6">Cierre de Transacción</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
