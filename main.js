// Konstanten
const minUberstunden = 10 // Die maximale Zeit in Stunden befor es Überstunen werden
const maxRuhezeit = "11:00" // Die Ziel Ruhezeit (Keine Ausgleichszeit davor Möglich, im fall von 06:30 dann 19:30)
const arbeitStartNorm = "06:30" // Geplanter Arbeitsanfang
let rufCounter = 0;

document.addEventListener('DOMContentLoaded', function () {
  var checkBox = document.getElementById('arbeitFrei');
  var elementsToHide = ['arbeitBeginnDiv', 'arbeitEndeDiv', 'arbeitPauseDiv'];

  checkBox.addEventListener('change', function () {
    elementsToHide.forEach(function (id) {
      var element = document.getElementById(id);
      if (checkBox.checked) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });
  });
});

const addRufBereitschaft = () => {
  const container = document.getElementById('rufBereitschaftContainer');
  const uniqueId = Date.now(); // Generate a unique ID for the wrapper div.
  const wrapper = document.createElement('div');
  wrapper.id = `rbElement-${uniqueId}`;
  wrapper.style.marginTop = "3px";
  wrapper.innerHTML = `
        <span style="margin-right: 10px; color: red; cursor: pointer;">X</span>
        <label>Beginn (HH:MM): <input type="time" name="rbBeginn" required></label>
        <label> Ende (HH:MM): <input type="time" name="rbEnde" required></label>
        <label for="ausrück">Aufenthalsort Verlassen</label>
        <input type="checkbox" id="ausrück" name="ausrück" checked/>
        <div class="hover-text">(?)
        <span class="tooltip-text top">Wurde der Aufenthaltsort verlassen für die Erfüllung des Einsatzes?</span>
    `;

  // Find the newly added span within the wrapper and attach a click event listener
  const removeBtn = wrapper.querySelector('span');
  removeBtn.addEventListener('click', function () {
    wrapper.remove();
  });

  container.appendChild(wrapper);
}

const collectOnCallData = () => {
  const allWrappers = document.querySelectorAll('div[id^="rbElement-"]');
  const data = Array.from(allWrappers).map(wrapper => {
    const startInput = wrapper.querySelector('input[name="rbBeginn"]');
    const endInput = wrapper.querySelector('input[name="rbEnde"]');
    const verlassenCheckbox = wrapper.querySelector('input[name="ausrück"]');

    const start = startInput.value;
    const ende = endInput.value;
    const verlassen = verlassenCheckbox.checked; // true if checked, false if not

    // Validate HH:MM format using a regular expression
    const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const isStartValid = timeFormat.test(start);
    const isEndValid = timeFormat.test(ende);


    // Return data if valid, null otherwise (you might adjust this behavior based on your needs)
    if (isStartValid && isEndValid) {
      return { start, ende, verlassen };
    } else {
      return null;
    }
  }).filter(entry => entry !== null); // Remove invalid entries

  return data;
}

// Zeit Berechnung
const timeToFloat = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

function formatTimeFromFloat(timeFloat) {
  const hours = Math.floor(timeFloat);
  const minutes = Math.round((timeFloat - hours) * 60);
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
}

const floatToTime = (timeFloat) => {
  const hours = Math.floor(timeFloat);
  const minutes = Math.round((timeFloat - hours) * 60);
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
};

function isTimeWithinRange(time, start, end) {
  const timeToMinutes = time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes <= endMinutes) {
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  } else {
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }
}

function convertToProperTime(timeString) {
  let [hours, minutes] = timeString.split(':');
  let [cleanMinutes, fractional] = minutes.split('.');

  if (fractional && parseFloat(`0.${fractional}`) >= 0.5) {
    cleanMinutes = parseInt(cleanMinutes) + 1;
    if (cleanMinutes >= 60) {
      cleanMinutes = 0;
      hours = parseInt(hours) + 1;
    }
  }

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = cleanMinutes.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
}


const isTimeBefore = (firstTime, secondTime) => {
  const [firstHours, firstMinutes] = firstTime.split(':').map(Number);
  const [secondHours, secondMinutes] = secondTime.split(':').map(Number);

  if (firstHours < secondHours) {
    return true;
  } else if (firstHours > secondHours) {
    return false;
  } else {
    return firstMinutes < secondMinutes;
  }
}

const isTimeGreaterThan = (time1, time2) => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  return hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2);
}

const addTimes = (time1, time2) => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  let totalMinutes = totalMinutes1 + totalMinutes2;

  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return result;
}

const subtractTimes = (time1, time2) => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;
  let totalMinutes = totalMinutes1 - totalMinutes2;

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return result;
}

const zeitInStunden = (start, ende) => {
  const [startStunden, startMinuten] = start.split(':').map(Number);
  const [endeStunden, endeMinuten] = ende.split(':').map(Number);
  return ((endeStunden + endeMinuten / 60) - (startStunden + startMinuten / 60) + 24) % 24;
};

function berechneArbeitszeiten(arbeitszeitStart, arbeitszeitEnde, pausenDauer, rufbereitschaften, istFreierTag = false) {
  let gesamtarbeitszeitOhneRuf = zeitInStunden(arbeitszeitStart, arbeitszeitEnde) - pausenDauer;
  let gesamteRufbereitschaftszeit = rufbereitschaften.reduce((summe, { start, ende }) => summe + zeitInStunden(start, ende), 0);
  let gesamtarbeitszeit = gesamtarbeitszeitOhneRuf + gesamteRufbereitschaftszeit;
  let frühsteKondition = subtractTimes(arbeitStartNorm, maxRuhezeit)
  let ausgleichszeit = gesamtarbeitszeit > minUberstunden ? gesamtarbeitszeit - minUberstunden : 0;
  let fruehesteStartzeit = arbeitStartNorm;

  let letzteBereitschaftEndePlus4h = null;
  let letzteBereitschaftEndePlus6h = null;
  let lastBereitschaftsEnde = null;
  for (let i = 0; i < rufbereitschaften.length; i++) {
    const start = rufbereitschaften[i].start
    const ende = rufbereitschaften[i].ende
    const einsatzDauer = zeitInStunden(start, ende);
    lastBereitschaftsEnde = ende

    // Prüfen ob Bereitschaftseinsatz am Feiertag war und über 0 Uhr geht und länger als 4h dauert
    if (istFreierTag && einsatzDauer >= 4 && isTimeBefore(ende, arbeitStartNorm)) {
      letzteBereitschaftEndePlus4h = ende;
    }
  }

  // Entfernen aller Rufbereitschaften wo nicht ausgerückt wurde
  const filteredRufbereitschaften = rufbereitschaften.filter(obj => obj.verlassen === true);

  for (let i = 0; i < filteredRufbereitschaften.length; i++) {
    const ende = filteredRufbereitschaften[i].ende

    // Prüfen ob wir mehr als einen Rufbereitschaftseinsatz haben und es der letzte ist
    if (filteredRufbereitschaften.length > 1 && i === filteredRufbereitschaften.length - 1) {
      if (!isTimeBefore(ende, arbeitStartNorm)) console.log("Du arbeitest schon");
      if (zeitInStunden(ende, arbeitStartNorm) <= 6) letzteBereitschaftEndePlus6h = ende;
    }
  }

  // Früheste Startzeit für den nächsten Tag basierend auf Ausgleichszeit
  if (ausgleichszeit > 0 && isTimeWithinRange(lastBereitschaftsEnde, frühsteKondition, arbeitStartNorm)) {
    const [stunden, minuten] = fruehesteStartzeit.split(':').map(Number);
    const neueStartStunde = stunden + Math.floor(ausgleichszeit);
    const neueStartMinute = (minuten + (ausgleichszeit % 1) * 60) % 60;
    const stundenAddition = Math.floor((minuten + (ausgleichszeit % 1) * 60) / 60);
    fruehesteStartzeit = `${neueStartStunde + stundenAddition}:${neueStartMinute.toString().padStart(2, '0')}`;
  } else {
    ausgleichszeit = 0;
  }

  if (letzteBereitschaftEndePlus6h) {
    const ruf6hanpassung = addTimes(letzteBereitschaftEndePlus6h, "06:00")
    if (isTimeBefore(fruehesteStartzeit, ruf6hanpassung)) {
      fruehesteStartzeit = ruf6hanpassung;
      ausgleichszeit = timeToFloat(subtractTimes(fruehesteStartzeit, arbeitStartNorm));
    }
  }

  if (letzteBereitschaftEndePlus4h) {
    const ruf4hanpassung = addTimes(letzteBereitschaftEndePlus4h, "04:00")
    if (isTimeBefore(fruehesteStartzeit, ruf4hanpassung)) {
      fruehesteStartzeit = ruf4hanpassung;
      ausgleichszeit = timeToFloat(subtractTimes(fruehesteStartzeit, arbeitStartNorm));
    }
  }



  if (!gesamtarbeitszeit) {
    gesamtarbeitszeit = 0
  }

  return { gesamtarbeitszeit, ausgleichszeit, fruehesteStartzeit };
}

const calculate = () => {
  const arbeitsFrei = document.getElementById("arbeitFrei").checked;

  const arbeitszeitStart = arbeitsFrei === false ? document.getElementById("arbeitBeginn").value : "00:00";
  const arbeitszeitEnde = arbeitsFrei === false ? document.getElementById("arbeitEnde").value : "00:00";
  const pausenDauer = arbeitsFrei === false ? timeToFloat(document.getElementById("arbeitPause").value) : 0;
  const rufbereitschaften = collectOnCallData();
  const istFreierTag = arbeitsFrei

  if (!isTimeBefore(arbeitszeitStart, arbeitszeitEnde) && !istFreierTag) {
    document.getElementById("ergebnisse").innerHTML = `<p><span style="background-color: #8fbc8f; color: #000; font-weight: bold;"
>Bitte überprüfe deine Eingaben!</span></p>
    <p>Ein nicht plausiebles Ergebniss kam zustande (Arbeitsbeginn ist nach dem Arbeitsende)</p>`
    return;
  }

  //console.log(arbeitszeitStart, arbeitszeitEnde, pausenDauer, rufbereitschaften, istFreierTag)

  const { ausgleichszeit, gesamtarbeitszeit, fruehesteStartzeit } = berechneArbeitszeiten(arbeitszeitStart, arbeitszeitEnde, pausenDauer, rufbereitschaften, istFreierTag);
  if (gesamtarbeitszeit > 24) {
    document.getElementById("ergebnisse").innerHTML = `<p><span style="background-color: #8fbc8f; color: #000; font-weight: bold;"
>Bitte überprüfe deine Eingaben!</span></p>
    <p>Ein nicht plausiebles Ergebniss kam zustande (Arbeitszeit >24h)</p>`
    return;
  }
  document.getElementById("ergebnisse").innerHTML = `
  <p>Ausgleichszeit: <strong>${formatTimeFromFloat(ausgleichszeit)}</strong></p>
  <p>Gesamte Arbeitszeit: <strong>${formatTimeFromFloat(gesamtarbeitszeit)}</strong></p>
  <p>Arbeitsbeginn ab: <span style="background-color: #8fbc8f; color: #000; font-weight: bold;"
>${convertToProperTime(fruehesteStartzeit)}</span>
    <span class="hover-text">(?)<span class="tooltip-text top">Diese Zeit wird in derselben Zeitzone berechnet, in der der Rufbereitschaftsblock begonnen hat (das 24-Stunden-Intervall). Daher werden keine Zeitzonen unterstützt, auch keine Sommer-/Winterzeitumstellung, die in genau dieser Nacht passiert.</span></span>
  </p>
`;

}

