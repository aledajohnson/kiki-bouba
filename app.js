(function () {
  const { url, anonKey } = window.SUPABASE_CONFIG || {};
  if (!url || url.includes("YOUR-PROJECT-REF")) {
    document.getElementById("board").innerHTML =
      '<p class="loading">Supabase isn\'t configured yet — fill in config.js with your project URL and anon key.</p>';
    return;
  }

  const supabase = window.supabase.createClient(url, anonKey);

  const boardEl = document.getElementById("board");
  const form = document.getElementById("submit-form");
  const input = document.getElementById("word-input");
  const submitMessage = document.getElementById("submit-message");

  /** @type {Map<string, {id: string, text: string, kiki_votes: number, bouba_votes: number}>} */
  const words = new Map();

  const VOTED_KEY = "kikiBoubaVotedWords";
  function getVotedMap() {
    try {
      return JSON.parse(localStorage.getItem(VOTED_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function setVoted(wordId, voteType) {
    const voted = getVotedMap();
    voted[wordId] = voteType;
    localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
  }

  function render() {
    const voted = getVotedMap();
    const sorted = Array.from(words.values()).sort((a, b) => {
      const totalDiff =
        b.kiki_votes + b.bouba_votes - (a.kiki_votes + a.bouba_votes);
      if (totalDiff !== 0) return totalDiff;
      return a.text.localeCompare(b.text);
    });

    boardEl.replaceChildren();

    if (sorted.length === 0) {
      const p = document.createElement("p");
      p.className = "loading";
      p.textContent = "No words yet — add the first one above!";
      boardEl.appendChild(p);
      return;
    }

    for (const word of sorted) {
      boardEl.appendChild(buildWordCard(word, voted[word.id]));
    }
  }

  function buildWordCard(word, votedType) {
    const total = word.kiki_votes + word.bouba_votes;
    const kikiPct = total === 0 ? 50 : (word.kiki_votes / total) * 100;
    const boubaPct = 100 - kikiPct;

    const card = document.createElement("div");
    card.className = "word-card";

    const h2 = document.createElement("h2");
    h2.textContent = word.text;
    card.appendChild(h2);

    const bar = document.createElement("div");
    bar.className = "vote-bar";
    const kikiFill = document.createElement("div");
    kikiFill.className = "kiki-fill";
    kikiFill.style.width = kikiPct + "%";
    const boubaFill = document.createElement("div");
    boubaFill.className = "bouba-fill";
    boubaFill.style.width = boubaPct + "%";
    bar.append(kikiFill, boubaFill);
    card.appendChild(bar);

    const buttons = document.createElement("div");
    buttons.className = "vote-buttons";
    buttons.appendChild(
      buildVoteButton(word, "kiki", word.kiki_votes, votedType)
    );
    buttons.appendChild(
      buildVoteButton(word, "bouba", word.bouba_votes, votedType)
    );
    card.appendChild(buttons);

    return card;
  }

  function buildVoteButton(word, voteType, count, votedType) {
    const btn = document.createElement("button");
    btn.className = `btn-${voteType}`;
    if (votedType) btn.disabled = true;
    if (votedType === voteType) btn.classList.add("voted");

    const label = document.createElement("span");
    label.textContent = voteType === "kiki" ? "Kiki" : "Bouba";
    const countEl = document.createElement("span");
    countEl.className = "count";
    countEl.textContent = String(count);

    btn.append(label, countEl);
    btn.addEventListener("click", () => castVote(word.id, voteType));
    return btn;
  }

  async function castVote(wordId, voteType) {
    if (getVotedMap()[wordId]) return;

    const word = words.get(wordId);
    if (!word) return;

    // Optimistic update so the click feels instant; the realtime event
    // that follows will just confirm the same numbers.
    word[`${voteType}_votes`] += 1;
    setVoted(wordId, voteType);
    render();

    const { error } = await supabase.rpc("cast_vote", {
      word_id: wordId,
      vote_type: voteType,
    });

    if (error) {
      console.error("Vote failed:", error);
      word[`${voteType}_votes`] -= 1;
      render();
    }
  }

  async function loadWords() {
    const { data, error } = await supabase
      .from("words")
      .select("id, text, kiki_votes, bouba_votes");

    if (error) {
      boardEl.innerHTML = '<p class="loading">Could not load words.</p>';
      console.error(error);
      return;
    }

    words.clear();
    for (const word of data) words.set(word.id, word);
    render();
  }

  function subscribeToChanges() {
    supabase
      .channel("words-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "words" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            words.delete(payload.old.id);
          } else {
            const row = payload.new;
            words.set(row.id, row);
          }
          render();
        }
      )
      .subscribe();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    submitMessage.textContent = "";

    if (!text) return;
    if (text.length > 40) {
      submitMessage.textContent = "Keep it under 40 characters.";
      return;
    }

    const { error } = await supabase.from("words").insert({ text });

    if (error) {
      if (error.code === "23505") {
        submitMessage.textContent = "That word is already on the board!";
      } else {
        submitMessage.textContent = "Couldn't add that word — try again.";
        console.error(error);
      }
      return;
    }

    input.value = "";
    submitMessage.textContent = `Added "${text}" — go vote on it!`;
  });

  loadWords();
  subscribeToChanges();
})();
