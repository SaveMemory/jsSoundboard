let soundsList = document.querySelectorAll(".sounds");
window.addEventListener('keypress', playKeyboard);

//tablica na obiekty Recorder
let trackList = [];

//obiekt zawierający wszystkie dźwięki
let Sounds = {
    list: {},
    loadSounds: function () {
        this.list = {};
        for (let i = 0; i < soundsList.length; i++) {
            Sounds.list[soundsList[i].dataset.code] = soundsList[i];
        }
    }
};

//odtwarzanie dźwieków po kliknięciu klawiszy
let playButtons = document.querySelectorAll(".soundBox");

//event listenery dla wszystkich przycisków w kanałach nagrywania
let trackBoxes = document.querySelectorAll(".trackBox");
trackBoxes.forEach((item) => {
    trackList.push(new Recorder(item));
    item.querySelector(".track").recElement = trackList[trackList.length - 1];
    item.querySelector(".trackPlay").addEventListener("click", playTrack);
    item.querySelector(".trackRecord").addEventListener("click", recordTrack);
    item.querySelector(".trackReset").addEventListener("click", () => {
        item.querySelector(".track").recElement.reset();
    });
});

//Event listenery dla globalnych funkcji dla buttonów
let assignWindow = document.querySelector("#dimness");

//odtwarzanie dźwieków
function playTrack(e) {
    let CrntTrack = trackList[e.target.parentElement.dataset.trackid];

    if (!e.target.parentElement.querySelector(".trackRecord").classList.contains("active")) {
        CrntTrack.play();
    }
}

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

//metoda do odtwarzania dźwięków
Recorder.prototype.play = function () {
    if (!this.isRecording()) {
        if (this.soundLog.length > 0) {
            if (this.crntTimeout == "not Playing") {
                let pointerTime = parseFloat(this.pointer.style.left) * this.trackScale;
                let sPSumTime = this.soundLog[this.i].time;
                let startingTime = 0;
                while (pointerTime > sPSumTime) {
                    this.i++;
                    if (this.i < this.soundLog.length)
                        sPSumTime += this.soundLog[this.i].time;
                    else {
                        this.i = 0;
                        this.pointer.style.left = "0px";
                        pointerTime = 0;
                        sPSumTime = this.soundLog[this.i].time;
                    }
                }
                startingTime = sPSumTime - pointerTime;

                this.crntTimeout =
                    setTimeout(() => {
                        this.play()
                    }, startingTime);

                this.trackBox.querySelector(".trackPlay").classList.add("active");
                this.movePointer(Date.now() - pointerTime);
            } else {
                let playingSoundpiece = this.soundLog[this.i].soundPiece;
                playingSoundpiece.classList.add("playing");
                setTimeout(() => {
                    playingSoundpiece.classList.remove("playing");
                }, 400);
                this.soundLog[this.i].sound.currentTime = 0;
                this.soundLog[this.i].sound.play();
                this.i++;
                if (this.soundLog[this.i])
                    this.crntTimeout = setTimeout(() => {
                        this.play()
                    }, this.soundLog[this.i].time);
                else {
                    this.i = 0;
                    this.crntTimeout = "not Playing";
                    this.trackBox.querySelector(".trackPlay").classList.remove("active");
                    this.pointer.style.left = "0px";
                }
            }
        }
    }
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

//funkcja która przesuwa suwak dla odtwarzania
Recorder.prototype.movePointer = function (tStart) {
    let dt = Date.now();
    this.pointer.style.left = ((dt - tStart) / this.trackScale) + "px";
    this.scrollByPointer();
    let isPlaying = this.trackBox.querySelector(".trackPlay").classList.contains("active");
    if (dt < this.duration + tStart && isPlaying) {
        requestAnimationFrame(() => {
            this.movePointer(tStart)
        });
    } else {
        this.pointer.style.left = "0px";
    }
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

//resetowanie nagrania
Recorder.prototype.reset = function () {
    this.duration = 0;

    this.soundLog.forEach(function (element) {
        element.soundPiece.remove();
    });

    this.soundLog = [];
    this.trackScale = 10;
    this.i = 0;

    clearTimeout(this.crntTimeout);

    this.crntTimeout = "not Playing";
    this.trackBox.querySelector(".trackPlay").classList.remove("active");
}

Recorder.prototype.recordTrack = function () {
    this.recordingPointer(Date.now());
}

//Function for scrolling track for pointer to be visible
Recorder.prototype.scrollByPointer = function () {
    let pPos = parseFloat(this.pointer.style.left);
    let tWidth = parseFloat(this.trackBox.offsetWidth) - 200;
    if (pPos > tWidth)
        this.trackBox.querySelector(".track").scrollLeft = pPos - tWidth;
    else
        this.trackBox.querySelector(".track").scrollLeft = 0;
}

//odtwarznie dźwięków i nagrywanie ich
function playKeyboard(e) {
    if (Sounds.list.hasOwnProperty(e.charCode)) {
        trackList.forEach((track) => {
            if (track.isRecording()) track.logNewKey(e.charCode);
        });
        Sounds.list[e.charCode].currentTime = 0;
        Sounds.list[e.charCode].play();
    }
}