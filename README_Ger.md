# FVE-Voting Website

## Erklärungen

### ProtoBufs

[gRPC Web](https://grpc.io/docs/platforms/web/basics/)

Befehle zum Generieren der JavaScript-Dateien aus Protobufs:

```bash
protoc -I=$DIR echo.proto \
  --js_out=import_style=commonjs:$OUT_DIR
```

\$DIR ist der Ordner, in dem sich die Proto-Dateien befinden (z. B. proto/proto).  
echo.proto muss durch den Namen der entsprechenden Protobuf-Datei ersetzt werden.  
\$OUT_DIR ist der Ordner, in den die generierten Dateien geschrieben werden sollen, z. B. src/wahlleiter/wahl-erstellen/.

```bash
protoc -I=$DIR echo.proto \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:$OUT_DIR
```

\$DIR ist der Ordner mit den Proto-Dateien, z. B. proto/proto/.  
echo.proto muss durch den Namen und Pfad der Protobuf-Datei ersetzt werden.  
\$OUT_DIR ist der Zielordner für die generierten Dateien, z. B. src/wahlleiter/wahl-erstellen/.

Danach die Dateien mit Webpack bündeln:

```bash
npx webpack $IN --output-path $OUT --output-filename $FILE_NAME --mode=development
```

\$IN ist die JavaScript-Datei, die gebündelt werden soll, z. B. src/wahlleiter/wahl-erstellen/script.js.  
\$OUT ist der Zielordner, z. B. src/dist/.  
\$FILE_NAME ist der Name der zu erstellenden Datei, z. B. wahlServices.js.

### Benutzte Frameworks

Wir nutzen [TailwindCSS](https://tailwindcss.com/) als CLI-Tool, um das CSS der Website zu bauen.  
Zuerst muss Node.js installiert werden. Mit `npm -v` und `node -v` lässt sich die Installation prüfen.  
Danach im Projektordner `npm install` ausführen.

Die Website kann auf fünf Arten gebaut werden:  
a) `npm run build`  
b) `npm run serve`  
c) `npm run devcss`  
d) `npm run devproto`

- zu a): baut die Website einmalig mit CSS und Protobufs
- zu b): stellt die Website lokal mit dem npm Plugin `live-server` online
- zu c): baut die Website dauerhaft automatisch mit CSS
- zu d): baut die Website dauerhaft automatisch mit Protobufs

Zum lokalen Hosting empfehle ich, einmalig `sudo npm install -g live-server` auszuführen (ist bereits in `npm install` enthalten) und dann `live-server ./src` zu starten. Dies ist stabiler als die Live Server Extension in VSCode, die manchmal JavaScript als HTML interpretiert.

Alternativ kann nach Installation von `live-server` auch `npm run serve` genutzt werden und die Website unter `http://localhost:8080` geöffnet werden.

Ich empfehle VSCode. Dort kann alternativ die [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) genutzt werden, allerdings kann es mit JavaScript zu Problemen kommen, weshalb die oben genannte Methode zuverlässiger ist.

### Build Script

#### Erklärung

Das Build Script, das bei `npm run build` ausgeführt wird, automatisiert die Erstellung aller benötigten Assets für die Website in mehreren Schritten:

1. **Protobuf Generierung**

   - Erstellt den Ordner `src/pb`, falls er nicht existiert.
   - Kompiliert die Protobuf Datei `wahlServices.proto` aus `proto/proto`:
     - JavaScript Code für gRPC Web (`--js_out`)
     - gRPC-Web Stub Code (`--grpc-web_out`)
   - Ergebnis: Alle Protobuf-Dateien liegen anschließend im Ordner `src/pb`.

2. **Tailwind CSS bauen**

   - Nutzt `npx tailwindcss`, um aus `src/input.css` und den TailwindCSS Utility-Klassen im HTML die finale CSS-Datei `src/output.css` zu generieren.

3. **Webpack für einzelne Module**

   - Für jedes wichtige Frontend-Modul wird Webpack ausgeführt:
     - `wahl-erstellen`: `script.js` → `src/dist/wahlErstellen.js`
     - `wahlleiter-registrieren`: `script.js` → `src/dist/wahlleiterRegistrieren.js`
     - `wahlleiter-anmelden`: `script.js` → `src/dist/wahlleiterAnmeldung.js`
     - `wahlleiter-homepage`: `script.js` → `src/dist/wahlleiterHomepage.js`
     - `voting`: `script.js` → `src/dist/voting.js`
     - `result`: `script.js` → `src/dist/result.js`
   - Jeder Schritt nutzt den `development` Mode für eine schnelle, unminimierte Ausgabe.

4. **Ergebnis**
   - Nach Abschluss liegen alle gebauten Dateien in `src/dist`.
   - CSS, gRPC-Stubs und gebündeltes JavaScript stehen zur direkten Einbindung in die HTML-Dateien bereit.

Dieses Script sorgt dafür, dass die Website vollständig gebaut und lokal lauffähig ist, ohne jeden Schritt manuell ausführen zu müssen.  
Bei jeder Änderung an den Quelldateien, also an den Protobuf-Dateien, CSS-Dateien oder JavaScript-Dateien, muss das Script erneut ausgeführt werden, um die Änderungen zu übernehmen.

#### Erweiterung

Um eine neue JavaScript Datei mit Webpack zu bündeln, müssen folgende Schritte durchgeführt werden:

- Die neue Datei im entsprechenden Modul-Ordner erstellen (z.B. `src/.../script.js`).
- im `build.sh` Skript direkt über das "echo "✅ Alles erfolgreich gebaut."" muss
  ```bash
  echo "[$NUM] Webpack: [$NAME]"
  npx webpack ./src/[...]/script.js \
    --output-path ./src/dist \
    --output-filename [$NAME].js \
    --mode=development
  ```
  hinzugefügt werden.
- Im zugehörigen HTML-Dokument muss der neue Pfad der JavaScript Datei die im `dist` Ordner liegt statt des alten Pfades eingebunden werden
- `npm run build` ausführen, um die Datei zu bündeln.

### Ordneraufbau

#### node_modules

Wurde beim Initialisieren von npm erstellt, nicht verändern.

#### proto

Enthält das Protobuf GitLab Repository als git submodule mit den Protobuf-Dateien.

#### src

Hier befindet sich die grundlegende Ordnerstruktur (HTML, CSS, JavaScript, etc.).

### Einzelne Dateien

#### package-lock.json

Einmalig beim Initialisieren von npm erstellt, nicht ändern.

#### package.json

Wurde beim Initialisieren von npm erstellt. Darin lassen sich die `npm run` Befehle anpassen.

#### README.md

Diese Datei, die Sie gerade lesen.
