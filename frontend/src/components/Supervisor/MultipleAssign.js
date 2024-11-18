import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UnassignedLeads.css"; // Reusing the existing CSS file for consistency

const MultipleAssign = () => {
  const [leads, setLeads] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leads assigned to the logged-in user
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/assigned-leads",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
           setLeads(response.data.leads || []); 
      } catch (err) {
        setError(err.response?.data?.details || "An error occurred");
           setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Fetch active users for bulk assignment
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/active-users",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setActiveUsers(response.data);
      } catch (err) {
        setError("Error fetching active users");
      }
    };

    fetchActiveUsers();
  }, []);

  // Handle lead selection
  const handleLeadSelection = (leadId) => {
    setSelectedLeads((prevSelectedLeads) =>
      prevSelectedLeads.includes(leadId)
        ? prevSelectedLeads.filter((id) => id !== leadId)
        : [...prevSelectedLeads, leadId]
    );
  };

  // Handle bulk assignment
  const handleAssignLead = async () => {
    if (selectedLeads.length === 0 || !selectedUserId) {
      setError("Please select leads and a user before assigning.");
      return;
    }

  try {
    const response = await axios.put(
      "http://localhost:8080/api/leads/assign-bulk",
      { leadIds: selectedLeads, assignedUserId: selectedUserId },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    console.log(response.data.message); // Log success message
    alert("Leads assigned successfully!");

    // Refresh the leads list
    const leadsResponse = await axios.get(
      "http://localhost:8080/api/assigned-leads",
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    setLeads(leadsResponse.data); // Update leads in the UI
  } catch (error) {
    console.error(
      "Error assigning leads:",
      error.response?.data || error.message
    );
    alert("Failed to assign leads. Please try again.");
  }

  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No leads found</div>;

  return (
    <div className="unassigned">
      <h2>Assigned Leads</h2>
      <div>
        <select
          onChange={(e) => setSelectedUserId(e.target.value)}
          value={selectedUserId}
        >
          <option value="">Select a user</option>
          {activeUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssignLead}
          disabled={selectedLeads.length === 0 || !selectedUserId}
          className="bulk-assign-button"
        >
          Bulk Assign
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Lead Number</th>
            <th>Company Name</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead._id)}
                  onChange={() => handleLeadSelection(lead._id)}
                  className="lead-checkbox"
                />
              </td>
              <td>{lead.leadNumber}</td>
              <td>{lead.companyInfo?.companyName || ""}</td>
              <td>{lead.companyInfo?.priority || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MultipleAssign;
