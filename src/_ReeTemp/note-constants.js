const NoteScoringType = {
    Ignore: -1,
    NoScore: 0,
    Normal: 1,
    SliderHead: 2,
    SliderTail: 3,
    BurstSliderHead: 4,
    BurstSliderElement: 5
}

const NoteCutDirection = {
    Up: 0,
    Down: 1,
    Left: 2,
    Right: 3,
    UpLeft: 4,
    UpRight: 5,
    DownLeft: 6,
    DownRight: 7,
    Any: 8,
    None: 9
}

const NoteLineLayer = {
    Base: 0,
    Upper: 1,
    Top: 2
}

const ColorType = {
    None: -1,
    ColorA: 0,
    ColorB: 1
}

module.exports.NoteScoringType = NoteScoringType;
module.exports.NoteCutDirection = NoteCutDirection;
module.exports.NoteLineLayer = NoteLineLayer;
module.exports.ColorType = ColorType;
