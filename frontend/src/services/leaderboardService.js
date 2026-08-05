import api from "./api";
import { mockOverallLeaderboard, getDomainLeaderboard } from "../data/mockLeaderboard";

export const leaderboardService = {
  getOverallLeaderboard: async () => {
    try {
      const response = await api.get("/leaderboard/overall");
      return response.data;
    } catch (error) {
      console.warn("Overall Leaderboard API failed, trying /mentor/leaderboard fallback:", error.message);
      try {
        const mentorRes = await api.get("/mentor/leaderboard?domain=Overall");
        return mentorRes.data;
      } catch (mErr) {
        if (import.meta.env.PROD) {
          throw error;
        }
        return mockOverallLeaderboard;
      }
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
      console.warn(`Domain Leaderboard API for ${cleanDomain} failed, trying /mentor/leaderboard fallback:`, error.message);
      try {
        const mentorRes = await api.get(`/mentor/leaderboard?domain=${cleanDomain}`);
        return mentorRes.data;
      } catch (mErr) {
        if (import.meta.env.PROD) {
          throw error;
        }
        return getDomainLeaderboard(cleanDomain);
      }
    }
  }
};
