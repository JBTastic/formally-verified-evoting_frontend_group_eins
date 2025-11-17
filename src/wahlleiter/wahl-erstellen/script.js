import { BACKEND_URL } from "/src/config.js";
import { FRONTEND_URL } from "../../config";
import { BASE_PATH } from "/src/config.js";

const token = localStorage.getItem("wahlleiter_token");
if (!token) {
  window.location.href = `${BASE_PATH}`;
}

// Bibliothek zum verhindern von ungewünschter injection in den Textfelfdern
const sanitizeHtml = require("sanitize-html");

// Hinzufügen von Kandidaten
let add_candidates = document.getElementById("add-candidate-button");
let inputs_candidates = document.querySelector(".all-candidates");
let index_candidates = 2;

add_candidates.addEventListener("click", () => {
  let input = document.createElement("span");
  input.className = "inputf";

  let html = `
        <input type="text" placeholder="Name des Kandidaten" name="Candidate${index_candidates}" required/>
        <div class="close button-like">
            <span class="material-icons-outlined">Entfernen</span>
        </div>
    `;

  input.innerHTML = html;
  inputs_candidates.appendChild(input);
  index_candidates++;

  input.querySelector(".close").addEventListener("click", () => {
    input.classList.add("delete");
    input.innerHTML = "";
    setTimeout(() => {
      input.remove();
    }, 1000);
  });
});

var openelection = false; // Variable ob die Election offen ist muss nachher gesetzt/ausgelesen werden für das "require" der Emails

// Hinzufügen von Wählern
let add_voters = document.getElementById("add-voter-button");
let inputs_voters = document.querySelector(".all-voters");
let index_voters = 2;

add_voters.addEventListener("click", () => {
  let input = document.createElement("span");
  input.className = "inputf";

  let html = `
        <input type="email" placeholder="Email Adresse des Wählers" name="Email${index_voters}" required/>
        <div class="close button-like">
            <span class="material-icons-outlined">Entfernen</span>
        </div>
    `;

  input.innerHTML = html;
  inputs_voters.appendChild(input);
  index_voters++;

  input.querySelector(".close").addEventListener("click", () => {
    input.classList.add("delete");
    input.innerHTML = "";
    setTimeout(() => {
      input.remove();
    }, 1000);
  });
});

// Close-Buttons für bestehende Inputs
document.querySelectorAll(".inputf .close").forEach((close) => {
  close.addEventListener("click", () => {
    let item = close.closest(".inputf");
    item.classList.add("delete");
    item.innerHTML = "";
    setTimeout(() => {
      item.remove();
    }, 1000);
  });
});

// Popup-Funktionalität
let popup = document.getElementById("popup");
let popupDeny = document.getElementById("popupDeny");
let popupAccept = document.getElementById("popupAccept");
let submitButton = document.getElementById("submitButton");
let form = document.querySelector(".form");
let overlay = document.getElementById("disable-input");

// Variable zum zwischenspeichern der Form werte
let submitdata = [];

function disableFormInputs(disabled) {
  form.querySelectorAll("input, select, button, textarea").forEach((el) => {
    el.disabled = disabled;
  });
}

popupDeny.addEventListener("click", function () {
  disableFormInputs(false);
  popup.style.display = "none";
  overlay.style.display = "none";
  document.body.style.overflow = "";
});

const google_protobuf_timestamp_pb = require("google-protobuf/google/protobuf/timestamp_pb.js");

// Initialisierung der Backendandbindung
const {
  CreateElectionRequest,
  getElectionResponse,
} = require("/src/pb/wahlServices_pb.js");
const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");
const { MetaData } = require("grpc-web");

const wahlService = new wahlServicesClient(BACKEND_URL);

// Variablen für die Rückgabe initialisieren
let electionName = "";
let electionDescription = "";
let electionSystem = "";
let candidateList = [];
let emailList = [];
let deadline = "";
let time = "";
let electionPassword = "";

popupAccept.addEventListener("click", function () {
  disableFormInputs(false);

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Leere die Arrays vor dem Befüllen
  candidateList = [];
  emailList = [];

  for (const [key, value] of formData.entries()) {
    if (key === "Election-Name") {
      electionName = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: "discard",
      });
    } else if (key === "Election-Description") {
      electionDescription = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: "discard",
      });
    } else if (key.startsWith("Email")) {
      emailList.push(value);
    } else if (key.startsWith("Candidate")) {
      candidateList.push(
        sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
          disallowedTagsMode: "discard",
        })
      );
    } else if (key === "Deadline") {
      deadline = value;
    } else if (key === "Timestamp") {
      time = value;
    } else if (key === "Election-System") {
      electionSystem = value;
    } else if (key === "open-election") {
      openelection = value === "on"; // Checkbox ist "on" wenn sie ausgewählt ist
    } else if (key === "Election-Password") {
      electionPassword = value;
    }
  }

  // Überprüfe, ob Datum und Zeit vorhanden sind
  if (!deadline || !time) {
    alert("Bitte füllen Sie das Datum und die Uhrzeit vollständig aus.");
    return;
  }

  // Erstelle das Datumsobjekt mit Fehlerbehandlung
  let endDate;
  try {
    // Kombiniere Datum und Zeit zu einem ISO-String
    const dateTimeString = `${deadline}T${time}:00`;
    endDate = new Date(dateTimeString);

    // Überprüfe auf ungültiges Datum
    if (isNaN(endDate.getTime())) {
      throw new Error("Ungültiges Datum");
    }
  } catch (error) {
    console.error("Fehler bei der Datumserstellung:", error);
    alert(
      "Ungültiges Datum oder Uhrzeitformat. Bitte überprüfen Sie Ihre Eingaben."
    );
    return;
  }

  // Erstelle ein Timestamp-Objekt
  const timestamp = new google_protobuf_timestamp_pb.Timestamp();
  timestamp.fromDate(endDate);

  // Mappung der Wahltypen von String zu Enum
  const electionTypeMap = {
    "Approval Voting": proto.wahlServices.ElectionType.APPROVAL_VOTING,
    "Combined Approval":
      proto.wahlServices.ElectionType.COMBINED_APPROVAL_VOTING,
    "Scored Approval": proto.wahlServices.ElectionType.SCORE_VOTING,
    "Instant-Runoff Voting": proto.wahlServices.ElectionType.IRV,
  };

  // Erstelle die ElectionCreationData
  const electionCreationData = new proto.wahlServices.ElectionCreationData();
  electionCreationData.setName(electionName);
  electionCreationData.setBeschreibung(electionDescription);
  electionCreationData.setCandidatesList(candidateList);
  electionCreationData.setIsOpen(openelection);
  if (!openelection) {
    electionCreationData.setVoterEmailsList(emailList); // Schickt die Email-Liste, wenn geschlossene Wahl
                                                        // (wäre nur wichtig, wenn email funktionalität da wäre)
  }

  electionCreationData.setEndTime(timestamp);
  electionCreationData.setElectionType(electionTypeMap[electionSystem]);
  electionCreationData.setPassword(electionPassword);

  // Schicke Metadata
  const metadata = {
    Authorization: "Bearer " + localStorage.getItem("wahlleiter_token"),
  };

  // Erstelle die CreateElectionRequest und setze die electionCreationData
  const request = new proto.wahlServices.CreateElectionRequest();
  request.setElectioncreationdata(electionCreationData);

  // Führe den gRPC-Aufruf aus
  wahlService.createElection(request, metadata, (err, response) => {
    if (err) {
      console.error("gRPC Error:", err);
      alert("Fehler bei der Erstellung der Wahl: " + err.message);
      return;
    }

    const tokens = response.getTokensList();

    const linktext = document.getElementById("textlink");
    const qrbutton = document.getElementById("qr-button");
    const token = tokens[0];
    const tokenbox = document.getElementsByClassName("voter-token-display")[0];
    const qrcodediv = document.getElementById("qrcode");

    qrbutton.addEventListener("click", () => {
      // Weiterleitung zurück auf Wahlleiter-Seite
      window.location.href = `${BASE_PATH}wahlleiter/`;
    });

    if (openelection === true) {
      popup.style.display = "none"; // blendet das Popup aus
      tokenbox.style.display = "block";

      let adress = FRONTEND_URL + "/waehler/";
      let redirect = "?VoterToken=";

      const qrcode = new QRCode(qrcodediv, {
        text: adress + redirect + token,
        width: 500,
        height: 500,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });

      linktext.innerText = adress + redirect + token;
    } else {
      const tableDiv = document.getElementById("table");
      popup.style.display = "none"; // Blendet das popup aus
      tokenbox.style.display = "block";
      if (tokens.length > 0) {
        // Zeige Token in Tabelle zur einfachen Kopierbarkeit
        let html = "<table>";
        tokens.forEach((token) => {
          html += `<tr><td> ${token} </td></tr>`;
        });
        tableDiv.innerHTML = html + "</table>";
        linktext.innerText = ""; // Damit da nicht der defaulttext steht (war der einfachste fix)
      } else {
        console.warn("Wahl erstellt, aber kein Token empfangen.");
        alert("Wahl erstellt, aber es wurde kein Token zurückgegeben.");
      }
    }
  });
});

submitButton.addEventListener("click", function () {
  if (form.checkValidity()) {
    popup.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    disableFormInputs(true);
  } else {
    form.reportValidity();
  }
});

// Beim anklicken von "Offene Wahl" werden die Emailfelder auf nicht required gesetzt
document
  .querySelector('input[name="open-election"]')
  .addEventListener("change", function () {
    const isOpen = this.checked;
    document.querySelectorAll('input[type="email"]').forEach((input) => {
      if (isOpen) {
        openelection = isOpen;
        input.removeAttribute("required");
      } else {
        openelection = isOpen;
        input.setAttribute("required", "required");
      }
    });
  });
