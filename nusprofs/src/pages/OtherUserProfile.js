import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserReviews } from "../services/reviews";
import { API_URL } from "../services/auth";

export default function OtherUserProfile() {
  const { username } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const rv = await getUserReviews(username);
        const withNames = await Promise.all(
          rv.map(async (r) => {
            const res = await fetch(`${API_URL}/professors/${r.prof_id}`, {
              headers: { Accept: "application/json" },
            });
            if (!res.ok)
              throw new Error(`Failed to load professor #${r.prof_id}`);
            const prof = await res.json();
            return { ...r, prof_name: prof.name };
          })
        );

        setReviews(withNames);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) return <p>Loading {username}’s reviews…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  const profLinkStyle = {
    color: "#0077cc",
    textDecoration: "none",
    fontWeight: "bold",
  };

  return (
    <div
      style={{
        padding: "2rem",
        background: "#f0fcff",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "1.5rem",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Link to="/" style={profLinkStyle}>
          ← Back to search
        </Link>
        <h1 style={{ margin: "1rem 0" }}>
          {username}’s Reviews ({reviews.length})
        </h1>

        {reviews.length === 0 ? (
          <p>{username} has not written any reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              style={{
                borderBottom: "1px solid #ddd",
                padding: "1rem 0",
              }}
            >
              <Link to={`/professor/${r.prof_id}`} style={profLinkStyle}>
                {r.prof_name}
              </Link>

              <p style={{ margin: "0.5rem 0" }}>
                <strong>Module:</strong> {r.module_code} — {r.module_name}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Rating:</strong> {r.rating}
              </p>
              <p style={{ margin: "0.5rem 0" }}>{r.text}</p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#555",
                  margin: "0.25rem 0",
                }}
              >
                {new Date(r.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
