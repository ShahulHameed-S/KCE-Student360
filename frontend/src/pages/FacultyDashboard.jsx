import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { studentService } from "../services/studentService";
import { mentorService } from "../services/mentorService";
import StatCard from "../components/dashboard/StatCard";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Users,
  GraduationCap,
  Award,
  CheckSquare,
  Upload,
  Trophy,
  ExternalLink,
  Bot,
  CheckCircle,
  FileCheck2,
  AlertTriangle,
  Cpu,
  Settings,
  ShieldCheck,
  Calendar,
  FileBadge2,
  UserPlus,
  UserMinus,
  UserCog,
  Eye,
  Edit2,
  Trash2,
  User,
  FileText
} from "lucide-react";

import { mockUsers } from "../data/mockUsers";
import { mockStudents } from "../data/mockStudents";
import { mockPerformance } from "../data/mockPerformance";

import { resolveImageUrl, getStudentImageUrl, getResumeUrl } from "../utils/imageUtils";

import { studentSubmissionService } from "../services/studentSubmissionService";
import { portfolioCustomizationService } from "../services/portfolioCustomizationService";
import { profileService } from "../services/profileService";
import { resumeService } from "../services/resumeService";
import { uploadService } from "../services/uploadService";
import { adminUploadService } from "../services/adminUploadService";
import { getAdminStudents, getAdminFaculty, getAdminMentors, getAdminUsers } from "../services/adminService";
import { safeFixed, safePercent } from "../utils/formatters";
import {
  AddStudentModal,
  RemoveStudentModal,
  AddFacultyModal,
  RemoveFacultyModal,
  AddMentorModal,
  RemoveMentorModal,
  AssignMentorModal,
  ManageUsersModal,
  ManageStudentsModal,
  ManageFacultyModal,
  ManageMentorsModal,
  SystemOverviewModal,
  ViewStudentModal,
  EditStudentModal,
  ConfirmRemoveStudentModal,
  ViewFacultyModal,
  EditFacultyModal,
  ConfirmRemoveFacultyModal,
  ViewMentorModal,
  EditMentorModal,
  ConfirmRemoveMentorModal,
  ViewUserModal,
  EditUserModal,
  ConfirmRemoveUserModal,
  BulkUploadModal
} from "../components/admin/AdminModals";

const AssignMentorInlineForm = ({ mentors, onAssign }) => {
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
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center">
          {success}
        </div>
      )}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#214C55]">Select Mentor</label>
        <select 
          required 
          value={formData.mentorId}
          onChange={(e) => setFormData({...formData, mentorId: e.target.value})}
          className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none bg-white"
        >
          <option value="">Choose Mentor</option>
          {mentors.map(m => (
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
      <div className="pt-2">
        <button 
          type="submit" 
          className="px-5 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none"
        >
          Assign Mentor
        </button>
      </div>
    </form>
  );
};

const MyProfileSection = ({ profileData, setProfileData, message, setMessage, user, updateUser }) => {
  console.log("MY PROFILE LOAD RESPONSE", profileData);
  if (!profileData) return <LoadingSpinner size="sm" text="Resolving account attributes..." />;

  const resolvedProfileImg = getStudentImageUrl({
    ...profileData,
    registerNo: user?.register_no || user?.registerNo || profileData?.extra?.registerNo,
    role: user?.role
  });

  const [aboutMessage, setAboutMessage] = useState("");

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await profileService.saveProfile(user.role, user.studentId || user.id || 1, profileData);
      setProfileData(updatedProfile);
      
      const registerNo = user.register_no || user.registerNo || profileData.extra?.registerNo || "22AD001";
      localStorage.setItem(`student360_profile_${registerNo}`, JSON.stringify(updatedProfile));

      const aboutData = {
        headline: updatedProfile.portfolioHeadline || updatedProfile.headline || "",
        about_me: updatedProfile.aboutMe || updatedProfile.about_me || "",
        career_objective: updatedProfile.careerObjective || updatedProfile.career_objective || "",
        skillsSummary: updatedProfile.extra?.skillsSummary || ""
      };
      localStorage.setItem(`student360_about_profile_${registerNo}`, JSON.stringify(aboutData));

      if (updateUser) {
        updateUser({
          name: updatedProfile.fullName || updatedProfile.name,
          email: updatedProfile.email,
          profileImage: updatedProfile.profileImage || updatedProfile.profile_image,
          profile_image: updatedProfile.profile_image || updatedProfile.profileImage,
          profileImageUpdatedAt: Date.now()
        });
      }

      setAboutMessage("About information updated successfully.");
      setTimeout(() => setAboutMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setAboutMessage("Error saving about information.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await profileService.saveProfile(user.role, user.studentId || user.id || 1, profileData);
      setProfileData(updatedProfile);
      
      if (user.role === "student") {
        const registerNo = user.register_no || user.registerNo || profileData.extra?.registerNo || "22AD001";
        localStorage.setItem(`student360_profile_${registerNo}`, JSON.stringify(updatedProfile));

        const aboutData = {
          headline: updatedProfile.portfolioHeadline || updatedProfile.headline || "",
          about_me: updatedProfile.aboutMe || updatedProfile.about_me || "",
          career_objective: updatedProfile.careerObjective || updatedProfile.career_objective || "",
          skillsSummary: updatedProfile.extra?.skillsSummary || ""
        };
        localStorage.setItem(`student360_about_profile_${registerNo}`, JSON.stringify(aboutData));
      }

      if (updateUser) {
        updateUser({
          name: updatedProfile.fullName || updatedProfile.name,
          email: updatedProfile.email,
          profileImage: updatedProfile.profileImage || updatedProfile.profile_image,
          profile_image: updatedProfile.profile_image || updatedProfile.profileImage,
          profileImageUpdatedAt: Date.now()
        });
      }

      setMessage("Profile updated successfully.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setMessage("Invalid file format. Please upload JPG, PNG, or WEBP.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: reader.result,
          profileImageName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileData(prev => ({
      ...prev,
      profileImage: "",
      profileImageName: ""
    }));
  };

  return (
    <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <h2 className="text-sm font-black text-[#214C55] uppercase tracking-wider text-left">My Profile</h2>
        <p className="text-xs text-[#6B7280] font-semibold mt-0.5 text-left">View and update your account details.</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center text-xs">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar and Quick Identity */}
        <div className="lg:col-span-4 flex flex-col items-center space-y-4 text-center">
          <div className="relative">
            {resolvedProfileImg ? (
              <img
                src={resolvedProfileImg}
                alt="Profile Preview"
                className="w-28 h-28 rounded-full object-cover border-4 border-[#214C55]/20"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#214C55] text-white flex items-center justify-center text-3xl font-black border-4 border-[#214C55]/20">
                {getInitials(profileData.fullName || user.name)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-[#214C55] text-xs uppercase tracking-wide">{profileData.fullName || "User"}</h3>
            <span className="inline-block px-2.5 py-0.5 bg-[#214C55]/10 text-[#214C55] border border-[#214C55]/20 text-[9px] font-black uppercase">
              {user.role?.replace("_", " ")}
            </span>
            <p className="text-[10px] text-[#6B7280] font-semibold">{profileData.department || "No Department Specified"}</p>
          </div>

          {/* Image upload controls */}
          <div className="flex flex-col space-y-2 w-full max-w-[200px]">
            <label className="cursor-pointer text-center px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-[10px] font-bold uppercase tracking-wider">
              <span>Change Image</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {profileData.profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-white border border-rose-355 border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold uppercase tracking-wider"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Editable Profile Fields Form */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-left">
            {/* Common fields */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Full Name</label>
              <input
                required
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
              <input
                required
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Department</label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
              />
            </div>

            {/* Role specific static / dynamic fields */}
            {user.role === "student" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Register Number</label>
                  <input
                    disabled
                    type="text"
                    value={profileData.extra?.registerNo || ""}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs bg-slate-50 text-slate-500 cursor-not-allowed rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Year of Study</label>
                  <input
                    type="text"
                    value={profileData.extra?.year || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, year: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Class Section</label>
                  <input
                    type="text"
                    value={profileData.extra?.section || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, section: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Degree Program</label>
                  <input
                    type="text"
                    value={profileData.extra?.program || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, program: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">GitHub URL</label>
                  <input
                    type="text"
                    value={profileData.githubUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">LinkedIn URL</label>
                  <input
                    type="text"
                    value={profileData.linkedinUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
              </>
            )}

            {user.role === "faculty" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Faculty ID</label>
                  <input
                    disabled
                    type="text"
                    value={profileData.extra?.facultyId || ""}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs bg-slate-50 text-slate-500 cursor-not-allowed rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Designation</label>
                  <input
                    type="text"
                    value={profileData.extra?.designation || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, designation: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Specialization Domain</label>
                  <input
                    type="text"
                    value={profileData.extra?.specialization || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, specialization: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
              </>
            )}

            {user.role === "mentor" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Mentor Type</label>
                  <input
                    type="text"
                    value={profileData.extra?.mentorType || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, mentorType: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Department</label>
                  <input
                    type="text"
                    value={profileData.extra?.assignedDepartment || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, assignedDepartment: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Class Year</label>
                  <input
                    type="text"
                    value={profileData.extra?.assignedYear || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, assignedYear: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Class Section</label>
                  <input
                    type="text"
                    value={profileData.extra?.assignedSection || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, assignedSection: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
              </>
            )}

            {user.role === "admin" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Admin ID</label>
                  <input
                    disabled
                    type="text"
                    value={profileData.extra?.adminId || ""}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs bg-slate-50 text-slate-500 cursor-not-allowed rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Designation</label>
                  <input
                    type="text"
                    value={profileData.extra?.designation || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, designation: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Office Room / Block</label>
                  <input
                    type="text"
                    value={profileData.extra?.office || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, office: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
              </>
            )}

            {user.role === "placement_mentor" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Placement Role</label>
                  <input
                    type="text"
                    value={profileData.extra?.placementRole || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, placementRole: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Training Domain</label>
                  <input
                    type="text"
                    value={profileData.extra?.trainingDomain || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, trainingDomain: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Assigned Batch Year</label>
                  <input
                    type="text"
                    value={profileData.extra?.assignedBatch || ""}
                    onChange={(e) => setProfileData({ ...profileData, extra: { ...profileData.extra, assignedBatch: e.target.value } })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 flex justify-end border-t border-[#E5E5E5]/60">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {/* About Me Section (Student Only) */}
      {user.role === "student" && (
        <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-6 mt-6">
          <div className="border-b border-[#E5E5E5] pb-4">
            <h2 className="text-sm font-black text-[#214C55] uppercase tracking-wider text-left">About Me</h2>
            <p className="text-xs text-[#6B7280] font-semibold mt-0.5 text-left font-sans">Configure your public headline, introduction bio, career goals, and skills summary for your public portfolio card.</p>
          </div>

          {aboutMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center text-xs">
              {aboutMessage}
            </div>
          )}

          <form onSubmit={handleSaveAbout} className="space-y-4 text-xs font-semibold text-left">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Portfolio Headline</label>
              <input
                type="text"
                value={profileData.portfolioHeadline || ""}
                onChange={(e) => setProfileData({ ...profileData, portfolioHeadline: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                placeholder="e.g. AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">About Me Bio</label>
              <textarea
                rows={6}
                value={profileData.aboutMe || ""}
                onChange={(e) => setProfileData({ ...profileData, aboutMe: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Career Objective</label>
              <textarea
                rows={4}
                value={profileData.careerObjective || ""}
                onChange={(e) => setProfileData({ ...profileData, careerObjective: e.target.value })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#214C55]">Skills Summary (Comma Separated)</label>
              <input
                type="text"
                value={profileData.extra?.skillsSummary || ""}
                onChange={(e) => setProfileData({ 
                  ...profileData, 
                  extra: { ...profileData.extra, skillsSummary: e.target.value } 
                })}
                className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
                placeholder="e.g. AI & Data Science, Java, React, Full Stack Development, Python, DSA, DBMS, FastAPI, PostgreSQL"
              />
            </div>

            <div className="pt-4 flex justify-end border-t border-[#E5E5E5]/60">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer"
              >
                Save About Info
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

const MyResumeSection = ({ registerNo, resumeData, setResumeData, message, setMessage }) => {
  const [formData, setFormData] = useState({
    resumeTitle: "",
    careerObjective: "",
    primaryRole: "",
    keySkills: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    preferredJobRole: "",
    useInPortfolio: false
  });

  useEffect(() => {
    if (resumeData) {
      setFormData({
        resumeTitle: resumeData.resumeTitle || "",
        careerObjective: resumeData.careerObjective || "",
        primaryRole: resumeData.primaryRole || "",
        keySkills: Array.isArray(resumeData.keySkills) ? resumeData.keySkills.join(", ") : "",
        githubUrl: resumeData.githubUrl || "",
        linkedinUrl: resumeData.linkedinUrl || "",
        portfolioUrl: resumeData.portfolioUrl || "",
        preferredJobRole: resumeData.preferredJobRole || "",
        useInPortfolio: resumeData.useInPortfolio || false
      });
    }
  }, [resumeData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = [".pdf", ".doc", ".docx"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setMessage("Invalid file type. Please upload PDF, DOC, or DOCX resume files.");
        return;
      }

      try {
        const updated = await resumeService.uploadResume(registerNo, file);
        setResumeData(updated);
        setMessage("Resume uploaded successfully.");
        setTimeout(() => setMessage(""), 4000);
      } catch (err) {
        console.error(err);
        setMessage("Error uploading resume.");
      }
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = formData.keySkills
        ? formData.keySkills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const updated = {
        ...resumeData,
        resumeTitle: formData.resumeTitle,
        careerObjective: formData.careerObjective,
        primaryRole: formData.primaryRole,
        keySkills: skillsArray,
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        preferredJobRole: formData.preferredJobRole,
        useInPortfolio: formData.useInPortfolio
      };
      await resumeService.saveResumeData(registerNo, updated);
      setResumeData(updated);
      setMessage("Resume details saved.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Error saving resume details.");
    }
  };

  const toggleUseInPortfolio = async () => {
    try {
      const updated = {
        ...resumeData,
        useInPortfolio: !formData.useInPortfolio
      };
      await resumeService.saveResumeData(registerNo, updated);
      setResumeData(updated);
      setFormData(prev => ({ ...prev, useInPortfolio: updated.useInPortfolio }));
      setMessage(updated.useInPortfolio ? "Resume enabled for portfolio." : "Resume disabled for portfolio.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Error toggling portfolio settings.");
    }
  };

  const handleSyncResumeToPortfolio = async () => {
    try {
      const existing = await portfolioCustomizationService.getPortfolioCustomization(registerNo);
      
      const skillsArray = formData.keySkills
        ? formData.keySkills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
        
      const updated = {
        ...existing,
        headline: formData.primaryRole || formData.resumeTitle || existing.headline,
        about_me: formData.careerObjective || existing.about_me,
        career_objective: formData.careerObjective || existing.career_objective,
        skills: skillsArray.length > 0 ? skillsArray : existing.skills,
        github_url: formData.githubUrl || existing.github_url,
        linkedin_url: formData.linkedinUrl || existing.linkedin_url,
      };
      
      await portfolioCustomizationService.savePortfolioCustomization(registerNo, updated);
      
      setMessage("Resume details synced to Portfolio successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Error syncing resume to portfolio.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <h2 className="text-sm font-black text-[#214C55] uppercase tracking-wider text-left">My Resume</h2>
        <p className="text-xs text-[#6B7280] font-semibold mt-0.5 text-left">Upload and manage your resume for placement and portfolio use.</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 font-bold text-center text-xs">
          {message}
        </div>
      )}

      {/* 1. Current Resume Card */}
      <div className="bg-slate-50 border border-[#D1D5DB] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-[#214C55] uppercase tracking-wider text-[10px]">Current Uploaded Resume</h4>
          {resumeData?.fileName ? (
            <div className="space-y-0.5">
              <p className="font-bold text-slate-700">File Name: <span className="font-semibold">{resumeData.fileName}</span></p>
              <p className="text-[10px] text-[#6B7280] font-semibold">Last Updated: {resumeData.uploadedAt}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center space-x-1 mt-1">
                <span>Active Status: Uploaded</span>
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Used in Portfolio: {resumeData.useInPortfolio ? "Yes" : "No"}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 font-semibold italic">No resume file uploaded yet.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-[10px] font-bold uppercase tracking-wider">
            <span>Upload Resume</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {resumeData?.fileName && (
            <>
              <button
                type="button"
                onClick={toggleUseInPortfolio}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  formData.useInPortfolio
                    ? "bg-[#214C55] text-white border-[#214C55] hover:bg-[#163941]"
                    : "bg-white text-[#214C55] border-[#214C55] hover:bg-[#214C55] hover:text-white"
                }`}
              >
                {formData.useInPortfolio ? "Disable in Portfolio" : "Use in Portfolio"}
              </button>
              <button
                type="button"
                onClick={handleSyncResumeToPortfolio}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Sync Resume to Portfolio
              </button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const resumeUrl = getResumeUrl(resumeData);
                  if (!resumeUrl) {
                    setMessage("No resume uploaded yet.");
                    setTimeout(() => setMessage(""), 4000);
                    return;
                  }
                  window.open(resumeUrl, "_blank", "noopener,noreferrer");
                }}
                className="px-4 py-2 bg-white border border-[#D1D5DB] text-slate-700 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-center"
              >
                Preview Resume
              </a>
            </>
          )}
        </div>
      </div>

      {/* 2. Resume Details Form */}
      <form onSubmit={handleSaveDetails} className="space-y-4">
        <h3 className="font-extrabold text-[#214C55] text-xs uppercase tracking-wide border-b border-[#E5E5E5] pb-2 text-left">Resume Configuration Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Resume Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Shahul's Software Engineer Resume"
              value={formData.resumeTitle}
              onChange={(e) => setFormData({ ...formData, resumeTitle: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Primary Role</label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer / ML Engineer"
              value={formData.primaryRole}
              onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Career Objective</label>
            <textarea
              rows={3}
              placeholder="To secure a challenging role..."
              value={formData.careerObjective}
              onChange={(e) => setFormData({ ...formData, careerObjective: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white font-semibold leading-relaxed rounded-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Key Skills (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, Python, AWS"
              value={formData.keySkills}
              onChange={(e) => setFormData({ ...formData, keySkills: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">GitHub URL</label>
            <input
              type="text"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">LinkedIn URL</label>
            <input
              type="text"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Portfolio URL</label>
            <input
              type="text"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#214C55]">Preferred Job Role</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer / Data Scientist"
              value={formData.preferredJobRole}
              onChange={(e) => setFormData({ ...formData, preferredJobRole: e.target.value })}
              className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white rounded-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-[#E5E5E5]/60">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
          >
            Save Resume Details
          </button>
        </div>
      </form>
    </div>
  );
};

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [allApprovals, setAllApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminStudentsLoading, setAdminStudentsLoading] = useState(false);
  const [adminStudentsError, setAdminStudentsError] = useState("");
  const [adminTotalStudents, setAdminTotalStudents] = useState(0);
  const [adminTotalFaculty, setAdminTotalFaculty] = useState(0);
  const [adminTotalMentors, setAdminTotalMentors] = useState(0);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");

  // Student specific data states
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);
  
  const getStudentSectionFromPath = (path) => {
    if (path === "/my-profile") return "profile";
    if (path === "/my-performance") return "performance";
    if (path === "/my-portfolio") return "portfolio-customization";
    if (path === "/my-projects") return "projects";
    if (path === "/my-certifications") return "certifications";
    if (path === "/my-achievements") return "achievements";
    if (path === "/my-resume") return "resume";
    return "dashboard";
  };
  
  const studentSection = getStudentSectionFromPath(location.pathname);
  const [staffSection, setStaffSection] = useState("dashboard"); // "dashboard", "profile"
  const [resumeData, setResumeData] = useState(null);
  const [resumeMessage, setResumeMessage] = useState("");
  const [uploadedScoresCount, setUploadedScoresCount] = useState(0);
  const [myProfileData, setMyProfileData] = useState(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [activeForm, setActiveForm] = useState(null); // "project" | "certification" | "achievement" | null
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [customizationMessage, setCustomizationMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Submission Form Data States
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    tech_stack: "",
    github_link: "",
    live_link: "",
    project_type: "AI/ML"
  });

  const [certForm, setCertForm] = useState({
    title: "",
    issuer: "",
    credential_id: "",
    issue_date: "",
    expiry_date: "",
    verification_link: ""
  });

  const [achievementForm, setAchievementForm] = useState({
    title: "",
    type: "Hackathon",
    description: "",
    event: "",
    date: "",
    proof_link: ""
  });

  // Customization Form Data State
  const [customizationForm, setCustomizationForm] = useState({
    headline: "",
    about_me: "",
    career_objective: "",
    skills: "",
    github_url: "",
    linkedin_url: "",
    email: "",
    phone: "",
    location: "",
    theme: "Dark Minimal",
    resumeSectionTitle: "My Resume",
    resumeButtonLabel: "View Resume",
    visibility: {
      showProjects: true,
      showCertifications: true,
      showAchievements: true,
      showAcademicHighlights: true,
      showContactLinks: true,
      showResume: true
    }
  });

  // Faculty: below-average panel toggle
  const [showBelowAverage, setShowBelowAverage] = useState(false);

  // Admin Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [selectedItem, setSelectedItem] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState("students");

  const handleDownloadTemplate = (type) => {
    let headers = "";
    let filename = "";
    let data = "";
    
    if (type === "students") {
      headers = "register_no,name,department,year,section,email,phone,batch,mentor_email,date_of_birth,gender,address";
      data = "\n22AD011,Mohamed Ali,Artificial Intelligence & Data Science,3,A,mohamedali@kce.ac.in,9876543210,2028,mentor@student360.com,2004-05-15,Male,Coimbatore";
      filename = "students_upload_template.csv";
    } else if (type === "faculty") {
      headers = "name,department,email,phone,designation,employee_id,specialization";
      data = "\nDr. Ravi Kumar,AI & DS,ravi.kumar@kce.ac.in,9876543210,Assistant Professor,FAC001,Machine Learning";
      filename = "faculty_upload_template.csv";
    } else if (type === "mentors") {
      headers = "name,department,email,phone,designation,employee_id,assigned_section,assigned_batch";
      data = "\nDr. Monisha R,AI & DS,monisha.r@kce.ac.in,9876543210,Mentor,MEN001,A,2028";
      filename = "mentors_upload_template.csv";
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + data);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  const loadAdminStudents = async () => {
    try {
      setAdminStudentsLoading(true);
      setAdminStudentsError("");
      const students = await getAdminStudents();
      console.log("Admin students API response:", students);
      setAdminStudents(Array.isArray(students) ? students : []);
    } catch (error) {
      console.error("Admin students load error:", error);
      setAdminStudentsError("Unable to load students from server.");
    } finally {
      setAdminStudentsLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      setAdminUsersLoading(true);
      setAdminUsersError("");
      const users = await getAdminUsers();
      console.log("Admin users API response:", users);
      setUsersList(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error("Admin users load error:", error);
      setAdminUsersError("Unable to load users from server.");
      setUsersList([]);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && adminSection === "manage-students") {
      loadAdminStudents();
    }
  }, [adminSection, user]);

  useEffect(() => {
    if (user?.role === "admin" && adminSection === "manage-users") {
      loadAdminUsers();
    }
  }, [adminSection, user]);

  useEffect(() => {
    if (user?.role === "admin" && adminSection === "manage-faculty") {
      adminUploadService.getFacultyList().then(res => setFaculties(res)).catch(e => console.warn(e));
    }
  }, [adminSection, user]);

  useEffect(() => {
    if (user?.role === "admin" && (adminSection === "manage-mentors" || adminSection === "assign-mentor")) {
      adminUploadService.getMentorsList().then(res => setMentors(res)).catch(e => console.warn(e));
    }
  }, [adminSection, user]);

  // Mock handlers for data mutation
  const handleAddStudent = (newStudent) => {
    setStudents(prev => [...prev, newStudent]);
    setAdminStudents(prev => [...prev, newStudent]);
  };

  const handleEditStudent = (updatedStudent) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setAdminStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleRemoveStudent = (studentId, reason) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "Inactive" } : s));
    setAdminStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "Inactive" } : s));
  };

  const handleAddFaculty = (newFaculty) => {
    setFaculties(prev => [...prev, newFaculty]);
    setUsersList(prev => [...prev, newFaculty]);
  };

  const handleEditFaculty = (updatedFaculty) => {
    setFaculties(prev => prev.map(f => f.id === updatedFaculty.id ? updatedFaculty : f));
    setUsersList(prev => prev.map(u => u.id === updatedFaculty.id ? updatedFaculty : u));
  };

  const handleRemoveFaculty = (facultyId, reason) => {
    setFaculties(prev => prev.map(f => f.id === facultyId ? { ...f, status: "Inactive" } : f));
    setUsersList(prev => prev.map(u => u.id === facultyId ? { ...u, status: "Inactive" } : u));
  };

  const handleAddMentor = (newMentor) => {
    setMentors(prev => [...prev, newMentor]);
    setUsersList(prev => [...prev, newMentor]);
  };

  const handleEditMentor = (updatedMentor) => {
    setMentors(prev => prev.map(m => m.id === updatedMentor.id ? updatedMentor : m));
    setUsersList(prev => prev.map(u => u.id === updatedMentor.id ? updatedMentor : u));
  };

  const handleRemoveMentor = (mentorId, reason) => {
    setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, status: "Inactive" } : m));
    setUsersList(prev => prev.map(u => u.id === mentorId ? { ...u, status: "Inactive" } : u));
  };

  const handleAssignMentor = (assignment) => {
    const mentor = mentors.find(m => m.id === assignment.mentorId);
    if (mentor) {
      const className = `${assignment.department}-${assignment.year}-${assignment.section}`;
      setMentors(prev => prev.map(m => m.id === assignment.mentorId ? { ...m, assignedClass: className } : m));
      setUsersList(prev => prev.map(u => u.id === assignment.mentorId ? { ...u, assignedClass: className } : u));
    }
  };

  const handleEditUser = (updatedUser) => {
    setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (updatedUser.role === 'faculty') {
      setFaculties(prev => prev.map(f => f.id === updatedUser.id ? updatedUser : f));
    }
    if (updatedUser.role === 'mentor') {
      setMentors(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === "Inactive" ? "Active" : "Inactive";
        setFaculties(fPrev => fPrev.map(f => f.id === userId ? { ...f, status: nextStatus } : f));
        setMentors(mPrev => mPrev.map(m => m.id === userId ? { ...m, status: nextStatus } : m));
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleRemoveUser = (userId, reason) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: "Inactive" } : u));
    setFaculties(prev => prev.map(f => f.id === userId ? { ...f, status: "Inactive" } : f));
    setMentors(prev => prev.map(m => m.id === userId ? { ...m, status: "Inactive" } : m));
  };

  useEffect(() => {
    const handleAdminAction = (event) => {
      const action = event.detail;
      if ([
        "dashboard",
        "profile",
        "manage-students",
        "manage-faculty",
        "manage-mentors",
        "assign-mentor",
        "manage-users",
        "system-overview"
      ].includes(action)) {
        setAdminSection(action);
        setActiveModal(null);
      }
    };
    window.addEventListener("admin-sidebar-action", handleAdminAction);
    return () => {
      window.removeEventListener("admin-sidebar-action", handleAdminAction);
    };
  }, []);

  useEffect(() => {
    const handleStaffAction = (event) => {
      const action = event.detail;
      if (["dashboard", "profile"].includes(action)) {
        setStaffSection(action);
      }
    };
    window.addEventListener("staff-sidebar-action", handleStaffAction);
    return () => {
      window.removeEventListener("staff-sidebar-action", handleStaffAction);
    };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    console.log("FACULTY DASHBOARD ROUTE SYNC PATH", path, user?.role);
    if (["faculty", "mentor", "placement_mentor"].includes(user?.role)) {
      if (path === "/my-profile") setStaffSection("profile");
      else setStaffSection("dashboard");
    } else if (user?.role === "admin") {
      if (path === "/my-profile") setAdminSection("profile");
      else setAdminSection("dashboard");
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (user?.role === "admin" && adminSection) {
      window.dispatchEvent(
        new CustomEvent("admin-sidebar-action", {
          detail: adminSection
        })
      );
    }
  }, [adminSection, user?.role]);

  useEffect(() => {
    if (["faculty", "mentor", "placement_mentor"].includes(user?.role) && staffSection) {
      window.dispatchEvent(
        new CustomEvent("staff-sidebar-action", {
          detail: staffSection
        })
      );
    }
  }, [staffSection, user?.role]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const studentId = user?.studentId || user?.id || 1;
      const registerNo = user?.register_no || user?.registerNo || "22AD001";

      if (user) {
        try {
          const prof = await profileService.getProfile(user.role, studentId);
          setMyProfileData(prof);
        } catch (e) {
          console.error("Error loading profile:", e);
        }
      }

      if (user?.role === "student") {
        try {
          setLoading(true);
          
          // Find matching student
          let profile = null;
          try {
            profile = await studentService.getStudentById(registerNo);
          } catch (apiErr) {
            console.warn("Could not load student profile from API, using mock:", apiErr);
            profile = mockStudents.find((s) => s.id === String(studentId) || s.register_no === String(registerNo));
            if (!profile) {
              profile = mockStudents.find((s) => s.id === "1") || mockStudents[0];
            }
          }

          // Fetch performance details from backend API
          let perfData = null;
          try {
            perfData = await studentService.getStudentPerformance(registerNo);
            console.log("Dashboard performance data:", perfData);
          } catch (perfErr) {
            console.warn("Could not load performance from API, using mock:", perfErr);
          }

          // Fetch local customization & user submissions
          const customization = await portfolioCustomizationService.getPortfolioCustomization(profile.register_no || registerNo);
          const userSubmissions = studentSubmissionService.getUserSubmissions(profile.register_no || registerNo);
          
          // Fetch resume data
          const resData = await resumeService.getResumeData(profile.register_no || registerNo);
          setResumeData(resData);

          // Merge profile with customization, backend performance, and submissions
          const mergedProfile = {
            ...profile,
            overall_score: perfData?.overall_score ?? perfData?.overallScore ?? profile.overall_score,
            strongest_domain: perfData?.strongest_domain ?? perfData?.strongestDomain ?? profile.strongest_domain,
            weakest_domain: perfData?.weakest_domain ?? perfData?.weakestDomain ?? profile.weakest_domain,
            domain_scores: perfData?.domain_scores ?? perfData?.domainScores ?? profile.domain_scores,
            headline: customization.headline || profile.headline || "",
            about_me: customization.about_me || profile.about || "",
            career_objective: customization.career_objective || profile.career_objective || "",
            github_url: customization.github_url || profile.contact?.github || "",
            linkedin_url: customization.linkedin_url || profile.contact?.linkedin || "",
            email: customization.email || profile.email || profile.contact?.email || "",
            phone: customization.phone || profile.contact?.phone || "",
            location: customization.location || profile.contact?.location || "Coimbatore, Tamil Nadu",
            theme: customization.theme || "Dark Minimal",
            visibility: customization.visibility || {
              showProjects: true,
              showCertifications: true,
              showAchievements: true,
              showAcademicHighlights: true,
              showContactLinks: true
            },
            projects: [
              ...(profile.projects || []).map(p => ({ ...p, status: p.status || p.approval_status || "Approved" })),
              ...(userSubmissions.projects || [])
            ],
            certifications: [
              ...(profile.certifications || []).map(c => ({ ...c, status: c.status || c.approval_status || "Approved" })),
              ...(userSubmissions.certifications || [])
            ],
            achievements: [
              ...(profile.achievements || []).map(a => ({ ...a, status: a.status || a.approval_status || "Approved" })),
              ...(userSubmissions.achievements || [])
            ]
          };

          setStudentProfile(mergedProfile);
          const scoreHistory = perfData?.score_history ?? perfData?.scoreHistory ?? mockPerformance[mergedProfile.register_no] ?? mockPerformance["22AD001"] ?? [];
          setStudentPerformance(scoreHistory);

          // Pre-fill customization form
          setCustomizationForm({
            headline: customization.headline || mergedProfile.headline || "",
            about_me: customization.about_me || mergedProfile.about_me || "",
            career_objective: customization.career_objective || mergedProfile.career_objective || "",
            skills: Array.isArray(customization.skills)
              ? customization.skills.join(", ")
              : Array.isArray(mergedProfile.skills)
                ? mergedProfile.skills.join(", ")
                : "",
            github_url: customization.github_url || mergedProfile.github_url || "",
            linkedin_url: customization.linkedin_url || mergedProfile.linkedin_url || "",
            email: customization.email || mergedProfile.email || "",
            phone: customization.phone || mergedProfile.phone || "",
            location: customization.location || mergedProfile.location || "",
            theme: customization.theme || "Dark Minimal",
            resumeSectionTitle: customization.resumeSectionTitle || "My Resume",
            resumeButtonLabel: customization.resumeButtonLabel || "View Resume",
            visibility: customization.visibility || {
              showProjects: true,
              showCertifications: true,
              showAchievements: true,
              showAcademicHighlights: true,
              showContactLinks: true,
              showResume: true
            }
          });
        } catch (err) {
          console.error("Student dashboard load error", err);
          const fallbackStudent = mockStudents[0];
          setStudentProfile(fallbackStudent);
          setStudentPerformance(mockPerformance[fallbackStudent.register_no] || []);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Logic for Admin / Faculty / Mentor
      if (user && ["faculty", "mentor", "admin", "placement_mentor"].includes(user?.role)) {
        try {
          setLoading(true);
          setError("");

          let studentListResp = [];

          if (user?.role === "admin") {
            const [studentsResult, facultyResult, mentorsResult, scoresResult] = await Promise.allSettled([
              getAdminStudents(),
              getAdminFaculty(),
              getAdminMentors(),
              uploadService.getScoresCount()
            ]);

            const totalStudentsVal = studentsResult.status === "fulfilled" && Array.isArray(studentsResult.value) ? studentsResult.value.length : 0;
            const totalFacultyVal = facultyResult.status === "fulfilled" && Array.isArray(facultyResult.value) ? facultyResult.value.length : 0;
            const totalMentorsVal = mentorsResult.status === "fulfilled" && Array.isArray(mentorsResult.value) ? mentorsResult.value.length : 0;
            const scoresCountResp = scoresResult.status === "fulfilled" ? scoresResult.value : 0;

            if (studentsResult.status === "rejected") {
              console.warn("Failed to load admin count for students:", studentsResult.reason);
            }
            if (facultyResult.status === "rejected") {
              console.warn("Failed to load admin count for faculty:", facultyResult.reason);
            }
            if (mentorsResult.status === "rejected") {
              console.warn("Failed to load admin count for mentors:", mentorsResult.reason);
            }
            if (scoresResult.status === "rejected") {
              console.warn("Failed to load admin count for scores count:", scoresResult.reason);
            }

            setAdminTotalStudents(totalStudentsVal);
            setAdminTotalFaculty(totalFacultyVal);
            setAdminTotalMentors(totalMentorsVal);
            setUploadedScoresCount(scoresCountResp);
            setStudents([]);
          } else {
            // Execute parallel requests safely for other roles
            const results = await Promise.allSettled([
              studentService.getAllStudents(),
              mentorService.getPendingApprovals(),
              mentorService.getAllApprovals(),
              uploadService.getScoresCount()
            ]);

            studentListResp = results[0].status === "fulfilled" ? results[0].value : [];
            const pendingListResp = results[1].status === "fulfilled" ? results[1].value : [];
            const fullListResp = results[2].status === "fulfilled" ? results[2].value : [];
            const scoresCountResp = results[3].status === "fulfilled" ? results[3].value : 0;

            const allCriticalFailed = results[0].status === "rejected" && 
                                     results[1].status === "rejected" && 
                                     results[2].status === "rejected";

            if (allCriticalFailed) {
              throw new Error("All critical dashboard endpoints failed to respond.");
            }

            setStudents(Array.isArray(studentListResp) ? studentListResp : []);
            setPendingApprovals(Array.isArray(pendingListResp) ? pendingListResp : []);
            setPendingApprovalsCount(Array.isArray(pendingListResp) ? pendingListResp.length : 0);
            setAllApprovals(Array.isArray(fullListResp) ? fullListResp : []);
            setUploadedScoresCount(scoresCountResp);
          }

          console.log("Faculty students:", studentListResp);
        } catch (err) {
          console.error("Dashboard data load failed:", err);
          setError("Failed to load dashboard parameters");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const handleOpenProfileEvent = () => {
      if (user?.role === "student") {
        setStudentSection("profile");
      } else if (user?.role === "admin") {
        setAdminSection("profile");
      } else if (["faculty", "mentor", "placement_mentor"].includes(user?.role)) {
        setStaffSection("profile");
      }
    };

    window.addEventListener("open-my-profile", handleOpenProfileEvent);

    // Check URL search params
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "open-profile") {
      handleOpenProfileEvent();
      // Clean up URL parameters without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener("open-my-profile", handleOpenProfileEvent);
    };
  }, [user]);

  // Global calculations safely safeguarded
  const totalStudents = user?.role === "admin"
    ? (adminTotalStudents > 0 ? adminTotalStudents : (Array.isArray(adminStudents) && adminStudents.length > 0 ? adminStudents.length : 0))
    : (Array.isArray(students) ? students.length : 0);

  const totalFacultyCount = user?.role === "admin"
    ? (adminTotalFaculty > 0 ? adminTotalFaculty : (Array.isArray(faculties) ? faculties.length : 0))
    : (Array.isArray(faculties) ? faculties.length : 0);

  const totalMentorsCount = user?.role === "admin"
    ? (adminTotalMentors > 0 ? adminTotalMentors : (Array.isArray(mentors) ? mentors.length : 0))
    : (Array.isArray(mentors) ? mentors.length : 0);
  
  const overallAverage = totalStudents > 0
    ? students.reduce((acc, curr) => {
        const score = curr?.overall_score ?? curr?.overallScore ?? 0;
        return acc + score;
      }, 0) / totalStudents
    : 0;

  const domains = ["DSA", "DBMS", "FullStack", "Aptitude", "Coding", "Academic", "Technical"];
  
  const domainData = domains.map((domain) => {
    const totalScore = totalStudents > 0 
      ? students.reduce((acc, curr) => {
          const ds = curr?.domain_scores ?? curr?.domainScores ?? {};
          const score = ds?.[domain] ?? 0;
          return acc + score;
        }, 0) 
      : 0;
    const average = totalStudents > 0 ? totalScore / totalStudents : 0;
    return {
      domain,
      average: parseFloat(safeFixed(average, 1))
    };
  });

  const topDomainObj = domainData.reduce(
    (max, curr) => (curr.average > max.average ? curr : max),
    { domain: "None", average: 0 }
  );

  const topStudents = totalStudents > 0 
    ? [...students]
        .sort((a, b) => (b?.overall_score ?? b?.overallScore ?? 0) - (a?.overall_score ?? a?.overallScore ?? 0))
        .slice(0, 5)
    : [];

  if (loading) {
    return <LoadingSpinner size="lg" text="Aggregating dashboard analytics..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-[#B91C1C] px-6 py-4 rounded-none max-w-lg mx-auto text-center mt-12 shadow-none font-semibold">
        <h3 className="font-bold text-base uppercase">Data Loading Failure</h3>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const role = user?.role || "student";

  // ==========================================
  // 1. FACULTY DASHBOARD VIEW
  // ==========================================
  if (role === "faculty") {
    return (
      <div className="space-y-6 animate-fade-in text-[#111827]">
        {staffSection === "profile" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Account Settings</span>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyProfileSection
              profileData={myProfileData}
              setProfileData={setMyProfileData}
              message={profileMessage}
              setMessage={setProfileMessage}
              user={user}
              updateUser={useAuth().updateUser}
            />
          </div>
        ) : (
          <>
            {/* KCE Official Banner */}
            <div className="bg-[#163941] p-6 rounded-none border border-[#D1D5DB] text-white shadow-none">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Faculty Intelligence Dashboard</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Karpagam College of Engineering Student Intelligence Portal — Class metrics review, Excel ingestion center, and placement reports generation.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total Students" value={totalStudents} icon={Users} description="Enrolled batch candidates" />
              <StatCard title="Overall Class Average" value={safePercent(overallAverage, 1)} icon={GraduationCap} description="Cumulative batch score" trend="+1.2%" trendType="positive" />
              <StatCard title="Top Performing Domain" value={topDomainObj.domain} icon={Award} description={`Leading domain avg of ${topDomainObj.average}%`} />
              <StatCard title="Recent Score Uploads" value="3" icon={Upload} description="Spreadsheets uploaded today" />
              <div
                className="cursor-pointer"
                onClick={() => setShowBelowAverage(prev => !prev)}
                title="Click to view below-average students"
              >
                <StatCard
                  title="Students Below Average"
                  value={students.filter(s => (s.overall_score ?? 0) < overallAverage).length}
                  icon={AlertTriangle}
                  description="Students requiring performance support"
                  trend="Needs Attention"
                  trendType="negative"
                />
                <p className="text-[9px] font-bold text-[#C76F2B] uppercase tracking-wider text-center mt-1 select-none">
                  {showBelowAverage ? "▲ Hide list" : "▼ Click to view list"}
                </p>
              </div>
            </div>

            {/* Below Average Students Panel */}
            {showBelowAverage && (() => {
              const belowAvgStudents = students
                .filter(s => (s.overall_score ?? 0) < overallAverage)
                .sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0));
              return (
                <div className="bg-white border border-[#D1D5DB] rounded-none shadow-none animate-fade-in">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5]">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Students Below Average</h3>
                      <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Students whose overall score is below the current class average ({safePercent(overallAverage, 1)})</p>
                    </div>
                    <button
                      onClick={() => setShowBelowAverage(false)}
                      className="text-xs font-bold text-[#C76F2B] hover:text-[#A8561F] uppercase tracking-wider"
                    >
                      Close panel
                    </button>
                  </div>

                  {belowAvgStudents.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">No students below the class average.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                            <th className="py-2.5 px-4">Register No</th>
                            <th className="py-2.5 px-4">Student Name</th>
                            <th className="py-2.5 px-4 text-center">Overall Score</th>
                            <th className="py-2.5 px-4">Strongest Domain</th>
                            <th className="py-2.5 px-4">Weakest Domain</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                            <th className="py-2.5 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                          {belowAvgStudents.map(student => (
                            <tr key={student.id} className="hover:bg-[#FFF7F2] transition-colors">
                              <td className="py-2.5 px-4 text-[#C76F2B]">
                                {student.register_no || student.registerNo || student.regNo || "—"}
                              </td>
                              <td className="py-2.5 px-4 text-[#214C55] font-black">{student.name}</td>
                              <td className="py-2.5 px-4 text-center">
                                <ScoreBadge score={student.overall_score ?? 0} />
                              </td>
                              <td className="py-2.5 px-4">
                                <DomainBadge domain={student.strongest_domain || "—"} />
                              </td>
                              <td className="py-2.5 px-4">
                                <DomainBadge domain={student.weakest_domain || "—"} />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                                  Needs Attention
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <Link
                                    to={`/students/${student.id}`}
                                    className="px-2 py-1 text-[9px] font-black uppercase bg-[#214C55] text-white hover:bg-[#163941] tracking-wider"
                                  >
                                    View Profile
                                  </Link>
                                  <Link
                                    to={`/students/${student.id}`}
                                    className="px-2 py-1 text-[9px] font-black uppercase bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white tracking-wider"
                                  >
                                    Performance
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Content columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Domain Chart */}
              <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none flex flex-col justify-between">
                <div className="mb-4 border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Domain Performance Analysis</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Average scores of all students in each competency domain</p>
                </div>
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="domain" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: "#F7F7F7" }} contentStyle={{ background: "#163941", border: "1px solid #D1D5DB", color: "#fff", borderRadius: "0px" }} />
                      <Bar dataKey="average" radius={[0, 0, 0, 0]}>
                        {domainData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#214C55" : "#C76F2B"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Performers Table */}
              <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Top Performers Preview</h3>
                      <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Top 5 students sorted by overall score</p>
                    </div>
                    <Link to="/leaderboard" className="text-xs font-bold text-[#C76F2B] hover:text-[#A8561F] flex items-center space-x-1 hover:underline uppercase tracking-wider">
                      <span>View All</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="overflow-x-auto border border-[#D1D5DB]">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                          <th className="py-2.5 px-3">Strongest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                        {topStudents.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-[#F7F7F7] transition-colors">
                            <td className="py-3 px-3 flex items-center space-x-1.5">
                              <Trophy size={12} className={idx === 0 ? "text-[#D97706]" : "text-slate-350"} />
                              <span className={idx === 0 ? "text-[#D97706]" : "text-[#6B7280]"}>{idx + 1}</span>
                            </td>
                            <td className="py-3 px-3 text-[#214C55]">
                              <Link to={`/students/${student.id}`} className="hover:text-[#C76F2B] hover:underline">
                                {student.name}
                              </Link>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <ScoreBadge score={student.overall_score} />
                            </td>
                            <td className="py-3 px-3">
                              <DomainBadge domain={student.strongest_domain} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions grid bottom */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#214C55]">Quick Utilities</h3>
              <div className="flex flex-wrap gap-3">
                <Link to="/upload-scores" className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider">Upload Scores Sheet</Link>
                <Link to="/students" className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider">View Students Directory</Link>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. MENTOR DASHBOARD VIEW
  // ==========================================
  if (role === "mentor") {
    // Assigned mock student count matches total for simplicity, needing improvement is those below 78%
    const needyStudents = students.filter((s) => s.overall_score < 78);
    const approvedCount = allApprovals.filter(a => a.status === "Approved").length;

    // Get 4 most recent submissions
    const recentSubmissions = [...allApprovals]
      .sort((a, b) => new Date(b.submitted_date) - new Date(a.submitted_date))
      .slice(0, 4);

    const getStatusBadgeStyle = (status) => {
      const styles = {
        Pending: "bg-amber-50 text-[#D97706] border-amber-250",
        Approved: "bg-emerald-50 text-[#15803D] border-emerald-250",
        Rejected: "bg-red-50 text-[#B91C1C] border-red-250",
        "Correction Required": "bg-orange-50 text-[#C76F2B] border-orange-250"
      };
      return styles[status] || "bg-slate-50 text-slate-700 border-slate-200";
    };

    return (
      <div className="space-y-6 animate-fade-in text-[#111827]">
        {staffSection === "profile" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Account Settings</span>
              <button
                onClick={() => setStaffSection("dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyProfileSection
              profileData={myProfileData}
              setProfileData={setMyProfileData}
              message={profileMessage}
              setMessage={setProfileMessage}
              user={user}
              updateUser={useAuth().updateUser}
            />
          </div>
        ) : (
          <>
            {/* KCE Official Banner */}
            <div className="bg-[#163941] p-6 rounded-none border border-[#D1D5DB] text-white shadow-none">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Mentor Intelligence Dashboard</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Karpagam College of Engineering Student Intelligence Portal — Approve student portfolio records, analyze students needing improvement, and review submissions.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Assigned Students" value={totalStudents} icon={Users} description="Assigned profile portfolios" />
              <StatCard title="Pending Approvals" value={pendingApprovalsCount} icon={CheckSquare} description="Certificates needing validation" trend={pendingApprovalsCount > 0 ? "Pending Review" : "Clear"} trendType={pendingApprovalsCount > 0 ? "negative" : "positive"} />
              <StatCard title="Approved Achievements" value={approvedCount} icon={CheckCircle} description="Logged achievements in system" />
              <StatCard title="Students Needing Attention" value={needyStudents.length} icon={AlertTriangle} description="Averages below 78% proficiency" />
              <StatCard title="Average Performance" value={safePercent(overallAverage, 1)} icon={GraduationCap} description="Assigned class aggregate" />
            </div>

            {/* Mentor Content columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Pending Approval Preview list */}
              <div className="lg:col-span-6 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Pending Approval Preview</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Quick preview of certifications and achievements awaiting verification</p>
                </div>
                
                {pendingApprovals.length === 0 ? (
                  <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider py-8 text-center bg-[#F7F7F7] border border-[#D1D5DB]">All student approvals are cleared.</p>
                ) : (
                  <div className="overflow-x-auto border border-[#D1D5DB]">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                          <th className="py-2 px-3">Student</th>
                          <th className="py-2 px-3">Achievement Title</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                        {pendingApprovals.slice(0, 4).map((app) => (
                          <tr key={app.id} className="hover:bg-[#F7F7F7] transition-colors">
                            <td className="py-2 px-3 text-[#214C55]">
                              <span className="block font-black">{app.student_name}</span>
                              <span className="text-[9px] text-[#6B7280] block mt-0.5">{app.register_no}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 truncate max-w-[150px]">{app.title}</td>
                            <td className="py-2 px-3">
                              <span className="text-[9px] px-1.5 py-0.5 bg-orange-50 text-[#C76F2B] border border-orange-200 uppercase font-black">{app.type}</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Link to="/mentor/approvals" className="text-[10px] font-extrabold uppercase bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white px-2 py-1 transition-all">Review</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Students Needing Improvement */}
              <div className="lg:col-span-6 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Students Needing Improvement</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Students below the target threshold score</p>
                </div>
                
                <div className="overflow-x-auto border border-[#D1D5DB]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3 text-center">Avg</th>
                        <th className="py-2.5 px-3">Weakest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      {needyStudents.slice(0, 5).map((st) => (
                        <tr key={st.id} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-2 px-3 text-[#214C55]">
                            <Link to={`/students/${st.id}`} className="hover:underline font-black">{st.name}</Link>
                            <span className="block text-[9px] text-[#6B7280] mt-0.5">{st.register_no}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <ScoreBadge score={st.overall_score} />
                          </td>
                          <td className="py-2 px-3">
                            <DomainBadge domain={st.weakest_domain} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 2: Recent Student Submissions */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
              <div className="border-b border-[#E5E5E5] pb-3">
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Recent Student Submissions</h3>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Track status updates for all recent project, certification, and achievement uploads</p>
              </div>
              <div className="overflow-x-auto border border-[#D1D5DB]">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date Submitted</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                    {recentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">
                          <span className="block font-black">{sub.student_name}</span>
                          <span className="text-[9px] text-[#6B7280] block mt-0.5">{sub.register_no}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 truncate max-w-[200px]">{sub.title}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-[#214C55] border border-blue-150 uppercase font-black">{sub.type}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[#6B7280]">{sub.submitted_date}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-none font-black uppercase border ${getStatusBadgeStyle(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions for Mentor */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#214C55]">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link to="/mentor/approvals" className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider">Review Approvals</Link>
                <Link to="/students" className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider">View Student Profiles</Link>
                <Link to="/leaderboard" className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider">Check Performance History</Link>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // 3. STUDENT DASHBOARD VIEW
  // ==========================================
  if (role === "student") {
    const defaultProfile = {
      name: user?.name || "Shahul",
      register_no: user?.registerNo || "22AD001",
      overall_score: 88.5,
      strongest_domain: "FullStack",
      weakest_domain: "Aptitude",
      projects: [],
      certifications: [],
      achievements: []
    };

    const activeProfile = studentProfile || defaultProfile;

    // Convert student's domain scores for BarChart display
    const studentDomainScores = [
      { name: "DSA", score: activeProfile.domain_scores?.DSA || 85 },
      { name: "DBMS", score: activeProfile.domain_scores?.DBMS || 90 },
      { name: "FullStack", score: activeProfile.domain_scores?.FullStack || 95 },
      { name: "Aptitude", score: activeProfile.domain_scores?.Aptitude || 75 },
      { name: "Coding", score: activeProfile.domain_scores?.Coding || 92 },
      { name: "Academic", score: activeProfile.domain_scores?.Academic || 88 },
      { name: "Technical", score: activeProfile.domain_scores?.Technical || 94 }
    ];

    const approvedAchievementsCount = 
      (activeProfile.projects || []).filter(p => p.status === "Approved").length +
      (activeProfile.certifications || []).filter(c => c.status === "Approved").length +
      (activeProfile.achievements || []).filter(a => a.status === "Approved").length;

    const getStatusBadge = (status) => {
      switch (status) {
        case "Approved":
          return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-200">Verified</span>;
        case "Pending":
          return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-250">Pending Review</span>;
        case "Rejected":
          return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">Rejected</span>;
        case "Correction Required":
          return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-200">Correction Required</span>;
        default:
          return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
      }
    };

    const handleProjectSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingId) {
          await studentSubmissionService.updateProject(activeProfile.register_no, {
            id: editingId,
            ...projectForm
          });
          setSubmissionMessage("Project updated successfully.");
          setStudentProfile(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === editingId ? {
              ...p,
              ...projectForm,
              tech_stack: Array.isArray(projectForm.tech_stack)
                ? projectForm.tech_stack
                : projectForm.tech_stack.split(",").map(s => s.trim()).filter(Boolean)
            } : p)
          }));
        } else {
          const res = await studentSubmissionService.submitProject({
            registerNo: activeProfile.register_no,
            ...projectForm
          });
          setSubmissionMessage(res.message);
          setStudentProfile(prev => ({
            ...prev,
            projects: [...(prev.projects || []), res.project]
          }));
        }
        setProjectForm({
          title: "",
          description: "",
          tech_stack: "",
          github_link: "",
          live_link: "",
          project_type: "AI/ML"
        });
        setActiveForm(null);
        setEditingId(null);
        setTimeout(() => setSubmissionMessage(""), 4000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleCertSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingId) {
          await studentSubmissionService.updateCertification(activeProfile.register_no, {
            id: editingId,
            ...certForm
          });
          setSubmissionMessage("Certification updated successfully.");
          setStudentProfile(prev => ({
            ...prev,
            certifications: prev.certifications.map(c => c.id === editingId ? {
              ...c,
              ...certForm
            } : c)
          }));
        } else {
          const res = await studentSubmissionService.submitCertification({
            registerNo: activeProfile.register_no,
            ...certForm
          });
          setSubmissionMessage(res.message);
          setStudentProfile(prev => ({
            ...prev,
            certifications: [...(prev.certifications || []), res.certification]
          }));
        }
        setCertForm({
          title: "",
          issuer: "",
          credential_id: "",
          issue_date: "",
          expiry_date: "",
          verification_link: ""
        });
        setActiveForm(null);
        setEditingId(null);
        setTimeout(() => setSubmissionMessage(""), 4000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleAchievementSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingId) {
          await studentSubmissionService.updateAchievement(activeProfile.register_no, {
            id: editingId,
            ...achievementForm
          });
          setSubmissionMessage("Achievement updated successfully.");
          setStudentProfile(prev => ({
            ...prev,
            achievements: prev.achievements.map(a => a.id === editingId ? {
              ...a,
              ...achievementForm
            } : a)
          }));
        } else {
          const res = await studentSubmissionService.submitAchievement({
            registerNo: activeProfile.register_no,
            ...achievementForm
          });
          setSubmissionMessage(res.message);
          setStudentProfile(prev => ({
            ...prev,
            achievements: [...(prev.achievements || []), res.achievement]
          }));
        }
        setAchievementForm({
          title: "",
          type: "Hackathon",
          description: "",
          event: "",
          date: "",
          proof_link: ""
        });
        setActiveForm(null);
        setEditingId(null);
        setTimeout(() => setSubmissionMessage(""), 4000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleSaveCustomization = async (e) => {
      e.preventDefault();
      try {
        const res = await portfolioCustomizationService.savePortfolioCustomization(activeProfile.register_no, {
          headline: customizationForm.headline,
          about_me: customizationForm.about_me,
          career_objective: customizationForm.career_objective,
          skills: customizationForm.skills.split(",").map(s => s.trim()).filter(Boolean),
          github_url: customizationForm.github_url,
          linkedin_url: customizationForm.linkedin_url,
          email: customizationForm.email,
          phone: customizationForm.phone,
          location: customizationForm.location,
          theme: customizationForm.theme,
          visibility: customizationForm.visibility
        });
        setCustomizationMessage(res.message);
        setStudentProfile(prev => ({
          ...prev,
          headline: customizationForm.headline,
          about_me: customizationForm.about_me,
          career_objective: customizationForm.career_objective,
          skills: customizationForm.skills.split(",").map(s => s.trim()).filter(Boolean),
          github_url: customizationForm.github_url,
          linkedin_url: customizationForm.linkedin_url,
          email: customizationForm.email,
          phone: customizationForm.phone,
          location: customizationForm.location,
          theme: customizationForm.theme,
          visibility: customizationForm.visibility
        }));
        setTimeout(() => setCustomizationMessage(""), 4000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleRemoveProject = (projId) => {
      try {
        studentSubmissionService.removeProject(activeProfile.register_no, projId);
        setStudentProfile(prev => ({
          ...prev,
          projects: prev.projects.filter(p => p.id !== projId)
        }));
        setSubmissionMessage("Project removed successfully.");
        setTimeout(() => setSubmissionMessage(""), 3000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleRemoveCert = (certId) => {
      try {
        studentSubmissionService.removeCertification(activeProfile.register_no, certId);
        setStudentProfile(prev => ({
          ...prev,
          certifications: prev.certifications.filter(c => c.id !== certId)
        }));
        setSubmissionMessage("Certification removed successfully.");
        setTimeout(() => setSubmissionMessage(""), 3000);
      } catch (err) {
        console.error(err);
      }
    };

    const handleRemoveAchievement = (achId) => {
      try {
        studentSubmissionService.removeAchievement(activeProfile.register_no, achId);
        setStudentProfile(prev => ({
          ...prev,
          achievements: prev.achievements.filter(a => a.id !== achId)
        }));
        setSubmissionMessage("Achievement removed successfully.");
        setTimeout(() => setSubmissionMessage(""), 3000);
      } catch (err) {
        console.error(err);
      }
    };

    const startEditProject = (proj) => {
      setProjectForm({
        title: proj.title,
        description: proj.description,
        tech_stack: Array.isArray(proj.tech_stack) ? proj.tech_stack.join(", ") : proj.tech_stack || "",
        github_link: proj.github_link || "",
        live_link: proj.live_link || "",
        project_type: proj.project_type || "Other"
      });
      setEditingId(proj.id);
      setActiveForm("project");
    };

    const startEditCert = (cert) => {
      setCertForm({
        title: cert.title,
        issuer: cert.issuer || cert.organization || "",
        credential_id: cert.credential_id || "",
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date || "",
        verification_link: cert.verification_link || ""
      });
      setEditingId(cert.id);
      setActiveForm("certification");
    };

    const startEditAchievement = (ach) => {
      setAchievementForm({
        title: ach.title,
        type: ach.type || "Other",
        description: ach.description,
        event: ach.event || "",
        date: ach.date,
        proof_link: ach.proof_link || ""
      });
      setEditingId(ach.id);
      setActiveForm("achievement");
    };

    return (
      <div className="space-y-6 animate-fade-in text-[#111827]">
        {/* Alerts / Toast messaging */}
        {submissionMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-none font-bold text-xs uppercase tracking-wider animate-pulse flex items-center justify-between z-40 relative">
            <span>✓ {submissionMessage}</span>
            <button onClick={() => setSubmissionMessage("")} className="text-[10px] font-black uppercase text-green-900">Dismiss</button>
          </div>
        )}
        {customizationMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-none font-bold text-xs uppercase tracking-wider animate-pulse flex items-center justify-between z-40 relative">
            <span>✓ {customizationMessage}</span>
            <button onClick={() => setCustomizationMessage("")} className="text-[10px] font-black uppercase text-green-900">Dismiss</button>
          </div>
        )}

        {/* Section 1: Dashboard Home */}
        {studentSection === "dashboard" && (
          <>
            {/* KCE Official Banner */}
            <div className="bg-[#163941] p-6 rounded-none border border-[#D1D5DB] text-white shadow-none">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Student Competency Portal</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Karpagam College of Engineering Student Dashboard — Check your scoring history, manage verified projects, and view active portfolios.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="My Overall Score" value={safePercent(activeProfile?.overall_score ?? activeProfile?.overallScore, 1)} icon={GraduationCap} description="Cumulative scoring average" />
              <StatCard title="My Strongest Domain" value={activeProfile.strongest_domain} icon={Award} description="Highest skill proficiency" />
              <StatCard title="My Weakest Domain" value={activeProfile.weakest_domain} icon={AlertTriangle} description="Focus needed to improve" />
              <StatCard title="Approved Achievements" value={approvedAchievementsCount} icon={CheckCircle} description="Verified achievements log" />
              <StatCard title="Portfolio Status" value="Live" icon={ShieldCheck} description="Student360 Verified profile" />
            </div>

            {/* Chart and Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Student Domain Scores chart */}
              <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none flex flex-col justify-between">
                <div className="mb-4 border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">My Competency Strengths</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Your proficiency rates across evaluation domains</p>
                </div>
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentDomainScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: "#F7F7F7" }} contentStyle={{ background: "#163941", border: "1px solid #D1D5DB", color: "#fff", borderRadius: "0px" }} />
                      <Bar dataKey="score" fill="#214C55" radius={[0, 0, 0, 0]}>
                        {studentDomainScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#214C55" : "#C76F2B"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Student Assessment History Preview */}
              <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-3">
                    <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">My Recent Assessments</h3>
                  </div>

                  <div className="overflow-x-auto border border-[#D1D5DB] max-h-[290px] overflow-y-auto">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider sticky top-0">
                          <th className="py-2.5 px-3">Test</th>
                          <th className="py-2.5 px-3">Domain</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                        {studentPerformance.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-[#6B7280] font-bold uppercase tracking-wider">No evaluations logged.</td>
                          </tr>
                        ) : (
                          studentPerformance.slice(0, 5).map((log, idx) => (
                            <tr key={idx} className="hover:bg-[#F7F7F7] transition-colors">
                              <td className="py-3 px-3 text-[#214C55] font-black">{log.assessment_name}</td>
                              <td className="py-3 px-3"><DomainBadge domain={log.category} /></td>
                              <td className="py-3 px-3 text-center"><ScoreBadge score={log.percentage} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#214C55]">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/my-profile")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">View Profile</button>
                <button onClick={() => navigate("/my-performance")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">View Performance</button>
                <button onClick={() => navigate("/my-projects")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">Manage Projects</button>
                <button onClick={() => navigate("/my-certifications")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">Manage Certifications</button>
                <button onClick={() => navigate("/my-achievements")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">Manage Achievements</button>
                <button onClick={() => navigate("/my-resume")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">Manage Resume</button>
                <button onClick={() => navigate("/my-portfolio")} className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors">Customize Portfolio</button>
              </div>
            </div>
          </>
        )}

        {/* Section 2: Profile Summary & Edit Form */}
        {studentSection === "profile" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Account Settings</span>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyProfileSection
              profileData={myProfileData}
              setProfileData={setMyProfileData}
              message={profileMessage}
              setMessage={setProfileMessage}
              user={user}
              updateUser={useAuth().updateUser}
            />
          </div>
        )}

        {/* Section 2.5: Resume Management Section */}
        {studentSection === "resume" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Resume Builder & Attachment Manager</span>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyResumeSection
              registerNo={activeProfile.register_no}
              resumeData={resumeData}
              setResumeData={setResumeData}
              message={resumeMessage}
              setMessage={setResumeMessage}
            />
          </div>
        )}

        {/* Section 3: Performance History */}
        {studentSection === "performance" && (
          <div className="bg-white p-6 border border-[#D1D5DB] rounded-none shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-[#214C55]">My Performance</h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Comprehensive review of your domain-wise competencies and assessment logs.</p>
              </div>
              <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">Back to Dashboard</button>
            </div>

            {/* Performance KPI Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#F7F7F7] p-5 border border-[#D1D5DB] text-xs font-bold">
              <div>
                <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Overall Score</span>
                <span className="text-lg font-black text-[#214C55]">{safePercent(activeProfile?.overall_score ?? activeProfile?.overallScore, 1)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Strongest Domain</span>
                <span className="block mt-1"><DomainBadge domain={activeProfile.strongest_domain} /></span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Weakest Domain</span>
                <span className="block mt-1"><DomainBadge domain={activeProfile.weakest_domain} /></span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Evaluation Volume</span>
                <span className="text-lg font-black text-[#C76F2B]">{studentPerformance.length} Tests Logged</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Domain scores chart */}
              <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-none">
                <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-2 mb-4">Competency Strengths Chart</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentDomainScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#163941", border: "1px solid #D1D5DB", color: "#fff", borderRadius: "0px" }} />
                      <Bar dataKey="score" fill="#214C55" radius={[0, 0, 0, 0]}>
                        {studentDomainScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#214C55" : "#C76F2B"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assessment history table */}
              <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-none flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-2 mb-4">Complete Assessment History</h3>
                  <div className="overflow-x-auto border border-[#D1D5DB] max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider sticky top-0">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Assessment Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-center">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                        {studentPerformance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-[#6B7280] font-bold uppercase tracking-wider">No evaluations logged.</td>
                          </tr>
                        ) : (
                          studentPerformance.map((log, idx) => (
                            <tr key={idx} className="hover:bg-[#F7F7F7] transition-colors">
                              <td className="py-2 px-3 text-slate-500 font-mono">{log.date}</td>
                              <td className="py-2 px-3 text-[#214C55] font-black">{log.assessment_name}</td>
                              <td className="py-2 px-3"><DomainBadge domain={log.category} /></td>
                              <td className="py-2 px-3 text-center text-[#C76F2B]">{log.score}/{log.max_marks} ({log.percentage}%)</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Projects Management */}
        {studentSection === "projects" && (
          <div className="bg-white p-6 border border-[#D1D5DB] rounded-none shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-[#214C55]">My Projects</h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Submit, track, and manage your project work for mentor verification.</p>
              </div>
              <button
                onClick={() => {
                  setEditingId(null);
                  setProjectForm({
                    title: "",
                    description: "",
                    tech_stack: "",
                    github_link: "",
                    live_link: "",
                    project_type: "AI/ML"
                  });
                  setActiveForm("project");
                }}
                className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Add Project
              </button>
            </div>

            {(!activeProfile.projects || activeProfile.projects.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-[#D1D5DB] bg-[#F7F7F7]">
                <p className="text-xs text-[#6B7280] font-extrabold uppercase tracking-wider">No projects submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProfile.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="bg-[#F7F7F7] border border-[#D1D5DB] p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black uppercase text-[#214C55]">{proj.title}</h4>
                        {getStatusBadge(proj.status)}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 leading-relaxed line-clamp-3">{proj.description}</p>
                      {proj.tech_stack && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(proj.tech_stack) ? proj.tech_stack : proj.tech_stack.split(",")).map((t, i) => (
                            <span key={i} className="text-[9px] px-1 py-0.25 bg-[#E5E5E5] text-[#214C55] uppercase font-bold">{t.trim()}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-[9px] text-[#6B7280] font-bold">
                        Type: <span className="text-[#214C55] uppercase">{proj.project_type || "Other"}</span>
                        {proj.submitted_date && ` | Submitted: ${proj.submitted_date}`}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#E5E5E5] pt-3">
                      <div className="flex space-x-2">
                        {proj.github_link && (
                          <a href={proj.github_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-[#C76F2B] font-bold uppercase flex items-center space-x-0.5">
                            <span>GitHub</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                        {proj.live_link && (
                          <a href={proj.live_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-[#C76F2B] font-bold uppercase flex items-center space-x-0.5">
                            <span>Live</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingItem({ type: "project", data: proj })}
                          className="px-2.5 py-1 text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => startEditProject(proj)}
                          className="px-2.5 py-1 text-[#C76F2B] bg-white border border-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveProject(proj.id)}
                          className="px-2.5 py-1 text-red-600 bg-white border border-red-200 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 5: Certifications Management */}
        {studentSection === "certifications" && (
          <div className="bg-white p-6 border border-[#D1D5DB] rounded-none shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-[#214C55]">My Certifications</h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Submit certificates for mentor verification.</p>
              </div>
              <button
                onClick={() => {
                  setEditingId(null);
                  setCertForm({
                    title: "",
                    issuer: "",
                    credential_id: "",
                    issue_date: "",
                    expiry_date: "",
                    verification_link: ""
                  });
                  setActiveForm("certification");
                }}
                className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Add Certification
              </button>
            </div>

            {(!activeProfile.certifications || activeProfile.certifications.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-[#D1D5DB] bg-[#F7F7F7]">
                <p className="text-xs text-[#6B7280] font-extrabold uppercase tracking-wider">No certifications submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProfile.certifications.map((c, idx) => (
                  <div key={c.id || idx} className="bg-[#F7F7F7] border border-[#D1D5DB] p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-xs font-bold">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black uppercase text-[#214C55]">{c.title}</h4>
                          <span className="text-[9px] text-[#6B7280] block mt-0.5">Issuer: {c.issuer || c.organization}</span>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>
                      
                      {c.credential_id && (
                        <p className="text-[9px] font-mono text-slate-500 uppercase">ID: {c.credential_id}</p>
                      )}

                      <div className="text-[9px] text-slate-500">
                        Issued: {c.issue_date} {c.expiry_date && ` | Expires: ${c.expiry_date}`}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#E5E5E5] pt-3">
                      <div>
                        {c.verification_link && (
                          <a href={c.verification_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C76F2B] hover:underline font-extrabold uppercase flex items-center space-x-0.5">
                            <span>Credentials Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingItem({ type: "certification", data: c })}
                          className="px-2.5 py-1 text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => startEditCert(c)}
                          className="px-2.5 py-1 text-[#C76F2B] bg-white border border-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveCert(c.id)}
                          className="px-2.5 py-1 text-red-600 bg-white border border-red-200 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 6: Achievements Management */}
        {studentSection === "achievements" && (
          <div className="bg-white p-6 border border-[#D1D5DB] rounded-none shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-[#214C55]">My Achievements</h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Submit achievements, awards, internships, and participation records for mentor verification.</p>
              </div>
              <button
                onClick={() => {
                  setEditingId(null);
                  setAchievementForm({
                    title: "",
                    type: "Hackathon",
                    description: "",
                    event: "",
                    date: "",
                    proof_link: ""
                  });
                  setActiveForm("achievement");
                }}
                className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Add Achievement
              </button>
            </div>

            {(!activeProfile.achievements || activeProfile.achievements.length === 0) ? (
              <div className="text-center py-16 border border-dashed border-[#D1D5DB] bg-[#F7F7F7]">
                <p className="text-xs text-[#6B7280] font-extrabold uppercase tracking-wider">No achievements submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProfile.achievements.map((ach, idx) => (
                  <div key={ach.id || idx} className="bg-[#F7F7F7] border border-[#D1D5DB] p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black uppercase text-[#214C55]">{ach.title}</h4>
                          <span className="text-[9px] px-1 py-0.25 bg-[#214C55]/10 text-[#214C55] uppercase font-black tracking-wide rounded-none mt-0.5 inline-block">{ach.type}</span>
                        </div>
                        {getStatusBadge(ach.status)}
                      </div>
                      
                      <p className="text-[11px] font-semibold text-slate-600 leading-relaxed line-clamp-3">{ach.description}</p>
                      
                      <div className="text-[9px] text-[#6B7280] font-bold">
                        Event: <span className="text-[#214C55] uppercase">{ach.event}</span>
                        {ach.date && ` | Date: ${ach.date}`}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#E5E5E5] pt-3">
                      <div>
                        {ach.proof_link && (
                          <a href={ach.proof_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C76F2B] hover:underline font-extrabold uppercase flex items-center space-x-0.5">
                            <span>Proof Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingItem({ type: "achievement", data: ach })}
                          className="px-2.5 py-1 text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => startEditAchievement(ach)}
                          className="px-2.5 py-1 text-[#C76F2B] bg-white border border-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveAchievement(ach.id)}
                          className="px-2.5 py-1 text-red-600 bg-white border border-red-200 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 7: Portfolio Customization */}
        {studentSection === "portfolio-customization" && (
          <div className="bg-white p-6 border border-[#D1D5DB] rounded-none shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-[#214C55]">My Portfolio Customization</h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Customize your public portfolio content and visibility.</p>
              </div>
              <button 
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Back to Dashboard
              </button>
            </div>

            <form onSubmit={handleSaveCustomization} className="space-y-6 font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Portfolio Headline</label>
                  <input
                    required
                    value={customizationForm.headline}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, headline: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none"
                    placeholder="e.g. AI & DS Student | Full Stack Developer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Skills (comma-separated)</label>
                  <input
                    required
                    value={customizationForm.skills}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, skills: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none"
                    placeholder="e.g. React, Node.js, Python, PostgreSQL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#214C55]">About Me</label>
                <textarea
                  required
                  rows={4}
                  value={customizationForm.about_me}
                  onChange={(e) => setCustomizationForm({ ...customizationForm, about_me: e.target.value })}
                  className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-sans"
                  placeholder="Tell visitors about your background, projects, and programming goals..."
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#214C55]">Career Objective</label>
                <textarea
                  required
                  rows={3}
                  value={customizationForm.career_objective}
                  onChange={(e) => setCustomizationForm({ ...customizationForm, career_objective: e.target.value })}
                  className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-sans"
                  placeholder="Describe your near-term professional goals and what you hope to contribute..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">GitHub URL</label>
                  <input
                    value={customizationForm.github_url}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, github_url: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-mono"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">LinkedIn URL</label>
                  <input
                    value={customizationForm.linkedin_url}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, linkedin_url: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-mono"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Email Address</label>
                  <input
                    required
                    type="email"
                    value={customizationForm.email}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, email: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-mono"
                    placeholder="name@college.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Phone Number</label>
                  <input
                    value={customizationForm.phone}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, phone: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none font-mono"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#214C55]">Location</label>
                  <input
                    value={customizationForm.location}
                    onChange={(e) => setCustomizationForm({ ...customizationForm, location: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs font-semibold focus:outline-[#C76F2B] rounded-none"
                    placeholder="Coimbatore, Tamil Nadu"
                  />
                </div>
              </div>

              {/* Visibility checklist */}
              <div className="space-y-2 border-t border-[#E5E5E5] pt-4">
                <label className="block text-[10px] uppercase font-bold text-[#214C55]">Section Visibility Settings</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationForm.visibility.showProjects}
                      onChange={(e) => setCustomizationForm({
                        ...customizationForm,
                        visibility: { ...customizationForm.visibility, showProjects: e.target.checked }
                      })}
                      className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                    />
                    <span>Show Projects</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationForm.visibility.showCertifications}
                      onChange={(e) => setCustomizationForm({
                        ...customizationForm,
                        visibility: { ...customizationForm.visibility, showCertifications: e.target.checked }
                      })}
                      className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                    />
                    <span>Show Certifications</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationForm.visibility.showAchievements}
                      onChange={(e) => setCustomizationForm({
                        ...customizationForm,
                        visibility: { ...customizationForm.visibility, showAchievements: e.target.checked }
                      })}
                      className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                    />
                    <span>Show Achievements</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationForm.visibility.showAcademicHighlights}
                      onChange={(e) => setCustomizationForm({
                        ...customizationForm,
                        visibility: { ...customizationForm.visibility, showAcademicHighlights: e.target.checked }
                      })}
                      className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                    />
                    <span>Show Academic Metrics</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationForm.visibility.showContactLinks}
                      onChange={(e) => setCustomizationForm({
                        ...customizationForm,
                        visibility: { ...customizationForm.visibility, showContactLinks: e.target.checked }
                      })}
                      className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                    />
                    <span>Show Contact Links</span>
                  </label>
                </div>
              </div>

              {/* Resume Settings inside Portfolio Customization */}
              <div className="bg-slate-50 border border-[#D1D5DB] p-4 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-[#214C55] tracking-wide border-b border-[#D1D5DB] pb-1.5 font-sans">Resume Integration Settings</h4>
                
                <label className="flex items-center space-x-2 text-xs font-bold text-[#214C55] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!customizationForm.visibility?.showResume}
                    onChange={(e) => setCustomizationForm({
                      ...customizationForm,
                      visibility: { ...customizationForm.visibility, showResume: e.target.checked }
                    })}
                    className="rounded-none border-[#D1D5DB] text-[#C76F2B] focus:ring-0 focus:outline-[#C76F2B] w-4 h-4"
                  />
                  <span>Show Resume in Portfolio</span>
                </label>

                {resumeData?.fileName ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold pt-1">
                    <div className="sm:col-span-2">
                      <span className="block text-[9px] uppercase font-bold text-[#6B7280]">Active Resume File</span>
                      <span className="block text-slate-700 font-bold mt-1 text-[11px] truncate">{resumeData.fileName}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#214C55]">Resume Section Title</label>
                      <input
                        type="text"
                        value={customizationForm.resumeSectionTitle || ""}
                        onChange={(e) => setCustomizationForm({ ...customizationForm, resumeSectionTitle: e.target.value })}
                        className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white font-bold"
                        placeholder="e.g. My Resume"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#214C55]">Resume Button Label</label>
                      <input
                        type="text"
                        value={customizationForm.resumeButtonLabel || ""}
                        onChange={(e) => setCustomizationForm({ ...customizationForm, resumeButtonLabel: e.target.value })}
                        className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] bg-white font-bold"
                        placeholder="e.g. View Resume"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider bg-orange-50 p-2 border border-orange-200">
                    Upload resume from My Resume section first.
                  </p>
                )}
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#E5E5E5]">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase transition-colors rounded-none cursor-pointer"
                >
                  Save Customization
                </button>
                <Link
                  to={`/portfolio/${activeProfile.register_no}`}
                  className="px-6 py-2.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all rounded-none block text-center"
                >
                  Preview Portfolio
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Modal forms for project, cert, achievements */}
        {activeForm === "project" && (
          <div className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white border border-[#D1D5DB] rounded-none p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2">
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">{editingId ? "Edit Project" : "Add Project"}</h3>
                <p className="text-[10px] text-[#6B7280] font-bold">Submit technical project for review.</p>
              </div>
              <form onSubmit={handleProjectSubmit} className="space-y-3 font-semibold text-xs text-[#214C55]">
                <div>
                  <label className="block text-[10px] uppercase font-bold">Project Title</label>
                  <input
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Description</label>
                  <textarea
                    required
                    rows={2}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-sans bg-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Tech Stack (comma-separated)</label>
                    <input
                      required
                      value={projectForm.tech_stack}
                      onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                      placeholder="React, Node.js"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Project Type</label>
                    <select
                      value={projectForm.project_type}
                      onChange={(e) => setProjectForm({ ...projectForm, project_type: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold cursor-pointer"
                    >
                      <option value="AI/ML">AI/ML</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">GitHub Link</label>
                    <input
                      required
                      type="url"
                      value={projectForm.github_link}
                      onChange={(e) => setProjectForm({ ...projectForm, github_link: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Live Demo Link</label>
                    <input
                      required
                      type="url"
                      value={projectForm.live_link}
                      onChange={(e) => setProjectForm({ ...projectForm, live_link: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setActiveForm(null); setEditingId(null); }}
                    className="px-4 py-2 border border-[#D1D5DB] text-slate-700 text-[10px] font-bold uppercase rounded-none hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-[10px] font-bold uppercase rounded-none transition-colors cursor-pointer"
                  >
                    {editingId ? "Save Changes" : "Submit Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeForm === "certification" && (
          <div className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white border border-[#D1D5DB] rounded-none p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2">
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">{editingId ? "Edit Certification" : "Add Certification"}</h3>
                <p className="text-[10px] text-[#6B7280] font-bold">Submit course credential / certificate proof.</p>
              </div>
              <form onSubmit={handleCertSubmit} className="space-y-3 font-semibold text-xs text-[#214C55]">
                <div>
                  <label className="block text-[10px] uppercase font-bold">Certification Title</label>
                  <input
                    required
                    value={certForm.title}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Issuing Organization</label>
                    <input
                      required
                      value={certForm.issuer}
                      onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                      placeholder="e.g. AWS, Coursera"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Credential / Certificate ID</label>
                    <input
                      required
                      value={certForm.credential_id}
                      onChange={(e) => setCertForm({ ...certForm, credential_id: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Issue Date</label>
                    <input
                      required
                      type="date"
                      value={certForm.issue_date}
                      onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Expiry Date (optional)</label>
                    <input
                      type="date"
                      value={certForm.expiry_date}
                      onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Certificate / Verification Link</label>
                  <input
                    required
                    type="url"
                    value={certForm.verification_link}
                    onChange={(e) => setCertForm({ ...certForm, verification_link: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Upload Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full mt-1 border border-[#D1D5DB] p-1 text-xs focus:outline-[#C76F2B] rounded-none bg-slate-50 font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setActiveForm(null); setEditingId(null); }}
                    className="px-4 py-2 border border-[#D1D5DB] text-slate-700 text-[10px] font-bold uppercase rounded-none hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-[10px] font-bold uppercase rounded-none transition-colors cursor-pointer"
                  >
                    {editingId ? "Save Changes" : "Submit Certification"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeForm === "achievement" && (
          <div className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white border border-[#D1D5DB] rounded-none p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2">
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">{editingId ? "Edit Achievement" : "Add Achievement"}</h3>
                <p className="text-[10px] text-[#6B7280] font-bold">Submit honors, hackathons, or co-curricular achievements.</p>
              </div>
              <form onSubmit={handleAchievementSubmit} className="space-y-3 font-semibold text-xs text-[#214C55]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Achievement Title</label>
                    <input
                      required
                      value={achievementForm.title}
                      onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Achievement Type</label>
                    <select
                      value={achievementForm.type}
                      onChange={(e) => setAchievementForm({ ...achievementForm, type: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold cursor-pointer"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Paper Presentation">Paper Presentation</option>
                      <option value="Competition">Competition</option>
                      <option value="Internship">Internship</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Award">Award</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Description</label>
                  <textarea
                    required
                    rows={2}
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-sans bg-white font-bold"
                    placeholder="Summarize the accomplishment, scope, and results..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Event / Organization</label>
                    <input
                      required
                      value={achievementForm.event}
                      onChange={(e) => setAchievementForm({ ...achievementForm, event: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none bg-white font-bold"
                      placeholder="e.g. Ministry of Education"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold">Date</label>
                    <input
                      required
                      type="date"
                      value={achievementForm.date}
                      onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                      className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Proof URL / Link</label>
                  <input
                    required
                    type="url"
                    value={achievementForm.proof_link}
                    onChange={(e) => setAchievementForm({ ...achievementForm, proof_link: e.target.value })}
                    className="w-full mt-1 border border-[#D1D5DB] p-2 text-xs focus:outline-[#C76F2B] rounded-none font-mono bg-white font-bold"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold">Upload Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full mt-1 border border-[#D1D5DB] p-1 text-xs focus:outline-[#C76F2B] rounded-none bg-slate-50 font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setActiveForm(null); setEditingId(null); }}
                    className="px-4 py-2 border border-[#D1D5DB] text-slate-700 text-[10px] font-bold uppercase rounded-none hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-[10px] font-bold uppercase rounded-none transition-colors cursor-pointer"
                  >
                    {editingId ? "Save Changes" : "Submit Achievement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Details popup */}
        {viewingItem && (
          <div className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white border border-[#D1D5DB] rounded-none p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">
                    View Submitted {viewingItem.type}
                  </h3>
                  <p className="text-[10px] text-[#6B7280] font-bold">Submission Details & Review Status</p>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-extrabold uppercase p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#111827] font-bold">
                <div>
                  <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Title</span>
                  <span className="font-extrabold text-[#214C55] text-sm uppercase">{viewingItem.data.title}</span>
                </div>

                {viewingItem.type === "project" && (
                  <>
                    <div>
                      <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Description</span>
                      <p className="font-semibold text-slate-700 leading-relaxed font-sans">{viewingItem.data.description}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Tech Stack</span>
                      <span className="font-bold text-slate-800">{Array.isArray(viewingItem.data.tech_stack) ? viewingItem.data.tech_stack.join(", ") : viewingItem.data.tech_stack}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {viewingItem.data.github_link && (
                        <a href={viewingItem.data.github_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[#C76F2B] font-extrabold hover:underline">
                          <span>GitHub Repository</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {viewingItem.data.live_link && (
                        <a href={viewingItem.data.live_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[#C76F2B] font-extrabold hover:underline">
                          <span>Live Demo</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </>
                )}

                {viewingItem.type === "certification" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Issuer</span>
                        <span className="font-bold">{viewingItem.data.issuer || viewingItem.data.organization}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Credential ID</span>
                        <span className="font-mono">{viewingItem.data.credential_id || "N/A"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Issue Date</span>
                        <span>{viewingItem.data.issue_date}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Expiry Date</span>
                        <span>{viewingItem.data.expiry_date || "Does not expire"}</span>
                      </div>
                    </div>
                    {viewingItem.data.verification_link && (
                      <a href={viewingItem.data.verification_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[#C76F2B] font-extrabold hover:underline mt-2">
                        <span>Verification Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </>
                )}

                {viewingItem.type === "achievement" && (
                  <>
                    <div>
                      <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Type</span>
                      <span className="font-bold text-[#214C55] uppercase">{viewingItem.data.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Description</span>
                      <p className="font-semibold text-slate-700 leading-relaxed font-sans">{viewingItem.data.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Event / Organization</span>
                        <span className="font-bold">{viewingItem.data.event}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Achievement Date</span>
                        <span>{viewingItem.data.date}</span>
                      </div>
                    </div>
                    {viewingItem.data.proof_link && (
                      <a href={viewingItem.data.proof_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[#C76F2B] font-extrabold hover:underline mt-2">
                        <span>Proof / Certificate Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </>
                )}

                <div className="bg-[#F7F7F7] p-2.5 border border-[#D1D5DB] flex justify-between items-center mt-3">
                  <span className="text-[9px] uppercase font-extrabold text-[#6B7280]">Verification Status</span>
                  {getStatusBadge(viewingItem.data.status)}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E5E5] flex justify-end">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 bg-[#214C55] text-white text-[10px] font-bold uppercase rounded-none hover:bg-[#163941] transition-colors cursor-pointer"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper to switch section and sync sidebar highlight
  const handleSectionSwitch = (section) => {
    setAdminSection(section);
    if (section === "manage-students") {
      loadAdminStudents();
    } else if (section === "manage-users") {
      loadAdminUsers();
    }
    window.dispatchEvent(
      new CustomEvent("admin-sidebar-action", {
        detail: section
      })
    );
  };

  // ==========================================
  // 4. ADMIN DASHBOARD VIEW
  // ==========================================
  if (role === "admin") {
    return (
      <div className="space-y-6 animate-fade-in text-[#111827]">
        {/* Render views based on adminSection state */}
        {adminSection === "dashboard" && (
          <>
            {/* KCE Official Banner */}
            <div className="bg-[#163941] p-6 rounded-none border border-[#D1D5DB] text-white shadow-none">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">System Admin Dashboard</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Karpagam College of Engineering Student Intelligence Portal — System administration, verify active accounts, manage database imports, and inspect activity logs.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total Students" value={totalStudents} icon={Users} description="Registered student accounts" />
              <StatCard title="Total Faculty" value={totalFacultyCount} icon={GraduationCap} description="Registered faculty roles" />
              <StatCard title="Total Mentors" value={totalMentorsCount} icon={CheckSquare} description="Assigned mentors" />
              <StatCard 
                title="Total Uploaded Scores" 
                value={uploadedScoresCount} 
                icon={Upload} 
                description="Assessment sheets processed" 
                onIconClick={() => navigate("/admin/upload-scores")}
              />
              <StatCard title="System Status" value="Online" icon={Settings} description="Database connection live" trend="Active" trendType="positive" />
            </div>

            {/* Admin Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Class / Department Overview */}
              <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Department Analytics Overview</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Aggregated enrollment and average metric indexes by department</p>
                </div>
                
                <div className="overflow-x-auto border border-[#D1D5DB]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3 text-center">Enrollment</th>
                        <th className="py-2.5 px-3 text-center">Score Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Artificial Intelligence & Data Science</td>
                        <td className="py-2.5 px-3 text-center">45</td>
                        <td className="py-2.5 px-3 text-center">88.5%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Information Technology</td>
                        <td className="py-2.5 px-3 text-center">60</td>
                        <td className="py-2.5 px-3 text-center">82.1%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Computer Science & Engineering</td>
                        <td className="py-2.5 px-3 text-center">120</td>
                        <td className="py-2.5 px-3 text-center">84.6%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Electronics & Communication Engineering</td>
                        <td className="py-2.5 px-3 text-center">90</td>
                        <td className="py-2.5 px-3 text-center">78.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Recent Activity Logs</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Recent system transactions and audit trails</p>
                </div>
                
                <div className="space-y-3 font-semibold text-xs text-[#6B7280]">
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8371 — TODAY</span>
                    <p className="text-[#111827] mt-0.5">Faculty Ramanujam generated placement recommendations report.</p>
                  </div>
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8370 — TODAY</span>
                    <p className="text-[#111827] mt-0.5">Dr. Monisha R verified achievement credentials for Student Shahul.</p>
                  </div>
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8369 — YESTERDAY</span>
                    <p className="text-[#111827] mt-0.5">Excel Ingestion Engine compiled assessment score uploads.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {adminSection === "manage-students" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Manage Students</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Add, edit, remove, and manage student records.
              </p>
            </div>

            <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
                <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider">Students Directory</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveModal('addStudent')} 
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserPlus size={14} />
                    Add Student
                  </button>
                  <button 
                    onClick={() => setActiveModal('removeStudentBulk')} 
                    className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserMinus size={14} />
                    Remove Student Bulk
                  </button>
                  <button 
                    onClick={() => { setBulkUploadType("students"); setIsBulkUploadOpen(true); }}
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <Upload size={14} />
                    Upload Excel
                  </button>
                  <button 
                    onClick={() => handleDownloadTemplate("students")}
                    className="px-4 py-2 bg-white border border-[#C76F2B] text-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    Download Template
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#D1D5DB]">
                {adminStudentsLoading ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-500">
                    Loading students from server...
                  </div>
                ) : adminStudentsError ? (
                  <div className="p-8 text-center text-xs font-bold text-red-600">
                    {adminStudentsError}
                  </div>
                ) : adminStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-500">
                    No students found.
                  </div>
                ) : (
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
                      {adminStudents.map((s) => {
                        const displayStatus = s.status || (s.is_active ? "Active" : "Inactive");
                        return (
                          <tr key={s.id} className="hover:bg-[#F7F7F7] transition-colors">
                            <td className="py-2.5 px-4 text-[#C76F2B]">{s.register_no}</td>
                            <td className="py-2.5 px-4 text-[#214C55]">{s.name}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">{s.department}</td>
                            <td className="py-2.5 px-4 text-center">{s.year}</td>
                            <td className="py-2.5 px-4 text-center">{s.section}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                                displayStatus === "Inactive" 
                                  ? "bg-red-50 text-red-700 border-red-200" 
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}>
                                {displayStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="flex justify-center space-x-1.5">
                                <button 
                                  onClick={() => { setSelectedItem(s); setActiveModal('viewStudent'); }} 
                                  title="View Details"
                                  className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedItem(s); setActiveModal('editStudent'); }} 
                                  title="Edit Student"
                                  className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedItem(s); setActiveModal('confirmRemoveStudent'); }} 
                                  title="Remove Student"
                                  className="p-1 text-red-650 hover:bg-red-50 border border-red-205 flex items-center justify-center animate-fade-in"
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
                )}
              </div>
            </div>
          </div>
        )}

        {adminSection === "manage-faculty" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Manage Faculty</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Add, edit, remove, and manage faculty accounts.
              </p>
            </div>

            <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
                <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider">Faculty Directory</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveModal('addFaculty')} 
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserPlus size={14} />
                    Add Faculty
                  </button>
                  <button 
                    onClick={() => setActiveModal('removeFacultyBulk')} 
                    className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserMinus size={14} />
                    Remove Faculty Bulk
                  </button>
                  <button 
                    onClick={() => { setBulkUploadType("faculty"); setIsBulkUploadOpen(true); }}
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <Upload size={14} />
                    Upload Excel
                  </button>
                  <button 
                    onClick={() => handleDownloadTemplate("faculty")}
                    className="px-4 py-2 bg-white border border-[#C76F2B] text-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    Download Template
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
                    {faculties.map((f) => (
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
                              onClick={() => { setSelectedItem(f); setActiveModal('viewFaculty'); }} 
                              title="View Details"
                              className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center animate-fade-in"
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(f); setActiveModal('editFaculty'); }} 
                              title="Edit Faculty"
                              className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(f); setActiveModal('confirmRemoveFaculty'); }} 
                              title="Remove Faculty"
                              className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center animate-fade-in"
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
          </div>
        )}

        {adminSection === "manage-mentors" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Manage Mentors</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Manage class mentors and placement mentors.
              </p>
            </div>

            <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E5]">
                <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider">Mentors Directory</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveModal('addMentor')} 
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserPlus size={14} />
                    Add Mentor
                  </button>
                  <button 
                    onClick={() => setActiveModal('removeMentorBulk')} 
                    className="px-4 py-2 bg-[#163941] hover:bg-[#214C55] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <UserMinus size={14} />
                    Remove Mentor Bulk
                  </button>
                  <button 
                    onClick={() => { setBulkUploadType("mentors"); setIsBulkUploadOpen(true); }}
                    className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    <Upload size={14} />
                    Upload Excel
                  </button>
                  <button 
                    onClick={() => handleDownloadTemplate("mentors")}
                    className="px-4 py-2 bg-white border border-[#C76F2B] text-[#C76F2B] hover:bg-[#C76F2B] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
                  >
                    Download Template
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
                              onClick={() => { setSelectedItem(m); setActiveModal('viewMentor'); }} 
                              title="View Details"
                              className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center animate-fade-in"
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(m); setActiveModal('editMentor'); }} 
                              title="Edit Mentor"
                              className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(m); setActiveModal('confirmRemoveMentor'); }} 
                              title="Remove Mentor"
                              className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center animate-fade-in"
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
          </div>
        )}

        {adminSection === "assign-mentor" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Assign Mentor</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Assign mentors to a class or selected students.
              </p>
            </div>

            <div className="bg-white p-6 border border-[#D1D5DB] rounded-none max-w-xl">
              <AssignMentorInlineForm mentors={mentors} onAssign={handleAssignMentor} />
            </div>
          </div>
        )}

        {adminSection === "manage-users" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Manage Users</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                View, edit, activate, deactivate, or remove user accounts.
              </p>
            </div>

            <div className="bg-white p-6 border border-[#D1D5DB] rounded-none space-y-4">
              <div className="border-b border-[#E5E5E5] pb-3">
                <h3 className="text-xs font-extrabold text-[#214C55] uppercase tracking-wider">User Roles & Accounts</h3>
                <p className="text-[11px] text-[#6B7280]">Inspect user accounts, assign roles, and activate/deactivate accounts.</p>
              </div>

              <div className="overflow-x-auto border border-[#D1D5DB]">
                {adminUsersLoading ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-500">
                    Loading users from server...
                  </div>
                ) : adminUsersError ? (
                  <div className="p-8 text-center text-xs font-bold text-red-600">
                    {adminUsersError}
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-500">
                    No users found.
                  </div>
                ) : (
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
                      {usersList.map((u) => {
                        const displayName = u.name || u.username || u.email;
                        const displayDept = u.department || "-";
                        const displayStatus = u.status || (u.is_active ? "Active" : "Inactive");
                        return (
                          <tr key={u.id} className="hover:bg-[#F7F7F7] transition-colors">
                            <td className="py-2.5 px-4 text-[#214C55]">{displayName}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">{u.email}</td>
                            <td className="py-2.5 px-4 uppercase text-[10px] text-[#C76F2B] font-extrabold">{u.role}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">{displayDept}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                                displayStatus === "Inactive" 
                                  ? "bg-red-50 text-red-700 border-red-200" 
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}>
                                {displayStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="flex justify-center space-x-1.5 animate-fade-in">
                                <button 
                                  onClick={() => { setSelectedItem(u); setActiveModal('viewUser'); }} 
                                  title="View Details"
                                  className="p-1 text-[#214C55] hover:bg-[#214C55]/10 border border-[#214C55]/20 flex items-center justify-center animate-fade-in"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedItem(u); setActiveModal('editUser'); }} 
                                  title="Edit User"
                                  className="p-1 text-[#C76F2B] hover:bg-[#C76F2B]/10 border border-[#C76F2B]/20 flex items-center justify-center"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => handleToggleUserStatus(u.id)} 
                                  className={`px-2 py-1 text-[10px] font-extrabold border transition-all ${
                                    displayStatus === "Inactive"
                                      ? "border-green-300 text-green-700 hover:bg-green-50"
                                      : "border-orange-300 text-orange-700 hover:bg-orange-50"
                                  }`}
                                >
                                  {displayStatus === "Inactive" ? "Activate" : "Deactivate"}
                                </button>
                                <button 
                                  onClick={() => { setSelectedItem(u); setActiveModal('confirmRemoveUser'); }} 
                                  title="Remove User"
                                  className="p-1 text-red-650 hover:bg-red-50 border border-red-200 flex items-center justify-center"
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
                )}
              </div>
            </div>
          </div>
        )}

        {adminSection === "system-overview" && (
          <div className="space-y-6">
            <div className="bg-[#163941] p-6 rounded-none text-white border border-[#D1D5DB]">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">System Overview</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                View institution-wide Student360 usage and system status.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total Students" value={totalStudents} icon={Users} description="Registered student accounts" />
              <StatCard title="Total Faculty" value="8" icon={GraduationCap} description="Registered faculty roles" />
              <StatCard title="Total Mentors" value="12" icon={CheckSquare} description="Assigned mentors" />
              <StatCard 
                title="Total Uploaded Scores" 
                value={uploadedScoresCount} 
                icon={Upload} 
                description="Assessment sheets processed" 
                onIconClick={() => navigate("/admin/upload-scores")}
              />
              <StatCard title="System Status" value="Online" icon={Settings} description="Database connection live" trend="Active" trendType="positive" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Department Analytics Overview</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Aggregated enrollment and average metric indexes by department</p>
                </div>
                
                <div className="overflow-x-auto border border-[#D1D5DB]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3 text-center">Enrollment</th>
                        <th className="py-2.5 px-3 text-center">Score Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Artificial Intelligence & Data Science</td>
                        <td className="py-2.5 px-3 text-center">45</td>
                        <td className="py-2.5 px-3 text-center">88.5%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Information Technology</td>
                        <td className="py-2.5 px-3 text-center">60</td>
                        <td className="py-2.5 px-3 text-center">82.1%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Computer Science & Engineering</td>
                        <td className="py-2.5 px-3 text-center">120</td>
                        <td className="py-2.5 px-3 text-center">84.6%</td>
                      </tr>
                      <tr className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="py-2.5 px-3 text-[#214C55]">Electronics & Communication Engineering</td>
                        <td className="py-2.5 px-3 text-center">90</td>
                        <td className="py-2.5 px-3 text-center">78.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Recent Activity Logs</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Recent system transactions and audit trails</p>
                </div>
                
                <div className="space-y-3 font-semibold text-xs text-[#6B7280]">
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8371 — TODAY</span>
                    <p className="text-[#111827] mt-0.5">Faculty Ramanujam generated placement recommendations report.</p>
                  </div>
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8370 — TODAY</span>
                    <p className="text-[#111827] mt-0.5">Dr. Monisha R verified achievement credentials for Student Shahul.</p>
                  </div>
                  <div className="p-2.5 bg-[#F7F7F7] border border-[#D1D5DB] rounded-none">
                    <span className="text-[9px] text-[#C76F2B] font-extrabold block">TRANS_8369 — YESTERDAY</span>
                    <p className="text-[#111827] mt-0.5">Excel Ingestion Engine compiled assessment score uploads.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminSection === "profile" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Account Settings</span>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyProfileSection
              profileData={myProfileData}
              setProfileData={setMyProfileData}
              message={profileMessage}
              setMessage={setProfileMessage}
              user={user}
              updateUser={useAuth().updateUser}
            />
          </div>
        )}

        {/* Overlay forms and confirmations */}
        <AddStudentModal
          isOpen={activeModal === 'addStudent'}
          onClose={() => setActiveModal(null)}
          onSave={handleAddStudent}
        />
        <ViewStudentModal
          isOpen={activeModal === 'viewStudent'}
          onClose={() => setActiveModal(null)}
          student={selectedItem}
          onEditClick={(student) => { setSelectedItem(student); setActiveModal('editStudent'); }}
        />
        <EditStudentModal
          isOpen={activeModal === 'editStudent'}
          onClose={() => setActiveModal(null)}
          student={selectedItem}
          onSave={handleEditStudent}
        />
        <ConfirmRemoveStudentModal
          isOpen={activeModal === 'confirmRemoveStudent'}
          onClose={() => setActiveModal(null)}
          student={selectedItem}
          onRemove={handleRemoveStudent}
        />
        <RemoveStudentModal
          isOpen={activeModal === 'removeStudentBulk'}
          onClose={() => setActiveModal(null)}
          onRemove={handleRemoveStudent}
        />

        {/* Faculty Overlay Modals */}
        <AddFacultyModal
          isOpen={activeModal === 'addFaculty'}
          onClose={() => setActiveModal(null)}
          onSave={handleAddFaculty}
        />
        <ViewFacultyModal
          isOpen={activeModal === 'viewFaculty'}
          onClose={() => setActiveModal(null)}
          faculty={selectedItem}
          onEditClick={(fac) => { setSelectedItem(fac); setActiveModal('editFaculty'); }}
        />
        <EditFacultyModal
          isOpen={activeModal === 'editFaculty'}
          onClose={() => setActiveModal(null)}
          faculty={selectedItem}
          onSave={handleEditFaculty}
        />
        <ConfirmRemoveFacultyModal
          isOpen={activeModal === 'confirmRemoveFaculty'}
          onClose={() => setActiveModal(null)}
          faculty={selectedItem}
          onRemove={handleRemoveFaculty}
        />
        <RemoveFacultyModal
          isOpen={activeModal === 'removeFacultyBulk'}
          onClose={() => setActiveModal(null)}
          onRemove={handleRemoveFaculty}
        />

        {/* Mentor Overlay Modals */}
        <AddMentorModal
          isOpen={activeModal === 'addMentor'}
          onClose={() => setActiveModal(null)}
          onSave={handleAddMentor}
        />
        <ViewMentorModal
          isOpen={activeModal === 'viewMentor'}
          onClose={() => setActiveModal(null)}
          mentor={selectedItem}
          onEditClick={(men) => { setSelectedItem(men); setActiveModal('editMentor'); }}
        />
        <EditMentorModal
          isOpen={activeModal === 'editMentor'}
          onClose={() => setActiveModal(null)}
          mentor={selectedItem}
          onSave={handleEditMentor}
        />
        <ConfirmRemoveMentorModal
          isOpen={activeModal === 'confirmRemoveMentor'}
          onClose={() => setActiveModal(null)}
          mentor={selectedItem}
          onRemove={handleRemoveMentor}
        />
        <RemoveMentorModal
          isOpen={activeModal === 'removeMentorBulk'}
          onClose={() => setActiveModal(null)}
          onRemove={handleRemoveMentor}
        />

        {/* Users Overlay Modals */}
        <ViewUserModal
          isOpen={activeModal === 'viewUser'}
          onClose={() => setActiveModal(null)}
          user={selectedItem}
        />
        <EditUserModal
          isOpen={activeModal === 'editUser'}
          onClose={() => setActiveModal(null)}
          user={selectedItem}
          onSave={handleEditUser}
        />
        <ConfirmRemoveUserModal
          isOpen={activeModal === 'confirmRemoveUser'}
          onClose={() => setActiveModal(null)}
          user={selectedItem}
          onRemove={handleRemoveUser}
        />
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          type={bulkUploadType}
          onUploadSuccess={async () => {
            if (bulkUploadType === "students") {
              const updated = await studentService.getAllStudents();
              setStudents(updated);
              loadAdminStudents();
            } else if (bulkUploadType === "faculty") {
              const updated = await adminUploadService.getFacultyList();
              setFaculties(updated);
            } else if (bulkUploadType === "mentors") {
              const updated = await adminUploadService.getMentorsList();
              setMentors(updated);
            }
          }}
        />
      </div>
    );
  }

  // ==========================================
  // 5. PLACEMENT MENTOR DASHBOARD VIEW
  // ==========================================
  if (role === "placement_mentor") {
    const readyStudents = students.filter((s) => s.overall_score >= 82);
    const needTraining = students.filter((s) => s.overall_score < 78);

    return (
      <div className="space-y-6 animate-fade-in text-[#111827]">
        {staffSection === "profile" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Account Settings</span>
              <button
                onClick={() => setStaffSection("dashboard")}
                className="px-4 py-1.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MyProfileSection
              profileData={myProfileData}
              setProfileData={setMyProfileData}
              message={profileMessage}
              setMessage={setProfileMessage}
              user={user}
              updateUser={useAuth().updateUser}
            />
          </div>
        ) : (
          <>
            {/* KCE Official Banner */}
            <div className="bg-[#163941] p-6 rounded-none border border-[#D1D5DB] text-white shadow-none">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">Placement Intelligence Dashboard</h1>
              <p className="text-xs text-[#E5E5E5] font-semibold mt-1.5 leading-relaxed">
                Karpagam College of Engineering Student Intelligence Portal — Shortlist candidates ready for recruitment, analyze coding competencies, and track training targets.
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Placement Ready Students" value={readyStudents.length} icon={Users} description="Scoring above 82% threshold" />
              <StatCard title="Top Coding Candidates" value={students.filter((s) => (s.domain_scores.Coding || 0) >= 90).length} icon={Award} description="Coding scores >= 90%" />
              <StatCard title="Top Aptitude Candidates" value={students.filter((s) => (s.domain_scores.Aptitude || 0) >= 80).length} icon={GraduationCap} description="Aptitude scores >= 80%" />
              <StatCard title="Top Full Stack Candidates" value={students.filter((s) => (s.domain_scores.FullStack || 0) >= 90).length} icon={Cpu} description="Full Stack scores >= 90%" />
              <StatCard title="Students Needing Training" value={needTraining.length} icon={AlertTriangle} description="Averages below 78% proficiency" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Students for Placement */}
              <div className="lg:col-span-7 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Placement Eligible Roster</h3>
                    <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Top shortlist matching candidate eligibility thresholds</p>
                  </div>
                  <Link to="/recommendations" className="text-xs font-bold text-[#C76F2B] hover:text-[#A8561F] hover:underline uppercase tracking-wider">
                    Generate Full List
                  </Link>
                </div>

                <div className="overflow-x-auto border border-[#D1D5DB]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3">Strongest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      {readyStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-2 px-3 text-[#214C55]">
                            <Link to={`/students/${st.id}`} className="hover:underline font-black">{st.name}</Link>
                            <span className="block text-[9px] text-[#6B7280] mt-0.5">{st.register_no}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <ScoreBadge score={st.overall_score} />
                          </td>
                          <td className="py-2 px-3">
                            <DomainBadge domain={st.strongest_domain} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Students Needing Training */}
              <div className="lg:col-span-5 bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
                <div className="border-b border-[#E5E5E5] pb-3">
                  <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Training Priority Targets</h3>
                  <p className="text-xs text-[#6B7280] font-semibold mt-0.5">Students prioritized for skill remediation</p>
                </div>

                <div className="overflow-x-auto border border-[#D1D5DB]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3">Weakest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      {needTraining.slice(0, 5).map((st) => (
                        <tr key={st.id} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-2 px-3 text-[#214C55]">
                            <Link to={`/students/${st.id}`} className="hover:underline font-black">{st.name}</Link>
                            <span className="block text-[9px] text-[#6B7280] mt-0.5">{st.register_no}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <ScoreBadge score={st.overall_score} />
                          </td>
                          <td className="py-2 px-3">
                            <DomainBadge domain={st.weakest_domain} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Actions for placement mentor */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#214C55]">Placement Utilities</h3>
              <div className="flex flex-wrap gap-3">
                <Link to="/recommendations" className="px-4 py-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider">Query Talent List</Link>
                <Link to="/leaderboard" className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider">View Leaderboards</Link>
                <Link to="/students" className="px-4 py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider">View Student Profiles</Link>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Fallback default
  return null;
};
export default FacultyDashboard;
