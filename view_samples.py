"""Quick sample viewer for extracted content."""
import re
content = open(r"C:\Users\zoufe\WorkBuddy\2026-09-05-09-15-05\bandit-catalogs\extracted-text.md", encoding='utf-8').read()

# 找每个 PDF 的前 3 页
sections = re.split(r'\n## 📄 ', content)
print(f"Total sections: {len(sections)-1}")

for s in sections[1:7]:
    fname = s.split('\n')[0].strip().rstrip(')')
    # 找 Page 1
    pages = re.findall(r'### Page (\d+)\n\n```\n(.*?)\n```', s, re.S)
    print('=' * 70)
    print(f'PDF: {fname}')
    print(f'Pages: {len(pages)}')
    for n, txt in pages[:2]:
        print(f'  --- Page {n} ({len(txt)} chars) ---')
        # 显示前 600 字
        print(txt[:600].replace('\n', ' '))
        print()

# 也试试看完整 2020 主目录某段
print('=' * 70)
print('Looking for product specs in 2020 catalog...')
catalog = sections[1] if len(sections) > 1 else ""
# Find "Giant Band"
for keyword in ['Giant Band', 'Ear-Lokt', 'VALU-STRAP', 'Scru-Lokt', 'J02069', 'C00169', 'C00369', 'C07569']:
    matches = [i for i, m in enumerate(re.finditer(keyword, catalog))]
    print(f'{keyword:20} occurrences: {len(matches)}')
