import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generatePayslip = () => {
    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:5000/api/payroll/generate/${selectedEmployee}?month=${month}&year=${year}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payslip.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => console.error('Error generating payslip:', error));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Generate Payroll Payslip</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
            Employee
          </label>
          <select 
            id="employee"
            value={selectedEmployee} 
            onChange={e => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month (1-12)
            </label>
            <input
              id="month"
              type="number"
              min="1"
              max="12"
              placeholder="Month (1-12)"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year (YYYY)
            </label>
            <input
              id="year"
              type="number"
              min="2000"
              max="2099"
              placeholder="Year (YYYY)"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={generatePayslip}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Generate Payslip PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payroll; 