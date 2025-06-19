import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link }                   from 'react-router-dom';
import { AuthContext }                        from '../context/AuthContext';
import {
  getReviewsForProfessor,
  getReplies,
  createReview,
  editReview,
  deleteReview,
  likeReview,
  createReply,
  editReply,
  deleteReply,
  likeReply
} from '../services/reviews';

const API_URL = 'https://nusprofs-api.onrender.com';

export default function Profile() {
  const { id } = useParams();              
  const { isLoggedIn, user } = useContext(AuthContext);

  const [prof, setProf]               = useState(null);
  const [loadingProf, setLoadingProf] = useState(true);
  const [errorProf, setErrorProf]     = useState('');

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [newModule, setNewModule] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText]     = useState('');
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId]   = useState(null);
  const [editModule, setEditModule] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText]     = useState('');
  const [editError, setEditError]   = useState('');

  const [replyState, setReplyState] = useState({});

  const [showReviews, setShowReviews] = useState(false);
  const [showReplies, setShowReplies] = useState({}); 

  useEffect(() => {
    async function fetchProf() {
      setLoadingProf(true);
      try {
        const res = await fetch(`${API_URL}/professor/${id}`, {
          headers:{ Accept:'application/json' }
        });
        if (!res.ok) throw new Error(res.statusText);
        setProf(await res.json());
      } catch (e) {
        setErrorProf(e.message);
      } finally {
        setLoadingProf(false);
      }
    }
    fetchProf();
  }, [id]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const rv = await getReviewsForProfessor(id);
        const withReplies = await Promise.all(
          rv.map(async r => ({ ...r, replies: await getReplies(r.id) }))
        );
        setReviews(withReplies);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  const reload = async () => {
    const rv = await getReviewsForProfessor(id);
    setReviews(await Promise.all(
      rv.map(async r => ({ ...r, replies: await getReplies(r.id) }))
    ));
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!newModule) return setFormError('Module code required');
    if (!newText)   return setFormError('Review text required');
    setFormError('');
    try {
      await createReview({
        prof_id: id,
        module_code: newModule,
        text: newText,
        rating: newRating
      });
      setNewModule(''); setNewRating(5); setNewText('');
      await reload();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const startEdit = r => {
    setEditingId(r.id);
    setEditModule(r.module_code);
    setEditRating(r.rating);
    setEditText(r.text);
    setEditError('');
  };
  const handleEdit = async r => {
    if (!editModule) return setEditError('Module code required');
    if (!editText)   return setEditError('Text required');
    setEditError('');
    try {
      await editReview(r.id, {
        module_code: editModule,
        text: editText,
        rating: editRating
      });
      setEditingId(null);
      await reload();
    } catch (e) {
      setEditError(e.message);
    }
  };

  const handleDelete = async r => {
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(r.id);
    await reload();
  };

  const handleLike = async r => {
    await likeReview(r.id);
    await reload();
  };

  const initReply = reviewId => {
    if (!replyState[reviewId]) {
      setReplyState(s => ({
        ...s,
        [reviewId]: {
          newText: '',
          newError: '',
          editingReplyId: null,
          editText: '',
          editError: ''
        }
      }));
    }
  };

  const handleReplyText = (rid, text) => {
    initReply(rid);
    setReplyState(s => ({
      ...s,
      [rid]: { ...s[rid], newText: text }
    }));
  };
  const submitReply = async rid => {
    const rs = replyState[rid]||{};
    if (!rs.newText) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...rs, newError:'Reply cannot be empty' }
      }));
      return;
    }
    try {
      await createReply(rid, rs.newText);
      await reload();
      setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], newText:'', newError:'' }
      }));
    } catch(e) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...rs, newError:e.message }
      }));
    }
  };

  const startReplyEdit = (rid, rep) => {
    initReply(rid);
    setReplyState(s => ({
      ...s,
      [rid]: {
        ...s[rid],
        editingReplyId: rep.id,
        editText: rep.text,
        editError: ''
      }
    }));
  };
  const handleReplyEdit = async (rid, rep) => {
    const rs = replyState[rid]||{};
    if (!rs.editText) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...rs, editError:'Text required' }
      }));
      return;
    }
    try {
      await editReply(rep.id, { text: rs.editText });
      await reload();
      setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], editingReplyId:null, editText:'', editError:'' }
      }));
    } catch(e) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...rs, editError:e.message }
      }));
    }
  };

  const handleReplyDelete = async (rid, repId) => {
    if (!window.confirm('Delete this reply?')) return;
    await deleteReply(repId);
    await reload();
  };
  const handleReplyLike = async (rid, repId) => {
    await likeReply(repId);
    await reload();
  };

  const toggleReplies = rid => {
    setShowReplies(s => ({ ...s, [rid]: !s[rid] }));
  };

  if (loadingProf) return <p>Loading professor…</p>;
  if (errorProf)   return <p style={{ color:'red' }}>Error: {errorProf}</p>;
  if (!prof)       return null;

  const uniqueModules = Array.from(
    new Map((prof.teaching || []).map(t => [t.module_code, t])).values()
  );
  const moduleOptions = uniqueModules.map(t => (
    <option key={t.module_code} value={t.module_code}>
      {t.module_code} — {t.module_name}
    </option>
  ));

  return (
    <div style={{ padding:'2rem', background:'#f0fcff', minHeight:'100vh' }}>
      <div style={{
        maxWidth:'700px', margin:'0 auto', padding:'1.5rem',
        background:'#fff', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Link to="/">← Back to search</Link>
        <h1 style={{ margin:'1rem 0' }}>{prof.name}</h1>
        {prof.title      && <p><b>Title:</b> {prof.title}</p>}
        {prof.faculty    && <p><b>Faculty:</b> {prof.faculty}</p>}
        {prof.department && <p><b>Department:</b> {prof.department}</p>}
        {prof.office     && <p><b>Office:</b> {prof.office}</p>}
        {prof.phone      && <p><b>Phone:</b> {prof.phone}</p>}
        {prof.average_rating != null && (
          <p>
            <b>Avg. Rating:</b> {prof.average_rating.toFixed(2)}
            {prof.review_count != null && ` (${prof.review_count} review${prof.review_count === 1 ? '' : 's'})`}
          </p>
        )}

        <hr style={{ margin:'2rem 0' }}/>

        <button onClick={() => setShowReviews(v => !v)}>
          {showReviews ? 'Hide' : 'Show'} Reviews
        </button>

        {showReviews && (
          <>
            {isLoggedIn ? (
              <form onSubmit={handleCreate} style={{ margin:'2rem 0' }}>
                <h2>Write a Review</h2>
                <select
                  value={newModule}
                  onChange={e => setNewModule(e.target.value)}
                  style={{ width:'100%', padding:'.5rem', marginBottom:'.5rem' }}
                >
                  <option value="">Select module…</option>
                  {moduleOptions}
                </select>
                <input
                  type="number" min={1} max={5} step={0.5}
                  value={newRating}
                  onChange={e => setNewRating(Number(e.target.value))}
                  style={{ width:'100%', padding:'.5rem', marginBottom:'.5rem' }}
                />
                <textarea
                  placeholder="Your review…"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  style={{ width:'100%', padding:'.5rem', height:'80px' }}
                />
                {formError && <div style={{ color:'red' }}>{formError}</div>}
                <button type="submit">Submit Review</button>
              </form>
            ) : (
              <p><Link to="/login">Log in</Link> to write a review.</p>
            )}

            <h2>Reviews for {prof.name}</h2>
            {loading ? (
              <p>Loading reviews…</p>
            ) : error ? (
              <p style={{ color:'red' }}>Error: {error}</p>
            ) : reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : reviews.map(r => (
              <div key={r.id} style={{ borderBottom:'1px solid #ddd', padding:'1rem 0' }}>
                <p style={{ fontStyle:'italic', marginBottom:'.25rem' }}>  <Link
    to={
      user?.username === r.username
        ? '/profile'
        : `/users/${encodeURIComponent(r.username)}`
    }
    style={{ color:'#0077cc', textDecoration:'none' }}
  >
    {r.username}
  </Link></p>

                {editingId === r.id ? (
                  <>
                    <select
                      value={editModule}
                      onChange={e => setEditModule(e.target.value)}
                      style={{ width:'100%', padding:'.5rem', marginBottom:'.25rem' }}
                    >
                      <option value="">Select module…</option>
                      {moduleOptions}
                    </select>
                    <input
                      type="number" min={1} max={5} step={0.5}
                      value={editRating}
                      onChange={e => setEditRating(Number(e.target.value))}
                      style={{ width:'100%', padding:'.5rem', marginBottom:'.25rem' }}
                    />
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      style={{ width:'100%', padding:'.5rem', height:'80px' }}
                    />
                    {editError && <div style={{ color:'red' }}>{editError}</div>}
                    <button onClick={() => handleEdit(r)} style={{ marginRight:'.5rem' }}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <p><b>Module:</b> {r.module_code} — {r.module_name}</p>
                    <p><b>Rating:</b> {r.rating}</p>
                    <p>{r.text}</p>
                    <p style={{ fontSize:'0.85rem', color:'#555' }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </p>
                    <button onClick={() => handleLike(r)} style={{ marginRight:'.5rem' }}>
                      {r.is_liked ? '❤️' : '🤍'} {r.likes_count}
                    </button>
                    {r.can_edit && (
                      <>
                        <button onClick={() => startEdit(r)} style={{ marginRight:'.5rem' }}>Edit</button>
                        <button onClick={() => handleDelete(r)}>Delete</button>
                      </>
                    )}
                  </>
                )}

                <div style={{ marginTop:'.5rem' }}>
                  <button
                    onClick={() => toggleReplies(r.id)}
                    style={{ marginRight:'.5rem' }}
                  >
                    {showReplies[r.id] ? 'Cancel' : `Reply (${r.replies.length})`}
                  </button>
                </div>

                {showReplies[r.id] && (
                  <div style={{ marginLeft:'1rem', marginTop:'.5rem' }}>
                    {isLoggedIn && (
                      <div style={{ marginBottom:'.75rem' }}>
                        <textarea
                          placeholder="Write a reply…"
                          value={replyState[r.id]?.newText || ''}
                          onChange={e => handleReplyText(r.id, e.target.value)}
                          style={{ width:'100%', padding:'.5rem', height:'60px' }}
                        />
                        <button
                          onClick={() => submitReply(r.id)}
                          style={{ marginTop:'.25rem' }}
                        >
                          Post Reply
                        </button>
                      </div>
                    )}

                    {r.replies.length > 0 && r.replies.slice().reverse().map(rep => (
                      <div key={rep.id} style={{
                        borderLeft:'2px solid #eee', padding:'0.5rem'
                      }}>
                        <p style={{ fontStyle:'italic', marginBottom:'.25rem' }}><p style={{ fontStyle:'italic', marginBottom:'.25rem' }}>
  <Link
    to={
      user?.username === rep.username
        ? '/profile'
        : `/users/${encodeURIComponent(rep.username)}`
    }
    style={{ color:'#0077cc', textDecoration:'none' }}
  >
    {rep.username}
  </Link>
</p>
</p>
                        {replyState[r.id]?.editingReplyId === rep.id ? (
                          <>
                            <textarea
                              value={replyState[r.id].editText}
                              onChange={e => setReplyState(s => ({
                                ...s,
                                [r.id]: { ...s[r.id], editText:e.target.value }
                              }))}
                              style={{ width:'100%', padding:'.5rem', height:'60px' }}
                            />
                            {replyState[r.id].editError && (
                              <div style={{ color:'red' }}>{replyState[r.id].editError}</div>
                            )}
                            <button
                              onClick={() => handleReplyEdit(r.id, rep)}
                              style={{ marginRight:'.5rem' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setReplyState(s => ({
                                ...s,
                                [r.id]: { ...s[r.id], editingReplyId:null }
                              }))}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <p>{rep.text}</p>
                            <p style={{ fontSize:'0.8rem', color:'#555' }}>
                              {new Date(rep.timestamp).toLocaleString()}
                            </p>
                            <button
                              onClick={() => handleReplyLike(r.id, rep.id)}
                              style={{ marginRight:'.5rem' }}
                            >
                              {rep.is_liked ? '❤️' : '🤍'} {rep.likes_count}
                            </button>
                            {rep.can_edit && (
                              <>
                                <button
                                  onClick={() => startReplyEdit(r.id, rep)}
                                  style={{ marginRight:'.5rem' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleReplyDelete(r.id, rep.id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
