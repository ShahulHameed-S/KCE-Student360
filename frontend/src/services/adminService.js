import api from "./api";

export const getAdminCounts = async () => {
  const response = await api.get("/admin/counts");
  return response.data;
};

export const getAdminStudents = async (page, limit, search) => {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;
  
  const response = await api.get("/admin/students", {
    params,
    timeout: 120000
  });
  return response.data;
};

export const getAdminFaculty = async (page, limit, search) => {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;

  const response = await api.get("/admin/faculty", {
    params,
    timeout: 120000
  });
  return response.data;
};

export const getAdminMentors = async (page, limit, search) => {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;

  const response = await api.get("/admin/mentors", {
    params,
    timeout: 120000
  });
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users", {
    timeout: 120000
  });
  return response.data;
};

export const assignStudentsToMentor = async (mentorEmail, registerNumbers) => {
  const payload = {
    mentor_email: mentorEmail,
    register_numbers: Array.isArray(registerNumbers) ? registerNumbers : [registerNumbers]
  };
  const response = await api.post("/admin/mentors/assign-students", payload);
  return response.data;
};

export const uploadMentorAssignmentsExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/admin/mentors/upload-assignments", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};


