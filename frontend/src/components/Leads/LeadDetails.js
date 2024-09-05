import React, { useState, useEffect } from "react";
import axios from "axios";

const LeadDetails = ({ leadNumber, onClose }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLead, setEditedLead] = useState(null);
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/leads/${leadNumber}`
        );
        setLead(response.data);
        setEditedLead(response.data);
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching lead details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeadDetails();
  }, [leadNumber]);

  const handleInputChange = (e, section, subSection) => {
    const { name, value } = e.target;
    setEditedLead((prevLead) => {
      if (!prevLead) return null;
      return {
        ...prevLead,
        [section]: subSection
          ? {
              ...prevLead[section],
              [subSection]: {
                ...prevLead[section]?.[subSection],
                [name]: value,
              },
            }
          : { ...prevLead[section], [name]: value },
      };
    });
  };

  const handleAddDescription = async () => {
    if (!newDescription.trim()) return;
    try {
      const response = await axios.post(
        `http://localhost:8080/api/leads/${leadNumber}/descriptions`,
        { description: newDescription }
      );
      setLead(response.data);
      setEditedLead(response.data);
      setNewDescription("");
    } catch (err) {
      setError(
        err.message || "An error occurred while adding a new description"
      );
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/leads/${leadNumber}`,
        editedLead
      );
      setLead(response.data);
      setEditMode(false);
    } catch (err) {
      setError(err.message || "An error occurred while saving changes");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!lead) return <div>No lead found</div>;

  return (
    <div className="lead-details">
      <h2>Lead Details - {lead.leadNumber}</h2>
      <button onClick={onClose}>Close</button>
      <button onClick={() => setEditMode(!editMode)}>
        {editMode ? "Cancel" : "Edit"}
      </button>
      {editMode && <button onClick={handleSave}>Save Changes</button>}

      <h3>Company Information</h3>
      {lead.companyInfo &&
        Object.entries(lead.companyInfo).map(([key, value]) => (
          <div key={key}>
            <label>{key}:</label>
            {editMode ? (
              <input
                type="text"
                name={key}
                value={editedLead?.companyInfo?.[key] || ""}
                onChange={(e) => handleInputChange(e, "companyInfo")}
              />
            ) : (
              <span>{value || "N/A"}</span>
            )}
          </div>
        ))}

      <h3>Contact Information</h3>
      {lead.contactInfo &&
        Object.entries(lead.contactInfo).map(([section, details]) => (
          <div key={section}>
            <h4>{section}</h4>
            {details &&
              Object.entries(details).map(([key, value]) => (
                <div key={key}>
                  <label>{key}:</label>
                  {editMode ? (
                    <input
                      type="text"
                      name={key}
                      value={editedLead?.contactInfo?.[section]?.[key] || ""}
                      onChange={(e) =>
                        handleInputChange(e, "contactInfo", section)
                      }
                    />
                  ) : (
                    <span>{value || "N/A"}</span>
                  )}
                </div>
              ))}
          </div>
        ))}

      <h3>IT Landscape</h3>
      {lead.itLandscape &&
        Object.entries(lead.itLandscape).map(([section, details]) => (
          <div key={section}>
            <h4>{section}</h4>
            {details &&
              Object.entries(details).map(([key, value]) => (
                <div key={key}>
                  <label>{key}:</label>
                  {editMode ? (
                    <input
                      type="text"
                      name={key}
                      value={editedLead?.itLandscape?.[section]?.[key] || ""}
                      onChange={(e) =>
                        handleInputChange(e, "itLandscape", section)
                      }
                    />
                  ) : (
                    <span>{value || "N/A"}</span>
                  )}
                </div>
              ))}
          </div>
        ))}

      <h3>Descriptions</h3>
      {lead.descriptions &&
        lead.descriptions.map((desc, index) => (
          <div key={index}>
            <p>{desc.description}</p>
            <small>Added on: {new Date(desc.createdAt).toLocaleString()}</small>
          </div>
        ))}
      <div>
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Add a new description"
        />
        <button onClick={handleAddDescription}>Add Description</button>
      </div>
    </div>
  );
};

export default LeadDetails;
