let soundsList = document.querySelectorAll(".sounds");
window.addEventListener('keypress', playKeyboard);
//odtwarzanie dźwieków po kliknięciu klawiszy
let playButtons = document.querySelectorAll(".soundBox");

//event listenery dla wszystkich przycisków w kanałach nagrywania
let trackBoxes = document.querySelectorAll(".trackBox");
trackBoxes.forEach((item) => {
    trackList.push(new Recorder(item));
    item.querySelector(".track").recElement = trackList[trackList.length - 1];
    item.querySelector(".trackRecord").addEventListener("click", recordTrack);
    item.querySelector(".trackReset").addEventListener("click", () => {
        item.querySelector(".track").recElement.reset();
    });
});
//Event listenery dla globalnych funkcji dla buttonów
let assignWindow = document.querySelector("#dimness");

//nagrywanie dźwieków
function recordTrack(e) {
    if (e.target.classList.contains("active")) {
        e.target.classList.remove("active")
    } else if (!e.target.parentElement.querySelector(".trackPlay").classList.contains("active")) {
        e.target.classList.add("active");
        let CrntTrack = trackList[e.target.parentElement.dataset.trackid];
        CrntTrack.recordTrack();
    }
}

Sounds.loadSounds();
//konstruktor obiektu do obsługi nagrywania i odtwarzania dźwięków
function Recorder(trackBox) {
    this.duration = 0;
    this.soundLog = [];
    this.trackBox = trackBox;
    this.pointer = this.trackBox.querySelector(".track").querySelector(".pointer");
    this.trackScale = 10;
    this.i = 0;
    this.crntTimeout = "not Playing";
    this.isRecording = () => {
        return this.trackBox.querySelector(".trackRecord").classList.contains("active")
    };
}

//funkcja tworząca nowe obiekty Soundlog
Recorder.prototype.logNewKey = function (charCode) {
    let tmp = document.createElement("div");
    tmp.classList.add("" + this.soundLog.length);
    tmp.classList.add("soundPiece");
    this.soundLog.push({
        time: 0,
        sound: Sounds.list[charCode],
        soundPiece: this.trackBox.querySelector(".track").appendChild(tmp)
    });
    let sLL = this.soundLog.length - 1;
    let crntSoundpiece = this.soundLog[sLL].soundPiece;

    crntSoundpiece.style.left = parseFloat(this.pointer.style.left) + "px";
    crntSoundpiece.style.width = "0px";
    if (this.soundLog[sLL].sound)
        setTimeout(() => {
            crntSoundpiece.style.width = (this.soundLog[sLL].sound.duration * this.trackScale + 10) + "px";
        }, 100);

    crntSoundpiece.logElem = this.soundLog[sLL];

    crntSoundpiece.addEventListener("mousedown", () => {
        document.addEventListener("mousemove", msMv);
        document.addEventListener("mouseup", msLv);
        let spEl = this.soundLog[sLL].soundPiece;

        function msMv(e) {
            let tmp = parseFloat(spEl.style.left);
            spEl.style.left = (tmp + e.movementX) + "px";
        }

        function msLv(e) {
            let trackElem = spEl.parentElement.recElement
            document.removeEventListener("mousemove", msMv);
            document.removeEventListener("mouseup", msLv);
            trackElem.reTiming();
        }
    });
    this.reTiming();
}

//funkcja ustawiająca soundlog.time na podstawie pozycji suwaka
Recorder.prototype.reTiming = function () {
    let duration = parseFloat(this.soundLog[0].soundPiece.style.left) * this.trackScale;
    this.soundLog[0].time = duration;
    for (let i = 1; i < this.soundLog.length; i++) {
        this.soundLog[i].time = (parseFloat(this.soundLog[i].soundPiece.style.left) * this.trackScale) - duration;
        duration += this.soundLog[i].time;
    }
    tmp = 0;
    this.soundLog.forEach((item) => {
        tmp += item.time;
    });
    this.duration = tmp;
}


//funkcja która przesuwa suwak dla nagrywania
Recorder.prototype.recordingPointer = function (tPrev) {
    let dt = Date.now();
    let tmp = parseFloat(this.pointer.style.left);

    this.pointer.style.left = (tmp + ((dt - tPrev) / this.trackScale)) + "px";
    this.scrollByPointer();
    let isRecording = this.trackBox.querySelector(".trackRecord").classList.contains("active");

    if (isRecording) {
        requestAnimationFrame(() => {
            this.recordingPointer(dt)
        });
    } else {
        this.pointer.style.left = "0px";
    }
}

//wyświetlanie suwaka w ruchu
Recorder.prototype.scrollByPointer = function () {
    let pPos = parseFloat(this.pointer.style.left);
    let tWidth = parseFloat(this.trackBox.offsetWidth) - 200;
    if (pPos > tWidth)
        this.trackBox.querySelector(".track").scrollLeft = pPos - tWidth;
    else
        this.trackBox.querySelector(".track").scrollLeft = 0;
}