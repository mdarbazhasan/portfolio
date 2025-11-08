import React from 'react'
import Nav from './components/Nav'
import Home from './components/Home'

export default function App(){
  return (
    <div className="app-root">
      <Nav />
      <main>
        <Home />
      </main>
    </div>
  )
}
