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
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.9,
            messages: [
              {
                role: "system",
                content:
                  "Tu écris des pitches/synopsis de film drôles, punchy, 100 à 150 mots max. Ton style est clair, visuel et rythmé.",
              },
              { role: "user", content: prompt.slice(0, 2000) },
            ],
          }),
        });

        if (r.ok) {
          const j = await r.json();
          const text = j?.choices?.[0]?.message?.content?.trim();
          if (text) return res.status(200).json({ text });
        } else {
          const errTxt = await r.text();
          console.warn("OpenAI error:", errTxt);
        }
      } catch (e) {
        console.warn("OpenAI fetch failed:", e.message);
      }
    }

    // Fallback si API KO
    const fake = `🎬 FAKE PITCH — ${prompt}\n\nDans un monde absurde, tout dérape : explosions de kebabs, Audi volées, et batailles épiques au Uno. Le destin de l’humanité repose sur ce scénario improbable.`;
    return res.status(200).json({ text: fake });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
