import React, { useState, useContext } from 'react'
import API from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await API.post('/auth/login', { email, password })
      login(res.data.token, res.data.user)
      if (res.data.user.role === 'teacher') navigate('/dashboard/teacher')
      else if (res.data.user.role === 'admin') navigate('/dashboard/admin')
      else navigate('/dashboard/student')
    } catch (err) { alert(err.response?.data?.message || 'Login failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-3 border" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 mb-3 border" />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
        <p className="mt-3 text-center"><Link to="/forgot-password" className="text-blue-600">Forgot Password?</Link></p>
      </form>
    </div>
  )
}
