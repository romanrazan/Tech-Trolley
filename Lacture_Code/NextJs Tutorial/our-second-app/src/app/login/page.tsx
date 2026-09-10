"use client";
import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();

    const [formData, setFormData] = useState(
        {
            userId: "",
            pass: ""
        }
    )

    const [user, setUser] = useState({
        id: 0,
        email: "",
        role: ""
    })



    const [responseMsg, setResponseMsg] = useState("");

    const onChangeHandle = (e) => {
        const { name, value } = e.target;

        setFormData(
            {
                ...formData,
                [name]: value,
            }
        )
    }

    const onSubmitHandle = (e) => {

        e.preventDefault();

        const fetchData = async () => {
            try {
                const response = await axios.post("http://localhost:3000/auth/login", {
                    userId: formData.userId,
                    password: formData.pass,
                })

                setResponseMsg(response.data.access_token);
                localStorage.setItem("access_token", response.data.access_token);

                const { id, email, role } = jwtDecode(response.data.access_token);
                setUser(
                    {
                        id,
                        email,
                        role
                    }
                )

                if (role == "admin") {
                    router.push("../admin");
                }
                else if (role == "student") {
                    router.push("../student");
                }

            }

            catch (error) {
                setResponseMsg(error.response.data.message);

            }
        }

        fetchData();


    }
    return (<>
        <h1> Login Page</h1>
        <form onSubmit={onSubmitHandle}>
            <label>User ID:</label>
            <input type="text" name="userId" id="userId" onChange={onChangeHandle} value={formData.userId} /><br />

            <br />
            <label> Password:</label>
            <input type="password" name="pass" id="pass" onChange={onChangeHandle} value={formData.pass} />
            <br /><br />

            <input type="submit" value="submit" name="submit" />

            <br /><br />
            <span> Response:{responseMsg



            } </span>

            <div>
                User info:
                <span>
                    id: {user.id}
                </span>

                <span>
                    email: {user.email}
                </span>

                <span>
                    role: {user.role}
                </span>
            </div>

        </form>
    </>)
}