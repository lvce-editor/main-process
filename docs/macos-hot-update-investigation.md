# Can macOS updates activate through worker hot reload?

Investigation for [Trello card 4441](https://trello.com/c/4fxPZOT5), 2026-10-20.

## Decision

Worker-only update activation is a conditional design possibility, not a supported
LVCE update mode today. Keep the current restart-to-install path. Electron and
renderer-process equality alone is insufficient to select a safe update.

The present LVCE updater requires application shutdown by design: it installs in
`will-quit`, after normal window-close persistence succeeds, and requests a
relaunch. There is no evidence here that macOS universally requires an application
restart merely to rename a staged bundle into place. Installation on disk and
activation of every running component are separate obligations.

A minimal packaged Electron probe accompanies this report. Its macOS CI result
must be inspected before drawing a positive conclusion about live replacement.
It uses temporary, ad-hoc signed bundles, not the signed/notarized LVCE release.
It does not enable a new product update path.

## Source baseline

The source was fetched from each canonical repository's `main`, with no existing
hot-update PR found in the initial related-work search:

| Repository       | Commit                                     |
| ---------------- | ------------------------------------------ |
| main-process     | `e89b68ab7ed3ec4da0d1d4dde60fa727e31d356c` |
| renderer-process | `7864371dca2dc9f56714fc7ec7fd4abed6291ac6` |
| lvce-editor      | `06875a31d96d29b0b62f8f5c2e67cb096e48c414` |

The existing macOS updater was introduced in main-process PR #428 and refined in
PRs 429, 430 and 431. The experiment uses its existing `MacUpdate.applyUpdate`
implementation; it does not bypass or modify the production updater.

## What currently survives a worker restart

- `main-process/.../ElectronMacUpdater.ts` stages one version, then applies only
  in `will-quit`. A cancelled close leaves the installed app untouched. Its staged
  state cannot currently advance through multiple live updates.
- `main-process/.../MacUpdate.ts` mounts a DMG, copies into a sibling directory,
  validates bundle identity/version, architecture, signature and signing team,
  detaches the DMG, then renames the old and staged bundles. Installation failure
  attempts rollback. A successful rename is not a workbench-readiness transaction.
- `main-process/.../GetOrCreateConfig.ts` caches the resource manifest once.
  `GetElectronFileResponseConfig.ts` uses that cache as its allowlist and response
  header source. New hashed resources can be rejected even if they exist on disk;
  old etags/MIME mappings can survive replacement. Refreshing HTML does not clear
  this main-process cache.
- `main-process/.../SharedProcess.ts` memoizes the launched shared process. The
  renderer's `HotReload` path does not restart it. Shared-process code, its own
  state/caches and services must therefore be identical or separately migrated.
- `renderer-process/.../RendererWorkerUrl.ts` captures the configured URL at
  module initialization. `LaunchRendererWorker.ts` reuses that constant. Updating
  the DOM's Config text alone cannot switch this import to a new worker URL.
  The editor and syntax-highlighting worker URL modules also capture their URLs.
- `renderer-process/.../HotReload.ts` captures a snapshot before retirement,
  disposes RPC/workers/registries and viewlets, launches again, and waits up to
  30 seconds for readiness. It preserves a snapshot on failure and offers window
  reload recovery. It does not read a newly installed manifest, select a new
  generation, coordinate every window or relaunch Electron on activation failure.
- The inspected LVCE renderer worker **does not implement** that snapshot protocol:
  its `Reload/Reload.ipc.js` and `CommandMap.js` expose only `Reload.reload`, not
  `prepareHotReload`, `retire` or `waitForReady`. The renderer-process unit tests
  mock these calls. They are useful lifecycle tests, not proof of an integrated
  restart/update capability. The initial assumption that this was already an
  end-to-end reusable protocol is therefore unproven.

Paths above are under `packages/main-process/src/parts`,
`packages/renderer-process/src/parts`, or `packages/renderer-worker/src/parts` in
the corresponding baseline repository.

## Platform evidence

[Apple's Updating Mac Software](https://developer.apple.com/documentation/security/updating-mac-software)
explains why signed code must be replaced using new files rather than overwritten
in place: the kernel's signature cache belongs to the old file. This supports
retaining the updater's staged replacement approach. It does not certify live
resource rebinding, mixed-generation Electron processes or LVCE state recovery.

[Electron's autoUpdater documentation](https://www.electronjs.org/docs/latest/api/auto-updater)
provides a quit-and-install activation API, and
[Squirrel.Mac](https://github.com/Squirrel/Squirrel.Mac) normally installs after
termination. These are supported updater lifecycle choices, not proof of an OS
prohibition on a custom live-install path. LVCE uses its own updater here.

[Electron documents process.resourcesPath](https://www.electronjs.org/docs/latest/api/process)
as the resources directory. An unchanged path string after bundle replacement
is not evidence that every cached resource or process now uses the new version.

## Packaged probe and interpretation

Run `node scripts/test-mac-live-bundle.mjs` on macOS after `npm ci`. The PR workflow
runs it on `macos-26`, alongside the unchanged five-platform validation matrix.

The probe copies the pinned Electron runtime into three temporary application
bundles, installs the same main script in each, changes package/Info.plist
versions and worker assets, and ad-hoc signs and verifies each bundle. It asserts
identical main script hashes and launches the installed executable without an
external application argument. It isolates Chromium and XDG state and removes
the temporary installation after both launched processes exit.

Two sandboxed pages start workers from generation 1. The still-running main
process calls the real `applyUpdate` to install generations 2 and 3. Each page
explicitly fetches fresh configuration and starts a worker at its new URL.
Assertions distinguish new worker execution from the unchanged main startup
version and surviving page identity. Input text remains present in each page.
Finally a separate process launches the installed bundle and must read version
1.0.3 and execute its worker. JSON observations are printed in CI logs.

This isolates the OS/bundle premise. It deliberately supplies fresh resource
lookup, which LVCE's cached manifest currently lacks. Two pages retaining input
text is not a proof of restoring real unsaved editor documents or extensions.
Ad-hoc signing and direct executable launch do not exercise Gatekeeper,
notarization, LaunchServices, application translocation or an official DMG update.
No packaged-LVCE hot-update prototype is claimed.

## Conservative eligibility for a future implementation

Use signed, complete staged bundles and compare actual artifacts, not semver
versions or source commit labels. Unknown comparisons require restart.

| Component                                                 | Minimum condition to retain the process                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Electron executable, Frameworks/helpers, Chromium/V8/Node | Exact runtime artifact equality, architecture and flags                                                   |
| Main and preload scripts, native modules and entitlements | Exact artifact and launch/security configuration equality                                                 |
| Shared process and surviving services/extension hosts     | Exact code/resource contract equality, or a tested coordinated restart                                    |
| Renderer-process, replay/player and surviving UI modules  | Exact code/CSS/asset equality and compatible fresh config contract                                        |
| Worker graph and serialized drafts/workbench state        | Declared compatible schema, all old RPC generations fenced, all workers replaced                          |
| Resources and configuration                               | One verified generation root; refreshed main allowlist/headers and all worker URLs, no old cache fallback |
| All windows                                               | One application-wide prepare/commit barrier, including windows opening/closing during activation          |

Changes to native/runtime/preload code, incompatible state/RPC/config schemas,
missing compatibility metadata, unresolved process ownership or failed preparation
must select ordinary restart. A new window must not silently boot a different
generation from existing windows.

A worker-only payload stored outside the installed bundle could avoid rebinding
live bundle resources, but introduces its own authenticated payload, rollback and
cold-launch selection design. It is an alternative to investigate, not implemented
or authorized as a new delivery mechanism by this report.

## Required follow-up and failure behavior

1. Implement and integrate the missing snapshot/retirement/readiness protocol.
   Persist real dirty documents and recovery state before terminating owners.
2. Introduce an immutable generation object used by main resource serving and
   renderer worker factories. Read/validate the complete next configuration before
   changing any pointers. Keep old assets/backup until all old readers have gone.
3. Coordinate all windows and surviving shared services. Freeze new window
   creation and serialize requests until commit or abort. Measure/restrict stale
   responses and timers from the previous worker generation.
4. Extend the transaction beyond filesystem rename: rollback or restart on any
   post-install readiness failure. A timeout must leave recoverable drafts and
   offer a full Electron restart into a verified installed generation. If rollback
   fails, retain both paths and a precise manual recovery message.
5. Validate a signed/notarized packaged LVCE pair on supported macOS/architectures,
   then cold-launch through Finder. Check PID/module/asset generation markers,
   real unsaved files and untitled documents, extensions, two windows, repeated
   updates, teardown exceptions, a stalled startup, failed rename/rollback,
   cancelled shutdown, and final installed version/signature. Also verify disk
   backup cleanup only after old processes exit.

The existing four HotReload unit tests pass locally: snapshot-before-retirement
and coalescing, snapshot failure leaving workers alive, startup failure retaining
saved draft data, and readiness timeout. They mock worker lifecycle endpoints.
The required product scenarios above remain acceptance gates for any future
feature PR; this investigation neither skips them nor treats the narrow probe as
a replacement. No dependency release is needed for this investigation.
