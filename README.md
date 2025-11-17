# FVE-Voting Website

## Links
[Our Backend Repo](https://github.com/Fabmeister/formally-verified-evoting_backend_group_eins)  
[Our Protobuf Repo](https://github.com/Fabmeister/formally-verified-evoting_protobufs_group_eins/)

---

[Official gRPC Web](https://grpc.io/docs/platforms/web/basics/)

## Explanations

### ProtoBufs

Commands to generate the JavaScript files from Protobufs:

```bash
protoc -I=$DIR echo.proto \
  --js_out=import_style=commonjs:$OUT_DIR
```

\$DIR is the folder where the proto files are located (e.g. proto/proto).
echo.proto must be replaced by the name of the corresponding Protobuf file.
\$OUT_DIR is the folder where the generated files should be written, e.g. src/wahlleiter/wahl-erstellen/.

```bash
protoc -I=$DIR echo.proto \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:$OUT_DIR
```

\$DIR is the folder with the proto files, e.g. proto/proto/.
echo.proto must be replaced by the name and path of the Protobuf file.
\$OUT_DIR is the destination folder for the generated files, e.g. src/wahlleiter/wahl-erstellen/.

Then bundle the files with Webpack:

```bash
npx webpack $IN --output-path $OUT --output-filename $FILE_NAME --mode=development
```

\$IN is the JavaScript file to be bundled, e.g. src/wahlleiter/wahl-erstellen/script.js.
\$OUT is the destination folder, e.g. src/dist/.
\$FILE_NAME is the name of the file to be created, e.g. wahlServices.js.

### Used Frameworks

We use [TailwindCSS](https://tailwindcss.com/) as a CLI tool to build the website's CSS.
First, Node.js must be installed. You can check the installation with `npm -v` and `node -v`.
Then run `npm install` in the project folder.

The website can be built in five ways:
a) `npm run build`
b) `npm run serve`
c) `npm run devcss`
d) `npm run devproto`

- to a): builds the website once with CSS and Protobufs
- to b): puts the website online locally with the npm plugin `live-server`
- to c): builds the website continuously automatically with CSS
- to d): builds the website continuously automatically with Protobufs

For local hosting, I recommend running `sudo npm install -g live-server` once (it's already included in `npm install`) and then starting `live-server ./src`. This is more stable than the Live Server Extension in VSCode, which sometimes interprets JavaScript as HTML.

Alternatively, after installing `live-server`, you can also use `npm run serve` and open the website at `http://localhost:8080`.

I recommend VSCode. There you can alternatively use the [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), but there can be problems with JavaScript, which is why the above method is more reliable.

### Build Script

#### Explanation

The build script, which is executed with `npm run build`, automates the creation of all necessary assets for the website in several steps:

1.  **Protobuf Generation**

    -   Creates the `src/pb` folder if it doesn't exist.
    -   Compiles the Protobuf file `wahlServices.proto` from `proto/proto`:
        -   JavaScript code for gRPC Web (`--js_out`)
        -   gRPC-Web stub code (`--grpc-web_out`)
    -   Result: All Protobuf files are then located in the `src/pb` folder.

2.  **Build Tailwind CSS**

    -   Uses `npx tailwindcss` to generate the final CSS file `src/output.css` from `src/input.css` and the TailwindCSS utility classes in the HTML.

3.  **Webpack for individual modules**

    -   Webpack is run for each important frontend module:
        -   `wahl-erstellen`: `script.js` → `src/dist/wahlErstellen.js`
        -   `wahlleiter-registrieren`: `script.js` → `src/dist/wahlleiterRegistrieren.js`
        -   `wahlleiter-anmelden`: `script.js` → `src/dist/wahlleiterAnmeldung.js`
        -   `wahlleiter-homepage`: `script.js` → `src/dist/wahlleiterHomepage.js`
        -   `voting`: `script.js` → `src/dist/voting.js`
        -   `result`: `script.js` → `src/dist/result.js`
    -   Each step uses the `development` mode for a fast, unminified output.

4.  **Result**
    -   After completion, all built files are in `src/dist`.
    -   CSS, gRPC stubs and bundled JavaScript are ready for direct integration into the HTML files.

This script ensures that the website is fully built and can be run locally without having to perform each step manually.
Every time you make a change to the source files, i.e. the Protobuf files, CSS files or JavaScript files, the script must be run again to apply the changes.

#### Extension

To bundle a new JavaScript file with Webpack, the following steps must be performed:

-   Create the new file in the corresponding module folder (e.g. `src/.../script.js`).
-   in the `build.sh` script directly above the 'echo "✅ Build complete."' must be
    ```bash
    echo "[$NUM] Webpack: [$NAME]"
    npx webpack ./src/[...]/script.js \
      --output-path ./src/dist \
      --output-filename [$NAME].js \
      --mode=development
    ```
    be added.
-   In the corresponding HTML document, the new path of the JavaScript file located in the `dist` folder must be included instead of the old path.
-   Run `npm run build` to bundle the file.

### Folder structure

#### node_modules

Was created when npm was initialized, do not change.

#### proto

Contains the Protobuf GitLab repository as a git submodule with the Protobuf files.

#### src

This is where the basic folder structure is located (HTML, CSS, JavaScript, etc.).

### Individual files

#### package-lock.json

Created once when npm was initialized, do not change.

#### package.json

Was created when npm was initialized. The `npm run` commands can be customized in it.

#### README.md

This file you are currently reading.

## About and credits
This is a student project made as part of the computer science major at the University Regensburg.
During the duration of the project gitlab was used but now ported to github in way that email addresses wouldn't be leaked. Unfortunatly the git history was lost during this process.
The project group (called Gruppe EinS) consisted of (with the respected area of responsibility):
   1. <https://github.com/Vok321> Backend dev and Dafny
   2. <https://github.com/Fabmeister> Backend dev, architecture and technical planning
   3. <https://github.com/4lekse1> DevOps (in the original gitlab) and most of the unit tests
   4. <https://github.com/JBTastic> **Frontend/Web dev**
   5. <https://github.com/Tobox-xD> **Frontend/Web dev**