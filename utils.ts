import { Appointment } from './types';
import { BUSINESS_PHONE, MOTIVATIONAL_QUOTES } from './constants';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
};

export const getUniqueQuoteIndex = (usedIndices: number[] = []): number => {
  const allIndices = MOTIVATIONAL_QUOTES.map((_, i) => i);
  // Filter out indices that are in the used list
  const available = allIndices.filter(i => !usedIndices.includes(i));
  
  // If we've used all quotes, reset (pick any random one)
  if (available.length === 0) {
    return Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  }
  
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};

export const getQuoteByIndex = (index: number): string => {
  return MOTIVATIONAL_QUOTES[index] || MOTIVATIONAL_QUOTES[0];
};

export const generateGoogleCalendarLink = (apt: Appointment): string => {
  // Format: YYYYMMDDTHHmm00
  const startDateTime = `${apt.date.replace(/-/g, '')}T${apt.time.replace(/:/g, '')}00`;
  
  // Calculate end time (assume 2 hours)
  const [hours, minutes] = apt.time.split(':').map(Number);
  const endDate = new Date(apt.date);
  endDate.setHours(hours + 2, minutes);
  
  const endH = hours + 2;
  const endM = minutes;
  const endHStr = endH.toString().padStart(2, '0');
  const endMStr = endM.toString().padStart(2, '0');
  const endStr = `${apt.date.replace(/-/g, '')}T${endHStr}${endMStr}00`;

  const title = encodeURIComponent(`💅 Cita Nails: ${apt.service}`);
  const details = encodeURIComponent(`Turno para ${apt.service} en Nails by Diva. ¡Te esperamos!\nReserva: #${apt.id}`);
  const location = encodeURIComponent("Nails by Diva Local");

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endStr}&details=${details}&location=${location}`;
};

export const generateWhatsAppLink = (apt: Appointment, isReminder: boolean = false): string => {
  let text = "";
  
  if (isReminder) {
    text = `Hola ${apt.clientName}! Te recordamos tu cita de ${apt.service} para hoy a las ${apt.time}hs. ✨ Te esperamos!`;
  } else {
    // Detailed confirmation message for the client to send
    text = `👋 Hola Diva! Hice una reserva.
    
🆔 *Reserva Nro:* #${apt.id}
👤 *Cliente:* ${apt.clientName}
💅 *Servicio:* ${apt.service}
📅 *Fecha:* ${apt.date}
⏰ *Hora:* ${apt.time} hs
💰 *Pago:* ${apt.paymentMethod}

📎 *Adjunto el comprobante de pago aquí abajo* 👇`;
  }
  
  const phone = isReminder ? apt.phone : BUSINESS_PHONE;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
};

export const generateThankYouLink = (apt: Appointment, quoteText: string): string => {
  const text = `🌸 Hola ${apt.clientName}!
  
Muchas gracias por tu preferencia el día de hoy. Fue un placer atenderte. ✨

_"${quoteText}"_

Si te gustó el servicio, te invitamos a dejarnos una reseña en nuestra app. ⭐⭐⭐⭐⭐

¡Esperamos verte pronto! 💅`;
  
  return `https://api.whatsapp.com/send?phone=${apt.phone}&text=${encodeURIComponent(text)}`;
};

/**
 * Compresses an image file to a base64 string with reduced quality/size
 * to ensure it fits in localStorage.
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only resize if wider than max width
        if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress to JPEG with 0.6 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};