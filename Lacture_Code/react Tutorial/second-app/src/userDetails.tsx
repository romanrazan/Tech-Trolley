import { useState, useEffect } from "react";
import axios from "axios";

interface User {
    id: number,
    name: string,
    username: string
}
export default function UserDetails() {

    const [users, setUsers] = useState<user[]>([])

    useEffect(() => {
        const getUser = async () => {
            const response = await axios.get<User[]>("https://jsonplaceholder.typicode.com/users");
            setUsers(response.data)
        }

        getUser();
    }, [])
    return (
        <>
            <h1> User Details</h1>

            {
                users.map((user) => (
                    <div key={user.id} className="bg-amber-50">
                        <p>{user.name}</p>
                        <p>{user.username}  </p>
                    </div>
                ))
            }
        </>
    )
}