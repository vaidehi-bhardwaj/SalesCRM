import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadDetails from "../Leads/LeadDetails";


const UnassignedLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const currentUserId = localStorage.getItem("userId");

  const handleLeadClick = (leadNumber) => {
    setSelectedLead(leadNumber);
  };

  const handleCloseDetails = () => {
    setSelectedLead(null);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh when closing LeadDetails
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchLeads = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/leads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setLeads(response.data);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [refreshTrigger]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No leads found</div>;

  return (
    <div>
      <h2 className="display">Unassigned Leads</h2>
      <table>
        <thead>
          <tr>
            <th>Lead Number</th>
            <th>Company Name</th>
            <th>Created By</th>
            <th>Assign To</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id || lead.leadNumber}>
              <td>
                <button
                  className="display-button"
                  onClick={() => handleLeadClick(lead.leadNumber)}
                >
                  {lead.leadNumber || ""}
                </button>
              </td>
              <td>{lead.companyInfo?.companyName || ""}</td>
              <td>{lead.createdBy?.firstName || ""}</td>
              <td>
                {lead.companyInfo?.leadAssignedTo?.firstName || "Not Assigned"}
              </td>
              <td>{lead.companyInfo?.priority || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLead && (
        <LeadDetails leadNumber={selectedLead} onClose={handleCloseDetails} />
      )}
    </div>
  );
};

export default UnassignedLeads;
