import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900">
          A Cloud-Integrated IoT-RFID Based Attendance System
        </h1>
        <p className="text-lg text-gray-600">
          Featuring Real-Time Web Monitoring, Selfie Verfication and Analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-6">
        {/* Student Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 flex flex-col items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
            alt="Student Icon"
            className="w-24 h-24 mb-6"
          />
          <h2 className="text-2xl font-semibold mb-4">Student Login</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Access your attendance dashboard, check daily logs, and capture your photo for attendance.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Login as Student
          </button>
        </div>

        {/* Teacher Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 flex flex-col items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077012.png"
            alt="Teacher Icon"
            className="w-24 h-24 mb-6"
          />
          <h2 className="text-2xl font-semibold mb-4">Teacher Login</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            View daily attendance reports, analyze monthly stats, and manage defaulter lists.
          </p>
          <button
            onClick={() => navigate("/teacher")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Login as Teacher
          </button>
        </div>
      </div>

      <footer className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} Made with ❤️ by Vaishnavi and Akshata
      </footer>
    </div>
  );
}
