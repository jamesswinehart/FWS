/**
 * Quick verification script to demonstrate treatment group assignment
 * Run with: node verify-assignment.js
 */

function assignTreatmentGroup(netId) {
  const normalized = netId.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 2 === 0 ? 'treatment' : 'control';
}

// Test with sample NetIDs
const testNetIds = [
  'jsmith', 'JSMITH', 'JSmith',  // Same NetID, different cases
  'bdoe', 'BDOE', 'Bdoe',
  'mjones', 'testuser', 'admin',
  'user1', 'user2', 'user3', 'user4', 'user5',
  'student1', 'student2', 'student3',
];

console.log('Treatment Group Assignment Verification\n');
console.log('='.repeat(60));

let treatmentCount = 0;
let controlCount = 0;

testNetIds.forEach(netId => {
  const assignment = assignTreatmentGroup(netId);
  if (assignment === 'treatment') {
    treatmentCount++;
  } else {
    controlCount++;
  }
  console.log(`${netId.padEnd(20)} → ${assignment}`);
});

console.log('='.repeat(60));
console.log(`\nTotal: ${testNetIds.length} NetIDs`);
console.log(`Treatment: ${treatmentCount} (${(treatmentCount/testNetIds.length*100).toFixed(1)}%)`);
console.log(`Control: ${controlCount} (${(controlCount/testNetIds.length*100).toFixed(1)}%)`);

// Verify consistency
console.log('\n' + '='.repeat(60));
console.log('Consistency Check (same NetID, different cases):');
const consistencyTests = [
  ['jsmith', 'JSMITH', 'JSmith'],
  ['bdoe', 'BDOE', 'Bdoe'],
];

consistencyTests.forEach(([netId1, netId2, netId3]) => {
  const a1 = assignTreatmentGroup(netId1);
  const a2 = assignTreatmentGroup(netId2);
  const a3 = assignTreatmentGroup(netId3);
  const consistent = a1 === a2 && a2 === a3;
  console.log(`${netId1} / ${netId2} / ${netId3}: ${a1} / ${a2} / ${a3} ${consistent ? '✓' : '✗'}`);
});

