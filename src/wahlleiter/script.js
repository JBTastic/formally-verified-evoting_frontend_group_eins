import { BACKEND_URL } from "/src/config.js";
import { BASE_PATH } from "/src/config.js";

function redirectToStart() {
  window.location.href = BASE_PATH;
}

const token = localStorage.getItem("wahlleiter_token");
if (!token) {
  redirectToStart();
}

const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");
const { Empty } = require("google-protobuf/google/protobuf/empty_pb.js");
const wahlService = new wahlServicesClient(BACKEND_URL);

$(document).ready(function () {
  $(".back").on("click", function (e) {
    e.preventDefault(); // Standard-Weiterleitung verhindern

    const metadata = { Authorization: "Bearer " + token };
    const request = new Empty();

    wahlService.abmelden(request, metadata, (err, _) => {
      if (err) {
        console.warn("Abmelden fehlgeschlagen:", err.message);
      }

      // Egal ob erfolgreich oder nicht: Token löschen und zurück zur Startseite
      localStorage.removeItem("wahlleiter_token");
      localStorage.removeItem("wahlleiter_username");
      redirectToStart();
    });
  });
});
