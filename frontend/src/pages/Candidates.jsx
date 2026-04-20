import { useEffect, useState } from "react";
import API from "../api/api";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    API.get("/candidates")
      .then(res => setCandidates(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Candidates</h1>
      {candidates.map(c => (
        <div key={c.candidate_id}>
          {c.first_name} {c.last_name} ({c.email})
        </div>
      ))}
    </div>
  );
}