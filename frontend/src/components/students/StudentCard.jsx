import React from "react";
import { Link } from "react-router-dom";
import ScoreBadge from "../common/ScoreBadge";
import DomainBadge from "../common/DomainBadge";
import { Mail, Calendar, ArrowRight } from "lucide-react";

export const StudentCard = ({ student }) => {
  if (!student) return null;

  return (
    <div className="bg-white rounded-none border border-[#D1D5DB] border-t-4 border-t-[#C76F2B] shadow-none flex flex-col justify-between hover:border-[#C76F2B] transition-all p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-none bg-[#F7F7F7] border border-[#D1D5DB] flex items-center justify-center text-[#214C55] font-black text-lg shadow-none">
            {student.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-extrabold text-[#214C55] leading-tight uppercase text-sm">{student.name}</h4>
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">{student.register_no}</span>
          </div>
        </div>
        <ScoreBadge score={student.overall_score} />
      </div>

      <div className="space-y-2 text-xs font-semibold text-[#6B7280]">
        <div className="flex items-center space-x-2">
          <Mail size={13} className="text-[#6B7280]/60" />
          <span className="text-[#111827] truncate max-w-[180px] lowercase font-bold">{student.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={13} className="text-[#6B7280]/60" />
          <span className="text-[#111827] font-bold">Year {student.year} - Sec {student.section}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider pt-2 border-t border-[#E5E5E5]">
        <div>
          <span className="text-[#6B7280] block font-extrabold">Strongest</span>
          <div className="mt-0.5"><DomainBadge domain={student.strongest_domain} /></div>
        </div>
        <div>
          <span className="text-[#6B7280] block font-extrabold">Weakest</span>
          <div className="mt-0.5"><DomainBadge domain={student.weakest_domain} /></div>
        </div>
      </div>

      <Link
        to={`/students/${student.register_no || student.registerNo || student.id}`}
        className="w-full py-2 bg-white border border-[#214C55] text-[#214C55] hover:bg-[#214C55] hover:text-white rounded-none text-xs font-bold transition-all flex items-center justify-center space-x-1"
      >
        <span>View Insights</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
export default StudentCard;
