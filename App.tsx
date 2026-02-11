import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import Confirmation from './components/Confirmation';
import ServiceCatalog from './components/ServiceCatalog';
import ReviewSection from './components/ReviewSection';
import { Appointment, AppointmentStatus, AppSettings, Expense, ServiceType, Review, ClientHistory, CatalogItem, ToastNotification } from './types';
import { STORAGE_KEY, SETTINGS_KEY, EXPENSES_KEY, REVIEWS_KEY, CLIENT_HISTORY_KEY, CATALOG_KEY, CATALOG as DEFAULT_CATALOG, BUSINESS_PHONE } from './constants';
import { Sparkles, ShieldCheck, Home, Lock, X, CheckCircle, Info, AlertCircle, Phone, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<'booking' | 'admin' | 'success'>('booking');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [clientHistory, setClientHistory] = useState<ClientHistory>({});
  const [settings, setSettings] = useState<AppSettings>({});
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Dynamic Catalog State
  const [catalog, setCatalog] = useState<Record<ServiceType, CatalogItem>>(DEFAULT_CATALOG);

  const [lastAppointment, setLastAppointment] = useState<Appointment | null>(null);
  const [preSelectedService, setPreSelectedService] = useState<ServiceType | undefined>(undefined);

  // Load from local storage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    const storedExpenses = localStorage.getItem(EXPENSES_KEY);
    const storedReviews = localStorage.getItem(REVIEWS_KEY);
    const storedHistory = localStorage.getItem(CLIENT_HISTORY_KEY);
    const storedCatalog = localStorage.getItem(CATALOG_KEY);
    
    if (storedData) {
      try { setAppointments(JSON.parse(storedData)); } catch (e) { console.error(e); }
    }
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) { console.error(e); }
    }
    if (storedExpenses) {
        try { setExpenses(JSON.parse(storedExpenses)); } catch (e) { console.error(e); }
    }
    if (storedReviews) {
        try { setReviews(JSON.parse(storedReviews)); } catch (e) { console.error(e); }
    }
    if (storedHistory) {
      try { setClientHistory(JSON.parse(storedHistory)); } catch (e) { console.error(e); }
    }
    if (storedCatalog) {
      try { setCatalog(JSON.parse(storedCatalog)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(CLIENT_HISTORY_KEY, JSON.stringify(clientHistory)); }, [clientHistory]);
  useEffect(() => { localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog)); }, [catalog]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Handlers
  const handleBookingSuccess = (newApt: Appointment) => {
    setAppointments(prev => [...prev, newApt]);
    setLastAppointment(newApt);
    setCurrentView('success');
    addToast('¡Cita reservada con éxito!', 'success');
  };

  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ));
    addToast(`Estado actualizado a ${status}`, 'info');
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, amount } : apt
    ));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, notes } : apt
    ));
    addToast('Notas guardadas', 'success');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    addToast('Configuración actualizada', 'success');
  };

  const handleUpdateCatalog = (newCatalog: Record<ServiceType, CatalogItem>) => {
    setCatalog(newCatalog);
    addToast('Catálogo actualizado', 'info');
  };

  const handleUploadProof = (id: string, proofBase64: string) => {
    setAppointments(prev => prev.map(apt => {
        if (apt.id === id) {
            const updated = { ...apt, paymentProof: proofBase64 };
            if (lastAppointment && lastAppointment.id === id) {
                setLastAppointment(updated);
            }
            return updated;
        }
        return apt;
    }));
    addToast('Comprobante subido correctamente', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás segura de borrar esta cita?')) {
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      addToast('Cita eliminada', 'info');
    }
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    addToast('Gasto registrado', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Borrar este gasto?')) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        addToast('Gasto eliminado', 'info');
    }
  };

  const handleAddReview = (review: Review) => {
    setReviews(prev => [review, ...prev]);
    addToast('¡Gracias por tu reseña!', 'success');
  };

  const handleMarkThankYouSent = (id: string, phone: string, quoteIndex: number) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, thankYouSent: true } : apt
    ));
    setClientHistory(prev => {
      const currentHistory = prev[phone] || [];
      return { ...prev, [phone]: [...currentHistory, quoteIndex] };
    });
  };

  const handleSelectService = (service: ServiceType) => {
    setPreSelectedService(service);
    const formElement = document.getElementById('booking-section');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const resetView = () => {
    setLastAppointment(null);
    setPreSelectedService(undefined);
    setCurrentView('booking');
  };

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 font-sans flex flex-col">
      <Header />

      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 relative">
        <div className="fixed top-1/4 left-0 w-96 h-96 bg-brand-200/40 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="fixed bottom-1/4 right-0 w-80 h-80 bg-gold-400/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        {currentView === 'booking' && (
          <div className="animate-in fade-in duration-700 space-y-12">
            <ServiceCatalog catalog={catalog} onSelectService={handleSelectService} />
            
            <div id="booking-section">
                <BookingForm 
                    catalog={catalog}
                    onBookingSuccess={handleBookingSuccess} 
                    preSelectedService={preSelectedService}
                    existingAppointments={appointments}
                />
            </div>

            <ReviewSection reviews={reviews} onAddReview={handleAddReview} />
          </div>
        )}

        {currentView === 'success' && lastAppointment && (
          <Confirmation 
            appointment={lastAppointment} 
            onBack={resetView} 
            settings={settings}
            onUploadProof={handleUploadProof}
          />
        )}

        {currentView === 'admin' && (
          <div className="animate-in slide-in-from-bottom-5 duration-500">
            <AdminPanel 
              appointments={appointments} 
              settings={settings}
              expenses={expenses}
              clientHistory={clientHistory}
              catalog={catalog}
              onUpdateStatus={handleUpdateStatus} 
              onUpdateAmount={handleUpdateAmount}
              onUpdateSettings={handleUpdateSettings}
              onUpdateCatalog={handleUpdateCatalog}
              onDelete={handleDelete} 
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onMarkThankYouSent={handleMarkThankYouSent}
              onUpdateNotes={handleUpdateNotes}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-brand-300 bg-brand-100 py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-serif text-brand-900 text-3xl mb-3">Nails by Diva</p>
          
          <div className="flex flex-col items-center gap-3 mb-8">
            <a 
              href={`tel:${BUSINESS_PHONE}`} 
              className="flex items-center gap-2 text-brand-800 hover:text-gold-600 transition-colors font-sans text-sm font-semibold"
            >
              <Phone className="w-4 h-4" /> +{BUSINESS_PHONE}
            </a>
            <a 
              href={`https://wa.me/${BUSINESS_PHONE}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#20bd5a] transition-all shadow-md active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> Chatear en WhatsApp
            </a>
          </div>

          <div className="flex justify-center gap-10 mb-8 border-t border-brand-200 pt-8 w-fit mx-auto">
            <button 
              onClick={() => setCurrentView('booking')}
              className={`text-xs uppercase tracking-[0.2em] hover:text-black transition-all flex items-center gap-2 ${currentView === 'booking' ? 'text-black font-extrabold border-b-2 border-black pb-1' : 'text-brand-800 opacity-60'}`}
            >
              <Home className="w-4 h-4" /> Inicio
            </button>
            <button 
              onClick={() => setCurrentView('admin')}
              className={`text-xs uppercase tracking-[0.2em] hover:text-black transition-all flex items-center gap-2 ${currentView === 'admin' ? 'text-black font-extrabold border-b-2 border-black pb-1' : 'text-brand-800 opacity-60'}`}
            >
              {currentView === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
               Panel Admin
            </button>
          </div>
          
          <p className="text-brand-800 text-[10px] uppercase tracking-widest opacity-50 font-medium">
            © {new Date().getFullYear()} Nails by Diva. Studio de Arte en Uñas. <br/> 
            <span className="flex items-center justify-center gap-1 mt-3">
              Creado con <Sparkles className="w-3 h-3 text-gold-500 animate-pulse" /> para una experiencia de lujo.
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;