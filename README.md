# main-process

The `main-process` is a NodeJS process that runs Electron.

- `main-process` is created when the Electron application is launched
- `main-process` can create Windows using Apis from Electron.
- `main-process` spawns `shared-process`
- `main-process` and `shared-process` can communicate via ipc

## Profiling the main process

```sh
killall electron &&
npx electron --wait src/profile.js
```

This will create a `profile.cpuprofile` file, which can be loaded inside the chrome devtools performance panel.

## Benchmarking application startup

Use `--wait-10-seconds` to keep the application attached to the terminal and quit it after 10 seconds:

```sh
time lvce --wait-10-seconds
```

## macOS update helper

`ElectronMacUpdater.stage(diskImagePath, version)` accepts an already downloaded and checksum-verified DMG. The update worker owns release discovery, architecture-specific asset selection, downloading, checksum validation, and Install Update/Restart prompts. This native helper mounts the image read-only, copies the bundle beside the installed application, and verifies bundle identity, version, executable architecture, code signature, and signing-team continuity.

`ElectronMacUpdater.restart()` requests normal application shutdown. Replacement happens at `will-quit`, so a cancelled window close leaves the installed app untouched. The previous bundle remains in a private `.lvce-update-*/previous.app` folder next to the app for recovery; replacement failures attempt to restore it. A failed install prevents exit and shows a native error. No elevated permissions, re-signing, or quarantine removal are performed. The installed app's parent directory must be writable; apps running from a DMG, a translocated path, or a symlink must first be moved to a normal application folder.

These commands require a packaged macOS build and coordinated host/update-worker integration. Unit tests cover staging, rollback, validation failures and restart ordering; they do not establish a shipped application's end-to-end update behavior.
