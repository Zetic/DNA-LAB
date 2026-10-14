# DNA Lab

A browser sandbox for breeding fish across generations. Every fish carries two copies of each gene, and what you see is built from what it carries.

Open `index.html` through any static web server, or host the folder on GitHub Pages. There is no build step.

## How it works

- **Shared template.** Every species (clownfish, blue tang, angelfish, neon tetra, betta) is drawn on the same fish template. Fins are resampled between matching landmarks (fin start, fin middle, fin end, tail tips), so every species has the same points in the same order. Any mix of species is a weighted sum of matching points.
- **Shape genes.** One gene per region: body, dorsal fin, anal fin, tail fin, side fins. Each copy is a species recipe such as 60% clownfish and 40% betta. A fish shows the average of its two copies, keeping the four strongest species.
- **Trait genes.** Color and patterns are dominant/recessive genes. Patterns are switched on as layers instead of averaged, so colors don't turn muddy. Recessive copies can hide and reappear in later generations. Both starting angelfish carry hidden albino, and the betta carries hidden spots.
- **Inheritance.** For each gene, each parent passes on one of its two copies at random. Siblings differ, and hybrids can breed with hybrids indefinitely. Crossing two pure species gives near-identical babies; breed those babies together to see real variety.
- **Mutation.** A copy occasionally changes: a shape recipe drifts toward a random species, or a trait flips. Changed copies are marked "new".
- **Superset features.** The tang's tail spine lives in the template for every fish and is only shown when the gene calls for it.

The tank is saved in the browser with `localStorage`.

## Files

- `js/species.js`: species shapes, landmarks, genes and starting stock
- `js/genetics.js`: genomes, expression, inheritance and mutation
- `js/render.js`: turns a phenotype into SVG on the shared template
- `js/app.js`: tank, breeding bench, genome sheet and saving
