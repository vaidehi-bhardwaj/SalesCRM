import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useState } from "react";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import RefreshHandler from "./RefreshHandler";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ForgotPassword/ResetPassword";
import LayoutWithHeader from "./components/Layouts/LayoutWithHeader";
import LayoutWithoutHeader from "./components/Layouts/LayoutWithoutHeader";
import CreateLeads from "./components/CreateLeads/CreateLeads";
import Display from "./components/Leads/Display";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };
  return (
    <div className="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route element={<LayoutWithoutHeader />}>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
        <Route element={<LayoutWithHeader />}>
          <Route path="/home" element={<PrivateRoute element={<Home />} />} />
          <Route path="/leads" element={<CreateLeads />} />
          <Route path="/display" element={<Display />}/>
          {/* <Route path="/lead" component={LeadPage} />
        <Route path="/lead-details" component={LeadDetailsPage} />
        <Route path="/bi" component={BIPage} />
         */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
