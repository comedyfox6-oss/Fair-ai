/* =====================================================
   FAIR DATA
   ===================================================== */

const STORAGE_KEY = "fair_data_v1";

let data = JSON.parse(
  localStorage.getItem(STORAGE_KEY) ||
  JSON.stringify({
    user: {
      name: "",
      avatar: ""
    },

    characters: [],

    chats: {},

    tracks: []
  })
);

let currentCharacter = null;

let selectedCharacterAvatar = "";


/* =====================================================
   SAVE
   ===================================================== */

function save() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


/* =====================================================
   MATRIX
   ===================================================== */

const canvas =
  document.getElementById("matrix");

const ctx =
  canvas.getContext("2d");

let matrixWidth;
let matrixHeight;

let fontSize = 14;

let columns;

let drops;

const matrixChars =
  "01アイウエオカキクケコサシスセソ" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "0123456789";

function resizeMatrix() {

  const ratio =
    window.devicePixelRatio || 1;

  matrixWidth =
    window.innerWidth;

  matrixHeight =
    window.innerHeight;

  canvas.width =
    matrixWidth * ratio;

  canvas.height =
    matrixHeight * ratio;

  canvas.style.width =
    matrixWidth + "px";

  canvas.style.height =
    matrixHeight + "px";

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  columns =
    Math.floor(
      matrixWidth / fontSize
    );

  drops =
    Array.from(
      { length: columns },
      () =>
        Math.random() *
        -80
    );
}

resizeMatrix();

window.addEventListener(
  "resize",
  resizeMatrix
);


function drawMatrix() {

  ctx.fillStyle =
    "rgba(6, 5, 9, 0.12)";

  ctx.fillRect(
    0,
    0,
    matrixWidth,
    matrixHeight
  );

  ctx.font =
    `${fontSize}px monospace`;

  for (
    let i = 0;
    i < drops.length;
    i++
  ) {

    const char =
      matrixChars[
        Math.floor(
          Math.random() *
          matrixChars.length
        )
      ];

    const x =
      i * fontSize;

    const y =
      drops[i] * fontSize;


    const brightness =
      Math.random();


    if (brightness > 0.82) {

      ctx.fillStyle =
        "#ffffff";

    } else {

      ctx.fillStyle =
        Math.random() > 0.5
          ? "#ffb6e5"
          : "#ff75c9";

    }


    ctx.shadowBlur =
      brightness > 0.82
        ? 13
        : 5;

    ctx.shadowColor =
      "#ff8bd5";


    ctx.fillText(
      char,
      x,
      y
    );


    if (
      y > matrixHeight &&
      Math.random() > 0.975
    ) {

      drops[i] =
        Math.random() * -30;

    }

    drops[i] +=
      0.55 +
      Math.random() * 0.7;
  }

  ctx.shadowBlur = 0;

  requestAnimationFrame(
    drawMatrix
  );
}

drawMatrix();


/* =====================================================
   WELCOME
   ===================================================== */

document
  .getElementById("guestLogin")
  .onclick = enterApp;


document
  .getElementById("googleLogin")
  .onclick = enterApp;


function enterApp() {

  document
    .getElementById("welcome")
    .classList.add("hidden");

  document
    .getElementById("app")
    .classList.remove("hidden");

  renderHome();
}


/* =====================================================
   NAVIGATION
   ===================================================== */

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.onclick = () => {

      showPage(
        button.dataset.page
      );

    };

  });


document
  .getElementById("createNav")
  .onclick = () => {

    showPage("create");

  };


function showPage(page) {

  document
    .querySelectorAll(
      "#app > main"
    )
    .forEach(pageElement => {

      pageElement
        .classList
        .add("hidden");

    });


  if (page === "home") {

    document
      .getElementById("homePage")
      .classList
      .remove("hidden");

    renderHome();

  }


  if (page === "create") {

    document
      .getElementById("createPage")
      .classList
      .remove("hidden");

  }


  if (page === "tracks") {

    document
      .getElementById("tracksPage")
      .classList
      .remove("hidden");

    renderTracks();

  }


  if (page === "profile") {

    document
      .getElementById("profilePage")
      .classList
      .remove("hidden");

    loadProfile();

  }


  if (page === "chat") {

    document
      .getElementById("chatPage")
      .classList
      .remove("hidden");

  }


  updateNav(page);
}


function updateNav(page) {

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });

  const active =
    document.querySelector(
      `.nav-button[data-page="${page}"]`
    );

  if (active) {

    active.classList.add(
      "active"
    );

  }
}


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
    document.getElementById(
      "charactersGrid"
    );

  const empty =
    document.getElementById(
      "emptyCharacters"
    );


  grid.innerHTML = "";


  if (
    data.characters.length === 0
  ) {

    empty.classList.remove(
      "hidden"
    );

    return;

  }


  empty.classList.add(
    "hidden"
  );


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
        makePlaceholder(
          character.name
        );


      card.innerHTML = `

        <img
          class="character-avatar"
          src="${avatar}"
          alt=""
        >

        <div
          class="character-card-name"
        >
          ${escapeHTML(
            character.name
          )}
        </div>

        <div
          class="character-card-description"
        >
          ${escapeHTML(
            character.description ||
            "Персонаж"
          )}
        </div>

      `;


      card.onclick = () => {

        openChat(
          character.id
        );

      };


      grid.appendChild(card);

    }
  );

}


/* =====================================================
   CREATE CHARACTER
   ===================================================== */

document
  .getElementById("emptyCreateButton")
  .onclick = () => {

    showPage("create");

  };


document
  .getElementById("characterAvatar")
  .onchange = event => {

    const file =
      event.target.files[0];

    if (!file) return;


    const reader =
      new FileReader();


    reader.onload = () => {

      selectedCharacterAvatar =
        reader.result;


      document
        .getElementById(
          "characterAvatarPreview"
        )
        .src =
        selectedCharacterAvatar;


      document
        .getElementById(
          "characterAvatarPlaceholder"
        )
        .style.display =
        "none";

    };


    reader.readAsDataURL(file);

  };


document
  .getElementById(
    "createCharacterButton"
  )
  .onclick = createCharacter;


function createCharacter() {

  const name =
    document
      .getElementById(
        "characterName"
      )
      .value
      .trim();


  if (!name) {

    alert(
      "Напиши имя персонажа."
    );

    return;

  }


  const character = {

    id:
      crypto.randomUUID(),

    name,

    gender:
      document
        .getElementById(
          "characterGender"
        )
        .value,

    avatar:
      selectedCharacterAvatar,

    description:
      document
        .getElementById(
          "characterDescription"
        )
        .value
        .trim(),

    personality:
      document
        .getElementById(
          "characterPersonality"
        )
        .value
        .trim(),

    greeting:
      document
        .getElementById(
          "characterGreeting"
        )
        .value
        .trim(),

    persona:
      document
        .getElementById(
          "userPersona"
        )
        .value
        .trim(),

    instructions:
      document
        .getElementById(
          "characterInstructions"
        )
        .value
        .trim()

  };


  data.characters.push(
    character
  );


  data.chats[
    character.id
  ] = [];


  save();

  resetCreateForm();

  openChat(
    character.id
  );

}


/* =====================================================
   RESET CREATE
   ===================================================== */

function resetCreateForm() {

  document
    .querySelectorAll(
      "#createPage input, #createPage textarea"
    )
    .forEach(
      element => {
        element.value = "";
      }
    );


  selectedCharacterAvatar = "";


  document
    .getElementById(
      "characterAvatarPreview"
    )
    .src = "";


  document
    .getElementById(
      "characterAvatarPlaceholder"
    )
    .style.display =
    "";


}


/* =====================================================
   CHAT
   ===================================================== */

function openChat(id) {

  const character =
    data.characters.find(
      item =>
        item.id === id
    );


  if (!character) return;


  currentCharacter =
    character;


  document
    .getElementById(
      "chatName"
    )
    .textContent =
    character.name;


  document
    .getElementById(
      "chatAvatar"
    )
    .src =
    character.avatar ||
    makePlaceholder(
      character.name
    );


  renderMessages();

  showPage("chat");

}


function renderMessages() {

  const container =
    document.getElementById(
      "chatMessages"
    );


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


/* =====================================================
   MESSAGE
   ===================================================== */

function addMessage(
  role,
  text
) {

  const container =
    document.getElementById(
      "chatMessages"
    );


  const element =
    document.createElement(
      "div"
    );


  element.className =
    `message ${role}`;


  element.textContent =
    text;


  container.appendChild(
    element
  );


  container.scrollTop =
    container.scrollHeight;

}


document
  .getElementById(
    "sendMessage"
  )
  .onclick =
  sendMessage;


document
  .getElementById(
    "chatInput"
  )
  .addEventListener(
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

  if (!currentCharacter)
    return;


  const input =
    document.getElementById(
      "chatInput"
    );


  const text =
    input.value.trim();


  if (!text)
    return;


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

    role:
      "user",

    content:
      text

  });


  addMessage(
    "user",
    text
  );


  save();


  /*
    Здесь позже подключается
    настоящий backend / API.

    На сервер отправляем:

    character.personality
    character.persona
    character.instructions
    character.greeting
    историю чата
    сообщение пользователя

    Модель при этом вообще
    не показывается в интерфейсе.
  */


  setTimeout(
    () => {

      addMessage(
        "bot",
        "АФК"
      );

    },
    300
  );

}


/* =====================================================
   RECENT CHATS
   ===================================================== */

function renderRecentChats() {

  const container =
    document.getElementById(
      "recentChats"
    );


  container.innerHTML = "";


  const recent =
    data.characters
      .filter(
        character =>
          (
            data.chats[
              character.id
            ] || []
          ).length > 0
      )
      .slice(-8)
      .reverse();


  if (
    recent.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-recent">
        Здесь появятся последние разговоры
      </div>
    `;

    return;

  }


  recent.forEach(
    character => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "recent-card";


      button.innerHTML = `

        <img
          src="${
            character.avatar ||
            makePlaceholder(
              character.name
            )
          }"
          alt=""
        >

        <span>
          ${escapeHTML(
            character.name
          )}
        </span>

      `;


      button.onclick = () =>
        openChat(
          character.id
        );


      container.appendChild(
        button
      );

    }
  );

}


/* =====================================================
   TRACKS
   ===================================================== */

document
  .getElementById(
    "musicUpload"
  )
  .onchange =
  uploadTracks;


function uploadTracks(event) {

  const files =
    [...event.target.files];


  files.forEach(
    file => {

      const reader =
        new FileReader();


      reader.onload = () => {

        data.tracks.push({

          id:
            crypto.randomUUID(),

          name:
            file.name,

          data:
            reader.result

        });


        save();

        renderTracks();

      };


      reader.readAsDataURL(
        file
      );

    }
  );


  event.target.value = "";

}


function renderTracks() {

  const list =
    document.getElementById(
      "tracksList"
    );


  const empty =
    document.getElementById(
      "emptyTracks"
    );


  list.innerHTML = "";


  if (
    data.tracks.length === 0
  ) {

    empty.classList.remove(
      "hidden"
    );

    return;

  }


  empty.classList.add(
    "hidden"
  );


  data.tracks.forEach(
    track => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "track-item";


      item.innerHTML = `

        <div class="track-icon">
          ♪
        </div>

        <div class="track-info">

          <div class="track-name">
            ${escapeHTML(
              track.name
            )}
          </div>

          <audio
            class="track-audio"
            controls
            src="${track.data}"
          ></audio>

        </div>

      `;


      list.appendChild(
        item
      );

    }
  );

}


/* =====================================================
   PROFILE
   ===================================================== */

document
  .getElementById(
    "profileButton"
  )
  .onclick = () => {

    showPage("profile");

  };


function loadProfile() {

  document
    .getElementById(
      "userName"
    )
    .value =
    data.user.name || "";


  if (
    data.user.avatar
  ) {

    document
      .getElementById(
        "profileAvatarPreview"
      )
      .src =
      data.user.avatar;


    document
      .getElementById(
        "profileAvatarPlaceholder"
      )
      .style.display =
      "none";

  }

}


document
  .getElementById(
    "userAvatarInput"
  )
  .onchange =
  event => {

    const file =
      event.target.files[0];

    if (!file) return;


    const reader =
      new FileReader();


    reader.onload =
      () => {

        data.user.avatar =
          reader.result;


        document
          .getElementById(
            "profileAvatarPreview"
          )
          .src =
          reader.result;


        document
          .getElementById(
            "profileAvatarPlaceholder"
          )
          .style.display =
          "none";


        save();

      };


    reader.readAsDataURL(
      file
    );

  };


document
  .getElementById(
    "saveProfile"
  )
  .onclick =
  () => {

    data.user.name =
      document
        .getElementById(
          "userName"
        )
        .value
        .trim();


    save();

    showPage("home");

  };


/* =====================================================
   BACK
   ===================================================== */

document
  .getElementById(
    "chatBack"
  )
  .onclick =
  () => {

    showPage("home");

  };


/* =====================================================
   UTILS
   ===================================================== */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function makePlaceholder(
  name
) {

  const letter =
    String(
      name || "?"
    )
      .charAt(0)
      .toUpperCase();


  const svg = `

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="300"
      height="300"
    >

      <rect
        width="300"
        height="300"
        fill="#17131a"
      />

      <text
        x="50%"
        y="53%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial"
        font-size="100"
        fill="#b66b9e"
      >
        ${letter}
      </text>

    </svg>

  `;


  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg)
  );

}


/* =====================================================
   STARTUP
   ===================================================== */

if (
  data.user.avatar
) {

  document
    .getElementById(
      "userAvatar"
    )
    .src =
    data.user.avatar;


  document
    .getElementById(
      "defaultUserAvatar"
    )
    .style.display =
    "none";

}
