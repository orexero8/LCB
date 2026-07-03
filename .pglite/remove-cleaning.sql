-- Update any rooms that somehow have NEEDS_CLEANING to AVAILABLE
UPDATE "Room" SET status = 'AVAILABLE' WHERE status = 'NEEDS_CLEANING';

-- Remove NEEDS_CLEANING from the enum
ALTER TYPE "RoomStatus" DROP VALUE 'NEEDS_CLEANING';
