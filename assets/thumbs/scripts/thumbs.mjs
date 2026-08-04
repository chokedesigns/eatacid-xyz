import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

// Canonical output: 300px wide, auto height, sRGB, metadata-free, progressive JPEG at quality 84.
export const JPEG_QUALITY = 84;
export const OUTPUT_WIDTH = 300;
// Informational only; adjust this constant as real candidate benchmarks evolve.
export const LARGE_OUTPUT_WARNING_BYTES = 150 * 1024;
export const INPUT_COLLECTIONS = ['canaan', 'the_419_script'];
export const BACKFILL_COLLECTIONS = ['canaan', 'hen', 'introductions', 'the_419_script'];

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif)$/i;
const GENERATED_REVIEW_FILE = /^\d+\.jpg$/i;
const RETAINED_METADATA_FIELDS = [
  'exif',
  'icc',
  'iptc',
  'xmp',
  'tifftagPhotoshop',
  'comments',
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const thumbsRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(thumbsRoot, '..', '..');

export function defaultPaths() {
  const adminRoot = path.join(repoRoot, 'admin-ui');
  return {
    repoRoot,
    adminRoot,
    inputRoot: path.join(thumbsRoot, 'input'),
    processedRoot: path.join(thumbsRoot, 'processed'),
    reviewRoot: path.join(thumbsRoot, 'review'),
    reportPath: path.join(thumbsRoot, 'backfill-report.json'),
    mastersRoot: path.join(adminRoot, 'src', 'thumbs'),
    manifestPath: path.join(adminRoot, 'src', 'thumbs.manifest.js'),
  };
}

// Keep this identical to admin-ui/scripts/gen-thumbs-manifest.mjs.
export function tokenIdOf(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? match[1] : null;
}

export function retainedMetadataFields(metadata) {
  return RETAINED_METADATA_FIELDS.filter((field) => {
    const value = metadata?.[field];
    return Array.isArray(value) ? value.length > 0 : value != null;
  });
}

export function isCompliant(metadata) {
  return (
    metadata?.width === OUTPUT_WIDTH &&
    metadata?.format === 'jpeg' &&
    retainedMetadataFields(metadata).length === 0
  );
}

// Canonical conversion used by both modes.
export async function convertThumbnail(sourcePath, { warn = () => {} } = {}) {
  const sourceMetadata = await sharp(sourcePath, { failOn: 'error' }).metadata();
  if (sourceMetadata.width == null) throw new Error('Source width could not be determined.');
  if (sourceMetadata.width < OUTPUT_WIDTH) {
    warn(
      `Source width ${sourceMetadata.width}px is below ${OUTPUT_WIDTH}px; the image will be upscaled.`
    );
  }

  const { data, info } = await sharp(sourcePath, { failOn: 'error' })
    .autoOrient()
    .resize({ width: OUTPUT_WIDTH, withoutEnlargement: false })
    .toColourspace('srgb')
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer({ resolveWithObject: true });

  const outputMetadata = await sharp(data, { failOn: 'error' }).metadata();
  const retainedFields = retainedMetadataFields(outputMetadata);
  if (
    info.width !== OUTPUT_WIDTH ||
    outputMetadata.format !== 'jpeg' ||
    outputMetadata.space !== 'srgb' ||
    retainedFields.length > 0
  ) {
    throw new Error(
      `Generated output failed validation (width=${info.width}, format=${outputMetadata.format}, ` +
        `space=${outputMetadata.space}, metadata=${retainedFields.join(',') || 'none'}).`
    );
  }

  return {
    data,
    sourceMetadata,
    outputMetadata,
    width: info.width,
    height: info.height,
    size: data.length,
  };
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function writeNewFile(filePath, data) {
  let handle;
  try {
    handle = await fs.open(filePath, 'wx');
    await handle.writeFile(data);
  } catch (error) {
    if (handle) await fs.rm(filePath, { force: true });
    throw error;
  } finally {
    await handle?.close();
  }
}

async function moveFileExclusive(sourcePath, destinationPath) {
  await fs.copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
  try {
    await fs.unlink(sourcePath);
  } catch (error) {
    await fs.rm(destinationPath, { force: true });
    throw error;
  }
}

async function supportedFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSION.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function existingKeys(files) {
  const byKey = new Map();
  for (const filename of files) {
    const tokenId = tokenIdOf(filename);
    if (tokenId == null) continue;
    const names = byKey.get(tokenId) ?? [];
    names.push(filename);
    byKey.set(tokenId, names);
  }
  return byKey;
}

export function nextNumericKey(files) {
  const byKey = existingKeys(files);
  const duplicates = [...byKey.entries()].filter(([, names]) => names.length > 1);
  if (duplicates.length) {
    const details = duplicates.map(([key, names]) => `${key}: ${names.join(', ')}`).join('; ');
    throw new Error(`Existing master files contain duplicate manifest keys (${details}).`);
  }
  const numericKeys = [...byKey.keys()].map(Number);
  if (numericKeys.some((value) => !Number.isSafeInteger(value))) {
    throw new Error('An existing master key is outside JavaScript safe integer range.');
  }
  return numericKeys.length ? Math.max(...numericKeys) + 1 : 0;
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(
        new Error(
          `Command failed with exit code ${code}. ${stderr.trim() || stdout.trim()}`.trim()
        )
      );
    });
  });
}

export async function generateManifest(adminRoot) {
  return runCommand('npm', ['run', 'gen:thumbs'], { cwd: adminRoot });
}

async function unusedArchivePath(directory, sourceName) {
  const parsed = path.parse(sourceName);
  let candidate = path.join(directory, sourceName);
  let suffix = 2;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(directory, `${parsed.name}-${suffix}${parsed.ext}`);
      suffix += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') return candidate;
      throw error;
    }
  }
}

async function restoreTransaction(outputPath, manifestPath, manifestBytes) {
  await fs.rm(outputPath, { force: true });
  await fs.writeFile(manifestPath, manifestBytes);
}

export async function processInputCollection(
  collection,
  paths,
  { manifestRunner = generateManifest, beforeWrite = async () => {} } = {}
) {
  const result = { collection, status: 'skipped', warnings: [], errors: [] };
  const inputDirectory = path.join(paths.inputRoot, collection);
  const processedDirectory = path.join(paths.processedRoot, collection);
  const masterDirectory = path.join(paths.mastersRoot, collection);

  try {
    await Promise.all([ensureDirectory(inputDirectory), ensureDirectory(processedDirectory)]);
    const pending = await supportedFiles(inputDirectory);
    if (!pending.length) {
      result.message = 'Skipped: no pending input.';
      return result;
    }
    if (pending.length > 1) {
      throw new Error(
        `Found ${pending.length} pending source images (${pending.join(', ')}). ` +
          'Leave no more than one supported image in this collection input folder.'
      );
    }

    const masterFiles = await supportedFiles(masterDirectory);
    const key = nextNumericKey(masterFiles);
    const sourcePath = path.join(inputDirectory, pending[0]);
    const outputPath = path.join(masterDirectory, `${key}.jpg`);
    const archivePath = await unusedArchivePath(processedDirectory, pending[0]);

    if (existingKeys(masterFiles).has(String(key))) {
      throw new Error(`Refusing to create duplicate manifest key ${key}.`);
    }
    try {
      await fs.access(outputPath);
      throw new Error(`Refusing to overwrite existing file: ${outputPath}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }

    const converted = await convertThumbnail(sourcePath, {
      warn: (message) => result.warnings.push(message),
    });
    if (converted.size > LARGE_OUTPUT_WARNING_BYTES) {
      result.warnings.push(
        `Generated thumbnail is ${converted.size} bytes, above the provisional ` +
          `${LARGE_OUTPUT_WARNING_BYTES}-byte warning threshold.`
      );
    }

    const manifestBytes = await fs.readFile(paths.manifestPath);
    await beforeWrite({ collection, sourcePath, outputPath, key });
    await writeNewFile(outputPath, converted.data);
    try {
      await manifestRunner(paths.adminRoot);
      await moveFileExclusive(sourcePath, archivePath);
    } catch (error) {
      await restoreTransaction(outputPath, paths.manifestPath, manifestBytes);
      throw new Error(
        'Post-write transaction failed; the new thumbnail was removed and the manifest restored. ' +
          error.message
      );
    }

    Object.assign(result, {
      status: 'processed',
      key,
      sourceArchivePath: archivePath,
      thumbnailPath: outputPath,
      dimensions: `${converted.width}x${converted.height}`,
      byteSize: converted.size,
      message: 'Thumbnail created, manifest regenerated, and source archived.',
    });
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error?.message ?? String(error));
    result.message = 'Processing failed.';
  }
  return result;
}

export async function runInput(paths = defaultPaths(), options = {}) {
  const results = [];
  for (const collection of INPUT_COLLECTIONS) {
    results.push(await processInputCollection(collection, paths, options));
  }
  return {
    mode: 'input',
    ok: results.every((result) => result.status !== 'failed'),
    results,
  };
}

async function clearManagedReviewDirectory(directory) {
  await ensureDirectory(directory);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && GENERATED_REVIEW_FILE.test(entry.name))
      .map((entry) => fs.rm(path.join(directory, entry.name)))
  );
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function addIssue(report, item, severity, message) {
  const issue = { collection: item.collection, path: item.originalPath, message };
  report[severity].push(issue);
  item[severity].push(message);
}

function addProcessingError(report, item, message) {
  addIssue(report, item, 'warnings', message);
  addIssue(report, item, 'errors', message);
}

export async function runBackfill(paths = defaultPaths()) {
  const report = {
    mode: 'backfill',
    timestamp: new Date().toISOString(),
    collections: {},
    totals: { filesScanned: 0, compliantSkipped: 0, candidatesGenerated: 0 },
    warnings: [],
    errors: [],
    candidateByteSizes: { minimum: null, median: null, maximum: null },
    items: [],
  };

  for (const collection of BACKFILL_COLLECTIONS) {
    await clearManagedReviewDirectory(path.join(paths.reviewRoot, collection));
  }

  for (const collection of BACKFILL_COLLECTIONS) {
    const masterDirectory = path.join(paths.mastersRoot, collection);
    const reviewDirectory = path.join(paths.reviewRoot, collection);
    const files = await supportedFiles(masterDirectory);
    const keys = existingKeys(files);
    const ambiguousKeys = new Set(
      [...keys.entries()].filter(([, names]) => names.length > 1).map(([key]) => key)
    );
    const summary = {
      filesScanned: files.length,
      compliantSkipped: 0,
      candidatesGenerated: 0,
      warnings: 0,
      errors: 0,
    };
    report.collections[collection] = summary;
    report.totals.filesScanned += files.length;

    for (const filename of files) {
      const originalPath = path.join(masterDirectory, filename);
      const item = {
        collection,
        originalPath,
        originalFormat: null,
        originalDimensions: null,
        originalByteSize: null,
        candidatePath: null,
        candidateDimensions: null,
        candidateByteSize: null,
        percentageReduction: null,
        status: 'error',
        warnings: [],
        errors: [],
      };
      report.items.push(item);

      try {
        item.originalByteSize = (await fs.stat(originalPath)).size;
        const tokenId = tokenIdOf(filename);
        if (tokenId == null) {
          addProcessingError(report, item, 'Filename has no leading numeric manifest key.');
          continue;
        }
        if (ambiguousKeys.has(tokenId)) {
          const message =
            `Manifest key ${tokenId} is ambiguous across: ${keys.get(tokenId).join(', ')}.`;
          addProcessingError(report, item, message);
          continue;
        }

        let metadata;
        try {
          metadata = await sharp(originalPath, { failOn: 'error' }).metadata();
        } catch (error) {
          addProcessingError(report, item, `Source cannot be decoded: ${error.message}`);
          continue;
        }

        item.originalFormat = metadata.format ?? null;
        item.originalDimensions =
          metadata.width != null && metadata.height != null
            ? `${metadata.width}x${metadata.height}`
            : null;

        if (isCompliant(metadata)) {
          item.status = 'compliant-skipped';
          summary.compliantSkipped += 1;
          report.totals.compliantSkipped += 1;
          continue;
        }

        const converted = await convertThumbnail(originalPath, {
          warn: (message) => addIssue(report, item, 'warnings', message),
        });
        const candidatePath = path.join(reviewDirectory, `${tokenId}.jpg`);
        await writeNewFile(candidatePath, converted.data);

        Object.assign(item, {
          status: 'candidate-generated',
          candidatePath,
          candidateDimensions: `${converted.width}x${converted.height}`,
          candidateByteSize: converted.size,
          percentageReduction:
            item.originalByteSize > 0
              ? Number(
                  (((item.originalByteSize - converted.size) / item.originalByteSize) * 100).toFixed(
                    2
                  )
                )
              : null,
        });
        summary.candidatesGenerated += 1;
        report.totals.candidatesGenerated += 1;

        if (converted.size > LARGE_OUTPUT_WARNING_BYTES) {
          addIssue(
            report,
            item,
            'warnings',
            `Candidate is ${converted.size} bytes, above the provisional ` +
              `${LARGE_OUTPUT_WARNING_BYTES}-byte warning threshold.`
          );
        }
      } catch (error) {
        addIssue(report, item, 'errors', error?.message ?? String(error));
      }
    }

    const collectionItems = report.items.filter((item) => item.collection === collection);
    summary.warnings = collectionItems.reduce((count, item) => count + item.warnings.length, 0);
    summary.errors = collectionItems.reduce((count, item) => count + item.errors.length, 0);
  }

  const sizes = report.items
    .map((item) => item.candidateByteSize)
    .filter((size) => size != null);
  if (sizes.length) {
    report.candidateByteSizes = {
      minimum: Math.min(...sizes),
      median: median(sizes),
      maximum: Math.max(...sizes),
    };
  }
  report.ok = report.errors.length === 0;
  await fs.writeFile(paths.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function displayPath(value, root) {
  return value ? path.relative(root, value) || '.' : '-';
}

function printInputSummary(summary, paths) {
  console.log('\nThumbnail input summary');
  for (const result of summary.results) {
    console.log(`\n[${result.collection}] ${result.status.toUpperCase()}: ${result.message}`);
    if (result.key != null) console.log(`  Numeric key: ${result.key}`);
    if (result.thumbnailPath) {
      console.log(`  Thumbnail: ${displayPath(result.thumbnailPath, paths.repoRoot)}`);
      console.log(`  Dimensions: ${result.dimensions}`);
      console.log(`  Byte size: ${result.byteSize}`);
    }
    if (result.sourceArchivePath) {
      console.log(`  Source archive: ${displayPath(result.sourceArchivePath, paths.repoRoot)}`);
    }
    for (const warning of result.warnings) console.warn(`  WARNING: ${warning}`);
    for (const error of result.errors) console.error(`  ERROR: ${error}`);
  }
  console.log(`\nOverall result: ${summary.ok ? 'SUCCESS' : 'FAILED'}`);
}

function printBackfillSummary(report, paths) {
  console.log('\nThumbnail backfill audit');
  console.log(`Timestamp: ${report.timestamp}`);
  for (const [collection, summary] of Object.entries(report.collections)) {
    console.log(
      `${collection}: scanned=${summary.filesScanned}, compliant/skipped=${summary.compliantSkipped}, ` +
        `candidates=${summary.candidatesGenerated}, warnings=${summary.warnings}, errors=${summary.errors}`
    );
  }
  console.log(`Total files scanned: ${report.totals.filesScanned}`);
  console.log(`Compliant/skipped: ${report.totals.compliantSkipped}`);
  console.log(`Candidates generated: ${report.totals.candidatesGenerated}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(
    `Candidate bytes (min/median/max): ${report.candidateByteSizes.minimum ?? '-'} / ` +
      `${report.candidateByteSizes.median ?? '-'} / ${report.candidateByteSizes.maximum ?? '-'}`
  );
  console.log(`Report: ${displayPath(paths.reportPath, paths.repoRoot)}`);

  for (const item of report.items.filter((entry) => entry.status !== 'compliant-skipped')) {
    console.log(`\n[${item.collection}] ${item.status}`);
    console.log(`  Original: ${displayPath(item.originalPath, paths.repoRoot)}`);
    console.log(
      `  Original details: ${item.originalFormat ?? 'unknown'}, ` +
        `${item.originalDimensions ?? 'unknown dimensions'}, ${item.originalByteSize ?? 'unknown'} bytes`
    );
    if (item.candidatePath) {
      console.log(`  Candidate: ${displayPath(item.candidatePath, paths.repoRoot)}`);
      console.log(`  Candidate details: ${item.candidateDimensions}, ${item.candidateByteSize} bytes`);
      console.log(`  Reduction: ${item.percentageReduction}%`);
    }
    for (const warning of item.warnings) console.warn(`  WARNING: ${warning}`);
    for (const error of item.errors) console.error(`  ERROR: ${error}`);
  }
  console.log(`\nOverall result: ${report.ok ? 'SUCCESS' : 'FAILED'}`);
}

async function main() {
  const mode = process.argv[2];
  const paths = defaultPaths();
  if (mode === 'input') {
    const summary = await runInput(paths);
    printInputSummary(summary, paths);
    if (!summary.ok) process.exitCode = 1;
    return;
  }
  if (mode === 'backfill') {
    const report = await runBackfill(paths);
    printBackfillSummary(report, paths);
    if (!report.ok) process.exitCode = 1;
    return;
  }
  console.error('Usage: node assets/thumbs/scripts/thumbs.mjs <input|backfill>');
  process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) await main();