import React from "react";
import Slider from "@material-ui/core/Slider";

// TODO move to utils
// @see https://stackoverflow.com/a/53187807
export function findLastIndex(array, predicate) {
  // should leverage the fact that the input array is sorted for perf
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}

const DEFAULT_MAGNETIC_RADIUS = 100,
  DEFAULT_MAGNETIC_BOUNDARY_DEADZONE = 0;

// pre-process the marks once from the props to sort by value (ASC) and to filter out the non-magnetic marks
function withSortedMarks(WrappedSliderComponent) {
  // HoC
  return function(props) {
    const sortedMarks = props.hasOwnProperty("marks")
      ? [...props.marks].sort((a, b) => a.value - b.value)
      : [];
    const cleanedMarks = props.hasOwnProperty("marks")
      ? [...props.marks].map((mark) => {
          const clone = Object.assign({}, mark);
          delete clone.magneticScale;
        })
      : [];

    // also, ensure that the statefulness is passed down to the wrapped component, creating it at this level if needed
    let value, setValue;
    if (!props.hasOwnProperty("value")) {
      const state = React.useState(props.defaultValue);
      [value, setValue] = state;
    }

    return (
      <MagneticSlider
        sortedMarks={sortedMarks}
        marks={cleanedMarks}
        value={props.hasOwnProperty("value") ? props.value : value}
        setValue={props.hasOwnProperty("value") ? props.setValue : setValue} // should console.warn if props.setValue is undefined (or find a better mechanism to pass down state that does not involve setting both)
        {...props}
      />
    );
  };
}

function MagneticSlider(props) {
  const {
    sortedMarks,
    setValue,
    magneticRadius = DEFAULT_MAGNETIC_RADIUS,
    magneticBoundaryDeadzone = DEFAULT_MAGNETIC_BOUNDARY_DEADZONE,
    ...otherProps
  } = props;

  function computeMagneticTarget(value, lowNeighbourMark, highNeighbourMark) {
    if (lowNeighbourMark === undefined && highNeighbourMark === undefined) {
      return null;
    } else if (lowNeighbourMark === undefined) {
      return Math.abs(highNeighbourMark.value - value) < magneticRadius * lowNeighbourMark.magneticScale
        ? highNeighbourMark.value
        : null;
    } else if (highNeighbourMark === undefined) {
      return Math.abs(value - lowNeighbourMark.value) < magneticRadius * highNeighbourMark.magneticScale
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
        // >=
        if (highDistance < magneticRadius * highNeighbourMark.magneticScale) {
          return highNeighbourMark.value;
        }
      }

      return null;
    }
  }

  return (
    <Slider
      value={props.value}
      onChange={(event, newValue) => {
        const lesserMarkIndex = findLastIndex(
          sortedMarks.map((mark) => mark.value),
          (value) => value <= newValue
        );

        let magnetTarget;
        // 3 cases: 1) it has a lesser and greater mark index, 2) it just has a greater mark index, 3) it has just a lesser mark index
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
          setValue(newValue);
        } else {
          // magnet to nearest mark
          setValue(magnetTarget);
        }

        // run parent hook
        if (props.hasOwnProperty("onChange")) {
          props.onChange(event, newValue); // make sure to respect API signature
        }
      }}
      {...otherProps}
    />
  );
}

const OptimizedMagneticSlider = withSortedMarks(MagneticSlider);

export default OptimizedMagneticSlider;
