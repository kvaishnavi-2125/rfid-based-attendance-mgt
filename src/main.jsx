import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import LoginPage from "./components/LoginPage";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import AttendanceStatus from "./components/AttendanceStatus";
import MonthlyAnalysis from "./components/MonthlyAnalysis";
import TeacherLogin from "./components/TeacherLogin"; 
import "./index.css";

function Main() {
  const [student, setStudent] = useState(null); // Keep student state globally

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / Role selection */}
        <Route path="/" element={<App />} />

        {/* Student */}
        <Route path="/login" element={<LoginPage onLogin={setStudent} />} />
        <Route path="/dashboard" element={student && <StudentDashboard student={student} />} />

        {/* Teacher / Admin */}
        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />

        <Route path="/attendance-status" element={<AttendanceStatus />} />
        <Route path="/monthly-analysis" element={<MonthlyAnalysis />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
