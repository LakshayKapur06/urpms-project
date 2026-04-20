import { useEffect, useState } from "react";
import API from "../api/api";

export default function Applications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    API.get("/applications")
      .then(res => setApps(res.data))
      .catch(console.error);
  }, []);

  const updateStatus = (id, status) => {
    API.put(`/applications/${id}/status`, { new_status: status })
      .then(() => alert("Updated"));
  };

  return (
    <div>
      <h1>Applications</h1>

      {apps.map(a => (
        <div key={a.application_id}>
          App #{a.application_id} - {a.status}

          <button onClick={() => updateStatus(a.application_id, "SCREENING")}>
            Move to Screening
          </button>
        </div>
      ))}
    </div>
  );
}