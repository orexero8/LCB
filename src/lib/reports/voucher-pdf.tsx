import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface VoucherData {
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  rooms: Array<{
    roomNumber: number;
    floor: string;
    type: string;
    bedLayout: string;
    priceAtBooking: number;
  }>;
  childrenCharge: number;
  childrenAges: number[];
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
    checkInTime: string;
    checkOutTime: string;
    footerMessage: string;
    currencySymbol: string;
  } | null;
}

const styles = StyleSheet.create({
  page: { padding: 25, fontFamily: "Helvetica", fontSize: 9 },
  header: { marginBottom: 16, textAlign: "center", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  hotelInfo: { fontSize: 7, color: "#555", lineHeight: 1.4 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 8, fontWeight: "bold", marginBottom: 6, color: "#333", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingBottom: 2, textAlign: "center", textTransform: "uppercase" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: "35%", color: "#666", fontSize: 8 },
  value: { width: "65%", fontSize: 9 },
  roomLine: { fontSize: 9, marginBottom: 2 },
  footer: { marginTop: "auto", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#ccc", fontSize: 6.5, color: "#888", textAlign: "center", lineHeight: 1.6 },
});

export function VoucherPdf({ data }: { data: VoucherData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          {data.hotel?.logoUrl && (
            <Image src={data.hotel.logoUrl} style={{ width: 60, height: 60, marginBottom: 4, alignSelf: "center" }} />
          )}
          <Text style={styles.title}>{data.hotel?.name || "Le Cheval Blanc"}</Text>
          {data.hotel?.address && <Text style={styles.hotelInfo}>{data.hotel.address}</Text>}
          <Text style={styles.hotelInfo}>
            Tél: {data.hotel?.phone || ""}{data.hotel?.whatsapp ? ` | WhatsApp: ${data.hotel.whatsapp}` : ""}{data.hotel?.email ? ` | ${data.hotel.email}` : ""}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reçu de Réservation</Text>
          <View style={styles.row}><Text style={styles.label}>Réf. Réservation</Text><Text style={[styles.value, { fontFamily: "Courier", fontWeight: "bold" }]}>{data.bookingRef}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text style={styles.value}>{data.guestName}</Text></View>
          <View style={styles.row}>
            <Text style={styles.label}>Chambre(s)</Text>
            <Text style={styles.value}>{data.rooms.map(r => String(r.roomNumber).padStart(2, "0")).join(", ")}</Text>
          </View>
          <View style={styles.row}><Text style={styles.label}>Arrivée</Text><Text style={styles.value}>{data.checkIn}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Départ</Text><Text style={styles.value}>{data.checkOut}</Text></View>
        </View>

        <View style={{ marginTop: 16, borderTopWidth: 0.5, borderTopColor: "#ccc", paddingTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 8, color: "#666" }}>Sous-total</Text>
            <Text style={{ fontSize: 8 }}>{(data.totalAmount + data.discountAmount - (data.childrenCharge || 0)).toLocaleString()} {data.hotel?.currencySymbol || "DA"}</Text>
          </View>
          {(data.childrenCharge || 0) > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 7, color: "#666" }}>Suppl. enfants</Text>
              <Text style={{ fontSize: 7, color: "#d00" }}>+{Number(data.childrenCharge).toLocaleString()} {data.hotel?.currencySymbol || "DA"}</Text>
            </View>
          )}
          {data.discountAmount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 7, color: "#666" }}>Remise{data.discountCode ? ` (${data.discountCode})` : ""}</Text>
              <Text style={{ fontSize: 7, color: "#d00" }}>-{data.discountAmount.toLocaleString()} {data.hotel?.currencySymbol || "DA"}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>Total</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{data.totalAmount.toLocaleString()} {data.hotel?.currencySymbol || "DA"}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {data.hotel?.footerMessage || "Le Cheval Blanc"}{"\n"}
          Généré le {new Date(data.createdAt).toLocaleDateString("fr-FR")} à {new Date(data.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </Page>
    </Document>
  );
}
