import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { renderToStream } from "@react-pdf/renderer";
import { BookingReport } from "@/lib/reports/booking-report";
import { RevenueReport } from "@/lib/reports/revenue-report";
import { OccupancyReport } from "@/lib/reports/occupancy-report";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "bookings";
  const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const to = url.searchParams.get("to") || new Date().toISOString().split("T")[0];
  const format = url.searchParams.get("format") || "json";

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  if (format === "pdf") {
    return handlePdfExport(type, from, to, fromDate, toDate);
  }

  if (format === "csv") {
    return handleCsvExport(type, fromDate, toDate, from, to);
  }

  if (type === "expenses") {
    return handleExpensesPreview(fromDate, toDate);
  }

  if (type === "staff") {
    return handleStaffPreview(fromDate, toDate);
  }

  if (type === "summary") {
    return handleSummaryPreview(fromDate, toDate);
  }

  if (type === "cashup") {
    return handleCashupPreview(fromDate, toDate);
  }

  if (type === "commission") {
    return handleCommissionPreview(fromDate, toDate);
  }

  if (type === "cancellation") {
    return handleCancellationPreview(fromDate, toDate);
  }

  return handleJsonPreview(type, fromDate, toDate);
}

async function handleExpensesPreview(fromDate: Date, toDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    include: { shiftReport: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const categoryMap: Record<string, number> = {};
  for (const e of expenses) {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return Response.json({
    totalExpenses,
    count: expenses.length,
    categories: Object.entries(categoryMap).map(([category, amount]) => ({ category, amount })),
    data: expenses.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      category: e.category,
      description: e.description,
      date: e.createdAt.toISOString().split("T")[0],
      staffName: e.shiftReport.user.name,
    })),
  });
}

async function handleStaffPreview(fromDate: Date, toDate: Date) {
  const users = await prisma.user.findMany({
    where: { role: "RECEPTIONIST" },
    include: {
      bookings: {
        where: { createdAt: { gte: fromDate, lte: toDate } },
      },
      shiftReports: {
        where: { status: "CLOSED", endedAt: { gte: fromDate, lte: toDate } },
        include: { expenses: true },
      },
    },
  });

  const staffData = users.map((u) => {
    const totalRevenue = u.bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
    const totalExpenses = u.shiftReports.reduce((se, sr) => se + sr.expenses.reduce((se2, e) => se2 + Number(e.amount), 0), 0);
    const cashRevenue = u.bookings.filter((b) => b.paymentMethod === "CASH").reduce((s, b) => s + Number(b.totalAmount), 0);
    const tpeRevenue = u.bookings.filter((b) => b.paymentMethod === "TPE").reduce((s, b) => s + Number(b.totalAmount), 0);
    const activeShifts = u.shiftReports.filter((sr) => sr.status === "ACTIVE").length;

    return {
      name: u.name,
      email: u.email,
      bookingsCount: u.bookings.length,
      totalRevenue,
      cashRevenue,
      tpeRevenue,
      totalExpenses,
      shiftsCompleted: u.shiftReports.length,
      activeShift: activeShifts > 0,
    };
  });

  const totals = staffData.reduce((s, d) => ({
    bookingsCount: s.bookingsCount + d.bookingsCount,
    totalRevenue: s.totalRevenue + d.totalRevenue,
    totalExpenses: s.totalExpenses + d.totalExpenses,
  }), { bookingsCount: 0, totalRevenue: 0, totalExpenses: 0 });

  return Response.json({ data: staffData, totals });
}

async function handleSummaryPreview(fromDate: Date, toDate: Date) {
  const totalRooms = await prisma.room.count();

  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
    include: { bookingRooms: true },
  });

  const totalRevenue = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const cashRevenue = bookings.filter((b) => b.paymentMethod === "CASH").reduce((s, b) => s + Number(b.totalAmount), 0);
  const tpeRevenue = bookings.filter((b) => b.paymentMethod === "TPE").reduce((s, b) => s + Number(b.totalAmount), 0);
  const partnerRevenue = bookings.filter((b) => b.paymentMethod === "PARTNER").reduce((s, b) => s + Number(b.totalAmount), 0);

  const cancellations = await prisma.cancellation.count({
    where: { createdAt: { gte: fromDate, lte: toDate } },
  });

  const expenses = await prisma.expense.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
  });
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const expenseCategories: Record<string, number> = {};
  for (const e of expenses) {
    expenseCategories[e.category] = (expenseCategories[e.category] || 0) + Number(e.amount);
  }

  const occupied = await prisma.room.count({ where: { status: "OCCUPIED" } });
  const reserved = await prisma.room.count({ where: { status: "RESERVED" } });
  const currentOccupancy = totalRooms > 0 ? ((occupied + reserved) / totalRooms) * 100 : 0;

  const totalNights = bookings.reduce((s, b) => {
    const nights = Math.max(0, Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) / 86400000));
    return s + nights * b.bookingRooms.length;
  }, 0);

  const avgRevenuePerBooking = bookings.length > 0 ? totalRevenue / bookings.length : 0;
  const avgNightsPerBooking = bookings.length > 0 ? totalNights / bookings.length : 0;

  return Response.json({
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    revenue: {
      total: totalRevenue,
      cash: cashRevenue,
      tpe: tpeRevenue,
      partner: partnerRevenue,
    },
    bookings: {
      count: bookings.length,
      totalNights,
      avgRevenuePerBooking: Math.round(avgRevenuePerBooking * 100) / 100,
      avgNightsPerBooking: Math.round(avgNightsPerBooking * 100) / 100,
    },
    occupancy: {
      current: Math.round(currentOccupancy * 10) / 10,
      occupied,
      reserved,
      totalRooms,
    },
    expenses: {
      total: totalExpenses,
      count: expenses.length,
      categories: Object.entries(expenseCategories).map(([cat, amt]) => ({ category: cat, amount: amt })),
    },
    cancellations,
    netRevenue: totalRevenue - totalExpenses,
  });
}

async function handlePdfExport(type: string, from: string, to: string, fromDate: Date, toDate: Date) {
  if (["expenses", "staff", "summary", "cashup", "commission", "cancellation"].includes(type)) {
    return Response.json({ error: "PDF export not available for this report type. Use Preview instead." }, { status: 400 });
  }

  let doc: any;

  switch (type) {
    case "revenue": {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "asc" },
      });
      const dayMap: Record<string, { cash: number; tpe: number; partner: number }> = {};
      for (const b of bookings) {
        const day = b.createdAt.toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = { cash: 0, tpe: 0, partner: 0 };
        const amt = Number(b.totalAmount);
        if (b.paymentMethod === "CASH") dayMap[day].cash += amt;
        else if (b.paymentMethod === "TPE") dayMap[day].tpe += amt;
        else dayMap[day].partner += amt;
      }
      const revenueData = Object.entries(dayMap).map(([date, vals]) => ({
        date, cash: vals.cash, tpe: vals.tpe, partner: vals.partner, total: vals.cash + vals.tpe + vals.partner,
      }));
      doc = <RevenueReport data={revenueData} from={from} to={to} />;
      break;
    }
    case "occupancy": {
      const rooms = await prisma.room.findMany({ include: { floor: true, roomType: true } });
      const activeBookings = await prisma.booking.findMany({
        where: {
          status: { in: ["ACTIVE", "CHECKED_OUT"] },
          checkIn: { lt: toDate },
          checkOut: { gt: fromDate },
        },
        include: { bookingRooms: true },
      });
      const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
      const occData = rooms.map((room) => {
        let occupiedDays = 0;
        for (const booking of activeBookings) {
          const inRoom = booking.bookingRooms.some((br) => br.roomId === room.id);
          if (!inRoom) continue;
          const overlapStart = booking.checkIn > fromDate ? booking.checkIn : fromDate;
          const overlapEnd = booking.checkOut < toDate ? booking.checkOut : toDate;
          const days = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
          occupiedDays += days;
        }
        return {
          roomNumber: room.roomNumber,
          floorName: room.floor.name,
          roomType: room.roomType?.name || room.bedLayout,
          totalDays,
          occupiedDays: Math.min(occupiedDays, totalDays),
          occupancyPercent: (occupiedDays / totalDays) * 100,
        };
      });
      doc = <OccupancyReport data={occData} from={from} to={to} />;
      break;
    }
    default: {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: {
          bookingRooms: { include: { room: true } },
          bookingGuests: { include: { client: true }, where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
      const bData = bookings.map((b) => ({
        bookingRef: b.bookingRef,
        guestName: [b.bookingGuests[0]?.client?.nom, b.bookingGuests[0]?.client?.prenom].filter(Boolean).join(" ") || "N/A",
        roomNumbers: b.bookingRooms.map((br) => br.room.roomNumber).join(", "),
        checkIn: b.checkIn.toISOString().split("T")[0],
        checkOut: b.checkOut.toISOString().split("T")[0],
        totalAmount: Number(b.totalAmount),
        status: b.status.replace(/_/g, " "),
        paymentMethod: b.paymentMethod,
      }));
      doc = <BookingReport data={bData} from={from} to={to} />;
    }
  }

  const stream = await renderToStream(doc as any);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-report-${from}-to-${to}.pdf"`,
    },
  });
}

async function handleCashupPreview(fromDate: Date, toDate: Date) {
  const shifts = await prisma.shiftReport.findMany({
    where: { status: "CLOSED", endedAt: { gte: fromDate, lte: toDate } },
    include: {
      user: { select: { name: true } },
      expenses: true,
    },
    orderBy: { endedAt: "desc" },
  });

  const data = shifts.map((s) => ({
    date: s.endedAt?.toISOString().split("T")[0] || "",
    staffName: s.user.name,
    startedAt: s.startedAt.toISOString().split("T")[1].slice(0, 5),
    endedAt: s.endedAt?.toISOString().split("T")[1].slice(0, 5) || "",
    cashCollected: Number(s.cashCollected),
    tpeCollected: Number(s.tpeCollected),
    partnerCollected: Number(s.partnerCollected),
    declaredCash: Number(s.declaredCash),
    declaredTpe: Number(s.declaredTpe),
    declaredPartner: Number(s.declaredPartner),
    cashDiff: Number(s.cashCollected) - Number(s.declaredCash),
    tpeDiff: Number(s.tpeCollected) - Number(s.declaredTpe),
    partnerDiff: Number(s.partnerCollected) - Number(s.declaredPartner),
    expenses: s.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    difference: Number(s.cashCollected) + Number(s.tpeCollected) + Number(s.partnerCollected)
      - Number(s.declaredCash) - Number(s.declaredTpe) - Number(s.declaredPartner)
      - s.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
  }));

  const totals = data.reduce((s, d) => ({
    cashCollected: s.cashCollected + d.cashCollected,
    tpeCollected: s.tpeCollected + d.tpeCollected,
    partnerCollected: s.partnerCollected + d.partnerCollected,
    cashDiff: s.cashDiff + d.cashDiff,
    tpeDiff: s.tpeDiff + d.tpeDiff,
    partnerDiff: s.partnerDiff + d.partnerDiff,
    expenses: s.expenses + d.expenses,
  }), { cashCollected: 0, tpeCollected: 0, partnerCollected: 0, cashDiff: 0, tpeDiff: 0, partnerDiff: 0, expenses: 0 });

  return Response.json({ data, totals, count: data.length });
}

async function handleCommissionPreview(fromDate: Date, toDate: Date) {
  const partners = await prisma.partner.findMany({
    include: {
      bookings: {
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
      },
    },
  });

  const data = partners
    .map((p) => {
      const totalRevenue = p.bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
      const commissionAmount = (totalRevenue * Number(p.commissionRate)) / 100;
      return {
        partnerName: p.name,
        contactPhone: p.contactPhone,
        commissionRate: Number(p.commissionRate),
        bookingsCount: p.bookings.length,
        totalRevenue,
        commissionAmount,
      };
    })
    .filter((p) => p.bookingsCount > 0);

  const totals = data.reduce((s, d) => ({
    bookingsCount: s.bookingsCount + d.bookingsCount,
    totalRevenue: s.totalRevenue + d.totalRevenue,
    commissionAmount: s.commissionAmount + d.commissionAmount,
  }), { bookingsCount: 0, totalRevenue: 0, commissionAmount: 0 });

  return Response.json({ data, totals });
}

async function handleCancellationPreview(fromDate: Date, toDate: Date) {
  const cancellations = await prisma.cancellation.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    include: {
      booking: { select: { bookingRef: true, totalAmount: true, paymentMethod: true } },
      cancelledByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const reasons: Record<string, number> = {};
  for (const c of cancellations) {
    reasons[c.reasonCategory] = (reasons[c.reasonCategory] || 0) + 1;
  }

  const data = cancellations.map((c) => ({
    id: c.id,
    bookingRef: c.booking.bookingRef,
    totalAmount: Number(c.booking.totalAmount),
    paymentMethod: c.booking.paymentMethod,
    reasonCategory: c.reasonCategory,
    reasonText: c.reasonText,
    cancelledBy: c.cancelledByUser.name,
    calledBack: c.calledBack,
    createdAt: c.createdAt.toISOString().split("T")[0],
  }));

  const totalLost = data.reduce((s, d) => s + d.totalAmount, 0);

  return Response.json({ data, reasons: Object.entries(reasons).map(([cat, count]) => ({ category: cat, count })), count: data.length, totalLost });
}

async function handleCsvExport(type: string, fromDate: Date, toDate: Date, from: string, to: string) {
  // BOM for Excel French locale + semicolon delimiter
  const sep = ";";
  let csv = "\uFEFF";
  const filename = `${type}-report-${from}-to-${to}.csv`;
  const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "UTC" });
  const fmtNum = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

  switch (type) {
    case "bookings": {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: {
          bookingRooms: { include: { room: true } },
          bookingGuests: { include: { client: true }, where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
      csv += `""${sep}Rapport des Réservations${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`N° Réservation`, `Client`, `Chambres`, `Arrivée`, `Départ`, `Montant (DA)`, `Statut`, `Paiement`].join(sep) + "\n";
      let total = 0;
      for (const b of bookings) {
        const g = [b.bookingGuests[0]?.client?.nom, b.bookingGuests[0]?.client?.prenom].filter(Boolean).join(" ") || "N/A";
        const rn = b.bookingRooms.map((br) => String(br.room.roomNumber).padStart(2, "0")).join(" + ");
        const amt = Number(b.totalAmount);
        total += amt;
        csv += [b.bookingRef, q(g), q(rn), fmtDate(b.checkIn), fmtDate(b.checkOut), fmtNum(amt), b.status.replace(/_/g, " "), b.paymentMethod].join(sep) + "\n";
      }
      csv += `""${sep}""${sep}""${sep}""${sep}TOTAL${sep}${fmtNum(total)}${sep}""${sep}""\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}Nombre${sep}${bookings.length}${sep}""${sep}""\n`;
      break;
    }
    case "revenue": {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "asc" },
      });
      const dayMap: Record<string, { cash: number; tpe: number; partner: number }> = {};
      for (const b of bookings) {
        const day = b.createdAt.toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = { cash: 0, tpe: 0, partner: 0 };
        const amt = Number(b.totalAmount);
        if (b.paymentMethod === "CASH") dayMap[day].cash += amt;
        else if (b.paymentMethod === "TPE") dayMap[day].tpe += amt;
        else dayMap[day].partner += amt;
      }
      csv += `""${sep}Rapport Revenus${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Date`, `Espèces (DA)`, `TPE (DA)`, `Partenaire (DA)`, `Total (DA)`].join(sep) + "\n";
      let totalCash = 0, totalTpe = 0, totalPartner = 0;
      for (const [date, vals] of Object.entries(dayMap)) {
        totalCash += vals.cash; totalTpe += vals.tpe; totalPartner += vals.partner;
        csv += [fmtDate(new Date(date + "T00:00:00Z")), fmtNum(vals.cash), fmtNum(vals.tpe), fmtNum(vals.partner), fmtNum(vals.cash + vals.tpe + vals.partner)].join(sep) + "\n";
      }
      csv += [`TOTAL`, fmtNum(totalCash), fmtNum(totalTpe), fmtNum(totalPartner), fmtNum(totalCash + totalTpe + totalPartner)].join(sep) + "\n";
      break;
    }
    case "occupancy": {
      const rooms = await prisma.room.findMany({ include: { floor: true, roomType: true } });
      const activeBookings = await prisma.booking.findMany({
        where: { status: { in: ["ACTIVE", "CHECKED_OUT"] }, checkIn: { lt: toDate }, checkOut: { gt: fromDate } },
        include: { bookingRooms: true },
      });
      const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
      csv += `""${sep}Rapport Occupation${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Chambre`, `Étage`, `Type`, `Jours Total`, `Jours Occupé`, `Taux (%)`].join(sep) + "\n";
      for (const room of rooms) {
        let occupiedDays = 0;
        for (const booking of activeBookings) {
          const inRoom = booking.bookingRooms.some((br) => br.roomId === room.id);
          if (!inRoom) continue;
          const overlapStart = booking.checkIn > fromDate ? booking.checkIn : fromDate;
          const overlapEnd = booking.checkOut < toDate ? booking.checkOut : toDate;
          occupiedDays += Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
        }
        const occ = Math.min(occupiedDays, totalDays);
        csv += [String(room.roomNumber).padStart(2, "0"), room.floor.name, room.roomType?.name || room.bedLayout, totalDays, occ, ((occ / totalDays) * 100).toFixed(1)].join(sep) + "\n";
      }
      break;
    }
    case "expenses": {
      const expenses = await prisma.expense.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { shiftReport: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      });
      csv += `""${sep}Rapport Dépenses${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Date`, `Catégorie`, `Description`, `Personnel`, `Montant (DA)`].join(sep) + "\n";
      let total = 0;
      for (const e of expenses) {
        total += Number(e.amount);
        csv += [fmtDate(e.createdAt), e.category, q(e.description || ""), e.shiftReport.user.name, fmtNum(Number(e.amount))].join(sep) + "\n";
      }
      csv += `""${sep}""${sep}""${sep}TOTAL${sep}${fmtNum(total)}\n`;
      break;
    }
    case "staff": {
      const users = await prisma.user.findMany({
        where: { role: "RECEPTIONIST" },
        include: { bookings: { where: { createdAt: { gte: fromDate, lte: toDate } } }, shiftReports: { where: { status: "CLOSED", endedAt: { gte: fromDate, lte: toDate } }, include: { expenses: true } } },
      });
      csv += `""${sep}Rapport Personnel${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Personnel`, `Email`, `Réservations`, `Revenu (DA)`, `Espèces (DA)`, `TPE (DA)`, `Dépenses (DA)`, `Quarts`].join(sep) + "\n";
      let totalBookings = 0, totalRev = 0, totalCash = 0, totalTpe = 0, totalExp = 0;
      for (const u of users) {
        const rev = u.bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
        const exp = u.shiftReports.reduce((se, sr) => se + sr.expenses.reduce((se2, e) => se2 + Number(e.amount), 0), 0);
        const cash = u.bookings.filter((b) => b.paymentMethod === "CASH").reduce((s, b) => s + Number(b.totalAmount), 0);
        const tpe = u.bookings.filter((b) => b.paymentMethod === "TPE").reduce((s, b) => s + Number(b.totalAmount), 0);
        totalBookings += u.bookings.length; totalRev += rev; totalCash += cash; totalTpe += tpe; totalExp += exp;
        csv += [u.name, u.email, u.bookings.length, fmtNum(rev), fmtNum(cash), fmtNum(tpe), fmtNum(exp), u.shiftReports.length].join(sep) + "\n";
      }
      csv += [`TOTAL`, ``, totalBookings, fmtNum(totalRev), fmtNum(totalCash), fmtNum(totalTpe), fmtNum(totalExp), ``].join(sep) + "\n";
      break;
    }
    case "summary": {
      const bookings = await prisma.booking.findMany({ where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } } });
      const totalRev = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
      const cancellations = await prisma.cancellation.count({ where: { createdAt: { gte: fromDate, lte: toDate } } });
      const expenses = await prisma.expense.findMany({ where: { createdAt: { gte: fromDate, lte: toDate } } });
      const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
      csv += `""${sep}Rapport Synthèse${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n\n`;
      csv += [`Indicateur`, `Valeur`].join(sep) + "\n";
      csv += [`Période`, `${fmtDate(fromDate)} au ${fmtDate(toDate)}`].join(sep) + "\n";
      csv += [`Revenu Total`, fmtNum(totalRev)].join(sep) + "\n";
      csv += [`Dépenses Total`, fmtNum(totalExp)].join(sep) + "\n";
      csv += [`Revenu Net`, fmtNum(totalRev - totalExp)].join(sep) + "\n";
      csv += [`Réservations`, bookings.length].join(sep) + "\n";
      csv += [`Annulations`, cancellations].join(sep) + "\n";
      break;
    }
    case "cashup": {
      const shifts = await prisma.shiftReport.findMany({
        where: { status: "CLOSED", endedAt: { gte: fromDate, lte: toDate } },
        include: { user: { select: { name: true } }, expenses: true },
        orderBy: { endedAt: "desc" },
      });
      csv += `""${sep}Rapport Caisses${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Date`, `Personnel`, `Espèces (DA)`, `TPE (DA)`, `Partenaire (DA)`, `Espèces Déc.`, `TPE Déc.`, `Part. Déc.`, `Diff. Esp.`, `Diff. TPE`, `Diff. Part.`, `Dépenses (DA)`, `Diff. Nette`].join(sep) + "\n";
      let total = { cash: 0, tpe: 0, partner: 0, dCash: 0, dTpe: 0, dPartner: 0, expenses: 0 };
      for (const s of shifts) {
        const cashDiff = Number(s.cashCollected) - Number(s.declaredCash);
        const tpeDiff = Number(s.tpeCollected) - Number(s.declaredTpe);
        const partnerDiff = Number(s.partnerCollected) - Number(s.declaredPartner);
        const expenses = s.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const diff = Number(s.cashCollected) + Number(s.tpeCollected) + Number(s.partnerCollected)
          - Number(s.declaredCash) - Number(s.declaredTpe) - Number(s.declaredPartner) - expenses;
        total.cash += Number(s.cashCollected); total.tpe += Number(s.tpeCollected); total.partner += Number(s.partnerCollected);
        total.dCash += Number(s.declaredCash); total.dTpe += Number(s.declaredTpe); total.dPartner += Number(s.declaredPartner);
        total.expenses += expenses;
        csv += [s.endedAt ? fmtDate(s.endedAt) : "", s.user.name, fmtNum(Number(s.cashCollected)), fmtNum(Number(s.tpeCollected)), fmtNum(Number(s.partnerCollected)),
          fmtNum(Number(s.declaredCash)), fmtNum(Number(s.declaredTpe)), fmtNum(Number(s.declaredPartner)),
          fmtNum(cashDiff), fmtNum(tpeDiff), fmtNum(partnerDiff), fmtNum(expenses), fmtNum(diff)].join(sep) + "\n";
      }
      csv += [`TOTAL`, ``, fmtNum(total.cash), fmtNum(total.tpe), fmtNum(total.partner),
        fmtNum(total.dCash), fmtNum(total.dTpe), fmtNum(total.dPartner),
        fmtNum(total.cash - total.dCash), fmtNum(total.tpe - total.dTpe), fmtNum(total.partner - total.dPartner),
        fmtNum(total.expenses),
        fmtNum(total.cash + total.tpe + total.partner - total.dCash - total.dTpe - total.dPartner - total.expenses)].join(sep) + "\n";
      break;
    }
    case "commission": {
      const partners = await prisma.partner.findMany({
        include: { bookings: { where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } } } },
      });
      csv += `""${sep}Rapport Commissions${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Partenaire`, `Téléphone`, `Taux (%)`, `Réservations`, `Revenu (DA)`, `Commission (DA)`].join(sep) + "\n";
      let totalBookings = 0, totalRev = 0, totalComm = 0;
      for (const p of partners) {
        const rev = p.bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
        if (rev === 0) continue;
        const comm = (rev * Number(p.commissionRate)) / 100;
        totalBookings += p.bookings.length; totalRev += rev; totalComm += comm;
        csv += [p.name, p.contactPhone || "", Number(p.commissionRate), p.bookings.length, fmtNum(rev), fmtNum(comm)].join(sep) + "\n";
      }
      csv += [`TOTAL`, ``, ``, totalBookings, fmtNum(totalRev), fmtNum(totalComm)].join(sep) + "\n";
      break;
    }
    case "cancellation": {
      const cancellations = await prisma.cancellation.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { booking: { select: { bookingRef: true, totalAmount: true, paymentMethod: true } }, cancelledByUser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv += `""${sep}Rapport Annulations${sep}du ${fmtDate(fromDate)}${sep}au ${fmtDate(toDate)}\n`;
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}""\n`;
      csv += [`Date`, `Réservation`, `Montant (DA)`, `Paiement`, `Motif`, `Détails`, `Annulé par`, `Rappelé`].join(sep) + "\n";
      let total = 0;
      for (const c of cancellations) {
        total += Number(c.booking.totalAmount);
        csv += [fmtDate(c.createdAt), c.booking.bookingRef, fmtNum(Number(c.booking.totalAmount)), c.booking.paymentMethod,
          c.reasonCategory, q(c.reasonText || ""), c.cancelledByUser.name, c.calledBack ? "Oui" : "Non"].join(sep) + "\n";
      }
      csv += `""${sep}""${sep}""${sep}""${sep}""${sep}""${sep}Total Annulé${sep}${fmtNum(total)}\n`;
      break;
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function handleJsonPreview(type: string, fromDate: Date, toDate: Date) {
  switch (type) {
    case "revenue": {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "asc" },
      });
      const dayMap: Record<string, { cash: number; tpe: number; partner: number }> = {};
      for (const b of bookings) {
        const day = b.createdAt.toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = { cash: 0, tpe: 0, partner: 0 };
        const amt = Number(b.totalAmount);
        if (b.paymentMethod === "CASH") dayMap[day].cash += amt;
        else if (b.paymentMethod === "TPE") dayMap[day].tpe += amt;
        else dayMap[day].partner += amt;
      }
      return Response.json({ data: Object.entries(dayMap).map(([date, vals]) => ({ date, ...vals, total: vals.cash + vals.tpe + vals.partner })) });
    }
    case "occupancy": {
      const rooms = await prisma.room.findMany({ include: { floor: true, roomType: true } });
      const activeBookings = await prisma.booking.findMany({
        where: {
          status: { in: ["ACTIVE", "CHECKED_OUT"] },
          checkIn: { lt: toDate },
          checkOut: { gt: fromDate },
        },
        include: { bookingRooms: true },
      });
      const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
      const data = rooms.map((room) => {
        let occupiedDays = 0;
        for (const booking of activeBookings) {
          const inRoom = booking.bookingRooms.some((br) => br.roomId === room.id);
          if (!inRoom) continue;
          const overlapStart = booking.checkIn > fromDate ? booking.checkIn : fromDate;
          const overlapEnd = booking.checkOut < toDate ? booking.checkOut : toDate;
          const days = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
          occupiedDays += days;
        }
        return { roomNumber: room.roomNumber, floorName: room.floor.name, roomType: room.roomType?.name || room.bedLayout, totalDays, occupiedDays: Math.min(occupiedDays, totalDays), occupancyPercent: parseFloat(((occupiedDays / totalDays) * 100).toFixed(1)) };
      });
      return Response.json({ data });
    }
    default: {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: {
          bookingRooms: { include: { room: true } },
          bookingGuests: { include: { client: true }, where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return Response.json({
        data: bookings.map((b) => ({
          bookingRef: b.bookingRef,
          guestName: [b.bookingGuests[0]?.client?.nom, b.bookingGuests[0]?.client?.prenom].filter(Boolean).join(" ") || "N/A",
          roomNumbers: b.bookingRooms.map((br) => br.room.roomNumber).join(", "),
          checkIn: b.checkIn.toISOString().split("T")[0],
          checkOut: b.checkOut.toISOString().split("T")[0],
          totalAmount: Number(b.totalAmount),
          status: b.status.replace(/_/g, " "),
          paymentMethod: b.paymentMethod,
        })),
        total: bookings.reduce((s, b) => s + Number(b.totalAmount), 0),
        count: bookings.length,
      });
    }
  }
}
