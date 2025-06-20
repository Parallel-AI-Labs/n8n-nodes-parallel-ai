/**
 * Test script for the EmployeeChat node
 * 
 * This script mocks the node execution to verify that the settings 
 * are being properly collected and formatted.
 */

// Mock execute function context
const mockExecuteFunctions = {
    getCredentials: async () => ({
        apiKey: 'test-api-key',
        baseUrl: 'https://example.com'
    }),
    getNodeParameter: (paramName, itemIndex) => {
        // Return mock values for each parameter
        const mockParams = {
            employeeId: 'emp-123',
            message: 'Test message',
            model: 'gpt-4',
            documents: true,
            searchEngine: true,
            websites: true,
            news: false,
            imageAnalysis: true,
            shortTermMemories: true,
            longTermMemories: true,
            memoryScope: 'chat',
            company: true,
            employee: true,
            strategy: 'chain',
            temperature: 0.7
        };
        return mockParams[paramName];
    },
    helpers: {
        request: async (options) => {
            // Log the request for inspection
            console.log('API Request:');
            console.log('- URL:', options.uri);
            console.log('- Method:', options.method);
            console.log('- Headers:', JSON.stringify(options.headers, null, 2));
            console.log('- Body:', JSON.stringify(options.body, null, 2));
            
            // Return a mock response
            return {
                result: 'This is a simulated response from the employee chat'
            };
        },
        returnJsonArray: (data) => data
    }
};

// Import the node class (adjust the path if needed)
const { EmployeeChat } = require('./dist/nodes/EmployeeChat.node');

// Create an instance of the node
const nodeInstance = new EmployeeChat();

// Execute the node with our mock context
async function testNode() {
    try {
        console.log('Testing EmployeeChat node...');
        const result = await nodeInstance.execute.call(mockExecuteFunctions);
        console.log('\nNode Execution Result:');
        console.log(JSON.stringify(result, null, 2));
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error executing node:', error);
    }
}

// Run the test
testNode();