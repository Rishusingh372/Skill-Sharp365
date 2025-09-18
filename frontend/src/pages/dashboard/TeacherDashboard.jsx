import React, { useState, useEffect, useContext } from 'react'
import API from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'

export default function TeacherDashboard(){
  const { user } = useContext(AuthContext)
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({ title:'', description:'', category:'', price:0, thumbnail:'' })

  useEffect(()=>{
    API.get('/courses')
      .then(res => setCourses(res.data.filter(c=>c.teacher && c.teacher._id === user?.id)))
      .catch(err => console.error(err))
  },[user])

  const createCourse = async () => {
    try {
      const res = await API.post('/courses', form)
      alert('Course created — waiting admin approval')
      setCourses(prev => [res.data, ...prev])
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      <div className="my-4 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Create Course</h2>
        <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title" className="w-full p-2 mb-2 border" />
        <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Description" className="w-full p-2 mb-2 border" />
        <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} placeholder="Category" className="w-full p-2 mb-2 border" />
        <input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder="Price" type="number" className="w-full p-2 mb-2 border" />
        <input value={form.thumbnail} onChange={e=>setForm({...form, thumbnail:e.target.value})} placeholder="Thumbnail URL" className="w-full p-2 mb-2 border" />
        <button onClick={createCourse} className="bg-blue-600 text-white p-2 rounded">Create</button>
      </div>

      <h2 className="font-semibold mt-6">Your Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        {courses.map(c => (
          <div key={c._id} className="bg-white p-3 rounded shadow">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm">Approved: {c.approved ? 'Yes' : 'No'}</p>
            <a className="text-blue-600" href={`/courses/${c.slug}`}>Open</a>
          </div>
        ))}
      </div>
    </div>
  )
}
