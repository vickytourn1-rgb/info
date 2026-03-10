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
  const [current, setCurrent] = useState<Row | null>(null);
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const parseTime = (time: string) => {
    if (!time) return 0;

    const clean = time.trim().toUpperCase();
    const isPM = clean.includes("PM");
    const isAM = clean.includes("AM");

    const timeOnly = clean.replace("AM", "").replace("PM", "").trim();
    const parts = timeOnly.split(":");
    let hours = Number(parts[0] || 0);
    const minutes = Number(parts[1] || 0);

    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);

      const res = await fetch(SHEET_URL);
      const text = await res.text();

      const rows = text
        .trim()
        .split("
")
        .map((r) => r.split(","));

      const headers = rows[0].map((h) => h.trim().toLowerCase());

      const dayOfWeekIndex = headers.findIndex(
        (h) => h === "day of week" || h === "dayofweek" || h === "weekday"
      );
      const dayIndex = headers.findIndex((h) => h === "day" || h === "date");
      const startIndex = headers.findIndex((h) => h === "start");
      const endIndex = headers.findIndex((h) => h === "end");
      const personIndex = headers.findIndex(
        (h) => h === "person" || h === "doctor" || h === "name"
      );

      const parsed: Row[] = rows.slice(1).map((r) => ({
        DayOfWeek: r[dayOfWeekIndex]?.trim() || "",
        Day: r[dayIndex]?.trim() || "",
        Start: r[startIndex]?.trim() || "",
        End: r[endIndex]?.trim() || "",
        Person: r[personIndex]?.trim() || "",
      }));

      setData(parsed);

      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });
      const minutesNow = now.getHours() * 60 + now.getMinutes();

      const working = parsed.find((r) => {
        const compareDay = (r.DayOfWeek || r.Day).toLowerCase();
        if (compareDay !== today.toLowerCase()) return false;

        const start = parseTime(r.Start);
        const end = parseTime(r.End);

        return minutesNow >= start && minutesNow <= end;
      });

      setCurrent(working || null);
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoading(false);
    }
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

  const filteredData =
    doctorFilter === "All"
      ? data
      : data.filter((r) => r.Person === doctorFilter);

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>USARAD Schedule</h1>
      <p>Auto-updates every minute</p>

      {current && (
        <div
          style={{
            padding: 16,
            background: "#e8f4ff",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <strong>Working Now:</strong> {current.Person}
        </div>
      )}

      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontWeight: "bold" }}>Doctor Filter:</label>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 6 }}
        >
          {doctors.map((doctor) => (
            <option key={doctor} value={doctor}>
              {doctor}
            </option>
          ))}
        </select>

        <button
          onClick={loadSchedule}
          style={{ padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <table
        border={1}
        cellPadding={10}
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Day of Week</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Person</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((r, i) => (
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

