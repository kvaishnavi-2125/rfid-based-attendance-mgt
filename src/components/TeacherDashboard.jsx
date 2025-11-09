import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 text-gray-900 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Teacher Dashboard</h1>
        <p className="text-lg text-gray-600">
          Manage attendance and analyze monthly reports.
        </p>
      </div>

      {/* Grid for Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

        {/* Check Student Attendance Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center transition hover:shadow-xl">
          <img
            src="https://img.icons8.com/ios/452/checked.png"
            alt="Check Student Attendance"
            className="w-20 h-20 mb-6"
          />
          <h2 className="text-xl font-semibold mb-3 text-center">Check Student Attendance</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            View and manage student attendance records in real-time.
          </p>
          <button
            onClick={() => navigate("/attendance-status")}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            View Attendance
          </button>
        </div>

        {/* Check Monthly Analysis Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center transition hover:shadow-xl">
          <img
            src="https://img.icons8.com/ios/452/bar-chart-filled.png"
            alt="Check Monthly Analysis"
            className="w-20 h-20 mb-6"
          />
          <h2 className="text-xl font-semibold mb-3 text-center">Check Monthly Analysis</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Analyze monthly attendance trends and reports.
          </p>
          <button
            onClick={() => navigate("/monthly-analysis")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            View Analysis
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-10 w-full max-w-4xl flex justify-center">
        <button
          onClick={() => navigate("/")}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
