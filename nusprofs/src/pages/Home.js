import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [allProfs, setAllProfs] = useState([]);
  const [displayedProfs, setDisplayedProfs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll, setErrorAll] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [facultiesData, setFacultiesData] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [filterError, setFilterError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFilterError(null);
    fetch("https://nusprofs-api.onrender.com/professors/faculties", {
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((raw) => {
        if (!Array.isArray(raw)) throw new Error("Invalid faculties data");
        const formatted = raw.map((f) => ({
          faculty_name: f.name,
          departments_list: Array.isArray(f.departments)
            ? f.departments.map((d) => d.name)
            : [],
        }));
        setFacultiesData(formatted);
      })
      .catch((err) => {
        console.error(err);
        setFilterError("Could not load filter options.");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    setErrorAll(null);

    (async () => {
      try {
        let page = 1;
        const all = [];
        while (true) {
          const res = await fetch(
            `https://nusprofs-api.onrender.com/professors/search?page=${page}`,
            { headers: { Accept: "application/json" } }
          );
          if (!res.ok) throw new Error(`Page ${page} failed`);
          const data = await res.json();
          all.push(...(data.results || []));
          if (!data.next) break;
          page++;
        }
        if (!cancelled) {
          setAllProfs(all);
          setDisplayedProfs(all);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorAll("Failed to load professors.");
        }
      } finally {
        if (!cancelled) setLoadingAll(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (loadingAll || errorAll) return;
    let filtered = allProfs;

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (selectedFaculties.length) {
      filtered = filtered.filter((p) => selectedFaculties.includes(p.faculty));
    }
    if (selectedDepts.length) {
      filtered = filtered.filter((p) => selectedDepts.includes(p.department));
    }

    setDisplayedProfs(filtered);
  }, [
    allProfs,
    loadingAll,
    errorAll,
    debouncedQuery,
    selectedFaculties,
    selectedDepts,
  ]);

  const toggleFaculty = (name) => {
    setSelectedFaculties((prev) => {
      const has = prev.includes(name);
      const next = has ? prev.filter((f) => f !== name) : [...prev, name];
      if (has) {
        const fac = facultiesData.find((f) => f.faculty_name === name);
        if (fac) {
          setSelectedDepts((d) =>
            d.filter((dep) => !fac.departments_list.includes(dep))
          );
        }
      }
      return next;
    });
  };
  const toggleDept = (name) => {
    setSelectedDepts((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0fcff",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Find and Review NUS Professors</h1>

      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "600px",
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowFilters((f) => !f)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "5px",
            border: "1px solid #0077cc",
            backgroundColor: showFilters ? "#0077cc" : "#fff",
            color: showFilters ? "#fff" : "#0077cc",
            cursor: "pointer",
          }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div style={{ maxWidth: "700px", margin: "0 auto 2rem" }}>
          {filterError && (
            <p style={{ color: "red", textAlign: "center" }}>{filterError}</p>
          )}
          {facultiesData.map((fac) => {
            const selFac = selectedFaculties.includes(fac.faculty_name);
            return (
              <div key={fac.faculty_name} style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={selFac}
                    onChange={() => toggleFaculty(fac.faculty_name)}
                  />
                  {fac.faculty_name}
                </label>
                {selFac && fac.departments_list.length > 0 && (
                  <div style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                    {fac.departments_list.map((d) => {
                      const selDept = selectedDepts.includes(d);
                      return (
                        <label
                          key={d}
                          style={{ display: "flex", gap: "0.5rem" }}
                        >
                          <input
                            type="checkbox"
                            checked={selDept}
                            onChange={() => toggleDept(d)}
                          />
                          {d}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loadingAll && (
        <p style={{ textAlign: "center" }}>Loading all professors…</p>
      )}
      {errorAll && (
        <p style={{ color: "red", textAlign: "center" }}>{errorAll}</p>
      )}

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {displayedProfs.length === 0 && !loadingAll && !errorAll && (
          <p style={{ textAlign: "center" }}>
            No professors found matching your criteria.
          </p>
        )}
        {displayedProfs.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {displayedProfs.map((p) => (
              <li
                key={p.prof_id}
                style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}
              >
                <h3 style={{ margin: 0 }}>
                  <Link
                    to={`/professor/${p.prof_id}`}
                    style={{ color: "#0077cc", textDecoration: "none" }}
                  >
                    {p.name}
                  </Link>
                </h3>
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  <strong>Faculty:</strong> {p.faculty}
                  <br />
                  <strong>Dept:</strong> {p.department || "—"}
                  <br />
                  <strong>Rating:</strong>{" "}
                  {p.average_rating
                    ? p.average_rating.toFixed(2)
                    : "No reviews yet"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
