import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaChevronRight } from "react-icons/fa";
import logo from "../../assets/icons/logo.png";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "News", href: "#news" },
    { name: "Pricing", href: "#pricing" },
    { name: "Courses", href: "#courses" },
    { name: "Faculty", href: "#faculty" },
    { name: "Blogs", href: "#blogs" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  // Disable body scroll when menu open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isOpen]);

  const handleScroll = (e, id) => {
    e.preventDefault();

    const element = document.querySelector(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
      });
    }

    setIsOpen(false);
  };

  return (
    <>
      <nav className="bg-dark-400/90 backdrop-blur-md border-b border-white/5 fixed w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

          {/* LEFT */}
          <div className="flex items-center gap-4">

            {/* Hamburger */}
            <button
              className="lg:hidden text-white text-2xl"
              onClick={toggleMenu}
            >
              <FaBars />
            </button>

            {/* Logo */}
            <Link to="/">
              <img
                src={logo}
                alt="logo"
                className="w-14 object-contain"
              />
            </Link>

          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex gap-6 text-gray-400 text-[12px] font-bold uppercase tracking-widest">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="hover:text-brand-primary transition"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-5">
            <Link
              to="/login"
              className="text-gray-400 hover:text-white text-sm font-semibold"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-brand-primary text-dark-400 px-5 py-2 rounded-xl text-sm font-bold"
            >
              Get Started
            </Link>
          </div>

        </div>
      </nav>

      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-full bg-dark-400 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">

          <img
            src={logo}
            alt="logo"
            className="w-12 object-contain"
          />

          <button
            className="text-white text-xl"
            onClick={toggleMenu}
          >
            <FaTimes />
          </button>

        </div>

        {/* Links */}
        <div className="flex flex-col flex-1">

          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="flex justify-between items-center px-6 py-5 border-b border-white/10 text-white font-semibold hover:bg-dark-300 transition"
            >
              {link.name}

              <FaChevronRight className="text-gray-500 text-sm" />
            </a>
          ))}

        </div>

        {/* Bottom Button */}
        <div className="p-6 border-t border-white/10">

          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="block w-full text-center bg-brand-primary py-3 rounded-lg font-semibold"
          >
            Login / Register
          </Link>

        </div>

      </div>
    </>
  );
};

export default Navbar;