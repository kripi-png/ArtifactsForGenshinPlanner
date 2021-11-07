import {
  createSlot,
  createArtifactEditor,
  createTooltipBoxWrapper,
  createHidingButton
} from './elementManager.js';

const ARTIFACT_DATA = loadFromCookies('userArtifactData') || {};
const DATASET = await getDataset();
console.log(DATASET);

const ARTIFACT_SET_NAMES = Object.keys(DATASET);

const main = function () {
  createAllSlots();

  console.log(ARTIFACT_DATA);

  if ( Object.keys(ARTIFACT_DATA).length != 0 ) {
    Object.entries(ARTIFACT_DATA).forEach(
      ([character, charData]) => {
        Object.entries(charData).forEach(
          ([piece, pieceData]) => {
            loadArtifact(character, piece);
          }
        );
      }
    );
  }

  createAllHidingButtons();
}

// create artifact slot elements for each character
const createAllSlots = function () {
  getAllCharacterPanels().forEach( panel => createSlotsForPanel(panel) );
}

// create all 5 artifact slots for a single {panel}
const createSlotsForPanel = function (panel) {
  let wrapperDiv = document.createElement('div');
  wrapperDiv.dataset.character = panel.querySelector('.ItemPanel_itemName__3SNcx > p').innerHTML.toLowerCase().replaceAll(' ', '-');
  wrapperDiv.classList.add('artifactSlotsWrapper');

  let flowerSlot = createSlot('flower', openArtifactEditor);
    wrapperDiv.appendChild(flowerSlot);
  let plumeSlot = createSlot('plume', openArtifactEditor);
    wrapperDiv.appendChild(plumeSlot);
  let sandsSlot = createSlot('sands', openArtifactEditor);
    wrapperDiv.appendChild(sandsSlot);
  let gobletSlot = createSlot('goblet', openArtifactEditor);
    wrapperDiv.appendChild(gobletSlot);
  let circletSlot = createSlot('circlet', openArtifactEditor);
    wrapperDiv.appendChild(circletSlot);

  panel.querySelector('.ItemPanel_itemContent__1D5XB').appendChild(wrapperDiv);
}

const openArtifactEditor = function (event) {
  let targetArtifactSlot = event.target;
  let artifactOwner = getArtifactSlotOwner(targetArtifactSlot).toLowerCase();
  let artifactType = getArtifactSlotType(targetArtifactSlot);

  let editWindow = createArtifactEditor(targetArtifactSlot, ARTIFACT_SET_NAMES,
                                        artifactOwner, artifactType, confirmArtifactEdit, deleteArtifact);

  document.body.appendChild(editWindow);
}

const confirmArtifactEdit = function (event, owner, type) {
  let set = document.querySelector('#selectArtifactInput').value;
  let main = document.querySelector('#artifactMainStat').value;
  let sub = document.querySelector('#artifactSubStat').value;
  let check = document.querySelector('#artifactCheckbox').checked;

  if (!ARTIFACT_DATA[owner]) ARTIFACT_DATA[owner] = {}
  ARTIFACT_DATA[owner][type] = {
    set: set, main: main, sub: sub,
    check: check,
  }

  saveToCookies("userArtifactData", ARTIFACT_DATA);
  loadArtifact(owner, type);

  let _editor = document.querySelector('#artifactEdit');
  _editor.parentNode.removeChild(_editor); // delete the editor element once artifact is selected
}

const deleteArtifact = function (event, owner, type) {
  if (ARTIFACT_DATA[owner]) {
    delete ARTIFACT_DATA[owner][type]
  }

  let slot = getArtifactSlotByOwner(owner, type);
  console.log(owner, slot);
  slot.dataset.set = '';
  slot.dataset.main = '';
  slot.dataset.sub = '';
  slot.dataset.check = '';
  slot.style.backgroundImage = '';
  slot.classList.remove('check');

  slot.onmouseover = e => false
  slot.onmouseleave = e => false

  console.log(ARTIFACT_DATA[owner]);

  saveToCookies("userArtifactData", ARTIFACT_DATA);
  loadArtifact(owner, type);

  let _editor = document.querySelector('#artifactEdit');
  _editor.parentNode.removeChild(_editor); // delete the editor element once artifact is selected
}

const loadArtifact = function (character, slot) {
  slot = getArtifactSlotByOwner(character, slot);
  if (!slot) return;
  let type = getArtifactSlotType(slot);
  let set = ARTIFACT_DATA[character][type] ? ARTIFACT_DATA[character][type]['set'] : '';
  if (!set) return; // if no set is set for a reason or another, abort
  let piece = DATASET[set][type]['name'];

  let image = DATASET[set][type]['image'];
  let main = ARTIFACT_DATA[character][type]['main'];
  let sub = ARTIFACT_DATA[character][type]['sub'];
  let check = ARTIFACT_DATA[character][type]['check'];

  slot.style.backgroundImage = `url(https://i.imgur.com/${image}.png)`;
  slot.dataset.set = set;
  slot.dataset.main = main;
  slot.dataset.sub = sub;
  slot.dataset.check = check;
  if (check) {
    slot.classList.add('check');
  } else {
    slot.classList.remove('check');
  }

  slot.onmouseover = e => createHoverPopup(e, slot, set, piece);
  slot.onmouseleave = e => {
    let _window = document.querySelector('#artifactTooltipWindow');
    _window.parentNode.removeChild(_window);
  }

  if (ARTIFACT_DATA[character]['disabled']) {
    slot.parentNode.classList.add('disabled');
  }
}

const createAllHidingButtons = function () {
  getAllCharacterPanels().forEach( panel => {
    // get owner's name to be stored into dataset for later
    let owner = panel.querySelector('.ItemPanel_itemName__3SNcx > p').innerHTML.toLowerCase().replaceAll(' ', '-');
    createHidingButton(panel, owner, hidingButtonCallback);
  });
}

const hidingButtonCallback = function (e) {
  // e.target is div.CircleButton_inner__2223j so get the div element
  let button = e.target.parentNode.parentNode;
  // find the artifact slot wrapper by the character name stored in the button div element
  let slotWrapper = document.querySelector(`.artifactSlotsWrapper[data-character=${e.target.parentNode.parentNode.dataset.character}]`);
  // ARTIFACT_DATA doesn't use hypens in character names (yet) so replace them
  hideArtifacts(button, slotWrapper, button.dataset.character.replaceAll('-', ' '));
}

const hideArtifacts = function (button, slotWrapper, character) {
  if (slotWrapper.classList.contains('disabled')) {
    button.title = "Hide Artifacts"
  } else {
    button.title = "Show Artifacts"
  }
  slotWrapper.classList.toggle('disabled');
  ARTIFACT_DATA[character]['disabled'] = !ARTIFACT_DATA[character]['disabled'] || false;
  saveToCookies("userArtifactData", ARTIFACT_DATA);
}

function createHoverPopup(e, slot, set, piece) {
  let {x, y} = calculatePopupLocation(slot);

  const tooltipBox = createTooltipBoxWrapper(slot, x, y, set, piece);
  document.body.appendChild(tooltipBox);
}

function saveToCookies(name, data, exdays=999) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const expires = "expires="+d.toUTCString();
  const cookie = [name, '=', JSON.stringify(data), ';', expires, ' ; domain=.', window.location.host.toString(), '; path=/;'].join('');
  document.cookie = cookie;
}

function loadFromCookies(name) {
  let result = document.cookie.match(new RegExp(name + '=([^;]+)'));
  result && (result = JSON.parse(result[1]));
  return result;
}

// returns whether {panel} is a weapon by checking the source of the panel's image
// e.g. src='/images/weapons/regular/Deathmatch.png'
const isWeapon = function (panel) {
  return panel.querySelector('.ItemPanel_itemImage__2fZwL > img').src.includes('weapons');
}

// returns the name from the title element of an artifact {slot}
const getArtifactSlotOwner = function (slot) {
  return slot.parentNode.parentNode.parentNode.querySelector('.ItemPanel_itemName__3SNcx > p').innerHTML;
}

// parses and returns the artifact type from slot's class list
const getArtifactSlotType = function (slot) {
  return slot.classList.item(1).replace('Slot', '');
}

// uses custom data attribute data-character to find and return a specific artifact slot of a specific character
const getArtifactSlotByOwner = function (character, slot) {
  return document.querySelector(`.artifactSlotsWrapper[data-character=${character.replaceAll(' ', '-')}]`).querySelector(`.${slot}Slot`);
}

const capitalizeFirstLetter = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getDataset () {
  const DATASET = await fetch(chrome.extension.getURL('src/js/dataset.json'));
  return DATASET.json();
}

function calculatePopupLocation(slot) {
  let rect = slot.getBoundingClientRect();

  let x = rect.left + slot.getBoundingClientRect().width;
  let y = rect.bottom - rect.height;

  return { x, y };
}

function getAllCharacterPanels() {
  return [...document.querySelector('.Farm_itemList__zk7_j').children].filter( panel => !isWeapon(panel) );
}

// waits until the character list has loaded and then executes the main function
export function waitForPageToLoad() {
  const waitForCharacterList = setInterval(function() {
    if (document.querySelector('.Farm_itemList__zk7_j')) {
      clearInterval(waitForCharacterList);
      console.log("Character list loaded!");

      main();
    }
  }, 100);
}
