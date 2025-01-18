# Changelog

## [1.0.0] - 2025-01-09
### Added
- Initial release

## [1.1.0] - <2025-01-15>

### Added
- added i18n
- added webp image format support
- added legal terms
- added message dissolve effect
- added notes of CSAM detection plan

### Fixed
- fixed rate limiting bug

### Changed
- UI improvements

## [1.2.0] - <2025-01-15>

### Changed

- Message retrieval changed from static HTML load and dynamic message content API load to dynamic server side rendering, 2 requests simplified into 1 request

## [1.2.1] - <2025-01-15>

### Fixed
- Fixed bug where message was not deleted after retrieval

## [1.2.2] - <2025-01-15>

### Changed
- Changed message retrieval mechanism, from server side rendering all content to just minimal metadata, and then fetching the content in another request, to prevent from leaking message content in history

## [1.2.3] - 2025-01-16

### Changed
- Changed message loading mechanism from writing content inside html into loading it with 1 request (instead of 2 requests) for message without token

### Fixed
- Fixed some missing i18n texts

## [2.0.0] - 2025-01

### Added
- Added NoTrace Chat

### Changed
- Renamed Burning Message to NoTrace Message