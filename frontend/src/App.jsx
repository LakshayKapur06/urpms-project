import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Applications from "./pages/Applications";
import AddCandidate from "./components/AddCandidate";

export default function App() {
  return (
    <div>
      <h1>URPMS</h1>

      <Dashboard />
      <AddCandidate />
      <Candidates />
      <Applications />
    </div>
  );
}