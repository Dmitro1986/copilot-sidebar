module.exports = {
  flowFile: "flows.json",
  userDir: "./.nodered/",
  
  // Указываем и plugins, и nodes в userDir
  nodesDir: ['./plugins/', './.nodered/nodes/'],
  
  flowFilePretty: true,
  uiPort: process.env.PORT || 1887,
  
  logging: {
    console: {
      level: "info",
      metrics: false,
      audit: false,
    },
  },
  credentialSecret: "my-secret-key",
  
  externalModules: {
    autoInstall: false,
    palette: {
      allowInstall: true,
      allowUpdate: true,
      allowUpload: true,
      allowList: ['*'],
      denyList: []
    }
  },
  
  editorTheme: {
    projects: { enabled: false },
    codeEditor: { lib: "monaco" }
  },

  markdownEditor: {
      mermaid: {
        /** enable or disable mermaid diagram in markdown document
         */
        enabled: true,
      },
  },

  functionExternalModules: true,
  functionTimeout: 0,
  debugMaxLength: 1000,
  mqttReconnectTime: 15000,
  serialReconnectTime: 15000
};
