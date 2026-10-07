const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== "POST") {
      return reply({ error: "POST required" }, 405);
    }

    const key = env.GROQ_API_KEY;
    if (!key) {
      return reply({ error: "GROQ_API_KEY is missing" }, 500);
    }

    // Read the incoming request body exactly once.
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return reply({
        error: "Invalid JSON body",
        details: error?.message || String(error)
      }, 400);
    }

    const character = data?.character || {};
    const history = Array.isArray(data?.history)
      ? data.history
      : Array.isArray(data?.messages)
        ? data.messages
        : [];

    const userMessage = String(
      data?.userMessage ?? data?.message ?? ""
    ).trim();

    if (!userMessage) {
      return reply({ error: "Empty user message" }, 400);
    }

    const systemParts = [
      "Ты персонаж в приложении Fair — живой собеседник, а не технический помощник.",
      character.name ? `Твоё имя: ${character.name}.` : "",
      character.description ? `Описание: ${character.description}` : "",
      character.personality ? `Характер: ${character.personality}` : "",
      character.instructions ? `Инструкции: ${character.instructions}` : "",
      data?.userPersona || character.userPersona
        ? `О собеседнике: ${data.userPersona || character.userPersona}`
        : "",
      "Отвечай естественно. Если пользователь пишет по-русски — отвечай по-русски.",
      "Не упоминай API, Worker, Groq или внутреннюю реализацию."
    ];

    const messages = [
      {
        role: "system",
        content: systemParts.filter(Boolean).join("\n")
      }
    ];

    for (const item of history.slice(-20)) {
      const content = String(item?.content ?? item?.text ?? "").trim();
      if (!content) continue;

      messages.push({
        role:
          item?.role === "assistant" || item?.role === "bot"
            ? "assistant"
            : "user",
        content
      });
    }

    messages.push({
      role: "user",
      content: userMessage
    });

    let groq;
    try {
      groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.8,
          max_tokens: 700
        })
      });
    } catch (error) {
      return reply({
        error: "Failed to reach Groq",
        details: error?.message || String(error)
      }, 502);
    }

    // Read Groq's response body exactly once.
    const raw = await groq.text();

    if (!groq.ok) {
      let errorData;
      try {
        errorData = JSON.parse(raw);
      } catch {
        errorData = { raw };
      }

      return reply({
        error: "Groq API error",
        status: groq.status,
        details: errorData
      }, 502);
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch (error) {
      return reply({
        error: "Groq returned invalid JSON",
        details: error?.message || String(error)
      }, 502);
    }

    const text = String(
      result?.choices?.[0]?.message?.content || ""
    ).trim();

    if (!text) {
      return reply({
        error: "Groq returned an empty reply"
      }, 502);
    }

    return reply({
      reply: text,
      response: text,
      message: text,
      text,
      content: text,
      usage: result?.usage || null
    });
  }
};
