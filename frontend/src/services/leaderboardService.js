import api from "./api";

export const leaderboardService = {
  getOverallLeaderboard: async () => {
    const isDev = import.meta.env.DEV;
    if (isDev) console.time("GET /leaderboard/overall");
    try {
      const response = await api.get("/leaderboard/overall", { timeout: 120000 });
      if (isDev) console.timeEnd("GET /leaderboard/overall");
      return response.data;
    } catch (error) {
      if (isDev) console.timeEnd("GET /leaderboard/overall");
      console.warn("Overall Leaderboard API failed, trying /mentor/leaderboard fallback:", error.message);
      if (isDev) console.time("GET /mentor/leaderboard?domain=Overall");
      try {
        const mentorRes = await api.get("/mentor/leaderboard?domain=Overall", { timeout: 120000 });
        if (isDev) console.timeEnd("GET /mentor/leaderboard?domain=Overall");
        return mentorRes.data;
      } catch (err) {
        if (isDev) console.timeEnd("GET /mentor/leaderboard?domain=Overall");
        throw err;
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

    const isDev = import.meta.env.DEV;
    if (isDev) console.time(`GET /leaderboard/domain/${cleanDomain}`);
    try {
      const response = await api.get(`/leaderboard/domain/${cleanDomain}`, { timeout: 120000 });
      if (isDev) console.timeEnd(`GET /leaderboard/domain/${cleanDomain}`);
      return response.data;
    } catch (error) {
      if (isDev) console.timeEnd(`GET /leaderboard/domain/${cleanDomain}`);
      console.warn(`Domain Leaderboard API for ${cleanDomain} failed, trying /mentor/leaderboard fallback:`, error.message);
      if (isDev) console.time(`GET /mentor/leaderboard?domain=${cleanDomain}`);
      try {
        const mentorRes = await api.get(`/mentor/leaderboard?domain=${cleanDomain}`, { timeout: 120000 });
        if (isDev) console.timeEnd(`GET /mentor/leaderboard?domain=${cleanDomain}`);
        return mentorRes.data;
      } catch (err) {
        if (isDev) console.timeEnd(`GET /mentor/leaderboard?domain=${cleanDomain}`);
        throw err;
      }
    }
  }
};
