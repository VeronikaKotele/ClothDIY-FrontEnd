const bodyInputsPannel = document.getElementById('bodyInputsPannel');
const closeBodyInputsPannelButton = document.getElementById('closeBodyInputsPannel');
const openBodyInputsPannelButton = document.getElementById('openBodyInputsPannel');

if (!(bodyInputsPannel instanceof HTMLDivElement) ||
    !(closeBodyInputsPannelButton instanceof HTMLButtonElement) ||
    !(openBodyInputsPannelButton instanceof HTMLButtonElement)) {
    throw new Error('One or more UI elements are missing or of incorrect type');
}

closeBodyInputsPannelButton.addEventListener('click', () => {
    bodyInputsPannel.style.display = 'none';
    closeBodyInputsPannelButton.style.display = 'none';
    openBodyInputsPannelButton.style.display = 'block';
});

openBodyInputsPannelButton.addEventListener('click', () => {
    bodyInputsPannel.style.display = 'block';
    closeBodyInputsPannelButton.style.display = 'block';
    openBodyInputsPannelButton.style.display = 'none';
});