import React from "react";

const NusmodsLink = ({ moduleCode, moduleName }) => {
  return (
    <p style={{ margin: 0 }}>
      <a
        href={`https://nusmods.com/courses/${moduleCode}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#0070f3", textDecoration: "none" }}
      >
        {moduleCode} — {moduleName}
      </a>
    </p>
  );
};

export default NusmodsLink;
