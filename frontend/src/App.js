import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useState, useEffect } from "react";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import RefreshHandler from "./RefreshHandler";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ForgotPassword/ResetPassword";
import LayoutWithHeader from "./components/Layouts/LayoutWithHeader";
import LayoutWithoutHeader from "./components/Layouts/LayoutWithoutHeader";
import CreateLeads from "./components/CreateLeads/CreateLeads";
import Display from "./components/Leads/Display";
import LeadDetails from "./components/Leads/LeadDetails";
import AdminDashboard from "./components/Dashboards/AdminDashboard";
import SupervisorDashboard from "./components/Dashboards/SupervisorDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  // Simplified PrivateRoute handling authentication and role check
  function PrivateRoute({ element, allowedRoles }) {
    console.log("PrivateRoute - isAuthenticated:", isAuthenticated);
    console.log("PrivateRoute - userRole:", userRole);
    console.log("PrivateRoute - allowedRoles:", allowedRoles);

    if (!isAuthenticated) {
      console.log("PrivateRoute - Not authenticated, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
      console.log("PrivateRoute - User role not allowed, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    console.log("PrivateRoute - Access granted");
    return element;
  }

  return (
    <div className="App">
      <RefreshHandler
        setIsAuthenticated={setIsAuthenticated}
        setUserRole={setUserRole}
      />
      <Routes>
        <Route element={<LayoutWithoutHeader />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route element={<LayoutWithHeader />}>
          <Route
            path="/home"
            element={
              <PrivateRoute
                element={<Home />}
                allowedRoles={["subuser", "supervisor", "admin"]}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <PrivateRoute
                element={<CreateLeads />}
                allowedRoles={["subuser", "supervisor", "admin"]}
              />
            }
          />
          <Route
            path="/display"
            element={
              <PrivateRoute
                element={<Display />}
                allowedRoles={["subuser", "supervisor", "admin"]}
              />
            }
          />
          <Route
            path="/details"
            element={
              <PrivateRoute
                element={<LeadDetails />}
                allowedRoles={["subuser", "supervisor", "admin"]}
              />
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute
                element={<AdminDashboard />}
                allowedRoles={["admin"]}
              />
            }
          />
          <Route
            path="/supervisor/dashboard"
            element={
              <PrivateRoute
                element={<SupervisorDashboard />}
                allowedRoles={["supervisor", "admin"]}
              />
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
