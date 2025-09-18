import React, { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import API from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'

export default function CourseView(){
  const { slug } = useParams()
  const { user } = useContext(AuthContext)
  const [course, setCourse] = useState(null)

  useEffect(()=>{
    API.get(`/courses/${slug}`)
      .then(res => setCourse(res.data))
      .catch(err => console.error(err))
  },[slug])

  const enroll = async ()=>{
    try{
      await API.post(`/courses/${course._id}/enroll`)
      alert('Enrolled')
    }catch(err){ alert(err.response?.data?.message || 'Error') }
  }

  if (!course) return <div>Loading...</div>

  return (
    <div className="p-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <img src={course.thumbnail} alt="thumb" className="w-full h-64 object-cover rounded" />
          <h1 className="text-2xl font-bold mt-3">{course.title}</h1>
          <p className="mt-2">{course.description}</p>

          <h2 className="font-semibold mt-4">Lectures</h2>
          <ul className="mt-2 space-y-2">
            {course.lectures.map((lec, i) => (
              <li key={i} className="bg-white p-3 rounded shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{lec.title}</div>
                    <div className="text-sm">Duration: {lec.duration || '—'}</div>
                  </div>
                  <a className="text-blue-600" href={lec.videoUrl} target="_blank">Open</a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Teacher: {course.teacher?.name}</p>
          <p>Price: ₹{course.price}</p>
          {!user || user.role === 'teacher' ? null : (
            <button onClick={enroll} className="mt-4 w-full p-2 bg-blue-600 text-white rounded">Enroll</button>
          )}
        </div>
      </div>
    </div>
  )
}
