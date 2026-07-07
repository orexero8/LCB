import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface InvoiceRoom {
  roomNumber: number;
  floor: string;
  type: string;
  priceAtBooking: number;
}

interface InvoiceData {
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  guestIdDocument: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: InvoiceRoom[];
  childrenCharge: number;
  totalAmount: number;
  discountAmount: number;
  discountCode: string | null;
  paymentMethod: string;
  receptionist: string;
  createdAt: string;
  hotel: {
    name: string;
    address: string;
    phone: string;
    logoUrl: string | null;
    rc: string | null;
    nif: string | null;
    nis: string | null;
    currencySymbol: string;
  } | null;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 9, color: "#000" },
  header: { flexDirection: "row", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 10 },
  logoCol: { width: "20%" },
  infoCol: { width: "80%", paddingLeft: 10 },
  hotelName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  hotelLine: { fontSize: 8, lineHeight: 1.5 },
  taxLine: { fontSize: 8, lineHeight: 1.4, marginTop: 4 },
  titleBlock: { textAlign: "center", marginBottom: 20 },
  title: { fontSize: 16, fontWeight: "bold" },
  titleRef: { fontSize: 10, marginTop: 4 },
  clientSection: { marginBottom: 16, borderWidth: 1, borderColor: "#000", padding: 10 },
  clientRow: { flexDirection: "row", marginBottom: 3 },
  clientLabel: { width: "20%", fontSize: 7, color: "#555" },
  clientValue: { width: "30%", fontSize: 8, fontWeight: "bold" },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 4, marginBottom: 4 },
  headerCell: { fontSize: 7, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  cell: { fontSize: 8 },
  cellRight: { fontSize: 8, textAlign: "right" },
  summary: { marginLeft: "auto", width: "45%", borderWidth: 1, borderColor: "#000", padding: 8, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  summaryLabel: { fontSize: 8, color: "#333" },
  summaryValue: { fontSize: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#000", paddingTop: 4, marginTop: 2 },
  totalLabel: { fontSize: 11, fontWeight: "bold" },
  totalValue: { fontSize: 11, fontWeight: "bold" },
  footer: { borderTopWidth: 1, borderTopColor: "#000", paddingTop: 8, marginTop: "auto", fontSize: 7, textAlign: "center", lineHeight: 1.6 },
});

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const currency = data.hotel?.currencySymbol || "DA";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoCol}>
            {data.hotel?.logoUrl && <Image src={data.hotel.logoUrl} style={{ width: 50, height: 50 }} />}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.hotelName}>{data.hotel?.name || "Le Cheval Blanc"}</Text>
            {data.hotel?.address && <Text style={styles.hotelLine}>{data.hotel.address}</Text>}
            <Text style={styles.hotelLine}>Tél: {data.hotel?.phone || ""}</Text>
            <View style={styles.taxLine}>
              <Text>RC: {data.hotel?.rc || "N/A"} | NIF: {data.hotel?.nif || "N/A"} | NIS: {data.hotel?.nis || "N/A"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>FACTURE</Text>
          <Text style={styles.titleRef}>N° {data.bookingRef} | Date: {fmt(data.createdAt)}</Text>
        </View>

        <View style={styles.clientSection}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientValue}>{data.guestName}</Text>
            <Text style={styles.clientLabel}>Tél</Text>
            <Text style={styles.clientValue}>{data.guestPhone}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Adresse</Text>
            <Text style={styles.clientValue}>{data.guestAddress || "—"}</Text>
            <Text style={styles.clientLabel}>CIN</Text>
            <Text style={styles.clientValue}>{data.guestIdDocument || "—"}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Séjour</Text>
            <Text style={styles.clientValue}>{fmt(data.checkIn)} → {fmt(data.checkOut)} ({data.nights} nuits)</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: "15%" }]}>Chambre</Text>
            <Text style={[styles.headerCell, { width: "30%" }]}>Type</Text>
            <Text style={[styles.headerCell, { width: "20%" }]}>Prix/Nuit</Text>
            <Text style={[styles.headerCell, { width: "15%" }]}>Nuits</Text>
            <Text style={[styles.headerCell, { width: "20%" }]}>Total</Text>
          </View>
          {data.rooms.map((r, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.cell, { width: "15%" }]}>{String(r.roomNumber).padStart(2, "0")}</Text>
              <Text style={[styles.cell, { width: "30%" }]}>{r.type}</Text>
              <Text style={[styles.cellRight, { width: "20%" }]}>{r.priceAtBooking.toLocaleString()} {currency}</Text>
              <Text style={[styles.cellRight, { width: "15%" }]}>{data.nights}</Text>
              <Text style={[styles.cellRight, { width: "20%" }]}>{(r.priceAtBooking * data.nights).toLocaleString()} {currency}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{(data.totalAmount + data.discountAmount).toLocaleString()} {currency}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remise{data.discountCode ? ` (${data.discountCode})` : ""}</Text>
              <Text style={[styles.summaryValue, { color: "#000" }]}>-{data.discountAmount.toLocaleString()} {currency}</Text>
            </View>
          )}
          {data.childrenCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Suppl. enfants</Text>
              <Text style={styles.summaryValue}>{data.childrenCharge.toLocaleString()} {currency}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paiement</Text>
            <Text style={styles.summaryValue}>{data.paymentMethod === "TPE" ? "Carte" : data.paymentMethod}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{data.totalAmount.toLocaleString()} {currency}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {data.hotel?.name || "Le Cheval Blanc"}{"\n"}
          Reçu par {data.receptionist} le {new Date(data.createdAt).toLocaleString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
