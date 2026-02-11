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

export enum PaymentMethod {
  CASH = "Efectivo",
  TRANSFER = "Transferencia",
  PIX = "Pix"
}

export enum AppointmentStatus {
  PENDING = "PENDIENTE",
  CONFIRMED = "CONFIRMADO",
  COMPLETED = "COMPLETADO"
}

export interface Appointment {
  id: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: ServiceType;
  paymentMethod: PaymentMethod;
  phone: string;
  status: AppointmentStatus;
  createdAt: number;
  amount?: number;
  paymentProof?: string; // Base64 string of the image
  thankYouSent?: boolean;
  notes?: string; // Internal admin notes/comments
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface CatalogItem {
  id: ServiceType;
  title: string;
  price: number;
  description: string;
  image: string;
}

export interface AppSettings {
  paymentQr?: string; // Primary (Familiar)
  paymentQrSecondary?: string; // Secondary (Ueno)
}

export interface ClientHistory {
  [phoneNumber: string]: number[]; // Indices of used quotes
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}