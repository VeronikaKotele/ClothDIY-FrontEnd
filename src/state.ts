import * as Constants from "./constants.js";

export class BodyParameters {                
    height: number = Constants.DEFAULT_BODY_HEIGHT_CM;
    bustCircumference: number = Constants.DEFAULT_BUST_CIRCUMFERENCE_CM;
    waistCircumference: number = Constants.DEFAULT_WAIST_CIRCUMFERENCE_CM;
    hipCircumference: number = Constants.DEFAULT_HIP_CIRCUMFERENCE_CM;
    sleeveLength: number = Constants.DEFAULT_SLEEVE_LENGTH_CM;
}

export class AppState {
    bodyParameters: BodyParameters = new BodyParameters();
}