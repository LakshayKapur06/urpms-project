import { useEffect, useState } from "react";
import API from "../api/api";

export default function Applications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    API.get("/applications")
      .then((res) => setApps(res.data))
      .catch(console.error);
  }, []);

  const updateStatus = (id, status) => {
    API.put(`/applications/${id}/status`, { new_status: status }).then(() =>
      alert("Updated"),
    );
  };

  const hireCandidate = (id) => {
    API.post(`/applications/${id}/hire`, {
      base_salary: 800000,
      bonus: 10,
    }).then(() => {
      alert("Candidate hired");
      window.location.reload();
    });
  };

  return (
    <div>
      <h1>Applications</h1>

      {apps.map((a) => (
        <div key={a.application_id}>
          App #{a.application_id} - {a.status}
          <button onClick={() => updateStatus(a.application_id, "SCREENING")}>
            Move to Screening
          </button>
          <button
            className="mt-2 ml-2 bg-green-500 text-white px-3 py-1 rounded"
            onClick={() => hireCandidate(a.application_id)}>
            Hire
          </button>
        </div>
      ))}
    </div>
  );
}
