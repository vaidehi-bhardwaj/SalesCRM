import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadDetails from "../Leads/LeadDetails";
import "./UnassignedLeads.css"; // Add a dedicated CSS file for this component

const UnassignedLeads = () => {
  const [leads, setLeads] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]); // State for selected lead IDs
  const [selectedUserId, setSelectedUserId] = useState(""); // State for selected user ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(null); // For showing lead details

  // Fetch unassigned leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/unassigned-leads",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setLeads(response.data);
      } catch (err) {
        setError(err.response?.data?.details || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Fetch active users
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

  // Handle lead selection for bulk assignment
  const handleLeadSelection = (leadId) => {
    setSelectedLeads(
      (prevSelectedLeads) =>
        prevSelectedLeads.includes(leadId)
          ? prevSelectedLeads.filter((id) => id !== leadId) // Deselect if already selected
          : [...prevSelectedLeads, leadId] // Add to selection otherwise
    );
  };

  // Handle bulk assignment of selected leads
  const handleAssignLead = async () => {
    if (selectedLeads.length === 0 || !selectedUserId) {
      setError("Please select leads and a user before assigning.");
      return;
    }

    try {
      await axios.put(
        "http://localhost:8080/api/leads/assign-bulk",
        { leadIds: selectedLeads, assignedUserId: selectedUserId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Refresh leads list to remove reassigned leads
      const response = await axios.get(
        "http://localhost:8080/api/unassigned-leads",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setLeads(response.data);

      // Reset selection and user after successful assignment
      setSelectedLeads([]);
      setSelectedUserId("");
    } catch (err) {
      setError("Error assigning leads");
    }
  };

  const handleReassignClick = (leadId) => {
    setSelectedLeads([leadId]); // Select a single lead for reassignment
  };

  const handleLeadClick = (leadId) => {
    setShowLeadDetails(leadId); // Show details for the selected lead
  };

  const handleCloseDetails = () => {
    setShowLeadDetails(null); // Close the lead details modal
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No unassigned leads found</div>;

  return (
    <div className="unassigned">
      <h2>Unassigned Leads</h2>
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
    <th>Assigned To (Inactive)</th>
    <th>Priority</th>
    <th>Created By</th> 
    <th>Reassign Lead</th>
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
      <td>
        <button
          onClick={() => handleLeadClick(lead.leadNumber)}
          className="lead-number-button"
        >
          {lead.leadNumber || ""}
        </button>
      </td>
      <td>{lead.companyInfo?.companyName || ""}</td>
      <td>{`${lead.companyInfo.leadAssignedTo?.firstName || ""} ${
        lead.companyInfo.leadAssignedTo?.lastName || ""
      }`}</td>
      <td>{lead.companyInfo?.priority}</td>
      <td>{lead.createdBy?.firstName || ""} {lead.createdBy?.lastName || ""}</td> 
      <td>
        {selectedLeads.includes(lead._id) && selectedLeads.length === 1 ? (
          <>
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
            <button onClick={handleAssignLead} className="confirm-button">
              Confirm
            </button>
            <button onClick={() => setSelectedLeads([])} className="cancel-button">
              Cancel
            </button>
          </>
        ) : (
          <button className="reassign-btn" onClick={() => handleReassignClick(lead._id)}>
            Reassign
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
      </table>

      {/* Show LeadDetails component when a lead is selected */}
      {showLeadDetails && (
        <LeadDetails
          leadNumber={showLeadDetails}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default UnassignedLeads;
