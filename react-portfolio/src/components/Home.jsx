import React from 'react'

export default function Home(){
  return (
    <section className="hero">
      <div className="hero-left">
        <h1>Hi, My name is <span className="namestyle">Md Arbaz Hasan.</span></h1>
        <p className="jobstyle">and I am a passionate <span className="jobname">Web Developer</span></p>
        <div className="hero-controls">
          <a className="download-resume" href="/assets/Resume.pdf" download>Resume</a>
          <a className="contact-cta" href="/contact.html">Contact</a>
        </div>
      </div>
      <div className="hero-right">
        <div className="orb">
          <img src="/Image.png" alt="Illustration" />
        </div>
      </div>
    </section>
  )
}
