import React, { useState, useEffect, useCallback } from "react";
import { uploadService } from "../../services/uploadService";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database
} from "lucide-react";

export const ManageScoresTable = ({ onScoreChange }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Checkbox Selection State
  const [selectedScoreIds, setSelectedScoreIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Filter States
  const [searchReg, setSearchReg] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Edit Modal State
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({
    assessment_name: "",
    category: "DSA",
    score: "",
    max_marks: "",
    date: ""
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deletingScore, setDeletingScore] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedScoreIds([]);
    try {
      const data = await uploadService.getScores({
        register_no: searchReg || undefined,
        category: categoryFilter || undefined,
        assessment_name: assessmentFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        limit
      });
      setScores(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load uploaded scores.");
    } finally {
      setLoading(false);
    }
  }, [searchReg, categoryFilter, assessmentFilter, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchScores();
  };

  const handleResetFilters = () => {
    setSearchReg("");
    setCategoryFilter("");
    setAssessmentFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSelectedScoreIds([]);
  };

  // Checkbox Selection Logic
  const isAllSelected = scores.length > 0 && scores.every((s) => selectedScoreIds.includes(s.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedScoreIds([]);
    } else {
      setSelectedScoreIds(scores.map((s) => s.id));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedScoreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (score) => {
    setEditingScore(score);
    setEditForm({
      assessment_name: score.assessment_name || "",
      category: score.category || "DSA",
      score: score.score !== undefined ? String(score.score) : "",
      max_marks: score.max_marks !== undefined ? String(score.max_marks) : "",
      date: score.date || ""
    });
    setEditError("");
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError("");

    const scoreNum = parseFloat(editForm.score);
    const maxNum = parseFloat(editForm.max_marks);

    if (isNaN(scoreNum) || scoreNum < 0) {
      setEditError("Score must be a non-negative number.");
      return;
    }
    if (isNaN(maxNum) || maxNum <= 0) {
      setEditError("Max Marks must be greater than zero.");
      return;
    }
    if (scoreNum > maxNum) {
      setEditError(`Score (${scoreNum}) cannot exceed Max Marks (${maxNum}).`);
      return;
    }

    setSaving(true);
    try {
      await uploadService.updateScore(editingScore.id, {
        assessment_name: editForm.assessment_name.trim(),
        category: editForm.category,
        score: scoreNum,
        max_marks: maxNum,
        date: editForm.date
      });
      setEditingScore(null);
      setSelectedScoreIds([]);
      setSuccessMessage("Score record updated successfully. Student analytics recalculated.");
      fetchScores();
      if (onScoreChange) onScoreChange();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setEditError(err.message || "Failed to update score record.");
    } finally {
      setSaving(false);
    }
  };

  // Single Delete
  const handleConfirmDelete = async () => {
    if (!deletingScore) return;
    setDeleting(true);
    try {
      await uploadService.deleteScore(deletingScore.id);
      setDeletingScore(null);
      setSelectedScoreIds([]);
      setSuccessMessage("Score record deleted successfully. Student analytics recalculated.");
      fetchScores();
      if (onScoreChange) onScoreChange();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete score record.");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedScoreIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await uploadService.deleteScoresBulk(selectedScoreIds);
      setShowBulkDeleteConfirm(false);
      setSelectedScoreIds([]);
      setSuccessMessage(res.message || `Successfully deleted ${selectedScoreIds.length} score record(s). Student analytics recalculated.`);
      fetchScores();
      if (onScoreChange) onScoreChange();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to bulk delete score records.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-5 animate-fade-in text-[#111827]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center space-x-2">
          <Database size={18} className="text-[#C76F2B]" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#214C55]">
            Manage Uploaded Assessment Scores
          </h3>
        </div>
        <button
          onClick={fetchScores}
          className="text-xs text-[#214C55] font-bold hover:text-[#C76F2B] flex items-center space-x-1 border border-[#D1D5DB] px-3 py-1 bg-[#F7F7F7] hover:bg-white transition-colors cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-250 text-[#15803D] text-xs px-4 py-3 rounded-none flex items-center space-x-2 animate-fade-in font-bold uppercase tracking-wider">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-[#B91C1C] text-xs px-4 py-3 rounded-none flex items-center space-x-2 animate-fade-in font-bold uppercase tracking-wider">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
            Search Student / Reg No
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              placeholder="e.g. 717824I107 or Name"
              className="w-full text-xs p-2 pl-7 border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B]"
            />
            <Search size={12} className="absolute left-2.5 top-3 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
            Category / Domain
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs p-2 border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] bg-white font-semibold"
          >
            <option value="">All Categories</option>
            <option value="DSA">DSA</option>
            <option value="DBMS">DBMS</option>
            <option value="FullStack">FullStack</option>
            <option value="Aptitude">Aptitude</option>
            <option value="Coding">Coding</option>
            <option value="Academic">Academic</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
            Assessment Name
          </label>
          <input
            type="text"
            value={assessmentFilter}
            onChange={(e) => setAssessmentFilter(e.target.value)}
            placeholder="e.g. Mid Term 1"
            className="w-full text-xs p-2 border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B]"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs p-2 border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B]"
          />
        </div>

        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-2 border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B]"
            />
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="p-2 text-xs font-bold text-[#6B7280] bg-[#F7F7F7] border border-[#D1D5DB] hover:bg-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
            title="Reset Filters"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Bulk Action Bar */}
      {selectedScoreIds.length > 0 && (
        <div className="bg-[#214C55]/10 border border-[#214C55] p-3 rounded-none flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#214C55] animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="bg-[#214C55] text-white px-2 py-0.5 text-[11px] font-black">
              {selectedScoreIds.length}
            </span>
            <span>score record(s) selected</span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedScoreIds.length === 1 && (
              <button
                type="button"
                onClick={() => {
                  const targetScore = scores.find((s) => s.id === selectedScoreIds[0]);
                  if (targetScore) handleOpenEdit(targetScore);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 border border-blue-700 cursor-pointer shadow-sm"
              >
                <Edit2 size={13} />
                <span>Edit Selected</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-1.5 bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 border border-red-800 cursor-pointer shadow-sm"
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedScoreIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScoreIds([])}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider border border-[#D1D5DB] cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Scores Table */}
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="md" text="Loading score records..." />
        </div>
      ) : scores.length === 0 ? (
        <div className="p-8 text-center bg-[#F7F7F7] border border-[#D1D5DB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          No assessment scores found matching criteria.
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#D1D5DB]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#214C55] text-white font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5 border-b border-[#D1D5DB] w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 accent-[#C76F2B] cursor-pointer"
                    title="Select All Visible Rows"
                  />
                </th>
                <th className="p-2.5 border-b border-[#D1D5DB]">Register No</th>
                <th className="p-2.5 border-b border-[#D1D5DB]">Student Name</th>
                <th className="p-2.5 border-b border-[#D1D5DB]">Assessment</th>
                <th className="p-2.5 border-b border-[#D1D5DB]">Category</th>
                <th className="p-2.5 border-b border-[#D1D5DB] text-right">Score</th>
                <th className="p-2.5 border-b border-[#D1D5DB] text-right">Max Marks</th>
                <th className="p-2.5 border-b border-[#D1D5DB] text-right">%</th>
                <th className="p-2.5 border-b border-[#D1D5DB]">Date</th>
                <th className="p-2.5 border-b border-[#D1D5DB] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] font-semibold text-slate-800">
              {scores.map((row) => {
                const isSelected = selectedScoreIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${isSelected ? "bg-amber-50/70" : "hover:bg-[#F7F7F7]"}`}
                  >
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-3.5 h-3.5 accent-[#C76F2B] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 font-mono text-[#214C55] font-bold">{row.register_no}</td>
                    <td className="p-2.5">{row.student_name}</td>
                    <td className="p-2.5 text-slate-700">{row.assessment_name}</td>
                    <td className="p-2.5">
                      <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 border border-slate-300 text-slate-800">
                        {row.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-900">{row.score}</td>
                    <td className="p-2.5 text-right text-slate-600">{row.max_marks}</td>
                    <td className="p-2.5 text-right font-black text-[#C76F2B]">{row.percentage}%</td>
                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">{row.date}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                          title="Edit Score"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingScore(row)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                          title="Delete Score"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#E5E5E5] pt-3 font-semibold text-[#6B7280]">
        <span>
          Showing {scores.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total} records
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 border border-[#D1D5DB] bg-white disabled:opacity-40 hover:bg-[#F7F7F7] cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#214C55]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="p-1.5 border border-[#D1D5DB] bg-white disabled:opacity-40 hover:bg-[#F7F7F7] cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingScore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#D1D5DB] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#214C55]">
                Edit Score Record
              </h4>
              <button onClick={() => setEditingScore(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-[#B91C1C] text-xs px-3 py-2 flex items-center space-x-2 font-bold uppercase tracking-wider">
                <AlertCircle size={14} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                  Student Details
                </label>
                <div className="p-2 bg-[#F7F7F7] border border-[#D1D5DB] text-xs font-bold text-slate-800">
                  {editingScore.student_name} ({editingScore.register_no})
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                  Assessment Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.assessment_name}
                  onChange={(e) => setEditForm({ ...editForm, assessment_name: e.target.value })}
                  className="w-full text-xs p-2 border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B] font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                  Category / Domain
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full text-xs p-2 border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B] font-bold bg-white"
                >
                  <option value="DSA">DSA</option>
                  <option value="DBMS">DBMS</option>
                  <option value="FullStack">FullStack</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Coding">Coding</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.score}
                    onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                    className="w-full text-xs p-2 border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.max_marks}
                    onChange={(e) => setEditForm({ ...editForm, max_marks: e.target.value })}
                    className="w-full text-xs p-2 border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block mb-1">
                  Assessment Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full text-xs p-2 border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B] font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setEditingScore(null)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-[#D1D5DB] hover:bg-[#F7F7F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deletingScore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#D1D5DB] w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-[#B91C1C]">
              <AlertCircle size={20} />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">Confirm Deletion</h4>
            </div>

            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Are you sure you want to delete this score record for{" "}
              <strong className="text-slate-900">{deletingScore.student_name}</strong> (
              <span className="font-mono">{deletingScore.register_no}</span>)?
            </p>

            <div className="p-2 bg-[#F7F7F7] border border-[#D1D5DB] text-[11px] space-y-1 font-mono text-slate-700">
              <div>Assessment: {deletingScore.assessment_name}</div>
              <div>
                Category: {deletingScore.category} | Score: {deletingScore.score}/{deletingScore.max_marks}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={() => setDeletingScore(null)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-[#D1D5DB] hover:bg-[#F7F7F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#B91C1C] hover:bg-red-800 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Score"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#D1D5DB] w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-[#B91C1C]">
              <AlertCircle size={20} />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">Confirm Bulk Deletion</h4>
            </div>

            <p className="text-xs text-[#111827] font-semibold leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{selectedScoreIds.length}</strong> selected score record(s)?
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Student analytics and leaderboard ranks will be recalculated automatically after deletion.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-[#D1D5DB] hover:bg-[#F7F7F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#B91C1C] hover:bg-red-800 disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting..." : `Delete ${selectedScoreIds.length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
