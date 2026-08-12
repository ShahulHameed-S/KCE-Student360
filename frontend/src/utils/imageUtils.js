const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const resolveImageUrl = (url, timestamp = null) => {
  if (!url || typeof url !== "string") return null;

  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  const ts = timestamp || Date.now();

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    if (cleanUrl.includes("/uploads/")) {
      return cleanUrl.includes("?")
        ? `${cleanUrl}&v=${ts}`
        : `${cleanUrl}?v=${ts}`;
    }
    return cleanUrl;
  }

  if (cleanUrl.startsWith("data:image")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("/leaderboard/")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("leaderboard/")) {
    return `/${cleanUrl}`;
  }

  if (cleanUrl.startsWith("/uploads/")) {
    const resolved = `${API_BASE_URL}${cleanUrl}`;
    return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${ts}`;
  }

  if (cleanUrl.startsWith("uploads/")) {
    const resolved = `${API_BASE_URL}/${cleanUrl}`;
    return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${ts}`;
  }

  const resolved = cleanUrl.startsWith("/")
    ? `${API_BASE_URL}${cleanUrl}`
    : `${API_BASE_URL}/${cleanUrl}`;
  return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${ts}`;
};

export const getStudentImageUrl = (studentOrUser) => {
  if (!studentOrUser) return null;

  const timestamp = studentOrUser.profileImageUpdatedAt || studentOrUser.updatedAt || studentOrUser.updated_at || null;

  const rawUrl =
    studentOrUser.avatar_url ||
    studentOrUser.avatarUrl ||
    studentOrUser.profile_image_url ||
    studentOrUser.profileImageUrl ||
    studentOrUser.profile_image ||
    studentOrUser.profileImage ||
    studentOrUser.image_url ||
    studentOrUser.imageUrl ||
    studentOrUser.avatar ||
    studentOrUser.image ||
    studentOrUser.photo ||
    studentOrUser.userProfile?.avatar_url ||
    studentOrUser.userProfile?.avatarUrl ||
    studentOrUser.userProfile?.profile_image_url ||
    studentOrUser.userProfile?.profile_image ||
    studentOrUser.userProfile?.profileImage ||
    studentOrUser.student?.avatar_url ||
    studentOrUser.student?.avatarUrl ||
    studentOrUser.student?.profile_image_url ||
    studentOrUser.student?.profile_image ||
    studentOrUser.student?.profileImage ||
    studentOrUser.user?.avatar_url ||
    studentOrUser.user?.avatarUrl ||
    studentOrUser.user?.profile_image_url ||
    studentOrUser.user?.profile_image ||
    studentOrUser.user?.profileImage ||
    null;

  return resolveImageUrl(rawUrl, timestamp);
};

export const getResumeUrl = (resume) => {
  const raw =
    resume?.resumeUrl ||
    resume?.resume_url ||
    resume?.filePath ||
    resume?.file_path ||
    resume?.url ||
    resume?.fileUrl ||
    resume?.file_url ||
    resume?.resume?.resumeUrl ||
    resume?.resume?.resume_url ||
    resume?.resume?.filePath ||
    resume?.resume?.file_path ||
    resume?.resume?.fileUrl ||
    resume?.resume?.file_url;

  if (!raw) return null;

  return resolveImageUrl(raw);
};

