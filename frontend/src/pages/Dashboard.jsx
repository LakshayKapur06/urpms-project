import { useEffect, useState } from "react";
import API from "../api/api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/dashboard/metrics")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>Candidates by Stage</h2>
      {data.candidatesByStage.map((item, i) => (
        <div key={i}>
          {item.status}: {item.count}
        </div>
      ))}

      <h2>Conversion Rate</h2>
      <p>{data.conversionRate.conversion_rate}%</p>

      <h2>Employees per Department</h2>
      {data.employeesPerDept.map((item, i) => (
        <div key={i}>
          {item.department}: {item.total}
        </div>
      ))}
    </div>
  );
}