import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const API_BASE  = "https://nusprofs-api.onrender.com";
const PAGE_SIZE = 20;

export default function TopProfessors() {
  const [profs,   setProfs]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchPage = useCallback(
    async (pageToLoad, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ n: PAGE_SIZE, page: pageToLoad });
        const res = await fetch(
          `${API_BASE}/professors/top?${params.toString()}`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.results;
        setProfs(prev => replace ? items : [...prev, ...items]);
        setHasMore(Boolean(data.next));
      } catch (err) {
        console.error(err);
        setError("Failed to load top professors.");
      } finally {
        setLoading(false);
      }
    },
    []
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
      if      (value >= i)       stars.push(<FaStar key={i} />);
      else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
      else                       stars.push(<FaRegStar key={i} />);
    }
    return <span style={{ color: "#ffb400", fontSize: "1rem" }}>{stars}</span>;
  }

  return (
    <div style={{
      minHeight:       "100vh",
      backgroundColor: "#f0fcff",
      padding:         "2rem",
      fontFamily:      "Arial, sans-serif",
      color:           "#000"         
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Top Rated Professors
      </h1>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {error && (
          <p style={{ textAlign: "center" }}>{error}</p>
        )}

        {!loading && !error && profs.length === 0 && (
          <p style={{ textAlign: "center" }}>No professors to display.</p>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {profs.map((p, idx) => (
            <li
              key={p.prof_id}
              style={{
                padding:      "1rem 0",
                borderBottom: "1px solid #eee"
              }}
            >
              <h3 style={{ margin: 0, fontStyle: "normal" }}>
                <span style={{
                  marginRight: "0.5rem",
                  fontWeight:  "bold"
                }}>
                  {idx + 1}.
                </span>
                <Link
                  to={`/professor/${p.prof_id}`}
                  style={{
                    color:          "#0077cc",
                    textDecoration: "none"
                  }}
                >
                  {p.name}
                </Link>
              </h3>

              <p style={{
                margin:   "0.25rem 0",
                fontSize: "0.9rem"
              }}>
                <strong>Title:</strong> {p.title || "—"}<br/>
                <strong>Faculty:</strong> {p.faculty || "—"}<br/>
                <strong>Dept:</strong>    {p.department || "—"}<br/>
                <strong>Rating:</strong>{" "}
                {p.average_rating != null
                  ? <>
                      <StarDisplay value={p.average_rating}/>
                      <span style={{
                        marginLeft:    "0.5rem",
                        fontWeight:    "bold",
                        verticalAlign: "middle"
                      }}>
                        {p.average_rating.toFixed(2)}
                      </span>
                    </>
                  : "No reviews yet"
                }
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
