import React, { useState } from "react";
import { uploadService } from "../services/uploadService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { safeFixed } from "../utils/formatters";
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle,
  FileCheck2,
  ListRestart,
  HelpCircle
} from "lucide-react";

export const ScoreUploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls") ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        setError("");
        setUploadResult(null);
      } else {
        setError("Unsupported file format. Please upload an Excel (.xlsx/.xls) or CSV file.");
        setFile(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a valid excel sheet first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await uploadService.uploadExcelScores(file);
      setUploadResult(data);
    } catch (err) {
      setError(err.message || "Failed to parse scores sheet. Please check the network or backend server.");
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setError("");
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Register No,Student Name,Assessment Name,Category,Score,Max Marks,Date\n717824I101,Aakash M,Mid Term 1,DSA,87,100,2026-07-11\n717824I102,Abinaya S,Mid Term 1,DBMS,91,100,2026-07-11\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_scores_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* Header */}
      <div className="border-b border-[#D1D5DB] pb-4">
        <h1 className="text-xl font-extrabold text-[#214C55] uppercase tracking-wider">Excel Score Ingestion Panel</h1>
        <p className="text-xs text-[#6B7280] font-semibold mt-1">
          Ingest new batches of academic results, hackathons, and lab assessments. Verify parsing outputs before saving.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dropzone Form (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-6">
          <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">File Ingestion</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#B91C1C] text-xs px-4 py-3 rounded-none flex items-center space-x-2 animate-fade-in font-bold uppercase tracking-wide">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!uploadResult && !loading ? (
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#C76F2B] rounded-none p-8 text-center transition-colors bg-[#F7F7F7] cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-white text-[#6B7280] rounded-none border border-[#D1D5DB]">
                    <FileSpreadsheet size={28} className="text-[#C76F2B]" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-xs font-black text-slate-800">{file.name}</p>
                       <p className="text-[10px] text-[#6B7280] mt-0.5">{safeFixed((file?.size || 0) / 1024, 1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Click to upload spreadsheet</p>
                      <p className="text-[10px] text-[#6B7280] mt-1">Supports .xlsx, .xls, and .csv formats</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons in KCE Orange */}
              {file && (
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none shadow-none flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Begin Ingestion & Verification</span>
                </button>
              )}
            </form>
          ) : loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Parsing schema columns and validating records..." />
            </div>
          ) : (
            /* Upload Report summary */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 text-[#15803D] bg-emerald-50 border border-emerald-250 px-4 py-3 rounded-none">
                <CheckCircle size={18} className="text-[#15803D]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Scores processed successfully. {uploadResult.analytics_recalculated ? "Student analytics recalculated." : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F7F7F7] rounded-none text-center border border-[#D1D5DB]">
                  <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider block">Total Rows</span>
                  <span className="text-xl font-black text-[#214C55] mt-1 block">{uploadResult.total_rows}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-none text-center border border-emerald-150">
                  <span className="text-[9px] font-extrabold text-[#15803D] uppercase tracking-wider block">Inserted</span>
                  <span className="text-xl font-black text-[#15803D] mt-1 block">{uploadResult.inserted ?? uploadResult.valid_rows}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-none text-center border border-blue-150">
                  <span className="text-[9px] font-extrabold text-[#1D4ED8] uppercase tracking-wider block">Students</span>
                  <span className="text-xl font-black text-[#1D4ED8] mt-1 block">{uploadResult.affected_students ?? 0}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-none text-center border border-red-150">
                  <span className="text-[9px] font-extrabold text-[#B91C1C] uppercase tracking-wider block">Skipped</span>
                  <span className="text-xl font-black text-[#B91C1C] mt-1 block">{uploadResult.error_rows ?? uploadResult.skipped ?? 0}</span>
                </div>
              </div>

              <div className="p-4 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none space-y-1.5">
                <span className="text-xs font-extrabold text-[#214C55] flex items-center space-x-1.5 uppercase tracking-wider">
                  <FileCheck2 size={14} className="text-[#C76F2B]" />
                  <span>Ingestion Status Report</span>
                </span>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">{uploadResult.status}</p>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-250 rounded-none space-y-2">
                  <span className="text-xs font-extrabold text-[#B91C1C] uppercase tracking-wider block">
                    Skipped/Error Records Log
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-red-100 text-[11px] font-bold">
                    {uploadResult.errors.map((err, i) => (
                      <div key={i} className="pt-1.5 flex justify-between gap-4">
                        <span className="text-red-700">Row {err.row}</span>
                        <span className="text-slate-700">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetUpload}
                className="w-full py-2 px-4 text-xs font-bold uppercase tracking-wider text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F7F7F7] transition-colors rounded-none shadow-none flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ListRestart size={14} />
                <span>Upload Another Sheet</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Schema/Format Guide (5 cols on lg) - Expected Excel format in bordered card */}
        <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
          <div className="flex items-center space-x-2 text-[#214C55] border-b border-[#E5E5E5] pb-3">
            <HelpCircle size={16} className="text-[#C76F2B]" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Ingestion Schema Guide</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-[#6B7280] leading-relaxed font-semibold">
              Please structure your Excel sheet columns in the exact order and names listed below to ensure verification passes.
            </p>

            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="w-full py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#C76F2B] bg-white border border-[#C76F2B] hover:bg-[#C76F2B] hover:text-white transition-colors rounded-none shadow-none flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Download Excel/CSV Template</span>
            </button>

            {/* Expected format visual list */}
            <div className="border border-[#D1D5DB] rounded-none overflow-hidden text-xs">
              <div className="bg-[#E5E5E5] px-4 py-2 border-b border-[#D1D5DB] font-extrabold text-[#214C55] uppercase tracking-wider">
                Expected Column Headers
              </div>
              <div className="divide-y divide-[#E5E5E5] font-bold text-[#111827]">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Register No</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">Text (e.g. 22AD001)</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Student Name</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">Text</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Assessment Name</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">Text</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Category</span>
                  <span className="px-1.5 py-0.5 bg-orange-50 text-[#C76F2B] border border-orange-200 text-[9px] rounded-none uppercase font-bold">DSA, DBMS...</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Score</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">Float (e.g. 85.5)</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Max Marks</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">Integer (e.g. 100)</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Date</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] rounded-none border border-[#D1D5DB] uppercase font-bold">YYYY-MM-DD</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3 rounded-none text-[11px] text-[#D97706] leading-relaxed font-bold flex items-start space-x-2">
              <AlertCircle size={14} className="flex-shrink-0 text-[#D97706] mt-0.5" />
              <span>
                <strong>Attention:</strong> Rows containing missing register numbers or scores exceeding max marks will be automatically skipped and detailed in skipped records log.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ScoreUploadPage;
