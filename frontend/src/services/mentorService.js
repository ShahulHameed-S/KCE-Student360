import api from "./api";
import { mockApprovals } from "../data/mockApprovals";

// Local in-memory store for approvals to allow modifications in the UI during demo
let localApprovals = [...mockApprovals];

export const mentorService = {
  // Get all approvals (for full-view with filters)
  getAllApprovals: async () => {
    const isDev = import.meta.env.DEV;
    if (isDev) console.time("GET /mentor/approvals");
    try {
      const response = await api.get("/mentor/approvals");
      if (isDev) console.timeEnd("GET /mentor/approvals");
      return response.data;
    } catch (error) {
      if (isDev) console.timeEnd("GET /mentor/approvals");
      console.warn("Approvals API failed, returning mock approvals:", error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      return [...localApprovals];
    }
  },

  // Get only pending (used in dashboard preview)
  getPendingApprovals: async () => {
    const isDev = import.meta.env.DEV;
    if (isDev) console.time("GET /mentor/pending");
    try {
      const response = await api.get("/mentor/pending");
      if (isDev) console.timeEnd("GET /mentor/pending");
      return response.data;
    } catch (error) {
      if (isDev) console.timeEnd("GET /mentor/pending");
      console.warn("Pending Approvals API failed, returning mock pending approvals:", error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      return localApprovals.filter(item => item.status === "Pending");
    }
  },

  // Review a submission — updates local state for demo
  reviewSubmission: async (id, status, feedback = "", type = "") => {
    try {
      const response = await api.put("/mentor/review", { id, status, feedback, item_type: type });
      return response.data;
    } catch (error) {
      console.warn(`Review API failed for item ID ${id}. Updating in-memory mock approvals:`, error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      const index = localApprovals.findIndex(item => item.id === id && item.item_type === type);
      if (index !== -1) {
        localApprovals[index] = {
          ...localApprovals[index],
          status,
          feedback
        };
      }
      return { success: true, message: `Status updated to ${status}` };
    }
  },

  // Retrieve list of assigned students for current mentor
  getAssignedStudents: async () => {
    const isDev = import.meta.env.DEV;
    if (isDev) console.time("GET /mentor/students");
    try {
      const response = await api.get("/mentor/students", { timeout: 120000 });
      if (isDev) console.timeEnd("GET /mentor/students");
      return response.data;
    } catch (error) {
      if (isDev) console.timeEnd("GET /mentor/students");
      console.warn("Assigned Students API failed:", error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      return [];
    }
  },

  // Legacy alias kept for backward compatibility
  reviewAchievement: async (id, status, feedback = "", type = "") => {
    return mentorService.reviewSubmission(id, status, feedback, type);
  }
};
