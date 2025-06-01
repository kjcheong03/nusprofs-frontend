import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const [facultiesData, setFacultiesData] = useState([]);
  const [departmentsForSelectedFaculty, setDepartmentsForSelectedFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filterError, setFilterError] = useState(null);

  // Fetch faculties and departments
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setFilterError(null);
      try {
        const res = await fetch("https://nusprofs-api.onrender.com/faculties/", {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
        const rawData = await res.json();
        const formatted = Array.isArray(rawData)
          ? rawData.map((f) => ({
              faculty_name: f.name,
              departments_list: Array.isArray(f.departments) ? f.departments.map((d) => d.name) : []
            }))
          : [];
        setFacultiesData(formatted);
      } catch (e) {
        console.error("Error fetching filter options:", e);
        setFilterError("Could not load filter options. Please try again later.");
        setFacultiesData([]);
      }
    };
    fetchFilterOptions();
  }, []);

  // Update department dropdown when faculty changes
  useEffect(() => {
    if (selectedFaculty && facultiesData.length > 0) {
      const facObj = facultiesData.find((f) => f.faculty_name === selectedFaculty);
      setDepartmentsForSelectedFaculty(facObj ? facObj.departments_list : []);
    } else {
      setDepartmentsForSelectedFaculty([]);
    }
    setSelectedDepartment("");
  }, [selectedFaculty, facultiesData]);

  // Fetch professors from API
  const fetchProfessors = useCallback(async (currentQuery, currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      if (currentQuery.trim()) params.append("q", currentQuery.trim());
      if (selectedFaculty) params.append("faculty", selectedFaculty);
      if (selectedDepartment) params.append("department", selectedDepartment);

      const res = await fetch(`/search/?${params.toString()}`, {
        headers: { Accept: "application/json" }
      });
      if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
      const data = await res.json();

      setResults(Array.isArray(data.results) ? data.results : []);
      setHasNext(Boolean(data.next));
    } catch (e) {
      console.error("Fetch professors error:", e);
      setError(e.message);
      setResults([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [selectedFaculty, selectedDepartment]);

  // Fetch professors on query/filter/page change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfessors(query, page);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, page, selectedFaculty, selectedDepartment, fetchProfessors]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };
  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
    setPage(1);
  };
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setPage(1);
  };

  // Filter professor according to selected faculty/department (if backend doesn't filter)
  const filteredResults = results.filter((prof) => {
    const matchesFaculty = selectedFaculty ? prof.faculty === selectedFaculty : true;
    const matchesDept = selectedDepartment ? prof.department === selectedDepartment : true;
    return matchesFaculty && matchesDept;
  });

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0fcff",
      padding: "2rem",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ textAlign: "center" }}>Find and Review NUS Professors</h1>

      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by name"
          value={query}
          onChange={handleQueryChange}
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

      {filterError && <p style={{ color: "red", textAlign: "center" }}>{filterError}</p>}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        margin: "1rem 0",
        flexWrap: "wrap"
      }}>
        <select
          value={selectedFaculty}
          onChange={handleFacultyChange}
          style={{
            padding: "0.5rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
            minWidth: "150px"
          }}
        >
          <option value="">All Faculties</option>
          {facultiesData.map((f) => (
            <option key={f.faculty_name} value={f.faculty_name}>
              {f.faculty_name}
            </option>
          ))}
        </select>

        <select
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          disabled={!selectedFaculty || departmentsForSelectedFaculty.length === 0}
          style={{
            padding: "0.5rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
            minWidth: "150px"
          }}
        >
          <option value="">All Departments</option>
          {departmentsForSelectedFaculty.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div style={{ maxWidth: "700px", margin: "2rem auto 0 auto" }}>
        {loading && <p style={{ textAlign: "center" }}>Loading…</p>}
        {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

        {filteredResults.length > 0 ? (
          <>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredResults.map((prof) => (
                <li key={prof.prof_id} style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}>
                  <h3 style={{ margin: "0 0 0.25rem 0" }}>
                    <Link to={`/professor/${prof.prof_id}`} style={{ color: "#0077cc", textDecoration: "none" }}>
                      {prof.name}
                    </Link>
                  </h3>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    <strong>Faculty:</strong> {prof.faculty}<br />
                    <strong>Dept:</strong> {prof.department}<br />
                    <strong>Rating:</strong> {prof.average_rating}
                  </p>
                </li>
              ))}
            </ul>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "1.5rem 0"
            }}>
              <button onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page === 1 || loading}>← Prev</button>
              <span>Page {page}</span>
              <button onClick={() => hasNext && setPage((n) => n + 1)} disabled={!hasNext || loading}>Next →</button>
            </div>
          </>
        ) : (
          !loading &&
          (query.trim() || selectedFaculty || selectedDepartment) && (
            <p style={{ textAlign: "center" }}>No professors found for your criteria.</p>
          )
        )}
      </div>
    </div>
  );
}
