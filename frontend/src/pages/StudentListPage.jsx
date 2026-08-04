import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentService } from "../services/studentService";
import DataTable from "../components/common/DataTable";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ExternalLink, UserSquare2 } from "lucide-react";

export const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await studentService.getAllStudents();
        setStudents(data);
      } catch (err) {
        setError("Failed to load students directory");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const columns = [
    {
      key: "register_no",
      label: "Register No",
      sortable: true
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      className: "font-bold text-[#214C55]"
    },
    {
      key: "department",
      label: "Department",
      sortable: true
    },
    {
      key: "year_sec",
      label: "Year - Sec",
      render: (row) => `Year ${row.year} - ${row.section}`
    },
    {
      key: "overall_score",
      label: "Overall Score",
      sortable: true,
      render: (row) => <ScoreBadge score={row.overall_score} />
    },
    {
      key: "strongest_domain",
      label: "Strongest Domain",
      render: (row) => <DomainBadge domain={row.strongest_domain} />
    },
    {
      key: "weakest_domain",
      label: "Weakest Domain",
      render: (row) => <DomainBadge domain={row.weakest_domain} />
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <Link
            to={`/students/${row.register_no || row.registerNo || row.id}`}
            className="text-xs font-bold text-[#214C55] hover:text-white bg-white hover:bg-[#214C55] border border-[#214C55] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
          >
            <UserSquare2 size={13} />
            <span>Profile</span>
          </Link>
          <Link
            to={`/portfolio/${row.register_no}`}
            className="text-xs font-bold text-[#C76F2B] hover:text-white bg-white hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
          >
            <span>Portfolio</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading student data bank indexes..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-[#B91C1C] px-6 py-4 rounded-none max-w-lg mx-auto text-center mt-12 shadow-none font-bold">
        <h3 className="font-bold text-base uppercase">Directory Error</h3>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="border-b border-[#D1D5DB] pb-4">
        <h1 className="text-xl font-extrabold text-[#214C55] uppercase tracking-wider">Student Intelligence Directory</h1>
        <p className="text-xs text-[#6B7280] font-semibold mt-1">
          Search students by register number or name, filter by strongest domain, and inspect individual performance scores.
        </p>
      </div>

      {/* Main Table Wrapper */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search by name or register number..."
        searchKey="" // Search both name and register_no
        filterConfig={{
          key: "strongest_domain",
          label: "Strongest Competency",
          options: ["DSA", "DBMS", "FullStack", "Aptitude", "Coding", "Academic", "Technical"]
        }}
        emptyTitle="No Students Found"
        emptyDescription="We couldn't find any students matching those search filters."
      />
    </div>
  );
};
export default StudentListPage;
