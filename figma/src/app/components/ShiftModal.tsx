import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

export const ShiftModal: React.FC<Props> = ({ onClose }) => {
  const [finalCash, setFinalCash] = useState('');
  const [focused, setFocused] = useState(false);

  const handleCloturer = () => {
    if (!finalCash.trim()) {
      toast.error('Veuillez saisir le montant de la caisse finale');
      return;
    }
    toast.success('Service clôturé avec succès. Bonne soirée !');
    onClose();
  };

  const rows = [
    { label: 'Début du service', value: '08h00 — Mercredi 17 juin 2026', highlight: false },
    { label: 'Fond de caisse initial', value: '10 000 DA', highlight: false },
    { label: 'Total encaissements', value: '48 500 DA', highlight: true, color: '#22C55E' },
    { label: 'Total dépenses', value: '3 200 DA', highlight: true, color: '#EF4444' },
    { label: 'Solde théorique', value: '55 300 DA', highlight: false },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: 520, boxShadow: '0 32px 64px rgba(0,0,0,0.28)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#F97316" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B' }}>Fin de Service</div>
              <div style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>Clôture de la caisse du jour</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: 10, borderRadius: 10, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Info rows */}
        <div style={{ background: '#F8FAFC', borderRadius: 14, overflow: 'hidden', marginBottom: 24, border: '1px solid #E2E8F0' }}>
          {rows.map(({ label, value, highlight, color }, i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                borderBottom: i < rows.length - 1 ? '1px solid #E2E8F0' : 'none',
                background: i === rows.length - 1 ? '#F1F5F9' : 'transparent',
              }}
            >
              <span style={{ color: '#64748B', fontSize: 15 }}>{label}</span>
              <span style={{ color: highlight && color ? color : '#1E293B', fontWeight: highlight ? 700 : 600, fontSize: 16 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Final cash input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
            Caisse finale (DA) *
          </label>
          <input
            type="number"
            value={finalCash}
            onChange={e => setFinalCash(e.target.value)}
            placeholder="Saisir le montant en caisse..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              padding: '18px 20px',
              fontSize: 22,
              fontWeight: 600,
              border: `2px solid ${focused ? '#3B82F6' : '#E2E8F0'}`,
              borderRadius: 12,
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'white',
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Action button */}
        <button
          onClick={handleCloturer}
          style={{
            width: '100%',
            padding: '18px',
            background: '#EF4444',
            color: 'white',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#DC2626'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#EF4444'; }}
        >
          Clôturer le Service
        </button>
      </div>
    </div>
  );
};
