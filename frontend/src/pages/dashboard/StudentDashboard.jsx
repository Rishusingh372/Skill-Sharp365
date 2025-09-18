import React, { useEffect, useState, useContext } from 'react'
import API from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'

export default function StudentDashboard(){
  const { user } = useContext(AuthContext)
  const [courses, setCourses] = useState([])

  useEffect(()=>{
    API.get('/courses')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
  },[])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="mb-4">Enrolled courses and recommendations</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map(c=> (
          <div key={c._id} className="bg-white p-4 rounded shadow">
            <img src={c.thumbnail} alt="thumb" className="h-40 w-full object-cover mb-2" />
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm">By {c.teacher?.name}</p>
            <a className="mt-2 inline-block text-blue-600" href={`/courses/${c.slug}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  )
}
