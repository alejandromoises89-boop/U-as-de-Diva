import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, CreditCard, User, Phone, Sparkles, AlertCircle, Ban } from 'lucide-react';
import { ServiceType, PaymentMethod, Appointment, AppointmentStatus, CatalogItem } from '../types';
import { SERVICES_LIST, PAYMENT_METHODS, TIME_SLOTS } from '../constants';
import { generateId, formatCurrency } from '../utils';

interface BookingFormProps {
  onBookingSuccess: (appointment: Appointment) => void;
  preSelectedService?: ServiceType;
  catalog: Record<ServiceType, CatalogItem>;
  existingAppointments: Appointment[];
}

const BookingForm: React.FC<BookingFormProps> = ({ onBookingSuccess, preSelectedService, catalog, existingAppointments }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    service: SERVICES_LIST[0],
    payment: PAYMENT_METHODS[0],
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);

  const isSlotTaken = useMemo(() => {
    return existingAppointments.some(apt => 
      apt.date === formData.date && 
      apt.time === formData.time && 
      apt.status !== AppointmentStatus.COMPLETED // Assuming only non-completed count as taking space
    );
  }, [existingAppointments, formData.date, formData.time]);

  useEffect(() => {
    if (preSelectedService) {
      setFormData(prev => ({ ...prev, service: preSelectedService }));
    }
  }, [preSelectedService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSlotTaken) return;
    setError(null);

    // Date Validation
    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today) {
        setError('No puedes seleccionar una fecha en el pasado.');
        return;
    }

    if (!formData.name || !formData.phone) return;

    // Get dynamic price from catalog props
    const servicePrice = catalog[formData.service as ServiceType]?.price || 0;

    const newAppointment: Appointment = {
      id: generateId(),
      clientName: formData.name,
      date: formData.date,
      time: formData.time,
      service: formData.service as ServiceType,
      paymentMethod: formData.payment as PaymentMethod,
      phone: formData.phone,
      status: AppointmentStatus.PENDING,
      createdAt: Date.now(),
      amount: servicePrice
    };

    onBookingSuccess(newAppointment);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const currentPrice = catalog[formData.service as ServiceType]?.price || 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-brand-200 shadow-xl relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-brand-200"></div>
      
      <div className="text-center mb-10">
        <h3 className="font-serif text-3xl text-brand-900 mb-2 flex items-center justify-center gap-2">
          Completa tu Reserva
        </h3>
        <p className="text-brand-800 font-sans text-xs tracking-[0.2em] uppercase">Confirmación Inmediata</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div className="group relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-brand-400 group-focus-within:text-gold-500 transition-colors" />
          </div>
          <input
            type="text"
            required
            placeholder="NOMBRE COMPLETO"
            className="w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all placeholder:text-brand-400 font-sans"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        {/* Date & Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-brand-400 group-focus-within:text-gold-500 transition-colors" />
            </div>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all font-sans"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>

          <div className="group relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Sparkles className="h-5 w-5 text-brand-400 group-focus-within:text-gold-500 transition-colors" />
            </div>
            <select
              className="w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all appearance-none font-sans"
              value={formData.service}
              onChange={(e) => handleChange('service', e.target.value)}
            >
              {(Object.values(catalog) as CatalogItem[]).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Price Display */}
        <div className="bg-brand-100 border border-brand-200 rounded-lg p-3 flex justify-between items-center px-6">
             <span className="text-brand-800 text-xs font-bold uppercase tracking-wider">Precio Estimado</span>
             <span className="text-brand-900 font-mono text-xl font-bold">{formatCurrency(currentPrice)}</span>
        </div>

        {/* Time & Payment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`group relative ${isSlotTaken ? 'ring-2 ring-red-300 rounded-xl' : ''}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Clock className={`h-5 w-5 transition-colors ${isSlotTaken ? 'text-red-500' : 'text-brand-400 group-focus-within:text-gold-500'}`} />
            </div>
            <select
              className={`w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all appearance-none font-sans ${isSlotTaken ? 'text-red-600 font-bold' : ''}`}
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
            >
              {TIME_SLOTS.map(t => (
                <option key={t} value={t}>{t} hs {existingAppointments.some(a => a.date === formData.date && a.time === t) ? '(OCUPADO)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="group relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-brand-400 group-focus-within:text-gold-500 transition-colors" />
            </div>
            <select
              className="w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all appearance-none font-sans"
              value={formData.payment}
              onChange={(e) => handleChange('payment', e.target.value)}
            >
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Phone */}
        <div className="group relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-brand-400 group-focus-within:text-gold-500 transition-colors" />
          </div>
          <input
            type="tel"
            required
            placeholder="WHATSAPP (Ej: 0981...)"
            className="w-full bg-brand-50 border border-brand-200 text-brand-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-brand-900 focus:bg-white transition-all placeholder:text-brand-400 font-sans"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        {isSlotTaken && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                <Ban className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold uppercase tracking-wide">El horario seleccionado ya no está disponible. Por favor, elige otro.</p>
            </div>
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
        )}

        <button
          type="submit"
          disabled={isSlotTaken}
          className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg mt-8 uppercase tracking-widest font-sans text-sm ${
            isSlotTaken 
            ? 'bg-brand-200 text-brand-400 cursor-not-allowed border border-brand-300' 
            : 'bg-brand-900 hover:bg-black text-white'
          }`}
        >
          {isSlotTaken ? 'Horario No Disponible' : 'Confirmar Reserva'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;