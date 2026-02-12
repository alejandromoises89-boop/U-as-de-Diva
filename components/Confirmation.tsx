
import React, { useState } from 'react';
import { Appointment, PaymentMethod, AppSettings, FavoriteBooking } from '../types';
import { generateGoogleCalendarLink, generateWhatsAppLink, compressImage, formatCurrency, formatDate } from '../utils';
import { BANKING_DETAILS } from '../constants';
import { CheckCircle, Calendar, MessageCircle, ArrowLeft, Copy, CreditCard, Clock, Upload, X, ZoomIn, Star } from 'lucide-react';

interface ConfirmationProps {
  appointment: Appointment;
  onBack: () => void;
  settings: AppSettings;
  onUploadProof: (id: string, proof: string) => void;
  onSaveFavorite: (phone: string, fav: FavoriteBooking) => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ appointment, onBack, settings, onUploadProof, onSaveFavorite }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [favSaved, setFavSaved] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsUploading(true);
        try {
            const compressed = await compressImage(e.target.files[0]);
            onUploadProof(appointment.id, compressed);
        } catch (error) {
            console.error(error);
            alert("Error al subir imagen");
        } finally {
            setIsUploading(false);
        }
    }
  };

  const isTransfer = appointment.paymentMethod === PaymentMethod.TRANSFER || appointment.paymentMethod === PaymentMethod.PIX;
  const canFinalize = !isTransfer || (isTransfer && !!appointment.paymentProof);

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 pb-24 px-4">
      
      <div className="text-center py-12">
        <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
                <CheckCircle className="w-10 h-10 text-white" />
            </div>
        </div>
        <h2 className="font-serif text-4xl text-brand-900 mb-2">¡Reserva Pre-Confirmada!</h2>
        <p className="text-brand-500 text-sm font-sans uppercase tracking-[0.2em] font-black">Turno Diva #{appointment.id}</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-brand-100 overflow-hidden mb-8">
          <div className="bg-brand-900 p-8 text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 block mb-4">Detalles del Servicio</span>
              <h3 className="font-serif text-3xl mb-1">{appointment.service}</h3>
              <p className="text-gold-400 font-sans text-xs font-bold uppercase tracking-widest">{formatDate(appointment.date)} • {appointment.time}HS</p>
          </div>

          <div className="p-8 space-y-6">
              <div className="border-t border-brand-100 pt-6 flex justify-between items-center">
                  <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-300">Total Inversión</span>
                      <p className="font-mono text-3xl font-black text-brand-900">{formatCurrency(appointment.amount || 0)}</p>
                  </div>
              </div>
          </div>
      </div>

      {isTransfer && (
        <div className="bg-white rounded-[2rem] p-8 mb-8 border border-brand-100 shadow-lg space-y-8">
          <h3 className="font-serif text-2xl text-brand-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gold-500" /> Información de Pago</h3>
          
          <div className="space-y-4">
            <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100">
              <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">{BANKING_DETAILS.FAMILIAR.bank}</p>
              <div className="flex justify-between items-center">
                <p className="font-mono text-lg font-bold text-brand-900">{BANKING_DETAILS.FAMILIAR.account}</p>
                <button onClick={() => handleCopy(BANKING_DETAILS.FAMILIAR.account, 'f')} className="text-gold-500 p-2 hover:bg-white rounded-full transition-colors">
                    {copied === 'f' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100">
              <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">{BANKING_DETAILS.UENO.bank}</p>
              <div className="flex justify-between items-center">
                <p className="font-mono text-lg font-bold text-brand-900">{BANKING_DETAILS.UENO.alias}</p>
                <button onClick={() => handleCopy(BANKING_DETAILS.UENO.alias, 'u')} className="text-gold-500 p-2 hover:bg-white rounded-full transition-colors">
                    {copied === 'u' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-brand-400 block text-center">Sube tu comprobante para agendar</label>
             {!appointment.paymentProof ? (
                <label className="flex flex-col items-center justify-center gap-2 w-full bg-brand-50 border-2 border-dashed border-brand-200 py-10 rounded-3xl cursor-pointer hover:border-brand-900 transition-all">
                    {isUploading ? <span className="animate-pulse text-brand-900 font-bold uppercase text-[10px]">Cargando...</span> : (
                        <>
                            <Upload className="w-8 h-8 text-brand-300" />
                            <span className="font-black text-[10px] text-brand-900 uppercase">Seleccionar Imagen</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                </label>
             ) : (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative cursor-pointer" onClick={() => setShowProofModal(true)}>
                          <img src={appointment.paymentProof} className="w-14 h-14 object-cover rounded-xl border border-green-200" alt="Proof" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <p className="font-black text-[10px] uppercase text-green-800">Recibido ✓</p>
                    </div>
                    <button onClick={() => onUploadProof(appointment.id, '')} className="text-[9px] font-black text-red-400 uppercase">Cambiar</button>
                </div>
             )}
          </div>
        </div>
      )}

      {showProofModal && appointment.paymentProof && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowProofModal(false)}>
           <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={appointment.paymentProof} className="w-full h-auto rounded-3xl shadow-2xl" alt="Full Proof" />
              <button onClick={() => setShowProofModal(false)} className="absolute -top-12 right-0 text-white"><X className="w-8 h-8" /></button>
           </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
          <button
            onClick={() => window.open(generateWhatsAppLink(appointment), '_blank')}
            disabled={!canFinalize}
            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95
              ${canFinalize ? 'bg-[#25D366] text-white hover:bg-[#20bd5a]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <MessageCircle className="w-5 h-5" /> 
            {isTransfer ? (appointment.paymentProof ? 'Notificar Pago por WhatsApp' : 'Sube tu comprobante') : 'Confirmar por WhatsApp'}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
              <a href={generateGoogleCalendarLink(appointment, settings.slotInterval)} target="_blank" rel="noopener noreferrer" className="bg-brand-900 text-white flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md">
                <Calendar className="w-4 h-4" /> Google Calendar
              </a>
              <button onClick={onBack} className="bg-white border border-brand-200 text-brand-900 flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-50 shadow-md">
                <ArrowLeft className="w-4 h-4" /> Volver Inicio
              </button>
          </div>
      </div>
    </div>
  );
};

export default Confirmation;
