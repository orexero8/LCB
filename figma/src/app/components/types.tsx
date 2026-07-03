export type RoomStatus = 'free' | 'occupied' | 'reserved' | 'cleaning' | 'blocked';
export type RoomType = 'simple' | 'double' | 'suite';
export type PaymentMethod = 'cash' | 'card' | 'partner';

export interface CurrentGuest {
  name: string;
  ref: string;
  checkIn: string;
  checkOut: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  price: number;
  bed: string;
  currentGuest?: CurrentGuest;
}

export interface MockClient {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  wilaya: string;
}

export const STATUS_COLORS: Record<RoomStatus, string> = {
  free: '#22C55E',
  occupied: '#EF4444',
  reserved: '#EAB308',
  cleaning: '#3B82F6',
  blocked: '#94A3B8',
};

export const STATUS_BG: Record<RoomStatus, string> = {
  free: '#DCFCE7',
  occupied: '#FEE2E2',
  reserved: '#FEF9C3',
  cleaning: '#DBEAFE',
  blocked: '#F1F5F9',
};

export const STATUS_TEXT: Record<RoomStatus, string> = {
  free: '#15803D',
  occupied: '#B91C1C',
  reserved: '#854D0E',
  cleaning: '#1D4ED8',
  blocked: '#475569',
};

export const STATUS_LABELS: Record<RoomStatus, string> = {
  free: 'Libre',
  occupied: 'Occupée',
  reserved: 'Réservée',
  cleaning: 'À nettoyer',
  blocked: 'Bloquée',
};

export const TYPE_LABELS: Record<RoomType, string> = {
  simple: 'Chambre Simple',
  double: 'Chambre Double',
  suite: 'Suite',
};

export const TODAY = '17/06/2026';

export const ROOMS: Room[] = [
  // Étage 1
  { id: '101', number: '101', floor: 1, type: 'simple', status: 'occupied', price: 4500, bed: '1 lit simple', currentGuest: { name: 'Ahmed Benali', ref: 'RES-2026-001', checkIn: '15/06/2026', checkOut: '18/06/2026' } },
  { id: '102', number: '102', floor: 1, type: 'simple', status: 'free', price: 4500, bed: '1 lit simple' },
  { id: '103', number: '103', floor: 1, type: 'double', status: 'reserved', price: 6500, bed: '1 lit double', currentGuest: { name: 'Famille Khelil', ref: 'RES-2026-002', checkIn: '17/06/2026', checkOut: '20/06/2026' } },
  { id: '104', number: '104', floor: 1, type: 'double', status: 'cleaning', price: 6500, bed: '1 lit double' },
  { id: '105', number: '105', floor: 1, type: 'simple', status: 'occupied', price: 4500, bed: '1 lit simple', currentGuest: { name: 'Mourad Saidi', ref: 'RES-2026-003', checkIn: '16/06/2026', checkOut: '19/06/2026' } },
  { id: '106', number: '106', floor: 1, type: 'simple', status: 'free', price: 4500, bed: '1 lit simple' },
  { id: '107', number: '107', floor: 1, type: 'double', status: 'blocked', price: 6500, bed: '1 lit double' },
  { id: '108', number: '108', floor: 1, type: 'double', status: 'free', price: 6500, bed: '1 lit double' },
  // Étage 2
  { id: '201', number: '201', floor: 2, type: 'double', status: 'occupied', price: 7000, bed: '1 lit double', currentGuest: { name: 'Leila Mansouri', ref: 'RES-2026-004', checkIn: '14/06/2026', checkOut: '17/06/2026' } },
  { id: '202', number: '202', floor: 2, type: 'simple', status: 'free', price: 5000, bed: '1 lit simple' },
  { id: '203', number: '203', floor: 2, type: 'simple', status: 'occupied', price: 5000, bed: '1 lit simple', currentGuest: { name: 'Yacine Boukhari', ref: 'RES-2026-005', checkIn: '15/06/2026', checkOut: '18/06/2026' } },
  { id: '204', number: '204', floor: 2, type: 'double', status: 'reserved', price: 7000, bed: '1 lit double', currentGuest: { name: 'Couple Hadj', ref: 'RES-2026-006', checkIn: '18/06/2026', checkOut: '22/06/2026' } },
  { id: '205', number: '205', floor: 2, type: 'double', status: 'cleaning', price: 7000, bed: '1 lit double' },
  { id: '206', number: '206', floor: 2, type: 'simple', status: 'free', price: 5000, bed: '1 lit simple' },
  { id: '207', number: '207', floor: 2, type: 'double', status: 'occupied', price: 7000, bed: '1 lit double', currentGuest: { name: 'Ibrahim Cherif', ref: 'RES-2026-007', checkIn: '16/06/2026', checkOut: '21/06/2026' } },
  { id: '208', number: '208', floor: 2, type: 'simple', status: 'free', price: 5000, bed: '1 lit simple' },
  // Étage 3
  { id: '301', number: '301', floor: 3, type: 'suite', status: 'occupied', price: 15000, bed: '1 lit king', currentGuest: { name: 'M. Amrani (Direction)', ref: 'RES-2026-008', checkIn: '13/06/2026', checkOut: '20/06/2026' } },
  { id: '302', number: '302', floor: 3, type: 'suite', status: 'free', price: 15000, bed: '1 lit king' },
  { id: '303', number: '303', floor: 3, type: 'double', status: 'reserved', price: 8000, bed: '2 lits simples', currentGuest: { name: 'Groupe Sonatrach', ref: 'RES-2026-009', checkIn: '19/06/2026', checkOut: '25/06/2026' } },
  { id: '304', number: '304', floor: 3, type: 'double', status: 'free', price: 8000, bed: '2 lits simples' },
  { id: '305', number: '305', floor: 3, type: 'suite', status: 'blocked', price: 18000, bed: '1 lit king' },
  { id: '306', number: '306', floor: 3, type: 'double', status: 'occupied', price: 8000, bed: '2 lits simples', currentGuest: { name: 'Mme Bouzid', ref: 'RES-2026-010', checkIn: '15/06/2026', checkOut: '17/06/2026' } },
];

export const MOCK_CLIENTS: MockClient[] = [
  { id: '1', name: 'Ahmed Benali', phone: '0551 23 45 67', idNumber: '10 120 153 042', wilaya: 'Alger' },
  { id: '2', name: 'Leila Mansouri', phone: '0661 98 76 54', idNumber: '20 285 205 018', wilaya: 'Oran' },
  { id: '3', name: 'Karim Bouzidi', phone: '0770 44 55 66', idNumber: '15 354 182 007', wilaya: 'Constantine' },
  { id: '4', name: 'Fatima Hadj', phone: '0555 12 34 56', idNumber: '18 406 315 003', wilaya: 'Blida' },
  { id: '5', name: 'Youssef Amrani', phone: '0699 87 65 43', idNumber: '22 150 261 025', wilaya: 'Tizi Ouzou' },
  { id: '6', name: 'Samira Cherif', phone: '0771 55 44 33', idNumber: '17 234 199 011', wilaya: 'Sétif' },
  { id: '7', name: 'Mourad Saidi', phone: '0558 66 77 88', idNumber: '11 380 174 029', wilaya: 'Annaba' },
];
