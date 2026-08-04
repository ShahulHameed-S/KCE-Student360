import api from "./api";
import { mockUsers } from "../data/mockUsers";

export const uploadStudentsExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/students", formData, {
    timeout: 180000
  });
  return response.data;
};

export const uploadFacultyExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/faculty", formData, {
    timeout: 180000
  });
  return response.data;
};

export const uploadMentorsExcel = async (selectedFile) => {
  const formData = new FormData();
  formData.append("file", selectedFile);

  for (const pair of formData.entries()) {
    console.log("FormData:", pair[0], pair[1]);
  }

  const response = await api.post("/admin/upload/mentors", formData, {
    timeout: 180000
  });
  return response.data;
};

export const adminUploadService = {
  uploadStudentsExcel,
  uploadFacultyExcel,
  uploadMentorsExcel,

  getStudentsList: async (page, limit, search) => {
    const params = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;
    if (search !== undefined) params.search = search;
    const response = await api.get("/admin/students", {
      params,
      timeout: 120000
    });
    return response.data;
  },

  getFacultyList: async (page, limit, search) => {
    try {
      const params = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      if (search !== undefined) params.search = search;
      const response = await api.get("/admin/faculty", {
        params,
        timeout: 120000
      });
      return response.data;
    } catch (error) {
      console.warn("Get Faculty API failed, returning mock faculty:", error.message);
      return mockUsers.filter((u) => u.role === "faculty");
    }
  },

  getMentorsList: async (page, limit, search) => {
    try {
      const params = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      if (search !== undefined) params.search = search;
      const response = await api.get("/admin/mentors", {
        params,
        timeout: 120000
      });
      return response.data;
    } catch (error) {
      console.warn("Get Mentors API failed, returning mock mentors:", error.message);
      return mockUsers.filter((u) => u.role === "mentor");
    }
  },
};

