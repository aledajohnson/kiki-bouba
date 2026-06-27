(function () {
  const form = document.getElementById("name-form");
  const input = document.getElementById("name-input");
  const resultEl = document.getElementById("name-result");
  const originalEl = document.getElementById("result-original");
  const generatedEl = document.getElementById("result-generated");
  const regenerateBtn = document.getElementById("regenerate-btn");

  // Swap sharp/spiky consonant sounds for round/soft ones.
  const SOFT_MAP = {
    k: "m",
    q: "w",
    x: "v",
    c: "b",
    g: "w",
    t: "l",
    d: "l",
    p: "b",
    s: "z",
    z: "v",
    j: "y",
  };

  const SOFT_ENDINGS = ["oo", "a", "ie", "o", "um", "lu"];

  function isVowel(ch) {
    return "aeiou".includes(ch);
  }

  function boubafy(name) {
    const lower = name.toLowerCase().replace(/[^a-z]/g, "");
    if (!lower) return "";

    let soft = lower
      .split("")
      .map((ch) => SOFT_MAP[ch] || ch)
      .join("")
      .replace(/(.)\1+/g, "$1");

    if (!isVowel(soft[soft.length - 1])) {
      soft += SOFT_ENDINGS[Math.floor(Math.random() * SOFT_ENDINGS.length)];
    }

    return soft.charAt(0).toUpperCase() + soft.slice(1);
  }

  let currentName = "";

  function generate() {
    if (!currentName) return;
    generatedEl.textContent = boubafy(currentName);
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
