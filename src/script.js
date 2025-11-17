import { BACKEND_URL } from "/src/config.js";
import { BASE_PATH } from "/src/config.js";

const {
  CheckAnmeldungRequest,
  CheckTokenResponse,
  GetVotertokenStatus,
} = require("/src/pb/wahlServices_pb.js");
const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");
const { Empty } = require("google-protobuf/google/protobuf/empty_pb.js");

const wahlService = new wahlServicesClient(BACKEND_URL);

window.addEventListener("DOMContentLoaded", () => {

  // Automatischer Token-Check beim Laden
  const token = localStorage.getItem("wahlleiter_token");
  if (token) {

    const metadata = { Authorization: "Bearer " + token };
    const request = new Empty();

    wahlService.checkToken(request, metadata, (err, response) => {
      if (err) {
        console.warn("Tokenprüfung fehlgeschlagen:", err.message);
        return;
      }

      const isValid = response.getIsValid();

      if (isValid) {
        window.location.href = `${BASE_PATH}wahlleiter/`;
      }
    });
  } else {
  }

  // Login-Formular-Handling
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      errorMsg.textContent = "Benutzername oder Passwort ist leer.";
      errorMsg.classList.remove("hidden");
      errorMsg.classList.remove("shake");
      void errorMsg.offsetWidth;
      errorMsg.classList.add("shake");
      return;
    }

    errorMsg.classList.add("hidden");
    errorMsg.classList.remove("shake");

    const request = new CheckAnmeldungRequest();
    request.setUsername(username);
    request.setPassword(password);

    wahlService.checkAnmeldung(request, {}, (err, response) => {
      if (err) {
        console.error("Login fehlgeschlagen:", err);
        errorMsg.textContent = "Benutzername oder Passwort falsch.";
        errorMsg.classList.remove("hidden");
        errorMsg.classList.remove("shake");
        void errorMsg.offsetWidth;
        errorMsg.classList.add("shake");
        return;
      }

      const token = response.getAuthBearerToken();

      localStorage.setItem("wahlleiter_token", token);
      localStorage.setItem("wahlleiter_username", username);

      window.location.href = `${BASE_PATH}wahlleiter/`;
    });
  });

  // Voter-Token Formular Handling
  const voterForm = document.getElementById("voting-form");
  const voterInput = document.getElementById("voter-token");
  const voterError = document.getElementById("voter-token-error");

  voterForm?.addEventListener("submit", function (e) {
    e.preventDefault();

    const votertoken = voterInput.value.trim();
    if (!votertoken) {
      voterError.textContent = "Voting-ID ist leer.";
      voterError.classList.remove("hidden");
      voterError.classList.remove("shake");
      void voterError.offsetWidth; // Reset Animation
      voterError.classList.add("shake");
      return;
    }

    voterError.classList.add("hidden");
    voterError.classList.remove("shake");

    const action = e.submitter.value; // Checkt welcher button die submitrequest stellt

    if (action === "vote") {
      // Aufruf um den Token zu checken
      const { Empty } = require("google-protobuf/google/protobuf/empty_pb.js");
      const tokenChecker = new Empty();
      const metadata = { Authorization: "VoterToken " + votertoken }; // Metadata, enthält den zu checkenden Token

      wahlService.getVotertokenStatus(
        tokenChecker,
        metadata,
        (err, response) => {
          if (err) {
            console.error("Fehler:", err.message);
            return;
          }

          const exists = response.getTokenexists();
          const unused = response.getTokenunused();

          if (!exists) {
            voterError.textContent = "Der Wählertoken ist nicht gültig.";
            voterError.classList.remove("hidden");
            voterError.classList.remove("shake");
            void voterError.offsetWidth; // Reset Animation
            voterError.classList.add("shake");
            return;
          } else if (!unused) {
            voterError.textContent = "Der Wählertoken wurde schon genutzt.";
            voterError.classList.remove("hidden");
            voterError.classList.remove("shake");
            void voterError.offsetWidth; // Reset Animation
            voterError.classList.add("shake");
            return;
          }

          window.location.href = `${BASE_PATH}waehler/?VoterToken=${encodeURIComponent(
            votertoken
          )}`;
        }
      );
    } else if (action === "result") {
      // Weiterleitung zur result mit Query-Parameter
      window.location.href = `${BASE_PATH}result/?VoterToken=${encodeURIComponent(
        votertoken
      )}`;
    } else {
      return;
    }
  });
});

// Alert wenn User von Wahlseite kommt
const params = new URLSearchParams(window.location.search);
if (params.get("vote") === "success") {
  // Kurze Wartezeit, damit der Alert erst zu sehen ist, wenn der Redirect passiert ist
  setTimeout(() => {
    alert("Stimme erfolgreich abgegeben!");

    // Query Parameter entfernen
    params.delete("vote");
    const newUrl =
      window.location.pathname +
      (params.toString() ? "?" + params.toString() : "") +
      window.location.hash;

    window.history.replaceState({}, "", newUrl);
  }, 100);
}
