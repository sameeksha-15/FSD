import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import API from '../services/api';

const SiteMonitoring = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    progress: '',
    status: 'In Progress',
    photos: []
  });

  const fetchReports = async () => {
    try {
      const response = await API.get('/api/site-monitoring');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch site monitoring reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      photos: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate user object
      if (!user || !user._id) {
        console.error('User data missing:', user);
        toast.error('User authentication error. Please try logging in again.');
        return;
      }

      console.log('Submitting report with user:', user);
      
      // Validate progress is a number between 0 and 100
      const progress = parseInt(formData.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        toast.error('Progress must be a number between 0 and 100');
        return;
      }

      // Create the form data with all fields
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('progress', progress.toString());
      formDataToSend.append('status', formData.status);
      formDataToSend.append('reportedBy', user._id || user.id);
      
      // Add photos if any
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach(photo => {
          formDataToSend.append('photos', photo);
        });
      }

      // Log the form data for debugging
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Make the API call with the correct headers
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (selectedReport) {
        const response = await API.put(
          `/api/site-monitoring/${selectedReport._id}`, 
          formDataToSend,
          config
        );
        console.log('Update response:', response.data);
        toast.success('Report updated successfully');
      } else {
        const response = await API.post(
          '/api/site-monitoring', 
          formDataToSend,
          config
        );
        console.log('Create response:', response.data);
        toast.success('Report created successfully');
      }

      setShowForm(false);
      setSelectedReport(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        progress: '',
        status: 'In Progress',
        photos: []
      });
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      console.error('Error response:', error.response?.data);
      console.error('User data at time of error:', user);
      
      let errorMessage = 'Error submitting report: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      toast.error(errorMessage);
    }
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setFormData({
      title: report.title,
      description: report.description,
      location: report.location,
      progress: report.progress,
      status: report.status,
      photos: []
    });
    setShowForm(true);
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await API.delete(`/api/site-monitoring/${reportId}`);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleAddComment = async (reportId, comment) => {
    try {
      await API.post(`/api/site-monitoring/${reportId}/comments`, { text: comment });
      fetchReports();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Only show add button for supervisors and admins
  const canAddReport = ['Admin', 'Manager', 'Supervisor'].includes(user?.role);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Site Monitoring</h1>
        {canAddReport && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Report
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedReport ? 'Edit Report' : 'New Report'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Progress (%)</label>
                  <input
                    type="number"
                    name="progress"
                    value={formData.progress}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Photos (max 5)</label>
                  <input
                    type="file"
                    onChange={handlePhotoChange}
                    multiple
                    accept="image/*"
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedReport(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {selectedReport ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No site monitoring reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => {
            // Debug logging for images
            if (report.photos && report.photos.length > 0) {
              console.log('Report:', report.title);
              console.log('Photos:', report.photos);
              console.log('First photo path:', report.photos[0].path);
              console.log('Constructed URL:', `http://localhost:5000/${report.photos[0].path}`);
            }
            
            return (
            <div key={report._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {report.photos && report.photos.length > 0 && (
                <div className="h-48 overflow-hidden bg-gray-100">
                  <img
                    src={`http://localhost:5000/${report.photos[0].path}`}
                    alt={report.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error for:', report.title);
                      console.error('Photo path:', report.photos[0].path);
                      console.error('Full URL:', e.target.src);
                      e.target.style.display = 'none';
                      // Show placeholder
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', report.title);
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                <p className="text-gray-600 mb-2">{report.description}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{report.location}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    report.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    report.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                    report.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${report.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{report.progress}% Complete</span>
                </div>
                {(user?.role === 'Admin' || user?.id === report.reportedBy._id) && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(report)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SiteMonitoring;