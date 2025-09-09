export default async function handler(req, res) {
  // CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    // Appel OpenAI si possible
    if (process.env.OPENAI_API_KEY) {
      try {
        const r = await fetch("https://api.openai.com/v1/images", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt:
              (prompt || "").slice(0, 1000) +
              " — style affiche pulp/cartoon, drôle, lisible, couleurs vives.",
            size: "1024x1024",
          }),
        });

        if (r.ok) {
          const j = await r.json();
          const url = j?.data?.[0]?.url;
          if (url) return res.status(200).json({ url });
        } else {
          const errTxt = await r.text();
          console.warn("OpenAI error:", errTxt);
        }
      } catch (e) {
        console.warn("OpenAI fetch failed:", e.message);
      }
    }

    // Fallback image si API KO → renvoie une image placeholder
    const placeholder =
      "https://placekitten.com/600/400"; // 🐱 chaton par défaut
    return res.status(200).json({ url: placeholder });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
