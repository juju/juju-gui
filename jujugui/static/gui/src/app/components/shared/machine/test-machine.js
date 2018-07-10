.machine-view__machine {
  position: relative;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid $mid-grey;
  border-radius: 2px;

  &--selected.machine-view__machine--uncommitted,
  &--selected {
    margin-right: -20px;
    padding-right: 30px;
    border-style: dashed;
    border-right: 1px solid $canvas-background;
  }

  &--uncommitted {
    border-color: $uncommitted;
  }

  &-drop-message,
  &-drop-target {
    position: absolute;
    left: 0;
    right: 0;
  }

  &-drop-target {
    display: none;
    top: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, .9);
  }

  &-drop-message {
    top: calc(50% - (#{$base-line-height} / 2));
    color: $ubuntu-orange;
    text-align: center;
  }

  &--drop &-drop-target {
    display: block;
  }

  &--machine {
    cursor: pointer;

    .machine-view__machine {
      &-units {
        display: inline-block;
      }

      &-unit {
        margin-bottom: 0;
        float: left;
      }

      &-unit-icon {
        margin-right: 5px;
      }
    }
  }

  &--container {
    .machine-view__machine {
      &-unit {
        margin: 1px 0;
      }
    }
  }

  &--machine,
  &--container {
    transition: background-color .3s;

    &:focus,
    &:active,
    &:hover {
      background-color: $white;
    }
  }

  &-hardware {
    margin-top: 7px;
  }

  &-units {
    margin-top: 7px;
    list-style: none;
    margin-left: 0;
  }

  &-dropdown {
    display: none;
    float: right;

    .button-dropdown__show-menu {
      display: block;
    }
  }

  &-unit:hover,
  &--selected:not(.machine-view__machine--root),
  &:focus:not(.machine-view__machine--root),
  &:active:not(.machine-view__machine--root),
  &:hover:not(.machine-view__machine--root) {
    > .machine-view__machine-dropdown {
      display: block;
    }
  }
}
