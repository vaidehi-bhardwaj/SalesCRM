import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const TeamOverview = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null); // Store error message if any
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  useEffect(() => {
    fetchUsers(); // Fetch users when component mounts
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/team-overview",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Authorization header
          },
        }
      );
      setUsers(response.data.users); // Assuming the API returns { users: [...] }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users. Please try again later."); // Store error message
    }
  };

  const viewLeads = (userId) => {
    navigate(`/leads/${userId}`); // Navigate to leads page for the selected user
  };

  return (
    <div className="team-overview-container">
      <h1>Team Overview</h1>
      {error && <p className="error-message">{error}</p>}{" "}
      {/* Display error message if any */}
      <div className="table-container">
        <table className="team-overview-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => viewLeads(user._id)}>
                      View Leads
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamOverview;
