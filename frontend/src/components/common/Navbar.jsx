import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getStudentImageUrl } from "../../utils/imageUtils";
import { User, Calendar, LogOut } from "lucide-react";
import api from "../../services/api";

export const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Escape key handler to close dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest(".profile-dropdown-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleMyProfileClick = () => {
    setDropdownOpen(false);
    if (user?.role === "student") {
      navigate("/my-profile");
    } else {
      navigate("/my-profile");
    }
  };

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar_url, user?.profileImage, user?.profile_image, user?.profileImageUpdatedAt]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const avatarSrc = getStudentImageUrl(user);

  console.log("NAVBAR AVATAR URL", avatarSrc);
  console.log("CURRENT USER IMAGE FIELDS", {
    profileImage: user?.profileImage,
    profile_image: user?.profile_image,
    profileImageUpdatedAt: user?.profileImageUpdatedAt
  });

  return (
    <header className="bg-white border-b border-[#D1D5DB] h-14 px-6 flex items-center justify-between z-10 shadow-none">
      {/* Title */}
      <div>
        <h2 className="text-sm font-extrabold text-[#214C55] uppercase tracking-wider">{title || "Student360"}</h2>
      </div>

      {/* Right side items */}
      <div className="flex items-center space-x-6">


        {/* Date display */}
        <div className="hidden md:flex items-center space-x-2 text-[#6B7280] text-xs font-semibold">
          <Calendar size={13} className="text-[#6B7280]" />
          <span>{formattedDate}</span>
        </div>

        {/* Profile indicator with dropdown */}
        <div className="flex items-center space-x-3 border-l border-[#D1D5DB] pl-6 relative profile-dropdown-container">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 focus:outline-none cursor-pointer text-left bg-transparent border-none p-0"
          >
            <div className="text-right">
              <p className="text-xs font-black text-[#111827]">{user?.name || "Guest User"}</p>
              <p className="text-[9px] text-[#C76F2B] uppercase font-extrabold tracking-widest leading-none mt-0.5">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            
            {avatarSrc && !imgError ? (
              <img
                src={avatarSrc}
                alt={user?.name || user?.username || "User"}
                className="w-8 h-8 rounded-none object-cover border border-[#D1D5DB]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-none bg-[#E5E5E5] border border-[#D1D5DB] flex items-center justify-center text-[#214C55] font-black text-xs">
                {getInitials(user?.name)}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-11 mt-2 w-56 bg-white border border-[#D1D5DB] shadow-lg py-2 z-50 rounded-none text-left">
              {/* Mini user info */}
              <div className="px-4 py-2.5 border-b border-[#E5E5E5] flex items-center space-x-3">
                {avatarSrc && !imgError ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name || user?.username || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-[#D1D5DB]"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#214C55] text-white flex items-center justify-center text-sm font-black">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#111827] truncate leading-tight">{user?.name || "Guest User"}</p>
                  <p className="text-[9px] text-[#C76F2B] font-extrabold uppercase tracking-wider mt-0.5">{user?.role?.replace("_", " ")}</p>
                </div>
              </div>

              {/* Action items */}
              <div className="py-1">
                <button
                  onClick={handleMyProfileClick}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[#214C55] hover:bg-[#F7F7F7] flex items-center space-x-2 cursor-pointer uppercase tracking-wider bg-transparent border-none"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-[#FFF5F5] flex items-center space-x-2 cursor-pointer uppercase tracking-wider border-t border-[#E5E5E5]/60 bg-transparent border-none"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
