import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [form,setForm]=useState({email:'',password:''});
  const nav = useNavigate();
  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      nav('/dashboard');
    } catch (err) { alert(err.response?.data?.message || 'Login failed'); }
  };
  return (
    <div style={{maxWidth:400, margin:'20px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="w-full p-2 mb-2" />
        <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" className="w-full p-2 mb-2" />
        <button className="p-2" style={{background:'#0369a1', color:'#fff'}}>Login</button>
      </form>
    </div>
  );
}
