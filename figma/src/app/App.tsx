import { useState } from 'react';
import { Toaster } from 'sonner';
import { Room, RoomStatus, ROOMS } from './components/types';
import { RoomMap } from './components/RoomMap';
import { BookingWizard } from './components/BookingWizard';
import { ShiftModal } from './components/ShiftModal';

type View = 'map' | 'booking';

export default function App() {
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [view, setView] = useState<View>('map');
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);

  const handleStartBooking = (room: Room) => {
    setBookingRoom(room);
    setView('booking');
  };

  const handleUpdateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev =>
      prev.map(r =>
        r.id === roomId
          ? { ...r, status, ...(status === 'free' ? { currentGuest: undefined } : {}) }
          : r
      )
    );
  };

  const handleConfirmBooking = (
    roomIds: string[],
    guestName: string,
    ref: string,
    checkIn: string,
    checkOut: string
  ) => {
    setRooms(prev =>
      prev.map(r =>
        roomIds.includes(r.id)
          ? { ...r, status: 'occupied', currentGuest: { name: guestName, ref, checkIn, checkOut } }
          : r
      )
    );
  };

  return (
    <>
      {view === 'map' && (
        <RoomMap
          rooms={rooms}
          onStartBooking={handleStartBooking}
          onShiftEnd={() => setShowShiftModal(true)}
          onUpdateRoomStatus={handleUpdateRoomStatus}
        />
      )}
      {view === 'booking' && (
        <BookingWizard
          rooms={rooms}
          initialRoom={bookingRoom}
          onBack={() => setView('map')}
          onConfirm={handleConfirmBooking}
          onBackToMap={() => setView('map')}
        />
      )}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
      <Toaster position="top-right" richColors toastOptions={{ style: { fontSize: 16, fontWeight: 600 } }} />
    </>
  );
}
