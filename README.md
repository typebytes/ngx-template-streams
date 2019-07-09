# ngx-template-streams

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![npm](https://img.shields.io/npm/v/@typebytes/ngx-template-streams.svg)](https://www.npmjs.com/package/@typebytes/ngx-template-streams)
[![npm License](https://img.shields.io/npm/l/@typebytes/ngx-template-streams.svg)](https://github.com/typebytes/ngx-template-streams/blob/master/LICENSE)

Take your Angular templates to the next level by **embracing reactivity**. This is a small and lightweight library that provides a simple DSL enabling event streams in templates. In other words, this library will **supercharge your templates with Observables**. Use a declerative syntax to create Observables from different event sources, such as native DOM events, or component outputs.

**⚠️ Disclaimer ⚠️**

This library is **experimental** and its goal is to explore how we could create event streams from templates in Angular. To do this, we hooked into the build process and apply HTML and TypeScript transformations, as well as patch some other internal APIs to make this work with AOT.

We like reactive programming and with this experiment we hope that we can push this forward in the Angular community and to help drive the adoption of a similar syntax or feature set that is baked right into Angular.

**Can I use this now?** Definitely! If at some point our implementation breaks, or Angular releases its own syntax, we will provide a schematic that will help you seamlessly migrate your code to keep the impact on you as small as possible.

## Features

- ✅ Works with both `ViewEngine` and `Ivy`
- ✅ AOT compatible
- ✅ Easy to use syntax that is inspired by [this proposal](https://github.com/angular/angular/issues/13248)
- ✅ Can be used for native DOM events and component outputs
- ✅ Redefine the event payload (`$event`)
- ✅ Works with our beloved `AsyncPipe`

## 🙏 Credits

Big thanks to [Filipe Silva](https://twitter.com/filipematossilv), [Craig Spence](https://twitter.com/phenomnominal), [Alexey Zuev
](https://twitter.com/yurzui) and [Manfred Steyer](https://twitter.com/ManfredSteyer) for his amazing [ngx-build-plus](https://github.com/manfredsteyer/ngx-build-plus) library!

## Table of contents

- [Quickstart](#quickstart)
- [Syntax](#syntax)
- [Usage](#usage)
- [API](#api)
- [Manual Installation](#manual-installation)
- [Why](#why-⁉️)
- [Want to contribute?](#👷-want-to-contribute)
- [Notes](#notes)
- [FAQ](#faq)
- [Versioning](#versioning)
- [Licence](#📄-licence)

## Quickstart

The most straightforward way to get started with this library is to use its `ng add` schematic.

Simply run:

```bash
ng add @typebytes/ngx-template-streams
```

This will do all the heavy (actually not so heavy) lifting for your and add the library to your project.

Optionally you can also specifiy a project with `--project <project-name>`.

The schematic will:

- ensure project dependency is placed in `package.json`
- add [ngx-build-plus](https://github.com/manfredsteyer/ngx-build-plus) as a `devDependency`
- install necessary dependencies
- configure `serve`, `build`, and `test` architects of your app (these will use a custom builder to allow for custom webpack configurations)

Once all that is done, we can take adventage of this library and define some event streams in our templates 🎉.

## Syntax

The syntax is simple. Here's the full specification:

```
(*<event-name>)="<template-stream-name>[; $event = <payload>]"
```

- `*` marks the event binding as a template stream binding
- `[]` denotes optional parts of the synax
- `<placeholder>` represent placeholders you can fill in

More specifically there are 3 core building blocks:

1. event name
2. template stream name
3. payload

The payload is **optional** and can litereally be anything as long as it follows the syntax above. So optional doesn't mean you can go wild and define the payload in whatever form you like. More on this [here](#overwriting-the-event-payload).

Now, let's check out how we can use this in our app 👇

## Usage

Once you have installed the library, you can start using it. And that's very easy!

In order to create a template stream, you can use a slightly modified version of a regular event binding in Angular. Here's an example of a simple button with a click event:

```html
<button (*click)="clicks$">Click Me (Stream)</button>
```

Instead of using a regular event binding, we are using a custom syntax that will be transformed into markup that Angular understands.

Important is that we indicate template streams by **prefixing** the event with an asterisk (`*`). For the expression of the template stream we use the **name of the Observable** that will emit the click event.

**Note:** The `$` sign is only a convention and is used to denote the property as an `Observable`.

Next, we have to declare this property `clicks$` on the component class. For that we can use a decorator provided by `ngx-template-streams` called `@ObservableEvent()`:

```ts
import { Component, OnInit } from '@angular/core';
import { ObservableEvent } from '@typebytes/ngx-template-streams';
import { Observable } from 'rxjs';

@Component({...})
export class AppComponent implements OnInit {
  @ObservableEvent()
  clicks$: Observable<any>;

  ngOnInit() {
    // we can either manually subscribe or use the async pipe
    this.clicks$.subscribe(console.log);
  }
}
```

Notice that we have declared the property using the `@ObservableEvent` decorator and subscribe to the Observable in our `ngOnInit` lifecycle hook. Alternatively we can also use this property in our template again and use the `AsyncPipe`.

That's it! That's all it takes to create a very simple template stream!

The general syntax for creating a simple template stream inside the template is:

```
(*<event-name>)="<template-stream-name>; [payload]?"
```

The `payload` part is **optional**. For more information check out [Overwriting the event payload](#overwriting-the-event-payload).

### Overwriting the event payload

By default, the event payload will be `$event`. Overwriting the payload is pretty straightforward and we only need to slightly extend our example from above.

So let's say we want the payload to be the string `test`. Then we can define the payload as follows:

```html
<button (*click)="clicks$; $event = 'test'">Click Me (Stream)</button>
```

Here we slightly extend the expression with an assignment of `$event`. We can literally assign anything to `$event`, from primitive values, to objects, properties from the component, and even function calls.

The general syntax for overwriting the payload is:

```
$event = <value>
```

### Adding operators

We have decided not to add too much magic to this library and focus a bit more on clarity over brevity, type safety and explicitness. This means that in order to add operators to the template stream, we have to declare another variable and use the template stream property (here `clicks$`) as the source.

For example:

```ts
import { Component, OnInit } from '@angular/core';
import { ObservableEvent } from '@typebytes/ngx-template-streams';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({...})
export class AppComponent implements OnInit {
  @ObservableEvent()
  clicks$: Observable<any>;

  // here we define a new property based on the template stream
  // in order to add operators
  debouncedClicks$ = this.clicks$.pipe(
    debounceTime(400)
  );

  ngOnInit() {
    this.debouncedClicks$.subscribe(console.log);
  }
}
```

## API

Besides the template syntax, `ngx-template-streams` comes with one main building block, a `@ObservableEvent()` decorator.

### `@ObservableEvent(subjectOrSubjectFactory)`

**Parameters**

| Parameter               | Type                         | Default   | Description                                                                                                 |
| ----------------------- | ---------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| subjectOrSubjectFactory | `Subject` or Subject Factory | `Subject` | Instance of a Subject or factory function to create the underlying source sequence for the template stream. |

For example, if we don't pass any parameters it will create a plain `Subject` by default.

```ts
@Component({...})
export class AppComponent {
  @ObservableEvent()
  clicks$: Observable<any>;
}
```

We can also pass in an instance of a `Subject`. This can be any type of Subject:

```ts
@Component({...})
export class AppComponent {
  @ObservableEvent(new BehaviorSubject('INIT'))
  clicks$: Observable<any>;
}
```

Or, we could also pass in a **factory function** that creates a Subject:

```ts
@Component({...})
export class AppComponent {
  @ObservableEvent(() => {
    return new Subject();
  })
  clicks$: Observable<any>;
}
```

## Manual Installation

If you want to manually install this libray you first have to install [ngx-build-plus](https://github.com/manfredsteyer/ngx-build-plus) as a `devDependency` which allows us to extend the Angular CLI's default build behavior without ejecting:

```bash
ng add ngx-build-plus
```

**Note:** If you don't want to use the install schematic and need to know how you can manually install `ngx-build-plus`, I would like redirect you to the [official GitHub repo](https://github.com/manfredsteyer/ngx-build-plus).

Next, we can install `ngx-template-streams` and save it as a dependency of our project:

```bash
npm install @typebytes/ngx-template-streams -S
```

Now, we can update the `angular.json` and add some extra configuration options to the `build`, `serve` and `test` architect.

For each of those architect targets add the following additional options:

```
[...]
"architect": {
    "build": {
        [...],
        "options": {
          [...],
          "extraWebpackConfig": "node_modules/@typebytes/ngx-template-streams/webpack/webpack.config.js",
          "plugin": "~node_modules/@typebytes/ngx-template-streams/internal/plugin.js"
        }
    }
}
[...]
```

That's it! You are now ready to use template streams! 🎉

## Why ⁉️

Because Observables rock 🤘. Everything is a stream and being able to also embrace reactivity in our templates improves the developer experience so that we don't have to constantly switch between different programming paradigms (imperative vs. functional reactive programming).

Also, this feature has been requested by the community for a long time and there is an [open issue](https://github.com/angular/angular/issues/13248) on GitHub since 2016.

With all the advances of different parts of the ecosystem including the Angular CLI, we wanted to take a stab and add this feature to the communities' toolbelt, allowing for more consistency in terms of programming style.

# 👷 Want to contribute?

If you want to file a bug, contribute some code, or improve our documentation, read up on our [contributing guidelines](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md), and check out [open issues](/issues) as well as [open pull requests](/pulls) to avoid potential conflicts.

## 📄 Notes

This library has been well tested and works great in most use cases. However, there are a few things that we are aware of that we want to point out here. This is just to raise awareness that, in some special cases, you might notice some unexpected things.

### Type Checker

For this library to work with AOT as well, we cannot run the type checker in a forked process. This has some performance drawbacks for **large** applications because TypeScript is synchronous and running the type checker in the main thread will slow down the compilation. We are aware of this and will investigate possible solutions to the underlying error, that is the forked type checker stops unexpectedly. **If you have an idea, feel free to help us [here](https://github.com/typebytes/ngx-template-streams/issues/1). Any help is very much appreciated.**

### Formatting

When running your app in AOT mode, formatting (mostly whitespace in form of newlines) is not preserved. That's because AST transformations alone are not enough and the AOT compiler runs a type check that will error due to missing properties, even though the properties were created on the AST. We are talking about properties that a decorator (`ObservableEvent`) will create at runtime. It's important to keep in mind that source files are immutable, this means any transformations are not reflected back to the actual text (`sourceFile.getText()`) of the source file. However, this is important and therefore the current solution uses a _printer_ to get an updated text version of the transformed AST which we then store back into the internal source file cache. Even though the formatting is not preserved, we believe **it's not a deal breaker** and shouldn't stop you from using this library. Serving your app with AOT enabled shouldn't be the default development environment and it should only be used to test your app. **You can still look at the source maps, add breakpoints and debug your application.** So no real downsides other than missing new lines. Nevertheless, we are still trying to find a "better" solution to this inconvenience. If you have ideas, please check out [this issue](https://github.com/typebytes/ngx-template-streams/issues/2).

## FAQ

### What if I already have a custom Webpack configuration?

If you are already using a custom webpack configuration to adjust the behavior of the build process, it's recommended
to follow the [manual installation guide](#manual-installation) instead of using the `ng add` schematic. We recommend to stick to [ngx-build-plus](https://github.com/manfredsteyer/ngx-build-plus) as it's very convenient to work with and create a plugin that takes care of merging in your custom webpack config as well as the one provided by `ngx-template-streams`. Finally, you have to call our build plugin (you'll find this in `@typebytes/ngx-template-streams/internal/plugin.js`) to make sure the compiler plugin is correctly configured to allow template and AST transformations.

## Versioning

`ngx-template-streams` will be maintained under the Semantic Versioning guidelines. Releases are numbered with the following format:

```
<MAJOR>.<MINOR>.<PATCH>
```

1.  **MAJOR** versions indicate incompatible API changes,
2.  **MINOR** versions add functionality in a backwards-compatible manner, and
3.  **PATCH** versions introduce backwards-compatible bug fixes.

For more information on SemVer, please visit [http://semver.org](http://semver.org).

## 📄 Licence

MIT License (MIT) © [Dominic Elm](https://github.com/d3lm) and [Kwinten Pisman](https://github.com/KwintenP)
