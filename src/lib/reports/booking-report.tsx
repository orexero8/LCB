import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface BookingRow {
  bookingRef: string;
  guestName: string;
  roomNumbers: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 9 },
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 4, color: "#555" },
  dateRange: { fontSize: 9, marginTop: 2, color: "#888" },
  table: { marginTop: 10 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", minHeight: 22, alignItems: "center" },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#333", minHeight: 24, alignItems: "center", backgroundColor: "#f5f5f5" },
  cell: { paddingHorizontal: 4, paddingVertical: 3 },
  headerCell: { paddingHorizontal: 4, paddingVertical: 3, fontWeight: "bold", fontSize: 8 },
  colRef: { width: "14%" },
  colGuest: { width: "20%" },
  colRoom: { width: "10%" },
  colDate: { width: "13%" },
  colTotal: { width: "12%", textAlign: "right" },
  colStatus: { width: "10%", textAlign: "center" },
  colMethod: { width: "12%", textAlign: "center" },
  footer: { marginTop: 20, fontSize: 8, color: "#999", textAlign: "center" },
  summaryRow: { flexDirection: "row", marginTop: 10, justifyContent: "flex-end" },
  summaryText: { fontSize: 10, fontWeight: "bold" },
});

export function BookingReport({ data, from, to }: { data: BookingRow[]; from: string; to: string }) {
  const total = data.reduce((s, r) => s + r.totalAmount, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Le Cheval Blanc</Text>
          <Text style={styles.subtitle}>Booking Report</Text>
          <Text style={styles.dateRange}>{from} to {to}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colRef]}>Reference</Text>
            <Text style={[styles.headerCell, styles.colGuest]}>Guest</Text>
            <Text style={[styles.headerCell, styles.colRoom]}>Room</Text>
            <Text style={[styles.headerCell, styles.colDate]}>Check-in</Text>
            <Text style={[styles.headerCell, styles.colDate]}>Check-out</Text>
            <Text style={[styles.headerCell, styles.colTotal]}>Amount</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>Status</Text>
            <Text style={[styles.headerCell, styles.colMethod]}>Payment</Text>
          </View>
          {data.map((b, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 ? { backgroundColor: "#fafafa" } : {}]}>
              <Text style={[styles.cell, styles.colRef]}>{b.bookingRef}</Text>
              <Text style={[styles.cell, styles.colGuest]}>{b.guestName}</Text>
              <Text style={[styles.cell, styles.colRoom]}>{b.roomNumbers}</Text>
              <Text style={[styles.cell, styles.colDate]}>{b.checkIn}</Text>
              <Text style={[styles.cell, styles.colDate]}>{b.checkOut}</Text>
              <Text style={[styles.cell, styles.colTotal]}>{b.totalAmount.toLocaleString()} DA</Text>
              <Text style={[styles.cell, styles.colStatus]}>{b.status}</Text>
              <Text style={[styles.cell, styles.colMethod]}>{b.paymentMethod}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Total: {total.toLocaleString()} DA ({data.length} bookings)</Text>
        </View>
        <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  );
}
