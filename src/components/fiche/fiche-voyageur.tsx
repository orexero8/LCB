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
      width: "210mm", minHeight: "148mm", padding: "5mm 7mm",
      fontFamily: "Arial, sans-serif", color: "#000", background: "#fff",
      position: "relative", fontSize: "7pt",
    }}>
      <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", borderLeft: "1px dashed #ddd" }} />

      <div style={{ display: "flex", height: "100%" }}>
        {/* Left half */}
        <div style={{ width: "50%", paddingRight: "7mm", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, borderBottom: "1px solid #333", paddingBottom: 5 }}>
            <img src={data.hotel?.logoUrl || "/CHEVALBLANC.png"} alt="Logo"
              style={{ width: "auto" as const, height: 30, objectFit: "contain" as const }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ fontSize: "6pt", lineHeight: 1.3, color: "#222", flex: 1 }}>
              <div style={{ fontSize: "8pt", fontWeight: "bold" }}>{data.hotel?.name || "Le Cheval Blanc"}</div>
              {data.hotel?.address && <div>{data.hotel.address}</div>}
              {data.hotel?.phone && <div>Tél: {data.hotel.phone}</div>}
              {data.hotel?.whatsapp && <div>WhatsApp: {data.hotel.whatsapp}</div>}
              {data.hotel?.email && <div>Email: {data.hotel.email}</div>}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <h1 style={{ fontSize: "10pt", fontWeight: "bold", letterSpacing: 1, margin: "0 0 2px", display: "inline-block", borderBottom: "1.5px solid #000", paddingBottom: 1 }}>
              FICHE DE VOYAGEUR
            </h1>
            <div style={{ fontSize: "7pt", fontWeight: "bold", marginTop: 2 }}>
              CHAMBRE N° / Room No : <span style={{ borderBottom: "1.5px solid #000", padding: "0 12px" }}>{roomStr}</span>
            </div>
            {data.relationLabel && (
              <div style={{ fontSize: "6.5pt", marginTop: 1, color: "#555" }}>
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
            <div style={{ fontSize: "6.5pt", fontWeight: "bold", lineHeight: 1.2, marginBottom: 5, border: "1px solid #ccc", padding: "3px 5px", borderRadius: 2 }}>
              <div style={{ direction: "rtl", textAlign: "right" }}>عدد الأطفال أقل من 15 سنة</div>
              Enfants &lt; 15 ans : <span style={{ borderBottom: "1px solid #000", padding: "0 12px" }}>{data.childrenUnder15}</span>
              <div style={{ fontWeight: "normal", fontSize: "5.5pt", color: "#444" }}>Accompanying children under 15</div>
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "7.5pt", fontWeight: "bold", letterSpacing: 0.3, marginBottom: 4 }}>
            PIÈCE D&apos;IDENTITÉ PRODUITE
          </div>

          <div style={{ border: "1.5px solid #000", padding: 6, background: "#fff", marginBottom: 6 }}>
            <div style={{ textAlign: "center", fontSize: "8pt", fontWeight: "bold", marginBottom: 1, direction: "rtl" }}>
              بطاقة التعريف أو جواز السفر
            </div>
            <div style={{ textAlign: "center", fontSize: "7pt", fontWeight: "bold", margin: "0 0 6px" }}>
              Carte d&apos;Identité ou Passeport / <span style={{ fontWeight: "normal", fontSize: "6pt", color: "#444" }}>Certificate of identity or passport</span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: "7pt", fontWeight: "bold", direction: "rtl" }}>رقم</span>
                  <span style={{ fontSize: "6.5pt", fontWeight: "bold" }}>N° :</span>
                  <div style={{ borderBottom: "1px solid #000", height: 14, flex: 1, paddingLeft: 2, fontSize: "6.5pt", lineHeight: "14px" }}>
                    {g?.idDocument || ""}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: "7pt", fontWeight: "bold", direction: "rtl" }}>سلم بتاريخ</span>
                  <span style={{ fontSize: "6.5pt", fontWeight: "bold" }}>Délivré le :</span>
                  <div style={{ borderBottom: "1px solid #000", height: 14, flex: 1, paddingLeft: 2, fontSize: "6.5pt", lineHeight: "14px" }}>
                    {g?.idDeliveryDate || ""}
                  </div>
                </div>
                <div style={{ fontSize: "5.5pt", margin: "1px 0 0", textAlign: "center", width: "100%" }}>Issued on</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: "7pt", fontWeight: "bold", direction: "rtl" }}>في</span>
                  <span style={{ fontSize: "6.5pt", fontWeight: "bold" }}>A :</span>
                  <div style={{ borderBottom: "1px solid #000", height: 14, flex: 1, paddingLeft: 2, fontSize: "6.5pt", lineHeight: "14px" }}>
                    {g?.idDeliveryPlace || ""}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: "7pt", fontWeight: "bold", direction: "rtl" }}>من</span>
                  <span style={{ fontSize: "6.5pt", fontWeight: "bold" }}>Par :</span>
                  <div style={{ borderBottom: "1px solid #000", height: 14, flex: 1, paddingLeft: 2, fontSize: "6.5pt", lineHeight: "14px" }}>
                    {g?.idAuthority || ""}
                  </div>
                </div>
                <div style={{ fontSize: "5.5pt", margin: "1px 0 0", textAlign: "center", width: "100%" }}>By</div>
              </div>
            </div>

            <div style={{ marginTop: 6, textAlign: "center" }}>
              <div style={{ fontSize: "7.5pt", fontWeight: "bold", direction: "rtl", marginBottom: 1 }}>تاريخ الدخول إلى الجزائر</div>
              <div style={{ fontSize: "6.5pt", fontWeight: "bold" }}>
                Date d&apos;entrée en Algérie : <span style={{ borderBottom: "1px solid #000", padding: "0 8px" }}>{data.checkIn}</span>
              </div>
              <div style={{ fontSize: "5.5pt", marginTop: 1 }}>Date of arrival in Algeria</div>
            </div>

            {data.acte && (
              <div style={{ marginTop: 4, textAlign: "center" }}>
                <div style={{ fontSize: "7pt", fontWeight: "bold", direction: "rtl", marginBottom: 1 }}>رقم عقد الزواج</div>
                <div style={{ fontSize: "6.5pt", fontWeight: "bold" }}>
                  N° Acte de Mariage : <span style={{ borderBottom: "1px solid #000", padding: "0 8px" }}>{data.acte}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "6.5pt", fontWeight: "bold", width: "50%" }}>
              Fait à Oran, le : {today}
            </div>
            <div style={{ width: "45%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "6.5pt", fontWeight: "bold" }}>
                <span>Signature,</span>
                <span style={{ direction: "rtl" }}>الإمضاء</span>
              </div>
              <div style={{ height: 30 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ar, sub, value }: { label: string; ar: string; sub?: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 4, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 }}>
        <div style={{ fontSize: "6.5pt", fontWeight: "bold" }}>
          {label} : {sub && <span style={{ fontWeight: "normal", fontSize: "5.5pt" }}>({sub})</span>}
        </div>
        <div style={{ fontSize: "7.5pt", fontWeight: "bold", direction: "rtl" }}>{ar} :</div>
      </div>
      <div style={{ borderBottom: "1px solid #000", height: 13, width: "100%", paddingLeft: value ? 2 : 0, fontSize: "6.5pt", lineHeight: "13px" }}>
        {value || ""}
      </div>
    </div>
  );
}

const printStyles = `
  @page { size: A5 landscape; margin: 0; }
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
