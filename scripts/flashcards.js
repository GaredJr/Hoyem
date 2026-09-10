(() => {
  const cards = [
    {
      question: "Hva kjennetegner en aritmetisk følge?",
      answer: "Du legger til samme tall hver gang.<span class='sub'>Dette tallet kalles differansen <span class='formula'>d</span>.</span>",
    },
    {
      question: "Rekursiv formel for en aritmetisk følge?",
      answer: "<span class='formula'>a<sub>n+1</sub> = a<sub>n</sub> + d</span>",
    },
    {
      question: "Eksplisitt formel for en aritmetisk følge?",
      answer: "<span class='formula'>a<sub>n</sub> = a<sub>1</sub> + (n - 1)d</span>",
    },
    {
      question: "Hvordan finner du differansen <span class='formula'>d</span>?",
      answer: "<span class='formula'>d = a<sub>n+1</sub> - a<sub>n</sub></span>",
    },
    {
      question: "Sum av en aritmetisk rekke?",
      answer: "<span class='formula'>S<sub>n</sub> = <span class='frac'><span class='num'>a<sub>1</sub> + a<sub>n</sub></span><span class='den'>2</span></span> · n</span><span class='sub'>Gjennomsnitt av første og siste ledd, ganger antall ledd.</span>",
    },
    {
      question: "Hva kjennetegner en geometrisk følge?",
      answer: "Du ganger med samme tall hver gang.<span class='sub'>Dette tallet kalles forholdstallet <span class='formula'>k</span>.</span>",
    },
    {
      question: "Rekursiv formel for en geometrisk følge?",
      answer: "<span class='formula'>a<sub>n+1</sub> = a<sub>n</sub> · k</span>",
    },
    {
      question: "Eksplisitt formel for en geometrisk følge?",
      answer: "<span class='formula'>a<sub>n</sub> = a<sub>1</sub> · k<sup>n-1</sup></span>",
    },
    {
      question: "Hvordan finner du forholdstallet <span class='formula'>k</span>?",
      answer: "<span class='formula'>k = <span class='frac'><span class='num'>a<sub>n+1</sub></span><span class='den'>a<sub>n</sub></span></span></span>",
    },
    {
      question: "Sum av de <span class='formula'>n</span> første leddene i en geometrisk rekke?",
      answer: "<span class='formula'>S<sub>n</sub> = a<sub>1</sub> · <span class='frac'><span class='num'>1 - k<sup>n</sup></span><span class='den'>1 - k</span></span></span>",
    },
    {
      question: "Sum av en uendelig geometrisk rekke?",
      answer: "<span class='formula'>S = <span class='frac'><span class='num'>a<sub>1</sub></span><span class='den'>1 - k</span></span></span>",
    },
    {
      question: "Når konvergerer en uendelig geometrisk rekke?",
      answer: "<span class='formula'>|k| &lt; 1</span><span class='sub'>Forholdstallet må ligge mellom -1 og 1.</span>",
    },
    {
      question: "Hva betyr at en rekke konvergerer?",
      answer: "Summen nærmer seg ett bestemt, endelig tall.",
    },
    {
      question: "Hva betyr at en rekke divergerer?",
      answer: "Summen nærmer seg ikke ett bestemt, endelig tall.",
    },
    {
      question: "Hva er <span class='formula'>1 + 2 + 3 + ... + n</span>?",
      answer: "<span class='formula'><span class='frac'><span class='num'>n(n + 1)</span><span class='den'>2</span></span></span>",
    },
    {
      question: "Hva er <span class='formula'>1² + 2² + 3² + ... + n²</span>?",
      answer: "<span class='formula'><span class='frac'><span class='num'>n(n + 1)(2n + 1)</span><span class='den'>6</span></span></span>",
    },
    {
      question: "Hva betyr <span class='formula'>Σ a<sub>i</sub></span>?",
      answer: "<span class='formula'>a<sub>1</sub> + a<sub>2</sub> + ... + a<sub>n</sub></span>",
    },
    {
      question: "Raskeste måte å skille aritmetisk og geometrisk?",
      answer: "Aritmetisk: pluss <span class='formula'>d</span>.<br><br>Geometrisk: gange med <span class='formula'>k</span>.",
    },
  ];

  const elements = {
    answer: document.querySelector("#answer"),
    back: document.querySelector("#cardBack"),
    card: document.querySelector("#flashcard"),
    flipButton: document.querySelector("#flipBtn"),
    flipButtonLabel: document.querySelector("#flipBtn span"),
    front: document.querySelector("#cardFront"),
    nextButton: document.querySelector("#nextBtn"),
    previousButton: document.querySelector("#prevBtn"),
    progressBar: document.querySelector("#progressBar"),
    progressCurrent: document.querySelector("#progressCurrent"),
    progressTotal: document.querySelector("#progressTotal"),
    question: document.querySelector("#question"),
    shuffleButton: document.querySelector("#shuffleBtn"),
    status: document.querySelector("#deckStatus"),
  };

  if (Object.values(elements).some((element) => !element)) {
    return;
  }

  let order = cards.map((_, index) => index);
  let current = 0;
  let flipped = false;

  function formatIndex(value) {
    return String(value).padStart(2, "0");
  }

  function setFlipped(nextFlipped) {
    flipped = nextFlipped;
    elements.card.classList.toggle("is-flipped", flipped);
    elements.card.setAttribute("aria-pressed", String(flipped));
    elements.card.setAttribute(
      "aria-label",
      flipped ? `Vis spørsmålet på kort ${current + 1}` : `Vis svar på kort ${current + 1}`,
    );
    elements.front.setAttribute("aria-hidden", String(flipped));
    elements.back.setAttribute("aria-hidden", String(!flipped));
    elements.flipButtonLabel.textContent = flipped ? "Vis spørsmål" : "Vis svar";
  }

  function render() {
    const item = cards[order[current]];

    elements.question.innerHTML = item.question;
    elements.answer.innerHTML = item.answer;
    elements.progressCurrent.textContent = formatIndex(current + 1);
    elements.progressTotal.textContent = formatIndex(cards.length);
    elements.progressBar.style.width = `${((current + 1) / cards.length) * 100}%`;
    setFlipped(false);
    elements.status.textContent = `Kort ${current + 1} av ${cards.length}: ${elements.question.textContent}`;
  }

  function showNext() {
    current = (current + 1) % cards.length;
    render();
  }

  function showPrevious() {
    current = (current - 1 + cards.length) % cards.length;
    render();
  }

  function shuffle() {
    for (let index = order.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[randomIndex]] = [order[randomIndex], order[index]];
    }

    current = 0;
    render();
    elements.status.textContent = "Kortene er stokket. Du er på kort 1.";
  }

  function isTypingTarget(target) {
    return target instanceof HTMLElement && (
      target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );
  }

  elements.card.addEventListener("click", () => setFlipped(!flipped));
  elements.flipButton.addEventListener("click", () => setFlipped(!flipped));
  elements.nextButton.addEventListener("click", showNext);
  elements.previousButton.addEventListener("click", showPrevious);
  elements.shuffleButton.addEventListener("click", shuffle);

  document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.code === "Space" && document.activeElement === document.body) {
      event.preventDefault();
      setFlipped(!flipped);
    }
  });

  render();
})();
