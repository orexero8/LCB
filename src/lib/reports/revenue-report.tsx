import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface RevenueDay {
  date: string;
  cash: number;
  tpe: number;
  partner: number;
  total: number;
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
  colDate: { width: "20%" },
  colAmount: { width: "20%", textAlign: "right" },
  footer: { marginTop: 20, fontSize: 8, color: "#999", textAlign: "center" },
  summaryRow: { flexDirection: "row", marginTop: 10, justifyContent: "flex-end" },
  summaryText: { fontSize: 10, fontWeight: "bold" },
});

export function RevenueReport({ data, from, to }: { data: RevenueDay[]; from: string; to: string }) {
  const totals = data.reduce((s, d) => ({ cash: s.cash + d.cash, tpe: s.tpe + d.tpe, partner: s.partner + d.partner, total: s.total + d.total }), { cash: 0, tpe: 0, partner: 0, total: 0 });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Le Cheval Blanc</Text>
          <Text style={styles.subtitle}>Revenue Report</Text>
          <Text style={styles.dateRange}>{from} to {to}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colDate]}>Date</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>Cash</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>TPE</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>Partner</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>Total</Text>
          </View>
          {data.map((d, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 ? { backgroundColor: "#fafafa" } : {}]}>
              <Text style={[styles.cell, styles.colDate]}>{d.date}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{d.cash > 0 ? `${d.cash.toLocaleString()} DA` : "-"}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{d.tpe > 0 ? `${d.tpe.toLocaleString()} DA` : "-"}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{d.partner > 0 ? `${d.partner.toLocaleString()} DA` : "-"}</Text>
              <Text style={[styles.cell, styles.colAmount]}>{d.total.toLocaleString()} DA</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            Cash: {totals.cash.toLocaleString()} DA | TPE: {totals.tpe.toLocaleString()} DA | Partner: {totals.partner.toLocaleString()} DA | Total: {totals.total.toLocaleString()} DA
          </Text>
        </View>
        <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  );
}
