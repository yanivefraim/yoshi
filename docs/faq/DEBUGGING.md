### this is work in progress. Please note that this doc is not ready, yet!!!</dt>

# Table of contents

1. [Debug mocha tests (node-server/client)](#debug-mocha-tests)
  
  1. [VSCode](#1-vscode)

  2. [Webstorm](#2-webstorm)
  
  3. [Native node](#3-native-node---inspect)

  4. [WallabyJS](#4-wallabyjs)
  
    1. [Jetbrain](#jetbrains-webstormintellij)  
    
    2. [Atom](#atom)
    
    3. [VSCode](#vscode)
    
  5. [Node Inspector](#5-node-inspector)

2. [Debug node server](#debug-node-server)
  
  1.  [VSCode](#1-vscode-1)
  
  2.  [Jetbrain](#2-jetbrain)
  
  3.  [Native Chrome](#3-native-node)

3. [Debug Protractor](#debug-protractor-e2e-tests)

  1. [VSCode](#1-vscode-2)
  
  2. [Webstorm](#2-webstorm---tbd)
  
  3. [Native](#3-native-protractor-debugpause)

# Debug mocha tests

We have several ways to debug node:

## 1. VSCode

Vscode is a [great tool for debugging Node.js](https://code.visualstudio.com/docs/editor/debugging). All you have to do is generate a new project, press the debug icon on the left (or `cmd+shift+D`), then choose debug configurations (mocha tests: `Launch Mocha` or `Launch` from running server), and press F5. That's it:

  ![alt tag](/assets/vscode_debugger.png?raw=true)


You can add `debugger` to your code or just click on the side of the line you want to debug and add a breakpoint. 

See this short video for example (**press for HD video**):

[![ScreenShot](/assets/vscode-debug.gif?raw=true)](https://youtu.be/4ByxtO4nzWM)

https://youtu.be/4ByxtO4nzWM

**As for the time this doc is written there is a strange bug with adding breakpoints using IDE (that's the reason I added `debugger` statements everywhere. Hope to solve this soon)**

## 2. Webstorm

In order to debug using Webstorm, go to `run -> edit-configurations...`:

![alt tag](/assets/ws-edit-configurations.png?raw=true)

Press the '+' and choose 'mocha':

![alt tag](/assets/ws-choose-mocha.png?raw=true)

Update mocha configurations:

![alt tag](/assets/ws-mocha-config.png?raw=true)

 1. test directory: `{src,test}/**/*.spec.js`
 2. extra mocha options: `--require babel-register --require ./node_modules/wix-node-build/lib/ignore-extensions ./test/mocha-setup.js --no-timeouts`

And for the Typescript lovers:

![alt tag](/assets/ws-mocha-config-typescript.png?raw=true)

(extra mocha options: `--require ts-node/register --require ./node_modules/wix-node-build/lib/ignore-extensions ./test/mocha-setup.ts --no-timeouts`)


You can watch an example in the following video (**press for HD video**):

[![ScreenShot](/assets/ws-debug.gif?raw=true)](https://youtu.be/6l_0tAGXjRg)

https://youtu.be/6l_0tAGXjRg

## 3. Native via `node --inspect`

[Native --inspect flag](https://github.com/nodejs/node/pull/6792) is experimental and supported from node v6.3.1

Enables you to run node tests easily and much faster THEN `node-inspector`.

Debugging mocha tests:

```bash
node --debug-brk=41310 --inspect=9222 --nolazy --require babel-register --require ./node_modules/wix-node-build/lib/ignore-extensions node_modules/mocha/bin/_mocha {test,src}/**/*.spec.js --no-timeouts
```

You should see something like:

```bash
< Debugger listening on port 9222.
< Warning: This is an experimental feature and could change at any time.
< To start debugging, open the following URL in Chrome:
<     chrome-devtools://devtools/remote/serve_file/@521e5b7e2b7cc66b4006a8a54cb9c4e57494a5ef/inspector.html?experiments=true&v8only=true&ws=localhost:9222/node
connecting to 127.0.0.1:5858 ... ok
```

Open chrome and enter the `chrome-devtools` address from above

(`chrome-devtools://devtools/remote/serve_file/@62cd277117e6f8ec53e31b1be58290a6f7ab42ef/inspector.html?experiments=true&v8only=true&ws=localhost:9222/node`)

You should now have a fully functioning debugger for your node code / mocha node tests, see the follwong video:

https://youtu.be/lIVCa_0q2vM

**Please note that [native debugger does not support source maps](https://github.com/nodejs/node/issues/8369) (for now).

## 4. WallabyJS

Wallaby configuration file is a part of the generator. All you need is to install WallabyJS (a license is needed - please open a Jira ticket to IT for one. Don't forget to mention which IDE you are using) on your favorite IDE and launch it.

Look how cool it is:

![alt tag](/assets/atom_console.gif?raw=true)

![alt tag](/assets/atom_inline.gif?raw=true)

#### Jetbrains (Webstorm/Intellij)

* Download Wallaby from [here](https://wallabyjs.com/#download) and install it according to [the following instructions](https://wallabyjs.com/docs/intro/install.html#jetbrains-ides).

* Add the following configurations:

![alt tag](/assets/webstorm-add-wallaby-config.png?raw=true)

![alt tag](/assets/webstorm-wallaby-config.png?raw=true)

* Change the Node.js path to your local node. In nvm, path will look like `/Users/{yourUser}/.nvm/versions/node/v6.2.0/bin/node`

* Use the node version according to your project's `.nvmrc` file (and make sure it is installed). 

* Debugging - just press the run (`cmd + shift + R`) and choose wallaby configurations you just entered. 

* A full tutorial can be found [here](https://wallabyjs.com/docs/intro/get-started-jetbrains.html) - **no need for further configurations. There is already a Wallaby.js config file in your project with all your configurations**

#### Atom

* Just install wallaby (via `preferences -> install packages`)
* Run wallaby - `cmd + shift + P` -> Wallaby:start
* That's it!

You can find a complete tutorial [here](https://wallabyjs.com/docs/intro/get-started-atom.html)

#### VSCode

* Install using extention window:

![alt tag](/assets/vsc_install.png?raw=true)

* Run using `cmd + shift + P` -> wallaby.js:start (or just cmd + shift + R + R)
* That's it!

You can find a complete tutorial [here](https://wallabyjs.com/docs/intro/get-started-vscode.html);

## 5. Node inspector

[`node-inspector`](https://github.com/node-inspector/node-inspector) will enable you to debug your node via Chrome Inspector or via your IDE. Alternative methods are using `console.log` and the new node [`debug` option](https://nodejs.org/api/debugger.html).

#### install node inspector

```bash
npm install -g node-inspector
```

Debugging mocha tests in debug mode:

Mocha tests are running with node (don't be confused with tests which are running using Karma + Mocha. Those are running on browser. See details on Karma debugging section)

```bash
node-debug --debug-brk --no-preload node_modules/wix-node-build/wix-node-build-test.js --mocha
```

#### debugging your code

After  running your `node-debug` command, go to Chrome and open:

[`http://127.0.0.1:8080/?port=5858`](http://127.0.0.1:8080/?port=5858)

* First load can take ~30 sec ):
* If no source maps, press 'right click' and choose 'add source map', and manually choose your source map (from `dist` folder)
* You can `blackbox` scripts that you don't want inspector to enter (3rd party libraries) by right click + blackbox script (while inside a specific script)
* You can add debugger points to your code:
```js
/* eslint-disable no-debugger */
debugger;
```
* You can change node-debug options. See [`node-inspector`](https://github.com/node-inspector/node-inspector) for more details

# Debug node server

## 1. VSCode

**Prerequisite:** 

1. Please make sure you have `.start({disableCluster: process.env.NODE_ENV === 'development'});` in your `index.js`.

2. Please make sure you have a `launch.json` file (added with generator)

Debugging:

Choose `Launch` from VSCode debug menu

![alt tag](/assets/vscode-launch.png?raw=true)

Now all you have to do is put a breakpoint in your server code, and open `http://localhost:3000`.

To have all statics assets available, along with tests running in the background, you'll have to separately run:
```bash
wix-node-build start --no-server
```

https://youtu.be/KpvTxSXSgzw

## 2. Jetbrain

**Prerequisite:** 

* Please make sure you have `.start({disableCluster: process.env.NODE_ENV === 'development'});` in your `index.js`.

In order to debug using Webstorm, go to `run -> edit-configurations...`:

![alt tag](/assets/ws-edit-configurations.png?raw=true)

Press the '+' and choose 'node.js'. Add the following configurations:

![alt tag](/assets/ws-node-configurations.png?raw=true)

Now all you have to do is put a breakpoint in your server code, and open `http://localhost:3000`.

To have all statics assets available, along with tests running in the background, you'll have to separately run:

```bash
wix-node-build start --no-server
```

## 3. Native node
In case you want to debug your node endpoint/api, it is possible using the following steps (currently only on chrome browser, **using node V6.3.1+**):

- Enter:

  `SRC_PATH=./src NODE_ENV=development node --debug-brk --inspect=9222 --nolazy --require babel-register --require ./node_modules/wix-node-build/lib/ignore-extensions index.js`

  Copy the `chrome-devtools://devtools/remote...` line from the message you received, and paste to your chrome browser:

    ```
    Warning: This is an experimental feature and could change at any time.
    To start debugging, open the following URL in Chrome:
        chrome-devtools://devtools/remote/serve_file/@62cd277117e6f8ec53e31b1be58290a6f7ab42ef/inspector.html?experiments=true&v8only=tru  e&  ws=localhost:9222/node
    ```

- Browse to `http://localhost:3000` + put breakpoints on your server code (router, for example). See the following video for complete example:

https://youtu.be/GR2REpaeKjs

# Debug protractor e2e tests

## 1. VSCode

You can now debug protractor e2e tests using your VSCode IDE. Just add breakpoint (for now only `debugger` statement is working, because of VSCode bug), choose `Launch Protractor` (which should be part of Launch.json generated with your project) from VSCode debug menu, and run tests:

  ![alt tag](/assets/protractor-launch.png?raw=true)


## 2. Webstorm - TBD

## 3. Native Protractor debug/pause
Protractor tests can be debugged according to [those](https://github.com/angular/protractor/blob/master/docs/debugging.md) instructions.

#### `browser.pause()`

Just put browser.pause inside your code:

```js
it('should fail to find a non-existent element', function() {
  browser.get('app/index.html#/form');

  browser.pause();

  // This element doesn't exist, so this fails.
  var nonExistent = element(by.binding('nopenopenope')).getText();
});
```

Your test will stop at this point and you will be able to:

a. Go to chrome and debug/see the broser in it's current state (using chrome inspector)

b. Enter `repl` in console, and enter interactive mode. 

You will now be able to run things like:

`element(by.binding('user')).getText()` 

in your console!

#### `browser.debug()` - TBD (we need to develop support running protractor with `debug` flag
