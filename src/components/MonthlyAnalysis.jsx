import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
//import { downloadMonthlyReport, downloadDefaulters } from "./ReportDownloader";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function MonthlyAnalysis() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // default: current month
  const [studentsMonthly, setStudentsMonthly] = useState([]);
  const [summary, setSummary] = useState({ defaulters: 0, midRange: 0, excellent: 0 });

  useEffect(() => {
    fetchAttendanceLogs();
  }, []);

  useEffect(() => {
    if (logs.length) computeMonthlyStats();
  }, [logs, selectedMonth]);

  async function fetchAttendanceLogs() {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .order("date_", { ascending: true });
    if (error) console.error(error);
    else setLogs(data);
  }

  function computeMonthlyStats() {
    const logsForMonth = logs.filter((l) => l.date_.startsWith(selectedMonth));

    const studentMap = {};
    logsForMonth.forEach((l) => {
      if (!studentMap[l.student_name]) studentMap[l.student_name] = { total: 0, present: 0 };
      studentMap[l.student_name].total++;
      if (l.time_in) studentMap[l.student_name].present++;
    });

    const studentsArr = Object.entries(studentMap).map(([name, val]) => ({
      name,
      present: val.present,
      total: val.total,
      percentage: Math.round((val.present / val.total) * 100),
    }));

    setStudentsMonthly(studentsArr);

    const defaulters = studentsArr.filter((s) => s.percentage < 75).length;
    const midRange = studentsArr.filter((s) => s.percentage >= 75 && s.percentage <= 90).length;
    const excellent = studentsArr.filter((s) => s.percentage > 90).length;

    setSummary({ defaulters, midRange, excellent });
  }

  const monthLabel = new Date(selectedMonth + "-01").toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const pieData = [
    { name: "<75%", value: summary.defaulters, color: "#f87171" },
    { name: "75-90%", value: summary.midRange, color: "#facc15" },
    { name: "91-100%", value: summary.excellent, color: "#34d399" },
  ];

  return (
    <div className="p-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
      >
        &larr; Back
      </button>

      <h2 className="text-2xl font-semibold mb-6 text-indigo-900">Monthly Attendance Analysis</h2>

      {/* Month selector + download buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            onClick={() => downloadMonthlyReport(studentsMonthly, selectedMonth)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Download Monthly PDF
          </button>
          <button
            onClick={() => downloadDefaulters(studentsMonthly)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Defaulter List
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="bg-red-100 text-red-800 px-6 py-6 rounded-lg shadow w-40 text-center">
          <div className="text-2xl font-bold">{summary.defaulters}</div>
          <div className="mt-1">Below 75%</div>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-6 py-6 rounded-lg shadow w-40 text-center">
          <div className="text-2xl font-bold">{summary.midRange}</div>
          <div className="mt-1">75-90%</div>
        </div>
        <div className="bg-green-100 text-green-800 px-6 py-6 rounded-lg shadow w-40 text-center">
          <div className="text-2xl font-bold">{summary.excellent}</div>
          <div className="mt-1">91-100%</div>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow w-full md:w-1/2">
        <h3 className="text-lg font-semibold mb-4">Attendance Distribution - {monthLabel}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              fill="#8884d8"
              label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
