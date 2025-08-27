#!/usr/bin/env python3
import pathlib


def main() -> None:
    out = pathlib.Path("dist/reports")
    out.mkdir(parents=True, exist_ok=True)
    (out / "example_report.json").write_text('{"status": "placeholder"}\n', encoding="utf-8")
    print(f"Exported reports to {out}")


if __name__ == "__main__":
    main()

