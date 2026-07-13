import api from "./api";

const isProduction = import.meta.env.PROD;

console.log("MODE:", import.meta.env.MODE);
console.log("PROD:", import.meta.env.PROD);
console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

const MOCK_USERS = [
  { email: "faculty@student360.com", password: "Password123!", name: "Dr. Ramanujam", role: "faculty" },
  { email: "mentor@student360.com", password: "Password123!", name: "Dr. Monisha R", role: "mentor" },
  { email: "student@student360.com", password: "Password123!", name: "Shahul", role: "student", studentId: "1", registerNo: "22AD001" },
  { email: "admin@student360.com", password: "Password123!", name: "Admin Officer", role: "admin" }
];

const tryMockLogin = (identifier, password) => {
  const foundUser = MOCK_USERS.find(
    (u) => (
      u.email.toLowerCase() === identifier.toLowerCase() || 
      u.role === identifier || 
      (u.registerNo && u.registerNo.toLowerCase() === identifier.toLowerCase())
    ) && u.password === password
  );

  if (foundUser) {
    const userData = {
      id: foundUser.role === "student" ? 1 : 99,
      name: foundUser.name,
      email: foundUser.email,
      username: foundUser.role,
      role: foundUser.role,
      studentId: foundUser.studentId ? parseInt(foundUser.studentId) : null,
      student_id: foundUser.studentId ? parseInt(foundUser.studentId) : null,
      registerNo: foundUser.registerNo || null,
      register_no: foundUser.registerNo || null,
      profileImage: null,
      profile_image: null
    };

    return {
      access_token: `mock-jwt-token-for-${foundUser.role}`,
      refresh_token: `mock-refresh-token-for-${foundUser.role}`,
      user: userData
    };
  } else {
    throw new Error("Invalid credentials (Mock Fallback)");
  }
};

export const authService = {
  login: async (identifier, password) => {
    try {
      const response = await api.post("/auth/login", {
        email: identifier,
        password,
      });
      return response.data;
    } catch (error) {
      if (isProduction) {
        throw error;
      }

      // mock fallback only allowed in local development when backend is unreachable
      if (error.response) {
        throw error;
      }

      return tryMockLogin(identifier, password);
    }
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch (error) {
      return { success: true, message: "Logged out locally" };
    }
  }
};
