import api from "./api";
import { mockStudents } from "../data/mockStudents";
import { mockPerformance } from "../data/mockPerformance";

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

  getStudentPerformance: async (id) => {
    try {
      const response = await api.get(`/students/${id}/performance`);
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn(`Performance API for ID ${id} failed, returning mock performance logs:`, error.message);
        if (import.meta.env.PROD) {
          throw error;
        }
        // Find the student's register_no
        const student = mockStudents.find((s) => s.id === String(id) || s.register_no === String(id));
        if (!student) {
          return [];
        }
        return mockPerformance[student.register_no] || [];
      }
      throw error;
    }
  }
};
