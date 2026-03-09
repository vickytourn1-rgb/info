import { useEffect, useState } from "react";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0MXqkG6kzxZRwsMQtWgSjvvFVGp1rhx7yDu8YxvauoXyarbiIEBCzcM69JcEEiJEoGxTtyXQ8RvRf/pub?gid=0&single=true&output=csv";

type Row = Record<string, string>;

function parseCSV(text: string): Row[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

export default function App() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(SHEET_URL);
      const text = await response.text();
      const rows = parseCSV(text);

      setData(rows);
    } catch (err) {
      setError("Could not load schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();

    const interval = setInterval(() => {
      loadSchedule();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>Schedule App</h1>
      <p>Updates every 1 minute</p>

      <button onClick={loadSchedule} style={{ marginBottom: "20px", padding: "10px 16px" }}>
        {loading ? "Loading..." : "Refresh Now"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr>
              {data[0] &&
                Object.keys(data[0]).map((header) => (
                  <th
                    key={header}
                    style={{
                      border: "1px solid #ccc",
                      padding: "10px",
                      background: "#f3f4f6",
                      textAlign: "left",
                    }}
                  >
                    {header}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((value, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      border: "1px solid #ccc",
                      padding: "10px",
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
