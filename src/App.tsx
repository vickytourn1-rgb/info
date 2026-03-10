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
  const [loading, setLoading] = useState(false);

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
    try {
      setLoading(true);
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

  const filtered =
    doctorFilter === "All"
      ? data
      : data.filter((r) => r.Person === doctorFilter);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 40px",
        fontFamily: "Arial, sans-serif",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1600px", margin: "0 auto" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: "clamp(42px, 6vw, 82px)",
            marginBottom: 12,
          }}
        >
          USARAD Schedule
        </h1>
        <p style={{ textAlign: "center", fontSize: 18, marginBottom: 20 }}>
          Auto updates every minute
        </p>

        {current && (
          <div
            style={{
              padding: 18,
              background: "#e8f4ff",
              borderRadius: 12,
              marginBottom: 24,
              textAlign: "center",
              fontSize: 20,
            }}
          >
            <strong>Working Now:</strong> {current.Person}
          </div>
        )}

        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: 18, fontWeight: 700 }}>Doctor:</label>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              fontSize: 18,
              borderRadius: 8,
              minWidth: 220,
            }}
          >
            {doctors.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={loadSchedule}
            style={{
              padding: "10px 18px",
              fontSize: 18,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            border={1}
            cellPadding={14}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              tableLayout: "auto",
              background: "white",
            }}
          >
            <thead>
              <tr style={{ background: "#f4f6fb" }}>
                <th style={{ fontSize: 18 }}>Day of Week</th>
                <th style={{ fontSize: 18 }}>Date</th>
                <th style={{ fontSize: 18 }}>Start</th>
                <th style={{ fontSize: 18 }}>End</th>
                <th style={{ fontSize: 18 }}>Doctor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isCurrent =
                  current &&
                  r.DayOfWeek === current.DayOfWeek &&
                  r.Day === current.Day &&
                  r.Start === current.Start &&
                  r.End === current.End &&
                  r.Person === current.Person;

                return (
                  <tr
                    key={i}
                    style={{
                      background: isCurrent ? "#dcfce7" : "white",
                    }}
                  >
                    <td style={{ fontSize: 18 }}>{r.DayOfWeek}</td>
                    <td style={{ fontSize: 18 }}>{r.Day}</td>
                    <td style={{ fontSize: 18 }}>{r.Start}</td>
                    <td style={{ fontSize: 18 }}>{r.End}</td>
                    <td style={{ fontSize: 18 }}>{r.Person}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
