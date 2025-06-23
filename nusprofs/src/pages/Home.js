import React, {
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { Link } from "react-router-dom";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar
} from "react-icons/fa";

const PAGE_SIZE = 20;
const API_BASE = "https://nusprofs-api.onrender.com";

export default function Home() {
  const [profs, setProfs]         = useState([]);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const [query, setQuery]         = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [facultiesData, setFacultiesData]     = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedDepts, setSelectedDepts]     = useState([]);
  const [filterError, setFilterError]         = useState(null);
  const [showFilters, setShowFilters]         = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(handle);
  }, [query]);

  const fetchPage = useCallback(
    async (pageToLoad, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        params.set("page", pageToLoad);
        params.set("page_size", PAGE_SIZE);

        const res = await fetch(
          `${API_BASE}/professors/search?${params.toString()}`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        setProfs(prev =>
          replace ? data.results : [...prev, ...data.results]
        );
        setHasMore(Boolean(data.next));
      } catch (e) {
        console.error(e);
        setError("Failed to load professors.");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery]
  );

  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  const handleShowMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  useEffect(() => {
    setFilterError(null);
    fetch(`${API_BASE}/professors/faculties`, {
      headers: { Accept: "application/json" }
    })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(raw => {
        if (!Array.isArray(raw)) throw new Error("Invalid faculties data");
        setFacultiesData(
          raw.map(f => ({
            faculty_name: f.name,
            departments_list: Array.isArray(f.departments)
              ? f.departments.map(d => d.name)
              : []
          }))
        );
      })
      .catch(err => {
        console.error(err);
        setFilterError("Could not load filter options.");
      });
  }, []);

  const toggleFaculty = name => {
    setSelectedFaculties(prev => {
      const has = prev.includes(name);
      const next = has ? prev.filter(f => f !== name) : [...prev, name];
      if (has) {
        const fac = facultiesData.find(f => f.faculty_name === name);
        if (fac) {
          setSelectedDepts(d =>
            d.filter(dep => !fac.departments_list.includes(dep))
          );
        }
      }
      return next;
    });
  };

  const toggleDept = name => {
    setSelectedDepts(prev =>
      prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]
    );
  };

  const displayedProfs = useMemo(() => {
    return profs.filter(p => {
      if (
        selectedFaculties.length &&
        !selectedFaculties.includes(p.faculty)
      ) {
        return false;
      }
      if (
        selectedDepts.length &&
        !selectedDepts.includes(p.department)
      ) {
        return false;
      }
      return true;
    });
  }, [profs, selectedFaculties, selectedDepts]);

  function StarDisplay({ value }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (value >= i) stars.push(<FaStar key={i} />);
      else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
      else stars.push(<FaRegStar key={i} />);
    }
    return (
      <span style={{ color: "#ffb400", fontSize: "1rem" }}>
        {stars}
      </span>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0fcff",
      padding: "2rem",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ textAlign: "center" }}>
        Find and Review NUS Professors
      </h1>

      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by name"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "600px",
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "5px",
            border: "1px solid #0077cc",
            backgroundColor: showFilters ? "#0077cc" : "#fff",
            color: showFilters ? "#fff" : "#0077cc",
            cursor: "pointer"
          }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div style={{ maxWidth: "700px", margin: "0 auto 2rem" }}>
          {filterError && (
            <p style={{ color: "red", textAlign: "center" }}>
              {filterError}
            </p>
          )}
          {facultiesData.map(fac => {
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
                    {fac.departments_list.map(d => {
                      const selDept = selectedDepts.includes(d);
                      return (
                        <label key={d} style={{ display: "flex", gap: "0.5rem" }}>
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

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        {!error && displayedProfs.length === 0 && !loading && (
          <p style={{ textAlign: "center" }}>
            No professors found matching your criteria.
          </p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {displayedProfs.map(p => (
            <li key={p.prof_id} style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}>
              <h3 style={{ margin: 0 }}>
                <Link
                  to={`/professor/${p.prof_id}`}
                  style={{ color: "#0077cc", textDecoration: "none" }}
                >
                  {p.name}
                </Link>
              </h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Faculty:</strong> {p.faculty}<br/>
                <strong>Dept:</strong> {p.department||"—"}<br/>
                <strong>Rating:</strong>{" "}
                {p.average_rating > 0 ? (
                  <>
                    <StarDisplay value={p.average_rating} />{" "}
                    <span style={{
                      marginLeft: "0.5rem",
                      fontWeight: "bold",
                      verticalAlign: "middle"
                    }}>
                      {p.average_rating.toFixed(2)}
                    </span>
                  </>
                ) : (
                  "No reviews yet"
                )}
              </p>
            </li>
          ))}
        </ul>

        {hasMore && !error && (
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <button
              onClick={handleShowMore}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "5px",
                border: "1px solid #0077cc",
                backgroundColor: "#0077cc",
                color: "#fff",
                cursor: loading ? "default" : "pointer"
              }}
            >
              {loading ? "Loading…" : "Show More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
