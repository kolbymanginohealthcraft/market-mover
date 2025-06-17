import React from "react";

export default function Spinner({ message = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        fontSize: "1.5rem",
        color: "#1DADBE",
      }}
    >
      <div className="loader" />
      {message}
      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1DADBE;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          margin-right: 10px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
