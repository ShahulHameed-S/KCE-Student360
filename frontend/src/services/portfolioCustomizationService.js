import api from "./api";

const CUSTOMIZATION_KEY_PREFIX = "student360_portfolio_customization_";

export const validatePortfolioUrl = (url) => {
  if (!url || typeof url !== "string") return { valid: true, cleanUrl: "" };
  const clean = url.trim();
  if (!clean) return { valid: true, cleanUrl: "" };
  
  const lower = clean.toLowerCase();
  const forbidden = ["javascript:", "data:", "file:", "ftp:", "localhost", "127.0.0.1"];
  for (let f of forbidden) {
    if (lower.includes(f)) {
      return { valid: false, error: "Unsafe or local URL detected. Please enter a valid public URL starting with https://" };
    }
  }
  
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    return { valid: false, error: "Please enter a valid portfolio URL starting with https://" };
  }
  
  const isHttpWarning = lower.startsWith("http://");
  return { valid: true, cleanUrl: clean, warning: isHttpWarning ? "HTTPS links are recommended." : null };
};

export const portfolioCustomizationService = {
  getPortfolioCustomization: async (registerNo) => {
    try {
      const response = await api.get(`/portfolio/customization/${registerNo}`);
      const data = response.data;

      // Map backend response fields to what the frontend expects
      const visibility = data.sectionVisibility || data.section_visibility_json || {
        showProjects: true,
        showCertifications: true,
        showAchievements: true,
        showAcademicHighlights: true,
        showContactLinks: true,
        showResume: true
      };

      return {
        headline: data.headline || "",
        about_me: data.about_me || data.aboutMe || "",
        career_objective: data.career_objective || data.careerObjective || "",
        skills: data.skills || [],
        github_url: data.github_url || data.githubUrl || "",
        linkedin_url: data.linkedin_url || data.linkedinUrl || "",
        external_portfolio_url: data.external_portfolio_url || data.externalPortfolioUrl || "",
        default_portfolio_url: data.default_portfolio_url || data.student360_portfolio_url || `https://kce-student360.vercel.app/portfolio/${registerNo}`,
        student360_portfolio_url: data.student360_portfolio_url || data.default_portfolio_url || `https://kce-student360.vercel.app/portfolio/${registerNo}`,
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        theme: data.theme || "Dark Minimal",
        visibility: visibility,
        resume_visibility: data.resume_visibility !== undefined ? data.resume_visibility : (data.resumeVisibility !== undefined ? data.resumeVisibility : true)
      };
    } catch (error) {
      console.warn("Error fetching portfolio customization, using default/mock fallback:", error);
      
      const key = `${CUSTOMIZATION_KEY_PREFIX}${registerNo}`;
      const localData = localStorage.getItem(key);

      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error("Error parsing local portfolio customization data", e);
        }
      }

      // Default fallback values if no customization exists yet
      return {
        headline: "",
        about_me: "",
        career_objective: "",
        skills: [],
        github_url: "",
        linkedin_url: "",
        external_portfolio_url: "",
        default_portfolio_url: `https://kce-student360.vercel.app/portfolio/${registerNo}`,
        student360_portfolio_url: `https://kce-student360.vercel.app/portfolio/${registerNo}`,
        email: "",
        phone: "",
        location: "",
        theme: "Dark Minimal",
        visibility: {
          showProjects: true,
          showCertifications: true,
          showAchievements: true,
          showAcademicHighlights: true,
          showContactLinks: true,
          showResume: true
        }
      };
    }
  },

  savePortfolioCustomization: async (registerNo, data) => {
    try {
      // Map frontend fields to backend update pydantic schema (exclude theme if unused)
      const payload = {
        headline: data.headline,
        about_me: data.about_me,
        career_objective: data.career_objective,
        skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
        github_url: data.github_url,
        linkedin_url: data.linkedin_url,
        external_portfolio_url: data.external_portfolio_url !== undefined ? data.external_portfolio_url : data.externalPortfolioUrl,
        email: data.email,
        phone: data.phone,
        location: data.location,
        section_visibility_json: data.visibility || null,
        resume_visibility: data.resume_visibility !== undefined ? data.resume_visibility : (data.visibility?.showResume !== undefined ? data.visibility.showResume : true)
      };

      const response = await api.put(`/portfolio/customization/${registerNo}`, payload);

      // Sync successful saves to local storage to maintain a fallback cache
      const key = `${CUSTOMIZATION_KEY_PREFIX}${registerNo}`;
      localStorage.setItem(key, JSON.stringify(data));

      return {
        success: true,
        message: response.data.message || "Portfolio customization saved successfully.",
        customization: response.data.customization
      };
    } catch (error) {
      console.error("Error saving portfolio customization:", error);
      throw error;
    }
  },

  getStudentPortfolioCustomization: async () => {
    try {
      const response = await api.get(`/student/portfolio/customization`);
      return response.data;
    } catch (error) {
      console.error("Error in getStudentPortfolioCustomization:", error);
      throw error;
    }
  },

  saveStudentPortfolioCustomization: async (data) => {
    try {
      const path = `/student/portfolio/customization`;
      if (process.env.NODE_ENV === "development" || import.meta.env?.DEV || import.meta.env?.MODE === "development") {
        const fullUrl = (api.defaults.baseURL || "") + path;
        console.log(`[DEBUG] Save API URL: ${fullUrl}`);
        console.log(`[DEBUG] Save payload.hero.cgpa: ${data?.hero?.cgpa}`);
      }
      const response = await api.put(path, data);
      if (process.env.NODE_ENV === "development" || import.meta.env?.DEV || import.meta.env?.MODE === "development") {
        console.log(`[DEBUG] Save response status: ${response.status}`);
      }
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === "development" || import.meta.env?.DEV || import.meta.env?.MODE === "development") {
        console.log(`[DEBUG] Save error status: ${error.response?.status}`);
      }
      console.error("Error in saveStudentPortfolioCustomization:", error);
      throw error;
    }
  }
};
