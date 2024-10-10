import React, { useState, useEffect } from "react";
import axios from "axios";

const MultipleAssign = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8080/api/leads/inactive",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLeads(response.data);
      } catch (err) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No leads found for inactive users</div>;

  return (
    <div>
      <h2>Leads for Inactive Users</h2>
      <table>
        <thead>
          <tr>
            <th>Lead Number</th>
            <th>Company Name</th>
            <th>Priority</th>
            <th>Created By</th>
            <th>Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id}>
              <td>{lead.leadNumber}</td>
              <td>{lead.companyInfo["Company Name"]}</td>
              <td>{lead.companyInfo.Priority}</td>
              <td>{lead.createdBy?.firstName || "N/A"}</td>
              <td>
                {lead.companyInfo.leadAssignedTo?.firstName || "Not Assigned"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MultipleAssign;
