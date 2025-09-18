import React, { useState, useContext } from 'react'
import API from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await API.post('/auth/register', { name, email, password, role })
      login(res.data.token, res.data.user)
      navigate(role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')
    } catch (err) { alert(err.response?.data?.message || 'Register failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Register</h2>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 mb-3 border" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-3 border" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 mb-3 border" />
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full p-2 mb-3 border">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <button className="w-full p-2 bg-green-600 text-white rounded">Register</button>
      </form>
    </div>
  )
}
