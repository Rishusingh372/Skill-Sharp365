import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Dashboard(){
  const user = JSON.parse(localStorage.getItem('user')||'null');
  const [enrolls, setEnrolls] = useState([]);
  useEffect(()=>{ if(user) api.get('/enrollments/my').then(r=>setEnrolls(r.data)).catch(()=>{}); }, [user]);
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.name} ({user?.role})</p>
      <h3>Your Courses</h3>
      <ul>
        {enrolls.map(e=>(
          <li key={e._id}>{e.course?.title} — Progress: {e.progress}%</li>
        ))}
      </ul>
    </div>
  );
}
