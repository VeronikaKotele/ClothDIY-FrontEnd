import * as Constants from "../constants.js";

const bodyInputsPannel = document.getElementById('bodyInputsPannel');

if (bodyInputsPannel instanceof HTMLElement) {
	const heightInput = bodyInputsPannel.querySelector('#height');
	const bustInput = bodyInputsPannel.querySelector('#bust-circumference');
	const waistInput = bodyInputsPannel.querySelector('#waist-circumference');
	const hipInput = bodyInputsPannel.querySelector('#hip-circumference');
	const sleeveInput = bodyInputsPannel.querySelector('#sleeve-length');

	if (heightInput instanceof HTMLInputElement) {
		heightInput.value = Constants.DEFAULT_BODY_HEIGHT_CM.toString();
	}

	if (bustInput instanceof HTMLInputElement) {
		bustInput.value = Constants.DEFAULT_BUST_CIRCUMFERENCE_CM.toString();
	}

	if (waistInput instanceof HTMLInputElement) {
		waistInput.value = Constants.DEFAULT_WAIST_CIRCUMFERENCE_CM.toString();
	}

	if (hipInput instanceof HTMLInputElement) {
		hipInput.value = Constants.DEFAULT_HIP_CIRCUMFERENCE_CM.toString();
	}

	if (sleeveInput instanceof HTMLInputElement) {
		sleeveInput.value = Constants.DEFAULT_SLEEVE_LENGTH_CM.toString();
	}
}