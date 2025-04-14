import React, { useState } from 'react';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [expandedUser, setExpandedUser] = useState(null);
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      bio: 'Passionate baker and whisky enthusiast. Love experimenting with new recipes!',
      personalLinks: ['https://instagram.com/johndoe', 'https://twitter.com/johndoe'],
      isApproved: true,
      isAdmin: false
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      bio: 'Professional pastry chef with 10 years of experience. Specializing in whisky-infused desserts.',
      personalLinks: ['https://instagram.com/janesmith', 'https://pinterest.com/janesmith'],
      isApproved: false,
      isAdmin: false
    },
    {
      id: 3,
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      bio: 'Site administrator and content moderator.',
      personalLinks: [],
      isApproved: true,
      isAdmin: true
    }
  ]);

  // Calculate stats
  const totalUsers = users.length;
  const pendingApprovals = users.filter(user => !user.isApproved).length;
  const totalAdmins = users.filter(user => user.isAdmin).length;
  const pendingRecipes = users.filter(user => !user.isApproved).length;
  const handleApproveUser = (userId) => {
    console.log('Approve user:', userId);
  };

  const handleRejectUser = (userId) => {
    console.log('Reject user:', userId);
  };

  const toggleUserDetails = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  return (
    <div className="user-management">
      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Profiles</h3>
          <p className="stat-number">{pendingApprovals}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Recipes</h3>
          <p className="stat-number">{pendingRecipes}</p>
        </div>
        <div className="stat-card">
          <h3>Total Admins</h3>
          <p className="stat-number">{totalAdmins}</p>
        </div>
      </div>

      {/* Desktop View */}
      <div className="users-table desktop-view">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Bio</th>
              <th>Links</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </td>
                <td className="user-bio">
                  {user.bio}
                </td>
                <td className="user-links">
                  {user.personalLinks.length > 0 ? (
                    <ul>
                      {user.personalLinks.map((link, index) => (
                        <li key={index}>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="no-links">No links provided</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                    {user.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="actions">
                  {!user.isApproved && (
                    <>
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectUser(user.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="users-list mobile-view">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div 
              className="user-header"
              onClick={() => toggleUserDetails(user.id)}
            >
              <div className="user-name">{user.name}</div>
              <div className="user-status">
                <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                  {user.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
            
            {expandedUser === user.id && (
              <div className="user-details">
                <div className="user-email">{user.email}</div>
                <div className="user-username">@{user.username}</div>
                <div className="user-bio">{user.bio}</div>
                <div className="user-links">
                  {user.personalLinks.length > 0 ? (
                    <ul>
                      {user.personalLinks.map((link, index) => (
                        <li key={index}>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="no-links">No links provided</span>
                  )}
                </div>
                <div className="user-actions">
                  {!user.isApproved && (
                    <>
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectUser(user.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement; 