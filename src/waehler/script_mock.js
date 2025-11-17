// =============== MOCK-IMPLEMENTIERUNG ===============
// HINWEIS: Dieser Bereich ersetzt die echten gRPC-Aufrufe für Testzwecke.

// Ändere diese Variable, um das Wahlsystem zu testen (1, 2, 3, oder 4)
const MOCK_ELECTION_SYSTEM = 1; // 1: Approval, 2: Combined Approval, 3: Score, 4: IRV

// Mock-Daten für die Wahl
const mockElection = {
  name: "Testwahl (Mock-Modus)",
  beschreibung: "Dies ist eine Beschreibung für die Testwahl. Hier können alle Wahlsysteme ohne Backend getestet werden.",
  type: MOCK_ELECTION_SYSTEM,
};

// Mock-Daten für die Kandidaten
const mockCandidates = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
];

/**
 * Mock-Funktion, die den gRPC-Aufruf `getElectionForVoter` simuliert.
 * @param {object} request - Das Anfrageobjekt (wird ignoriert).
 * @param {object} metadata - Die Metadaten (werden ignoriert).
 * @param {function} callback - Die Callback-Funktion, die mit (err, response) aufgerufen wird.
 */
function getElectionForVoter_mock(request, metadata, callback) {
  console.log("MOCK: getElectionForVoter aufgerufen.");

  // Simuliere eine erfolgreiche Antwort mit den Mock-Daten
  const response = {
    getElection: () => ({
      getName: () => mockElection.name,
      getBeschreibung: () => mockElection.beschreibung,
      getType: () => mockElection.type,
    }),
    getCandidatesList: () => mockCandidates.map(c => ({
      getId: () => c.id,
      getName: () => c.name,
    })),
  };

  // Simuliere eine kleine Verzögerung wie bei einem echten Netzwerkaufruf
  setTimeout(() => callback(null, response), 100);
}

/**
 * Mock-Funktion, die den gRPC-Aufruf `sendVote` simuliert.
 * @param {object} voteRequest - Das Anfrageobjekt mit den Stimmen.
 * @param {object} metadata - Die Metadaten (werden ignoriert).
 * @param {function} callback - Die Callback-Funktion, die mit (err, response) aufgerufen wird.
 */
function sendVote_mock(voteRequest, metadata, callback) {
  const votes = voteRequest.getVotesList();
  console.log("MOCK: sendVote aufgerufen. Abgegebene Stimmen:", votes);
  alert("Stimme erfolgreich im Mock-Modus abgegeben! Siehe Konsole für Details.");

  // Simuliere eine erfolgreiche Antwort
  setTimeout(() => {
    callback(null, {});
    window.location.href = `${BASE_PATH}`; // Zurück zur Startseite
  }, 500);
}

// Ersetze die echten Service-Methoden durch die Mocks
const wahlService = {
  getElectionForVoter: getElectionForVoter_mock,
  sendVote: sendVote_mock,
};

// Dummy-Objekte, um Fehler bei der Instanziierung zu vermeiden
const request = {};
const metadata = {};
function UnifiedVotingVote() { 
    this.candidateId = 0;
    this.wahlInfo = 0;
}
UnifiedVotingVote.prototype.setCandidateId = function(id) { this.candidateId = id; };
UnifiedVotingVote.prototype.setWahlInfo = function(info) { this.wahlInfo = info; };
function SendVoteRequest() {
    this.votes = [];
}
SendVoteRequest.prototype.setVotesList = function(votes) { this.votes = votes; };
SendVoteRequest.prototype.getVotesList = function() { return this.votes; };


// =============== ENDE MOCK-IMPLEMENTIERUNG ===============

// DOM-Elemente
const header = document.getElementById("election-name");
const descriptionbox = document.getElementById("description-box");
const electiontypeheadline = document.getElementById("election-type");
const electiontypedescription = document.getElementById("election-type-description");
const allInputs = document.querySelector(".all-inputs");
const popup = document.getElementById("popup");
const popupDeny = document.getElementById("popupDeny");
const popupAccept = document.getElementById("popupAccept");
const submitButton = document.getElementById("submitButton");
const form = document.querySelector(".form");
const overlay = document.getElementById("disable-input");
const voteRecap = document.getElementById("vote-recap");

// Hilfsfunktion zum De-/Aktivieren des Formulars
function disableFormInputs(disabled) {
  form.querySelectorAll("input, select, button, textarea").forEach((el) => {
    el.disabled = disabled;
  });
}

// Popup abbrechen
popupDeny.addEventListener("click", function () {
  disableFormInputs(false);
  popup.style.display = "none";
  overlay.style.display = "none";
  document.body.style.overflow = "";
});

// Election Type Texte
const ElectionTypeText = {
  0: "Nicht angegeben",
  1: "Approval Voting",
  2: "Combined Approval Voting",
  3: "Score Voting", // Geändert von "Counted Approval Voting"
  4: "Instant Runoff Voting",
};

const ElectionTypeDescriptionText = {
  0: "Nicht angegeben",
  1: "Kreuzen Sie bitte alle Kandidaten an, denen Sie zustimmen. Beim Approval Voting können Sie so viele Kandidaten ankreuzen, wie Sie wollen",
  2: "Kreuzen Sie bitte alle Kandidaten an, denen Sie zustimmen. Beim Combined Approval Voting können Sie jedem Kandidaten eine Zustimmung oder Ablehnung geben.",
  3: "Bitte vergeben Sie für jeden Kandidaten einen Score von 0 bis 5.",
  4: "Weisen Sie dem Ranking so viele Kandidaten zu wie sie wollen, indem Sie jedem Kandidaten einen eindeutigen Platz zuweisen.",
};

// --- Backend-Aufruf: Wahlinformationen laden ---
wahlService.getElectionForVoter(request, metadata, (err, response) => {
  if (err) {
    console.error("Error fetching election:", err.message);
    return;
  }

  const election = response.getElection();
  const candidates = response.getCandidatesList();

  // Wahlinfos ins UI
  header.innerText = election.getName();
  descriptionbox.innerText = election.getBeschreibung();

  const electiontype = election.getType();
  electiontypeheadline.innerText = "Wahlsystem: " + ElectionTypeText[electiontype];
  electiontypedescription.innerText = ElectionTypeDescriptionText[electiontype];

  console.log("Candidates:", candidates.map(c => c.getName()));

  // --- Kandidaten-HTML generieren ---
  switch (electiontype) {
    case 1: // Approval Voting
      candidates.forEach((c) => {
        const div = document.createElement("div");
        div.className = "vote-input";
        div.innerHTML = `<label>${c.getName()}</label>
                         <input type="checkbox" name="${c.getId()}" value="approved">`;
        allInputs.appendChild(div);
      });
      break;

    case 2: // Combined Approval Voting
      candidates.forEach((c) => {
        const div = document.createElement("div");
        div.className = "vote-input";
        div.innerHTML = `<label>${c.getName()}</label>
                         <div>
                           <label><input type="radio" name="candidate-${c.getId()}" value="approve"> Zustimmung</label>
                           <label><input type="radio" name="candidate-${c.getId()}" value="disapprove"> Ablehnung</label>
                           <label><input type="radio" name="candidate-${c.getId()}" value="abstain" checked> Enthaltung</label>
                         </div>`;
        allInputs.appendChild(div);
      });
      break;

    case 3: // Score Voting
      candidates.forEach((c) => {
        const div = document.createElement("div");
        div.className = "vote-input";
        div.innerHTML = `<label>${c.getName()}</label>
                         <select name="candidate-${c.getId()}">
                           <option value="0">0</option>
                           <option value="1">1</option>
                           <option value="2">2</option>
                           <option value="3">3</option>
                           <option value="4">4</option>
                           <option value="5">5</option>
                         </select>`;
        allInputs.appendChild(div);
      });
      break;

    case 4: // IRV
      for (let i = 1; i <= candidates.length; i++) {
        const div = document.createElement("div");
        div.className = "vote-input";
        div.innerHTML = `<label>Platz ${i}</label>
                         <select name="place-${i}">
                           <option value="" selected>Leer</option>
                         </select>`;
        allInputs.appendChild(div);

        const select = div.querySelector("select");
        candidates.forEach((c) => {
          const option = document.createElement("option");
          option.value = c.getId();
          option.textContent = c.getName();
          select.appendChild(option);
        });
      }
      break;

    default:
      console.warn("Unbekanntes Wahlsystem");
  }

  let votes = [];
  // --- Submit-Handler ---
  submitButton.addEventListener("click", function () {
    disableFormInputs(true);

    votes = []; // Reset votes array

    switch (electiontype) {
      case 1: // Approval Voting
        const checkedBoxes = form.querySelectorAll('input[type="checkbox"][value="approved"]:checked');
        const approvedNames = [];
        checkedBoxes.forEach((box) => {
          const vote = new UnifiedVotingVote();
          vote.setCandidateId(parseInt(box.name));
          vote.setWahlInfo(1); // Approval = 1
          votes.push(vote);
          approvedNames.push(box.previousElementSibling.innerText);
        });
        voteRecap.innerText = "Ausgewählte Kandidaten: " + (approvedNames.join(", ") || "Keine");
        break;

      case 2: // Combined Approval Voting
        const radioRecap = [];
        candidates.forEach(c => {
            const checkedRadio = form.querySelector(`input[name="candidate-${c.getId()}"]:checked`);
            if (!checkedRadio) return;

            const id = c.getId();
            const vote = new UnifiedVotingVote();
            vote.setCandidateId(id);

            let voteValue = 0;
            let voteText = "Enthaltung";
            if (checkedRadio.value === "approve") { 
                voteValue = 1;
                voteText = "Zustimmung";
            } else if (checkedRadio.value === "disapprove") { 
                voteValue = -1;
                voteText = "Ablehnung";
            }
            vote.setWahlInfo(voteValue);
            votes.push(vote);
            if (checkedRadio.value !== 'abstain') {
                radioRecap.push(`${c.getName()}: ${voteText}`);
            }
        });
        voteRecap.innerText = "Ihre Stimmen: " + (radioRecap.join(", ") || "Nur Enthaltungen");
        break;

      case 3: // Score Voting
        const scoreRecap = [];
        candidates.forEach((c) => {
          const select = form.querySelector(`select[name="candidate-${c.getId()}"]`);
          const vote = new UnifiedVotingVote();
          vote.setCandidateId(c.getId());
          const score = parseInt(select.value) || 0;
          vote.setWahlInfo(score);
          votes.push(vote);
          scoreRecap.push(`${c.getName()}: ${score} Punkte`);
        });
        voteRecap.innerText = "Ihre Bewertung: " + scoreRecap.join(", ");
        break;

      case 4: // IRV
        const selects = form.querySelectorAll("select");
        const rankedNames = [];
        const seenIds = new Set();
        let duplicate = false;

        selects.forEach((select, index) => {
          const id = select.value;
          if (id === "") return; // Skip empty selects
          const numId = parseInt(id);

          if (seenIds.has(numId)) {
            duplicate = true;
          } else {
            seenIds.add(numId);
          }

          const vote = new UnifiedVotingVote();
          vote.setCandidateId(numId);
          vote.setWahlInfo(index + 1); // Platz als wahl_info
          votes.push(vote);

          rankedNames.push(`${index + 1}. ${select.selectedOptions[0].textContent.trim()}`);
        });

        if (duplicate) {
          alert("Ein Kandidat wurde mehrfach gewählt. Bitte eindeutige Platzierungen vergeben.");
          disableFormInputs(false);
          return;
        }

        voteRecap.innerText = "Ihr Ranking: " + (rankedNames.join(" | ") || "Keine Auswahl");
        break;
    }

    // Popup anzeigen
    popup.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
  });

  // --- Popup Accept: Stimmen an Backend senden ---
  popupAccept.addEventListener("click", function () {
    const voteRequest = new SendVoteRequest();
    voteRequest.setVotesList(votes);

    wahlService.sendVote(voteRequest, metadata, (err, _) => {
      if (err) {
        console.error("Fehler beim Senden der Stimme:", err.message);
        alert("Fehler beim Senden der Stimme.");
        disableFormInputs(false);
      } else {
        // Erfolgsfall wird im Mock gehandhabt
      }
    });
  });
});
