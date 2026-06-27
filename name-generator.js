(function () {
  const form = document.getElementById("name-form");
  const input = document.getElementById("name-input");
  const resultEl = document.getElementById("name-result");
  const originalEl = document.getElementById("result-original");
  const generatedEl = document.getElementById("result-generated");
  const regenerateBtn = document.getElementById("regenerate-btn");

  // Real words and names that already sound round and soft.
  const BOUBA_WORDS = [
    "Luna", "Marlowe", "Willow", "Wynonna", "Bo", "Milo", "Romy", "Nola",
    "Lulu", "Mona", "Ollie", "Yumi", "Mabel", "Vera", "Wanda", "Bowie",
    "Marshmallow", "Pillow", "Bubbles", "Velvet", "Moonbeam",
    "Blossom", "Honeydew", "Noodle", "Waffle", "Bumblebee", "Mellow",
    "Lullaby", "Marigold", "Clementine", "Olive", "Juniper", "Wallaby",
    "Mango", "Banjo", "Pebble", "Foam", "Cloudberry", "Marmalade",
    "Fiona", "Maeve", "Leilani", "Wendell", "Bellamy", "Romeo", "Winnie",
    "Marina", "Beau", "Lola", "Honeybun", "Buttercup", "Lavender",
    "Meadow", "Nimbus", "Mooncake", "Wobble", "Bumble", "Velveteen", "Juno",
  ];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  let wordBag = [];

  function generateBoubaWord() {
    if (wordBag.length === 0) {
      wordBag = shuffle(BOUBA_WORDS);
    }
    return wordBag.pop();
  }

  let currentName = "";

  function generate() {
    if (!currentName) return;
    generatedEl.textContent = generateBoubaWord();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;

    currentName = name;
    originalEl.textContent = name;
    generate();
    resultEl.hidden = false;
  });

  regenerateBtn.addEventListener("click", generate);
})();
