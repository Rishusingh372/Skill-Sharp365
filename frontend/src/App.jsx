import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursePage from './pages/CoursePage';

export default function App(){
  return (
    <>
      <nav style={{background:'#0369a1', color:'#fff', padding:10}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between'}}>
          <div><Link to="/" style={{color:'#fff', textDecoration:'none', fontWeight:700}}>SkillSharp LMS</Link></div>
          <div><Link to="/login" style={{color:'#fff', marginRight:10}}>Login</Link><Link to="/register" style={{color:'#fff'}}>Register</Link></div>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/courses/:id" element={<CoursePage/>}/>
        </Routes>
      </div>
    </>
  );
}
