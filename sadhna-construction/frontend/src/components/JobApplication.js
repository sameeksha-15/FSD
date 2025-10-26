import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/job-application.css';

const JobApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    message: ''
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.position) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!resume) {
      toast.error('Please upload your resume');
      return;
    }

    setLoading(true);

    // Create FormData object for file upload
    const applicationData = new FormData();
    Object.keys(formData).forEach(key => {
      applicationData.append(key, formData[key]);
    });
    applicationData.append('resume', resume);

    try {
      // Send application to server
      await axios.post(
        'http://localhost:5000/api/applications/apply',
        applicationData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Application submitted successfully!');
      // Reset form after submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        message: ''
      });
      setResume(null);
      
      // Navigate to home page after successful submission
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-application-container">
      <div className="job-application-card">
        <h2 className="job-application-title">Apply for a Position</h2>
        
        <form className="job-application-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Position Applied For *</label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="">Select a position</option>
              <option value="Site Engineer">Site Engineer</option>
              <option value="Civil Engineer">Civil Engineer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Construction Worker">Construction Worker</option>
              <option value="Electrical Engineer">Electrical Engineer</option>
              <option value="Architect">Architect</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Administrative Staff">Administrative Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience (Years)</label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            >
              <option value="">Select experience level</option>
              <option value="0-1">Less than 1 year</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">More than 10 years</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="resume">Resume/CV *</label>
            <input
              type="file"
              id="resume"
              name="resume"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
            />
            <div className="file-hint">Upload PDF, DOC or DOCX (Max 5MB)</div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Additional Information</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about yourself and why you're interested in this position"
              rows="4"
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobApplication; 