import axios from 'axios';
interface ParamProp {
    params: Promise<{
        id: number;
    }>
}

interface TODO {
    userId: number,
    id: number,
    title: string,
    completed: boolean
}

export default async function TodoSpecificPage({ params }: ParamProp) {
    const { id } = await params;
    const response = await axios.get(`https://jsonplaceholder.typicode.com/todos/${id}`
    );
    const todo: TODO = response.data;
    return (
        <>
            {
                (todo && <div>
                    <p>user id: {todo.userId}</p>
                    <p>title: {todo.title}</p>
                    <p>{(todo.completed) ? "completed" : "not completed"}</p>

                </div>)
            }
        </>
    );
}