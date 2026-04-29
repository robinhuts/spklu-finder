# PRD: Flutter Implementation for SPKLU Finder

## 1. Document Purpose

This PRD defines the requirements to rebuild the existing SPKLU Finder web application as a new Flutter project while preserving the current user experience, UI layout, API behavior, and core feature set.

The Flutter implementation must look and behave as close as possible to the current application state in this repository. The goal is not to redesign the app, but to create a native/mobile Flutter version with the same map-first experience, station search, route planning, station bottom sheet, marker behavior, and toast feedback.

## 2. Product Summary

SPKLU Finder helps electric vehicle users in Indonesia find nearby charging stations, view station availability and connector details, search by location, and plan charging routes across selected stations.

The current app is a Vite + React + TypeScript web app using Mapbox GL, Open Charge Map API, Tailwind, shadcn-ui, and browser geolocation. The new project should be a Flutter app that consumes the same APIs and mirrors the current UI.

## 3. Non-Negotiable UI Requirement

The Flutter UI must be visually equivalent to the current app.

Required matching areas:

- Fullscreen map as the main canvas.
- Search bar floating at the top with rounded glass/card styling.
- User location call-to-action when location is not yet granted.
- Floating route mode toggle button.
- Route manager panel when route mode has selected stops.
- Bottom sheet for `Stasiun Pengisian Terdekat`.
- Bottom sheet can be expanded, collapsed, and hidden downward.
- Station cards must use the same compact card hierarchy:
  - Station title.
  - Address.
  - Availability badge.
  - Connector count.
  - Maximum power.
  - Distance.
  - Connector list.
  - Direction/route button.
- Map markers must match current behavior:
  - One user-location marker only.
  - SPKLU station markers by status.
  - Search location marker.
  - Cluster marker behavior if implemented.
- Toast/snackbar style must be compact, clean, rounded, and unobtrusive like the current updated toast.
- No top gradient overlay on the map.

Flutter implementation should use responsive constraints so the UI matches the current mobile-first behavior and still works on tablets/web if supported.

## 4. Target Platforms

### Required

- Android.
- iOS.

### Optional / Nice to Have

- Flutter Web, if Mapbox package support and API-key configuration are stable.

## 5. Core User Stories

### 5.1 Location Permission and Nearby Stations

As a user, I want to allow location access so the app can show EV charging stations near me.

Acceptance criteria:

- App requests location permission using platform-native permission prompts.
- If permission is granted, app fetches stations around the user location.
- If permission is denied, app shows a clear message and keeps the manual search usable.
- User sees only one user-location marker on the map.
- Station list bottom sheet appears after location or search result is available.

### 5.2 Search Location

As a user, I want to search an Indonesian place/location so I can find chargers near that area.

Acceptance criteria:

- Search input supports typing location names.
- App fetches Mapbox geocoding suggestions after at least 3 characters.
- Selecting a suggestion moves the map to that location.
- Submitting a query searches the location first, then loads SPKLU stations near the result.
- Search result marker stays correctly attached to map coordinates when the map is dragged or zoomed.

### 5.3 Nearby Station List

As a user, I want to browse nearby charging stations from a bottom sheet.

Acceptance criteria:

- Bottom sheet title is `Stasiun Pengisian Terdekat`.
- Bottom sheet shows station count, available station count, and nearest distance summary.
- Bottom sheet supports:
  - Collapsed state.
  - Expanded state.
  - Hidden/downward state.
  - Show button to reveal it again.
- Collapsed bottom sheet should not cover the map too much.
- Station list uses virtualized or performant rendering for many stations.
- Loading and empty states are available.

### 5.4 Station Card

As a user, I want to understand each station quickly from a compact card.

Acceptance criteria:

- Card shows title, address, status, connector count, max power, distance, first 2 connectors, and button.
- Status labels:
  - `available` -> `Tersedia`.
  - `busy` -> `Sibuk`.
  - `offline` -> `Tidak Beroperasi`.
- Route-selected cards show route order and selected-route state.
- Direction button starts directions when route mode is off.
- In route mode, the same button adds station to the route.

### 5.5 Station Map Markers

As a user, I want map markers to accurately represent station locations.

Acceptance criteria:

- Marker color reflects station status:
  - Available: green.
  - Busy: yellow/amber.
  - Offline: red/gray.
- Markers remain visually attached to their coordinates during map drag/zoom.
- Tapping a marker selects the station and can show station details/popup.
- Selected station is visually emphasized.
- Clustering should be supported for dense areas if feasible in the chosen Mapbox Flutter package.

### 5.6 Route Mode

As a user, I want to select multiple stations and calculate a route.

Acceptance criteria:

- User can enable/disable route mode.
- Route mode toggle is small, floating, and does not cover too much map area.
- When active, selected station cards show route order.
- Route manager panel shows selected stops.
- User can remove a stop.
- User can clear the route.
- User can calculate route when at least 2 stops are selected.
- Calculated route polyline appears on map.
- Route summary shows total distance and duration.
- Route manager has compact/collapsed and expanded views.

### 5.7 Toast / Snackbar Feedback

As a user, I want compact feedback messages that do not block the map.

Acceptance criteria:

- Toast/snackbar appears near the top-right/top area depending on platform constraints.
- Toast is compact, rounded, and clean.
- Toast supports success/info and destructive/error style.
- Toast messages are used for loading, errors, location permission failures, route status, and empty results.

## 6. Existing API Consumption to Replicate

### 6.1 Environment Variables / Secrets

The Flutter app must not hardcode API keys in committed source code.

Required configuration:

- `MAPBOX_API_KEY` or `MAPBOX_ACCESS_TOKEN` for:
  - Map rendering.
  - Geocoding search.
  - Directions API.
- `OPEN_CHARGE_MAP_API_KEY` for Open Charge Map station API.
- Optional `GEOCODING_PROVIDER` config to choose `mapbox`, `nominatim`, or `mapbox_with_nominatim_fallback`.

Recommended Flutter configuration:

- Use `--dart-define=MAPBOX_ACCESS_TOKEN=...`.
- Use `--dart-define=OPEN_CHARGE_MAP_API_KEY=...`.
- For CI/CD, configure these values in the build provider environment.
- For local development, provide an `.env.example` but never commit a real `.env`.

### 6.2 Open Charge Map API

Base URL:

```txt
https://api.openchargemap.io/v3
```

Current endpoint:

```txt
GET /poi/
```

Current query parameters:

| Parameter | Current Value / Source | Notes |
| --- | --- | --- |
| `output` | `json` | Required JSON output. |
| `countrycode` | `ID` | Indonesia only. |
| `latitude` | user/search latitude | Dynamic. |
| `longitude` | user/search longitude | Dynamic. |
| `distance` | `15`, `25`, or fallback `50` | In kilometers. |
| `distanceunit` | `KM` | Kilometer radius. |
| `maxresults` | `100` for nearby, `15` for searched location in current code | Should be configurable. |
| `key` | API key | Must come from env/build config. |

Example request:

```txt
https://api.openchargemap.io/v3/poi/?output=json&countrycode=ID&latitude=-6.2&longitude=106.816666&distance=15&distanceunit=KM&maxresults=100&key=<OPEN_CHARGE_MAP_API_KEY>
```

Required response mapping:

| Open Charge Map Field | Flutter Model Field |
| --- | --- |
| `ID` | `id` |
| `UUID` | `uuid` |
| `AddressInfo.ID` | `addressInfo.id` |
| `AddressInfo.Title` | `addressInfo.title` |
| `AddressInfo.AddressLine1` | `addressInfo.addressLine1` |
| `AddressInfo.Town` | `addressInfo.town` |
| `AddressInfo.StateOrProvince` | `addressInfo.stateOrProvince` |
| `AddressInfo.Postcode` | `addressInfo.postcode` |
| `AddressInfo.Country.ID` | `addressInfo.country.id` |
| `AddressInfo.Country.ISOCode` | `addressInfo.country.isoCode` |
| `AddressInfo.Country.Title` | `addressInfo.country.title` |
| `AddressInfo.Latitude` | `addressInfo.latitude` |
| `AddressInfo.Longitude` | `addressInfo.longitude` |
| `AddressInfo.Distance` | `distance` and `addressInfo.distance` |
| `AddressInfo.ContactTelephone1` | `addressInfo.contactTelephone1` |
| `AddressInfo.ContactEmail` | `addressInfo.contactEmail` |
| `AddressInfo.AccessComments` | `addressInfo.accessComments` |
| `AddressInfo.RelatedURL` | `addressInfo.relatedURL` |
| `OperatorInfo.ID` | `operatorInfo.id` |
| `OperatorInfo.Title` | `operatorInfo.name` |
| `OperatorInfo.WebsiteURL` | `operatorInfo.websiteURL` |
| `OperatorInfo.PhonePrimaryContact` | `operatorInfo.phoneNumber` |
| `StatusType.ID` | `statusType.id` |
| `StatusType.Title` | `statusType.title` |
| `StatusType.IsOperational` | `statusType.isOperational` |
| `Connections[].ID` | `connections[].id` |
| `Connections[].ConnectionType.ID` | `connections[].connectionType.id` |
| `Connections[].ConnectionType.Title` | `connections[].connectionType.title` |
| `Connections[].StatusType` | `connections[].statusType` |
| `Connections[].Level` | `connections[].level` |
| `Connections[].PowerKW` | `connections[].powerKW` |
| `Connections[].CurrentType` | `connections[].currentType` |
| `Connections[].Quantity` | `connections[].quantity` |
| `UsageType` | `usageType` |
| `UsageCost` | `usageCost` |

Validation requirements:

- Ignore invalid station items without `ID`, `AddressInfo`, `Latitude`, or `Longitude`.
- Convert missing `Connections` to an empty list.
- Convert missing optional nested values to nullable fields.
- Sort final station list by distance ascending.

Status mapping:

```txt
if StatusType.IsOperational == true -> available
else -> offline
```

The current code contains a `busy` UI state, but Open Charge Map does not provide reliable real-time busy state in the implemented endpoint. Flutter should keep `busy` as a model/UI enum option for future support, but should not randomly assign busy status.

### 6.3 Search Location Extraction API: Nominatim / OpenStreetMap

The repository contains evidence of an additional API previously used to extract coordinates from a search query: **Nominatim OpenStreetMap Search API**.

Current code now uses Mapbox Geocoding for `searchLocation`, but `src/utils/api.ts` still contains a `NominatimResponse` model and git history shows the previous implementation used:

```txt
GET https://nominatim.openstreetmap.org/search
```

Legacy/current-history request parameters:

| Parameter | Value |
| --- | --- |
| `format` | `json` |
| `q` | `{query},Indonesia` |

Required header:

| Header | Value |
| --- | --- |
| `User-Agent` | App-specific user agent, e.g. `SPKLUFinderFlutter/1.0` |

Example request:

```txt
https://nominatim.openstreetmap.org/search?format=json&q=jakarta%2CIndonesia
```

Response fields used:

| Nominatim Field | Flutter Model / Usage |
| --- | --- |
| `lat` | Parse to `double latitude` |
| `lon` | Parse to `double longitude` |
| `display_name` | Human-readable result label |

Flutter implementation requirement:

- Support this API as a fallback or configurable provider for search-location extraction.
- Do not call Nominatim on every keystroke unless the usage policy is reviewed; prefer using it on submitted search queries only.
- If enabled for suggestions, debounce and rate-limit aggressively.
- Include an app-specific `User-Agent` header.
- Parse `lat` and `lon` strings safely.
- If no results are returned, show `Lokasi tidak ditemukan`.

Recommended provider strategy:

```txt
Primary geocoding provider: Mapbox Geocoding
Fallback/legacy extraction provider: Nominatim OpenStreetMap Search
Station provider: Open Charge Map
Directions provider: Mapbox Directions
```

### 6.4 Mapbox Geocoding API

Base endpoint:

```txt
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
```

Suggestion request parameters:

| Parameter | Value |
| --- | --- |
| `country` | `id` |
| `types` | `place,locality,neighborhood,address` |
| `limit` | `5` |
| `access_token` | Mapbox token |

Submit search request parameters:

| Parameter | Value |
| --- | --- |
| `country` | `id` |
| `limit` | `1` |
| `access_token` | Mapbox token |

Current search behavior:

- Suggestions start after query length >= 3.
- Debounce: 300 ms.
- Suggestion model:
  - `id`.
  - `text`.
  - `place_name`.
  - `center` as `[longitude, latitude]`.
- Submit search appends `,Indonesia` to query.
- If a location is found, fetch stations around the returned coordinates.
- If no location is found, show a not-found toast and/or fallback station search behavior where applicable.

Example suggestion request:

```txt
https://api.mapbox.com/geocoding/v5/mapbox.places/jakarta.json?country=id&types=place,locality,neighborhood,address&limit=5&access_token=<MAPBOX_ACCESS_TOKEN>
```

### 6.5 Mapbox Directions API

Endpoint:

```txt
GET https://api.mapbox.com/directions/v5/mapbox/driving/{coordinates}
```

Current parameters:

| Parameter | Value |
| --- | --- |
| `alternatives` | `false` |
| `geometries` | `geojson` |
| `overview` | `full` |
| `steps` | `false` |
| `access_token` | Mapbox token |

Coordinate format:

```txt
longitude,latitude;longitude,latitude;longitude,latitude
```

Single destination behavior:

- Origin: user location.
- Destination: selected station location.
- Draw route polyline on map.
- Show distance and duration summary.

Multi-stop route behavior:

- First selected stop is origin.
- Last selected stop is destination.
- Middle selected stops are waypoints.
- Draw route polyline on map.
- Show total distance and duration.

Response fields to use:

| Field | Usage |
| --- | --- |
| `routes[0].distance` | Total route distance in meters. |
| `routes[0].duration` | Total route duration in seconds. |
| `routes[0].geometry.coordinates` | Polyline GeoJSON coordinates. |
| `routes[0].legs[].distance` | Per-leg distance. |
| `routes[0].legs[].duration` | Per-leg duration. |
| `waypoints[]` | Optional metadata. |

Flutter should calculate a route bounding box from route coordinates and fit the map camera to the route.

## 7. Flutter Technical Requirements

### 7.1 Recommended Packages

| Need | Recommended Package |
| --- | --- |
| Map rendering | `mapbox_maps_flutter` |
| HTTP client | `dio` or `http` |
| State management | `riverpod` / `flutter_riverpod` |
| Location permission | `permission_handler` |
| Device location | `geolocator` |
| Environment/build config | `--dart-define`, optionally `flutter_dotenv` for local only |
| JSON models | `freezed`, `json_serializable`, `build_runner` |
| Toast/snackbar | Custom overlay/snackbar using `OverlayEntry` or `ScaffoldMessenger` wrapper |
| Icons | `lucide_icons_flutter` or Flutter Material Icons |
| Bottom sheet | Native Flutter `DraggableScrollableSheet` or custom animated sheet |

### 7.2 Suggested Architecture

```txt
lib/
  main.dart
  app.dart
  core/
    config/app_config.dart
    network/api_client.dart
    location/location_service.dart
    theme/app_theme.dart
    widgets/app_toast.dart
  features/
    map/
      presentation/spklu_map_page.dart
      presentation/widgets/map_view.dart
      presentation/widgets/search_bar.dart
      presentation/widgets/station_bottom_sheet.dart
      presentation/widgets/station_card.dart
      presentation/widgets/route_manager.dart
      presentation/widgets/location_cta.dart
      application/map_controller.dart
    stations/
      data/open_charge_map_api.dart
      data/station_repository.dart
      domain/charging_station.dart
      domain/station_connection.dart
      domain/station_status.dart
    geocoding/
      data/mapbox_geocoding_api.dart
      domain/geocoding_suggestion.dart
    directions/
      data/mapbox_directions_api.dart
      domain/directions_route.dart
```

### 7.3 State Management Requirements

Minimum app state:

- `stations`.
- `filteredStations`.
- `userLocation`.
- `selectedStation`.
- `searchQuery`.
- `isLoadingStations`.
- `isLocating`.
- `searchedLocation`.
- `directionsRoute`.
- `isLoadingDirections`.
- `locationRequired`.
- `selectedStops`.
- `routeTotalDistance`.
- `routeTotalDuration`.
- `isRoutePlanActive`.
- `stationSheetState`: hidden/collapsed/expanded.
- `geocodingSuggestions`.

Suggested enum:

```dart
enum StationSheetState { hidden, collapsed, expanded }
enum StationStatus { available, busy, offline }
```

### 7.4 Data Model Requirements

Flutter models must represent the current TypeScript interfaces:

- `ChargingStation`.
- `AddressInfo`.
- `Country`.
- `OperatorInfo`.
- `StatusType`.
- `StationConnection`.
- `ConnectionType`.
- `Level`.
- `CurrentType`.
- `UsageType`.
- `GeocodingSuggestion`.
- `DirectionsRoute`.
- `DirectionsLeg`.

All API parsing should be null-safe and resilient to missing Open Charge Map fields.

### 7.5 Permission Requirements

Android:

- `ACCESS_FINE_LOCATION`.
- `ACCESS_COARSE_LOCATION`.
- Optional if background tracking is not implemented: do not request background location.

 iOS:

- `NSLocationWhenInUseUsageDescription`.

The app must explain why location is needed before or during permission request.

### 7.6 Map Requirements

- Use Mapbox style equivalent to `mapbox://styles/mapbox/streets-v12`.
- Default map center: Jakarta, Indonesia.
  - Latitude: `-6.200000`.
  - Longitude: `106.816666`.
- Default zoom: `12`.
- User location marker must be custom and singular.
- Station markers must be custom widgets or annotation images.
- Search marker must be separate from station markers.
- Route polyline must be drawn from Mapbox Directions GeoJSON coordinates.
- Camera should animate/fly to:
  - User location after permission granted.
  - Searched location after selection/search.
  - Selected station.
  - Route bounds after route calculation.

### 7.7 Search Requirements

- Top floating search bar should preserve current behavior.
- Debounced geocoding suggestions after 3 characters.
- Suggestions list appears under the search bar.
- Clear button resets search query and station filter.
- Locate button triggers user location request.
- Search submit first attempts Mapbox geocoding, then loads stations around found coordinates.

### 7.8 Station Filtering Requirements

Current behavior includes station search/filtering by query and location-based station retrieval. Flutter should support:

- Load nearby stations by coordinates.
- Sort by distance.
- Search by location name via Mapbox.
- If implementing textual station filtering, filter by station title, address, town, operator, connector type.

### 7.9 Route Planning Requirements

- Toggle route mode on/off.
- When enabled, selecting a station adds it to selected stops.
- Prevent duplicate selected stops.
- Removing stops updates route state.
- Clearing route resets selected stops, route line, distance, and duration.
- Disabling route mode clears or hides route state consistently with current behavior.
- Calculate route only when at least 2 stops are selected.
- Show error toast if Mapbox token is missing or route fails.

## 8. UI Specification

### 8.1 Main Screen Layout

Stack layout:

1. Fullscreen Mapbox map.
2. Top floating search bar.
3. Optional desktop/tablet hero stats panel if supporting larger screens.
4. Route toggle button.
5. Route manager panel when selected stops exist.
6. User location CTA when location is not available.
7. Bottom station list sheet.
8. Toast overlay.

### 8.2 Colors and Visual Style

Flutter theme should approximate current Tailwind look:

- Background/map shell: slate/dark neutral.
- Cards: white with subtle transparency and shadow.
- Primary: blue.
- Available: emerald/green.
- Busy: amber/yellow.
- Offline: gray/red.
- Rounded corners: large, typically 16-32 px.
- Shadows: soft, not heavy.
- Typography: compact, high hierarchy, similar to Inter/system font.

### 8.3 Bottom Sheet

States:

- Hidden:
  - Only a small reveal control should remain accessible.
- Collapsed:
  - Shows title/summary and a compact list area.
  - Must not sit too high or cover too much map.
- Expanded:
  - Shows larger scrollable station list.

Recommended Flutter implementation:

- `AnimatedPositioned` or `DraggableScrollableSheet`.
- Keep custom state buttons for exact behavior: `Sembunyikan`, `Tampilkan`, `Perluas`, `Ciutkan`.

### 8.4 Route Manager UI

- Compact floating panel on top-right or below search on small screens.
- Collapsed state shows:
  - `Mode Rute`.
  - selected stop count.
  - `Mulai Rute` button if at least 2 stops.
- Expanded state shows:
  - ordered selected stops.
  - remove button per stop.
  - distance/duration cards after route calculation.
  - clear and start buttons.

### 8.5 Toast UI

- Compact height.
- Rounded 16+ px.
- Top overlay preferred.
- Does not block map interactions for long.
- Auto-dismiss after a short duration.

## 9. Error and Empty States

Required states:

- Missing Mapbox API key:
  - Show a clear setup state, not a blank map.
- Missing Open Charge Map API key:
  - Show station loading error.
- Location permission denied:
  - Show manual search guidance.
- No stations found:
  - Bottom sheet empty state.
- Geocoding result not found:
  - Toast: `Lokasi tidak ditemukan`.
- Directions route failure:
  - Toast: `Gagal mendapatkan petunjuk arah`.
- Network failure:
  - Retry-friendly toast/message.

## 10. Security Requirements

- Do not commit real Mapbox or Open Charge Map tokens.
- Do not log full URLs containing access tokens in production builds.
- Store runtime config via build-time variables or secure CI/CD env vars.
- If tokens were ever committed publicly, rotate them.

## 11. Performance Requirements

- Station list should remain smooth for 100+ items.
- Map markers should be updated efficiently and not recreated unnecessarily on every frame.
- Geocoding suggestions must be debounced.
- API requests should avoid duplicate in-flight calls when the same query/location is repeated.
- Route polyline rendering should not block UI.

## 12. Analytics / Observability (Optional)

Recommended events:

- Location permission granted/denied.
- Nearby station fetch success/failure.
- Search submitted.
- Station selected.
- Directions requested.
- Route mode enabled/disabled.
- Route calculation success/failure.

## 13. Implementation Plan

### Phase 1: Flutter Project Foundation

Deliverables:

- New Flutter project scaffold.
- App theme matching current UI.
- Environment config support for API keys.
- Base networking client.
- Core models with JSON parsing.

Acceptance criteria:

- App launches on Android/iOS.
- Missing config states are visible.
- No real secrets are committed.

### Phase 2: Map and Location

Deliverables:

- Mapbox map integration.
- Default Jakarta camera.
- Location permission flow.
- Single custom user marker.
- Camera animation to user location.

Acceptance criteria:

- User location permission works.
- Only one user pointer appears.
- Map renders with valid Mapbox token.

### Phase 3: Open Charge Map Station Loading

Deliverables:

- Open Charge Map API client.
- Station repository.
- Station model mapping.
- Nearby station fetch.
- Station markers.

Acceptance criteria:

- Stations load near user/search coordinates.
- Invalid station records are ignored safely.
- Station list sorted by distance.

### Phase 4: Search and Geocoding

Deliverables:

- Search bar UI matching current app.
- Debounced Mapbox suggestions.
- Search submit behavior.
- Search location marker.

Acceptance criteria:

- Suggestions appear after typing 3+ chars.
- Selecting a suggestion moves map and loads nearby SPKLU.
- Search marker stays anchored when map moves.

### Phase 5: Station Bottom Sheet and Cards

Deliverables:

- Hidden/collapsed/expanded bottom sheet.
- Station summary header.
- Compact station cards matching current app.
- Loading and empty states.

Acceptance criteria:

- Sheet can hide downward and be shown again.
- Collapsed sheet does not cover too much map.
- Card UI matches current style and information hierarchy.

### Phase 6: Route Mode and Directions

Deliverables:

- Route mode toggle.
- Selected stops state.
- Route manager panel.
- Mapbox Directions API client.
- Route polyline rendering.
- Distance/duration summary.

Acceptance criteria:

- User can add/remove/clear route stops.
- Route starts only with 2+ stops.
- Route line appears and camera fits bounds.
- Route manager UI matches current compact style.

### Phase 7: Polish and QA

Deliverables:

- Compact toast/snackbar system.
- Marker polish.
- Error handling polish.
- Manual QA checklist.

Acceptance criteria:

- UI matches current app visually.
- `flutter analyze` passes.
- App tested on at least one Android and one iOS simulator/device.
- API failure states are verified.

## 14. Suggested Flutter Dependencies

Example `pubspec.yaml` dependencies:

```yaml
dependencies:
  flutter:
    sdk: flutter
  mapbox_maps_flutter: ^2.0.0
  dio: ^5.0.0
  flutter_riverpod: ^2.0.0
  geolocator: ^12.0.0
  permission_handler: ^11.0.0
  freezed_annotation: ^2.0.0
  json_annotation: ^4.0.0
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.0.0
  freezed: ^2.0.0
  json_serializable: ^6.0.0
  flutter_lints: ^4.0.0
```

Exact versions should be validated at implementation time against the Flutter SDK version used.

## 15. Testing Requirements

### Unit Tests

- Open Charge Map response parsing.
- Mapbox geocoding parsing.
- Directions response parsing.
- Distance formatting.
- Duration formatting.
- Station status mapping.
- Route selected stops behavior.

### Widget Tests

- Search bar displays suggestions.
- Bottom sheet state changes.
- Station card renders required fields.
- Route manager collapsed/expanded views.
- Missing API key state.

### Manual QA

- Fresh app open without permissions.
- Grant location permission.
- Deny location permission.
- Search Indonesian location.
- Select suggestion.
- Select station marker.
- Hide/show station sheet.
- Expand/collapse station sheet.
- Enable route mode.
- Add 2+ stations.
- Calculate route.
- Clear route.
- Test missing Mapbox key behavior.
- Test missing Open Charge Map key behavior.

## 16. Open Questions

- Should Flutter project live in this repository under a new folder, or in a separate repository?
- Should Flutter support web, or only Android/iOS?
- Should Open Charge Map API key also be rotated and moved fully to environment config?
- Is station `busy` status required from a real-time source, or should it remain a future enum only?
- Should route planning use user location as origin, or keep current behavior where first selected stop is origin for multi-stop routes?

## 17. Definition of Done

- New Flutter app matches the current SPKLU Finder UI and UX as closely as possible.
- API behavior matches the existing React project.
- No secrets are hardcoded.
- Nearby station search works in Indonesia.
- Search suggestions and search location flow work.
- User location appears once only.
- Station markers and search marker remain anchored during map movement.
- Bottom sheet hide/collapse/expand works.
- Route mode and directions work.
- Compact toast/snackbar feedback works.
- Flutter analyze and tests pass.
