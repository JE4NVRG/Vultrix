from pathlib import Path

root = Path(r"c:/Users/x/Documents/Vultrix3D")
page_path = root / "app" / "dashboard" / "filamentos" / "page.tsx"
head_path = root / "tmp_filamentos_head.tsx"

page_text = page_path.read_text(encoding="utf-8")
marker = "  const handleOpenModal"
idx = page_text.find(marker)
if idx == -1:
  raise SystemExit("marker not found in page.tsx")

tail = page_text[idx:]
head_text = head_path.read_text(encoding="utf-8")
page_path.write_text(head_text + tail, encoding="utf-8")
