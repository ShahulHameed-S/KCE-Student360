import api from "./api";

export const getAdminStudents = async () => {
  const response = await api.get("/admin/students", {
    timeout: 120000
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.items || data.data || data.students || [];
};

export const getAdminFaculty = async () => {
  const response = await api.get("/admin/faculty", {
    timeout: 120000
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.items || data.data || data.faculty || [];
};

export const getAdminMentors = async () => {
  const response = await api.get("/admin/mentors", {
    timeout: 120000
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.items || data.data || data.mentors || [];
};

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users", {
    timeout: 120000
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.users || data.data || [];
};
