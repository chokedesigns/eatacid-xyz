import sharp from "sharp";
import fs from "node:fs/promises";

const jobs = [
  {
    input:
      "C:/Users/njbut/Documents/EATACIDxyz/Assets/images/master/PNG/DOSRs_Introductions_Tease_02.png",
    output: "assets/site/DOSRs_Introductions_Tease_02-600.png",
  },
  {
    input:
      "C:/Users/njbut/Documents/EATACIDxyz/Assets/images/master/PNG/INTRODUCTIONS_WHITE_OUT_01.png",
    output: "assets/site/INTRODUCTIONS_WHITE_OUT_01-600.png",
  },
];

for (const { input, output } of jobs) {
  const beforeMeta = await sharp(input).metadata();
  const beforeStat = await fs.stat(input);

  await sharp(input)
    .resize({
      width: 600,
      height: 600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(output);

  const afterMeta = await sharp(output).metadata();
  const afterStat = await fs.stat(output);

  console.log("");
  console.log("OUTPUT:", output);
  console.log(
    "BEFORE:",
    `${beforeMeta.width}x${beforeMeta.height}`,
    `${(beforeStat.size / 1024).toFixed(1)} KB`
  );
  console.log(
    "AFTER: ",
    `${afterMeta.width}x${afterMeta.height}`,
    `${(afterStat.size / 1024).toFixed(1)} KB`
  );
  console.log(
    "SAVED: ",
    `${(100 * (1 - afterStat.size / beforeStat.size)).toFixed(1)}%`
  );
}