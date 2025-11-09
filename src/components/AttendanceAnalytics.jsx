import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function AttendanceAnalytics({ logs, totalStudents = 10 }) {
  // Function to calculate total number of unique lectures (days) in the month
  const getTotalLecturesInMonth = (logs, month) => {
    const uniqueDates = new Set();
    logs.forEach((log) => {
      if (log.date_.startsWith(month)) {
        uniqueDates.add(log.date_);
      }
    });
    return uniqueDates.size; // Number of unique dates (lectures)
  };

  // Function to calculate the overall attendance percentage for the class
  const getMonthlyAttendancePercentage = (logs, month, totalLectures) => {
    let totalAttended = 0;
    let totalStudents = new Set();

    logs.forEach((log) => {
      if (log.date_.startsWith(month)) {
        totalStudents.add(log.student_name);
        if (log.time_in) {
          totalAttended++;
        }
      }
    });

    return Math.round((totalAttended / (totalStudents.size * totalLectures)) * 100);
  };

  // Using useMemo to optimize performance and calculate the data only when logs change
  const analytics = useMemo(() => {
    const grouped = {};
    const chartData = [];

    logs.forEach((log) => {
      const month = log.date_.slice(0, 7); // Extract the month (YYYY-MM)
      if (!grouped[month]) {
        grouped[month] = { days: new Set(), presentCount: 0 };
      }

      grouped[month].days.add(log.date_);
      if (log.time_in) {
        grouped[month].presentCount++;
      }
    });

    // Create chart data with total lectures and attendance percentage
    Object.entries(grouped).forEach(([month, v]) => {
      const totalLectures = getTotalLecturesInMonth(logs, month);
      const attendancePercentage = getMonthlyAttendancePercentage(logs, month, totalLectures);
      chartData.push({
        month,
        attendancePercentage,
        totalLectures,
      });
    });

    return { grouped, chartData };
  }, [logs]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-indigo-900">Monthly Analysis</h2>

      {/* Attendance Table */}
      <table className="min-w-full border text-base">
        <thead className="bg-gray-100 text-lg">
          <tr>
            <th className="p-3 border">Month</th>
            <th className="p-3 border">Total Days</th>
            <th className="p-3 border">Present</th>
            <th className="p-3 border">Absent</th>
            <th className="p-3 border">% Attendance</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(analytics.grouped).map(([month, v]) => {
            const totalPossible = totalStudents * v.days.size;
            const absent = totalPossible - v.presentCount;
            const percent = ((v.presentCount / totalPossible) * 100).toFixed(1);

            return (
              <tr key={month}>
                <td className="p-3 border">{month}</td>
                <td className="p-3 border">{v.days.size}</td>
                <td className="p-3 border text-green-600">{v.presentCount}</td>
                <td className="p-3 border text-red-600">{absent}</td>
                <td
                  className={`p-3 border font-semibold ${
                    percent < 75 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {percent}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Monthly Attendance Chart */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 text-indigo-900">
          Monthly Attendance Chart
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(month) => month.split("-").join("/")} />
            <YAxis />
            <Tooltip
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const { month, attendancePercentage, totalLectures } = payload[0].payload;
                  return (
                    <div className="bg-white p-2 rounded shadow">
                      <p><strong>Month:</strong> {month}</p>
                      <p><strong>Total Lectures Conducted:</strong> {totalLectures}</p>
                      <p><strong>Attendance Percentage:</strong> {attendancePercentage}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Single Bar for Attendance Percentage */}
            <Bar dataKey="attendancePercentage" fill="#6366f1" name="Attendance Percentage" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
