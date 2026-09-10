
import { notFound } from "next/navigation";
import Error from '../error';

interface ParamProp {

    params: Promise<{ id: string }>;
    searchParams: Promise<{ name: string | undefined }>;
}

export default async function User({ params, searchParams }: ParamProp) {

    const { id } = await params;
    const { name } = await searchParams;

    if (id == 10) {
        notFound();
    }


    return (

        <>
            <div className="bg-blue-300 w-100 h-50 m-20 text-black font-bold font-sans">
                <p className="border-2">User Details of Id: {id}</p>
                <p> Name of user is {name}</p>

            </div>


        </>

    );
} 