import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface OccupancyRow {
  roomNumber: number;
  floorName: string;
  roomType: string;
  totalDays: number;
  occupiedDays: number;
  occupancyPercent: number;
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
  colRoom: { width: "12%" },
  colFloor: { width: "15%" },
  colType: { width: "20%" },
  colNum: { width: "18%", textAlign: "center" },
  colPct: { width: "15%", textAlign: "center" },
  footer: { marginTop: 20, fontSize: 8, color: "#999", textAlign: "center" },
  summaryRow: { flexDirection: "row", marginTop: 10, justifyContent: "flex-end" },
  summaryText: { fontSize: 10, fontWeight: "bold" },
});

export function OccupancyReport({ data, from, to }: { data: OccupancyRow[]; from: string; to: string }) {
  const avgOccupancy = data.length > 0 ? data.reduce((s, r) => s + r.occupancyPercent, 0) / data.length : 0;
  const totalOccupied = data.reduce((s, r) => s + r.occupiedDays, 0);
  const totalDays = data.reduce((s, r) => s + r.totalDays, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Le Cheval Blanc</Text>
          <Text style={styles.subtitle}>Occupancy Report</Text>
          <Text style={styles.dateRange}>{from} to {to}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colRoom]}>Room</Text>
            <Text style={[styles.headerCell, styles.colFloor]}>Floor</Text>
            <Text style={[styles.headerCell, styles.colType]}>Type</Text>
            <Text style={[styles.headerCell, styles.colNum]}>Available</Text>
            <Text style={[styles.headerCell, styles.colNum]}>Occupied</Text>
            <Text style={[styles.headerCell, styles.colPct]}>Occupancy</Text>
          </View>
          {data.map((r, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 ? { backgroundColor: "#fafafa" } : {}]}>
              <Text style={[styles.cell, styles.colRoom]}>{r.roomNumber}</Text>
              <Text style={[styles.cell, styles.colFloor]}>{r.floorName}</Text>
              <Text style={[styles.cell, styles.colType]}>{r.roomType}</Text>
              <Text style={[styles.cell, styles.colNum]}>{r.totalDays}</Text>
              <Text style={[styles.cell, styles.colNum]}>{r.occupiedDays}</Text>
              <Text style={[styles.cell, styles.colPct]}>{r.occupancyPercent.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            Avg occupancy: {avgOccupancy.toFixed(1)}% | Occupied: {totalOccupied}/{totalDays} days
          </Text>
        </View>
        <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  );
}
