// rest_server.cpp — embedded HTTP server for skynett81/OrcaSlicer fork
//
// Phase 1 reference implementation. Wires cpp-httplib + nlohmann/json
// onto the existing OrcaSlicer profile manager / slicing pipeline.
// Drop into src/forge/ in your fork, link cpp-httplib (header-only),
// and call rest_server::start(port) from your main entry point when
// the --rest-port CLI flag is set.
//
// What's implemented here:
//   GET  /api/health          - liveness + version
//   GET  /api/version         - lightweight version-only probe
//   GET  /api/profiles        - list profiles, ?kind=printer|filament|process|all
//   GET  /api/profiles/{id}   - single profile with full settings
//   GET  /api/printers        - configured printer bindings
//   POST /api/slice           - placeholder, returns a 501 until
//                               you wire it onto Slic3r::Print
//   POST /api/preview         - placeholder (501)
//   GET  /api/jobs/{id}/gcode - placeholder (404)
//
// Once Phase 1 health/version/profiles works, reuse the pattern for
// /api/slice etc. by hooking into your existing PrintObject /
// GCode/CWriter pipelines.

#include "httplib.h"
#include <nlohmann/json.hpp>
#include <atomic>
#include <chrono>
#include <ctime>
#include <iostream>
#include <string>
#include <vector>

// Project headers — adjust paths to match your OrcaSlicer fork layout.
// #include "Preset.hpp"
// #include "PresetBundle.hpp"
// #include "Print.hpp"

namespace forge_slicer {

static std::string SERVICE_VERSION = "1.10.2-skynett.1";
static std::string UPSTREAM_VERSION = "OrcaSlicer 2.3.1";

static std::atomic<bool> g_started{false};
static std::string g_started_at;

inline std::string iso_now() {
    auto t = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    char buf[32];
    std::strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", std::gmtime(&t));
    return buf;
}

// Bridges into your fork's existing PresetBundle. Replace the body
// with a real lookup once you've decided where to inject the
// PresetBundle reference (Slic3r::GUI::wxGetApp().preset_bundle is the
// usual entry point, but headless mode needs a singleton or a passed-
// in reference).
static nlohmann::json list_profiles(const std::string& kind, const std::string& vendor_filter) {
    using nlohmann::json;
    json arr = json::array();

    // Pseudocode — replace with your fork's preset iteration:
    //
    // auto& bundle = Slic3r::GUI::wxGetApp().preset_bundle;
    // auto enumerate = [&](const Slic3r::PresetCollection& coll, const char* k) {
    //     if (kind != "all" && kind != k) return;
    //     for (const auto& preset : coll) {
    //         if (!vendor_filter.empty() && preset.vendor != vendor_filter) continue;
    //         json p;
    //         p["id"] = preset.name;
    //         p["kind"] = k;
    //         p["name"] = preset.name;
    //         p["vendor"] = preset.vendor ? preset.vendor->name : "";
    //         p["is_default"] = preset.is_default;
    //         p["settings"] = json::parse(preset.config.serialize_json());
    //         arr.push_back(p);
    //     }
    // };
    // enumerate(bundle->printers, "printer");
    // enumerate(bundle->filaments, "filament");
    // enumerate(bundle->prints, "process");

    return arr;
}

static nlohmann::json find_profile(const std::string& id) {
    using nlohmann::json;
    // auto& bundle = Slic3r::GUI::wxGetApp().preset_bundle;
    // for (auto* coll : { &bundle->printers, &bundle->filaments, &bundle->prints }) {
    //     if (auto* p = coll->find_preset(id)) {
    //         json o;
    //         o["id"] = p->name;
    //         o["name"] = p->name;
    //         o["vendor"] = p->vendor ? p->vendor->name : "";
    //         o["settings"] = json::parse(p->config.serialize_json());
    //         return o;
    //     }
    // }
    return nullptr;
}

void start(int port, const std::string& bind, const std::string& token) {
    using nlohmann::json;
    auto* svr = new httplib::Server();

    // CORS: localhost-only by default; add OPTIONS pre-flight if you
    // ever expose this beyond loopback.
    svr->set_default_headers({{"X-Service", "forge-slicer"}});

    // Auth — checks the Bearer token if configured. Localhost-only
    // deployments can run without one.
    auto require_auth = [token](const httplib::Request& req, httplib::Response& res) -> bool {
        if (token.empty()) return true;
        auto auth = req.get_header_value("Authorization");
        if (auth == "Bearer " + token) return true;
        json err;
        err["error"] = "token required";
        err["code"] = "ERR_UNAUTHORIZED";
        res.status = 401;
        res.set_content(err.dump(), "application/json");
        return false;
    };

    g_started_at = iso_now();
    g_started.store(true);

    svr->Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        json j;
        j["ok"] = true;
        j["service"] = "forge-slicer";
        j["version"] = SERVICE_VERSION;
        j["upstream"] = UPSTREAM_VERSION;
        j["started_at"] = g_started_at;
        // j["config_dir"] = Slic3r::data_dir();
        res.set_content(j.dump(), "application/json");
    });

    svr->Get("/api/version", [](const httplib::Request&, httplib::Response& res) {
        json j;
        j["version"] = SERVICE_VERSION;
        j["api"] = 1;
        res.set_content(j.dump(), "application/json");
    });

    svr->Get("/api/profiles", [require_auth](const httplib::Request& req, httplib::Response& res) {
        if (!require_auth(req, res)) return;
        std::string kind = req.has_param("kind") ? req.get_param_value("kind") : "all";
        std::string vendor = req.has_param("vendor") ? req.get_param_value("vendor") : "";
        json j;
        j["profiles"] = list_profiles(kind, vendor);
        res.set_content(j.dump(), "application/json");
    });

    svr->Get(R"(/api/profiles/(.+))", [require_auth](const httplib::Request& req, httplib::Response& res) {
        if (!require_auth(req, res)) return;
        std::string id = req.matches[1];
        auto p = find_profile(id);
        if (p.is_null()) {
            json err;
            err["error"] = "profile not found";
            err["code"] = "ERR_PROFILE_NOT_FOUND";
            res.status = 404;
            res.set_content(err.dump(), "application/json");
            return;
        }
        res.set_content(p.dump(), "application/json");
    });

    svr->Get("/api/printers", [require_auth](const httplib::Request& req, httplib::Response& res) {
        if (!require_auth(req, res)) return;
        json j;
        // Mirror the printer-only subset of /api/profiles.
        j["printers"] = list_profiles("printer", "");
        res.set_content(j.dump(), "application/json");
    });

    // ── Phase 3 placeholder — implement when you're ready ─────────────
    svr->Post("/api/slice", [require_auth](const httplib::Request& req, httplib::Response& res) {
        if (!require_auth(req, res)) return;
        json err;
        err["error"] = "slicing not implemented yet — phase 3";
        err["code"] = "ERR_NOT_IMPLEMENTED";
        res.status = 501;
        res.set_content(err.dump(), "application/json");
    });

    svr->Post("/api/preview", [require_auth](const httplib::Request& req, httplib::Response& res) {
        if (!require_auth(req, res)) return;
        res.status = 501;
        res.set_content("{\"error\":\"preview not implemented\",\"code\":\"ERR_NOT_IMPLEMENTED\"}", "application/json");
    });

    std::cout << "[forge-slicer] REST service listening on " << bind << ":" << port << std::endl;
    svr->listen(bind.c_str(), port);
}

} // namespace forge_slicer
