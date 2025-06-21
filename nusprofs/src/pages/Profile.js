import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
  FaHeart,
  FaRegHeart
} from 'react-icons/fa';

const API_URL = 'https://nusprofs-api.onrender.com';

const IconBtn = ({ children, onClick, title, style, type = "button", ...props }) => (
  <button
    type={type}
    onClick={onClick}
    title={title}
    style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '2.4rem',
      height:         '2.4rem',
      fontSize:       '1.2rem',
      marginRight:    '8px',
      padding:        0,
      ...style
    }}
    {...props}
  >
    {children}
  </button>
);

function StarRating({ value, onChange }) {
  return (
    <div>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={onChange ? () => onChange(i) : undefined}
          style={{
            cursor:    onChange ? 'pointer' : 'default',
            fontSize:  '1.2rem',
            color:     '#ffb400',
            marginRight:'4px'
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
    if (value >= i)            stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else                       stars.push(<FaRegStar key={i} />);
  }
  return (
    <span
      style={{
        color:         '#ffb400',
        fontSize:      '1.2rem',
        verticalAlign: 'middle'
      }}
    >
      {stars}
    </span>
  );
}

export default function Profile() {
  const { id } = useParams();
  const nav    = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext);

  const [prof, setProf]               = useState(null);
  const [loadingProf, setLoadingProf] = useState(true);
  const [errorProf, setErrorProf]     = useState('');
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const [newModule, setNewModule] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText]     = useState('');
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId]   = useState(null);
  const [editModule, setEditModule] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText]     = useState('');
  const [editError, setEditError]   = useState('');

  const [replyState, setReplyState]       = useState({});
  const [showForm, setShowForm]           = useState(false);
  const [showReplies, setShowReplies]     = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});

  function parseMentions(text) {
    return text.split(/(@[A-Za-z0-9_]+)/g).map((part,i) =>
      part.startsWith('@')
        ? <Link
            key={i}
            to={`/users/${encodeURIComponent(part.slice(1))}`}
            style={{ color:'#000', fontWeight:'bold', textDecoration:'none' }}
          >{part}</Link>
        : part
    );
  }

  useEffect(() => {
    setLoadingProf(true);
    fetch(`${API_URL}/professor/${id}`, { headers:{Accept:'application/json'} })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setProf)
      .catch(e=>setErrorProf(e.toString()))
      .finally(()=>setLoadingProf(false));
  }, [id]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rv = await getReviewsForProfessor(id);
      const withReplies = await Promise.all(
        rv.map(async r => ({ ...r, replies: await getReplies(r.id) }))
      );
      setReviews(withReplies);

      // 👉 use "professors" here, not "professor"
      const sumRes = await fetch(
        `${API_URL}/professors/${id}/review_summary`,
        { headers:{Accept:'application/json'} }
      );
      if (!sumRes.ok) throw new Error(sumRes.statusText);
      const { average_rating, review_count } = await sumRes.json();
      setProf(p => ({ ...p, average_rating, review_count }));

      setError('');
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload() }, [reload]);

  const handleCreate = async e => {
    e.preventDefault();
    if (!newModule) return setFormError('Module code required');
    if (!newText)   return setFormError('Review text required');
    setFormError('');
    try {
      await createReview({ prof_id:id, module_code:newModule, text:newText, rating:newRating });
      setNewModule(''); setNewRating(5); setNewText('');
      await reload();
    } catch(e){ setFormError(e.message) }
  };

  const startEditReview = r => {
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
      await editReview(r.id, { module_code:editModule, text:editText, rating:editRating });
      setEditingId(null);
      await reload();
    } catch(e){ setEditError(e.message) }
  };

  const handleDelete = async r => {
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(r.id);
    await reload();
  };

  const handleLike = async r => {
    if (!isLoggedIn) {
      nav('/login');
      return;
    }
    await likeReview(r.id);
    setReviews(rs => rs.map(x =>
      x.id === r.id
        ? { ...x,
            is_liked: !x.is_liked,
            likes_count: x.is_liked ? x.likes_count-1 : x.likes_count+1 }
        : x
    ));
  };

  const initReply = rid => {
    if (!replyState[rid]) {
      setReplyState(s => ({
        ...s,
        [rid]: {
          newText:        '',
          newError:       '',
          editingReplyId: null,
          editText:       '',
          editError:      '',
          replyToId:      null
        }
      }));
    }
  };

  const handleReplyText = (rid, txt) => {
    initReply(rid);
    setReplyState(s => ({ ...s, [rid]: { ...s[rid], newText: txt } }));
  };

  const submitReply = async rid => {
    if (!isLoggedIn) {
      nav('/login');
      return;
    }
    const rs = replyState[rid] || {};
    if (!rs.newText) {
      return setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], newError: 'Reply cannot be empty' }
      }));
    }
    try {
      await createReply(rid, rs.newText, rs.replyToId);
      const updated = await getReplies(rid);
      setReviews(prev => prev.map(x =>
        x.id === rid ? { ...x, replies: updated } : x
      ));
      setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], newText:'', replyToId:null, newError:'' }
      }));
      setShowReplyForm(f => ({ ...f, [rid]: false }));
      setShowReplies(f => ({ ...f, [rid]: true }));
    } catch(e) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], newError: e.message }
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
        editText:       rep.text,
        editError:      ''
      }
    }));
  };

  const handleReplyEdit = async (rid, rep) => {
    if (!isLoggedIn) {
      nav('/login');
      return;
    }
    const rs = replyState[rid] || {};
    if (!rs.editText) {
      return setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], editError: 'Text required' }
      }));
    }
    try {
      await editReply(rep.id, { text: rs.editText });
      const updated = await getReplies(rid);
      setReviews(prev => prev.map(x =>
        x.id === rid ? { ...x, replies: updated } : x
      ));
      setReplyState(s => ({
        ...s,
        [rid]: {
          ...s[rid],
          editingReplyId: null,
          editText:       '',
          editError:      ''
        }
      }));
    } catch(e) {
      setReplyState(s => ({
        ...s,
        [rid]: { ...s[rid], editError: e.message }
      }));
    }
  };

  const handleReplyDelete = async (rid, repId) => {
    if (!isLoggedIn) {
      nav('/login');
      return;
    }
    if (!window.confirm('Delete this reply?')) return;
    await deleteReply(repId);
    const updated = await getReplies(rid);
    setReviews(prev => prev.map(x =>
      x.id === rid ? { ...x, replies: updated } : x
    ));
  };

  const handleReplyLike = async (rid, repId) => {
    if (!isLoggedIn) {
      nav('/login');
      return;
    }
    await likeReply(repId);
    setReviews(prev => prev.map(x => {
      if (x.id !== rid) return x;
      return {
        ...x,
        replies: x.replies.map(rp =>
          rp.id === repId
            ? { ...rp,
                is_liked: !rp.is_liked,
                likes_count: rp.is_liked ? rp.likes_count-1 : rp.likes_count+1 }
            : rp
        )
      };
    }));
  };

  const toggleReplies = rid => {
    setShowReplies(s => ({ ...s, [rid]: !s[rid] }));
  };

  const startNestedReply = (rid, rep) => {
    initReply(rid);
    setShowReplyForm(f => ({ ...f, [rid]: true }));
    setReplyState(s => ({
      ...s,
      [rid]: {
        ...s[rid],
        newText:   `@${rep.username} `,
        replyToId: rep.id,
        newError:  ''
      }
    }));
    // 👉 scroll the reply form into view
    setTimeout(() => {
      const el = document.getElementById(`reply-form-${rid}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (loadingProf) return <p>Loading professor…</p>;
  if (errorProf)   return <p style={{ color:'red' }}>Error: {errorProf}</p>;
  if (!prof)       return null;

  const modules = Array.from(
    new Map((prof.teaching||[]).map(t => [t.module_code, t])).values()
  );
  const moduleOptions = modules.map(m => (
    <option key={m.module_code} value={m.module_code}>
      {m.module_code} — {m.module_name}
    </option>
  ));

  return (
    <div style={{ padding:'2rem', background:'#f0fcff', minHeight:'100vh' }}>
      <div style={{
        maxWidth:'700px',
        margin:'0 auto',
        padding:'1.5rem',
        background:'#fff',
        borderRadius:8,
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
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
            <b>Avg. Rating:</b>{' '}
            <StarDisplay value={prof.average_rating}/>
            <span style={{
              marginLeft:'0.5rem',
              fontWeight:'bold',
              verticalAlign:'middle'
            }}>
              {prof.average_rating.toFixed(2)}
            </span>{' '}
            <span style={{ marginLeft:'0.5rem', color:'#555' }}>
              ({prof.review_count} review{prof.review_count===1?'':'s'})
            </span>
          </p>
        )}

        <hr style={{ margin:'2rem 0' }}/>

        <button onClick={() => setShowForm(f => !f)}>
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>

        {showForm && (
          isLoggedIn ? (
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
              <StarRating value={newRating} onChange={setNewRating}/>
              <textarea
                placeholder="Your review…"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                style={{
                  width:'100%',
                  padding:'.5rem',
                  height:'80px',
                  marginTop:'.5rem'
                }}
              />
              {formError && <div style={{ color:'red' }}>{formError}</div>}
              <IconBtn type="submit" title="Submit review">
                <FaPaperPlane/>
              </IconBtn>
            </form>
          ) : (
            <p>
              <Link to="/login">Log in</Link> to write a review.
            </p>
          )
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
            <Link
              to={isLoggedIn
                ? (user.username === r.username
                    ? '/profile'
                    : `/users/${encodeURIComponent(r.username)}`)
                : '/login'
              }
              style={{
                color:'#0077cc',
                fontWeight:'bold',
                textDecoration:'none'
              }}
            >
              {r.username}
            </Link>

            {editingId === r.id ? (
              <>
                <select
                  value={editModule}
                  onChange={e => setEditModule(e.target.value)}
                  style={{ width:'100%', padding:'.5rem', margin:'.5rem 0' }}
                >
                  <option value="">Select module…</option>
                  {moduleOptions}
                </select>
                <StarRating value={editRating} onChange={setEditRating}/>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width:'100%',
                    padding:'.5rem',
                    height:'80px',
                    margin:'.5rem 0'
                  }}
                />
                {editError && <div style={{ color:'red' }}>{editError}</div>}
                <IconBtn onClick={() => handleEdit(r)} title="Save">
                  <FaCheck/>
                </IconBtn>
                <IconBtn onClick={() => setEditingId(null)} title="Cancel">
                  <FaTimes/>
                </IconBtn>
              </>
            ) : (
              <>
                <p><b>Module:</b> {r.module_code} — {r.module_name}</p>
                <StarRating value={r.rating}/>
                <p style={{ margin:'.5rem 0' }}>{r.text}</p>
                <small style={{ color:'#555' }}>
                  {new Date(r.timestamp).toLocaleString()}
                </small>
                <div style={{ marginTop:'.5rem' }}>
                  <IconBtn
                    onClick={() => handleLike(r)}
                    title={r.is_liked ? 'Unlike' : 'Like'}
                    style={{ color:r.is_liked?'red':'inherit', width:'3rem' }}
                  >
                    {r.is_liked ? <FaHeart/> : <FaRegHeart/>}
                    <span style={{
                      marginLeft:'6px',
                      fontSize:'1rem'
                    }}>
                      {r.likes_count}
                    </span>
                  </IconBtn>
                  {r.can_edit && (
                    <>
                      <IconBtn onClick={() => startEditReview(r)} title="Edit">
                        <FaEdit/>
                      </IconBtn>
                      <IconBtn onClick={() => handleDelete(r)} title="Delete">
                        <FaTrashAlt/>
                      </IconBtn>
                    </>
                  )}
                </div>
              </>
            )}

            <div style={{ marginTop:'.5rem' }}>
              <button
                onClick={() => setShowReplyForm(f => ({ ...f, [r.id]: !f[r.id] }))}
                style={{
                  display:'inline-flex',
                  alignItems:'center',
                  marginRight:'8px'
                }}
              >
                {showReplyForm[r.id] ? <FaTimes/> : <FaReply />}
                <span style={{ marginLeft:'4px' }}>
                  {showReplyForm[r.id] ? 'Cancel' : 'Reply'}
                </span>
              </button>
              <button
                onClick={() => toggleReplies(r.id)}
                style={{ display:'inline-flex', alignItems:'center' }}
              >
                {showReplies[r.id] ? <FaChevronUp/> : <FaChevronDown/>}
                <span style={{ marginLeft:'4px' }}>
                  {showReplies[r.id]
                    ? `Hide Replies (${r.replies.length})`
                    : `View Replies (${r.replies.length})`}
                </span>
              </button>
            </div>

            {showReplyForm[r.id] && (
              isLoggedIn ? (
                <div
                  id={`reply-form-${r.id}`}
                  style={{ margin:'8px 0 0 24px' }}
                >
                  <textarea
                    placeholder="Write a reply…"
                    value={replyState[r.id]?.newText||''}
                    onChange={e => handleReplyText(r.id, e.target.value)}
                    style={{ width:'100%', padding:'8px', height:'60px' }}
                  />
                  {replyState[r.id]?.newError && (
                    <div style={{ color:'red', marginTop:'4px' }}>
                      {replyState[r.id].newError}
                    </div>
                  )}
                  <IconBtn onClick={() => submitReply(r.id)} title="Post reply">
                    <FaPaperPlane/>
                  </IconBtn>
                </div>
              ) : (
                <p style={{ marginLeft:'1rem' }}>
                  <Link to="/login">Log in</Link> to write a reply.
                </p>
              )
            )}

            {showReplies[r.id] && (
              <div style={{ margin:'12px 0 0 24px' }}>
                {r.replies.map(rep => (
                  replyState[r.id]?.editingReplyId === rep.id ? (
                    <div key={rep.id} style={{ marginBottom:'8px' }}>
                      <textarea
                        value={replyState[r.id]?.editText||''}
                        onChange={e => setReplyState(s => ({
                          ...s,
                          [r.id]: { ...s[r.id], editText: e.target.value }
                        }))}
                        style={{ width:'100%', padding:'8px', height:'60px' }}
                      />
                      {replyState[r.id]?.editError && (
                        <div style={{ color:'red', marginTop:'4px' }}>
                          {replyState[r.id].editError}
                        </div>
                      )}
                      <IconBtn onClick={() => handleReplyEdit(r.id, rep)} title="Save">
                        <FaCheck/>
                      </IconBtn>
                      <IconBtn onClick={() => setReplyState(s => ({
                        ...s,
                        [r.id]: {
                          ...s[r.id],
                          editingReplyId: null,
                          editText:       '',
                          editError:      ''
                        }
                      }))} title="Cancel">
                        <FaTimes/>
                      </IconBtn>
                    </div>
                  ) : (
                    <div key={rep.id} style={{ borderLeft:'2px solid #eee', padding:'8px' }}>
                      <Link
                        to={isLoggedIn
                          ? (user.username === rep.username
                              ? '/profile'
                              : `/users/${encodeURIComponent(rep.username)}`)
                          : '/login'
                        }
                        style={{
                          color:'#0077cc',
                          fontWeight:'bold',
                          textDecoration:'none'
                        }}
                      >
                        {rep.username}
                      </Link>
                      <p style={{ margin:'4px 0' }}>
                        {parseMentions(rep.text)}
                      </p>
                      <small style={{ color:'#555' }}>
                        {new Date(rep.timestamp).toLocaleString()}
                      </small>
                      <div style={{ marginTop:'4px' }}>
                        <IconBtn
                          onClick={() => handleReplyLike(r.id, rep.id)}
                          title={rep.is_liked ? 'Unlike' : 'Like'}
                          style={{ color:rep.is_liked?'red':'inherit', width:'3rem' }}
                        >
                          {rep.is_liked ? <FaHeart/> : <FaRegHeart/>}
                          <span style={{
                            marginLeft:'6px',
                            fontSize:'1rem'
                          }}>
                            {rep.likes_count}
                          </span>
                        </IconBtn>
                        <IconBtn onClick={() => startNestedReply(r.id, rep)} title="Reply">
                          <FaReply/>
                        </IconBtn>
                        {rep.can_edit && (
                          <>
                            <IconBtn onClick={() => startReplyEdit(r.id, rep)} title="Edit">
                              <FaEdit/>
                            </IconBtn>
                            <IconBtn onClick={() => handleReplyDelete(r.id, rep.id)} title="Delete">
                              <FaTrashAlt/>
                            </IconBtn>
                          </>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
