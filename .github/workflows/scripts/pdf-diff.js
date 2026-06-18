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
  // PDFs that changed (diff/added/removed), used to annotate their source templates
  const changedFiles = [];

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
    if (status !== statusLabels.identical) {
      changedFiles.push({ relativePath, status });
    }
  }

  rows.push("");

  // Report the diff table via the workflow job summary (rendered on the run page).
  // This needs no `pull-requests: write`, so it works under the read-only token
  // that fork PRs receive.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${rows.join("\n")}\n`);
  }

  // Surface a yellow warning annotation for every changed PDF, attached to the
  // typst template that produces it, so the warning shows up on the relevant file
  // in the PR's "Files changed" tab (and the Checks tab). A generated PDF
  // `<model>.pdf` is rendered from `backend/templates/<model>.typ` (see
  // backend/src/bin/gen-pdf.rs). Annotations need no `pull-requests: write`, so
  // this works under the read-only token that fork PRs receive.
  for (const { relativePath, status } of changedFiles) {
    const template = path.join(
      "backend",
      "templates",
      `${relativePath.replace(/\.pdf$/i, "")}.typ`,
    );
    const annotation = { title: "PDF output changed" };
    if (fs.existsSync(template)) {
      annotation.file = template;
    }
    core.warning(
      `${relativePath}: ${status} — see the job summary for the visual diff.`,
      annotation,
    );
  }

  core.setOutput("diff_found", diffFound ? "1" : "0");
};
