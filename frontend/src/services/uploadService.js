import api from "./api";

export const uploadService = {
  uploadExcelScores: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/scores/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to upload scores sheet";
      throw new Error(errorMsg);
    }
  },

  // Alias for API-readiness: POST /scores/upload
  uploadScores: async (file) => uploadService.uploadExcelScores(file),

  getScoresCount: async () => {
    try {
      const response = await api.get("/scores/count");
      return response.data.count;
    } catch (error) {
      console.warn("Get Scores Count API failed:", error.message);
      return 0;
    }
  }
};
