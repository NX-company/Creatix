import os
import re

files_to_fix = [
    r'c:\Projects\Creatix\app\admin\users\page.tsx',
    r'c:\Projects\Creatix\app\payment-success\page.tsx',
    r'c:\Projects\Creatix\app\api\payments\create-payment\route.ts',
    r'c:\Projects\Creatix\app\api\payments\webhook\route.ts',
    r'c:\Projects\Creatix\app\api\payments\complete-payment\route.ts',
    r'c:\Projects\Creatix\app\api\user\upgrade-mode\route.ts',
    r'c:\Projects\Creatix\app\admin\tokens\page.tsx',
    r'c:\Projects\Creatix\components\UpgradeModal.tsx',
    r'c:\Projects\Creatix\components\GenerationLimitModal.tsx',
    r'c:\Projects\Creatix\lib\testing\scenarios.ts',
    r'c:\Projects\Creatix\lib\testing\comprehensive-scenarios.ts',
    r'c:\Projects\Creatix\lib\config\modes.ts',
    r'c:\Projects\Creatix\lib\agents\orchestrator.ts',
    r'c:\Projects\Creatix\scripts\fix-admin-role.ts',
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"⚠️ Skipping {file_path} - file not found")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    content = content.replace("'PRO'", "'ADVANCED'")
    content = content.replace('"PRO"', '"ADVANCED"')

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed {file_path}")
    else:
        print(f"ℹ️  No changes needed in {file_path}")

print("\n🎉 All files processed!")
