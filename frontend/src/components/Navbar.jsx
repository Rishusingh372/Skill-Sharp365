import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          MyLMS
        </Link>

        {/* Menu */}
        <ul className="hidden md:flex gap-6 font-medium text-gray-700">
          <li><Link to="/courses" className="hover:text-blue-600">Courses</Link></li>
          <li><Link to="/about" className="hover:text-blue-600">About</Link></li>
          <li><Link to="/contact" className="hover:text-blue-600">Contact</Link></li>
        </ul>

        {/* Auth buttons */}
        <div className="hidden md:flex gap-3">
          <Link to="/login" className="px-4 py-2 border rounded-md hover:bg-blue-50">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-700">☰</button>
      </div>
    </nav>
  );
}
