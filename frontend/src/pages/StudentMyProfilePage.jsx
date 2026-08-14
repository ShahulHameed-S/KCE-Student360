import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentService } from "../services/studentService";
import { portfolioCustomizationService } from "../services/portfolioCustomizationService";
import { profileService } from "../services/profileService";
import { getStudentImageUrl } from "../utils/imageUtils";
import { useAuth } from "../hooks/useAuth";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  User,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Award,
  CheckSquare,
  FileText,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  MapPin,
  Palette,
  Eye,
  EyeOff,
  Upload,
  Save,
  Info
} from "lucide-react";

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" rx="1" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

import { mockPerformance } from "../data/mockPerformance";

export const StudentMyProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit / Customization states
  const [formData, setFormData] = useState({
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
    resume_visibility: true
  });
  
  const [isEditingCustomization, setIsEditingCustomization] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationMessage, setCustomizationMessage] = useState("");

  // Image Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState("");

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch student profile using /students/me
      const rawData = await studentService.getStudentProfile("me");
      
      // Normalize profile data
      const rawProfile = rawData?.data || rawData;
      const profileData =
        rawProfile?.student ||
        rawProfile?.profile ||
        rawProfile?.data?.student ||
        rawProfile?.data?.profile ||
        rawProfile?.data ||
        rawProfile;

      if (!profileData || (!profileData.register_no && !profileData.registerNo)) {
        console.error("Profile data missing after normalization:", rawData);
        throw new Error("Unable to load profile data. Missing register number.");
      }

      const registerNo = profileData.register_no || profileData.registerNo;

      // Fetch customization data
      let customizationData = null;
      try {
        customizationData = await portfolioCustomizationService.getPortfolioCustomization(registerNo);
      } catch (custErr) {
        console.warn("Customization load failed:", custErr);
      }

      // Fetch performance logs using registerNo or default
      let perfLogs = [];
      try {
        const perfData = await studentService.getStudentPerformance(registerNo);
        perfLogs = perfData?.data || perfData;
      } catch (perfErr) {
        console.warn("Performance load failed, using mock data:", perfErr);
        perfLogs = mockPerformance[registerNo] || [];
      }

      setStudent(profileData);
      setPerformance(perfLogs);

      // Prepopulate form data
      setFormData({
        headline: customizationData?.headline || profileData?.headline || "Aspiring AI Engineer & Developer",
        about_me: customizationData?.about_me || profileData?.about_me || profileData?.about || "",
        career_objective: customizationData?.career_objective || profileData?.career_objective || "",
        skills: Array.isArray(customizationData?.skills)
          ? customizationData.skills.join(", ")
          : Array.isArray(profileData?.skills)
            ? profileData.skills.join(", ")
            : "",
        github_url: customizationData?.github_url || profileData?.github_url || "",
        linkedin_url: customizationData?.linkedin_url || profileData?.linkedin_url || "",
        email: customizationData?.email || profileData?.email || "",
        phone: customizationData?.phone || profileData?.phone || "",
        location: customizationData?.location || profileData?.location || "Coimbatore, Tamil Nadu",
        theme: customizationData?.theme || "Dark Minimal",
        resume_visibility: customizationData?.resume_visibility !== undefined ? customizationData.resume_visibility : true
      });
    } catch (err) {
      console.error("Failed to load student profile:", err);
      const detailMsg = err.response?.data?.detail;
      let errorMsg = "";
      if (typeof detailMsg === "string") {
        errorMsg = detailMsg;
      } else if (detailMsg && typeof detailMsg === "object") {
        errorMsg = detailMsg.message || JSON.stringify(detailMsg);
      } else if (err.message) {
        errorMsg = err.message;
      } else {
        errorMsg = "Unable to open your student profile.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auth Guard check: only student role is allowed
    if (user && user.role !== "student") {
      navigate("/dashboard", { replace: true });
      return;
    }

    fetchMyProfile();
  }, [user, navigate]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setImageMessage("Invalid format. Please upload PNG, JPG, JPEG, or WEBP.");
      setTimeout(() => setImageMessage(""), 5000);
      return;
    }

    try {
      setUploadingImage(true);
      setImageMessage("Uploading image...");
      const res = await profileService.uploadProfileImage(file);
      const publicUrl = res.avatar_url || res.profile_image_url || res.image_url || res.profileImage || res.profile_image;
      
      // Update local state
      setStudent(prev => ({
        ...prev,
        profile_image: publicUrl
      }));
      setImageMessage("Profile image updated successfully!");
      setTimeout(() => setImageMessage(""), 4000);
    } catch (err) {
      console.error("Profile image upload failed:", err);
      setImageMessage("Profile image upload will be saved through Supabase Storage.");
      setTimeout(() => setImageMessage(""), 5000);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCustomizationSave = async (e) => {
    e.preventDefault();
    try {
      setSavingCustomization(true);
      setCustomizationMessage("");
      const registerNo = student.register_no || student.registerNo;

      const payload = {
        headline: formData.headline,
        about_me: formData.about_me,
        career_objective: formData.career_objective,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        theme: formData.theme,
        resume_visibility: formData.resume_visibility
      };

      const res = await portfolioCustomizationService.savePortfolioCustomization(registerNo, payload);
      
      // Update local student model too
      setStudent(prev => ({
        ...prev,
        headline: payload.headline,
        about_me: payload.about_me,
        career_objective: payload.career_objective,
        skills: payload.skills,
        email: payload.email,
        phone: payload.phone,
        location: payload.location
      }));

      setCustomizationMessage("Customization saved successfully!");
      setIsEditingCustomization(false);
      setTimeout(() => setCustomizationMessage(""), 4000);
    } catch (err) {
      console.error("Save customization failed:", err);
      const detailMsg = err.response?.data?.detail || "Unable to save customization. Please try again.";
      setCustomizationMessage(typeof detailMsg === "string" ? detailMsg : "Verification failed.");
      setTimeout(() => setCustomizationMessage(""), 5000);
    } finally {
      setSavingCustomization(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Retrieving your student profile..." />;
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-[#B91C1C] px-6 py-4 rounded-none max-w-lg mx-auto text-center mt-12 shadow-none font-bold">
        <h3 className="font-bold text-base uppercase">Unable to open student profile</h3>
        <p className="text-xs mt-1 font-semibold">{error || "Your profile could not be loaded."}</p>
      </div>
    );
  }

  // Prepping domain scores
  const pScores = student.domain_scores || student.domainScores || {};
  const coding = pScores.Coding || 0;
  const dsa = pScores.DSA || 0;
  const aptitude = pScores.Aptitude || 0;
  const tech = pScores.Technical || 0;
  const acad = pScores.Academic || 0;

  // Placement Readiness Calculation
  const readinessScore = Math.round(
    (coding * 0.35) +
    (dsa * 0.25) +
    (aptitude * 0.20) +
    (tech * 0.10) +
    (acad * 0.10)
  );

  let readinessStatus = "Needs Prep";
  let readinessColor = "text-amber-700 bg-amber-50 border-amber-300";
  if (readinessScore >= 90) {
    readinessStatus = "Super Dream Career Ready";
    readinessColor = "text-purple-700 bg-purple-50 border-purple-300";
  } else if (readinessScore >= 80) {
    readinessStatus = "Dream Career Ready";
    readinessColor = "text-emerald-700 bg-emerald-55 border-emerald-300";
  } else if (readinessScore >= 65) {
    readinessStatus = "Service Sector Ready";
    readinessColor = "text-indigo-700 bg-indigo-50 border-indigo-300";
  }

  // Related collections
  const projects = Array.isArray(student.projects) ? student.projects : [];
  const certifications = Array.isArray(student.certifications) ? student.certifications : [];
  const achievements = Array.isArray(student.achievements) ? student.achievements : [];

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* Header Panel */}
      <div className="border-b border-[#D1D5DB] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 shadow-sm border-t-4 border-t-[#214C55]">
        <div className="text-left">
          <h1 className="text-xl font-extrabold text-[#214C55] uppercase tracking-wider">My Profile</h1>
          <p className="text-xs text-[#6B7280] font-semibold mt-1">Personal academic overview, competency mappings, and portfolio customization.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-extrabold text-white bg-[#C76F2B] px-3 py-1 uppercase tracking-widest">
            Student Account
          </span>
        </div>
      </div>

      {/* Main Grid: Left Profile Card & Right About/Objective Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Left Profile Card: Photo Upload & Personal Info */}
        <div className="bg-white rounded-none border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div className="text-center space-y-4">
            
            {/* Avatar / Profile photo display */}
            <div className="relative group w-28 h-28 mx-auto">
              {getStudentImageUrl(student) ? (
                <img
                  src={getStudentImageUrl(student)}
                  alt={student.name || "Student"}
                  className="w-28 h-28 rounded-none object-cover border border-[#D1D5DB] mx-auto shadow-none"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const fallback = e.target.parentElement?.querySelector('.avatar-profile-fallback');
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div className={`avatar-profile-fallback w-28 h-28 rounded-none bg-[#F7F7F7] border border-[#D1D5DB] text-[#214C55] mx-auto text-4xl font-black shadow-none items-center justify-center ${getStudentImageUrl(student) ? "hidden" : "flex"}`}>
                {(student.name || "U").charAt(0)}
              </div>
              
              {/* Upload Overlay Button */}
              <label className="absolute bottom-0 right-0 bg-[#214C55] text-white p-1.5 cursor-pointer hover:bg-[#C76F2B] transition-all border border-white">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {imageMessage && (
              <p className="text-[10px] text-[#C76F2B] font-bold text-center">{imageMessage}</p>
            )}

            <div>
              <h2 className="text-lg font-extrabold text-[#214C55] uppercase tracking-wider">{student.name || "N/A"}</h2>
              <p className="text-xs text-[#6B7280] font-bold mt-0.5">{student.register_no || student.registerNo || "N/A"}</p>
            </div>

            {/* General Info */}
            <div className="pt-4 border-t border-[#E5E5E5] grid grid-cols-2 gap-4 text-left text-xs font-bold text-[#6B7280]">
              <div>
                <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Department</span>
                <span className="text-[#214C55] font-extrabold block mt-0.5">{student.department || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Class</span>
                <span className="text-[#214C55] font-extrabold block mt-0.5">
                  {student.year || student.section ? `Year ${student.year || "N/A"} - ${student.section || "N/A"}` : "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Batch</span>
                <span className="text-[#214C55] font-extrabold block mt-0.5">{student.batch || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">CGPA</span>
                <span className="text-[#214C55] font-extrabold block mt-0.5">{student.cgpa || "N/A"}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#F3F4F6] flex items-center space-x-2 text-slate-650">
                <Mail size={13} className="text-[#6B7280]" />
                <span className="text-[#214C55] font-extrabold lowercase text-[11px] truncate">{student.email || "N/A"}</span>
              </div>
              <div className="col-span-2 pt-1 flex items-center space-x-2 text-slate-650">
                <Phone size={13} className="text-[#6B7280]" />
                <span className="text-[#214C55] font-extrabold text-[11px]">{student.phone || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Right Customization Panel: About Me, Career Objective & Skills */}
        <div className="lg:col-span-2 bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm flex flex-col justify-between space-y-4">
          <div className="text-left space-y-4">
            
            <div className="border-b border-[#E5E5E5] pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">About Me & Career Goals</h3>
                <p className="text-xs text-[#6B7280] font-semibold">Tell your story, highlight your core skills, and customize your portfolio introduction.</p>
              </div>
              {!isEditingCustomization && (
                <button
                  onClick={() => setIsEditingCustomization(true)}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#214C55] hover:bg-[#C76F2B] transition-all"
                >
                  Edit Profile Data
                </button>
              )}
            </div>

            {isEditingCustomization ? (
              <form onSubmit={handleCustomizationSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1">Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. AI & DS Student | Full Stack Web Developer"
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1">About Me Description</label>
                  <textarea
                    rows="3"
                    value={formData.about_me}
                    onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
                    placeholder="Write a brief background about yourself..."
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1">Career Objective</label>
                  <textarea
                    rows="2"
                    value={formData.career_objective}
                    onChange={(e) => setFormData({ ...formData, career_objective: e.target.value })}
                    placeholder="Describe your professional goals..."
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="e.g. React, Java, Python, SQL, Git"
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
                  />
                </div>

                {customizationMessage && (
                  <p className="text-xs text-[#C76F2B] font-bold">{customizationMessage}</p>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingCustomization}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-all flex items-center space-x-1.5"
                  >
                    <Save size={14} />
                    <span>{savingCustomization ? "Saving..." : "Save Changes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCustomization(false);
                      setCustomizationMessage("");
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-[#C76F2B] uppercase tracking-wider">Headline / Professional Title</h4>
                  <p className="text-sm font-extrabold text-[#214C55] mt-1">{formData.headline || "N/A"}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[#C76F2B] uppercase tracking-wider">About Me</h4>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed mt-1 whitespace-pre-line">
                    {formData.about_me || "Share details about your education, background, and research focus here. Click 'Edit Profile Data' to customize this."}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[#C76F2B] uppercase tracking-wider">Career Objective</h4>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed mt-1">
                    {formData.career_objective || "e.g. Seeking a challenging role in AI Engineering where I can utilize my analytical skills to develop robust web and data models."}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[#C76F2B] uppercase tracking-wider mb-2">My Skills</h4>
                  {formData.skills ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.split(",").map((s, idx) => (
                        <span key={idx} className="bg-slate-100 text-[#214C55] text-[10px] font-extrabold uppercase px-2.5 py-1 border border-slate-200">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] font-semibold italic">No skills listed yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Academic Summary Grid */}
      <div className="bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm flex flex-col justify-between">
        <div className="border-b border-[#E5E5E5] pb-3 mb-4 text-left">
          <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Academic Overview</h3>
          <p className="text-xs text-[#6B7280] font-semibold">Summary of your overall performance and recruitment readiness.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F9FAFB] p-4 border border-[#E5E5E5] text-left">
            <span className="block text-[9px] font-black text-[#6B7280] uppercase tracking-wider">Overall Score</span>
            <div className="text-2xl font-black text-[#214C55] mt-1">
              <ScoreBadge score={student.overall_score} />
            </div>
          </div>
          <div className="bg-[#F9FAFB] p-4 border border-[#E5E5E5] text-left">
            <span className="block text-[9px] font-black text-[#6B7280] uppercase tracking-wider">Strongest Domain</span>
            <div className="text-xs font-extrabold mt-2 text-emerald-700 uppercase">
              <DomainBadge domain={student.strongest_domain} />
            </div>
          </div>
          <div className="bg-[#F9FAFB] p-4 border border-[#E5E5E5] text-left">
            <span className="block text-[9px] font-black text-[#6B7280] uppercase tracking-wider">Weakest Domain</span>
            <div className="text-xs font-extrabold mt-2 text-amber-700 uppercase">
              <DomainBadge domain={student.weakest_domain} />
            </div>
          </div>
          <div className="bg-[#F9FAFB] p-4 border border-[#E5E5E5] text-left">
            <span className="block text-[9px] font-black text-[#6B7280] uppercase tracking-wider">Placement Status</span>
            <span className={`inline-block mt-2 px-2 py-0.5 text-[8px] font-extrabold uppercase border ${readinessColor}`}>
              {readinessStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Domain Performance bars */}
      <div className="bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm space-y-4">
        <div className="border-b border-[#E5E5E5] pb-3 text-left">
          <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Domain Performance Breakdown</h3>
          <p className="text-[10px] text-[#6B7280] font-semibold">Your competency level in key technical and academic areas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(pScores).map(([name, score]) => {
            const barColor = score >= 90 ? "bg-[#214C55]" : score >= 80 ? "bg-[#C76F2B]" : "bg-slate-500";
            const level = score >= 90 ? "Outstanding" : score >= 80 ? "Excellent" : score >= 70 ? "Very Good" : "Good";
            return (
              <div key={name} className="p-4 bg-[#F9FAFB] border border-[#E5E5E5] space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{name}</span>
                  <span className="text-[#214C55] font-black">{score}%</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-none overflow-hidden">
                  <div className={`h-full ${barColor}`} style={{ width: `${score}%` }}></div>
                </div>
                <div className="text-[9px] text-[#6B7280] font-extrabold uppercase">{level} Level</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Portfolio Customization Edit Section */}
      <div className="bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm text-left space-y-4">
        <div className="border-b border-[#E5E5E5] pb-3">
          <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Portfolio Linkage & Appearance</h3>
          <p className="text-xs text-[#6B7280] font-semibold">Configure social profiles, contact parameters, page theme, and resume visibility.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1 flex items-center space-x-1">
                <GithubIcon className="w-3 h-3" />
                <span>GitHub URL</span>
              </label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/yourusername"
                className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1 flex items-center space-x-1">
                <LinkedinIcon className="w-3 h-3" />
                <span>LinkedIn URL</span>
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourusername"
                className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
              />
            </div>


            <div>
              <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1 flex items-center space-x-1">
                <MapPin size={12} />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Coimbatore, Tamil Nadu"
                className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#214C55] mb-1 flex items-center space-x-1">
                <Palette size={12} />
                <span>Portfolio Color Theme</span>
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 border border-[#D1D5DB] focus:outline-none focus:border-[#214C55] rounded-none bg-white"
              >
                <option value="Dark Minimal">Dark Minimal</option>
                <option value="Light Minimal">Light Minimal</option>
                <option value="Neon Dark">Neon Dark</option>
                <option value="Midnight Cosmic">Midnight Cosmic</option>
                <option value="Karpagam Teal">Karpagam Teal</option>
                <option value="KCE Retro Orange">KCE Retro Orange</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="resume_visibility"
                checked={formData.resume_visibility}
                onChange={(e) => setFormData({ ...formData, resume_visibility: e.target.checked })}
                className="w-4 h-4 text-[#214C55] border-[#D1D5DB] focus:ring-0 focus:outline-none"
              />
              <label htmlFor="resume_visibility" className="text-xs font-black uppercase text-[#214C55] cursor-pointer flex items-center space-x-1.5">
                {formData.resume_visibility ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} className="text-slate-400" />}
                <span>Show Resume Link on Portfolio Page</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCustomizationSave}
                disabled={savingCustomization}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-all flex items-center space-x-1.5"
              >
                <Save size={14} />
                <span>{savingCustomization ? "Saving..." : "Save Portfolio Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Collections: Projects, Certifications, achievements summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Projects */}
        <div className="bg-white p-5 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm text-left">
          <h3 className="font-extrabold text-xs text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-3 mb-4">
            My Projects ({projects.length})
          </h3>
          {projects.length === 0 ? (
            <p className="text-xs text-[#6B7280] font-semibold italic">No projects submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 3).map((proj) => (
                <div key={proj.id} className="p-3 bg-[#F9FAFB] border border-[#D1D5DB]">
                  <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{proj.title}</h4>
                  <p className="text-[10px] text-[#6B7280] mt-1 line-clamp-3">{proj.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white p-5 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm text-left">
          <h3 className="font-extrabold text-xs text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-3 mb-4">
            My Credentials ({certifications.length})
          </h3>
          {certifications.length === 0 ? (
            <p className="text-xs text-[#6B7280] font-semibold italic">No certificates submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {certifications.slice(0, 3).map((c) => (
                <div key={c.id} className="p-3 bg-[#F9FAFB] border border-[#D1D5DB] flex flex-col justify-between">
                  <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{c.title}</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Issuer: {c.issuer}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white p-5 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm text-left">
          <h3 className="font-extrabold text-xs text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-3 mb-4">
            Honors & Achievements ({achievements.length})
          </h3>
          {achievements.length === 0 ? (
            <p className="text-xs text-[#6B7280] font-semibold italic">No achievements logged yet.</p>
          ) : (
            <div className="space-y-3">
              {achievements.slice(0, 3).map((ach) => (
                <div key={ach.id} className="p-3 bg-[#F9FAFB] border border-[#D1D5DB]">
                  <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{ach.title}</h4>
                  <p className="text-[10px] text-[#6B7280] mt-1">{ach.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Bottom Quick Management Links */}
      <div className="bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm text-left space-y-4">
        <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider border-b border-[#E5E5E5] pb-2">Quick Management Links</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <a
            href={`/portfolio/${student.register_no}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-all text-center flex items-center justify-center space-x-1"
          >
            <span>View My Portfolio</span>
            <ExternalLink size={11} />
          </a>
          <Link
            to="/my-portfolio"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white transition-all text-center flex items-center justify-center"
          >
            Edit Portfolio
          </Link>
          <Link
            to="/my-resume"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
          >
            My Resume
          </Link>
          <Link
            to="/my-projects"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
          >
            My Projects
          </Link>
          <Link
            to="/my-certifications"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
          >
            My Certificates
          </Link>
          <Link
            to="/my-achievements"
            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
          >
            My Achievements
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentMyProfilePage;
