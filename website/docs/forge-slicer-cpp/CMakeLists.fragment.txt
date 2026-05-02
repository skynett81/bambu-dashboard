# CMakeLists fragment — drop into your OrcaSlicer fork's src/forge/
# CMakeLists.txt or merge into the top-level src/CMakeLists.txt.
#
# Adds:
#   - cpp-httplib (header-only, fetched via FetchContent)
#   - nlohmann/json (already a dep in OrcaSlicer — links against the
#     existing target if present)
#   - forge_slicer_rest static library that exposes
#     forge_slicer::start(port, bind, token)

cmake_minimum_required(VERSION 3.16)

include(FetchContent)

# cpp-httplib is header-only; fetched at configure time.
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG        v0.16.0   # pin to a known-good release
)
FetchContent_MakeAvailable(httplib)

# nlohmann/json — most OrcaSlicer forks already pull this in. If it's
# not available as a target in your fork, uncomment:
# FetchContent_Declare(
#     nlohmann_json
#     GIT_REPOSITORY https://github.com/nlohmann/json.git
#     GIT_TAG        v3.11.3
# )
# FetchContent_MakeAvailable(nlohmann_json)

add_library(forge_slicer_rest STATIC
    rest_server.cpp
)

target_include_directories(forge_slicer_rest
    PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(forge_slicer_rest
    PUBLIC httplib::httplib
    PUBLIC nlohmann_json::nlohmann_json
    # Link against your existing libraries to access PresetBundle:
    # PUBLIC libslic3r
    # PUBLIC libslic3r_gui   # only if you need GUI presets in headless mode
)

# Optional: if cpp-httplib should support TLS, depend on OpenSSL and
# define CPPHTTPLIB_OPENSSL_SUPPORT. Localhost-only deployments don't
# need this.
# find_package(OpenSSL REQUIRED)
# target_link_libraries(forge_slicer_rest PUBLIC OpenSSL::SSL OpenSSL::Crypto)
# target_compile_definitions(forge_slicer_rest PUBLIC CPPHTTPLIB_OPENSSL_SUPPORT)

# In your main executable, after building forge_slicer_rest:
#   target_link_libraries(orca-slicer PRIVATE forge_slicer_rest)
#   #include "forge/rest_server.cpp" → switch to a header if you want
#   to call forge_slicer::start() from main.cpp / OrcaSlicer.cpp.
