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
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sel = modules.find(m => m.module_code === value);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>Module:</label>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "0.5rem",
          border: "1px solid #ccc",
          borderRadius: 4,
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: "#fff"
        }}
      >
        {sel ? `${sel.module_code} — ${sel.name}` : "—"}
      </div>
      {open && (
        <ul style={{
          position: "absolute",
          top: "100%",
          left: 0,
          width: "100%",
          maxHeight: 200,
          margin: 0,
          padding: 0,
          listStyle: "none",
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "#fff",
          overflowY: "auto",
          zIndex: 1000
        }}>
          {modules.map(m => (
            <li
              key={m.module_code}
              onClick={() => { onChange(m.module_code); setOpen(false); }}
              style={{
                padding: "0.5rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
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

function YearDropdown({ options, value, onChange }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>Year:</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "#fff",
          cursor: "pointer"
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CompareProfessors() {
  const [modules, setModules] = useState([]);
  const [allAYs,  setAllAYs]  = useState([]);

  const [selMod,  setSelMod]  = useState("");
  const [selYear, setSelYear] = useState("");

  const [data,    setData]    = useState(null);

  const [loading, setLoading] = useState({
    mods: false,
    yrs:  false,
    comp: false
  });
  const [error,   setError]   = useState({
    mods: "",
    yrs:  "",
    comp: ""
  });

  useEffect(() => {
    setLoading(l => ({ ...l, mods: true, yrs: true }));
    Promise.all([
      fetch(`${API_BASE}/professors/modules`),
      fetch(`${API_BASE}/professors/academic-years`)
    ])
      .then(async ([rm, ry]) => {
        if (!rm.ok) throw new Error("mods");
        if (!ry.ok) throw new Error("yrs");
        const modules = await rm.json();
        const yrsJson = await ry.json();
        setModules(modules);
        if (modules.length) setSelMod(modules[0].module_code);

        const ayOpts = yrsJson.academic_years.map(x => ({
          label: x.label,
          value: String(x.value)
        }));
        setAllAYs(ayOpts);
        if (ayOpts.length) setSelYear(ayOpts[0].value);
      })
      .catch(err => {
        setError(e => ({
          ...e,
          [err.message]: `Failed loading ${err.message === "mods" ? "modules" : "years"}.`
        }));
      })
      .finally(() => setLoading(l => ({ ...l, mods: false, yrs: false })));
  }, []);

  useEffect(() => {
    if (!selMod || !selYear) return;

    setLoading(l => ({ ...l, comp: true }));
    setError(e => ({ ...e, comp: "" }));

    fetch(`${API_BASE}/professors/modules/${selMod}/compare/${selYear}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setData(json))
      .catch(() => setError(e => ({ ...e, comp: "Couldn’t load comparison." })))
      .finally(() => setLoading(l => ({ ...l, comp: false })));
  }, [selMod, selYear]);

  const semGroups = data?.semesters ?? [];
  const heading   = selMod
    ? `${selMod} — ${modules.find(m => m.module_code === selMod)?.name || ""}`
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

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {loading.mods
          ? <p>Loading modules…</p>
          : error.mods
            ? <p style={{ color: "red" }}>{error.mods}</p>
            : <ModuleDropdown
                modules={modules}
                value={selMod}
                onChange={setSelMod}
              />
        }

        {loading.yrs
          ? <p>Loading years…</p>
          : error.yrs
            ? <p style={{ color: "red" }}>{error.yrs}</p>
            : <YearDropdown
                options={allAYs}
                value={selYear}
                onChange={setSelYear}
              />
        }

        {heading && (
          <h2 style={{ textAlign: "center", margin: "1.5rem 0" }}>
            {heading} ({allAYs.find(y => y.value === selYear)?.label})
          </h2>
        )}

        {loading.comp
          ? <p>Loading comparison…</p>
          : error.comp
            ? <p style={{ color: "red" }}>{error.comp}</p>
            : (() => {
                const entries = Object.entries(semGroups);
                if (!entries.length) {
                  return <p style={{ textAlign: "center", margin: "2rem 0" }}>No data.</p>;
                }
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                    {entries.map(([sem, profs]) => (
                      <div key={sem} style={{ flex: "1 1 45%", minWidth: 250 }}>
                        <h3 style={{ margin: "0.5rem 0" }}>{sem}</h3>
                        {profs.length === 0
                          ? <p style={{ fontStyle: "italic" }}>No professors.</p>
                          : <ul style={{ listStyle: "none", padding: 0 }}>
                              {profs.map(p => (
                                <li key={p.prof_id} style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}>
                                  <h4 style={{ margin: "0 0 .25rem" }}>
                                    <Link
                                      to={`/professor/${p.prof_id}`}
                                      style={{ color: "#0077cc", textDecoration: "none" }}
                                    >
                                      {p.name}
                                    </Link>
                                  </h4>
                                  <p style={{ margin: ".25rem 0", fontSize: ".9rem" }}>
                                    <strong>Title:</strong> {p.title || "—"}<br/>
                                    <strong>Faculty:</strong> {p.faculty || "—"}<br/>
                                    <strong>Dept:</strong> {p.department || "—"}<br/>
                                    <strong>Rating:</strong>{" "}
                                    {p.average_rating != null
                                      ? <>
                                          <StarDisplay value={p.average_rating}/>
                                          <span style={{ marginLeft: "0.5rem", fontWeight: "bold" }}>
                                            {p.average_rating.toFixed(2)}
                                          </span>
                                        </>
                                      : "No reviews yet"
                                    }
                                  </p>
                                </li>
                              ))}
                            </ul>
                        }
                      </div>
                    ))}
                  </div>
                );
              })()
        }
      </div>
    </div>
  );
}
