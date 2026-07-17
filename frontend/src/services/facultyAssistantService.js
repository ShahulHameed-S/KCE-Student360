import api from "./api";
import { mockStudents } from "../data/mockStudents";

/**
 * Local fallback query parser if backend is offline.
 */
export const processFacultyQueryMock = (query) => {
  const cleanQuery = query.toLowerCase();

  // 1. Detect Domain
  let domain = null;
  if (cleanQuery.includes("dsa")) {
    domain = "DSA";
  } else if (
    cleanQuery.includes("dbms") ||
    cleanQuery.includes("database") ||
    cleanQuery.includes("sql")
  ) {
    domain = "DBMS";
  } else if (
    cleanQuery.includes("full stack") ||
    cleanQuery.includes("fullstack") ||
    cleanQuery.includes("web development") ||
    cleanQuery.includes("react")
  ) {
    domain = "FullStack";
  } else if (cleanQuery.includes("aptitude")) {
    domain = "Aptitude";
  } else if (
    cleanQuery.includes("coding") ||
    cleanQuery.includes("programming")
  ) {
    domain = "Coding";
  } else if (
    cleanQuery.includes("academic") ||
    cleanQuery.includes("academics")
  ) {
    domain = "Academic";
  } else if (cleanQuery.includes("technical")) {
    domain = "Technical";
  } else if (
    cleanQuery.includes("overall") ||
    cleanQuery.includes("topper") ||
    cleanQuery.includes("toppers") ||
    cleanQuery.includes("placement")
  ) {
    domain = "Overall";
  }

  if (!domain) {
    return {
      type: "unknown",
      message:
        "I can help you generate student lists. Try asking: Top 10 DSA students, Top 10 Full Stack students, Overall toppers, or Students suitable for placement.",
      students: []
    };
  }

  const numMatch = cleanQuery.match(/\d+/);
  const limit = numMatch ? parseInt(numMatch[0], 10) : 10;

  let sortedStudents = [...mockStudents];
  if (domain === "Overall") {
    sortedStudents.sort((a, b) => b.overall_score - a.overall_score);
  } else {
    sortedStudents.sort((a, b) => {
      const aScore = a.domain_scores[domain] || 0;
      const bScore = b.domain_scores[domain] || 0;
      return bScore - aScore;
    });
  }

  const sliced = sortedStudents.slice(0, limit);
  const studentsResult = sliced.map((student, index) => ({
    rank: index + 1,
    id: student.id,
    register_no: student.register_no,
    name: student.name,
    score: domain === "Overall" ? student.overall_score : (student.domain_scores[domain] || 0),
    strongest_domain: student.strongest_domain,
    overall_score: student.overall_score
  }));

  const domainLabel = domain === "Overall" ? "Overall Competency" : domain;

  return {
    type: "recommendation",
    domain: domain,
    limit: limit,
    message: `Here are the top ${limit} students strong in ${domainLabel}.`,
    students: studentsResult
  };
};

export const askFacultyAssistant = async (query) => {
  try {
    const response = await api.post("/ai/assistant", { query });
    const data = response.data;

    // Map backend response fields to the properties expected by FacultyChatbot
    return {
      type: data.intent === "general" ? "general" : "recommendation",
      domain: data.domain,
      limit: data.limit,
      message: data.answer || data.message || "",
      students: data.students || []
    };
  } catch (error) {
    if (error.code === "ERR_NETWORK" || !error.response) {
      console.warn("Faculty AI Assistant API failed, running local mock parser:", error.message);
      return processFacultyQueryMock(query);
    }
    console.error("Faculty AI Assistant API error:", error);
    return {
      type: "error",
      message: error.response?.data?.detail || error.message || "Failed to communicate with AI Synthesis server.",
      students: []
    };
  }
};
