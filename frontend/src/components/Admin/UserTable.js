// UserTable.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import AddUser from "./AddUser";
import EditUserModal from "./EditUserModal";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false); // Separate state for Add Modal
  const [showEditModal, setShowEditModal] = useState(false); // Separate state for Edit Modal
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleEditUser = (userId) => {
    setSelectedUserId(userId);
    setShowEditModal(true);
    setShowAddModal(false); // Ensure Add Modal is closed when editing
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUserId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowAddModal(true)}>Create New User</button>

      {showAddModal && (
        <div className="modal">
          <AddUser />
          <button onClick={closeAddModal}>Close</button>
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
          {users.map((user) => (
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
          ))}
        </tbody>
      </table>

      {showEditModal && selectedUserId && (
        <EditUserModal userId={selectedUserId} onClose={closeEditModal} />
      )}
    </div>
  );
};

export default UserTable;
