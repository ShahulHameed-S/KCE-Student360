import api from "./api";

export const getAdminStudents = async () => {
  const response = await api.get("/admin/students");
  const data = response.data;
  return Array.isArray(data) ? data : data.students || data.data || [];
};
