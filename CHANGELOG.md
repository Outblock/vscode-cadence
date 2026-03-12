## Unreleased

### Changed
- Bundle and prefer Cadence LSP v2 by default instead of relying on Flow CLI's built-in language server
- Keep Flow CLI as an explicit compatibility fallback instead of a hard dependency for editor language features

# v1.0.0 (2022-08-16)

## 🛠 Improvements
- Complete system architecture overhaul to improve extendability, scalability, and maintainability @DylanTinianov (#99)
- Improved testing suite @DylanTinianov (#108)
- Added telemetry using Sentry to track errors @DylanTinianov (#103)
- Removed Snyk from CI configuration @DylanTinianov (#95)
- Setup End To End Tests @DylanTinianov (#132)
- Add integration tests to CI @DylanTinianov (#140)
- Add usage statistics to Sentry @DylanTinianov (#144)
- Add activation analytics with Mixpanel @DylanTinianov (#145)

## 🐞 Bug Fixes
- Fixed path issues on Windows @DylanTinianov (#112)

## 💥 Breaking Changes
- Integrated Cadence Language Server hosted emulator @DylanTinianov (#109)

## ⭐ Features
- Enabled users to enter a custom path to their flow.json file @DylanTinianov (#102)
- Added a dependency installer to install missing dependencies such as flow-cli @DylanTinianov (#124)
- Added a command to copy the active account to clipboard @DylanTinianov (#131)
