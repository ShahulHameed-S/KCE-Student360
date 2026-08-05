import api from "./api";

export const uploadService = {
  uploadExcelScores: async (file, userRole = "admin") => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = userRole === "mentor" ? "/mentor/upload/scores" : "/scores/upload";

      if (!import.meta.env.PROD) {
        console.log("Score Upload Request Params:", {
          role: userRole,
          url: endpoint,
          timeout: 180000,
          fileName: file?.name
        });
      }

      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 180000
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to upload scores sheet";
      throw new Error(errorMsg);
    }
  },

  // Alias for API-readiness: POST /scores/upload
  uploadScores: async (file, userRole = "admin") => uploadService.uploadExcelScores(file, userRole),

  getScoresCount: async () => {
    try {
      const response = await api.get("/scores/count");
      return response.data.count;
    } catch (error) {
      console.warn("Get Scores Count API failed:", error.message);
      return 0;
    }
  },

  getScores: async (params = {}) => {
    try {
      const response = await api.get("/scores", { params });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to fetch scores";
      throw new Error(errorMsg);
    }
  },

  updateScore: async (scoreId, updateData) => {
    try {
      const response = await api.put(`/scores/${scoreId}`, updateData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to update score";
      throw new Error(errorMsg);
    }
  },

  deleteScore: async (scoreId) => {
    try {
      const response = await api.delete(`/scores/${scoreId}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to delete score";
      throw new Error(errorMsg);
    }
  },

  deleteScoresBulk: async (scoreIds) => {
    try {
      const response = await api.delete("/scores/bulk", { data: { score_ids: scoreIds } });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to delete selected scores";
      throw new Error(errorMsg);
    }
  }
};
