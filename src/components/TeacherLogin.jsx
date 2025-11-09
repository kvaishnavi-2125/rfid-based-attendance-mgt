import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError("");

    // Hardcoded credentials
    if (username === "pccoe" && password === "root@123") {
      setTimeout(() => {
        setLoading(false);
        navigate("/teacher-dashboard");
      }, 500);
    } else {
      setTimeout(() => {
        setLoading(false);
        setError("Invalid username or password");
      }, 500);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-96 max-w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Teacher Login</h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
