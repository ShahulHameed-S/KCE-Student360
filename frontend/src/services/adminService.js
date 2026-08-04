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

