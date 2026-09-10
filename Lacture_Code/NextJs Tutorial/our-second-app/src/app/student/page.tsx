"use client";
import { useState } from "react";
import axios from "axios";

export default function StudentHome() {


    const [err, setErr] = useState("");

    const [posts, setPosts] = useState([]);

    const handleClick = async () => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.get("http://localhost:3000/posts/getAllPosts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            setPosts(response.data);

        }
        catch (error) {
            if (error.response.data.message) {
                setErr(error.response.data.message);
            }
        }

    }

    return (
        <>
            <h1>Welcome Student</h1>
            <button onClick={handleClick}>get All Post</button>
            <div>All Post
                {
                    posts.map((post) => (
                        <div key={post.postId}>
                            <p> post id: {post.postId}</p>
                            <p>content: {post.content}</p>
                            <p>posttype: {post.postType}</p>
                        </div>
                    ))
                }
            </div>
            <div>error: {err}</div>
        </>
    )
}