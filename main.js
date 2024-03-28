// Konstanten
const minUberstunden = 10 // Die maximale Zeit in Stunden befor es Überstunen werden
const arbeitStartNorm = "06:30" // Geplanter Arbeitsanfang

const timeToFloat = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
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

function berechneArbeitszeiten(arbeitszeitStart, arbeitszeitEnde, pausenDauer, rufbereitschaften, istFeiertag = false) {
  let gesamtarbeitszeitOhneRuf = zeitInStunden(arbeitszeitStart, arbeitszeitEnde) - pausenDauer;
  let gesamteRufbereitschaftszeit = rufbereitschaften.reduce((summe, { start, ende }) => summe + zeitInStunden(start, ende), 0);
  let gesamtarbeitszeit = gesamtarbeitszeitOhneRuf + gesamteRufbereitschaftszeit;
  let ausgleichszeit = gesamtarbeitszeit > minUberstunden ? gesamtarbeitszeit - minUberstunden : 0;
  
  let letzteBereitschaftEndePlus6h = null;
  for(let i = 0; i < rufbereitschaften.length; i++) {
    const start = rufbereitschaften[i].start
    const ende =  rufbereitschaften[i].ende
    const einsatzDauer = zeitInStunden(start, ende);
    if (istFeiertag && einsatzDauer >= 4 && ((start <= "00:00" && ende >= "04:00") || (start <= "24:00" && ende >= "04:00"))) {
      ausgleichszeit = Math.max(ausgleichszeit, 4);
    }
    
		// Prüfen ob wir mehr als einen Rufbereitschaftseinsatz haben und es der letzte ist
    if(rufbereitschaften.length > 1 && i === rufbereitschaften.length - 1) {
    	if(!isTimeBefore(ende, arbeitStartNorm)) console.log("Du arbeitest schon")
      if(zeitInStunden(ende, arbeitStartNorm) <= 6) letzteBereitschaftEndePlus6h = ende
    }
  }

  // Früheste Startzeit für den nächsten Tag basierend auf Ausgleichszeit
  let fruehesteStartzeit = arbeitStartNorm;
  if (ausgleichszeit > 0) {
    const [stunden, minuten] = fruehesteStartzeit.split(':').map(Number);
    const neueStartStunde = stunden + Math.floor(ausgleichszeit);
    const neueStartMinute = (minuten + (ausgleichszeit % 1) * 60) % 60;
    const stundenAddition = Math.floor((minuten + (ausgleichszeit % 1) * 60) / 60);
    fruehesteStartzeit = `${neueStartStunde + stundenAddition}:${neueStartMinute.toString().padStart(2, '0')}`;
  }

  if (letzteBereitschaftEndePlus6h) {
  	const ruf6hanpassung = addTimes(letzteBereitschaftEndePlus6h, "06:00")
    if(isTimeBefore(fruehesteStartzeit, ruf6hanpassung)) {
    	fruehesteStartzeit = ruf6hanpassung;
    	ausgleichszeit = timeToFloat(subtractTimes(fruehesteStartzeit, arbeitStartNorm))
    }
  }

  return { gesamtarbeitszeit, ausgleichszeit, fruehesteStartzeit };
}

const arbeitszeitStart = "06:30";
const arbeitszeitEnde = "15:00";
const pausenDauer = 0.5;
const rufbereitschaften = [
  { start: "21:00", ende: "23:00" },
  { start: "23:30", ende: "05:00" }
];
const istFeiertag = false;

const ergebnis = berechneArbeitszeiten(arbeitszeitStart, arbeitszeitEnde, pausenDauer, rufbereitschaften, istFeiertag);

console.log(ergebnis);
