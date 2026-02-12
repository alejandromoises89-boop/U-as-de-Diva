
import { Appointment, AppointmentStatus, Expense } from './types';
import { BUSINESS_PHONE } from './constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
};

export const generateTimeSlots = (interval: 60 | 90 = 90): string[] => {
  const slots: string[] = [];
  let currentHour = 8;
  let currentMinute = 0;

  while (currentHour < 21 || (currentHour === 21 && currentMinute === 0)) {
    const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(time);
    
    currentMinute += interval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }
  }
  return slots;
};

export const syncToGoogleSheets = async (webhookUrl: string, appointment: Appointment): Promise<boolean> => {
  if (!webhookUrl) return false;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: appointment.id,
        clientName: appointment.clientName,
        phone: appointment.phone,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        amount: appointment.amount,
        paymentMethod: appointment.paymentMethod,
        status: appointment.status,
        timestamp: new Date(appointment.createdAt).toLocaleString()
      }),
    });
    return true; 
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return false;
  }
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const cell = row[header] === undefined || row[header] === null ? '' : row[header];
      return JSON.stringify(cell);
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
  incomeData: Appointment[],
  expenseData: Expense[],
  startDate: string,
  endDate: string,
  stats: { income: number; expenses: number; net: number }
) => {
  const doc = new jsPDF();
  const title = `Reporte Financiero Diva: ${startDate} al ${endDate}`;
  
  doc.setFontSize(18);
  doc.text('NAILS by Diva - Reporte de Auditoria', 14, 20);
  
  doc.setFontSize(12);
  doc.text(title, 14, 30);
  
  doc.setFontSize(10);
  doc.text(`Ingresos Totales: ${formatCurrency(stats.income)}`, 14, 40);
  doc.text(`Egresos Totales: ${formatCurrency(stats.expenses)}`, 14, 46);
  doc.text(`Utilidad Neta: ${formatCurrency(stats.net)}`, 14, 52);

  let currentY = 60;

  // Table of Incomes
  doc.setFontSize(14);
  doc.text('Detalle de Ingresos (Citas Completadas)', 14, currentY);
  (doc as any).autoTable({
    startY: currentY + 5,
    head: [['Fecha', 'Cliente', 'Servicio', 'Monto']],
    body: incomeData.map(a => [a.date, a.clientName, a.service, formatCurrency(a.amount || 0)]),
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Table of Expenses
  doc.text('Detalle de Egresos', 14, currentY);
  (doc as any).autoTable({
    startY: currentY + 5,
    head: [['Fecha', 'Proveedor', 'Concepto', 'Monto']],
    body: expenseData.map(e => [e.date, e.provider || '-', e.description, formatCurrency(e.amount)]),
  });

  doc.save(`Auditoria_Diva_${startDate}_${endDate}.pdf`);
};

export const generateGoogleCalendarLink = (apt: Appointment, interval: number = 90): string => {
  const dateFormatted = apt.date.replace(/-/g, '');
  const timeFormatted = apt.time.replace(/:/g, '');
  const startDateTime = `${dateFormatted}T${timeFormatted}00`;
  
  const [hours, minutes] = apt.time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + interval;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  
  const endHStr = endH.toString().padStart(2, '0');
  const endMStr = endM.toString().padStart(2, '0');
  const endStr = `${dateFormatted}T${endHStr}${endMStr}00`;

  const title = encodeURIComponent(`💅 Cita Nails: ${apt.service}`);
  const details = encodeURIComponent(`Turno para ${apt.service} en Nails by Diva. Reserva: #${apt.id}`);
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endStr}&details=${details}`;
};

export const generateWhatsAppLink = (apt: Appointment, isReminder: boolean = false, overrideStatus?: AppointmentStatus): string => {
  let text = "";
  const status = overrideStatus || apt.status;

  if (status === AppointmentStatus.CONFIRMED) {
    text = `✨ *¡CITA CONFIRMADA!* ✨\n\nHola ${apt.clientName}! Hemos verificado tu pago y tu turno está oficialmente agendado.\n\n🆔 *Reserva:* #${apt.id}\n💅 *Servicio:* ${apt.service}\n📅 *Fecha:* ${formatDate(apt.date)}\n⏰ *Hora:* ${apt.time} hs\n\n¡Nos vemos pronto! 🌸`;
  } else if (status === AppointmentStatus.COMPLETED) {
    text = `🌸 *¡GRACIAS POR TU VISITA!* 🌸\n\nHola ${apt.clientName}! Fue un gusto atenderte hoy. Tus uñas quedaron fabulosas ✨. Esperamos verte pronto para tu mantenimiento!\n\nNo olvides dejarnos tu reseña en la web 💖`;
  } else if (status === AppointmentStatus.IN_REVIEW) {
    text = `🧐 *PAGO EN REVISIÓN* 🧐\n\nHola ${apt.clientName}! Hemos recibido tu comprobante de pago para la reserva #${apt.id}. Lo estamos verificando y te confirmaremos en breve ✨.`;
  } else if (isReminder) {
    text = `Hola ${apt.clientName}! Te recordamos tu cita de ${apt.service} para hoy a las ${apt.time}hs. ✨ Te esperamos!`;
  } else {
    text = `👋 Hola Diva! Hice una reserva.\n🆔 *Reserva:* #${apt.id}\n👤 *Cliente:* ${apt.clientName}\n💅 *Servicio:* ${apt.service}\n📅 *Fecha:* ${apt.date}\n⏰ *Hora:* ${apt.time} hs\n💰 *Pago:* ${apt.paymentMethod}`;
  }

  const useClientPhone = status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.COMPLETED || status === AppointmentStatus.IN_REVIEW || isReminder;
  const phone = useClientPhone ? apt.phone : BUSINESS_PHONE;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = reject;
  });
};
