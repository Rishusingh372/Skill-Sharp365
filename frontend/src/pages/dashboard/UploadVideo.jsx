import { useState } from "react";
import axios from "axios";

export default function UploadVideo({ courseId }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a video");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title || "Untitled Lecture");

    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/upload-video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("✅ Uploaded: " + res.data.videoUrl);
      setFile(null);
      setTitle("");
    } catch (err) {
      console.error(err);
      alert("❌ Upload failed");
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="p-4 border rounded bg-gray-50 shadow max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold mb-4">Upload Lecture Video</h2>

      <input
        type="text"
        placeholder="Lecture Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full p-2 mb-3 border"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Upload Video
      </button>
    </form>
  );
}
