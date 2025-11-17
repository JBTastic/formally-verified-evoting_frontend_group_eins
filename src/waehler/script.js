import { BACKEND_URL } from "/src/config.js";
import { BASE_PATH } from "/src/config.js";

const {
  getElectionRequest,
  getElectionResponse,
  SendVoteRequest,
  UnifiedVotingVote,
} = require("/src/pb/wahlServices_pb.js");
const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");
const { MetaData } = require("grpc-web");
const wahlService = new wahlServicesClient(BACKEND_URL);

const { Empty } = require("google-protobuf/google/protobuf/empty_pb.js");
const request = new Empty();

const params = new URLSearchParams(window.location.search);
const VoterToken = params.get("VoterToken");

// Metadata für gRPC
const metadata = { Authorization: "VoterToken " + VoterToken };

// DOM-Elemente
const header = document.getElementById("election-name");
const descriptionbox = document.getElementById("description-box");
const electiontypeheadline = document.getElementById("election-type");
const electiontypedescription = document.getElementById(
  "election-type-description"
);
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
  3: "Counted Approval Voting",
  4: "Instant Runoff Voting",
};

const ElectionTypeDescriptionText = {
  0: "Nicht angegeben",
  1: "Kreuzen Sie bitte alle Kandidaten an, denen Sie zustimmen. Beim Approval Voting können Sie so viele Kandidaten ankreuzen, wie Sie wollen.",
  2: "Kreuzen Sie bitte alle Kandidaten an, denen Sie zustimmen. Beim Combined Approval Voting können Sie jedem Kandidaten eine Zustimmung oder Ablehnung geben.",
  3: "Bitte vergeben Sie für jeden Kandidaten einen Score.",
  4: "Weisen Sie dem Ranking so viele Kandidaten zu wie sie wollen.",
};

// Backend Aufruf: Wahlinformationen laden
wahlService.getElectionForVoter(request, metadata, (err, response) => {
  if (err) {
    console.error("Error fetching election:", err.message);
    return;
  }

  const election = response.getElection();
  const candidates = response.getCandidatesList();

  // Prüfen ob die Wahl bereits abgelaufen ist
  const now = new Date();
  const endTimeProto = election.getEndTime();
  const endTime = endTimeProto ? endTimeProto.toDate() : null;


  // Checked ob die Wahl abgelaufen ist (Erkennt nicht manuelle Änderungen an der Datenbank)
  if (endTime && now.getTime() > endTime.getTime()) {
    header.innerText = election.getName() + " (abgelaufen)";
    descriptionbox.innerText =
      "Die Wahl ist bereits abgelaufen. Es kann nicht mehr abgestimmt werden.";
    disableFormInputs(true);
    submitButton.disabled = true;
    return;
  }

  // Aufruf um den Token zu checken
  const tokenChecker = new Empty();

  wahlService.getVotertokenStatus(tokenChecker, metadata, (err, response) => {
    if (err) {
      console.error("Fehler:", err.message);
      return;
    }

    const exists = response.getTokenexists();
    const unused = response.getTokenunused();

    if (!unused) {
      header.innerText = election.getName() + " (bereits abgestimmt)";
      descriptionbox.innerText = "Sie haben für diese Wahl bereits abgestimmt.";
      disableFormInputs(true);
      submitButton.disabled = true;
      return;
    } else if (!exists) {
      header.innerText = "Falscher Token";
      descriptionbox.innerText =
        "Sie haben einen Wählertoken, der in unserer Datenbank nicht existiert.";
      disableFormInputs(true);
      submitButton.disabled = true;
      return;
    } else {
    }
  });

  // Wahlinfos ins UI
  header.innerText = election.getName();
  descriptionbox.innerText = election.getBeschreibung();

  const electiontype = election.getType();
  electiontypeheadline.innerText =
    "Wahlsystem: " + ElectionTypeText[electiontype];
  electiontypedescription.innerText = ElectionTypeDescriptionText[electiontype];


  // Kandidaten-HTML generieren
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
        div.innerHTML = `<label name="candidate-${c.getId()}">${c.getName()}</label>
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
        div.innerHTML = `<label name="candidate-${c.getId()}">${c.getName()}</label>
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

  // Submit-Handler
  let votes = [];
  submitButton.addEventListener("click", function () {
    disableFormInputs(true);

    votes = [];

    switch (electiontype) {
      case 1: // Approval Voting
        const checkedBoxes = form.querySelectorAll(
          'input[type="checkbox"][value="approved"]:checked'
        );
        const approvedNames = [];
        checkedBoxes.forEach((box) => {
          const vote = new UnifiedVotingVote();
          vote.setCandidateId(parseInt(box.name));
          vote.setWahlInfo(1); // Approval = 1
          votes.push(vote);
          approvedNames.push(box.previousElementSibling.innerText);
        });
        voteRecap.innerText =
          "Ausgewählte Kandidaten: " + approvedNames.join(", ");
        break;

      case 2: // Combined Approval Voting
        const radios = form.querySelectorAll('input[type="radio"]:checked');
        const radioNames = [];
        // Für die Recap Nachricht
        const approval = []; // angenommen
        const rejection = []; // abgelehnt
        const abstention = []; // enthalten

        radios.forEach((radio) => {
          const candidateName = document.querySelector(
            `label[name=${radio.name}]`
          ).textContent;
          const match = radio.name.match(/^candidate-(\d+)$/);
          if (!match) return;
          const id = parseInt(match[1]);
          const vote = new UnifiedVotingVote();
          vote.setCandidateId(id);
          if (radio.value === "approve") {
            vote.setWahlInfo(1);
            approval.push(candidateName);
          } else if (radio.value === "disapprove") {
            vote.setWahlInfo(-1);
            rejection.push(candidateName);
          } else {
            vote.setWahlInfo(0);
            abstention.push(candidateName);
          }
          votes.push(vote);
          radioNames.push(
            radio.closest(".vote-input").querySelector("label").innerText
          ); // Label mit richtiger candidateId suchen um den Namen zu bekommen
        });
        // zusammenbauen des Texts für den VoteRecap
        var recapText = "";
        if (approval.length != 0) {
          recapText += "Angenommen: " + approval.join(", ") + " ";
        }
        if (rejection.length != 0) {
          recapText += "Abgelehnt: " + rejection.join(", ") + " ";
        }
        if (abstention.length != 0) {
          recapText += "Enthalten: " + abstention.join(", ");
        }
        voteRecap.innerText = recapText;
        break;

      case 3: // Score Voting
        var recapText = "";
        candidates.forEach((c) => {
          const select = form.querySelector(
            `select[name="candidate-${c.getId()}"]`
          );
          const vote = new UnifiedVotingVote();
          vote.setCandidateId(c.getId());
          var voteValue = parseInt(select.value) || 0; // Wert zwischenspeichern
          vote.setWahlInfo(voteValue);
          votes.push(vote);
          recapText += c.getName() + ": " + voteValue + " ";
        });
        voteRecap.innerText = recapText;
        break;

      case 4: // IRV
        const selects = form.querySelectorAll("select");
        const rankedNames = [];
        const seenIds = [];
        let duplicate = false;
        let gapDetected = false;

        for (let index = 0; index < selects.length; index++) {
          const select = selects[index];
          const id = parseInt(select.value);

          if (isNaN(id)) {
            // Leerer Platz
            gapDetected = true;
            rankedNames.push(""); // optional für Recap
            continue;
          }

          if (gapDetected) {
            // Lücke oben gefunden
            voteRecap.innerText = "";
            disableFormInputs(false);
            votes = [];
            popup.style.display = "none";
            overlay.style.display = "none";
            document.body.style.overflow = "";
            alert(
              "Leere Plätze dürfen nur unten sein. Bitte lückenlos von oben wählen."
            );
            return; // Abbruch der ganzen Submit-Funktion
          }

          if (seenIds.includes(id)) duplicate = true;
          else seenIds.push(id);

          const vote = new UnifiedVotingVote();
          vote.setCandidateId(id);
          vote.setWahlInfo(index + 1);
          votes.push(vote);

          rankedNames.push(select.selectedOptions[0].textContent.trim());
        }

        if (duplicate) {
          voteRecap.innerText = "";
          disableFormInputs(false);
          votes = [];
          popup.style.display = "none";
          overlay.style.display = "none";
          document.body.style.overflow = "";
          alert(
            "Ein Kandidat wurde mehrfach gewählt. Bitte jeden Kandidaten höchstens einmal wählen."
          );
          return;
        }

        voteRecap.innerText =
          "Ranking der Kandidaten: " + rankedNames.filter((n) => n).join(", ");
        break;
    }

    // Popup anzeigen
    popup.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
  });

  // Popup Accept: Stimmen an Backend senden
  popupAccept.addEventListener("click", function () {
    const voteRequest = new SendVoteRequest();
    voteRequest.setVotesList(votes);

    wahlService.sendVote(voteRequest, metadata, (err, _) => {
      if (err) {
        console.error("Fehler beim Senden der Stimme:", err.message);
        alert("Fehler beim Senden der Stimme.");
        disableFormInputs(false);
      } else {
        window.location.href = `${BASE_PATH}?vote=success`;
      }
    });
  });
});
