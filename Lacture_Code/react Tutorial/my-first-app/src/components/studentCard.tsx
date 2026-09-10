
import "./../App.css"

type Student =
    {
        id: string,
        name: string,
        cgpa: number,
        currentStudent: boolean
    }
function StudentCard(props: { student: Student }) {
    return (
        <div className="studentCard">
            <p> Name: {props.student.name}</p>
            <p> Id:{props.student.id} </p>
            <p>Cgpa:{props.student.cgpa}</p>
            <p>current Student:{props.student.currentStudent ? "yes" : "no"}</p>
        </div>
    )
}

export default StudentCard;