/**
 * Test to verify treatment group assignment
 * - Ensures 50/50 split across multiple NetIDs
 * - Ensures same NetID always gets same assignment
 */

function assignTreatmentGroup(netId: string): 'treatment' | 'control' {
  // Normalize to lowercase for consistency (matches database storage)
  const normalized = netId.toLowerCase().trim();
  
  // Simple hash function: sum character codes
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Use hash to determine group (50/50 split)
  return Math.abs(hash) % 2 === 0 ? 'treatment' : 'control';
}

describe('Treatment Group Assignment', () => {
  test('same NetID always gets same assignment', () => {
    const testNetIds = ['jsmith', 'bdoe', 'mjones', 'testuser', 'admin'];
    
    for (const netId of testNetIds) {
      const assignment1 = assignTreatmentGroup(netId);
      const assignment2 = assignTreatmentGroup(netId);
      const assignment3 = assignTreatmentGroup(netId);
      
      expect(assignment1).toBe(assignment2);
      expect(assignment2).toBe(assignment3);
      expect(assignment1).toBe(assignment3);
    }
  });

  test('case-insensitive assignment (same NetID in different cases)', () => {
    const testCases = [
      ['jsmith', 'JSMITH', 'JSmith'],
      ['bdoe', 'BDOE', 'Bdoe'],
      ['testuser', 'TESTUSER', 'TestUser'],
    ];
    
    for (const [netId1, netId2, netId3] of testCases) {
      const assignment1 = assignTreatmentGroup(netId1);
      const assignment2 = assignTreatmentGroup(netId2);
      const assignment3 = assignTreatmentGroup(netId3);
      
      // All should get the same assignment regardless of case
      expect(assignment1).toBe(assignment2);
      expect(assignment2).toBe(assignment3);
      expect(assignment1).toBe(assignment3);
    }
  });

  test('approximately 50/50 split across many NetIDs', () => {
    // Generate a large set of test NetIDs
    const testNetIds: string[] = [];
    for (let i = 0; i < 1000; i++) {
      testNetIds.push(`user${i}`);
      testNetIds.push(`test${i}`);
      testNetIds.push(`netid${i}`);
    }
    
    let treatmentCount = 0;
    let controlCount = 0;
    
    for (const netId of testNetIds) {
      const assignment = assignTreatmentGroup(netId);
      if (assignment === 'treatment') {
        treatmentCount++;
      } else {
        controlCount++;
      }
    }
    
    const total = treatmentCount + controlCount;
    const treatmentPercent = (treatmentCount / total) * 100;
    const controlPercent = (controlCount / total) * 100;
    
    console.log(`Treatment: ${treatmentCount} (${treatmentPercent.toFixed(2)}%)`);
    console.log(`Control: ${controlCount} (${controlPercent.toFixed(2)}%)`);
    
    // Should be approximately 50/50 (within 5% tolerance)
    expect(treatmentPercent).toBeGreaterThan(45);
    expect(treatmentPercent).toBeLessThan(55);
    expect(controlPercent).toBeGreaterThan(45);
    expect(controlPercent).toBeLessThan(55);
  });

  test('hash function produces consistent results', () => {
    const testNetId = 'jsmith';
    const results: number[] = [];
    
    // Run hash calculation multiple times
    for (let i = 0; i < 100; i++) {
      let hash = 0;
      for (let j = 0; j < testNetId.length; j++) {
        hash = ((hash << 5) - hash) + testNetId.charCodeAt(j);
        hash = hash & hash;
      }
      results.push(Math.abs(hash) % 2);
    }
    
    // All results should be the same
    const firstResult = results[0];
    expect(results.every(r => r === firstResult)).toBe(true);
  });

  test('different NetIDs can get different assignments', () => {
    const testNetIds = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8'];
    const assignments = testNetIds.map(netId => assignTreatmentGroup(netId));
    
    // Should have at least one treatment and one control in this set
    const hasTreatment = assignments.includes('treatment');
    const hasControl = assignments.includes('control');
    
    expect(hasTreatment).toBe(true);
    expect(hasControl).toBe(true);
  });
});

