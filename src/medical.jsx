import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

// ── Groq ──────────────────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function transcribeAudio(audioBlob) {
  const extension = audioBlob.type.includes("ogg") ? "ogg" : "webm";
  const formData = new FormData();
  formData.append("file", audioBlob, `recording.${extension}`);
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Échec de la transcription");
  }

  const data = await res.json();
  return data.text;
}

async function generateReport(transcript) {
  // ── Step 1: Check if transcript is medical ────────────────────────────
  const checkRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a medical content validator.
Your only job is to check if the given text is related to medicine, health, or a medical case.
Reply with ONLY one word: "YES" if it is medical, "NO" if it is not.
Do not explain. Do not add anything else.`,
        },
        { role: "user", content: transcript },
      ],
      temperature: 0,
      max_tokens: 5,
    }),
  });

  if (!checkRes.ok) {
    const err = await checkRes.json();
    throw new Error(err?.error?.message || "Échec de la validation");
  }

  const checkData = await checkRes.json();
  const answer = checkData.choices[0].message.content.trim().toUpperCase();

  if (!answer.includes("YES")) {
    throw new Error("⚠ Ce contenu n'est pas lié à la médecine. Veuillez enregistrer un cas médical.");
  }

  // ── Step 2: Generate the report ───────────────────────────────────────
  const systemPrompt = `You are an expert medical report writer assistant.
Your job is to read a doctor's voice transcript and produce a structured, professional medical report.

Detect the body region or case type (e.g. knee, shoulder, ankle, spine, chest, abdomen, neurological, etc.).

Always output the report in this exact format:

RAPPORT MÉDICAL
==============
Date: [today's date]
Région / Type de cas: [detected region]

MOTIF DE CONSULTATION:
[Summarize the main complaint]

HISTOIRE DE LA MALADIE:
[Expand and structure what the doctor described]

CONSTATATIONS CLINIQUES:
[List key clinical observations]

ÉVALUATION:
[Medical assessment based on findings]

PLAN / RECOMMANDATIONS:
[Treatment plan, follow-up, referrals]

NOTES:
[Any additional notes or observations]

Important: Write the entire report in the same language as the transcript.
Keep the language professional, clear, and medically accurate.
Do not add information that was not mentioned in the transcript.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcription du médecin:\n\n${transcript}` },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Échec de la génération du rapport");
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Medical() {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [report, setReport] = useState("");
  const [patientName, setPatientName] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef("audio/webm");

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "recording") {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (phase !== "recording") setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  // ── Recording ─────────────────────────────────────────────────────────
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";

      mimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setPhase("recording");
    } catch {
      setError("Accès au microphone refusé. Veuillez autoriser le microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && phase === "recording") {
      mediaRecorderRef.current.stop();
      setPhase("transcribing");
    }
  }

  // ── File Upload ───────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setPhase("transcribing");
    await processAudio(file);
  }

  // ── Process Audio ─────────────────────────────────────────────────────
  async function processAudio(audioBlob) {
    try {
      setPhase("transcribing");
      const text = await transcribeAudio(audioBlob);
      setTranscript(text);
      setPhase("generating");
      const rep = await generateReport(text);
      setReport(rep);
      setPhase("done");
    } catch (err) {
      setError(err.message);
      setPhase("idle");
    }
  }

  // ── Export PDF ────────────────────────────────────────────────────────
  function exportPDF() {
    if (!report.trim()) return;
    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SYSTEME DE RAPPORT MEDICAL IA", margin, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient: ${patientName || "N/A"}`, margin, 30);
      doc.text(`Genere le: ${new Date().toLocaleString("fr-FR")}`, margin, 36);

      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      const cleanText = report.replace(/[^\x00-\x7F]/g, (char) => {
        const map = {
          'à':'a','â':'a','ä':'a','á':'a','ã':'a',
          'è':'e','é':'e','ê':'e','ë':'e',
          'î':'i','ï':'i','í':'i','ì':'i',
          'ô':'o','ö':'o','ó':'o','ò':'o','õ':'o',
          'ù':'u','û':'u','ü':'u','ú':'u',
          'ç':'c','ñ':'n','É':'E','È':'E','Ê':'E',
          'À':'A','Â':'A','Î':'I','Ô':'O','Ù':'U','Û':'U','Ç':'C',
          '\u2019':"'",'«':'"','»':'"',
        };
        return map[char] || "";
      });

      doc.setFontSize(11);
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      let y = 48;
      lines.forEach((line) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      });

      doc.save(`rapport-medical-${patientName || "patient"}-${Date.now()}.pdf`);
      showToast("PDF exporté avec succès.");
    } catch (err) {
      setError("Échec de l'export PDF: " + err.message);
    }
  }

  // ── Copy ──────────────────────────────────────────────────────────────
  function copyReport() {
    if (!report.trim()) return;
    navigator.clipboard.writeText(report);
    showToast("Rapport copié dans le presse-papiers.");
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    setPhase("idle");
    setTranscript("");
    setReport("");
    setPatientName("");
    setError("");
    setRecordingTime(0);
    audioChunksRef.current = [];
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  const isProcessing = phase === "transcribing" || phase === "generating";

  return (
    <div className="med-app">
      {toast && <div className="med-toast">{toast}</div>}

      {/* Header */}
      <header className="med-header">
        <div className="med-logo">
          <span className="med-logo-icon">⚕</span>
          <div>
            <div className="med-logo-title">MediVoice AI</div>
            <div className="med-logo-sub">Système de Rapport Médical</div>
          </div>
        </div>
      </header>

      <main className="med-main">
        {error && (
          <div className="med-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        <div className="med-grid">
          {/* ── Left Column ── */}
          <div className="med-col">

            {/* Section 1: Enregistrement */}
            <section className="med-card">
              <div className="med-card-header">
                <span className="med-step">01</span>
                <h2>Enregistrement Vocal</h2>
              </div>

              <div className="med-record-center">
                {phase === "recording" ? (
                  <>
                    <button className="med-record-btn recording" onClick={stopRecording}>
                      <span className="med-record-icon stop">■</span>
                    </button>
                    <div className="med-recording-info">
                      <div className="med-pulse-dot" />
                      <span className="med-timer">{formatTime(recordingTime)}</span>
                      <span className="med-recording-label">Enregistrement...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <button className="med-record-btn" onClick={startRecording} disabled={isProcessing}>
                      <span className="med-record-icon">🎙</span>
                    </button>
                    <p className="med-record-hint">
                      {isProcessing ? "Traitement en cours..." : "Appuyez pour enregistrer"}
                    </p>
                  </>
                )}
              </div>

              <div className="med-divider"><span>ou</span></div>

              <label className="med-upload-label">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing || phase === "recording"}
                  className="med-upload-input"
                />
                <span className="med-upload-btn">📂 Importer un fichier audio</span>
              </label>
            </section>

            {/* Section 2: Transcription */}
            <section className="med-card">
              <div className="med-card-header">
                <span className="med-step">02</span>
                <h2>Transcription</h2>
                {phase === "transcribing" && (
                  <span className="med-badge processing">Transcription...</span>
                )}
              </div>

              {transcript ? (
                <textarea
                  className="med-textarea"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={6}
                  placeholder="La transcription apparaîtra ici..."
                />
              ) : (
                <div className="med-placeholder">
                  {phase === "transcribing" ? (
                    <div className="med-loader">
                      <div className="med-loader-bar" />
                      <p>Conversion de la parole en texte...</p>
                    </div>
                  ) : (
                    <p>La transcription apparaîtra ici après l'enregistrement.</p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Right Column ── */}
          <div className="med-col">

            {/* Section 3: Rapport IA */}
            <section className="med-card med-card-tall">
              <div className="med-card-header">
                <span className="med-step">03</span>
                <h2>Rapport Médical IA</h2>
                {phase === "generating" && (
                  <span className="med-badge processing">Génération...</span>
                )}
                {phase === "done" && (
                  <span className="med-badge done">Prêt</span>
                )}
              </div>

              {report ? (
                <textarea
                  className="med-textarea med-report-textarea"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  rows={18}
                />
              ) : (
                <div className="med-placeholder tall">
                  {phase === "generating" ? (
                    <div className="med-loader">
                      <div className="med-loader-bar" />
                      <p>Génération du rapport professionnel...</p>
                    </div>
                  ) : (
                    <>
                      <div className="med-placeholder-icon">📋</div>
                      <p>Votre rapport médical généré par IA apparaîtra ici.</p>
                      <p className="med-placeholder-sub">Enregistrez ou importez un audio pour commencer.</p>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Section 4: Actions */}
            {phase === "done" && (
              <section className="med-card">
                <div className="med-card-header">
                  <span className="med-step">04</span>
                  <h2>Exporter le Rapport</h2>
                </div>

                <div className="med-patient-field">
                  <label className="med-label">Nom du Patient</label>
                  <input
                    type="text"
                    className="med-input"
                    placeholder="Entrez le nom complet du patient..."
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                <div className="med-actions">
                  <button className="med-btn-green" onClick={exportPDF}>
                    📄 Exporter PDF
                  </button>
                  <button className="med-btn-outline" onClick={copyReport}>
                    📋 Copier le rapport
                  </button>
                  <button className="med-btn-danger" onClick={reset}>
                    🔄 Réinitialiser
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <footer className="med-footer">
        <span>MediVoice AI © {new Date().getFullYear()} — Propulsé par Groq</span>
      </footer>
    </div>
  );
}