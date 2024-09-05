import React, { useState, useEffect } from "react";
import axios from "axios";

const Display = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/leads");
        if (response.data && Array.isArray(response.data)) {
          console.log("Fetched leads:", response.data);
          setLeads(response.data);
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "An unknown error occurred"
        );
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Helper function to get company name
  const getCompanyName = (lead) => {
    if (lead.companyInfo && lead.companyInfo["Company Name"]) {
      return lead.companyInfo["Company Name"];
    }
    return "N/A";
  };

  // Helper function to get description
  const getDescription = (lead) => {
    if (lead.descriptionSection && lead.descriptionSection.description) {
      return lead.descriptionSection.description;
    }
    return "N/A";
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (leads.length === 0) return <div>No leads found</div>;

  return (
    <div>
      <h2>Recent Leads</h2>
      <table>
        <thead>
          <tr>
            <th>Lead Number</th>
            <th>Company Name</th>
            <th>IT Contact</th>
            <th>ERP System</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id || lead.leadNumber}>
              <td>{lead.leadNumber || "N/A"}</td>
              <td>{getCompanyName(lead)}</td>
              <td>
                {lead.contactInfo?.it?.name || "N/A"} (
                {lead.contactInfo?.it?.email || "N/A"})
              </td>
              <td>{lead.itLandscape?.netNew?.["Using ERP (y/n)"] || "N/A"}</td>
              <td>{getDescription(lead)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Display;
