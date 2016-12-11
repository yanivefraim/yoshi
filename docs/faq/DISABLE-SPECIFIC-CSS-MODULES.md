# How to disable css modules in specific places

There are situations when you are using css modules inside you project, but you need to disable them in specific places (for example, when importing css from 3rd party vendor).

In those cases you can wrap your css with `:global`:

```css
  :global {
    .global-class-name {
      color: green;
    }
  }
```

Please find more details [here](https://github.com/css-modules/css-modules#exceptions).  

#### Importing css from node_modules

In case you want to import a css from your node modules, just `@import` it inside your scss file, and wrap it with `:global`:

Importing style.scss from '3rd-party-module/x/style.scss':

```scss
  @import '3rd-party-module/x/style.scss'
```

In case you are importing a regular 'css' file, just omit file extension:

```scss
  @import '3rd-party-module/x/style'
```
