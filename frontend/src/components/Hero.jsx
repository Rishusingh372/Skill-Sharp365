import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-20">
      <div className="container mx-auto px-6 grid md:grid-cols-2 items-center gap-12">
        {/* Text */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
            Learn from the <span className="text-blue-600">Best Mentors</span>
          </h1>
          <p className="mt-4 text-gray-600 text-lg">
            Build your career with high-quality courses, live sessions, and expert guidance.
          </p>
          <div className="mt-6 flex gap-4">
            <Link to="/courses" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Explore Courses
            </Link>
            <Link to="/register" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
              Join Now
            </Link>
          </div>
        </div>

        {/* Image */}
        <div>
          <img
            src="https://www.bing.com/th/id/OIP.RxSZ5B3LyTKQQQXOOPTbmQHaFW?w=243&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3"
            alt="Students learning"
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
