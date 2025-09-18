import React, { useEffect, useState } from 'react'
import API from '../../services/api'

export default function AdminDashboard(){
  const [pending, setPending] = useState([])

  useEffect(()=>{
    API.get('/admin/pending-courses')
      .then(res => setPending(res.data))
      .catch(err => console.error(err))
  },[])

  const approve = async (id)=>{
    try{
      await API.post(`/admin/approve-course/${id}`)
      setPending(prev => prev.filter(p => p._id !== id))
      alert('Approved')
    }catch(err){ alert('Failed') }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <h2 className="mt-4 font-semibold">Pending Courses</h2>
      <div className="mt-3 space-y-3">
        {pending.map(p => (
          <div className="bg-white p-3 rounded shadow flex justify-between" key={p._id}>
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm">By {p.teacher?.name} ({p.teacher?.email})</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>approve(p._id)} className="p-2 bg-green-600 text-white rounded">Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
