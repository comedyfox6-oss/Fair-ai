/* =====================================================
   FAIR — APP.JS
   ===================================================== */

const STORAGE_KEY = "fair_data_v1";
const THEME_KEY = "fair_theme_v1";

const defaultData = {
  user: {
    name: "",
    avatar: ""
  },

  characters: [],

  chats: {},

  tracks: []
};

let data = loadData();
let currentCharacter = null;
let newCharacterAvatar = "";


/* =====================================================
   STORAGE
   ===================================================== */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        ...structuredClone(defaultData),
        ...parsed,
        user: {
          ...defaultData.user,
          ...(parsed.user || {})
        },
        characters: parsed.characters || [],
        chats: parsed.chats || {},
        tracks: parsed.tracks || []
      };
    }
  } catch (error) {
    console.error("Fair storage error:", error);
  }

  return structuredClone(defaultData);
}


function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("Fair save error:", error);

    alert(
      "Fair: не удалось сохранить данные. Возможно, браузер переполнен."
    );
  }
}


/* =====================================================
   HELPERS
   ===================================================== */

function $(id) {
  return document.getElementById(id);
}


function makeId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}


function avatarPlaceholder(name = "?") {

  const letter =
    name.trim().charAt(0).toUpperCase() || "?";

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="300"
        height="300"
        viewBox="0 0 300 300"
      >
        <rect
          width="300"
          height="300"
          fill="#17131a"
        />

        <text
          x="150"
          y="175"
          text-anchor="middle"
          font-family="Arial"
          font-size="110"
          fill="#d989bc"
        >
          ${letter}
        </text>
      </svg>
    `)
  );
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =====================================================
   ENTER APP
   ===================================================== */

function enterApp() {

  const welcome = $("welcome");
  const app = $("app");

  if (!welcome || !app) {
    alert("Fair: элементы приложения не найдены.");
    return;
  }

  welcome.classList.add("hidden");
  app.classList.remove("hidden");

  applyTheme();
  showPage("home");
}


$("guestLogin")?.addEventListener(
  "click",
  enterApp
);


/* =====================================================
   PAGE NAVIGATION
   ===================================================== */

function showPage(page) {

  const pages = [
    "homePage",
    "createPage",
    "tracksPage",
    "profilePage",
    "chatPage"
  ];

  pages.forEach(id => {

    const element = $(id);

    if (element) {
      element.classList.add("hidden");
    }

  });


  const target = $(page + "Page");

  if (target) {
    target.classList.remove("hidden");
  }


  /*
    Во время чата нижняя навигация убирается,
    чтобы она не закрывала поле ввода.
  */

  const bottomNav =
    document.querySelector(".bottom-nav");

  if (bottomNav) {
    bottomNav.classList.toggle(
      "chat-mode",
      page === "chat"
    );
  }


  /*
    Верхняя часть приложения тоже не должна
    мешать полноценному экрану чата.
  */

  const topbar =
    document.querySelector(".topbar");

  if (topbar) {
    topbar.classList.toggle(
      "chat-mode",
      page === "chat"
    );
  }


  document
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  if (page === "home") {
    renderHome();
  }

  if (page === "tracks") {
    renderTracks();
  }

  if (page === "profile") {
    renderProfile();
  }

  if (page === "chat") {
    setTimeout(() => {
      $("chatInput")?.focus();
    }, 50);
  }

}


/* =====================================================
   BOTTOM NAV
   ===================================================== */

document
  .querySelectorAll(".nav-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


/* =====================================================
   CREATE
   ===================================================== */

$("createNav")?.addEventListener(
  "click",
  openCreate
);


$("emptyCreateButton")?.addEventListener(
  "click",
  openCreate
);


function openCreate() {

  resetCreateForm();

  showPage("create");
}


/* =====================================================
   BACK BUTTONS
   ===================================================== */

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    if (
      button.classList.contains("nav-button")
    ) {
      return;
    }

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


$("chatBack")?.addEventListener(
  "click",
  () => {

    currentCharacter = null;

    showPage("home");

  }
);


/* =====================================================
   HOME
   ===================================================== */

function renderHome() {

  renderCharacters();

  renderRecentChats();

}


/* =====================================================
   CHARACTERS
   ===================================================== */

function renderCharacters() {

  const grid = $("charactersGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const empty = $("emptyCharacters");

  if (empty) {

    empty.classList.toggle(
      "hidden",
      data.characters.length > 0
    );

  }


  data.characters.forEach(character => {

    const card =
      document.createElement("button");

    card.className =
      "character-card";


    const avatar =
      character.avatar ||
      avatarPlaceholder(character.name);


    card.innerHTML = `

      <img
        class="character-avatar"
        src="${avatar}"
        alt=""
      >

      <div class="character-card-name">
        ${escapeHTML(character.name)}
      </div>

      <div class="character-card-description">
        ${escapeHTML(
          character.description ||
          "Персонаж"
        )}
      </div>

    `;


    card.addEventListener(
      "click",
      () => {

        openChat(character.id);

      }
    );


    grid.appendChild(card);

  });

}


/* =====================================================
   RECENT CHATS
   ===================================================== */

function renderRecentChats() {

  const container =
    $("recentChats");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const recent = [];


  Object.keys(data.chats)
    .forEach(characterId => {

      const character =
        data.characters.find(
          c => c.id === characterId
        );

      const messages =
        data.chats[characterId];


      if (
        character &&
        messages &&
        messages.length
      ) {

        const last =
          messages[messages.length - 1];


        recent.push({
          character,
          time: last.time || 0
        });

      }

    });


  recent.sort(
    (a, b) =>
      b.time - a.time
  );


  if (!recent.length) {

    container.innerHTML = `
      <div class="empty-recent">
        Здесь появятся последние разговоры
      </div>
    `;

    return;
  }


  recent
    .slice(0, 10)
    .forEach(item => {

      const button =
        document.createElement("button");

      button.className =
        "recent-card";


      const avatar =
        item.character.avatar ||
        avatarPlaceholder(
          item.character.name
        );


      button.innerHTML = `

        <img
          src="${avatar}"
          alt=""
        >

        <span>
          ${escapeHTML(
            item.character.name
          )}
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          openChat(
            item.character.id
          );

        }
      );


      container.appendChild(button);

    });

}


/* =====================================================
   CREATE CHARACTER
   ===================================================== */

$("characterAvatar")?.addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }


    if (!file.type.startsWith("image/")) {
      alert("Нужна именно картинка.");
      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      newCharacterAvatar =
        reader.result;


      $("characterAvatarPreview").src =
        reader.result;


      $("characterAvatarPlaceholder")
        .style.display = "none";

    };


    reader.readAsDataURL(file);

  }
);


$("createCharacterButton")
  ?.addEventListener(
    "click",
    createCharacter
  );


function createCharacter() {

  const name =
    $("characterName")
      .value
      .trim();


  if (!name) {

    alert(
      "Сначала дай персонажу имя."
    );

    return;
  }


  const character = {

    id: makeId(),

    name,

    gender:
      $("characterGender").value,

    avatar:
      newCharacterAvatar,

    description:
      $("characterDescription")
        .value
        .trim(),

    personality:
      $("characterPersonality")
        .value
        .trim(),

    greeting:
      $("characterGreeting")
        .value
        .trim(),

    userPersona:
      $("userPersona")
        .value
        .trim(),

    instructions:
      $("characterInstructions")
        .value
        .trim(),

    createdAt:
      Date.now()

  };


  data.characters.push(
    character
  );


  data.chats[character.id] = [];


  saveData();


  openChat(character.id);

}


/* =====================================================
   RESET CREATE FORM
   ===================================================== */

function resetCreateForm() {

  [
    "characterName",
    "characterDescription",
    "characterPersonality",
    "characterGreeting",
    "userPersona",
    "characterInstructions"
  ]
    .forEach(id => {

      const input = $(id);

      if (input) {
        input.value = "";
      }

    });


  $("characterGender").value = "";

  newCharacterAvatar = "";

  $("characterAvatarPreview").src = "";

  $("characterAvatarPlaceholder")
    .style.display = "";

  $("characterAvatar").value = "";

}


/* =====================================================
   CHAT
   ===================================================== */

function openChat(characterId) {

  const character =
    data.characters.find(
      c => c.id === characterId
    );


  if (!character) {
    return;
  }


  currentCharacter =
    character;


  /*
    Аватар ставим ДО открытия страницы.
    Если его нет — создаём красивый placeholder.
  */

  const avatar =
    character.avatar ||
    avatarPlaceholder(character.name);


  const chatName =
    $("chatName");

  const chatAvatar =
    $("chatAvatar");


  if (chatName) {
    chatName.textContent =
      character.name;
  }


  if (chatAvatar) {

    chatAvatar.src = avatar;

    chatAvatar.alt =
      character.name;

    chatAvatar.style.display =
      "block";

  }


  showPage("chat");

  renderChat();

}


function renderChat() {

  if (!currentCharacter) {
    return;
  }


  const container =
    $("chatMessages");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  const messages =
    data.chats[currentCharacter.id] ||
    [];


  /*
    Если чат пустой, показываем приветствие,
    но теперь СРАЗУ сохраняем его в историю.
  */

  if (
    messages.length === 0 &&
    currentCharacter.greeting
  ) {

    const greeting =
      currentCharacter.greeting;


    data.chats[currentCharacter.id] = [

      {
        role: "bot",
        content: greeting,
        time: Date.now()
      }

    ];


    saveData();

  }


  const history =
    data.chats[currentCharacter.id] || [];


  history.forEach(message => {

    addMessage(
      message.role,
      message.content
    );

  });


  requestAnimationFrame(() => {

    container.scrollTop =
      container.scrollHeight;

  });

}


function addMessage(
  role,
  text
) {

  const container =
    $("chatMessages");


  if (!container) {
    return;
  }


  const message =
    document.createElement("div");


  message.className =
    `message ${role}`;


  message.textContent =
    text;


  container.appendChild(message);


  requestAnimationFrame(() => {

    container.scrollTop =
      container.scrollHeight;

  });

}


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


function sendMessage() {

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


  const message = {

    role: "user",

    content: text,

    time: Date.now()

  };


  data.chats[
    currentCharacter.id
  ].push(message);


  addMessage(
    "user",
    text
  );


  saveData();


  renderRecentChats();

}


/* =====================================================
   PROFILE
   ===================================================== */

$("profileButton")?.addEventListener(
  "click",
  () => showPage("profile")
);


function renderProfile() {

  const nameInput =
    $("userName");

  if (nameInput) {
    nameInput.value =
      data.user.name || "";
  }


  if (data.user.avatar) {

    $("profileAvatarPreview").src =
      data.user.avatar;

    $("profileAvatarPlaceholder")
      .style.display = "none";

  } else {

    $("profileAvatarPreview").src = "";

    $("profileAvatarPlaceholder")
      .style.display = "";

  }


  updateUserAvatar();

}


$("userAvatarInput")
  ?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];

      if (!file) {
        return;
      }


      const reader =
        new FileReader();


      reader.onload = () => {

        data.user.avatar =
          reader.result;


        saveData();

        renderProfile();

      };


      reader.readAsDataURL(file);

    }
  );


$("saveProfile")
  ?.addEventListener(
    "click",
    () => {

      data.user.name =
        $("userName")
          .value
          .trim();


      saveData();

      updateUserAvatar();

      showPage("home");

    }
  );


function updateUserAvatar() {

  const avatar =
    $("userAvatar");

  const placeholder =
    $("defaultUserAvatar");


  if (!avatar || !placeholder) {
    return;
  }


  if (data.user.avatar) {

    avatar.src =
      data.user.avatar;

    avatar.style.display =
      "block";

    placeholder.style.display =
      "none";

  } else {

    avatar.style.display =
      "none";

    placeholder.style.display =
      "inline";

  }

}


/* =====================================================
   TRACKS
   ===================================================== */

$("musicUpload")
  ?.addEventListener(
    "change",
    handleMusicUpload
  );


function handleMusicUpload(event) {

  const files =
    [...event.target.files];


  files.forEach(file => {

    if (!file.type.startsWith("audio/")) {
      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      data.tracks.push({

        id: makeId(),

        name: file.name,

        data: reader.result

      });


      saveData();

      renderTracks();

    };


    reader.readAsDataURL(file);

  });


  event.target.value = "";

}


function renderTracks() {

  const container =
    $("tracksList");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  $("emptyTracks")
    ?.classList.toggle(
      "hidden",
      data.tracks.length > 0
    );


  data.tracks.forEach(track => {

    const item =
      document.createElement("div");


    item.className =
      "track-item";


    item.innerHTML = `

      <div class="track-icon">
        ♪
      </div>

      <div class="track-info">

        <div class="track-name">
          ${escapeHTML(track.name)}
        </div>

        <audio
          class="track-audio"
          controls
          src="${track.data}"
        ></audio>

      </div>

    `;


    container.appendChild(item);

  });

}


/* =====================================================
   THEME
   ===================================================== */

/*
  Тема хранится отдельно от персонажей.
  Сейчас есть:
  - Fair Dark
  - Fair Pink

  Переключение происходит через •••.
*/


function getTheme() {

  return (
    localStorage.getItem(THEME_KEY) ||
    "dark"
  );

}


function applyTheme() {

  const theme =
    getTheme();


  document.documentElement
    .dataset.theme =
    theme;


  /*
    Эти стили добавляются JS-ом,
    поэтому не требуется отдельный
    theme.css.
  */

  let themeStyle =
    $("fairThemeStyle");


  if (!themeStyle) {

    themeStyle =
      document.createElement("style");

    themeStyle.id =
      "fairThemeStyle";

    document.head.appendChild(
      themeStyle
    );

  }


  if (theme === "pink") {

    themeStyle.textContent = `

      :root[data-theme="pink"] {
        background: #100811;
        color: #fff7fc;
      }

      :root[data-theme="pink"] body {
        background: #100811;
      }

      :root[data-theme="pink"] .app {
        background:
          radial-gradient(
            circle at top right,
            rgba(255, 100, 205, 0.12),
            transparent 38%
          ),
          #100811;
      }

      :root[data-theme="pink"] .topbar {
        background:
          rgba(16, 8, 17, 0.90);
        border-bottom-color: #332033;
      }

      :root[data-theme="pink"] .bottom-nav {
        background:
          rgba(16, 8, 17, 0.94);
        border-top-color: #332033;
      }

      :root[data-theme="pink"] .character-card:hover {
        filter:
          drop-shadow(
            0 5px 18px
            rgba(255, 100, 205, 0.14)
          );
      }

      :root[data-theme="pink"] .message.bot {
        background: #211521;
      }

      :root[data-theme="pink"] .chat-header {
        background:
          rgba(16, 8, 17, 0.90);
        border-bottom-color: #332033;
      }

      :root[data-theme="pink"] .chat-input-area {
        background:
          rgba(16, 8, 17, 0.96);
      }

      :root[data-theme="pink"] .chat-input-area textarea {
        background: #180d19;
        border-color: #3a2438;
      }

    `;

  } else {

    themeStyle.textContent = "";

  }

}


function toggleTheme() {

  const current =
    getTheme();


  const next =
    current === "dark"
      ? "pink"
      : "dark";


  localStorage.setItem(
    THEME_KEY,
    next
  );


  applyTheme();


  alert(
    next === "pink"
      ? "Тема Fair Pink включена 🌸"
      : "Тёмная тема Fair включена."
  );

}


/* =====================================================
   MORE
   ===================================================== */

$("moreButton")?.addEventListener(
  "click",
  () => {

    toggleTheme();

  }
);


$("chatMore")?.addEventListener(
  "click",
  () => {

    if (!currentCharacter) {
      return;
    }


    alert(
      `Персонаж: ${currentCharacter.name}\n\n` +
      `Здесь позже будут настройки персонажа.`
    );

  }
);


/* =====================================================
   CHAT UI FIX
   ===================================================== */

/*
  CSS дополнительно страхуем прямо из JS.

  Это решает ситуацию, когда:
  - поле ввода исчезает;
  - нижняя навигация закрывает его;
  - чат занимает неправильную высоту;
  - аватар получает нулевой размер.
*/

(function installChatFix() {

  const style =
    document.createElement("style");

  style.id =
    "fairChatFix";

  style.textContent = `

    .chat-page {
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100dvh !important;
      min-height: 100dvh !important;
      z-index: 100 !important;
      background: #08070c;
    }

    .chat-page.hidden {
      display: none !important;
    }

    .chat-header {
      flex: 0 0 66px !important;
      min-height: 66px !important;
      position: relative;
      z-index: 2;
    }

    .chat-character img {
      display: block !important;
      width: 41px !important;
      height: 41px !important;
      min-width: 41px !important;
      min-height: 41px !important;
      flex: 0 0 41px !important;
    }

    .chat-messages {
      min-height: 0 !important;
      flex: 1 1 auto !important;
      overflow-y: auto !important;
    }

    .chat-input-area {
      position: relative !important;
      z-index: 5 !important;
      flex: 0 0 auto !important;
      min-height: 66px !important;
    }

    .chat-input-area textarea {
      min-height: 46px !important;
      display: block !important;
    }

    .send-button {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .bottom-nav.chat-mode {
      display: none !important;
    }

    .topbar.chat-mode {
      display: none !important;
    }

  `;

  document.head.appendChild(style);

})();


/* =====================================================
   MATRIX
   ===================================================== */

const matrix =
  $("matrix");


if (matrix) {

  const ctx =
    matrix.getContext("2d");


  let width = 0;
  let height = 0;

  let columns = 0;

  let drops = [];


  const symbols =
    "01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ";


  function resizeMatrix() {

    const ratio =
      window.devicePixelRatio || 1;


    width =
      window.innerWidth;


    height =
      window.innerHeight;


    matrix.width =
      width * ratio;


    matrix.height =
      height * ratio;


    matrix.style.width =
      width + "px";


    matrix.style.height =
      height + "px";


    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );


    columns =
      Math.ceil(
        width / 18
      );


    drops =
      Array.from(
        {
          length: columns
        },
        () =>
          Math.random() * -100
      );

  }


  resizeMatrix();


  window.addEventListener(
    "resize",
    resizeMatrix
  );


  function drawMatrix() {

    ctx.fillStyle =
      "rgba(6, 5, 9, 0.055)";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    ctx.font =
      "14px monospace";


    for (
      let i = 0;
      i < columns;
      i++
    ) {

      const x =
        i * 18;


      const y =
        drops[i] * 18;


      const symbol =
        symbols[
          Math.floor(
            Math.random() *
            symbols.length
          )
        ];


      const brightness =
        Math.random();


      if (
        brightness > 0.88
      ) {

        ctx.fillStyle =
          "rgba(255,255,255,0.9)";

      } else {

        ctx.fillStyle =
          "rgba(255,130,205,0.68)";

      }


      ctx.shadowBlur = 8;

      ctx.shadowColor =
        "rgba(255,100,200,0.65)";


      ctx.fillText(
        symbol,
        x,
        y
      );


      ctx.shadowBlur = 0;


      /*
        Медленное движение.
      */

      drops[i] += 0.32;


      if (
        y > height &&
        Math.random() > 0.97
      ) {

        drops[i] =
          Math.random() * -30;

      }

    }


    requestAnimationFrame(
      drawMatrix
    );

  }


  drawMatrix();

}


/* =====================================================
   INITIAL STATE
   ===================================================== */

applyTheme();

updateUserAvatar();
