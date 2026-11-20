import type {
  BootstrapResponse,
  DeliveryPartner,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Stall,
  SupportTicket,
} from '../shared/types';

async function jsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }
  return data as T;
}

export const api = {
  bootstrap: () => jsonFetch<BootstrapResponse>('/api/bootstrap'),

  checkFssai: (fssaiNumber: string) =>
    jsonFetch<{ valid: boolean; cleaned: string; message: string; categoryLabel?: string }>('/api/fssai/check', {
      method: 'POST',
      body: JSON.stringify({ fssaiNumber }),
    }),

  checkAadhaar: (aadhaarNumber: string) =>
    jsonFetch<{ valid: boolean; cleaned: string; message: string }>('/api/aadhaar/check', {
      method: 'POST',
      body: JSON.stringify({ aadhaarNumber }),
    }),

  saveStall: (payload: Partial<Stall> & { aadhaarNumber?: string }) =>
    jsonFetch<Stall>('/api/stalls', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleStallLive: (id: string, isLive?: boolean) =>
    jsonFetch<Stall>(`/api/stalls/${id}/toggle-live`, {
      method: 'PATCH',
      body: JSON.stringify({ isLive }),
    }),

  verifyStall: (id: string, approve: boolean, note?: string) =>
    jsonFetch<Stall>(`/api/stalls/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approve, note }),
    }),

  moveStall: (id: string, lat?: number, lng?: number) =>
    jsonFetch<Stall>(`/api/stalls/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    }),

  tickMovement: (simulateMovement?: boolean) =>
    jsonFetch<{ stalls: Stall[]; simulateMovement: boolean }>('/api/stalls/tick-movement', {
      method: 'POST',
      body: JSON.stringify({ simulateMovement }),
    }),

  placeOrder: (payload: {
    stallId: string;
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    customerLat: number;
    customerLng: number;
    paymentMethod: PaymentMethod;
  }) =>
    jsonFetch<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    extra?: { deliveryPartnerId?: string; riderLat?: number; riderLng?: number }
  ) =>
    jsonFetch<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    }),

  clearOrders: () => jsonFetch<{ cleared: boolean }>('/api/orders', { method: 'DELETE' }),

  saveDeliveryPartner: (payload: Partial<DeliveryPartner> & { aadhaarNumber?: string }) =>
    jsonFetch<DeliveryPartner>('/api/delivery-partners', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyDeliveryPartner: (id: string, approve: boolean) =>
    jsonFetch<DeliveryPartner>(`/api/delivery-partners/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approve }),
    }),

  toggleFavorite: (stallId: string) =>
    jsonFetch<{ favorites: string[] }>(`/api/customer/favorites/${stallId}`, {
      method: 'POST',
    }),

  submitTicket: (payload: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) =>
    jsonFetch<SupportTicket>('/api/support/ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
