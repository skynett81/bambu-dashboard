# Wiring REST server into the fork's main entry point

## Step 1 — CLI flag

Find your fork's argument parser (usually `src/Slic3r.cpp` or
`src/OrcaSlicer.cpp`). Add a `--rest-port` option:

```cpp
{ 'p', "rest-port", "Start a REST service on the given port (e.g. 8765)" },
{ '\0', "rest-bind", "Bind address for REST service (default 127.0.0.1)" },
{ '\0', "rest-token", "Optional Bearer token for the REST service" },
```

Then read the parsed values:

```cpp
int rest_port = parser.get<int>("rest-port", -1);
std::string rest_bind = parser.get<std::string>("rest-bind", "127.0.0.1");
std::string rest_token = parser.get<std::string>("rest-token", "");
```

## Step 2 — Boot the service

After the GUI / CLI subsystem is up but before entering the event
loop, launch the REST server in a background thread:

```cpp
#include "forge/rest_server.cpp"   // or include via header

if (rest_port > 0) {
    std::thread rest_thread([rest_port, rest_bind, rest_token]() {
        forge_slicer::start(rest_port, rest_bind, rest_token);
    });
    rest_thread.detach();
}
```

For headless mode (no GUI window), skip `wxApp::OnInit()` and just
keep the main thread alive while the REST thread serves requests.

## Step 3 — Wire profile listing

Inside `rest_server.cpp::list_profiles()`, the placeholder iterates a
hypothetical `bundle->printers / filaments / prints`. Your fork's real
entry point depends on whether headless mode has access to the GUI's
`PresetBundle`:

- **GUI mode:** `Slic3r::GUI::wxGetApp().preset_bundle`
- **Headless mode:** Construct a `PresetBundle` directly from
  `data_dir()`. See `Slic3r::PresetBundle::load_presets()` in the
  upstream codebase for an example.

Replace the `// auto& bundle = ...` block in `list_profiles()` with
the real iteration. Convert each `Slic3r::Preset::config` into a JSON
blob via `serialize_json()` (already exists in OrcaSlicer's
DynamicPrintConfig).

## Step 4 — Implement `/api/slice`

The buffered slice endpoint takes a multipart upload, runs your
existing `Slic3r::Print` pipeline, writes the result to a temp file,
and returns metadata. Sketch:

```cpp
svr->Post("/api/slice", [](const httplib::Request& req, httplib::Response& res) {
    if (!req.is_multipart_form_data()) { /* 400 */ return; }
    auto model_file = req.get_file_value("model");
    auto printer_id = req.get_file_value("printer_id").content;
    auto filament_ids_json = req.get_file_value("filament_ids").content;
    auto process_id = req.get_file_value("process_id").content;

    // 1. Write model bytes to tmp .stl/.3mf
    // 2. Construct Slic3r::Model from the file
    // 3. Apply printer/filament/process configs
    // 4. Slic3r::Print print; print.set_status_callback(...);
    // 5. print.process();
    // 6. Slic3r::GCode::export_gcode(print, tmp_gcode_path);
    // 7. Build job_id, store job record, respond with paths + estimated time
});
```

For Phase 5 (SSE progress), pass a status callback to `Print::process`
and forward each percent update as a `data: {"stage":..,"pct":..}\n\n`
chunk.

## Step 5 — Test against the mock first

3DPrintForge ships a Node mock at `tools/forge-slicer-mock.js` that
implements the full contract. Run it on a different port while you
develop:

```bash
node tools/forge-slicer-mock.js --port 8766
```

Then point 3DPrintForge at the mock from the Settings card or via env:

```bash
FORGE_SLICER_URL=http://127.0.0.1:8766 npm start
```

This validates the 3DPrintForge integration end-to-end without
waiting for your C++ build, and gives you a known-good payload shape
to cross-check your fork against.
