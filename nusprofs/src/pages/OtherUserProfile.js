import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "../services/auth";
import buildHeaders from "../components/buildHeaders";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar
} from "react-icons/fa";

function StarDisplay({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <span style={{ color: "#ffb400", fontSize: "1rem", verticalAlign: "middle" }}>
      {stars}
    </span>
  );
}

export default function OtherUserProfile() {
  const { username } = useParams();

  const [reviews, setReviews] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (url, replace = false) => {
    setLoading(true);
    setError("");
    try {
      const headers = await buildHeaders(true);
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(res.statusText);
      const { results, next } = await res.json();

      const withNames = await Promise.all(
        results.map(async (r) => {
          const profRes = await fetch(
            `${API_URL}/professors/${r.prof_id}`,
            { headers: { Accept: "application/json" } }
          );
          if (!profRes.ok) throw new Error("Failed to fetch professor");
          const profData = await profRes.json();
          return { ...r, prof_name: profData.name };
        })
      );

      setReviews(prev => replace ? withNames : prev.concat(withNames));
      setNextUrl(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReviews([]);
    const initialUrl = `${API_URL}/reviews/users/${encodeURIComponent(username)}`;
    loadPage(initialUrl, true);
  }, [username, loadPage]);

  if (loading && reviews.length === 0) {
    return <p>Loading {username}’s reviews…</p>;
  }
  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  const profLinkStyle = {
    color: "#0077cc",
    textDecoration: "none",
    fontWeight: "bold",
  };

  return (
    <div style={{ padding: "2rem", background: "#f0fcff", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <Link to="/" style={profLinkStyle}>← Back to search</Link>
        <h1 style={{ margin: "1rem 0" }}>
          {username}’s Reviews
        </h1>

        {reviews.length === 0
          ? <p>{username} has not written any reviews yet.</p>
          : reviews.map(r => (
            <div key={r.id} style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}>
              <Link to={`/professor/${r.prof_id}`} style={profLinkStyle}>
                {r.prof_name}
              </Link>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Module:</strong> {r.module_code} — {r.module_name}
              </p>
              <p style={{ margin: "0.5rem 0", display: "flex", alignItems: "center" }}>
                <strong style={{ marginRight: "0.5rem" }}>Rating:</strong>
                <StarDisplay value={r.rating} />
                <span style={{ marginLeft: "0.5rem", color: "#555" }}>
                  ({r.rating.toFixed(1)})
                </span>
              </p>
              <p style={{ margin: "0.5rem 0" }}>{r.text}</p>
              <p style={{ fontSize: "0.8rem", color: "#555", margin: "0.25rem 0" }}>
                {new Date(r.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        }

        {nextUrl && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={() => loadPage(nextUrl)}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 4,
                border: "1px solid #0077cc",
                backgroundColor: "#0077cc",
                color: "#fff",
                cursor: loading ? "default" : "pointer",
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
