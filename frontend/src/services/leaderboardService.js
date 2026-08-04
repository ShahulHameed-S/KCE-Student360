import api from "./api";
import { mockOverallLeaderboard, getDomainLeaderboard } from "../data/mockLeaderboard";

export const leaderboardService = {
  getOverallLeaderboard: async () => {
    try {
      const response = await api.get("/leaderboard/overall");
      return response.data;
    } catch (error) {
      console.warn("Overall Leaderboard API failed, returning mock overall leaderboard:", error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      return mockOverallLeaderboard;
    }
  },

  getLeaderboardByDomain: async (domain) => {
    let cleanDomain = String(domain || "").trim();
    if (cleanDomain === "Overall Batch" || cleanDomain.toLowerCase() === "overall") {
      return leaderboardService.getOverallLeaderboard();
    }
    if (cleanDomain === "Full Stack") {
      cleanDomain = "FullStack";
    }

    try {
      const response = await api.get(`/leaderboard/domain/${cleanDomain}`);
      return response.data;
    } catch (error) {
      console.warn(`Domain Leaderboard API for ${cleanDomain} failed, returning mock domain leaderboard:`, error.message);
      if (import.meta.env.PROD) {
        throw error;
      }
      return getDomainLeaderboard(cleanDomain);
    }
  }
};
