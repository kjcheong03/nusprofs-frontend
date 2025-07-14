import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NusmodsLink from "../components/NusmodsLink";
import {
  createReview,
  editReview,
  deleteReview,
  likeReview,
  createReply,
  editReply,
  deleteReply,
  likeReply,
} from "../services/reviews";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaEdit,
  FaTrashAlt,
  FaReply,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaPaperPlane,
  FaCheck,
} from "react-icons/fa";
import buildHeaders from "../components/buildHeaders";

import {
  GoHeartFill as Heart,
  GoHeartFill as HeartOutline,
} from "react-icons/go";

const API_URL = "https://nusprofs-api.onrender.com";
const PAGE_SIZE = 20;

async function fetchPaginated(url, page) {
  const fullUrl = new URL(url);
  fullUrl.searchParams.set("page", page);
  fullUrl.searchParams.set("page_size", PAGE_SIZE);
  const res = await fetch(fullUrl, { headers: buildHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

const IconBtn = ({
  children,
  onClick,
  title,
  style,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    onClick={onClick}
    title={title}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.4rem",
      height: "2.4rem",
      fontSize: "1.2rem",
      marginRight: "8px",
      padding: 0,
      background: "none",
      border: "none",
      cursor: "pointer",
      ...style,
    }}
    {...props}
  >
    {children}
  </button>
);

function StarRating({ value, onChange }) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={onChange ? () => onChange(i) : undefined}
          style={{
            cursor: onChange ? "pointer" : "default",
            fontSize: "1.2rem",
            color: "#ffb400",
            marginRight: "4px",
          }}
        >
          {value >= i ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <span
      style={{ color: "#ffb400", fontSize: "1.2rem", verticalAlign: "middle" }}
    >
      {stars}
    </span>
  );
}

export default function Profile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext);

  const [prof, setProf] = useState(null);
  const [loadingProf, setLoadingProf] = useState(true);
  const [errorProf, setErrorProf] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorReviews, setErrorReviews] = useState("");

  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editModule, setEditModule] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState("");

  const [replyState, setReplyState] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});

  const [repliesPagination, setRepliesPagination] = useState({});

  function parseMentions(text) {
    return text.split(/(@[A-Za-z0-9_]+)/g).map((part, i) =>
      part.startsWith("@") ? (
        <Link
          key={i}
          to={`/users/${encodeURIComponent(part.slice(1))}`}
          style={{ color: "#000", fontWeight: "bold", textDecoration: "none" }}
        >
          {part}
        </Link>
      ) : (
        part
      )
    );
  }

  const teachingByModule = useMemo(() => {
    if (!prof?.teaching) return [];
    const map = new Map();
    prof.teaching.forEach((t) => {
      if (!map.has(t.module_code)) {
        map.set(t.module_code, {
          module_code: t.module_code,
          module_name: t.module_name,
          offerings: [],
        });
      }
      map
        .get(t.module_code)
        .offerings.push(
          `Semester ${t.semester}` +
            (t.academic_year ? ` (${t.academic_year})` : "")
        );
    });
    return Array.from(map.values());
  }, [prof?.teaching]);

  useEffect(() => {
    setLoadingProf(true);
    Promise.all([
      fetch(`${API_URL}/professors/${id}`, {
        headers: { Accept: "application/json" },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText))),
      fetch(`${API_URL}/professors/${id}/review_summary`, {
        headers: { Accept: "application/json" },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText))),
    ])
      .then(([pd, summary]) => {
        setProf({ ...pd, ...summary });
        setErrorProf("");
      })
      .catch((e) => setErrorProf(e.toString()))
      .finally(() => setLoadingProf(false));
  }, [id]);

  useEffect(() => {
    setLoadingReviews(true);
    fetchPaginated(`${API_URL}/reviews/professors/${id}`, 1)
      .then((data) => {
        const initialReviews = data.results.map((r) => ({
          ...r,
          can_edit: isLoggedIn && user?.username === r.username,
          replies: [],
          is_liked: r.is_liked === true,
        }));
        setReviews(initialReviews);
        setHasMoreReviews(!!data.next);
      })
      .catch((e) => setErrorReviews(e.message))
      .finally(() => setLoadingReviews(false));
  }, [id, isLoggedIn, user?.username]);

  const reloadSummary = () =>
    fetch(`${API_URL}/professors/${id}/review_summary`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(({ average_rating, review_count }) => {
        setProf((p) => ({ ...p, average_rating, review_count }));
      })
      .catch(() => {});

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newModule) return setFormError("Module code required");
    if (!newText) return setFormError("Review text required");
    setFormError("");
    try {
      const created = await createReview({
        prof_id: id,
        module_code: newModule,
        text: newText,
        rating: newRating,
      });
      setReviews((rs) => [
        {
          ...created,
          username: user.username,
          module_name:
            teachingByModule.find((m) => m.module_code === newModule)
              ?.module_name || "",
          can_edit: true,
          replies: [],
          reply_count: 0,
        },
        ...rs,
      ]);
      setNewModule("");
      setNewRating(5);
      setNewText("");
      setShowForm(false);
      await reloadSummary();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const startEditReview = (r) => {
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
      const updatedData = await editReview(r.id, {
        module_code: editModule,
        text: editText,
        rating: editRating,
      });
      setReviews((rs) =>
        rs.map((x) =>
          x.id === r.id
            ? {
                ...x,
                module_code: updatedData.module_code,
                text: updatedData.text,
                rating: updatedData.rating,
                module_name:
                  teachingByModule.find(
                    (m) => m.module_code === updatedData.module_code
                  )?.module_name || x.module_name,
              }
            : x
        )
      );
      setEditingId(null);
      await reloadSummary();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    await deleteReview(r.id);
    setReviews((rs) => rs.filter((x) => x.id !== r.id));
    await reloadSummary();
  };

  const handleLike = async (r) => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }
    const response = await likeReview(r.id);
    setReviews((rs) =>
      rs.map((x) =>
        x.id === r.id
          ? {
              ...x,
              is_liked: response.liked,
              likes_count: response.likes_count,
            }
          : x
      )
    );
  };

  const initReply = (rid) => {
    if (!replyState[rid]) {
      setReplyState((s) => ({
        ...s,
        [rid]: {
          newText: "",
          newError: "",
          editingReplyId: null,
          editText: "",
          editError: "",
          replyToId: null,
        },
      }));
    }
  };

  const handleReplyText = (rid, txt) => {
    initReply(rid);
    setReplyState((s) => ({
      ...s,
      [rid]: { ...s[rid], newText: txt },
    }));
  };

  const submitReply = async (rid) => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }
    const rs = replyState[rid] || {};
    if (!rs.newText) {
      return setReplyState((s) => ({
        ...s,
        [rid]: { ...s[rid], newError: "Reply cannot be empty" },
      }));
    }
    try {
      await createReply(rid, rs.newText, rs.replyToId);

      const data = await fetchPaginated(`${API_URL}/reviews/${rid}/replies`, 1);
      const existing = data.results.map((rep) => ({
        ...rep,
        can_edit: isLoggedIn && user?.username === rep.username,
        is_liked: rep.is_liked === true,
      }));

      setReviews((prev) =>
        prev.map((r) =>
          r.id === rid
            ? {
                ...r,
                replies: existing,
                reply_count: r.reply_count + 1,
              }
            : r
        )
      );

      setShowReplies((f) => ({ ...f, [rid]: true }));
      setShowReplyForm((f) => ({ ...f, [rid]: false }));

      setShowReplies((f) => ({ ...f, [rid]: true }));
    } catch (err) {
      setReplyState((s) => ({
        ...s,
        [rid]: { ...s[rid], newError: err.message },
      }));
    }
  };

  const startReplyEdit = (rid, rep) => {
    initReply(rid);
    setReplyState((s) => ({
      ...s,
      [rid]: {
        ...s[rid],
        editingReplyId: rep.id,
        editText: rep.text,
        editError: "",
      },
    }));
  };

  const handleReplyEdit = async (rid, rep) => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }
    const rs = replyState[rid] || {};
    if (!rs.editText) {
      return setReplyState((s) => ({
        ...s,
        [rid]: { ...s[rid], editError: "Text required" },
      }));
    }
    try {
      const updatedData = await editReply(rep.id, { text: rs.editText });
      setReviews((prev) =>
        prev.map((x) =>
          x.id === rid
            ? {
                ...x,
                replies: x.replies.map((rp) =>
                  rp.id === rep.id ? { ...rp, text: updatedData.text } : rp
                ),
              }
            : x
        )
      );
      setReplyState((s) => ({
        ...s,
        [rid]: { ...s[rid], editingReplyId: null, editText: "", editError: "" },
      }));
    } catch (err) {
      setReplyState((s) => ({
        ...s,
        [rid]: { ...s[rid], editError: err.message },
      }));
    }
  };

  const handleReplyDelete = async (rid, repId) => {
    if (!window.confirm("Delete this reply?")) return;
    await deleteReply(repId);
    setReviews((prev) =>
      prev.map((x) =>
        x.id === rid
          ? {
              ...x,
              replies: x.replies.filter((rp) => rp.id !== repId),
              reply_count: x.reply_count - 1,
            }
          : x
      )
    );
  };

  const handleReplyLike = async (rid, repId) => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }
    const response = await likeReply(repId);
    setReviews((prev) =>
      prev.map((x) =>
        x.id !== rid
          ? x
          : {
              ...x,
              replies: x.replies.map((rp) =>
                rp.id === repId
                  ? {
                      ...rp,
                      is_liked: response.liked,
                      likes_count: response.likes_count,
                    }
                  : rp
              ),
            }
      )
    );
  };

  const toggleReplies = useCallback(
    async (reviewId) => {
      const isCurrentlyVisible = showReplies[reviewId];
      setShowReplies((s) => ({ ...s, [reviewId]: !s[reviewId] }));

      const review = reviews.find((r) => r.id === reviewId);
      const repliesAlreadyLoaded = review && review.replies.length > 0;

      if (
        !isCurrentlyVisible &&
        !repliesAlreadyLoaded &&
        review &&
        review.reply_count > 0
      ) {
        setRepliesPagination((p) => ({
          ...p,
          [reviewId]: { page: 1, hasMore: false, loading: true },
        }));
        try {
          const data = await fetchPaginated(
            `${API_URL}/reviews/${reviewId}/replies`,
            1
          );
          const fetchedReplies = data.results.map((rep) => ({
            ...rep,
            can_edit: isLoggedIn && user?.username === rep.username,
            is_liked: rep.is_liked === true,
          }));
          setReviews((rs) =>
            rs.map((r) =>
              r.id === reviewId ? { ...r, replies: fetchedReplies } : r
            )
          );
          setRepliesPagination((p) => ({
            ...p,
            [reviewId]: { page: 1, hasMore: !!data.next, loading: false },
          }));
        } catch (error) {
          console.error("Failed to load replies:", error);
          setRepliesPagination((p) => ({
            ...p,
            [reviewId]: { loading: false },
          }));
        }
      }
    },
    [reviews, showReplies, isLoggedIn, user?.username]
  );

  const startNestedReply = (rid, rep) => {
    initReply(rid);
    setShowReplyForm((f) => ({ ...f, [rid]: true }));
    setReplyState((s) => ({
      ...s,
      [rid]: {
        ...s[rid],
        newText: `@${rep.username} `,
        replyToId: rep.id,
        newError: "",
      },
    }));
    setTimeout(() => {
      const el = document.getElementById(`reply-form-${rid}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleShowMoreReviews = () => {
    if (loadingMoreReviews) return;
    setLoadingMoreReviews(true);
    const nextPage = reviewsPage + 1;
    fetchPaginated(`${API_URL}/reviews/professors/${id}`, nextPage)
      .then((data) => {
        const newReviews = data.results.map((r) => ({
          ...r,
          can_edit: isLoggedIn && user?.username === r.username,
          replies: [],
          is_liked: r.is_liked === true,
        }));
        setReviews((prev) => [...prev, ...newReviews]);
        setHasMoreReviews(!!data.next);
        setReviewsPage(nextPage);
      })
      .catch((e) => setErrorReviews(e.message))
      .finally(() => setLoadingMoreReviews(false));
  };

  const handleShowMoreReplies = useCallback(
    async (reviewId) => {
      const pagState = repliesPagination[reviewId] || {
        page: 1,
        loading: false,
      };
      if (pagState.loading) return;

      const nextPage = pagState.page + 1;
      setRepliesPagination((p) => ({
        ...p,
        [reviewId]: { ...pagState, loading: true },
      }));

      try {
        const data = await fetchPaginated(
          `${API_URL}/reviews/${reviewId}/replies`,
          nextPage
        );
        const newReplies = data.results.map((rep) => ({
          ...rep,
          can_edit: isLoggedIn && user?.username === rep.username,
          is_liked: rep.is_liked === true,
        }));
        setReviews((rs) =>
          rs.map((r) =>
            r.id === reviewId
              ? { ...r, replies: [...r.replies, ...newReplies] }
              : r
          )
        );
        setRepliesPagination((p) => ({
          ...p,
          [reviewId]: { page: nextPage, hasMore: !!data.next, loading: false },
        }));
      } catch (error) {
        console.error("Failed to load more replies:", error);
        setRepliesPagination((p) => ({
          ...p,
          [reviewId]: { ...pagState, loading: false },
        }));
      }
    },
    [repliesPagination, isLoggedIn, user?.username]
  );

  if (loadingProf) return <p>Loading professor…</p>;
  if (errorProf) return <p style={{ color: "red" }}>Error: {errorProf}</p>;
  if (!prof) return null;

  return (
    <div style={{ padding: "2rem", background: "#f0fcff", minHeight: "100vh" }}>
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
        <Link to="/">← Back to search</Link>
        <h1 style={{ margin: "1rem 0" }}>{prof.name}</h1>
        {prof.title && (
          <p>
            <b>Title:</b> {prof.title}
          </p>
        )}
        {prof.faculty && (
          <p>
            <b>Faculty:</b> {prof.faculty}
          </p>
        )}
        {prof.department && (
          <p>
            <b>Dept:</b> {prof.department}
          </p>
        )}
        {prof.office && (
          <p>
            <b>Office:</b> {prof.office}
          </p>
        )}
        {prof.phone && (
          <p>
            <b>Phone:</b> {prof.phone}
          </p>
        )}

        {prof.average_rating != null && (
          <p>
            <b>Avg. Rating:</b> <StarDisplay value={prof.average_rating} />
            <span
              style={{
                marginLeft: "0.5rem",
                fontWeight: "bold",
                verticalAlign: "middle",
              }}
            >
              {prof.average_rating.toFixed(2)}
            </span>{" "}
            <span style={{ marginLeft: "0.5rem", color: "#555" }}>
              ({prof.review_count} review{prof.review_count === 1 ? "" : "s"})
            </span>
          </p>
        )}

        {teachingByModule.length > 0 && (
          <div>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                margin: "1.5rem 0 0.5rem",
              }}
            >
              Teaching History
            </p>
            {teachingByModule.map((m) => (
              <div key={m.module_code} style={{ marginBottom: "1rem" }}>
                <p style={{ margin: 0 }}>
                  <NusmodsLink
                  moduleCode={m.module_code}
                  moduleName={m.module_name}
                  />
                </p>
                <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0 }}>
                  {m.offerings.map((sem, i) => (
                    <li key={i}>{sem}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <hr style={{ margin: "2rem 0" }} />

        <button onClick={() => setShowForm((f) => !f)}>
          {showForm ? "Cancel" : "Write a Review"}
        </button>

        {showForm &&
          (isLoggedIn ? (
            <form onSubmit={handleCreate} style={{ margin: "2rem 0" }}>
              <h2>Write a Review</h2>
              <select
                value={newModule}
                onChange={(e) => setNewModule(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".5rem",
                  marginBottom: ".5rem",
                }}
              >
                <option value="">Select module…</option>
                {teachingByModule.map((m) => (
                  <option key={m.module_code} value={m.module_code}>
                    {m.module_code} — {m.module_name}
                  </option>
                ))}
              </select>
              <StarRating value={newRating} onChange={setNewRating} />
              <textarea
                placeholder="Your review…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".5rem",
                  height: "80px",
                  marginTop: ".5rem",
                }}
              />
              {formError && <div style={{ color: "red" }}>{formError}</div>}
              <IconBtn type="submit" title="Submit review">
                <FaPaperPlane />
              </IconBtn>
            </form>
          ) : (
            <p>
              <Link to="/login">Log in</Link> to write a review.
            </p>
          ))}

        <h2 style={{ marginTop: "2rem" }}>Reviews for {prof.name}</h2>

        {loadingReviews ? (
          <p>Loading reviews…</p>
        ) : errorReviews ? (
          <p style={{ color: "red" }}>{errorReviews}</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <div>
            {reviews.map((r) => {
              const replyPagState = repliesPagination[r.id] || {};
              const replyFormState = replyState[r.id] || {};

              console.log(r);
              return (
                <div
                  key={r.id}
                  style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}
                >
                  <Link
                    to={
                      !isLoggedIn
                        ? "/login"
                        : user?.username === r.username
                        ? "/profile"
                        : `/users/${encodeURIComponent(r.username)}`
                    }
                    style={{
                      color: "#0077cc",
                      fontWeight: "bold",
                      textDecoration: "none",
                    }}
                  >
                    {r.username}
                  </Link>

                  {editingId === r.id ? (
                    <div>
                      <select
                        value={editModule}
                        onChange={(e) => setEditModule(e.target.value)}
                        style={{
                          width: "100%",
                          padding: ".5rem",
                          margin: ".5rem 0",
                        }}
                      >
                        <option value="">Select module…</option>
                        {teachingByModule.map((m) => (
                          <option key={m.module_code} value={m.module_code}>
                            {" "}
                            {m.module_code} — {m.module_name}{" "}
                          </option>
                        ))}
                      </select>
                      <StarRating value={editRating} onChange={setEditRating} />
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          width: "100%",
                          padding: ".5rem",
                          height: "80px",
                          margin: ".5rem 0",
                        }}
                      />
                      {editError && (
                        <div style={{ color: "red" }}>{editError}</div>
                      )}
                      <IconBtn onClick={() => handleEdit(r)} title="Save">
                        <FaCheck />
                      </IconBtn>
                      <IconBtn
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <FaTimes />
                      </IconBtn>
                    </div>
                  ) : (
                    <div>
                      <p>
                          <b>Module:</b>{" "}
                          <NusmodsLink
                          moduleCode={r.module_code}
                          moduleName={r.module_name}
                          />
                      </p>
                      <StarRating value={r.rating} />
                      <p style={{ margin: ".5rem 0" }}>{r.text}</p>
                      <small style={{ color: "#555" }}>
                        {" "}
                        {new Date(r.timestamp).toLocaleString()}{" "}
                      </small>
                      <div style={{ marginTop: ".5rem" }}>
                        <IconBtn
                          onClick={() => handleLike(r)}
                          title={r.is_liked ? "Unlike" : "Like"}
                          style={{
                            color: r.is_liked ? "red" : "inherit",
                            width: "auto",
                            paddingRight: "8px",
                          }}
                        >
                          {r.is_liked ? <Heart /> : <HeartOutline />}
                          <span style={{ marginLeft: "6px", fontSize: "1rem" }}>
                            {" "}
                            {r.likes_count}{" "}
                          </span>
                        </IconBtn>

                        {r.can_edit && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <IconBtn
                              onClick={() => startEditReview(r)}
                              title="Edit"
                              style={{ marginLeft: "-6px" }}
                            >
                              <FaEdit />
                            </IconBtn>
                            <IconBtn
                              onClick={() => handleDelete(r)}
                              title="Delete"
                              style={{ marginLeft: "0px" }}
                            >
                              <FaTrashAlt />
                            </IconBtn>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: ".5rem" }}>
                    <button
                      onClick={() =>
                        setShowReplyForm((f) => ({ ...f, [r.id]: !f[r.id] }))
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginRight: "8px",
                      }}
                    >
                      {showReplyForm[r.id] ? <FaTimes /> : <FaReply />}
                      <span style={{ marginLeft: "4px" }}>
                        {" "}
                        {showReplyForm[r.id] ? "Cancel" : "Reply"}{" "}
                      </span>
                    </button>
                    {r.reply_count > 0 && (
                      <button
                        onClick={() => toggleReplies(r.id)}
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        {showReplies[r.id] ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                        <span style={{ marginLeft: "4px" }}>
                          {showReplies[r.id]
                            ? `Hide Replies (${r.reply_count})`
                            : `View Replies (${r.reply_count})`}
                        </span>
                      </button>
                    )}
                  </div>

                  {showReplyForm[r.id] &&
                    (isLoggedIn ? (
                      <div
                        id={`reply-form-${r.id}`}
                        style={{ margin: "8px 0 0 24px" }}
                      >
                        <textarea
                          placeholder="Write a reply…"
                          value={replyFormState.newText || ""}
                          onChange={(e) =>
                            handleReplyText(r.id, e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            height: "60px",
                          }}
                        />
                        {replyFormState.newError && (
                          <div style={{ color: "red", marginTop: "4px" }}>
                            {" "}
                            {replyFormState.newError}{" "}
                          </div>
                        )}
                        <IconBtn
                          onClick={() => submitReply(r.id)}
                          title="Post reply"
                        >
                          <FaPaperPlane />
                        </IconBtn>
                      </div>
                    ) : (
                      <p style={{ marginLeft: "1rem" }}>
                        <Link to="/login">Log in</Link> to reply.
                      </p>
                    ))}

                  {showReplies[r.id] && (
                    <div style={{ margin: "12px 0 0 24px" }}>
                      {replyPagState.loading && r.replies.length === 0 ? (
                        <p>Loading replies...</p>
                      ) : (
                        <div>
                          {r.replies.map((rep) =>
                            replyFormState.editingReplyId === rep.id ? (
                              <div key={rep.id} style={{ marginBottom: "8px" }}>
                                <textarea
                                  value={replyFormState.editText || ""}
                                  onChange={(e) =>
                                    setReplyState((s) => ({
                                      ...s,
                                      [r.id]: {
                                        ...s[r.id],
                                        editText: e.target.value,
                                      },
                                    }))
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "8px",
                                    height: "60px",
                                  }}
                                />
                                {replyFormState.editError && (
                                  <div
                                    style={{ color: "red", marginTop: "4px" }}
                                  >
                                    {" "}
                                    {replyFormState.editError}{" "}
                                  </div>
                                )}
                                <IconBtn
                                  onClick={() => handleReplyEdit(r.id, rep)}
                                  title="Save"
                                >
                                  <FaCheck />
                                </IconBtn>
                                <IconBtn
                                  onClick={() =>
                                    setReplyState((s) => ({
                                      ...s,
                                      [r.id]: {
                                        ...s[r.id],
                                        editingReplyId: null,
                                        editText: "",
                                        editError: "",
                                      },
                                    }))
                                  }
                                  title="Cancel"
                                >
                                  <FaTimes />
                                </IconBtn>
                              </div>
                            ) : (
                              <div
                                key={rep.id}
                                style={{
                                  borderLeft: "2px solid #eee",
                                  paddingLeft: "12px",
                                  marginBottom: "12px",
                                }}
                              >
                                <Link
                                  to={
                                    isLoggedIn &&
                                    user?.username === rep.username
                                      ? "/profile"
                                      : `/users/${encodeURIComponent(
                                          rep.username
                                        )}`
                                  }
                                  style={{
                                    color: "#0077cc",
                                    fontWeight: "bold",
                                    textDecoration: "none",
                                  }}
                                >
                                  {rep.username}
                                </Link>
                                <p style={{ margin: "4px 0" }}>
                                  {parseMentions(rep.text)}
                                </p>
                                <small style={{ color: "#555" }}>
                                  {" "}
                                  {new Date(
                                    rep.timestamp
                                  ).toLocaleString()}{" "}
                                </small>
                                <div style={{ marginTop: "4px" }}>
                                  <IconBtn
                                    onClick={() =>
                                      handleReplyLike(r.id, rep.id)
                                    }
                                    title={rep.is_liked ? "Unlike" : "Like"}
                                    style={{
                                      color: rep.is_liked ? "red" : "inherit",
                                      width: "auto",
                                      paddingRight: "8px",
                                    }}
                                  >
                                    {rep.is_liked ? (
                                      <Heart />
                                    ) : (
                                      <HeartOutline />
                                    )}
                                    <span
                                      style={{
                                        marginLeft: "6px",
                                        fontSize: "1rem",
                                      }}
                                    >
                                      {" "}
                                      {rep.likes_count}{" "}
                                    </span>
                                  </IconBtn>
                                  <IconBtn
                                    onClick={() => startNestedReply(r.id, rep)}
                                    style={{ marginLeft: "-10px" }}
                                  >
                                    <FaReply />
                                  </IconBtn>
                                  {rep.can_edit && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <IconBtn
                                        onClick={() =>
                                          startReplyEdit(r.id, rep)
                                        }
                                        title="Edit"
                                        style={{ marginLeft: "-6px" }}
                                      >
                                        <FaEdit />
                                      </IconBtn>
                                      <IconBtn
                                        onClick={() =>
                                          handleReplyDelete(r.id, rep.id)
                                        }
                                        title="Delete"
                                        style={{ marginLeft: "0px" }}
                                      >
                                        <FaTrashAlt />
                                      </IconBtn>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                          {replyPagState.hasMore && (
                            <button
                              onClick={() => handleShowMoreReplies(r.id)}
                              disabled={replyPagState.loading}
                            >
                              {replyPagState.loading
                                ? "Loading..."
                                : "Show More Replies"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {hasMoreReviews && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <button
                  onClick={handleShowMoreReviews}
                  disabled={loadingMoreReviews}
                  style={{
                    backgroundColor: "#0077cc",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {loadingMoreReviews ? "Loading..." : "Show More Reviews"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
