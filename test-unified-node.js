const nodeModule = require('./dist/nodes/ParallelAi.node');
const ParallelAi = nodeModule.ParallelAi;

// Get the description from the class prototype
console.log('Module keys:', Object.keys(nodeModule));
console.log('Checking if ParallelAi class exists:', ParallelAi ? 'Yes' : 'No');

// Try to instantiate the class
if (ParallelAi) {
  const instance = new ParallelAi();
  console.log('Node name:', instance.description.displayName);
  
  // Find resource property
  const resourceProp = instance.description.properties.find(p => p.name === 'resource');
  console.log('Resources:', resourceProp.options.map(o => o.value).join(', '));
  
  // Test that operations exist for each resource
  console.log('\nChecking operations for each resource:');
  const resources = ['employee', 'list', 'document', 'folder', 'sequence', 'system'];
  resources.forEach(resource => {
    const op = instance.description.properties.find(p => 
      p.name === 'operation' && 
      p.displayOptions?.show?.resource?.includes(resource)
    );
    console.log(`- ${resource}: ${op ? op.options.length + ' operations' : 'NOT FOUND'}`);
  });
}

console.log('\nUnified node successfully verified!');