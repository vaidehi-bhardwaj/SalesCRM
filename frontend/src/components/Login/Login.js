import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../../utils";
import "./Login.css";
import logo from "./logo.png";
import map from "./map.png";

function Login({ setIsAuthenticated, setUserRole }) {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

 const handleLogin = async (e) => {
   e.preventDefault();
   const { email, password } = loginInfo;
   if (!email || !password) {
     return handleError("Email and password are required");
   }
   try {
     const url = `http://localhost:8080/auth/login`;
     const response = await fetch(url, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify(loginInfo),
     });
     const result = await response.json();

     const { success, message, jwtToken, firstName, userId, role } = result;
     if (success) {
       handleSuccess(message);
       localStorage.setItem("token", jwtToken);
       localStorage.setItem("loggedInUser", firstName);
       localStorage.setItem("userId", userId);
       localStorage.setItem("userRole", role);

       setIsAuthenticated(true);
       setUserRole(role);

       // Redirect based on user role
       setTimeout(() => {
         switch (role.toLowerCase()) {
           case "admin":
             navigate("/home");
             break;
           case "supervisor":
             navigate("/home");
             break;
           case "subuser":
           default:
             navigate("/home");
             break;
         }
       }, 1000);
     } else {
       handleError(message);
     }
   } catch (err) {
     handleError(err.message);
   }
 };


  return (
    <div className="login-page">
      <header className="header" />
      <main className="main-content">
        <div className="login-container">
          <div className="image-box">
            <img src={logo} alt="Company Logo" className="logo" />
            <img src={map} alt="Map" className="map" />
          </div>
          <div className="box">
            <h1>Sign in to your CRM account</h1>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  onChange={handleChange}
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={loginInfo.email}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  onChange={handleChange}
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginInfo.password}
                  required
                />
              </div>
              <div className="form-group">
                <button type="submit" className="btn-login">
                  Sign In
                </button>
                <a href="/forgot-password" className="forgot-password">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p>Copyright &copy; Sage Technologies. All rights reserved.</p>
      </footer>

      <ToastContainer />
    </div>
  );
}

export default Login;
