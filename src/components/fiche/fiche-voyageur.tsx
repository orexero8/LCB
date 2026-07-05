"use client";

interface GuestInfo {
  nom: string;
  prenom: string;
  maidenName?: string | null;
  dateOfBirth?: string | null;
  profession?: string | null;
  address?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  idDocument?: string | null;
  idDeliveryDate?: string | null;
  idDeliveryPlace?: string | null;
  idAuthority?: string | null;
  wilaya?: string | null;
}

interface FicheData {
  hotel?: { name?: string; logoUrl?: string | null; address?: string | null; phone?: string | null; email?: string | null; whatsapp?: string | null } | null;
  bookingRef: string;
  rooms: { roomNumber: number; floor: string }[];
  guest: GuestInfo;
  relationLabel?: string;
  childrenUnder15?: number;
  checkIn: string;
  acte?: string | null;
}

export function FicheVoyageur({ data }: { data: FicheData }) {
  const g = data.guest;
  const roomStr = data.rooms.map((r) => r.roomNumber.toString().padStart(2, "0")).join(", ");
  const today = new Date().toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{
      width: "297mm", minHeight: "210mm", padding: "10mm 12mm",
      fontFamily: "Arial, sans-serif", color: "#000", background: "#fff",
      position: "relative", fontSize: "11pt",
    }}>
      <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", borderLeft: "1px dashed #bbb" }} />

      <div style={{ display: "flex", height: "100%" }}>
        {/* Left half */}
        <div style={{ width: "50%", paddingRight: "7mm", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, borderBottom: "1px solid #333", paddingBottom: 6 }}>
            <img src={data.hotel?.logoUrl || "/CHEVALBLANC.png"} alt="Logo"
              style={{ width: "auto" as const, height: 40, objectFit: "contain" as const }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ fontSize: "8pt", lineHeight: 1.4, color: "#222", flex: 1 }}>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{data.hotel?.name || "Le Cheval Blanc"}</div>
              {data.hotel?.address && <div>{data.hotel.address}</div>}
              {data.hotel?.phone && <div>Tél: {data.hotel.phone}</div>}
              {data.hotel?.whatsapp && <div>WhatsApp: {data.hotel.whatsapp}</div>}
              {data.hotel?.email && <div>Email: {data.hotel.email}</div>}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <h1 style={{ fontSize: "14pt", fontWeight: "bold", letterSpacing: 1, margin: "0 0 4px", display: "inline-block", borderBottom: "2px solid #000", paddingBottom: 2 }}>
              FICHE DE VOYAGEUR
            </h1>
            <div style={{ fontSize: "10pt", fontWeight: "bold", marginTop: 3 }}>
              CHAMBRE N° / Room No : <span style={{ borderBottom: "1.5px solid #000", padding: "0 16px", fontWeight: "bold", textTransform: "uppercase" }}>{roomStr}</span>
            </div>
            {data.relationLabel && (
              <div style={{ fontSize: "9pt", marginTop: 2, color: "#555" }}>
                {data.relationLabel}
              </div>
            )}
          </div>

          <Field label="Nom" ar="اللقب" sub="Name" value={g?.nom} />
          <Field label="Nom de jeune fille" ar="اللقب الأصلي للزوجة" sub="Maiden name" value={g?.maidenName} />
          <Field label="Prénoms" ar="الاسم" sub="First names" value={g?.prenom} />
          <Field label="Né (e) le" ar="تاريخ الميلاد" sub="Date of birth" value={g?.dateOfBirth} />
          <Field label="Wilaya ou pays" ar="الولاية" sub="Country of birth" value={g?.wilaya} />
          <Field label="Profession" ar="المهنة" sub="Occupation" value={g?.profession} />
          <Field label="Adresse" ar="العنوان" sub="Address" value={g?.address} />
          <Field label="Téléphone" ar="الهاتف" sub="Tel" value={g?.phone} />
          <Field label="Email" ar="البريد الإلكتروني" value={g?.email} />
          <Field label="Nationalité" ar="الجنسية" sub="Nationality" value={g?.nationality} />
        </div>

        {/* Right half */}
        <div style={{ width: "50%", paddingLeft: "7mm", display: "flex", flexDirection: "column" }}>
          {data.childrenUnder15 !== undefined && (
            <div style={{ fontSize: "9pt", fontWeight: "bold", lineHeight: 1.3, marginBottom: 6, border: "1px solid #ccc", padding: "5px 8px", borderRadius: 3 }}>
              <div style={{ direction: "rtl", textAlign: "right" }}>عدد الأطفال أقل من 15 سنة</div>
              Enfants &lt; 15 ans : <span style={{ borderBottom: "1px solid #000", padding: "0 16px", fontWeight: "bold", textTransform: "uppercase" }}>{data.childrenUnder15}</span>
              <div style={{ fontWeight: "normal", fontSize: "8pt", color: "#444" }}>Accompanying children under 15</div>
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "10pt", fontWeight: "bold", letterSpacing: 0.5, marginBottom: 6 }}>
            PIÈCE D&apos;IDENTITÉ PRODUITE
          </div>

          <div style={{ border: "2px solid #000", padding: 8, background: "#fff", marginBottom: 8 }}>
            <div style={{ textAlign: "center", fontSize: "11pt", fontWeight: "bold", marginBottom: 2, direction: "rtl" }}>
              بطاقة التعريف أو جواز السفر
            </div>
            <div style={{ textAlign: "center", fontSize: "9pt", fontWeight: "bold", margin: "0 0 8px" }}>
              Carte d&apos;Identité ou Passeport / <span style={{ fontWeight: "normal", fontSize: "8pt", color: "#444" }}>Certificate of identity or passport</span>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl" }}>رقم</span>
                  <span style={{ fontSize: "9pt", fontWeight: "bold" }}>N° :</span>
                  <div style={{ borderBottom: "1.5px solid #000", height: 24, flex: 1, textAlign: "center", fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: "24px" }}>
                    {g?.idDocument || ""}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl" }}>سلم بتاريخ</span>
                  <span style={{ fontSize: "9pt", fontWeight: "bold" }}>Délivré le :</span>
                  <div style={{ borderBottom: "1.5px solid #000", height: 24, flex: 1, textAlign: "center", fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: "24px" }}>
                    {g?.idDeliveryDate || ""}
                  </div>
                </div>
                <div style={{ fontSize: "7pt", margin: "2px 0 0", textAlign: "center", width: "100%" }}>Issued on</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl" }}>في</span>
                  <span style={{ fontSize: "9pt", fontWeight: "bold" }}>A :</span>
                  <div style={{ borderBottom: "1.5px solid #000", height: 24, flex: 1, textAlign: "center", fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: "24px" }}>
                    {g?.idDeliveryPlace || ""}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl" }}>من</span>
                  <span style={{ fontSize: "9pt", fontWeight: "bold" }}>Par :</span>
                  <div style={{ borderBottom: "1.5px solid #000", height: 24, flex: 1, textAlign: "center", fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: "24px" }}>
                    {g?.idAuthority || ""}
                  </div>
                </div>
                <div style={{ fontSize: "7pt", margin: "2px 0 0", textAlign: "center", width: "100%" }}>By</div>
              </div>
            </div>

            <div style={{ marginTop: 8, textAlign: "center" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl", marginBottom: 2 }}>تاريخ الدخول إلى الجزائر</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>
                Date d&apos;entrée en Algérie : <span style={{ borderBottom: "1.5px solid #000", padding: "0 12px", fontWeight: "bold", textTransform: "uppercase" }}>{data.checkIn}</span>
              </div>
              <div style={{ fontSize: "7pt", marginTop: 2 }}>Date of arrival in Algeria</div>
            </div>

            {data.acte && (
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl", marginBottom: 2 }}>رقم عقد الزواج</div>
                <div style={{ fontSize: "9pt", fontWeight: "bold" }}>
                  N° Acte de Mariage : <span style={{ borderBottom: "1.5px solid #000", padding: "0 12px", fontWeight: "bold", textTransform: "uppercase" }}>{data.acte}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "9pt", fontWeight: "bold", width: "50%" }}>
              Fait à Oran, le : {today}
            </div>
            <div style={{ width: "45%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", fontWeight: "bold" }}>
                <span>Signature,</span>
                <span style={{ direction: "rtl" }}>الإمضاء</span>
              </div>
              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ar, sub, value }: { label: string; ar: string; sub?: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 6, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 1 }}>
        <div style={{ fontSize: "9pt", fontWeight: "bold" }}>
          {label} : {sub && <span style={{ fontWeight: "normal", fontSize: "8pt" }}>({sub})</span>}
        </div>
        <div style={{ fontSize: "10pt", fontWeight: "bold", direction: "rtl" }}>{ar} :</div>
      </div>
      <div style={{ borderBottom: "1.5px solid #000", height: 22, width: "100%", textAlign: "center", fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: "22px" }}>
        {value || ""}
      </div>
    </div>
  );
}

const printStyles = `
  @page { size: A4 landscape; margin: 0; }
  @media print { body { -webkit-print-color-adjust: exact; } }
`;

export function FicheVoyageurPrint({ data }: { data: FicheData }) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <style>{printStyles}</style>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <FicheVoyageur data={data} />
      </body>
    </html>
  );
}

export type { FicheData, GuestInfo };
