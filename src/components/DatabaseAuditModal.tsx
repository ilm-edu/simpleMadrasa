import React, { useState } from "react";
import { runFullAudit, AuditReport } from "../services/dbAuditService";
import { AlertCircle, CheckCircle, RefreshCw, X } from "lucide-react";

interface DatabaseAuditModalProps {
  onClose: () => void;
}

export default function DatabaseAuditModal({ onClose }: DatabaseAuditModalProps) {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const results = await runFullAudit();
      setReports(results);
    } catch (error) {
      console.error("Audit failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Database Audit Tool</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <button 
          onClick={handleRunAudit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-4"
        >
          {loading ? <RefreshCw className="animate-spin" /> : <AlertCircle />}
          {loading ? "Auditing..." : "Run Database Audit"}
        </button>

        {reports.length === 0 && !loading && <p>Click to start the audit.</p>}

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.institutionId} className="border p-4 rounded">
              <h3 className="font-bold">{report.institutionName}</h3>
              {report.duplicates.students.length > 0 && (
                <div>
                  <p className="text-red-500">Duplicate Students:</p>
                  <ul>
                    {report.duplicates.students.map(s => (
                      <li key={s.admissionNo}>{s.name} ({s.admissionNo}) - {s.count} copies</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
