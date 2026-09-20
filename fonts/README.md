# The typefaces Cipher carries

Six families ship with the app as Latin-subset WOFF2, two weights each. They
are bundled rather than requested from a font service so that the app works
with the network off and so that a choice of typeface lands the same way on
every device. Asking for device fonts by name did not: Android has no
Helvetica and no Segoe UI, and Chrome there does not support the `ui-rounded`
keyword, so three of the seven choices fell through to Roboto and looked
exactly like the fourth.

Every one of them is under the **SIL Open Font License 1.1**, which permits
bundling and redistribution with the app.

| Shown as | Family | By |
| --- | --- | --- |
| Grotesk | Inter | Rasmus Andersson |
| Humanist | Source Sans 3 | Paul D. Hunt, Adobe |
| Rounded | Nunito | Vernon Adams, Cyreal, Jacques Le Bailly |
| Serif | Lora | Cyreal |
| Mono | JetBrains Mono | Philipp Nurullin, Konstantin Bulenkov, JetBrains |
| Hyperlegible | Atkinson Hyperlegible | Braille Institute of America |

"System" is not a file. It is whatever the device already uses, which is the
right answer for anyone who wants the app to look like the rest of their
phone.

The licence text travels with each family upstream and is reproduced at
<https://openfontlicense.org>. The files here came from the Fontsource
packages of the same names.
