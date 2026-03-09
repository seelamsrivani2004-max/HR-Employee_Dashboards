import React, { useState, useEffect } from 'react';
import { Clock, User as UserIcon, Calendar, Search } from 'lucide-react';
import api from '../../api';

const AllAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllAttendance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/attendance/all');
            setAttendance(res.data);
        } catch (err) {
            console.error('Error fetching all attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAttendance();
    }, []);

    const filteredAttendance = attendance.filter(record => 
        record.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm)
    );

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' }}>All Attendance</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor check-in/out records for all employees</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Search email or date..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', width: '250px' }}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading records...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                                    <UserIcon size={12} />
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{row.User?.email}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>{row.date}</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                                            {row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{row.hoursWorked ? `${row.hoursWorked}h` : '-'}</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#f0fdf4', color: '#22c55e', fontSize: '0.75rem', fontWeight: '700' }}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAttendance.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No attendance records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllAttendance;
