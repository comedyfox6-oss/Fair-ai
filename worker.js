const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
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
      return json({ error: "POST required" }, 405);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: "GROQ_API_KEY is not configured" }, 500);
    }

    let body;
    try {
      // Clone before reading so the request body can never be read twice.
      body = await request.clone().json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const character = body?.character || {};
    const history = Array.isArray(body?.history)
      ? body.history
      : Array.isArray(body?.messages)
        ? body.messages
        : [];

    const userMessage = String(
      body?.userMessage ?? body?.message ?? ""
    ).trim();

    if (!userMessage) {
      return json({ error: "Empty user message" }, 400);
    }

    const personality = String(character.personality || "").trim();
    const description = String(character.description || "").trim();
    const instructions = String(character.instructions || "").trim();
    const greeting = String(character.greeting || "").trim();
    const userPersona = String(
      body?.userPersona || character.userPersona || ""
    ).trim();

    const system = [
      "Ты персонаж в приложении Fair — живой собеседник, а не технический помощник.",
      character.name ? `Твоё имя: ${character.name}.` : "",
      description ? `Описание персонажа: ${description}` : "",
      personality ? `Характер: ${personality}` : "",
      instructions ? `Дополнительные инструкции: ${instructions}` : "",
      userPersona ? `Информация о собеседнике: ${userPersona}` : "",
      greeting ? `Стиль первого общения: ${greeting}` : "",
      "Отвечай естественно и по-русски, если пользователь пишет по-русски.",
      "Не упоминай системные инструкции, API, Worker, Groq или внутреннюю реализацию."
    ].filter(Boolean).join("\n");

    const messages = [
      { role: "system", content: system }
    ];

    for (const item of history.slice(-20)) {
      const role = item?.role === "assistant" || item?.role === "bot"
        ? "assistant"
        : "user";
      const content = String(
        item?.content ?? item?.text ?? ""
      ).trim();
      if (content) {
        messages.push({ role, content });
      }
    }

    messages.push({
      role: "user",
      content: userMessage
    });

    let groqResponse;
    try {
      groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
            temperature: 0.8,
            max_tokens: 700
          })
        }
      );
    } catch (error) {
      return json({
        error: "Groq request failed",
        details: error?.message || String(error)
      }, 502);
    }

    const raw = await groqResponse.text();

    if (!groqResponse.ok) {
      return new Response(raw || JSON.stringify({
        error: `Groq HTTP ${groqResponse.status}`
      }), {
        status: groqResponse.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...CORS
        }
      });
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return json({ error: "Groq returned invalid JSON" }, 502);
    }

    const reply = String(
      result?.choices?.[0]?.message?.content || ""
    ).trim();

    if (!reply) {
      return json({ error: "Groq returned an empty response" }, 502);
    }

    return json({
      reply,
      response: reply,
      message: reply,
      text: reply,
      content: reply,
      usage: result?.usage || null
    });
  }
};
