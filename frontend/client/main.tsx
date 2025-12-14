import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id='root' not found in HTML");
}

ReactDOM.createRoot(rootElement).render(

    <App />

);
