import React from 'react'

export default function Nav(){
  return (
    <nav className="site-nav">
      <a className="brand" href="/">Arbaz's Portfolio</a>
      <ul className="nav-list">
        <li><a href="/">Home</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/skills.html">Skills</a></li>
        <li><a href="/projects.html">Projects</a></li>
        <li><a href="/contact.html">Contact</a></li>
      </ul>
    </nav>
  )
}
