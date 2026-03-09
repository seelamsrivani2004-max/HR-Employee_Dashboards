import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminGate = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === 'HarithaJesus123') {
            sessionStorage.setItem('admin_gate_passed', 'true');
            navigate('/admin-login');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Admin Security Gate</h2>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                    Please enter the master password to access the admin login.
                </p>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
                    <div className="input-group">
                        <label>Master Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Continue</button>
                    <button 
                        type="button" 
                        className="btn" 
                        style={{ marginTop: '1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                        onClick={() => navigate('/login')}
                    >
                        Return to Employee Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminGate;
