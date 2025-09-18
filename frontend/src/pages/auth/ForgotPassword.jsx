import React, { useState } from 'react'
import API from '../../services/api'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await API.post('/auth/forgot-password', { email })
      setMessage(res.data.message)
    } catch (err) { setMessage(err.response?.data?.message || 'Error sending email') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-3 border" />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Send Reset Email</button>
        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  )
}
