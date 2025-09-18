import React, { useState } from 'react'
import API from '../../services/api'
import { useParams, useNavigate } from 'react-router-dom'

export default function ResetPassword(){
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return setMessage('Passwords do not match')
    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password })
      setMessage(res.data.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) { setMessage(err.response?.data?.message || 'Error resetting password') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="New Password" type="password" className="w-full p-2 mb-3 border" />
        <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm Password" type="password" className="w-full p-2 mb-3 border" />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Reset Password</button>
        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  )
}
