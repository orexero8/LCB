import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface InvoiceRoom {
  roomNumber: number;
  floor: string;
  type: string;
  priceAtBooking: number;
}

interface InvoiceData {
  bookingRef: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adultCount: number;
  rooms: InvoiceRoom[];
  childrenCharge: number;
  childrenAges: { nom: string; age: number }[];
  discountAmount: number;
  discountCode: string | null;
  roomSubtotal: number;
  taxeSejour: number;
  droitMille: number;
  totalTTC: number;
  paymentMethod: string;
  partner: { name: string; contactPhone: string | null } | null;
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
  logoRow: { alignItems: "center", marginBottom: 20 },
  logo: { width: 120, height: 120, objectFit: "contain" },
  oranText: { fontSize: 10, marginTop: 4 },
  infoBlock: { alignItems: "center", marginBottom: 16 },
  hotelName: { fontSize: 13, fontWeight: "bold", marginBottom: 2 },
  hotelLine: { fontSize: 8, lineHeight: 1.5 },
  taxLine: { fontSize: 8, lineHeight: 1.4, marginTop: 4 },
  titleBlock: { textAlign: "center", marginBottom: 16 },
  title: { fontSize: 14, fontWeight: "bold" },
  titleRef: { fontSize: 9, marginTop: 2 },
  table: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerCell: { fontSize: 7, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  cell: { fontSize: 8 },
  cellRight: { fontSize: 8, textAlign: "right" },
  cellCenter: { fontSize: 8, textAlign: "center" },
  taxRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  totalTableRow: { flexDirection: "row", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#000", marginTop: 2 },
  totalCellLabel: { fontSize: 9, fontWeight: "bold" },
  totalCellValue: { fontSize: 9, fontWeight: "bold", textAlign: "right" },
  summaryBlock: { borderWidth: 1, borderColor: "#000", padding: 8, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  summaryLabel: { fontSize: 8 },
  summaryValue: { fontSize: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#000", paddingTop: 4, marginTop: 2 },
  totalLabel: { fontSize: 10, fontWeight: "bold" },
  totalValue: { fontSize: 10, fontWeight: "bold" },
  wordsBlock: { textAlign: "center", fontSize: 8, lineHeight: 1.6, marginTop: 8, paddingTop: 8 },
});

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

const units = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
];
const teens = [
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];

function below100(n: number): string {
  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  const t = Math.floor(n / 10);
  const u = n % 10;
  const tWords = [
    "", "dix", "vingt", "trente", "quarante", "cinquante",
    "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix",
  ];
  if (t === 7 || t === 9) {
    const base = t === 7 ? 60 : 80;
    const rem = n - base;
    const prefix = tWords[t];
    if (rem === 1) return prefix + " et un";
    if (rem === 11) return prefix + " et onze";
    return prefix + "-" + below100(rem);
  }
  if (u === 0) return tWords[t] + (t === 8 ? "s" : "");
  if (u === 1 && t !== 8) return tWords[t] + " et un";
  if (u === 1) return tWords[t] + "-un";
  return tWords[t] + "-" + units[u];
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = "";
  if (h > 0) s += h === 1 ? "cent" : units[h] + " cent";
  if (r === 0 && h > 1) s += "s";
  if (r > 0) {
    if (s) s += " ";
    s += below100(r);
  }
  return s;
}

function numberToFrench(n: number): string {
  if (n === 0) return "zéro";
  const parts: string[] = [];
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    parts.push(m === 1 ? "un million" : below1000(m) + " millions");
    n %= 1000000;
  }
  if (n >= 1000) {
    const k = Math.floor(n / 1000);
    parts.push(k === 1 ? "mille" : below1000(k) + " mille");
    n %= 1000;
  }
  if (n > 0) parts.push(below1000(n));
  const intStr = parts.join(" ");
  return intStr.charAt(0).toUpperCase() + intStr.slice(1);
}

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const ccy = data.hotel?.currencySymbol || "DA";
  const createdDate = new Date(data.createdAt);
  const dateStr = createdDate.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoRow}>
          {data.hotel?.logoUrl && <Image src={data.hotel.logoUrl} style={styles.logo} />}
          <Text style={styles.oranText}>ORAN, le {dateStr}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.hotelName}>{data.hotel?.name || "LE CHEVAL BLANC"}</Text>
          {data.hotel?.address && <Text style={styles.hotelLine}>{data.hotel.address}</Text>}
          <Text style={styles.hotelLine}>Tél: {data.hotel?.phone || ""}</Text>
          <View style={styles.taxLine}>
            <Text>
              RC: {data.hotel?.rc || "N/A"} | NIF: {data.hotel?.nif || "N/A"} | NIS: {data.hotel?.nis || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>FACTURE</Text>
          <Text style={styles.titleRef}>N° {data.bookingRef} | Séjour du {fmt(data.checkIn)} au {fmt(data.checkOut)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: "28%" }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: "12%", textAlign: "center" }]}>Nbr Pax</Text>
            <Text style={[styles.headerCell, { width: "15%", textAlign: "center" }]}>Nbr Nuitées</Text>
            <Text style={[styles.headerCell, { width: "20%", textAlign: "right" }]}>P.U</Text>
            <Text style={[styles.headerCell, { width: "25%", textAlign: "right" }]}>Total</Text>
          </View>
          {data.rooms.map((r, i) => {
            const roomTotal = r.priceAtBooking * data.nights;
            return (
              <View style={styles.tableRow} key={i}>
                <Text style={[styles.cell, { width: "28%" }]}>
                  Ch. {String(r.roomNumber).padStart(2, "0")} — {r.type}
                </Text>
                <Text style={[styles.cellCenter, { width: "12%" }]}>1</Text>
                <Text style={[styles.cellCenter, { width: "15%" }]}>{data.nights}</Text>
                <Text style={[styles.cellRight, { width: "20%" }]}>{r.priceAtBooking.toLocaleString()} {ccy}</Text>
                <Text style={[styles.cellRight, { width: "25%" }]}>{roomTotal.toLocaleString()} {ccy}</Text>
              </View>
            );
          })}
          <View style={styles.taxRow}>
            <Text style={[styles.cell, { width: "28%" }]}>Taxe de Séjour (100 DA/nuit/pers.)</Text>
            <Text style={[styles.cellCenter, { width: "12%" }]}>{data.adultCount}</Text>
            <Text style={[styles.cellCenter, { width: "15%" }]}>{data.nights}</Text>
            <Text style={[styles.cellRight, { width: "20%" }]}>100 {ccy}</Text>
            <Text style={[styles.cellRight, { width: "25%" }]}>{data.taxeSejour.toLocaleString()} {ccy}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.taxRow}>
              <Text style={[styles.cell, { width: "28%" }]}>
                Remise{data.discountCode ? ` (${data.discountCode})` : ""}
              </Text>
              <Text style={[styles.cellCenter, { width: "12%" }]}>—</Text>
              <Text style={[styles.cellCenter, { width: "15%" }]}>—</Text>
              <Text style={[styles.cellRight, { width: "20%" }]}>—</Text>
              <Text style={[styles.cellRight, { width: "25%" }]}>-{data.discountAmount.toLocaleString()} {ccy}</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total séjour</Text>
            <Text style={styles.summaryValue}>{data.roomSubtotal.toLocaleString()} {ccy}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxe de Séjour</Text>
            <Text style={styles.summaryValue}>{data.taxeSejour.toLocaleString()} {ccy}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>D. Timbre</Text>
            <Text style={styles.summaryValue}>{data.droitMille.toLocaleString()} {ccy}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TVA 0%</Text>
            <Text style={styles.summaryValue}>0 {ccy}</Text>
          </View>
          {data.childrenCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Suppl. enfants</Text>
              <Text style={styles.summaryValue}>{data.childrenCharge.toLocaleString()} {ccy}</Text>
            </View>
          )}
          {data.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remise</Text>
              <Text style={styles.summaryValue}>-{data.discountAmount.toLocaleString()} {ccy}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL TTC</Text>
            <Text style={styles.totalValue}>{data.totalTTC.toLocaleString()} {ccy}</Text>
          </View>
        </View>

        <Text style={styles.wordsBlock}>
          Arrêter la présente facture à la somme de : {"\n"}
          {numberToFrench(Math.round(data.totalTTC))} Dinars Algériens
        </Text>
      </Page>
    </Document>
  );
}