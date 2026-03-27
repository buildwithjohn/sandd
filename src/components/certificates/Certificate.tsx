"use client";
import { useRef } from "react";

interface CertificateProps {
  studentName: string;
  certificateType: "year1" | "year2";
  completionDate: string;
  certificateNumber: string;
}

export default function Certificate({
  studentName,
  certificateType,
  completionDate,
  certificateNumber,
}: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const title =
    certificateType === "year1"
      ? "Certificate in Prophetic Ministry"
      : "Diploma in New Testament Prophecy";

  const year = certificateType === "year1" ? "Year One" : "Year Two";

  function handlePrint() {
    if (!certRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate — ${studentName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; }
            @page { size: A4 landscape; margin: 0; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${certRef.current.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }

  return (
    <div>
      {/* Certificate canvas */}
      <div
        ref={certRef}
        style={{
          width: "100%",
          aspectRatio: "1.414",
          background: "#ffffff",
          border: "1px solid #BFDBFE",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Inter', sans-serif",
          padding: "0",
        }}
      >
        {/* Outer border decoration */}
        <div style={{
          position: "absolute", inset: "16px",
          border: "2px solid #1E3A8A",
          borderRadius: "8px",
          pointerEvents: "none",
          zIndex: 1,
        }} />
        <div style={{
          position: "absolute", inset: "20px",
          border: "1px solid #BFDBFE",
          borderRadius: "6px",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 10% 50%, rgba(219,234,254,0.4) 0%, transparent 50%), radial-gradient(ellipse at 90% 50%, rgba(219,234,254,0.3) 0%, transparent 50%)",
        }} />

        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "6px",
          background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 50%, #1E3A8A 100%)",
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 2,
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 60px", textAlign: "center",
        }}>
          {/* School seal */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#1E3A8A", display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: "16px",
            border: "3px solid #BFDBFE",
          }}>
            <span style={{ fontSize: "28px" }}>✝</span>
          </div>

          {/* School name */}
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "11px",
            fontWeight: 500, letterSpacing: "0.2em", color: "#2563EB",
            textTransform: "uppercase", marginBottom: "6px",
          }}>
            Sons &amp; Daughters of Prophets Prophetic Training School
          </p>
          <p style={{
            fontSize: "10px", color: "#64748B", letterSpacing: "0.1em",
            marginBottom: "24px", textTransform: "uppercase",
          }}>
            Celestial Church of Christ
          </p>

          {/* This is to certify */}
          <p style={{
            fontFamily: "'Playfair Display', serif", fontStyle: "italic",
            fontSize: "clamp(14px, 2vw, 18px)", color: "#475569", marginBottom: "10px",
          }}>
            This is to certify that
          </p>

          {/* Student name */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 4vw, 42px)",
            color: "#1E3A8A", fontWeight: 500,
            borderBottom: "2px solid #BFDBFE",
            paddingBottom: "10px", marginBottom: "10px",
            letterSpacing: "0.02em",
          }}>
            {studentName}
          </h1>

          {/* Has successfully completed */}
          <p style={{
            fontFamily: "'Playfair Display', serif", fontStyle: "italic",
            fontSize: "clamp(13px, 1.8vw, 17px)", color: "#475569", marginBottom: "8px",
          }}>
            has successfully completed {year} of the
          </p>

          {/* Certificate title */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(16px, 2.5vw, 26px)",
            color: "#1E40AF", fontWeight: 600,
            marginBottom: "6px", letterSpacing: "0.01em",
          }}>
            {title}
          </h2>

          <p style={{
            fontSize: "11px", color: "#94A3B8", marginBottom: "28px",
            letterSpacing: "0.05em",
          }}>
            Awarded on {completionDate}
          </p>

          {/* Signatures */}
          <div style={{
            display: "flex", gap: "80px", alignItems: "flex-end",
            marginBottom: "16px",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "140px", borderBottom: "1.5px solid #1E3A8A",
                marginBottom: "6px", height: "32px",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic", fontSize: "18px", color: "#1E3A8A",
                }}>
                  Abiodun Sule
                </span>
              </div>
              <p style={{ fontSize: "10px", color: "#64748B", fontWeight: 500 }}>Prophet Abiodun Sule</p>
              <p style={{ fontSize: "9px", color: "#94A3B8" }}>Founder & Dean</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "140px", borderBottom: "1.5px solid #1E3A8A",
                marginBottom: "6px", height: "32px",
              }} />
              <p style={{ fontSize: "10px", color: "#64748B", fontWeight: 500 }}>Advisory Board Chair</p>
              <p style={{ fontSize: "9px", color: "#94A3B8" }}>S&D Prophetic School</p>
            </div>
          </div>

          {/* Certificate number */}
          <p style={{ fontSize: "9px", color: "#CBD5E1", letterSpacing: "0.1em" }}>
            Certificate No. {certificateNumber} · sandd.abiodunsule.uk
          </p>
        </div>

        {/* Bottom accent bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "6px",
          background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 50%, #1E3A8A 100%)",
        }} />
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="mt-4 w-full bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        🖨️ Print / Save as PDF
      </button>
    </div>
  );
}
