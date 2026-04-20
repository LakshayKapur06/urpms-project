import { useState } from "react";
import API from "../api/api";

export default function AddCandidate() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  });

  const handleSubmit = async () => {
    await API.post("/candidates", form);
    alert("Candidate added");
  };

  return (
    <div>
      <h2>Add Candidate</h2>

      <input placeholder="First Name"
        onChange={e => setForm({...form, first_name: e.target.value})} />

      <input placeholder="Last Name"
        onChange={e => setForm({...form, last_name: e.target.value})} />

      <input placeholder="Email"
        onChange={e => setForm({...form, email: e.target.value})} />

      <input placeholder="Phone"
        onChange={e => setForm({...form, phone: e.target.value})} />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}