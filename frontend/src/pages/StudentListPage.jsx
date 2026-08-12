import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentService } from "../services/studentService";
import { mentorService } from "../services/mentorService";
import { useAuth } from "../hooks/useAuth";
import DataTable from "../components/common/DataTable";
import ScoreBadge from "../components/common/ScoreBadge";
import DomainBadge from "../components/common/DomainBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ExternalLink, UserSquare2 } from "lucide-react";
import { getStudentImageUrl } from "../utils/imageUtils";

export const StudentListPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");
        
        let response;
        if (user?.role === "mentor") {
          response = await mentorService.getAssignedStudents();
        } else {
          response = await studentService.getAllStudents();
        }

        // Safe normalization
        const studentsData = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.students)
              ? response.students
              : [];

        if (!import.meta.env.PROD) {
          console.log("StudentListPage role:", user?.role);
          console.log("StudentListPage API used:", user?.role === "mentor" ? "/mentor/students" : "studentService");
          console.log("StudentListPage students count:", studentsData.length);
          console.log("First student:", studentsData[0]);
        }

        setStudents(studentsData);
      } catch (err) {
        console.error("Student list directory load failed:", {
          url: user?.role === "mentor" ? "/mentor/students" : "/students",
          status: err.response?.status,
          message: err.response?.data?.detail || err.message
        });
        setError(err.response?.data?.detail || err.message || "Failed to load students directory");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const columns = [
    {
      key: "register_no",
      label: "Register No",
      sortable: true,
      render: (row) => row.register_no || row.registerNo || "Not added"
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      className: "font-bold text-[#214C55]",
      render: (row) => {
        const avatarUrl = getStudentImageUrl(row);
        const nameText = row.name || row.full_name || "Student";
        return (
          <div className="flex items-center space-x-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nameText}
                className="w-7 h-7 rounded-full object-cover border border-[#D1D5DB]"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.parentElement?.querySelector('.avatar-fallback');
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`avatar-fallback w-7 h-7 rounded-full bg-[#214C55] text-white font-black text-[10px] uppercase items-center justify-center ${
                avatarUrl ? "hidden" : "flex"
              }`}
            >
              {nameText.charAt(0)}
            </div>
            <span>{nameText}</span>
          </div>
        );
      }
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
      render: (row) => row.department || "Not added"
    },
    {
      key: "year_sec",
      label: "Year - Sec",
      render: (row) => {
        const yr = row.year;
        const sec = row.section;
        if (yr && sec) {
          return `Year ${yr} - ${sec}`;
        }
        if (yr) {
          return `Year ${yr}`;
        }
        if (sec) {
          return `Sec ${sec}`;
        }
        return "Not added";
      }
    },
    {
      key: "overall_score",
      label: "Overall Score",
      sortable: true,
      render: (row) => {
        const score = row.overall_score ?? row.overallScore;
        if (score === undefined || score === null || score === 0 || score === 0.0) {
          return <span className="text-[#6B7280] font-bold">Not added</span>;
        }
        return <ScoreBadge score={score} />;
      }
    },
    {
      key: "strongest_domain",
      label: "Strongest Domain",
      render: (row) => {
        const dom = row.strongest_domain || row.strongestDomain;
        if (!dom || dom === "Not added") {
          return <span className="text-[#6B7280] font-bold">Not added</span>;
        }
        return <DomainBadge domain={dom} />;
      }
    },
    {
      key: "weakest_domain",
      label: "Weakest Domain",
      render: (row) => {
        const dom = row.weakest_domain || row.weakestDomain;
        if (!dom || dom === "Not added") {
          return <span className="text-[#6B7280] font-bold">Not added</span>;
        }
        return <DomainBadge domain={dom} />;
      }
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <Link
            to={`/students/${row.register_no || row.registerNo || row.id}`}
            className="text-xs font-bold text-[#214C55] hover:text-white bg-[#F7F7F7] hover:bg-[#214C55] border border-[#214C55] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
          >
            <UserSquare2 size={13} />
            <span>Profile</span>
          </Link>
          <Link
            to={`/portfolio/${row.register_no || row.registerNo}`}
            className="text-xs font-bold text-[#C76F2B] hover:text-white bg-[#F7F7F7] hover:bg-[#C76F2B] border border-[#C76F2B] px-2.5 py-1 rounded-none inline-flex items-center space-x-1.5 transition-all shadow-none"
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

      {/* Mode Status Banner */}
      <div className="flex items-center space-x-2 p-4 bg-white border border-[#D1D5DB] rounded-none shadow-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#C76F2B]" />
        <span className="text-xs font-black uppercase tracking-wider text-[#214C55]">
          Live Data Mode — Showing uploaded students from database
        </span>
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
        emptyTitle={user?.role === "mentor" ? "No students assigned yet" : "No Students Found"}
        emptyDescription={user?.role === "mentor" ? "No students assigned yet. Please ask admin to assign students by register number." : "We couldn't find any students matching those search filters."}
      />
    </div>
  );
};

export default StudentListPage;
