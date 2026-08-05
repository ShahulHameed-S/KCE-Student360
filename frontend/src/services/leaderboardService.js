import api from "./api";

export const leaderboardService = {
  getOverallLeaderboard: async () => {
    try {
      const response = await api.get("/leaderboard/overall", { timeout: 120000 });
      return response.data;
    } catch (error) {
      console.warn("Overall Leaderboard API failed, trying /mentor/leaderboard fallback:", error.message);
      const mentorRes = await api.get("/mentor/leaderboard?domain=Overall", { timeout: 120000 });
      return mentorRes.data;
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
      const response = await api.get(`/leaderboard/domain/${cleanDomain}`, { timeout: 120000 });
      return response.data;
    } catch (error) {
      console.warn(`Domain Leaderboard API for ${cleanDomain} failed, trying /mentor/leaderboard fallback:`, error.message);
      const mentorRes = await api.get(`/mentor/leaderboard?domain=${cleanDomain}`, { timeout: 120000 });
      return mentorRes.data;
    }
  }
};
