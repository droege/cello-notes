const inputBox = document.getElementById('input')
const input = {
  raw: '',
  lines: [],
  allNotes: []
}
const outputBox = document.getElementById('output')

const showFingersBox = document.getElementById('showFingers')
let showFingers

const transposeBox = document.getElementById('transpose')
let transposeBy

[showFingersBox, transposeBox].forEach(el => el.addEventListener('change', draw))

const notes = {
  c: 0,         d: 2,         e: 4, f: 5,         g: 7,         a: 9,         h: 11,
        cis: 1,       dis: 3,             fis: 6,       gis: 8,       ais: 10,
        des: 1,       es:  3,             ges: 6,       as:  8,       b:   10
}
const notesRegEx = /[cdefgabh,]([ei]?s)?[-+]*/g
const strings = ['C', 'G', 'D', 'A']
const stringRange = 7
const fingers = [0, '-1', 1, 2, 3, 4, '+4']
const unwantedSteps = [1, 6] // These are the "steps" that result in finger-stretching (-1, +4)

const warnings = {
  unknown: '?',
  oor: 'out of range'
}

const noteInRange = value => value >= 0 && value <= 27

function draw () {
  input.raw = inputBox.value
  input.lines = []
  input.allNotes = []
  showFingers = showFingersBox.checked
  transposeBy = Number(transposeBox.value)
  outputBox.innerHTML = ''
  input.raw.split('\n').forEach(drawInputLine)
  input.allNotes = input.lines.reduce((all, line) => all.concat(line), [])
  optimalTranspositions()
}

function drawInputLine (inputLine, lineNumber) {
  input.lines.push([])
  const rows = [[], [], [], []]
  const notesInLine = inputLine.match(notesRegEx)
  if (notesInLine) {
    notesInLine.forEach(note => {
      let value = 0
      while (note.includes('-')) {
        value -= 12
        note = note.replace('-', '')
      }
      while (note.includes('+')) {
        value += 12
        note = note.replace('+', '')
      }
      if (note === '') {
        return false
      }
      if (note === ',') {
        rows.forEach(row => row.push(','))
      }
      else if (!notes.hasOwnProperty(note)) {
        rows.forEach(row => row.push(warnings['unknown']))
      }
      else {
        value += notes[note]
        input.lines[lineNumber].push(value)
        value += transposeBy
        if (!noteInRange(value)) {
          rows.forEach(row => row.push(warnings['oor']))
        }
        else {
          for (i in strings){
            if (Math.floor(value / stringRange) == i) {
              const steps = value % stringRange
              rows[i].push(showFingers ? fingers[steps] : steps)
            }
            else {
              rows[i].push(' ')
            }
          }
        }
      }
    })
  }
  
  outputBox.innerHTML += `<table class="table"> ${rows.reverse().reduce(
    (allRows, row, i) => allRows + `<tr><th scope="row">${strings[3 - i]}</th> ${row.reduce(
      (allCells, note) => allCells + `<td class="${Object.values(warnings).includes(note) ? 'table-danger' : ''} ${note === ',' ? 'table-secondary' : ''}">${note}</td>`, ''
    )}</tr>`, ''
  )}</table><br>`
}

draw()

function optimalTranspositions() {
  const display = document.getElementById('transpositionSuggestionsDisplay')
  const out = msg => display.innerHTML = msg + '\n'

  const transpositionScores = []
  for (let transposeBy = -11; transposeBy < 24; transposeBy++) {
    const transposedNotes = input.allNotes.map(note => note + transposeBy)
    if (transposedNotes.every(noteInRange)) {
      let score = transposedNotes.reduce(
        (score, note) => score + +unwantedSteps.includes(note % stringRange)
      , 0)
      transpositionScores.push({transposeBy, score})
    }
  }
  transpositionScores.sort((a, b) => a.score - b.score)
  out(transpositionScores.slice(0, 5).map(({transposeBy, score}) => `<button type="button" class="btn btn-outline-primary" onclick="setTransposition(${transposeBy})">${transposeBy} (${score})</button>`).join(' '))
}

function setTransposition (transposeBy) {
  transposeBox.value = transposeBy
  draw()
}

function addTransposition (additionalTransposition) {
  setTransposition(+transposeBox.value + additionalTransposition)
}

function sanitiseInput () {
  inputBox.value = inputBox.value.split('\n').map(line => line.match(notesRegEx).join(' ')).join('\n')
}

/*
function sanitiseInput () {
  inputBox.value = input.lines
    .map(line => line.map(valueToNote).join(' '))
    .join('\n')
  draw()
}
*/

function valueToNote (value) {
  let modifiers = ''
  while (value < 0) {
    modifiers += '-'
    value += 12
  }
  while (value > 11) {
    modifiers += '+'
    value -= 12
  }
  const baseNote = Object.keys(notes)[Object.values(notes).indexOf(value)]
  return baseNote + modifiers
}


// todo: Export/save in localstorage (with a title)
// todo: Include commas in sanitisation
// todo: Allow input by Klaviatur (on-screen and/or keyboard)