import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
/* Auth Pages */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/public/Home.jsx"
import Navbar from "../src/components/layout/Navbar.jsx";

function App() {
  return (
    <Router>
             <Navbar/>
      <Routes>

        {/* Public */}
 
        <Route path="/" element={<Home />} />
      

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />

      </Routes>
    </Router>
  );
}

export default App;