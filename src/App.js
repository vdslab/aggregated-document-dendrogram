import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./pages/root";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
      </Routes>
    </BrowserRouter>
  );
}
