import { BACKEND_URL } from "/src/config.js";
import { BASE_PATH } from "/src/config.js";

const {
  RegisterRequest,
  CheckAnmeldungResponse,
} = require("/src/pb/wahlServices_pb.js");
const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");

const wahlService = new wahlServicesClient(BACKEND_URL);

// Selektiere das Formular und die Eingabefelder
const form = document.querySelector("form");
const emailInput = form.querySelector('input[placeholder="E-Mail"]');
const usernameInput = form.querySelector('input[placeholder="Benutzername"]');
const passwordInput = form.querySelector('input[placeholder="Passwort"]');

form.addEventListener("submit", function (event) {
  event.preventDefault(); // Standardverhalten unterdrücken

  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Grundlegende Validierung
  if (!email || !username || !password) {
    alert("Bitte fülle alle Felder aus.");
    return;
  }

  const request = new RegisterRequest();
  request.setUsername(username);
  request.setPassword(password);
  request.setEmail(email);

  wahlService.registerWahlleiter(request, {}, (err, response) => {
    if (err) {
      console.error("Registrierung fehlgeschlagen:", err);
      alert("Registrierung fehlgeschlagen: " + err.message);
      return;
    }

    alert("Registrierung erfolgreich!");

    // Weiterleitung zur Homepage
    window.location.href = `${BASE_PATH}`;
  });
});
