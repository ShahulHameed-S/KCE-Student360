import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { leaderboardService } from "../services/leaderboardService";
import { useAuth } from "../hooks/useAuth";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Trophy, ShieldAlert, Award, ExternalLink, UserSquare2, Sparkles } from "lucide-react";

import { resolveImageUrl, getStudentImageUrl } from "../utils/imageUtils";

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);

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

  const [loadingText, setLoadingText] = useState("Loading leaderboard from server. Please wait...");

  useEffect(() => {
    let slowTimer;
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");
        setLoadingText("Loading leaderboard from server. Please wait...");

        slowTimer = setTimeout(() => {
          setLoadingText("Server is calculating rankings. Please wait...");
        }, 5000);

        let response;
        const apiUrl = selectedDomain === "Overall" 
          ? "/leaderboard/overall" 
          : `/leaderboard/domain/${selectedDomain}`;

        if (!import.meta.env.PROD) {
          console.log("Leaderboard filter selected:", selectedDomain);
          console.log("Leaderboard API URL:", apiUrl);
          console.log("User role:", user?.role);
        }

        if (selectedDomain === "Overall") {
          response = await leaderboardService.getOverallLeaderboard();
        } else {
          response = await leaderboardService.getLeaderboardByDomain(selectedDomain);
        }

        if (!import.meta.env.PROD) {
          console.log("Leaderboard response type:", typeof response, Array.isArray(response));
          console.log("Leaderboard response length:", Array.isArray(response) ? response.length : "Not Array");
        }

        const dataArray = Array.isArray(response) 
          ? response 
          : Array.isArray(response?.items) 
            ? response.items 
            : Array.isArray(response?.students) 
              ? response.students 
              : [];

        setLeaderboardData(dataArray);
      } catch (err) {
        console.error("Leaderboard loading error details:", {
          selectedDomain,
          status: err.response?.status,
          detail: err.response?.data?.detail,
          message: err.message
        });

        setError(err.response?.data?.detail || err.message || "Failed to load live leaderboard from backend database.");
      } finally {
        if (slowTimer) clearTimeout(slowTimer);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedDomain, user]);

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const normalizeDomain = (domain) => {
    switch (domain) {
      case "Overall":
      case "DSA":
      case "DBMS":
      case "FullStack":
      case "Aptitude":
      case "Coding":
      case "Academic":
      case "Technical":
        return domain;
      default:
        return "Overall";
    }
  };

  const { sortedStudents, podiumStudents, remainingStudents } = React.useMemo(() => {
    let sorted = [];
    if (leaderboardData && leaderboardData.length > 0) {
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
  }, [selectedDomain, leaderboardData]);

  const handleStudentClick = (student) => {
    const regNo = student?.register_no || student?.registerNo || student?.id;
    if (regNo) {
      navigate(`/students/${regNo}`);
    }
  };

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

      {/* Mode Status Banner */}
      <div className="flex items-center space-x-2 p-4 bg-white border border-[#D1D5DB] rounded-none shadow-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#C76F2B]" />
        <span className="text-xs font-black uppercase tracking-wider text-[#214C55]">
          Live Data Mode — Showing uploaded students from database
        </span>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text={loadingText} />
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
                <p className="text-[11px] text-[#6B7280] font-semibold mt-0.5">Click a top student profile to inspect their full details.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 pt-4 max-w-4xl mx-auto">
                {podiumStudents.map((student) => {
                  const avatarSrc = getStudentImageUrl(student);
                  const isError = imgErrors[student.register_no];
                  const showInitials = isError || !avatarSrc;

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
                              onClick={() => handleStudentClick(student)}
                              className={`rounded-full bg-[#214C55] text-white flex items-center justify-center text-lg font-black border-4 ${student.borderColor} hover:scale-105 transition-transform duration-200 cursor-pointer ${
                                student.rank === 1 ? "w-24 h-24 md:w-28 md:h-28" : "w-20 h-20 md:w-24 md:h-24"
                              }`}
                            >
                              {getInitials(student.name)}
                            </div>
                          ) : (
                            <img
                              src={avatarSrc}
                              alt={student.name}
                              onError={() => handleImgError(student.register_no)}
                              onClick={() => handleStudentClick(student)}
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
                            onClick={() => handleStudentClick(student)}
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
                      {remainingStudents.map((student) => {
                        const avatarSrc = getStudentImageUrl(student);
                        const isError = imgErrors[student.register_no];
                        const showInitials = isError || !avatarSrc;

                        return (
                          <tr key={student.id || student.register_no} className="hover:bg-[#F7F7F7] transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap text-center text-[#6B7280] font-bold">
                              {student.rank ? `#${student.rank}` : "Not ranked"}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap font-bold text-[#6B7280] text-xs uppercase">
                              {student.register_no}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap font-bold text-[#214C55]">
                              <div className="flex items-center space-x-3">
                                {showInitials ? (
                                  <div className="w-8 h-8 rounded-full bg-[#214C55] text-white flex items-center justify-center text-[10px] font-black border border-[#D1D5DB]">
                                    {getInitials(student.name)}
                                  </div>
                                ) : (
                                  <img
                                    src={avatarSrc}
                                    alt={student.name}
                                    onError={() => handleImgError(student.register_no)}
                                    className="w-8 h-8 rounded-full object-cover border border-[#D1D5DB]"
                                  />
                                )}
                              <span
                                onClick={() => handleStudentClick(student)}
                                className="hover:underline cursor-pointer"
                              >
                                {student.name}
                              </span>
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
                              to={`/students/${student.register_no || student.registerNo || student.id}`}
                              className="text-[11px] font-bold text-[#214C55] hover:text-white bg-white hover:bg-[#214C55] border border-[#214C55] px-2.5 py-1 rounded-none inline-flex items-center space-x-1 transition-all shadow-none"
                            >
                              <UserSquare2 size={12} />
                              <span>Profile</span>
                            </Link>
                            {student.external_portfolio_url ? (
                              <a
                                href={student.external_portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open Student's External Personal Portfolio"
                                className="text-[11px] font-bold text-[#C76F2B] hover:text-white bg-white hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1 transition-all shadow-none"
                              >
                                <span>Portfolio</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <Link
                                to={`/portfolio/${student.register_no || student.registerNo}`}
                                className="text-[11px] font-bold text-[#C76F2B] hover:text-white bg-white hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1 transition-all shadow-none"
                              >
                                <span>Portfolio</span>
                                <ExternalLink size={12} />
                              </Link>
                            )}
                          </div>
                        </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
    )}
    </div>
  );
};

export default LeaderboardPage;
