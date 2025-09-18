import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function CourseView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourse(res.data);
        if (res.data.content.length > 0) {
          setCurrentVideo(res.data.content[0]); // play first lecture
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (!course) return <div className="p-6">Loading course...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{course.title}</h2>
        <ul className="space-y-2">
          {course.content.map((item, index) => (
            <li
              key={index}
              className={`p-2 cursor-pointer rounded ${
                currentVideo?._id === item._id ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => setCurrentVideo(item)}
            >
              🎬 {item.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex flex-col bg-black text-white">
        {currentVideo ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <video
              key={currentVideo.url}
              src={currentVideo.url}
              controls
              className="w-full h-full"
            />
            <h3 className="text-lg font-semibold p-4">{currentVideo.title}</h3>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p>No video selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
