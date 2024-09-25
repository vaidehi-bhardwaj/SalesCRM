// EditUserModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const EditUserModal = ({ userId, onClose }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    designation: "",
    email: "",
    mobile: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/api/users/${userId}`, userData);
      alert("User updated successfully!");
      onClose(); // Close the modal after successful update
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  return (
    <div className="modal">
      <h2>Edit User</h2>
      <form onSubmit={handleFormSubmit}>
        <label>First Name:</label>
        <input
          type="text"
          name="firstName"
          value={userData.firstName}
          onChange={handleInputChange}
        />
        <label>Last Name:</label>
        <input
          type="text"
          name="lastName"
          value={userData.lastName}
          onChange={handleInputChange}
        />
        <label>Designation:</label>
        <input
          type="text"
          name="designation"
          value={userData.designation}
          onChange={handleInputChange}
        />
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={userData.email}
          onChange={handleInputChange}
        />
        <label>Mobile:</label>
        <input
          type="text"
          name="mobile"
          value={userData.mobile}
          onChange={handleInputChange}
        />
        <label>Role:</label>
        <select name="role" value={userData.role} onChange={handleInputChange}>
          <option value="subuser">Subuser</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        <label>Status:</label>
        <select
          name="status"
          value={userData.status}
          onChange={handleInputChange}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditUserModal;
