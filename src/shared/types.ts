export type UserRole = 'customer' | 'stall_owner' | 'delivery_partner' | 'admin';

export type StallDomain = 'food' | 'vegetables';

export type StallCategory =
  | 'Street food'
  | 'Chaat & Snacks'
  | 'Chai & Beverages'
  | 'Fresh Vegetables'
  | 'Fruits & Juices'
  | 'Tiffin & Meals';

export type FoodType = 'Pure Veg' | 'Veg and non-veg' | 'Jain friendly' | 'Fresh Produce';

export type VerificationStatus = 'not_verified' | 'pending_review' | 'verified' | 'rejected';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface Stall {
  id: string;
  name: string;
  domain: StallDomain;
  category: StallCategory;
  emoji: string;
  foodType: FoodType;
  allergens: string;
  description: string;
  address: string;
  neighborhood: string;
  publicPhone: string;
  photos: string[];
  menu: MenuItem[];
  ownerName: string;
  ownerPhone: string;
  aadhaarLast4: string;
  aadhaarVerified: boolean;
  fssaiNumber: string;
  fssaiVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  isLive: boolean;
  isMoving: boolean;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number;
  discountText?: string;
  prepTimeMins: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'UPI' | 'Card' | 'Netbanking';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  stallId: string;
  stallName: string;
  stallEmoji: string;
  stallAddress: string;
  stallLat: number;
  stallLng: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  customerLat: number;
  customerLng: number;
  items: OrderItem[];
  subtotal: number;
  platformFee: number; // Flat 5%
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  status: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  riderLat?: number;
  riderLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'Bicycle' | 'Scooter / Bike' | 'EV Cart';
  aadhaarLast4: string;
  aadhaarVerified: boolean;
  verificationStatus: VerificationStatus;
  isOnline: boolean;
  lat: number;
  lng: number;
  completedDeliveries: number;
  earningsToday: number;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  type: 'grievance' | 'corporate' | 'data_deletion' | 'fssai_track';
  name: string;
  contact: string;
  subject: string;
  details: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface NeighborhoodPreset {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const LUDHIANA_NEIGHBORHOODS: NeighborhoodPreset[] = [
  { id: 'rajguru', label: 'Rajguru Nagar, Ludhiana', lat: 30.8924, lng: 75.7928 },
  { id: 'sarabha', label: 'Sarabha Nagar, Ludhiana', lat: 30.8872, lng: 75.8145 },
  { id: 'model_town', label: 'Model Town, Ludhiana', lat: 30.8842, lng: 75.8398 },
  { id: 'brs_nagar', label: 'BRS Nagar, Ludhiana', lat: 30.8781, lng: 75.8035 },
  { id: 'civil_lines', label: 'Civil Lines, Ludhiana', lat: 30.9102, lng: 75.8364 },
];

export interface BootstrapResponse {
  stalls: Stall[];
  orders: Order[];
  deliveryPartners: DeliveryPartner[];
  favorites: string[];
  tickets: SupportTicket[];
  simulateMovement: boolean;
}
