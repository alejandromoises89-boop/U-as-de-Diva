
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, CreditCard, User, Phone, Sparkles, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { PaymentMethod, Appointment, AppointmentStatus, CatalogItem, FavoriteBooking, AppSettings } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { generateId, formatCurrency, generateTimeSlots } from '../utils';

interface BookingFormProps {
  onBookingSuccess: (appointment: Appointment) => void;
  preSelectedService?: string;
  catalog: Record<string, CatalogItem>;
  existingAppointments: Appointment[];
  favorites: Record<string, FavoriteBooking>;
  settings: AppSettings;
}

const BookingForm: React.FC<BookingFormProps> = ({ onBookingSuccess, preSelectedService, catalog, existingAppointments, favorites, settings }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    service: Object.keys(catalog)[0] || '',
    payment: PAYMENT_METHODS[0],
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);

  const dynamicTimeSlots = useMemo(() => generateTimeSlots(settings.slotInterval), [settings.slotInterval]);

  const isDateFull = useMemo(() => {
    return (date: string) => {
      const dayApts = existingAppointments.filter(a => a.date === date && a.status !== AppointmentStatus.COMPLETED);
      return dayApts.length >= dynamicTimeSlots.length;
    };
  }, [existingAppointments, dynamicTimeSlots]);

  const clientFavorite = useMemo(() => {
    if (formData.phone.length >= 9) return favorites[formData.phone];
    return null;
  }, [formData.phone, favorites]);

  const applyFavorite = () => {
    if (clientFavorite) {
      setFormData(prev => ({
        ...prev,
        name: clientFavorite.clientName,
        service: clientFavorite.service,
        time: clientFavorite.time,
        payment: clientFavorite.paymentMethod
      }));
    }
  };

  const availableSlots = useMemo(() => {
    const takenSlots = existingAppointments
      .filter(apt => apt.date === formData.date && apt.status !== AppointmentStatus.COMPLETED)
      .map(apt => apt.time);
    
    return dynamicTimeSlots.map(slot => ({
      time: slot,
      isTaken: takenSlots.includes(slot)
    }));
  }, [existingAppointments, formData.date, dynamicTimeSlots]);

  useEffect(() => {
    if (preSelectedService) {
      setFormData(prev => ({ ...prev, service: preSelectedService }));
    }
  }, [preSelectedService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      setError('Por favor, selecciona un horario disponible.');
      return;
    }
    if (isDateFull(formData.date)) {
      setError('Esta fecha ya no tiene turnos disponibles.');
      return;
    }
    
    setError(null);
    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today) {
        setError('No puedes seleccionar una fecha en el pasado.');
        return;
    }

    const servicePrice = (catalog as Record<string, CatalogItem>)[formData.service]?.price || 0;

    const newAppointment: Appointment = {
      id: generateId(),
      clientName: formData.name,
      date: formData.date,
      time: formData.time,
      service: (catalog as Record<string, CatalogItem>)[formData.service]?.title || formData.service,
      paymentMethod: formData.payment as PaymentMethod,
      phone: formData.phone,
      status: AppointmentStatus.PENDING,
      createdAt: Date.now(),
      amount: servicePrice
    };

    onBookingSuccess(newAppointment);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-16 bg-white rounded-[2.5rem] md:rounded-[4.5rem] border border-brand-200 shadow-2xl relative overflow-hidden animate-in fade-in duration-1000">
      <div className="text-center mb-12 md:mb-20">
        <Sparkles className="w-12 h-12 text-gold-500 mx-auto mb-6 animate-bounce-subtle" />
        <h3 className="font-serif text-4xl md:text-6xl text-brand-900 mb-4 tracking-tight leading-tight">Agendar Mi Turno</h3>
        <p className="text-brand-400 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] italic">Arte y Cuidado para tus Manos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
        {/* WhatsApp Section - High Emphasis */}
        <div className="bg-brand-50/70 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-brand-100 shadow-inner group">
          <label className="text-[10px] md:text-[11px] font-black uppercase text-brand-300 tracking-[0.4em] block mb-4 ml-1">WhatsApp Diva Identification</label>
          <div className="relative">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-200 group-focus-within:text-gold-500 transition-colors" />
            <input
              type="tel"
              required
              className="w-full bg-white border-2 border-brand-200 text-brand-900 pl-16 pr-6 py-5 md:py-6 rounded-3xl focus:border-brand-900 focus:ring-8 focus:ring-brand-900/5 outline-none font-bold text-xl md:text-2xl transition-all shadow-sm"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="595 9..."
            />
          </div>
          {clientFavorite && (
            <button type="button" onClick={applyFavorite} className="mt-6 flex items-center justify-center gap-3 w-full bg-gold-500 text-white px-8 py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.25em] shadow-xl hover:bg-gold-600 active:scale-95 transition-all animate-in zoom-in duration-500">
              <Star className="w-4 h-4 fill-white" /> Cargar Mi Perfil Favorito
            </button>
          )}
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-400 tracking-[0.2em] ml-2">Tu Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-200" />
              <input type="text" required className="w-full bg-brand-50 border border-brand-200 pl-16 p-5 md:p-6 rounded-[1.5rem] md:rounded-3xl outline-none focus:border-brand-900 focus:bg-white transition-all font-bold text-brand-900" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-400 tracking-[0.2em] ml-2">Servicio Solicitado</label>
            <div className="relative">
              <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-200 pointer-events-none" />
              <select className="w-full bg-brand-50 border border-brand-200 pl-16 p-5 md:p-6 rounded-[1.5rem] md:rounded-3xl outline-none focus:border-brand-900 focus:bg-white transition-all font-black text-brand-900 appearance-none text-sm md:text-base cursor-pointer" value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>
                {(Object.values(catalog) as CatalogItem[]).map(s => <option key={s.id} value={s.id}>{s.title} ({formatCurrency(s.price)})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-400 tracking-[0.2em] ml-2">Fecha del Turno</label>
            <div className="relative">
               <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-200" />
               <input 
                 type="date" 
                 required 
                 className={`w-full pl-16 bg-brand-50 border p-5 md:p-6 rounded-[1.5rem] md:rounded-3xl outline-none font-black text-brand-900 text-lg md:text-xl transition-all ${isDateFull(formData.date) ? 'border-red-300 text-red-500' : 'border-brand-200'}`} 
                 value={formData.date} 
                 onChange={(e) => setFormData({...formData, date: e.target.value})} 
               />
            </div>
            {isDateFull(formData.date) && <p className="text-[10px] text-red-500 font-black uppercase mt-3 text-center tracking-widest animate-pulse">⚠️ Fecha Completa. Elige otro día.</p>}
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-400 tracking-[0.2em] ml-2">Horario Elegido</label>
            <div className="grid grid-cols-3 gap-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar scroll-smooth">
              {availableSlots.map(s => (
                <button 
                  key={s.time} 
                  type="button" 
                  disabled={s.isTaken} 
                  onClick={() => setFormData({...formData, time: s.time})} 
                  className={`py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.1em] transition-all border-2 ${s.isTaken ? 'opacity-10 cursor-not-allowed bg-gray-100 grayscale' : formData.time === s.time ? 'bg-brand-900 text-white border-brand-900 shadow-2xl scale-105 z-10' : 'bg-white text-brand-800 hover:border-brand-900 hover:bg-brand-50 border-brand-50'}`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-brand-400 tracking-[0.4em] ml-2 text-center block">Método de Pago Preferido</label>
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {PAYMENT_METHODS.map(m => (
              <button 
                key={m} 
                type="button" 
                onClick={() => setFormData({...formData, payment: m})} 
                className={`flex-1 py-5 md:py-6 border-2 rounded-[1.5rem] md:rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formData.payment === m ? 'bg-brand-900 text-white border-brand-900 shadow-2xl' : 'bg-white border-brand-50 text-brand-400 hover:bg-brand-50 hover:border-brand-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="p-6 bg-red-50 text-red-600 rounded-[1.5rem] md:rounded-3xl text-sm font-black uppercase tracking-widest text-center flex items-center gap-4 justify-center border border-red-100 animate-in shake duration-500"><AlertCircle className="w-5 h-5" /> {error}</div>}

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isDateFull(formData.date)}
            className={`w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[10px] md:text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 ${isDateFull(formData.date) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-900 text-white hover:bg-black'}`}
          >
            {isDateFull(formData.date) ? 'Día No Disponible' : `Agendar Por ${formatCurrency((catalog as Record<string, CatalogItem>)[formData.service]?.price || 0)}`}
            {!isDateFull(formData.date) && <CheckCircle2 className="w-6 h-6" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
