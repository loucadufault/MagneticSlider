import React from "react";
import Slider from "@material-ui/core/Slider";


// move to constants file for self-doc
const DEFAULT_MAGNETIC_RADIUS = 100;
const DEFAULT_MAGNETIC_SCALE = 1;
const DEFAULT_MAGNETIC_BOUNDARY_DEADZONE = 0;

const DEFAULT_DEFAULT_VALUE = 0; // we follow material-ui's convention of falling back to 0 if no value or default value is given


// @see https://stackoverflow.com/a/53187807
function findLastIndex(array, predicate) {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}


function findSortedLastIndex(array, predicate) {
  return findLastIndex(array, predicate); // TODO leverage the fact that the input array is sorted for perf
}


function MagneticSlider(props) {
  const {
    sortedMarks,
    value,
    magneticRadius = DEFAULT_MAGNETIC_RADIUS,
    magneticBoundaryDeadzone = DEFAULT_MAGNETIC_BOUNDARY_DEADZONE,
    onChange: parentOnChange,
    ...otherProps
  } = props;


  function computeMagneticTarget(value, lowNeighbourMark, highNeighbourMark) { // should this be wrapped in a effect or callback hook to prevent uneccessary recreation?
    if (lowNeighbourMark === undefined && highNeighbourMark === undefined) {
      return null;
    } else if (lowNeighbourMark === undefined) {
      return Math.abs(highNeighbourMark.value - value) <
        magneticRadius * highNeighbourMark.magneticScale
        ? highNeighbourMark.value
        : null;
    } else if (highNeighbourMark === undefined) {
      return Math.abs(value - lowNeighbourMark.value) <
        magneticRadius * lowNeighbourMark.magneticScale
        ? lowNeighbourMark.value
        : null;
    } else {
      // both defined
      const lowDistance = Math.abs(value - lowNeighbourMark.value);
      const highDistance = Math.abs(highNeighbourMark.value - value);
      const midpoint =
        Math.abs(highNeighbourMark.value - lowNeighbourMark.value) / 2;

      if (
        value > midpoint - magneticBoundaryDeadzone &&
        value < midpoint + magneticBoundaryDeadzone
      ) {
        // in the boundary deadzone
        return null;
      }

      // otherwise return nearest that is in radius
      if (lowDistance < highDistance) {
        if (lowDistance < magneticRadius * lowNeighbourMark.magneticScale) {
          return lowNeighbourMark.value;
        }
      } else {
        if (highDistance < magneticRadius * highNeighbourMark.magneticScale) {
          return highNeighbourMark.value;
        }
      }

      return null;
    }
  }

  return (
    <Slider
      value={value}
      onChange={(event, newValue) => {
        const lesserMarkIndex = findSortedLastIndex(
          sortedMarks.map((mark) => mark.value),
          (value) => value <= newValue
        );

        let magnetTarget;
        if (lesserMarkIndex === -1) {
          // newValue is either
          magnetTarget = computeMagneticTarget(
            newValue,
            undefined,
            sortedMarks.length > 0 ? sortedMarks[0] : undefined // handle when there are no marks
          );
        } else if (lesserMarkIndex === sortedMarks.length - 1) {
          magnetTarget = computeMagneticTarget(
            newValue,
            sortedMarks[sortedMarks.length - 1],
            undefined
          );
        } else {
          magnetTarget = computeMagneticTarget(
            newValue,
            sortedMarks[lesserMarkIndex],
            sortedMarks[lesserMarkIndex + 1]
          );
        }

        if (magnetTarget === null) {
          // no-op
          parentOnChange(event, newValue);
        } else {
          // magnet to nearest mark
          parentOnChange(event, magnetTarget);
        }
      }}
      {...otherProps}
    />
  );
}


/**
 * 
 * @param {*} WrappedSliderComponent the MagneticSlider component that this HoC wraps
 * 
 * Pre-processes the props marks once to sort by (ASC) value.
 * Cleans the props to comply to the API of the underlying Slider (namely, the marks array element objects may contain non-compliant properties provided for our MagneticSlider component).
 *
 * The MagneticSlider component requires a given value prop, that it can pass down to its underlying Slider component to manage its value. 
 * This value is either provided from above (parent of this HoC), or created as a state in this HoC. In any case the value is always provided downstream to the wrapped MagneticSlider component.
 * In the former case, we cannot directly manage the statefulness of the passed value (it may not even be stateful), but can only notify the parent of the target value via the onChange handler prop if one is provided by said parent. This conforms with the observed behavior of a controlled Slider component.
 * In the latter case, we create and manage the statfulness of the value, and pass down this stateful value as well as an onChange handler that controls its state to the wrapped MagneticSlider. This conforms with the observed behavior of an uncontrolled Slider component.
 */
function withSortedMarks(WrappedMagneticSliderComponent) {
  return function(props) {
    const {
      marks,
      value: parentValue,
      onChange: parentOnChange,
      defaultValue = DEFAULT_DEFAULT_VALUE,
      ...otherProps
    } = props;

    const sortedMarks = props.hasOwnProperty("marks")
      ? [...marks].sort((a, b) => a.value - b.value)
      : [];

    sortedMarks.forEach((mark) => {
      if (!mark.hasOwnProperty("magneticScale")) {
        mark.magneticScale = DEFAULT_MAGNETIC_SCALE;
      }
    }); // could also apply the default when they are checked (e.g. `highNeighbourMark.magneticScale || DEFAULT_MAGNETIC_SCALE`) to save one O(n)

    const cleanedMarks = props.hasOwnProperty("marks")
      ? [...marks].map((mark) => {
          const clone = Object.assign({}, mark);
          delete clone.magneticScale;
          return clone;
        })
      : [];

    // ensure that the statefulness is passed down to the wrapped component, creating it at this level if needed
    let value, onChange;
    // there is no statefulness from above (not controlled)
    if (!props.hasOwnProperty("value")) {
      let setValue; // create and manage own state
      [value, setValue] = React.useState(defaultValue);

      onChange = (event, newValue) => {
        setValue(newValue); // the wrapped component will update the statefulness with this hook

        // call the parent hook, if any
        if (props.hasOwnProperty("onChange")) {
          parentOnChange(event, newValue);
          // note that the parent hook cannot access the statefulness in this case
        }
      };
    }

    let onChangeCb;
    // there is statefulness from above (controlled)
    if (props.hasOwnProperty("value")) {
      if (props.hasOwnProperty("onChange")) {
        onChangeCb = parentOnChange; // let the parent exclusively handle this (provided there is a parent handler). we do not handle own state
      } // else undefined
    } else {
      onChangeCb = onChange; // otherwise we handle this and update own state
    }

    return (
      <WrappedMagneticSliderComponent
        sortedMarks={sortedMarks}
        marks={cleanedMarks}
        value={props.hasOwnProperty("value") ? parentValue : value}
        {...(onChangeCb !== undefined ? { onChange: onChangeCb } : {})} // condtionally add this prop
        {...otherProps}
      />
    );
  };
}


export default withSortedMarks(MagneticSlider);
