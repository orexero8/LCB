import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Check, CheckCircle, Search, ChevronDown, ChevronUp,
  Banknote, CreditCard, Handshake, BedSingle, BedDouble, Crown, Printer, CalendarDays, Plus, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Room, RoomType, PaymentMethod,
  STATUS_COLORS, TYPE_LABELS, MOCK_CLIENTS,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-FR') + ' DA';

const calcNights = (arrival: string, departure: string) => {
  if (!arrival || !departure) return 0;
  const diff = new Date(departure).getTime() - new Date(arrival).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const fmtDateFR = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const genRef = () => `RES-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const RoomTypeIcon = ({ type, color = 'rgba(255,255,255,0.88)' }: { type: RoomType; color?: string }) => {
  if (type === 'simple') return <BedSingle size={16} color={color} />;
  if (type === 'double') return <BedDouble size={16} color={color} />;
  return <Crown size={16} color={color} />;
};

const WizardRoomTile = ({ room, selected, onToggle }: { room: Room; selected: boolean; onToggle: () => void }) => {
  const [hovered, setHovered] = useState(false);
  const bg = STATUS_COLORS[room.status];

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 90,
        height: 90,
        borderRadius: 14,
        background: bg,
        border: selected ? '3px solid #1E293B' : '3px solid transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        cursor: 'pointer',
        transform: selected || hovered ? 'scale(1.06)' : 'scale(1)',
        boxShadow: selected ? '0 6px 20px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.14s ease',
        position: 'relative',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: -8, right: -8,
          width: 24, height: 24, borderRadius: '50%',
          background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>
          <Check size={14} color="white" />
        </div>
      )}
      <RoomTypeIcon type={room.type} />
      <span style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1 }}>{room.number}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>{room.price.toLocaleString('fr-FR')} DA</span>
    </button>
  );
};

const Counter = ({ value, onChange, min = 0, max = 10 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '2px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      style={{ width: 52, height: 56, border: 'none', background: value <= min ? '#F8FAFC' : '#F1F5F9', cursor: value <= min ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Minus size={18} color={value <= min ? '#CBD5E1' : '#1E293B'} />
    </button>
    <span style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1E293B', minWidth: 48 }}>{value}</span>
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      style={{ width: 52, height: 56, border: 'none', background: value >= max ? '#F8FAFC' : '#F1F5F9', cursor: value >= max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Plus size={18} color={value >= max ? '#CBD5E1' : '#1E293B'} />
    </button>
  </div>
);

const LargeInput = ({
  label, required, ...props
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          padding: '14px 16px',
          fontSize: 18,
          border: `2px solid ${focused ? '#3B82F6' : '#E2E8F0'}`,
          borderRadius: 12,
          color: '#1E293B',
          background: 'white',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
          ...props.style,
        }}
      />
    </div>
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepBar = ({ step }: { step: number }) => {
  const steps = [
    { num: 1, label: 'Dates & Chambres' },
    { num: 2, label: 'Client & Paiement' },
    { num: 3, label: 'Confirmation' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {steps.map(({ num, label }, idx) => (
        <React.Fragment key={num}>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', margin: '0 auto 6px',
              background: step >= num ? '#1E293B' : '#E2E8F0',
              color: step >= num ? 'white' : '#94A3B8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>
              {step > num ? <Check size={18} /> : num}
            </div>
            <div style={{ fontSize: 13, color: step === num ? '#1E293B' : '#94A3B8', fontWeight: step === num ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</div>
          </div>
          {idx < 2 && (
            <div style={{ width: 80, height: 2, background: step > idx + 1 ? '#1E293B' : '#E2E8F0', flexShrink: 0, marginBottom: 22 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Payment card ─────────────────────────────────────────────────────────────

const PaymentCard = ({
  id, label, sublabel, Icon, selected, onSelect,
}: {
  id: PaymentMethod; label: string; sublabel: string;
  Icon: React.FC<{ size: number; color: string }>;
  selected: boolean; onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    style={{
      flex: 1,
      padding: '28px 20px',
      borderRadius: 16,
      border: `2px solid ${selected ? '#3B82F6' : '#E2E8F0'}`,
      background: selected ? '#EFF6FF' : 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      transition: 'all 0.14s ease',
      boxShadow: selected ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
    }}
  >
    <div style={{ width: 56, height: 56, borderRadius: 14, background: selected ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={28} color={selected ? '#1D4ED8' : '#64748B'} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: selected ? '#1D4ED8' : '#1E293B' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{sublabel}</div>
    </div>
    {selected && (
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={14} color="white" />
      </div>
    )}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  rooms: Room[];
  initialRoom: Room | null;
  onBack: () => void;
  onConfirm: (roomIds: string[], guestName: string, ref: string, checkIn: string, checkOut: string) => void;
  onBackToMap: () => void;
}

export const BookingWizard: React.FC<Props> = ({ rooms, initialRoom, onBack, onConfirm, onBackToMap }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);

  // Step 1
  const [arrival, setArrival] = useState('2026-06-17');
  const [departure, setDeparture] = useState('2026-06-20');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [married, setMarried] = useState(false);
  const [marriageActe, setMarriageActe] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Room[]>(initialRoom ? [initialRoom] : []);
  const [isSearching, setIsSearching] = useState(false);

  // Step 2
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState<{ name: string; idNumber: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  // Step 3 / success
  const [confirmationRef, setConfirmationRef] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync children ages array length with children count
  useEffect(() => {
    setChildrenAges(prev => {
      if (prev.length === children) return prev;
      if (prev.length < children) return [...prev, ...Array(children - prev.length).fill(5)];
      return prev.slice(0, children);
    });
  }, [children]);

  // Sync additional guests with adults count
  useEffect(() => {
    const needed = Math.max(0, adults - 1);
    setAdditionalGuests(prev => {
      if (prev.length === needed) return prev;
      if (prev.length < needed) return [...prev, ...Array(needed - prev.length).fill({ name: '', idNumber: '' })];
      return prev.slice(0, needed);
    });
  }, [adults]);

  // Auto-search when dates change
  useEffect(() => {
    if (arrival && departure) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 600);
      return () => clearTimeout(timer);
    }
  }, [arrival, departure]);

  const nights = calcNights(arrival, departure);
  const freeRooms = rooms.filter(r => r.status === 'free');
  const subtotal = selectedRooms.reduce((sum, r) => sum + r.price * nights, 0);
  const discountValid = discountCode.toUpperCase() === 'BIENVENUE';
  const discountAmount = discountValid ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discountAmount;

  const filteredClients = clientSearch.length > 1
    ? MOCK_CLIENTS.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : [];

  const toggleRoom = (room: Room) => {
    setSelectedRooms(prev =>
      prev.find(r => r.id === room.id) ? prev.filter(r => r.id !== room.id) : [...prev, room]
    );
  };

  const handleBack = () => {
    if (step === 1) onBack();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!arrival || !departure) { toast.error('Veuillez choisir les dates d\'arrivée et de départ'); return; }
      if (selectedRooms.length === 0) { toast.error('Veuillez sélectionner au moins une chambre'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!clientName.trim()) { toast.error('Le nom du client est obligatoire'); return; }
      if (!paymentMethod) { toast.error('Veuillez choisir un mode de paiement'); return; }
      setStep(3);
    }
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirm = () => {
    const ref = genRef();
    setConfirmationRef(ref);
    onConfirm(selectedRooms.map(r => r.id), clientName, ref, fmtDateFR(arrival), fmtDateFR(departure));
    setStep('success');
  };

  const resetWizard = () => {
    setStep(1);
    setArrival('2026-06-17');
    setDeparture('2026-06-20');
    setAdults(2);
    setChildren(0);
    setChildrenAges([]);
    setMarried(false);
    setMarriageActe('');
    setSelectedRooms([]);
    setClientSearch('');
    setClientName('');
    setPhone('');
    setIdNumber('');
    setWilaya('');
    setAdditionalGuests([]);
    setPaymentMethod(null);
    setDiscountCode('');
    setNotes('');
    setConfirmationRef('');
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '56px 64px', width: 560, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          {/* Checkmark */}
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <CheckCircle size={56} color="#22C55E" />
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Réservation confirmée !</div>
          <div style={{ fontSize: 16, color: '#64748B', marginBottom: 28 }}>La chambre est réservée avec succès.</div>

          {/* Reference */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '20px 24px', marginBottom: 32, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Numéro de référence</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#1E293B', letterSpacing: '0.04em' }}>{confirmationRef}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={onBackToMap}
              style={{ width: '100%', padding: '16px', background: '#1E293B', color: 'white', fontSize: 17, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Plan des chambres
            </button>
            <button
              onClick={() => toast.success('Reçu envoyé à l\'imprimante')}
              style={{ width: '100%', padding: '16px', background: 'white', color: '#1E293B', fontSize: 17, fontWeight: 700, borderRadius: 12, border: '2px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Printer size={20} />
              Imprimer le reçu
            </button>
            <button
              onClick={resetWizard}
              style={{ width: '100%', padding: '14px', background: 'transparent', color: '#64748B', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Nouvelle réservation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard layout ───────────────────────────────────────────────────────────

  const stepTitles: Record<number, string> = {
    1: 'Dates & Chambres',
    2: 'Client & Paiement',
    3: 'Confirmation',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Wizard header ── */}
      <header style={{ height: 72, background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 32px', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', zIndex: 30 }}>
        <button
          onClick={handleBack}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#F1F5F9', color: '#1E293B', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}
        >
          <ChevronLeft size={18} />
          {step === 1 ? 'Plan des chambres' : 'Retour'}
        </button>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StepBar step={step as number} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: '#1E293B', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#F59E0B', fontWeight: 900, fontSize: 13 }}>MG</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1E293B' }}>MRGLA Hôtel</span>
        </div>
      </header>

      {/* ── Step title ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '18px 40px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1E293B' }}>
          Étape {step} — {stepTitles[step as number]}
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 40px 120px' }}>

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Date & guest inputs */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarDays size={20} color="#3B82F6" />
                Sélection des dates et des voyageurs
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <LargeInput label="Date d'arrivée" type="date" value={arrival} onChange={e => setArrival(e.target.value)} required min="2026-06-17" />
                <LargeInput label="Date de départ" type="date" value={departure} onChange={e => setDeparture(e.target.value)} required min={arrival || '2026-06-18'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Adultes *</label>
                  <Counter value={adults} onChange={setAdults} min={1} max={8} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Enfants</label>
                  <Counter value={children} onChange={setChildren} min={0} max={6} />
                </div>
              </div>

              {/* Children ages */}
              {children > 0 && (
                <div style={{ marginTop: 20, padding: '16px 20px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginBottom: 12 }}>Âge des enfants</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {childrenAges.map((age, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Enfant {idx + 1}</div>
                        <input
                          type="number"
                          value={age}
                          min={0} max={17}
                          onChange={e => {
                            const ages = [...childrenAges];
                            ages[idx] = Number(e.target.value);
                            setChildrenAges(ages);
                          }}
                          style={{ width: 72, padding: '10px', fontSize: 18, fontWeight: 700, border: '2px solid #E2E8F0', borderRadius: 10, textAlign: 'center', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Married checkbox */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div
                    onClick={() => setMarried(!married)}
                    style={{
                      width: 28, height: 28, borderRadius: 7,
                      border: `2px solid ${married ? '#1E293B' : '#CBD5E1'}`,
                      background: married ? '#1E293B' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.14s',
                    }}
                  >
                    {married && <Check size={16} color="white" />}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Marié(e)</span>
                </label>
                {married && (
                  <div style={{ marginTop: 14, maxWidth: 400 }}>
                    <LargeInput
                      label="N° Acte de Mariage"
                      placeholder="Ex: 2025/12/3456"
                      value={marriageActe}
                      onChange={e => setMarriageActe(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Available rooms */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B' }}>
                    Chambres disponibles
                    {nights > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', marginLeft: 8 }}>({nights} nuit{nights > 1 ? 's' : ''})</span>}
                  </div>
                  {selectedRooms.length > 0 && (
                    <div style={{ fontSize: 14, color: '#22C55E', fontWeight: 600, marginTop: 4 }}>
                      {selectedRooms.length} chambre{selectedRooms.length > 1 ? 's' : ''} sélectionnée{selectedRooms.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {isSearching && (
                  <div style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #3B82F6', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    Recherche en cours...
                  </div>
                )}
              </div>

              {!isSearching && freeRooms.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 16 }}>
                  Aucune chambre disponible pour ces dates.
                </div>
              )}

              {!isSearching && freeRooms.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {freeRooms.map(room => (
                    <WizardRoomTile
                      key={room.id}
                      room={room}
                      selected={!!selectedRooms.find(r => r.id === room.id)}
                      onToggle={() => toggleRoom(room)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2 ═══ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Client search */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 18 }}>Rechercher un client existant</div>
              <div style={{ position: 'relative' }}>
                <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Nom du client..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  style={{ width: '100%', padding: '15px 16px 15px 48px', fontSize: 17, border: '2px solid #E2E8F0', borderRadius: 12, color: '#1E293B', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                {showDropdown && filteredClients.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, marginTop: 4, overflow: 'hidden' }}>
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        onMouseDown={() => {
                          setClientName(client.name);
                          setPhone(client.phone);
                          setIdNumber(client.idNumber);
                          setWilaya(client.wilaya);
                          setClientSearch(client.name);
                          setShowDropdown(false);
                        }}
                        style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9', fontFamily: 'inherit' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>{client.name}</div>
                        <div style={{ fontSize: 13, color: '#94A3B8' }}>{client.phone} — {client.wilaya}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Client form */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Informations du client principal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <LargeInput label="Nom complet" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Ahmed Benali" />
                <LargeInput label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0551 23 45 67" />
                <LargeInput label="Pièce d'identité" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="N° de carte d'identité" />
                <LargeInput label="Wilaya" value={wilaya} onChange={e => setWilaya(e.target.value)} placeholder="Ex: Alger" />
              </div>
            </div>

            {/* Additional guests */}
            {additionalGuests.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Autres voyageurs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {additionalGuests.map((guest, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', borderRadius: 12, padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voyageur {idx + 2}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <LargeInput
                          label="Nom complet"
                          value={guest.name}
                          onChange={e => {
                            const gs = [...additionalGuests];
                            gs[idx] = { ...gs[idx], name: e.target.value };
                            setAdditionalGuests(gs);
                          }}
                          placeholder="Ex: Fatima Benali"
                        />
                        <LargeInput
                          label="Pièce d'identité"
                          value={guest.idNumber}
                          onChange={e => {
                            const gs = [...additionalGuests];
                            gs[idx] = { ...gs[idx], idNumber: e.target.value };
                            setAdditionalGuests(gs);
                          }}
                          placeholder="N° carte d'identité"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment methods */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>
                Mode de paiement <span style={{ color: '#EF4444' }}>*</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <PaymentCard id="cash" label="Espèces" sublabel="Paiement en liquide" Icon={Banknote} selected={paymentMethod === 'cash'} onSelect={() => setPaymentMethod('cash')} />
                <PaymentCard id="card" label="Carte" sublabel="Carte bancaire / CIB" Icon={CreditCard} selected={paymentMethod === 'card'} onSelect={() => setPaymentMethod('card')} />
                <PaymentCard id="partner" label="Partenaire" sublabel="Convention entreprise" Icon={Handshake} selected={paymentMethod === 'partner'} onSelect={() => setPaymentMethod('partner')} />
              </div>
            </div>

            {/* Collapsible options */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                style={{ width: '100%', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: 17, fontWeight: 700, color: '#1E293B' }}>Options supplémentaires</span>
                {showOptions ? <ChevronUp size={22} color="#64748B" /> : <ChevronDown size={22} color="#64748B" />}
              </button>
              {showOptions && (
                <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ paddingTop: 20 }}>
                    <LargeInput
                      label="Code de réduction"
                      placeholder="Ex: BIENVENUE (10%)"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                    />
                    {discountCode && (
                      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: discountValid ? '#22C55E' : '#EF4444' }}>
                        {discountValid ? '✓ Code valide — Réduction de 10% appliquée' : '✗ Code invalide'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Instructions spéciales, demandes particulières..."
                      rows={3}
                      style={{ width: '100%', padding: '14px 16px', fontSize: 16, border: '2px solid #E2E8F0', borderRadius: 12, color: '#1E293B', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 3 ═══ */}
        {step === 3 && (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Reservation summary */}
              <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Résumé de la réservation</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B', fontSize: 15 }}>Arrivée</span>
                  <span style={{ color: '#1E293B', fontWeight: 600 }}>{fmtDateFR(arrival)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B', fontSize: 15 }}>Départ</span>
                  <span style={{ color: '#1E293B', fontWeight: 600 }}>{fmtDateFR(departure)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', fontSize: 15 }}>Durée</span>
                  <span style={{ color: '#1E293B', fontWeight: 600 }}>{nights} nuit{nights > 1 ? 's' : ''}</span>
                </div>

                {/* Room lines */}
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  {selectedRooms.map(room => (
                    <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                      <div>
                        <span style={{ color: '#1E293B', fontWeight: 600, fontSize: 15 }}>Chambre {room.number}</span>
                        <span style={{ color: '#94A3B8', fontSize: 14, marginLeft: 8 }}>{TYPE_LABELS[room.type]}</span>
                      </div>
                      <span style={{ color: '#1E293B', fontWeight: 600 }}>{fmt(room.price * nights)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#64748B', fontSize: 15 }}>Sous-total</span>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{fmt(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#22C55E', fontSize: 15 }}>Réduction (BIENVENUE 10%)</span>
                      <span style={{ color: '#22C55E', fontWeight: 600 }}>- {fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', marginTop: 8, borderTop: '2px solid #1E293B' }}>
                    <span style={{ color: '#1E293B', fontWeight: 800, fontSize: 20 }}>TOTAL</span>
                    <span style={{ color: '#1E293B', fontWeight: 900, fontSize: 24 }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {/* Client summary */}
              <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Client</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontSize: 15 }}>Nom</span>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{clientName}</span>
                  </div>
                  {phone && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontSize: 15 }}>Téléphone</span>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{phone}</span>
                  </div>}
                  {wilaya && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontSize: 15 }}>Wilaya</span>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{wilaya}</span>
                  </div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontSize: 15 }}>Paiement</span>
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>
                      {paymentMethod === 'cash' ? 'Espèces' : paymentMethod === 'card' ? 'Carte bancaire' : 'Partenaire'}
                    </span>
                  </div>
                  {married && marriageActe && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontSize: 15 }}>Acte de mariage</span>
                      <span style={{ color: '#1E293B', fontWeight: 600 }}>{marriageActe}</span>
                    </div>
                  )}
                  {adults > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontSize: 15 }}>Voyageurs</span>
                      <span style={{ color: '#1E293B', fontWeight: 600 }}>{adults} adulte{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {notes && (
                <div style={{ background: '#FFFBEB', borderRadius: 14, padding: '16px 20px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 15, color: '#78350F' }}>{notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer navigation ── */}
      {step !== 'success' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', borderTop: '1px solid #E2E8F0',
          padding: '16px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          zIndex: 40,
        }}>
          <button
            onClick={handleBack}
            style={{ padding: '15px 28px', background: '#F1F5F9', color: '#64748B', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ChevronLeft size={18} />
            {step === 1 ? 'Annuler' : 'Étape précédente'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {step === 3 && (
              <div style={{ fontSize: 16, color: '#64748B', fontWeight: 500 }}>
                Montant total : <strong style={{ color: '#1E293B', fontSize: 18 }}>{fmt(total)}</strong>
              </div>
            )}
            {step < 3 ? (
              <button
                onClick={handleContinue}
                style={{ padding: '15px 36px', background: '#22C55E', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 700, fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#16A34A'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = '#22C55E'; }}
              >
                Continuer →
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                style={{ padding: '18px 40px', background: '#22C55E', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 800, fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#16A34A'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = '#22C55E'; }}
              >
                Confirmer la réservation — {fmt(total)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
