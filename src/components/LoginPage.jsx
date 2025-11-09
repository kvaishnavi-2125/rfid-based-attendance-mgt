import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required!");
      return;
    }

    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", authData.user.id)
      .single();

    if (studentError || !student) {
      setError("No student record found for this account.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(student);
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-96 max-w-full overflow-hidden">
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-md transition duration-300"
          title="Back to Home"
        >
          ←
        </button>

        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Student Login</h1>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="border border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition placeholder-gray-400"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-lg transition duration-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Error message */}
        {error && <p className="text-red-600 mt-4 text-center font-medium">{error}</p>}

        <p className="text-gray-500 text-sm mt-6 text-center">
          © {new Date().getFullYear()} Smart Attendance System
        </p>
      </div>
    </div>
  );
}
