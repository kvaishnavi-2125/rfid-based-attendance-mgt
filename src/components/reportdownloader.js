import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



import * as XLSX from "xlsx";

export function downloadExcel(filename, data) {
  const ws = XLSX.utils.json_to_sheet(data);

  // Bold headers
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // header row
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true },
      alignment: { horizontal: "center" },
    };
  }

  // Optional: column widths
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(12, key.length + 2),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, filename);
}

export function downloadMonthlyReport(studentsMonthly, selectedMonth) {
  if (!studentsMonthly.length) {
    alert("No monthly data to export!");
    return;
  }

  const columns = ["Name", "Present", "Total", "Percentage"];
  const data = studentsMonthly.map((s) => ({
    Name: s.name,
    Present: s.present,
    Total: s.total,
    Percentage: `${s.percentage}%`,
  }));

  const title = `Monthly Attendance Report - ${selectedMonth}`;
  const filename = `Monthly_Report_${selectedMonth}.pdf`;

  downloadPDF(filename, columns, data, title);
}

export function downloadDefaulters(studentsMonthly) {
  const defaulters = studentsMonthly.filter((s) => s.percentage < 75);
  if (!defaulters.length) {
    alert("No defaulters found!");
    return;
  }

  const columns = ["Name", "Attendance %"];
  const data = defaulters.map((s) => ({
    Name: s.name,
    "Attendance %": `${s.percentage}%`,
  }));

  const title = "Defaulter List (Below 75%)";
  const filename = `Defaulters_${new Date().toISOString().slice(0, 7)}.pdf`;

  downloadPDF(filename, columns, data, title);
}



export function downloadPDF(filename, columns, data, title = "", summary = {}) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);

  // Add summary visually
  if (summary) {
    const { present, absent, notCheckedOut } = summary;
    doc.setFontSize(12);
    let yPos = 30;

    doc.text("Summary:", 14, yPos);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 128, 0); // green
    doc.text(`Present: ${present}`, 20, yPos);

    doc.setTextColor(255, 0, 0); // red
    doc.text(`Absent: ${absent}`, 70, yPos);

    doc.setTextColor(255, 165, 0); // orange
    doc.text(`Not Checked Out: ${notCheckedOut}`, 140, yPos);

    doc.setTextColor(0, 0, 0); // reset
  }

  // Add table with Sr. No.
  autoTable(doc, {
    startY: 45,
    head: [["Sr. No.", ...columns]],
    body: data.map((row, index) => [index + 1, ...columns.map((col) => row[col])]),
    styles: { font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
  });

  doc.save(filename);
}

// Updated downloadAttendance
export function downloadAttendance(logs = [], students = [], type = "excel", dateOrMonth = null) {
  if (!Array.isArray(students) || students.length === 0) {
    return alert("No student data available");
  }

  const logMap = {};
  logs.forEach((l) => {
    if (!dateOrMonth || l.date_.startsWith(dateOrMonth)) {
      logMap[l.student_name] = l;
    }
  });

  let presentCount = 0;
  let absentCount = 0;
  let notCheckedOutCount = 0;

  const data = students.map((s) => {
    const log = logMap[s.name];
    let status = "Absent";
    if (log?.time_in) {
      if (log?.time_out) {
        status = "Present";
        presentCount++;
      } else {
        status = "Not Checked Out";
        notCheckedOutCount++;
      }
    } else {
      absentCount++;
    }

    return {
      "Student Name": s.name,
      "RFID": s.rfid_uid,
      "Time In": log?.time_in || "-",
      "Time Out": log?.time_out || "-",
      "Status": status,
    };
  });

  const summaryObj = {
    present: presentCount,
    absent: absentCount,
    notCheckedOut: notCheckedOutCount,
  };

  const columns = ["Student Name", "RFID", "Time In", "Time Out", "Status"];
  const fileSuffix = dateOrMonth || new Date().toISOString().slice(0, 10);

  if (type === "excel") {
    const excelData = data.map((row, idx) => ({ "Sr. No.": idx + 1, ...row }));
    excelData.push({
      "Sr. No.": "",
      "Student Name": "Summary",
      RFID: "",
      "Time In": "",
      "Time Out": "",
      Status: `Present: ${presentCount}, Absent: ${absentCount}, Not Checked Out: ${notCheckedOutCount}`,
    });
    downloadExcel(`Attendance_${fileSuffix}.xlsx`, excelData);
  } else {
    downloadPDF(
      `Attendance_${fileSuffix}.pdf`,
      columns,
      data,
      `Attendance Report: ${dateOrMonth || "Today"}`,
      summaryObj
    );
  }
}
