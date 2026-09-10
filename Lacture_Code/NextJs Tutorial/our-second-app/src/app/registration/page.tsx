import { useState } from "react"
import { ChangeEvent } from "react"
import axios from "axios"
import { error } from "console";


export default function RegistrationForm() {

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    gender: "",
    skill: [],
    country: "",
    proPic: null
  })

  const [error, setError] = useState({
    nameError: "",
    ageError: "",
    emailError: "",
    genderError: "",
    skillError: "",
    countryError: "",
    proPicError: "",
  });


  const handleData = (e: any) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  }

  const handleGenderChange = (e: any) => {
    setFormData(
      {
        ...formData,
        gender: e.target.value,
      }
    )
  }

  const handleSkillChange = (e: any) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData(
        {
          ...formData,
          skill: [...formData.skill, value]
        }
      )

    }

    else {
      setFormData({
        ...formData,
        skill: formData.skill.filter((skill) => {
          return skill !== value;
        })
      })
    }

  }

  const handleFileChange = (e: any) => {
    setFormData({
      ...formData,
      proPic: e.target.files[0],
    }
    )
  }




  const validateFormInput = () => {

    if (!formData.name.trim()) {
      setError({
        ...error,
        nameError: "name cannot be empty"
      })
    }
    else if (formData.name.length < 4) {
      setError({
        ...error,
        nameError: "name must be 3 char long",
      })

    }

  }
  return (<>

    <form className="  ">
      <label>Name:</label>
      <div className="inline border-amber-50 border-2">
        <input type="text" name="name" id="name" />
      </div>

      <br>
      </br>

      <label>Age:</label>
      <input className="border-amber-50 border-2 " type="number" name="age" id="age" />
      <br>
      </br>

      <label>Email:</label>
      <input type="email" className="border-amber-50 border-2 " name="email" id="email" />
      <br>
      </br>

      <label>Gender:</label>
      <input type="radio" className="border-amber-50 border-2 " name="gender" id="maleRB" value="male" />male
      <input type="radio" className="border-amber-50 border-2 " name="gender" id="femaleRB" value="female" />female
      <br>
      </br>

      <label>Skills:</label>
      <input type="checkbox" name="skills[]" id="cricketCB" value="cricket" />Cricket
      <input type="checkbox" name="skills[]" id="football" value="football" />Football
      <br>
      </br>

      <label>Country:</label>
      <select>
        <option value="">select a country </option>
        <option value="USA"> USA</option>
        <option value="UK">UK</option>
        <option value="AUS">AUS </option>

      </select>
      <br>
      </br>

      <label>Profile Photo:</label>
      <input type="file" name="proPic" id="proPic" />
      <br>
      </br>

      <input className="w-14 h-7 bg-green-400 border-b-amber-50 mx-2" type="submit" name="submit" value="submit" />
      <input className="w-14 h-7 bg-red-400 border-b-amber-50 mx-2" type="reset" name="reset" value="reset" />







    </form>
  </>)
}
