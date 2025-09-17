import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">
          <Link to="/">LMS</Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 font-medium text-gray-700">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/courses" className="hover:text-blue-600">Courses</Link>
          <Link to="/technologies" className="hover:text-blue-600">Technologies</Link>
          <Link to="/contact" className="hover:text-blue-600">Contact</Link>
          <Link to="/login" className="hover:text-blue-600">Login</Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="flex flex-col space-y-4 p-6 font-medium text-gray-700">
            <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/courses" onClick={() => setIsOpen(false)}>Courses</Link>
            <Link to="/technologies" onClick={() => setIsOpen(false)}>Technologies</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)}>Contact</Link>
            <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
