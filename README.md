# MagneticSlider

![MagneticSlider-basic-demo](https://user-images.githubusercontent.com/40028187/140255990-344bc00a-639b-483f-a8ad-314a66c080bb.gif)

A lightweight, spec-compliant extension of [material-ui](https://github.com/mui-org/material-ui)'s Slider component, that enables the slider thumb to be attracted to the marks by a finely-configurable magnetic force. Acts as a hybrid between the [continuous](https://mui.com/components/slider/#continuous-sliders) and [discrete](https://mui.com/components/slider/#discrete-sliders) slider variants, where the thumb is allowed to move continuously between the discrete steps, but snaps to the nearest step when brought close enough to it.

No dependencies, aside from [React](https://www.npmjs.com/package/react) and [@material-ui/core](https://www.npmjs.com/package/@material-ui/core).

See the [Slider component](https://material-ui.com/components/slider/) and [Slider API](https://material-ui.com/api/slider/) documentation.

Inspired by [this StackOverflow question](https://stackoverflow.com/questions/62872477/material-ui-range-slider-make-the-thumb-snap-to-a-value-when-its-vicinity) and [its sole answer](https://stackoverflow.com/a/62879241) by SO user [Shreya](https://stackoverflow.com/users/10789616/shreya).

# Installation

`npm i magnetic-slider`

# Usage


```js
import MagneticSlider from "magnetic-slider";

<MagneticSlider
  magneticRadius={2}
  marks={[
    [0, 20, 37, 100].map((temperature) => ({
      value: temperature,
      label: `${temperature}°C`,
      // magneticScale: 1
     }))
  ]}
/>
```

# Documentation

## Component

## API


