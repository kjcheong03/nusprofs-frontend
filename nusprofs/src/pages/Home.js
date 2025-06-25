import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const PAGE_SIZE = 20;
const API_BASE  = "https://nusprofs-api.onrender.com";

export default function Home() {
  const [profs,     setProfs]     = useState([]);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const [query,           setQuery]          = useState("");
  const [debouncedQuery,  setDebouncedQuery] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(handle);
  }, [query]);

  const [facultiesData,     setFacultiesData]     = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedDepts,     setSelectedDepts]     = useState([]);
  const [filterError,       setFilterError]       = useState(null);
  const [showFilters,       setShowFilters]       = useState(false);

  useEffect(() => {
    setFilterError(null);
    fetch(`${API_BASE}/professors/faculties`, {
      headers: { Accept: "application/json" }
    })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(raw => {
        if (!Array.isArray(raw)) throw new Error("Invalid faculties data");
        setFacultiesData(
          raw.map(f => ({
            faculty_id:  f.faculty_id,
            name:        f.name,
            departments: Array.isArray(f.departments)
              ? f.departments.map(d => ({
                  dept_id: d.dept_id,
                  name:    d.name
                }))
              : []
          }))
        );
      })
      .catch(err => {
        console.error(err);
        setFilterError("Could not load filter options.");
      });
  }, []);

  const toggleFaculty = (fid) => {
  setSelectedFaculties(prev => {
    const isOn = prev.includes(fid);
    const nextFacs = isOn
      ? prev.filter(x => x !== fid)
      : [...prev, fid];

    if (isOn) {
      setSelectedDepts(depts => {
        const fac = facultiesData.find(f => f.faculty_id === fid);
        if (!fac) return depts;
        const deptIds = fac.departments.map(d => d.dept_id);
        return depts.filter(id => !deptIds.includes(id));
      });
    }

    return nextFacs;
  });
};


  const toggleDept = (did) => {
    setSelectedDepts(prev =>
      prev.includes(did)
        ? prev.filter(x => x !== did)
        : [...prev, did]
    );
  };

  const fetchPage = useCallback(
    async (pageToLoad, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }
        if (selectedFaculties.length) {
          const deptFilterIds = selectedFaculties.flatMap(fid => {
            const fac = facultiesData.find(f => f.faculty_id === fid);
            
            if (!fac) return [];
            const allDeptIds = fac.departments.map(d => d.dept_id);
            const selInFac  = selectedDepts.filter(id => allDeptIds.includes(id));
            return selInFac.length ? selInFac : allDeptIds;
          });
          if (deptFilterIds.length) {
            params.set("departments", deptFilterIds.join(","));
          }
        }

        params.set("page",      pageToLoad);
        params.set("page_size", PAGE_SIZE);

        const url = `${API_BASE}/professors/search?${params.toString()}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        setProfs(prev =>
          replace ? data.results : [...prev, ...data.results]
        );
        setHasMore(Boolean(data.next));
      } catch (err) {
        console.error(err);
        setError("Failed to load professors.");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, selectedFaculties, selectedDepts, facultiesData]
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

  function StarDisplay({ value }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (value >= i)           stars.push(<FaStar key={i} />);
      else if (value >= i - .5) stars.push(<FaStarHalfAlt key={i} />);
      else                       stars.push(<FaRegStar key={i} />);
    }
    return <span style={{ color: "#ffb400", fontSize: "1rem" }}>{stars}</span>;
  }

  return (
    <div style={{
      minHeight:       "100vh",
      backgroundColor: "#f0fcff",
      padding:         "2rem",
      fontFamily:      "Arial, sans-serif"
    }}>
      <h1 style={{ textAlign: "center" }}>Find and Review NUS Professors</h1>

      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by name"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width:         "80%",
            maxWidth:      "600px",
            padding:       "0.5rem 1rem",
            borderRadius:  "999px",
            border:        "1px solid #ccc",
            fontSize:      "1rem"
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            padding:         "0.5rem 1rem",
            borderRadius:    "5px",
            border:          "1px solid #0077cc",
            backgroundColor: showFilters ? "#0077cc" : "#fff",
            color:           showFilters ? "#fff" : "#0077cc",
            cursor:          "pointer"
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
            const isFac = selectedFaculties.includes(fac.faculty_id);
            return (
              <div key={fac.faculty_id} style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={isFac}
                    onChange={() => toggleFaculty(fac.faculty_id)}
                  />
                  {fac.name}
                </label>
                {isFac && fac.departments.length > 0 && (
                  <div style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                    {fac.departments.map(dep => {
                      const isD = selectedDepts.includes(dep.dept_id);
                      return (
                        <label
                          key={dep.dept_id}
                          style={{ display: "flex", gap: "0.5rem" }}
                        >
                          <input
                            type="checkbox"
                            checked={isD}
                            onChange={() => toggleDept(dep.dept_id)}
                          />
                          {dep.name}
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
        {!error && profs.length === 0 && !loading && (
          <p style={{ textAlign: "center" }}>
            No professors found matching your criteria.
          </p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {profs.map(p => (
            <li key={p.prof_id} style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}>
              <h3 style={{ margin: 0 }}>
                <Link to={`/professor/${p.prof_id}`} style={{ color: "#0077cc", textDecoration: "none" }}>
                  {p.name}
                </Link>
              </h3>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Faculty:</strong> {p.faculty}<br/>
                <strong>Dept:</strong> {p.department || "—"}<br/>
                <strong>Rating:</strong>{" "}
                {p.average_rating > 0 ? (
                  <>
                    <StarDisplay value={p.average_rating} />{" "}
                    <span style={{ marginLeft: "0.5rem", fontWeight: "bold", verticalAlign: "middle" }}>
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
        {hasMore && (
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <button
              onClick={handleShowMore}
              disabled={loading}
              style={{
                padding:         "0.5rem 1rem",
                borderRadius:    "5px",
                border:          "1px solid #0077cc",
                backgroundColor: "#0077cc",
                color:           "#fff",
                cursor:          loading ? "default" : "pointer"
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
