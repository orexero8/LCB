import React, { useState } from 'react';
import { BedSingle, BedDouble, Crown, LogOut, Clock, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Room, RoomStatus, RoomType,
  STATUS_COLORS, STATUS_LABELS, STATUS_BG, STATUS_TEXT, TYPE_LABELS, TODAY,
} from './types';

// ─── Room type icon ──────────────────────────────────────────────────────────

const RoomIcon = ({ type, size = 18 }: { type: RoomType; size?: number }) => {
  const color = 'rgba(255,255,255,0.88)';
  if (type === 'simple') return <BedSingle size={size} color={color} />;
  if (type === 'double') return <BedDouble size={size} color={color} />;
  return <Crown size={size} color={color} />;
};

// ─── Room tile ────────────────────────────────────────────────────────────────

interface TileProps { room: Room; isSelected: boolean; onClick: () => void; }

const RoomTile: React.FC<TileProps> = ({ room, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const bg = STATUS_COLORS[room.status];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 94,
        height: 94,
        backgroundColor: bg,
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        cursor: 'pointer',
        outline: isSelected ? '3px solid #1E293B' : 'none',
        outlineOffset: 3,
        transform: isSelected || hovered ? 'scale(1.07)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 8px 28px rgba(0,0,0,0.22)'
          : hovered
          ? '0 6px 18px rgba(0,0,0,0.18)'
          : '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.14s ease',
        position: 'relative',
      }}
    >
      <RoomIcon type={room.type} size={18} />
      <span style={{ fontSize: 23, fontWeight: 800, color: 'white', lineHeight: 1 }}>{room.number}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.92)', lineHeight: 1, letterSpacing: '0.01em' }}>
        {room.price.toLocaleString('fr-FR')} DA
      </span>
    </button>
  );
};

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F1F5F9', gap: 8 }}>
    <span style={{ color: '#94A3B8', fontSize: 14, flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#1E293B', fontWeight: 600, fontSize: 15, textAlign: 'right' }}>{value}</span>
  </div>
);

// ─── Side panel ───────────────────────────────────────────────────────────────

interface SidePanelProps {
  room: Room;
  onClose: () => void;
  onStartBooking: (room: Room) => void;
  onUpdateStatus: (id: string, status: RoomStatus) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ room, onClose, onStartBooking, onUpdateStatus }) => {
  const bgBadge = STATUS_BG[room.status];
  const textBadge = STATUS_TEXT[room.status];

  const btnPrimary = (bg: string, color = 'white'): React.CSSProperties => ({
    width: '100%',
    height: 52,
    borderRadius: 12,
    fontSize: 17,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    background: bg,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  });

  const floor = room.floor;
  const floorLabel = floor === 1 ? '1er étage' : `${floor}ème étage`;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 72,
        bottom: 0,
        width: 330,
        background: 'white',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Panel header */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Chambre</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>{room.number}</div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: 10, borderRadius: 10, background: '#F1F5F9', border: 'none', cursor: 'pointer', marginTop: 4 }}
          >
            <X size={18} color="#64748B" />
          </button>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 100,
          background: bgBadge,
          color: textBadge,
          fontWeight: 700,
          fontSize: 14,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: textBadge, flexShrink: 0 }} />
          {STATUS_LABELS[room.status]}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '8px 22px', borderBottom: '1px solid #E2E8F0' }}>
        <InfoRow label="Type" value={TYPE_LABELS[room.type]} />
        <InfoRow label="Lit" value={room.bed} />
        <InfoRow label="Prix / nuit" value={`${room.price.toLocaleString('fr-FR')} DA`} />
        <InfoRow label="Étage" value={floorLabel} />
      </div>

      {/* Current booking */}
      {room.currentGuest && (
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Réservation en cours
          </div>
          {room.currentGuest.checkOut === TODAY && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF7ED', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: '1px solid #FED7AA' }}>
              <AlertTriangle size={16} color="#F97316" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#C2410C' }}>Départ aujourd'hui</span>
            </div>
          )}
          <InfoRow label="Client" value={room.currentGuest.name} />
          <InfoRow label="Référence" value={room.currentGuest.ref} />
          <InfoRow label="Arrivée" value={room.currentGuest.checkIn} />
          <InfoRow label="Départ" value={room.currentGuest.checkOut} />
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        {room.status === 'free' && (
          <button
            onClick={() => onStartBooking(room)}
            style={btnPrimary('#22C55E')}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = '#16A34A'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = '#22C55E'; }}
          >
            Réserver
          </button>
        )}

        {room.status === 'occupied' && (
          <button
            onClick={() => { onUpdateStatus(room.id, 'cleaning'); onClose(); toast.success(`Chambre ${room.number} libérée — À nettoyer`); }}
            style={btnPrimary('#EF4444')}
          >
            Libérer
          </button>
        )}

        {room.status === 'cleaning' && (
          <button
            onClick={() => { onUpdateStatus(room.id, 'free'); onClose(); toast.success(`Chambre ${room.number} prête — Libre`); }}
            style={btnPrimary('#3B82F6')}
          >
            Prête ✓
          </button>
        )}

        {room.status === 'reserved' && (
          <button
            onClick={() => { onUpdateStatus(room.id, 'occupied'); onClose(); toast.success(`Arrivée enregistrée — Chambre ${room.number}`); }}
            style={btnPrimary('#1E293B')}
          >
            Enregistrer l'arrivée
          </button>
        )}

        {room.status === 'blocked' && (
          <button
            onClick={() => { onUpdateStatus(room.id, 'free'); onClose(); toast.success(`Chambre ${room.number} débloquée`); }}
            style={btnPrimary('#64748B')}
          >
            Débloquer la chambre
          </button>
        )}

        {(room.status === 'occupied' || room.status === 'reserved') && (
          <button
            onClick={() => toast.success('Reçu envoyé à l\'imprimante')}
            style={{ ...btnPrimary('white', '#1E293B'), border: '2px solid #E2E8F0' }}
          >
            🖨️ Imprimer le reçu
          </button>
        )}

        {(room.status === 'occupied' || room.status === 'reserved') && (
          <button
            onClick={() => {
              onUpdateStatus(room.id, 'free');
              onClose();
              toast.error(`Réservation annulée — Chambre ${room.number}`);
            }}
            style={{ width: '100%', height: 46, borderRadius: 12, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'transparent', color: '#EF4444' }}
          >
            Annuler la réservation
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) => (
  <div style={{ background: 'white', borderRadius: 16, padding: '22px 28px', borderLeft: `6px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1 }}>
    <div style={{ fontSize: 56, fontWeight: 900, color, lineHeight: 1, marginBottom: 8 }}>{count}</div>
    <div style={{ fontSize: 18, color: '#64748B', fontWeight: 500 }}>{label}</div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  rooms: Room[];
  onStartBooking: (room: Room) => void;
  onShiftEnd: () => void;
  onUpdateRoomStatus: (id: string, status: RoomStatus) => void;
}

export const RoomMap: React.FC<Props> = ({ rooms, onStartBooking, onShiftEnd, onUpdateRoomStatus }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRoom = selectedId ? rooms.find(r => r.id === selectedId) ?? null : null;
  const floors = [1, 2, 3];

  const alerts = rooms.filter(r => r.currentGuest?.checkOut === TODAY).length;

  const stats = [
    { label: 'Occupées', count: rooms.filter(r => r.status === 'occupied').length, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Libres', count: rooms.filter(r => r.status === 'free').length, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'À nettoyer', count: rooms.filter(r => r.status === 'cleaning').length, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Alertes', count: alerts, color: '#F97316', bg: '#FFF7ED' },
  ];

  const legend = [
    { label: 'Libre', color: '#22C55E' },
    { label: 'Occupée', color: '#EF4444' },
    { label: 'Réservée', color: '#EAB308' },
    { label: 'À nettoyer', color: '#3B82F6' },
    { label: 'Bloquée', color: '#94A3B8' },
  ];

  const handleTileClick = (room: Room) => {
    setSelectedId(prev => (prev === room.id ? null : room.id));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{
        height: 72,
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 30,
        position: 'relative',
      }}>
        {/* Logo & name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, background: '#1E293B', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#F59E0B', fontWeight: 900, fontSize: 15, letterSpacing: '0.04em' }}>MG</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', lineHeight: 1.2 }}>MRGLA Hôtel</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>Tableau de bord — Réception</div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', marginRight: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Nadia Benour</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>Mercredi 17 juin 2026</div>
          </div>
          <button
            onClick={onShiftEnd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 18px', background: '#FFF7ED', color: '#C2410C',
              borderRadius: 10, border: '1.5px solid #FED7AA',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Clock size={17} />
            Fin de service
          </button>
          <button
            onClick={() => toast.info('Déconnexion en cours...')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 18px', background: '#F1F5F9', color: '#64748B',
              borderRadius: 10, border: 'none',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          paddingRight: selectedRoom ? 366 : 32,
          transition: 'padding-right 0.2s ease',
        }}
      >
        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          background: 'white', borderRadius: 12, padding: '13px 22px',
          marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #F1F5F9',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Légende</span>
          {legend.map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 15, color: '#1E293B', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 14, color: '#94A3B8' }}>
            {rooms.length} chambres au total
          </div>
        </div>

        {/* Floor sections */}
        {floors.map(floor => {
          const floorRooms = rooms.filter(r => r.floor === floor);
          const freeCount = floorRooms.filter(r => r.status === 'free').length;
          return (
            <div key={floor} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: '#1E293B' }}>
                  Étage {floor}
                </div>
                <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
                  {freeCount} libre{freeCount !== 1 ? 's' : ''} sur {floorRooms.length} chambres
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {floorRooms.map(room => (
                    <RoomTile
                      key={room.id}
                      room={room}
                      isSelected={selectedId === room.id}
                      onClick={() => handleTileClick(room)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* ── Side panel ── */}
      {selectedRoom && (
        <SidePanel
          room={selectedRoom}
          onClose={() => setSelectedId(null)}
          onStartBooking={onStartBooking}
          onUpdateStatus={onUpdateRoomStatus}
        />
      )}
    </div>
  );
};
