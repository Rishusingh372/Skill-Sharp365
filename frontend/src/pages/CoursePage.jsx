import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useParams } from 'react-router-dom';

export default function CoursePage(){
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  useEffect(()=>{ api.get('/courses/'+id).then(r=>setCourse(r.data)).catch(console.error); }, [id]);
  const enroll = async () => {
    try {
      // create order then open razorpay, simplified demo: call enroll directly
      await api.post('/enrollments/'+id, { paymentId: 'demo' });
      alert('Enrolled!');
    } catch (err) { alert('Enroll failed'); }
  };
  if(!course) return <div>Loading...</div>;
  return (
    <div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <div>Price: ₹{course.price}</div>
      <button onClick={enroll} style={{background:'#0369a1', color:'#fff', padding:8, marginTop:8}}>Enroll Now</button>
    </div>
  );
}
