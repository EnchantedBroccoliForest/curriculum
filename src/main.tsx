import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./App";
import { bootstrapFromRepo } from "./store";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

async function start() {
  await bootstrapFromRepo();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  }
}
void start();
