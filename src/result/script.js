import { BACKEND_URL } from "/src/config.js";
const { GetResultRequest } = require("/src/pb/wahlServices_pb.js");
const google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");
const { wahlServicesClient } = require("/src/pb/wahlServices_grpc_web_pb.js");
const wahlService = new wahlServicesClient(BACKEND_URL);

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const wahlid = params.get("wahlid");
  const voterToken = params.get("VoterToken");

  document.getElementById("head1").innerText =
    "Wahlergebnisse werden geladen...";

  let currentElectionId = null;
  let metadata = {};
  let context = null;

  if (wahlid) {
    currentElectionId = parseInt(wahlid);
    const token = localStorage.getItem("wahlleiter_token");
    metadata = { Authorization: "Bearer " + token };
    context = "wahlleiter";
  } else if (voterToken) {
    const parts = voterToken.split("-");
    if (parts.length > 0) {
      currentElectionId = parseInt(parts[0]);
    }
    metadata = { Authorization: "VoterToken " + voterToken };
    context = "voter";
  } else {
    document.getElementById("head1").innerText =
      "Fehler: Keine Wahl-ID oder VoterToken in der URL gefunden.";
    return;
  }

  const request = new GetResultRequest();
  request.setElectionId(currentElectionId);

  let responseReceived = false;
  const timeoutId = setTimeout(() => {
    if (!responseReceived) {
      console.error("Timeout: No response received from backend.");
      document.getElementById("head1").innerText =
        "Verbindung zum Backend fehlgeschlagen oder Timeout. Bitte überprüfen Sie die Browser-Konsole auf CORS-Fehler.";
    }
  }, 5000); // 5 Sekunden timeout

  try {
    wahlService.getResult(request, metadata, (err, response) => {
      responseReceived = true;
      clearTimeout(timeoutId);

      if (err) {
        console.error("Error getting results:", err.message);
        document.getElementById("head1").innerText =
          "Fehler beim Laden der Ergebnisse";
        return;
      }

      const candidates = response.getCandidatesList();
      const metaInfo = response.getMetaInfoMap();

      const candidateNameMap = new Map();
      candidates.forEach((c) => {
        candidateNameMap.set(c.getId(), c.getName());
      });

      const results = [];
      metaInfo.forEach((votes, id) => {
        results.push({
          id: id,
          name: candidateNameMap.get(id) || `Kandidat ${id}`,
          votes: votes,
        });
      });

      results.sort((a, b) => b.votes - a.votes);

      const candidateList = results.map((r) => r.name);
      const voteList = results.map((r) => r.votes);

      const winners = response.getWinnerList().map(c => c.getName());

      // Wahlnamen holen
      let electionName = "Unbekannte Wahl";
      const emptyRequest = new google_protobuf_empty_pb.Empty();

      if (context === "wahlleiter") {
        wahlService.getElections(
          emptyRequest,
          metadata,
          (err, electionsResponse) => {
            let electionType = null;
            if (!err) {
              const elections = electionsResponse.getElectionsList();
              const electionObj = elections.find(
                (e) => e.getId() == currentElectionId
              );
              if (electionObj) {
                electionName = electionObj.getName();
                electionType = electionObj.getType();
              }
            }
            renderChartAndTable(candidateList, voteList, results, electionType, winners, electionName);
          }
        );
      } else if (context === "voter") {
        wahlService.getElectionForVoter(
          emptyRequest,
          metadata,
          (err, electionResponse) => {
            let electionType = null;
            if (!err) {
              const electionObj = electionResponse.getElection();
              if (electionObj) {
                electionName = electionObj.getName();
                electionType = electionObj.getType();
              }
            }
            renderChartAndTable(candidateList, voteList, results, electionType, winners, electionName);
          }
        );
      } else {
        // Fallback, falls context nicht gesetzt ist
        document.getElementById("head1").innerText =
          `Ergebnisse der Wahl "${electionName}":`;
        renderChartAndTable(candidateList, voteList, results);
      }
    });
  } catch (error) {
    console.error(
      "A critical error occurred during getResult call setup:",
      error
    );
    document.getElementById("head1").innerText =
      "Fehler beim Initialisieren der Backend-Verbindung.";
  }
});

function renderChartAndTable(candidateList, voteList, results, electionType, winners, electionName) {
  document.getElementById("head1").innerText = `Ergebnisse der Wahl "${electionName}":`;

  let plotHeader;

  if (electionType === 4) { // IRV
    if (winners.length === 0) {
      plotHeader = "Es gibt keine Gewinner!";
    } else {
      plotHeader = `Der Gewinner ist "${winners[0]}"!`;
    }
    
    const winnerHeader = document.createElement("h2");
    winnerHeader.innerText = plotHeader;
    document.querySelector(".result-content").prepend(winnerHeader);


    const chart = document.getElementById("myChart");
    if (chart) chart.style.display = "none";

    const table = document.getElementById("result-table");
    if (table) table.style.display = "none";

    return;
  }

  // Wenn nicht IRV, normale Logik
  if (winners.length > 1) {
    plotHeader = "Die Gewinner sind: " + winners.map(w => `"${w}"`).join(", ") + "!";
  } else if (winners.length === 1) {
    plotHeader = `Der Gewinner ist "${winners[0]}"!`;
  } else {
    plotHeader = "Es gibt keine Gewinner!";
  }

  //Chart und Tabelle sichtbar machen
  const chart = document.getElementById("myChart");
  if (chart) chart.style.display = "block";

  const table = document.getElementById("result-table");
  if (table) table.style.display = "table";

  var barColors = [
    "#D6AD5C",
    "#003366",
    "#004c99",
    "#0066cc",
    "#0080ff",
    "#3399ff",
    "#66b3ff",
    "#99ccff",
    "#b3d9ff",
    "#cce6ff",
    "#e6f2ff",
  ];

  let topCandidatesCount = Math.min(candidateList.length, 10);

  new Chart("myChart", {
    type: "bar",
    data: {
      labels: candidateList.slice(0, topCandidatesCount),
      datasets: [
        {
          backgroundColor: barColors.slice(0, topCandidatesCount),
          data: voteList.slice(0, topCandidatesCount),
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: plotHeader,
          color: "white",
          font: { size: 25, weight: "bold" },
        },
        legend: { display: false },
      },
    },
  });

  // Tabelle befüllen
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  for (let i = 0; i < results.length; i++) {
    let row = table.insertRow();
    let cellRank = row.insertCell();
    let cellName = row.insertCell();
    let cellVotes = row.insertCell();
    cellRank.textContent = i + 1;
    cellName.textContent = results[i].name;
    cellVotes.textContent = results[i].votes;
  }
}
