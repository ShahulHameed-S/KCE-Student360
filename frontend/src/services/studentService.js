import api from "./api";
import { mockStudents } from "../data/mockStudents";
import { mockPerformance } from "../data/mockPerformance";
import { mockApprovals } from "../data/mockApprovals";

export const studentService = {
  getAllStudents: async () => {
    try {
      const response = await api.get("/students");
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn("Students API failed, returning mock student list:", error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        return mockStudents;
      }
      throw error;
    }
  },

  getStudentById: async (id) => {
    try {
      const response = await api.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn(`Student API for ID ${id} failed, returning mock profile:`, error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        const student = mockStudents.find((s) => s.id === String(id) || s.register_no === String(id));
        if (!student) {
          throw new Error("Student not found");
        }
        return student;
      }
      throw error;
    }
  },

  getStudentProfile: async (id) => {
    if (!id || id === "undefined" || id === "null" || id === "[object Object]") {
      id = "me";
    }
    try {
      const endpoint = id === "me" ? "/students/me" : `/students/${encodeURIComponent(id)}`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn(`Profile API for ID ${id} failed, returning mock profile:`, error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        const student = mockStudents.find((s) => s.id === String(id) || s.register_no === String(id) || (id === "me" && s.id === "1"));
        if (!student) {
          throw new Error("Student not found");
        }
        return student;
      }
      throw error;
    }
  },

  getStudentPerformance: async (id) => {
    if (!id || id === "undefined" || id === "null" || id === "[object Object]") {
      id = "me";
    }
    try {
      // If backend does not support /students/me/performance, we can catch or return empty,
      // but let's try the endpoint first.
      const endpoint = id === "me" ? "/students/me/performance" : `/students/${encodeURIComponent(id)}/performance`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn(`Performance API for ID ${id} failed, returning mock performance logs:`, error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        const student = mockStudents.find((s) => s.id === String(id) || s.register_no === String(id) || (id === "me" && s.id === "1"));
        if (!student) {
          return [];
        }
        return mockPerformance[student.register_no] || [];
      }
      throw error;
    }
  },

  getStudentApprovals: async (id) => {
    try {
      const response = await api.get("/mentor/approvals");
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn("Approvals API failed, returning mock approvals:", error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        return mockApprovals || [];
      }
      throw error;
    }
  }
};
