import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getStudentImageUrl } from "../../utils/imageUtils";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Award,
  UploadCloud,
  CheckSquare,
  BookOpen,
  LogOut,
  GraduationCap,
  Settings,
  User,
  FileText
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const studentId = user?.studentId || user?.id || 1;
  const registerNo = user?.register_no || user?.registerNo || "22AD001";

  const [activeAdminSection, setActiveAdminSection] = useState("dashboard");
  const [activeStudentSection, setActiveStudentSection] = useState("dashboard");
  const [activeStaffSection, setActiveStaffSection] = useState("dashboard");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profileImage, user?.profile_image]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarSrc = getStudentImageUrl(user);

  console.log("SIDEBAR AVATAR URL", avatarSrc);

  const navItems = [
    // Non-student dashboard
    {
      name: "Dashboard",
      path: "/dashboard",
      action: "dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "faculty", "mentor", "placement_mentor"]
    },

    {
      name: "Manage Students",
      action: "manage-students",
      icon: Users,
      roles: ["admin"]
    },
    {
      name: "Manage Faculty",
      action: "manage-faculty",
      icon: Users,
      roles: ["admin"]
    },
    {
      name: "Manage Mentors",
      action: "manage-mentors",
      icon: Users,
      roles: ["admin"]
    },
    {
      name: "Assign Mentor",
      action: "assign-mentor",
      icon: CheckSquare,
      roles: ["admin"]
    },
    {
      name: "System Overview",
      action: "system-overview",
      icon: Settings,
      roles: ["admin"]
    },
    {
      name: "Upload Scores",
      path: "/admin/upload-scores",
      icon: UploadCloud,
      roles: ["admin"]
    },
    {
      name: "Students",
      path: "/students",
      icon: Users,
      roles: ["faculty", "mentor", "placement_mentor"]
    },
    {
      name: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
      roles: ["faculty", "mentor", "placement_mentor"]
    },
    {
      name: "Recommendations",
      path: "/recommendations",
      icon: Award,
      roles: ["faculty", "placement_mentor"]
    },
    {
      name: "Upload Scores",
      path: "/upload-scores",
      icon: UploadCloud,
      roles: ["faculty"]
    },
    {
      name: "Mentor Approvals",
      path: "/mentor/approvals",
      icon: CheckSquare,
      roles: ["mentor"]
    },
    {
      name: "Upload Records",
      path: "/mentor/upload-records",
      icon: UploadCloud,
      roles: ["mentor"]
    },
    // Student dashboard sections
    {
      name: "Dashboard",
      action: "dashboard",
      icon: LayoutDashboard,
      roles: ["student"]
    },
    {
      name: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
      roles: ["student"]
    },
    {
      name: "My Performance",
      path: "/my-performance",
      action: "performance",
      icon: Trophy,
      roles: ["student"]
    },
    {
      name: "My Projects",
      path: "/my-projects",
      action: "projects",
      icon: CheckSquare,
      roles: ["student"]
    },
    {
      name: "My Certifications",
      path: "/my-certifications",
      action: "certifications",
      icon: Award,
      roles: ["student"]
    },
    {
      name: "My Achievements",
      path: "/my-achievements",
      action: "achievements",
      icon: Trophy,
      roles: ["student"]
    },
    {
      name: "My Resume",
      path: "/my-resume",
      action: "resume",
      icon: FileText,
      roles: ["student"]
    },
    {
      name: "My Portfolio",
      path: "/my-portfolio",
      action: "portfolio-customization",
      icon: BookOpen,
      roles: ["student"]
    }
  ];

  const userRole = user?.role || "student";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  useEffect(() => {
    if (userRole === "admin") {
      const handleAdminAction = (event) => {
        setActiveAdminSection(event.detail);
      };
      const handleOpenProfile = () => {
        setActiveAdminSection("profile");
      };
      window.addEventListener("admin-sidebar-action", handleAdminAction);
      window.addEventListener("open-my-profile", handleOpenProfile);
      return () => {
        window.removeEventListener("admin-sidebar-action", handleAdminAction);
        window.removeEventListener("open-my-profile", handleOpenProfile);
      };
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === "student") {
      const handleStudentAction = (event) => {
        setActiveStudentSection(event.detail);
      };
      const handleOpenProfile = () => {
        setActiveStudentSection("profile");
      };
      window.addEventListener("student-sidebar-action", handleStudentAction);
      window.addEventListener("open-my-profile", handleOpenProfile);
      return () => {
        window.removeEventListener("student-sidebar-action", handleStudentAction);
        window.removeEventListener("open-my-profile", handleOpenProfile);
      };
    }
  }, [userRole]);

  useEffect(() => {
    if (["faculty", "mentor", "placement_mentor"].includes(userRole)) {
      const handleStaffAction = (event) => {
        setActiveStaffSection(event.detail);
      };
      const handleOpenProfile = () => {
        setActiveStaffSection("profile");
      };
      window.addEventListener("staff-sidebar-action", handleStaffAction);
      window.addEventListener("open-my-profile", handleOpenProfile);
      return () => {
        window.removeEventListener("staff-sidebar-action", handleStaffAction);
        window.removeEventListener("open-my-profile", handleOpenProfile);
      };
    }
  }, [userRole]);

  // Sync activeStudentSection with URL path if we navigate away and come back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasOpenProfile = params.get("action") === "open-profile";

    if (userRole === "student") {
      if (hasOpenProfile) {
        setActiveStudentSection("profile");
      } else if (currentPath === "/leaderboard") {
        setActiveStudentSection("");
      } else if (currentPath.startsWith("/portfolio")) {
        setActiveStudentSection("portfolio-customization");
      }
    } else if (["faculty", "mentor", "placement_mentor"].includes(userRole)) {
      if (hasOpenProfile) {
        setActiveStaffSection("profile");
      } else if (currentPath !== "/dashboard") {
        setActiveStaffSection("");
      }
    } else if (userRole === "admin") {
      if (hasOpenProfile) {
        setActiveAdminSection("profile");
      }
    }
  }, [currentPath, userRole]);

  return (
    <aside className="w-64 bg-[#163941] text-[#E5E5E5] h-auto flex flex-col justify-between border-r border-[#D1D5DB]/20 z-20">
      <div>
        {/* Brand Header Section */}
        <div className="p-5 flex items-center space-x-3 border-b border-[#214C55]">
          <div className="p-2 bg-[#C76F2B] text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wider leading-none">Student360</h1>
            <p className="text-[9px] text-[#C76F2B] font-extrabold uppercase tracking-widest mt-1">KCE Internal Portal</p>
          </div>
        </div>

        {/* User Context Widget */}
        <div className="p-3 mx-4 my-3 bg-[#214C55]/30 border border-[#214C55]/40 rounded-none flex items-center space-x-3">
          {avatarSrc && !imgError ? (
            <img
              src={avatarSrc}
              alt={user?.name || user?.username || "User"}
              className="w-9 h-9 rounded-none object-cover border border-[#214C55]/50 flex-shrink-0"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-none bg-[#214C55] text-white flex items-center justify-center font-black text-xs border border-[#214C55]/50 flex-shrink-0">
              {getInitials(user?.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <span className="text-[8px] font-bold text-[#E5E5E5]/60 uppercase tracking-widest block leading-none">Active Account</span>
            <span className="text-xs font-bold text-white truncate mt-1 block leading-tight">{user?.name || "Guest User"}</span>
            <span className="text-[9px] text-[#C76F2B] font-extrabold uppercase mt-0.5 tracking-wider block leading-none">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="px-2 py-2 space-y-1">
          {filteredNavItems.map((item) => {
            // Priority: if it's a direct path (like Leaderboard / Students / etc.)
            if (item.path) {
              const isActive = currentPath === item.path || 
                (item.action === "portfolio-customization" && currentPath.startsWith("/portfolio/"));
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all rounded-none ${
                    isActive
                      ? "bg-[#C76F2B] text-white border-l-4 border-white"
                      : "text-[#E5E5E5] hover:bg-[#214C55] hover:text-white"
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            }

            // Action items that switch local state (only if they don't have a path)
            if (item.action && !item.path) {
              let isActive = false;
              if (userRole === "admin") {
                isActive = activeAdminSection === item.action && currentPath === "/dashboard";
              } else if (userRole === "student") {
                if (item.action === "portfolio-customization") {
                  isActive = (activeStudentSection === "portfolio-customization" && currentPath === "/dashboard") || currentPath.startsWith("/portfolio");
                } else {
                  isActive = activeStudentSection === item.action && currentPath === "/dashboard";
                }
              } else {
                isActive = activeStaffSection === item.action && currentPath === "/dashboard";
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    navigate("/dashboard");
                    setTimeout(() => {
                      let eventName = "staff-sidebar-action";
                      if (userRole === "admin") eventName = "admin-sidebar-action";
                      else if (userRole === "student") eventName = "student-sidebar-action";

                      window.dispatchEvent(
                        new CustomEvent(eventName, {
                          detail: item.action,
                        })
                      );
                    }, 50);
                  }}
                  className={`w-full text-left flex items-center space-x-3 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all rounded-none ${
                    isActive
                      ? "bg-[#C76F2B] text-white border-l-4 border-white"
                      : "text-[#E5E5E5] hover:bg-[#214C55] hover:text-white"
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            }

            return null;
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
