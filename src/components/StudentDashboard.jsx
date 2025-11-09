import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import SelfieUpload from "./SelfieUpload";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selfieAllowed, setSelfieAllowed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);


  const navigate = useNavigate();

  // Fetch student info
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!studentData) return navigate("/login");

      setStudent(studentData);
      fetchTodayAttendance(studentData.rfid_uid);
      fetchMonthlyAttendance(studentData.rfid_uid);
    };

    fetchStudent();
  }, [navigate]);

  // Robust fetch for today's attendance
  const fetchTodayAttendance = async (rfid_uid) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("rfid_uid", rfid_uid)
        .eq("date_", today)
        .single();

      if (error) {
        console.error("Error fetching attendance:", error);
        setAttendanceToday(null);
        setSelfieAllowed(false);
        setCountdown(0);
        return;
      }

      const todayAttendance = data || null;
      setAttendanceToday(todayAttendance);

      if (!todayAttendance?.time_in) {
        if (selfieAllowed) setSelfieAllowed(false);
        setCountdown(0);
        return;
      }

      // Parse check-in time robustly
      let checkInTime;
      if (todayAttendance.time_in.includes("T")) {
        checkInTime = new Date(todayAttendance.time_in);
      } else {
        const [year, month, day] = todayAttendance.date_.split("-").map(Number);
        const [hours, minutes, seconds] = todayAttendance.time_in.split(":").map(Number);
        checkInTime = new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }

      const now = new Date();
      const diffSeconds = (now - checkInTime) / 1000;

      // Enable selfie for 10 minutes (600 seconds)
      if (diffSeconds >= 0 && diffSeconds <= 600) {
        if (!selfieAllowed) setSelfieAllowed(true);
        setCountdown(Math.ceil(600 - diffSeconds));
      } else {
        if (selfieAllowed) setSelfieAllowed(false);
        setCountdown(0);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTodayAttendance:", err);
      setAttendanceToday(null);
      setSelfieAllowed(false);
      setCountdown(0);
    }
  };

  // Polling every 5 seconds to check for new check-ins
  // 🧠 Pauses while selfie modal is open to prevent re-opening issues
  useEffect(() => {
    if (!student?.rfid_uid || showCameraModal) return;

    const interval = setInterval(() => {
      fetchTodayAttendance(student.rfid_uid);
    }, 5000);

    return () => clearInterval(interval);
  }, [student, showCameraModal]);

  // Countdown timer for selfie button
  useEffect(() => {
    if (!selfieAllowed) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelfieAllowed(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selfieAllowed]);

  // Fetch monthly attendance logs
  const fetchMonthlyAttendance = async (rfid_uid) => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("rfid_uid", rfid_uid)
      .gte("date_", firstDay)
      .lte("date_", lastDay);

    setMonthlyLogs(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const totalLectures = monthlyLogs.length;
  const attendedLectures = monthlyLogs.filter(log => log.time_in).length;
  const attendancePercentage = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {student?.name?.[0] || "S"}
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {student?.name || "Student"}
          </h2>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-lg rounded-xl p-4 text-center">
          <h4 className="font-semibold text-gray-600 mb-2">Today's Attendance</h4>
          <p className="text-lg font-bold">{attendanceToday?.time_in || "-"}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-4 text-center">
          <h4 className="font-semibold text-gray-600 mb-2">Lectures Attended</h4>
          <p className="text-lg font-bold">{attendedLectures}/{totalLectures}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-4 text-center">
          <h4 className="font-semibold text-gray-600 mb-2">Attendance %</h4>
          <div className="w-16 h-16 mx-auto">
            <CircularProgressbar
              value={attendancePercentage}
              text={`${attendancePercentage}%`}
              styles={buildStyles({
                pathColor: `rgba(62, 152, 199, ${attendancePercentage / 100})`,
                textColor: "#333",
                trailColor: "#e5e5e5",
              })}
            />
          </div>
        </div>
      </div>
      {/* Take Selfie Button */}
      <div className="text-center my-6">
        <button
          onClick={() => setShowCameraModal(true)}
          disabled={!selfieAllowed}
          className={`py-2 px-6 rounded-lg text-white font-semibold transition-colors
            ${selfieAllowed ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
        >
          Take Selfie {selfieAllowed && countdown > 0 && `(${formatTime(countdown)})`}
        </button>
        {!selfieAllowed && attendanceToday?.time_in && (
          <p className="text-sm text-gray-500 mt-2">
            Selfie available only for 10 minutes after check-in
          </p>
        )}
      </div>


      {/* Recent Attendance Logs */}
      <div className="bg-white shadow-lg rounded-xl p-4">
        <h3 className="text-xl font-semibold mb-4">Recent Attendance</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2">Date</th>
              <th className="border-b p-2">Time In</th>
              <th className="border-b p-2">Time Out</th>
              <th className="border-b p-2">Photo</th>
            </tr>
          </thead>
          <tbody>
            {monthlyLogs.slice(-5).reverse().map(log => (
              <tr key={log.id}>
                <td className="border-b p-2">{log.date_}</td>
                <td className="border-b p-2">{log.time_in || "-"}</td>
                <td className="border-b p-2">{log.time_out || "-"}</td>
                <td className="border-b p-2">
                  {log.photo_url ? (
                    <img
                      src={log.photo_url}
                      alt="selfie"
                      onClick={() => setSelectedImage(log.photo_url)}
                      className="w-12 h-12 rounded-full cursor-pointer hover:opacity-80 transition"
                    />
                  ) : (
                    "-"
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
          />
        </div>
      )}


      {/* Camera Modal */}
      {showCameraModal && student && (
        <SelfieUpload
          onClose={() => setShowCameraModal(false)}
          onUploadSuccess={url => {
            setAttendanceToday(prev => ({ ...prev, photo_url: url }));
            setShowCameraModal(false);
          }}
        />
      )}
    </div>
  );
}
