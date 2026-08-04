import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { portfolioService } from "../services/portfolioService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { safeFixed } from "../utils/formatters";
import { mockStudents } from "../data/mockStudents";
import { mockPerformance } from "../data/mockPerformance";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Cpu,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Trophy,
  TrendingUp,
  FileText,
  Play,
  Pause,
  Heart,
  Music,
  Code,
  Terminal,
  ChevronRight,
  User,
  Database,
  Zap
} from "lucide-react";

import { resolveImageUrl, getStudentImageUrl, getResumeUrl } from "../utils/imageUtils";



// Inline social SVGs for compiling clean
const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const PortfolioPage = () => {
  const { registerNo } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [showAllPerformance, setShowAllPerformance] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [registerNo]);

  // Music Player Simulation
  const [isPlaying, setIsPlaying] = useState(true);
  const [songProgress, setSongProgress] = useState(30);

  // Typing effect state
  const [typedText, setTypedText] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);

  const handleViewResume = () => {
    const resumeUrl = getResumeUrl(portfolio);

    if (resumeUrl) {
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setResumePreviewOpen(true);
  };

  const handleUploadResumeClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate("/my-resume");
    } else {
      navigate("/login", { state: { from: { pathname: "/my-resume" } } });
    }
  };

  const isStudentPreview = user?.role === "student" && 
    (user?.register_no === registerNo || user?.registerNo === registerNo);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await portfolioService.getStudentPortfolio(registerNo);
        setPortfolio(data);
      } catch (err) {
        setError("Failed to construct the verified portfolio card.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [registerNo]);

  // Typing animation cycle
  const roles = useMemo(() => {
    if (!portfolio) return ["AI Specialist", "Full Stack Developer", "Problem Solver"];
    return [
      portfolio.title || "AI & Data Science Student",
      "Full Stack Software Developer",
      "Competitive Coder",
      "Machine Learning Enthusiast"
    ];
  }, [portfolio]);

  useEffect(() => {
    if (!portfolio) return;
    let timer;
    const activeRole = roles[roleIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedText(activeRole.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      }, 40);
    } else {
      timer = setTimeout(() => {
        setTypedText(activeRole.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 80);
    }

    if (!isDeleting && charIndex === activeRole.length) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setRoleIndex(prev => (prev + 1) % roles.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, roleIndex, roles, portfolio]);

  // Song scrubber progression
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setSongProgress(prev => (prev >= 100 ? 0 : prev + 0.4));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle scroll trigger for recruiter mode
  useEffect(() => {
    if (recruiterMode) {
      scrollToSection("resume");
    }
  }, [recruiterMode]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050507] text-white">
        <LoadingSpinner size="lg" text="Compiling dark cosmic developer portfolio..." />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050507] p-6 text-center space-y-4">
        <div className="bg-[#111114] border border-[#2E2E33] text-white p-6 rounded-2xl max-w-md shadow-lg">
          <h3 className="font-bold text-lg text-[#F5C542]">Portfolio Unavailable</h3>
          <p className="text-sm text-[#A1A1AA] mt-1">{error || "The requested portfolio could not be resolved."}</p>
        </div>
        {isAuthenticated && (
          <Link to="/dashboard" className="text-xs font-bold uppercase tracking-wider text-[#A855F7] hover:underline flex items-center space-x-1.5">
            <ArrowLeft size={14} />
            <span>Go to Dashboard</span>
          </Link>
        )}
      </div>
    );
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Safe variables based on Data Priority Rules
  const headline =
    portfolio.title ||
    portfolio.portfolioCustomization?.headline ||
    portfolio.portfolio_customization?.headline ||
    portfolio.resume?.primaryRole ||
    portfolio.resume?.primary_role ||
    portfolio.resume?.preferredRole ||
    portfolio.resume?.preferred_role ||
    portfolio.resume?.resumeTitle ||
    portfolio.resume?.title ||
    "AI & DS Student | Java Full Stack Developer";

  const aboutText =
    portfolio.about ||
    portfolio.portfolioCustomization?.about_me ||
    portfolio.portfolio_customization?.about_me ||
    portfolio.resume?.careerObjective ||
    portfolio.resume?.career_objective ||
    "I am an Artificial Intelligence and Data Science student passionate about building AI-powered full stack applications, solving real-world problems, and improving through verified academic and technical performance.";

  const careerObjective =
    portfolio.career_objective ||
    portfolio.careerObjective ||
    portfolio.portfolioCustomization?.career_objective ||
    portfolio.portfolio_customization?.career_objective ||
    portfolio.resume?.careerObjective ||
    portfolio.resume?.career_objective ||
    "To secure a challenging role in an industry-leading organization, leveraging my analytical competencies in Artificial Intelligence, Full-Stack Software Engineering, and problem-solving to design and deploy real-world product solutions.";
  
  // Combine skills safely
  const customizationSkills = portfolio.skills || portfolio.portfolioCustomization?.skills || portfolio.portfolio_customization?.skills || [];
  const resumeSkills = portfolio.resume?.keySkills || portfolio.resume?.key_skills || [];
  const defaultSkills = ["Python", "Java", "React", "FastAPI", "PostgreSQL", "Machine Learning", "DSA", "Full Stack"];

  const skillsList =
    customizationSkills.length > 0
      ? customizationSkills
      : resumeSkills.length > 0
      ? resumeSkills
      : defaultSkills;

  // Calculate assessment timeline items
  const studentPerformance = portfolio.performance?.score_history || portfolio.performance?.scoreHistory || mockPerformance[registerNo] || [];
  let bestAssessment = null;
  let highestScore = 0;
  if (studentPerformance.length > 0) {
    bestAssessment = studentPerformance.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    highestScore = Math.max(...studentPerformance.map(p => p.score));
  }

  // Find basic info from mockStudents
  const student = mockStudents.find(s => s.register_no === registerNo);
  const studentId = student?.id || "1";

  // 1. Saved profile image from profileService/localStorage
  // Check key: `student360_profile_student_${studentId}`
  const profileServiceKey = `student360_profile_student_${studentId}`;
  const storedProfileRaw = localStorage.getItem(profileServiceKey);
  let profileServiceImage = null;
  if (storedProfileRaw) {
    try {
      const parsed = JSON.parse(storedProfileRaw);
      profileServiceImage = parsed.profileImage;
    } catch(e) {}
  }

  // Also check profileKey: `student360_profile_${registerNo}`
  const profileKey = `student360_profile_${registerNo}`;
  const storedProfileRaw2 = localStorage.getItem(profileKey);
  let profileServiceImage2 = null;
  if (storedProfileRaw2) {
    try {
      const parsed = JSON.parse(storedProfileRaw2);
      profileServiceImage2 = parsed.profileImage || parsed.profile_image;
    } catch(e) {}
  }

  // 2. portfolio customization profileImage if available
  // Customization Key: `student360_portfolio_customization_${registerNo}`
  const customKey = `student360_portfolio_customization_${registerNo}`;
  const customRaw = localStorage.getItem(customKey);
  let customProfileImage = null;
  if (customRaw) {
    try {
      const parsed = JSON.parse(customRaw);
      customProfileImage = parsed.profileImage;
    } catch (e) {}
  }

  // 3. student.profileImage & 4. student.profile_image
  const studentProfileImage = student?.profileImage || student?.profile_image;

  // 5. currentUser.profileImage if available
  const isOwn = user?.role === "student" && (user?.register_no === registerNo || user?.registerNo === registerNo);
  const currentUserImage = isOwn ? (user?.profileImage || user?.profile_image) : null;

  // Final priority list resolution
  const avatarUrl = getStudentImageUrl({
    profileImage: profileServiceImage || profileServiceImage2 || customProfileImage || studentProfileImage || currentUserImage,
    student: portfolio?.student,
    registerNo: registerNo,
    role: isOwn ? "student" : null
  });

  const initials = portfolio?.name ? portfolio.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "ST";

  const hasProjects = portfolio.visibility?.showProjects !== false;
  const hasAchievements = portfolio.visibility?.showAchievements !== false || portfolio.visibility?.showCertifications !== false;
  const hasContact = portfolio.visibility?.showContactLinks !== false;

  const tabs = [
    { id: "about", label: "About" },
    { id: "performance", label: "Performance" },
    { id: "resume", label: "Resume" },
    ...(hasProjects ? [{ id: "projects", label: "Projects" }] : []),
    ...(hasAchievements ? [{ id: "achievements", label: "Achievements" }] : []),
    ...(hasContact ? [{ id: "contact", label: "Contact" }] : [])
  ];

  const getSkillBadgeStyle = (skill) => {
    const s = skill.toLowerCase();
    if (s.includes("python") || s.includes("machine learning") || s.includes("ai")) return "border-blue-500/20 text-blue-400 bg-blue-500/5";
    if (s.includes("java") || s.includes("spring")) return "border-red-500/20 text-red-400 bg-red-500/5";
    if (s.includes("react") || s.includes("js") || s.includes("javascript")) return "border-cyan-500/20 text-cyan-400 bg-cyan-500/5";
    if (s.includes("fastapi") || s.includes("node") || s.includes("express")) return "border-emerald-500/20 text-emerald-400 bg-emerald-500/5";
    if (s.includes("sql") || s.includes("dbms") || s.includes("postgres")) return "border-indigo-500/20 text-indigo-400 bg-indigo-500/5";
    return "border-purple-500/20 text-purple-400 bg-purple-500/5";
  };

  // Safe checks for projects array to avoid blank screen map crash
  const rawProjects = Array.isArray(portfolio?.projects)
    ? portfolio.projects
    : Array.isArray(portfolio?.student?.projects)
    ? portfolio.student.projects
    : [];

  const visibleProjects = rawProjects.filter(proj => {
    const status = proj.status || proj.approval_status || "Approved";
    if (status === "Approved") return true;
    if (isStudentPreview && (status === "Pending" || status === "Correction Required" || status === "Rejected")) return true;
    return false;
  });

  const visibleAchievements = (portfolio.achievements || []).filter(ach => {
    const status = ach.status || ach.approval_status || "Approved";
    if (status === "Approved") return true;
    if (isStudentPreview && (status === "Pending" || status === "Correction Required" || status === "Rejected")) return true;
    return false;
  });

  const visibleCertifications = (portfolio.certifications || []).filter(c => {
    const status = c.status || c.approval_status || "Approved";
    if (status === "Approved") return true;
    if (isStudentPreview && (status === "Pending" || status === "Correction Required" || status === "Rejected")) return true;
    return false;
  });

  const isResumeVisible = portfolio.visibility?.showResume !== false && portfolio.resume?.useInPortfolio === true;

  return (
    <div className="min-h-screen bg-[#050507] text-[#F3F4F6] pb-24 font-sans relative overflow-x-hidden flex flex-col items-center select-none">
      {/* Scope localized style tags for starry background & cursor visuals */}
      <style dangerouslySetInnerHTML={{ __html: `
        .cosmic-stars-layer-1 {
          background-image: 
            radial-gradient(1px 1px at 15px 35px, rgba(255,255,255,0.7) 100%, transparent),
            radial-gradient(1.2px 1.2px at 60px 110px, rgba(255,255,255,0.8) 100%, transparent),
            radial-gradient(2px 2px at 130px 240px, rgba(168, 85, 247, 0.4) 100%, transparent),
            radial-gradient(1px 1px at 220px 85px, rgba(255,255,255,0.5) 100%, transparent),
            radial-gradient(1.5px 1.5px at 170px 190px, rgba(245, 197, 66, 0.5) 100%, transparent);
          background-size: 280px 280px;
        }
        .cosmic-stars-layer-2 {
          background-image: 
            radial-gradient(1.2px 1.2px at 40px 90px, rgba(255,255,255,0.6) 100%, transparent),
            radial-gradient(1.8px 1.8px at 110px 180px, rgba(168, 85, 247, 0.3) 100%, transparent),
            radial-gradient(1px 1px at 190px 45px, rgba(255,255,255,0.7) 100%, transparent),
            radial-gradient(1.5px 1.5px at 280px 270px, rgba(255,255,255,0.5) 100%, transparent);
          background-size: 320px 320px;
          animation: drift-upward 120s linear infinite;
        }
        @keyframes drift-upward {
          from { background-position: 0 0; }
          to { background-position: -320px -640px; }
        }
        .eq-animated-bar {
          width: 3px;
          background-color: #A855F7;
          border-radius: 2px;
          height: 100%;
          transform-origin: bottom;
        }
        .eq-anim-1 { animation: wave-eq 1.2s ease-in-out infinite alternate; }
        .eq-anim-2 { animation: wave-eq 0.8s ease-in-out infinite alternate 0.25s; }
        .eq-anim-3 { animation: wave-eq 1.5s ease-in-out infinite alternate 0.1s; }
        .eq-anim-4 { animation: wave-eq 1.0s ease-in-out infinite alternate 0.35s; }
        @keyframes wave-eq {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1); }
        }
        .custom-typing-cursor::after {
          content: '_';
          animation: caret-blink 0.9s step-end infinite;
          color: #A855F7;
          font-weight: 800;
        }
        @keyframes caret-blink {
          from, to { color: transparent; }
          50% { color: #A855F7; }
        }
      ` }} />

      {/* Background stars stack */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 cosmic-stars-layer-1 opacity-45"></div>
        <div className="absolute inset-0 cosmic-stars-layer-2 opacity-35"></div>
        {/* Soft radial aura glow */}
        <div className="absolute top-24 left-1/4 w-[400px] h-[400px] bg-purple-950/15 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Floating navigation header */}
      <nav className="w-full bg-[#08080B]/90 backdrop-blur-md border-b border-[#1E1E24] h-16 px-6 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center space-x-3">
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="p-2 bg-[#111114] hover:bg-[#1E1E24] text-[#A1A1AA] hover:text-white rounded-xl border border-[#2E2E33] transition-all"
              title="Return to Dashboard"
            >
              <ArrowLeft size={14} />
            </Link>
          )}
          <span className="text-xs font-black tracking-widest text-[#F3F4F6] flex items-center space-x-1.5 uppercase">
            <GraduationCap size={16} className="text-[#A855F7]" />
            <span>Verified Student Portfolio</span>
          </span>
        </div>

        {/* Dynamic Verification Badge */}
        <div className="flex items-center space-x-1.5 bg-[#1C2C1D]/60 text-emerald-400 px-3.5 py-1.5 rounded-full text-[9px] font-black border border-emerald-900/40 uppercase tracking-widest">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Verified Student</span>
        </div>
      </nav>

      {/* Smooth Sticky Section Scrollbar Header */}
      <header className="w-full bg-[#08080B]/80 backdrop-blur-sm border-b border-[#1A1A1F] sticky top-16 z-30 py-2 px-6 flex justify-between items-center max-w-[1200px] rounded-b-2xl shadow-xl mt-1">
        <div className="flex space-x-2 overflow-x-auto py-1 no-scrollbar max-w-[65%]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#18181D] transition-all cursor-pointer"
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Recruiter Mode Sliding Toggle */}
        <button
          onClick={() => setRecruiterMode(prev => !prev)}
          className={`flex items-center space-x-2 border px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            recruiterMode 
              ? "bg-[#A855F7]/10 border-[#A855F7] text-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.3)]" 
              : "bg-[#111114] border-[#2E2E33] text-[#A1A1AA] hover:text-white hover:border-[#71717A]"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${recruiterMode ? "bg-[#A855F7] animate-ping" : "bg-[#71717A]"}`} />
          <span>Recruiter Mode: {recruiterMode ? "On" : "Off"}</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-[1200px] w-full px-6 mt-8 z-10 flex flex-col space-y-12">

        {/* Hero Section */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          
          {/* Left Intro: 7 Cols */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A855F7] bg-[#A855F7]/10 px-3 py-1.5 rounded-md border border-[#A855F7]/20">
                Welcome to my portfolio
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
                Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#8B5CF6]">{portfolio.name}</span>
              </h1>
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-200 mt-2">
                <span className="custom-typing-cursor">{typedText}</span>
              </h2>
            </div>

            <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed font-semibold max-w-xl font-sans">
              {aboutText}
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => scrollToSection("resume")}
                className="px-5 py-2.5 bg-[#A855F7] hover:bg-[#8B5CF6] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center space-x-1.5"
              >
                <FileText size={14} />
                <span>View Resume</span>
              </button>
              <button
                onClick={() => scrollToSection("projects")}
                className="px-5 py-2.5 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Code size={14} className="text-[#A855F7]" />
                <span>Projects Roster</span>
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="px-5 py-2.5 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Mail size={14} className="text-[#F5C542]" />
                <span>Contact Details</span>
              </button>
            </div>
          </div>

          {/* Right Profile Card Sidebar Wrapper: 5 Cols */}
          <div className="lg:col-span-5 w-full flex flex-col space-y-4">
            
            {/* Main Profile Info Card */}
            <div className="bg-[#111114] border border-[#2E2E33] rounded-3xl p-6 flex flex-col items-center text-center space-y-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none"></div>

              {/* Avatar representation */}
              <div className="relative">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={portfolio.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#A855F7] ring-8 ring-[#A855F7]/10 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div
                    id="profile-initial-avatar"
                    className="w-24 h-24 rounded-full bg-[#18181D] border-4 border-[#A855F7] ring-8 ring-[#A855F7]/10 flex items-center justify-center text-[#F5C542] text-3xl font-black shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                  >
                    {initials}
                  </div>
                )}
                
                {/* CGPA Overlaid pill */}
                <div className="absolute -bottom-2.5 right-1/2 translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-400/30 text-white text-[8px] font-black rounded-full shadow-lg uppercase tracking-wider">
                  {portfolio.overall_score ? `${safeFixed(portfolio.overall_score / 10, 2)} CGPA` : "9.18 CGPA"}
                </div>
              </div>

              <div className="space-y-1 pt-1.5">
                <h2 className="text-base font-bold text-white tracking-tight">{portfolio.name}</h2>
                <span className="inline-block px-2.5 py-0.5 bg-[#18181D] text-[#A855F7] border border-[#2E2E33] rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                  {headline}
                </span>
              </div>

              {/* Specific info rows */}
              <div className="w-full text-left space-y-3 pt-4 border-t border-[#2E2E33]/60 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-mono">
                <div className="flex items-center space-x-2.5">
                  <Mail size={14} className="text-[#A855F7] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[#71717A] text-[8px] tracking-widest block font-sans">Official Email</span>
                    <span className="text-[#F3F4F6] block truncate mt-0.5 lowercase font-semibold">{portfolio.contact?.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <GraduationCap size={14} className="text-[#A855F7] flex-shrink-0" />
                    <div>
                      <span className="text-[#71717A] text-[8px] tracking-widest block font-sans">Register No</span>
                      <span className="text-[#F3F4F6] block mt-0.5 font-semibold">{portfolio.register_no}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <MapPin size={14} className="text-[#A855F7] flex-shrink-0" />
                    <div>
                      <span className="text-[#71717A] text-[8px] tracking-widest block font-sans">Location</span>
                      <span className="text-[#F3F4F6] block mt-0.5 font-semibold font-sans">{portfolio.contact?.location || "Coimbatore"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Music Widget */}
            <div className="bg-[#111114] border border-[#2E2E33] rounded-2xl p-4 flex flex-col space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#71717A] flex items-center space-x-1.5">
                  <Music size={10} className="text-[#A855F7] animate-pulse" />
                  <span>Now Playing</span>
                </span>
                
                {/* Visual EQ animation */}
                <div className="flex items-end space-x-0.5 h-3">
                  <div className={`eq-animated-bar eq-anim-1 ${isPlaying ? "" : "paused"}`} style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
                  <div className={`eq-animated-bar eq-anim-2 ${isPlaying ? "" : "paused"}`} style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
                  <div className={`eq-animated-bar eq-anim-3 ${isPlaying ? "" : "paused"}`} style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
                  <div className={`eq-animated-bar eq-anim-4 ${isPlaying ? "" : "paused"}`} style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center text-[#A855F7] border border-[#2E2E33] shadow-inner font-mono text-[9px] font-black">
                  🌌
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-xs font-bold text-white truncate uppercase">Interstellar Theme</h4>
                  <span className="text-[9px] text-[#A1A1AA] block truncate font-bold font-sans">Hans Zimmer — Stellar Mix</span>
                </div>
              </div>

              {/* Controls and Scrubber */}
              <div className="space-y-2">
                <div className="w-full bg-[#18181D] h-1.5 rounded-full overflow-hidden border border-[#2E2E33] relative">
                  <div 
                    className="bg-[#A855F7] h-full rounded-full transition-all"
                    style={{ width: `${songProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
                  <span>1:24</span>
                  <div className="flex items-center space-x-3 text-slate-400">
                    <button onClick={() => setIsPlaying(prev => !prev)} className="p-1 hover:text-white transition-colors cursor-pointer">
                      {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                    </button>
                    <Heart size={10} className="text-[#A855F7] fill-[#A855F7]/25" />
                  </div>
                  <span>4:32</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Tech Stack Strip Section */}
        <section className="bg-[#111114] border border-[#2E2E33] rounded-3xl p-5 shadow-lg space-y-4">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#71717A] text-left">
            Core Developer Tech Stack
          </h3>
          {categorizedSkills.length > 0 ? (
            <div className="space-y-3">
              {categorizedSkills.map((cat) => (
                <div key={cat.name} className="text-left space-y-1.5">
                  <span className="text-[9px] font-bold text-[#A855F7] uppercase tracking-wider block">{cat.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {cat.list.map((skill) => (
                      <span
                        key={skill}
                        className={`px-3 py-1 border rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all hover:scale-105 ${getSkillBadgeStyle(skill)}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className={`px-3 py-1.5 border rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all hover:scale-105 ${getSkillBadgeStyle(skill)}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Main Lower Content Wrapper - Centered stacked full-width flow */}
        <div className="w-full space-y-16 pt-4">

            {/* Recruiter Mode Active Banner */}
            {recruiterMode && (
              <div className="w-full bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/35 rounded-2xl p-4 flex items-center justify-between shadow-xl backdrop-blur-sm animate-fade-in text-left">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-500/10 text-[#A855F7] rounded-xl border border-purple-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">Recruiter Inspection Mode</h4>
                    <p className="text-[10px] text-slate-300 font-semibold mt-0.5 leading-relaxed font-sans">
                      Verified hiring parameters, GPA metrics, assessment logs, and credentials have been prioritized below.
                    </p>
                  </div>
                </div>
                {portfolio.resume?.fileName && (
                  <a
                    href={`mailto:${portfolio.contact?.email}?subject=Hiring Inquiry - ${displayName}`}
                    className="px-4 py-2 bg-[#A855F7] hover:bg-[#8B5CF6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex-shrink-0"
                  >
                    Direct Hire
                  </a>
                )}
              </div>
            )}

            {/* 1. Performance Timeline */}
            {customSections.performance?.visible !== false && (
              <div id="performance" className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      {customSections.performance?.title || "Performance Timeline"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Verified academic and technical assessment history.</p>
                  </div>
                  <TrendingUp size={16} className="text-[#A855F7]" />
                </div>

                <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#A855F7]/30 transition-all space-y-6">
                  {Array.isArray(studentPerformance) && studentPerformance.length > 0 ? (
                    <div className="space-y-6">
                      <div className="relative border-l-2 border-[#A855F7]/40 pl-6 ml-2 space-y-6">
                        {(showAllPerformance ? studentPerformance : studentPerformance.slice(0, 5)).map((perf, idx) => (
                          <div key={idx} className="relative group/item">
                            {/* Dot */}
                            <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-[#A855F7] rounded-full border-4 border-[#050507] group-hover/item:scale-125 transition-transform shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                            
                            {/* Entry Card */}
                            <div className="bg-[#18181D]/60 border border-[#2E2E33] rounded-xl p-4 flex items-center justify-between hover:border-[#A855F7]/30 hover:bg-[#18181D]/90 transition-all shadow-md">
                              <div className="space-y-1.5 min-w-0 pr-4">
                                <span className="text-[8px] font-extrabold text-[#A855F7] tracking-wider uppercase bg-[#A855F7]/10 px-2 py-0.5 rounded border border-[#A855F7]/20 font-mono">
                                  {perf.date || "Verified Entry"}
                                </span>
                                <h5 className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-sm" title={perf.assessment_name}>
                                  {perf.assessment_name}
                                </h5>
                                <div className="flex items-center space-x-2 text-[9px] text-[#A1A1AA] font-semibold">
                                  <span>Category: <strong className="text-slate-300">{perf.category}</strong></span>
                                  <span className="w-1 h-1 rounded-full bg-[#71717A]"></span>
                                  <span>Code: <strong className="text-slate-300 font-mono">{perf.assessment_code || "N/A"}</strong></span>
                                </div>
                              </div>
                              
                              {/* Score Badge */}
                              <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                                <div className="px-2.5 py-1 bg-[#1C2C1D]/60 text-emerald-400 text-[10px] font-black border border-emerald-950 rounded-lg font-mono">
                                  {perf.percentage || perf.score}%
                                </div>
                                <div className="w-16 bg-[#111114] h-1 rounded-full overflow-hidden border border-[#2E2E33]">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" 
                                    style={{ width: `${perf.percentage || perf.score}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {studentPerformance.length > 5 && (
                        <div className="pt-2 flex justify-center">
                          <button
                            onClick={() => setShowAllPerformance(prev => !prev)}
                            className="px-4 py-2 bg-[#18181D] hover:bg-[#2E2E33] text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#2E2E33] hover:border-[#A855F7]/40 transition-all cursor-pointer shadow-md"
                          >
                            {showAllPerformance ? "Show Less History" : "View Complete History"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-[#A1A1AA] font-semibold font-mono">
                      <TrendingUp size={24} className="mx-auto mb-2 text-[#71717A] opacity-60" />
                      <span>No verified assessment history logs available.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Domain Skill Matrix */}
            {customSections.performance?.visible !== false && (
              <div className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">Verified Domain Scales</h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Competency index mapping across core tracks.</p>
                  </div>
                  <Cpu size={16} className="text-[#A855F7]" />
                </div>

                <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-6 shadow-xl space-y-6 hover:border-[#A855F7]/30 transition-all">
                  {/* Insights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#18181D]/60 border border-[#2E2E33] rounded-xl p-4 space-y-2 hover:border-emerald-500/20 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] tracking-wider uppercase text-[#71717A] font-mono">Strongest track</span>
                        <Award size={14} className="text-emerald-400" />
                      </div>
                      <div className="text-sm font-black text-white uppercase truncate">
                        {portfolio.strongest_domain || "FullStack Dev"}
                      </div>
                      <span className="text-[9px] text-emerald-400 font-extrabold uppercase font-mono block">Verified Peak</span>
                    </div>

                    <div className="bg-[#18181D]/60 border border-[#2E2E33] rounded-xl p-4 space-y-2 hover:border-amber-500/20 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] tracking-wider uppercase text-[#71717A] font-mono">Focus track</span>
                        <AlertTriangle size={14} className="text-amber-500" />
                      </div>
                      <div className="text-sm font-black text-white uppercase truncate">
                        {portfolio.weakest_domain || "Aptitude Track"}
                      </div>
                      <span className="text-[9px] text-amber-500 font-extrabold uppercase font-mono block">Needs Review</span>
                    </div>

                    <div className="bg-[#18181D]/60 border border-[#2E2E33] rounded-xl p-4 space-y-2 hover:border-[#F5C542]/20 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] tracking-wider uppercase text-[#71717A] font-mono">Competency Index</span>
                        <Trophy size={14} className="text-[#F5C542]" />
                      </div>
                      <div className="text-sm font-black text-white uppercase font-mono">
                        {showCgpa ? cgpaText : "Hidden"}
                      </div>
                      <span className="text-[9px] text-[#F5C542] font-extrabold uppercase font-mono block">Overall GPA</span>
                    </div>
                  </div>

                  {/* Progress bars Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-[#2E2E33]/40">
                    {[
                      { name: "DSA Index", key: "DSA", defScore: 85 },
                      { name: "DBMS Index", key: "DBMS", defScore: 90 },
                      { name: "FullStack Dev", key: "FullStack", defScore: 95 },
                      { name: "Aptitude Score", key: "Aptitude", defScore: 75 },
                      { name: "Competitive Coding", key: "Coding", defScore: 92 },
                      { name: "Academic GPA Average", key: "Academic", defScore: 88 },
                      { name: "Technical Electives", key: "Technical", defScore: 84 }
                    ].map((comp) => {
                      const score = portfolio.visibility?.showAcademicHighlights !== false ? comp.defScore : 80;
                      return (
                        <div key={comp.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span className="tracking-tight">{comp.name}</span>
                            <span className="text-[#A855F7] font-mono">{score}%</span>
                          </div>
                          <div className="w-full bg-[#050507] h-2.5 rounded-full overflow-hidden border border-[#2E2E33] p-[1.5px]">
                            <div
                              className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Resume / Career Profile */}
            {customSections.resume?.visible !== false && (
              <div id="resume" className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      {customSections.resume?.title || "Resume & Career Profile"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Professional transcripts and resume attachments.</p>
                  </div>
                  <FileText size={16} className="text-[#A855F7]" />
                </div>

                <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-6 shadow-xl relative overflow-hidden hover:border-[#A855F7]/30 transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Role, Career Objective, Key Skills */}
                    <div className="space-y-5 text-xs text-[#A1A1AA] text-left">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-white tracking-wider font-mono">Preferred Job Role</span>
                        <span className="text-sm text-[#F5C542] mt-1 block font-black uppercase tracking-wider">
                          {isResumeVisible && portfolio.resume?.primaryRole ? portfolio.resume.primaryRole : "AI Engineer / Java Full Stack Developer"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] uppercase font-bold text-white tracking-wider font-mono">Career Objective</span>
                        <p className="text-xs leading-relaxed font-sans text-slate-300 bg-[#050507]/45 p-3 rounded-lg border border-[#2E2E33]/50">
                          {isResumeVisible && portfolio.resume?.careerObjective ? portfolio.resume.careerObjective : careerObjective}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[8px] uppercase font-bold text-white tracking-wider font-mono">Core Competency Keywords</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {isResumeVisible && portfolio.resume?.keySkills && portfolio.resume.keySkills.length > 0 ? (
                            portfolio.resume.keySkills.map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-[#050507] text-[#A855F7] text-[9px] rounded-lg font-extrabold uppercase border border-[#2E2E33] tracking-wider transition-all hover:border-[#A855F7]/40">
                                {skill}
                              </span>
                            ))
                          ) : (
                            ["Python", "Java SE/EE", "Spring Boot", "React.js", "PostgreSQL", "Machine Learning", "Data Structures", "RESTful APIs"].map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-[#050507] text-[#A1A1AA] text-[9px] rounded-lg font-extrabold uppercase border border-[#2E2E33] tracking-wider hover:border-[#A855F7]/30 transition-all">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Resume Status, Details, Buttons, Suggestion */}
                    <div className="space-y-5 flex flex-col justify-between h-full text-left">
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-white tracking-wider font-mono">Resume Attachment Status</span>
                          {isResumeVisible && portfolio.resume?.fileName ? (
                            <div className="flex items-center justify-between mt-1 bg-[#050507] px-3 py-2 border border-[#2E2E33] rounded-lg font-mono">
                              <span className="text-[10px] text-emerald-400 font-extrabold flex items-center space-x-1.5">
                                <ShieldCheck size={12} />
                                <span>Verified Document Linked</span>
                              </span>
                              <span className="text-[9px] text-[#F5C542]">{portfolio.resume.fileName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1 bg-[#050507] px-3 py-2 border border-[#2E2E33] rounded-lg font-mono">
                              <span className="text-[10px] text-amber-500 font-extrabold flex items-center space-x-1.5">
                                <AlertTriangle size={12} />
                                <span>Resume not uploaded yet</span>
                              </span>
                              <span className="text-[9px] text-[#A1A1AA]">No PDF Found</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-[#1C1C10]/40 border border-[#F5C542]/20 rounded-xl p-3.5 text-[10px] text-slate-300 leading-relaxed font-semibold font-sans flex items-start space-x-2.5">
                          <span className="text-[#F5C542] text-sm leading-none">💡</span>
                          <div>
                            <strong className="text-[#F5C542] uppercase block tracking-wider mb-0.5 font-mono">Hiring Integration Notice</strong>
                            {isResumeVisible && portfolio.resume?.fileName ? (
                              <span>Recruiters can inspect the attached PDF file directly.</span>
                            ) : (
                              <span>Add your resume from <span className="text-white">Student Dashboard → My Resume</span> to link your PDF credentials with your public developer card.</span>
                            )}
                          </div>
                        </div>

                        {/* Social/GitHub connections */}
                        <div className="flex flex-wrap gap-4 pt-2 text-[10px] font-black uppercase tracking-wider font-mono">
                          {(customLinks.github || portfolio.resume?.githubUrl) && (
                            <a href={customLinks.github || portfolio.resume.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:underline flex items-center space-x-1.5 hover:text-white transition-all">
                              <GithubIcon className="w-3.5 h-3.5" />
                              <span>GitHub Roster</span>
                            </a>
                          )}
                          {(customLinks.linkedin || portfolio.resume?.linkedinUrl) && (
                            <a href={customLinks.linkedin || portfolio.resume.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:underline flex items-center space-x-1.5 hover:text-white transition-all">
                              <LinkedinIcon className="w-3.5 h-3.5" />
                              <span>LinkedIn Connect</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions buttons row */}
                      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-[#2E2E33]/40">
                        {(portfolio.resume?.fileName || customLinks.resume) && isResumeVisible ? (
                          <button
                            onClick={handleViewResume}
                            className="px-3.5 py-2 bg-[#A855F7] hover:bg-[#8B5CF6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center space-x-1.5 animate-pulse cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>View Resume</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3.5 py-2 bg-[#1E1E24] text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#2E2E33] cursor-not-allowed flex items-center space-x-1.5"
                          >
                            <FileText size={12} />
                            <span>View Resume</span>
                          </button>
                        )}
                        {(!portfolio.resume?.fileName || !isResumeVisible || isAuthenticated) && (
                          <button
                            onClick={handleUploadResumeClick}
                            className="px-3.5 py-2 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <span>Upload Resume</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 4. Featured Projects */}
            {customSections.projects?.visible !== false && (
              <div id="projects" className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {customSections.projects?.title || "Featured Projects"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Verified project work and technical implementations.</p>
                  </div>
                  <Code size={16} className="text-[#A855F7]" />
                </div>

                {Array.isArray(visibleProjects) && visibleProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleProjects.map((proj, idx) => {
                      const status = proj.status || proj.approval_status || "Approved";
                      const isApproved = status === "Approved";
                      return (
                        <div key={idx} className="bg-[#111114]/80 backdrop-blur-sm border border-[#2E2E33] rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#A855F7]/40 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] shadow-lg">
                          <div className="space-y-3.5">
                            {/* Graphic visual block */}
                            <div className="w-full h-28 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-[#2E2E33] flex flex-col items-center justify-center text-[#A855F7] group-hover:from-purple-950/80 transition-all relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#A855F7]/10 rounded-full blur-xl"></div>
                              <Code size={24} className="mb-1 text-[#A855F7]" />
                              <span className="text-[9px] font-black font-mono tracking-widest uppercase opacity-75">
                                {proj.title ? proj.title.substring(0, 30) : "Project Asset"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-black uppercase text-white leading-snug truncate max-w-[200px]" title={proj.title}>
                                  {proj.title}
                                </h4>
                                <div className="flex items-center space-x-1.5 flex-shrink-0">
                                  {proj.github_link && (
                                    <a href={proj.github_link} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#050507] hover:bg-[#2E2E33] rounded-lg border border-[#2E2E33] text-[#A1A1AA] hover:text-[#A855F7] transition-all" title="View Source">
                                      <GithubIcon className="w-3 h-3" />
                                    </a>
                                  )}
                                  {proj.live_link && (
                                    <a href={proj.live_link} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#050507] hover:bg-[#2E2E33] rounded-lg border border-[#2E2E33] text-[#F5C542] hover:text-white transition-all flex items-center space-x-1 text-[9px] font-black uppercase" title="Live Demo">
                                      <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <span className="text-[9px] text-[#A855F7] font-bold uppercase tracking-wider block">Role: {proj.role || "Creator"}</span>
                            </div>

                            <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-semibold font-sans line-clamp-3">
                              {proj.description || "Verified competency development software project."}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#2E2E33]/30">
                              {Array.isArray(proj.tech_stack) ? proj.tech_stack.map((tech) => (
                                <span key={tech} className="px-2 py-0.5 bg-[#050507] text-[#A855F7] text-[8px] rounded-md font-extrabold uppercase border border-[#2E2E33] tracking-wide font-mono">
                                  {tech}
                                </span>
                              )) : null}
                            </div>
                          </div>

                          {/* Status bar */}
                          <div className="flex items-center justify-between text-[8px] font-bold border-t border-[#2E2E33]/30 pt-2 uppercase font-mono mt-1">
                            {isApproved ? (
                              <span className="flex items-center space-x-1 text-emerald-400 font-extrabold">
                                <ShieldCheck size={11} />
                                <span>Verified Milestone</span>
                              </span>
                            ) : (
                              <span className={`flex items-center space-x-1 ${status === "Pending" ? "text-amber-550" : status === "Rejected" ? "text-red-500" : "text-orange-500"}`}>
                                <AlertTriangle size={11} />
                                <span>{status}</span>
                              </span>
                            )}
                            {proj.submitted_date && <span className="text-[#71717A]">{proj.submitted_date}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-8 text-center space-y-3 hover:border-[#A855F7]/30 transition-all shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-[#050507] flex items-center justify-center text-[#71717A] mx-auto border border-[#2E2E33]">
                      <Code size={20} />
                    </div>
                    <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">No verified projects available yet.</h4>
                    <p className="text-[10px] text-[#71717A] font-semibold max-w-xs mx-auto leading-relaxed font-sans">
                      Once project submissions are uploaded and approved by the academic mentor, they will populate here dynamically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Certifications */}
            {customSections.certifications?.visible !== false && (
              <div id="certifications" className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {customSections.certifications?.title || "Certifications & Credentials"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Verified course records, global assessments, and professional credentials.</p>
                  </div>
                  <Award size={16} className="text-[#A855F7]" />
                </div>

                {Array.isArray(visibleCertifications) && visibleCertifications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleCertifications.map((c, idx) => {
                      const status = c.status || c.approval_status || "Approved";
                      const isApproved = status === "Approved";
                      return (
                        <div key={idx} className="bg-[#111114]/80 backdrop-blur-sm border border-[#2E2E33] rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#A855F7]/30 transition-all shadow-lg">
                          <div className="space-y-3">
                            {/* Mini Certificate Visual Placeholder */}
                            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-[#2E2E33] flex flex-col items-center justify-center text-[#F5C542] relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-12 h-12 bg-[#F5C542]/5 rounded-full blur-lg"></div>
                              <Award size={20} className="text-[#F5C542]" />
                              <span className="text-[8px] font-mono tracking-wider uppercase text-slate-400 mt-1">Verified Credential</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-[11px] font-black text-white uppercase tracking-tight leading-snug truncate max-w-[180px]" title={c.title}>
                                  {c.title}
                                </h5>
                                {c.verification_link && (
                                  <a href={c.verification_link} target="_blank" rel="noopener noreferrer" className="p-1 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded text-[#F5C542] transition-colors" title="Open Verification Link">
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                              <p className="text-[9px] text-[#A855F7] font-bold uppercase tracking-wider mt-0.5">{c.issuer}</p>
                            </div>

                            {c.credential_id && (
                              <p className="text-[8px] text-[#71717A] font-mono uppercase bg-[#050507] px-2 py-0.5 rounded border border-[#2E2E33] inline-block">
                                Key ID: {c.credential_id}
                              </p>
                            )}

                            <div className="flex items-center space-x-1.5 text-[9px] text-[#F5C542] font-black uppercase tracking-wider font-mono">
                              <Calendar size={10} />
                              <span>Issued: {c.issue_date || "N/A"}</span>
                            </div>
                          </div>

                          <div className="mt-2 w-full flex justify-between items-center text-[8px] uppercase font-bold border-t border-[#2E2E33]/30 pt-2 font-mono">
                            {isApproved ? (
                              <span className="text-emerald-400 font-extrabold uppercase flex items-center space-x-1">
                                <ShieldCheck size={11} />
                                <span>Verified Credentials</span>
                              </span>
                            ) : (
                              <span className={`font-extrabold uppercase ${status === "Pending" ? "text-amber-550" : status === "Rejected" ? "text-red-500" : "text-orange-500"}`}>
                                {status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-8 text-center space-y-3 hover:border-[#A855F7]/30 transition-all shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-[#050507] flex items-center justify-center text-[#71717A] mx-auto border border-[#2E2E33]">
                      <Award size={20} />
                    </div>
                    <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">No certifications available.</h4>
                    <p className="text-[10px] text-[#71717A] font-semibold max-w-xs mx-auto leading-relaxed font-sans">
                      Add verified credentials in the Student Dashboard to showcase global training, certificates, or course achievements.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Achievements */}
            {customSections.achievements?.visible !== false && (
              <div id="achievements" className="space-y-4 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      {customSections.achievements?.title || "Achievements & Honors"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans font-semibold">Academic awards, hackathon highlights, and workshop verifications.</p>
                  </div>
                  <Trophy size={16} className="text-[#A855F7]" />
                </div>

                {Array.isArray(visibleAchievements) && visibleAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleAchievements.map((ach, idx) => {
                      const status = ach.status || ach.approval_status || "Approved";
                      const isApproved = status === "Approved";
                      return (
                        <div key={idx} className="bg-[#111114]/80 backdrop-blur-sm border border-[#2E2E33] rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#A855F7]/30 transition-all shadow-lg">
                          <div className="space-y-3">
                            {/* Mini Trophy visual block */}
                            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-indigo-950/30 to-purple-950/40 border border-[#2E2E33] flex flex-col items-center justify-center text-[#F5C542] relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-full blur-lg"></div>
                              <Trophy size={20} className="text-[#F5C542] group-hover:scale-110 transition-transform" />
                              <span className="text-[8px] font-mono tracking-wider uppercase text-[#A855F7] mt-1">{ach.type || "Milestone"}</span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-xs font-black uppercase text-white leading-snug truncate max-w-[180px]" title={ach.title}>
                                  {ach.title}
                                </h4>
                                {ach.proof_link && (
                                  <a href={ach.proof_link} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-[#F5C542] hover:underline flex items-center space-x-1 flex-shrink-0 font-mono">
                                    <span>Verify</span>
                                    <ExternalLink size={9} />
                                  </a>
                                )}
                              </div>
                              <span className="text-[9px] text-[#A855F7] font-bold uppercase tracking-wider block font-mono">
                                Org: {ach.issuer || ach.organization || "Academic Event"}
                              </span>
                              <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-semibold pt-1 font-sans line-clamp-3">
                                {ach.description}
                              </p>
                            </div>
                          </div>

                          <div className="pl-0 flex items-center justify-between text-[8px] text-[#A1A1AA] font-bold border-t border-[#2E2E33]/30 pt-2 uppercase font-mono">
                            {isApproved ? (
                              <span className="flex items-center space-x-1 text-emerald-400">
                                <ShieldCheck size={11} />
                                <span>Student360 Verified</span>
                              </span>
                            ) : (
                              <span className={`flex items-center space-x-1 ${status === "Pending" ? "text-amber-550" : status === "Rejected" ? "text-red-500" : "text-orange-500"}`}>
                                <AlertTriangle size={11} />
                                <span>{status}</span>
                              </span>
                            )}
                            <span>Date: {ach.date || "N/A"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#111114]/80 backdrop-blur-md border border-[#2E2E33] rounded-2xl p-8 text-center space-y-3 hover:border-[#A855F7]/30 transition-all shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-[#050507] flex items-center justify-center text-[#71717A] mx-auto border border-[#2E2E33]">
                      <Trophy size={20} />
                    </div>
                    <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">No achievements logged.</h4>
                    <p className="text-[10px] text-[#71717A] font-semibold max-w-xs mx-auto leading-relaxed font-sans">
                      Log verified tournament placements, publication details, or technical competition achievements to display them here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Contact / Recruiter CTA */}
            {customSections.contact?.visible !== false && (
              <div id="contact" className="space-y-6 text-left">
                <div className="border-b border-[#2E2E33] pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {customSections.contact?.title || "Let’s Build Something Impactful"}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-bold mt-0.5 font-sans">Open to internships, AI projects, full stack development, and placement discussions.</p>
                  </div>
                  <Mail size={16} className="text-[#A855F7]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#111114]/80 backdrop-blur-sm border border-[#2E2E33] rounded-2xl p-5 md:col-span-2 space-y-4 shadow-lg hover:border-[#A855F7]/20 transition-all">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#71717A] font-mono">Student Verification Profile</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans">
                      Get in touch directly through official channels to enquire about project documentation, tech stacks, transcripts, or academic credentials.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[#A1A1AA] font-mono">
                      {customHero.showEmail !== false && (
                        <div className="flex items-center space-x-2.5 bg-[#050507] p-2.5 rounded-lg border border-[#2E2E33]">
                          <Mail size={14} className="text-[#A855F7] flex-shrink-0" />
                          <span className="text-white lowercase truncate">{portfolio.contact?.email}</span>
                        </div>
                      )}
                      {customHero.showPhone !== false && portfolio.contact?.phone && (
                        <div className="flex items-center space-x-2.5 bg-[#050507] p-2.5 rounded-lg border border-[#2E2E33]">
                          <Phone size={14} className="text-[#A855F7] flex-shrink-0" />
                          <span className="text-white">{portfolio.contact.phone}</span>
                        </div>
                      )}
                      {customHero.showLocation !== false && (
                        <div className="flex items-center space-x-2.5 bg-[#050507] p-2.5 rounded-lg border border-[#2E2E33]">
                          <MapPin size={14} className="text-[#A855F7] flex-shrink-0" />
                          <span className="text-white font-sans text-[11px] truncate">{customHero.location || portfolio.contact?.location || "Coimbatore, Tamil Nadu"}</span>
                        </div>
                      )}
                      {customHero.showRegisterNo !== false && (
                        <div className="flex items-center space-x-2.5 bg-[#050507] p-2.5 rounded-lg border border-[#2E2E33]">
                          <GraduationCap size={14} className="text-[#A855F7] flex-shrink-0" />
                          <span className="text-white font-sans text-[11px] truncate">KCE Campus Student ({portfolio.register_no})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-[9px] font-black uppercase">
                      {(customLinks.github || portfolio.contact?.github) && (
                        <a href={customLinks.github || portfolio.contact.github} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <GithubIcon className="w-3.5 h-3.5" />
                          <span>GitHub Profile</span>
                        </a>
                      )}
                      {(customLinks.linkedin || portfolio.contact?.linkedin) && (
                        <a href={customLinks.linkedin || portfolio.contact.linkedin} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                      {customLinks.leetcode && (
                        <a href={customLinks.leetcode} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <Code className="w-3.5 h-3.5 text-[#F5C542]" />
                          <span>LeetCode</span>
                        </a>
                      )}
                      {customLinks.hackerrank && (
                        <a href={customLinks.hackerrank} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <Trophy className="w-3.5 h-3.5 text-[#F5C542]" />
                          <span>HackerRank</span>
                        </a>
                      )}
                      {customLinks.website && (
                        <a href={customLinks.website} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>Website</span>
                        </a>
                      )}
                      {customLinks.resume && (
                        <a href={customLinks.resume} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2.5 bg-[#050507] hover:bg-[#2E2E33] border border-[#2E2E33] rounded-xl text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-green-400" />
                          <span>Resume Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#111114]/80 backdrop-blur-sm border border-[#2E2E33] rounded-2xl p-5 flex flex-col justify-between min-h-[200px] shadow-lg hover:border-[#A855F7]/20 transition-all">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#71717A] font-mono">Fast Email Connect</h4>
                    
                    <div className="p-3 bg-[#050507] text-[#A1A1AA] border border-[#2E2E33] rounded-xl text-center space-y-1.5 flex flex-col justify-center items-center my-auto">
                      <CheckCircle size={18} className="text-emerald-400" />
                      <p className="text-[9px] leading-relaxed font-bold font-sans">Contact channels verified by Karpagam Competency System.</p>
                    </div>
                    
                    <a 
                      href={`mailto:${portfolio.contact?.email}`}
                      className="w-full text-center py-2.5 bg-[#A855F7] hover:bg-[#8B5CF6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md mt-2 block"
                    >
                      Direct Email Connect
                    </a>
                  </div>
                </div>

                {/* Karpagam College Endorsement Badge */}
                <div className="pt-8 border-t border-[#2E2E33]/40 flex flex-col md:flex-row items-center justify-between gap-6 pb-6">
                  <div className="flex items-center space-x-4 text-left">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 font-mono text-xl shadow-lg flex-shrink-0">
                      🎓
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider leading-tight">Karpagam College of Engineering</h4>
                      <p className="text-[9px] text-[#A1A1AA] font-bold mt-1 font-sans max-w-sm">
                        Approved Student Intelligence Profile. Karpagam Campus, Coimbatore - 641032.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href={`mailto:${portfolio.contact?.email}?subject=Opportunity Inquiry`}
                      className="px-4 py-2 bg-[#A855F7] hover:bg-[#8B5CF6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                    >
                      Contact Student
                    </a>
                    <button
                      onClick={() => scrollToSection("resume")}
                      className="px-4 py-2 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      View Resume
                    </button>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="px-4 py-2 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Back to Top
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

      </div>

      {/* Resume Preview Modal */}
      {resumePreviewOpen && (
        <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-[#2E2E33] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-left relative">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#2E2E33] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <FileText size={16} className="text-[#A855F7]" />
                <span>Resume Preview</span>
              </h3>
              <button 
                onClick={() => setResumePreviewOpen(false)}
                className="text-[#A1A1AA] hover:text-white transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs font-semibold text-[#A1A1AA]">
              
              <div>
                <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Linked File Name</span>
                <span className="text-white text-xs mt-1 block font-mono bg-[#050507] p-2 rounded-lg border border-[#2E2E33]">
                  {portfolio?.resume?.fileName || "final resume shahul.pdf"}
                </span>
              </div>

              <div>
                <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Resume Title</span>
                <span className="text-white text-xs mt-1 block uppercase">
                  {portfolio?.resume?.resumeTitle || "Professional Resume"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Preferred Role</span>
                  <span className="text-[#F5C542] text-xs mt-1 block uppercase tracking-wide">
                    {portfolio?.resume?.primaryRole || "AI & Full Stack Engineer"}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Upload Status</span>
                  <span className="text-amber-500 text-xs mt-1 block uppercase font-mono">
                    Demo Metadata Only
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Career Objective</span>
                <p className="text-[11px] leading-relaxed font-sans text-slate-300 bg-[#050507] p-3 rounded-lg border border-[#2E2E33]">
                  {portfolio?.resume?.careerObjective || careerObjective}
                </p>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] uppercase font-bold text-[#71717A] tracking-wider font-mono">Key Skills Roster</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(portfolio?.resume?.keySkills || ["Python", "Java SE/EE", "Spring Boot", "React.js", "PostgreSQL", "Machine Learning"]).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-[#050507] text-[#A855F7] text-[9px] rounded font-extrabold uppercase border border-[#2E2E33]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Message */}
              <div className="bg-[#1C1C10]/40 border border-[#F5C542]/20 rounded-xl p-3 text-[10px] text-slate-300 leading-relaxed font-sans flex items-start space-x-2.5">
                <span className="text-[#F5C542] text-sm">💡</span>
                <div>
                  Actual PDF preview is not available in mock mode. Upload a resume from **Student Dashboard → My Resume** to attach a real document.
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-[#2E2E33] text-[9px] font-black uppercase tracking-wider font-mono">
              <button
                onClick={() => setResumePreviewOpen(false)}
                className="px-4 py-2.5 bg-[#111114] hover:bg-[#1E1E24] text-white border border-[#2E2E33] rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  setResumePreviewOpen(false);
                  handleUploadResumeClick(e);
                }}
                className="px-4 py-2.5 bg-[#A855F7] hover:bg-[#8B5CF6] text-white rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
              >
                <span>Go to My Resume</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default PortfolioPage;
