'use strict';

module.exports = {
  packageJson: (wixConfig = {}, dependencies = {}) => `{\n
    "name": "a",\n
    "version": "1.0.4",\n
    "wix": ${JSON.stringify(wixConfig)},
    "scripts": {
      "build": "echo npm-run-build"
    },
    "dependencies": ${JSON.stringify(dependencies)}
  }`,
  pkgJsonWithBuild: () => `{
    "name": "b",\n
    "version": "1.1.0",\n
    "scripts": {
      "build": "wix-node-build build"
    }
  }`,
  css: () => '.a {\ncolor: red;\n}\n',
  scss: () => '.a {\n.b {\ncolor: red;\n}\n}\n',
  scssInvalid: () => '.a {\n.b\ncolor: red;\n}\n}\n',
  tsconfig: () => `
    {
      "compilerOptions": {
        "module": "commonjs",
        "target": "es5",
        "moduleResolution": "node",
        "sourceMap": true,
        "outDir": "dist",
        "declaration": true,
        "noImplicitAny": false
      },
      "exclude": [
        "node_modules",
        "dist"
      ]
    }`,
  tslint: () => `
    {
      "rules": {
        "radix": true
      }
    }`,
  eslintrc: () => `
    {
      "rules": {
        "radix": "error"
      }
    }`,
  protractorConf: framework => `
    const http = require("http");

    exports.config = {
      specs: ["dist/test/**/*.e2e.js"],
      framework: "${framework || 'jasmine'}",
      onPrepare: () => {
        const server = http.createServer((req, res) => {
          const response = "<html><body><script src=http://localhost:6452/app.bundle.js></script></body></html>";
          res.end(response);
        });

        return server.listen(1337);
      }
    };
  `,
  e2eTestJasmine: () => `
    it("should write some text to body", () => {
      browser.ignoreSynchronization = true;
      browser.get("http://localhost:1337");
      expect(element(by.css("body")).getText()).toEqual("Hello Kitty");
    });
  `,
  e2eTestJasmineES6Imports: () => `
    import path from 'path';

    it("should write some text to body", () => {
      browser.ignoreSynchronization = true;
      browser.get("http://localhost:1337");
      expect(element(by.css("body")).getText()).toEqual("Hello Kitty");
    });
  `,
  e2eTestMocha: () => `
    function equals(a, b) {
      if (a !== b) {
        throw new Error(a + " is not equal to " + b);
      }
    }

    it("should write some text to body", () => {
      browser.ignoreSynchronization = true;
      browser.get("http://localhost:1337");
      element(by.css("body")).getText().then(function (text) {
        equals(text, "Hello Kitty");
      });
    });
  `,
  e2eClient: () => `document.body.innerHTML = "Hello Kitty";`,
  pom: () => `
    <?xml version="1.0" encoding="UTF-8"?>
    <project>
        <build>
            <plugins>
                <plugin>
                    <configuration>
                        <descriptors>
                            <descriptor>maven/assembly/tar.gz.xml</descriptor>
                        </descriptors>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </project>
  `,
  httpServer: (message, port) => `
    'use strict';

    const http = require('http');

    const hostname = 'localhost';
    const port = ${port || 6666};
    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('${message}');
    });

    server.listen(port, hostname, () => {
      console.log('Running a server...');
    });
  `
};
