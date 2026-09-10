


function CustomComponents() {
    const isStudent: boolean = true;
    return (
        <>
            {
                isStudent ? (<p>you are a student</p>) : (<p> you are an outsider</p>)
            }
        </>
    );
}

export default CustomComponents;