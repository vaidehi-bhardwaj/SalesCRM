import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RefreshHandler({ setIsAuthenticated, setUserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    console.log("RefreshHandler - token:", token);
    console.log("RefreshHandler - userRole:", userRole);

    const publicPaths = ["/", "/login", "/forgot-password", "/reset-password"];
    const isPublicPath = publicPaths.some((path) =>
      location.pathname.startsWith(path)
    );

    if (token && userRole) {
      setIsAuthenticated(true);
      setUserRole(userRole);

      if (isPublicPath && !hasNavigated.current) {
        let targetPath = "";
        switch (userRole.toLowerCase()) {
          case "admin":
            targetPath = "/admin/dashboard";
            break;
          case "supervisor":
            targetPath = "/supervisor/dashboard";
            break;
          default:
            targetPath = "/home";
        }

        console.log("RefreshHandler - Navigating to:", targetPath);

        if (location.pathname !== targetPath) {
          hasNavigated.current = true;
          navigate(targetPath, { replace: true });
        }
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);

      if (!isPublicPath && !hasNavigated.current) {
        hasNavigated.current = true;
        navigate("/home", { replace: true });
      }
    }
  }, [location.pathname, navigate, setIsAuthenticated, setUserRole]);

  return null;
}

export default RefreshHandler;
