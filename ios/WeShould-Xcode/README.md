# WeShould iOS companion

The native iOS project complements the deployed WeShould web application. The host app uses `WKWebView` to present https://weshould.mit-sdg.dev. A separate Share Extension handles web URLs and text from the iOS Share Sheet and presents a SwiftUI form for an activity name, reference, and WeShould account authentication.

## Architecture

The host app and Share Extension are separate iOS targets. The extension reads supported items using `NSItemProvider`, extracts a usable HTTP(S) reference, and communicates with the existing WeShould backend. No new sync-engine concept is introduced; activity identity, intention storage, and authentication remain server responsibilities.

The Share Extension uses a `com.apple.share-services` extension point and a programmatic `ShareViewController`. Its bundle identifier extends the host app's identifier with `.share`. Both targets use a minimum deployment version compatible with the device used for testing (iOS 26). The native project is separate from the Bun/TypeScript web build.

## Build and run

Open the Xcode project in this directory, choose the main **WeShould** scheme, configure development signing for both the app and extension, and build onto a compatible iPhone. The extension is available through the iOS Share Sheet when a host application supplies supported URL or text content.

## Verification and limitations

The Share Extension was observed in the iOS Share Sheet on a physical device after the deployment target was corrected. The documented verification does not establish that every Safari, TikTok, or Instagram share completes a backend save. Some host apps offer proprietary sharing flows rather than standard URL items. The extension authenticates separately from the embedded web experience and does not persist the password. The deployed web app also supports direct manual entry of an activity name and link.

The companion is a development build; no App Store release is claimed.
