# DNA Lab

A browser sandbox for breeding fish across generations. Every fish carries two copies of each gene, and what you see is built from what it carries.

Open `index.html` through any static web server, or host the folder on GitHub Pages. There is no build step.

## How it works

Every fish is built in three layers, each with its own genes:

- **A shared body.** All 13 species (clownfish, blue tang, angelfish, neon tetra, betta, oranda, koi, pictus catfish, lionfish, swordtail, guppy, pufferfish, anglerfish) are drawn on one body template with the same points in the same order. A copy of the body gene is a species recipe such as 60% clownfish and 40% koi; the fish shows the average of its two copies, keeping the four strongest species.
- **Fins as swappable parts.** Each slot (dorsal, tail, anal, side and belly fins) takes a part from a library: forked, fan, square, lyre, sword, delta, flowing, notched, spiky, sail and more. Each part type has two authored variants. The dominant type shows, and its shape (between the two variants) and size are the average of both copies. Parts attach to sockets that ride the blended body and scale with its depth.
- **Extras.** A tail spine, whiskers, a head hump and an anglerfish lure live in every fish's template and only appear when their gene calls for them.

On top of that, **color and patterns** (body color, albino, white bars, dark bars, neon stripe, back marking, patches, spots, yellow tail, dark fin edges) are dominant/recessive genes, switched on as layers instead of averaged so colors never turn muddy.

**Inheritance:** for each gene, each parent passes on one of its two copies at random. Siblings differ, hidden recessive copies resurface, and hybrids breed with hybrids indefinitely. Crossing two pure species gives near-identical babies; breed those babies together to see real variety.

**Mutation:** a copy occasionally changes (a body recipe drifts, a fin type or shape changes, a trait flips). Changed copies are marked "new" in the genome sheet.

**Hidden carriers:** angelfish carry albino, the betta carries spots, and koi carry long flowing tails.

Add any species to the tank from the catalog. The tank is saved in the browser with `localStorage`.

## Files

- `js/species.js`: species bodies, the fin part library, genes and starting stock
- `js/genetics.js`: genomes, expression, inheritance and mutation
- `js/render.js`: turns a phenotype into SVG: blended body, parts on sockets, extras and pattern layers
- `js/app.js`: tank, catalog, breeding bench, genome sheet and saving
