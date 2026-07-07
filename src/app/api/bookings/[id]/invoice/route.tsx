import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";
import { ensureSettingsColumns } from "@/lib/ensure-settings-columns";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/reports/invoice-pdf";
import { readFileSync } from "fs";
import { join } from "path";

function readLogoBase64(): string | null {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "CHEVALBLANC.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingRooms: {
        include: { room: { include: { floor: true, roomType: true } } },
      },
      bookingGuests: { include: { client: true } },
      childrenAges: true,
      partner: true,
      receptionist: true,
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const adultCount = booking.bookingGuests.length;
  let settings = null;
  try { await ensureSettingsColumns(); settings = await prisma.hotelSetting.findUnique({ where: { id: "default" } }); } catch { /* ignore */ }

  const nights = Math.ceil(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const roomSubtotal = booking.bookingRooms.reduce(
    (sum, br) => sum + Number(br.priceAtBooking) * nights,
    0
  );
  const taxeSejour = 100 * adultCount * nights;
  const baseDroit = roomSubtotal + Number(booking.childrenCharge) - Number(booking.discountAmount);
  const droitMille = Math.round(baseDroit * 0.01 * 100) / 100;
  const totalTTC = roomSubtotal + taxeSejour + droitMille + Number(booking.childrenCharge) - Number(booking.discountAmount);

  const logoDataUri = readLogoBase64();

  const invoiceData = {
    bookingRef: booking.bookingRef,
    checkIn: booking.checkIn.toISOString().split("T")[0],
    checkOut: booking.checkOut.toISOString().split("T")[0],
    nights,
    adultCount,
    rooms: booking.bookingRooms.map((br) => ({
      roomNumber: br.room.roomNumber,
      floor: br.room.floor.name,
      type: br.room.roomType?.name || br.room.bedLayout,
      bedLayout: br.room.bedLayout,
      priceAtBooking: Number(br.priceAtBooking),
    })),
    childrenCharge: Number(booking.childrenCharge),
    childrenAges: booking.childrenAges.map((c) => ({ nom: c.nom, age: c.age })),
    discountAmount: Number(booking.discountAmount),
    discountCode: booking.discountCode,
    roomSubtotal,
    taxeSejour,
    droitMille,
    totalTTC,
    paymentMethod: booking.paymentMethod,
    partner: booking.partner
      ? { name: booking.partner.name, contactPhone: booking.partner.contactPhone }
      : null,
    receptionist: booking.receptionist.name,
    createdAt: booking.createdAt.toISOString(),
    hotel: settings
      ? {
          name: settings.hotelName,
          address: settings.hotelAddress || "",
          phone: settings.hotelPhone || "",
          logoUrl: logoDataUri,
          rc: settings.rc || null,
          nif: settings.nif || null,
          nis: settings.nis || null,
          currencySymbol: settings.currencySymbol || "DA",
        }
      : null,
  };

  const stream = await renderToStream(<InvoicePdf data={invoiceData} />);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as any) {
    chunks.push(chunk as Uint8Array);
  }
  const pdfBuffer = Buffer.concat(chunks);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${booking.bookingRef}.pdf"`,
    },
  });
}
