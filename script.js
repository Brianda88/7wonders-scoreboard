const scoreCategories = [
  "Military",
  "Gold",
  "Wonders",
  "Civilian",
  "Commerce",
  "Guilds",
  "Science"
];

let undoStack = [];
let redoStack = [];
let players = [];

const emojis = ["🐯", "🦁", "🦝", "🐻", "🦊", "🐼", "🐰", "🐶", "🐵"];

document.getElementById("start-game").addEventListener("click", () => {
  const count = parseInt(document.getElementById("player-count").value);
  if (!count || count < 2 || count > 7) return alert("Please choose 2–7 players.");

  const screen = document.getElementById("player-info-screen");
  screen.innerHTML = "";
  document.getElementById("setup-screen").style.display = "none";
  screen.style.display = "block";

  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.classList.add("player-entry");

    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    div.innerHTML = `
      <h3>Player ${i + 1}</h3>
      <div class="player-form-row">
        <select id="emoji-${i}" class="emoji-picker">
          ${emojis.map(e => `<option value="${e}">${e}</option>`).join("")}
        </select>
        <input type="text" id="name-${i}" placeholder="Enter name" class="name-input" />
      </div>
    `;
    screen.appendChild(div);

    setTimeout(() => {
      const emojiSelect = document.getElementById(`emoji-${i}`);
      emojiSelect.value = randomEmoji;
    }, 0);
  }

  const cont = document.createElement("button");
  cont.textContent = "Continue to Scoreboard";
  cont.classList.add("primary");

  cont.addEventListener("click", () => {
    for (let i = 0; i < count; i++) {
      const name = document.getElementById(`name-${i}`).value || `Player ${i + 1}`;
      const emoji = document.getElementById(`emoji-${i}`).value;
      players.push({ name, emoji });
    }

    document.getElementById("player-info-screen").style.display = "none";
    document.getElementById("scoreboard-screen").style.display = "block";
    document.getElementById("toggle-scoreboard").style.display = "inline-block";

    renderScoreboardGrid();
    updateLiveScoreboard();
  });

  screen.appendChild(cont);
});

function renderScoreboardGrid() {
  const wrapper = document.getElementById("scroll-wrapper");

  // Remove old player columns if any
  const oldPlayers = document.getElementById("players-columns");
  if (oldPlayers) oldPlayers.remove();

  // Create new container for player columns
  const playersDiv = document.createElement("div");
  playersDiv.id = "players-columns";
  playersDiv.style.display = "flex";
  playersDiv.style.gap = "1rem";

  players.forEach((player, index) => {
    const col = document.createElement("div");
    col.classList.add("player-column");
    col.style.backgroundColor = getPlayerColor(index);
    col.innerHTML = `<h4>${player.emoji} ${player.name}</h4>`;

    scoreCategories.forEach(cat => {
      const input = document.createElement("input");
      input.type = "number";
      input.value = "0";
      input.id = `score-${cat.toLowerCase()}-${index}`;

      input.addEventListener("input", () => {
        // Clean display nicely while typing
        if (input.value.length > 0 && input.value !== "-") {
          if (input.value.startsWith("-")) {
            input.value = "-" + String(parseInt(input.value.substring(1), 10) || 0);
          } else {
            input.value = String(parseInt(input.value, 10) || 0);
          }
        }
        updateLiveScoreboard();
      });
      
      // NEW: Save proper state when leaving the field (after typing)
      input.addEventListener("blur", () => {
        saveCurrentState();
      });

      col.appendChild(input);
    });

    const total = document.createElement("div");
    total.classList.add("total-score");
    total.id = `total-${index}`;
    total.textContent = "0";
    col.appendChild(total);

    playersDiv.appendChild(col);
  });

  wrapper.appendChild(playersDiv);
}

function getPlayerColor(index) {
  const colors = ["#e6f7ff", "#fff0f5", "#fef9e7", "#f0fff0", "#fffaf0", "#e9f5db", "#f5f0ff"];
  return colors[index % colors.length];
}

function saveCurrentState() {
  const currentState = players.map((p, i) => {
    const scores = {};
    scoreCategories.forEach(cat => {
      scores[cat.toLowerCase()] = document.getElementById(`score-${cat.toLowerCase()}-${i}`).value;
    });
    return scores;
  });

  undoStack.push(currentState);

  redoStack = []; // Clear redo after new action
}

function getCurrentState() {
  return players.map((p, i) => {
    const scores = {};
    scoreCategories.forEach(cat => {
      scores[cat.toLowerCase()] = document.getElementById(`score-${cat.toLowerCase()}-${i}`).value;
    });
    return scores;
  });
}

function applyState(state) {
  players.forEach((p, i) => {
    scoreCategories.forEach(cat => {
      document.getElementById(`score-${cat.toLowerCase()}-${i}`).value = state[i][cat.toLowerCase()];
    });
  });
  updateLiveScoreboard();
}

function calculateTotal(index) {
  let total = 0;

  scoreCategories.forEach(cat => {
    let val = parseInt(document.getElementById(`score-${cat.toLowerCase()}-${index}`)?.value) || 0;

    if (cat === "Gold") {
      val = Math.floor(val / 3); // 1 point per 3 coins
    }

    total += val;
  });

  document.getElementById(`total-${index}`).textContent = total;
  return total;
}


function updateLiveScoreboard() {
  const live = document.getElementById("live-scoreboard");
  live.innerHTML = "";

  const scores = players.map((p, i) => {
    return {
      name: p.name,
      emoji: p.emoji,
      total: calculateTotal(i),
      index: i
    };
  });

  const max = Math.max(...scores.map(p => p.total));
  scores.sort((a, b) => b.total - a.total);

  scores.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("live-player");
    if (p.total === max) div.classList.add("live-leader");
    div.textContent = `${p.emoji} ${p.name} — ${p.total} pts`;
    live.appendChild(div);
  });
}

document.getElementById("undo-change").addEventListener("click", () => {
  if (undoStack.length === 0) {
    alert("Nothing to undo!");
    return;
  }

  const lastState = undoStack.pop();
  redoStack.push(getCurrentState());

  applyState(lastState);
});

document.getElementById("redo-change").addEventListener("click", () => {
  if (redoStack.length === 0) {
    alert("Nothing to redo!");
    return;
  }

  const nextState = redoStack.pop();
  undoStack.push(getCurrentState());

  applyState(nextState);
});

document.getElementById("finish-game").addEventListener("click", () => {
  const confirmEnd = confirm("Are you sure you want to end the game?");
  if (!confirmEnd) return;

  updateLiveScoreboard();

  const scores = players.map((p, i) => ({
    name: p.name,
    total: parseInt(document.getElementById(`total-${i}`).textContent)
  }));

  const max = Math.max(...scores.map(s => s.total));
  const winners = scores.filter(s => s.total === max).map(s => s.name);
  const winnerText = `🎉 Congratulations ${winners.join(" & ")}! 🎉`;

  document.getElementById("winner-text").textContent = winnerText;
  document.getElementById("confetti-popup").style.display = "block";
  setTimeout(() => {
    document.getElementById("confetti-popup").style.display = "none";
  }, 4000);
});

document.getElementById("reset-game").addEventListener("click", () => {
  const confirmReset = confirm("Are you sure you want to reset the game?");
  if (!confirmReset) return;

  players = [];
  undoStack = [];
  redoStack = [];
  document.getElementById("scoreboard-screen").style.display = "none";
  document.getElementById("setup-screen").style.display = "block";
  document.getElementById("live-scoreboard").innerHTML = "";
  document.getElementById("toggle-scoreboard").style.display = "none";
});

document.getElementById("toggle-scoreboard").addEventListener("click", () => {
  const board = document.getElementById("live-scoreboard");
  const btn = document.getElementById("toggle-scoreboard");
  if (board.style.display === "none") {
    board.style.display = "flex";
    btn.textContent = "▼ Hide Live Scores";
  } else {
    board.style.display = "none";
    btn.textContent = "▲ Show Live Scores";
  }
});
