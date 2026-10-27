# WeShould iOS companion

The WeShould iOS companion adds system-level capture to the [deployed web application](https://weshould.mit-sdg.dev). The host application displays the site using `WKWebView`; the separate Share Extension appears in compatible iOS Share Sheets and provides an activity-name and URL form.

**iOS demonstration:** [WeShould Share Extension](https://youtube.com/shorts/qTrJqmveG7k)  
**Full application demonstration:** [WeShould P4](https://youtu.be/rc6xTzkLKjc)

## Architecture

The Xcode project contains two targets: the main WeShould iOS host and `WeShouldShareExtension`. The extension uses `com.apple.share-services`, a programmatic `ShareViewController`, and `NSItemProvider` to read supported HTTP(S) links or text. Its form authenticates with the WeShould backend and submits an expressed intention through the existing application API. Activity identity, connections, and planning remain within the server-side concept system; native capture does not duplicate those responsibilities.

The extension has a bundle identifier prefixed with the host application's identifier. The deployment target was adjusted for an iPhone running iOS 26. This Xcode project lives under `ios/` and is independent of the repository's Bun/TypeScript web build.

## Build configuration

The project uses Xcode automatic development signing and a compatible iOS deployment target. Building the main app embeds `WeShouldShareExtension.appex` in the host app. The share extension has its own `Info.plist` with `NSExtensionPointIdentifier` and `NSExtensionPrincipalClass` entries and an activation rule for supported shared content.

## Behavior and scope

The native interface receives a URL when the source application supplies one, allows the user to edit the activity name and link, and requests WeShould authentication independently of the website's session. It does not store the password. A native share is not itself a reservation, invitation, or committed plan; it expresses the same lightweight intention used by the web application.

The Share Extension was verified as visible in the iOS Share Sheet on a physical device. Availability depends on the sending application's use of standard iOS sharing APIs and the shared item types. The demonstration documents the native integration; it is not an App Store release claim.
