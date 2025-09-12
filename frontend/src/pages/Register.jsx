import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [form,setForm]=useState({name:'',email:'',password:'',role:'learner'});
  const nav = useNavigate();
  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      nav('/dashboard');
    } catch (err) { alert(err.response?.data?.message || 'Register failed'); }
  };
  return (
    <div style={{maxWidth:400, margin:'20px auto'}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="w-full p-2 mb-2" />
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="w-full p-2 mb-2" />
        <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" className="w-full p-2 mb-2" />
        <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full p-2 mb-2">
          <option value="learner">Learner</option>
          <option value="instructor">Instructor</option>
        </select>
        <button className="p-2" style={{background:'#0369a1', color:'#fff'}}>Register</button>
      </form>
    </div>
  );
}
