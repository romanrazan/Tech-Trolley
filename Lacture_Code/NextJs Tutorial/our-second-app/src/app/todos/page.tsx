"use client"
import { useState, useEffect } from "react";
import axios from "axios";

interface TODO {
    userId: number,
    id: number,
    title: string,
    completed: boolean
}

export default function UsersPage() {

    const [todos, setTodos] = useState<TODO>([]);
    useEffect(() => {

        const getTodos = async () => {
            try {
                const response = await axios.get("https://jsonplaceholder.typicode.com/todos");
                setTodos(response.data);
            }
            catch {

            }

        }

        getTodos();
    }, []);
    return (
        <>
            {/* <h1>Users List</h1>
            <button onClick={() => {
                alert("moew");
            }}>click me</button>
            {console.log("meow")} */}

            <h1>Todo's list</h1>
            {
                (todos &&
                    todos.map((todo: TODO) => (<div key={todo.id} className="bg-mauve-500 border-2 border-white">
                        <p>user id:{todo.userId}</p>
                        <p>Title:{todo.title}</p>
                        <p>{(todo.completed) ? "completed" : "not completed"}</p>
                    </div>))
                )
            }


        </>
    );
}