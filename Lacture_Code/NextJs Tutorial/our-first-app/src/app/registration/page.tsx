

export default function Form() {
    return (
        <form>
            <label> Name</label>
            <input type="text" id="name" name="name" defaultValue={""} /><br /><br />
            <label> Email</label>
            <input type="email" id="email" name="email" defaultValue={""} /><br /><br />
            <label> age</label>
            <input type="number" id="age" name="age" defaultValue={""} /><br /><br />
            <label> gender</label>
            <input type="radio" id="maleRB" name="gender" value="male" defaultChecked />male
            <input type="radio" id="femaleRB" name="gender" value="female" />female<br /><br />

            <label> Choose a Country</label>
            <select>
                <option> Select a Country</option>
                <option>USA</option>
                <option> BD</option>
                <option>UK</option>
            </select>
            <br /><br />
        </form>
    );
}