const NTFY_BASE = "https://ntfy.sh";

async function sendNotification({ topic, title, message, tags }) {
  const res = await fetch(`${NTFY_BASE}/${topic}`, {
    method: "POST",
    headers: {
      Title: title,
      Tags: tags,
      Priority: "urgent",
      "Content-Type": "text/plain",
    },
    body: message,
  });

  if (!res.ok) throw new Error(`ntfy error: ${res.status}`);
  console.log(`Notification sent to topic: ${topic}`);
}

module.exports = { sendNotification };
