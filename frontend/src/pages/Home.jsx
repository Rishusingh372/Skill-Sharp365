import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';

export default function Home(){
  const [courses, setCourses] = useState([]);
  useEffect(()=>{ api.get('/courses').then(r=>setCourses(r.data)).catch(console.error); }, []);
  return (
    <div>
      <h1 style={{fontSize:22}}>Featured Courses</h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:12}}>
        {courses.map(c=>(
          <div key={c._id} style={{border:'1px solid #ddd', padding:12, borderRadius:6}}>
            <h3>{c.title}</h3>
            <p>{c.description?.slice(0,120)}</p>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>₹{c.price||0}</div>
              <Link to={`/courses/${c._id}`}>View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
