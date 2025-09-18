import React from "react";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div>
      <Hero />

      {/* Featured Courses */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Popular Courses</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 shadow-md rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0"
              alt="Course"
              className="rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold">Full-Stack Development</h3>
            <p className="text-gray-600 text-sm mt-2">
              Learn MERN stack with real projects.
            </p>
          </div>
          <div className="bg-white p-6 shadow-md rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
              alt="Course"
              className="rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold">
              Data Structures & Algorithms
            </h3>
            <p className="text-gray-600 text-sm mt-2">
              Master DSA for coding interviews.
            </p>
          </div>
          <div className="bg-white p-6 shadow-md rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1556157382-97eda2b7c299"
              alt="Course"
              className="rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold">Machine Learning Basics</h3>
            <p className="text-gray-600 text-sm mt-2">
              Get started with AI and ML models.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
