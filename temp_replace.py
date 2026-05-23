import sys
import re
import os

files = [
    "src/components/layout/Header.tsx",
    "src/components/ui/Sidebar.tsx",
    "src/components/ui/Table.tsx",
    "src/components/ui/Tabs.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Dropdown.tsx",
    "src/components/ui/Pagination.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Textarea.tsx",
    "src/components/ui/Select.tsx",
    "src/components/ui/Checkbox.tsx",
    "src/components/ui/Switch.tsx",
    "src/components/shared/paper/PaperViewer/components/StatusBadge.tsx"
]

replacements = [
    (r'\[#FDFCF9\]', 'surface-white'),
    (r'\[#F4F0E8\]', 'bg-primary'),
    (r'\[#ECE8E1\]', 'bg-secondary'),
    (r'\[#111111\]', 'text-primary'),
    (r'\[#5C5C5C\]', 'text-secondary'),
    (r'\[#5B0000\]', 'accent'),
    (r'\[#D8D2C8\]', 'border')
]

for fpath in files:
    try:
        if not os.path.exists(fpath):
            print(f"Skipping {fpath} (not found)")
            continue
            
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        original = content
        for old, new in replacements:
            content = re.sub(old, new, content)
            
        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {fpath}")
        else:
            print(f"No changes for {fpath}")
    except Exception as e:
        print(f"Error processing {fpath}: {e}")
