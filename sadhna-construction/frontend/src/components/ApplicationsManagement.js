import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/admin-dashboard.css';

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [hireFormData, setHireFormData] = useState({
    salary: '',
    role: 'Worker'
  });
  const [hiringLoading, setHiringLoading] = useState(false);
  const [hiredInfo, setHiredInfo] = useState(null);

  // Fetch all job applications
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication error. Please login again.');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/applications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Handle changing application status
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication error. Please login again.');
        return;
      }
      
      await axios.put(`http://localhost:5000/api/applications/${applicationId}/status`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update the application in the local state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      toast.success(`Application marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  // Accept application and open hire modal
  const handleAccept = (application) => {
    // Intelligently suggest role based on position
    let suggestedRole = 'Worker';
    const position = application.position?.toLowerCase() || '';
    
    if (position.includes('supervisor') || position.includes('site') || position.includes('lead')) {
      suggestedRole = 'Supervisor';
    } else if (position.includes('manager') || position.includes('project')) {
      suggestedRole = 'Manager';
    } else if (position.includes('admin') || position.includes('hr')) {
      suggestedRole = 'Admin';
    }
    
    console.log(`Suggesting role "${suggestedRole}" for position "${application.position}"`);
    
    setSelectedApplication(application);
    setHireFormData({
      salary: application.expectedSalary || '',
      role: suggestedRole
    });
    setHiredInfo(null);
    setShowAcceptModal(true);
  };

  // Reject application
  const handleReject = async (applicationId) => {
    if (window.confirm('Are you sure you want to reject this application?')) {
      await handleStatusChange(applicationId, 'Rejected');
    }
  };

  // View application details
  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Download document
  const downloadDocument = async (applicationId, documentType) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication error. Please login again.');
        return;
      }
      
      // Create a temporary anchor element for download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = `http://localhost:5000/api/applications/${applicationId}/document/${documentType}`;
      
      // Add Authorization header via URL for download
      a.href += `?token=${encodeURIComponent(token)}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`Downloading ${documentType}`);
    } catch (error) {
      console.error(`Error downloading ${documentType}:`, error);
      toast.error(`Failed to download ${documentType}`);
    }
  };

  // Download resume
  const downloadResume = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication error. Please login again.');
        return;
      }
      
      // Create a temporary anchor element for download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = `http://localhost:5000/api/applications/${applicationId}/resume`;
      
      // Add Authorization header via URL for download
      a.href += `?token=${encodeURIComponent(token)}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Downloading resume');
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast.error('Failed to download resume');
    }
  };

  // Open hire modal
  const openHireModal = (application) => {
    setSelectedApplication(application);
    setHireFormData({
      salary: application.expectedSalary || '',
      role: 'Worker'
    });
    setHiredInfo(null);
    setShowHireModal(true);
  };

  // Handle form input change for hiring
  const handleHireFormChange = (e) => {
    const { name, value } = e.target;
    setHireFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process hiring
  const handleHireSubmit = async (e) => {
    e.preventDefault();
    
    if (!hireFormData.salary || !hireFormData.role) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setHiringLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication error. Please login again.');
        return;
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/applications/${selectedApplication._id}/hire`,
        hireFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setHiredInfo(response.data.employeeInfo);
      fetchApplications(); // Refresh the applications list
      toast.success('Employee account created successfully');
    } catch (error) {
      console.error('Error creating employee account:', error);
      toast.error(error.response?.data?.message || 'Failed to create employee account');
    } finally {
      setHiringLoading(false);
    }
  };

  return (
    <div className="applications-container">
      <h2>Job Applications</h2>
      
      <div className="controls">
        <button onClick={fetchApplications} className="refresh-btn">
          Refresh
        </button>
      </div>
      
      <div className="applications-table-container">
        <table className="applications-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app._id}>
                <td>{app.name} {app.surname}</td>
                <td>{app.position}</td>
                <td>{formatDate(app.createdAt)}</td>
                <td>
                  <span className={`status-badge ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => viewApplicationDetails(app)}
                    className="btn btn-primary btn-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="modal-backdrop">
          <div className="modal-content application-modal">
            <div className="modal-header">
              <h3>Application Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="application-details">
                <h4>Personal Information</h4>
                <div className="details-grid">
                  <div className="detail-row">
                    <div className="detail-label">Email:</div>
                    <div className="detail-value">{selectedApplication.email}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Phone:</div>
                    <div className="detail-value">{selectedApplication.phone}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Date of Birth:</div>
                    <div className="detail-value">{formatDate(selectedApplication.dateOfBirth)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Gender:</div>
                    <div className="detail-value">{selectedApplication.gender}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Address:</div>
                    <div className="detail-value">{selectedApplication.address}, {selectedApplication.city}, {selectedApplication.state}, {selectedApplication.pincode}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Emergency Contact:</div>
                    <div className="detail-value">{selectedApplication.emergencyContact}</div>
                  </div>
                </div>
                
                <h4>Professional Information</h4>
                <div className="details-grid">
                  <div className="detail-row">
                    <div className="detail-label">Position:</div>
                    <div className="detail-value">{selectedApplication.position}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Experience:</div>
                    <div className="detail-value">{selectedApplication.experience} years</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Expected Salary:</div>
                    <div className="detail-value">₹{selectedApplication.expectedSalary}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Applied On:</div>
                    <div className="detail-value">{formatDate(selectedApplication.createdAt)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">
                      <span className={`status-badge ${selectedApplication.status.toLowerCase()}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Username:</div>
                    <div className="detail-value">{selectedApplication.username}</div>
                  </div>
                </div>
                
                <h4>Documents</h4>
                <div className="documents-grid">
                  {selectedApplication.resumePath && (
                    <div className="document-item">
                      <span className="document-label">Resume/CV</span>
                      <div className="document-action">
                        <button 
                          onClick={() => downloadResume(selectedApplication._id)}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.idProofPath && (
                    <div className="document-item">
                      <span className="document-label">ID Proof</span>
                      <div className="document-action">
                        <button 
                          onClick={() => downloadDocument(selectedApplication._id, 'idProof')}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.addressProofPath && (
                    <div className="document-item">
                      <span className="document-label">Address Proof</span>
                      <div className="document-action">
                        <button 
                          onClick={() => downloadDocument(selectedApplication._id, 'addressProof')}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.policeVerificationPath && (
                    <div className="document-item">
                      <span className="document-label">Police Verification</span>
                      <div className="document-action">
                        <button 
                          onClick={() => downloadDocument(selectedApplication._id, 'policeVerification')}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.photoPath && (
                    <div className="document-item">
                      <span className="document-label">Photo</span>
                      <div className="document-preview">
                        <img 
                          src={`http://localhost:5000/api/applications/${selectedApplication._id}/document/photo?token=${localStorage.getItem('token')}`}
                          alt="Applicant"
                          className="document-image"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedApplication.status !== 'Hired' && selectedApplication.status !== 'Rejected' && (
                <>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      handleAccept(selectedApplication);
                    }}
                    className="btn btn-success"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => {
                      handleReject(selectedApplication._id);
                      setShowModal(false);
                    }}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedApplication && (
        <div className="modal-backdrop">
          <div className="modal-content hire-modal">
            <div className="modal-header">
              <h3>Accept Application</h3>
              <button 
                onClick={() => setShowAcceptModal(false)}
                className="close-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {hiredInfo ? (
                <div className="hired-info">
                  <h4>Employee Account Created</h4>
                  <div className="alert alert-success">
                    <p>Application accepted successfully. Employee account created with these credentials:</p>
                  </div>
                  <div className="credential-box">
                    <div className="credential-row">
                      <span className="credential-label">Username:</span>
                      <span className="credential-value">{hiredInfo.username}</span>
                    </div>
                    <div className="credential-row">
                      <span className="credential-label">Password:</span>
                      <span className="credential-value">{hiredInfo.password}</span>
                    </div>
                    <div className="credential-row">
                      <span className="credential-label">Role:</span>
                      <span className="credential-value">{hiredInfo.role}</span>
                    </div>
                  </div>
                  <div className="alert alert-warning">
                    <p><strong>Note:</strong> Please securely share these credentials with the employee. This is the only time the password will be shown.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHireSubmit} className="hire-form">
                  <div className="form-group">
                    <label htmlFor="role">System Role (Access Level):</label>
                    <select 
                      id="role" 
                      name="role" 
                      value={hireFormData.role}
                      onChange={handleHireFormChange}
                      required
                    >
                      <option value="Worker">Worker (Basic Access)</option>
                      <option value="Supervisor">Supervisor (Site Monitoring)</option>
                      <option value="Manager">Manager (Full Management)</option>
                      <option value="Admin">Admin (System Admin)</option>
                    </select>
                    <small className="form-hint">
                      Note: This is the system access role, not the job position. 
                      Applied Position: <strong>{selectedApplication.position}</strong>
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="salary">Salary (₹):</label>
                    <input 
                      type="number" 
                      id="salary" 
                      name="salary" 
                      value={hireFormData.salary}
                      onChange={handleHireFormChange}
                      placeholder="Enter monthly salary"
                      min="1000"
                      required
                    />
                  </div>
                  <div className="alert alert-info">
                    <p>Accepting this application will create an employee account for {selectedApplication.name} with login credentials.</p>
                  </div>
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowAcceptModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={hiringLoading}
                    >
                      {hiringLoading ? 'Processing...' : 'Accept & Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {hiredInfo && (
              <div className="modal-footer">
                <button 
                  onClick={() => setShowAcceptModal(false)} 
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hire Modal (Legacy - can be removed if not needed) */}
      {showHireModal && selectedApplication && (
        <div className="modal-backdrop">
          <div className="modal-content hire-modal">
            <div className="modal-header">
              <h3>Hire Applicant</h3>
              <button 
                onClick={() => setShowHireModal(false)}
                className="close-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {hiredInfo ? (
                <div className="hired-info">
                  <h4>Employee Account Created</h4>
                  <div className="alert alert-success">
                    <p>Employee has been hired successfully. Please share these credentials with them:</p>
                  </div>
                  <div className="credential-box">
                    <div className="credential-row">
                      <span className="credential-label">Username:</span>
                      <span className="credential-value">{hiredInfo.username}</span>
                    </div>
                    <div className="credential-row">
                      <span className="credential-label">Password:</span>
                      <span className="credential-value">{hiredInfo.password}</span>
                    </div>
                    <div className="credential-row">
                      <span className="credential-label">Role:</span>
                      <span className="credential-value">{hiredInfo.role}</span>
                    </div>
                  </div>
                  <div className="alert alert-warning">
                    <p><strong>Note:</strong> Please securely share these credentials with the employee. This is the only time the password will be shown.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHireSubmit} className="hire-form">
                  <div className="form-group">
                    <label htmlFor="role">System Role (Access Level):</label>
                    <select 
                      id="role" 
                      name="role" 
                      value={hireFormData.role}
                      onChange={handleHireFormChange}
                      required
                    >
                      <option value="Worker">Worker (Basic Access)</option>
                      <option value="Supervisor">Supervisor (Site Monitoring)</option>
                      <option value="Manager">Manager (Full Management)</option>
                      <option value="Admin">Admin (System Admin)</option>
                    </select>
                    <small className="form-hint">
                      Note: This is the system access role, not the job position. 
                      Applied Position: <strong>{selectedApplication.position}</strong>
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="salary">Salary (₹):</label>
                    <input 
                      type="number" 
                      id="salary" 
                      name="salary" 
                      value={hireFormData.salary}
                      onChange={handleHireFormChange}
                      placeholder="Enter monthly salary"
                      min="1000"
                      required
                    />
                  </div>
                  <div className="alert alert-info">
                    <p>This will create an employee account for {selectedApplication.name} and mark their application as 'Hired'.</p>
                  </div>
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowHireModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={hiringLoading}
                    >
                      {hiringLoading ? 'Processing...' : 'Hire Applicant'}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {hiredInfo && (
              <div className="modal-footer">
                <button 
                  onClick={() => setShowHireModal(false)} 
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagement; 