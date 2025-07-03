import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const API_BASE = "https://nusprofs-api.onrender.com";

function StarDisplay({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if      (value >= i)       stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else                       stars.push(<FaRegStar key={i} />);
  }
  return <span style={{ color: "#ffb400", fontSize: "1rem" }}>{stars}</span>;
}

function ModuleDropdown({ modules, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedModule = modules.find(m => m.module_code === value);

  return (
    <div
      ref={ref}
      style={{
        position:    "relative",
        width:       "100%",
        marginBottom: "2rem"
      }}
    >
      <label htmlFor="mod-dd" style={{ display: "block", marginBottom: "0.5rem" }}>
        Select module:
      </label>
      <div
        id="mod-dd"
        onClick={() => setOpen(o => !o)}
        style={{
          width:         "100%",
          padding:       "0.5rem",
          border:        "1px solid #ccc",
          borderRadius:  4,
          cursor:        "pointer",
          whiteSpace:    "nowrap",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          background:    "#fff"
        }}
      >
        {selectedModule
          ? `${selectedModule.module_code} — ${selectedModule.name}`
          : "—"}
      </div>

      {open && (
        <ul
          style={{
            position:      "absolute",
            top:           "100%",
            left:          0,
            width:         "100%",
            maxHeight:     400,
            margin:        0,
            padding:       0,
            listStyle:     "none",
            border:        "1px solid #ccc",
            borderRadius:  4,
            background:    "#fff",
            overflowY:     "auto",
            zIndex:        1000
          }}
        >
          {modules.map(m => (
            <li
              key={m.module_code}
              onClick={() => {
                onChange(m.module_code);
                setOpen(false);
              }}
              style={{
                padding:       "0.5rem",
                cursor:        "pointer",
                whiteSpace:    "nowrap",
                overflow:      "hidden",
                textOverflow:  "ellipsis"
              }}
              title={`${m.module_code} — ${m.name}`}
            >
              {m.module_code} — {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CompareProfessors() {
  const [modules,     setModules]     = useState([]);
  const [selected,    setSelected]    = useState("");
  const [compareData, setCompareData] = useState(null);
  const [loadingMods, setLoadingMods] = useState(false);
  const [errorMods,   setErrorMods]   = useState("");
  const [loadingComp, setLoadingComp] = useState(false);
  const [errorComp,   setErrorComp]   = useState("");

  useEffect(() => {
    setLoadingMods(true);
    fetch(`${API_BASE}/professors/modules`, {
      headers: { Accept: "application/json" }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => {
        setModules(data);
        if (data.length) setSelected(data[0].module_code);
      })
      .catch(() => setErrorMods("Couldn’t load modules."))
      .finally(() => setLoadingMods(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingComp(true);
    setErrorComp("");
    fetch(`${API_BASE}/professors/modules/${selected}/compare`, {
      headers: { Accept: "application/json" }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => setCompareData(data))
      .catch(() => setErrorComp("Couldn’t load comparison."))
      .finally(() => setLoadingComp(false));
  }, [selected]);

  const semesters = compareData?.semesters ?? {};

  const headingText = selected
    ? `${selected} — ${modules.find(m => m.module_code === selected)?.name || ""}`
    : "";

  return (
    <div style={{
      minHeight:       "100vh",
      backgroundColor: "#f0fcff",
      padding:         "2rem",
      fontFamily:      "Arial, sans-serif",
      color:           "#000"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Compare Professors
      </h1>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {loadingMods ? (
          <p>Loading modules…</p>
        ) : errorMods ? (
          <p style={{ color: "red" }}>{errorMods}</p>
        ) : (
          <ModuleDropdown
            modules={modules}
            value={selected}
            onChange={setSelected}
          />
        )}

        {headingText && (
          <h2 style={{ textAlign: "center", margin: "1rem 0" }}>
            {headingText}
          </h2>
        )}

        {loadingComp ? (
          <p>Loading comparison…</p>
        ) : errorComp ? (
          <p style={{ color: "red" }}>{errorComp}</p>
        ) : (
          (() => {
            const entries = Object.entries(semesters);
            if (entries.length === 0) {
              return (
                <p style={{ textAlign: "center", margin: "2rem 0" }}>
                  No information available.
                </p>
              );
            }
            return (
              <div
                style={{
                  display:      "flex",
                  flexWrap:     "wrap",
                  gap:          "2rem",
                  marginBottom: "2rem"
                }}
              >
                {entries.map(([semester, profList]) => (
                  <div
                    key={semester}
                    style={{ flex: "1 1 45%", minWidth: 250 }}
                  >
                    <h3 style={{ margin: "0.5rem 0" }}>{semester}</h3>
                    {profList.length === 0 ? (
                      <p style={{ fontStyle: "italic" }}>
                        No professors found this semester.
                      </p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {profList.map(p => (
                          <li
                            key={p.prof_id}
                            style={{
                              padding:      "1rem 0",
                              borderBottom: "1px solid #eee"
                            }}
                          >
                            <h4 style={{ margin: "0 0 0.25rem" }}>
                              <Link
                                to={`/professor/${p.prof_id}`}
                                style={{
                                  color:          "#0077cc",
                                  textDecoration: "none"
                                }}
                              >
                                {p.name}
                              </Link>
                            </h4>
                            <p style={{
                              margin:   "0.25rem 0",
                              fontSize: "0.9rem"
                            }}>
                              <strong>Title:</strong> {p.title || "—"}<br/>
                              <strong>Faculty:</strong> {p.faculty || "—"}<br/>
                              <strong>Dept:</strong>    {p.department || "—"}<br/>
                              <strong>Rating:</strong>{" "}
                              {p.average_rating != null ? (
                                <>
                                  <StarDisplay value={p.average_rating}/>
                                  <span style={{
                                    marginLeft:    "0.5rem",
                                    fontWeight:    "bold",
                                    verticalAlign: "middle"
                                  }}>
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
                    )}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
