import api from "./api";

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

export const profileService = {
  getProfile: async (role, userId) => {
    try {
      const response = await api.get("/users/me/profile");
      const res = response.data;
      
      // Map extra role details
      let extra = res.extra || {};
      
      return {
        fullName: res.fullName || res.full_name || "",
        email: res.email || "",
        phone: res.phone || "",
        role: res.role || role,
        department: res.department || "",
        location: res.location || "Coimbatore",
        profileImage: res.profileImage || res.profile_image || "",
        profileImageName: "",
        linkedinUrl: res.linkedinUrl || res.linkedin_url || "",
        githubUrl: res.githubUrl || res.github_url || "",
        bio: res.bio || "",
        extra: extra
      };
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn("Backend offline. Returning mock profile from localStorage.");
        if (import.meta.env.PROD) {
          throw error;
        }
        const key = `student360_profile_${role}_${userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch (e) {
            console.error("Error parsing stored profile:", e);
          }
        }

        // Mock defaults
        let defaultProfile = {
          fullName: role === "student" ? "Shahul" : (role === "faculty" ? "Dr. Ramanujam" : "Staff"),
          email: `${role}@student360.com`,
          phone: "9876543210",
          role: role,
          department: "AI & DS",
          location: "Coimbatore, Tamil Nadu",
          profileImage: "",
          profileImageName: "",
          linkedinUrl: "",
          githubUrl: "",
          bio: "I am a student studying Artificial Intelligence & Data Science.",
          extra: {
            registerNo: "22AD001",
            year: "3",
            section: "A"
          }
        };
        return defaultProfile;
      }
      throw error;
    }
  },

  saveProfile: async (role, userId, data) => {
    try {
      // 1. If profileImage is a Base64 string, upload it first
      let profileImageUrl = data.profileImage;
      if (data.profileImage && data.profileImage.startsWith("data:image")) {
        try {
          const blob = dataURLtoBlob(data.profileImage);
          const formData = new FormData();
          formData.append("file", blob, data.profileImageName || "profile.png");
          
          const imgResponse = await api.post("/users/me/profile-image", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          profileImageUrl = imgResponse.data.profileImage || imgResponse.data.profile_image;
          
          // Sync localStorage current user image details
          const savedUserRaw = localStorage.getItem("currentUser") || localStorage.getItem("user");
          if (savedUserRaw) {
            const savedUser = JSON.parse(savedUserRaw);
            savedUser.profileImage = profileImageUrl;
            savedUser.profile_image = profileImageUrl;
            localStorage.setItem("currentUser", JSON.stringify(savedUser));
            localStorage.setItem("user", JSON.stringify(savedUser));
          }
        } catch (e) {
          console.error("Failed to upload profile image to backend:", e);
        }
      }

      // 2. Update remaining profile fields
      const payload = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || "",
        location: data.location || "",
        bio: data.bio || "",
        department: data.department || "",
        github_url: data.githubUrl || data.github_url || "",
        linkedin_url: data.linkedinUrl || data.linkedin_url || "",
        year: data.extra?.year || "",
        section: data.extra?.section || "",
        program: data.extra?.program || ""
      };

      console.log("MY PROFILE SAVE PAYLOAD", payload);

      const response = await api.put("/users/me/profile", payload);
      const res = response.data;
      
      const key = `student360_profile_${role}_${userId}`;
      const savedLocal = {
        ...data,
        fullName: res.fullName || res.full_name || data.fullName,
        email: res.email || data.email,
        phone: res.phone || data.phone,
        department: res.department || data.department,
        location: res.location || data.location,
        bio: res.bio || data.bio,
        githubUrl: res.githubUrl || res.github_url || "",
        linkedinUrl: res.linkedinUrl || res.linkedin_url || "",
        profileImage: profileImageUrl || res.profileImage || res.profile_image || "",
        extra: res.extra || data.extra || {}
      };
      
      console.log("MY PROFILE SAVE RESPONSE", savedLocal);
      
      localStorage.setItem(key, JSON.stringify(savedLocal));
      return savedLocal;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        console.warn("Backend offline. Saving profile settings to localStorage.");
        if (import.meta.env.PROD) {
          throw error;
        }
        const key = `student360_profile_${role}_${userId}`;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
      throw error;
    }
  },

  updateProfileImage: async (role, userId, imageData) => {
    // Falls back to saveProfile handling image conversion
    const key = `student360_profile_${role}_${userId}`;
    let profile = {};
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        profile = JSON.parse(stored);
      } catch (e) {}
    } else {
      profile = await profileService.getProfile(role, userId);
    }

    profile.profileImage = imageData;
    return await profileService.saveProfile(role, userId, profile);
  }
};

export default profileService;
