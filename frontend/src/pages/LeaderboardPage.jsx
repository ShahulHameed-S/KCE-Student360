import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { leaderboardService } from "../services/leaderboardService";
import { mockStudents } from "../data/mockStudents";
import { useAuth } from "../hooks/useAuth";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Trophy, ShieldAlert, Award, ExternalLink, UserSquare2, Sparkles } from "lucide-react";

import { resolveImageUrl, getStudentImageUrl } from "../utils/imageUtils";

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);

  // State for Top 3 student popup/modal details
  const [activeStudentPopover, setActiveStudentPopover] = useState(null);

  // Image load error tracking
  const [imgErrors, setImgErrors] = useState({});
  const handleImgError = (regNo) => {
    setImgErrors(prev => ({
      ...prev,
      [regNo]: true
    }));
  };

  const domains = [
    { value: "Overall", label: "Overall Batch" },
    { value: "DSA", label: "Data Structures & Algorithms" },
    { value: "DBMS", label: "Database Systems (DBMS)" },
    { value: "FullStack", label: "Full-Stack Development" },
    { value: "Aptitude", label: "Quantitative Aptitude" },
    { value: "Coding", label: "Competitive Coding" },
    { value: "Academic", label: "Academic Curriculars" },
    { value: "Technical", label: "Core Technical labs" }
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");
        let response;
        if (selectedDomain === "Overall") {
          response = await leaderboardService.getOverallLeaderboard();
        } else {
          response = await leaderboardService.getLeaderboardByDomain(selectedDomain);
        }

        // Safe array normalization
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.students)
              ? response.students
              : Array.isArray(response?.leaderboard)
                ? response.leaderboard
                : [];

        if (!import.meta.env.PROD) {
          console.log("Leaderboard role:", user?.role);
          console.log("Leaderboard domain:", selectedDomain);
          console.log("Leaderboard response count:", data.length);
        }

        setLeaderboardData(data);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError("Failed to resolve batch ranking matrix.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedDomain, user]);

  // Helper to compute initials
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const normalizeDomain = (value) => {
    switch (value) {
      case "Overall Batch":
      case "Overall":
        return "Overall";
      case "DSA":
      case "DBMS":
      case "FullStack":
      case "Aptitude":
      case "Coding":
      case "Academic":
      case "Technical":
        return value;
      default:
        return "Overall";
    }
  };

  const getScore = (student, domain) => {
    if (!student) return 0;
    const normalized = normalizeDomain(domain);
    if (normalized === "Overall") {
      return student.overall_score || student.overallScore || 0;
    }
    return student.domain_scores?.[normalized] || student.domainScores?.[normalized] || 0;
  };

  const { sortedStudents, podiumStudents, remainingStudents } = React.useMemo(() => {
    let sorted = [];
    if (demoMode) {
      sorted = [...mockStudents].map(s => ({
        ...s,
        register_no: s.register_no ?? s.registerNo,
        registerNo: s.register_no ?? s.registerNo,
        profile_image: getStudentImageUrl(s),
        profileImage: getStudentImageUrl(s),
        score: getScore(s, selectedDomain)
      })).sort((a, b) => b.score - a.score);
      sorted = sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));
    } else if (leaderboardData && leaderboardData.length > 0) {
      sorted = leaderboardData.map((item) => {
        const scoreVal = selectedDomain === "Overall" 
          ? (item.overall_score ?? item.overallScore)
          : (item.domain_score ?? item.domainScore);
        return {
          id: item.id,
          name: item.name,
          register_no: item.register_no ?? item.registerNo,
          registerNo: item.register_no ?? item.registerNo,
          department: item.department,
          year: item.year,
          section: item.section,
          batch: item.batch,
          overall_score: item.overall_score ?? item.overallScore,
          strongest_domain: item.strongest_domain ?? item.strongestDomain ?? "Not added",
          weakest_domain: item.weakest_domain ?? item.weakestDomain ?? "Not added",
          profile_image: getStudentImageUrl(item),
          profileImage: getStudentImageUrl(item),
          score: scoreVal,
          rank: item.rank
        };
      });
    }

    const podium = [];
    const rank1 = sorted.find(s => s.rank === 1);
    const rank2 = sorted.find(s => s.rank === 2);
    const rank3 = sorted.find(s => s.rank === 3);

    if (rank2) {
      podium.push({
        ...rank2,
        pedestalHeight: "h-28 md:h-32",
        pedestalColor: "from-slate-200 to-slate-300 text-slate-700",
        borderColor: "border-slate-300",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-300"
      });
    }
    if (rank1) {
      podium.push({
        ...rank1,
        pedestalHeight: "h-36 md:h-44",
        pedestalColor: "from-amber-200 to-amber-300 text-amber-800",
        borderColor: "border-amber-400",
        badgeColor: "bg-amber-100 text-[#D97706] border-amber-300"
      });
    }
    if (rank3) {
      podium.push({
        ...rank3,
        pedestalHeight: "h-20 md:h-24",
        pedestalColor: "from-orange-200 to-orange-300 text-orange-950",
        borderColor: "border-orange-200",
        badgeColor: "bg-orange-100 text-[#C76F2B] border-orange-200"
      });
    }

    const podiumIds = new Set(podium.map(s => s.id || s.register_no));
    const remaining = sorted.filter(s => !podiumIds.has(s.id || s.register_no));

    return { sortedStudents: sorted, podiumStudents: podium, remainingStudents: remaining };
  }, [selectedDomain, leaderboardData, demoMode]);

  const orderClasses = {
    1: "order-1 md:order-2",
    2: "order-2 md:order-1",
    3: "order-3 md:order-3"
  };

  const rankTitles = {
    1: "Ultimate Champion",
    2: "Top Performer",
    3: "Top Performer"
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* Header & Domain Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D1D5DB] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#214C55] uppercase tracking-wider">Institutional Leaderboards</h1>
          <p className="text-xs text-[#6B7280] font-semibold mt-1">
            Analyze ranks and competency listings based on overall score averages or domain assessment performance.
          </p>
        </div>

        {/* Domain selection select box */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-[#D1D5DB] rounded-none">
          <label htmlFor="domain-select" className="text-[10px] font-extrabold text-[#6B7280] flex items-center space-x-1.5 whitespace-nowrap uppercase tracking-wider">
            <Award size={14} className="text-[#C76F2B]" />
            <span>Leaderboard:</span>
          </label>
          <select
            id="domain-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] font-bold text-slate-700 cursor-pointer"
          >
            {domains.map((dom) => (
              <option key={dom.value} value={dom.value}>
                {dom.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Status Banner and Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border border-[#D1D5DB] rounded-none shadow-none">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${demoMode ? "bg-amber-500 animate-pulse" : "bg-[#C76F2B]"}`} />
          <span className="text-xs font-black uppercase tracking-wider text-[#214C55]">
            {demoMode 
              ? "Demo Mode Enabled — Showing sample leaderboard for review explanation" 
              : "Live Data Mode — Showing uploaded students from database"}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-[#6B7280] cursor-pointer select-none" htmlFor="demo-toggle-lb">
            Demo Mode (Review)
          </label>
          <input
            id="demo-toggle-lb"
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="w-4 h-4 text-[#C76F2B] border-[#D1D5DB] focus:ring-[#C76F2B] rounded-none cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text={`Calculating ${selectedDomain} ranking statistics...`} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-[#B91C1C] p-4 rounded-none flex items-center space-x-3 text-xs max-w-lg mx-auto shadow-none font-bold">
          <ShieldAlert size={20} className="text-[#B91C1C] flex-shrink-0" />
          <div>
            <h4 className="font-extrabold uppercase">Ranking Aggregation Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="bg-white border border-[#D1D5DB] p-8 text-center max-w-lg mx-auto mt-6">
          <ShieldAlert className="w-12 h-12 text-[#C76F2B] mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-[#214C55] uppercase tracking-wider">
            {user?.role === "mentor" ? "No students assigned yet" : "No leaderboard data available yet"}
          </h3>
          <p className="text-xs text-[#6B7280] font-semibold mt-1">
            {user?.role === "mentor"
              ? "You do not have any students assigned to your classes yet."
              : "No performance records were found for the selected filter criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* Podium section */}
          {podiumStudents.length > 0 && (
            <div className="bg-white border border-[#D1D5DB] p-6 rounded-none space-y-6">
              <div className="text-center border-b border-[#E5E5E5] pb-4">
                <h3 className="text-sm font-black text-[#214C55] uppercase tracking-wider flex items-center justify-center space-x-2">
                  <Sparkles size={16} className="text-[#C76F2B]" />
                  <span>Top performers - {selectedDomain}</span>
                  <Sparkles size={16} className="text-[#C76F2B]" />
                </h3>
                <p className="text-[11px] text-[#6B7280] font-semibold mt-0.5">Click a top student to view their details or open their portfolio card.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 pt-4 max-w-4xl mx-auto">
                {podiumStudents.map((student) => {
                  const isError = imgErrors[student.register_no];
                  const showInitials = isError || !student.profile_image;

                  return (
                    <div
                      key={student.register_no}
                      className={`flex flex-col items-center justify-end ${orderClasses[student.rank]} w-full max-w-[220px]`}
                    >
                      {/* Student Info Card */}
                      <div className="bg-white border border-[#D1D5DB] p-4 w-full flex flex-col items-center relative z-10 shadow-sm space-y-2 mb-[-1px]">
                        {/* Image & Rank badge wrapper */}
                        <div className="relative">
                          {showInitials ? (
                            <div
                              onClick={() => setActiveStudentPopover(student)}
                              className={`rounded-full bg-[#214C55] text-white flex items-center justify-center text-lg font-black border-4 ${student.borderColor} hover:scale-105 transition-transform duration-200 cursor-pointer ${
                                student.rank === 1 ? "w-24 h-24 md:w-28 md:h-28" : "w-20 h-20 md:w-24 md:h-24"
                              }`}
                            >
                              {getInitials(student.name)}
                            </div>
                          ) : (
                            <img
                              src={student.profile_image}
                              alt={student.name}
                              onError={() => handleImgError(student.register_no)}
                              onClick={() => setActiveStudentPopover(student)}
                              className={`rounded-full object-cover border-4 ${student.borderColor} hover:scale-105 transition-transform duration-200 cursor-pointer ${
                                student.rank === 1 ? "w-24 h-24 md:w-28 md:h-28" : "w-20 h-20 md:w-24 md:h-24"
                              }`}
                            />
                          )}
                          {/* Gold, Silver, Bronze Badge absolute positioned */}
                          <span className={`absolute bottom-0 right-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black border shadow-md ${student.badgeColor}`}>
                            {student.rank}
                          </span>
                        </div>

                        {/* Name / RegNo / Score */}
                        <div className="text-center space-y-0.5">
                          <h4
                            onClick={() => setActiveStudentPopover(student)}
                            className="text-xs font-black text-[#214C55] uppercase tracking-wide hover:underline cursor-pointer"
                          >
                            {student.name}
                          </h4>
                          <p className="text-[9px] text-[#6B7280] font-bold uppercase">{student.register_no}</p>
                        </div>

                        <div className="flex flex-col items-center space-y-1 pt-1">
                          <ScoreBadge score={student.score} />
                          <DomainBadge domain={student.strongest_domain} />
                          <span className="text-[9px] font-black uppercase text-[#C76F2B] mt-1 bg-orange-50 px-2 py-0.5 border border-orange-200">
                            {rankTitles[student.rank]}
                          </span>
                        </div>
                      </div>

                      {/* Pedestal block */}
                      <div className={`w-full bg-gradient-to-b ${student.pedestalColor} ${student.pedestalHeight} border border-[#D1D5DB] flex flex-col items-center justify-center shadow-inner`}>
                        <span className="text-3xl font-black tracking-tighter">{student.rank === 1 ? "1st" : student.rank === 2 ? "2nd" : "3rd"}</span>
                        {student.rank === 1 && <Trophy size={18} className="mt-0.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remaining students table */}
          {remainingStudents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#214C55]">
                {podiumStudents.length > 0 ? "Other Ranked Students" : "Student Rankings Directory"}
              </h3>
              <div className="bg-white rounded-none border border-[#D1D5DB] shadow-none overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-xs font-extrabold text-[#214C55] uppercase tracking-wider">
                        <th className="px-6 py-4 text-center w-20">Rank</th>
                        <th className="px-6 py-4">Register No</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4 text-center">
                          {normalizeDomain(selectedDomain) === "Overall" ? "Overall Score" : `${normalizeDomain(selectedDomain)} Score`}
                        </th>
                        {normalizeDomain(selectedDomain) !== "Overall" && (
                          <th className="px-6 py-4 text-center">Batch Avg Score</th>
                        )}
                        <th className="px-6 py-4">Strongest Domain</th>
                        <th className="px-6 py-4">Weakest Domain</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                      {remainingStudents.map((student) => (
                        <tr key={student.id || student.register_no} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-center text-[#6B7280] font-bold">
                            {student.rank ? `#${student.rank}` : "Not ranked"}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap font-bold text-[#6B7280] text-xs uppercase">
                            {student.register_no}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap font-bold text-[#214C55]">
                            <div className="flex items-center space-x-3">
                              {imgErrors[student.register_no] || !student.profile_image ? (
                                <div className="w-8 h-8 rounded-full bg-[#214C55] text-white flex items-center justify-center text-[10px] font-black border border-[#D1D5DB]">
                                  {getInitials(student.name)}
                                </div>
                              ) : (
                                <img
                                  src={student.profile_image}
                                  alt={student.name}
                                  onError={() => handleImgError(student.register_no)}
                                  className="w-8 h-8 rounded-full object-cover border border-[#D1D5DB]"
                                />
                              )}
                              <span>{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            {student.score !== null && student.score !== undefined && student.score > 0 ? (
                              <ScoreBadge score={student.score} />
                            ) : (
                              <span className="text-[#6B7280] font-bold">Not added</span>
                            )}
                          </td>
                          {normalizeDomain(selectedDomain) !== "Overall" && (
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                              {student.overall_score !== null && student.overall_score !== undefined && student.overall_score > 0 ? (
                                <ScoreBadge score={student.overall_score} />
                              ) : (
                                <span className="text-[#6B7280] font-bold">Not added</span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-3 whitespace-nowrap">
                            {student.strongest_domain && student.strongest_domain !== "Not added" ? (
                              <DomainBadge domain={student.strongest_domain} />
                            ) : (
                              <span className="text-[#6B7280] font-bold">Not added</span>
                            )}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {student.weakest_domain && student.weakest_domain !== "Not added" ? (
                              <DomainBadge domain={student.weakest_domain} />
                            ) : (
                              <span className="text-[#6B7280] font-bold">Not added</span>
                            )}
                          </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Link
                              to={`/students/${student.registerNo || student.register_no || student.id}`}
                              className="text-[11px] font-bold text-[#214C55] hover:text-white bg-white hover:bg-[#214C55] border border-[#214C55] px-2.5 py-1 rounded-none inline-flex items-center space-x-1 transition-all shadow-none"
                            >
                              <UserSquare2 size={12} />
                              <span>Profile</span>
                            </Link>
                            <Link
                              to={`/portfolio/${student.register_no}`}
                              className="text-[11px] font-bold text-[#C76F2B] hover:text-white bg-white hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1 transition-all shadow-none"
                            >
                              <span>Portfolio</span>
                              <ExternalLink size={12} />
                            </Link>
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
      </>
    )}

      {/* Popover / Modal Action dialog for Top 3 performers */}
      {activeStudentPopover && (
        <div className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-[#D1D5DB] rounded-none p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="border-b border-[#E5E5E5] pb-2 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Top Performer Details</h3>
                <p className="text-[10px] text-[#6B7280] font-bold">Rank {activeStudentPopover.rank} Overall Performer</p>
              </div>
              <button
                onClick={() => setActiveStudentPopover(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-extrabold uppercase p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {imgErrors[activeStudentPopover.register_no] || !activeStudentPopover.profile_image ? (
                  <div className="w-12 h-12 rounded-full bg-[#214C55] text-white flex items-center justify-center text-sm font-black border border-[#D1D5DB]">
                    {getInitials(activeStudentPopover.name)}
                  </div>
                ) : (
                  <img
                    src={activeStudentPopover.profile_image}
                    alt={activeStudentPopover.name}
                    onError={() => handleImgError(activeStudentPopover.register_no)}
                    className="w-12 h-12 rounded-full object-cover border border-[#D1D5DB]"
                  />
                )}
                <div>
                  <h4 className="text-xs font-black text-[#214C55] uppercase">{activeStudentPopover.name}</h4>
                  <p className="text-[9px] text-[#6B7280] font-bold uppercase">{activeStudentPopover.register_no}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F7F7F7] p-3 text-xs border border-[#D1D5DB]">
                <div>
                  <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">Overall Rank</span>
                  <span className="font-black text-[#214C55]">#{activeStudentPopover.rank} Performer</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-[#6B7280] font-extrabold">
                    {normalizeDomain(selectedDomain) === "Overall" ? "Overall Score" : `${normalizeDomain(selectedDomain)} Score`}
                  </span>
                  <span className="font-black text-[#C76F2B]">{activeStudentPopover.score}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to={`/students/${activeStudentPopover.registerNo || activeStudentPopover.register_no || activeStudentPopover.id}`}
                onClick={() => setActiveStudentPopover(null)}
                className="w-full text-center px-4 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none block"
              >
                View Student Details
              </Link>
              <Link
                to={`/portfolio/${activeStudentPopover.register_no}`}
                onClick={() => setActiveStudentPopover(null)}
                className="w-full text-center px-4 py-2.5 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white text-xs font-bold uppercase tracking-wider transition-all rounded-none block"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
