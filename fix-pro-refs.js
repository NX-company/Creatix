const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/admin/users/page.tsx',
  'app/payment-success/page.tsx',
  'app/api/payments/create-payment/route.ts',
  'app/api/payments/webhook/route.ts',
  'app/api/payments/complete-payment/route.ts',
  'app/api/user/upgrade-mode/route.ts',
  'app/admin/tokens/page.tsx',
  'components/UpgradeModal.tsx',
  'components/GenerationLimitModal.tsx',
  'lib/testing/scenarios.ts',
  'lib/testing/comprehensive-scenarios.ts',
  'lib/config/modes.ts',
  'lib/agents/orchestrator.ts',
  'scripts/fix-admin-role.ts',
];

let totalFixed = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} - file not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content
    .replace(/'PRO'/g, "'ADVANCED'")
    .replace(/"PRO"/g, '"ADVANCED"');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed ${file}`);
    totalFixed++;
  } else {
    console.log(`ℹ️  No changes needed in ${file}`);
  }
});

console.log(`\n🎉 Done! Fixed ${totalFixed} files.`);
