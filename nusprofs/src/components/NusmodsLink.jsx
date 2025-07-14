import React from "react";

const NusmodsLink = ({ moduleCode, moduleName }) => (
  <a
    href={`https://nusmods.com/courses/${moduleCode}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color:    "#0077cc",
      fontWeight: 600,
      textDecoration: "none",
      display:  "inline",
    }}
  >
    {moduleCode} — {moduleName}
  </a>
);


export default NusmodsLink;
