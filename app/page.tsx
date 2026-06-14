"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("idle");

  async function run() {
    setStatus("running");
    setOutput("Running…");

    try {
      const res = await fetch("/api/run", { method: "POST" });
      const data = await res.json();
      setOutput(data.output || "(no output)");
      setStatus(data.exitCode === 0 ? "success" : "error");
    } catch (err) {
      setOutput(
        "Request failed: " + (err instanceof Error ? err.message : String(err)),
      );
      setStatus("error");
    }
  }

  return (
    <main className={styles.page}>
      <section>
        <h1 className={styles.title}>♻️ Rubbish Day Reminder</h1>
        <p className={styles.subtitle}>
          {/* Auckland Council rubbish collection notifier via ntfy.sh */}
          Auckland Council rubbish collection notifier
        </p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Test run</h2>
        <p className={styles.info}>
          Checks tomorrow's collections for the configured subscription and
          sends a notification if one is due.
        </p>
        <button
          className={styles.button}
          onClick={run}
          disabled={status === "running"}
        >
          {status === "running" ? (
            <>
              <span className={styles.spinner} />
            </>
          ) : (
            "Send Test Notification"
          )}
        </button>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Output</h2>
        <pre
          className={`${styles.console} ${status !== "idle" ? styles[status] : ""}`}
        >
          {output || "Ready."}
        </pre>
      </section>
    </main>
  );
}
