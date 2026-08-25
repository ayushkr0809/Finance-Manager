import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { downloadExport, importCsv } from "../api";

export default function ExportSection() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExport(type) {
    setError("");
    setLoading(type);
    try {
      if (type === "csv") await downloadExport("/export/csv", "export.csv");
      else await downloadExport("/export/pdf", "report.pdf");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setImportResult(null);
    setLoading("import");
    try {
      const result = await importCsv(file);
      setImportResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Take it with you, or bring it in</p>
      <h1 className="section-title">Data</h1>

      {error && <div className="error-banner">{error}</div>}
      {importResult && (
        <div className="alert-banner">
          Imported {importResult.imported} transaction{importResult.imported === 1 ? "" : "s"}
          {importResult.skipped > 0 ? `, skipped ${importResult.skipped} row(s) that didn't match the format.` : "."}
        </div>
      )}

      <div className="panel">
        <h3>
          <Download size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Export
        </h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 18 }}>
          Both files are generated fresh for you and never stored on the server.
        </p>
        <button className="btn btn-primary" onClick={() => handleExport("csv")} disabled={loading === "csv"}>
          {loading === "csv" ? "Preparing..." : "Download CSV"}
        </button>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: 10 }}
          onClick={() => handleExport("pdf")}
          disabled={loading === "pdf"}
        >
          {loading === "pdf" ? "Preparing..." : "Download PDF"}
        </button>
      </div>

      <div className="panel">
        <h3>
          <Upload size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Import
        </h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 18 }}>
          Upload a CSV with columns <code>Date, Type, Category, Amount, Notes</code> — the
          same shape the export above produces. Rows that don't match are skipped, not fatal.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          disabled={loading === "import"}
        />
        {loading === "import" && <p style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 10 }}>Importing...</p>}
      </div>
    </div>
  );
}
