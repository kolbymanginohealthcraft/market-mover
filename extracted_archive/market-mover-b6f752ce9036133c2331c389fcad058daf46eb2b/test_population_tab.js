// Simple test to verify Population tab integration
console.log('🧪 Testing Population Tab Integration...\n');

// Test 1: Check if all required files exist
import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'src/pages/Private/PopulationTab.jsx',
  'src/pages/Private/PopulationTab.module.css',
  'src/hooks/useCensusData.js',
  'src/components/CensusDataPanel.jsx',
  'src/components/CensusDataPanel.module.css'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Check if Population tab is added to navigation
const subNavbarPath = 'src/components/Navigation/SubNavbar.jsx';
const subNavbarContent = fs.readFileSync(subNavbarPath, 'utf8');
const hasPopulationTab = subNavbarContent.includes('population');

console.log(`\n🧭 Navigation check:`);
console.log(`   ${hasPopulationTab ? '✅' : '❌'} Population tab added to SubNavbar`);

// Test 3: Check if route is added to ProviderDetail
const providerDetailPath = 'src/pages/Private/ProviderDetail.jsx';
const providerDetailContent = fs.readFileSync(providerDetailPath, 'utf8');
const hasPopulationImport = providerDetailContent.includes('import PopulationTab');
const hasPopulationRoute = providerDetailContent.includes('path="population"');

console.log(`\n🛣️  Routing check:`);
console.log(`   ${hasPopulationImport ? '✅' : '❌'} PopulationTab imported`);
console.log(`   ${hasPopulationRoute ? '✅' : '❌'} Population route added`);

// Test 4: Check API endpoint
const censusRoutePath = 'server/routes/censusData.js';
const censusRouteExists = fs.existsSync(censusRoutePath);

console.log(`\n🔌 API check:`);
console.log(`   ${censusRouteExists ? '✅' : '❌'} Census data API route exists`);

console.log('\n🎉 Population Tab Integration Test Complete!');
console.log('\n📝 Next steps:');
console.log('   1. Start the development server: npm run dev');
console.log('   2. Navigate to a provider detail page');
console.log('   3. Click on the "Population" tab');
console.log('   4. Test county and tract level data'); 