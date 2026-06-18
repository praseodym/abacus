const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

exports.pdfDiff = ({ core }) => {
  // Generated PDFs are stored under backend/tmp-pdf-gen/{base,head}
  const pdfRoot = path.join("backend", "tmp-pdf-gen");
  const dirs = {
    base: path.join(pdfRoot, "base"),
    head: path.join(pdfRoot, "head"),
    diff: path.join(pdfRoot, "diffs"),
  };

  // Ensure diff folder exists
  fs.mkdirSync(dirs.diff, { recursive: true });

  // Reads .pdf files in the given directory (if it exists) and returns file names
  const listPdfFiles = (root) => {
    if (!fs.existsSync(root)) {
      return [];
    }

    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"),
      )
      .map((entry) => entry.name);
  };

  const allFiles = Array.from(
    new Set([...listPdfFiles(dirs.base), ...listPdfFiles(dirs.head)]),
  ).sort();

  // Markdown table that will be posted as a comment on the PR
  const baseRef = process.env.BASE_REF;
  const rows = [
    "### PDF Diff Summary",
    "",
    `Comparing against base branch: \`${baseRef}\``,
    "",
    "| File | Status |",
    "| --- | --- |",
  ];

  // Map diff states to user-friendly labels
  const statusLabels = {
    identical: "✅ No changes",
    diff: "⚠️ Changes",
    added: "🆕 Added",
    removed: "🗑️ Removed",
  };

  let diffFound = false;

  // Iterate through every PDF present in either ref, run diff-pdf where applicable, and capture the status
  for (const relativePath of allFiles) {
    const baseFile = path.join(dirs.base, relativePath);
    const headFile = path.join(dirs.head, relativePath);
    const hasBase = fs.existsSync(baseFile);
    const hasHead = fs.existsSync(headFile);
    let status = "";

    if (hasBase && hasHead) {
      const diffOutput = path.join(dirs.diff, relativePath);
      const { status: exitCode } = spawnSync(
        "diff-pdf",
        [
          "--mark-differences",
          "--skip-identical",
          `--output-diff=${diffOutput}`,
          baseFile,
          headFile,
        ],
        { stdio: "inherit" },
      );

      if (exitCode === 0) {
        status = statusLabels.identical;
        fs.rmSync(diffOutput, { force: true });
        core.info(`No differences in ${relativePath}`);
      } else if (exitCode === 1) {
        status = statusLabels.diff;
        diffFound = true;
        core.info(`Differences found in ${relativePath}`);
      } else {
        throw new Error(
          `diff-pdf failed for ${relativePath} with exit code ${exitCode}`,
        );
      }
    } else if (hasHead) {
      status = statusLabels.added;
      diffFound = true;
      core.info(`File ${relativePath} added`);
    } else {
      status = statusLabels.removed;
      diffFound = true;
      core.info(`File ${relativePath} removed`);
    }

    rows.push(`| ${relativePath} | ${status} |`);
  }

  rows.push("");

  // Report the diff table via the workflow job summary (rendered on the run page).
  // This needs no `pull-requests: write`, so it works under the read-only token
  // that fork PRs receive.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${rows.join("\n")}\n`);
  }

  // Surface a yellow warning annotation in the Checks tab when PDFs changed,
  // without failing the job (PDF changes are usually intentional).
  if (diffFound) {
    core.warning(
      "PDF output changed — see the job summary for the diff table and download link.",
    );
  }

  core.setOutput("diff_found", diffFound ? "1" : "0");
};
