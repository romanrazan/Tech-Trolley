import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Header from './components/header'
import Footer from './components/footer'
import SimpleComponent from './components/simpleComponent'
import StudentCard from './components/studentCard'

function App() {


  return (
    <>
      <Header></Header>
      <SimpleComponent />
      <StudentCard student={{
        id: "23-888990-2",
        name: "Mr. meow",
        cgpa: 3.99,
        currentStudent: true
      }} />

      <StudentCard student={{
        id: "21-989898-2",
        name: "Mr. ToM",
        cgpa: 2.49,
        currentStudent: false
      }} />

      <Footer></Footer>
    </>
  )
}

export default App
