import React, { useState, useEffect } from "react";
import axios from "axios";
import AddUser from "./AddUser"; // Assuming AddUser is in the same directory

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users");
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  fetchUsers();
}, []);

// Log the users state to see if it has data
console.log("Users state:", users);


  const handleEditUser = (userId) => {
    // Logic to edit user
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Create New User</button>

      {showModal && (
        <div className="modal">
          <AddUser />
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            if (!user) return null; // Skip null user objects
            return (
              <tr key={user._id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>
                  <button onClick={() => handleEditUser(user._id)}>Edit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
