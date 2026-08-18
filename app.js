/* =====================================================
   AI — CLOUDFLARE WORKER
   ===================================================== */

const AI_WORKER_URL =
  "https://summer-heart-97c3.comedyfox6.workers.dev/";


/* =====================================================
   SEND MESSAGE
   ===================================================== */

$("sendMessage")?.addEventListener(
  "click",
  sendMessage
);


$("chatInput")?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


async function sendMessage() {

  if (!currentCharacter) {
    return;
  }


  const input =
    $("chatInput");


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  /* Не даём отправить несколько сообщений
     одновременно */

  if (input.disabled) {
    return;
  }


  input.value = "";


  if (
    !data.chats[
      currentCharacter.id
    ]
  ) {

    data.chats[
      currentCharacter.id
    ] = [];

  }


  /* Сообщение пользователя */

  const userMessage = {

    role: "user",

    content: text,

    time: Date.now()

  };


  data.chats[
    currentCharacter.id
  ].push(
    userMessage
  );


  addMessage(
    "user",
    text
  );


  saveData();

  renderRecentChats();


  /* Показываем состояние загрузки */

  input.disabled = true;

  const sendButton =
    $("sendMessage");


  if (sendButton) {
    sendButton.disabled = true;
  }


  const loadingMessage =
    document.createElement("div");


  loadingMessage.className =
    "message bot";


  loadingMessage.textContent =
    "Печатает…";


  $("chatMessages")
    ?.appendChild(
      loadingMessage
    );


  const messages =
    data.chats[
      currentCharacter.id
    ] || [];


  try {

    /*
      Передаём Worker-у:

      - персонажа
      - его характер
      - инструкции
      - персону пользователя
      - приветствие
      - историю переписки
    */

    const response =
      await fetch(
        AI_WORKER_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              character: {

                name:
                  currentCharacter.name,

                gender:
                  currentCharacter.gender,

                personality:
                  currentCharacter.personality,

                instructions:
                  currentCharacter.instructions,

                greeting:
                  currentCharacter.greeting,

                userPersona:
                  currentCharacter.userPersona

              },

              messages:

                messages.map(
                  message => ({
                    role:
                      message.role,
                    content:
                      message.content
                  })
                ),

              message: text

            })

          }
        }
      );


    /*
      Если Worker вернул ошибку —
      показываем её нормально,
      а не молча ломаем чат.
    */

    if (!response.ok) {

      throw new Error(
        `Worker HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    /*
      Поддерживаем несколько распространённых
      вариантов ответа Worker-а.
    */

    const reply =
      result.reply ||
      result.response ||
      result.content ||
      result.message ||
      result.text;


    if (
      !reply ||
      typeof reply !== "string"
    ) {

      console.error(
        "Неожиданный ответ Worker:",
        result
      );

      throw new Error(
        "Worker не вернул текст ответа."
      );

    }


    /* Убираем «Печатает…» */

    loadingMessage.remove();


    /* Сохраняем ответ персонажа */

    data.chats[
      currentCharacter.id
    ].push({

      role: "bot",

      content: reply,

      time: Date.now()

    });


    addMessage(
      "bot",
      reply
    );


    saveData();

    renderRecentChats();


  } catch (error) {

    console.error(
      "Fair AI error:",
      error
    );


    loadingMessage.textContent =
      "Не удалось получить ответ от персонажа 😭";


    /*
      Сообщение пользователя уже сохранено.
      Ошибку отдельно в историю не записываем.
    */

  } finally {

    input.disabled = false;


    if (sendButton) {
      sendButton.disabled = false;
    }


    input.focus();

  }

}
