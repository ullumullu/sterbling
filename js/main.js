import {
  arrowAnimation
} from "./animation";
import {
  ready
} from "./utils";
import {
  deferiframes
} from "./defer_load";

ready()
  .then(() => arrowAnimation())
  .then(() => deferiframes());