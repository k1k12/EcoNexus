# Testing Summary

This folder contains documentation for our tests, covering:
- Unit tests via `pytest`
- Integration tests via shell scipt
- Stress testing via `locust`
- Security scan via `bandit`

---

## How to Run Tests

First, run the server with:
 ```bash
make run
```

Then:

### 1. Run all unit tests
```bash
make test
```

### 2. Run stress tests
```bash
make stress
```

### 3. Run security scan
```bash
make bandit
```

TBR!
