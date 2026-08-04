import React, { useState } from "react";
import { Link } from "react-router-dom";
import { recommendationService } from "../services/recommendationService";
import ScoreBadge from "../components/common/ScoreBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Sparkles, Trophy, Award, ExternalLink, UserSquare2 } from "lucide-react";

export const RecommendationPage = () => {
  const [domain, setDomain] = useState("FullStack");
  const [limit, setLimit] = useState(10);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const domains = [
    { value: "Overall", label: "Overall Batch Competency" },
    { value: "DSA", label: "Data Structures & Algorithms" },
    { value: "DBMS", label: "Database Management (DBMS)" },
    { value: "FullStack", label: "Full-Stack Web Engineering" },
    { value: "Aptitude", label: "Quantitative & Analytical Aptitude" },
    { value: "Coding", label: "Competitive Programming / Coding" },
    { value: "Academic", label: "Academic / Theory GPA" },
    { value: "Technical", label: "Core Lab Labs / Systems" }
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!domain) return;
    setLoading(true);
    setError("");
    setHasGenerated(true);

    try {
      const data = await recommendationService.getDomainRecommendations(domain, limit);
      setRecommendations(data);
    } catch (err) {
      setError("Failed to generate placement recommendations report.");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBadge = (level) => {
    const styles = {
      Elite: "bg-emerald-50 text-[#15803D] border-emerald-200",
      High: "bg-blue-50 text-[#214C55] border-blue-200",
      Moderate: "bg-slate-50 text-[#6B7280] border-slate-200"
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-extrabold border ${styles[level] || styles.Moderate}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* Header Info */}
      <div className="border-b border-[#D1D5DB] pb-4">
        <h1 className="text-xl font-extrabold text-[#214C55] uppercase tracking-wider">Placement Recommendation Engine</h1>
        <p className="text-xs text-[#6B7280] font-semibold mt-1">
          Query target skillsets and student scores to retrieve top candidates for placement matching.
        </p>
      </div>

      {/* Query Filters Card - Faculty utility page style */}
      <form onSubmit={handleGenerate} className="bg-white p-5 rounded-none border border-[#D1D5DB] flex flex-col md:flex-row md:items-end gap-4 shadow-none">
        {/* Domain selection */}
        <div className="flex-1 space-y-1.5">
          <label htmlFor="rec-domain" className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">
            Target Competency Domain
          </label>
          <select
            id="rec-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] font-bold text-[#111827] cursor-pointer"
          >
            {domains.map((dom) => (
              <option key={dom.value} value={dom.value}>
                {dom.label}
              </option>
            ))}
          </select>
        </div>

        {/* Limit selector */}
        <div className="w-full md:w-32 space-y-1.5">
          <label htmlFor="rec-limit" className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider block">
            List Limit
          </label>
          <input
            id="rec-limit"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-none focus:outline-none focus:border-[#C76F2B] text-slate-800 font-bold"
          />
        </div>

        {/* Submit button in KCE Orange */}
        <button
          type="submit"
          className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C76F2B] hover:bg-[#A8561F] transition-colors rounded-none shadow-none flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Generate Talent List</span>
        </button>
      </form>

      {/* Recommendations result */}
      {loading ? (
        <LoadingSpinner size="lg" text="Searching matching student credentials and generating synthesis reports..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-[#B91C1C] p-4 rounded-none text-center text-xs font-bold uppercase tracking-wider">
          {error}
        </div>
      ) : !hasGenerated ? (
        <div className="bg-white border border-[#D1D5DB] rounded-none p-12 text-center max-w-md mx-auto space-y-4">
          <div className="p-3 bg-[#F7F7F7] text-[#6B7280] rounded-none inline-block border border-[#D1D5DB]">
            <Award size={32} className="text-[#C76F2B]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">Launch Talent Query</h3>
            <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
              Select the technical domain and candidate limit above to compile an overall ranking matching your placement profile.
            </p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-none border border-[#D1D5DB] shadow-none p-12 text-center text-[#6B7280] font-bold text-xs uppercase tracking-wider">
          No matching candidates were identified for the selected domain query.
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {/* Summary title of query results */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Matched top <span className="text-[#C76F2B] font-extrabold">{recommendations.length}</span> candidates for <span className="text-[#214C55] font-black">{domain}</span>
            </span>
          </div>

          {/* Results Table - KCE styled */}
          <div className="bg-white rounded-none border border-[#D1D5DB] shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-[#E5E5E5] border-b border-[#D1D5DB] text-xs font-extrabold text-[#214C55] uppercase tracking-wider">
                    <th className="px-6 py-3 text-center w-20">Rank</th>
                    <th className="px-6 py-3">Register No</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3 text-center">{domain} Score</th>
                    <th className="px-6 py-3 text-center">Batch Avg</th>
                    <th className="px-6 py-3 text-center">Tier</th>
                    <th className="px-6 py-3">Placement Fit Rationale</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] text-xs font-bold text-[#111827]">
                  {recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F7F7F7] transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className="font-extrabold text-[#111827]">{rec.rank}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-[#6B7280]">
                        {rec.register_no}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-[#214C55]">
                        {rec.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <ScoreBadge score={rec.domain_score} />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <ScoreBadge score={rec.overall_score} />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        {getStrengthBadge(rec.strength_level)}
                      </td>
                      <td className="px-6 py-3 text-[#6B7280] text-xs font-semibold max-w-xs truncate md:max-w-md" title={rec.reason}>
                        {rec.reason}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            to={`/students/${rec.register_no || rec.registerNo || rec.id}`}
                            className="text-[11px] font-bold text-[#214C55] hover:text-white bg-white hover:bg-[#214C55] border border-[#214C55] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
                          >
                            <UserSquare2 size={12} />
                            <span>Profile</span>
                          </Link>
                          <Link
                            to={`/portfolio/${rec.register_no}`}
                            className="text-[11px] font-bold text-[#C76F2B] hover:text-white bg-white hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
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
    </div>
  );
};
export default RecommendationPage;
