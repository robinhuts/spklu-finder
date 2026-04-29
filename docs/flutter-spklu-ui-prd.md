# UI PRD: Flutter SPKLU Finder

## 1. Purpose

This document defines the Flutter UI requirements for SPKLU Finder as a standalone product spec. It is intentionally separated from the original React source UI.

The Flutter app does **not** need to look exactly like the current web app. The UI goal is feature parity: users must be able to complete the same main flows with a clean, native-mobile, map-first interface.

## 2. UI Principles

- Mobile-first and map-first.
- Native Flutter patterns are preferred over copying web layouts.
- Keep controls reachable with one hand where possible.
- Avoid covering too much of the map.
- Prioritize fast access to location, search, nearby stations, and route planning.
- Use clear Indonesian labels.
- Keep feedback compact and non-blocking.
- The UI must remain usable with slow network, missing location permission, or missing API keys.

## 3. Core Navigation Model

Recommended structure:

- Single primary screen: `Map Home`.
- All main actions happen on top of the map through overlays, sheets, and panels.
- No mandatory bottom navigation is required for MVP.
- Optional future tabs can be added for saved stations, history, settings, or profile.

Primary screen layers:

1. Map.
2. Search control.
3. Locate-me control.
4. Route mode control.
5. Station markers/search marker/user marker.
6. Nearby station list sheet.
7. Route manager sheet/panel.
8. Toast/snackbar overlay.
9. Permission/config/error overlays when needed.

## 4. Main Screen: Map Home

### 4.1 Purpose

Map Home is the main experience. It shows the user location, nearby SPKLU stations, search results, route planning state, and station list.

### 4.2 Required UI Elements

- Map view.
- Search input or search button that expands to input.
- Locate-me button.
- Route mode button.
- Nearby station list sheet.
- Marker layer:
  - User location marker.
  - Search location marker.
  - Station markers.
  - Optional station clusters.
- Loading state for station fetch.
- Toast/snackbar area.

### 4.3 Default State

When the app opens:

- Map centers on Jakarta by default until location is available.
- App asks or prompts for location permission.
- Station sheet can be hidden until location/search is available.
- Search remains usable even when location permission is denied.

### 4.4 Location Granted State

After user grants location:

- Camera animates to user location.
- One user marker is shown.
- Nearby station loading begins.
- Station markers appear after API success.
- Station list sheet appears in collapsed state.

### 4.5 Location Denied State

If user denies location:

- Show a friendly message explaining that location is needed for nearest stations.
- Provide buttons:
  - `Cari Lokasi Manual`.
  - `Coba Lagi`.
  - Optional `Buka Pengaturan` if permission is permanently denied.
- App must not become blank or blocked.

## 5. Search UI

### 5.1 Purpose

Allow users to find a city, area, neighborhood, address, or place in Indonesia and load SPKLU stations around it.

### 5.2 Components

- Search field.
- Clear button.
- Loading indicator while fetching suggestions/searching.
- Suggestion list.
- Empty suggestion state.
- Optional recent searches in future.

### 5.3 Behavior

- Suggestions start after at least 3 characters.
- Suggestions are debounced.
- Selecting a suggestion:
  - Closes suggestion list.
  - Moves map camera to selected coordinates.
  - Shows search location marker.
  - Fetches nearby stations.
- Submitting search:
  - Extracts location using configured provider.
  - If result found, behaves like selecting suggestion.
  - If not found, shows `Lokasi tidak ditemukan`.

### 5.4 UI Acceptance Criteria

- Search is reachable from Map Home without navigating away.
- Suggestion list does not cover the entire screen unless using a full-screen mobile search pattern.
- Search can be cancelled/cleared.
- Search marker stays anchored to coordinates while map moves.

## 6. Nearby Station List UI

### 6.1 Purpose

Show nearby SPKLU stations in a scrollable, mobile-friendly list.

### 6.2 Required States

- Hidden.
- Collapsed.
- Expanded.
- Loading.
- Empty.
- Error.

### 6.3 Header Content

The station list header should show:

- Title: `Stasiun Pengisian Terdekat`.
- Number of stations found.
- Optional count of available stations.
- Optional nearest distance.
- Expand/collapse/hide controls.

### 6.4 List Behavior

- Collapsed state should preserve map visibility.
- Expanded state should allow comfortable browsing.
- Hidden state should expose a small reveal button.
- List should scroll smoothly for 100+ stations.
- Selecting a station card should select/focus the station on the map.

### 6.5 UI Acceptance Criteria

- User can hide the station list and bring it back.
- User can expand/collapse the station list.
- Loading and empty states are clearly visible.
- Station cards are readable on small screens.

## 7. Station Card UI

### 7.1 Purpose

Provide enough station detail for users to decide whether to navigate or add it to a route.

### 7.2 Required Content

Each station card must show:

- Station name/title.
- Address/town.
- Status label.
- Distance from current/search origin.
- Connector count.
- Maximum charging power if available.
- Connector summary.
- Usage cost if available.
- Primary action button.

### 7.3 Status Labels

- `available`: `Tersedia`.
- `busy`: `Sibuk`.
- `offline`: `Tidak Beroperasi`.

### 7.4 Route Mode State

When route mode is active:

- Card primary action changes to add/remove route stop.
- Selected cards show selected state.
- Selected cards show route order number.

### 7.5 UI Acceptance Criteria

- Required information is visible without opening a detail page.
- Primary action is clear.
- Route-selected state is visually distinct.
- Cards remain compact enough for map + sheet usage.

## 8. Station Detail UI

### 8.1 MVP Option

Station detail can be implemented as:

- A bottom sheet opened from a card or marker, or
- An expanded card state.

### 8.2 Required Detail Content

- Station title.
- Full address.
- Operator name, if available.
- Contact phone/email, if available.
- Website/related URL, if available.
- Access comments, if available.
- Connector list with type, power, current type, quantity, and status.
- Usage cost.
- Actions:
  - `Arahkan`.
  - `Tambah ke Rute` when route mode is active.

## 9. Map Marker UI

### 9.1 Marker Types

- User location marker.
- Search location marker.
- Station marker.
- Optional cluster marker.
- Optional selected station marker state.

### 9.2 Behavior

- User marker appears once only.
- Search marker is separate from user marker.
- Station markers are anchored to coordinates.
- Markers must not appear to float when map is dragged or zoomed.
- Tapping station marker selects station and may open detail preview.

### 9.3 Station Marker Status

- Available: green.
- Busy: amber/yellow.
- Offline: gray/red.

### 9.4 UI Acceptance Criteria

- Markers stay aligned during pan/zoom.
- Selected marker is distinguishable.
- Marker tap target is large enough for mobile.

## 10. Route Mode UI

### 10.1 Purpose

Allow users to build and calculate a route across multiple SPKLU stations.

### 10.2 Entry Point

Route mode should be accessible from Map Home via a clear control such as:

- Floating action button.
- Small map overlay button.
- Sheet action.

### 10.3 Route Manager UI

Route manager must show:

- Route mode title.
- Number of selected stops.
- Ordered stop list.
- Remove stop action.
- Clear route action.
- Start/calculate route action.
- Distance and duration summary after route calculation.

### 10.4 Route Stop Selection

- In route mode, station card/marker action adds station to selected stops.
- Duplicate stops are prevented.
- Selected stops show order number.
- At least 2 stops are required to calculate route.

### 10.5 Route Result UI

After route calculation:

- Route polyline appears on the map.
- Camera fits route bounds.
- Summary shows total distance and duration.
- User can clear the route.

### 10.6 UI Acceptance Criteria

- User understands when route mode is active.
- User can add, remove, clear, and calculate route.
- Route result is visible on the map.
- Route UI does not permanently block map usage.

## 11. Toast / Snackbar UI

### 11.1 Purpose

Provide lightweight feedback for success, info, warnings, and errors.

### 11.2 Required Messages

- Station fetch success.
- No stations found.
- Location permission denied.
- Location search failed.
- Missing API configuration.
- Route calculation success/failure.
- Duplicate route stop.

### 11.3 Behavior

- Compact and non-blocking.
- Auto-dismiss.
- Can be manually dismissed if using custom toast.
- Error state should be visually distinct.

## 12. Loading, Empty, and Error States

### 12.1 Loading States

- Loading location.
- Loading station list.
- Loading search suggestions.
- Loading route calculation.

### 12.2 Empty States

- No stations around current/search location.
- No search suggestions.
- No selected route stops.

### 12.3 Error States

- Missing Mapbox API key.
- Missing Open Charge Map API key.
- Network error.
- Location permission denied/permanently denied.
- Directions API failure.
- Geocoding provider failure.

### 12.4 UI Acceptance Criteria

- App never shows a blank screen for expected errors.
- Each error gives the user a next action.
- Retry is available where appropriate.

## 13. Responsive Behavior

### 13.1 Phones

- Prioritize map and bottom sheet.
- Search can be compact or full-width.
- Route manager should be compact or sheet-based.
- Avoid too many simultaneous overlays.

### 13.2 Tablets

- Station list can become a side sheet/panel.
- Route manager can be a floating side panel.
- Search can remain top aligned.

### 13.3 Landscape

- Station list may use side panel layout to preserve vertical map space.
- Controls must avoid safe-area conflicts.

## 14. Accessibility Requirements

- Touch targets should be at least 44x44 logical pixels where possible.
- Text must have sufficient contrast.
- Dynamic type/text scaling should not break core flows.
- Buttons and controls should have semantic labels.
- Error messages should be readable and actionable.

## 15. Localization

Primary language for MVP: Indonesian.

Required labels include:

- `Stasiun Pengisian Terdekat`.
- `Cari lokasi`.
- `Gunakan lokasi saya`.
- `Rencanakan Rute`.
- `Mode Rute`.
- `Tambah ke Rute`.
- `Mulai Rute`.
- `Hapus Rute`.
- `Tersedia`.
- `Sibuk`.
- `Tidak Beroperasi`.
- `Lokasi tidak ditemukan`.
- `Tidak ada stasiun`.

## 16. Design System Requirements

The design system can be Flutter Material 3 or a custom Flutter theme.

Required tokens:

- Primary color.
- Success/available color.
- Warning/busy color.
- Error/offline color.
- Neutral text colors.
- Card background.
- Map overlay background.
- Border/elevation style.
- Typography scale.
- Spacing scale.
- Corner radius scale.

The exact visual style can differ from the React app as long as the app remains clean, modern, and feature-complete.

## 17. UI Definition of Done

- All core feature flows are reachable from the UI.
- Map, search, station list, station cards, route mode, markers, and toast states are implemented.
- UI handles loading, empty, and error states.
- UI works on Android and iOS phone sizes.
- UI remains usable when location permission is denied.
- UI remains usable when API calls fail.
- No UI requirement depends on copying React/Tailwind implementation details.
