import React, { useContext, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../services/auth";
import { deleteReview } from "../services/reviews";
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
  return <span style={{ color: "#ffb400", fontSize: "1.2rem" }}>{stars}</span>;
}

export default function UserProfile() {
  const { user, loading, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const loadReviewsPage = useCallback(
    async (url, replace = false) => {
      setLoadingReviews(true);
      setReviewsError("");
      try {
        const headers = await buildHeaders(true);
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(res.statusText);
        const { results, next } = await res.json();

        const withNames = await Promise.all(
          results.map(async (r) => {
            const profRes = await fetch(`${API_URL}/professors/${r.prof_id}`, {
              headers: { Accept: "application/json" },
            });
            if (!profRes.ok) throw new Error("Failed to fetch prof");
            const profData = await profRes.json();
            return { ...r, prof_name: profData.name };
          })
        );

        setReviews((prev) => replace ? withNames : prev.concat(withNames));
        setNextUrl(next);
      } catch (e) {
        setReviewsError(e.message);
      } finally {
        setLoadingReviews(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    loadReviewsPage(`${API_URL}/reviews/users/`, true);
  }, [user, loadReviewsPage]);

  const handleDelete = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(r.id);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUsernameChange = async () => {
    setError("");
    if (newUsername.length < 1) return setError("Username must be at least 1 characters.");
    try {
      const headers = await buildHeaders(true);
      const res = await fetch(`${API_URL}/auth/change_username`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.username) throw new Error(data.username[0]);
        throw new Error(data.detail || "Failed to update username.");
      }
      await refreshUser();
      setEditingUsername(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePasswordChange = async () => {
    setError("");
    if (!oldPassword) return setError("Please enter your current password.");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");
    try {
      const headers = await buildHeaders(true);
      const res = await fetch(`${API_URL}/auth/change_password`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.old_password) throw new Error(data.old_password[0]);
        if (data.new_password) throw new Error(data.new_password[0]);
        if (data.non_field_errors) throw new Error(data.non_field_errors[0]);
        throw new Error(data.detail || "Failed to change password.");
      }
      setEditingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully.");
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p>Loading your profile…</p>;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fcff", padding: "2rem" }}>
        <div style={{
          maxWidth: "700px", margin: "0 auto", padding: "1.5rem",
          background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <p>Please <Link to="/login">log in</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0fcff", padding: "2rem" }}>
      <div style={{
        maxWidth: "700px", margin: "0 auto", padding: "1.5rem",
        background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1>Your Profile</h1>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>

        {user.is_admin && (
          <p>
            <a href="https://nusprofs-api.onrender.com/admin/" target="_blank" rel="noopener noreferrer">
              Go to Admin Panel
            </a>
          </p>
        )}

        <div style={{ marginBottom: "1rem" }}>
          {editingUsername ? (
            <>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                style={{ padding: ".5rem", fontSize: "1rem" }}
              />
              <button onClick={handleUsernameChange} style={{ marginLeft: ".5rem" }}>Save</button>
              <button onClick={() => setEditingUsername(false)} style={{ marginLeft: ".5rem" }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => { setNewUsername(user.username); setEditingUsername(true); }}>
              Change Username
            </button>
          )}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          {editingPassword ? (
            <>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                style={{ display: "block", marginBottom: ".5rem", padding: ".5rem", width: "100%" }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={{ display: "block", marginBottom: ".5rem", padding: ".5rem", width: "100%" }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{ display: "block", marginBottom: ".5rem", padding: ".5rem", width: "100%" }}
              />
              <button onClick={handlePasswordChange}>Save Password</button>
              <button onClick={() => setEditingPassword(false)} style={{ marginLeft: ".5rem" }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditingPassword(true)}>Change Password</button>
          )}
        </div>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Logout
        </button>

        <h2 style={{ marginTop: "2rem" }}>Your Reviews</h2>

        {reviewsError && <p style={{ color: "red" }}>{reviewsError}</p>}
        {!loadingReviews && reviews.length === 0 && !reviewsError && (
          <p>You haven’t written any reviews yet.</p>
        )}

        {reviews.map((r) => (
          <div key={r.id} style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}>
            <Link to={`/professor/${r.prof_id}`} style={{
              color: "#0077cc", textDecoration: "none", fontWeight: "bold"
            }}>{r.prof_name}</Link>
            <p><b>Module:</b> {r.module_code} — {r.module_name}</p>
            <p><b>Rating:</b> <StarDisplay value={r.rating} /></p>
            <p>{r.text}</p>
            <button onClick={() => handleDelete(r)}>Delete</button>
          </div>
        ))}

        {nextUrl && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={() => loadReviewsPage(nextUrl)}
              disabled={loadingReviews}
              style={{
                padding: "0.5rem 1rem", borderRadius: 4, border: "1px solid #0077cc",
                backgroundColor: "#0077cc", color: "#fff",
                cursor: loadingReviews ? "default" : "pointer"
              }}
            >
              {loadingReviews ? "Loading…" : "Show More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
