
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { supabase } from "../supabaseClient";

export default function SelfieUpload({ onClose, onUploadSuccess }) {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  // Fetch student info & location on mount
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) console.error("Error fetching student:", error);
      if (data) setStudent(data);
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLocation(coords);
          console.log("📍 Coordinates:", coords);

          // Reverse geocode via OpenStreetMap Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
            );
            const data = await response.json();
            if (data?.display_name) {
              setAddress(data.display_name);
              console.log("🏙️ Address:", data.display_name);
            }
          } catch (err) {
            console.error("Error reverse geocoding:", err);
          }
        },
        (err) => {
          console.warn("⚠️ Location permission denied:", err);
        },
        { enableHighAccuracy: true }
      );
    };

    fetchStudent();
    getLocation();
  }, []);

  // Capture image + burn text
  const capture = async () => {
    const image = webcamRef.current.getScreenshot();
    if (!image) return;

    // Draw image + location text on canvas
    const burnedImage = await drawTextOnImage(image);
    setImageSrc(burnedImage);
  };

  // Helper: draw text (address + time) onto image
  const drawTextOnImage = async (base64Img) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Img;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original selfie
        ctx.drawImage(img, 0, 0);

        // Prepare overlay text
        const dateStr = new Date().toLocaleString();
        const addressText = address
          ? address.split(",").slice(0, 3).join(", ")
          : "Unknown location";

        ctx.font = `${Math.floor(canvas.height * 0.03)}px Arial`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

        ctx.fillStyle = "#fff";
        ctx.textBaseline = "bottom";
        ctx.fillText(`📍 ${addressText}`, 20, canvas.height - 30);
        ctx.fillText(`🕒 ${dateStr}`, 20, canvas.height - 5);

        resolve(canvas.toDataURL("image/jpeg"));
      };
    });
  };

  // Upload to Supabase + update attendance
  const captureAndUpload = async () => {
    if (!imageSrc) return alert("Please capture a selfie first!");
    if (!student?.rfid_uid) return alert("Student info not loaded yet!");
    setLoading(true);

    try {
      const blob = await (await fetch(imageSrc)).blob();
      const fileName = `${student.rfid_uid}_${Date.now()}.jpg`;
      const filePath = `selfies/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attendance-photos")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase
        .storage
        .from("attendance-photos")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      const today = new Date().toISOString().split("T")[0];

      const { data: logs, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("id")
        .eq("rfid_uid", student.rfid_uid)
        .eq("date_", today);

      if (fetchError) throw fetchError;
      if (!logs || logs.length === 0) {
        alert("⚠️ No matching attendance record found for today!");
        setLoading(false);
        return;
      }

      const recordId = logs[0].id;

      // Update record with photo + coordinates + address
      const { data: updated, error: updateError } = await supabase
        .from("attendance_logs")
        .update({
          photo_url: publicUrl,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          address: address || null,
        })
        .eq("id", recordId)
        .select("*");

      if (updateError) throw updateError;

      if (updated?.length > 0) {
        alert("Selfie uploaded successfully!!..");
      }

      if (onUploadSuccess) onUploadSuccess(publicUrl);
      onClose();
    } catch (err) {
      console.error("Error uploading selfie:", err);
      alert("Failed to upload selfie. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-800">Take a Selfie</h2>

        {!imageSrc ? (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full rounded-lg"
          />
        ) : (
          <img src={imageSrc} alt="Captured" className="w-full rounded-lg" />
        )}

        {location && (
          <p className="text-sm text-gray-600">
            Latitude: {location.latitude.toFixed(5)} | Longitude:{" "}
            {location.longitude.toFixed(5)}
          </p>
        )}

        {address && (
          <p className="text-sm text-gray-700 font-medium">
            📍 {address}
          </p>
        )}

        <div className="flex justify-center gap-4 mt-4">
          {!imageSrc ? (
            <button
              onClick={capture}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Capture
            </button>
          ) : (
            <button
              onClick={() => setImageSrc(null)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Retake
            </button>
          )}

          <button
            onClick={captureAndUpload}
            disabled={loading}
            className={`${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            } text-white px-4 py-2 rounded`}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
