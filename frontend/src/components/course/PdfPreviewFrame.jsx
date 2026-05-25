import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { buildApiUrl } from "../../services/api";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ pdfDocument, pageNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const renderPage = async () => {
      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled || !canvasRef.current) return;

      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      renderTask = page.render({ canvasContext: context, viewport });
      await renderTask.promise;
    };

    renderPage().catch(() => {});

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocument, pageNumber]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-lg shadow-black/10">
      <canvas ref={canvasRef} className="block h-auto w-full" />
    </div>
  );
}

export default function PdfPreviewFrame({ noteId, title, className = "" }) {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      setLoading(true);
      setError("");
      setPdfDocument(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(buildApiUrl(`/courses/notes/${noteId}/preview`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          let message = "Failed to load PDF preview.";
          try {
            const payload = await response.json();
            message = payload?.message || message;
          } catch {
            // ignore non-JSON error bodies
          }
          throw new Error(message);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const document = await getDocument({ data: arrayBuffer }).promise;
        if (active) setPdfDocument(document);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load PDF preview.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      active = false;
    };
  }, [noteId]);

  if (loading) {
    return (
      <div className={`flex min-h-56 items-center justify-center rounded-2xl border border-white/8 bg-white/2 ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={22} className="animate-spin text-brand-primary" />
          <p className="text-sm text-white/50">Loading PDF preview…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-56 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 text-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm font-medium text-red-300">{error}</p>
          <p className="text-xs text-white/40">{title || "PDF"}</p>
        </div>
      </div>
    );
  }

  if (!pdfDocument) {
    return null;
  }

  return (
    <div className={`h-full w-full overflow-y-auto bg-neutral-950 p-4 ${className}`}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {Array.from({ length: pdfDocument.numPages }, (_, index) => (
          <PdfPage key={`${noteId}-${index + 1}`} pdfDocument={pdfDocument} pageNumber={index + 1} />
        ))}
      </div>
    </div>
  );
}
