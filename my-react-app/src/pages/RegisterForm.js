import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',      // Matches DTO: fullName
        email: '',         // Matches DTO: email
        password: '',      // Matches DTO: password
        companyName: '',   // Matches DTO: companyName
        phoneNumber: ''    // Matches DTO: phoneNumber
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8080/api/v1/auth/register', formData);
            alert("Success! Check MongoDB Compass now.");
            console.log(res.data);
        } catch (err) {
            console.error("Submission failed", err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Full Name" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            {/* Add inputs for companyName and phoneNumber similarly */}
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
