import React, { useState } from 'react';
import { Appointment, PaymentMethod, AppSettings } from '../types';
import { generateGoogleCalendarLink, generateWhatsAppLink, compressImage, formatCurrency } from '../utils';
import { BANKING_DETAILS } from '../constants';
import { CheckCircle, Calendar, MessageCircle, ArrowLeft, Copy, CreditCard, Clock, MapPin, Upload, Image as ImageIcon, DollarSign, AlertCircle } from 'lucide-react';

interface ConfirmationProps {
  appointment: Appointment;
  onBack: () => void;
  settings: AppSettings;
  onUploadProof: (id: string, proof: string) => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ appointment, onBack, settings, onUploadProof }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
            alert("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    }
  };

  const isTransfer = appointment.paymentMethod === PaymentMethod.TRANSFER || appointment.paymentMethod === PaymentMethod.PIX;
  const canProceed = !isTransfer || (isTransfer && !!appointment.paymentProof);

  return (
    <div className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-10 duration-500 pb-20">
      
      {/* Status Header */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-brand-200 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-200/50 rounded-bl-full -mr-4 -mt-4"></div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-green-500/10 p-3 rounded-full border border-green-500/50 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h2 className="font-serif text-2xl text-brand-900">¡Reserva Recibida!</h2>
            <p className="text-brand-500 text-xs font-sans uppercase tracking-wide">
                {isTransfer && !appointment.paymentProof ? "Sube tu comprobante" : "Esperando confirmación"}
            </p>
          </div>
        </div>

        <div className="bg-brand-50 rounded-lg p-3 border border-brand-100 flex justify-between items-center">
           <span className="text-brand-500 text-sm font-sans uppercase tracking-wider">Nro. Reserva</span>
           <span className="text-brand-900 font-mono text-xl font-bold">#{appointment.id}</span>
        </div>
      </div>

      {/* Banking Details Card */}
      {isTransfer && (
        <div className="bg-white rounded-2xl p-6 mb-6 border-l-4 border-gold-500 shadow-md">
          <h3 className="font-sans font-bold text-brand-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gold-500" />
            Datos para Transferencia
          </h3>
          
          <div className="space-y-4">
            
            {/* Banco Familiar Card */}
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 relative group hover:border-brand-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-1 h-4 bg-gold-500 rounded-full"></div>
                 <div className="text-xs text-brand-500 font-bold uppercase tracking-wider">{BANKING_DETAILS.FAMILIAR.bank}</div>
              </div>
              <div className="flex justify-between items-end pl-3 mb-4">
                <div>
                   <span className="block text-[10px] text-brand-400 mb-0.5">{BANKING_DETAILS.FAMILIAR.label}</span>
                   <span className="text-brand-900 font-mono text-xl tracking-tight">{BANKING_DETAILS.FAMILIAR.account}</span>
                </div>
                <button 
                  onClick={() => handleCopy(BANKING_DETAILS.FAMILIAR.account, 'familiar')}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-gold-600 relative"
                  title="Copiar número de cuenta"
                >
                  {copied === 'familiar' ? (
                    <div className="absolute right-0 top-0 bottom-0 bg-green-500 text-white rounded-lg px-2 flex items-center gap-1 animate-in fade-in zoom-in duration-200 shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Copiado</span>
                    </div>
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {settings.paymentQr && (
                 <div className="mt-2 pt-3 border-t border-brand-200 flex flex-col items-center">
                    <p className="text-[10px] text-brand-400 uppercase tracking-widest mb-2">Escanear QR</p>
                    <div className="bg-white p-2 rounded-lg shadow-inner">
                        <img src={settings.paymentQr} alt="QR Familiar" className="w-32 h-32 object-contain" />
                    </div>
                 </div>
              )}
            </div>

            {/* Ueno Bank Card */}
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 relative group hover:border-brand-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                 <div className="text-xs text-brand-500 font-bold uppercase tracking-wider">{BANKING_DETAILS.UENO.bank}</div>
              </div>
              <div className="flex justify-between items-end pl-3 mb-4">
                <div>
                   <span className="block text-[10px] text-brand-400 mb-0.5">{BANKING_DETAILS.UENO.label}</span>
                   <span className="text-brand-900 font-mono text-xl tracking-tight">{BANKING_DETAILS.UENO.alias}</span>
                </div>
                <button 
                  onClick={() => handleCopy(BANKING_DETAILS.UENO.alias, 'ueno')}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-gold-600 relative"
                  title="Copiar alias"
                >
                  {copied === 'ueno' ? (
                     <div className="absolute right-0 top-0 bottom-0 bg-green-500 text-white rounded-lg px-2 flex items-center gap-1 animate-in fade-in zoom-in duration-200 shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Copiado</span>
                    </div>
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {settings.paymentQrSecondary && (
                 <div className="mt-2 pt-3 border-t border-brand-200 flex flex-col items-center">
                    <p className="text-[10px] text-brand-400 uppercase tracking-widest mb-2">Escanear QR</p>
                    <div className="bg-white p-2 rounded-lg shadow-inner">
                        <img src={settings.paymentQrSecondary} alt="QR Ueno" className="w-32 h-32 object-contain" />
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* Upload Proof Section */}
          <div className={`mt-8 pt-6 border-t ${!appointment.paymentProof ? 'border-red-100' : 'border-brand-200'}`}>
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm text-brand-800 font-bold">Comprobante de Pago</h4>
                {!appointment.paymentProof && (
                    <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded border border-red-100 font-bold flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Requerido
                    </span>
                )}
             </div>
             
             {!appointment.paymentProof ? (
                <div className="relative group">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="proof-upload"
                        disabled={isUploading}
                    />
                    <label 
                        htmlFor="proof-upload"
                        className={`flex flex-col items-center justify-center gap-2 w-full bg-brand-50 border-2 border-dashed py-8 rounded-xl cursor-pointer transition-all duration-300
                            ${!canProceed 
                                ? 'border-red-200 hover:border-red-300 text-red-400 bg-red-50' 
                                : 'border-brand-300 hover:border-brand-900 text-brand-400 hover:text-brand-900'}`}
                    >
                        {isUploading ? <span className="animate-pulse font-medium">Procesando imagen...</span> : (
                            <>
                                <Upload className={`w-8 h-8 mb-1 ${!canProceed ? 'text-red-400' : 'text-brand-400 group-hover:text-brand-900'}`} />
                                <span className="font-medium text-sm">Toque para adjuntar comprobante</span>
                                <span className="text-xs opacity-60">Formatos: JPG, PNG</span>
                            </>
                        )}
                    </label>
                </div>
             ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 transition-all animate-in zoom-in duration-300 text-green-800">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">Comprobante Recibido</p>
                        <p className="text-xs opacity-80">La imagen se ha adjuntado correctamente.</p>
                    </div>
                    <div className="bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-2xl p-6 mb-8 border border-brand-200 shadow-sm">
        <h3 className="font-sans font-bold text-brand-900 mb-4 border-b border-brand-100 pb-2">Resumen del Turno</h3>
        <div className="space-y-4 font-sans text-sm">
            <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-2 rounded-lg text-gold-600"><Clock className="w-4 h-4" /></div>
                <div>
                    <div className="text-brand-900 font-medium text-base">{appointment.date}</div>
                    <div className="text-brand-500">{appointment.time} hs</div>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-2 rounded-lg text-gold-600"><MapPin className="w-4 h-4" /></div>
                <div>
                    <div className="text-brand-900 font-medium text-base">{appointment.service}</div>
                    <div className="text-brand-500">Nails by Diva Local</div>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-2 rounded-lg text-gold-600"><CreditCard className="w-4 h-4" /></div>
                <div>
                    <div className="text-brand-900 font-medium text-base">Método de Pago</div>
                    <div className="text-brand-500">{appointment.paymentMethod}</div>
                </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-brand-100 mt-2">
                <div className="flex items-center gap-2 text-brand-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Total a Pagar</span>
                </div>
                <div className="text-brand-900 font-bold text-xl">{formatCurrency(appointment.amount || 0)}</div>
            </div>
        </div>
      </div>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-brand-200 p-4 z-50">
        <div className="max-w-md mx-auto space-y-3">
            {canProceed ? (
                <a
                href={generateWhatsAppLink(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg font-sans transform active:scale-95 hover:shadow-[#25D366]/20"
                >
                <MessageCircle className="w-5 h-5" />
                Enviar Detalles por WhatsApp
                </a>
            ) : (
                <button
                disabled
                className="flex items-center justify-center gap-2 w-full bg-brand-100 text-brand-400 font-bold py-3.5 rounded-xl transition-all font-sans cursor-not-allowed border border-brand-200 opacity-75"
                >
                <MessageCircle className="w-5 h-5 opacity-50" />
                Adjuntar Comprobante para Enviar
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                <a
                href={generateGoogleCalendarLink(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all font-sans text-xs hover:animate-bounce-subtle"
                >
                <Calendar className="w-4 h-4" />
                Agendar
                </a>

                <button
                onClick={onBack}
                disabled={!canProceed}
                className={`flex items-center justify-center gap-2 w-full border border-brand-200 py-3 rounded-xl text-xs transition-colors font-sans font-bold
                    ${canProceed 
                        ? 'hover:border-brand-900 text-brand-500 hover:text-brand-900 bg-white' 
                        : 'opacity-50 cursor-not-allowed text-brand-400 bg-brand-50'}`}
                >
                <ArrowLeft className="w-4 h-4" />
                {canProceed ? "Finalizar y Salir" : "Comprobante Requerido"}
                </button>
            </div>
        </div>
      </div>
      
    </div>
  );
};

export default Confirmation;