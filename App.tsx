
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import Confirmation from './components/Confirmation';
import ServiceCatalog from './components/ServiceCatalog';
import ReviewSection from './components/ReviewSection';
import { Appointment, AppointmentStatus, AppSettings, Expense, Review, ClientHistory, CatalogItem, ToastNotification, FavoriteBooking } from './types';
import { STORAGE_KEY, SETTINGS_KEY, EXPENSES_KEY, REVIEWS_KEY, CLIENT_HISTORY_KEY, CATALOG_KEY, FAVORITES_KEY, CATALOG as DEFAULT_CATALOG, BUSINESS_PHONE } from './constants';
import { Sparkles, ShieldCheck, Home, Lock, X, CheckCircle, Info, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { syncToGoogleSheets } from './utils';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'booking' | 'admin' | 'success'>('booking');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [clientHistory, setClientHistory] = useState<ClientHistory>({});
  const [settings, setSettings] = useState<AppSettings>({ slotInterval: 90 });
  const [favorites, setFavorites] = useState<Record<string, FavoriteBooking>>({});
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [catalog, setCatalog] = useState<Record<string, CatalogItem>>(DEFAULT_CATALOG);
  const [lastAppointment, setLastAppointment] = useState<Appointment | null>(null);
  const [preSelectedService, setPreSelectedService] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    const storedExpenses = localStorage.getItem(EXPENSES_KEY);
    const storedReviews = localStorage.getItem(REVIEWS_KEY);
    const storedHistory = localStorage.getItem(CLIENT_HISTORY_KEY);
    const storedCatalog = localStorage.getItem(CATALOG_KEY);
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    
    if (storedData) setAppointments(JSON.parse(storedData));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedReviews) setReviews(JSON.parse(storedReviews));
    if (storedHistory) setClientHistory(JSON.parse(storedHistory));
    if (storedCatalog) setCatalog(JSON.parse(storedCatalog));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(CLIENT_HISTORY_KEY, JSON.stringify(clientHistory)); }, [clientHistory]);
  useEffect(() => { localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog)); }, [catalog]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const handleBookingSuccess = async (newApt: Appointment) => {
    setAppointments(prev => [...prev, newApt]);
    setLastAppointment(newApt);
    setCurrentView('success');
    addToast('¡Cita reservada con éxito!', 'success');

    if (settings.googleSheetWebhookUrl) {
      await syncToGoogleSheets(settings.googleSheetWebhookUrl, newApt);
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, status } : a);
      
      // Auto-sync with cloud if webhook is configured
      if (settings.googleSheetWebhookUrl) {
        const apt = updated.find(a => a.id === id);
        if (apt) syncToGoogleSheets(settings.googleSheetWebhookUrl, apt);
      }
      
      return updated;
    });
    addToast(`Estado actualizado a ${status}`, 'info');
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, amount } : a));
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    addToast('Configuración guardada en la nube local', 'success');
  };

  const handleUpdateCatalog = (newCatalog: Record<string, CatalogItem>) => {
    setCatalog(newCatalog);
    addToast('Catálogo actualizado', 'info');
  };

  const handleAddExpense = (exp: Expense) => {
    setExpenses(prev => [...prev, exp]);
    addToast('Gasto registrado', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addToast('Gasto eliminado', 'info');
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
    addToast('Notas guardadas', 'success');
  };

  const handleUploadProof = (id: string, proof: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, paymentProof: proof } : a));
    if (lastAppointment?.id === id) setLastAppointment({...lastAppointment, paymentProof: proof});
    addToast('Comprobante subido', 'success');
  };

  const handleSaveFavorite = (phone: string, fav: FavoriteBooking) => {
    setFavorites(prev => ({...prev, [phone]: fav}));
    addToast('Perfil Diva guardado', 'success');
  };

  const resetView = () => {
    setLastAppointment(null);
    setPreSelectedService(undefined);
    setCurrentView('booking');
  };

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 font-sans flex flex-col">
      <Header />
      
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 relative">
        {currentView === 'booking' && (
          <div className="animate-in fade-in duration-700 space-y-12">
            <ServiceCatalog catalog={catalog} onSelectService={setPreSelectedService} />
            <BookingForm 
              catalog={catalog} 
              onBookingSuccess={handleBookingSuccess} 
              preSelectedService={preSelectedService} 
              existingAppointments={appointments} 
              favorites={favorites} 
              settings={settings} 
            />
            <ReviewSection reviews={reviews} onAddReview={rev => setReviews([rev, ...reviews])} />
          </div>
        )}

        {currentView === 'success' && lastAppointment && (
          <Confirmation 
            appointment={lastAppointment} 
            onBack={resetView} 
            settings={settings} 
            onUploadProof={handleUploadProof} 
            onSaveFavorite={handleSaveFavorite} 
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel 
            appointments={appointments} 
            settings={settings} 
            expenses={expenses} 
            catalog={catalog}
            onUpdateStatus={handleUpdateStatus} 
            onUpdateAmount={handleUpdateAmount} 
            onUpdateSettings={handleUpdateSettings} 
            onUpdateCatalog={handleUpdateCatalog}
            onDelete={id => setAppointments(appointments.filter(a => a.id !== id))} 
            onAddExpense={handleAddExpense} 
            onDeleteExpense={handleDeleteExpense} 
            onUpdateNotes={handleUpdateNotes} 
            onSaveFavorite={handleSaveFavorite}
          />
        )}
      </main>

      <footer className="border-t border-brand-300 bg-brand-100 py-12 mt-12 text-center">
          <div className="flex justify-center gap-10 mb-8 border-t border-brand-200 pt-8 w-fit mx-auto">
            <button onClick={() => setCurrentView('booking')} className={`text-xs uppercase tracking-widest flex items-center gap-2 ${currentView === 'booking' ? 'text-brand-900 font-bold border-b-2 border-brand-900 pb-1' : 'text-brand-400'}`}><Home className="w-4 h-4" /> Inicio</button>
            <button onClick={() => setCurrentView('admin')} className={`text-xs uppercase tracking-widest flex items-center gap-2 ${currentView === 'admin' ? 'text-brand-900 font-bold border-b-2 border-brand-900 pb-1' : 'text-brand-400'}`}><ShieldCheck className="w-4 h-4" /> Admin</button>
          </div>
          <p className="text-brand-400 text-[10px] uppercase tracking-widest">© {new Date().getFullYear()} Nails by Diva. Studio Premium.</p>
      </footer>
    </div>
  );
};

export default App;
