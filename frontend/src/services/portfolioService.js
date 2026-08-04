import api from "./api";
import { getPortfolioData } from "../data/mockPortfolio";

export const portfolioService = {
  getStudentPortfolio: async (registerNo) => {
    try {
      const response = await api.get(`/portfolio/${registerNo}`);
      const data = response.data;

      const customization = data.portfolioCustomization || data.portfolio_customization || {};
      const about = data.about || {};
      const student = data.student || {};
      const performance = data.performance || {};
      
      const customizationVisibility = customization.visibility || customization.sectionVisibility || customization.section_visibility_json || null;

      const resumeObj = data.resume || null;
      const resumeSkills = resumeObj?.keySkills || resumeObj?.key_skills || [];
      const mapped = {
        name: student.name || "",
        register_no: student.register_no || registerNo,
        registerNo: student.register_no || registerNo,
        department: student.department || "",
        title: customization.headline || resumeObj?.primaryRole || resumeObj?.primary_role || resumeObj?.resumeTitle || resumeObj?.title || about.headline || "",
        about: customization.about_me || resumeObj?.careerObjective || resumeObj?.career_objective || about.about_me || "",
        career_objective: customization.career_objective || resumeObj?.careerObjective || resumeObj?.career_objective || about.career_objective || "",
        skills: (customization.skills && customization.skills.length > 0)
          ? customization.skills
          : (resumeSkills.length > 0
            ? resumeSkills
            : (about.skills ? (Array.isArray(about.skills) ? about.skills : String(about.skills).split(",").map(s => s.trim())) : [])),
        projects: Array.isArray(data.projects) ? data.projects : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        resume: resumeObj,
        visibility: customizationVisibility || {
          showProjects: true,
          showCertifications: true,
          showAchievements: true,
          showAcademicHighlights: true,
          showContactLinks: true,
          showResume: true
        },
        theme: customization.theme || "Dark Cosmic",
        contact: {
          email: customization.email || student.email || "",
          phone: customization.phone || "",
          location: customization.location || "Coimbatore",
          github: customization.github_url || resumeObj?.githubUrl || resumeObj?.github_url || "",
          linkedin: customization.linkedin_url || resumeObj?.linkedinUrl || resumeObj?.linkedin_url || ""
        },
        ai_summary: data.aiSummary || data.ai_summary || null,
        performance: performance,
        student: student,
        portfolioCustomization: customization,
        portfolio_customization: customization
      };

      console.log("Portfolio API data:", mapped);
      return mapped;
    } catch (error) {
      console.warn(`Portfolio API failed for ${registerNo}, returning mock portfolio template:`, error.message);
      // Simulating API loading
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const portfolio = getPortfolioData(registerNo);
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      // Merge local customization if available
      const customKey = `student360_portfolio_customization_${registerNo}`;
      const customDataRaw = localStorage.getItem(customKey);
      let customData = null;
      if (customDataRaw) {
        try {
          customData = JSON.parse(customDataRaw);
        } catch (e) {
          console.error("Error parsing customization in portfolioService", e);
        }
      }

      // Merge user submissions if available
      const subKey = `student360_submissions_${registerNo}`;
      const subDataRaw = localStorage.getItem(subKey);
      let subData = { projects: [], certifications: [], achievements: [] };
      if (subDataRaw) {
        try {
          subData = JSON.parse(subDataRaw);
        } catch (e) {
          console.error("Error parsing submissions in portfolioService", e);
        }
      }

      const merged = { ...portfolio };

      // Merge resume data if available (Priority 3)
      const resumeKey = `student360_resume_${registerNo}`;
      const resumeDataRaw = localStorage.getItem(resumeKey);
      const backendResumeExists = portfolio.resume && (portfolio.resume.fileUrl || portfolio.resume.fileName || portfolio.resume.id > 0);
      if (resumeDataRaw && !backendResumeExists) {
        try {
          const resData = JSON.parse(resumeDataRaw);
          merged.resume = resData;
          if (resData.primaryRole) merged.title = resData.primaryRole;
          if (resData.careerObjective) {
            merged.about = resData.careerObjective;
            merged.career_objective = resData.careerObjective;
          }
          if (resData.keySkills && resData.keySkills.length > 0) {
            merged.skills = resData.keySkills;
          }
        } catch (e) {
          console.error("Error parsing resume data in portfolioService", e);
        }
      }

      // Merge Student My Profile About Me data (Priority 2)
      const aboutProfileKey = `student360_about_profile_${registerNo}`;
      const aboutProfileRaw = localStorage.getItem(aboutProfileKey);
      if (aboutProfileRaw) {
        try {
          const aboutProfileData = JSON.parse(aboutProfileRaw);
          if (aboutProfileData.headline) merged.title = aboutProfileData.headline;
          if (aboutProfileData.about_me) merged.about = aboutProfileData.about_me;
          if (aboutProfileData.career_objective) merged.career_objective = aboutProfileData.career_objective;
          if (aboutProfileData.skillsSummary) {
            merged.skills = aboutProfileData.skillsSummary
              .split(",")
              .map(s => s.trim())
              .filter(Boolean);
          }
        } catch (e) {
          console.error("Error parsing about profile data in portfolioService", e);
        }
      }

      // Merge local customization if available (Priority 1)
      if (customData) {
        if (customData.headline) merged.title = customData.headline;
        if (customData.about_me) merged.about = customData.about_me;
        if (customData.career_objective) merged.career_objective = customData.career_objective;
        if (customData.skills && customData.skills.length > 0) merged.skills = customData.skills;
        
        merged.contact = {
          ...merged.contact,
          email: customData.email || merged.contact?.email || "",
          github: customData.github_url || merged.contact?.github || "",
          linkedin: customData.linkedin_url || merged.contact?.linkedin || "",
          phone: customData.phone || merged.contact?.phone || "",
          location: customData.location || merged.contact?.location || ""
        };

        merged.theme = customData.theme || "Dark Minimal";
        merged.visibility = customData.visibility || {
          showProjects: true,
          showCertifications: true,
          showAchievements: true,
          showAcademicHighlights: true,
          showContactLinks: true,
          showResume: true
        };
      }

      // Merge achievements, certifications, projects from submissions
      merged.projects = [
        ...(portfolio.projects || []).map(p => ({ ...p, status: p.status || p.approval_status || "Approved" })),
        ...(subData.projects || []).map(p => ({ ...p, status: p.status || "Pending" }))
      ];

      merged.certifications = [
        ...(portfolio.certifications || []).map(c => ({ ...c, status: c.status || c.approval_status || "Approved" })),
        ...(subData.certifications || []).map(c => ({ ...c, status: c.status || "Pending" }))
      ];

      merged.achievements = [
        ...(portfolio.achievements || []).map(a => ({ ...a, status: a.status || a.approval_status || "Approved" })),
        ...(subData.achievements || []).map(a => ({ ...a, status: a.status || "Pending" }))
      ];

      return merged;
    }
  }
};
