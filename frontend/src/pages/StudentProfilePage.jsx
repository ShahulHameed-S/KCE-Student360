import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { studentService } from "../services/studentService";
import { aiService } from "../services/aiService";
import { mentorService } from "../services/mentorService";
import { getStudentImageUrl } from "../utils/imageUtils";
import { safePercent } from "../utils/formatters";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, LineChart, Line
} from "recharts";
import {
  User,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Cpu,
  Award,
  FileBadge2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Brain,
  MessageSquare,
  ClipboardList,
  Target,
  AlertOctagon
} from "lucide-react";
import { mockStudents } from "../data/mockStudents";
import { mockPerformance } from "../data/mockPerformance";

export const StudentProfilePage = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      try {
        setLoading(true);
        setError("");
        
        const isDemo = String(id).toLowerCase().startsWith("22ad");
        
        if (isDemo) {
          const profileData = mockStudents.find(s => s.id === String(id) || s.register_no?.toLowerCase() === String(id).toLowerCase());
          if (!profileData) {
            throw { response: { status: 404 } };
          }
          const registerNo = profileData.register_no;
          const performanceData = mockPerformance[registerNo] || [];
          
          setStudent(profileData);
          setPerformance(performanceData);
          setApprovals([]);
          setAiSummary(null);
        } else {
          // 1. Fetch student details first
          const profileData = await studentService.getStudentById(id);
          
          // 2. Resolve register number
          const registerNo = profileData?.register_no ?? profileData?.registerNo ?? profileData?.student?.register_no ?? profileData?.student?.registerNo;
          
          if (!registerNo) {
            throw new Error("Student register number not resolved.");
          }

          // 3. Fetch performance & approvals safely using Promise.allSettled
          const [performanceResult, approvalsResult] = await Promise.allSettled([
            studentService.getStudentPerformance(registerNo),
            mentorService.getAllApprovals()
          ]);

          const performanceData = performanceResult.status === "fulfilled" && performanceResult.value
            ? performanceResult.value
            : (mockPerformance[registerNo] || []);
          const approvalsData = approvalsResult.status === "fulfilled" && approvalsResult.value
            ? approvalsResult.value
            : [];

          console.log("Student detail data:", profileData);
          console.log("Student performance data:", performanceData);

          setStudent(profileData);
          setPerformance(performanceData);
          setApprovals(approvalsData);
          setAiSummary(null);
        }
      } catch (err) {
        console.error("Student detail fetch failure:", err);
        if (err.response?.status === 404) {
          setError("Student not found");
        } else if (err.response?.status === 403) {
          setError("You are not assigned to this student");
        } else {
          setError("Failed to fetch student data records.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndHistory();
  }, [id]);

  const handleGenerateAiSummary = async () => {
    if (!student) return;
    setAiLoading(true);
    setAiError("");
    try {
      const summary = await aiService.generateAiSummary(student.register_no);
      setAiSummary(summary);
    } catch (err) {
      setAiError("AI Synthesis engine is currently offline. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Retrieving detailed student profile dossiers..." />;
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-[#B91C1C] px-6 py-4 rounded-none max-w-lg mx-auto text-center mt-12 shadow-none font-bold">
        <h3 className="font-bold text-base uppercase">Failed to Load Profile</h3>
        <p className="text-xs mt-1">{error || "Student record could not be found."}</p>
        <Link to="/students" className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-[#C76F2B] hover:underline uppercase tracking-wider">
          <ArrowLeft size={16} />
          <span>Back to Students List</span>
        </Link>
      </div>
    );
  }

  // Prepping domain chart data
  const chartData = Object.entries(student.domain_scores || {}).map(([name, score]) => ({
    name,
    score
  }));

  // Define colors for domain bars to look KCE branded
  const barColors = ["#214C55", "#C76F2B", "#214C55", "#C76F2B", "#214C55", "#C76F2B", "#214C55"];

  const getItemApproval = (title) => {
    if (!student || !approvals) return { status: "Approved" };
    const match = approvals.find(
      (app) =>
        app.register_no === student.register_no &&
        (app.title?.toLowerCase().includes(title?.toLowerCase().trim()) ||
         title?.toLowerCase().includes(app.title?.toLowerCase().trim()))
    );
    return match || { status: "Approved" };
  };

  const renderStatusBadge = (statusObj) => {
    const status = statusObj.status;
    const styles = {
      Approved: { bg: "bg-emerald-50 text-[#15803D] border-emerald-300", icon: CheckCircle2, text: "Verified" },
      Pending: { bg: "bg-amber-50 text-[#D97706] border-amber-300", icon: Clock, text: "Pending Verification" },
      Rejected: { bg: "bg-red-50 text-[#B91C1C] border-red-300", icon: XCircle, text: "Rejected" },
      "Correction Required": { bg: "bg-orange-50 text-[#C76F2B] border-orange-300", icon: AlertTriangle, text: "Correction Required" }
    };

    const cfg = styles[status] || styles.Approved;
    const Icon = cfg.icon;

    return (
      <div className="space-y-1.5 mt-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[8px] font-extrabold uppercase tracking-wider border ${cfg.bg}`}>
          <Icon size={10} />
          <span>{cfg.text}</span>
        </span>
        {statusObj.feedback && (
          <p className="text-[9px] text-[#C76F2B] bg-orange-50 p-2 border border-orange-200 mt-1 font-semibold leading-normal">
            <span className="font-extrabold uppercase tracking-wide text-[#C76F2B]">Note:</span> {statusObj.feedback}
          </p>
        )}
      </div>
    );
  };

  // Calculations for Performance Insights Tab safely safeguarded
  const perfArray = Array.isArray(performance) 
    ? performance 
    : (Array.isArray(performance?.score_history) 
        ? performance.score_history 
        : (Array.isArray(performance?.scoreHistory) 
            ? performance.scoreHistory 
            : []));
  const totalAssessments = perfArray.length;
  const avgTestScore = totalAssessments > 0
    ? Math.round(perfArray.reduce((acc, curr) => acc + (curr.percentage || curr.score || 0), 0) / totalAssessments)
    : 0;

  const sortedPerformance = [...perfArray].sort((a, b) => (b.percentage || b.score || 0) - (a.percentage || a.score || 0));
  const bestAssessment = sortedPerformance[0] || null;
  const worstAssessment = sortedPerformance[sortedPerformance.length - 1] || null;

  // Chronologically sorted test list for Area progress charts
  const chronologicalPerformance = [...perfArray].sort((a, b) => new Date(a.date || a.assessment_date) - new Date(b.date || b.assessment_date));

  const pScores = student?.domain_scores || student?.domainScores || {};

  // Domain Breakdown metrics
  const domainBreakdown = Object.entries(pScores).map(([name, score]) => {
    const tests = perfArray.filter(p => p.category === name || p.domain === name);
    const avgScore = tests.length > 0
      ? Math.round(tests.reduce((acc, curr) => acc + (curr.percentage || curr.score || 0), 0) / tests.length)
      : score;
    return {
      name,
      testCount: tests.length,
      avgScore
    };
  });

  // Strengths and weaknesses lists
  const keyStrengthsList = Object.entries(pScores)
    .filter(([_, score]) => score >= 90)
    .map(([name]) => name);

  const keyWeaknessesList = Object.entries(pScores)
    .filter(([_, score]) => score < 80)
    .map(([name]) => name);

  // Placement Readiness Calculation
  const coding = pScores.Coding || 0;
  const dsa = pScores.DSA || 0;
  const aptitude = pScores.Aptitude || 0;
  const tech = pScores.Technical || 0;
  const acad = pScores.Academic || 0;
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
    readinessColor = "text-emerald-700 bg-emerald-50 border-emerald-300";
  } else if (readinessScore >= 65) {
    readinessStatus = "Service Sector Ready";
    readinessColor = "text-indigo-700 bg-indigo-50 border-indigo-300";
  }

  // Recommended Improvement Plan list
  const getPlanDetails = (weakest) => {
    switch (weakest) {
      case "DBMS":
        return [
          "Complete SQL practice problems on LeetCode SQL Study Plan.",
          "Revise transaction isolation levels, normalization rules, and DB indexing strategies.",
          "Build a secondary mini-project featuring complex database queries, Joins, and trigger actions."
        ];
      case "DSA":
        return [
          "Solve 10 Medium-level Tree/Graph traversal issues on HackerRank/LeetCode.",
          "Focus on optimizing execution times and space complexities (Big O notations).",
          "Practice stack, queue, and custom sorting implementations from scratch weekly."
        ];
      case "Coding":
        return [
          "Participate in weekly competitive programming contest streams on CodeChef/LeetCode.",
          "Practice converting logical algorithms into compilation-ready scripts in under 35 minutes.",
          "Complete the Top Interview 150 list to enhance patterns recognition."
        ];
      case "Aptitude":
        return [
          "Solve quantitative reasoning worksheets daily on IndiaBIX.",
          "Take 3 timed mock assessments simulating AMCAT or CoCubes test series.",
          "Focus on arithmetic ratios, time-speed-distance equations, and calendar computations."
        ];
      default:
        return [
          "Review core laboratory manuals, codebases, and logic building exercises.",
          "Observe technical interviews online to improve verbal soft skill explanations.",
          "Enhance documentation habits inside active code projects."
        ];
    }
  };
  const dynamicPlan = getPlanDetails(student?.weakest_domain);

  const projects = Array.isArray(student?.projects) ? student.projects : [];
  const certifications = Array.isArray(student?.certifications) ? student.certifications : [];
  const achievements = Array.isArray(student?.achievements) ? student.achievements : [];

  // Mock AI summary
  const mockAiText = `AI Insights: ${student?.name} possesses superior competency in ${student?.strongest_domain} with an overall mastery score of ${pScores[student?.strongest_domain]}%. To maximize placements potential, intensive preparation is recommended in ${student?.weakest_domain} (${pScores[student?.weakest_domain]}%). Target timeline: 4 weeks of structured daily practice covering theoretical foundations and mock papers.`;

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* Back button and profile actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/students"
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7280] hover:text-[#214C55] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </Link>
        <div className="flex items-center space-x-3">
          {/* Main action in KCE orange */}
          <button
            onClick={handleGenerateAiSummary}
            disabled={aiLoading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none shadow-none flex items-center space-x-2 disabled:opacity-75 cursor-pointer"
          >
            <Sparkles size={14} className={aiLoading ? "animate-pulse" : ""} />
            <span>{aiLoading ? "Synthesizing AI Summary..." : "Generate AI Summary"}</span>
          </button>
          {/* Secondary action in KCE teal text, white bg */}
          {student?.external_portfolio_url ? (
            <>
              <a
                href={student.external_portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Student's External Personal Portfolio"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#214C55] hover:bg-[#163941] transition-all rounded-none shadow-none flex items-center space-x-2"
              >
                <span>Personal Portfolio</span>
                <ExternalLink size={14} />
              </a>
              <Link
                to={`/portfolio/${student.register_no}`}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white transition-all rounded-none shadow-none flex items-center space-x-2"
              >
                <span>Student360 Portfolio</span>
                <ExternalLink size={14} />
              </Link>
            </>
          ) : (
            <Link
              to={`/portfolio/${student.register_no}`}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#214C55] bg-white border border-[#214C55] hover:bg-[#214C55] hover:text-white transition-all rounded-none shadow-none flex items-center space-x-2"
            >
              <span>Open Portfolio</span>
              <ExternalLink size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="flex border-b border-[#D1D5DB] bg-white p-1 rounded-none shadow-sm">
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 sm:flex-none px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "about"
              ? "border-[#C76F2B] text-[#C76F2B] bg-[#F7F7F7]"
              : "border-transparent text-[#6B7280] hover:text-[#214C55] hover:bg-[#F9F9F9]"
          }`}
        >
          Overview & About
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex-1 sm:flex-none px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "performance"
              ? "border-[#C76F2B] text-[#C76F2B] bg-[#F7F7F7]"
              : "border-transparent text-[#6B7280] hover:text-[#214C55] hover:bg-[#F9F9F9]"
          }`}
        >
          Performance Insights
        </button>
      </div>

      {/* Tab 1: Overview & About */}
      {activeTab === "about" && (
        <div className="space-y-6">
          {/* Main Grid Layout: left card profile info, right domain graph */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Student Details Card */}
            <div className="bg-white rounded-none border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] shadow-none flex flex-col justify-between">
              <div className="p-6 text-center space-y-4 flex-1">
                {getStudentImageUrl(student) ? (
                  <img
                    src={getStudentImageUrl(student)}
                    alt={student?.name || "Student"}
                    className="w-20 h-20 rounded-none object-cover border border-[#D1D5DB] mx-auto"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.parentElement?.querySelector('.avatar-profile-fallback');
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div className={`avatar-profile-fallback w-20 h-20 rounded-none bg-[#F7F7F7] border border-[#D1D5DB] text-[#214C55] mx-auto text-2xl font-black shadow-none items-center justify-center ${getStudentImageUrl(student) ? "hidden" : "flex"}`}>
                  {(student?.name || "U").charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#214C55] uppercase tracking-wider">{student?.name || "N/A"}</h2>
                  <p className="text-xs text-[#6B7280] font-bold mt-0.5">{student?.register_no || student?.registerNo || "N/A"}</p>
                </div>
                <div className="pt-4 border-t border-[#E5E5E5] grid grid-cols-2 gap-4 text-left text-xs font-bold text-[#6B7280]">
                  <div>
                    <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Dept</span>
                    <span className="text-[#214C55] font-extrabold block mt-0.5">{student?.department || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Class</span>
                    <span className="text-[#214C55] font-extrabold block mt-0.5">
                      {student?.year || student?.section ? `Year ${student?.year || "N/A"} - ${student?.section || "N/A"}` : "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2">
                    <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">Email Address</span>
                    <span className="text-[#214C55] font-extrabold block mt-0.5 lowercase">{student?.email || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Footer */}
              <div className="bg-[#F7F7F7] px-6 py-4 border-t border-[#D1D5DB] grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider">Overall</span>
                  <div className="mt-1">
                    <ScoreBadge score={student.overall_score} />
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider">Strongest</span>
                  <div className="mt-1">
                    <DomainBadge domain={student.strongest_domain} />
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold text-[#6B7280] uppercase tracking-wider">Weakest</span>
                  <div className="mt-1">
                    <DomainBadge domain={student.weakest_domain} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recharts Domain Score Graph */}
            <div className="lg:col-span-2 bg-white p-5 rounded-none border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider mb-0.5">Competency Mapping</h3>
                <p className="text-xs text-[#6B7280] font-semibold">Domain-wise proficiency index based on verified tests</p>
              </div>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "#F7F7F7" }}
                      contentStyle={{ background: "#163941", border: "1px solid #D1D5DB", color: "#fff", borderRadius: "0px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}
                      itemStyle={{ fontSize: "11px", color: "#F5C542" }}
                    />
                    <Bar dataKey="score" radius={[0, 0, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Summary Output Section */}
          {aiLoading && (
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none animate-pulse space-y-4">
              <div className="flex items-center space-x-2 text-[#C76F2B]">
                <Sparkles className="animate-spin text-[#C76F2B]" size={18} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">AI Diagnostics Engine Processing...</h3>
              </div>
              <div className="h-3 bg-[#F7F7F7] w-3/4"></div>
              <div className="h-3 bg-[#F7F7F7] w-5/6"></div>
            </div>
          )}

          {aiError && (
            <div className="bg-red-50 border border-red-200 text-[#B91C1C] px-4 py-3 rounded-none flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
              <AlertCircle size={16} />
              <span>{aiError}</span>
            </div>
          )}

          {aiSummary && (
            <div className="bg-white p-6 rounded-none border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] shadow-none space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2 text-[#214C55]">
                  <Sparkles size={18} className="text-[#C76F2B]" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Competency Synthesis Report</h3>
                </div>
                <span className="text-[9px] font-extrabold text-white uppercase tracking-widest px-2.5 py-0.5 bg-[#C76F2B] border border-[#C76F2B]">
                  LLM Generated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">Executive Summary</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed font-semibold">{aiSummary.summary}</p>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">Placement Preparation Advice</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-[#F7F7F7] p-3 rounded-none border border-[#D1D5DB] font-semibold">
                      {aiSummary.placement_advice}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-[#E5E5E5] md:pl-6">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">Key Strengths (Verified)</h4>
                    <ul className="mt-1.5 space-y-1.5 text-xs text-slate-650 font-medium">
                      {aiSummary.strengths.map((str, idx) => (
                        <li key={idx} className="leading-relaxed flex items-start space-x-2">
                          <span className="inline-flex items-center justify-center bg-orange-50 text-[#C76F2B] border border-orange-200 px-1 py-0.5 text-[8px] font-extrabold uppercase mt-0.5">Strength</span>
                          <span className="text-[#111827] font-bold">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">Development Areas</h4>
                    <ul className="mt-1.5 space-y-1.5 text-xs text-slate-650 font-bold list-disc list-inside">
                      {aiSummary.weaknesses.map((w, idx) => (
                        <li key={idx} className="leading-relaxed"><span className="text-slate-700 font-semibold">{w}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">Learning Suggestions</h4>
                    <ul className="mt-1.5 space-y-1.5 text-xs text-slate-650 font-bold list-disc list-inside">
                      {aiSummary.suggestions.map((s, idx) => (
                        <li key={idx} className="leading-relaxed"><span className="text-slate-700 font-semibold">{s}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complete Performance Score History Table */}
          <div className="bg-white p-5 rounded-none border border-[#D1D5DB] shadow-none space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Historical Assessment Logs</h3>
              <p className="text-xs text-[#6B7280] font-semibold">Raw score lists compiled chronologically across all semesters</p>
            </div>

            <div className="overflow-x-auto border border-[#D1D5DB]">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[10px] font-extrabold text-[#214C55] uppercase tracking-wider">
                    <th className="px-6 py-2.5">Date</th>
                    <th className="px-6 py-2.5">Assessment Name</th>
                    <th className="px-6 py-2.5">Category</th>
                    <th className="px-6 py-2.5 text-center">Score</th>
                    <th className="px-6 py-2.5 text-center">Max Marks</th>
                    <th className="px-6 py-2.5 text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                  {perfArray.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#6B7280] font-semibold">
                        No historical assessment records located for this student.
                      </td>
                    </tr>
                  ) : (
                    perfArray.map((log, index) => (
                      <tr key={index} className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-xs text-[#6B7280] flex items-center space-x-1.5 font-bold">
                          <Calendar size={13} className="text-[#6B7280]" />
                          <span>{log.date}</span>
                        </td>
                        <td className="px-6 py-3 text-[#214C55]">{log.assessment_name}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <DomainBadge domain={log.category} />
                        </td>
                        <td className="px-6 py-3 text-center text-slate-800">{log.score}</td>
                        <td className="px-6 py-3 text-center text-[#6B7280]">{log.max_marks}</td>
                        <td className="px-6 py-3 text-center whitespace-nowrap">
                          <ScoreBadge score={log.percentage} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid for Projects, Certifications, and Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Projects Card */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-none space-y-4">
              <div className="flex items-center space-x-2 text-[#214C55] border-b border-[#E5E5E5] pb-3">
                <Cpu size={16} className="text-[#C76F2B]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Verified Projects ({projects.length})</h3>
              </div>
              {projects.length === 0 ? (
                <p className="text-xs text-[#6B7280] font-semibold">No projects verified for this student.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => {
                    const approval = getItemApproval(proj.title);
                    return (
                      <div key={proj.id} className="p-3 bg-[#F7F7F7] rounded-none border border-[#D1D5DB] space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{proj.title}</h4>
                            <p className="text-[9px] text-[#6B7280] font-bold">Role: {proj.role}</p>
                          </div>
                          {proj.github_link && (
                            <a href={proj.github_link} target="_blank" rel="noopener noreferrer" className="text-[#C76F2B] hover:text-[#A8561F]">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed font-semibold">{proj.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {proj.tech_stack.map((tech) => (
                            <span key={tech} className="px-1.5 py-0.5 bg-[#E5E5E5] text-[#214C55] text-[9px] rounded-none border border-[#D1D5DB] font-extrabold uppercase">
                              {tech}
                            </span>
                          ))}
                        </div>
                        {renderStatusBadge(approval)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Certifications Card */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-none space-y-4">
              <div className="flex items-center space-x-2 text-[#214C55] border-b border-[#E5E5E5] pb-3">
                <FileBadge2 size={16} className="text-[#C76F2B]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Verified Credentials ({certifications.length})</h3>
              </div>
              {certifications.length === 0 ? (
                <p className="text-xs text-[#6B7280] font-semibold">No certifications verified for this student.</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((c) => {
                    const approval = getItemApproval(c.title);
                    return (
                      <div key={c.id} className="p-3 bg-[#F7F7F7] rounded-none border border-[#D1D5DB] space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-[#214C55] uppercase">{c.title}</h4>
                            <p className="text-[9px] text-[#6B7280] font-bold">Issuer: {c.issuer}</p>
                            <p className="text-[9px] text-[#6B7280] font-bold flex items-center space-x-1">
                              <Calendar size={10} className="text-[#6B7280]" />
                              <span>{c.issue_date}</span>
                            </p>
                          </div>
                          {c.verification_link && (
                            <a href={c.verification_link} target="_blank" rel="noopener noreferrer" className="p-1 bg-white border border-[#D1D5DB] text-[#C76F2B] hover:bg-[#C76F2B] hover:text-white transition-all shadow-none">
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        {renderStatusBadge(approval)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Achievements Card */}
            <div className="bg-white p-5 rounded-none border border-[#D1D5DB] border-t-4 border-t-[#214C55] shadow-none space-y-4">
              <div className="flex items-center space-x-2 text-[#214C55] border-b border-[#E5E5E5] pb-3">
                <Award size={16} className="text-[#C76F2B]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Honors & Achievements ({achievements.length})</h3>
              </div>
              {achievements.length === 0 ? (
                <p className="text-xs text-[#6B7280] font-semibold">No achievements logged for this student.</p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((ach) => {
                    const approval = getItemApproval(ach.title);
                    return (
                      <div key={ach.id} className="p-3 bg-[#F7F7F7] rounded-none border border-[#D1D5DB] space-y-1.5">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-extrabold text-[#214C55] uppercase leading-tight">{ach.title}</h4>
                          {ach.proof_link && (
                            <a href={ach.proof_link} target="_blank" rel="noopener noreferrer" className="text-[#C76F2B] hover:text-[#A8561F]">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed font-semibold">{ach.description}</p>
                        <p className="text-[9px] text-[#6B7280] font-bold flex items-center space-x-1">
                          <Calendar size={10} className="text-[#6B7280]" />
                          <span>{ach.date}</span>
                        </p>
                        {renderStatusBadge(approval)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Enhanced Performance Insights */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* Section 1: Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-[#D1D5DB] border-t-4 border-t-[#214C55] p-4 flex flex-col justify-between text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black">Overall Score</div>
              <div className="text-2xl font-black text-[#214C55] mt-1">{safePercent(student?.overall_score ?? student?.overallScore ?? 0, 1)}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium font-sans">Baseline competency level</div>
            </div>
            <div className="bg-white border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] p-4 flex flex-col justify-between text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black">Evaluation Volume</div>
              <div className="text-2xl font-black text-[#C76F2B] mt-1">{totalAssessments} Tests</div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium font-sans">Completed evaluations log</div>
            </div>
            <div className="bg-white border border-[#D1D5DB] border-t-4 border-t-[#214C55] p-4 flex flex-col justify-between text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black">Average Test Score</div>
              <div className="text-2xl font-black text-[#214C55] mt-1">{avgTestScore}%</div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium font-sans">Mean percentage in tests</div>
            </div>
            <div className="bg-white border border-[#D1D5DB] border-t-4 border-t-emerald-600 p-4 flex flex-col justify-between text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black">Best Assessment</div>
              {bestAssessment ? (
                <>
                  <div className="text-sm font-black text-emerald-600 truncate mt-1">{bestAssessment.assessment_name}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5 font-bold">{bestAssessment.percentage}% Score</div>
                </>
              ) : (
                <div className="text-xs text-[#6B7280] mt-1 font-bold">N/A</div>
              )}
            </div>
            <div className="bg-white border border-[#D1D5DB] border-t-4 border-t-amber-600 p-4 flex flex-col justify-between text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black">Lowest Assessment</div>
              {worstAssessment ? (
                <>
                  <div className="text-sm font-black text-amber-600 truncate mt-1">{worstAssessment.assessment_name}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5 font-bold">{worstAssessment.percentage}% Score</div>
                </>
              ) : (
                <div className="text-xs text-[#6B7280] mt-1 font-bold">N/A</div>
              )}
            </div>
          </div>

          {/* Section 2: Domain Performance Overview & Assessment Progress Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Domain Overview: 5 Cols */}
            <div className="lg:col-span-5 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left">
                <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Domain Performance Overview</h3>
                <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Proficiency indexes across training fields</p>
              </div>
              <div className="space-y-3.5 flex-1 justify-center flex flex-col">
                {Object.entries(student?.domain_scores || {}).map(([name, score]) => {
                  const barColor = score >= 90 ? "bg-[#214C55]" : score >= 80 ? "bg-[#C76F2B]" : "bg-slate-500";
                  const level = score >= 90 ? "Outstanding" : score >= 80 ? "Excellent" : score >= 70 ? "Very Good" : "Good";
                  return (
                    <div key={name} className="space-y-1 text-left font-sans">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{name}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] text-[#6B7280] font-extrabold uppercase">{level}</span>
                          <span className="text-[#214C55] font-black">{score}/100</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#E5E5E5] h-2 rounded-none overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Progress Trend: 7 Cols */}
            <div className="lg:col-span-7 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Assessment Progress Trend</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Timeline of performance indices over semesters</p>
                </div>
                <TrendingUp size={16} className="text-[#C76F2B]" />
              </div>
              <div className="h-64 w-full pt-2">
                {chronologicalPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chronologicalPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#214C55" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#214C55" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#163941", border: "1px solid #D1D5DB", color: "#fff", borderRadius: "0px" }}
                        labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                        itemStyle={{ fontSize: "11px", color: "#F5C542" }}
                      />
                      <Area type="monotone" dataKey="percentage" stroke="#214C55" strokeWidth={2} fillOpacity={1} fill="url(#colorPercentage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#6B7280] font-bold font-sans">
                    No progression data available.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Section 3: Domain Breakdown Table & Complete Assessment History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Domain Breakdown Table: 6 Cols */}
            <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left">
                <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Domain Breakdown Table</h3>
                <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Quantitative analysis aggregated by training domain</p>
              </div>
              <div className="overflow-x-auto border border-[#D1D5DB] flex-1">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[9px] font-black text-[#214C55] uppercase tracking-wider">
                      <th className="py-2 px-3">Domain</th>
                      <th className="py-2 px-3 text-center">Tests Taken</th>
                      <th className="py-2 px-3 text-center">Average Score</th>
                      <th className="py-2 px-3 text-center">Mastery level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827] font-sans">
                    {domainBreakdown.map((row) => {
                      const mastery = row.avgScore >= 90 ? "Expert" : row.avgScore >= 80 ? "Proficient" : "Intermediate";
                      const masteryColor = row.avgScore >= 90 ? "text-emerald-700 bg-emerald-50" : row.avgScore >= 80 ? "text-[#C76F2B] bg-orange-50" : "text-slate-700 bg-slate-50";
                      return (
                        <tr key={row.name} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-2.5 px-3 text-[#214C55] font-black">{row.name}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{row.testCount} logged</td>
                          <td className="py-2.5 px-3 text-center text-slate-800">{row.avgScore}%</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase border ${masteryColor}`}>
                              {mastery}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Assessment History: 6 Cols */}
            <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left">
                <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Complete Assessment History</h3>
                <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Full logs of completed tests and grades</p>
              </div>
              <div className="overflow-x-auto border border-[#D1D5DB] max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-[9px] font-black text-[#214C55] uppercase tracking-wider sticky top-0">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Assessment</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827] font-sans">
                    {perfArray.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#6B7280] font-bold uppercase tracking-wider">No evaluations logged.</td>
                      </tr>
                    ) : (
                      perfArray.map((log, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{log.date}</td>
                          <td className="py-2 px-3 text-[#214C55] font-black truncate max-w-[150px]">{log.assessment_name}</td>
                          <td className="py-2 px-3"><DomainBadge domain={log.category} /></td>
                          <td className="py-2 px-3 text-center text-[#C76F2B]">{log.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Section 4: Strength & Weakness Analysis & Placement Readiness Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Strength & Weakness: 6 Cols */}
            <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left">
                <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Strength & Weakness Analysis</h3>
                <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Qualitative analysis of core knowledge domains</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-xs text-left font-sans">
                {/* Strengths */}
                <div className="bg-emerald-50/50 p-4 border border-emerald-200/65 space-y-3">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-black uppercase text-[10px]">
                    <CheckCircle2 size={14} />
                    <span>Verified Strengths</span>
                  </div>
                  {keyStrengthsList.length > 0 ? (
                    <ul className="space-y-2 text-slate-700 font-bold">
                      {keyStrengthsList.map(item => (
                        <li key={item} className="flex items-start space-x-1">
                          <span className="text-emerald-600 font-black mr-1">✓</span>
                          <span>{item} (Mastery level)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6B7280] font-semibold text-[10px] italic">No domain currently rated above 90%.</p>
                  )}
                </div>

                {/* Weaknesses */}
                <div className="bg-amber-50/50 p-4 border border-amber-200/65 space-y-3">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-black uppercase text-[10px]">
                    <AlertTriangle size={14} />
                    <span>Target Growth Areas</span>
                  </div>
                  {keyWeaknessesList.length > 0 ? (
                    <ul className="space-y-2 text-slate-700 font-bold">
                      {keyWeaknessesList.map(item => (
                        <li key={item} className="flex items-start space-x-1">
                          <span className="text-amber-600 font-black mr-1">⚠</span>
                          <span>{item} (Needs revision)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6B7280] font-semibold text-[10px] italic">All domains are consistently above 80% baseline.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Placement Readiness Analysis: 6 Cols */}
            <div className="lg:col-span-6 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left">
                <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Placement Readiness Analysis</h3>
                <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Calculated index of candidate interview readiness</p>
              </div>
              <div className="bg-[#F7F7F7] p-5 border border-[#D1D5DB] flex flex-col sm:flex-row items-center sm:justify-between gap-4 flex-1 text-left font-sans">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-wider text-[#6B7280] font-black block">Readiness Index</span>
                  <div className="text-3xl font-black text-[#214C55]">{readinessScore}/100</div>
                  <p className="text-[10px] text-[#6B7280] font-semibold leading-relaxed max-w-[280px]">
                    Weighted score based on Coding (35%), DSA (25%), Aptitude (20%), Technical (10%), and Academics (10%).
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-[#D1D5DB] text-center w-full sm:w-auto min-w-[150px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-[#6B7280]">Recruitment Tier</span>
                  <div className={`mt-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider border rounded-none ${readinessColor}`}>
                    {readinessStatus}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Section 5: Recommended Improvement Plan & AI Performance Summary & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Recommended Improvement Plan: 4 Cols */}
            <div className="lg:col-span-4 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Recommended Improvement Plan</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Personalized tasks targeting weaknesses</p>
                </div>
                <Target size={16} className="text-[#C76F2B]" />
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 font-bold text-left font-sans flex-1 justify-center flex flex-col">
                {dynamicPlan.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                    <span className="inline-flex items-center justify-center bg-orange-100 text-[#C76F2B] w-5 h-5 rounded-none font-black text-[9px] shrink-0 border border-orange-200">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Performance Summary: 4 Cols */}
            <div className="lg:col-span-4 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">AI Performance Summary</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Synthesized LLM evaluation</p>
                </div>
                <Brain size={16} className="text-[#A855F7]" />
              </div>
              <div className="bg-purple-50/40 p-4 border border-purple-200/50 flex-1 flex items-center text-left font-sans">
                <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                  "{mockAiText}"
                </p>
              </div>
            </div>

            {/* Faculty/Mentor Notes Preview: 4 Cols */}
            <div className="lg:col-span-4 bg-white p-5 border border-[#D1D5DB] shadow-sm flex flex-col space-y-4">
              <div className="border-b border-[#E5E5E5] pb-2 text-left flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#214C55] uppercase tracking-wider">Faculty/Mentor Notes Preview</h3>
                  <p className="text-[10px] text-[#6B7280] font-semibold font-sans">Qualitative notes from assigned counselor</p>
                </div>
                <MessageSquare size={16} className="text-[#214C55]" />
              </div>
              <div className="bg-[#F7F7F7] p-4 border border-[#D1D5DB] flex-1 flex flex-col justify-between text-left font-sans">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Counselor Feedback</span>
                    <span className="text-[8px] font-black text-[#6B7280]">Updated 2 days ago</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    "Demonstrates consistent analytical focus. Coding velocity is outstanding. Recommended to participate in verbal communication groups to enhance interview interaction poise."
                  </p>
                </div>
                <div className="border-t border-[#D1D5DB] pt-2.5 mt-2 flex items-center space-x-2 text-[9px] text-[#214C55] font-extrabold">
                  <GraduationCap size={14} className="text-[#C76F2B]" />
                  <span>Counselor Code: IT-KCE-024</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
