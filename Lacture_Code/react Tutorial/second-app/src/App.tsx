import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import CustomComponents from './components/customComponents'
import UserDetails from './userDetails'


type Cat = {
  id: number,
  name: string
}

type Student = {
  id: string,
  name: string,
  cgpa: number
}
function App() {
  const isAdmin: boolean = true;

  const cats: Cat[] = [
    {
      id: 1,
      name: "Mr. Meow"
    },

    {
      id: 2,
      name: "Mr. Tom"
    }
  ]

  const students: Student[] = [
    {
      id: "233-99309",
      name: "Student 1",
      cgpa: 4.00
    },
    {
      id: "233-99308",
      name: "Student 2",
      cgpa: 2.00
    }
  ]

  const [count, setCount] = useState<number>(0);

  const [name, setName] = useState<string>("Tom")

  const [student, setStudent] = useState<Student>(
    {
      id: "1",
      name: "Mr. Jerry",
      cgpa: 2.50
    }
  )

  useEffect(() => {
    console.log(" mounted")
  })


  return (
    <>
      {
        isAdmin ? (<p> Welcome admin</p>) : (<p> Welcome User</p>)
      }

      {
        (isAdmin && <button>Delete User</button>)
      }



      <CustomComponents />


      {
        cats.map((cat) => { return <p key={cat.id}> {cat.name}</p> })
      }

      {
        students.map((student) => <div key={student.id}><p>{student.name}</p><p>{student.cgpa}</p><span>{(student.cgpa > 3.95) ? (<p>Briliant</p>) : (<p>trash</p>)}</span></div>)
      }

      <button onClick={() => { setCount(count + 1) }}>{count}</button>
      <span>{name}</span>

      <button onClick={() => setName("meow")}>click to change name</button>
      <div onMouseOver={() => {
        setStudent(
          {
            ...student,
            cgpa: 3.00
          }
        )
      }
      }>
        <p>{student.id}</p>
        <p>{student.name}</p>
        <p>{student.cgpa}</p>
      </div>

      <button onClick={() => {
        setStudent(
          {
            ...student,
            cgpa: 3.00
          }
        )
      }}>click to change Student</button>

      <UserDetails></UserDetails>
    </>
  )
}

export default App
