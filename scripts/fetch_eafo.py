"""Download the EAFO (European Alternative Fuels Observatory) CSV files used by the site.

Run from the repository root:  python scripts/fetch_eafo.py
Standard library only, so it runs as is in GitHub Actions.
"""
import csv
import io
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BASE = "https://alternative-fuels-observatory.ec.europa.eu/sites/default/files/csv/france/"
FILES = ["new_registrations_m1.csv", "market_share_new_registrations_m1.csv"]
EXPECTED_COLUMNS = {"YEAR", "BEV", "PHEV"}


def download(name: str) -> str:
    req = urllib.request.Request(BASE + name, headers={"User-Agent": "Mozilla/5.0 (transport-indicators data refresh)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def validate(name: str, text: str) -> None:
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or not EXPECTED_COLUMNS.issubset(rows[0].keys()):
        raise ValueError(f"{name}: unexpected format (columns: {list(rows[0].keys()) if rows else 'none'})")
    years = [int(r["YEAR"]) for r in rows]
    if max(years) < 2024:
        raise ValueError(f"{name}: latest year is {max(years)}, file looks stale or truncated")


def main() -> int:
    DATA.mkdir(exist_ok=True)
    changed = []
    for name in FILES:
        text = download(name).replace("\r\n", "\n")
        validate(name, text)
        path = DATA / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(name)

    meta_path = DATA / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    meta["checked_at"] = now
    if changed or "updated_at" not in meta:
        meta["updated_at"] = now
    meta["source"] = BASE
    meta_path.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8", newline="\n")

    print("changed:", ", ".join(changed) if changed else "nothing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
