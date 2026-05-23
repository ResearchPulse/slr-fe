const fs = require('fs');
const path = require('path');

const files = [
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
];

const replacements = [
    { old: /\[#FDFCF9\]/g, new: 'surface-white' },
    { old: /\[#F4F0E8\]/g, new: 'bg-primary' },
    { old: /\[#ECE8E1\]/g, new: 'bg-secondary' },
    { old: /\[#111111\]/g, new: 'text-primary' },
    { old: /\[#5C5C5C\]/g, new: 'text-secondary' },
    { old: /\[#5B0000\]/g, new: 'accent' },
    { old: /\[#D8D2C8\]/g, new: 'border' }
];

for (const fpath of files) {
    try {
        if (!fs.existsSync(fpath)) {
            console.log(`Skipping ${fpath} (not found)`);
            continue;
        }
        
        let content = fs.readFileSync(fpath, 'utf8');
        let original = content;
        
        for (const { old: oldRegex, new: newStr } of replacements) {
            content = content.replace(oldRegex, newStr);
        }
        
        if (content !== original) {
            fs.writeFileSync(fpath, content, 'utf8');
            console.log(`Updated ${fpath}`);
        } else {
            console.log(`No changes for ${fpath}`);
        }
    } catch (e) {
        console.error(`Error processing ${fpath}:`, e);
    }
}
