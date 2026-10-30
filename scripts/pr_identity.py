import re

CONSENT = (
    "I understand that my full name and matriculation number will be publicly "
    "visible, and I am submitting my own details."
)
PLACEHOLDERS = {"your full name", "your name", "full name", "name", "n/a", "na", "none", "null", "todo", "tbd", "pending"}


def validate(body):
    if not isinstance(body, str):
        body = ""
    body = re.sub(r"<!--[\s\S]*?(?:-->|$)", "", body)
    visible = []
    fence = None
    for line in body.splitlines():
        marker = re.match(r"^\s*(`{3,}|~{3,})", line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
        elif fence is None:
            visible.append(line)
    body = "\n".join(visible)
    errors = []
    values = {}
    for label in ("Full name", "Matriculation number"):
        matches = re.findall(r"^" + re.escape(label) + r":[ \t]*(.*)$", body, re.MULTILINE | re.IGNORECASE)
        if not matches or not matches[0].strip():
            errors.append(f"{label} is required.")
        elif len(matches) != 1:
            errors.append(f"{label} must appear exactly once.")
        else:
            values[label] = matches[0].strip()
    name = values.get("Full name")
    if name and (name.casefold() in PLACEHOLDERS or not 2 <= len(name) <= 150 or sum(c.isalpha() for c in name) < 2 or any(c in name for c in "<>[]`")):
        errors.append("Full name must be completed, not a placeholder.")
    matric = values.get("Matriculation number")
    # This is a presence/shape check, not an official NTU identity lookup.
    if matric and (not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]{4,29}", matric) or not any(c.isdigit() for c in matric)):
        errors.append("Matriculation number must be a completed 5-30 character identifier containing a digit.")
    if not re.search(r"^- \[[xX]\] " + re.escape(CONSENT) + r"[ \t]*$", body, re.MULTILINE):
        errors.append("Public identity disclosure consent must be checked.")
    return errors
