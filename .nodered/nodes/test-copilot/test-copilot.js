console.log("🧪 TEST COPILOT: Plugin is loading...");

module.exports = function(RED) {
    console.log("🧪 TEST COPILOT: Plugin loaded successfully!");
    
    // Простейший узел
    function TestCopilotNode(config) {
        RED.nodes.createNode(this, config);
        console.log("🧪 TEST COPILOT: Node instance created");
    }
    
    RED.nodes.registerType("test-copilot", TestCopilotNode);
    
    // Простейший API endpoint
    RED.httpAdmin.get('/test-copilot', function(req, res) {
        res.json({message: "Test Copilot works!", timestamp: new Date().toISOString()});
    });
};
