import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type {
  BootstrapResponse,
  DeliveryPartner,
  Order,
  OrderStatus,
  Stall,
  SupportTicket,
} from './src/shared/types.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'movana-store.json');

interface StoreState {
  stalls: Stall[];
  orders: Order[];
  deliveryPartners: DeliveryPartner[];
  favorites: string[];
  tickets: SupportTicket[];
  simulateMovement: boolean;
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function validateAadhaarNumber(raw: string): { valid: boolean; cleaned: string; message: string } {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length !== 12) {
    return { valid: false, cleaned, message: 'Aadhaar number must be exactly 12 digits.' };
  }
  if (/^[01]/.test(cleaned)) {
    return { valid: false, cleaned, message: 'Aadhaar number cannot start with 0 or 1.' };
  }
  let c = 0;
  const digits = cleaned.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  if (c !== 0) {
    return {
      valid: false,
      cleaned,
      message: 'Invalid Aadhaar checksum. Try demo Aadhaar 2345 6789 0128 or a valid 12-digit number.',
    };
  }
  return { valid: true, cleaned, message: '12-digit Aadhaar format & Verhoeff checksum verified.' };
}

function validateFssaiCode(raw: string): { valid: boolean; cleaned: string; message: string; categoryLabel?: string } {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length !== 14) {
    return { valid: false, cleaned, message: 'FSSAI licence / registration number must be 14 digits.' };
  }
  const firstDigit = cleaned[0];
  if (firstDigit !== '1' && firstDigit !== '2') {
    return { valid: false, cleaned, message: 'FSSAI code must begin with 1 (Licence) or 2 (Petty Food Registration).' };
  }
  const stateCode = parseInt(cleaned.slice(1, 3), 10);
  if (stateCode < 1 || stateCode > 38) {
    return { valid: false, cleaned, message: 'Invalid FSSAI state code in digits 2–3.' };
  }
  const categoryLabel =
    firstDigit === '2'
      ? 'Basic Petty Food Vendor Registration (FoSCoS)'
      : 'State / Central FSSAI Food Licence (FoSCoS)';
  return {
    valid: true,
    cleaned,
    message: `Valid 14-digit FSSAI code (${categoryLabel}).`,
    categoryLabel,
  };
}

function createInitialState(): StoreState {
  const now = new Date().toISOString();
  const stalls: Stall[] = [
    {
      id: 'stall-sharma-chaat',
      name: 'Sharma Ji Golgappa & Chaat',
      domain: 'food',
      category: 'Chaat & Snacks',
      emoji: '🥟',
      foodType: 'Pure Veg',
      allergens: 'Wheat gluten, chickpeas, mint',
      description: 'Crispy suji & atta golgappas with fresh hing-jeera pani, aloo tikki chaat, and dahi bhalla.',
      address: 'Opposite Main Market Gate, Rajguru Nagar, Ludhiana',
      neighborhood: 'Rajguru Nagar, Ludhiana',
      publicPhone: '9876543210',
      photos: ['/src/assets/images/stall_chaat_thela_1795152483783.jpg'],
      menu: [
        { id: 'm-chaat-1', name: 'Suji Golgappa (8 pcs)', price: 45, unit: 'plate', isAvailable: true, isPopular: true },
        { id: 'm-chaat-2', name: 'Desi Ghee Aloo Tikki Chaat', price: 70, unit: 'plate', isAvailable: true, isPopular: true },
        { id: 'm-chaat-3', name: 'Bhalla Papdi Chaat', price: 80, unit: 'plate', isAvailable: true },
        { id: 'm-chaat-4', name: 'Sweet & Mint Pani Bottle (500 ml)', price: 40, unit: 'bottle', isAvailable: true },
      ],
      ownerName: 'Ramesh Sharma',
      ownerPhone: '9876543210',
      aadhaarLast4: '0128',
      aadhaarVerified: true,
      fssaiNumber: '22125678901234',
      fssaiVerified: true,
      verificationStatus: 'verified',
      isLive: true,
      isMoving: true,
      lat: 30.8938,
      lng: 75.7955,
      rating: 4.8,
      ratingCount: 214,
      discountText: 'UPTO 20% OFF',
      prepTimeMins: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stall-amritsari-kulcha',
      name: 'Amritsari Kulcha Junction',
      domain: 'food',
      category: 'Street food',
      emoji: '🫓',
      foodType: 'Pure Veg',
      allergens: 'Wheat gluten, dairy butter',
      description: 'Crisp tandoor-baked stuffed kulchas served with slow-simmered pindi chole & imli-pyaaz chutney.',
      address: 'Kipps Market Lane, Sarabha Nagar, Ludhiana',
      neighborhood: 'Sarabha Nagar, Ludhiana',
      publicPhone: '9814011223',
      photos: ['/src/assets/images/stall_chole_kulche_1795152482660.jpg'],
      menu: [
        { id: 'm-kul-1', name: 'Amritsari Aloo Pyaaz Kulcha Plate', price: 75, unit: '2 pcs + chole', isAvailable: true, isPopular: true },
        { id: 'm-kul-2', name: 'Paneer Chur-Chur Kulcha', price: 110, unit: 'plate', isAvailable: true, isPopular: true },
        { id: 'm-kul-3', name: 'Extra Pindi Chole Bowl', price: 40, unit: 'bowl', isAvailable: true },
        { id: 'm-kul-4', name: 'Salted Jeera Lassi', price: 45, unit: 'kulhad', isAvailable: true },
      ],
      ownerName: 'Harpreet Singh Gill',
      ownerPhone: '9814011223',
      aadhaarLast4: '8921',
      aadhaarVerified: true,
      fssaiNumber: '12124455667788',
      fssaiVerified: true,
      verificationStatus: 'verified',
      isLive: true,
      isMoving: false,
      lat: 30.8895,
      lng: 75.8112,
      rating: 4.7,
      ratingCount: 168,
      discountText: 'FLAT ₹20 OFF',
      prepTimeMins: 14,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stall-pahadi-momos',
      name: 'Pahadi Steamed & Tandoori Momos',
      domain: 'food',
      category: 'Street food',
      emoji: '🥟',
      foodType: 'Veg and non-veg',
      allergens: 'Wheat gluten, soy, sesame',
      description: 'Hand-folded Himalayan momos steamed over bamboo baskets with roasted red chilli-garlic dip.',
      address: 'Near Gol Market Park, Model Town, Ludhiana',
      neighborhood: 'Model Town, Ludhiana',
      publicPhone: '9872233445',
      photos: ['/src/assets/images/stall_momos_cart_1795152483308.jpg'],
      menu: [
        { id: 'm-momo-1', name: 'Steamed Veg Momos (8 pcs)', price: 60, unit: 'plate', isAvailable: true, isPopular: true },
        { id: 'm-momo-2', name: 'Crispy Kurkure Paneer Momos', price: 95, unit: 'plate', isAvailable: true, isPopular: true },
        { id: 'm-momo-3', name: 'Tandoori Chicken Momos (8 pcs)', price: 120, unit: 'plate', isAvailable: true },
        { id: 'm-momo-4', name: 'Hot Thukpa Noodle Soup', price: 85, unit: 'bowl', isAvailable: true },
      ],
      ownerName: 'Tenzin Dorje',
      ownerPhone: '9872233445',
      aadhaarLast4: '4419',
      aadhaarVerified: true,
      fssaiNumber: '22125890123456',
      fssaiVerified: true,
      verificationStatus: 'verified',
      isLive: true,
      isMoving: true,
      lat: 30.8856,
      lng: 75.8282,
      rating: 4.6,
      ratingCount: 132,
      discountText: 'UPTO 25% OFF',
      prepTimeMins: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stall-kisan-sabzi',
      name: 'Kisan Fresh Sabzi Thela',
      domain: 'vegetables',
      category: 'Fresh Vegetables',
      emoji: '🥬',
      foodType: 'Fresh Produce',
      allergens: 'None',
      description: 'Morning mandi-fresh local Punjab vegetables, leafy greens, vine tomatoes, and lemons brought straight to your street.',
      address: 'Block B Corner, Rajguru Nagar, Ludhiana',
      neighborhood: 'Rajguru Nagar, Ludhiana',
      publicPhone: '9815566778',
      photos: ['/src/assets/images/stall_vegetable_cart_1795152482561.jpg'],
      menu: [
        { id: 'm-veg-1', name: 'Farm Tomatoes (1 kg)', price: 42, unit: '1 kg', isAvailable: true, isPopular: true },
        { id: 'm-veg-2', name: 'Tender Bhindi / Okra (500 g)', price: 35, unit: '500 g', isAvailable: true, isPopular: true },
        { id: 'm-veg-3', name: 'Fresh Cauliflower (1 pc)', price: 48, unit: 'piece', isAvailable: true },
        { id: 'm-veg-4', name: 'Daily Sabzi Combo Basket', price: 145, unit: '3 kg mix', isAvailable: true, isPopular: true },
      ],
      ownerName: 'Gurmeet Singh',
      ownerPhone: '9815566778',
      aadhaarLast4: '7732',
      aadhaarVerified: true,
      fssaiNumber: '22124321098765',
      fssaiVerified: true,
      verificationStatus: 'verified',
      isLive: true,
      isMoving: true,
      lat: 30.8904,
      lng: 75.7888,
      rating: 4.9,
      ratingCount: 305,
      discountText: 'MANDI PRICES',
      prepTimeMins: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stall-kulhad-chai',
      name: 'Kulhad Chai & Bun Maska Cart',
      domain: 'food',
      category: 'Chai & Beverages',
      emoji: '☕',
      foodType: 'Pure Veg',
      allergens: 'Milk dairy, wheat gluten',
      description: 'Slow-brewed ginger-cardamom masala chai in baked clay kulhads with Amul-buttered bun maska & hot samosas.',
      address: 'Fountain Chowk Circle, Civil Lines, Ludhiana',
      neighborhood: 'Civil Lines, Ludhiana',
      publicPhone: '9878899001',
      photos: ['/src/assets/images/stall_chai_bun_1795152482419.jpg'],
      menu: [
        { id: 'm-chai-1', name: 'Adrak Elaichi Kulhad Chai', price: 25, unit: 'cup', isAvailable: true, isPopular: true },
        { id: 'm-chai-2', name: 'Toasted Bun Maska', price: 40, unit: 'piece', isAvailable: true, isPopular: true },
        { id: 'm-chai-3', name: 'Punjabi Aloo Samosa (2 pcs)', price: 36, unit: 'plate', isAvailable: true },
        { id: 'm-chai-4', name: 'Chai + Bun Maska Morning Combo', price: 60, unit: 'combo', isAvailable: true },
      ],
      ownerName: 'Vikramjit Verma',
      ownerPhone: '9878899001',
      aadhaarLast4: '3304',
      aadhaarVerified: true,
      fssaiNumber: '22125112233445',
      fssaiVerified: true,
      verificationStatus: 'verified',
      isLive: true,
      isMoving: false,
      lat: 30.9038,
      lng: 75.8261,
      rating: 4.7,
      ratingCount: 190,
      discountText: 'COMBO DEALS',
      prepTimeMins: 8,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const deliveryPartners: DeliveryPartner[] = [
    {
      id: 'partner-aman',
      name: 'Amanpreet Singh',
      phone: '9815098150',
      vehicleType: 'Scooter / Bike',
      aadhaarLast4: '0128',
      aadhaarVerified: true,
      verificationStatus: 'verified',
      isOnline: true,
      lat: 30.8915,
      lng: 75.7995,
      completedDeliveries: 28,
      earningsToday: 640,
      updatedAt: now,
    },
  ];

  return {
    stalls,
    orders: [],
    deliveryPartners,
    favorites: ['stall-sharma-chaat'],
    tickets: [],
    simulateMovement: true,
  };
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initial = createInitialState();
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as StoreState;
  } catch {
    return createInitialState();
  }
}

let store: StoreState = loadStore();

function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/bootstrap', (_req, res) => {
    const payload: BootstrapResponse = {
      stalls: store.stalls,
      orders: store.orders,
      deliveryPartners: store.deliveryPartners,
      favorites: store.favorites,
      tickets: store.tickets,
      simulateMovement: store.simulateMovement,
    };
    res.json(payload);
  });

  app.post('/api/fssai/check', (req, res) => {
    const code = String(req.body?.fssaiNumber ?? '');
    const result = validateFssaiCode(code);
    res.json(result);
  });

  app.post('/api/aadhaar/check', (req, res) => {
    const num = String(req.body?.aadhaarNumber ?? '');
    const result = validateAadhaarNumber(num);
    res.json(result);
  });

  app.post('/api/stalls', (req, res) => {
    const body = req.body as Partial<Stall> & { aadhaarNumber?: string };
    if (!body.name?.trim()) {
      return res.status(400).json({ error: 'Stall name is required.' });
    }
    if (!body.address?.trim()) {
      return res.status(400).json({ error: 'Stall address is required.' });
    }

    const now = new Date().toISOString();
    const fssaiCheck = body.fssaiNumber ? validateFssaiCode(body.fssaiNumber) : { valid: false, cleaned: '' };
    const aadhaarCheck = body.aadhaarNumber
      ? validateAadhaarNumber(body.aadhaarNumber)
      : { valid: false, cleaned: '' };

    const existingIdx = body.id ? store.stalls.findIndex((s) => s.id === body.id) : -1;

    if (existingIdx >= 0) {
      const existing = store.stalls[existingIdx];
      const fssaiValid = fssaiCheck.valid || existing.fssaiVerified;
      const aadhaarValid = aadhaarCheck.valid || existing.aadhaarVerified;
      const updated: Stall = {
        ...existing,
        ...body,
        fssaiNumber: fssaiCheck.cleaned || existing.fssaiNumber,
        fssaiVerified: fssaiValid,
        aadhaarLast4: aadhaarCheck.cleaned ? aadhaarCheck.cleaned.slice(-4) : existing.aadhaarLast4,
        aadhaarVerified: aadhaarValid,
        verificationStatus:
          existing.verificationStatus === 'verified'
            ? 'verified'
            : fssaiValid && aadhaarValid
              ? 'pending_review'
              : 'not_verified',
        updatedAt: now,
      };
      store.stalls[existingIdx] = updated;
      persistStore();
      return res.json(updated);
    }

    const domain =
      body.category === 'Fresh Vegetables' || body.foodType === 'Fresh Produce' ? 'vegetables' : body.domain ?? 'food';

    const newStall: Stall = {
      id: `stall-${Date.now().toString(36)}`,
      name: body.name.trim(),
      domain,
      category: body.category ?? 'Street food',
      emoji: body.emoji?.trim() || (domain === 'vegetables' ? '🥬' : '🥟'),
      foodType: body.foodType ?? 'Pure Veg',
      allergens: body.allergens?.trim() || 'None specified',
      description: body.description?.trim() || 'Fresh neighborhood street stall on Móvana.',
      address: body.address.trim(),
      neighborhood: body.neighborhood ?? 'Rajguru Nagar, Ludhiana',
      publicPhone: body.publicPhone?.trim() || '',
      photos:
        body.photos && body.photos.length > 0
          ? body.photos
          : [
              domain === 'vegetables'
                ? '/src/assets/images/stall_vegetable_cart_1795152482561.jpg'
                : '/src/assets/images/stall_chaat_thela_1795152483783.jpg',
            ],
      menu: body.menu ?? [],
      ownerName: body.ownerName?.trim() || '',
      ownerPhone: body.ownerPhone?.trim() || body.publicPhone?.trim() || '',
      aadhaarLast4: aadhaarCheck.cleaned ? aadhaarCheck.cleaned.slice(-4) : '',
      aadhaarVerified: aadhaarCheck.valid,
      fssaiNumber: fssaiCheck.cleaned || '',
      fssaiVerified: fssaiCheck.valid,
      verificationStatus: fssaiCheck.valid && aadhaarCheck.valid ? 'pending_review' : 'not_verified',
      isLive: false,
      isMoving: true,
      lat: typeof body.lat === 'number' ? body.lat : 30.8924 + (Math.random() - 0.5) * 0.008,
      lng: typeof body.lng === 'number' ? body.lng : 75.7928 + (Math.random() - 0.5) * 0.008,
      rating: 4.8,
      ratingCount: 1,
      prepTimeMins: 12,
      createdAt: now,
      updatedAt: now,
    };

    store.stalls.unshift(newStall);
    persistStore();
    return res.status(201).json(newStall);
  });

  app.patch('/api/stalls/:id/toggle-live', (req, res) => {
    const stall = store.stalls.find((s) => s.id === req.params.id);
    if (!stall) return res.status(404).json({ error: 'Stall not found.' });
    if (stall.verificationStatus !== 'verified') {
      return res.status(400).json({ error: 'Stall must be verified by Company Admin before going live.' });
    }
    stall.isLive = typeof req.body?.isLive === 'boolean' ? req.body.isLive : !stall.isLive;
    stall.updatedAt = new Date().toISOString();
    persistStore();
    res.json(stall);
  });

  app.post('/api/stalls/:id/verify', (req, res) => {
    const stall = store.stalls.find((s) => s.id === req.params.id);
    if (!stall) return res.status(404).json({ error: 'Stall not found.' });
    const approve = Boolean(req.body?.approve);
    stall.verificationStatus = approve ? 'verified' : 'rejected';
    stall.fssaiVerified = approve ? true : stall.fssaiVerified;
    stall.aadhaarVerified = approve ? true : stall.aadhaarVerified;
    stall.verificationNote = String(req.body?.note ?? (approve ? 'Approved by Company Admin' : 'Documents incomplete'));
    if (approve) {
      stall.isLive = true;
    }
    stall.updatedAt = new Date().toISOString();
    persistStore();
    res.json(stall);
  });

  app.post('/api/stalls/:id/move', (req, res) => {
    const stall = store.stalls.find((s) => s.id === req.params.id);
    if (!stall) return res.status(404).json({ error: 'Stall not found.' });
    const dLat = typeof req.body?.lat === 'number' ? req.body.lat : stall.lat + (Math.random() - 0.5) * 0.0018;
    const dLng = typeof req.body?.lng === 'number' ? req.body.lng : stall.lng + (Math.random() - 0.5) * 0.0018;
    stall.lat = dLat;
    stall.lng = dLng;
    stall.updatedAt = new Date().toISOString();
    persistStore();
    res.json(stall);
  });

  app.post('/api/stalls/tick-movement', (req, res) => {
    if (typeof req.body?.simulateMovement === 'boolean') {
      store.simulateMovement = req.body.simulateMovement;
    }
    if (store.simulateMovement) {
      store.stalls = store.stalls.map((s) => {
        if (!s.isLive || !s.isMoving) return s;
        return {
          ...s,
          lat: Number((s.lat + (Math.random() - 0.5) * 0.00045).toFixed(6)),
          lng: Number((s.lng + (Math.random() - 0.5) * 0.00045).toFixed(6)),
          updatedAt: new Date().toISOString(),
        };
      });
      persistStore();
    }
    res.json({ stalls: store.stalls, simulateMovement: store.simulateMovement });
  });

  app.post('/api/orders', (req, res) => {
    const { stallId, items, customerName, customerPhone, deliveryAddress, customerLat, customerLng, paymentMethod } =
      req.body ?? {};
    const stall = store.stalls.find((s) => s.id === stallId);
    if (!stall) return res.status(404).json({ error: 'Stall not found.' });
    if (!stall.isLive) return res.status(400).json({ error: 'This stall is currently offline.' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!customerPhone?.trim() || !deliveryAddress?.trim()) {
      return res.status(400).json({ error: 'Phone number and delivery address are required.' });
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + Number(item.price) * Number(item.quantity),
      0
    );
    const platformFee = Math.round(subtotal * 0.05); // Flat 5% platform fee as shown in screenshot
    const deliveryFee = 15;
    const total = subtotal + platformFee + deliveryFee;
    const now = new Date().toISOString();

    const order: Order = {
      id: `MOV-${Math.floor(100000 + Math.random() * 900000)}`,
      stallId: stall.id,
      stallName: stall.name,
      stallEmoji: stall.emoji,
      stallAddress: stall.address,
      stallLat: stall.lat,
      stallLng: stall.lng,
      customerName: String(customerName || 'Guest Customer').trim(),
      customerPhone: String(customerPhone).trim(),
      deliveryAddress: String(deliveryAddress).trim(),
      customerLat: typeof customerLat === 'number' ? customerLat : 30.8924,
      customerLng: typeof customerLng === 'number' ? customerLng : 75.7928,
      items,
      subtotal,
      platformFee,
      deliveryFee,
      total,
      paymentMethod: paymentMethod || 'UPI',
      paymentRef: `SIM-${(paymentMethod || 'UPI').toUpperCase()}-${Date.now().toString().slice(-6)}`,
      status: 'placed',
      createdAt: now,
      updatedAt: now,
    };

    store.orders.unshift(order);
    persistStore();
    res.status(201).json(order);
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const nextStatus = req.body?.status as OrderStatus;
    if (!nextStatus) return res.status(400).json({ error: 'Next status is required.' });

    const prevStatus = order.status;
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();

    if (req.body?.deliveryPartnerId) {
      const partner = store.deliveryPartners.find((p) => p.id === req.body.deliveryPartnerId);
      if (partner) {
        order.deliveryPartnerId = partner.id;
        order.deliveryPartnerName = partner.name;
        order.deliveryPartnerPhone = partner.phone;
        order.riderLat = partner.lat;
        order.riderLng = partner.lng;
      }
    }

    if (typeof req.body?.riderLat === 'number' && typeof req.body?.riderLng === 'number') {
      order.riderLat = req.body.riderLat;
      order.riderLng = req.body.riderLng;
    } else if (nextStatus === 'picked_up') {
      order.riderLat = order.stallLat;
      order.riderLng = order.stallLng;
    } else if (nextStatus === 'out_for_delivery') {
      order.riderLat = (order.stallLat + order.customerLat) / 2;
      order.riderLng = (order.stallLng + order.customerLng) / 2;
    } else if (nextStatus === 'delivered' && prevStatus !== 'delivered') {
      order.riderLat = order.customerLat;
      order.riderLng = order.customerLng;
      if (order.deliveryPartnerId) {
        const partner = store.deliveryPartners.find((p) => p.id === order.deliveryPartnerId);
        if (partner) {
          partner.completedDeliveries += 1;
          partner.earningsToday += 30;
          partner.lat = order.customerLat;
          partner.lng = order.customerLng;
          partner.updatedAt = new Date().toISOString();
        }
      }
    }

    persistStore();
    res.json(order);
  });

  app.delete('/api/orders', (_req, res) => {
    store.orders = [];
    persistStore();
    res.json({ cleared: true });
  });

  app.post('/api/delivery-partners', (req, res) => {
    const { id, name, phone, vehicleType, aadhaarNumber, isOnline } = req.body ?? {};
    const now = new Date().toISOString();
    const aadhaarCheck = aadhaarNumber ? validateAadhaarNumber(String(aadhaarNumber)) : null;
    const existingIdx = id ? store.deliveryPartners.findIndex((p) => p.id === id) : -1;

    if (existingIdx >= 0) {
      const existing = store.deliveryPartners[existingIdx];
      const updated: DeliveryPartner = {
        ...existing,
        name: name?.trim() || existing.name,
        phone: phone?.trim() || existing.phone,
        vehicleType: vehicleType || existing.vehicleType,
        aadhaarLast4: aadhaarCheck?.cleaned ? aadhaarCheck.cleaned.slice(-4) : existing.aadhaarLast4,
        aadhaarVerified: aadhaarCheck ? aadhaarCheck.valid || existing.aadhaarVerified : existing.aadhaarVerified,
        isOnline: typeof isOnline === 'boolean' ? isOnline : existing.isOnline,
        updatedAt: now,
      };
      store.deliveryPartners[existingIdx] = updated;
      persistStore();
      return res.json(updated);
    }

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const partner: DeliveryPartner = {
      id: `partner-${Date.now().toString(36)}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      vehicleType: vehicleType || 'Scooter / Bike',
      aadhaarLast4: aadhaarCheck?.cleaned ? aadhaarCheck.cleaned.slice(-4) : '',
      aadhaarVerified: Boolean(aadhaarCheck?.valid),
      verificationStatus: aadhaarCheck?.valid ? 'pending_review' : 'not_verified',
      isOnline: Boolean(isOnline),
      lat: 30.8928,
      lng: 75.7985,
      completedDeliveries: 0,
      earningsToday: 0,
      updatedAt: now,
    };

    store.deliveryPartners.unshift(partner);
    persistStore();
    return res.status(201).json(partner);
  });

  app.post('/api/delivery-partners/:id/verify', (req, res) => {
    const partner = store.deliveryPartners.find((p) => p.id === req.params.id);
    if (!partner) return res.status(404).json({ error: 'Delivery partner not found.' });
    const approve = Boolean(req.body?.approve);
    partner.verificationStatus = approve ? 'verified' : 'rejected';
    partner.aadhaarVerified = approve ? true : partner.aadhaarVerified;
    if (approve) partner.isOnline = true;
    partner.updatedAt = new Date().toISOString();
    persistStore();
    res.json(partner);
  });

  app.post('/api/customer/favorites/:stallId', (req, res) => {
    const stallId = req.params.stallId;
    const exists = store.favorites.includes(stallId);
    if (exists) {
      store.favorites = store.favorites.filter((id) => id !== stallId);
    } else {
      store.favorites.push(stallId);
    }
    persistStore();
    res.json({ favorites: store.favorites });
  });

  app.post('/api/support/ticket', (req, res) => {
    const { type, name, contact, subject, details } = req.body ?? {};
    const ticket: SupportTicket = {
      id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      type: type || 'grievance',
      name: String(name || 'Guest').trim(),
      contact: String(contact || '').trim(),
      subject: String(subject || 'Support Inquiry').trim(),
      details: String(details || '').trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    store.tickets.unshift(ticket);
    persistStore();
    res.status(201).json(ticket);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Móvana server running on http://localhost:${PORT}`);
  });
}

startServer();
