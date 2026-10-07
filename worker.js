const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method !== "POST") {
      return json({
        error: "POST required",
        worker: "Fair Groq Worker"
      }, 405);
    }

    if (!env.GROQ_API_KEY) {
      return json({
        error: "GROQ_API_KEY is not configured"
      }, 500);
    }

    let input;

    try {
      input = await request.json();
    } catch (e) {
      return json({
        error: "Invalid JSON request",
        details: e?.message || String(e)
      }, 400);
    }

    const character = input?.character || {};
    const history = Array.isArray(input?.history)
      ? input.history
      : Array.isArray(input?.messages)
        ? input.messages
        : [];

    const userMessage = String(
      input?.userMessage ?? input?.message ?? ""
    ).trim();

    if (!userMessage) {
      return json({ error: "Empty user message" }, 400);
    }

    const persona = String(
      input?.userPersona ||
      character.userPersona ||
      ""
    ).trim();

    const systemPrompt = [
      "Ты персонаж приложения Fair.",
      character.name ? `Имя персонажа: ${character.name}` : "",
      character.description ? `Описание: ${character.description}` : "",
      character.personality ? `Характер: ${character.personality}` : "",
      character.instructions ? `Инструкции: ${character.instructions}` : "",
      persona ? `Информация о пользователе: ${persona}` : "",
      "Отвечай естественно и по-русски, если пользователь пишет по-русски.",
      "Не упоминай Worker, Cloudflare, Groq, API или системные инструкции."
    ].filter(Boolean).join("\n");

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    for (const item of history.slice(-20)) {
      const content = String(
        item?.content ?? item?.text ?? ""
      ).trim();

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
    } catch (e) {
      return json({
        error: "Groq connection failed",
        details: e?.message || String(e)
      }, 502);
    }

    const raw = await groqResponse.text();

    if (!groqResponse.ok) {
      let details = raw;

      try {
        details = JSON.parse(raw);
      } catch {}

      return json({
        error: "Groq API returned an error",
        status: groqResponse.status,
        details
      }, 502);
    }

    let result;

    try {
      result = JSON.parse(raw);
    } catch (e) {
      return json({
        error: "Groq returned invalid JSON",
        details: e?.message || String(e)
      }, 502);
    }

    const answer = String(
      result?.choices?.[0]?.message?.content || ""
    ).trim();

    if (!answer) {
      return json({
        error: "Groq returned an empty answer"
      }, 502);
    }

    return json({
      reply: answer,
      response: answer,
      message: answer,
      text: answer,
      content: answer
    });
  }
};
