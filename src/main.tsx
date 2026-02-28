import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 開発中のエラーを画面に表示
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
