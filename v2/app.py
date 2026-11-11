from flask import Flask, render_template, request, jsonify
import sqlite3, os, math
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB = BASE / "bunked.db"
app = Flask(__name__)

def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS subjects(
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        held INTEGER NOT NULL DEFAULT 0, attended INTEGER NOT NULL DEFAULT 0,
        target REAL NOT NULL DEFAULT 75, color TEXT NOT NULL DEFAULT '#2F6BFF'
    )""")
    con.execute("""CREATE TABLE IF NOT EXISTS sessions(
        id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER NOT NULL,
        attended INTEGER NOT NULL, note TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )""")
    con.commit()
    return con

def calculate(held, attended, target=75):
    if not isinstance(held, int) or not isinstance(attended, int) or held < 0 or attended < 0 or attended > held:
        raise ValueError("Use whole numbers, with attended between zero and held.")
    if not (0 < float(target) < 100):
        raise ValueError("Target must be above 0 and below 100.")
    if held == 0:
        return {"percentage": None, "missed": 0, "skips": 0, "recovery": 0, "after": None, "status": "not-started"}
    pct = attended / held * 100
    ratio = float(target) / 100
    skips = max(0, math.floor((attended - ratio * held) / ratio + 1e-10))
    recovery = max(0, math.ceil((ratio * held - attended) / (1-ratio) - 1e-10)) if pct < target else 0
    after = attended / (held + skips) * 100 if skips else pct
    return {"percentage": round(pct, 2), "missed": held-attended, "skips": skips,
            "recovery": recovery, "after": round(after, 2), "status": "safe" if pct >= target else "recover"}

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/subjects")
def get_subjects():
    con = db()
    rows = con.execute("SELECT * FROM subjects ORDER BY id").fetchall()
    out = []
    for row in rows:
        item = dict(row)
        item["stats"] = calculate(row["held"], row["attended"], row["target"])
        out.append(item)
    con.close()
    return jsonify(out)

@app.post("/api/subjects")
def add_subject():
    data = request.get_json(force=True)
    name = str(data.get("name", "New subject")).strip()[:48] or "New subject"
    held = int(data.get("held", 0))
    attended = int(data.get("attended", 0))
    target = float(data.get("target", 75))
    color = str(data.get("color", "#2F6BFF"))[:20]
    calculate(held, attended, target)
    con = db()
    cur = con.execute("INSERT INTO subjects(name,held,attended,target,color) VALUES(?,?,?,?,?)",
                      (name, held, attended, target, color))
    con.commit()
    sid = cur.lastrowid
    con.close()
    return jsonify({"id": sid}), 201

@app.patch("/api/subjects/<int:sid>")
def update_subject(sid):
    data = request.get_json(force=True)
    con = db()
    row = con.execute("SELECT * FROM subjects WHERE id=?", (sid,)).fetchone()
    if not row:
        con.close()
        return jsonify(error="Subject not found"), 404
    held = int(data.get("held", row["held"]))
    attended = int(data.get("attended", row["attended"]))
    target = float(data.get("target", row["target"]))
    calculate(held, attended, target)
    name = str(data.get("name", row["name"])).strip()[:48] or row["name"]
    con.execute("UPDATE subjects SET name=?,held=?,attended=?,target=?,color=? WHERE id=?",
                (name, held, attended, target, data.get("color", row["color"]), sid))
    con.commit()
    stats = calculate(held, attended, target)
    con.close()
    return jsonify({"id": sid, "name": name, "held": held, "attended": attended, "target": target, "stats": stats})

@app.post("/api/subjects/<int:sid>/session")
def log_session(sid):
    data = request.get_json(force=True)
    was_present = bool(data.get("attended", True))
    note = str(data.get("note", ""))[:120]
    con = db()
    row = con.execute("SELECT * FROM subjects WHERE id=?", (sid,)).fetchone()
    if not row:
        con.close()
        return jsonify(error="Subject not found"), 404
    held = row["held"] + 1
    attended = row["attended"] + (1 if was_present else 0)
    con.execute("UPDATE subjects SET held=?,attended=? WHERE id=?", (held, attended, sid))
    con.execute("INSERT INTO sessions(subject_id,attended,note) VALUES(?,?,?)",
                (sid, int(was_present), note))
    con.commit()
    stats = calculate(held, attended, row["target"])
    con.close()
    return jsonify({"held": held, "attended": attended, "stats": stats})

@app.delete("/api/subjects/<int:sid>")
def delete_subject(sid):
    con = db()
    con.execute("DELETE FROM sessions WHERE subject_id=?", (sid,))
    cur = con.execute("DELETE FROM subjects WHERE id=?", (sid,))
    con.commit()
    con.close()
    return ("", 204) if cur.rowcount else (jsonify(error="Not found"), 404)

@app.get("/api/subjects/<int:sid>/history")
def history(sid):
    con = db()
    rows = con.execute(
        "SELECT id,attended,note,created_at FROM sessions WHERE subject_id=? ORDER BY id DESC LIMIT 30",
        (sid,)
    ).fetchall()
    con.close()
    return jsonify([dict(row) for row in rows])

@app.post("/api/calculate")
def calculate_api():
    data = request.get_json(force=True)
    try:
        result = calculate(int(data["held"]), int(data["attended"]), float(data.get("target", 75)))
        return jsonify(result)
    except (ValueError, KeyError, TypeError) as error:
        return jsonify(error=str(error)), 400

if __name__ == "__main__":
    db()
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=True)
