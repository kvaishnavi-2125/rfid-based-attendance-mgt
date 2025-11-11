import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { downloadAttendance } from "./reportdownloader";

export default function AttendanceStatus() {
  const navigate = useNavigate();

  // ✅ States
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedImage, setSelectedImage] = useState(null);

  // ✅ Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Fetch logs when date changes
  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate]);

  // ✅ Real-time Supabase listener + polling
  useEffect(() => {
    // 🧠 Real-time updates filtered by selected date
    const channel = supabase
      .channel("attendance_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        (payload) => {
          if (payload.new.date_ === selectedDate) {
            setLogs((prevLogs) => {
              const otherLogs = prevLogs.filter(
                (l) =>
                  l.rfid_uid !== payload.new.rfid_uid ||
                  l.date_ !== payload.new.date_
              );
              return [payload.new, ...otherLogs];
            });
          }
        }
      )
      .subscribe();

    // 🕒 Polling every 10 seconds (date-aware)
    const interval = setInterval(() => {
      fetchLogs(selectedDate);
    }, 10000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedDate]); // ✅ re-registers listener & poller when date changes

  // ✅ Fetch students
  async function fetchStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("name");
    if (error) console.error("Error fetching students:", error);
    else setStudents(data || []);
  }

  // ✅ Fetch attendance logs for the selected date
  async function fetchLogs(date) {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("date_", date);

    if (error) console.error("Error fetching logs:", error);
    else setLogs(data || []);
  }

  // ✅ Build log map (only for selected date)
  const filteredLogs = logs.filter((l) => l.date_ === selectedDate);
  const logMap = filteredLogs.reduce((map, log) => {
    map[log.student_name] = log;
    return map;
  }, {});

  const totalPresent = students.filter((s) => logMap[s.name]?.time_in).length;
  const totalAbsent = students.length - totalPresent;

  // ✅ Status display
  const getStatus = (log) => {
    if (!log?.time_in)
      return (
        <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 font-semibold text-sm">
          Absent
        </span>
      );
    if (log.time_in && !log.time_out)
      return (
        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-600 font-semibold text-sm">
          Check-out remaining
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-sm">
        Present
      </span>
    );
  };

  return (
    <>
      <div className="p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow"
        >
          &larr; Back
        </button>

        <h2 className="text-2xl font-bold mb-4 text-indigo-900">
          Students Attendance
        </h2>

        {/* Controls & Summary */}
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          {/* Left: Date + downloads */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              onClick={() =>
                downloadAttendance(logs, students, "excel", selectedDate)
              }
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Download Excel
            </button>
            <button
              onClick={() =>
                downloadAttendance(logs, students, "pdf", selectedDate)
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Download PDF
            </button>
          </div>

          {/* Right: Summary */}
          <div className="flex gap-4">
            <div className="w-36 bg-green-100 text-green-800 font-semibold px-4 py-3 rounded-xl shadow flex items-center justify-between">
              <span className="text-lg">Present</span>
              <span className="text-2xl">{totalPresent}</span>
            </div>
            <div className="w-36 bg-red-100 text-red-800 font-semibold px-4 py-3 rounded-xl shadow flex items-center justify-between">
              <span className="text-lg">Absent</span>
              <span className="text-2xl">{totalAbsent}</span>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  RFID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-indigo-900">
                  Photo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, idx) => {
                const log = logMap[student.name];

                return (
                  <tr
                    key={student.rfid_uid}
                    className="hover:bg-gray-50 transition duration-200 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {student.rfid_uid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log?.time_in || "----"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log?.time_out || "----"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatus(log)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log?.photo_url ? (
                        <img
                          src={log.photo_url}
                          alt={`${student.name} selfie`}
                          className="w-12 h-12 rounded-full object-cover border border-gray-300 cursor-pointer hover:opacity-80 transition"
                          onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/50x50?text=Error")
                          }
                          onClick={() => setSelectedImage(log.photo_url)}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/50x50?text=No+Photo"
                          alt="No selfie"
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <img
              src={selectedImage}
              alt="Full size selfie"
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white text-gray-700 rounded-full p-2 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
