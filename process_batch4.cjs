const fs = require('fs');
const path = require('path');

const dirs = [
    "src/pages/reviewProcess",
    "src/pages/manage-study-selection",
    "src/pages/checklist",
    "src/components/reviewProcess",
    "src/components/paperPool",
    "src/components/identification",
    "src/components/checklist",
    "src/components/shared/paper"
];

const replacements = [
    { old: /\[#FDFCF9\]/g, new: 'surface-white' },
    { old: /\[#F4F0E8\]/g, new: 'bg-primary' },
    { old: /\[#ECE8E1\]/g, new: 'bg-secondary' },
    { old: /\[#111111\]/g, new: 'text-primary' },
    { old: /\[#5C5C5C\]/g, new: 'text-secondary' },
    { old: /\[#5B0000\]/g, new: 'accent' },
    { old: /\[#D8D2C8\]/g, new: 'border' },
    
    // Convert common tailwind gray colors to tokens (except rounded/shadow)
    { old: /\bbg-white\b/g, new: 'bg-surface-white' },
    { old: /\bbg-gray-50\b/g, new: 'bg-bg-primary' },
    { old: /\bbg-gray-100\b/g, new: 'bg-bg-secondary' },
    { old: /\bbg-gray-200\b/g, new: 'bg-bg-secondary' },
    { old: /\bbg-slate-50\b/g, new: 'bg-bg-secondary' },
    { old: /\bbg-slate-100\b/g, new: 'bg-bg-secondary' },
    { old: /\bbg-slate-50\/50\b/g, new: 'bg-bg-secondary' },
    { old: /\bborder-gray-100\b/g, new: 'border-border' },
    { old: /\bborder-gray-200\b/g, new: 'border-border' },
    { old: /\bborder-gray-300\b/g, new: 'border-border' },
    { old: /\bborder-slate-200\b/g, new: 'border-border' },
    { old: /\bborder-slate-100\b/g, new: 'border-border' },
    { old: /\bborder-gray-50\b/g, new: 'border-border' },
    { old: /\btext-gray-900\b/g, new: 'text-text-primary' },
    { old: /\btext-gray-800\b/g, new: 'text-text-primary' },
    { old: /\btext-gray-700\b/g, new: 'text-text-primary' },
    { old: /\btext-gray-600\b/g, new: 'text-text-secondary' },
    { old: /\btext-gray-500\b/g, new: 'text-text-secondary' },
    { old: /\btext-gray-400\b/g, new: 'text-text-secondary' },
    { old: /\btext-slate-900\b/g, new: 'text-text-primary' },
    { old: /\btext-slate-700\b/g, new: 'text-text-primary' },
    { old: /\btext-slate-600\b/g, new: 'text-text-secondary' },
    { old: /\btext-slate-500\b/g, new: 'text-text-secondary' },
    { old: /\btext-slate-400\b/g, new: 'text-text-secondary' },
    
    // Convert primary blue/indigo to accent where appropriate
    { old: /\bbg-indigo-600\b/g, new: 'bg-accent' },
    { old: /\bbg-indigo-500\b/g, new: 'bg-accent' },
    { old: /\btext-indigo-600\b/g, new: 'text-accent' },
    { old: /\btext-indigo-500\b/g, new: 'text-accent' },
    
    // Radii (avoid rounded-full)
    { old: /\brounded-xl\b/g, new: 'rounded-[4px]' },
    { old: /\brounded-lg\b/g, new: 'rounded-[4px]' },
    { old: /\brounded-2xl\b/g, new: 'rounded-[4px]' },
    { old: /\brounded-3xl\b/g, new: 'rounded-[4px]' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            for (const { old: oldRegex, new: newStr } of replacements) {
                content = content.replace(oldRegex, newStr);
            }
            
            // Remove shadows except for Modals and Dropdowns and Dialogs
            if (!fullPath.includes('Modal') && !fullPath.includes('Dropdown') && !fullPath.includes('Dialog') && !fullPath.includes('Drawer')) {
                 content = content.replace(/\bshadow-sm\b/g, 'shadow-none');
                 content = content.replace(/\bshadow-md\b/g, 'shadow-none');
                 content = content.replace(/\bshadow-lg\b/g, 'shadow-none');
                 content = content.replace(/\bshadow-xl\b/g, 'shadow-none');
                 content = content.replace(/\bshadow\b(?!\-)/g, 'shadow-none');
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

for (const dir of dirs) {
    if (fs.existsSync(dir)) {
        processDirectory(dir);
    } else {
        console.log(`Directory not found: ${dir}`);
    }
}
