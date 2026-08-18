/* =====================================================
   FAIR — APP.JS
   ===================================================== */

const STORAGE_KEY = "fair_data_v2";
const DB_NAME = "fair_music_db";
const DB_VERSION = 1;
const TRACK_STORE = "tracks";

const defaultData = {
  user: {
    name: "",
    avatar: ""
  },

  characters: [],

  chats: {}
};

let data = loadData();
let currentCharacter = null;
let newCharacterAvatar = "";


/* =====================================================
   STORAGE — LOCAL
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
        characters: Array.isArray(parsed.characters)
          ? parsed.characters
          : [],
        chats: parsed.chats || {}
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
      "Fair не смог сохранить данные. Возможно, браузеру не хватает места."
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


function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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


/* =====================================================
   INDEXEDDB — MUSIC
   ===================================================== */

let musicDBPromise = null;


function openMusicDB() {

  if (musicDBPromise) {
    return musicDBPromise;
  }

  musicDBPromise = new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );


      request.onupgradeneeded = event => {

        const db =
          event.target.result;


        if (
          !db.objectStoreNames.contains(
            TRACK_STORE
          )
        ) {

          db.createObjectStore(
            TRACK_STORE,
            {
              keyPath: "id"
            }
          );

        }

      };


      request.onsuccess = () => {
        resolve(request.result);
      };


      request.onerror = () => {
        console.error(
          "Fair IndexedDB error:",
          request.error
        );

        reject(request.error);
      };

    }
  );

  return musicDBPromise;
}


/* Сохранить один аудиофайл */

async function saveTrackToDB(track) {

  const db =
    await openMusicDB();


  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          TRACK_STORE,
          "readwrite"
        );


      const store =
        transaction.objectStore(
          TRACK_STORE
        );


      store.put(track);


      transaction.oncomplete = () => {
        resolve();
      };


      transaction.onerror = () => {
        reject(
          transaction.error
        );
      };

    }
  );
}


/* Получить все треки */

async function getAllTracksFromDB() {

  const db =
    await openMusicDB();


  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          TRACK_STORE,
          "readonly"
        );


      const store =
        transaction.objectStore(
          TRACK_STORE
        );


      const request =
        store.getAll();


      request.onsuccess = () => {

        const tracks =
          request.result || [];


        tracks.sort(
          (a, b) =>
            (a.createdAt || 0) -
            (b.createdAt || 0)
        );


        resolve(tracks);

      };


      request.onerror = () => {
        reject(request.error);
      };

    }
  );
}


/* Удалить трек */

async function deleteTrackFromDB(id) {

  const db =
    await openMusicDB();


  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          TRACK_STORE,
          "readwrite"
        );


      const store =
        transaction.objectStore(
          TRACK_STORE
        );


      store.delete(id);


      transaction.oncomplete = () => {
        resolve();
      };


      transaction.onerror = () => {
        reject(
          transaction.error
        );
      };

    }
  );
}


/* =====================================================
   ENTER APP
   ===================================================== */

function enterApp() {

  const welcome = $("welcome");
  const app = $("app");


  if (!welcome || !app) {

    alert(
      "Fair: элементы приложения не найдены."
    );

    return;
  }


  welcome.classList.add("hidden");

  app.classList.remove("hidden");

  showPage("home");

  renderHome();
}


/* Только гостевой вход */

$("guestLogin")?.addEventListener(
  "click",
  enterApp
);


/*
   Если старый HTML всё ещё содержит Google,
   он больше никуда не ведёт.
*/

$("googleLogin")?.addEventListener(
  "click",
  event => {

    event.preventDefault();

    enterApp();

  }
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


  const target =
    $(page + "Page");


  if (target) {
    target.classList.remove("hidden");
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

}


/* Нижняя навигация */

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
   CREATE NAVIGATION
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
      button.classList.contains(
        "nav-button"
      )
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

  const grid =
    $("charactersGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  const empty =
    $("emptyCharacters");


  if (empty) {

    empty.classList.toggle(
      "hidden",
      data.characters.length > 0
    );

  }


  data.characters.forEach(
    character => {

      const card =
        document.createElement(
          "button"
        );


      card.className =
        "character-card";


      const avatar =
        character.avatar ||
        avatarPlaceholder(
          character.name
        );


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

          openChat(
            character.id
          );

        }
      );


      grid.appendChild(card);

    }
  );

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
        data.chats[
          characterId
        ];


      if (
        character &&
        messages &&
        messages.length
      ) {

        const last =
          messages[
            messages.length - 1
          ];


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
        document.createElement(
          "button"
        );


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


      container.appendChild(
        button
      );

    });

}


/* =====================================================
   CREATE CHARACTER — AVATAR
   ===================================================== */

$("characterAvatar")?.addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      alert(
        "Нужен именно файл изображения."
      );

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      newCharacterAvatar =
        reader.result;


      $("characterAvatarPreview")
        .src =
        reader.result;


      $("characterAvatarPlaceholder")
        .style.display =
        "none";

    };


    reader.readAsDataURL(file);

  }
);


/* =====================================================
   CREATE CHARACTER
   ===================================================== */

$("createCharacterButton")
  ?.addEventListener(
    "click",
    createCharacter
  );


function createCharacter() {

  const name =
    $("characterName")
      ?.value
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
      $("characterGender")?.value ||
      "",

    avatar:
      newCharacterAvatar,

    description:
      $("characterDescription")
        ?.value
        .trim() ||
      "",

    personality:
      $("characterPersonality")
        ?.value
        .trim() ||
      "",

    greeting:
      $("characterGreeting")
        ?.value
        .trim() ||
      "",

    userPersona:
      $("userPersona")
        ?.value
        .trim() ||
      "",

    instructions:
      $("characterInstructions")
        ?.value
        .trim() ||
      "",

    createdAt:
      Date.now()

  };


  data.characters.push(
    character
  );


  data.chats[
    character.id
  ] = [];


  saveData();


  openChat(
    character.id
  );

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

      const input =
        $(id);


      if (input) {
        input.value = "";
      }

    });


  if ($("characterGender")) {
    $("characterGender").value = "";
  }


  newCharacterAvatar = "";


  if ($("characterAvatarPreview")) {
    $("characterAvatarPreview")
      .src = "";
  }


  if ($("characterAvatarPlaceholder")) {

    $("characterAvatarPlaceholder")
      .style.display = "";

  }


  if ($("characterAvatar")) {
    $("characterAvatar").value = "";
  }

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


  if ($("chatName")) {

    $("chatName").textContent =
      character.name;

  }


  if ($("chatAvatar")) {

    $("chatAvatar").src =
      character.avatar ||
      avatarPlaceholder(
        character.name
      );

  }


  showPage("chat");

  renderChat();

}


function renderChat() {

  const container =
    $("chatMessages");


  if (!container || !currentCharacter) {
    return;
  }


  container.innerHTML = "";


  const messages =
    data.chats[
      currentCharacter.id
    ] || [];


  if (
    messages.length === 0 &&
    currentCharacter.greeting
  ) {

    addMessage(
      "bot",
      currentCharacter.greeting
    );

    return;
  }


  messages.forEach(
    message => {

      addMessage(
        message.role,
        message.content
      );

    }
  );

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
    document.createElement(
      "div"
    );


  message.className =
    `message ${role}`;


  message.textContent =
    text;


  container.appendChild(
    message
  );


  container.scrollTop =
    container.scrollHeight;

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


  data.chats[
    currentCharacter.id
  ].push({

    role: "user",

    content: text,

    time: Date.now()

  });


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

  if (!$("userName")) {
    return;
  }


  $("userName").value =
    data.user.name || "";


  if (data.user.avatar) {

    $("profileAvatarPreview").src =
      data.user.avatar;


    $("profileAvatarPlaceholder")
      .style.display =
      "none";

  } else {

    $("profileAvatarPreview").src =
      "";


    $("profileAvatarPlaceholder")
      .style.display =
      "";

  }


  updateUserAvatar();

}


/* Avatar пользователя */

$("userAvatarInput")
  ?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Нужен файл изображения."
        );

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


/* Сохранить профиль */

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

  const image =
    $("userAvatar");


  const placeholder =
    $("defaultUserAvatar");


  if (!image || !placeholder) {
    return;
  }


  if (data.user.avatar) {

    image.src =
      data.user.avatar;


    image.style.display =
      "block";


    placeholder.style.display =
      "none";

  } else {

    image.style.display =
      "none";


    placeholder.style.display =
      "inline";

  }

}


/* =====================================================
   TRACKS — UPLOAD
   ===================================================== */

$("musicUpload")
  ?.addEventListener(
    "change",
    handleMusicUpload
  );


async function handleMusicUpload(event) {

  const files =
    [...event.target.files];


  if (!files.length) {
    return;
  }


  for (const file of files) {

    if (
      !file.type.startsWith(
        "audio/"
      )
    ) {

      continue;
    }


    try {

      const track = {

        id: makeId(),

        name: file.name,

        type:
          file.type ||
          "audio/mpeg",

        blob: file,

        createdAt:
          Date.now()

      };


      await saveTrackToDB(
        track
      );

    } catch (error) {

      console.error(
        "Fair music upload error:",
        error
      );


      alert(
        `Не удалось добавить «${file.name}».`
      );

    }

  }


  event.target.value = "";


  await renderTracks();

}


/* =====================================================
   TRACKS — RENDER
   ===================================================== */

async function renderTracks() {

  const container =
    $("tracksList");


  const empty =
    $("emptyTracks");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  let tracks = [];


  try {

    tracks =
      await getAllTracksFromDB();

  } catch (error) {

    console.error(
      "Fair tracks read error:",
      error
    );


    if (empty) {
      empty.classList.remove(
        "hidden"
      );
    }

    return;
  }


  if (empty) {

    empty.classList.toggle(
      "hidden",
      tracks.length > 0
    );

  }


  tracks.forEach(
    track => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "track-item";


      const icon =
        document.createElement(
          "div"
        );


      icon.className =
        "track-icon";


      icon.textContent =
        "♪";


      const info =
        document.createElement(
          "div"
        );


      info.className =
        "track-info";


      const name =
        document.createElement(
          "div"
        );


      name.className =
        "track-name";


      name.textContent =
        track.name;


      const audio =
        document.createElement(
          "audio"
        );


      audio.className =
        "track-audio";


      audio.controls =
        true;


      const blob =
        track.blob;


      if (blob) {

        const url =
          URL.createObjectURL(
            blob
          );


        audio.src =
          url;


        audio.addEventListener(
          "ended",
          () => {
            URL.revokeObjectURL(
              url
            );
          },
          {
            once: true
          }
        );

      }


      info.appendChild(
        name
      );


      info.appendChild(
        audio
      );


      const deleteButton =
        document.createElement(
          "button"
        );


      deleteButton.className =
        "track-delete";


      deleteButton.textContent =
        "×";


      deleteButton.title =
        "Удалить";


      deleteButton.addEventListener(
        "click",
        async event => {

          event.stopPropagation();


          const confirmed =
            confirm(
              `Удалить «${track.name}»?`
            );


          if (!confirmed) {
            return;
          }


          try {

            await deleteTrackFromDB(
              track.id
            );


            await renderTracks();

          } catch (error) {

            console.error(
              "Fair track delete error:",
              error
            );

          }

        }
      );


      item.appendChild(
        icon
      );


      item.appendChild(
        info
      );


      item.appendChild(
        deleteButton
      );


      container.appendChild(
        item
      );

    }
  );

}


/* =====================================================
   MORE
   ===================================================== */

$("moreButton")?.addEventListener(
  "click",
  () => {

    alert(
      "Настройки Fair появятся здесь."
    );

  }
);


$("chatMore")?.addEventListener(
  "click",
  () => {

    alert(
      "Настройки персонажа появятся здесь."
    );

  }
);


/* =====================================================
   MATRIX
   ===================================================== */

const matrix =
  $("matrix");


if (matrix) {

  const ctx =
    matrix.getContext(
      "2d"
    );


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


      ctx.shadowBlur =
        8;


      ctx.shadowColor =
        "rgba(255,100,200,0.65)";


      ctx.fillText(
        symbol,
        x,
        y
      );


      ctx.shadowBlur =
        0;


      /*
        Медленное движение.
      */

      drops[i] +=
        0.32;


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

updateUserAvatar();
