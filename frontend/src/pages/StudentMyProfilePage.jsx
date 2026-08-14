import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentService } from "../services/studentService";
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
  Sparkles
} from "lucide-react";
import { mockPerformance } from "../data/mockPerformance";

export const StudentMyProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auth Guard check: only student role is allowed
    if (user && user.role !== "student") {
      navigate("/dashboard", { replace: true });
      return;
    }

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

        // Fetch performance logs using registerNo or default
        let perfLogs = [];
        try {
          const perfData = await studentService.getStudentPerformance(registerNo);
          perfLogs = perfData?.data || perfData;
        } catch (perfErr) {
          console.warn("Performance load failed, using mock data:", perfErr);
          perfLogs = mockPerformance[registerNo] || [];
        }

        if (!import.meta.env.PROD) {
          console.log("StudentProfile identifier: me");
          console.log("StudentProfile raw profile response:", rawData);
          console.log("StudentProfile normalized profile:", profileData);
        }

        setStudent(profileData);
        setPerformance(perfLogs);
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

    fetchMyProfile();
  }, [user, navigate]);

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
          <p className="text-xs text-[#6B7280] font-semibold mt-1">Personal academic overview, competency mappings, and verified credentials.</p>
        </div>
        <div className="flex items-center">
          <span className="text-[10px] font-extrabold text-white bg-[#C76F2B] px-3 py-1 uppercase tracking-widest">
            Student Account
          </span>
        </div>
      </div>

      {/* Main Grid: Info card & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Student Info */}
        <div className="bg-white rounded-none border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] shadow-sm p-6 flex flex-col justify-between">
          <div className="text-center space-y-4">
            {getStudentImageUrl(student) ? (
              <img
                src={getStudentImageUrl(student)}
                alt={student.name || "Student"}
                className="w-24 h-24 rounded-none object-cover border border-[#D1D5DB] mx-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.parentElement?.querySelector('.avatar-profile-fallback');
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div className={`avatar-profile-fallback w-24 h-24 rounded-none bg-[#F7F7F7] border border-[#D1D5DB] text-[#214C55] mx-auto text-3xl font-black shadow-none items-center justify-center ${getStudentImageUrl(student) ? "hidden" : "flex"}`}>
              {(student.name || "U").charAt(0)}
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[#214C55] uppercase tracking-wider">{student.name || "N/A"}</h2>
              <p className="text-xs text-[#6B7280] font-bold mt-0.5">{student.register_no || student.registerNo || "N/A"}</p>
            </div>

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
              {student.phone && (
                <div className="col-span-2 pt-1 flex items-center space-x-2 text-slate-650">
                  <Phone size={13} className="text-[#6B7280]" />
                  <span className="text-[#214C55] font-extrabold text-[11px]">{student.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Academic Summary */}
        <div className="lg:col-span-2 bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E5E5E5] pb-3 mb-4 text-left">
              <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Academic Summary</h3>
              <p className="text-xs text-[#6B7280] font-semibold">Consolidated score metrics and verified status indicators.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* Quick Action Navigation Grid */}
          <div className="border-t border-[#E5E5E5] pt-4 text-left">
            <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <a
                href={`/portfolio/${student.register_no}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-all text-center flex items-center justify-center space-x-1"
              >
                <span>View My Portfolio</span>
                <ExternalLink size={11} />
              </a>
              <Link
                to="/my-portfolio"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white transition-all text-center flex items-center justify-center"
              >
                Edit Portfolio
              </Link>
              <Link
                to="/my-resume"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
              >
                My Resume
              </Link>
              <Link
                to="/my-projects"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
              >
                My Projects
              </Link>
              <Link
                to="/my-certifications"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
              >
                My Certificates
              </Link>
              <Link
                to="/my-achievements"
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#214C55] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all text-center flex items-center justify-center"
              >
                My Achievements
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Performance */}
      <div className="bg-white p-6 border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-sm space-y-4">
        <div className="border-b border-[#E5E5E5] pb-3 text-left">
          <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Domain Competency Ratings</h3>
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

      {/* Collections Section */}
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
              {projects.map((proj) => (
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
              {certifications.map((c) => (
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
              {achievements.map((ach) => (
                <div key={ach.id} className="p-3 bg-[#F9FAFB] border border-[#D1D5DB]">
                  <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{ach.title}</h4>
                  <p className="text-[10px] text-[#6B7280] mt-1">{ach.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMyProfilePage;
