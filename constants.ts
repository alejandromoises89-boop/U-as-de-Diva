import { ServiceType, PaymentMethod, CatalogItem } from './types';

export const BUSINESS_PHONE = "595992698406";
export const ADMIN_PIN = "2024";

export const SERVICES_LIST = Object.values(ServiceType);
export const PAYMENT_METHODS = Object.values(PaymentMethod);

export const BANKING_DETAILS = {
  FAMILIAR: {
    bank: "Banco Familiar",
    account: "815643114",
    label: "Nro. Cuenta"
  },
  UENO: {
    bank: "Ueno Bank",
    alias: "4437206",
    label: "Alias / C.I."
  }
};

export const CATALOG: Record<ServiceType, CatalogItem> = {
  [ServiceType.SPA_MANOS]: {
    id: ServiceType.SPA_MANOS,
    title: "Spa de Manos",
    price: 25000,
    description: "Exfoliación, hidratación profunda y cuidado de cutículas para unas manos suaves y renovadas.",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.MANTENIMIENTO]: {
    id: ServiceType.MANTENIMIENTO,
    title: "Mantenimiento",
    price: 80000,
    description: "Relleno y perfeccionamiento en tonos Nude/Marrón. Ideal para mantener la elegancia.",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.CURSO]: {
    id: ServiceType.CURSO,
    title: "Curso Técnica de Uñas",
    price: 400000,
    description: "Formación profesional: Preparación, uso de brocas, Soft Gel, Semipermanente. Incluye certificado y materiales.",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.RETIRO]: {
    id: ServiceType.RETIRO,
    title: "Retiro",
    price: 30000,
    description: "Retiro cuidadoso de material preservando la salud de tu uña natural.",
    image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.TRADICIONAL]: {
    id: ServiceType.TRADICIONAL,
    title: "Tradicional",
    price: 50000,
    description: "Limpieza profunda y esmaltado clásico. Tonos vibrantes como el rojo intenso.",
    image: "https://images.unsplash.com/photo-1599695663678-01d7a35368a6?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.SEMIPERMANENTE]: {
    id: ServiceType.SEMIPERMANENTE,
    title: "Semipermanente",
    price: 60000,
    description: "Esmaltado de larga duración con brillo intenso y curado en cabina. Acabado perfecto.",
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.SOFT_GEL]: {
    id: ServiceType.SOFT_GEL,
    title: "Soft Gel",
    price: 100000,
    description: "Extensión completa con tips de gel. Aspecto natural, ligero y resistente.",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=800"
  },
  [ServiceType.ESCULPIDAS]: {
    id: ServiceType.ESCULPIDAS,
    title: "Esculpidas en Gel",
    price: 130000,
    description: "Construcción artesanal para lograr la forma y largo perfecto. Diseños personalizados.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800"
  }
};

export const MOTIVATIONAL_QUOTES = [
  "Tu belleza comienza en el momento en que decides ser tú misma.",
  "Las uñas son el punto final de una frase llamada estilo.",
  "Que tu actitud siempre te combine con las uñas.",
  "Descubrí el arte de unas manos impecables.",
  "La elegancia es la única belleza que nunca se marchita.",
  "Hoy es un día perfecto para brillar.",
  "Eres fuerte, eres valiosa, eres hermosa.",
  "Tus manos hablan de ti.",
  "El cuidado personal no es un lujo, es una necesidad.",
  "Una mujer con uñas bonitas no necesita suerte, ya tiene actitud."
];

// Generate time slots from 08:00 to 22:00 (as per image "Abierto 8:00-22:00")
export const TIME_SLOTS: string[] = [];
for (let h = 8; h < 22; h++) {
  const hour = h.toString().padStart(2, '0');
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:30`);
}

export const STORAGE_KEY = 'nails_by_diva_data_v3';
export const EXPENSES_KEY = 'nails_by_diva_expenses_v3';
export const SETTINGS_KEY = 'nails_by_diva_settings_v3';
export const REVIEWS_KEY = 'nails_by_diva_reviews_v3';
export const CLIENT_HISTORY_KEY = 'nails_by_diva_client_history_v3';
export const CATALOG_KEY = 'nails_by_diva_catalog_v3';