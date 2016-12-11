# How to disable css modules in specific places

There are situations where you are using css modules inside you project, but you need to disable them in specific places. For example, when importing css from 3rd party vendor.

In those cases you can wrap your css with `:global`. See [here](https://github.com/css-modules/css-modules#exceptions) and [here](https://github.com/css-modules/css-modules#usage-with-preprocessors) for more details.

In case you want to import a css from your node modules, just `@import` it inside your scss file, and wrap it with `:global`:

Importing style.scss from '3rd-party-module/x/style.scss':

```scss
  @import '3rd-party-module/x/style.scss'
```

In case you are importing a regular 'css' file, just omit file extension:

```scss
  @import '3rd-party-module/x/style'
```
