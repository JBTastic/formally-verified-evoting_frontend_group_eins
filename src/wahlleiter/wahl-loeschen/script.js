const token = localStorage.getItem("wahlleiter_token");
if (!token) {
  window.location.href = "/";
}

// Button zum Hinzufügen
const add_elections = document.getElementById("add-election");

// Container, in den die Buttons kommen
const elections_container = document.querySelector(".election");

// Zähler für die Wahlen
let index = 1;

let currentElection = 0; // Variable um zu speichern, welcher knopf gedrückt wurde

let deletionMessage = document.getElementById("deletion-message"); // Element, damit man den text im popup anpassen kann

let buttonList = [];

add_elections.addEventListener("click", () => {
  // Neuen Button erstellen
  const button = document.createElement("button");
  button.textContent = `Wahlname der lange ist ${index}`;

  button.className = "election-button";

  button.id = index; // Button ID auf den zähler setzen
  buttonList.push(button.id); // ID in Liste alle buttons einfügen

  // Hinzufügen des eventlisteners für den jeweiligen button
  button.addEventListener("click", () => {
    popup.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    currentElection = button.id; // Setzt eine variable auf die ID des gedrückten knopfes, da das popup nur versteckt oder gezeigt wird
                                 // und es damit keine möglichkeit gibt zu wissen, welcher knopf das popup ausgelöst hat
    deletionMessage.textContent = `Soll Wahl "${button.textContent}" wirklich gelöscht werden?`; // Ändert den text auf dem popup
  });


  index++; // Zähler erhöhen
  // Button einfügen
  elections_container.appendChild(button);
});

// Popup-Funktionalität
let popup = document.getElementById("popup");
let popupDeny = document.getElementById("popupDeny");
let popupAccept = document.getElementById("popupAccept");
let electionButtons = document.getElementsByClassName("election-button");
let overlay = document.getElementById("disable-input");

popupDeny.addEventListener("click", function () {
  popup.style.display = "none";
  overlay.style.display = "none";
  document.body.style.overflow = "";
});

popupAccept.addEventListener("click", function () {
  // Löschen der Wahl
  popup.style.display = "none"; // Versteckt das popup
  overlay.style.display = "none"; // Versteckt das overlay
  document.body.style.overflow = ""; // Erlaubt es dem user wieder zu scrollen

  let buttonToDelete = document.getElementById(currentElection); // Erstellt ein elemnt für den button, der gelöscht werden soll
  elections_container.removeChild(buttonToDelete); // Löscht den button (IDs anpassen ist unnötig die werden eh bei jedem seite neuladen neu vergeben)
  // console.log(`Wahl ${currentElection} wurde gelöscht`); // hier kommt dann der löschen call ans backend
});
