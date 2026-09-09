import sharp from "sharp";
import path from "node:path";

const assetsDir = path.resolve("assets/site");

const files = [
  "ethereum-chain-logo-01.png",
  "tezos-chain-logo-01.png",
];

for (const file of files) {
  const input = path.join(assetsDir, file);
  const output = path.join(
    assetsDir,
    file.replace(".png", "-60.png")
  );

  await sharp(input)
    .resize(60, 60, {
      fit: "contain",
      withoutEnlargement: false,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(output);

  console.log(`Created: ${output}`);
}