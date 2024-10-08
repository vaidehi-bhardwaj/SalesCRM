import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleSuccess } from "../../utils";
import { ToastContainer } from "react-toastify";
import Dropdown from "./Dropdown";
import "./Header.css";
import logo from "./logo.png";
import home from "./home.png";

const headerButtonsByRole = {
  supervisor: [
    { name: "Lead", items: ["Create Leads"] },
    {
      name: "Lead Details",
      items: ["Leads List", "BI", "Multiple Assign"],
    },
    { name: "Team", items: ["Overview"] },
    { name: "To-do", items: ["To-do List"] },
    { name: "Change Password", items: ["Change Password"] },
  ],
  admin: [
    {
      name: "Leads",
      items: ["Leads List"],
    },
    { name: "To-do", items: ["To-do List"] },
    { name: "Team", items: ["Overview"] },
    { name: "Users", items: ["User Management"] },
    { name: "Change Password", items: ["Change Password"] },
  ],
  subuser: [
    { name: "Lead", items: ["Create Leads", "Leads List"] },
    { name: "To-do", items: ["To-do List"] },
    { name: "Change Password", items: ["Change Password"] },
  ],
};

function Header() {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [userId, setUserId] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedInUser(localStorage.getItem("loggedInUser"));
    setUserId(localStorage.getItem("userId"));
    setUserRole(localStorage.getItem("userRole")); 
  }, []);

 const handleLogout = (e) => {
   // Remove all items stored during login
   localStorage.removeItem("token");
   localStorage.removeItem("loggedInUser");
   localStorage.removeItem("userId");
   localStorage.removeItem("userRole");

   handleSuccess("User Logged out");
   setTimeout(() => {
     navigate("/login", { replace: true });
     window.location.reload();
   }, 1000);
 };
  const handleDocumentClick = (event) => {
    if (!event.target.closest(".dropdown")) {
      setOpenDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

   const headerButtons = headerButtonsByRole[userRole] || [];

  return (
    <div className="main-container">
      <img src={logo} alt="Top " className="top-image" />

      <div
        className={`main-header ${
          userRole === "subuser"
            ? "subuser-header"
            : userRole === "admin"
            ? "admin-header"
            : userRole==="supervisor"
            ?"supervisor-header"
            :""
        }`}
      >
        <div className="header-buttons">
          {headerButtons.map((button, index) => (
            <Dropdown
              key={index}
              name={button.name}
              items={button.items}
              isOpen={openDropdown === index}
              toggleDropdown={() => toggleDropdown(index)}
            />
          ))}
        </div>
        <div className="user-info">
          <span className="user-name">{loggedInUser}</span>

          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          <button onClick={() => navigate("/home")} className="btn">
            <img src={home} className="interface"></img>
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default Header;
