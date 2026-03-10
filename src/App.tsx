import { useEffect, useState } from "react";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0MXqkG6kzxZRwsMQtWgSjvvFVGp1rhx7yDu8YxvauoXyarbiIEBCzcM69JcEEiJEoGxTtyXQ8RvRf/pub?gid=0&single=true&output=csv";

type Row = {
  DayOfWeek: string;
  Day: string;
  Start: string;
  End: string;
  Person: string;
};

export default function App() {
  const [data, setData] = useState<Row[]>([]);
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [current, setCurrent] = useState<Row | null>(null);

  const parseTime = (time: string) => {
    if (!time) return 0;

    const clean = time.toUpperCase().replace("AM", "").replace("PM", "").trim();
    const parts = clean.split(":");

    let hours = Number(parts[0]);
    const minutes = Number(parts[1] || 0);

    if (time.toUpperCase().includes("PM") && hours !== 12) hours += 12;
    if (time.toUpperCase().includes("AM") && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const loadSchedule = async () => {
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    const rows = text.trim().split("\n").map((r) => r.split(","));

    const headers = rows[0].map((h) => h.trim().toLowerCase());

    const dowIndex = headers.findIndex(
      (h) => h === "day of week" || h === "weekday"
    );
    const dayIndex = headers.findIndex((h) => h === "day" || h === "date");
    const startIndex = headers.findIndex((h) => h === "start");
    const endIndex = headers.findIndex((h) => h === "end");
    const personIndex = headers.findIndex(
      (h) => h === "person" || h === "doctor"
    );

    const parsed: Row[] = rows.slice(1).map((r) => ({
      DayOfWeek: r[dowIndex] || "",
      Day: r[dayIndex] || "",
      Start: r[startIndex] || "",
      End: r[endIndex] || "",
      Person: r[personIndex] || "",
    }));

    setData(parsed);

    const now = new Date();
    const today = now.toLocaleDateString("en-US", { weekday: "long" });
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const working = parsed.find((r) => {
      if (r.DayOfWeek.toLowerCase() !== today.toLowerCase()) return false;

      const start = parseTime(r.Start);
      const end = parseTime(r.End);

      return minutesNow >= start && minutesNow <= end;
    });

    setCurrent(working || null);
  };

  useEffect(() => {
    loadSchedule();
    const interval = setInterval(loadSchedule, 60000);
    return () => clearInterval(interval);
  }, []);

  const doctors = [
    "All",
    ...Array.from(new Set(data.map((r) => r.Person).filter(Boolean))),
  ];

  const filtered =
    doctorFilter === "All"
      ? data
      : data.filter((r) => r.Person === doctorFilter);

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>USARAD Schedule</h1>
      <p>Auto updates every minute</p>

      {current && (
        <div
          style={{
            padding: 15,
            background: "#e8f4ff",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <strong>Working Now:</strong> {current.Person}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>Doctor:</label>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
        >
          {doctors.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <button
          onClick={loadSchedule}
          style={{ marginLeft: 15, padding: "6px 12px" }}
        >
          Refresh
        </button>
      </div>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Day of Week</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Doctor</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td>{r.DayOfWeek}</td>
              <td>{r.Day}</td>
              <td>{r.Start}</td>
              <td>{r.End}</td>
              <td>{r.Person}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
