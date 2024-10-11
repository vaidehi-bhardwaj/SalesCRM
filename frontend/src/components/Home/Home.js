import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "./Home.css";
import Content from "./ContentSection";
import useAuthGuard from "./useAuthGuard";

function Home() {
  useAuthGuard();

  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const storedUserRole = localStorage.getItem("userRole");
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }
  }, []);

  const getDashboardTitle = () => {
    switch (userRole) {
      case "admin":
        return "Admin Dashboard";
      case "supervisor":
        return "Supervisor Dashboard";
      case "subuser":
        return "Subuser Dashboard";
      default:
        return "User Dashboard"; // Fallback if no role is found
    }
  };

  return (
    <div className="home-container">
      <main>
        <h1 className="dashboard-title">{getDashboardTitle()}</h1>
        <Content userRole={userRole} />
      </main>
      <ToastContainer />
    </div>
  );
}

export default Home;
