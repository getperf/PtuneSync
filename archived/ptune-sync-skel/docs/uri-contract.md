# Ptune Sync URI Contract

## 1. URI Format

```

ptune-sync://<command>/<subcommand>?param=value

```

---

## 2. Examples

### launch

```

ptune-sync://launch?home=/workspace

```

### auth status

```

ptune-sync://auth/status?home=/workspace

```

### auth login

```

ptune-sync://auth/login?home=/workspace

```

### diff

```

ptune-sync://diff?home=/workspace&input=tasks.json&list=_Today

```

---

## 3. URI → CLI Mapping

| URI | CLI |
|----|----|
| launch | ptune-sync launch |
| auth/status | ptune-sync auth status |
| auth/login | ptune-sync auth login |
| diff | ptune-sync diff --input |
| push | ptune-sync push --input |

---

## 4. Result Handling

URI execution typically writes result JSON to:

```

<workspace>/status.json

```

Clients SHOULD read the result file after command execution.
