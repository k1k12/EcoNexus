# Security Static Analysis: Bandit Integration

As part of our security testing strategy, we integrated **Bandit** (v1.8.3) to perform static code analysis on the backend Python codebase. This ensures early detection of potentially insecure coding patterns before deployment.

## How Bandit Is Used

- We run Bandit recursively over the backend directory using the following command: `make secure`
- `make secure` calls -> `bandit -r . --exclude ./tests,./venv -f html -o bandit bandit_report.html && open bandit/bandit_report.html`

## Explanation:

- `-r .` scans all Python files recursively from the current directory (backend).

- `--exclude ./tests,./venv` ensures that unit tests and the virtual environment are excluded. This avoids false positives (e.g. hardcoded passwords in test mocks or assert warnings).

- `-f html` produces a human readable report.

- `-o bandit/bandit_report.html` saves the output to a report in the bandit/ directory.

- `open bandit/bandit_report.html` opens the readable HTML, verifying our project has no security issues flagged with bandit.

## Report

- Lines of Code Scanned: ~2010 (after exclusions)

- Lines Skipped via #nosec: 0

- Severity Distribution: All issues are low severity.

- Confidence Ratings Meanings:

`High: Strong evidence of an issue (e.g., assert usage in test files).`

`Medium: Likely an issue, but may require additional context (e.g., hardcoded secrets in test fixtures).`

`Low: Bandit is uncertain whether the issue is genuinely a risk. It’s flagged as a precaution but may not need action (e.g., use of dynamic attributes or less common patterns that might be safe in your context).`

- To confirm -> **our project has zero confidence flags**.

## Testing Scope Justification

This setup aligns with our testing goals described in Section 8 – Testing of the Technical Design Document. By excluding test files and virtual environments:

- We ensure the analysis focuses on production code.

- We avoid noise from intentional test patterns or dependencies beyond our control.

- We maintain a clean and meaningful security audit trail for examiners.