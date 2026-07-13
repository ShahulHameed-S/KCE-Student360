import React, { useState } from "react";
import { X, UserPlus, UserMinus, UserCog, Eye, Edit2, Trash2 } from "lucide-react";
import mockUsers from "../../data/mockUsers";
import { mockStudents } from "../../data/mockStudents";
import { adminUploadService } from "../../services/adminUploadService";

// Reusable Modal Wrapper
const Modal = ({ isOpen, onClose, title, maxWidth = "max-w-4xl", children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`bg-white border border-[#D1D5DB] shadow-2xl w-full ${maxWidth} max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5] bg-[#163941] text-white shrink-0">
          <h2 className="text-sm font-extrabold uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="hover:text-orange-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {children}
        </div>
      </div>
    </div>
  );
};

// ====================================================
// 1. MANAGE STUDENTS MODAL (DIRECTORY)
// ====================================================
export const ManageStudentsModal = ({ 
  isOpen, 
  onClose, 
  students, 
  onAddStudentClick, 
  onRemoveStudentClick, 
  onViewStudentClick, 
  onEditStudentClick, 
  onConfirmRemoveClick 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Students" maxWidth="max-w-6xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
          <div>
            <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Students Directory</h3>
            <p className="text-[11px] text-[#6B7280]">Manage enrollment status, student profiles, and portal access.</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onAddStudentClick} 
              className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={14} />
              Add Student
            </button>
            <button 
              onClick={onRemoveStudentClick} 
              className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserMinus size={14} />
              Remove Student (Bulk)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D1D5DB]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Year</th>
                <th className="py-3 px-4 text-center">Section</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-[#F7F7F7] transition-colors">
                  <td className="py-2.5 px-4 text-[#C76F2B]">{s.register_no}</td>
                  <td className="py-2.5 px-4 text-[#214C55]">{s.name}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{s.department}</td>
                  <td className="py-2.5 px-4 text-center">{s.year}</td>
                  <td className="py-2.5 px-4 text-center">{s.section}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                      s.status === "Inactive" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {s.status || "Active"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center space-x-1.5">
                      <button 
                        onClick={() => onViewStudentClick(s)} 
                        title="View Details"
                        className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center animate-fade-in"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => onEditStudentClick(s)} 
                        title="Edit Student"
                        className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => onConfirmRemoveClick(s)} 
                        title="Remove/Deactivate Student"
                        className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// A. ADD STUDENT MODAL
// ====================================================
export const AddStudentModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    register_no: "",
    name: "",
    email: "",
    department: "",
    year: "3",
    section: "A",
    phone: "",
    assigned_mentor: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: String(Date.now()),
      status: "Active",
      overall_score: 80,
      strongest_domain: "DSA",
      weakest_domain: "Aptitude",
      domain_scores: { DSA: 80, DBMS: 80, FullStack: 80, Aptitude: 80, Coding: 80, Academic: 80, Technical: 80 }
    });
    setSuccess("Student added successfully!");
    setTimeout(() => {
      setSuccess("");
      setFormData({
        register_no: "",
        name: "",
        email: "",
        department: "",
        year: "3",
        section: "A",
        phone: "",
        assigned_mentor: ""
      });
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Student" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Register Number</label>
          <input 
            required 
            value={formData.register_no} 
            onChange={(e) => setFormData({...formData, register_no: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Student Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            placeholder="e.g. Computer Science & Engineering"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Year</label>
            <select 
              value={formData.year} 
              onChange={(e) => setFormData({...formData, year: e.target.value})} 
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Section</label>
            <input 
              required 
              value={formData.section} 
              onChange={(e) => setFormData({...formData, section: e.target.value})} 
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
          <input 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Mentor</label>
          <input 
            value={formData.assigned_mentor} 
            onChange={(e) => setFormData({...formData, assigned_mentor: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5] shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Student
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// B. VIEW STUDENT DETAILS MODAL
// ====================================================
export const ViewStudentModal = ({ isOpen, onClose, student, onEditClick }) => {
  if (!student) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="border border-[#D1D5DB] divide-y divide-[#E5E5E5]">
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Register Number</span>
            <span className="font-black text-[#C76F2B]">{student.register_no}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Full Name</span>
            <span className="font-bold">{student.name}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Email</span>
            <span className="font-semibold text-slate-600">{student.email || "N/A"}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Department</span>
            <span className="font-semibold text-slate-600">{student.department}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Academic Year</span>
            <span className="font-bold">Year {student.year}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Section</span>
            <span className="font-bold">Section {student.section}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Phone</span>
            <span className="font-semibold">{student.phone || "N/A"}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Status</span>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
              student.status === "Inactive" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {student.status || "Active"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Close
          </button>
          <button 
            type="button" 
            onClick={() => onEditClick(student)} 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Edit Student
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// C. EDIT STUDENT MODAL
// ====================================================
export const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    register_no: "",
    name: "",
    email: "",
    department: "",
    year: "3",
    section: "A",
    phone: "",
    status: "Active"
  });
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (student) {
      setFormData({
        register_no: student.register_no || "",
        name: student.name || "",
        email: student.email || "",
        department: student.department || "",
        year: String(student.year || "3"),
        section: student.section || "A",
        phone: student.phone || "",
        status: student.status || "Active"
      });
    }
  }, [student]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...student,
      ...formData,
      year: Number(formData.year)
    });
    setSuccess("Student updated successfully!");
    setTimeout(() => {
      setSuccess("");
      onClose();
    }, 1500);
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Student" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Register Number</label>
          <input 
            required 
            value={formData.register_no} 
            onChange={(e) => setFormData({...formData, register_no: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-gray-50" 
            disabled
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Student Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Year</label>
            <select 
              value={formData.year} 
              onChange={(e) => setFormData({...formData, year: e.target.value})} 
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Section</label>
            <input 
              required 
              value={formData.section} 
              onChange={(e) => setFormData({...formData, section: e.target.value})} 
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
          <input 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Status</label>
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// D. CONFIRM REMOVE STUDENT MODAL
// ====================================================
export const ConfirmRemoveStudentModal = ({ isOpen, onClose, student, onRemove }) => {
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRemove(student.id, reason);
    setSuccess("Student removed successfully");
    setTimeout(() => {
      setSuccess("");
      setReason("");
      onClose();
    }, 1500);
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Remove Student" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-none">
          <p className="font-extrabold text-sm mb-1 uppercase tracking-wide">Warning Action Required</p>
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to remove/deactivate student <strong>{student.name}</strong> (Register No: <strong>{student.register_no}</strong>)?
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal/deactivation</label>
          <textarea 
            required 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            rows="3"
            placeholder="Please enter a valid audit log reason..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Student
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// E. REMOVE STUDENT MODAL (BULK/SEARCH STYLE)
// ====================================================
export const RemoveStudentModal = ({ isOpen, onClose, onRemove }) => {
  const [formData, setFormData] = useState({
    searchQuery: "",
    selectedStudentId: "",
    reason: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(formData.selectedStudentId, formData.reason);
    }
    setSuccess("Student successfully removed!");
    setTimeout(() => {
      setSuccess("");
      setFormData({ searchQuery: "", selectedStudentId: "", reason: "" });
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Student" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Search Student by Register Number / Name</label>
          <input 
            value={formData.searchQuery}
            onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            placeholder="Search..." 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Student</label>
          <select 
            required 
            value={formData.selectedStudentId}
            onChange={(e) => setFormData({...formData, selectedStudentId: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none bg-white"
          >
            <option value="">Select Student</option>
            {mockStudents
              .filter(s => s.name.toLowerCase().includes(formData.searchQuery.toLowerCase()) || s.register_no.includes(formData.searchQuery))
              .map(s => (
                <option key={s.id} value={s.id}>{s.register_no} - {s.name} ({s.department})</option>
              ))
            }
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal</label>
          <textarea 
            required 
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            rows="3"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Student
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// 2. MANAGE FACULTY MODAL (DIRECTORY)
// ====================================================
export const ManageFacultyModal = ({ 
  isOpen, 
  onClose, 
  faculty, 
  onAddFacultyClick, 
  onRemoveFacultyClick, 
  onViewFacultyClick, 
  onEditFacultyClick, 
  onConfirmRemoveClick 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Faculty" maxWidth="max-w-6xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
          <div>
            <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Faculty Directory</h3>
            <p className="text-[11px] text-[#6B7280]">Manage faculty roles, assignments, and departmental listings.</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onAddFacultyClick} 
              className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={14} />
              Add Faculty
            </button>
            <button 
              onClick={onRemoveFacultyClick} 
              className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserMinus size={14} />
              Remove Faculty (Bulk)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D1D5DB]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
              {faculty.map((f) => (
                <tr key={f.id} className="hover:bg-[#F7F7F7] transition-colors">
                  <td className="py-2.5 px-4 text-[#214C55]">{f.name}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{f.email}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{f.department}</td>
                  <td className="py-2.5 px-4 uppercase text-[10px] text-[#C76F2B] font-extrabold">{f.role}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                      f.status === "Inactive" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {f.status || "Active"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center space-x-1.5">
                      <button 
                        onClick={() => onViewFacultyClick(f)} 
                        title="View Details"
                        className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => onEditFacultyClick(f)} 
                        title="Edit Faculty"
                        className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => onConfirmRemoveClick(f)} 
                        title="Remove/Deactivate Faculty"
                        className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// F. ADD FACULTY MODAL
// ====================================================
export const AddFacultyModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "faculty",
    phone: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: String(Date.now()),
      status: "Active"
    });
    setSuccess("Faculty successfully added!");
    setTimeout(() => {
      setSuccess("");
      setFormData({ name: "", email: "", department: "", role: "faculty", phone: "" });
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Faculty" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Faculty Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Faculty Role</label>
          <select 
            value={formData.role} 
            onChange={(e) => setFormData({...formData, role: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="faculty">Faculty</option>
            <option value="class_mentor">Class Mentor</option>
            <option value="placement_mentor">Placement Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
          <input 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Faculty
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// G. VIEW FACULTY DETAILS MODAL
// ====================================================
export const ViewFacultyModal = ({ isOpen, onClose, faculty, onEditClick }) => {
  if (!faculty) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Faculty Details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="border border-[#D1D5DB] divide-y divide-[#E5E5E5]">
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Full Name</span>
            <span className="font-bold text-[#214C55]">{faculty.name}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Email</span>
            <span className="font-semibold text-slate-600">{faculty.email}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Department</span>
            <span className="font-semibold text-slate-600">{faculty.department}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Role</span>
            <span className="font-bold text-[#C76F2B] uppercase">{faculty.role}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Phone</span>
            <span className="font-semibold">{faculty.phone || "N/A"}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Status</span>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
              faculty.status === "Inactive" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {faculty.status || "Active"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Close
          </button>
          <button 
            type="button" 
            onClick={() => onEditClick(faculty)} 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Edit Faculty
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// H. EDIT FACULTY MODAL
// ====================================================
export const EditFacultyModal = ({ isOpen, onClose, faculty, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "faculty",
    phone: "",
    status: "Active"
  });
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.name || "",
        email: faculty.email || "",
        department: faculty.department || "",
        role: faculty.role || "faculty",
        phone: faculty.phone || "",
        status: faculty.status || "Active"
      });
    }
  }, [faculty]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...faculty,
      ...formData
    });
    setSuccess("Faculty updated successfully!");
    setTimeout(() => {
      setSuccess("");
      onClose();
    }, 1500);
  };

  if (!faculty) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Faculty" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Faculty Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Faculty Role</label>
          <select 
            value={formData.role} 
            onChange={(e) => setFormData({...formData, role: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="faculty">Faculty</option>
            <option value="class_mentor">Class Mentor</option>
            <option value="placement_mentor">Placement Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
          <input 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Status</label>
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// I. CONFIRM REMOVE FACULTY MODAL
// ====================================================
export const ConfirmRemoveFacultyModal = ({ isOpen, onClose, faculty, onRemove }) => {
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRemove(faculty.id, reason);
    setSuccess("Faculty removed successfully");
    setTimeout(() => {
      setSuccess("");
      setReason("");
      onClose();
    }, 1500);
  };

  if (!faculty) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Remove Faculty" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-none">
          <p className="font-extrabold text-sm mb-1 uppercase tracking-wide">Warning Action Required</p>
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to remove/deactivate faculty <strong>{faculty.name}</strong> ({faculty.email})?
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal/deactivation</label>
          <textarea 
            required 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            rows="3"
            placeholder="Audit log reason..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Faculty
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// J. REMOVE FACULTY MODAL (BULK/SEARCH STYLE)
// ====================================================
export const RemoveFacultyModal = ({ isOpen, onClose, onRemove }) => {
  const [formData, setFormData] = useState({
    searchQuery: "",
    selectedFacultyId: "",
    reason: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(formData.selectedFacultyId, formData.reason);
    }
    setSuccess("Faculty successfully removed!");
    setTimeout(() => {
      setSuccess("");
      setFormData({ searchQuery: "", selectedFacultyId: "", reason: "" });
      onClose();
    }, 1500);
  };

  const facultiesList = mockUsers.filter(u => u.role === 'faculty');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Faculty" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Search Faculty by Name / Email</label>
          <input 
            value={formData.searchQuery}
            onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            placeholder="Search..." 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Faculty</label>
          <select 
            required 
            value={formData.selectedFacultyId}
            onChange={(e) => setFormData({...formData, selectedFacultyId: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none bg-white"
          >
            <option value="">Select Faculty</option>
            {facultiesList
              .filter(f => f.name.toLowerCase().includes(formData.searchQuery.toLowerCase()) || f.email.toLowerCase().includes(formData.searchQuery.toLowerCase()))
              .map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
              ))
            }
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal</label>
          <textarea 
            required 
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            rows="3"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Faculty
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// 3. MANAGE MENTORS MODAL (DIRECTORY)
// ====================================================
export const ManageMentorsModal = ({ 
  isOpen, 
  onClose, 
  mentors, 
  onAddMentorClick, 
  onRemoveMentorClick, 
  onViewMentorClick, 
  onEditMentorClick, 
  onConfirmRemoveClick 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Mentors" maxWidth="max-w-6xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
          <div>
            <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Mentors Directory</h3>
            <p className="text-[11px] text-[#6B7280]">Manage student mentors, mentor types, and assigned classes.</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onAddMentorClick} 
              className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={14} />
              Add Mentor
            </button>
            <button 
              onClick={onRemoveMentorClick} 
              className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <UserMinus size={14} />
              Remove Mentor (Bulk)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D1D5DB]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Mentor Type</th>
                <th className="py-3 px-4">Assigned Class</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
              {mentors.map((m) => (
                <tr key={m.id} className="hover:bg-[#F7F7F7] transition-colors">
                  <td className="py-2.5 px-4 text-[#214C55]">{m.name}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{m.email}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{m.department}</td>
                  <td className="py-2.5 px-4">{m.mentorType || "Class Mentor"}</td>
                  <td className="py-2.5 px-4 font-black text-[#C76F2B]">{m.assignedClass || "None"}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                      m.status === "Inactive" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {m.status || "Active"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center space-x-1.5">
                      <button 
                        onClick={() => onViewMentorClick(m)} 
                        title="View Details"
                        className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => onEditMentorClick(m)} 
                        title="Edit Mentor"
                        className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => onConfirmRemoveClick(m)} 
                        title="Remove/Deactivate Mentor"
                        className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// K. ADD MENTOR MODAL
// ====================================================
export const AddMentorModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    mentorType: "Class Mentor",
    assignedClass: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: String(Date.now()),
      role: "mentor",
      status: "Active"
    });
    setSuccess("Mentor successfully added!");
    setTimeout(() => {
      setSuccess("");
      setFormData({ name: "", email: "", department: "", mentorType: "Class Mentor", assignedClass: "" });
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Mentor" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Mentor Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Mentor Type</label>
          <select 
            value={formData.mentorType} 
            onChange={(e) => setFormData({...formData, mentorType: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Class Mentor">Class Mentor</option>
            <option value="Placement Mentor">Placement Mentor</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Class</label>
          <input 
            value={formData.assignedClass} 
            onChange={(e) => setFormData({...formData, assignedClass: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            placeholder="e.g. IT-III-A"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Mentor
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// L. VIEW MENTOR DETAILS MODAL
// ====================================================
export const ViewMentorModal = ({ isOpen, onClose, mentor, onEditClick }) => {
  if (!mentor) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mentor Details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="border border-[#D1D5DB] divide-y divide-[#E5E5E5]">
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Full Name</span>
            <span className="font-bold text-[#214C55]">{mentor.name}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Email</span>
            <span className="font-semibold text-slate-600">{mentor.email}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Department</span>
            <span className="font-semibold text-slate-600">{mentor.department}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Mentor Type</span>
            <span className="font-bold text-[#C76F2B]">{mentor.mentorType || "Class Mentor"}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Assigned Class</span>
            <span className="font-bold text-[#214C55]">{mentor.assignedClass || "None"}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Status</span>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
              mentor.status === "Inactive" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {mentor.status || "Active"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Close
          </button>
          <button 
            type="button" 
            onClick={() => onEditClick(mentor)} 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Edit Mentor
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// M. EDIT MENTOR MODAL
// ====================================================
export const EditMentorModal = ({ isOpen, onClose, mentor, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    mentorType: "Class Mentor",
    assignedClass: "",
    status: "Active"
  });
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (mentor) {
      setFormData({
        name: mentor.name || "",
        email: mentor.email || "",
        department: mentor.department || "",
        mentorType: mentor.mentorType || "Class Mentor",
        assignedClass: mentor.assignedClass || "",
        status: mentor.status || "Active"
      });
    }
  }, [mentor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...mentor,
      ...formData
    });
    setSuccess("Mentor updated successfully!");
    setTimeout(() => {
      setSuccess("");
      onClose();
    }, 1500);
  };

  if (!mentor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Mentor" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Mentor Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Mentor Type</label>
          <select 
            value={formData.mentorType} 
            onChange={(e) => setFormData({...formData, mentorType: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Class Mentor">Class Mentor</option>
            <option value="Placement Mentor">Placement Mentor</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Class</label>
          <input 
            value={formData.assignedClass} 
            onChange={(e) => setFormData({...formData, assignedClass: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Status</label>
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// N. CONFIRM REMOVE MENTOR MODAL
// ====================================================
export const ConfirmRemoveMentorModal = ({ isOpen, onClose, mentor, onRemove }) => {
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRemove(mentor.id, reason);
    setSuccess("Mentor removed successfully");
    setTimeout(() => {
      setSuccess("");
      setReason("");
      onClose();
    }, 1500);
  };

  if (!mentor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Remove Mentor" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-none">
          <p className="font-extrabold text-sm mb-1 uppercase tracking-wide">Warning Action Required</p>
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to remove/deactivate mentor <strong>{mentor.name}</strong> ({mentor.email})?
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal/deactivation</label>
          <textarea 
            required 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-600 rounded-none" 
            rows="3"
            placeholder="Audit log reason..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Mentor
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// O. REMOVE MENTOR MODAL (BULK/SEARCH STYLE)
// ====================================================
export const RemoveMentorModal = ({ isOpen, onClose, onRemove }) => {
  const [formData, setFormData] = useState({
    searchQuery: "",
    selectedMentorId: "",
    reason: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(formData.selectedMentorId, formData.reason);
    }
    setSuccess("Mentor successfully removed!");
    setTimeout(() => {
      setSuccess("");
      setFormData({ searchQuery: "", selectedMentorId: "", reason: "" });
      onClose();
    }, 1500);
  };

  const mentorsList = mockUsers.filter(u => u.role === 'mentor');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Mentor" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Search Mentor by Name / Email</label>
          <input 
            value={formData.searchQuery}
            onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-655 rounded-none" 
            placeholder="Search..." 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Mentor</label>
          <select 
            required 
            value={formData.selectedMentorId}
            onChange={(e) => setFormData({...formData, selectedMentorId: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-655 rounded-none bg-white"
          >
            <option value="">Select Mentor</option>
            {mentorsList
              .filter(m => m.name.toLowerCase().includes(formData.searchQuery.toLowerCase()) || m.email.toLowerCase().includes(formData.searchQuery.toLowerCase()))
              .map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
              ))
            }
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal</label>
          <textarea 
            required 
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-655 rounded-none" 
            rows="3"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove Mentor
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// 4. ASSIGN MENTOR MODAL
// ====================================================
export const AssignMentorModal = ({ isOpen, onClose, mentors, onAssign }) => {
  const [formData, setFormData] = useState({
    mentorId: "",
    department: "",
    year: "3",
    section: "A",
    assignEntireClass: false,
    selectedStudents: ""
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(formData);
    setSuccess("Mentor assigned successfully");
    setTimeout(() => {
      setSuccess("");
      setFormData({
        mentorId: "",
        department: "",
        year: "3",
        section: "A",
        assignEntireClass: false,
        selectedStudents: ""
      });
      onClose();
    }, 1500);
  };

  const mentorList = mentors || mockUsers.filter(u => u.role === 'mentor');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Mentor" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Mentor</label>
          <select 
            required 
            value={formData.mentorId}
            onChange={(e) => setFormData({...formData, mentorId: e.target.value})}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="">Choose Mentor</option>
            {mentorList.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
            <input 
              required 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
              placeholder="e.g. IT"
            />
          </div>
          <div className="w-1/4">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Year</label>
            <input 
              required 
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            />
          </div>
          <div className="w-1/4">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Section</label>
            <input 
              required 
              value={formData.section}
              onChange={(e) => setFormData({...formData, section: e.target.value})}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
            />
          </div>
        </div>
        <div>
          <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.assignEntireClass}
              onChange={(e) => setFormData({...formData, assignEntireClass: e.target.checked})}
              className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4" 
            />
            <span className="uppercase text-[10px] tracking-wide">Assign Entire Class</span>
          </label>
        </div>
        {!formData.assignEntireClass && (
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Students (Register Numbers)</label>
            <input 
              required={!formData.assignEntireClass}
              value={formData.selectedStudents}
              onChange={(e) => setFormData({...formData, selectedStudents: e.target.value})}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
              placeholder="e.g. 22AD001, 22AD002..."
            />
          </div>
        )}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Assign Mentor
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// 5. MANAGE USERS MODAL (DIRECTORY)
// ====================================================
export const ManageUsersModal = ({ 
  isOpen, 
  onClose, 
  users, 
  onViewUserClick, 
  onEditUserClick, 
  onToggleStatus, 
  onConfirmRemoveClick 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Users" maxWidth="max-w-6xl">
      <div className="space-y-4">
        <div className="border-b border-[#E5E5E5] pb-3">
          <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">User Roles & Accounts</h3>
          <p className="text-[11px] text-[#6B7280]">Inspect user accounts, assign roles, and activate/deactivate accounts.</p>
        </div>

        <div className="overflow-x-auto border border-[#D1D5DB]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F7F7F7] transition-colors">
                  <td className="py-2.5 px-4 text-[#214C55]">{u.name}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-4 uppercase text-[10px] text-[#C76F2B] font-extrabold">{u.role}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">{u.department}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                      u.status === "Inactive" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {u.status || "Active"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center space-x-1.5 animate-fade-in">
                      <button 
                        onClick={() => onViewUserClick(u)} 
                        title="View Details"
                        className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => onEditUserClick(u)} 
                        title="Edit User"
                        className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => onToggleStatus(u.id)} 
                        className={`px-2 py-1 text-[10px] font-extrabold border transition-all ${
                          u.status === "Inactive"
                            ? "border-green-300 text-green-700 hover:bg-green-50"
                            : "border-orange-300 text-orange-700 hover:bg-orange-50"
                        }`}
                      >
                        {u.status === "Inactive" ? "Activate" : "Deactivate"}
                      </button>
                      <button 
                        onClick={() => onConfirmRemoveClick(u)} 
                        title="Remove User"
                        className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// P. VIEW USER DETAILS MODAL
// ====================================================
export const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="border border-[#D1D5DB] divide-y divide-[#E5E5E5]">
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Full Name</span>
            <span className="font-bold text-[#214C55]">{user.name}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Email</span>
            <span className="font-semibold text-slate-600">{user.email}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="font-extrabold text-[#214C55] uppercase">Department</span>
            <span className="font-semibold text-slate-600">{user.department}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">System Role</span>
            <span className="font-bold text-[#C76F2B] uppercase">{user.role}</span>
          </div>
          <div className="p-3 flex justify-between bg-[#F7F7F7]">
            <span className="font-extrabold text-[#214C55] uppercase">Status</span>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
              user.status === "Inactive" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {user.status || "Active"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// Q. EDIT USER MODAL
// ====================================================
export const EditUserModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "student",
    status: "Active"
  });
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        role: user.role || "student",
        status: user.status || "Active"
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...user,
      ...formData
    });
    setSuccess("User updated successfully!");
    setTimeout(() => {
      setSuccess("");
      onClose();
    }, 1500);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">User Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
          <input 
            required 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
          <input 
            required 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">User Role</label>
          <select 
            value={formData.role} 
            onChange={(e) => setFormData({...formData, role: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="mentor">Mentor</option>
            <option value="placement_mentor">Placement Mentor</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Status</label>
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// R. CONFIRM REMOVE USER MODAL
// ====================================================
export const ConfirmRemoveUserModal = ({ isOpen, onClose, user, onRemove }) => {
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRemove(user.id, reason);
    setSuccess("User removed successfully");
    setTimeout(() => {
      setSuccess("");
      setReason("");
      onClose();
    }, 1500);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Remove User" maxWidth="max-w-md">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-none">
          <p className="font-extrabold text-sm mb-1 uppercase tracking-wide">Warning Action Required</p>
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to remove user <strong>{user.name}</strong> ({user.email})?
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#214C55]">Reason for removal</label>
          <textarea 
            required 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-red-650 rounded-none" 
            rows="3"
            placeholder="Audit log reason..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase transition-colors rounded-none"
          >
            Remove User
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ====================================================
// 6. SYSTEM OVERVIEW MODAL
// ====================================================
export const SystemOverviewModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="System Overview" maxWidth="max-w-5xl">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border border-[#D1D5DB] p-4 text-center bg-[#F7F7F7]">
            <span className="block text-[9px] font-black uppercase text-[#6B7280]">Total Students</span>
            <span className="text-xl font-extrabold text-[#214C55]">45</span>
          </div>
          <div className="border border-[#D1D5DB] p-4 text-center bg-[#F7F7F7]">
            <span className="block text-[9px] font-black uppercase text-[#6B7280]">Total Faculty</span>
            <span className="text-xl font-extrabold text-[#214C55]">8</span>
          </div>
          <div className="border border-[#D1D5DB] p-4 text-center bg-[#F7F7F7]">
            <span className="block text-[9px] font-black uppercase text-[#6B7280]">Total Mentors</span>
            <span className="text-xl font-extrabold text-[#214C55]">12</span>
          </div>
          <div className="border border-[#D1D5DB] p-4 text-center bg-[#F7F7F7]">
            <span className="block text-[9px] font-black uppercase text-[#6B7280]">Uploaded Scores</span>
            <span className="text-xl font-extrabold text-[#214C55]">142</span>
          </div>
          <div className="border border-[#D1D5DB] p-4 text-center bg-green-50 border-green-200">
            <span className="block text-[9px] font-black uppercase text-green-700">System Status</span>
            <span className="text-sm font-extrabold text-green-800">ONLINE</span>
          </div>
        </div>

        {/* Department Analytics */}
        <div className="bg-white p-4 border border-[#D1D5DB]">
          <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider mb-2">Department Analytics</h3>
          <table className="w-full text-left border-collapse bg-white text-xs">
            <thead>
              <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Enrollment</th>
                <th className="py-2.5 px-3 text-center">Score Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#111827] font-bold">
              <tr>
                <td className="py-2.5 px-3">Artificial Intelligence & Data Science</td>
                <td className="py-2.5 px-3 text-center">45</td>
                <td className="py-2.5 px-3 text-center">88.5%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Information Technology</td>
                <td className="py-2.5 px-3 text-center">60</td>
                <td className="py-2.5 px-3 text-center">82.1%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-[#214C55]">Computer Science & Engineering</td>
                <td className="py-2.5 px-3 text-center">120</td>
                <td className="py-2.5 px-3 text-center">84.6%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-[#214C55]">Electronics & Communication Engineering</td>
                <td className="py-2.5 px-3 text-center">90</td>
                <td className="py-2.5 px-3 text-center">78.9%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 border border-[#D1D5DB]">
          <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider mb-2">Recent Activity Logs</h3>
          <div className="space-y-2 text-xs font-semibold text-[#6B7280]">
            <div className="p-2 bg-[#F7F7F7] border border-[#D1D5DB]">
              <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8371 — TODAY</span>
              <p className="text-[#111827] mt-0.5">Faculty Ramanujam generated placement recommendations report.</p>
            </div>
            <div className="p-2 bg-[#F7F7F7] border border-[#D1D5DB]">
              <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8370 — TODAY</span>
              <p className="text-[#111827] mt-0.5">Dr. Monisha R verified achievement credentials for Student Shahul.</p>
            </div>
            <div className="p-2 bg-[#F7F7F7] border border-[#D1D5DB]">
              <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8369 — YESTERDAY</span>
              <p className="text-[#111827] mt-0.5">Excel Ingestion Engine compiled assessment score uploads.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ====================================================
// BULK UPLOAD MODAL
// ====================================================
export const BulkUploadModal = ({ isOpen, onClose, type, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);

    try {
      let resp;
      if (type === "students") {
        resp = await adminUploadService.uploadStudentsExcel(file);
      } else if (type === "faculty") {
        resp = await adminUploadService.uploadFacultyExcel(file);
      } else if (type === "mentors") {
        resp = await adminUploadService.uploadMentorsExcel(file);
      }

      if (resp && resp.success) {
        setResult(resp);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setError(resp?.message || "Failed to upload and parse file.");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || "An unexpected error occurred.";
      setError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError("");
    setUploading(false);
    onClose();
  };

  const getTitle = () => {
    if (type === "students") return "Bulk Upload Students";
    if (type === "faculty") return "Bulk Upload Faculty";
    if (type === "mentors") return "Bulk Upload Mentors";
    return "Bulk Upload";
  };

  const getTemplateInfo = () => {
    if (type === "students") {
      return "Required columns: register_no, name. Default password: Password123!";
    }
    if (type === "faculty") {
      return "Required columns: name. Default password: Password123!";
    }
    if (type === "mentors") {
      return "Required columns: name. Default password: Password123!";
    }
    return "";
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()} maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Info Box */}
        <div className="p-3 bg-[#F7F7F7] border border-[#D1D5DB] text-[11px] text-[#214C55] font-semibold leading-relaxed">
          <span className="font-extrabold uppercase text-[#C76F2B] block mb-1">Spreadsheet Instructions</span>
          <p>Please upload a valid CSV (.csv) or Excel (.xlsx) file. Columns will be auto-mapped based on header names.</p>
          <p className="mt-1 text-slate-500">{getTemplateInfo()}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-bold rounded-none text-xs">
            {error}
          </div>
        )}

        {/* Upload Interface */}
        {!result && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#C76F2B] transition-colors p-6 text-center bg-gray-50 flex flex-col items-center justify-center cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <svg className="w-8 h-8 text-[#6B7280] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <span className="text-xs font-bold text-[#111827]">
                {file ? file.name : "Select or drag & drop CSV/Excel file"}
              </span>
              <span className="text-[10px] text-[#6B7280] mt-1">Supports .csv, .xlsx, .xls formats</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !file}
                className={`px-4 py-2 text-white text-xs font-bold uppercase transition-colors rounded-none flex items-center gap-1.5 ${
                  uploading || !file ? "bg-gray-400 cursor-not-allowed" : "bg-[#C76F2B] hover:bg-[#A8561F]"
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Upload & Ingest"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 font-extrabold text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-green-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
              Upload processed successfully.
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-[#D1D5DB] p-3 text-center bg-gray-50">
                <span className="block text-[9px] font-black uppercase text-green-700">Inserted</span>
                <span className="text-lg font-extrabold text-green-800">{result.inserted}</span>
              </div>
              <div className="border border-[#D1D5DB] p-3 text-center bg-gray-50">
                <span className="block text-[9px] font-black uppercase text-blue-700">Updated</span>
                <span className="text-lg font-extrabold text-blue-800">{result.updated}</span>
              </div>
              <div className="border border-[#D1D5DB] p-3 text-center bg-gray-50">
                <span className="block text-[9px] font-black uppercase text-[#C76F2B]">Skipped/Errors</span>
                <span className="text-lg font-extrabold text-[#C76F2B]">{result.skipped}</span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2 border border-[#D1D5DB] p-3 bg-white">
                <span className="text-[10px] font-black uppercase text-red-650 block border-b border-[#E5E5E5] pb-1">
                  Parsing Warnings & Errors ({result.errors.length})
                </span>
                <div className="max-h-32 overflow-y-auto divide-y divide-[#E5E5E5] text-[11px] font-semibold text-slate-600">
                  {result.errors.map((err, i) => (
                    <div key={i} className="py-1.5 flex justify-between">
                      <span className="text-red-700 font-extrabold">Row {err.row} ({err.identifier}):</span>
                      <span className="text-right leading-tight max-w-[70%]">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold border border-[#D1D5DB] transition-colors rounded-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
