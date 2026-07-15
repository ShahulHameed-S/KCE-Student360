import api from "./api";

export const getAdminStudents = async () => {
  const response = await api.get("/admin/students", {
    timeout: 120000
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.students || data.data || [];
};
