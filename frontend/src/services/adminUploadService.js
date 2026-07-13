import api from "./api";
import { mockUsers } from "../data/mockUsers";

export const adminUploadService = {
  uploadStudentsExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/upload/students", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  uploadFacultyExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/upload/faculty", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  uploadMentorsExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/upload/mentors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getFacultyList: async () => {
    try {
      const response = await api.get("/admin/faculty");
      return response.data;
    } catch (error) {
      console.warn("Get Faculty API failed, returning mock faculty:", error.message);
      return mockUsers.filter((u) => u.role === "faculty");
    }
  },

  getMentorsList: async () => {
    try {
      const response = await api.get("/admin/mentors");
      return response.data;
    } catch (error) {
      console.warn("Get Mentors API failed, returning mock mentors:", error.message);
      return mockUsers.filter((u) => u.role === "mentor");
    }
  },
};
