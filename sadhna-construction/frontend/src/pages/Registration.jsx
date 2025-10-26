import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/registration.css';

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    surname: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContact: '',
    position: '',
    experience: '',
    username: '',
    password: '',
    confirmPassword: '',
    expectedSalary: '',
    additionalInfo: ''
  });
  
  const [documents, setDocuments] = useState({
    idProof: null,
    addressProof: null,
    policeVerification: null,
    resume: null,
    photo: null
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setDocuments({
      ...documents,
      [name]: files[0]
    });
  };
  
  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const validateStep = (currentStep) => {
    switch(currentStep) {
      case 1:
        if (!formData.fullName || !formData.surname || !formData.email || 
            !formData.phone || !formData.dateOfBirth || !formData.gender) {
          toast.error('Please fill all required fields in personal details');
          return false;
        }
        
        // Age validation - check if 18 years or older
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birth month is after current month 
        // or if birth month is the same but birth day is after current day
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          toast.error('You must be at least 18 years old to apply');
          return false;
        }
        
        return true;
      case 2:
        if (!formData.position || !formData.experience || 
            !formData.username || !formData.password || !formData.confirmPassword) {
          toast.error('Please fill all required fields in employment details');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }
    
    setLoading(true);

    try {
      // Create FormData object to handle file upload
      const data = new FormData();
      
      // Log for debugging
      console.log('Form data being submitted:', formData);
      console.log('Document files being submitted:', 
        Object.keys(documents).filter(key => documents[key] !== null).map(key => ({
          field: key,
          name: documents[key]?.name,
          size: documents[key]?.size
        }))
      );
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      
      // Add all documents
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          data.append(key, documents[key]);
        }
      });

      const response = await axios.post('http://localhost:5000/api/applications/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        toast.success('Registration successful! Your application is under review. We will contact you soon.');
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show a more detailed error message if available
      if (error.response?.data?.details) {
        // If there are multiple validation errors, show them all
        error.response.data.details.forEach(detail => {
          toast.error(detail);
        });
      } else {
        toast.error(error.response?.data?.message || 'Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render different form sections based on current step
  const renderFormStep = () => {
    switch(step) {
      case 1:
        return (
          <>
            <h3 className="step-title">Step 1: Personal Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">First Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="surname">Surname *</label>
                <input
                  type="text"
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact Number</label>
              <input
                type="tel"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <h3 className="step-title">Step 2: Employment Details</h3>
            <div className="form-group">
              <label htmlFor="position">Position Applying For *</label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              >
                <option value="">Select a position</option>
                <option value="mason">Mason</option>
                <option value="carpenter">Carpenter</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="painter">Painter</option>
                <option value="laborer">Laborer</option>
                <option value="supervisor">Supervisor</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="experience">Years of Experience *</label>
              <input
                type="number"
                id="experience"
                name="experience"
                min="0"
                max="50"
                value={formData.experience}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="expectedSalary">Expected Daily Wage (₹) *</label>
              <input
                type="number"
                id="expectedSalary"
                name="expectedSalary"
                min="0"
                value={formData.expectedSalary}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Choose Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <small>This will be used for login after your application is approved</small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <small>Must be at least 6 characters</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalInfo">Additional Skills or Information</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Tell us about your skills, previous work experience, or anything else you'd like us to know."
              />
            </div>
          </>
        );
      
      case 3:
        return (
          <>
            <h3 className="step-title">Step 3: Document Upload</h3>
            <p className="document-instruction">Please upload all required documents. All documents must be in PDF, JPG, JPEG, or PNG format and less than 5MB in size.</p>
            
            <div className="form-group document-group">
              <label htmlFor="idProof">ID Proof (Aadhar Card/PAN Card/Voter ID) *</label>
              <input
                type="file"
                id="idProof"
                name="idProof"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              {documents.idProof && (
                <div className="file-preview">
                  <span>{documents.idProof.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setDocuments({...documents, idProof: null})}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group document-group">
              <label htmlFor="addressProof">Address Proof *</label>
              <input
                type="file"
                id="addressProof"
                name="addressProof"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              {documents.addressProof && (
                <div className="file-preview">
                  <span>{documents.addressProof.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setDocuments({...documents, addressProof: null})}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group document-group">
              <label htmlFor="policeVerification">Police Verification Form *</label>
              <input
                type="file"
                id="policeVerification"
                name="policeVerification"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              {documents.policeVerification && (
                <div className="file-preview">
                  <span>{documents.policeVerification.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setDocuments({...documents, policeVerification: null})}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group document-group">
              <label htmlFor="photo">Recent Passport Size Photo *</label>
              <input
                type="file"
                id="photo"
                name="photo"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                required
              />
              {documents.photo && (
                <div className="file-preview">
                  <span>{documents.photo.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setDocuments({...documents, photo: null})}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group document-group">
              <label htmlFor="resume">Resume/CV (Optional)</label>
              <input
                type="file"
                id="resume"
                name="resume"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              {documents.resume && (
                <div className="file-preview">
                  <span>{documents.resume.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setDocuments({...documents, resume: null})}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-agreement">
              <p>By submitting this application, I certify that all information provided is true and complete to the best of my knowledge. I understand that any false information may result in the rejection of my application or termination of employment.</p>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h1>Sadhna Construction</h1>
        <h2>Worker Registration</h2>
      </div>
      
      <div className="registration-form-container">
        <div className="progress-steps">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div 
              key={i} 
              className={`step ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-label">
                {i === 0 ? 'Personal Details' : i === 1 ? 'Employment' : 'Documents'}
              </div>
            </div>
          ))}
        </div>
        
        <form className="registration-form" onSubmit={handleSubmit}>
          {renderFormStep()}
          
          <div className="form-buttons">
            {step > 1 && (
              <button 
                type="button" 
                className="prev-btn"
                onClick={prevStep}
              >
                Previous
              </button>
            )}
            
            <Link to="/" className="cancel-link">Cancel</Link>
            
            {step < totalSteps ? (
              <button 
                type="button" 
                className="next-btn"
                onClick={() => {
                  if (validateStep(step)) {
                    nextStep();
                  }
                }}
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration; 