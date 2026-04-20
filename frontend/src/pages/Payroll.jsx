import { useEffect, useState } from "react";
import API from "../api/api";

export default function Payroll() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    API.get("/payments") // you may need to add this API
      .then(res => setPayments(res.data));
  }, []);

  const completePayment = (id) => {
    API.put(`/payroll/payment/${id}`, { status: "COMPLETED" })
      .then(() => window.location.reload());
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Payments</h2>

      {payments.map(p => (
        <div key={p.payroll_id} className="bg-white p-4 rounded shadow mb-3">
          <p>Payroll #{p.payroll_id}</p>
          <p>Status: {p.payment_status}</p>

          {p.payment_status === "PENDING" && (
            <button
              className="bg-green-500 text-white px-3 py-1 mt-2 rounded"
              onClick={() => completePayment(p.payroll_id)}
            >
              Mark Completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}