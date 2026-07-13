import api from "./api";
import { mockUsers } from "../data/mockUsers";

export const uploadStudentsExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/students", formData);
  return response.data;
};

export const uploadFacultyExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/faculty", formData);
  return response.data;
};

export const uploadMentorsExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/mentors", formData);
  return response.data;
};

export const adminUploadService = {
  uploadStudentsExcel,
  uploadFacultyExcel,
  uploadMentorsExcel,

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
