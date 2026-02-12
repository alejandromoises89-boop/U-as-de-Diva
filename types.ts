
export enum PaymentMethod {
  CASH = "Efectivo",
  TRANSFER = "Transferencia",
  PIX = "Pix"
}

export enum AppointmentStatus {
  PENDING = "PENDIENTE",
  IN_REVIEW = "EN REVISIÓN",
  CONFIRMED = "CONFIRMADO",
  COMPLETED = "COMPLETADO"
}

export enum ServiceType {
  SPA_MANOS = "Spa de manos",
  RETIRO = "Retiro",
  TRADICIONAL = "Tradicional",
  SEMIPERMANENTE = "Semipermanente",
  MANTENIMIENTO = "Mantenimiento",
  SOFT_GEL = "Soft gel",
  ESCULPIDAS = "Esculpidas en gel",
  CURSO = "Curso Técnica de Uñas"
}

export interface Appointment {
  id: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string; 
  paymentMethod: PaymentMethod;
  phone: string;
  status: AppointmentStatus;
  createdAt: number;
  amount?: number;
  paymentProof?: string; 
  thankYouSent?: boolean;
  notes?: string; 
}

export interface FavoriteBooking {
  clientName: string;
  service: string;
  time: string;
  paymentMethod: PaymentMethod;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  provider?: string;
  notes?: string;
  image?: string; 
}

export interface Review {
  id: string;
  clientName: string;
  rating: number; 
  comment: string;
  date: string;
}

export interface ClientHistory {
  [phoneNumber: string]: number[]; 
}

export interface CatalogItem {
  id: string; 
  title: string;
  price: number;
  description: string;
  image: string;
}

export interface AppSettings {
  paymentQr?: string; 
  paymentQrSecondary?: string; 
  slotInterval?: 60 | 90; 
  googleSheetWebhookUrl?: string; // URL de Google Apps Script
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface FinancialStats {
  income: number;
  expenses: number;
  net: number;
}
