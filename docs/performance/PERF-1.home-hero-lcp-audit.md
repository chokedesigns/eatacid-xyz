# PERF-1 — Home hero LCP audit

Audit date: 2026-08-20

Profile: AUDIT / CLOSURE

Scope: read-only production-behavior audit; this file is the only intended source change.

## Verdict

The LCP image is present, eager, high-priority, and responsive in the initial Home HTML. It loads well before LCP, but it cannot paint because its ancestor, `.home-viewport.first-paint-surface`, starts at `opacity: 0` and `visibility: hidden` in the hosted Webflow CSS. The only release mechanism is the custom `shared/public-first-paint.js` code delivered on staging inside the large Home JavaScript bundle.

The live page does not request that bundle directly. Its footer loads the 253-byte root `home.js` loader, which then dynamically imports `./staging/home.js`. The served staging response is 4,992,426 uncompressed bytes; the supplied runtime trace reported about 1.56 MB transferred. It contains the small first-paint coordinator together with the unrelated Beacon SDK/wallet runtime. The whole response must download and be parsed/linked before the first-paint module can execute and add `is-first-paint-ready` or `is-first-paint-fallback` to `<body>`.

This late availability of the release code is the primary render-delay cause. The coordinator's own post-start gates are bounded to about 1.2–1.3 seconds and, because the image had already loaded in the measured run, should usually resolve much faster than that. The final surface transition contributes only a 40 ms testnet delay plus a 220 ms opacity transition. Those bounded waits cannot by themselves explain an 8.125-second render delay.

## Measured evidence and timing

| Condition | LCP | INP | CLS |
| --- | ---: | ---: | ---: |
| No throttling | ~1.07 s | 8 ms | 0 |
| Slow 4G | 12.47 s | 7 ms | 0 |

Slow-4G LCP breakdown for `img.home-hero-character-image`:

| Phase | Duration | Approximate absolute time |
| --- | ---: | ---: |
| TTFB | 83 ms | 0–83 ms |
| Resource load delay | 745 ms | request begins ~828 ms |
| Resource load duration | 3,519 ms | response completes ~4,347 ms |
| Element render delay | 8,125 ms | paint/LCP at 12,471.4 ms |

The image therefore had finished loading about 8.1 seconds before the browser recorded it as LCP.

## Implementation locations

- `index.html:2` — checked mirror of the Home DOM and hero image attributes. The live staging HTML matched this hero markup during the audit, except that live custom code loads the absolute root `https://chokedesigns.github.io/eatacid-xyz/home.js` module rather than the mirror's two local modules at `index.html:59-60`.
- Hosted Webflow CSS `staging-eatacid-xyz.webflow.shared.f47fa79a6.css` — static layout and the initial hidden state. This stylesheet is external, so it has no repository line number.
- `loaders/home.loader.js:1-6` — selects `./staging` for the staging hostname and starts the dynamic import of `./staging/home.js`.
- `.github/workflows/pages.yml:59,79,81-95` — produces both Parcel builds with `--no-optimize`, assembles the Pages artifact, and publishes the root loader as `home.js`.
- `package.json:24-25` — Parcel builds `webflow/home.js` as the Home entry.
- `webflow/home.js:1-2` — the entire Home source entry: first `public-first-paint.js`, then `beacon-setup.js`.
- `shared/public-first-paint.js:10-16,26-103` — hero selector, time bounds, and injected reveal CSS.
- `shared/public-first-paint.js:140-187` — critical-font verification.
- `shared/public-first-paint.js:189-266` — image load, decode, timeout, and animation-frame gates.
- `shared/public-first-paint.js:268-358` — network state, fail-open, ready/fallback classes, and reveal orchestration.
- `shared/public-first-paint.js:360-411` — immediate start when `<body>` exists, with `DOMContentLoaded` only as a fallback.
- `shared/beacon-setup.js:5,132-157,540-592` — Beacon SDK import, synchronous client construction, and independent wallet-button boot.

## Initial DOM, resource, and CSS state

The image is not inserted by JavaScript. It is an initial descendant of:

```text
body.body-copy.first-paint-main
└─ div.home-viewport.first-paint-surface
   └─ div.home-hero
      └─ div.home-hero-character
         └─ img.home-hero-character-image
```

Initial image attributes from `index.html:2` and the matching live HTML:

- usable `src` immediately: 1000 × 1000 PNG;
- `srcset`: 500w, 800w, and 1000w PNG candidates;
- `sizes="(max-width: 1000px) 100vw, 1000px"`;
- `loading="eager"`;
- `fetchpriority="high"`;
- `decoding="async"`;
- no `width` or `height` attributes;
- no inline style, animation identifier, or Webflow interaction identifier.

The fetched candidates were 80,880 bytes (500 × 500), 193,270 bytes (800 × 800), and 260,778 bytes (1000 × 1000). The selected candidate cannot be established without the measured viewport and device-pixel ratio.

The hosted CSS gives the image `display: block`, full width/height, `object-fit: contain`, and no opacity, visibility, transform, clip-path, mask, animation, transition, or z-index suppression. Its immediate parent is a visible flex layout with `overflow: hidden`; that clipping is normal composition and does not move or scale the image out of view. At `max-width: 991px`, the hero becomes columnar and the image object position changes to center-bottom. At `max-width: 479px`, the image gets `min-width: 354px`. No responsive rule changes the reveal gate.

The suppressing rule is on the ancestor:

```css
.home-viewport.first-paint-surface {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  block-size: calc(100svh - 90px);
}
```

`pointer-events` does not affect paint, but ancestor `opacity: 0` and `visibility: hidden` do. The image participates in layout but is not a visible paint/LCP candidate. The initial body has neither `is-testnet`, `is-first-paint-ready`, nor `is-first-paint-fallback`.

## Exact reveal dependency chain

1. The parser/preload scanner discovers the image in initial HTML. The head already preconnects to `cdn.prod.website-files.com`; the image request is not dependent on application JavaScript.
2. Webflow CSS makes `.home-viewport.first-paint-surface` transparent and hidden, suppressing every descendant, including the otherwise renderable image.
3. Near the end of live HTML, jQuery and two classic Webflow scripts occur before the root Home module. The live Home module is the 253-byte GitHub Pages loader. The loader itself is a deferred module and its dynamic bundle URL is not known until it executes.
4. `loaders/home.loader.js` selects `./staging` and dynamically imports `./staging/home.js`. This is a serial loader-to-bundle request chain.
5. The staging Home bundle downloads and is parsed/linked. Its entry contains `webflow/home.js`, the first-paint coordinator, and the Beacon SDK/wallet graph. No ready/fallback CSS class can be added before this point.
6. During module evaluation, `shared/public-first-paint.js` executes before `shared/beacon-setup.js`. `startPublicFirstPaint()` finds the existing body and calls `runFirstPaint()` immediately; it does not wait for `DOMContentLoaded`, `window.load`, Webflow ready, wallet state, RPC/TzKT, or font-global readiness.
7. `runFirstPaint()` injects the release selectors, synchronously adds `is-testnet` from the local network configuration, starts a 1,300 ms fail-open timer, and yields for one `requestAnimationFrame`.
8. It then waits in parallel for all four font descriptors (maximum 1,000 ms) and the hero image (load/error, `decode()`, then one frame; maximum 1,200 ms). Because the measured image response completed around 4.347 s, a later-starting bundle should find `image.complete && naturalWidth > 0`; only decode/frame work remains. This last sentence is an inference from the supplied timing, not a recorded class timestamp.
9. `reveal()` adds `is-first-paint-ready`; if either bounded check did not become ready, it also adds `is-first-paint-fallback`. An error or 1,300 ms fail-open calls the same release path and applies inline visibility as a backstop.
10. In the successful testnet path, the injected CSS changes the surface to `opacity: 1` and `visibility: visible` with a 40 ms transition delay and 220 ms opacity transition. In fallback, transitions are disabled. The image can now paint and become LCP.

Compact timeline:

```text
initial HTML discovers eager/high-priority hero (~0.828 s request)
→ hero PNG loaded (~4.347 s)
→ ancestor still opacity:0 + visibility:hidden
→ root home.js loader executes
→ loader discovers/downloads/parses large staging/home.js
→ public-first-paint evaluates and adds is-testnet
→ rAF + parallel font/image checks (bounded 1.0/1.2 s)
→ is-first-paint-ready[/fallback]
→ visibility visible + opacity reveal (40 ms delay/220 ms transition when ready)
→ hero paints and LCP is recorded (~12.471 s)
```

## What gates reveal

| Gate/path | Direct LCP effect |
| --- | --- |
| Webflow CSS ancestor `opacity: 0; visibility: hidden` | Direct: prevents hero paint until overridden. |
| Root loader download/evaluation | Direct prerequisite: only it discovers the actual staging bundle. |
| Entire staging Home bundle download and parse/link | Direct prerequisite: reveal code is inside it. This is the dominant static explanation for the long post-image delay. |
| Initial `requestAnimationFrame` | Direct but normally one frame. |
| Four `document.fonts.load()` checks | Direct after bundle start; bounded at 1,000 ms. This intentionally gates the whole surface even though the LCP is an image. |
| Hero load/`decode()`/frame check | Direct after bundle start; bounded at 1,200 ms. In the measured run, the resource was already available long before LCP. |
| Fail-open timer | Direct backstop, but it starts only after the large bundle executes. It cannot protect against a late or failed bundle request. |
| 40 ms testnet transition delay and 220 ms surface transition | Direct, small bounded contributor in the non-fallback path. |
| Beacon SDK parse/link | Indirect through shared bundle delivery/processing. It is unrelated to hero readiness. |
| `new DAppClient()` and synchronous wallet setup | Starts after first-paint evaluation has kicked off and could delay the queued frame if it occupies the main thread; no evidence quantifies it as material. |
| Active-account validation, NFT fetches, wallet/network requests | Not awaited by the first-paint coordinator; not a logical reveal gate. |
| Webflow runtime/interactions | No direct gate. Live HTML has no `data-w-id` or inline style, and the two referenced Webflow scripts contain no hero/first-paint selector or page interaction configuration. Their earlier classic-script placement can indirectly postpone the Home loader's execution. |

There is no relevant `setInterval`, DOM insertion/removal, display toggle, transform, scale, mask, clip-path transition, stacking change, `window.load`, Webflow ready hook, or wallet Promise in the reveal chain.

## Does the ~8.1-second render delay have an explanation?

Yes. The image remains categorically unpaintable until custom code releases an ancestor, and that custom code is unavailable until a serial loader and the large wallet-bearing Home bundle have downloaded and been processed. The post-start waits and CSS transition are far too small to account for 8.125 seconds on their own.

Static inspection cannot assign exact milliseconds between the staging bundle's network response, module parse/evaluation, queued animation frames, image decode, and the opacity transition. A follow-up trace could record the dynamic bundle's request/response times and the moment `is-first-paint-ready` is added. That would refine attribution, but it is not required to identify the causal gate.

## Resource discovery review

The image is discovered reasonably early: it is initial HTML, eager, high priority, responsive, and its CDN has a head preconnect. It is not lazy, JS-created, or dependent on CSS/JS for its URL. `fetchpriority` affects scheduling after discovery; it does not override the ancestor visibility gate.

The 745 ms load delay is therefore a secondary opportunity, not the root cause. The image has no preload, and it sits after head CSS/WebFont work in document order, so a responsive image preload could potentially move discovery/scheduling earlier. That should be considered only after a waterfall confirms contention and should use matching `imagesrcset`/`imagesizes`; a plain preload risks selecting or duplicating the wrong candidate. The 3.519-second duration is plausible for the selected PNG on Slow 4G. Format migration is outside this audit and is not necessary to explain the render delay.

## Ranked options

### A. Minimal surgical fix — recommended

Deliver the existing first-paint coordinator as a small independent Parcel entry and have the existing root Home loader import it concurrently with the wallet-bearing Home bundle. Keep the current `webflow/home.js` import initially as a fallback; `__EA_PUBLIC_FIRST_PAINT__` already prevents a duplicate start.

- Proposed locations: add a small entry such as `webflow/first-paint.js`; add it to both Parcel commands at `package.json:24-25`; start its `./prod`/`./staging` import from `loaders/home.loader.js:3-6` alongside the current Home import. The Pages workflow already copies all dist output, so no Webflow custom-code URL needs to change.
- Behavior: the same `runFirstPaint()`, font/image readiness checks, network/banner state, fallback behavior, and 220 ms surface fade run as today, but after a small dependency graph instead of after Beacon.
- Expected LCP: materially earlier—directionally near image availability/decode plus the existing bounded choreography, rather than after the large Home bundle. From the supplied trace, this targets removal of most of the ~8.1-second render delay, not the 3.519-second image transfer.
- Aesthetic: closest preservation of the current reveal; its timing becomes earlier under constrained networks.
- Complexity/risk: low to low-moderate. Validate Parcel output naming/shared chunks, duplicate-module guarding, testnet viewport sizing, and loader failure handling.
- Scope: Home loader/build behavior only; shared first-paint semantics remain unchanged. No hosted Webflow DOM/CSS edit is required.

### B. Moderate structural improvement — visible-first hero composition

Make the character image independent of the gated `.first-paint-surface`, while continuing to animate the title, marquee/chrome, and testnet banner. This requires moving/narrowing the first-paint class in the Home DOM and adding Home-specific initial/release selectors. Establish testnet viewport sizing in the initial state so the later banner state does not introduce CLS.

- Proposed locations: Home structure mirrored at `index.html:2`, the corresponding Webflow Home structure/hosted CSS, and Home-specific selectors in `shared/public-first-paint.js:26-103,277-305`.
- Behavior: the LCP image paints as soon as it loads/decodes; secondary layers retain reveal choreography.
- Expected LCP: best possible direction from the current asset path, approximately eliminating the element-render gate and leaving resource timing/decode as the main bound.
- Aesthetic: changes the whole-surface fade into an image-first composition; still animated, but not pixel-identical.
- Complexity/risk: moderate. Responsive layout, banner-induced sizing, CLS, and Webflow/repository mirror parity need browser validation.
- Scope: Home-specific if selectors are narrowly written. Webflow-generated code materially complicates this option because the live initial hidden rule is hosted there.

### C. No change

Accept the current behavior only if an intentionally blank/hidden hero for many seconds on constrained connections is an explicit art-direction requirement that outweighs LCP and resilience. This has no implementation risk and exactly preserves the reveal, but it retains the measured 12.47-second LCP. It also retains a failure seam: if the root loader or staging bundle never executes, the coordinator's internal fail-open timer never starts and the surface can remain hidden indefinitely. This option is not recommended.

A responsive preload may be evaluated later as a secondary resource-discovery change, but it is not an alternative to fixing the visibility gate.

## Expected benefit and validation for an implementation ticket

For option A, expect LCP to move toward the image's ~4.35-second availability on the supplied Slow-4G run, plus decode/frame/reveal overhead. Do not promise a specific final number without a new trace. Validate at the same viewport/DPR and throttle with performance marks for root loader evaluation, small first-paint evaluation, dynamic Home response end, ready/fallback class mutation, image decode completion, and LCP.

## Audit boundaries

- No production behavior, Webflow state, external service, or nested repository file was modified.
- External reads were limited to the live staging HTML, its referenced hosted CSS and Webflow JavaScript, the GitHub Pages root Home loader and staging Home bundle, and the three responsive hero image candidates.
- No external mutations were performed.

## Conclusion

`PERF-1 AUDIT COMPLETE — HOME HERO LCP ROOT CAUSE IDENTIFIED`
