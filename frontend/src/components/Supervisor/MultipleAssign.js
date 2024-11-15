import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadDetails from "../Leads/LeadDetails";

const MultipleAssign = () => {
  const [leads, setLeads] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(null);

  // Fetch assigned leads for the supervisor
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/leads", // Endpoint to get leads assigned to the supervisor
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

  // Fetch active users under the supervisor
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/active-users", // Endpoint to get active users for supervisor
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

  // Function to handle lead selection for bulk assignment
  const handleLeadSelection = (leadId) => {
    setSelectedLeads((prevSelectedLeads) =>
      prevSelectedLeads.includes(leadId)
        ? prevSelectedLeads.filter((id) => id !== leadId)
        : [...prevSelectedLeads, leadId]
    );
  };

  // Function to handle bulk assignment of selected leads
  const handleAssignLead = async () => {
    try {
      await axios.put(
        "http://localhost:8080/api/leads/assign-bulk", // Bulk assign endpoint
        { leadIds: selectedLeads, assignedUserId: selectedUserId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Update the leads state to reflect the new assigned user in real-time
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          selectedLeads.includes(lead._id)
            ? {
                ...lead,
                companyInfo: {
                  ...lead.companyInfo,
                  leadAssignedTo: activeUsers.find(
                    (user) => user._id === selectedUserId
                  ),
                },
              }
            : lead
        )
      );

      // Clear selections after successful assignment
      setSelectedLeads([]);
      setSelectedUserId("");
    } catch (err) {
      setError("Error assigning leads");
    }
  };

  const handleReassignClick = (leadId) => {
    setSelectedLeads([leadId]); // Select a single lead for individual reassignment
  };

  const handleLeadClick = (leadId) => {
    setShowLeadDetails(leadId); // Set the lead ID to open details
  };

  const handleCloseDetails = () => {
    setShowLeadDetails(null); // Close lead details
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No assigned leads found</div>;

  return (
    <div>
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
            <th>Assigned To</th>
            <th>Priority</th>
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
              <td>
                {selectedLeads.includes(lead._id) ? (
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
                    <button onClick={handleAssignLead}>Confirm</button>
                    <button onClick={() => setSelectedLeads([])}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => handleReassignClick(lead._id)}>
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

export default MultipleAssign;
