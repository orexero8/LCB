import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface InvoiceRoom {
  roomNumber: number;
  floor: string;
  type: string;
  bedLayout: string;
  priceAtBooking: number;
}

interface InvoiceData {
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  guestWilaya: string;
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
  partner: { name: string; contactPhone: string | null } | null;
  receptionist: string;
  createdAt: string;
  hotel: {
    name: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    logoUrl: string | null;
    rc: string | null;
    nif: string | null;
    nis: string | null;
    currencySymbol: string;
    footerMessage: string;
  } | null;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 9 },
  header: { flexDirection: "row", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#1e40af", paddingBottom: 12 },
  logoCol: { width: "25%" },
  infoCol: { width: "75%", paddingLeft: 12 },
  hotelName: { fontSize: 16, fontWeight: "bold", color: "#1e40af", marginBottom: 3 },
  hotelLine: { fontSize: 7.5, color: "#555", lineHeight: 1.5 },
  taxLine: { fontSize: 7.5, color: "#333", lineHeight: 1.4, marginTop: 4 },
  titleBlock: { textAlign: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1e40af" },
  titleRef: { fontSize: 9, color: "#666", marginTop: 2 },
  clientSection: { flexDirection: "row", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 10 },
  clientCol: { width: "50%" },
  clientLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", marginBottom: 1 },
  clientValue: { fontSize: 9, fontWeight: "bold", color: "#1e293b", marginBottom: 5 },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e40af", padding: "6 8", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableHeaderCell: { color: "white", fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", padding: "5 8" },
  tableCell: { fontSize: 8, color: "#334155" },
  tableCellRight: { fontSize: 8, color: "#334155", textAlign: "right" },
  summary: { marginLeft: "auto", width: "45%", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 8, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  summaryLabel: { fontSize: 8, color: "#64748b" },
  summaryValue: { fontSize: 8, color: "#334155" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: "#1e40af", paddingTop: 5, marginTop: 3 },
  totalLabel: { fontSize: 12, fontWeight: "bold", color: "#1e40af" },
  totalValue: { fontSize: 12, fontWeight: "bold", color: "#1e40af" },
  footer: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, marginTop: "auto", fontSize: 6.5, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 },
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const subtotal = data.rooms.reduce((s, r) => s + r.priceAtBooking * data.nights, 0);
  const currency = data.hotel?.currencySymbol || "DA";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoCol}>
            {data.hotel?.logoUrl && (
              <Image src={data.hotel.logoUrl} style={{ width: 55, height: 55 }} />
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.hotelName}>{data.hotel?.name || "Le Cheval Blanc"}</Text>
            {data.hotel?.address && <Text style={styles.hotelLine}>{data.hotel.address}</Text>}
            <Text style={styles.hotelLine}>
              Tél: {data.hotel?.phone || ""}{data.hotel?.whatsapp ? ` / WhatsApp: ${data.hotel.whatsapp}` : ""}{data.hotel?.email ? ` / ${data.hotel.email}` : ""}
            </Text>
            <View style={styles.taxLine}>
              <Text>RC: {data.hotel?.rc || "N/A"} | NIF: {data.hotel?.nif || "N/A"} | NIS: {data.hotel?.nis || "N/A"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>F A C T U R E</Text>
          <Text style={styles.titleRef}>N° {data.bookingRef}</Text>
          <Text style={[styles.titleRef, { fontSize: 8 }]}>Date: {formatDate(data.createdAt)}</Text>
        </View>

        <View style={styles.clientSection}>
          <View style={styles.clientCol}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientValue}>{data.guestName}</Text>
            <Text style={styles.clientLabel}>Téléphone</Text>
            <Text style={styles.clientValue}>{data.guestPhone}</Text>
            <Text style={styles.clientLabel}>Adresse</Text>
            <Text style={styles.clientValue}>{data.guestAddress || "—"}</Text>
          </View>
          <View style={styles.clientCol}>
            <Text style={styles.clientLabel}>Wilaya</Text>
            <Text style={styles.clientValue}>{data.guestWilaya || "—"}</Text>
            <Text style={styles.clientLabel}>Pièce d'identité</Text>
            <Text style={styles.clientValue}>{data.guestIdDocument || "—"}</Text>
            <Text style={styles.clientLabel}>Séjour</Text>
            <Text style={styles.clientValue}>{formatDate(data.checkIn)} → {formatDate(data.checkOut)} ({data.nights} nuits)</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Chambre</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Type</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Étage</Text>
            <Text style={[styles.tableHeaderCell, { width: "16%" }]}>Prix/Nuit</Text>
            <Text style={[styles.tableHeaderCell, { width: "16%" }]}>Nuits</Text>
            <Text style={[styles.tableHeaderCell, { width: "16%" }]}>Total</Text>
          </View>
          {data.rooms.map((r, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tableCell, { width: "12%" }]}>{String(r.roomNumber).padStart(2, "0")}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{r.type}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{r.floor}</Text>
              <Text style={[styles.tableCellRight, { width: "16%" }]}>{r.priceAtBooking.toLocaleString()} {currency}</Text>
              <Text style={[styles.tableCellRight, { width: "16%" }]}>{data.nights}</Text>
              <Text style={[styles.tableCellRight, { width: "16%" }]}>{(r.priceAtBooking * data.nights).toLocaleString()} {currency}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal.toLocaleString()} {currency}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remise{data.discountCode ? ` (${data.discountCode})` : ""}</Text>
              <Text style={[styles.summaryValue, { color: "#dc2626" }]}>-{data.discountAmount.toLocaleString()} {currency}</Text>
            </View>
          )}
          {data.childrenCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Supplément enfants</Text>
              <Text style={styles.summaryValue}>{data.childrenCharge.toLocaleString()} {currency}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paiement</Text>
            <Text style={styles.summaryValue}>{data.paymentMethod === "TPE" ? "Carte bancaire" : data.paymentMethod === "CASH" ? "Espèces" : data.partner?.name || data.paymentMethod}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{data.totalAmount.toLocaleString()} {currency}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {data.hotel?.footerMessage || "Le Cheval Blanc — Hôtel"}{"\n"}
          Généré le {new Date(data.createdAt).toLocaleDateString("fr-FR")} à {new Date(data.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}{" | "}
          Reçu par {data.receptionist}
        </Text>
      </Page>
    </Document>
  );
}
