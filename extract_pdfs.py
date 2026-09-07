"""Extract text from all Band-It PDFs into a single Markdown file."""
import sys
import warnings
warnings.filterwarnings("ignore")

import pdfplumber
from pathlib import Path

BASE = Path(r"C:\Users\zoufe\WorkBuddy\2026-09-05-09-15-05\bandit-catalogs")
OUT = BASE / "extracted-text.md"

OUT_TXT = OUT.write_text("", encoding="utf-8")
print(f"Output file: {OUT}")

# PDFs to process in priority order (most important first)
PRIORITY = [
    "2020-product-solutions-guide.pdf",     # Big main catalog
    "metals-data-2022.pdf",                  # Material grades
    "bandit-applications.pdf",               # Use cases
    "bandit-201-brochure.pdf",
    "bandit-316-brochure.pdf",
    "product-list-and-tool-manuals.pdf",
    "tools-instructions-2024.pdf",
    "tools.pdf",
    "valustrap.pdf",
    "giant-band.pdf",
    "scrulokt.pdf",
    "bandfast.pdf",
    "hose-clamp-april-2024.pdf",
    "certificates.pdf",
]

with OUT.open("w", encoding="utf-8") as f:
    f.write("# Band-It 资料库 - 提取文字版\n\n")
    f.write("**下载源**：band-it-australia.com.au（Band-It IDEX 授权分销商）\n\n")
    f.write("**用途**：作为你写网页的参考素材库。这些是 Band-It 官方资料，可以参考产品规格与英文表述，\n")
    f.write("但是**严禁直接复制粘贴到你自己网站**——直接复制会让你的页面被认为是爬虫低质页面。\n")
    f.write("正确做法：使用这些理解参数，但是用你团队的口吻重新描述。\n\n")
    f.write("---\n\n")

    for fname in PRIORITY:
        path = BASE / fname
        if not path.exists():
            continue
        size_kb = path.stat().st_size // 1024
        f.write(f"\n\n## 📄 {fname}  ({size_kb} KB)\n\n")

        try:
            with pdfplumber.open(path) as pdf:
                for i, page in enumerate(pdf.pages, 1):
                    f.write(f"### Page {i}\n\n")
                    text = page.extract_text() or ""
                    if text.strip():
                        f.write("```\n")
                        f.write(text)
                        f.write("\n```\n\n")
        except Exception as e:
            f.write(f"_Error: {e}_\n\n")
        print(f"Processed: {fname}")

print(f"\nDone! Output: {OUT}")
print(f"Size: {OUT.stat().st_size:,} bytes")
