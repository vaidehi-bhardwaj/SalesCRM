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
import AdminDashboard from "./components/Admin/AdminDashboard";
import SupervisorDashboard from "./components/Dashboards/SupervisorDashboard";
import AddUser from "./components/Admin/AddUser";
import UserTable from "./components/Admin/UserTable";
import ErrorBoundary from "./components/Admin/ErrorBoundary";
import TeamOverview from "./components/Team/TeamOverview";
import UserLeads from "./components/Team/UserLeads";
import MultipleAssign from "./components/Supervisor/MultipleAssign";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state

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

    setIsLoading(false); // Set loading to false once the check is complete
  }, []);

  // Simplified PrivateRoute handling authentication and role check
  function PrivateRoute({ element, allowedRoles }) {
    if (isLoading) {
      return null; // Prevent rendering or redirecting while loading
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }

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

          <Route
            path="/add-user"
            element={
              <PrivateRoute element={<AddUser />} allowedRoles={["admin"]} />
            }
          />
          <Route
            path="/user-management"
            element={
              <PrivateRoute
                element={
                  <ErrorBoundary>
                    <UserTable />
                  </ErrorBoundary>
                }
                allowedRoles={["admin"]}
              />
            }
          />
          <Route
            path="/team-overview"
            element={
              <PrivateRoute
                element={<TeamOverview />}
                allowedRoles={["admin", "supervisor"]}
              />
            }
          />
          <Route
            path="/leads/:userId"
            element={
              <PrivateRoute
                element={<UserLeads />}
                allowedRoles={["admin", "supervisor"]}
              />
            }
          />
          <Route
            path="/multiple-assign"
            element={
              <PrivateRoute
                element={<MultipleAssign />}
                allowedRoles={["admin", "supervisor"]}
              />
            }
          />
        </Route>
      </Routes>
    </div>
  );
}




export default App;
