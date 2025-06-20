import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_URL, changeUsername } from "../services/auth";
import { getUserReviews, editReview, deleteReview } from "../services/reviews";

export default function UserProfile() {
  const { user, loading, logout, refreshUser } = useContext(AuthContext);

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editModule, setEditModule] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadMyReviews() {
      try {
        const rv = await getUserReviews();
        const withNames = await Promise.all(
          rv.map(async (r) => {
            const res = await fetch(`${API_URL}/professors/${r.prof_id}`, {
              headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Failed to fetch prof");
            const prof = await res.json();
            return { ...r, prof_name: prof.name };
          })
        );
        setReviews(withNames);
      } catch (e) {
        console.error(e);
      }
    }

    loadMyReviews();
  }, [user]);

  const handleUsernameChange = async () => {
    setError("");
    if (newUsername.length < 3) {
      return setError("Username must be at least 3 characters.");
    }
    try {
      await changeUsername(newUsername);
      await refreshUser();
      setEditingUsername(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePasswordChange = async () => {
    setError("");
    if (!oldPassword) {
      return setError("Please enter your current password.");
    }
    if (newPassword.length < 8) {
      return setError("New password must be at least 8 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }

    try {
      const res = await fetch(`${API_URL}/auth/change_password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data));

      setEditingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully.");
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditModule(r.module_code);
    setEditRating(r.rating);
    setEditText(r.text);
    setEditError("");
  };
  const handleEdit = async (r) => {
    if (!editModule) return setEditError("Module code required");
    if (!editText) return setEditError("Text required");
    setEditError("");
    try {
      await editReview(r.id, {
        module_code: editModule,
        text: editText,
        rating: editRating,
      });
      setEditingId(null);
      setReviews(await getUserReviews());
    } catch (e) {
      setEditError(e.message);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(r.id);
      setReviews(await getUserReviews());
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <p>Loading your profile…</p>;
  if (!user)
    return (
      <p>
        Please <Link to="/login">log in</Link>.
      </p>
    );

  return (
    <div style={{ minHeight: "100vh", background: "#f0fcff", padding: "2rem" }}>
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "1.5rem",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h1>Your Profile</h1>
        <p>
          <strong>Username:</strong> {user.username}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <div style={{ marginBottom: "1rem" }}>
          {editingUsername ? (
            <>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                style={{ padding: ".5rem", fontSize: "1rem" }}
              />
              <button
                onClick={handleUsernameChange}
                style={{ marginLeft: ".5rem" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                style={{ marginLeft: ".5rem" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setNewUsername(user.username);
                setEditingUsername(true);
              }}
            >
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
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  padding: ".5rem",
                  width: "100%",
                }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  padding: ".5rem",
                  width: "100%",
                }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  padding: ".5rem",
                  width: "100%",
                }}
              />
              <button onClick={handlePasswordChange}>Save Password</button>
              <button
                onClick={() => setEditingPassword(false)}
                style={{ marginLeft: ".5rem" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditingPassword(true)}>
              Change Password
            </button>
          )}
        </div>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <button onClick={logout}>Logout</button>

        <h2 style={{ marginTop: "2rem" }}>Your Reviews</h2>
        {reviews.length === 0 ? (
          <p>You haven't written any reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              style={{
                borderBottom: "1px solid #ddd",
                padding: "1rem 0",
              }}
            >
              {editingId === r.id ? (
                <>
                  <input
                    value={editModule}
                    onChange={(e) => setEditModule(e.target.value)}
                    style={{ width: "100%", marginBottom: ".25rem" }}
                  />
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    style={{ width: "100%", marginBottom: ".25rem" }}
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ width: "100%", height: "80px" }}
                  />
                  {editError && <div style={{ color: "red" }}>{editError}</div>}
                  <button
                    onClick={() => handleEdit(r)}
                    style={{ marginRight: ".5rem" }}
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <Link
                    to={`/professor/${r.prof_id}`}
                    style={{
                      color: "#0077cc",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    {r.prof_name || `Professor ${r.prof_id}`}
                  </Link>
                  <p>
                    <b>Module:</b> {r.module_code} — {r.module_name}
                  </p>
                  <p>
                    <b>Rating:</b> {r.rating}
                  </p>
                  <p>{r.text}</p>
                  <button
                    onClick={() => startEdit(r)}
                    style={{ marginRight: ".5rem" }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(r)}>Delete</button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
